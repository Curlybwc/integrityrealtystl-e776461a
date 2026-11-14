# ARV estimator v2 — market model

Branch `fable/arv-v2-doctrine` (from `fable/arv-method-clean-room`). Not merged,
not deployed, not wired into the UI.

v2 keeps v1's Repliers plumbing unchanged and replaces the valuation layer.
v1's write-up and outputs are kept for comparison: `README-v1.md`,
`demo-output-v1.md`, `backtest-output-v1.md`.

## What is unchanged from v1

The Repliers client and query are byte-for-byte the same: closed sales
(`status=U&lastStatus=Sld&type=sale`), same style/property type, living area
±40%, last 12 months, 3.2 km radius, `sortBy=distanceAsc`, 100 per page,
`fields=` with selected `raw.*` fields, `soldDate` treated as the contract
date. The only orchestration change is when nearest-first paging stops: v1
stopped once it had enough renovated comps; v2 stops once the fetched records
reach past the widest radius its ladder can use (0.5 mi; 1 mi for split
levels). v1's estimator (`estimateArv`) is still in the code so both can be run
on the same subject.

## The v2 valuation layer (`_shared/arv-clean-room/doctrine.ts`)

1. **Separate the populations.** Every retrieved sale is classed with v1's
   condition evidence (MLS condition, as-is / auction / probate fields, buyer
   financing, remarks, flip detection). Sales classed distressed, and the
   purchase leg of a detected flip, are removed before anything else. The
   evidence is used only to exclude; nothing is graded or weighted by it.
2. **Select comps on a fixed ladder.** A good comp has the same beds, same
   baths and is within ±200 sq ft.
   - 0.25 mile → if fewer than 3 good comps, 0.5 mile → if still fewer, allow
     ±1 bed and ±1 bath and adjust those comps' prices.
   - Basement is a hard filter. Split level is a hard filter: split-level
     subjects take split-level comps only, with the ladder running to 1 mile.
   - A lone sale $30K or more above the next is an outlier and is excluded.
3. **Read the top of the set.** Never a mean or median.
   - 3 or more comps within $5K at the top → the low end of that cluster.
   - Two comps agreeing at the top → halfway between them.
   - A lone comp well above the next does not set value; the reading moves to
     the level below it.
   - Fewer than 3 good comps, or no two comps that agree → **no supported
     value**, stated as such.
4. **Adjust down only.** The level read from the comps is reduced for subject
   deficits against the comps that support it (smaller living area, no garage
   where most of them have one). A superior subject is never adjusted above
   the supported top.
5. **Always report three things:** the value; the **support count** (comps in
   the top range that sets the value); and the **step-down value** (the next
   supported level below, read the same way). `loanBasis` is the value when 3+
   comps support it, otherwise the step-down.

### Choices the model did not specify (mine — please confirm or correct)

| Choice | What I did | Status |
|---|---|---|
| "Well above" / "significantly above" | A comp more than **$15K** above the next is lone | Uncalibrated. $10K and $20K tested; results barely move (below) |
| Outlier threshold | **$30K** (low end of your $30-40K) | Yours |
| Bed/bath price adjustment on relaxed comps | **3% per bedroom, 3% per full bath**, both directions | Uncalibrated placeholder |
| "±1 bed or ±1 bath" | A relaxed comp may differ by 1 bed **and** 1 bath | My reading |
| Deficit sizes | Size: `(subject/median supporting sq ft)^0.6`; garage: 2.5% | Uncalibrated, carried from v1 |
| Basement filter direction | Applied both ways; comps of unknown basement status are dropped | My reading |
| Split-level filter direction | Applied both ways (non-split subjects never take split comps). Split level = MLS `Levels` contains "Split" | My reading |
| What counts as distressed | v1's score ≤ -1.5. As-is alone or cash alone does **not** exclude a sale; together they do. Auction/probate/REO, "Fixer", and strong remarks do | Uncalibrated |
| Comp price | Gross sold price (seller concessions not netted, unlike v1) | My reading |
| Scattered comps | With 3+ good comps but no two agreeing, the ladder does not widen further; it reports no supported value | My reading |
| Loan basis | Step-down when support is 2; value when support is 3+ | My reading of "thin" |

## Run it

```
export REPLIERS_API_KEY=...            # never commit it
node scripts/arv-clean-room/demo.ts 26068309 26071667      # Node >= 22.18
node scripts/arv-clean-room/backtest.ts 12                 # v1 and v2, same subjects
npx vitest run src/test/arvDoctrine.test.ts src/test/arvCleanRoom.test.ts
```

## Demo: the same five listings as v1 (`demo-output.md`)

