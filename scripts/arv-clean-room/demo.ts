// Demo (market-model estimator, v4): value, support count, step-down and the
// sold comps behind them, as Markdown. v1's figure is shown alongside.
//
//   node scripts/arv-clean-room/demo.ts <mlsNumber> [<mlsNumber> ...] [--asOf=YYYY-MM-DD] [--grade=retail|rental] [--json]
//   env: REPLIERS_API_KEY (required)
import { estimateArv, estimateArvV2, RepliersClient } from "../../supabase/functions/_shared/arv-clean-room/index.ts";
import type { DoctrineComp, DoctrineResult, SupportedLevel } from "../../supabase/functions/_shared/arv-clean-room/index.ts";

const args = process.argv.slice(2);
const mls = args.filter((a) => !a.startsWith("--"));
const asOfArg = args.find((a) => a.startsWith("--asOf="))?.split("=")[1];
const asJson = args.includes("--json");
if (!mls.length) {
  console.error("usage: node scripts/arv-clean-room/demo.ts <mlsNumber>... [--asOf=YYYY-MM-DD] [--grade=retail|rental] [--json]");
  process.exit(1);
}

const client = new RepliersClient({ apiKey: process.env.REPLIERS_API_KEY ?? "" });
const gradeArg = args.find((a) => a.startsWith("--grade="))?.split("=")[1] as "retail" | "rental" | undefined;
const opts = { ...(asOfArg ? { asOf: `${asOfArg}T00:00:00Z` } : {}), ...(gradeArg ? { intendedGrade: gradeArg } : {}) };

const usd = (n: number | null | undefined) => (n === null || n === undefined ? "none" : "$" + Math.round(n).toLocaleString("en-US"));
const ROLE: Record<string, string> = {
  "supports-value": "**supports value**",
  "unconfirmed-high": "lone high sale - does not set value",
  "outlier-excluded": "outlier - excluded",
  "supports-step-down": "supports step-down",
  below: "below",
  "price-screened": "far below the top - distressed market, excluded",
};
const SHAPE: Record<string, string> = {
  "tight-cluster": "3+ comps clustered at the top -> low end of the cluster",
  "top-two": "two comps agree at the top -> between them",
  none: "none",
};

function compRow(c: DoctrineComp): string {
  const s = c.comp;
  const price = c.adjustments.length ? `${usd(s.soldPrice)} -> ${usd(c.price)} (${c.adjustments.join("; ")})` : usd(s.soldPrice);
  return `| ${ROLE[c.role]} | ${s.mlsNumber} | ${s.address} | ${c.distanceMiles.toFixed(2)} | ${s.contractDate} | ${price} | ${s.sqft} | ${s.beds ?? "?"}/${s.baths ?? "?"} | ${s.hasBasement === null ? "?" : s.hasBasement ? "yes" : "no"} | ${c.styleMatch ? "match" : "differs"} (${s.levels ?? "?"}) | ${s.schoolDistrict ?? "?"}${c.districtMatch ? "" : " (differs)"} | ${s.yearBuilt ?? "?"} | ${c.condition.signals.join("; ") || "no condition signals"} |`;
}
const level = (l: SupportedLevel) =>
  `${usd(l.value)} (${l.supportCount} comps; ${SHAPE[l.shape]}${l.deficits.length ? `; read at ${usd(l.anchor)}, then ${l.deficits.join("; ")}` : ""})`;

