/* eslint-disable @typescript-eslint/no-explicit-any -- Repliers/MLS payloads are untyped JSON */
// v4 ablation backtest on the SAME 96 subjects as v2/v3 (list read from the
// committed docs/arv-clean-room/backtest-output-v2.md). Those subjects were
// originally picked by v1's own "renovated" classifier — circular, see README.
// Each is valued as of its own contract date with itself excluded; the target
// is the actual sale net of seller concessions.
//
// Sold pools are fetched ONCE per retrieval basis and cached on disk, so every
// ablation step below runs on identical data and only the named switch differs.
//
//   node scripts/arv-clean-room/backtest.ts
//   env: REPLIERS_API_KEY (needed only when the cache is cold),
//        ARV_CACHE_DIR (default: <os tmp>/arv-clean-room-cache), QUIET=1 (omit per-subject table)
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fetchDoctrinePool, RepliersClient, valueByDoctrine } from "../../supabase/functions/_shared/arv-clean-room/index.ts";
import type { DoctrineOptions, DoctrineValuation, PoolFetch, RetrievalBasis } from "../../supabase/functions/_shared/arv-clean-room/index.ts";
import { MONTHLY_TREND_RATE } from "../../supabase/functions/_shared/arv-clean-room/doctrine.ts";
import { normalizeSold } from "../../supabase/functions/_shared/arv-clean-room/engine.ts";

// ---------- the ablation ----------
interface Config { key: string; label: string; basis: RetrievalBasis; options: DoctrineOptions; compareTo?: string }
const BASE: DoctrineOptions = { styleTermPreference: false, timeAdjust: false, districtPreference: false };
const CONFIGS: Config[] = [
  { key: "S0", label: "v3 as shipped (living-area server band, style-term preference)", basis: "living-area-band", options: { ...BASE, styleTermPreference: true } },
  { key: "S1", label: "S0 + change 1: retrieval basis fix", basis: "above-grade-client", options: { ...BASE, styleTermPreference: true }, compareTo: "S0" },
  { key: "S2", label: "S1 + change 4: settled readings (style term dropped) = BASE", basis: "above-grade-client", options: { ...BASE }, compareTo: "S1" },
  { key: "S3", label: `BASE + change 2: time adjustment ON (${(MONTHLY_TREND_RATE * 100).toFixed(2)}%/month)`, basis: "above-grade-client", options: { ...BASE, timeAdjust: true }, compareTo: "S2" },
  { key: "S4", label: "BASE + change 3: school-district preference ON", basis: "above-grade-client", options: { ...BASE, districtPreference: true }, compareTo: "S2" },
  { key: "S5", label: "BASE + changes 2 and 3 together", basis: "above-grade-client", options: { ...BASE, timeAdjust: true, districtPreference: true }, compareTo: "S2" },
];
/** Final configuration: set after reading S3/S4 — an experiment whose grade worsens is left out. */
const FINAL_KEY = process.env.ARV_FINAL ?? "S3";

// ---------- data: subjects and pools (cached) ----------
const cacheDir = process.env.ARV_CACHE_DIR ?? join(tmpdir(), "arv-clean-room-cache");
mkdirSync(cacheDir, { recursive: true });
const load = <T>(name: string): T | null => (existsSync(join(cacheDir, name)) ? JSON.parse(readFileSync(join(cacheDir, name), "utf8")) : null);
const save = (name: string, v: unknown) => writeFileSync(join(cacheDir, name), JSON.stringify(v));

const prior = readFileSync(new URL("../../docs/arv-clean-room/backtest-output-v2.md", import.meta.url), "utf8")
  .split("\n").map((l) => l.split("|").map((c) => c.trim())).filter((c) => /^\d{8}$/.test(c[2] ?? ""))
  .map((c) => ({ area: c[1], mls: c[2] }));
const AREAS = [...new Set(prior.map((p) => p.area))];

let client: RepliersClient | null = null;
const api = () => (client ??= new RepliersClient({ apiKey: process.env.REPLIERS_API_KEY ?? "", maxRetries: 5 }));

