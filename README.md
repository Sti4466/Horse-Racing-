# 🏇 Horse Race Predictor v3.0

A self-contained, single-file horse racing prediction tool that runs entirely in your browser. No server, no installation, no accounts — just open the HTML file and start predicting.

---

## Overview

Horse Race Predictor is a 24-factor machine learning system that predicts the top-3 finishers in a horse race. It uses a weighted scoring engine that learns from every race result you enter, adjusting its model to improve over time. All data is stored locally in your browser via `localStorage` — nothing leaves your machine.

The app supports six simultaneous prediction models (BasePredictor + five custom AI-named slots), a full betting tracker, a consensus advisor, and an AI audit system powered by Claude.

---

## Getting Started

1. Download `horse_predictor_v3.0.html`
2. Open it in any modern browser (Chrome, Firefox, Edge, Safari)
3. Enter your race info and horse data
4. Click **Predict**
5. After the race, enter the actual result to trigger learning

That's it. No build step, no dependencies, no internet required for core functionality.

---

## How It Works

### Scoring Engine

Each horse is scored across 24 factors. The final score is a weighted sum of all factor contributions, split 70/30 between top-3 placement likelihood and win likelihood.

| Factor | What It Measures |
|---|---|
| Odds | Market confidence |
| Form (1–5 runs) | Recent finishing positions |
| Form consistency | Variance in recent results |
| Career win % | Historical win rate |
| Track win % | Win rate at this specific venue |
| Track/distance win % | Combined venue + distance record |
| Jockey win rate | Jockey's current season strike rate |
| Trainer win rate | Trainer's current season strike rate |
| Freshness | Optimal days-since-last-run curve |
| Tactical rating | Running style vs race tempo match |
| Track condition | Surface preference (Firm → Heavy) |
| First-up form | Performance returning from spell |
| Distance suitability | Record at this distance |
| Last start margin | Closeness of last run |
| Rail position | Barrier draw vs rail position |
| Gear changes | First-time blinkers, tongue tie, etc. |
| Pace pressure | Early pace dynamics, barrier trap risk |
| Class change | Moving up/down in grade |
| Form momentum | Trend across last 5 runs (improving/declining) |
| Finish strength | Late sectional speed tendency |
| Sectional speed | Standardised speed figure (0–120 scale) |
| Weather/rail bias | Track bias adjustment |
| ELO class rating | Session-accumulated class rating |
| Weight-for-Age | WFA allowance applied as effective weight |

### Speed Figures

Speed figures use a standardised 0–120 scale benchmarked at 32.0s for the last 600m on Good 4 over 1200m. Each 0.1s = ±2 rating points. Condition and distance adjustments are applied automatically.

### Track Bias Detection

After each race result is entered, the app records the top-3 finishers' barriers and running styles for that venue. After 4+ races at a track it derives a running bias (inside/middle/outside rail; on-pace/mixed/back speed) and applies a small score adjustment to horses that suit the detected bias.

### ELO Class Ratings

Every horse starts at ELO 1000. Ratings update after each race based on finishing position vs expected outcome (1600 for G1, 400 for Maiden). Ratings persist across sessions.

---

## Learning System

After you enter a race result, the model compares its prediction against the actual top 3 and adjusts weights accordingly.

### How learning is balanced

| Outcome | What happens |
|---|---|
| 3/3 hit (exact trifecta) | Reinforce all 3 horses at strength 0.85 |
| 3/3 hit (any order) | Reinforce all 3 horses at strength 0.60 |
| 2/3 hit | Reinforce hits at 0.65, penalise the miss at 0.65, small surprise signal at 0.20 |
| 1/3 hit | Penalise misses at 0.60, small reinforce for the hit at 0.35 |
| 0/3 miss | Penalise all 3 predicted horses — no surprise reinforcement |

**Gradient descent:** Each weight adjustment is scaled by that factor's proportional contribution to the total predicted score. Factors that drove the wrong prediction most strongly get corrected most strongly.

**Decay:** Every race applies a 0.3% pull toward factory defaults across all weights. This prevents weights from drifting permanently on sparse data and keeps learned patterns from becoming stale after a long gap.

**Equilibrium:** A consistently well-predicted factor stabilises roughly 10% above its default value. Factors that repeatedly miss drift back toward default.

---

## Models

The app runs six prediction models simultaneously, each with its own independent weight table:

