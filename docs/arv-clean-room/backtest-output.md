== Data checks ==
subjects: 96/96 found
living-area-band: 9776 pool records over 98 page requests | carry normalized AND raw: 9776/9776 | above-grade area present: 9771/9776 | school district present: 9761/9776 | retrieval warnings: 0
above-grade-client: 2351 pool records over 97 page requests | carry normalized AND raw: 2351/2351 | above-grade area present: 2348/2351 | school district present: 2345/2351 | retrieval warnings: 0
subjects with a school district: 96/96

== Ablation (target = actual sale net of concessions) ==

S0  v3 as shipped (living-area server band, style-term preference)
  valued 31/96 | median abs err 8.2% | bias (median signed) -4.5% | within 10%: 54.8% | within 20%: 77.4%
  no supported value: 65 (60 too few good comps, 5 no two comps agree) | support >= 3: 1 | loan basis exists: 10
  per ladder step (preference sub-steps combined):
    0.25 mi, same beds, similar baths: reached 9 | valued 9/9 | median abs err 8.9% | bias (median signed) -4.5% | within 10%: 55.6% | within 20%: 77.8%
    0.5 mi, same beds, baths ±1: reached 2 | valued 2/2 | median abs err 10.5% | bias (median signed) 10.5% | within 10%: 0.0% | within 20%: 100.0%
    0.5 mi, same beds, similar baths: reached 25 | valued 20/25 | median abs err 6.3% | bias (median signed) -5.0% | within 10%: 60.0% | within 20%: 75.0%
    no step reached 3 good comps: reached 60 | valued 0/60

S1  S0 + change 1: retrieval basis fix
  valued 32/96 | median abs err 8.6% | bias (median signed) -3.5% | within 10%: 53.1% | within 20%: 71.9%
  delta vs S0: valued +1 | median abs err +0.3 pts | bias +1.0 pts | within 10% -1.7 pts
  no supported value: 64 (60 too few good comps, 4 no two comps agree) | support >= 3: 1 | loan basis exists: 10
  per ladder step (preference sub-steps combined):
    0.25 mi, same beds, similar baths: reached 11 | valued 10/11 | median abs err 9.6% | bias (median signed) -5.1% | within 10%: 50.0% | within 20%: 70.0%
    0.5 mi, same beds, baths ±1: reached 2 | valued 2/2 | median abs err 10.5% | bias (median signed) 10.5% | within 10%: 0.0% | within 20%: 100.0%
    0.5 mi, same beds, similar baths: reached 23 | valued 20/23 | median abs err 6.3% | bias (median signed) -3.5% | within 10%: 60.0% | within 20%: 70.0%
    no step reached 3 good comps: reached 60 | valued 0/60
  like-for-like on 31 subjects valued by both: this median abs err 8.2% | bias (median signed) -4.0% | within 10%: 54.8% | within 20%: 74.2%  ||  S0 median abs err 8.2% | bias (median signed) -4.5% | within 10%: 54.8% | within 20%: 77.4%  (3 values changed)
  newly valued: 1 (median abs err 49.0% | bias (median signed) 49.0% | within 10%: 0.0% | within 20%: 0.0%) | no longer valued: 0

S2  S1 + change 4: settled readings (style term dropped) = BASE
  valued 33/96 | median abs err 8.2% | bias (median signed) -4.0% | within 10%: 54.5% | within 20%: 72.7%
  delta vs S1: valued +1 | median abs err -0.3 pts | bias -0.5 pts | within 10% +1.4 pts
  no supported value: 63 (60 too few good comps, 3 no two comps agree) | support >= 3: 2 | loan basis exists: 12
  per ladder step (preference sub-steps combined):
    0.25 mi, same beds, similar baths: reached 11 | valued 10/11 | median abs err 8.7% | bias (median signed) -5.1% | within 10%: 50.0% | within 20%: 70.0%
    0.5 mi, same beds, baths ±1: reached 2 | valued 2/2 | median abs err 10.5% | bias (median signed) 10.5% | within 10%: 0.0% | within 20%: 100.0%
    0.5 mi, same beds, similar baths: reached 23 | valued 21/23 | median abs err 6.4% | bias (median signed) -4.0% | within 10%: 61.9% | within 20%: 71.4%
    no step reached 3 good comps: reached 60 | valued 0/60
  like-for-like on 32 subjects valued by both: this median abs err 7.6% | bias (median signed) -3.9% | within 10%: 56.3% | within 20%: 71.9%  ||  S1 median abs err 8.6% | bias (median signed) -3.5% | within 10%: 53.1% | within 20%: 71.9%  (5 values changed)
  newly valued: 1 (median abs err 11.9% | bias (median signed) -11.9% | within 10%: 0.0% | within 20%: 100.0%) | no longer valued: 0

