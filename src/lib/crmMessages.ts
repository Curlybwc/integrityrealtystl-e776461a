// 07.09 Slim CRM Landing 2 — Messages + the TCPA consent gate.
// Spec: slim-crm-spec.md §§4+6; Jen's TCPA Consent Gate (2026-11-07)
// governs absolutely: no texting surface ships, flags on, or SENDS
// until (1) a stored consent record per number, (2) opt-out suppression
// AT SEND TIME, and (3) a per-send audit log are in place and verified
// by execution. This module is that enforcement: attemptSend is the
// ONLY outbound path, every attempt writes exactly one audit row, and
// the channel flags default OFF (the surface ships dark).

import {
  isSuppressed,
  selectSendable,
  type CrmContact,
  type CrmGroup,
  type CrmStore,
} from "./crmContacts";

export type Channel = "sms" | "email";
export type MessageClass = "transactional" | "marketing";
export type ConsentBasis =
  | "lease"
  | "application"
  | "express_written"
  | "representation"
  | "operational"
  | "simpletexting_import"
  | "website_signup";

/** Bases that ARE express written consent (marketing may rely on these). */
export const EXPRESS_WRITTEN_BASES: ConsentBasis[] = [
  "express_written",
  "simpletexting_import",
  "website_signup",
];

export interface ConsentRecord {
  id: string;
  contactId: string;
  destinationNormalized: string;
  channel: Channel;
  basis: ConsentBasis;
  source: string;
  wording: string;
  agreedAt: string;
  optOutAt: string | null;
}

export interface MessageTemplate {
  key: string;
  channel: Channel;
  messageClass: MessageClass;
  subject: string | null;
  body: string;
}

export type BlockedReason =
  | "channel_disabled"
  | "do_not_contact"
  | "no_consent_record"
  | "opted_out"
  | "marketing_requires_express_written"
  | "group_send_unapproved"
  | "quiet_hours"
  | "template_unresolved"
  | "not_sendable";

export interface SendAudit {
  contactId: string;
  channel: Channel;
  destination: string;
  templateKey: string | null;
  bodyRendered: string;
  messageClass: MessageClass;
  consentId: string | null;
  consentBasis: ConsentBasis | null;
  status: "sent" | "blocked" | "failed";
  blockedReason: BlockedReason | null;
  provider: string | null;
  providerMessageId: string | null;
  approvedBy: string | null;
  groupId: string | null;
}

export interface TimelineMessage {
  contactId: string;
  direction: "inbound" | "outbound";
  channel: Channel;
  body: string;
  needsReply: boolean;
  repliedAt: string | null;
  createdAt: string;
}

export interface MsgStore {
  crm: CrmStore;
  consents: ConsentRecord[];
  templates: Map<string, MessageTemplate>;
  sends: SendAudit[];
  messages: TimelineMessage[];
  flags: { sms: boolean; email: boolean };
}

export function createMsgStore(crm: CrmStore): MsgStore {
  // Ships dark: both channel flags OFF until the gate's proofs pass and
  // Jen approves the first real send (migration seeds them false too).
  return { crm, consents: [], templates: new Map(), sends: [], messages: [], flags: { sms: false, email: false } };
}

// ---------- consent & opt-out (gate parts 1 + 2)

export function recordConsent(
  store: MsgStore,
  record: Omit<ConsentRecord, "optOutAt">,
): ConsentRecord {
  const full: ConsentRecord = { ...record, optOutAt: null };
  store.consents.push(full);
  store.crm.events.push({
    contactId: record.contactId,
    event: "consent_recorded",
    detail: { channel: record.channel, basis: record.basis, source: record.source },
  });
  return full;
}

const OPT_OUT_WORDS = new Set(["stop", "stopall", "unsubscribe", "cancel", "end", "quit"]);

/** A STOP recorded once is enforced forever: it stamps every live
 *  consent record for that destination and the send path reads it at
 *  send time. Returns true when the text was an opt-out. */
