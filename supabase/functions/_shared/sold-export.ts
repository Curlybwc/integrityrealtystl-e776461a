import { getSoldReportCounty, type SoldRow } from "./sold-report.ts";

export type SoldExportFormat = "xlsx" | "csv";
// Inject the ZIP writer so the same serializer works in Vite and Deno.
export type ZipFiles = (files: Record<string, Uint8Array>) => Uint8Array;

export const SOLD_EXPORT_COLUMNS = ["Address", "City", "State", "ZIP", "Date Sold"] as const;

function values(row: SoldRow): string[] {
  return [row.address, row.city, row.state, row.zip, row.soldDate];
}

function csvCell(value: string): string {
  // Quoting alone does not stop spreadsheet programs from executing formulas.
  // eslint-disable-next-line no-control-regex -- Include leading control bytes in the formula check.
  const safe = /^[\s\u0000-\u001f]*[=+\-@]/u.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

function xml(value: string): string {
  return value
    // eslint-disable-next-line no-control-regex -- XML 1.0 forbids these control bytes.
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffe\uffff]/g, "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function workbook(rows: SoldRow[], zipFiles: ZipFiles): Uint8Array {
  const allRows = [[...SOLD_EXPORT_COLUMNS], ...rows.map(values)];
  const sheetRows = allRows.map((cells, rowIndex) => {
    const rowNumber = rowIndex + 1;
    const cellsXml = cells.map((value, index) => {
      const ref = `${String.fromCharCode(65 + index)}${rowNumber}`;
      // Inline strings preserve ZIPs and prevent formulas in untrusted MLS text.
      return `<c r="${ref}" t="inlineStr"${rowIndex === 0 ? ' s="1"' : ""}><is><t xml:space="preserve">${xml(value)}</t></is></c>`;
    }).join("");
    return `<row r="${rowNumber}">${cellsXml}</row>`;
  }).join("");
  const ns = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
  const files: Record<string, string> = {
    "[Content_Types].xml": `<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`,
    "_rels/.rels": `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    "xl/workbook.xml": `<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="${ns}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Sold homes" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    "xl/_rels/workbook.xml.rels": `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
    "xl/styles.xml": `<?xml version="1.0" encoding="UTF-8"?><styleSheet xmlns="${ns}"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf/></cellStyleXfs><cellXfs count="2"><xf fontId="0" fillId="0" borderId="0" xfId="0"/><xf fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`,
    "xl/worksheets/sheet1.xml": `<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="${ns}"><dimension ref="A1:E${allRows.length}"/><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols><col min="1" max="1" width="42" customWidth="1"/><col min="2" max="2" width="24" customWidth="1"/><col min="3" max="4" width="12" customWidth="1"/><col min="5" max="5" width="16" customWidth="1"/></cols><sheetData>${sheetRows}</sheetData><autoFilter ref="A1:E${allRows.length}"/></worksheet>`,
  };
  const encoder = new TextEncoder();
  return zipFiles(Object.fromEntries(Object.entries(files).map(([name, content]) => [name, new Uint8Array(encoder.encode(content))])));
}

export function buildSoldExport(
  rows: SoldRow[], county: string, fromDate: string, toDate: string,
  format: SoldExportFormat, zipFiles?: ZipFiles,
): { filename: string; contentType: string; bytes: Uint8Array } {
  const { slug } = getSoldReportCounty(county);
  const filename = `sold-${slug}-${fromDate}_to_${toDate}.${format}`;
  if (format === "csv") {
    const csv = [[...SOLD_EXPORT_COLUMNS], ...rows.map(values)]
      .map((cells) => cells.map(csvCell).join(",")).join("\r\n");
    return { filename, contentType: "text/csv; charset=utf-8", bytes: new TextEncoder().encode(`\uFEFF${csv}\r\n`) };
  }
  if (format !== "xlsx" || !zipFiles) throw new Error("An XLSX ZIP writer is required");
  return {
    filename, contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    bytes: workbook(rows, zipFiles),
  };
}
