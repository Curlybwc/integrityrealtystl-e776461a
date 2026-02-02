// St. Louis Area ZIP Code Data for Deal Analysis
// Data sourced from HUD 2025 Metro FMR and local market analysis

export type RepairPreset = "turnkey" | "light" | "medium" | "heavy" | "fullGut";

export const REPAIR_COSTS_PER_SF: Record<RepairPreset, number> = {
  turnkey: 5,
  light: 15,
  medium: 30,
  heavy: 50,
  fullGut: 75,
};

export const REPAIR_PRESET_LABELS: Record<RepairPreset, string> = {
  turnkey: "Turnkey ($5/sf)",
  light: "Light ($15/sf)",
  medium: "Medium ($30/sf)",
  heavy: "Heavy ($50/sf)",
  fullGut: "Full Gut ($75/sf)",
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

// HUD 2025 Small Area Fair Market Rents (SAFMR) by ZIP and bedroom count
// Index: 0=Studio, 1=1BR, 2=2BR, 3=3BR, 4=4BR
export const FMR_BY_ZIP: Record<string, number[]> = {
  "63031": [1080, 1120, 1380, 1780, 2050],
  "63033": [980, 1010, 1250, 1620, 1860],
  "63034": [1420, 1470, 1820, 2350, 2700],
  "63042": [880, 920, 1130, 1460, 1680],
  "63043": [1060, 1110, 1360, 1760, 2020],
  "63044": [880, 920, 1130, 1460, 1680],
  "63045": [1010, 1050, 1290, 1670, 1920],
  "63074": [850, 880, 1090, 1410, 1640],
  "63114": [950, 990, 1220, 1580, 1810],
  "63120": [840, 880, 1090, 1410, 1640],
  "63121": [840, 880, 1090, 1410, 1640],
  "63130": [1070, 1110, 1370, 1770, 2040],
  "63132": [1130, 1170, 1450, 1840, 2160],
  "63133": [920, 950, 1170, 1510, 1740],
  "63134": [1020, 1050, 1300, 1680, 1930],
  "63135": [1010, 1050, 1290, 1670, 1920],
  "63136": [840, 880, 1090, 1410, 1640],
  "63137": [930, 960, 1190, 1540, 1770],
  "63138": [900, 930, 1150, 1490, 1710],
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

// Utility Allowances by bedroom count (HASLC Single Family 2025)
// Assumes: Natural Gas Heating, Electric Cooking, Other Electric, Water County, Sewer, Trash
// Source: HUD Form-52667 dated 01/01/2025
export const UTILITY_ALLOWANCES: Record<number, number> = {
  0: 168, // Studio: 54+7+30+23+45+14 = 173 (Heating NG + Cooking Elec + Other Elec + Water County + Sewer + Trash)
  1: 199, // 1 BR: 67+9+38+29+51+14 = 208
  2: 246, // 2 BR: 80+12+46+41+65+14 = 258
  3: 315, // 3 BR: 92+15+54+60+84+14 = 319
  4: 421, // 4 BR: 113+19+66+85+111+14 = 408
  5: 467, // 5 BR: 124+22+74+97+124+14 = 455
  6: 535, // 6 BR: 138+24+82+122+150+14 = 530
};

// Helper functions
export function getArvPerSf(zip: string): number | null {
  return ARV_PER_SF[zip] ?? null;
}

export function getFmr(zip: string, bedrooms: number): number | null {
  const fmrArray = FMR_BY_ZIP[zip];
  if (!fmrArray) return null;
  // Clamp bedrooms to valid range (0-4)
  const index = Math.min(Math.max(bedrooms, 0), 4);
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
