// Shared contractor data used across the portal
// Update this file to add/remove contractors from both the Resources page and Bid Request form

export interface NetworkContractor {
  id: string;
  name: string;
  specialty: string;
  phone: string;
  email: string;
  // Bid request specific fields
  bidFeeRequired: boolean;
  bidFeeAmount: number;
  estimatedTurnaround: string;
  paymentUrl: string | null;
}

export const networkContractors: NetworkContractor[] = [
  {
    id: "1",
    name: "ABC General Contracting",
    specialty: "Full Rehabs, Kitchens, Bathrooms",
    phone: "(314) 555-0101",
    email: "info@abcgeneralstl.com",
    bidFeeRequired: true,
    bidFeeAmount: 150,
    estimatedTurnaround: "3-5 business days",
    paymentUrl: "https://example.com/pay/abc-general",
  },
  {
    id: "2",
    name: "St. Louis Roofing Pros",
    specialty: "Roofing, Gutters, Siding",
    phone: "(314) 555-0102",
    email: "contact@stlroofingpros.com",
    bidFeeRequired: true,
    bidFeeAmount: 75,
    estimatedTurnaround: "2-3 business days",
    paymentUrl: "https://example.com/pay/stl-roofing",
  },
  {
    id: "3",
    name: "Foundation First STL",
    specialty: "Foundation Repair, Waterproofing",
    phone: "(314) 555-0103",
    email: "service@foundationfirststl.com",
    bidFeeRequired: false,
    bidFeeAmount: 0,
    estimatedTurnaround: "5-7 business days",
    paymentUrl: null,
  },
];
