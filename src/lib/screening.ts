// Deal Screening Logic for Turnkey and BRRRR strategies
import { 
  ARV_PER_SF, 
  RENT_COMPS_BY_ZIP, 
  FMR_BY_ZIP,
  REPAIR_COSTS_PER_SF 
} from "@/data/stlZipData";

// Types
export type RehabTier = "Turnkey" | "Light" | "Medium" | "Heavy";
export type MlsStatus = "Active" | "Pending" | "Sold" | "Unknown";
export type WholesalerStatus = "Available" | "UnderContract" | "Sold";
export type SourceType = "MLS" | "WHOLESALER";
export type Strategy = "None" | "Turnkey" | "BRRRR" | "Both";

export interface Deal {
  id: string;
  source_type: SourceType;
  mls_listing_id?: string;
  
  // Property Info
  address: string;
  city: string;
  state: string;
  zip: string;
  beds: number;
  baths: number;
  sqft: number;
  year_built?: number;
  property_type?: string;
  photo_urls: string[];
  
  // MLS Fields
  list_price: number;
  mls_status: MlsStatus;
  last_mls_sync_at?: string;
  
  // System Estimates (auto-calculated)
  rent_system: number;
  arv_system: number;
  rehab_tier_system: RehabTier;
  arv_comp?: number;
  arv_confidence?: number;
  arv_source?: "comps" | "heuristic";
  
  // Admin Overrides (never overwritten by sync)
  rent_override?: number;
  arv_override?: number;
  rehab_tier_override?: RehabTier;
  rehab_est_override?: number;

  // Evidence-based repair analysis (from repair_analyses cache)
  rehab_est_from_analysis?: number | null;
  repair_analysis_status?: "complete" | "pending" | "analyzing" | "failed" | "quota_blocked" | "missing" | null;

  // Computed/Effective Values
  rent_effective: number;
  arv_effective: number;
  rehab_tier_effective: RehabTier;
  rehab_est_effective: number;
  analysis_pending: boolean;

  // Metrics
  rent_to_price_pct: number;
  all_in_pct_of_arv: number;

  // Screening Results
  passes_turnkey: boolean;
  passes_brrrr: boolean;
  passes_flip: boolean;
  strategy: Strategy;
  buyer_visible: boolean;

  // Admin Workflow
  reviewed: boolean;
  reviewed_at?: string;
  notes?: string;
  removed_reason?: string;
  flagged_for_alert?: boolean;

  // Wholesaler Fields
  wholesaler_owner_id?: string;
  wholesaler_status?: WholesalerStatus;

  // Timestamps
  created_at: string;
  updated_at: string;
}

// Screening Configuration
export interface ScreeningConfig {
  rehab_rate_turnkey: number;
  rehab_rate_light: number;
  rehab_rate_medium: number;
  rehab_rate_heavy: number;
  turnkey_min_rtp: number;
  turnkey_min_arv_pct: number;
  turnkey_max_arv_pct: number;
  brrrr_min_rtp: number;
  brrrr_max_all_in_pct: number;
  flip_max_arv_pct: number;
}

export const DEFAULT_SCREENING_CONFIG: ScreeningConfig = {
  rehab_rate_turnkey: 5,
  rehab_rate_light: 15,
  rehab_rate_medium: 30,
  rehab_rate_heavy: 50,
  turnkey_min_rtp: 0.0135,
  turnkey_min_arv_pct: 0.80,
  turnkey_max_arv_pct: 1.00,
  brrrr_min_rtp: 0.013,
  brrrr_max_all_in_pct: 0.75,
  flip_max_arv_pct: 0.75,
};

// Helper Functions
export function getRehabRate(tier: RehabTier, config: ScreeningConfig = DEFAULT_SCREENING_CONFIG): number {
  switch (tier) {
    case "Turnkey": return config.rehab_rate_turnkey;
    case "Light": return config.rehab_rate_light;
    case "Medium": return config.rehab_rate_medium;
    case "Heavy": return config.rehab_rate_heavy;
  }
}

export function estimateSystemRent(zip: string, beds: number): number {
  // Try rent comps first
  const comps = RENT_COMPS_BY_ZIP[zip];
  if (comps) {
    if (beds <= 2) return comps.bed2;
    if (beds === 3) return comps.bed3;
    return comps.bed4;
  }
  
  // Fallback to FMR
  const fmrArray = FMR_BY_ZIP[zip];
  if (fmrArray) {
    const index = Math.min(Math.max(beds, 0), 5);
    return fmrArray[index] ?? 1200;
  }
  
  // Default fallback
  return 1200;
}

export function estimateSystemArv(zip: string, sqft: number): number {
  const arvPerSf = ARV_PER_SF[zip];
  if (arvPerSf) {
    return sqft * arvPerSf;
  }
  // Default fallback: $100/sf
  return sqft * 100;
}

