// 07.09 Slim CRM Landing 1 — Contacts + Groups.
// One record per person, consolidated from every source with provenance
// per arrival; tag groups + rule groups; Do Not Contact suppression
// enforced in the selection logic itself (mirrored at the data layer by
// the crm_sendable_contacts view — migration 20261109120000).
// Spec: slim-crm-spec.md §§1-2.
//
// The core logic is pure and store-shaped so it can be executed and
// proven without a database; the Supabase adapter at the bottom is a
// thin mapping onto the migration's tables.

export const SOURCE_KINDS = [
  "phone",
  "google",
  "gmail",
  "simpletexting",
  "website",
  "manual",
] as const;
export type SourceKind = (typeof SOURCE_KINDS)[number];

export interface ContactMethod {
  kind: "phone" | "email";
  valueRaw: string;
  valueNormalized: string;
  isPrimary: boolean;
  isTextable: boolean;
}

export interface ContactSource {
  sourceKind: SourceKind;
  sourceAccount: string | null;
  sourceRef: string | null;
}

export interface ContactFact {
  factKey: string;
  factValue: string;
  source: string;
}

export interface CrmContact {
  id: string;
  displayName: string;
  company: string | null;
  notes: string | null;
  doNotContact: boolean;
  mergedIntoId: string | null;
  methods: ContactMethod[];
  sources: ContactSource[];
  facts: ContactFact[];
}

export type GroupKind = "tag" | "rule" | "suppression";

export interface RuleClause {
  fact_key: string;
  op: "eq" | "neq" | "exists";
  value?: string;
}

export interface CrmGroup {
  id: string;
  name: string;
  kind: GroupKind;
  rule: RuleClause[] | null;
  memberIds: Set<string>;
}

export interface ContactEvent {
  contactId: string;
  event:
    | "created"
    | "source_added"
    | "merged"
    | "unmerged"
    | "group_joined"
    | "group_left"
    | "dnc_set"
    | "dnc_cleared"
    | "consent_recorded"
    | "consent_opt_out";
  detail: Record<string, unknown>;
}

export interface MergeAudit {
  winnerId: string;
  loserId: string;
  matchedOn: Record<string, string>;
  loserSnapshot: CrmContact;
  undone: boolean;
}

export interface CrmStore {
  contacts: Map<string, CrmContact>;
  groups: Map<string, CrmGroup>;
  events: ContactEvent[];
  merges: MergeAudit[];
}

// ---------- normalization & matching (spec §1: match on phone + email)

export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  const national = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  return national;
}

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function normalizeMethod(kind: "phone" | "email", raw: string): string {
  return kind === "phone" ? normalizePhone(raw) : normalizeEmail(raw);
}

/** Find the active contact an arrival belongs to, by phone or email. */
export function findMatch(
  store: CrmStore,
  methods: { kind: "phone" | "email"; valueNormalized: string }[],
): CrmContact | null {
  for (const contact of store.contacts.values()) {
    if (contact.mergedIntoId) continue;
    for (const existing of contact.methods) {
      for (const incoming of methods) {
        if (existing.kind === incoming.kind && existing.valueNormalized === incoming.valueNormalized) {
          return contact;
        }
      }
    }
  }
  return null;
}

// ---------- consolidation (spec §1)

export interface SourceArrival {
  id: string;
  displayName: string;
  company?: string | null;
  phones?: { value: string; isTextable?: boolean }[];
  emails?: string[];
  source: ContactSource;
  facts?: ContactFact[];
}

function arrivalMethods(arrival: SourceArrival): ContactMethod[] {
  const methods: ContactMethod[] = [];
  for (const phone of arrival.phones ?? []) {
    methods.push({
      kind: "phone",
      valueRaw: phone.value,
      valueNormalized: normalizePhone(phone.value),
      isPrimary: false,
      isTextable: phone.isTextable ?? false,
    });
  }
  for (const email of arrival.emails ?? []) {
    methods.push({
      kind: "email",
      valueRaw: email,
      valueNormalized: normalizeEmail(email),
      isPrimary: false,
      isTextable: false,
    });
  }
  return methods;
}