| Model | Description |
|---|---|
| **BasePredictor** | The self-learning model. Starts at factory defaults and improves with every race you enter. |
| **Kimi / Grok / GPT / Gemini** | Custom-named slots. You can rename these and tune their weights manually or via AI audit. |
| **Saturday** | A separate model that auto-activates on Saturdays and reverts to the base model on weekdays. |

Switch between models with the buttons at the top. Each model tracks its own accuracy statistics.

### Consensus Advisor

The **Advisor** tab aggregates predictions across all models that have pending races queued. It scores each horse by average rank, average probability, and model agreement, then generates four recommended bets with confidence percentages.

### AI Audit (requires internet)

Every 20 races, the app can send your model performance logs to Claude AI for analysis. Claude reviews win%, top-3%, ROI, and weight stability across all models and recommends weight adjustments (capped at ±20% per audit). You can apply suggestions to a single model or push them to all models at once.

If you're running locally via `file://`, the XHR request is silently blocked by the browser. The app detects this after 5 seconds and switches to **Manual Mode**: copy the prompt, paste it into claude.ai, paste the JSON response back.

---

## Betting Tracker

The app includes a full betting ledger:

- Record Win, Place, Each-Way, Exacta, Quinella, Trifecta, Boxed Trifecta, First 4, and Superfecta bets
- Auto-settle bets when you enter a race result
- Running ROI, total staked, profit/loss
- **Kelly Criterion** staking suggestions on Win bets — shows recommended stake and full-Kelly percentage based on the model's confidence and the horse's odds (Quarter Kelly applied by default)

---

## Horse Card Badges

Each horse card displays colour-coded badges for key signals:

| Badge | Meaning |
|---|---|
| **SF:95** | Speed figure (green ≥95, red <80) |
| **ELO:1250** | ELO class rating (green ≥1200, red <800) |
| **WFA −10.5kg** | Weight-for-age allowance applied |
| **📈 Improving** | Form trend strongly upward over last 5 runs |
| **📉 Declining** | Form trend strongly downward |
| **🚧 Trap Risk** | Leader/pace drawn inside in large sprint field |
| **Blinkers 1st** | First-time blinkers gear change |
| **TT 1st** | First-time tongue tie |
| **90d break** | Long layoff flag |
| **Trial winner** | Won recent barrier/jump-out trial |
| **Debut** | First starter |

---

## Data & Storage

All data is stored in `localStorage` under 28 keys. Nothing is ever sent to a server (except the optional AI audit call to Claude).

Key data stored:
- Race history (results, predictions, factor snapshots)
- All six model weight tables
- Jockey and trainer statistics
- Venue profiles with per-track factor multipliers and barrier bias history
- ELO class ratings per horse
- Betting history
- Activity log

### Import / Export

Use the **Export** button to download all data as a JSON backup. Use **Import** to restore it. The **Safe Reset** button wipes weights back to factory defaults while preserving race history.

---

## FormSectionals Parser

The app includes a dedicated parser for pasting raw form guide data. It supports:

- Three separate input boxes (Race order, Barrier order, or mixed)
- Digit-string form (`13212`) and rich margin format (`3-2.5L 2-0.8L 1-0L`)
- Last 600m sectional times for speed figure calculation
- Non-breaking space handling for copy-pasted TAB/Racing.com data

---

## Day Monitor

The **Day Monitor** tracks predictions made for races that haven't been settled yet. After you enter results, it displays hit/miss outcomes per race with a running top-3 hit rate for the session.

---

## Technical Notes

- **Single file:** All HTML, CSS, and JavaScript in one `.html` file (~8,000 lines)
- **No dependencies:** No frameworks, no build tools, no CDN calls
- **`file://` compatible:** Works when opened directly from your filesystem
- **localStorage:** ~28 keys, all namespaced with `horse` prefix
- **Browser support:** Chrome 90+, Firefox 88+, Edge 90+, Safari 14+

---

## Version History

| Version | Key additions |
|---|---|
| v3.0 | Speed figures, ELO ratings, WFA scale, form trend, track bias, Kelly criterion, expanded gear/alerts, gradient descent learning, balanced reinforce/penalise, decay-to-defaults |
| v2.9 | AI audit manual mode, 20% audit cap, apply-to-all fix, Day Monitor fixes |
| v2.x | Consensus advisor, 6 bet types, FormSectionals parser, venue profiles, Saturday model |
