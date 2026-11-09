// 07.09 Slim CRM Landing 3 — Scheduled calls (spec §5, Jen's voice
// policy). The public Integrity number is TEXT ONLY — it never rings
// anyone; a callable number is a paid-consulting perk; everyone else
// books through the website with an agenda. The booking path REFUSES
// to confirm without an agenda + questions. Calls happen at Jen's
// desktop in the CRM (agenda + brief + full record on one screen),
// outbound only, behind the CallTransport seam — fake in tests, and
// the calls flag ships OFF. Every call gets a DATED transcript on the
// contact's timeline; a call without one is an INCOMPLETE record and
// the surface says so.

import type { CrmContact, CrmStore } from "./crmContacts";

export const VOICE_POLICY = {
  publicNumberTextOnly: true,
  publicNumberRingsAnyone: false,
  voicemailV1: false,
  callableNumberAudience: "paid_consulting_clients_only",
} as const;

/** Only a contact carrying the consulting-client fact may ever be
 *  shown a callable number. Everyone else gets the booking path. */
export function maySeeCallableNumber(contact: CrmContact): boolean {
  return contact.facts.some((f) => f.factKey === "consulting_client" && f.factValue === "true");
}

export interface CallBooking {
  id: string;
  contactId: string;
  topic: string;
  agenda: string;
  questions: string;
  requestedAt: string;
  status: "confirmed" | "completed" | "cancelled";
  source: string;
  brief: string | null;
}

export interface CallRecord {
  id: string;
  bookingId: string | null;
  contactId: string;
  transport: string;
  transportRef: string | null;
  startedAt: string;
  endedAt: string | null;
  recordingRef: string | null;
  transcript: string | null;
  transcriptDate: string | null;
}

export interface CallStore {
  crm: CrmStore;
  bookings: CallBooking[];
  calls: CallRecord[];
  flags: { calls: boolean; bookingLive: boolean };
}

export function createCallStore(crm: CrmStore): CallStore {
  // Dark: no calls placed, no booking page live, until Jen's acts.
  return { crm, bookings: [], calls: [], flags: { calls: false, bookingLive: false } };
}

// ---------- the agenda gate (the booking path itself refuses)

export type BookingResult =
  | { status: "confirmed"; booking: CallBooking }
  | { status: "refused"; reason: "agenda_required" };

/**
 * Submit a call booking. Without a specific agenda AND written
 * questions the path refuses — no booking is created, nothing is
 * confirmed; the caller is told to supply them (spec §5). With them,
 * the booking confirms (the agenda check IS the confirmation gate).
 */
export function submitBooking(
  store: CallStore,
  args: {
    id: string;
    contactId: string;
    topic: string;
    agenda?: string | null;
    questions?: string | null;
    requestedAt: string;
    source?: string;
  },
): BookingResult {
  if (!args.agenda?.trim() || !args.questions?.trim()) {
    return { status: "refused", reason: "agenda_required" };
  }
  const booking: CallBooking = {
    id: args.id,
    contactId: args.contactId,
    topic: args.topic,
    agenda: args.agenda,
    questions: args.questions,
    requestedAt: args.requestedAt,
    status: "confirmed",
    source: args.source ?? "website",
    brief: null,
  };
  store.bookings.push(booking);
  store.crm.events.push({
    contactId: args.contactId,
    event: "call_booked",
    detail: { bookingId: booking.id, topic: booking.topic },
  });
  return { status: "confirmed", booking };
}

// ---------- the pre-call brief (one screen: agenda, brief, record)

export function prepareBrief(
  store: CallStore,
  booking: CallBooking,
  extras: { groups?: string[]; pipelinePlace?: string | null } = {},
): string {
  const contact = store.crm.contacts.get(booking.contactId);
  if (!contact) throw new Error("brief: unknown contact");
  const recent = store.crm.events
    .filter((e) => e.contactId === contact.id)
    .slice(-5)
    .map((e) => `- ${e.event}`)
    .join("\n");
  const brief = [
    `CALL BRIEF — ${contact.displayName}${contact.company ? ` (${contact.company})` : ""}`,
    `Topic: ${booking.topic}`,
    `Agenda (theirs): ${booking.agenda}`,
    `Questions (theirs): ${booking.questions}`,
    extras.groups?.length ? `Groups: ${extras.groups.join(", ")}` : "",
    extras.pipelinePlace ? `Pipeline: ${extras.pipelinePlace}` : "",
    `Recent timeline:\n${recent || "- (nothing yet)"}`,
  ]
    .filter(Boolean)
    .join("\n");
  booking.brief = brief;
  return brief;
}

// ---------- desktop calling, behind the seam

export interface CallTransport {
  name: string;
  placeCall(args: { toContactId: string; bookingId: string | null }): Promise<{ transportRef: string }>;
}

export function fakeCallTransport(): CallTransport & { placed: unknown[] } {
  const placed: unknown[] = [];
  return {
    name: "fake",
    placed,
    async placeCall(args) {
      placed.push(args);
      return { transportRef: `fake-call-${placed.length}` };
    },
  };
}

export type StartCallResult =
  | { status: "started"; call: CallRecord }
  | { status: "blocked"; reason: "calls_disabled" };

export async function startCall(
  store: CallStore,
  transport: CallTransport,
  args: { id: string; bookingId: string; at: string },
): Promise<StartCallResult> {
  if (!store.flags.calls) return { status: "blocked", reason: "calls_disabled" };
  const booking = store.bookings.find((b) => b.id === args.bookingId);
  if (!booking) throw new Error("call: unknown booking");
  const { transportRef } = await transport.placeCall({ toContactId: booking.contactId, bookingId: booking.id });
  const call: CallRecord = {
    id: args.id,
    bookingId: booking.id,
    contactId: booking.contactId,
    transport: transport.name,
    transportRef,
    startedAt: args.at,
    endedAt: null,
    recordingRef: null,
    transcript: null,
    transcriptDate: null,
  };
  store.calls.push(call);
  return { status: "started", call };
}

// ---------- the transcript is the record

/** File the dated transcript: it lands on the call AND on the
 *  contact's timeline (a dated event). The recording, if any, sits
 *  behind it as source evidence only. */
export function fileTranscript(
  store: CallStore,
  callId: string,
  args: { transcript: string; at: string },
): CallRecord {
  const call = store.calls.find((c) => c.id === callId);
  if (!call) throw new Error("transcript: unknown call");
  call.transcript = args.transcript;
  call.transcriptDate = args.at.slice(0, 10);
  call.endedAt = args.at;
  const booking = store.bookings.find((b) => b.id === call.bookingId);
  if (booking) booking.status = "completed";
  store.crm.events.push({
    contactId: call.contactId,
    event: "call_completed",
    detail: { callId, transport: call.transport },
  });
  store.crm.events.push({
    contactId: call.contactId,
    event: "transcript_filed",
    detail: { callId, transcriptDate: call.transcriptDate },
  });
  return call;
}

export function callCompleteness(call: CallRecord): "complete" | "incomplete" {
  return call.transcript ? "complete" : "incomplete";
}

/** The surface's honesty list: calls whose record is not finished. */
export function incompleteCalls(store: CallStore): CallRecord[] {
  return store.calls.filter((c) => callCompleteness(c) === "incomplete");
}