| Subject | v1 ARV | v2 value | Support | Step-down | Loan basis | Ladder step used |
|---|---|---|---|---|---|---|
| 4567 Ray Ave, 63116 | $180,500 | $207,500 | 2 | $205,500 | $205,500 | 0.5 mi, ±1 bed/bath |
| 25 Saint Virgil Ln, Florissant | $193,000 | $182,000 | 2 | $160,500 | $160,500 | 0.5 mi, ±1 bed/bath |
| 6308 Sheppard Dr, Affton | $249,000 | $254,000 | 2 | $248,500 | $248,500 | 0.5 mi, same bed/bath |
| 1627 Sunset Dr, St. Charles | $267,000 | $264,000 | 2 | $251,000 | $251,000 | 0.5 mi, ±1 bed/bath |
| 7358 Trenton Ave, University City | $182,000 | $149,500 | 3 | $80,000 | $149,500 | 0.5 mi, same bed/bath |

No demo subject found 3 good comps within 0.25 mile. Three of five needed the
relaxed step, so their values rest on adjusted prices.

## Backtest: only the estimator swapped (`backtest-output.md`)

Same 96 subjects, same selection rule, same target (actual sale net of
concessions) as v1.

| | Valued | Median abs error | Median signed | Within 10% | Within 20% |
|---|---|---|---|---|---|
| v1, all subjects | 96/96 | 11.6% | +3.2% | 45.8% | 67.7% |
| **v2, all subjects** | **64/96** | **10.5%** | **+3.4%** | **46.9%** | **70.3%** |
| v1, on the 64 that v2 valued | 64/64 | 9.2% | -2.4% | 57.8% | 78.1% |

v2 by ladder step:

| Step | Valued | Median abs error | Median signed |
|---|---|---|---|
| 0.25 mi, same bed/bath | 5/5 | 7.3% | -4.5% |
| 0.5 mi, same bed/bath | 18/21 | 6.7% | -1.6% |
| 0.5 mi, ±1 bed/bath (adjusted) | 41/43 | 14.3% | +7.7% |
| Fewer than 3 good comps anywhere | 0/27 | - | - |

Other results:

- **Coverage.** 32 of 96 got no supported value: 27 had fewer than 3 good
  comps even at the relaxed step, 5 had 3+ comps of which no two agreed.
- **Support.** Of the 64 valued, 56 had a support count of 2 and only 8 had 3
  or more. The loan basis therefore fell to the step-down for most, and existed
  for only 41 of 96 (median signed error -4.6% against the sale price).
- **The ceiling.** 37 of 89 subjects with a comp set sold above the highest
  non-outlier comp in their set, 22 of them by more than $15K. In this sample
  the top of the comp set did not act as a ceiling on sale prices.
- **By area.** Better than v1 in Tower Grove South (11.6% vs 17.9%) and about
  equal in Affton, University City and St. Charles. Much worse in South City
  Bevo/Dutchtown (28.6% vs 11.0%, values ~28% high), where small houses with
  unusual bed/bath counts all landed on the relaxed step.
- **Sensitivity (not tuned; defaults kept).** Lone-comp gap $10K: 58 valued,
  12.4%. $20K: 67 valued, 10.9%. Deficits off: 10.7%, bias +5.4%. Bed/bath
  adjustments set to zero: 11.0%, relaxed step still 13.5% — so the weakness
  of the relaxed step is the mixing of bed/bath counts, not the size of the
  adjustment.
- About 1.1 Repliers requests per subject for both estimators together.

## Limitations

- **The backtest does not test the model's actual claim.** The model is about
  where appraisals land; the backtest compares against sale prices. There is
  no appraisal data here. A sale above the comp ceiling does not show that an
  appraisal would have followed it.
- **The backtest is circular.** Subjects were picked by v1's own condition
  classifier ("renovated"), unchanged for comparability. The same classifier
  decides which comps are distressed.
- **A third of subjects get no value.** Same beds, same baths, ±200 sq ft
  within half a mile is often fewer than 3 sales in 12 months.
- **Support of 3+ is rare** (8 of 96). Most values rest on two sales.
- **The relaxed step is weak** (14.3% error, 7.7% high) and it is where most
  valuations land (41 of 64).
- **Every threshold marked uncalibrated above is a guess.** Dollar thresholds
  are fixed across $100K and $300K neighbourhoods.
- **Step-down can be far below the value** when the saleable set contains
  cheap rentals (University City demo: $149,500 → $80,000). The model reads
  whatever level two sales support.
- **No age or era filter.** New construction within half a mile with the same
  bed/bath count can set the top; the output notes it but does not exclude it.
- **Condition evidence is still text and sparse MLS fields**; no photos. A
  distressed sale that is not flagged stays in the saleable set, and a
  saleable one wrongly flagged is lost.
- **Retrieval band.** The unchanged server-side ±40% living-area filter is
  narrower than ±200 sq ft for subjects under 500 sq ft.
- **Split-level and no-basement paths** are unit-tested but did not occur in
  the demo or get separately measured in the backtest.
- Single-family only; subject by MLS number or coordinates; no persistent
  cache; edge function never run or deployed; `graphify-out/` not regenerated.
