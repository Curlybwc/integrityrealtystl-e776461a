import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createStore, ingestArrival } from "../lib/crmContacts";
import {
  adminPool,
  assignLead,
  boardColumn,
  createPipeStore,
  moveStage,
  placeOnPipeline,
  receiveLead,
  unassignLead,
  visibleContacts,
  visibleLeadCount,
  type Viewer,
} from "../lib/crmPipelines";
import {
  callCompleteness,
  createCallStore,
  fakeCallTransport,
  fileTranscript,
  incompleteCalls,
  maySeeCallableNumber,
  prepareBrief,
  startCall,
  submitBooking,
  VOICE_POLICY,
} from "../lib/crmCalls";

// Landing 3 acceptance, executed:
//  1. a lead sits in the Admin Pool invisible to a Michele-shaped
//     login (records AND counts), then assignment makes it visible;
//  2. a booking without an agenda is refused by the path itself;
//  3. a test call through the fake transport produces a DATED
//     transcript on the contact's timeline;
//  4. an untranscribed call shows as INCOMPLETE.

const AT = "2026-11-09T16:00:00Z";
const MICHELE: Viewer = { kind: "agent", userId: "michele-user" };
const ADMIN: Viewer = { kind: "admin" };

function leadArrival(id: string, name: string) {
  return {
    id,
    displayName: name,
    emails: [`${id}@example.com`],
    source: { sourceKind: "website" as const, sourceAccount: "integrityrealtystl.com", sourceRef: id },
  };
}

describe("acceptance 1 — Admin Pool, permission-shaped", () => {
  it("unassigned lead is invisible to the agent — records and counts — until assigned", () => {
    const crm = createStore();
    const store = createPipeStore(crm);
    const lead = receiveLead(store, leadArrival("lead-1", "New Investor"), AT);
    receiveLead(store, leadArrival("lead-2", "Second Lead"), AT);
    // an existing client of Michele's, assigned long ago
    const own = receiveLead(store, leadArrival("lead-3", "Micheles Client"), AT);
    assignLead(store, { contactId: own.id, assigneeId: "michele-user", assignedBy: "jen-user", actorKind: "admin", source: "admin_pool", at: AT });

    // the negative, proven: no record, no count, no pool size
    expect(visibleContacts(store, MICHELE).map((c) => c.id)).toEqual(["lead-3"]);
    expect(visibleLeadCount(store, MICHELE)).toBe(1);
    expect(visibleContacts(store, ADMIN).map((c) => c.id).sort()).toEqual(["lead-1", "lead-2", "lead-3"]);
    expect(adminPool(store).map((c) => c.id).sort()).toEqual(["lead-1", "lead-2"]);

    // assignment is an admin act with a trail — an agent cannot do it
    expect(() =>
      assignLead(store, { contactId: lead.id, assigneeId: "michele-user", assignedBy: "michele-user", actorKind: "agent", source: "admin_pool", at: AT }),
    ).toThrow("assignment_requires_admin");

    assignLead(store, { contactId: lead.id, assigneeId: "michele-user", assignedBy: "jen-user", actorKind: "admin", source: "admin_pool", at: AT });
    expect(visibleContacts(store, MICHELE).map((c) => c.id).sort()).toEqual(["lead-1", "lead-3"]);
    expect(adminPool(store).map((c) => c.id)).toEqual(["lead-2"]);
    const trail = crm.events.filter((e) => e.contactId === "lead-1" && e.event === "assigned");
    expect(trail).toHaveLength(1);
    expect(trail[0].detail).toMatchObject({ assignee: "michele-user", assignedBy: "jen-user", source: "admin_pool" });

    // unassigning returns it to the pool and out of her world again
    unassignLead(store, { contactId: lead.id, actorKind: "admin", at: AT });
    expect(visibleContacts(store, MICHELE).map((c) => c.id)).toEqual(["lead-3"]);
    expect(adminPool(store).map((c) => c.id).sort()).toEqual(["lead-1", "lead-2"]);
  });
});

describe("pipelines — boards on the record", () => {
  it("place + move are facts with provenance and timeline events; stage tasks appear", () => {
    const crm = createStore();
    const store = createPipeStore(crm);
    const { contact } = ingestArrival(crm, {
      id: "inv-1", displayName: "Investor One", emails: ["inv1@example.com"],
      source: { sourceKind: "manual", sourceAccount: null, sourceRef: "inv-1" },
    });
    const place = placeOnPipeline(store, contact.id, "investor_buyers", "website_lead", AT);
    expect(place.stage).toBe("new");
    expect(place.source).toBe("website_lead");
    expect(boardColumn(store, "investor_buyers", "new").map((c) => c.id)).toEqual(["inv-1"]);

    moveStage(store, contact.id, "investor_buyers", "getting_deals");
    expect(boardColumn(store, "investor_buyers", "new")).toHaveLength(0);
    expect(boardColumn(store, "investor_buyers", "getting_deals").map((c) => c.id)).toEqual(["inv-1"]);
    expect(store.tasks).toEqual([{ contactId: "inv-1", label: "No reply in 7 days → follow-up task", done: false }]);
    expect(crm.events.filter((e) => e.event === "pipeline_moved")).toHaveLength(1);
    expect(() => moveStage(store, contact.id, "investor_buyers", "bogus")).toThrow("unknown_stage");
    // tenants get NO pipeline: only the two spec pipelines exist
    expect(() => placeOnPipeline(store, contact.id, "tenants", "manual", AT)).toThrow("unknown_pipeline");
  });
});

