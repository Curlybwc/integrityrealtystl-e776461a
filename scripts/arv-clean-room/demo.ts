// Demo: ARV + the sold comps behind it, as Markdown, for real Repliers listings.
//
//   node scripts/arv-clean-room/demo.ts <mlsNumber> [<mlsNumber> ...] [--asOf=YYYY-MM-DD] [--json]
//   env: REPLIERS_API_KEY (required)
import { RepliersClient, estimateArvBatch } from "../../supabase/functions/_shared/arv-clean-room/index.ts";
import type { ArvResult, ScoredComp } from "../../supabase/functions/_shared/arv-clean-room/index.ts";

const args = process.argv.slice(2);
const mls = args.filter((a) => !a.startsWith("--"));
const asOfArg = args.find((a) => a.startsWith("--asOf="))?.split("=")[1];
const asJson = args.includes("--json");
if (!mls.length) {
  console.error("usage: node scripts/arv-clean-room/demo.ts <mlsNumber>... [--asOf=YYYY-MM-DD] [--json]");
  process.exit(1);
}

const client = new RepliersClient({ apiKey: process.env.REPLIERS_API_KEY ?? "" });
const results = await estimateArvBatch(
  client,
  mls.map((mlsNumber) => ({ mlsNumber })),
  asOfArg ? { asOf: `${asOfArg}T00:00:00Z` } : {},
);

const usd = (n: number | null) => (n === null ? "n/a" : "$" + Math.round(n).toLocaleString("en-US"));
const mi = (km: number) => (km * 0.621371).toFixed(2);

function compRow(s: ScoredComp): string {
  const c = s.comp;
  const adj = s.adjustments.map((a) => `${a.label} (${a.factor >= 1 ? "+" : ""}${((a.factor - 1) * 100).toFixed(1)}%)`).join("; ") || "none";
  return `| ${c.mlsNumber} | ${c.address} | ${mi(s.distanceKm)} | ${c.contractDate} | ${usd(c.soldPrice)} | ${c.sqft} | ${c.beds ?? "?"}/${c.baths ?? "?"} | ${c.yearBuilt ?? "?"} | ${s.condition.tier} (${s.condition.score}) | ${s.similarity.toFixed(0)} | ${usd(s.adjustedPrice)} | ${adj} |`;
}
const HEAD = "| MLS# | Address | Miles | Contract date | Sold price | Sqft | Bd/Ba | Built | Condition (score) | Similarity | Adjusted to subject | Adjustments |\n|---|---|---|---|---|---|---|---|---|---|---|---|";

function render(r: ArvResult): string {
  const s = r.subject;
  const out: string[] = [];
  out.push(`### ${s.address} (MLS# ${s.mlsNumber})`);
  out.push("");
  out.push(`Subject: ${s.sqft ?? "?"} sqft, ${s.beds ?? "?"} bd / ${s.baths ?? "?"} ba, built ${s.yearBuilt ?? "?"}, ${s.style}; list price ${usd(s.listPrice)}.`);
  out.push("");
  out.push(`**ARV: ${usd(r.arv)}** (range ${usd(r.arvLow)} - ${usd(r.arvHigh)}; ${r.arvPerSqft ? "$" + r.arvPerSqft + "/sqft" : ""}) - method \`${r.method}\`, confidence ${r.confidence}/100, valued as of ${r.asOf.slice(0, 10)}.`);
  out.push("");
  out.push(`Market context: ${r.market.eligible} eligible sales examined (${r.market.tierCounts.renovated} renovated / ${r.market.tierCounts.average} average / ${r.market.tierCounts.distressed} distressed); median as-sold price of non-distressed sales ${r.market.medianPricePerSqft ? "$" + r.market.medianPricePerSqft + "/sqft" : "n/a"}; trend ${(r.market.monthlyTrend * 100).toFixed(2)}%/mo; ${r.diagnostics.apiCalls} Repliers calls.`);
  for (const n of [...r.confidenceNotes, ...r.diagnostics.warnings]) out.push(`\n> Note: ${n}`);
  out.push("");
  out.push(`Selected sold comps (${r.selectedComps.length}):`);
  out.push("");
  out.push(HEAD);
  for (const c of r.selectedComps) out.push(compRow(c));
  out.push("");
  out.push("Why each selected comp was classed as it was:");
  for (const c of r.selectedComps) out.push(`- ${c.comp.mlsNumber}: ${c.condition.signals.join("; ") || "no condition signals"}`);
  out.push("");
  out.push("<details><summary>Next-best sales considered but not used</summary>\n");
  out.push(HEAD);
  for (const c of r.otherComps.slice(0, 8)) out.push(compRow(c));
  out.push("\n</details>\n");
  return out.join("\n");
}

if (asJson) console.log(JSON.stringify(results, null, 2));
else for (const r of results) console.log("error" in r ? `### ${r.input.mlsNumber}\n\nError: ${r.error}\n` : render(r));
