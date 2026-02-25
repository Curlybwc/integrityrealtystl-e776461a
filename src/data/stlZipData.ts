// St. Louis Area ZIP Code Data for Deal Analysis
// Data sourced from HUD 2025 Metro FMR and local market analysis

// Note: RepairPreset and REPAIR_COSTS_PER_SF are kept for potential use by BatchAnalysisTable
// DealAnalyzer now uses RehabTier from screening.ts instead
export type RepairPreset = "turnkey" | "light" | "medium" | "heavy" | "fullGut";

export const REPAIR_COSTS_PER_SF: Record<RepairPreset, number> = {
  turnkey: 5,
  light: 15,
  medium: 30,
  heavy: 50,
  fullGut: 75,
};

// ARV per Square Foot by ZIP code
export const ARV_PER_SF: Record<string, number> = {
  "63130": 175,
  "63132": 160,
  "63133": 125,
  "63031": 140,
  "63033": 130,
  "63034": 120,
  "63134": 125,
  "63135": 120,
  "63136": 110,
  "63137": 100,
  "63138": 115,
  "63114": 145,
  "63074": 135,
  "63042": 130,
  "63121": 60,
};

// HUD 2025 Small Area Fair Market Rents (SAFMR) Payment Standards by ZIP and bedroom count
// Source: HASLC 2025 Payment Standards
// Index: 0=Efficiency, 1=1BR, 2=2BR, 3=3BR, 4=4BR, 5=5BR
export const FMR_BY_ZIP: Record<string, number[]> = {
  // Area 1: $840, $880, $1090, $1410, $1640, $1886
  "63074": [840, 880, 1090, 1410, 1640, 1886],
  "63106": [840, 880, 1090, 1410, 1640, 1886],
  "63107": [840, 880, 1090, 1410, 1640, 1886],
  "63111": [840, 880, 1090, 1410, 1640, 1886],
  "63112": [840, 880, 1090, 1410, 1640, 1886],
  "63113": [840, 880, 1090, 1410, 1640, 1886],
  "63115": [840, 880, 1090, 1410, 1640, 1886],
  "63120": [840, 880, 1090, 1410, 1640, 1886],
  "63121": [840, 880, 1090, 1410, 1640, 1886],
  "63125": [840, 880, 1090, 1410, 1640, 1886],
  "63136": [840, 880, 1090, 1410, 1640, 1886],
  "63140": [840, 880, 1090, 1410, 1640, 1886],
  "63143": [840, 880, 1090, 1410, 1640, 1886],
  // Area 2
  "63147": [860, 890, 1100, 1420, 1640, 1886],
  // Area 3
  "63042": [880, 920, 1130, 1460, 1680, 1932],
  "63044": [880, 920, 1130, 1460, 1680, 1932],
  "63116": [880, 920, 1130, 1460, 1680, 1932],
  // Area 4
  "63118": [900, 930, 1150, 1490, 1710, 1967],
  "63138": [900, 930, 1150, 1490, 1710, 1967],
  // Area 5
  "63133": [920, 950, 1170, 1510, 1740, 2001],
  "63123": [920, 950, 1170, 1510, 1740, 2001],
  "63137": [920, 950, 1170, 1510, 1740, 2001],
  // Area 6
  "63129": [940, 970, 1200, 1550, 1780, 2047],
  "63026": [940, 970, 1200, 1550, 1780, 2047],
  "63109": [940, 970, 1200, 1550, 1780, 2047],
  "63114": [940, 970, 1200, 1550, 1780, 2047],
  // Area 7
  "63033": [980, 1010, 1250, 1620, 1860, 2139],
  "63126": [980, 1010, 1250, 1620, 1860, 2139],
  "63102": [980, 1010, 1250, 1620, 1860, 2139],
  // Area 8
  "63103": [990, 1030, 1270, 1640, 1890, 2174],
  "63119": [990, 1030, 1270, 1640, 1890, 2174],
  // Area 9
  "63139": [1000, 1040, 1280, 1650, 1900, 2184],
  "63135": [1000, 1040, 1280, 1650, 1900, 2184],
  // Area 10
  "63134": [1020, 1050, 1300, 1680, 1930, 2220],
  "63104": [1020, 1050, 1300, 1680, 1930, 2220],
  // Area 11
  "63117": [1060, 1090, 1350, 1740, 2010, 2312],
  "63043": [1060, 1090, 1350, 1740, 2010, 2312],
  // Area 12
  "63110": [1070, 1110, 1370, 1770, 2040, 2346],
  // Area 13
  "63031": [1080, 1120, 1380, 1780, 2050, 2358],
  "63127": [1080, 1120, 1380, 1780, 2050, 2358],
  "63025": [1080, 1120, 1380, 1780, 2050, 2358],
  "63088": [1080, 1120, 1380, 1780, 2050, 2358],
  // Area 14
  "63101": [1130, 1170, 1440, 1860, 2140, 2461],
  "63021": [1130, 1170, 1440, 1860, 2140, 2461],
  "63132": [1130, 1170, 1440, 1860, 2140, 2461],
  "63122": [1130, 1170, 1440, 1860, 2140, 2461],
  // Area 15
  "63146": [1150, 1190, 1470, 1900, 2180, 2507],
  // Area 16
  "63040": [1240, 1290, 1590, 2050, 2360, 2714],
  // Area 17
  "63017": [1280, 1330, 1640, 2120, 2440, 2806],
  // Area 18
  "63144": [1300, 1340, 1660, 2140, 2470, 2841],
  // Area 19
  "63108": [1350, 1400, 1730, 2240, 2570, 2956],
  // Area 20
  "63011": [1420, 1470, 1820, 2350, 2700, 3105],
  "63034": [1420, 1470, 1820, 2350, 2700, 3105],
  "63124": [1420, 1470, 1820, 2350, 2700, 3105],
  // Legacy entries for 63130 (not in new PDF, keeping previous value)
  "63130": [1070, 1110, 1370, 1770, 2040, 2346],
};

