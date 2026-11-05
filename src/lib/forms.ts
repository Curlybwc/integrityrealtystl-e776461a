// SLAR forms library (07.06 Packet INT-07.06-3).
// Jen's standard contract set for purchases and sales, stored in the app
// (direction 2026-11-04). Files live in public/forms/ — bytes identical
// to the brokerage's source PDFs, never re-encoded. This manifest is the
// inventory the later provider-template packets build from: names and
// SLAR numbers stay stable when storage moves behind the catalog.

export type FormCategory =
  | "Sale Contracts & Riders"
  | "Listing"
  | "Buyer Agency"
  | "Disclosures & Notices"
  | "Reference";

export interface LibraryForm {
  id: string;
  name: string;
  /** The form's SLAR number exactly as issued, or null when it has none. */
  slarNumber: string | null;
  category: FormCategory;
  /** Path under public/forms/. */
  file: string;
  blurb: string;
}

export const FORM_CATEGORIES: FormCategory[] = [
  "Sale Contracts & Riders",
  "Listing",
  "Buyer Agency",
  "Disclosures & Notices",
  "Reference",
];

export const FORM_LIBRARY: LibraryForm[] = [
  {
    id: "slar-2090",
    name: "Residential Sale Contract",
    slarNumber: "2090",
    category: "Sale Contracts & Riders",
    file: "slar-2090-residential-sale-contract.pdf",
    blurb: "The base sale contract for residential purchases and sales.",
  },
  {
    id: "special-sale-contract-blank",
    name: "Special Sale Contract (Blank)",
    slarNumber: null,
    category: "Sale Contracts & Riders",
    file: "special-sale-contract-blank.pdf",
    blurb: "Blank special sale contract, used with the inspection rider.",
  },
  {
    id: "slar-2184",
    name: "Special Sale Inspection Rider",
    slarNumber: "2184",
    category: "Sale Contracts & Riders",
    file: "slar-2184-special-sale-inspection-rider.pdf",
    blurb: "Inspection rider for the special sale contract.",
  },
  {
    id: "slar-2164",
    name: "Sale Contract Counteroffer",
    slarNumber: "2164",
    category: "Sale Contracts & Riders",
    file: "slar-2164-sale-contract-counteroffer.pdf",
    blurb: "Counteroffer to a sale contract.",
  },
  {
    id: "slar-2046",
    name: "Appraisal Rider",
    slarNumber: "2046",
    category: "Sale Contracts & Riders",
    file: "slar-2046-appraisal-rider.pdf",
    blurb: "Appraisal contingency rider to the sale contract.",
  },
  {
    id: "slar-2135-fha",
    name: "FHA Loan Provision Rider",
    slarNumber: "2135 FHA",
    category: "Sale Contracts & Riders",
    file: "slar-2135-fha-loan-provision-rider.pdf",
    blurb: "FHA financing provisions for the sale contract.",
  },
  {
    id: "slar-2135-va",
    name: "VA Loan Provision Rider",
    slarNumber: "2135 VA",
    category: "Sale Contracts & Riders",
    file: "slar-2135-va-loan-provision-rider.pdf",
    blurb: "VA financing provisions for the sale contract.",
  },
  {
    id: "slar-2109",
    name: "Broker Compensation Rider",
    slarNumber: "2109",
    category: "Sale Contracts & Riders",
    file: "slar-2109-broker-compensation-rider.pdf",
    blurb: "Broker compensation terms attached to the contract.",
  },
  {
    id: "slar-2140",
    name: "Title and Survey Work Order Form",
    slarNumber: "2140",
    category: "Sale Contracts & Riders",
    file: "slar-2140-title-and-survey-work-order.pdf",
    blurb: "Work order for title and survey.",
  },
  {
    id: "slar-2047-exclusive",
    name: "Listing Contract — Limited Agency (Exclusive Right to Sell)",
    slarNumber: "2047",
    category: "Listing",
    file: "slar-2047-listing-contract-exclusive-right-to-sell.pdf",
    blurb: "Listing contract with exclusive right to sell.",
  },
  {
    id: "slar-2047",
    name: "Listing Contract — Limited Agency",
    slarNumber: "2047",
    category: "Listing",
    file: "slar-2047-listing-contract-limited-agency.pdf",
    blurb: "Listing contract, limited agency.",
  },
  {
    id: "slar-2125",
    name: "Buyer's Exclusive Agency Contract",
    slarNumber: "2125",
    category: "Buyer Agency",
    file: "slar-2125-buyers-exclusive-agency-contract.pdf",
    blurb: "The buyer agency agreement (BAA) signed with buyer clients.",
  },
  {
    id: "slar-2125a",
    name: "Buyer's Agency Agreement Amendment",
    slarNumber: "2125a",
    category: "Buyer Agency",
    file: "slar-2125a-buyers-agency-agreement-amendment.pdf",
    blurb: "Amendment to the buyer's agency agreement.",
  },
  {
    id: "slar-2091",
    name: "Seller's Disclosure Statement",
    slarNumber: "2091",
    category: "Disclosures & Notices",
    file: "slar-2091-sellers-disclosure-statement.pdf",
    blurb: "Seller's disclosure of property condition.",
  },
  {
    id: "slar-2165",
    name: "Septic/Well Addendum to Seller's Disclosure Statement",
    slarNumber: "2165",
    category: "Disclosures & Notices",
    file: "slar-2165-septic-well-addendum.pdf",
    blurb: "Septic and well addendum to the seller's disclosure.",
  },
  {
    id: "slar-2039",
    name: "Protect Your Family From Lead in Your Home",
    slarNumber: "2039",
    category: "Disclosures & Notices",
    file: "slar-2039-lead-paint-pamphlet.pdf",
    blurb: "Federal lead-paint pamphlet for pre-1978 homes.",
  },
  {
    id: "slar-2096b",
    name: "Notice to Tenants",
    slarNumber: "2096b",
    category: "Disclosures & Notices",
    file: "slar-2096b-notice-to-tenants.pdf",
    blurb: "Notice to tenants of a property being sold.",
  },
  {
    id: "slar-2158",
    name: "Mutual Release",
    slarNumber: "2158",
    category: "Disclosures & Notices",
    file: "slar-2158-mutual-release.pdf",
    blurb: "Mutual release of a contract (broker-signed per the termination rule).",
  },
  {
    id: "lien-waiver-nois",
    name: "Lien Waiver — NOIS Article",
    slarNumber: null,
    category: "Reference",
    file: "lien-waiver-nois-article.pdf",
    blurb: "Reference article on lien waivers and notices of intent.",
  },
];

export function formFileUrl(form: LibraryForm): string {
  return `/forms/${form.file}`;
}

export function formsByCategory(category: FormCategory): LibraryForm[] {
  return FORM_LIBRARY.filter((f) => f.category === category);
}
