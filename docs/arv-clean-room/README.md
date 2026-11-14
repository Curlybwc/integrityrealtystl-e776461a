# ARV estimator — market model, third revision

Branch `fable/arv-v2-doctrine`. Not merged, not deployed, not wired into the UI.

Earlier write-ups and outputs are kept for comparison:
`README-v2.md`, `demo-output-v2.md`, `backtest-output-v2.md` (previous revision)
and `README-v1.md`, `demo-output-v1.md`, `backtest-output-v1.md` (v1).

## What changed in this revision (owner rulings)

1. **Ladder.** Bedroom count never relaxes. Order: same beds + similar baths +
   ±200 sq ft within 0.25 mile → same within 0.5 mile → baths ±1 at 0.5 mile.
   Baths never cross the 1-bath line at any step: a 1-bath subject takes only
   1-bath comps; a subject with more than one bath never takes a 1-bath comp.
   Sales with a different bedroom count are listed as context only.
2. **Relative-price screen.** After the evidence-based split, a sale priced far
   below the supported top is treated as distressed-market and removed from
   the comp count, the value and the step-down. The test is a percentage of
   the top, never a dollar cutoff.
3. **Style preference.** Each ladder step is tried first with style-matched
   comps only, then with all styles, before the ladder widens. Split level
   stays a hard filter.

Unchanged: reading the top (3+ within $5K → low end; two agreeing → between
them; a lone comp more than $15K above the next does not set value), the $30K
outlier rule, downward-only deficit adjustments, and the three required
outputs — value, support count, step-down.

## The method as it now stands (`_shared/arv-clean-room/doctrine.ts`)

1. **Retrieve** — same Repliers query as v1 (closed sales, same style/property
   type, living area ±40%, last 12 months, nearest first, `soldDate` as the
   contract date). Two plumbing touches this revision, both small: the field
   list gained `raw.ArchitecturalStyle` (needed for ruling 3), and the client
   now waits out `retry-after` on HTTP 429 (see limitations).
2. **Split by evidence** — distressed sales (as-is / auction / probate fields,
   cash, remarks, flip purchase legs) are removed.
3. **Walk the ladder** — at each sub-step: build the comp set, drop a lone
   $30K+ outlier, read the supported top, apply the relative-price screen, and
   stop if 3 or more good comps remain.
4. **Read the top**, adjust down for subject deficits, and report value,
   support count, step-down and loan basis (the value with 3+ supporting
   comps, otherwise the step-down).
5. If no step yields 3 good comps, or no two comps agree, the answer is
   **no supported value**.

### Choices the rulings did not specify (mine — please confirm or correct)

| Choice | What I did | Status |
|---|---|---|
| "Similar baths" | Within a half bath, same side of the 1-bath line | My reading. Exact-match tested: 30 valued, 7.9% |
| Where 1.5 baths sits | "More than one": 1.5-bath homes never comp with 1-bath homes | My reading of "1 and more-than-1" |
| Bath price adjustment | 3% per full bath (1.5% per half), both directions | Uncalibrated placeholder |
| "Far below" (price screen) | **25% or more below the lowest comp supporting the top** | Uncalibrated. 20%: 29 valued; 33%: 32 valued; error unchanged |
| Price screen anchor | Applied only when a supported top exists; screened sales do not count toward the 3 good comps | My reading |
| Style match | Same MLS `Levels`, and — where both list one — a shared MLS `ArchitecturalStyle` term ("Other" ignored) | My reading. The MLS style terms are noisy (see limitations) |
| "Rank above" | Style-matched comps alone are used when 3+ exist at a step; otherwise all styles at that step, before widening | My reading |
| Context comps | ±1 bedroom, passing every other test, within the widest radius; displayed only | As ruled |
| Deficit sizes; distressed threshold; gross comp prices; scattered comps do not widen; loan basis rule | Unchanged from the previous revision | Uncalibrated / my reading, as before |

## Run it

