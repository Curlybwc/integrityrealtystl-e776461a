// Comprehensive network partner data for both Local Network listing and individual profile pages
// Partners can be contractors, property managers, lenders, etc.

export type PartnerType = 
  | "contractor" 
  | "property-manager" 
  | "lender" 
  | "insurance" 
  | "attorney" 
  | "title-company" 
  | "inspector" 
  | "appraiser" 
  | "bank";

export interface NetworkPartner {
  id: string;
  type: PartnerType;
  name: string;
  contact?: string;
  specialty: string;
  phone?: string;
  email?: string;
  website?: string;
  // Extended profile fields
  description?: string;
  yearsInBusiness?: number;
  serviceAreas?: string[];
  testimonials?: {
    quote: string;
    author: string;
    date?: string;
  }[];
  certifications?: string[];
  gallery?: string[]; // URLs to work photos
  // Bid request specific fields (for contractors)
  bidFeeRequired?: boolean;
  bidFeeAmount?: number;
  estimatedTurnaround?: string;
  paymentUrl?: string | null;
}

// All network partners in one unified data source
export const networkPartners: NetworkPartner[] = [
  // Contractors
  {
    id: "abc-general",
    type: "contractor",
    name: "ABC General Contracting",
    specialty: "Full Rehabs, Kitchens, Bathrooms",
    phone: "(314) 555-0101",
    email: "info@abcgeneralstl.com",
    description: "ABC General Contracting specializes in complete home renovations for investment properties. We understand investor timelines and budgets.",
    yearsInBusiness: 15,
    serviceAreas: ["North County", "St. Louis City", "South County"],
    testimonials: [
      {
        quote: "ABC completed our full rehab on time and under budget. Highly recommend!",
        author: "John D., Investor",
        date: "2024"
      }
    ],
    certifications: ["Licensed General Contractor", "Insured & Bonded"],
    bidFeeRequired: true,
    bidFeeAmount: 150,
    estimatedTurnaround: "3-5 business days",
    paymentUrl: "https://example.com/pay/abc-general",
  },
  {
    id: "stl-roofing",
    type: "contractor",
    name: "St. Louis Roofing Pros",
    specialty: "Roofing, Gutters, Siding",
    phone: "(314) 555-0102",
    email: "contact@stlroofingpros.com",
    description: "Full-service roofing company serving the greater St. Louis area. We specialize in investment property repairs with quick turnarounds.",
    yearsInBusiness: 10,
    serviceAreas: ["All of St. Louis Metro"],
    bidFeeRequired: true,
    bidFeeAmount: 75,
    estimatedTurnaround: "2-3 business days",
    paymentUrl: "https://example.com/pay/stl-roofing",
  },
  {
    id: "foundation-first",
    type: "contractor",
    name: "Foundation First STL",
    specialty: "Foundation Repair, Waterproofing",
    phone: "(314) 555-0103",
    email: "service@foundationfirststl.com",
    description: "Expert foundation repair and waterproofing solutions. We provide detailed assessments and warranties on all work.",
    yearsInBusiness: 20,
    serviceAreas: ["Greater St. Louis Area"],
    bidFeeRequired: false,
    bidFeeAmount: 0,
    estimatedTurnaround: "5-7 business days",
    paymentUrl: null,
  },
  
  // Property Managers
  {
    id: "gateway-pm",
    type: "property-manager",
    name: "Gateway Property Management",
    specialty: "Single-Family, Small Multi-Family",
    phone: "(314) 555-0201",
    website: "www.gatewaypmstl.com",
    description: "Full-service property management for single-family and small multi-family investment properties.",
    serviceAreas: ["St. Louis City", "North County"],
  },
  {
    id: "north-county-rentals",
    type: "property-manager",
    name: "North County Rentals",
    specialty: "Section 8, Affordable Housing",
    phone: "(314) 555-0202",
    website: "www.northcountyrentals.com",
    description: "Specialists in Section 8 and affordable housing management. We handle tenant placement and HAP coordination.",
    serviceAreas: ["North County", "Florissant", "Ferguson"],
  },
  
  // DSCR Lenders
  {
    id: "loanbidz",
    type: "lender",
    name: "LoanBidZ",
    contact: "Nate Herndon",
    specialty: "DSCR Loans",
    phone: "417-605-2196",
    email: "nate@loanbidz.com",
  },
  {
    id: "tmd",
    type: "lender",
    name: "TMD",
    contact: "Mike",
    specialty: "DSCR Loans",
    phone: "413-272-9686",
  },
  {
    id: "investor-property-loans",
    type: "lender",
    name: "Investor Property Loans",
    contact: "KO",
    specialty: "DSCR Loans",
    phone: "310-848-9776",
    email: "ko@investorpropertyloan.com",
  },
  {
    id: "fms-investor",
    type: "lender",
    name: "FMS Investor Financing",
    contact: "Bobby Lee",
    specialty: "DSCR Loans",
    phone: "630-282-7527",
    email: "blee@fmsinvestor.com",
    website: "fmsinvestor.com",
  },
  {
    id: "housemax",
    type: "lender",
    name: "HouseMAX Leo",
    contact: "Leo",
    specialty: "DSCR Loans",
    phone: "737-587-3604",
  },
  {
    id: "bello-mortgage",
    type: "lender",
    name: "Bello Mortgage",
    contact: "Brett",
    specialty: "DSCR Loans",
    phone: "727-277-3886",
    email: "brett@bellomortgage.com",
  },
  {
    id: "bluebird-lending",
    type: "lender",
    name: "Bluebird Lending",
    contact: "Teresa",
    specialty: "DSCR Loans",
  },
  {
    id: "trulo-mortgage",
    type: "lender",
    name: "Trulo Mortgage",
    contact: "Sam",
    specialty: "DSCR Loans",
  },
  {
    id: "rcn-capital",
    type: "lender",
    name: "RCN Capital",
    contact: "Scott",
    specialty: "DSCR Loans",
  },
  {
    id: "center-street",
    type: "lender",
    name: "Center Street Lending",
    contact: "Guy Clauss",
    specialty: "DSCR Loans",
    phone: "949-270-3418",
    email: "gclauss@centerstreetlending.com",
  },
  
  // Insurance
  {
    id: "shelter-insurance",
    type: "insurance",
    name: "Shelter Insurance",
    contact: "Mike Finney",
    specialty: "Investment Properties",
    website: "shelterinsurance.com/CA/agent/mikefinney",
  },
];

// Helper functions to filter by type
export const getPartnersByType = (type: PartnerType) => 
  networkPartners.filter(p => p.type === type);

export const getPartnerById = (id: string) => 
  networkPartners.find(p => p.id === id);

export const getContractors = () => getPartnersByType("contractor");