S3  BASE + change 2: time adjustment ON (0.40%/month)
  valued 32/96 | median abs err 6.9% | bias (median signed) -1.9% | within 10%: 53.1% | within 20%: 78.1%
  delta vs S2: valued -1 | median abs err -1.3 pts | bias +2.1 pts | within 10% -1.4 pts
  no supported value: 64 (60 too few good comps, 4 no two comps agree) | support >= 3: 7 | loan basis exists: 12
  per ladder step (preference sub-steps combined):
    0.25 mi, same beds, similar baths: reached 11 | valued 9/11 | median abs err 6.1% | bias (median signed) -4.9% | within 10%: 55.6% | within 20%: 77.8%
    0.5 mi, same beds, baths ±1: reached 2 | valued 2/2 | median abs err 12.6% | bias (median signed) 12.6% | within 10%: 0.0% | within 20%: 100.0%
    0.5 mi, same beds, similar baths: reached 23 | valued 21/23 | median abs err 6.4% | bias (median signed) -2.3% | within 10%: 57.1% | within 20%: 76.2%
    no step reached 3 good comps: reached 60 | valued 0/60
  like-for-like on 32 subjects valued by both: this median abs err 6.9% | bias (median signed) -1.9% | within 10%: 53.1% | within 20%: 78.1%  ||  S2 median abs err 7.6% | bias (median signed) -3.9% | within 10%: 56.3% | within 20%: 75.0%  (31 values changed)
  newly valued: 0 | no longer valued: 1

S4  BASE + change 3: school-district preference ON
  valued 33/96 | median abs err 8.2% | bias (median signed) -4.0% | within 10%: 54.5% | within 20%: 72.7%
  delta vs S2: valued +0 | median abs err +0.0 pts | bias +0.0 pts | within 10% +0.0 pts
  no supported value: 63 (60 too few good comps, 3 no two comps agree) | support >= 3: 2 | loan basis exists: 11
  per ladder step (preference sub-steps combined):
    0.25 mi, same beds, similar baths: reached 11 | valued 10/11 | median abs err 8.7% | bias (median signed) -5.0% | within 10%: 50.0% | within 20%: 70.0%
    0.5 mi, same beds, baths ±1: reached 2 | valued 2/2 | median abs err 10.5% | bias (median signed) 10.5% | within 10%: 0.0% | within 20%: 100.0%
    0.5 mi, same beds, similar baths: reached 23 | valued 21/23 | median abs err 6.4% | bias (median signed) -4.0% | within 10%: 61.9% | within 20%: 71.4%
    no step reached 3 good comps: reached 60 | valued 0/60
  like-for-like on 33 subjects valued by both: this median abs err 8.2% | bias (median signed) -4.0% | within 10%: 54.5% | within 20%: 72.7%  ||  S2 median abs err 8.2% | bias (median signed) -4.0% | within 10%: 54.5% | within 20%: 72.7%  (1 values changed)
  newly valued: 0 | no longer valued: 0

S5  BASE + changes 2 and 3 together
  valued 32/96 | median abs err 6.9% | bias (median signed) -1.9% | within 10%: 53.1% | within 20%: 78.1%
  delta vs S2: valued -1 | median abs err -1.3 pts | bias +2.1 pts | within 10% -1.4 pts
  no supported value: 64 (60 too few good comps, 4 no two comps agree) | support >= 3: 7 | loan basis exists: 11
  per ladder step (preference sub-steps combined):
    0.25 mi, same beds, similar baths: reached 11 | valued 9/11 | median abs err 6.1% | bias (median signed) -3.7% | within 10%: 55.6% | within 20%: 77.8%
    0.5 mi, same beds, baths ±1: reached 2 | valued 2/2 | median abs err 12.6% | bias (median signed) 12.6% | within 10%: 0.0% | within 20%: 100.0%
    0.5 mi, same beds, similar baths: reached 23 | valued 21/23 | median abs err 6.4% | bias (median signed) -2.3% | within 10%: 57.1% | within 20%: 76.2%
    no step reached 3 good comps: reached 60 | valued 0/60
  like-for-like on 32 subjects valued by both: this median abs err 6.9% | bias (median signed) -1.9% | within 10%: 53.1% | within 20%: 78.1%  ||  S2 median abs err 7.6% | bias (median signed) -3.9% | within 10%: 56.3% | within 20%: 75.0%  (31 values changed)
  newly valued: 0 | no longer valued: 1

