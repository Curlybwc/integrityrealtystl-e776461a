// Clean-room ARV method — shared types.
// Runtime-agnostic (Deno edge functions, Node >= 22, vitest).

export type ConditionTier = "renovated" | "average" | "distressed";

/** Normalised view of one Repliers listing (subject or sold comp). */
export interface Property {
  mlsNumber: string | null;
  address: string;
  addressKey: string | null;
  zip: string | null;
  subdivision: string | null;
  lat: number;
  lng: number;
  /** Above-grade finished sqft when the MLS provides it, else living area. */
  sqft: number | null;
  beds: number | null;
  /** Full baths + 0.5 per half bath. */
  baths: number | null;
  yearBuilt: number | null;
  levels: string | null;
  garageSpaces: number | null;
  hasBasement: boolean | null;
  style: string | null;
  propertyType: string | null;
  listPrice: number | null;
  remarks: string;
}

export interface SoldComp extends Property {
  soldPrice: number;
  /** Seller concessions reported by the MLS (0 when none/unknown). */
  concessions: number;
  /** Repliers `soldDate` — verified live to be the contract/off-market date. */
  contractDate: string;
  /** MLS CloseDate (raw field) when available. */
  closeDate: string | null;
  propertyCondition: string | null;
  specialConditions: string | null;
  buyerFinancing: string | null;
  newConstruction: boolean;
}

export interface ConditionAssessment {
  tier: ConditionTier;
  score: number;
  signals: string[];
}

export interface Adjustment {
  label: string;
  /** Multiplicative factor applied to the comp's net price. */
  factor: number;
}

export interface ScoredComp {
  comp: SoldComp;
  condition: ConditionAssessment;
  distanceKm: number;
  ageMonths: number;
  /** 0-100, higher = more like the subject. */
  similarity: number;
  penalties: Record<string, number>;
  netPrice: number;
  adjustments: Adjustment[];
  adjustedPrice: number;
  /** |adjustedPrice / netPrice - 1| */
  grossAdjustmentPct: number;
  /** True when this comp was used in the ARV figure. */
  selected: boolean;
}

export interface ArvOptions {
  /** Valuation date (ISO). Only sales contracted before it are used. Default: now. */
  asOf?: string;
  lookbackMonths?: number;
  maxRadiusKm?: number;
  /** Max Repliers pages (100 records each) to pull, nearest-first. */
  maxPages?: number;
  /** Number of comps used for the ARV figure. */
  targetComps?: number;
  minComps?: number;
  /** Size elasticity of price (price ~ sqft^beta). */
  sizeElasticity?: number;
  /** Sqft band for comps, as ratio to subject (e.g. 0.3 = within ±30%). */
  sqftTolerance?: number;
  /** Apply the pool-estimated market trend to older sales. Default false. */
  useTrend?: boolean;
  /** Weight comps by strength of renovation evidence as well as similarity. Default true. */
  conditionWeighting?: boolean;
  /** MLS numbers to exclude (the subject itself is always excluded). */
  excludeMls?: string[];
}

export type ArvMethod = "renovated-comps" | "upper-quantile-fallback" | "insufficient-data";

export interface ArvResult {
  subject: Property;
  asOf: string;
  method: ArvMethod;
  arv: number | null;
  arvLow: number | null;
  arvHigh: number | null;
  arvPerSqft: number | null;
  /** 0-100 heuristic. */
  confidence: number;
  confidenceNotes: string[];
  /** Comps used for the ARV, best first. */
  selectedComps: ScoredComp[];
  /** Other eligible comps considered but not used (best first, truncated). */
  otherComps: ScoredComp[];
  market: {
    poolSize: number;
    eligible: number;
    tierCounts: Record<ConditionTier, number>;
    /** Median $/sqft of all eligible non-distressed sales (as-sold, unadjusted). */
    medianPricePerSqft: number | null;
    /** Estimated local price trend, fraction per month (shrunk and clamped). */
    monthlyTrend: number;
    searchRadiusKmUsed: number;
  };
  diagnostics: {
    /** Repliers requests this valuation needed (subject lookup + comp pages). */
    apiCalls: number;
    pagesFetched: number;
    totalMatches: number;
    warnings: string[];
  };
}
