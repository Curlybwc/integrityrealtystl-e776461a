// Types for comp-based ARV engine

export type CompTier = "Strong" | "Good" | "Fallback" | "WeakSupport" | "Excluded";

export type FinishTier = "rental" | "standard" | "premium";

export interface Subject {
  address?: string;
  zip: string;
  lat?: number;
  long?: number;
  beds: number;
  baths: number;
  sqft: number;
  yearBuilt?: number;
  style?: string;          // ranch, 2-story, split, etc.
  stories?: number;
  subdivision?: string;
  schoolDistrict?: string;
  garageBays?: number;
  basementFinishedSqft?: number;
  intendedFinish?: FinishTier;
}

export interface Comp {
  id: string;
  address: string;
  zip: string;
  lat?: number;
  long?: number;
  soldPrice: number;
  soldDate: string;        // ISO
  listPrice?: number;
  daysOnMarket?: number;
  beds: number;
  baths: number;
  sqft: number;
  yearBuilt?: number;
  style?: string;
  stories?: number;
  subdivision?: string;
  schoolDistrict?: string;
  garageBays?: number;
  basementFinishedSqft?: number;
  lastStatus?: string;     // Sld / REO / Foreclosure / Short Sale / Auction
  remarks?: string;
  inferredFinish?: FinishTier;
  finishConfirmed?: boolean;
}

export type EligibilityStage = "strong" | "fallback" | "excluded";

export interface FallbackStep {
  step:
    | "distance_0_75"
    | "distance_1_0"
    | "loosen_neighborhood"
    | "bath_pm1"
    | "bed_pm1"
    | "sqft_pm25"
    | "recency_9mo"
    | "recency_12mo"
    | "cross_style";
  label: string;
}

export interface ScoreBreakdown {
  distance: number;
  schoolDistrict: number;
  subdivision: number;
  beds: number;
  baths: number;
  sqft: number;
  style: number;
  recency: number;
  condition: number;
  utility: number;
  penalties: number;
  total: number;
}

export interface CompAdjustments {
  sqft: number;
  beds: number;
  baths: number;
  garage: number;
  basement: number;
  time: number;
  condition: number;
  location: number;
  adjustedValue: number;
  adjustedPerSf: number;
}

export interface ScoredComp {
  comp: Comp;
  distanceMi: number;
  stage: EligibilityStage;
  tier: CompTier;
  score: ScoreBreakdown;
  adjustments: CompAdjustments;
  fallbackStepsUsed: FallbackStep["step"][];
  reviewFlags: string[];   // soft remarks signals
  excludeReason?: string;
  included: boolean;       // user-toggleable; default true unless excluded
}

export interface ArvBands {
  conservative: number;
  likely: number;
  aggressive: number;
}

export interface ConfidenceDriver {
  label: string;
  delta: number;           // negative or positive
}

export interface CompArvResult {
  subject: Subject;
  arv: ArvBands | null;
  confidence: number;      // 0-100
  confidenceBand: "Strong" | "Reasonable" | "Use Caution" | "Weak Support";
  drivers: ConfidenceDriver[];
  tierCounts: Record<CompTier, number>;
  driverTier: CompTier;    // tier set that drove the ARV
  comps: ScoredComp[];     // all surviving comps
  excluded: ScoredComp[];  // hard-excluded
  fallbackUsed: FallbackStep[];
  reasons: string[];
}

export interface LocalOverrides {
  includeIds?: Record<string, boolean>;       // comp id -> include?
  finishByComp?: Record<string, FinishTier>;  // confirmed finish per comp
  intendedFinish?: FinishTier;
  locationAdjustmentPct?: number;             // applied uniformly
}