== Change 3 reach: subjects with at least one other-district sale in their half-mile pool: 20/96 (10 of them valued under BASE) ==

== Change 2 sensitivity: other monthly rates (the estimator's constant stays as named) ==
  0.2%/month: valued 32/96 | median abs err 7.1% | bias (median signed) -2.7% | within 10%: 56.3% | within 20%: 78.1%
  0.6%/month: valued 32/96 | median abs err 7.4% | bias (median signed) -1.9% | within 10%: 56.3% | within 20%: 84.4%
  0.8%/month: valued 29/96 | median abs err 9.5% | bias (median signed) 0.9% | within 10%: 55.2% | within 20%: 82.8%

== Change 5: planned-grade read (on the final configuration, S3) ==
All 96 subjects were selected because they sold with evidence of renovation, so their actual grade is retail-grade. intendedGrade = retail for all; the rental-grade read cannot be graded on this sample.
  headline value:        valued 32/96 | median abs err 6.9% | bias (median signed) -1.9% | within 10%: 53.1% | within 20%: 78.1%
  retail-grade read:     valued 15/96 | median abs err 10.7% | bias (median signed) 6.1% | within 10%: 46.7% | within 20%: 66.7%
  delta retail read vs headline: valued -17 | median abs err +3.8 pts | bias +8.0 pts | within 10% -6.5 pts
  like-for-like on 15 subjects with both: retail read median abs err 10.7% | bias (median signed) 6.1% | within 10%: 46.7% | within 20%: 66.7%  ||  headline median abs err 10.7% | bias (median signed) -1.5% | within 10%: 46.7% | within 20%: 73.3%
  retail read exists but headline does not: 0 | headline exists but retail read does not: 17
  rental-grade read exists (ungradeable here): 17/96 | both grades readable: 8 | over-improvement warnings: 3

== Final configuration: S3  BASE + change 2: time adjustment ON (0.40%/month) ==
  valued 32/96 | median abs err 6.9% | bias (median signed) -1.9% | within 10%: 53.1% | within 20%: 78.1%
  v3 as reported:  valued 31/96 | median abs err 8.2% | bias (median signed) -4.5% | within 10%: 54.8% | within 20%: 77.4%
  v3 re-run today (S0): valued 31/96 | median abs err 8.2% | bias (median signed) -4.5% | within 10%: 54.8% | within 20%: 77.4%
  loan basis:  valued 12/96 | median abs err 5.3% | bias (median signed) -4.8% | within 10%: 66.7% | within 20%: 83.3%
  step-down:   valued 11/96 | median abs err 9.8% | bias (median signed) -9.8% | within 10%: 54.5% | within 20%: 72.7%
  support = 2: valued 25/25 | median abs err 10.7% | bias (median signed) -1.3% | within 10%: 48.0% | within 20%: 76.0%
  support >= 3: valued 7/7 | median abs err 5.0% | bias (median signed) -4.9% | within 10%: 71.4% | within 20%: 85.7%
  by area (final | v3 re-run):
    South City (Bevo/Dutchtown): valued 6/12 | median abs err 9.5% | bias (median signed) 1.1% | within 10%: 50.0% | within 20%: 66.7%  ||  valued 5/12 | median abs err 8.9% | bias (median signed) -1.7% | within 10%: 60.0% | within 20%: 60.0%
    Tower Grove South: valued 3/12 | median abs err 7.3% | bias (median signed) -7.3% | within 10%: 66.7% | within 20%: 100.0%  ||  valued 2/12 | median abs err 7.9% | bias (median signed) -7.9% | within 10%: 100.0% | within 20%: 100.0%
    North County (Florissant): valued 3/12 | median abs err 15.9% | bias (median signed) -15.9% | within 10%: 0.0% | within 20%: 66.7%  ||  valued 4/12 | median abs err 16.5% | bias (median signed) -16.5% | within 10%: 0.0% | within 20%: 75.0%
    Ferguson/Jennings: valued 0/12  ||  valued 0/12
    University City: valued 5/12 | median abs err 5.5% | bias (median signed) -3.8% | within 10%: 80.0% | within 20%: 100.0%  ||  valued 5/12 | median abs err 4.9% | bias (median signed) -4.9% | within 10%: 80.0% | within 20%: 100.0%
    Affton/Lemay: valued 8/12 | median abs err 12.4% | bias (median signed) 5.8% | within 10%: 37.5% | within 20%: 62.5%  ||  valued 8/12 | median abs err 14.4% | bias (median signed) 3.2% | within 10%: 37.5% | within 20%: 62.5%
    St. Charles: valued 5/12 | median abs err 3.5% | bias (median signed) 0.0% | within 10%: 60.0% | within 20%: 80.0%  ||  valued 5/12 | median abs err 6.2% | bias (median signed) -1.4% | within 10%: 60.0% | within 20%: 80.0%
    Overland/St. Ann: valued 2/12 | median abs err 6.1% | bias (median signed) 6.1% | within 10%: 100.0% | within 20%: 100.0%  ||  valued 2/12 | median abs err 3.4% | bias (median signed) 3.4% | within 10%: 100.0% | within 20%: 100.0%

| Area | MLS# | Address | Bd/Ba | Net sale | v3 re-run (S0) | Final value | Support | Step-down | Loan basis | Final err | Ladder step |
|---|---|---|---|---|---|---|---|---|---|---|---|
| South City (Bevo/Dutchtown) | 26040783 | 4707 Ray Avenue, St Louis 63116 | 2/2 | $122,500 | no supported value | $183,500 | 2 | none | none | 49.8% | 0.5 mi, same beds, similar baths, style-matched |
| South City (Bevo/Dutchtown) | 26019243 | 4729 Adkins Avenue, St Louis 63116 | 3/3 | $266,750 | no supported value | no supported value | 0 | none | none | n/a | no step reached 3 good comps |
| South City (Bevo/Dutchtown) | 26050987 | 5000 Steffens Avenue, St Louis 63116 | 2/1.5 | $201,500 | $154,500 | $175,500 | 2 | $158,000 | $158,000 | -12.9% | 0.5 mi, same beds, similar baths, style-matched |
| South City (Bevo/Dutchtown) | 26047635 | 3851 Neosho, St Louis 63116 | 3/2 | $141,900 | no supported value | no supported value | 0 | none | none | n/a | no step reached 3 good comps |
| South City (Bevo/Dutchtown) | 26049497 | 4333 Delor Street, St Louis 63116 | 1/1 | $120,000 | $84,500 | $87,000 | 2 | none | none | -27.5% | 0.5 mi, same beds, similar baths, style-matched |
| South City (Bevo/Dutchtown) | 26058225 | 3838 Bingham Avenue, St Louis 63116 | 1/2 | $226,000 | no supported value | no supported value | 0 | none | none | n/a | no step reached 3 good comps |
| South City (Bevo/Dutchtown) | 26048645 | 4675 Dewey Avenue, St Louis 63116 | 4/2 | $230,000 | no supported value | no supported value | 0 | none | none | n/a | no step reached 3 good comps |
| South City (Bevo/Dutchtown) | 26053967 | 5335 Alfred Avenue, St Louis 63116 | 2/2 | $179,500 | $195,500 | $190,500 | 2 | none | none | 6.1% | 0.25 mi, same beds, similar baths, style-matched |
| South City (Bevo/Dutchtown) | 26021589 | 3929 Bates Street, St Louis 63116 | 3/1 | $177,000 | no supported value | no supported value | 0 | none | none | n/a | no step reached 3 good comps |
| South City (Bevo/Dutchtown) | 26043207 | 4466 Ellenwood Avenue, St Louis 63116 | 3/2 | $230,000 | $226,000 | $226,500 | 3 | $178,000 | $226,500 | -1.5% | 0.5 mi, same beds, similar baths, any style |
| South City (Bevo/Dutchtown) | 26057175 | 4081 Burgen Avenue, St Louis 63116 | 3/1 | $197,000 | no supported value | no supported value | 0 | none | none | n/a | no step reached 3 good comps |
| South City (Bevo/Dutchtown) | 26057799 | 5108 Cologne Avenue, St Louis 63116 | 2/2 | $193,200 | $195,500 | $200,500 | 2 | none | none | 3.8% | 0.25 mi, same beds, similar baths, any style |
| Tower Grove South | 26058014 | 4154 Humphrey Street, St Louis 63116 | 3/1.5 | $289,000 | no supported value | no supported value | 0 | none | none | n/a | no step reached 3 good comps |
| Tower Grove South | 26041617 | 4050 McDonald Avenue, St Louis 63116 | 2/1 | $285,000 | $263,500 | $271,000 | 3 | $249,000 | $271,000 | -4.9% | 0.25 mi, same beds, similar baths, style-matched |
| Tower Grove South | 26047795 | 4220 Wyoming Street, St Louis 63116 | 3/2.5 | $450,000 | $413,000 | $417,000 | 2 | none | none | -7.3% | 0.5 mi, same beds, similar baths, style-matched |
| Tower Grove South | 25063794 | 4263 Connecticut Street, St Louis 63116 | 1/1 | $162,500 | no supported value | no supported value | 0 | none | none | n/a | no step reached 3 good comps |
| Tower Grove South | 26059142 | 4262 Miami Street, St Louis 63116 | 3/3 | $299,462 | no supported value | no supported value | 0 | none | none | n/a | no step reached 3 good comps |
| Tower Grove South | 26043287 | 3900 Parker Avenue, St Louis 63116 | 4/3 | $505,000 | no supported value | no supported value | 0 | none | none | n/a | no step reached 3 good comps |
| Tower Grove South | 26064898 | 4158 Arsenal Street, St Louis 63116 | 3/3 | $620,000 | no supported value | no supported value | 0 | none | none | n/a | no step reached 3 good comps |
| Tower Grove South | 26048488 | 3940 Hartford Street, St Louis 63116 | 3/4.5 | $735,000 | no supported value | no supported value | 0 | none | none | n/a | no step reached 3 good comps |
| Tower Grove South | 26045299 | 3147 Alfred Avenue, St Louis 63116 | 3/2.5 | $420,000 | no supported value | $375,000 | 2 | none | none | -10.7% | 0.5 mi, same beds, similar baths, style-matched |
| Tower Grove South | 26052981 | 3966 Arsenal Street, St Louis 63116 | 3/2 | $425,000 | no supported value | no supported value | 0 | none | none | n/a | no step reached 3 good comps |
| Tower Grove South | 26057244 | 4402 Tholozan Avenue, St Louis 63116 | 3/1 | $193,900 | no supported value | no supported value | 0 | none | none | n/a | no step reached 3 good comps |
| Tower Grove South | 26055695 | 3555 S Spring Avenue, St Louis 63116 | 3/2.5 | $267,900 | no supported value | no supported value | 0 | none | none | n/a | no step reached 3 good comps |
| North County (Florissant) | 26040019 | 280 N Castello Street, Florissant 63031 | 3/2 | $235,000 | $260,500 | $265,000 | 2 | none | none | 12.8% | 0.5 mi, same beds, baths ±1, any style |
| North County (Florissant) | 26050735 | 1305 Washington Street, Florissant 63033 | 3/1 | $142,000 | no supported value | no supported value | 0 | none | none | n/a | 0.5 mi, same beds, similar baths, any style |
| North County (Florissant) | 26034721 | 206 N Castello Street, Florissant 63031 | 3/3 | $295,000 | no supported value | no supported value | 0 | none | none | n/a | no step reached 3 good comps |
| North County (Florissant) | 26040464 | 1035 Saint Marie Street, Florissant 63031 | 2/1 | $147,500 | no supported value | no supported value | 0 | none | none | n/a | no step reached 3 good comps |
| North County (Florissant) | 26062528 | 1675 Saint Catherine Street, Florissant 63033 | 3/2 | $217,500 | $181,000 | $183,000 | 2 | none | none | -15.9% | 0.25 mi, same beds, similar baths, style-matched |
| North County (Florissant) | 26017168 | 445 Washington Street, Florissant 63031 | 3/2 | $227,000 | no supported value | no supported value | 0 | none | none | n/a | no step reached 3 good comps |
| North County (Florissant) | 26055331 | 342 Reighley Place, Florissant 63031 | 4/2.5 | $332,400 | no supported value | no supported value | 0 | none | none | n/a | no step reached 3 good comps |
| North County (Florissant) | 26043041 | 330 Reighley Place, Florissant 63031 | 3/3 | $277,000 | no supported value | no supported value | 0 | none | none | n/a | no step reached 3 good comps |
| North County (Florissant) | 26041560 | 365 Saint Marie Street, Florissant 63031 | 3/1.5 | $168,000 | no supported value | no supported value | 0 | none | none | n/a | no step reached 3 good comps |
| North County (Florissant) | 26049103 | 160 Saint Patrick Lane, Florissant 63031 | 3/2 | $243,000 | $203,500 | no supported value | 0 | none | none | n/a | 0.25 mi, same beds, similar baths, style-matched |
| North County (Florissant) | 26037319 | 569 Saint Joseph Street, Florissant 63031 | 3/2 | $260,000 | no supported value | no supported value | 0 | none | none | n/a | no step reached 3 good comps |
| North County (Florissant) | 26045572 | 295 Derhake, Florissant 63031 | 2/1 | $150,000 | $115,000 | $119,500 | 2 | none | none | -20.3% | 0.25 mi, same beds, similar baths, style-matched |
| Ferguson/Jennings | 26042439 | 263 S Hartnett Avenue, Ferguson 63135 | 3/1 | $127,329 | no supported value | no supported value | 0 | none | none | n/a | no step reached 3 good comps |
| Ferguson/Jennings | 26021140 | 9017 Clarion Drive, St Louis 63136 | 3/1.5 | $113,210 | no supported value | no supported value | 0 | none | none | n/a | no step reached 3 good comps |
| Ferguson/Jennings | 26063438 | 222 S Clark Avenue, Ferguson 63135 | 3/2 | $185,000 | no supported value | no supported value | 0 | none | none | n/a | no step reached 3 good comps |
| Ferguson/Jennings | 26053522 | 2826 Glade Avenue, Jennings 63136 | 3/2 | $122,450 | no supported value | no supported value | 0 | none | none | n/a | no step reached 3 good comps |
| Ferguson/Jennings | 26041056 | 5530 Horizon Drive, St Louis 63121 | 4/3 | $190,000 | no supported value | no supported value | 0 | none | none | n/a | no step reached 3 good comps |
| Ferguson/Jennings | 26029947 | 5381 Bermuda Drive, St Louis 63121 | 3/2.5 | $163,799 | no supported value | no supported value | 0 | none | none | n/a | no step reached 3 good comps |
| Ferguson/Jennings | 26043018 | 225 Day Drive, Ferguson 63135 | 2/3 | $269,000 | no supported value | no supported value | 0 | none | none | n/a | no step reached 3 good comps |
| Ferguson/Jennings | 26047357 | 9825 Dennis Drive, St Louis 63136 | 3/2 | $115,500 | no supported value | no supported value | 0 | none | none | n/a | no step reached 3 good comps |
| Ferguson/Jennings | 26044570 | 7541 Norwalk Lane, St Louis 63121 | 2/1.5 | $123,150 | no supported value | no supported value | 0 | none | none | n/a | no step reached 3 good comps |
| Ferguson/Jennings | 26058208 | 340 Wedge Drive, Dellwood 63135 | 4/2 | $175,000 | no supported value | no supported value | 0 | none | none | n/a | no step reached 3 good comps |
| Ferguson/Jennings | 26040935 | 308 Hereford Avenue, Ferguson 63135 | 4/2.5 | $270,500 | no supported value | no supported value | 0 | none | none | n/a | no step reached 3 good comps |
| Ferguson/Jennings | 26007136 | 8419 Falmouth Drive, St Louis 63121 | 3/1 | $114,000 | no supported value | no supported value | 0 | none | none | n/a | no step reached 3 good comps |
| University City | 26061881 | 7330 Shaftesbury Avenue, University City 63130 | 2/2 | $349,000 | no supported value | no supported value | 0 | none | none | n/a | no step reached 3 good comps |
| University City | 26036787 | 7244 Shaftesbury Avenue, University City 63130 | 3/1 | $311,000 | no supported value | no supported value | 0 | none | none | n/a | no step reached 3 good comps |
| University City | 26053175 | 1060 Purdue Avenue, University City 63130 | 4/2 | $395,500 | no supported value | no supported value | 0 | none | none | n/a | no step reached 3 good comps |
| University City | 26047589 | 7315 Ahern Avenue, University City 63130 | 3/2 | $264,500 | no supported value | no supported value | 0 | none | none | n/a | no step reached 3 good comps |
| University City | 26049040 | 7426 Stanford Avenue, University City 63130 | 2/2 | $400,000 | no supported value | no supported value | 0 | none | none | n/a | no step reached 3 good comps |
| University City | 26050097 | 7425 Melrose Avenue, St Louis 63130 | 2/2 | $294,900 | no supported value | no supported value | 0 | none | none | n/a | no step reached 3 good comps |
| University City | 26021568 | 1106 Mona Drive, St Louis 63130 | 2/1 | $200,000 | $191,000 | $189,000 | 4 | none | $189,000 | -5.5% | 0.25 mi, same beds, similar baths, style-matched |
| University City | 26058632 | 1131 Mount Olive Avenue, St Louis 63130 | 2/1 | $168,500 | $175,000 | $178,000 | 2 | none | none | 5.6% | 0.5 mi, same beds, similar baths, style-matched |
| University City | 26049966 | 561 Bedford Avenue, University City 63130 | 4/3.5 | $861,000 | $806,000 | $828,000 | 2 | none | none | -3.8% | 0.5 mi, same beds, similar baths, style-matched |
| University City | 26051253 | 539 N Central Avenue, University City 63130 | 3/2 | $504,500 | $480,000 | $493,000 | 2 | $481,000 | $481,000 | -2.3% | 0.5 mi, same beds, similar baths, style-matched |
| University City | 26046844 | 930 Blackberry Place, St Louis 63130 | 3/2 | $357,500 | no supported value | no supported value | 0 | none | none | n/a | no step reached 3 good comps |
| University City | 26043389 | 1036 GROBY Road, University City 63130 | 2/1 | $219,900 | $188,500 | $193,500 | 5 | $173,000 | $193,500 | -12.0% | 0.5 mi, same beds, similar baths, style-matched |
| Affton/Lemay | 26044137 | 9313 Aster Avenue, Affton 63123 | 3/1 | $248,000 | $235,000 | $235,500 | 3 | $224,000 | $235,500 | -5.0% | 0.5 mi, same beds, similar baths, any style |
| Affton/Lemay | 26048930 | 9211 Alpine Drive, Affton 63123 | 2/2 | $222,500 | $275,000 | $279,500 | 2 | none | none | 25.6% | 0.5 mi, same beds, similar baths, any style |
| Affton/Lemay | 25081224 | 9434 Brenda Avenue, St Louis 63123 | 2/2 | $255,000 | no supported value | no supported value | 0 | none | none | n/a | 0.25 mi, same beds, similar baths, style-matched |
| Affton/Lemay | 26048536 | 9131 Lucia Drive, Affton 63123 | 2/2 | $240,075 | $265,000 | $271,000 | 2 | $253,500 | $253,500 | 12.9% | 0.25 mi, same beds, similar baths, style-matched |
| Affton/Lemay | 26050701 | 8735 Brenda Avenue, Affton 63123 | 2/1 | $265,000 | $216,000 | $233,500 | 2 | $219,500 | $219,500 | -11.9% | 0.5 mi, same beds, similar baths, style-matched |
| Affton/Lemay | 26044011 | 9118 Lucia Drive, Affton 63123 | 2/2 | $265,000 | no supported value | no supported value | 0 | none | none | n/a | no step reached 3 good comps |
| Affton/Lemay | 26049289 | 9438 Tiber Drive, Affton 63123 | 3/1 | $225,000 | $216,000 | $222,000 | 2 | none | none | -1.3% | 0.5 mi, same beds, similar baths, style-matched |
| Affton/Lemay | 26046841 | 9101 Flores Drive, St Louis 63123 | 2/2 | $189,000 | $251,000 | $255,500 | 2 | none | none | 35.2% | 0.25 mi, same beds, similar baths, style-matched |
| Affton/Lemay | 26048885 | 9713 Shuffle Drive, Affton 63123 | 4/3 | $300,500 | no supported value | no supported value | 0 | none | none | n/a | no step reached 3 good comps |
| Affton/Lemay | 26044888 | 9533 Port Drive, Unincorporated 63123 | 3/1.5 | $267,500 | $252,500 | $254,500 | 2 | $263,500 | $263,500 | -4.9% | 0.25 mi, same beds, similar baths, style-matched |
| Affton/Lemay | 26043913 | 9846 Vasel Drive, St Louis 63123 | 3/2 | $265,000 | $334,500 | $334,500 | 3 | $275,500 | $334,500 | 26.2% | 0.5 mi, same beds, similar baths, style-matched |
| Affton/Lemay | 26058791 | 9916 Coventry Lane, St Louis 63123 | 3/2 | $340,000 | no supported value | no supported value | 0 | none | none | n/a | no step reached 3 good comps |
| St. Charles | 26055890 | 1316 Clearview Drive, St Charles 63303 | 3/2 | $275,000 | $258,000 | $266,000 | 2 | none | none | -3.3% | 0.5 mi, same beds, similar baths, style-matched |
| St. Charles | 26057716 | 1533 Sherman Drive, St Charles 63303 | 5/3 | $326,400 | no supported value | no supported value | 0 | none | none | n/a | no step reached 3 good comps |
| St. Charles | 26048266 | 1309 Clearview Drive, St Charles 63303 | 2/1.5 | $300,500 | no supported value | no supported value | 0 | none | none | n/a | no step reached 3 good comps |
| St. Charles | 26056495 | 918 Perry Street, St Charles 63301 | 2/2 | $262,000 | no supported value | no supported value | 0 | none | none | n/a | no step reached 3 good comps |
| St. Charles | 26042624 | 1290 Shorewinds Trail, St Charles 63303 | 4/2.5 | $520,000 | $572,500 | $584,500 | 2 | none | none | 12.4% | 0.5 mi, same beds, baths ±1, style-matched |
| St. Charles | 26037781 | 13 Eagle Cove Lane, St Charles 63303 | 3/2.5 | $415,000 | no supported value | no supported value | 0 | none | none | n/a | no step reached 3 good comps |
| St. Charles | 26052491 | 118 Lindenwood Avenue, St Charles 63301 | 3/2 | $380,000 | no supported value | no supported value | 0 | none | none | n/a | no step reached 3 good comps |
| St. Charles | 26057444 | 210 S Duchesne Drive, St Charles 63301 | 3/2 | $275,500 | $332,500 | $341,000 | 2 | none | none | 23.8% | 0.5 mi, same beds, similar baths, style-matched |
| St. Charles | 26053675 | 1133 Fordyce Lane, St Charles 63303 | 3/1.5 | $285,100 | no supported value | no supported value | 0 | none | none | n/a | no step reached 3 good comps |
| St. Charles | 26048229 | 2812 Olde Gloucester Drive, St Charles 63301 | 3/2 | $325,000 | $320,500 | $325,000 | 3 | $293,000 | $325,000 | 0.0% | 0.5 mi, same beds, similar baths, style-matched |
| St. Charles | 26046323 | 1904 Elm St Street, St Charles 63301 | 4/1.5 | $307,200 | no supported value | no supported value | 0 | none | none | n/a | no step reached 3 good comps |
| St. Charles | 26051044 | 1121 Wedgewood Drive, St Charles 63303 | 3/2 | $375,000 | $354,000 | $362,000 | 2 | none | none | -3.5% | 0.5 mi, same beds, similar baths, style-matched |
| Overland/St. Ann | 26048605 | 2632 Burns Avenue, St Louis 63114 | 2/1 | $167,351 | no supported value | no supported value | 0 | none | none | n/a | no step reached 3 good comps |
| Overland/St. Ann | 26045192 | 3246 Airway Avenue, Breckenridge Hills 63114 | 2/1 | $154,000 | $158,500 | $163,000 | 2 | none | none | 5.8% | 0.5 mi, same beds, similar baths, any style |
| Overland/St. Ann | 26031359 | 9525 Marlowe Avenue, Overland 63114 | 2/1 | $159,900 | no supported value | no supported value | 0 | none | none | n/a | no step reached 3 good comps |
| Overland/St. Ann | 26051698 | 9942 Westwise Court, Overland 63114 | 3/1 | $216,000 | no supported value | no supported value | 0 | none | none | n/a | no step reached 3 good comps |
| Overland/St. Ann | 26048823 | 2898 Lesmer Court, Overland 63114 | 3/2 | $198,250 | $206,000 | $211,000 | 2 | none | none | 6.4% | 0.5 mi, same beds, similar baths, style-matched |
| Overland/St. Ann | 26045320 | 2423 Chaucer Avenue, Overland 63114 | 3/2 | $237,350 | no supported value | no supported value | 0 | none | none | n/a | no step reached 3 good comps |
| Overland/St. Ann | 26058796 | 9437 Burdella Avenue, St Louis 63114 | 4/2 | $230,000 | no supported value | no supported value | 0 | none | none | n/a | no step reached 3 good comps |
| Overland/St. Ann | 26039664 | 9431 Burdella Avenue, St John 63114 | 2/2 | $148,000 | no supported value | no supported value | 0 | none | none | n/a | no step reached 3 good comps |
| Overland/St. Ann | 26048895 | 10215 Midland Boulevard, St Louis 63114 | 2/2 | $205,000 | no supported value | no supported value | 0 | none | none | n/a | 0.5 mi, same beds, similar baths, style-matched |
| Overland/St. Ann | 26053910 | 3349 Marmary Lane, St Ann 63074 | 3/1 | $162,000 | no supported value | no supported value | 0 | none | none | n/a | no step reached 3 good comps |
| Overland/St. Ann | 26046102 | 10314 Millwood Avenue, St Ann 63074 | 2/2 | $140,000 | no supported value | no supported value | 0 | none | none | n/a | no step reached 3 good comps |
| Overland/St. Ann | 26019252 | 10235 Midland Boulevard, Overland 63114 | 4/1 | $177,510 | no supported value | no supported value | 0 | none | none | n/a | no step reached 3 good comps |
