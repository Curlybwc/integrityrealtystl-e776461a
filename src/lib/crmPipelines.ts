// 07.09 Slim CRM Landing 3 — Pipelines + Admin Pool (spec §3).
// Pipeline place is a fact on the contact's record with provenance.
// New leads land in the Admin Pool: visibility is permission-shaped BY
// CONSTRUCTION — every list and every count a viewer gets comes
// through visibleContacts(), and for an agent that function returns
// only actively-assigned contacts. An unassigned lead does not exist
// for an agent's login, not even as a count. Michele is an agent, not
// an admin (Jen's ruling, 2026-11-07); assignment is a Jen/Samantha
// (admin) act and leaves a trail.

import { ingestArrival, type CrmContact, type CrmStore, type SourceArrival } from "./crmContacts";

export interface PipelineStage {
  key: string;
  label: string;
  next_step_task?: string;
}

export interface PipelineDef {
  key: "investor_buyers" | "sellers";
  name: string;
  stages: PipelineStage[];
}

export const PIPELINES: PipelineDef[] = [
  {
    key: "investor_buyers",
    name: "Investor buyers",
    stages: [
      { key: "new", label: "New" },
      { key: "talking", label: "Talking" },
      { key: "wants_saved", label: "Wants saved" },
      { key: "getting_deals", label: "Getting deals", next_step_task: "No reply in 7 days → follow-up task" },
      { key: "under_contract", label: "Under contract" },
      { key: "closed", label: "Closed" },
      { key: "repeat_buyer", label: "Repeat buyer" },
    ],
  },
  {
    key: "sellers",
    name: "Sellers",
    stages: [
      { key: "new", label: "New" },
      { key: "talking", label: "Talking" },
      { key: "valuation_sent", label: "Valuation sent", next_step_task: "No reply in 7 days → follow-up task" },
      { key: "listing_prep", label: "Listing prep" },
      { key: "live", label: "Live" },
      { key: "under_contract", label: "Under contract" },
      { key: "closed", label: "Closed" },
    ],
  },
];

export interface PipelinePlace {
  contactId: string;
  pipelineKey: string;
  stage: string;
  source: string;
  enteredAt: string;
}

export interface Assignment {
  contactId: string;
  assigneeId: string;
  assignedBy: string;
  source: string;
  assignedAt: string;
  unassignedAt: string | null;
}

export interface StageTask {
  contactId: string;
  label: string;
  done: boolean;
}

export interface PipeStore {
  crm: CrmStore;
  places: Map<string, PipelinePlace>; // key: `${contactId}:${pipelineKey}`
  assignments: Assignment[];
  leadIds: Set<string>;
  tasks: StageTask[];
}

export function createPipeStore(crm: CrmStore): PipeStore {
  return { crm, places: new Map(), assignments: [], leadIds: new Set(), tasks: [] };
}

function pipelineDef(key: string): PipelineDef {
  const def = PIPELINES.find((p) => p.key === key);
  if (!def) throw new Error(`unknown_pipeline: ${key}`);
  return def;
}

// ---------- pipelines: place + move are events on the record

export function placeOnPipeline(
  store: PipeStore,
  contactId: string,
  pipelineKey: string,
  source: string,
  at: string,
): PipelinePlace {
  const def = pipelineDef(pipelineKey);
  const place: PipelinePlace = {
    contactId,
    pipelineKey,
    stage: def.stages[0].key,
    source,
    enteredAt: at,
  };
  store.places.set(`${contactId}:${pipelineKey}`, place);
  store.crm.events.push({
    contactId,
    event: "pipeline_placed",
    detail: { pipeline: pipelineKey, stage: place.stage, source },
  });
  return place;
}