let subjectsRaw = load<Record<string, any>>("subjects.json");
if (!subjectsRaw) {
  subjectsRaw = {};
  for (const p of prior) subjectsRaw[p.mls] = await api().getListing(p.mls);
  save("subjects.json", subjectsRaw);
}
const subjects = prior.map((p) => ({ ...p, s: subjectsRaw![p.mls] ? normalizeSold(subjectsRaw![p.mls]) : null }));
const missing = subjects.filter((x) => !x.s).map((x) => x.mls);

const pools: Record<string, Record<string, PoolFetch>> = {};
for (const basis of ["living-area-band", "above-grade-client"] as RetrievalBasis[]) {
  let m = load<Record<string, PoolFetch>>(`pools-${basis}.json`);
  if (!m) {
    m = {};
    for (const x of subjects) if (x.s) m[x.mls] = await fetchDoctrinePool(api(), x.s, x.s.contractDate + "T00:00:00Z", basis);
    save(`pools-${basis}.json`, m);
  }
  pools[basis] = m;
}

// ---------- run ----------
interface Row {
  area: string; mls: string; address: string; bedBath: string; net: number; gross: number;
  value: number | null; support: number; stepDown: number | null; loan: number | null; step: string; why: string | null;
  retail: number | null; rental: number | null; warn: boolean;
}
function runConfig(c: Config, extra: DoctrineOptions = {}): Row[] {
  const rows: Row[] = [];
  for (const x of subjects) {
    if (!x.s) continue;
    const pool = pools[c.basis][x.mls].listings.map(normalizeSold).filter((p): p is NonNullable<typeof p> => !!p);
    const v: DoctrineValuation = valueByDoctrine({ subject: x.s, pool, options: { ...c.options, ...extra, asOf: x.s.contractDate + "T00:00:00Z" } });
    rows.push({
      area: x.area, mls: x.mls, address: x.s.address, bedBath: `${x.s.beds ?? "?"}/${x.s.baths ?? "?"}`,
      net: x.s.soldPrice - x.s.concessions, gross: x.s.soldPrice,
      value: v.value, support: v.supportCount, stepDown: v.stepDown?.value ?? null, loan: v.loanBasis.value,
      step: v.stepUsed?.label ?? "no step reached 3 good comps", why: v.noValueReason,
      retail: v.gradeReads?.retail.value ?? null, rental: v.gradeReads?.rental.value ?? null, warn: !!v.gradeReads?.overImprovementWarning,
    });
  }
  return rows;
}

const pct = (x: number) => (x * 100).toFixed(1) + "%";
const usd = (n: number | null) => (n === null ? "none" : "$" + Math.round(n).toLocaleString("en-US"));
const med = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? (s[(s.length - 1) >> 1] + s[s.length >> 1]) / 2 : NaN;
};
interface Grade { n: number; valued: number; mae: number; bias: number; w10: number; w20: number }
function grade(rs: Row[], est: keyof Row = "value"): Grade {
  const ok = rs.filter((r) => r[est] !== null);
  const e = ok.map((r) => (r[est] as number) / r.net - 1);
  const abs = e.map(Math.abs);
  return { n: rs.length, valued: ok.length, mae: med(abs), bias: med(e), w10: abs.filter((a) => a <= 0.1).length / (ok.length || 1), w20: abs.filter((a) => a <= 0.2).length / (ok.length || 1) };
}
const fmt = (g: Grade) => (g.valued ? `valued ${g.valued}/${g.n} | median abs err ${pct(g.mae)} | bias (median signed) ${pct(g.bias)} | within 10%: ${pct(g.w10)} | within 20%: ${pct(g.w20)}` : `valued 0/${g.n}`);
const pp = (x: number) => `${x >= 0 ? "+" : ""}${(x * 100).toFixed(1)} pts`;
const delta = (a: Grade, b: Grade) => `valued ${a.valued - b.valued >= 0 ? "+" : ""}${a.valued - b.valued} | median abs err ${pp(a.mae - b.mae)} | bias ${pp(a.bias - b.bias)} | within 10% ${pp(a.w10 - b.w10)}`;

function perStep(rs: Row[]) {
  const base = (st: string) => st.split(", ").slice(0, 3).join(", ");
  for (const st of [...new Set(rs.map((r) => base(r.step)))].sort()) {
    const g = grade(rs.filter((r) => base(r.step) === st));
    console.log(`    ${st}: reached ${g.n} | ${fmt(g)}`);
  }
}

