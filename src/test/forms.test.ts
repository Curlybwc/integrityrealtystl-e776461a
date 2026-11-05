import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  FORM_CATEGORIES,
  FORM_LIBRARY,
  formFileUrl,
  formsByCategory,
} from "@/lib/forms";

const FORMS_DIR = path.resolve(__dirname, "../../public/forms");

describe("SLAR forms library manifest (Packet INT-07.06-3)", () => {
  it("carries the full uploaded set — 19 forms", () => {
    expect(FORM_LIBRARY).toHaveLength(19);
  });

  it("every manifest entry points at a real file on disk", () => {
    for (const form of FORM_LIBRARY) {
      expect(existsSync(path.join(FORMS_DIR, form.file)), form.file).toBe(true);
      expect(formFileUrl(form)).toBe(`/forms/${form.file}`);
    }
  });

  it("every PDF stored in public/forms is in the manifest exactly once", () => {
    const onDisk = readdirSync(FORMS_DIR).filter((f) => f.endsWith(".pdf")).sort();
    const manifested = FORM_LIBRARY.map((f) => f.file).sort();
    expect(manifested).toEqual(onDisk);
    expect(new Set(FORM_LIBRARY.map((f) => f.id)).size).toBe(FORM_LIBRARY.length);
  });

  it("names and numbers: every entry is named and categorized; SLAR numbers match the issued forms", () => {
    for (const form of FORM_LIBRARY) {
      expect(form.name.length).toBeGreaterThan(3);
      expect(FORM_CATEGORIES).toContain(form.category);
    }
    const byId = new Map(FORM_LIBRARY.map((f) => [f.id, f]));
    expect(byId.get("slar-2090")?.slarNumber).toBe("2090");
    expect(byId.get("slar-2164")?.slarNumber).toBe("2164");
    expect(byId.get("slar-2125")?.slarNumber).toBe("2125");
    expect(byId.get("slar-2125a")?.slarNumber).toBe("2125a");
    expect(byId.get("slar-2096b")?.slarNumber).toBe("2096b");
    expect(byId.get("slar-2135-fha")?.slarNumber).toBe("2135 FHA");
    expect(byId.get("slar-2135-va")?.slarNumber).toBe("2135 VA");
    // Forms that carry no SLAR number must not be given one.
    expect(byId.get("special-sale-contract-blank")?.slarNumber).toBeNull();
    expect(byId.get("lien-waiver-nois")?.slarNumber).toBeNull();
  });

  it("keeps the two distinct SLAR 2047 listing contracts as separate entries", () => {
    const listing = formsByCategory("Listing");
    expect(listing).toHaveLength(2);
    expect(listing.map((f) => f.file)).toEqual([
      "slar-2047-listing-contract-exclusive-right-to-sell.pdf",
      "slar-2047-listing-contract-limited-agency.pdf",
    ]);
    expect(listing.every((f) => f.slarNumber === "2047")).toBe(true);
  });

  it("groups the library by job, with every category populated", () => {
    for (const category of FORM_CATEGORIES) {
      expect(formsByCategory(category).length, category).toBeGreaterThan(0);
    }
    expect(formsByCategory("Sale Contracts & Riders")).toHaveLength(9);
    expect(formsByCategory("Buyer Agency")).toHaveLength(2);
    expect(formsByCategory("Disclosures & Notices")).toHaveLength(5);
  });
});
