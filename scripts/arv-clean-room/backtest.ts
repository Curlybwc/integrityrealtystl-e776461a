/* eslint-disable @typescript-eslint/no-explicit-any -- Repliers/MLS payloads are untyped JSON */
// Backtest of the market-model estimator (third revision) on the SAME 96
// subjects as the previous run: the subject list is read from the committed
// docs/arv-clean-room/backtest-output-v2.md, not re-selected. Those subjects
// were originally picked by v1's own condition classifier ("renovated") — this
// is circular, see README. Each is valued as of its own contract date with
// itself excluded, and compared with what it actually sold for.
// Columns: v1 (re-run live), v2 (previous revision, figures from the committed
// file), v3 (this revision, run live).
//
//   node scripts/arv-clean-room/backtest.ts [key=value v3 options]
//   env: REPLIERS_API_KEY (required), QUIET=1
import { readFileSync } from "node:fs";
import { estimateArv, estimateArvV2, RepliersClient } from "../../supabase/functions/_shared/arv-clean-room/index.ts";
import { normalizeSold } from "../../supabase/functions/_shared/arv-clean-room/engine.ts";

const opts: Record<string, number | boolean> = {};
for (const a of process.argv.slice(2)) {
  const [k, v] = a.split("=");
  opts[k] = v === "true" ? true : v === "false" ? false : Number(v);
}
const money = (t: string) => (/^\$/.test(t.trim()) ? Number(t.replace(/[$,]/g, "")) : null);
const prior = readFileSync(new URL("../../docs/arv-clean-room/backtest-output-v2.md", import.meta.url), "utf8")
  .split("\n").map((l) => l.split("|").map((c) => c.trim())).filter((c) => /^\d{8}$/.test(c[2] ?? ""))
  .map((c) => ({ area: c[1], mls: c[2], v2prev: money(c[7]), v2prevStep: c[12] }));
const AREAS = [...new Set(prior.map((p) => p.area))];

const client = new RepliersClient({ apiKey: process.env.REPLIERS_API_KEY ?? "" });
const rows: any[] = [];
const missing: string[] = [];

for (const p of prior) {
  const listing = await client.getListing(p.mls);
  const s = listing ? normalizeSold(listing) : null;
  if (!s) {
    missing.push(p.mls);
    continue;
  }
  const asOf = s.contractDate + "T00:00:00Z";
  const v1 = await estimateArv(client, { overrides: s }, { asOf });
  const v3 = await estimateArvV2(client, { overrides: s }, { ...opts, asOf });
  rows.push({
    area: p.area, mls: s.mlsNumber, address: s.address, net: s.soldPrice - s.concessions, gross: s.soldPrice,
    bedBath: `${s.beds ?? "?"}/${s.baths ?? "?"}`,
    v1: v1.arv, v2prev: p.v2prev, v3: v3.value, support: v3.supportCount, stepDown: v3.stepDown?.value ?? null,
    loan: v3.loanBasis.value, ceiling: v3.observedCeiling,
    step: v3.stepUsed?.label ?? "no step reached 3 good comps",
    why: v3.noValueReason, screened: v3.stepUsed?.priceScreened ?? 0,
    best: Math.max(0, ...v3.ladder.map((l) => l.goodComps)),
  });
}

const pct = (x: number) => (x * 100).toFixed(1) + "%";
const usd = (n: number | null) => (n === null ? "none" : "$" + Math.round(n).toLocaleString("en-US"));
const med = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? (s[(s.length - 1) >> 1] + s[s.length >> 1]) / 2 : NaN;
};
/** Error stats of `est` against `target` over rows where est is present. */
function stats(label: string, rs: any[], est: string, target = "net") {
  const ok = rs.filter((r) => r[est] !== null);
  if (!ok.length) return console.log(`${label}: n=${rs.length}, none valued`);
  const e = ok.map((r) => r[est] / r[target] - 1);
  const abs = e.map(Math.abs);
  console.log(
    `${label}: valued ${ok.length}/${rs.length} | median abs err ${pct(med(abs))} | median signed ${pct(med(e))}` +
      ` | within 10%: ${pct(abs.filter((a) => a <= 0.1).length / ok.length)} | within 20%: ${pct(abs.filter((a) => a <= 0.2).length / ok.length)}` +
      ` | over by >10%: ${pct(e.filter((x) => x > 0.1).length / ok.length)} | under by >10%: ${pct(e.filter((x) => x < -0.1).length / ok.length)}`,
  );
}