export function estimateRehabTier(list_price: number, arv: number): RehabTier {
  if (!arv || arv <= 0) return "Medium";
  const ratio = list_price / arv;
  if (ratio >= 0.90) return "Turnkey";
  if (ratio >= 0.80) return "Light";
  if (ratio >= 0.60) return "Medium";
  return "Heavy";
}

// Main Screening Function
export function computeDealMetrics(
  deal: Partial<Deal>,
  config: ScreeningConfig = DEFAULT_SCREENING_CONFIG
): Pick<Deal,
  | "rent_effective"
  | "arv_effective"
  | "rehab_tier_effective"
  | "rehab_est_effective"
  | "rent_to_price_pct"
  | "all_in_pct_of_arv"
  | "passes_turnkey"
  | "passes_brrrr"
  | "passes_flip"
  | "strategy"
  | "buyer_visible"
  | "analysis_pending"
> {
  // Compute effective values (overrides take precedence)
  const rent_effective = deal.rent_override ?? deal.rent_system ?? 0;
  const arv_effective = deal.arv_override ?? deal.arv_system ?? 0;
  const list_price = deal.list_price ?? 0;

  // Resolve repair estimate from evidence-based analysis or manual dollar override only.
  // No price/ARV-derived rehab tier inference here.
  const analysisStatus = deal.repair_analysis_status ?? null;
  const rehabFromAnalysis =
    deal.rehab_est_from_analysis != null && deal.rehab_est_from_analysis > 0
      ? deal.rehab_est_from_analysis
      : null;
  const rehabFromOverride =
    deal.rehab_est_override != null && deal.rehab_est_override > 0
      ? deal.rehab_est_override
      : null;

  const rehab_est_effective_nullable: number | null =
    rehabFromOverride ?? rehabFromAnalysis;

  // Analysis is pending when no manual override and no completed analysis dollar amount.
  const analysis_pending =
    rehabFromOverride == null &&
    rehabFromAnalysis == null &&
    analysisStatus !== "complete" &&
    analysisStatus !== null
      ? true
      : rehabFromOverride == null && rehabFromAnalysis == null;

  // Keep a display tier for back-compat callers; not used in screening math.
  const rehab_tier_effective: RehabTier = deal.rehab_tier_override ?? "Medium";

  if (analysis_pending) {
    // Block MAO / RTP / strategy until repair estimate is known.
    return {
      rent_effective,
      arv_effective,
      rehab_tier_effective,
      rehab_est_effective: 0,
      rent_to_price_pct: 0,
      all_in_pct_of_arv: 0,
      passes_turnkey: false,
      passes_brrrr: false,
      passes_flip: false,
      strategy: "None",
      buyer_visible: false,
      analysis_pending: true,
    };
  }

  const rehab_est_effective = rehab_est_effective_nullable ?? 0;

  // Compute metrics — RTP uses all-in price (price + repairs)
  const all_in = list_price + rehab_est_effective;
  const rent_to_price_pct = all_in > 0 ? rent_effective / all_in : 0;
  const all_in_pct_of_arv = arv_effective > 0 ? all_in / arv_effective : 0;

  // Evaluate Flip (MAO-based)
  const mao = (arv_effective * config.flip_max_arv_pct) - rehab_est_effective;
  const passes_flip = list_price <= mao && arv_effective > 0;

  // Evaluate BRRRR (Flip + RTP)
  const passes_brrrr =
    passes_flip &&
    rent_to_price_pct >= config.brrrr_min_rtp;

  // Turnkey requires explicit admin tier override (no auto-inferred tier anymore)
  const passes_turnkey =
    rent_to_price_pct >= config.turnkey_min_rtp &&
    deal.rehab_tier_override === "Turnkey";

  // Determine strategy
  let strategy: Strategy = "None";
  if (passes_turnkey && passes_brrrr) {
    strategy = "Both";
  } else if (passes_turnkey) {
    strategy = "Turnkey";
  } else if (passes_brrrr) {
    strategy = "BRRRR";
  }

  // Determine buyer visibility
  const isSold = deal.source_type === "WHOLESALER"
    ? deal.wholesaler_status === "Sold"
    : deal.mls_status === "Sold";

  const buyer_visible =
    (passes_turnkey || passes_brrrr || passes_flip) &&
    !isSold &&
    !deal.removed_reason;

  return {
    rent_effective,
    arv_effective,
    rehab_tier_effective,
    rehab_est_effective,
    rent_to_price_pct,
    all_in_pct_of_arv,
    passes_turnkey,
    passes_brrrr,
    passes_flip,
    strategy,
    buyer_visible,
    analysis_pending: false,
  };
}