// Market Rent Comps by ZIP (2BR, 3BR, 4BR)
export const RENT_COMPS_BY_ZIP: Record<string, { bed2: number; bed3: number; bed4: number }> = {
  "63031": { bed2: 1450, bed3: 1650, bed4: 1900 },
  "63033": { bed2: 1300, bed3: 1600, bed4: 1850 },
  "63034": { bed2: 1450, bed3: 1700, bed4: 1950 },
  "63042": { bed2: 1300, bed3: 1600, bed4: 1850 },
  "63074": { bed2: 1250, bed3: 1600, bed4: 1800 },
  "63114": { bed2: 1250, bed3: 1600, bed4: 1800 },
  "63130": { bed2: 1350, bed3: 1650, bed4: 1900 },
  "63132": { bed2: 1400, bed3: 1650, bed4: 1950 },
  "63133": { bed2: 1200, bed3: 1500, bed4: 1700 },
  "63134": { bed2: 1300, bed3: 1550, bed4: 1850 },
  "63135": { bed2: 1350, bed3: 1550, bed4: 1850 },
  "63136": { bed2: 1100, bed3: 1400, bed4: 1650 },
  "63137": { bed2: 1200, bed3: 1500, bed4: 1700 },
  "63138": { bed2: 1200, bed3: 1500, bed4: 1700 },
  "63121": { bed2: 1100, bed3: 1400, bed4: 1650 },
};

// Full Utility Allowance Breakdown by bedroom count (HASLC Single Family 2025)
// Source: HUD Form-52667 dated 01/01/2025
// Index: 0=Studio, 1=1BR, 2=2BR, 3=3BR, 4=4BR, 5=5BR, 6=6BR
export const UTILITY_BREAKDOWN = {
  cookingElectric:     [7, 9, 12, 15, 19, 22, 24],
  cookingNaturalGas:   [5, 7, 8, 11, 13, 15, 17],
  heatingElectric:     [41, 41, 52, 64, 81, 93, 105],
  heatingNaturalGas:   [54, 67, 80, 92, 113, 124, 138],
  otherElectric:       [30, 38, 46, 54, 66, 74, 82],
  range:               [4, 4, 4, 4, 4, 4, 4],
  refrigerator:        [6, 6, 6, 6, 6, 6, 6],
  sewer:               [45, 51, 65, 84, 111, 124, 150],
  trash:               [14, 14, 14, 14, 14, 14, 14],
  waterCity:           [14, 17, 21, 28, 37, 41, 50],
  waterCounty:         [23, 29, 41, 60, 85, 97, 122],
  waterHeatingElectric:[18, 25, 32, 39, 50, 47, 53],
  waterHeatingNaturalGas:[11, 14, 19, 24, 29, 34, 38],
};

