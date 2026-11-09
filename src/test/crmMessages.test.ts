import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { addGroup, createStore, ingestArrival, setDoNotContact, type CrmContact } from "../lib/crmContacts";
import {
  attemptGroupSend,
  attemptSend,
  createMsgStore,
  fakeTransport,
  needsReplyQueue,
  recordConsent,
  recordInbound,
  type MessageTemplate,
  type MsgStore,
} from "../lib/crmMessages";
import { importSimpleTextingRows, type SimpleTextingRow } from "../lib/simpletextingImport";
import { resendTransport, telnyxRequest, telnyxTransport } from "../lib/crmProviders";

// Landing 2 acceptance — the TCPA consent gate's three executed proofs:
//  (a) a send to an opted-out number is refused AT SEND TIME;
//  (b) a marketing send without express written consent cannot be
//      constructed (no consent at all, and non-written basis, both block);
//  (c) a normal send's audit row reads back complete (number + basis
//      + class). Plus: ships dark, Landing-1 DNC absolute through the
//      new paths, and the SimpleTexting evidence split.

const DAY = new Date(2026, 10, 9, 10, 0); // 10:00 local — outside quiet hours
const NIGHT = new Date(2026, 10, 9, 20, 30); // 20:30 — inside quiet hours

const RENT_REMINDER: MessageTemplate = {
  key: "rent_reminder",
  channel: "sms",
  messageClass: "transactional",
  subject: null,
  body: "Hi {{first_name}}, rent of {{amount}} for {{property_address}} is due {{due_date}}.",
};
const DEAL_ALERT: MessageTemplate = {
  key: "investor_deal_alert",
  channel: "sms",
  messageClass: "marketing",
  subject: null,
  body: "New deal: {{property_address}} — asking {{price}}.",
};

function setup() {
  const crm = createStore();
  addGroup(crm, { id: "g-dnc", name: "Do Not Contact", kind: "suppression", rule: null });
  const store = createMsgStore(crm);
  return store;
}

function addContact(store: MsgStore, id: string, phone: string): CrmContact {
  const { contact } = ingestArrival(store.crm, {
    id,
    displayName: id,
    phones: [{ value: phone, isTextable: true }],
    source: { sourceKind: "manual", sourceAccount: null, sourceRef: id },
  });
  return contact;
}

function leaseConsent(store: MsgStore, contact: CrmContact, phoneNormalized: string) {
  recordConsent(store, {
    id: `consent-${contact.id}`,
    contactId: contact.id,
    destinationNormalized: phoneNormalized,
    channel: "sms",
    basis: "lease",
    source: "lease_signed",
    wording: "Tenant agreed in lease §12 to receive texts about the tenancy.",
    agreedAt: "2026-09-01T12:00:00Z",
  });
}

const CTX = { first_name: "Dana", amount: "$850", property_address: "137 Forestwood", due_date: "Nov 15" };

describe("ships dark", () => {
  it("with channel flags off, even a fully consented send is blocked and audited", async () => {
    const store = setup();
    const dana = addContact(store, "dana", "636-555-0142");
    leaseConsent(store, dana, "6365550142");
    const row = await attemptSend(store, fakeTransport(), {
      contact: dana, channel: "sms", destinationNormalized: "6365550142",
      template: RENT_REMINDER, context: CTX, now: DAY,
    });
    expect(row.status).toBe("blocked");
    expect(row.blockedReason).toBe("channel_disabled");
    expect(store.sends).toHaveLength(1); // the block itself is audited
  });
});

describe("proof (a) — opt-out refused at send time", () => {
  it("STOP recorded once blocks the next send, across the same path that sent before it", async () => {
    const store = setup();
    store.flags.sms = true; // harness only: the gate arms beyond the flag
    const dana = addContact(store, "dana", "636-555-0142");
    leaseConsent(store, dana, "6365550142");
    const transport = fakeTransport();

    const before = await attemptSend(store, transport, {
      contact: dana, channel: "sms", destinationNormalized: "6365550142",
      template: RENT_REMINDER, context: CTX, now: DAY,
    });
    expect(before.status).toBe("sent");

    recordInbound(store, { contact: dana, channel: "sms", destinationNormalized: "6365550142", body: "STOP", at: DAY });

    const after = await attemptSend(store, transport, {
      contact: dana, channel: "sms", destinationNormalized: "6365550142",
      template: RENT_REMINDER, context: CTX, now: DAY,
    });
    expect(after.status).toBe("blocked");
    expect(after.blockedReason).toBe("opted_out");
    expect(transport.carried).toHaveLength(1); // nothing more was ever carried
    // the refusal is itself in the audit log
    expect(store.sends.map((s) => s.status)).toEqual(["sent", "blocked"]);
  });
});

