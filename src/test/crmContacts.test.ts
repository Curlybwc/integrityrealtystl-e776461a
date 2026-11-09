import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  addGroup,
  createStore,
  groupMembers,
  ingestArrival,
  joinGroup,
  leaveGroup,
  mergeContacts,
  normalizeEmail,
  normalizePhone,
  selectSendable,
  setDoNotContact,
  unmerge,
  type CrmStore,
} from "../lib/crmContacts";

// Landing 1 acceptance, executed (gate commission 2026-11-09):
//  1. two source records for the same person consolidate into ONE
//     contact carrying BOTH provenances;
//  2. a rule group selects exactly its members;
//  3. a DNC-flagged contact cannot appear in ANY sendable selection.

function seedStore(): CrmStore {
  const store = createStore();
  addGroup(store, { id: "g-dnc", name: "Do Not Contact", kind: "suppression", rule: null });
  addGroup(store, {
    id: "g-tenants-current",
    name: "Tenants — current",
    kind: "rule",
    rule: [{ fact_key: "lease_status", op: "eq", value: "active" }],
  });
  addGroup(store, {
    id: "g-tenants-forestwood",
    name: "Tenants — 137 Forestwood",
    kind: "rule",
    rule: [
      { fact_key: "lease_status", op: "eq", value: "active" },
      { fact_key: "property", op: "eq", value: "137 Forestwood" },
    ],
  });
  addGroup(store, { id: "g-investors", name: "Investors — active buyers", kind: "tag", rule: null });
  return store;
}

describe("normalization", () => {
  it("normalizes phones across formats to the same match key", () => {
    expect(normalizePhone("(636) 555-0142")).toBe("6365550142");
    expect(normalizePhone("+1 636-555-0142")).toBe("6365550142");
    expect(normalizeEmail("  Dana@Example.COM ")).toBe("dana@example.com");
  });
});

describe("acceptance 1 — consolidation with provenance", () => {
  it("two sources for the same person become one contact with both provenances", () => {
    const store = seedStore();
    const first = ingestArrival(store, {
      id: "c1",
      displayName: "Dana Whitfield",
      phones: [{ value: "(636) 555-0142", isTextable: true }],
      source: { sourceKind: "phone", sourceAccount: "jen-samsung", sourceRef: "ph-991" },
    });
    expect(first.created).toBe(true);

    const second = ingestArrival(store, {
      id: "c2-should-not-survive",
      displayName: "Dana Whitfield",
      emails: ["dana@example.com"],
      phones: [{ value: "+1 636-555-0142" }],
      source: { sourceKind: "google", sourceAccount: "jen@integrityrealtystl.com", sourceRef: "g-4471" },
    });

    expect(second.created).toBe(false);
    expect(second.contact.id).toBe("c1");
    const active = [...store.contacts.values()].filter((c) => !c.mergedIntoId);
    expect(active).toHaveLength(1);
    expect(second.contact.sources.map((s) => s.sourceKind).sort()).toEqual(["google", "phone"]);
    // both arrivals' methods live on the one record
    expect(second.contact.methods.map((m) => m.valueNormalized).sort()).toEqual([
      "6365550142",
      "dana@example.com",
    ]);
    // re-ingesting the same arrival is idempotent — no third provenance row
    ingestArrival(store, {
      id: "c3",
      displayName: "Dana Whitfield",
      phones: [{ value: "6365550142" }],
      source: { sourceKind: "phone", sourceAccount: "jen-samsung", sourceRef: "ph-991" },
    });
    expect(second.contact.sources).toHaveLength(2);
    expect([...store.contacts.values()].filter((c) => !c.mergedIntoId)).toHaveLength(1);
  });

  it("matches on email alone when the phone is new", () => {
    const store = seedStore();
    ingestArrival(store, {
      id: "c1",
      displayName: "Sam Ortiz",
      emails: ["sam@example.com"],
      source: { sourceKind: "gmail", sourceAccount: "jen@integrityrealtystl.com", sourceRef: "m-1" },
    });
    const again = ingestArrival(store, {
      id: "c2",
      displayName: "Sam Ortiz",
      emails: ["SAM@example.com"],
      phones: [{ value: "314-555-0119" }],
      source: { sourceKind: "phone", sourceAccount: "jen-samsung", sourceRef: "ph-7" },
    });
    expect(again.created).toBe(false);
    expect(again.contact.id).toBe("c1");
  });

  it("merge keeps both trails in an audit and unmerge restores the loser", () => {
    const store = seedStore();
    ingestArrival(store, {
      id: "a",
      displayName: "Pat Lee",
      emails: ["pat@example.com"],
      source: { sourceKind: "google", sourceAccount: "acct", sourceRef: "g-1" },
    });
    ingestArrival(store, {
      id: "b",
      displayName: "Pat Lee",
      phones: [{ value: "636-555-0100" }],
      source: { sourceKind: "manual", sourceAccount: null, sourceRef: null },
    });
    const audit = mergeContacts(store, "a", "b", { name: "Pat Lee" });
    expect(audit.loserSnapshot.id).toBe("b");
    expect(store.contacts.get("b")?.mergedIntoId).toBe("a");
    expect(store.contacts.get("a")?.sources.map((s) => s.sourceKind).sort()).toEqual(["google", "manual"]);
    expect(selectSendable(store).map((c) => c.id)).toEqual(["a"]);

    unmerge(store, "a", "b");
    expect(store.contacts.get("b")?.mergedIntoId).toBeNull();
    expect(audit.undone).toBe(true);
    expect(selectSendable(store).map((c) => c.id).sort()).toEqual(["a", "b"]);
  });
});

