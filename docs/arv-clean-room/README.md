# ARV estimator v4 — retrieval fix plus three graded transplants

Branch `fable/arv-v4-transplant` (from the v3 tip, `fable/arv-v2-doctrine`).
Not merged, not deployed, not wired into the UI.

Earlier write-ups and outputs are kept: `README-v3.md` (the market model as it
stood — ladder, reading the top, price screen; all unchanged here),
`README-v2.md`, `README-v1.md`, and the matching `demo-output-*` and
`backtest-output-*` files.

Full harness output for everything below: `backtest-output.md`.
Five demo listings re-valued: `demo-output.md`.

## How the ablation works

`scripts/arv-clean-room/backtest.ts` values the same 96 subjects (read from
`backtest-output-v2.md`), each as of its own contract date with itself
excluded, against the actual sale net of concessions. Sold pools are fetched
once per retrieval basis and cached, so every step runs on identical data and
only the named switch differs. Step S0 re-runs v3 as shipped and reproduces
its reported grade exactly.

| Switch | Where | Final setting |
|---|---|---|
| Change 1 — retrieval basis | `retrievalBasis`: `"above-grade-client"` / `"living-area-band"` | above-grade-client |
| Change 2 — time adjustment | `timeAdjust`; rate is the constant `MONTHLY_TREND_RATE` (0.004) | ON |
| Change 3 — school district preference | `districtPreference` | OFF |
| Change 4 — MLS style term dropped | `styleTermPreference` | OFF (dropped) |
| Change 5 — planned-grade read | `intendedGrade: "retail" \| "rental"` | OFF by default (optional output) |

## Per-change results

| Step | Valued | Median abs error | Bias | Within 10% | Within 20% |
|---|---|---|---|---|---|
| S0 v3 as shipped | 31/96 | 8.2% | -4.5% | 54.8% | 77.4% |
| S1 = S0 + change 1 (retrieval fix) | 32/96 | 8.6% | -3.5% | 53.1% | 71.9% |
| S2 = S1 + change 4 (style term dropped) = BASE | 33/96 | 8.2% | -4.0% | 54.5% | 72.7% |
| S3 = BASE + change 2 (time adjustment) | 32/96 | 6.9% | -1.9% | 53.1% | 78.1% |
| S4 = BASE + change 3 (district preference) | 33/96 | 8.2% | -4.0% | 54.5% | 72.7% |
| S5 = BASE + changes 2 and 3 | 32/96 | 6.9% | -1.9% | 53.1% | 78.1% |
| Change 5 retail-grade read (on S3) | 15/96 | 10.7% | +6.1% | 46.7% | 66.7% |

### Change 1 — retrieval basis fix. KEPT (defect fix).

- Implemented: the comp pull is now radius (the widest the ladder can reach —
  0.5 mi, 1 mi for split levels) plus same bedroom count, with **no**
  server-side size cap. Above-grade area comes from
  `raw.AboveGradeFinishedAreaSrchSqFt` and the ±200 test runs client-side.
- Verified: 2,351 of 2,351 pool records carry both normalized and raw fields;
  above-grade area present on 2,348; no retrieval warnings.
- Proven casualty fixed: 4567 Ray Ave now receives 4100 Rosa ($265,000, 1,088
  above-grade sq ft, 1,958 living) and 4239 Eichelberger ($257,000, 1,080 /
  1,866), and they set its value ($239,500 after the size deficit; v3 gave no
  value).
- Delta vs S0: valued +1, median error +0.3 pts, bias +1.0 pts, within-10%
  -1.7 pts. The one newly valued subject is 49% high. On the 31 valued by
  both, 3 values changed and the grade is unchanged except within-20%
  (77.4% → 74.2%).
- Coverage barely moved because the binding limit is same-bedroom sales within
  half a mile, not the size cap: 60 subjects still never reach 3 good comps.

### Change 4 — settled readings. KEPT (ruled).

- Implemented: a style match is now storeys (`Levels`) only; the MLS style
  term is ignored (still available behind `styleTermPreference`). "Similar
  baths" = within a half bath, never across the 1-bath line, and the 25%
  price screen were already in place and are unchanged.
- Delta vs S1: valued +1, median error -0.3 pts, bias -0.5 pts, within-10%
  +1.4 pts. On the 32 valued by both: 8.6% → 7.6%.

### Change 2 — time adjustment. KEPT, on a mixed grade.

