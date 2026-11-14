# Clean-room ARV method (Repliers sold comps)

Branch `fable/arv-method-clean-room`. Built independently of the existing ARV /
comp / analyzer code — only the Repliers base URL and auth header were taken
from the repo. Not deployed and not wired into the UI.

## What it does

Given a subject (an MLS number, or lat/lng + basic facts), it returns an
after-repair value, a range, and the exact sold comps behind the number with
every adjustment and every reason a comp was classed "renovated".

## Method

1. **Retrieve nearest-first.** One Repliers query: closed sales
   (`status=U&lastStatus=Sld&type=sale`), same style/property type, living area
   within ±40%, contracted in the last 12 months, within 3.2 km (2 mi),
   `sortBy=distanceAsc`, 100 per page, trimmed with `fields=` (incl. selected
   `raw.*` MLS fields). Page 2/3 is fetched only if the nearest 100 do not yet
   contain enough renovated comps. In dense areas this is one request.
2. **Hard filters.** Drop the subject's own address, sales after the valuation
   date, size outside ±30% (above-grade sqft when the MLS has it), different
   style, >2 bedrooms apart, different construction era.
3. **Condition tier (price-blind).** Each sale is scored from MLS
   `PropertyCondition`, `SpecialListingConditions` (as-is / auction / probate),
   buyer financing (cash vs FHA/VA), listing-remark phrases, and flips detected
   inside the pool (same address bought, then resold ≥1.35x). Score ≥ 2 =
   renovated, ≤ -1.5 = distressed, else average. Price is never an input, so
   "renovated" cannot simply mean "expensive".
4. **Similarity (0-100).** Penalties for distance (1 unit per half mile), size,
   beds, baths, year built, recency, levels, zip, garage, basement; bonus for
   same subdivision. `similarity = 100·exp(-Σ/3)`.
5. **Adjust each comp to the subject.** Net of seller concessions; size via
   `(subjectSqft/compSqft)^0.6`; 3% per bath; 2.5% garage. Total capped at ±25%.
6. **ARV.** Similarity-weighted (and evidence-weighted) median of the adjusted
   prices of the 6 most similar renovated sales (min 3); range = weighted
   20th-80th percentile. If fewer than 3 renovated sales exist, fall back to the
   80th percentile of the 12 most similar non-distressed sales and say so.

Code: `supabase/functions/_shared/arv-clean-room/` (`repliers.ts` client,
`engine.ts` pure valuation, `index.ts` orchestration + batch),
`supabase/functions/arv-clean-room/` (edge function, auth-gated),
`scripts/arv-clean-room/` (demo + backtest), `src/test/arvCleanRoom.test.ts`.

## Run it

```
export REPLIERS_API_KEY=...            # never commit it
node scripts/arv-clean-room/demo.ts 26068309 26071667      # Node >= 22.18
node scripts/arv-clean-room/backtest.ts 12
npx vitest run src/test/arvCleanRoom.test.ts
```

## Repliers behaviour verified live (Nov 2026)

- `resultsPerPage` is silently capped at 100.
- `radius` is kilometres; no distance is returned (computed locally).
- `status=U` alone also returns leases, expired and terminated listings.
- The search endpoint defaults to active only; a lookup by `mlsNumber` needs
  `status=A&status=U`.
- `soldDate` is the contract/off-market date, typically 1-6 weeks before the
  MLS `raw.CloseDate`. `minSoldDate`/`maxSoldDate` filter on it.
- `fields=` accepts nested and individual `raw.*` paths (640 KB → ~60 KB/page).
  `/listings/{mls}` does not return `raw`.
- Unknown params are listed in `unrecognizedParams`, not rejected.
- `raw.PropertyCondition` is filled on only ~15-30% of sales, which is why
  remarks and other signals are needed.

## Evidence

- `demo-output.md` — five real active listings with ARV and selected comps.
- `backtest-output.md` — 96 homes across 8 areas that sold in renovated
  condition in the last 120 days, each valued as of its own contract date with
  itself excluded. Median absolute error 11.6%, median signed error +3.2%,
  46% within 10%, 68% within 20%. ~1.1 Repliers requests per valuation.

## Limitations

- **Accuracy is moderate, and uneven.** Good in homogeneous suburbs
  (Affton 5.9%, Florissant 8.0%, St. Charles 8.9% median error), weak where
  price changes block to block (Ferguson/Jennings 22%, Tower Grove South 18%).
  Distance is straight-line; there is no notion of neighbourhood boundaries,
  school districts or main-road divides beyond zip and subdivision.
- **The confidence score is not calibrated.** In the backtest almost every
  valuation scored ≥ 60, including some 40-50% misses. Use the comp spread and
  the comps table, not the score.
- **The backtest is partly circular and lightly tuned.** Test homes were chosen
  by this method's own condition classifier, and defaults were sanity-checked
  on four of the eight areas (variants moved results by <2 points).
- **Condition comes from text and sparse MLS fields.** Keyword matching can be
  fooled ("updated" in 2009, a turnkey rental). No photos are used. "Renovated"
  here means updated/market-ready, not necessarily a full gut rehab.
- **Adjustment sizes are judgment priors** (size elasticity, bath, garage), not
  fitted to this market. No lot-size, basement-finish, or time adjustment
  (a pool-estimated price trend was built and tested; it added noise, so it is
  off by default).
- **Only single-family was exercised.** Multi-family, condos and rural
  properties run through the same code but are untested.
- **Subject must be found by MLS number or supplied with coordinates.** No
  address search/geocoding.
- **Scale.** Each valuation is 1-3 small requests plus optional lookup; batch
  runs use bounded concurrency, 429/5xx retry and an in-memory request cache.
  There is no persistent cache or rate-limit budget; large nightly batches
  would benefit from a local sold-records table.
- Not deployed, no UI, no persistence of results; `graphify-out/` not
  regenerated.