export function recordOptOut(store: MsgStore, destinationNormalized: string, at: string): boolean {
  let hit = false;
  for (const consent of store.consents) {
    if (consent.destinationNormalized === destinationNormalized && !consent.optOutAt) {
      consent.optOutAt = at;
      hit = true;
      store.crm.events.push({
        contactId: consent.contactId,
        event: "consent_opt_out",
        detail: { channel: consent.channel, destination: destinationNormalized },
      });
    }
  }
  return hit;
}

export function isOptOutText(body: string): boolean {
  return OPT_OUT_WORDS.has(body.trim().toLowerCase());
}

function liveConsent(
  store: MsgStore,
  contactId: string,
  channel: Channel,
  destinationNormalized: string,
): ConsentRecord | undefined {
  return store.consents.find(
    (c) => c.contactId === contactId && c.channel === channel && c.destinationNormalized === destinationNormalized,
  );
}

// ---------- templates (never a blank box)

export function renderTemplate(template: MessageTemplate, context: Record<string, string>): string {
  const missing: string[] = [];
  const rendered = template.body.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    if (context[key] === undefined) {
      missing.push(key);
      return "";
    }
    return context[key];
  });
  if (missing.length > 0) {
    throw new Error(`template_unresolved: ${template.key} missing ${missing.join(", ")}`);
  }
  return rendered;
}

// ---------- the send path (the ONLY outbound path)

export interface MessageTransport {
  name: string;
  send(msg: { channel: Channel; destination: string; body: string; subject: string | null }): Promise<{ providerMessageId: string }>;
}

/** Test transport: records what it was asked to carry, sends nothing. */
export function fakeTransport(): MessageTransport & { carried: unknown[] } {
  const carried: unknown[] = [];
  return {
    name: "fake",
    carried,
    async send(msg) {
      carried.push(msg);
      return { providerMessageId: `fake-${carried.length}` };
    },
  };
}

export interface SendRequest {
  contact: CrmContact;
  channel: Channel;
  destinationNormalized: string;
  template: MessageTemplate;
  context: Record<string, string>;
  now: Date;
  approvedBy?: string | null;
  group?: CrmGroup | null;
  /** Group sends must show Jen the recipient list first (spec §2/§4). */
  recipientPreviewShown?: boolean;
  /** Emergency sends may cross quiet hours; routine sends may not. */
  emergency?: boolean;
}

function inQuietHours(now: Date): boolean {
  const hour = now.getHours();
  return hour >= 18 || hour < 7; // authority matrix: 6 PM – 7 AM
}

function audit(store: MsgStore, row: SendAudit): SendAudit {
  store.sends.push(row);
  return row;
}

/**
 * Attempt one send. Gate order (first failure blocks, and the block is
 * itself the audited proof):
 *   channel flag → DNC/suppression → quiet hours → template resolves →
 *   consent record exists → not opted out → marketing basis is express
 *   written → group-send approval. A pass hands the rendered body to
 *   the injected transport and audits the send with the basis relied on.
 */