describe("acceptance 2 — rule groups select exactly their members", () => {
  it("lease/property rules include matchers and exclude everyone else", () => {
    const store = seedStore();
    const mk = (id: string, name: string, facts: { factKey: string; factValue: string; source: string }[]) =>
      ingestArrival(store, {
        id,
        displayName: name,
        emails: [`${id}@example.com`],
        source: { sourceKind: "manual", sourceAccount: null, sourceRef: id },
        facts,
      });
    mk("t1", "Tenant One", [
      { factKey: "lease_status", factValue: "active", source: "lease" },
      { factKey: "property", factValue: "137 Forestwood", source: "lease" },
    ]);
    mk("t2", "Tenant Two", [
      { factKey: "lease_status", factValue: "active", source: "lease" },
      { factKey: "property", factValue: "42 Soutee", source: "lease" },
    ]);
    mk("t3", "Past Tenant", [
      { factKey: "lease_status", factValue: "ended", source: "lease" },
      { factKey: "property", factValue: "137 Forestwood", source: "lease" },
    ]);
    mk("i1", "Investor One", []);

    const current = store.groups.get("g-tenants-current")!;
    const forestwood = store.groups.get("g-tenants-forestwood")!;
    expect(groupMembers(store, current).map((c) => c.id).sort()).toEqual(["t1", "t2"]);
    expect(groupMembers(store, forestwood).map((c) => c.id)).toEqual(["t1"]);

    // a member who stops matching falls out by itself — no hand edit
    const t1 = store.contacts.get("t1")!;
    t1.facts = t1.facts.filter((f) => !(f.factKey === "lease_status"));
    t1.facts.push({ factKey: "lease_status", factValue: "ended", source: "lease" });
    expect(groupMembers(store, current).map((c) => c.id)).toEqual(["t2"]);
    expect(groupMembers(store, forestwood)).toHaveLength(0);
  });
});

describe("acceptance 3 — DNC cannot appear in any sendable selection", () => {
  function storeWithDnc() {
    const store = seedStore();
    ingestArrival(store, {
      id: "keep",
      displayName: "Keep Me",
      emails: ["keep@example.com"],
      source: { sourceKind: "manual", sourceAccount: null, sourceRef: "k" },
      facts: [{ factKey: "lease_status", factValue: "active", source: "lease" }],
    });
    ingestArrival(store, {
      id: "dnc-flag",
      displayName: "Flagged",
      emails: ["flag@example.com"],
      source: { sourceKind: "manual", sourceAccount: null, sourceRef: "f" },
      facts: [{ factKey: "lease_status", factValue: "active", source: "lease" }],
    });
    ingestArrival(store, {
      id: "dnc-group",
      displayName: "Grouped",
      emails: ["grp@example.com"],
      source: { sourceKind: "manual", sourceAccount: null, sourceRef: "g" },
      facts: [{ factKey: "lease_status", factValue: "active", source: "lease" }],
    });
    const investors = store.groups.get("g-investors")!;
    joinGroup(store, investors, "keep");
    joinGroup(store, investors, "dnc-flag");
    joinGroup(store, investors, "dnc-group");
    setDoNotContact(store, "dnc-flag", true);
    joinGroup(store, store.groups.get("g-dnc")!, "dnc-group");
    return store;
  }

  it("excludes the flagged contact from the all-contacts selection", () => {
    const store = storeWithDnc();
    expect(selectSendable(store).map((c) => c.id)).toEqual(["keep"]);
  });

  it("excludes DNC contacts from a tag-group selection", () => {
    const store = storeWithDnc();
    expect(selectSendable(store, store.groups.get("g-investors")!).map((c) => c.id)).toEqual(["keep"]);
  });

  it("excludes DNC contacts from a rule-group selection", () => {
    const store = storeWithDnc();
    expect(selectSendable(store, store.groups.get("g-tenants-current")!).map((c) => c.id)).toEqual(["keep"]);
  });

  it("suppression-group membership alone suppresses, and leaving restores sendability", () => {
    const store = storeWithDnc();
    // dnc-group was suppressed by group membership (join also set the flag)
    expect(store.contacts.get("dnc-group")?.doNotContact).toBe(true);
    leaveGroup(store, store.groups.get("g-dnc")!, "dnc-group");
    expect(store.contacts.get("dnc-group")?.doNotContact).toBe(false);
    expect(selectSendable(store).map((c) => c.id).sort()).toEqual(["dnc-group", "keep"]);
  });

  it("the SQL view enforces the same exclusion at the data layer", () => {
    const sql = readFileSync(
      path.resolve(__dirname, "../../supabase/migrations/20261109120000_0709_crm_contacts_groups.sql"),
      "utf8",
    );
    expect(sql).toContain("CREATE VIEW public.crm_sendable_contacts");
    expect(sql).toContain("c.do_not_contact = false");
    expect(sql).toContain("g.kind = 'suppression'");
    expect(sql).toContain("c.merged_into_id IS NULL");
    // consent shape Landing 2's SimpleTexting evidence import lands in
    expect(sql).toContain("CREATE TABLE public.crm_contact_consent");
    expect(sql).toContain("'simpletexting_import'");
    expect(sql).toContain("opt_out_at");
    // named-role revokes precede grants (standing ACL rule)
    expect(sql).toContain("REVOKE ALL ON public.crm_contacts FROM anon, authenticated, service_role");
  });
});
