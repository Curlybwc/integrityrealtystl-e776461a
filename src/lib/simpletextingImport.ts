// 07.09 Slim CRM Landing 2 — SimpleTexting subscriber migration.
// HARD GATE (Jen, 2026-11-07): the CRM sends NO texts to migrated
// subscribers until their opt-in evidence is imported and attached to
// their contact records. This importer enforces exactly that split:
// a row carrying complete evidence (date + source + exact wording)
// lands WITH a consent record (basis simpletexting_import); a row
// missing any part of the evidence lands as a contact ONLY — and the
// send-time gate then refuses it with no_consent_record, by
// construction, until consent is captured fresh.
// Spec: slim-crm-spec.md §6.

import { ingestArrival, type CrmGroup } from "./crmContacts";
import { recordConsent, type MsgStore } from "./crmMessages";

/** One row of a SimpleTexting subscriber export, evidence fields
 *  optional because the gate exists precisely for rows without them.
 *  Column names are confirmed against the real export before the real
 *  run (the export itself is a Jen-gated act); the evidence rule does
 *  not depend on the column names. */
export interface SimpleTextingRow {
  phoneNumber: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  dateSubscribed?: string;
  optInSource?: string;
  optInWording?: string;
}

export interface ImportSummary {
  imported: number;
  withEvidence: number;
  withoutEvidence: number;
  contactIdsWithEvidence: string[];
  contactIdsWithoutEvidence: string[];
}

export function hasCompleteEvidence(row: SimpleTextingRow): boolean {
  return Boolean(row.dateSubscribed && row.optInSource && row.optInWording);
}

export function importSimpleTextingRows(
  store: MsgStore,
  rows: SimpleTextingRow[],
  dealAlertsGroup: CrmGroup,
  idFor: (row: SimpleTextingRow, index: number) => string,
): ImportSummary {
  const summary: ImportSummary = {
    imported: 0,
    withEvidence: 0,
    withoutEvidence: 0,
    contactIdsWithEvidence: [],
    contactIdsWithoutEvidence: [],
  };
  rows.forEach((row, index) => {
    const name = [row.firstName, row.lastName].filter(Boolean).join(" ") || row.phoneNumber;
    const { contact } = ingestArrival(store.crm, {
      id: idFor(row, index),
      displayName: name,
      phones: [{ value: row.phoneNumber, isTextable: true }],
      emails: row.email ? [row.email] : [],
      source: { sourceKind: "simpletexting", sourceAccount: "simpletexting", sourceRef: row.phoneNumber },
    });
    dealAlertsGroup.memberIds.add(contact.id);
    store.crm.events.push({
      contactId: contact.id,
      event: "group_joined",
      detail: { group: dealAlertsGroup.name, via: "simpletexting_import" },
    });
    summary.imported += 1;
    if (hasCompleteEvidence(row)) {
      const phone = contact.methods.find((m) => m.kind === "phone");
      recordConsent(store, {
        id: `consent-st-${contact.id}`,
        contactId: contact.id,
        destinationNormalized: phone?.valueNormalized ?? row.phoneNumber.replace(/\D/g, ""),
        channel: "sms",
        basis: "simpletexting_import",
        source: row.optInSource!,
        wording: row.optInWording!,
        agreedAt: row.dateSubscribed!,
      });
      summary.withEvidence += 1;
      summary.contactIdsWithEvidence.push(contact.id);
    } else {
      summary.withoutEvidence += 1;
      summary.contactIdsWithoutEvidence.push(contact.id);
    }
  });
  return summary;
}