// Default Utility Allowances (pre-calculated with common setup)
// Assumes: Natural Gas Heating, Electric Cooking, Other Electric, Water County, Sewer, Trash
export const UTILITY_ALLOWANCES: Record<number, number> = {
  0: 173, // Studio
  1: 208, // 1 BR
  2: 258, // 2 BR
  3: 319, // 3 BR
  4: 408, // 4 BR
  5: 455, // 5 BR
  6: 530, // 6 BR
};

// Calculate custom utility allowance based on selections
export function calculateCustomUtilityAllowance(
  bedrooms: number,
  options: {
    heatingType: 'electric' | 'naturalGas';
    cookingType: 'electric' | 'naturalGas';
    waterType: 'city' | 'county';
    waterHeatingType: 'electric' | 'naturalGas';
    includeRange: boolean;
    includeRefrigerator: boolean;
  }
): number {
  const idx = Math.min(Math.max(bedrooms, 0), 6);
  
  let total = 0;
  
  // Heating
  total += options.heatingType === 'electric' 
    ? UTILITY_BREAKDOWN.heatingElectric[idx] 
    : UTILITY_BREAKDOWN.heatingNaturalGas[idx];
  
  // Cooking
  total += options.cookingType === 'electric'
    ? UTILITY_BREAKDOWN.cookingElectric[idx]
    : UTILITY_BREAKDOWN.cookingNaturalGas[idx];
  
  // Other Electric (always included)
  total += UTILITY_BREAKDOWN.otherElectric[idx];
  
  // Water
  total += options.waterType === 'city'
    ? UTILITY_BREAKDOWN.waterCity[idx]
    : UTILITY_BREAKDOWN.waterCounty[idx];
  
  // Water Heating
  total += options.waterHeatingType === 'electric'
    ? UTILITY_BREAKDOWN.waterHeatingElectric[idx]
    : UTILITY_BREAKDOWN.waterHeatingNaturalGas[idx];
  
  // Sewer & Trash (always included)
  total += UTILITY_BREAKDOWN.sewer[idx];
  total += UTILITY_BREAKDOWN.trash[idx];
  
  // Appliances (if tenant provides)
  if (options.includeRange) total += UTILITY_BREAKDOWN.range[idx];
  if (options.includeRefrigerator) total += UTILITY_BREAKDOWN.refrigerator[idx];
  
  return total;
}

// Helper functions
export function getArvPerSf(zip: string): number | null {
  return ARV_PER_SF[zip] ?? null;
}

export function getFmr(zip: string, bedrooms: number): number | null {
  const fmrArray = FMR_BY_ZIP[zip];
  if (!fmrArray) return null;
  // Clamp bedrooms to valid range (0-5)
  const index = Math.min(Math.max(bedrooms, 0), 5);
  return fmrArray[index] ?? null;
}

export function getRentComp(zip: string, bedrooms: number): number | null {
  const comps = RENT_COMPS_BY_ZIP[zip];
  if (!comps) return null;
  
  if (bedrooms <= 2) return comps.bed2;
  if (bedrooms === 3) return comps.bed3;
  return comps.bed4;
}

export function getUtilityAllowance(bedrooms: number): number {
  return UTILITY_ALLOWANCES[Math.min(Math.max(bedrooms, 0), 6)] ?? UTILITY_ALLOWANCES[3];
}

export function getRepairEstimate(sqft: number, preset: RepairPreset): number {
  return sqft * REPAIR_COSTS_PER_SF[preset];
}

export function calculateArvQuick(zip: string, sqft: number): number | null {
  const arvPerSf = getArvPerSf(zip);
  if (arvPerSf === null) return null;
  return sqft * arvPerSf;
}

// Get list of supported ZIP codes
export function getSupportedZips(): string[] {
  return Object.keys(ARV_PER_SF).sort();
}