describe("acceptance 2 — the agenda gate refuses", () => {
  it("no agenda (or no questions) → refused by the path; nothing is created", () => {
    const crm = createStore();
    const store = createCallStore(crm);
    const { contact } = ingestArrival(crm, {
      id: "caller-1", displayName: "Caller One", emails: ["c1@example.com"],
      source: { sourceKind: "website", sourceAccount: "integrityrealtystl.com", sourceRef: "caller-1" },
    });
    const noAgenda = submitBooking(store, {
      id: "b1", contactId: contact.id, topic: "Selling my house", requestedAt: AT,
    });
    expect(noAgenda).toEqual({ status: "refused", reason: "agenda_required" });
    const blankAgenda = submitBooking(store, {
      id: "b2", contactId: contact.id, topic: "Selling", agenda: "   ", questions: "What is it worth?", requestedAt: AT,
    });
    expect(blankAgenda.status).toBe("refused");
    const noQuestions = submitBooking(store, {
      id: "b3", contactId: contact.id, topic: "Selling", agenda: "Talk through selling 42 Soutee", requestedAt: AT,
    });
    expect(noQuestions.status).toBe("refused");
    expect(store.bookings).toHaveLength(0); // the path created nothing

    const ok = submitBooking(store, {
      id: "b4", contactId: contact.id, topic: "Selling 42 Soutee",
      agenda: "Decide list price and timing for 42 Soutee",
      questions: "What is it worth as-is? What would repairs change?",
      requestedAt: AT,
    });
    expect(ok.status).toBe("confirmed");
    expect(store.bookings).toHaveLength(1);
  });
});

describe("acceptance 3+4 — calls, transcripts, completeness", () => {
  async function bookedCallStore() {
    const crm = createStore();
    const store = createCallStore(crm);
    const { contact } = ingestArrival(crm, {
      id: "caller-2", displayName: "Caller Two", emails: ["c2@example.com"],
      source: { sourceKind: "website", sourceAccount: "integrityrealtystl.com", sourceRef: "caller-2" },
    });
    const booked = submitBooking(store, {
      id: "bk-1", contactId: contact.id, topic: "Buying criteria",
      agenda: "Set buy criteria for St. Charles rentals",
      questions: "What cap rate should I target?",
      requestedAt: AT,
    });
    if (booked.status !== "confirmed") throw new Error("setup failed");
    return { crm, store, contact, booking: booked.booking };
  }

  it("calls ship dark; a fake-transport call files a DATED transcript on the timeline", async () => {
    const { crm, store, booking } = await bookedCallStore();
    const transport = fakeCallTransport();

    const blocked = await startCall(store, transport, { id: "call-0", bookingId: booking.id, at: AT });
    expect(blocked).toEqual({ status: "blocked", reason: "calls_disabled" });
    expect(transport.placed).toHaveLength(0);

    store.flags.calls = true; // harness only — Jen's act in the real world
    const brief = prepareBrief(store, booking, { groups: ["Investors — active buyers"] });
    expect(brief).toContain("Set buy criteria");
    expect(brief).toContain("What cap rate should I target?");
    expect(brief).toContain("Caller Two");

    const started = await startCall(store, transport, { id: "call-1", bookingId: booking.id, at: AT });
    expect(started.status).toBe("started");
    if (started.status !== "started") return;
    // before the transcript: the record itself says INCOMPLETE
    expect(callCompleteness(started.call)).toBe("incomplete");
    expect(incompleteCalls(store).map((c) => c.id)).toEqual(["call-1"]);

    fileTranscript(store, "call-1", {
      transcript: "Jen: Let's set your criteria. Caller: I want 8% cap in St. Charles…",
      at: "2026-11-09T16:32:00Z",
    });
    expect(callCompleteness(started.call)).toBe("complete");
    expect(started.call.transcriptDate).toBe("2026-11-09");
    expect(incompleteCalls(store)).toHaveLength(0);
    // the transcript is ON the contact's timeline, dated, as an event
    const filed = crm.events.filter((e) => e.contactId === "caller-2" && e.event === "transcript_filed");
    expect(filed).toHaveLength(1);
    expect(filed[0].detail).toMatchObject({ transcriptDate: "2026-11-09" });
    expect(booking.status).toBe("completed");
  });

  it("voice policy: public number text-only; callable number only for consulting clients", () => {
    expect(VOICE_POLICY.publicNumberTextOnly).toBe(true);
    expect(VOICE_POLICY.publicNumberRingsAnyone).toBe(false);
    const crm = createStore();
    const plain = ingestArrival(crm, {
      id: "p1", displayName: "Plain", emails: ["p1@example.com"],
      source: { sourceKind: "manual", sourceAccount: null, sourceRef: "p1" },
    }).contact;
    const consulting = ingestArrival(crm, {
      id: "p2", displayName: "Consulting", emails: ["p2@example.com"],
      source: { sourceKind: "manual", sourceAccount: null, sourceRef: "p2" },
      facts: [{ factKey: "consulting_client", factValue: "true", source: "contract" }],
    }).contact;
    expect(maySeeCallableNumber(plain)).toBe(false);
    expect(maySeeCallableNumber(consulting)).toBe(true);
  });

  it("the migration carries the shapes: visibility view, agenda CHECKs, incomplete view, dark flags", () => {
    const sql = readFileSync(
      path.resolve(__dirname, "../../supabase/migrations/20261109140000_0709_crm_pipelines_calls.sql"),
      "utf8",
    );
    expect(sql).toContain("CREATE VIEW public.crm_visible_contacts");
    expect(sql).toContain("a.assignee_id = auth.uid()");
    expect(sql).toContain("char_length(btrim(agenda)) > 0");
    expect(sql).toContain("CREATE VIEW public.crm_incomplete_calls");
    expect(sql).toContain("('calls_enabled', false)");
    expect(sql).toContain("('booking_page_live', false)");
    expect(sql).toContain("'transcript_filed'");
  });
});