// ---- data checks (the raw/normalized trap, above-grade coverage, district coverage) ----
console.log("== Data checks ==");
console.log(`subjects: ${subjects.length - missing.length}/${prior.length} found${missing.length ? ` (missing: ${missing.join(", ")})` : ""}`);
for (const basis of Object.keys(pools)) {
  const all = Object.values(pools[basis]).flatMap((p) => p.listings);
  const both = all.filter((l) => l?.soldPrice && l?.details && l?.raw && typeof l.raw === "object").length;
  const ag = all.filter((l) => Number(l?.raw?.AboveGradeFinishedAreaSrchSqFt) > 200).length;
  const sd = all.filter((l) => l?.raw?.SchoolDistrict).length;
  const pages = Object.values(pools[basis]).reduce((s, p) => s + p.pagesFetched, 0);
  const warns = Object.values(pools[basis]).flatMap((p) => p.warnings);
  console.log(`${basis}: ${all.length} pool records over ${pages} page requests | carry normalized AND raw: ${both}/${all.length} | above-grade area present: ${ag}/${all.length} | school district present: ${sd}/${all.length} | retrieval warnings: ${warns.length}${warns.length ? ` (${[...new Set(warns)].slice(0, 2).join("; ")})` : ""}`);
}
const sdSubj = subjects.filter((x) => x.s?.schoolDistrict).length;
console.log(`subjects with a school district: ${sdSubj}/${subjects.length - missing.length}`);

// ---- ablation ----
const results: Record<string, Row[]> = {};
console.log("\n== Ablation (target = actual sale net of concessions) ==");
for (const c of CONFIGS) {
  results[c.key] = runConfig(c);
  const g = grade(results[c.key]);
  console.log(`\n${c.key}  ${c.label}`);
  console.log(`  ${fmt(g)}`);
  if (c.compareTo) console.log(`  delta vs ${c.compareTo}: ${delta(g, grade(results[c.compareTo]))}`);
  const none = results[c.key].filter((r) => r.value === null);
  console.log(`  no supported value: ${none.length} (${none.filter((r) => /Fewer/.test(r.why ?? "")).length} too few good comps, ${none.filter((r) => /agree/.test(r.why ?? "")).length} no two comps agree) | support >= 3: ${results[c.key].filter((r) => r.support >= 3).length} | loan basis exists: ${results[c.key].filter((r) => r.loan !== null).length}`);
  console.log("  per ladder step (preference sub-steps combined):");
  perStep(results[c.key]);
  if (c.compareTo) {
    // Like-for-like: subjects valued under both configurations.
    const prev = new Map(results[c.compareTo].map((r) => [r.mls, r]));
    const common = results[c.key].filter((r) => r.value !== null && prev.get(r.mls)?.value != null);
    const changed = common.filter((r) => r.value !== prev.get(r.mls)!.value).length;
    console.log(`  like-for-like on ${common.length} subjects valued by both: this ${fmt(grade(common)).replace(/^valued \S+ \| /, "")}  ||  ${c.compareTo} ${fmt(grade(common.map((r) => prev.get(r.mls)!))).replace(/^valued \S+ \| /, "")}  (${changed} values changed)`);
    const gained = results[c.key].filter((r) => r.value !== null && prev.get(r.mls)?.value == null);
    const lost = results[c.key].filter((r) => r.value === null && prev.get(r.mls)?.value != null);
    console.log(`  newly valued: ${gained.length}${gained.length ? ` (${fmt(grade(gained)).replace(/^valued \S+ \| /, "")})` : ""} | no longer valued: ${lost.length}`);
  }
}

// ---- how often can the district preference act at all? ----
{
  let any = 0, good = 0;
  const base = runConfig(CONFIGS[2]);
  for (const x of subjects) {
    if (!x.s) continue;
    const pool = pools["above-grade-client"][x.mls].listings.map(normalizeSold).filter((p): p is NonNullable<typeof p> => !!p);
    const other = pool.filter((p) => p.schoolDistrict && x.s!.schoolDistrict && p.schoolDistrict.toLowerCase() !== x.s!.schoolDistrict.toLowerCase());
    if (other.length) any++;
    if (other.length && base.find((r) => r.mls === x.mls)?.value != null) good++;
  }
  console.log(`\n== Change 3 reach: subjects with at least one other-district sale in their half-mile pool: ${any}/${subjects.length} (${good} of them valued under BASE) ==`);
}

