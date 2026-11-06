import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PUBLIC_SEO, SITE_URL, resolveSeo } from "@/lib/seo";

const read = (rel: string) =>
  readFileSync(resolve(process.cwd(), rel), "utf8");

describe("sitemap + robots", () => {
  const sitemap = read("public/sitemap.xml");
  const robots = read("public/robots.txt");

  it("lists every public SEO route on the canonical host", () => {
    for (const path of Object.keys(PUBLIC_SEO)) {
      expect(sitemap).toContain(`<loc>${SITE_URL}${path}</loc>`);
    }
  });

  it("is referenced from robots.txt", () => {
    expect(robots).toContain(`Sitemap: ${SITE_URL}/sitemap.xml`);
  });

  it("contains no auth or portal routes", () => {
    for (const banned of ["/login", "/signup", "/portal", "/admin"]) {
      expect(sitemap).not.toContain(`<loc>${SITE_URL}${banned}`);
    }
  });
});

describe("PUBLIC_SEO table", () => {
  it("has a unique title and description per route", () => {
    const titles = Object.values(PUBLIC_SEO).map((r) => r.title);
    const descriptions = Object.values(PUBLIC_SEO).map((r) => r.description);
    expect(new Set(titles).size).toBe(titles.length);
    expect(new Set(descriptions).size).toBe(descriptions.length);
  });

  it("keys match their canonical paths and titles name the business", () => {
    for (const [key, route] of Object.entries(PUBLIC_SEO)) {
      expect(route.path).toBe(key);
      expect(route.title).toContain("Integrity Realty STL");
      expect(route.description.length).toBeGreaterThan(30);
    }
  });
});

describe("resolveSeo", () => {
  it("marks public routes indexable with a canonical URL", () => {
    const seo = resolveSeo("/sellers");
    expect(seo.indexable).toBe(true);
    expect(seo.canonical).toBe(`${SITE_URL}/sellers`);
    expect(seo.title).toContain("List Your Property");
  });

  it("marks portal and auth routes noindex without a canonical", () => {
    for (const path of ["/portal/investor/deals", "/login", "/admin-login"]) {
      const seo = resolveSeo(path);
      expect(seo.indexable).toBe(false);
      expect(seo.canonical).toBeUndefined();
    }
  });

  it("treats unknown routes as the not-found page", () => {
    const seo = resolveSeo("/definitely-not-a-page");
    expect(seo.indexable).toBe(false);
    expect(seo.title).toContain("Page Not Found");
  });
});

describe("public leads contract", () => {
  it("migration accepts exactly the form kinds the site submits", () => {
    const migration = read(
      "supabase/migrations/20261106120000_public_leads.sql",
    );
    for (const kind of [
      "buyer",
      "investor",
      "seller",
      "sellfast",
      "wholesaler",
      "network_partner",
      "contact",
    ]) {
      expect(migration).toContain(`'${kind}'`);
    }
    // Anonymous visitors can submit but never read.
    expect(migration).toContain("GRANT INSERT ON public.public_leads TO anon");
    expect(migration).not.toMatch(/GRANT SELECT[^;]*TO anon/);
  });
});