export async function attemptSend(
  store: MsgStore,
  transport: MessageTransport,
  req: SendRequest,
): Promise<SendAudit> {
  const base: SendAudit = {
    contactId: req.contact.id,
    channel: req.channel,
    destination: req.destinationNormalized,
    templateKey: req.template.key,
    bodyRendered: "",
    messageClass: req.template.messageClass,
    consentId: null,
    consentBasis: null,
    status: "blocked",
    blockedReason: null,
    provider: null,
    providerMessageId: null,
    approvedBy: req.approvedBy ?? null,
    groupId: req.group?.id ?? null,
  };
  const block = (reason: BlockedReason, extra: Partial<SendAudit> = {}): SendAudit =>
    audit(store, { ...base, ...extra, status: "blocked", blockedReason: reason });

  if (req.channel === "sms" ? !store.flags.sms : !store.flags.email) {
    return block("channel_disabled");
  }
  if (req.contact.mergedIntoId) return block("not_sendable");
  if (isSuppressed(store.crm, req.contact)) return block("do_not_contact");
  if (!req.emergency && inQuietHours(req.now)) return block("quiet_hours");

  let body: string;
  try {
    body = renderTemplate(req.template, req.context);
  } catch {
    return block("template_unresolved");
  }
  base.bodyRendered = body;

  // TCPA gate, at send time, against the record as it stands NOW.
  const consent = liveConsent(store, req.contact.id, req.channel, req.destinationNormalized);
  if (!consent) return block("no_consent_record", { bodyRendered: body });
  if (consent.optOutAt) {
    return block("opted_out", { bodyRendered: body, consentId: consent.id, consentBasis: consent.basis });
  }
  if (req.template.messageClass === "marketing" && !EXPRESS_WRITTEN_BASES.includes(consent.basis)) {
    return block("marketing_requires_express_written", {
      bodyRendered: body,
      consentId: consent.id,
      consentBasis: consent.basis,
    });
  }
  if (req.group && (!req.approvedBy || !req.recipientPreviewShown)) {
    return block("group_send_unapproved", { bodyRendered: body, consentId: consent.id, consentBasis: consent.basis });
  }

  try {
    const sent = await transport.send({
      channel: req.channel,
      destination: req.destinationNormalized,
      body,
      subject: req.template.subject,
    });
    const row = audit(store, {
      ...base,
      status: "sent",
      consentId: consent.id,
      consentBasis: consent.basis,
      provider: transport.name,
      providerMessageId: sent.providerMessageId,
    });
    store.messages.push({
      contactId: req.contact.id,
      direction: "outbound",
      channel: req.channel,
      body,
      needsReply: false,
      repliedAt: null,
      createdAt: req.now.toISOString(),
    });
    return row;
  } catch {
    return audit(store, { ...base, status: "failed", consentId: consent.id, consentBasis: consent.basis });
  }
}

/**
 * Group send: recipients come from the Landing-1 sendable selection
 * (DNC already excluded by construction), then EVERY recipient still
 * passes the full send-time gate individually. Returns all audit rows.
 */
export async function attemptGroupSend(
  store: MsgStore,
  transport: MessageTransport,
  req: {
    group: CrmGroup;
    channel: Channel;
    template: MessageTemplate;
    contextFor: (contact: CrmContact) => Record<string, string>;
    destinationFor: (contact: CrmContact) => string;
    now: Date;
    approvedBy?: string | null;
    recipientPreviewShown?: boolean;
  },
): Promise<SendAudit[]> {
  const recipients = selectSendable(store.crm, req.group);
  const rows: SendAudit[] = [];
  for (const contact of recipients) {
    rows.push(
      await attemptSend(store, transport, {
        contact,
        channel: req.channel,
        destinationNormalized: req.destinationFor(contact),
        template: req.template,
        context: req.contextFor(contact),
        now: req.now,
        approvedBy: req.approvedBy ?? null,
        group: req.group,
        recipientPreviewShown: req.recipientPreviewShown ?? false,
      }),
    );
  }
  return rows;
}

// ---------- inbound + Needs Reply (spec §4)

export function recordInbound(
  store: MsgStore,
  msg: { contact: CrmContact; channel: Channel; destinationNormalized: string; body: string; at: Date },
): TimelineMessage {
  if (msg.channel === "sms" && isOptOutText(msg.body)) {
    recordOptOut(store, msg.destinationNormalized, msg.at.toISOString());
    const row: TimelineMessage = {
      contactId: msg.contact.id,
      direction: "inbound",
      channel: msg.channel,
      body: msg.body,
      needsReply: false,
      repliedAt: null,
      createdAt: msg.at.toISOString(),
    };
    store.messages.push(row);
    return row;
  }
  const row: TimelineMessage = {
    contactId: msg.contact.id,
    direction: "inbound",
    channel: msg.channel,
    body: msg.body,
    needsReply: true,
    repliedAt: null,
    createdAt: msg.at.toISOString(),
  };
  store.messages.push(row);
  return row;
}

export function needsReplyQueue(store: MsgStore): TimelineMessage[] {
  return store.messages.filter(
    (m) => m.direction === "inbound" && m.needsReply && !m.repliedAt,
  );
}
