# Ads pricing calculator update

## Final scope

The calculator has been redesigned as a guided sales tool. The follow-up instruction supersedes the original requirement to keep fixed recommendation fees: recommended plans now use exactly the same pricing rules as custom plans. Recommendations preset the advertising budget and duration; they do not store separate fee or total values.

## Files changed

- `pages/ads-calculator.js`: guided workflow, live quote, creative selection, add-ons, advanced adjustments, customer messages and copy feedback.
- `styles/AdsCalculator.module.css`: responsive app layout, mobile sticky total/action, keyboard focus styles and reduced-motion-aware transitions.
- `config/adsPricingConfig.mjs`: centralized pricing configuration, validation, calculations and message generation.
- `scripts/testAdsPricing.mjs`: executable pricing regression tests.
- `docs/ads-calculator-update.md`: this implementation and validation record.

## Audit and preservation

The existing page uses Next.js Pages Router, React local state/useMemo, a CSS module, and a pure JavaScript pricing module. It does not save quotes or send them to a backend. Setup pricing was already read from the shared services configuration. The former calculator showed most inputs together, interpolated fees from budget-and-duration tables, charged extra creative bundles, and had inconsistent creative counts in its recommendation guide.

Preserved: recommended/custom paths, custom budgets and durations, script support, TikTok account setup, manual budget/duration/video/management adjustments, live calculation, simple/full messages, recommendation guide, clipboard actions and responsive layout. The old extra-creative bundles and free-creative allowance override were replaced by the requested creative rules. The advanced video-count adjustment cannot bypass the testing maximum. No existing stored orders or backend payment records are changed by this calculator.

## UX flow

1. Choose recommended or custom pricing.
2. Recommended: choose a suggested plan and optionally go straight to the customer message. Custom: enter budget, then duration.
3. Choose creative testing or individual video ads. Testing defaults to two videos. Trying to add a third prompts a switch to individual ads rather than silently increasing the bill.
4. Select optional services; manual adjustments remain secondary under a disclosure in custom mode.
5. Review and copy a simple or full customer message. A separate recommendation guide remains available.

Desktop shows a live quote alongside each question. Mobile keeps the total and primary action at the bottom, with full details on Review. Quote formulas are available in a collapsed internal breakdown on both layouts. Invalid inputs suppress the quote/message instead of copying a misleading total. Copy feedback uses a status message; failure gives manual-copy instructions.

## Pricing architecture

Budget bands are applied to the actual combined ad budget: below 100k = 25k; 100k–under 200k = 30k; 200k–under 300k = 50k; 300k–under 400k = 65k; 400k–under 500k = 80k. At 500k and above, the base fee is 20%, rounded to the nearest 5k.

Duration multipliers interpolate linearly between 7/1.00, 10/1.15, 15/1.30, 21/1.50 and 30/1.75. The adjusted management fee is rounded to the nearest 5k, with a 25k minimum. Half increments round upward. Campaigns shorter than seven days retain the seven-day minimum; beyond 30 days, the final slope continues.

Testing: one shared budget, one or two videos, no creative fee, no promise of equal spend/delivery.

Individual ads: budget per video × count, then management calculated on that combined budget and duration, then 5k per video added. A management override adjusts the management component before creative fees; add-ons remain separate.

## Recommended pricing (testing, no extras)

| Days | Advertising | Management | Total |
|---|---:|---:|---:|
| 7 | 35,000 | 25,000 | 60,000 |
| 10 | 100,000 | 35,000 | 135,000 |
| 15 | 200,000 | 65,000 | 265,000 |
| 30 | 300,000 | 115,000 | 415,000 |

All amounts are naira. Individual creative extensions of every recommended plan are tested against equivalent custom quotes.

## Tested custom outputs

| Base budget | Days | Videos / mode | Actual ad budget | Rounded management | Creative fee | Total |
|---|---:|---|---:|---:|---:|---:|
| 35,000 | 7 | 1 / testing | 35,000 | 25,000 | 0 | 60,000 |
| 35,000 | 7 | 2 / testing | 35,000 | 25,000 | 0 | 60,000 |
| 35,000 | 7 | 2 / individual | 70,000 | 25,000 | 10,000 | 105,000 |
| 150,000 | 10 | 2 / testing | 150,000 | 35,000 | 0 | 185,000 |
| 150,000 | 30 | 2 / testing | 150,000 | 55,000 | 0 | 205,000 |
| 300,000 | 10 | 2 / testing | 300,000 | 75,000 | 0 | 375,000 |
| 300,000 | 30 | 2 / testing | 300,000 | 115,000 | 0 | 415,000 |
| 150,000 | 10 | 3 / individual | 450,000 | 90,000 | 15,000 | 555,000 |
| 35,000 | 7 | 1 / individual | 35,000 | 25,000 | 5,000 | 65,000 |

Base-fee boundaries checked: 99,999 and 99,999.99 → 25,000; 100,000, 199,999 and 199,999.99 → 30,000; 200,000 and 299,999 → 50,000; 300,000 and 399,999 → 65,000; 400,000 and 499,999 → 80,000; 500,000 and 500,001 → 100,000; 750,000 → 150,000; 1m → 200,000; 2m → 400,000.

Also tested: all anchors, interpolated days 8/9/11/12/18/24, days 1/6/31/39, nondecreasing multipliers through 365 days, high-budget rounding before duration, decimals, add-ons (25k script + 20k setup), all four manual adjustments, empty/negative/zero/nonfinite/oversized inputs, fractional days/counts, combined-budget cap, testing over two, invalid mode/plan, singular grammar, individual-budget wording, absence of internal formulas from messages, and updated guide totals.

Browser checks: desktop custom flow, two-video limit prompt, switch to three individual videos with 555k total, all four updated recommendation cards, 135k recommendation message and breakdown, copy-success status, mobile start and review layouts, and 390px width without horizontal overflow. Clipboard-provider inspection did not mirror the page clipboard, so actual OS clipboard contents were not independently confirmed. The page's clipboard call resolved and showed success. No customer messages were sent.

Validation commands: `node scripts/testAdsPricing.mjs` and `npx eslint pages/ads-calculator.js config/adsPricingConfig.mjs scripts/testAdsPricing.mjs`.

## Retained rules and assumptions

- The previous 35k minimum ad budget was advisory, so positive smaller budgets remain allowed with a note.
- Script support remains the calculator's existing 25k, not the separate homepage script product price. TikTok setup remains linked to the existing shared service price (currently 20k).
- The old calculator extrapolated beyond its final duration anchor. The replacement continues that approach using the new final anchor slope, configured in one place.
- Editable validation ceilings are 1bn combined ad budget, 365 whole days and 100 individual videos. Budgets allow two decimal places; days and counts must be integers.
- Blank manual fields mean automatic. Zero is validated explicitly and cannot bypass the 25k management minimum.
- Automatic prices round as specified; explicit valid manual management adjustments retain their entered amount.
- Recommended base budgets and durations stay the same; their management fees now follow the revised instruction to match custom pricing.