function addSourceOnce(contact: CrmContact, source: ContactSource): boolean {
  const dupe = contact.sources.some(
    (s) =>
      s.sourceKind === source.sourceKind &&
      s.sourceAccount === source.sourceAccount &&
      s.sourceRef === source.sourceRef,
  );
  if (!dupe) contact.sources.push(source);
  return !dupe;
}

function addMethodsOnce(contact: CrmContact, methods: ContactMethod[]): void {
  for (const method of methods) {
    const dupe = contact.methods.some(
      (m) => m.kind === method.kind && m.valueNormalized === method.valueNormalized,
    );
    if (!dupe) contact.methods.push(method);
  }
}

function addFactsOnce(contact: CrmContact, facts: ContactFact[]): void {
  for (const fact of facts) {
    const dupe = contact.facts.some(
      (f) => f.factKey === fact.factKey && f.factValue === fact.factValue,
    );
    if (!dupe) contact.facts.push(fact);
  }
}

/**
 * Ingest one source arrival. If it matches an existing active contact
 * (phone or email), the arrival folds into that contact — one record,
 * both provenances. Otherwise a new contact is created. Never produces
 * a duplicate pair.
 */
export function ingestArrival(
  store: CrmStore,
  arrival: SourceArrival,
): { contact: CrmContact; created: boolean } {
  const methods = arrivalMethods(arrival);
  const match = findMatch(store, methods);
  if (match) {
    if (addSourceOnce(match, arrival.source)) {
      store.events.push({ contactId: match.id, event: "source_added", detail: { ...arrival.source } });
    }
    addMethodsOnce(match, methods);
    addFactsOnce(match, arrival.facts ?? []);
    if (!match.company && arrival.company) match.company = arrival.company;
    return { contact: match, created: false };
  }
  const contact: CrmContact = {
    id: arrival.id,
    displayName: arrival.displayName,
    company: arrival.company ?? null,
    notes: null,
    doNotContact: false,
    mergedIntoId: null,
    methods,
    sources: [arrival.source],
    facts: [...(arrival.facts ?? [])],
  };
  store.contacts.set(contact.id, contact);
  store.events.push({ contactId: contact.id, event: "created", detail: { ...arrival.source } });
  return { contact, created: true };
}

// ---------- merge / unmerge (spec §1: never silent, never destructive)

export function mergeContacts(
  store: CrmStore,
  winnerId: string,
  loserId: string,
  matchedOn: Record<string, string>,
): MergeAudit {
  const winner = store.contacts.get(winnerId);
  const loser = store.contacts.get(loserId);
  if (!winner || !loser) throw new Error("merge: unknown contact");
  if (winner.mergedIntoId || loser.mergedIntoId) throw new Error("merge: already merged");
  if (winnerId === loserId) throw new Error("merge: same contact");

  const audit: MergeAudit = {
    winnerId,
    loserId,
    matchedOn,
    loserSnapshot: structuredClone(loser),
    undone: false,
  };
  // The loser's history folds into the winner; nothing is deleted.
  for (const source of loser.sources) addSourceOnce(winner, source);
  addMethodsOnce(winner, loser.methods);
  addFactsOnce(winner, loser.facts);
  winner.doNotContact = winner.doNotContact || loser.doNotContact;
  loser.mergedIntoId = winnerId;
  store.merges.push(audit);
  store.events.push({ contactId: winnerId, event: "merged", detail: { loserId, matchedOn } });
  store.events.push({ contactId: loserId, event: "merged", detail: { winnerId, matchedOn } });
  return audit;
}