if (!process.env.QUIET) {
  console.log("| Area | MLS# | Address | Bd/Ba | Actual sold (gross) | Net of concessions | v1 ARV | v2 value (previous) | v3 value | Support | v3 step-down | v3 loan basis | v3 err vs net | Ladder step |");
  console.log("|---|---|---|---|---|---|---|---|---|---|---|---|---|---|");
  for (const r of rows) {
    console.log(`| ${r.area} | ${r.mls} | ${r.address} | ${r.bedBath} | ${usd(r.gross)} | ${usd(r.net)} | ${usd(r.v1)} | ${r.v2prev === null ? "no supported value" : usd(r.v2prev)} | ${r.v3 === null ? "no supported value" : usd(r.v3)} | ${r.support} | ${usd(r.stepDown)} | ${usd(r.loan)} | ${r.v3 === null ? "n/a" : pct(r.v3 / r.net - 1)} | ${r.step} |`);
  }
  console.log();
}
if (missing.length) console.log(`Subjects not found in Repliers this run: ${missing.join(", ")}\n`);

const valued = rows.filter((r) => r.v3 !== null);
console.log("== Headline (target = actual sale net of concessions, as before) ==");
stats("v1, all subjects", rows, "v1");
stats("v2 (previous revision), all subjects", rows, "v2prev");
stats("v3 (this revision), all subjects", rows, "v3");
stats("v1, only subjects v3 valued", valued, "v1");
stats("v2 (previous), only subjects v3 valued", valued, "v2prev");
console.log("\n== v3 against the gross sold price ==");
stats("v3 value vs gross", rows, "v3", "gross");
console.log("\n== v3 loan basis and step-down ==");
stats("v3 loan basis", rows, "loan");
stats("v3 step-down", rows, "stepDown");
console.log("\n== v3 by support count ==");
stats("support = 2", rows.filter((r) => r.support === 2), "v3");
stats("support >= 3", rows.filter((r) => r.support >= 3), "v3");
console.log("\n== v3 per ladder step: coverage and error ==");
const baseOf = (st: string) => st.replace(/, (style-matched|any style)$/, "");
for (const st of [...new Set(rows.map((r) => r.step))].sort()) stats(st, rows.filter((r) => r.step === st), "v3");
console.log("-- same, style sub-steps combined --");
for (const st of [...new Set(rows.map((r) => baseOf(r.step)))].sort()) stats(st, rows.filter((r) => baseOf(r.step) === st), "v3");
console.log("-- style-matched vs any style --");
stats("style-matched sub-steps", rows.filter((r) => /style-matched$/.test(r.step)), "v3");
stats("any-style sub-steps", rows.filter((r) => /any style$/.test(r.step)), "v3");
console.log("\n== v3 coverage and ceiling ==");
const none = rows.filter((r) => r.v3 === null);
console.log(`no supported value: ${none.length}/${rows.length} (${none.filter((r) => /Fewer/.test(r.why ?? "")).length} too few good comps, ${none.filter((r) => /agree/.test(r.why ?? "")).length} no two comps agree)`);
const few = none.filter((r) => /Fewer/.test(r.why ?? ""));
console.log(`of the too-few group, best good-comp count at any step: 0 comps ${few.filter((r) => r.best === 0).length}, 1 comp ${few.filter((r) => r.best === 1).length}, 2 comps ${few.filter((r) => r.best === 2).length}`);
console.log(`valuations where the relative-price screen removed at least one sale: ${valued.filter((r) => r.screened > 0).length}/${valued.length}`);
const withCeil = valued.filter((r) => r.ceiling !== null);
console.log(`valued subjects that sold above the highest non-outlier comp: ${withCeil.filter((r) => r.gross > r.ceiling).length}/${withCeil.length}; by more than $15K: ${withCeil.filter((r) => r.gross > r.ceiling + 15000).length}/${withCeil.length}`);
console.log("\n== by area (v3 | v2 previous | v1) ==");
for (const a of AREAS) {
  const rs = rows.filter((r) => r.area === a);
  if (!rs.length) continue;
  stats(`  ${a} v3`, rs, "v3");
  stats(`  ${a} v2 (previous)`, rs, "v2prev");
  stats(`  ${a} v1`, rs, "v1");
}
console.log(`\nRepliers requests: ${client.calls} for ${rows.length} subjects (subject lookup + v1 + v3)`);