function render(r: DoctrineResult, v1: string, v2: string): string {
  const s = r.subject;
  const out: string[] = [];
  out.push(`### ${s.address} (MLS# ${s.mlsNumber})`, "");
  out.push(`Subject: ${s.sqft ?? "?"} sq ft, ${s.beds ?? "?"} bd / ${s.baths ?? "?"} ba, basement ${s.hasBasement === null ? "unknown" : s.hasBasement ? "yes" : "no"}, levels ${s.levels ?? "unknown"}, school district ${s.schoolDistrict ?? "unknown"}, garage spaces ${s.garageSpaces ?? "unknown"}, built ${s.yearBuilt ?? "?"}; list price ${usd(s.listPrice)}.`, "");
  out.push("| | |", "|---|---|");
  out.push(`| **Value (ARV)** | **${r.value === null ? "No supported value" : usd(r.value)}** |`);
  out.push(`| **Support count** | **${r.supportCount}** |`);
  out.push(`| **Step-down value** | **${r.stepDown ? level(r.stepDown) : "none - no supported level below"}** |`);
  out.push(`| Loan-math basis | ${usd(r.loanBasis.value)} - ${r.loanBasis.reason} |`);
  if (r.top) out.push(`| How the value was read | ${level(r.top)} |`);
  if (r.noValueReason) out.push(`| Why no value | ${r.noValueReason} |`);
  if (r.gradeReads) {
    const g = (x: { value: number | null; supportCount: number; reason: string | null }) => (x.value === null ? `not supported (${x.reason})` : `${usd(x.value)} (${x.supportCount} comps)`);
    out.push(`| Retail-grade read (renovated sales only) - EXPERIMENTAL | ${g(r.gradeReads.retail)} |`);
    out.push(`| Rental-grade read (non-renovated saleable sales only) - EXPERIMENTAL | ${g(r.gradeReads.rental)} |`);
  }
  out.push(`| Highest sale in the comp set | ${usd(r.observedCeiling)} |`);
  out.push(`| Comp ladder | ${r.ladder.map((l) => `${l.label}: ${l.goodComps} good${l.outliersExcluded ? ` (+${l.outliersExcluded} outlier)` : ""}${l.priceScreened ? ` (+${l.priceScreened} price-screened)` : ""}`).join(" -> ")} |`);
  out.push(`| Populations | ${r.populations.poolSize} sales retrieved; ${r.populations.distressedExcluded} distressed excluded, ${r.populations.saleable} saleable |`);
  out.push(`| Previous revision (v3), from demo-output-v3.md | ${v2} |`);
  out.push(`| v1 (similarity-weighted median) | ${v1} |`);
  for (const n of [...r.notes, ...r.diagnostics.warnings]) out.push(`\n> Note: ${n}`);
  out.push("", `Comp set used (${r.stepUsed?.label ?? "widest step"}), highest first:`, "");
  if (r.comps.length) {
    out.push("| Role | MLS# | Address | Miles | Contract date | Sold price | Sq ft (above grade) | Bd/Ba | Bsmt | Storeys | School district | Built | Condition evidence |", "|---|---|---|---|---|---|---|---|---|---|---|---|---|");
    for (const c of r.comps) out.push(compRow(c));
  } else out.push("_No good comps._");
  out.push("", `<details><summary>Context only - different bedroom count (${r.contextComps.length}); never used for the value, support count or step-down</summary>\n`);
  out.push("| MLS# | Address | Miles | Contract date | Sold price | Sq ft | Bd/Ba |", "|---|---|---|---|---|---|---|");
  for (const c of r.contextComps.slice(0, 10)) out.push(`| ${c.comp.mlsNumber} | ${c.comp.address} | ${c.distanceMiles.toFixed(2)} | ${c.comp.contractDate} | ${usd(c.comp.soldPrice)} | ${c.comp.sqft} | ${c.comp.beds}/${c.comp.baths} |`);
  out.push("\n</details>");
  const d = r.populations.distressedNearby.slice(0, 10);
  out.push("", `<details><summary>Distressed sales excluded within the search radius (${r.populations.distressedNearby.length})</summary>\n`);
  out.push("| MLS# | Address | Miles | Sold price | Why distressed |", "|---|---|---|---|---|");
  for (const x of d) out.push(`| ${x.comp.mlsNumber} | ${x.comp.address} | ${x.distanceMiles.toFixed(2)} | ${usd(x.comp.soldPrice)} | ${x.signals.join("; ")} |`);
  out.push("\n</details>\n");
  return out.join("\n");
}

// Previous revision's committed figures for the five demo listings (docs/arv-clean-room/demo-output-v3.md).
const V2_PRIOR: Record<string, string> = {
  "26072345": "no supported value",
  "26068301": "no supported value",
  "26068309": "$253,500, support 2, step-down $242,500",
  "26071667": "no supported value",
  "26068087": "$149,500, support 3, no step-down",
};
const results: unknown[] = [];
for (const mlsNumber of mls) {
  try {
    const r = await estimateArvV2(client, { mlsNumber }, opts);
    const v1 = await estimateArv(client, { mlsNumber }, opts);
    const v1Text = v1.arv === null ? "n/a" : `${usd(v1.arv)} (range ${usd(v1.arvLow)} - ${usd(v1.arvHigh)})`;
    if (asJson) results.push(r);
    else console.log(render(r, v1Text, V2_PRIOR[mlsNumber] ?? "not run"));
  } catch (e) {
    console.log(`### ${mlsNumber}\n\nError: ${e instanceof Error ? e.message : String(e)}\n`);
  }
}
if (asJson) console.log(JSON.stringify(results, null, 2));