export function unmerge(store: CrmStore, winnerId: string, loserId: string): void {
  const audit = [...store.merges]
    .reverse()
    .find((m) => m.winnerId === winnerId && m.loserId === loserId && !m.undone);
  const loser = store.contacts.get(loserId);
  if (!audit || !loser) throw new Error("unmerge: no live merge to undo");
  loser.mergedIntoId = null;
  audit.undone = true;
  store.events.push({ contactId: loserId, event: "unmerged", detail: { winnerId } });
}

// ---------- groups (spec §2)

export function matchesRule(contact: CrmContact, rule: RuleClause[]): boolean {
  return rule.every((clause) => {
    const values = contact.facts.filter((f) => f.factKey === clause.fact_key).map((f) => f.factValue);
    if (clause.op === "exists") return values.length > 0;
    if (clause.op === "eq") return values.includes(clause.value ?? "");
    return !values.includes(clause.value ?? ""); // neq
  });
}

/** Members of a group: stored membership for tag/suppression groups,
 *  computed from facts for rule groups. Merged-away records never appear. */
export function groupMembers(store: CrmStore, group: CrmGroup): CrmContact[] {
  const active = [...store.contacts.values()].filter((c) => !c.mergedIntoId);
  if (group.kind === "rule") {
    return active.filter((c) => matchesRule(c, group.rule ?? []));
  }
  return active.filter((c) => group.memberIds.has(c.id));
}

export function joinGroup(
  store: CrmStore,
  group: CrmGroup,
  contactId: string,
  reason?: string,
): void {
  if (group.kind === "rule") throw new Error("rule groups are computed; membership cannot be set by hand");
  group.memberIds.add(contactId);
  store.events.push({ contactId, event: "group_joined", detail: { group: group.name, reason } });
  if (group.kind === "suppression") setDoNotContact(store, contactId, true);
}

export function leaveGroup(store: CrmStore, group: CrmGroup, contactId: string): void {
  if (group.kind === "rule") throw new Error("rule groups are computed; membership cannot be set by hand");
  group.memberIds.delete(contactId);
  store.events.push({ contactId, event: "group_left", detail: { group: group.name } });
  if (group.kind === "suppression") {
    const stillSuppressed = [...store.groups.values()].some(
      (g) => g.kind === "suppression" && g.memberIds.has(contactId),
    );
    if (!stillSuppressed) setDoNotContact(store, contactId, false);
  }
}

export function setDoNotContact(store: CrmStore, contactId: string, value: boolean): void {
  const contact = store.contacts.get(contactId);
  if (!contact) throw new Error("dnc: unknown contact");
  if (contact.doNotContact === value) return;
  contact.doNotContact = value;
  store.events.push({ contactId, event: value ? "dnc_set" : "dnc_cleared", detail: {} });
}

/** Is this contact suppressed by ANY route — flag or suppression group? */
export function isSuppressed(store: CrmStore, contact: CrmContact): boolean {
  if (contact.doNotContact) return true;
  return [...store.groups.values()].some(
    (g) => g.kind === "suppression" && g.memberIds.has(contact.id),
  );
}

// ---------- sendable selection (the ONLY selection send paths may use)

/**
 * The sendable set: active contacts minus every suppressed contact, by
 * construction. Mirrors the crm_sendable_contacts SQL view. Every
 * selection path — everyone, a tag group, a rule group — funnels
 * through this filter, so a DNC contact cannot appear in any of them.
 */
export function selectSendable(store: CrmStore, group?: CrmGroup): CrmContact[] {
  const pool = group ? groupMembers(store, group) : [...store.contacts.values()].filter((c) => !c.mergedIntoId);
  return pool.filter((c) => !isSuppressed(store, c));
}

// ---------- store factory (used by tests and the door adapter)

export function createStore(): CrmStore {
  return { contacts: new Map(), groups: new Map(), events: [], merges: [] };
}

export function addGroup(store: CrmStore, group: Omit<CrmGroup, "memberIds">): CrmGroup {
  const full: CrmGroup = { ...group, memberIds: new Set() };
  store.groups.set(full.id, full);
  return full;
}