```
export REPLIERS_API_KEY=...            # never commit it
node scripts/arv-clean-room/demo.ts 26068309 26068087      # Node >= 22.18
node scripts/arv-clean-room/backtest.ts                    # the same 96 subjects, read from backtest-output-v2.md
npx vitest run src/test/arvDoctrine.test.ts src/test/arvCleanRoom.test.ts
```

## Demo: the same five listings (`demo-output.md`)

| Subject | Bd/Ba | v1 | Previous revision | This revision | Support | Step-down | Ladder step used |
|---|---|---|---|---|---|---|---|
| 4567 Ray Ave, 63116 | 3/2 | $180,500 | $207,500 | **No supported value** | 0 | none | none — 1 good comp within 0.5 mi |
| 25 Saint Virgil Ln, Florissant | 3/1.5 | $193,000 | $182,000 | **No supported value** | 0 | none | 0.5 mi, baths ±1 — 3 comps, no two agree |
| 6308 Sheppard Dr, Affton | 2/1 | $249,000 | $254,000 | **$253,500** | 2 | $242,500 | 0.5 mi, similar baths, style-matched |
| 1627 Sunset Dr, St. Charles | 3/1 | $267,000 | $264,000 | **No supported value** | 0 | none | none — 1 good comp within 0.5 mi |
| 7358 Trenton Ave, University City | 2/1 | $182,000 | $149,500 | **$149,500** | 3 | none | 0.5 mi, similar baths, any style |

Trenton: the $85,000, $75,000 and $72,500 sales are now screened out as
distressed-market, so the $80,000 step-down is gone and there is no supported
level below the value. Its three supporting comps are one-storey like the
subject but carry a different MLS style term, so none is style-matched.

## Backtest: the same 96 subjects (`backtest-output.md`)

Target is the actual sale net of concessions, as before.

| | Valued | Median abs error | Median signed | Within 10% | Within 20% |
|---|---|---|---|---|---|
| v1 | 96/96 | 11.6% | +3.2% | 45.8% | 67.7% |
| Previous revision | 64/96 | 10.5% | +3.4% | 46.9% | 70.3% |
| **This revision** | **31/96** | **8.2%** | **-4.5%** | **54.8%** | **77.4%** |
| v1, on the 31 this revision valued | 31/31 | 8.1% | -1.5% | 71.0% | 83.9% |
| Previous revision, on the same 31 | 30/31 | 8.6% | -0.9% | 53.3% | 76.7% |

### Per ladder step

"Reached" = subjects whose ladder stopped at that step with 3+ good comps;
"valued" = those where two comps also agreed.

| Step | Reached | Valued | Median abs error | Median signed |
|---|---|---|---|---|
| 0.25 mi, similar baths, style-matched | 4 | 4 | 9.0% | -6.6% |
| 0.25 mi, similar baths, any style | 5 | 5 | 8.9% | +1.2% |
| 0.5 mi, similar baths, style-matched | 9 | 6 | 15.3% | -10.2% |
| 0.5 mi, similar baths, any style | 16 | 14 | 5.4% | -3.3% |
| 0.5 mi, baths ±1, style-matched | 0 | 0 | - | - |
| 0.5 mi, baths ±1, any style | 2 | 2 | 10.5% | +10.5% |
| No step reached 3 good comps | 60 | 0 | - | - |

Combined: 0.25 mi 9/9 at 8.9%; 0.5 mi similar baths 20/25 at 6.3%; baths ±1
2/2 at 10.5%. Style-matched sub-steps 10 valued at 12.3%; any-style sub-steps
21 valued at 6.4%.

### Coverage

- 65 of 96 got no supported value: 60 never reached 3 good comps, 5 reached 3
  but no two agreed.
- Of the 60: 25 had no good comp at all with the same bedroom count, 28 had
  one, 7 had two.
- Support: 30 of the 31 valued rest on two comps; one has three. A loan basis
  therefore existed for 10 of 96 (median error 6.2%, all at or below the sale
  price side: none over by more than 10%).
- The relative-price screen removed at least one sale in 3 of the 31
  valuations.
- 13 of the 31 valued subjects sold above the highest non-outlier comp in
  their set, 6 by more than $15K.

