import { describe, expect, it } from "vitest";
import { unzipSync, zipSync } from "fflate";
import { buildSoldExport } from "../../supabase/functions/_shared/sold-export";
import type { SoldRow } from "../../supabase/functions/_shared/sold-report";

const row: SoldRow = {
  address: '123 Main, "Suite A"\nSecond line', city: "St. Charles", state: "MO",
  zip: "01234", soldDate: "2026-10-18", mlsNumber: "MLS1",
};
const exportFile = (rows: SoldRow[], format: "xlsx" | "csv") =>
  buildSoldExport(rows, "St. Charles County", "2026-09-19", "2026-10-18", format, zipSync);

describe("sold report files", () => {
  it("exports exact columns with CSV quoting, UTF-8, and formula protection", () => {
    const file = exportFile([row, { ...row, address: "  =HYPERLINK(\"bad\")", city: "O’Fallon" }], "csv");
    const csv = new TextDecoder().decode(file.bytes);
    expect(file.filename).toBe("sold-st-charles-county-2026-09-19_to_2026-10-18.csv");
    expect(csv).toContain('"Address","City","State","ZIP","Date Sold"\r\n');
    expect(csv).toContain('"123 Main, ""Suite A""\nSecond line"');
    expect(csv).toContain('"\'  =HYPERLINK(""bad"")"');
    expect(csv).toContain('"O’Fallon","MO","01234","2026-10-18"');
    expect(csv).not.toContain("MLS1");
  });

  it("writes a valid XLSX package with strings, preserved ZIPs, and escaped text", () => {
    const file = exportFile([{ ...row, address: '=1+1 & <home>\u0000' }], "xlsx");
    expect(file.filename).toMatch(/\.xlsx$/);
    const zip = unzipSync(file.bytes);
    expect(Object.keys(zip)).toEqual(expect.arrayContaining([
      "[Content_Types].xml", "_rels/.rels", "xl/workbook.xml",
      "xl/_rels/workbook.xml.rels", "xl/worksheets/sheet1.xml", "xl/styles.xml",
    ]));
    const parser = new DOMParser();
    for (const content of Object.values(zip)) {
      expect(parser.parseFromString(new TextDecoder().decode(content), "application/xml").querySelector("parsererror")).toBeNull();
    }
    const sheet = parser.parseFromString(new TextDecoder().decode(zip["xl/worksheets/sheet1.xml"]), "application/xml");
    expect(sheet.querySelector('c[r="D2"]')?.textContent).toBe("01234");
    expect(sheet.querySelector('c[r="D2"]')?.getAttribute("t")).toBe("inlineStr");
    expect(sheet.querySelector('c[r="A2"]')?.textContent).toBe("=1+1 & <home>");
    expect(sheet.querySelectorAll("f")).toHaveLength(0);
    expect(sheet.querySelectorAll("row")).toHaveLength(2);
    expect(sheet.querySelector("autoFilter")?.getAttribute("ref")).toBe("A1:E2");
  });

  it("includes every row in an export rather than just a table preview", () => {
    const file = exportFile(Array.from({ length: 205 }, (_, i) => ({ ...row, address: `Home ${i}` })), "xlsx");
    const sheet = new DOMParser().parseFromString(new TextDecoder().decode(unzipSync(file.bytes)["xl/worksheets/sheet1.xml"]), "application/xml");
    expect(sheet.querySelectorAll("row")).toHaveLength(206);
    expect(sheet.querySelector('c[r="A206"]')?.textContent).toBe("Home 204");
  });
});