describe("proof (b) — marketing without express written consent cannot be constructed", () => {
  it("no consent record at all blocks any send", async () => {
    const store = setup();
    store.flags.sms = true;
    const sam = addContact(store, "sam", "314-555-0119");
    const row = await attemptSend(store, fakeTransport(), {
      contact: sam, channel: "sms", destinationNormalized: "3145550119",
      template: RENT_REMINDER, context: CTX, now: DAY,
    });
    expect(row.blockedReason).toBe("no_consent_record");
  });

  it("a lease-basis consent does not authorize a marketing send", async () => {
    const store = setup();
    store.flags.sms = true;
    const dana = addContact(store, "dana", "636-555-0142");
    leaseConsent(store, dana, "6365550142");
    const row = await attemptSend(store, fakeTransport(), {
      contact: dana, channel: "sms", destinationNormalized: "6365550142",
      template: DEAL_ALERT, context: { property_address: "42 Soutee", price: "$120,000" }, now: DAY,
    });
    expect(row.status).toBe("blocked");
    expect(row.blockedReason).toBe("marketing_requires_express_written");
  });
});

describe("proof (c) — a normal send's audit row reads back complete", () => {
  it("number + consent basis + message class are all on the row", async () => {
    const store = setup();
    store.flags.sms = true;
    const dana = addContact(store, "dana", "636-555-0142");
    leaseConsent(store, dana, "6365550142");
    const row = await attemptSend(store, fakeTransport(), {
      contact: dana, channel: "sms", destinationNormalized: "6365550142",
      template: RENT_REMINDER, context: CTX, now: DAY,
    });
    expect(row.status).toBe("sent");
    expect(row.destination).toBe("6365550142");
    expect(row.consentBasis).toBe("lease");
    expect(row.consentId).toBe("consent-dana");
    expect(row.messageClass).toBe("transactional");
    expect(row.provider).toBe("fake");
    expect(row.bodyRendered).toContain("137 Forestwood");
  });
});

describe("Landing-1 DNC stays absolute through the new send paths", () => {
  it("direct send to a DNC contact blocks; group send never includes them", async () => {
    const store = setup();
    store.flags.sms = true;
    const keep = addContact(store, "keep", "636-555-0101");
    const dnc = addContact(store, "dnc", "636-555-0102");
    leaseConsent(store, keep, "6365550101");
    leaseConsent(store, dnc, "6365550102");
    recordConsent(store, {
      id: "consent-dnc-ew", contactId: "dnc", destinationNormalized: "6365550102",
      channel: "sms", basis: "express_written", source: "website", wording: "Yes, text me deals.", agreedAt: "2026-10-01T00:00:00Z",
    });
    setDoNotContact(store.crm, "dnc", true);
    const group = addGroup(store.crm, { id: "g-deals", name: "Investors — deal alerts", kind: "tag", rule: null });
    group.memberIds.add("keep");
    group.memberIds.add("dnc");

    const direct = await attemptSend(store, fakeTransport(), {
      contact: dnc, channel: "sms", destinationNormalized: "6365550102",
      template: RENT_REMINDER, context: CTX, now: DAY,
    });
    expect(direct.blockedReason).toBe("do_not_contact");

    const rows = await attemptGroupSend(store, fakeTransport(), {
      group, channel: "sms", template: DEAL_ALERT,
      contextFor: () => ({ property_address: "42 Soutee", price: "$120,000" }),
      destinationFor: (c) => c.methods.find((m) => m.kind === "phone")!.valueNormalized,
      now: DAY, approvedBy: "jen", recipientPreviewShown: true,
    });
    // keep has lease basis only → marketing blocks per-person; the DNC
    // contact never even reaches the gate (excluded by selection)
    expect(rows.map((r) => r.contactId)).toEqual(["keep"]);
    expect(rows[0].blockedReason).toBe("marketing_requires_express_written");
  });

  it("group sends require Jen's approval + shown recipient list", async () => {
    const store = setup();
    store.flags.sms = true;
    const ivy = addContact(store, "ivy", "636-555-0103");
    recordConsent(store, {
      id: "consent-ivy", contactId: "ivy", destinationNormalized: "6365550103",
      channel: "sms", basis: "express_written", source: "website", wording: "Yes, text me deals.", agreedAt: "2026-10-01T00:00:00Z",
    });
    const group = addGroup(store.crm, { id: "g-deals2", name: "Deals 2", kind: "tag", rule: null });
    group.memberIds.add("ivy");
    const rows = await attemptGroupSend(store, fakeTransport(), {
      group, channel: "sms", template: DEAL_ALERT,
      contextFor: () => ({ property_address: "42 Soutee", price: "$120,000" }),
      destinationFor: () => "6365550103",
      now: DAY, approvedBy: null, recipientPreviewShown: false,
    });
    expect(rows[0].blockedReason).toBe("group_send_unapproved");
  });

  it("routine sends respect quiet hours", async () => {
    const store = setup();
    store.flags.sms = true;
    const dana = addContact(store, "dana", "636-555-0142");
    leaseConsent(store, dana, "6365550142");
    const row = await attemptSend(store, fakeTransport(), {
      contact: dana, channel: "sms", destinationNormalized: "6365550142",
      template: RENT_REMINDER, context: CTX, now: NIGHT,
    });
    expect(row.blockedReason).toBe("quiet_hours");
  });
});

