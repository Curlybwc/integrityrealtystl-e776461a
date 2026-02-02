// St. Louis Area ZIP Codes by County
// Comprehensive list for St. Louis City, St. Louis County, St. Charles County, and Jefferson County

export interface ZipCodeInfo {
  zip: string;
  county: string;
}

export const STL_ZIP_CODES: ZipCodeInfo[] = [
  // St. Louis City
  { zip: "63101", county: "St. Louis City" },
  { zip: "63102", county: "St. Louis City" },
  { zip: "63103", county: "St. Louis City" },
  { zip: "63104", county: "St. Louis City" },
  { zip: "63106", county: "St. Louis City" },
  { zip: "63107", county: "St. Louis City" },
  { zip: "63108", county: "St. Louis City" },
  { zip: "63109", county: "St. Louis City" },
  { zip: "63110", county: "St. Louis City" },
  { zip: "63111", county: "St. Louis City" },
  { zip: "63112", county: "St. Louis City" },
  { zip: "63113", county: "St. Louis City" },
  { zip: "63115", county: "St. Louis City" },
  { zip: "63116", county: "St. Louis City" },
  { zip: "63118", county: "St. Louis City" },
  { zip: "63120", county: "St. Louis City" },
  { zip: "63139", county: "St. Louis City" },
  { zip: "63147", county: "St. Louis City" },

  // St. Louis County
  { zip: "63005", county: "St. Louis County" },
  { zip: "63011", county: "St. Louis County" },
  { zip: "63017", county: "St. Louis County" },
  { zip: "63021", county: "St. Louis County" },
  { zip: "63025", county: "St. Louis County" },
  { zip: "63026", county: "St. Louis County" },
  { zip: "63031", county: "St. Louis County" },
  { zip: "63033", county: "St. Louis County" },
  { zip: "63034", county: "St. Louis County" },
  { zip: "63040", county: "St. Louis County" },
  { zip: "63042", county: "St. Louis County" },
  { zip: "63043", county: "St. Louis County" },
  { zip: "63044", county: "St. Louis County" },
  { zip: "63074", county: "St. Louis County" },
  { zip: "63088", county: "St. Louis County" },
  { zip: "63114", county: "St. Louis County" },
  { zip: "63117", county: "St. Louis County" },
  { zip: "63119", county: "St. Louis County" },
  { zip: "63121", county: "St. Louis County" },
  { zip: "63122", county: "St. Louis County" },
  { zip: "63123", county: "St. Louis County" },
  { zip: "63124", county: "St. Louis County" },
  { zip: "63125", county: "St. Louis County" },
  { zip: "63126", county: "St. Louis County" },
  { zip: "63127", county: "St. Louis County" },
  { zip: "63128", county: "St. Louis County" },
  { zip: "63129", county: "St. Louis County" },
  { zip: "63130", county: "St. Louis County" },
  { zip: "63131", county: "St. Louis County" },
  { zip: "63132", county: "St. Louis County" },
  { zip: "63133", county: "St. Louis County" },
  { zip: "63134", county: "St. Louis County" },
  { zip: "63135", county: "St. Louis County" },
  { zip: "63136", county: "St. Louis County" },
  { zip: "63137", county: "St. Louis County" },
  { zip: "63138", county: "St. Louis County" },
  { zip: "63140", county: "St. Louis County" },
  { zip: "63141", county: "St. Louis County" },
  { zip: "63143", county: "St. Louis County" },
  { zip: "63144", county: "St. Louis County" },
  { zip: "63146", county: "St. Louis County" },

  // St. Charles County
  { zip: "63301", county: "St. Charles County" },
  { zip: "63302", county: "St. Charles County" },
  { zip: "63303", county: "St. Charles County" },
  { zip: "63304", county: "St. Charles County" },
  { zip: "63341", county: "St. Charles County" },
  { zip: "63348", county: "St. Charles County" },
  { zip: "63366", county: "St. Charles County" },
  { zip: "63367", county: "St. Charles County" },
  { zip: "63368", county: "St. Charles County" },
  { zip: "63373", county: "St. Charles County" },
  { zip: "63376", county: "St. Charles County" },
  { zip: "63385", county: "St. Charles County" },
  { zip: "63386", county: "St. Charles County" },

  // Jefferson County
  { zip: "63010", county: "Jefferson County" },
  { zip: "63012", county: "Jefferson County" },
  { zip: "63016", county: "Jefferson County" },
  { zip: "63019", county: "Jefferson County" },
  { zip: "63020", county: "Jefferson County" },
  { zip: "63028", county: "Jefferson County" },
  { zip: "63036", county: "Jefferson County" },
  { zip: "63048", county: "Jefferson County" },
  { zip: "63049", county: "Jefferson County" },
  { zip: "63050", county: "Jefferson County" },
  { zip: "63051", county: "Jefferson County" },
  { zip: "63052", county: "Jefferson County" },
  { zip: "63053", county: "Jefferson County" },
  { zip: "63057", county: "Jefferson County" },
  { zip: "63069", county: "Jefferson County" },
  { zip: "63070", county: "Jefferson County" },
  { zip: "63071", county: "Jefferson County" },
];

// Get all unique counties
export const COUNTIES = ["St. Louis City", "St. Louis County", "St. Charles County", "Jefferson County"] as const;

// Get ZIP codes by county
export function getZipsByCounty(county: string): ZipCodeInfo[] {
  return STL_ZIP_CODES.filter(z => z.county === county);
}

// Search ZIP codes
export function searchZipCodes(query: string): ZipCodeInfo[] {
  const q = query.toLowerCase().trim();
  if (!q) return STL_ZIP_CODES;
  return STL_ZIP_CODES.filter(
    z => z.zip.startsWith(q) || z.county.toLowerCase().includes(q)
  );
}