- Implemented: each comp's price is multiplied by `1 + MONTHLY_TREND_RATE ×
  age in months`, age capped at 12 (maximum +4.8%).
- The rate, 0.4%/month, was set before grading from Repliers statistics:
  median single-family sold price within 40 km of St. Louis, each of the 12
  months to October 2026 against the same month a year earlier, median +5.3%.
- Delta vs BASE: **valued -1, median error -1.3 pts (8.2% → 6.9%), bias +2.1
  pts (-4.0% → -1.9%), within-10% -1.4 pts (54.5% → 53.1%)**, within-20% +5.4
  pts. On the 32 valued by both: error 7.6% → 6.9%, bias -3.9% → -1.9%,
  within-10% 56.3% → 53.1% (one subject).
- Two of the four graded numbers improved and two worsened, each of the
  worsened ones by a single subject. I kept it because it does what it was
  added for (halves the low bias) and lowers median error. **If any worsening
  disqualifies a change, the final configuration is S2 instead: 33 valued,
  8.2%, -4.0%, 54.5%.** Run with `ARV_FINAL=S2`.
- Side effect: subjects with 3+ supporting comps rise from 2 to 7.
- Other rates, for information only: 0.2% → 7.1% / -2.7%; 0.6% → 7.4% /
  -1.9%; 0.8% → 29 valued, 9.5% / +0.9%.

### Change 3 — school district preference. DROPPED from the final configuration.

- Implemented: with `districtPreference` on, each ladder step is tried with
  same-district comps first (then same-district any storeys, then any
  district), before the ladder widens. Never a filter; never relaxes a rule.
  District comes from `raw.SchoolDistrict` (present on 2,345 of 2,351 pool
  records and all 96 subjects).
- Delta vs BASE: valued +0, median error +0.0 pts, bias +0.0 pts, within-10%
  +0.0 pts. One value changed; one subject lost its loan basis (12 → 11).
- Why it does nothing here: only 20 of 96 subjects have any other-district
  sale within half a mile, and 10 of those are valued. Inside the ladder's
  radius, comps are almost always in the subject's district already.
- No measured benefit and one loan basis lost, so it is off. This backtest
  cannot show whether district matters at wider radii, because the ladder
  never goes wider.

### Change 5 — planned-grade targeting. Implemented as an optional read; NOT in the headline.

- Implemented: with `intendedGrade`, the result also carries `gradeReads` —
  the same ladder and top-reading run on renovated-evidence sales only
  ("retail") and on saleable sales without renovation evidence only
  ("rental") — plus an over-improvement warning when the retail read is no
  more than $5,000 above the rental read.
- Fit: partial. My condition grading is evidence of renovation from MLS fields
  and remarks, not a finish-grade scale. "Rental grade" here means "saleable,
  no renovation evidence", which also includes dated owner-occupied homes.
- Grade: all 96 subjects were selected as renovated, so only the retail read
  can be graded. Retail read vs headline: valued 15 vs 32; on the 15 with
  both, median error 10.7% vs 10.7%, bias +6.1% vs -1.5%, within-20% 66.7% vs
  73.3%. It does not predict better and covers half as many subjects.
- The rental read existed for 17 subjects and cannot be graded on this
  sample. Both grades were readable for 8; 3 raised the over-improvement
  warning.

## Final configuration (S3) next to v3

| | Valued | Median abs error | Bias | Within 10% | Within 20% |
|---|---|---|---|---|---|
| v3 (reported, and re-run today) | 31/96 | 8.2% | -4.5% | 54.8% | 77.4% |
| **v4 final** | **32/96** | **6.9%** | **-1.9%** | **53.1%** | **78.1%** |

- No supported value: 64 (60 too few good comps, 4 no two comps agree).
- Support: 7 subjects with 3+ supporting comps (5.0% median error), 25 with
  two (10.7%).
- Loan basis exists for 12 of 96: median error 5.3%, bias -4.8%.
- Per ladder step: 0.25 mi — reached 11, valued 9, 6.1%; 0.5 mi similar baths
  — reached 23, valued 21, 6.4%; 0.5 mi baths ±1 — reached 2, valued 2, 12.6%.
- By area (v4 | v3): South City 6 valued at 9.5% | 5 at 8.9%; Tower Grove
  South 3 at 7.3% | 2 at 7.9%; Florissant 3 at 15.9% | 4 at 16.5%;
  Ferguson/Jennings 0 | 0; University City 5 at 5.5% | 5 at 4.9%; Affton 8 at
  12.4% | 8 at 14.4%; St. Charles 5 at 3.5% | 5 at 6.2%; Overland 2 at 6.1% |
  2 at 3.4%.

## Demo (v4 final, `demo-output.md`)

| Subject | v3 | v4 | Support | Step-down |
|---|---|---|---|---|
| 4567 Ray Ave | no supported value | $239,500 | 2 | none |
| 25 Saint Virgil Ln | no supported value | no supported value | 0 | none |
| 6308 Sheppard Dr | $253,500 | no supported value | 0 | none |
| 1627 Sunset Dr | no supported value | no supported value | 0 | none |
| 7358 Trenton Ave | $149,500 | $153,500 | 3 | none |

Sheppard lost its value: it now has three good comps within 0.25 mile that do
not agree with each other, and the ladder stops at the first step with three
good comps rather than widening (an unruled reading of mine since v2).

## Not implemented as specified

- **Context comps are no longer retrieved.** To keep pulls narrow the query
  asks for the subject's bedroom count only, so the ±1-bedroom context list
  from v3 is now empty.
- **v1 is not re-run in this harness** (it needs its own wider pull). Its
  figures are in `backtest-output-v3.md`.
- **Change 5** is graded on the retail side only; see above.
- **The `fields=raw` warning** did not bite this code path: naming normalized
  paths and individual `raw.*` paths together returns both, and the harness
  now counts it on every run.

## Limitations (new or changed in v4; the rest are in `README-v3.md`)

- Two thirds of subjects still get no value; Ferguson/Jennings gets none.
- The ablation deltas are one or two subjects on a base of about 32. None of
  them is statistically distinguishable from noise.
- The backtest is still circular (subjects chosen by my own classifier) and
  still tests sale prices, not appraisals.
- The trend rate is one flat metro-wide number. It ignores seasonality and
  neighbourhood differences, and it happens to sit near the best of the rates
  tested, which a single sample cannot confirm.
- Ray Ave's value rests on two comps that differ from it in storeys, one of
  them listed as-is, with a 9.8% downward size adjustment at an uncalibrated
  elasticity.
- Unit tests cover each switch; the edge function has still never been run.