### South City (Bevo/Dutchtown)

| | Valued | Median abs error | Median signed |
|---|---|---|---|
| v1 | 12/12 | 11.0% | +2.3% |
| Previous revision | 9/12 | 28.6% | +28.4% |
| This revision | 5/12 | 8.9% | -1.7% |

The previous revision's five large overshoots (+28% to +104%) all came from
mixing bedroom counts. Under the new ladder three of them get no supported
value, one is now +1.2% (5108 Cologne) and one is now 23% low (5000 Steffens,
2 bd / 1.5 ba). The five valued: +8.9%, +1.2%, -1.7%, -23.3%, -29.6%. Seven
get no value: six had fewer than 3 same-bedroom comps within half a mile, and
one had three that did not agree. The -29.6% (4333 Delor, 1 bd / 1 ba) is
unchanged from the previous revision.

### Other areas

| Area | Valued | Median abs error | Previous revision |
|---|---|---|---|
| Tower Grove South | 2/12 | 7.9% | 8/12 at 11.6% |
| North County (Florissant) | 4/12 | 16.5% (all low) | 5/12 at 10.9% |
| Ferguson/Jennings | 0/12 | - | 4/12 at 20.0% |
| University City | 5/12 | 4.9% | 10/12 at 9.1% |
| Affton/Lemay | 8/12 | 14.4% | 11/12 at 5.2% |
| St. Charles | 5/12 | 6.2% | 9/12 at 9.2% |
| Overland/St. Ann | 2/12 | 3.4% | 8/12 at 10.1% |

### Sensitivity (reported, not tuned; defaults kept)

| Variant | Valued | Median abs error |
|---|---|---|
| Default | 31 | 8.2% |
| Style preference off | 33 | 8.2% |
| Price screen at 20% | 29 | 8.2% |
| Price screen at 33% | 32 | 7.9% |
| "Similar baths" = exact match | 30 | 7.9% |

## Limitations

- **Two thirds of subjects get no value**, and Ferguson/Jennings gets none at
  all. Same bedroom count within half a mile in 12 months is often 0-2 sales.
- **On the 31 it does value, v1 was just as accurate** (8.1% vs 8.2%, and 71%
  vs 55% within 10%). The gain over the previous revision comes from declining
  the hard cases, not from valuing the easy ones better.
- **Values now run low** (median -4.5%; 13 of 31 subjects sold above their
  comp ceiling). Against sale prices, the supported top understates what
  renovated houses in this sample sold for.
- **The backtest still does not test the model's claim**, which is about
  appraisals; only sale prices are available. And it is still circular:
  the 96 subjects were picked by my own "renovated" classifier.
- **Small numbers everywhere.** Per-step and per-area figures rest on 2-14
  valuations each; differences between them are not reliable.
- **Style preference did not help here.** Style-matched sub-steps scored
  12.3% against 6.4% for any-style, on 10 and 21 valuations. The MLS
  `ArchitecturalStyle` terms look inconsistent for the same house type
  (one-storey 792 sq ft houses listed as "Ranch", "Traditional" or
  "Bungalow"), so my style match may be testing agent wording.
- **Affton got worse** (5.2% → 14.4%); I have not diagnosed why.
- **Support of 3+ occurred once in 96.** The loan basis is almost always the
  step-down, and usually there is none.
- **Uncalibrated numbers** remain: the 25% price screen, 3% per bath, deficit
  sizes, and the distressed-evidence threshold.
- **The price screen needs a supported top to anchor on.** If two lone high
  sales sit above a low cluster, the low cluster can still set the value.
- **Rate limit.** Repliers refused requests (HTTP 429) during back-to-back
  backtests even though only ~300 page requests had been made; the search
  endpoints appear to have their own per-minute budget. The client now waits
  for `retry-after`, which makes large batches slow rather than failing.
- **No age filter**; condition evidence is still text and sparse MLS fields;
  split-level and no-basement paths are unit-tested only; single-family only;
  edge function never run or deployed; `graphify-out/` not regenerated.