describe("SimpleTexting migration — evidence or not sendable", () => {
  const ROWS: SimpleTextingRow[] = [
    {
      phoneNumber: "636-555-0201", firstName: "Evid", lastName: "Enced", email: "evid@example.com",
      dateSubscribed: "2025-06-14T15:22:00Z", optInSource: "website_form",
      optInWording: "Yes, send me deal alerts by text. Msg & data rates may apply.",
    },
    {
      phoneNumber: "636-555-0202", firstName: "Partial", lastName: "Proof",
      dateSubscribed: "2025-07-01T00:00:00Z", // date but NO source/wording — incomplete evidence
    },
    { phoneNumber: "636-555-0203", firstName: "No", lastName: "Evidence" },
  ];

  it("rehearsal: evidenced subscribers carry consent; the rest land contact-only", async () => {
    const store = setup();
    store.flags.sms = true;
    const group = addGroup(store.crm, { id: "g-st", name: "Investors — deal alerts", kind: "tag", rule: null });
    const summary = importSimpleTextingRows(store, ROWS, group, (_row, i) => `st-${i}`);
    expect(summary.imported).toBe(3);
    expect(summary.withEvidence).toBe(1);
    expect(summary.withoutEvidence).toBe(2);

    const send = (id: string, phone: string) => {
      const contact = store.crm.contacts.get(id)!;
      return attemptSend(store, fakeTransport(), {
        contact, channel: "sms", destinationNormalized: phone,
        template: DEAL_ALERT, context: { property_address: "42 Soutee", price: "$120,000" }, now: DAY,
      });
    };
    // evidenced subscriber: marketing deal alert passes the whole gate
    expect((await send("st-0", "6365550201")).status).toBe("sent");
    // partial + missing evidence: imported, in the group, NOT sendable
    expect((await send("st-1", "6365550202")).blockedReason).toBe("no_consent_record");
    expect((await send("st-2", "6365550203")).blockedReason).toBe("no_consent_record");
  });
});

describe("inbound + Needs Reply", () => {
  it("a real question lands in the queue; a STOP never does", () => {
    const store = setup();
    const dana = addContact(store, "dana", "636-555-0142");
    leaseConsent(store, dana, "6365550142");
    recordInbound(store, { contact: dana, channel: "sms", destinationNormalized: "6365550142", body: "When is the plumber coming?", at: DAY });
    recordInbound(store, { contact: dana, channel: "sms", destinationNormalized: "6365550142", body: "STOP", at: DAY });
    const queue = needsReplyQueue(store);
    expect(queue).toHaveLength(1);
    expect(queue[0].body).toContain("plumber");
  });
});

describe("providers stay dark without keys", () => {
  it("telnyx adapter refuses without configuration; request shape is correct with it", async () => {
    await expect(telnyxTransport({}).send({ channel: "sms", destination: "6365550142", body: "x", subject: null }))
      .rejects.toThrow("provider_not_configured");
    await expect(resendTransport({}).send({ channel: "email", destination: "a@example.com", body: "x", subject: "s" }))
      .rejects.toThrow("provider_not_configured");
    const { url, init } = telnyxRequest({ apiKey: "k", fromNumber: "+16365550000" }, { destination: "6365550142", body: "hi" });
    expect(url).toContain("api.telnyx.com/v2/messages");
    expect(JSON.parse(init.body)).toMatchObject({ to: "+16365550142", text: "hi" });
  });

  it("the migration seeds both send flags OFF and carries the audit + queue shapes", () => {
    const sql = readFileSync(
      path.resolve(__dirname, "../../supabase/migrations/20261109130000_0709_crm_messages.sql"),
      "utf8",
    );
    expect(sql).toContain("('sms_sending', false)");
    expect(sql).toContain("('email_sending', false)");
    expect(sql).toContain("CREATE TABLE public.crm_message_sends");
    expect(sql).toContain("CREATE VIEW public.crm_needs_reply");
    expect(sql).toContain("'opted_out'");
    expect(sql).toContain("REVOKE ALL ON public.crm_message_sends FROM anon, authenticated, service_role");
  });
});