// ---- sensitivity of the trend rate (reported, not used to pick the constant) ----
console.log("\n== Change 2 sensitivity: other monthly rates (the estimator's constant stays as named) ==");
for (const r of [0.002, 0.006, 0.008]) {
  console.log(`  ${(r * 100).toFixed(1)}%/month: ${fmt(grade(runConfig(CONFIGS[2], { timeAdjust: true, monthlyTrendRate: r })))}`);
}

// ---- change 5: planned-grade targeting ----
const finalCfg = CONFIGS.find((c) => c.key === FINAL_KEY)!;
console.log(`\n== Change 5: planned-grade read (on the final configuration, ${FINAL_KEY}) ==`);
console.log("All 96 subjects were selected because they sold with evidence of renovation, so their actual grade is retail-grade. intendedGrade = retail for all; the rental-grade read cannot be graded on this sample.");
const g5 = runConfig(finalCfg, { intendedGrade: "retail" });
console.log(`  headline value:        ${fmt(grade(g5))}`);
console.log(`  retail-grade read:     ${fmt(grade(g5, "retail"))}`);
console.log(`  delta retail read vs headline: ${delta(grade(g5, "retail"), grade(g5))}`);
const bothG = g5.filter((r) => r.value !== null && r.retail !== null);
console.log(`  like-for-like on ${bothG.length} subjects with both: retail read ${fmt(grade(bothG, "retail")).replace(/^valued \S+ \| /, "")}  ||  headline ${fmt(grade(bothG)).replace(/^valued \S+ \| /, "")}`);
console.log(`  retail read exists but headline does not: ${g5.filter((r) => r.value === null && r.retail !== null).length} | headline exists but retail read does not: ${g5.filter((r) => r.value !== null && r.retail === null).length}`);
console.log(`  rental-grade read exists (ungradeable here): ${g5.filter((r) => r.rental !== null).length}/${g5.length} | both grades readable: ${g5.filter((r) => r.rental !== null && r.retail !== null).length} | over-improvement warnings: ${g5.filter((r) => r.warn).length}`);

// ---- final configuration ----
const fin = results[FINAL_KEY];
console.log(`\n== Final configuration: ${FINAL_KEY}  ${finalCfg.label} ==`);
console.log(`  ${fmt(grade(fin))}`);
console.log("  v3 as reported:  valued 31/96 | median abs err 8.2% | bias (median signed) -4.5% | within 10%: 54.8% | within 20%: 77.4%");
console.log(`  v3 re-run today (S0): ${fmt(grade(results.S0))}`);
console.log(`  loan basis:  ${fmt(grade(fin, "loan"))}`);
console.log(`  step-down:   ${fmt(grade(fin, "stepDown"))}`);
console.log(`  support = 2: ${fmt(grade(fin.filter((r) => r.support === 2)))}`);
console.log(`  support >= 3: ${fmt(grade(fin.filter((r) => r.support >= 3)))}`);
console.log("  by area (final | v3 re-run):");
for (const a of AREAS) console.log(`    ${a}: ${fmt(grade(fin.filter((r) => r.area === a)))}  ||  ${fmt(grade(results.S0.filter((r) => r.area === a)))}`);

if (!process.env.QUIET) {
  const s0 = new Map(results.S0.map((r) => [r.mls, r]));
  console.log("\n| Area | MLS# | Address | Bd/Ba | Net sale | v3 re-run (S0) | Final value | Support | Step-down | Loan basis | Final err | Ladder step |");
  console.log("|---|---|---|---|---|---|---|---|---|---|---|---|");
  for (const r of fin) {
    const p = s0.get(r.mls);
    console.log(`| ${r.area} | ${r.mls} | ${r.address} | ${r.bedBath} | ${usd(r.net)} | ${p?.value == null ? "no supported value" : usd(p.value)} | ${r.value === null ? "no supported value" : usd(r.value)} | ${r.support} | ${usd(r.stepDown)} | ${usd(r.loan)} | ${r.value === null ? "n/a" : pct(r.value / r.net - 1)} | ${r.step} |`);
  }
}
if (client) console.log(`\nRepliers requests this run: ${client.calls}`);