export function moveStage(
  store: PipeStore,
  contactId: string,
  pipelineKey: string,
  toStage: string,
): PipelinePlace {
  const def = pipelineDef(pipelineKey);
  const stage = def.stages.find((s) => s.key === toStage);
  if (!stage) throw new Error(`unknown_stage: ${toStage}`);
  const place = store.places.get(`${contactId}:${pipelineKey}`);
  if (!place) throw new Error("not_on_pipeline");
  const from = place.stage;
  place.stage = toStage;
  store.crm.events.push({
    contactId,
    event: "pipeline_moved",
    detail: { pipeline: pipelineKey, from, to: toStage },
  });
  // A stage can carry a default next-step task — nothing fancier (spec §3).
  if (stage.next_step_task) {
    store.tasks.push({ contactId, label: stage.next_step_task, done: false });
  }
  return place;
}

export function boardColumn(store: PipeStore, pipelineKey: string, stage: string): CrmContact[] {
  return [...store.places.values()]
    .filter((p) => p.pipelineKey === pipelineKey && p.stage === stage)
    .map((p) => store.crm.contacts.get(p.contactId))
    .filter((c): c is CrmContact => Boolean(c) && !c!.mergedIntoId);
}

// ---------- Admin Pool + assignment (Jen's ruling)

export type Viewer = { kind: "admin" } | { kind: "agent"; userId: string };

/** A new lead arrives → it sits in the Admin Pool (no assignment). */
export function receiveLead(store: PipeStore, arrival: SourceArrival, at: string): CrmContact {
  const { contact } = ingestArrival(store.crm, arrival);
  store.leadIds.add(contact.id);
  store.crm.events.push({
    contactId: contact.id,
    event: "lead_received",
    detail: { source: arrival.source.sourceKind, at },
  });
  return contact;
}

export function activeAssignment(store: PipeStore, contactId: string): Assignment | undefined {
  return store.assignments.find((a) => a.contactId === contactId && !a.unassignedAt);
}

export function adminPool(store: PipeStore): CrmContact[] {
  return [...store.leadIds]
    .filter((id) => !activeAssignment(store, id))
    .map((id) => store.crm.contacts.get(id))
    .filter((c): c is CrmContact => Boolean(c));
}

/**
 * THE visibility path — lists AND counts both derive from this.
 * Admin (Jen/Samantha): every active contact. Agent (Michele): only
 * contacts with an active assignment to her. Nothing else exists.
 */
export function visibleContacts(store: PipeStore, viewer: Viewer): CrmContact[] {
  const active = [...store.crm.contacts.values()].filter((c) => !c.mergedIntoId);
  if (viewer.kind === "admin") return active;
  return active.filter((c) => activeAssignment(store, c.id)?.assigneeId === viewer.userId);
}

export function visibleLeadCount(store: PipeStore, viewer: Viewer): number {
  return visibleContacts(store, viewer).filter((c) => store.leadIds.has(c.id)).length;
}

/** Assignment is an admin act (Jen or Samantha), logged on the record. */
export function assignLead(
  store: PipeStore,
  args: { contactId: string; assigneeId: string; assignedBy: string; actorKind: "admin" | "agent"; source: string; at: string },
): Assignment {
  if (args.actorKind !== "admin") throw new Error("assignment_requires_admin");
  const prior = activeAssignment(store, args.contactId);
  if (prior) prior.unassignedAt = args.at;
  const assignment: Assignment = {
    contactId: args.contactId,
    assigneeId: args.assigneeId,
    assignedBy: args.assignedBy,
    source: args.source,
    assignedAt: args.at,
    unassignedAt: null,
  };
  store.assignments.push(assignment);
  store.crm.events.push({
    contactId: args.contactId,
    event: "assigned",
    detail: { assignee: args.assigneeId, assignedBy: args.assignedBy, source: args.source },
  });
  return assignment;
}

export function unassignLead(
  store: PipeStore,
  args: { contactId: string; actorKind: "admin" | "agent"; at: string },
): void {
  if (args.actorKind !== "admin") throw new Error("assignment_requires_admin");
  const active = activeAssignment(store, args.contactId);
  if (!active) return;
  active.unassignedAt = args.at;
  store.crm.events.push({
    contactId: args.contactId,
    event: "unassigned",
    detail: {},
  });
}
