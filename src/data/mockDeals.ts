// Mock Deals Data for Admin/Buyer Portal Mockup
import { Deal, createDeal } from "@/lib/screening";

// Sample photo URLs (using placeholder images)
const SAMPLE_PHOTOS = [
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800",
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800",
  "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800",
];

// Generate mock deals
export const MOCK_DEALS: Deal[] = [
  // Passing Unreviewed Deals
  createDeal({
    id: "deal-001",
    source_type: "MLS",
    mls_listing_id: "MLS-12345",
    address: "4521 Natural Bridge Ave",
    city: "St. Louis",
    state: "MO",
    zip: "63121",
    beds: 3,
    baths: 2,
    sqft: 1200,
    year_built: 1955,
    list_price: 75000,
    photo_urls: SAMPLE_PHOTOS.slice(0, 4),
    mls_status: "Active",
    reviewed: false,
  }),
  createDeal({
    id: "deal-002",
    source_type: "MLS",
    mls_listing_id: "MLS-12346",
    address: "8742 Goodfellow Blvd",
    city: "St. Louis",
    state: "MO",
    zip: "63136",
    beds: 4,
    baths: 2,
    sqft: 1450,
    year_built: 1948,
    list_price: 85000,
    photo_urls: SAMPLE_PHOTOS.slice(1, 5),
    mls_status: "Active",
    reviewed: false,
  }),
  createDeal({
    id: "deal-003",
    source_type: "MLS",
    mls_listing_id: "MLS-12347",
    address: "3920 Penrose St",
    city: "St. Louis",
    state: "MO",
    zip: "63133",
    beds: 3,
    baths: 1,
    sqft: 1100,
    year_built: 1940,
    list_price: 55000,
    photo_urls: SAMPLE_PHOTOS.slice(0, 3),
    mls_status: "Active",
    reviewed: false,
  }),
  createDeal({
    id: "deal-004",
    source_type: "MLS",
    mls_listing_id: "MLS-12348",
    address: "6234 Bartmer Ave",
    city: "University City",
    state: "MO",
    zip: "63130",
    beds: 4,
    baths: 2,
    sqft: 1600,
    year_built: 1925,
    list_price: 125000,
    photo_urls: SAMPLE_PHOTOS,
    mls_status: "Active",
    reviewed: false,
  }),
  
  // Passing Reviewed Deals (with alert flag on one)
  {
    ...createDeal({
      id: "deal-005",
      source_type: "MLS",
      mls_listing_id: "MLS-12349",
      address: "7891 Page Blvd",
      city: "St. Louis",
      state: "MO",
      zip: "63133",
      beds: 3,
      baths: 2,
      sqft: 1350,
      year_built: 1952,
      list_price: 70000,
      photo_urls: SAMPLE_PHOTOS.slice(2, 5),
      mls_status: "Active",
      reviewed: true,
      reviewed_at: new Date(Date.now() - 86400000).toISOString(),
      notes: "Good bones, needs cosmetic updates. Verified rent comps.",
    }),
    flagged_for_alert: true,
  },
  createDeal({
    id: "deal-006",
    source_type: "MLS",
    mls_listing_id: "MLS-12350",
    address: "2145 Belt Ave",
    city: "St. Louis",
    state: "MO",
    zip: "63134",
    beds: 4,
    baths: 2,
    sqft: 1500,
    year_built: 1960,
    list_price: 95000,
    photo_urls: SAMPLE_PHOTOS.slice(0, 4),
    mls_status: "Pending",
    reviewed: true,
    reviewed_at: new Date(Date.now() - 172800000).toISOString(),
    notes: "Under contract, watching for fallthrough.",
  }),
  
  // Wholesaler Deals (with alert flag on one)
  {
    ...createDeal({
      id: "deal-007",
      source_type: "WHOLESALER",
      address: "5432 Cabanne Ave",
      city: "St. Louis",
      state: "MO",
      zip: "63112",
      beds: 3,
      baths: 1,
      sqft: 1150,
      year_built: 1935,
      list_price: 45000,
      photo_urls: SAMPLE_PHOTOS.slice(1, 4),
      wholesaler_owner_id: "wholesaler-001",
      wholesaler_status: "Available",
      reviewed: true,
      reviewed_at: new Date(Date.now() - 259200000).toISOString(),
      notes: "Assignment fee included. Motivated seller.",
    }),
    flagged_for_alert: true,
  },
  createDeal({
    id: "deal-008",
    source_type: "WHOLESALER",
    address: "9876 Hamilton Ave",
    city: "St. Louis",
    state: "MO",
    zip: "63136",
    beds: 4,
    baths: 2,
    sqft: 1400,
    year_built: 1950,
    list_price: 65000,
    photo_urls: SAMPLE_PHOTOS.slice(0, 3),
    wholesaler_owner_id: "wholesaler-002",
    wholesaler_status: "UnderContract",
    reviewed: false,
  }),
  
  // Deal that will fail screening (for Removed tab demo)
  {
    ...createDeal({
      id: "deal-009",
      source_type: "MLS",
      mls_listing_id: "MLS-12351",
      address: "1234 Overpriced Ln",
      city: "Clayton",
      state: "MO",
      zip: "63105",
      beds: 3,
      baths: 2,
      sqft: 1200,
      year_built: 1970,
      list_price: 250000,
      photo_urls: SAMPLE_PHOTOS.slice(2, 4),
      mls_status: "Active",
      reviewed: true,
      reviewed_at: new Date(Date.now() - 432000000).toISOString(),
    }),
    buyer_visible: false,
    removed_reason: "failed_after_admin_override",
    notes: "ARV override lowered, no longer passes.",
  },
  
  // Archived Sold Deals
  {
    ...createDeal({
      id: "deal-010",
      source_type: "MLS",
      mls_listing_id: "MLS-11111",
      address: "5678 Sold St",
      city: "St. Louis",
      state: "MO",
      zip: "63121",
      beds: 3,
      baths: 1,
      sqft: 1100,
      year_built: 1945,
      list_price: 72000,
      photo_urls: SAMPLE_PHOTOS.slice(0, 2),
      mls_status: "Sold",
      reviewed: true,
    }),
    buyer_visible: false,
  },
];

// LocalStorage key
const DEALS_STORAGE_KEY = "integrity_deals";

// Persistence helpers
export function loadDeals(): Deal[] {
  try {
    const stored = localStorage.getItem(DEALS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to load deals from localStorage:", e);
  }
  return MOCK_DEALS;
}

export function saveDeals(deals: Deal[]): void {
  try {
    localStorage.setItem(DEALS_STORAGE_KEY, JSON.stringify(deals));
  } catch (e) {
    console.error("Failed to save deals to localStorage:", e);
  }
}

export function resetDeals(): Deal[] {
  localStorage.removeItem(DEALS_STORAGE_KEY);
  return MOCK_DEALS;
}