// Create a new deal with auto-computed values
export function createDeal(
  input: Pick<Deal, 
    | "source_type" 
    | "address" 
    | "city" 
    | "state" 
    | "zip" 
    | "beds" 
    | "baths" 
    | "sqft" 
    | "list_price" 
    | "photo_urls"
  > & Partial<Deal>,
  config: ScreeningConfig = DEFAULT_SCREENING_CONFIG
): Deal {
  const now = new Date().toISOString();
  
  // Compute system estimates — prefer comp-based ARV when supplied
  const rent_system = estimateSystemRent(input.zip, input.beds);
  const heuristicArv = estimateSystemArv(input.zip, input.sqft);
  const arv_system = input.arv_comp && input.arv_comp > 0 ? input.arv_comp : heuristicArv;
  const arv_source: "comps" | "heuristic" = input.arv_comp && input.arv_comp > 0 ? "comps" : "heuristic";
  const rehab_tier_system: RehabTier = "Medium"; // legacy field; no longer derived from price/ARV
  
  const baseDeal: Partial<Deal> = {
    id: input.id ?? crypto.randomUUID(),
    source_type: input.source_type,
    mls_listing_id: input.mls_listing_id,
    address: input.address,
    city: input.city,
    state: input.state,
    zip: input.zip,
    beds: input.beds,
    baths: input.baths,
    sqft: input.sqft,
    year_built: input.year_built,
    property_type: input.property_type ?? "Single Family",
    photo_urls: input.photo_urls,
    list_price: input.list_price,
    mls_status: input.mls_status ?? "Active",
    rent_system,
    arv_system,
    arv_comp: input.arv_comp,
    arv_confidence: input.arv_confidence,
    arv_source,
    rehab_tier_system,
    rent_override: input.rent_override,
    arv_override: input.arv_override,
    rehab_tier_override: input.rehab_tier_override,
    reviewed: input.reviewed ?? false,
    reviewed_at: input.reviewed_at,
    notes: input.notes,
    removed_reason: input.removed_reason,
    wholesaler_owner_id: input.wholesaler_owner_id,
    wholesaler_status: input.wholesaler_status ?? "Available",
    created_at: input.created_at ?? now,
    updated_at: now,
  };
  
  // Compute metrics
  const metrics = computeDealMetrics(baseDeal, config);
  
  return {
    ...baseDeal,
    ...metrics,
  } as Deal;
}

// Update a deal and recompute metrics
export function updateDeal(
  deal: Deal,
  updates: Partial<Deal>,
  config: ScreeningConfig = DEFAULT_SCREENING_CONFIG
): Deal {
  const now = new Date().toISOString();
  
  // Merge updates
  const updated: Partial<Deal> = {
    ...deal,
    ...updates,
    updated_at: now,
  };
  
  // Recompute metrics
  const metrics = computeDealMetrics(updated, config);
  
  // Check if strategy changed to None due to override
  const wasVisible = deal.buyer_visible;
  const nowInvisible = !metrics.buyer_visible;
  const hasOverrideChange = 
    updates.rent_override !== undefined ||
    updates.arv_override !== undefined ||
    updates.rehab_tier_override !== undefined;
  
  // Auto-set removed_reason if strategy becomes None after admin override
  if (wasVisible && nowInvisible && hasOverrideChange && metrics.strategy === "None") {
    updated.removed_reason = "failed_after_admin_override";
  }
  
  return {
    ...updated,
    ...metrics,
  } as Deal;
}

// Format helpers
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(value: number, decimals: number = 2): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

export function getStatusDisplayLabel(deal: Deal): string {
  if (deal.source_type === "WHOLESALER") {
    switch (deal.wholesaler_status) {
      case "UnderContract": return "Under Contract";
      case "Sold": return "Sold";
      default: return "Available";
    }
  }
  
  switch (deal.mls_status) {
    case "Pending": return "Under Contract";
    case "Sold": return "Sold";
    case "Active": return "Active";
    default: return "Unknown";
  }
}

// Check if a deal has all required fields for scoring
export function canScoreDeal(deal: Partial<Deal>): boolean {
  return !!(
    deal.zip && 
    deal.beds !== undefined && 
    deal.sqft && deal.sqft > 0 &&
    deal.list_price && deal.list_price > 0
  );
}

// Get scoring status for display
export interface ScoringStatus {
  isScored: boolean;
  label: string;
  strategy: Strategy;
  missingFields: string[];
}

export function getScoringStatus(deal: Deal): ScoringStatus {
  const missingFields: string[] = [];
  
  if (!deal.zip) missingFields.push("ZIP");
  if (deal.beds === undefined) missingFields.push("beds");
  if (!deal.sqft || deal.sqft <= 0) missingFields.push("sqft");
  if (!deal.list_price || deal.list_price <= 0) missingFields.push("price");
  
  if (missingFields.length > 0) {
    return {
      isScored: false,
      label: "Not Scored (missing data)",
      strategy: "None",
      missingFields,
    };
  }
  
  // Deal is scorable - return actual strategy
  return {
    isScored: true,
    label: deal.strategy,
    strategy: deal.strategy,
    missingFields: [],
  };
}
