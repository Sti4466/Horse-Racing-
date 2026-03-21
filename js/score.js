'use strict';

function calculateFormScore(h) {
if (!h.form) return 0;
var digits = h.form.replace(/[^0-9]/g, '');
if (digits.length === 0) return 0;
var score = 0;
var recentRuns = Math.min(5, digits.length);
var positions = [];
for (var i = 0; i < recentRuns; i++) {
var pos = parseInt(digits[digits.length - 1 - i]);
if (isNaN(pos)) continue;
positions.push(pos);
var recency = (recentRuns - i) / recentRuns;
if (pos === 1) score += app.W.form1 * recency;
else if (pos === 2) score += app.W.form2 * recency;
else if (pos === 3) score += app.W.form3 * recency;
else if (pos === 4) score += app.W.form4 * recency;
else if (pos === 5) score += app.W.form5 * recency;
else if (pos <= 8) score += app.W.form5 * 0.5 * recency;
}
if (positions.length >= 3) {
var topThree = positions.filter(function(p) { return p <= 3; }).length;
var consistency = topThree / positions.length;
h.consistencyScore = consistency;
score += consistency * app.W.formConsistency;
}
h.formScore = score;
return score;
}
function calculateFreshnessScore(h) {
if (!h.daysAgo || h.daysAgo === 0) return 0;
// Peak window: 10-14 days (standard preparation in Australian racing)
// 7 days or less: slightly back-up flat — less recovery time
// 15-21 days: still well-prepared
// Beyond that: diminishing freshness signal
var score = 0;
if      (h.daysAgo <= 5)  score = app.W.freshness * 0.70; // very quick back-up
else if (h.daysAgo <= 7)  score = app.W.freshness * 0.85; // 6-7 day back-up
else if (h.daysAgo <= 10) score = app.W.freshness * 0.95; // sharp preparation
else if (h.daysAgo <= 14) score = app.W.freshness * 1.00; // optimal 10-14 day prep ← peak
else if (h.daysAgo <= 21) score = app.W.freshness * 0.90; // standard 2-3 week gap
else if (h.daysAgo <= 28) score = app.W.freshness * 0.75; // 3-4 weeks
else if (h.daysAgo <= 42) score = app.W.freshness * 0.50; // 4-6 weeks
else if (h.daysAgo <= 60) score = app.W.freshness * 0.25; // 6-8 weeks — likely 2nd-up
else if (h.daysAgo <= 90) score = app.W.freshness * 0.05; // 2-3 month spell — first-up
else                       score = app.W.freshness * -0.10; // long spell — unknown fitness
h.freshnessScore = score;
return score;
}
function calculateTacticalScore(h) {
if (!h.runningStyle) return 0;
var barrier = parseInt(h.barrier) || 0;
if (barrier === 0) return 0;
var score = 0;
if (h.settlingPosition !== null && h.settlingPosition > 0) {
var position = h.settlingPosition;
if (position <= 2) { if (barrier <= 4) score = app.W.tactical * 1.3; else if (barrier <= 8) score = app.W.tactical * 0.6; else score = app.W.tactical * 0.2; }
else if (position <= 4) { if (barrier <= 6) score = app.W.tactical * 1.1; else if (barrier <= 10) score = app.W.tactical * 0.8; else score = app.W.tactical * 0.4; }
else if (position <= 6) { if (barrier <= 3) score = app.W.tactical * 0.7; else if (barrier <= 10) score = app.W.tactical * 1.0; else score = app.W.tactical * 0.8; }
else { if (barrier <= 4) score = app.W.tactical * 0.4; else if (barrier <= 10) score = app.W.tactical * 0.9; else score = app.W.tactical * 1.2; }
} else {
var style = h.runningStyle.toLowerCase();
if (style === 'leader') { if (barrier <= 4) score = app.W.tactical * 1.2; else if (barrier <= 8) score = app.W.tactical * 0.6; else score = app.W.tactical * 0.2; }
else if (style === 'pace') { if (barrier <= 5) score = app.W.tactical * 1.0; else if (barrier <= 10) score = app.W.tactical * 0.7; else score = app.W.tactical * 0.3; }
else if (style === 'off pace') { if (barrier <= 3) score = app.W.tactical * 0.6; else if (barrier <= 10) score = app.W.tactical * 1.0; else score = app.W.tactical * 0.7; }
else if (style === 'midfield' || style === 'off midfield') { if (barrier <= 8) score = app.W.tactical * 0.8; else score = app.W.tactical * 0.9; }
else if (style === 'backmarker') { if (barrier <= 4) score = app.W.tactical * 0.4; else if (barrier <= 10) score = app.W.tactical * 0.8; else score = app.W.tactical * 1.2; }
}
h.tacticalScore = score;
return score;
}
function calculateTrackConditionScore(h, raceCondition) {
if (!raceCondition) return 0;
var score = 0, runs = 0, wins = 0;
if (raceCondition === 'good') { runs = h.goodRuns; wins = h.goodWins; }
else if (raceCondition === 'soft') { runs = h.softRuns; wins = h.softWins; }
else if (raceCondition === 'heavy') { runs = h.heavyRuns; wins = h.heavyWins; }
else if (raceCondition === 'firm') { runs = h.firmRuns; wins = h.firmWins; }
if (runs > 0) {
var winRate = wins / runs;
var careerWinRate = h.careerRuns > 0 ? h.careerWins / h.careerRuns : 0;
if (winRate > careerWinRate * 1.2) score = app.W.trackCondition * 1.5;
else if (winRate > careerWinRate) score = app.W.trackCondition;
else if (winRate > 0) score = app.W.trackCondition * 0.5;
else if (runs >= 3) score = app.W.trackCondition * -0.5;
}
h.trackConditionScore = score;
return score;
}

// ── Second-Up and Third-Up scoring ───────────────────────────────────────
function calculateSecondUpScore(h) {
  if (!h.secondUpRuns || h.secondUpRuns < 1) return 0;
  var wr = h.secondUpWins / h.secondUpRuns;
  var careerRate = h.careerRuns > 0 ? h.careerWins / h.careerRuns : 0.15;
  // Benchmark against career rate so we reward genuine second-up specialists
  var W = app.W.secondUpForm || app.W.firstUp;
  var score = 0;
  if (wr >= 0.50 && h.secondUpRuns >= 2) score = W * 1.2;
  else if (wr >= careerRate * 1.4 && h.secondUpRuns >= 2) score = W * 0.8;
  else if (wr >= careerRate) score = W * 0.3;
  else if (wr < careerRate * 0.5 && h.secondUpRuns >= 3) score = W * -0.5;
  h.secondUpScore = Math.round(score * 10) / 10;
  return score;
}

function calculateThirdUpScore(h) {
  if (!h.thirdUpRuns || h.thirdUpRuns < 1) return 0;
  var wr = h.thirdUpWins / h.thirdUpRuns;
  var careerRate = h.careerRuns > 0 ? h.careerWins / h.careerRuns : 0.15;
  var W = app.W.secondUpForm || app.W.firstUp;
  var score = 0;
  if (wr >= 0.40 && h.thirdUpRuns >= 2) score = W * 0.7;
  else if (wr >= careerRate * 1.3 && h.thirdUpRuns >= 2) score = W * 0.35;
  else if (wr >= careerRate) score = W * 0.10;
  else if (h.thirdUpRuns >= 3 && wr < careerRate * 0.5) score = W * -0.25;
  h.thirdUpScore = Math.round(score * 10) / 10;
  return score;
}

function calculateFirstUpScore(h) {
if (h.daysAgo < 30) return 0;
var score = 0;
if (h.firstUpRuns > 0) {
var firstUpRate = h.firstUpWins / h.firstUpRuns;
var careerRate = h.careerRuns > 0 ? h.careerWins / h.careerRuns : 0;
if (firstUpRate > careerRate * 1.3) score = app.W.firstUp * 1.5;
else if (firstUpRate > careerRate) score = app.W.firstUp;
else if (h.firstUpWins > 0) score = app.W.firstUp * 0.6;
else if (h.firstUpRuns >= 3) score = app.W.firstUp * -0.3;
}
h.firstUpScore = score;
return score;
}

// ─── Second-Up Scoring ──────────────────────────────────────────────────────
// Horses having their 2nd run back from a spell — highly predictive cohort
// calculateSecondUpScore: see improved version above

// ─── Third-Up and Beyond Scoring ────────────────────────────────────────────
// Horses having their 3rd+ run from a spell — usually at peak fitness
// calculateThirdUpScore: see improved version above

// ─── Jockey Affinity Scoring ─────────────────────────────────────────────────
// How this horse performs specifically with this jockey
function calculateJockeyAffinityScore(h) {
if (!h.jockeyThisRuns || h.jockeyThisRuns < 2) return 0;
var rate = h.jockeyThisWins / h.jockeyThisRuns;
var careerRate = h.careerRuns > 0 ? h.careerWins / h.careerRuns : 0;
var W = app.W.jockeyForm || app.W.jockeyWin;
var score = 0;
if (rate > careerRate * 1.5 && h.jockeyThisRuns >= 3) score = W * 0.45;
else if (rate > careerRate * 1.2) score = W * 0.22;
else if (h.jockeyThisRuns >= 3 && rate < careerRate * 0.6) score = W * -0.25;
h.jockeyAffinityScore = score;
return score;
}

// ─── Prize Money Class Proxy ─────────────────────────────────────────────────
// Career average prize money relative to field average — class indicator
function calculatePrizeMoneyScore(horses, h) {
if (!h.prizemoney || h.prizemoney <= 0) return 0;
var fieldAvg = 0, count = 0;
for (var i = 0; i < horses.length; i++) {
  if (!horses[i].scratched && horses[i].prizemoney > 0) {
    fieldAvg += horses[i].prizemoney; count++;
  }
}
if (count === 0) return 0;
fieldAvg /= count;
var ratio = h.prizemoney / fieldAvg;
var score = 0;
if (ratio > 1.8) score = app.W.careerWin * 0.35;
else if (ratio > 1.3) score = app.W.careerWin * 0.18;
else if (ratio > 0.9) score = app.W.careerWin * 0.05;
else if (ratio < 0.5) score = app.W.careerWin * -0.15;
h.prizeMoneyScore = score;
return score;
}

// ─── In-Running Pattern (recent runs) ───────────────────────────────────────
// Detects if horse is improving through the field in its recent runs
// Uses the recentRuns structured data (800m/400m positions)
function calculateInRunningPattern(h) {
if (!h.recentRuns || h.recentRuns.length < 2) return 0;
var score = 0;
var improvingCount = 0, fadingCount = 0;
// Check last 3 runs for position improvement from 800m to 400m to finish
for (var i = 0; i < Math.min(3, h.recentRuns.length); i++) {
  var run = h.recentRuns[i];
  if (run.pos800m > 0 && run.pos400m > 0 && run.pos > 0) {
    var improved800to400 = run.pos800m - run.pos400m; // positive = moved up
    var improved400toFinish = run.pos400m - run.pos;
    if (improved400toFinish > 0) improvingCount++;
    else if (improved400toFinish < -2) fadingCount++;
  }
}
// Horse consistently finishing over top of rivals
if (improvingCount >= 2) score += app.W.finishStrength * 0.3;
else if (improvingCount >= 1) score += app.W.finishStrength * 0.12;
if (fadingCount >= 2) score -= app.W.finishStrength * 0.25;
h.inRunningScore = score;
return score;
}
function calculateDistanceScore(h) {
if (h.distanceRuns === 0) return 0;
var score = 0;
var distanceRate = h.distanceWins / h.distanceRuns;
var careerRate = h.careerRuns > 0 ? h.careerWins / h.careerRuns : 0;
if (distanceRate > careerRate * 1.3) score = app.W.distanceSuit * 1.5;
else if (distanceRate > careerRate) score = app.W.distanceSuit;
else if (h.distanceWins > 0) score = app.W.distanceSuit * 0.6;
else if (h.distanceRuns >= 3) score = app.W.distanceSuit * -0.3;
h.distanceScore = score;
return score;
}
function calculateLastMarginScore(h) {
if (h.lastMargin === null || h.lastMargin === undefined) return 0;
var score = 0;
var margin = h.lastMargin;
if (h.lastFinish) {
var position = parseInt(h.lastFinish.split('/')[0]);
if (position === 1) { score = margin > 2 ? app.W.lastStartMargin * 1.3 : app.W.lastStartMargin; }
else if (position === 2 && margin < 1) score = app.W.lastStartMargin * 0.9;
else if (position === 3 && margin < 1.5) score = app.W.lastStartMargin * 0.7;
else if (position <= 3 && margin < 3) score = app.W.lastStartMargin * 0.5;
else if (margin > 6) score = app.W.lastStartMargin * -0.5;
} else {
if (margin === 0) score = app.W.lastStartMargin * 1.0;
else if (margin < 1) score = app.W.lastStartMargin * 1.1;
else if (margin < 2) score = app.W.lastStartMargin * 0.85;
else if (margin < 3) score = app.W.lastStartMargin * 0.6;
else if (margin < 4) score = app.W.lastStartMargin * 0.4;
else if (margin < 6) score = app.W.lastStartMargin * 0.1;
else score = app.W.lastStartMargin * -0.4;
}
h.lastMarginScore = score;
return score;
}

// ── Jockey-Combo Scoring ─────────────────────────────────────────────────
// "This Jockey" field — how this horse goes with THIS specific jockey
function calculateJockeyComboScore(h) {
  if (!h.jockeyComboRuns || h.jockeyComboRuns < 1) return 0;
  var wr = h.jockeyComboWins / h.jockeyComboRuns;
  var W = app.W.jockeyForm || app.W.jockeyWin;
  var score = 0;
  if (wr >= 0.5  && h.jockeyComboRuns >= 2) score = W * 0.7;
  else if (wr >= 0.33 && h.jockeyComboRuns >= 2) score = W * 0.4;
  else if (wr >= 0.20) score = W * 0.15;
  else if (h.jockeyComboRuns >= 3 && wr === 0) score = W * -0.35;
  if (h.monthsRuns >= 3) {
    var mwr = h.monthsWins / h.monthsRuns;
    var cwr = h.careerRuns > 0 ? h.careerWins / h.careerRuns : 0;
    if (mwr > cwr * 1.3) score += W * 0.15;
    else if (mwr < cwr * 0.5 && h.monthsRuns >= 5) score -= W * 0.15;
  }
  h.jockeyComboScore = Math.round(score * 10) / 10;
  return score;
}

function calculateGearScore(h) {
var score = 0;
var gearList = h.gearChanges || [];
// Also check comments for inline gear mentions
var comments = (h.comments || '').toLowerCase();
var allGear = gearList.map(function(g){return g.toLowerCase();}).concat([comments]);
for (var i = 0; i < allGear.length; i++) {
var g = allGear[i];
var isFirstTime = g.indexOf('first time') !== -1 || g.indexOf('1st time') !== -1 || g.indexOf('new') !== -1;
var isOff = g.indexOf(' off') !== -1 || g.indexOf('removed') !== -1;
if (g.indexOf('blinkers') !== -1 || g.indexOf('winkers') !== -1) {
  if (isFirstTime) score += app.W.gearChange * 1.2;
  else if (isOff) score += app.W.gearChange * -0.4;
  else score += app.W.gearChange * 0.3;
} else if (g.indexOf('tongue tie') !== -1 || g.indexOf('tongue strap') !== -1) {
  if (isFirstTime) score += app.W.gearChange * 0.9;
  else score += app.W.gearChange * 0.2;
} else if (g.indexOf('hood') !== -1 || g.indexOf('ear muffs') !== -1) {
  if (isFirstTime) score += app.W.gearChange * 0.7;
} else if (g.indexOf('lugging bit') !== -1 || g.indexOf('cross nose') !== -1) {
  if (isFirstTime) score += app.W.gearChange * 0.5;
} else if (g.indexOf('pacifiers') !== -1 || g.indexOf('barrier blanket') !== -1) {
  if (isFirstTime) score += app.W.gearChange * 0.3;
} else if (isFirstTime && i < gearList.length) {
  score += app.W.gearChange * 0.4; // Generic first-time gear
}
}
h.gearScore = score;
return score;
}

// ── Alert Checker ─────────────────────────────────────────────────────────────
// Returns alerts array [{type, label, score}] for key flags that override normal scoring
function checkAlerts(horse) {
var alerts = [];
var comments = (horse.comments || '').toLowerCase();
var gear = (horse.gearChanges || []).join(' ').toLowerCase();
// Long layoff (>90 days since last run)
if (horse.daysAgo !== undefined && horse.daysAgo !== null && horse.daysAgo > 90) {
  var severity = horse.daysAgo > 180 ? -4 : -2;
  alerts.push({ type: 'layoff', label: horse.daysAgo + 'd break', score: severity, color: '#f59e0b' });
}
// Won barrier/jump-out trial (fitness indicator)
// Structured trial data (from new parser)
if (horse.trialCount > 0 && horse.trialBestPos <= 3) {
  var trialLabel = horse.trialBestPos === 1 ? 'Trial winner' :
                   horse.trialBestPos === 2 ? 'Trial 2nd' : 'Trial 3rd';
  var trialScore = horse.trialBestPos === 1 ? 4 : horse.trialBestPos === 2 ? 2 : 1;
  alerts.push({ type: 'trial', label: trialLabel, score: trialScore, color: '#10b981' });
} else if (comments.indexOf('trial') !== -1 || comments.indexOf('jump-out') !== -1 || comments.indexOf('jumpout') !== -1) {
  var trialWon = comments.indexOf('won') !== -1 || comments.indexOf('win') !== -1 || comments.indexOf('1st') !== -1;
  alerts.push({ type: 'trial', label: trialWon ? 'Trial winner' : 'Recent trial', score: trialWon ? 4 : 2, color: '#10b981' });
}
// First starter (extra uncertainty)
if (horse.careerRuns === 0 || horse.careerRuns === undefined) {
  alerts.push({ type: 'debut', label: 'Debut', score: 0, color: '#818cf8' });
}
// Strong gear upgrade (blinkers first time — already in gear score but flagged)
if ((gear + comments).indexOf('blinkers') !== -1 &&
    ((gear + comments).indexOf('first time') !== -1 || (gear + comments).indexOf('1st time') !== -1)) {
  alerts.push({ type: 'gear', label: 'Blinkers 1st', score: 2, color: '#06b6d4' });
}
// Tongue tie first time
if ((gear + comments).indexOf('tongue tie') !== -1 && (gear + comments).indexOf('first time') !== -1) {
  alerts.push({ type: 'gear', label: 'TT 1st', score: 1, color: '#06b6d4' });
}
// Weight relief (carrying significantly less than last start)
if (horse.weight > 0 && horse.lastWeight > 0 && (horse.lastWeight - horse.weight) >= 3) {
  alerts.push({ type: 'weight', label: '-' + (horse.lastWeight - horse.weight).toFixed(1) + 'kg', score: 2, color: '#10b981' });
}
return alerts;
}
function calculateRailScore(h, railOut) {
var barrier = parseInt(h.barrier) || 0;
if (barrier === 0) return 0;
var score = 0;
if (railOut >= 8) {
if (barrier >= 8) score = app.W.railPosition * 0.8;
else if (barrier <= 3) score = app.W.railPosition * -0.4;
else score = app.W.railPosition * 0.3;
} else if (railOut >= 4) {
if (barrier >= 8) score = app.W.railPosition * 0.4;
else if (barrier <= 3) score = app.W.railPosition * -0.2;
} else {
if (barrier <= 2) score = app.W.railPosition * 0.3;
else if (barrier <= 4) score = app.W.railPosition * 0.15;
else if (barrier >= 12) score = app.W.railPosition * -0.25;
else if (barrier >= 9) score = app.W.railPosition * -0.1;
}
h.railScore = score;
return score;
}
function getJockeyWinRate(jockey) {
if (!jockey || !app.jockeyStats[jockey]) return 0;
var s = app.jockeyStats[jockey];
// Recency-weighted: 50% recent 30d, 30% recent 90d, 20% career
// Fall back to next best available bucket
var r30  = (s.rides30  > 3) ? s.wins30  / s.rides30  : null;
var r90  = (s.rides90  > 5) ? s.wins90  / s.rides90  : null;
var rAll = (s.rides    > 3) ? s.wins    / s.rides    : null;
if (r30 !== null && r90 !== null && rAll !== null)
    return r30 * 0.50 + r90 * 0.30 + rAll * 0.20;
if (r90 !== null && rAll !== null)
    return r90 * 0.60 + rAll * 0.40;
if (rAll !== null) return rAll;
return 0;
}
function getTrainerWinRate(trainer) {
if (!trainer || !app.trainerStats[trainer]) return 0;
var s = app.trainerStats[trainer];
var r30  = (s.starters30  > 3) ? s.wins30  / s.starters30  : null;
var r90  = (s.starters90  > 5) ? s.wins90  / s.starters90  : null;
var rAll = (s.starters    > 3) ? s.wins    / s.starters    : null;
if (r30 !== null && r90 !== null && rAll !== null)
    return r30 * 0.50 + r90 * 0.30 + rAll * 0.20;
if (r90 !== null && rAll !== null)
    return r90 * 0.60 + rAll * 0.40;
if (rAll !== null) return rAll;
return 0;
}
function updateJockeyTrainerStats(winner, allHorses) {
var now = Date.now();
var MS_30D  = 30  * 24 * 3600 * 1000;
var MS_90D  = 90  * 24 * 3600 * 1000;
for (var i = 0; i < allHorses.length; i++) {
var h = allHorses[i];
if (h.scratched) continue;
if (h.jockey) {
if (!app.jockeyStats[h.jockey]) app.jockeyStats[h.jockey] = { rides: 0, wins: 0, rides30: 0, wins30: 0, rides90: 0, wins90: 0, lastTs: 0 };
var js = app.jockeyStats[h.jockey];
js.rides++; js.rides90++; js.rides30++;
if (h.name === winner.name) { js.wins++; js.wins90++; js.wins30++; }
js.lastTs = now;
}
if (h.trainer) {
if (!app.trainerStats[h.trainer]) app.trainerStats[h.trainer] = { starters: 0, wins: 0, starters30: 0, wins30: 0, starters90: 0, wins90: 0, lastTs: 0 };
var ts = app.trainerStats[h.trainer];
ts.starters++; ts.starters90++; ts.starters30++;
if (h.name === winner.name) { ts.wins++; ts.wins90++; ts.wins30++; }
ts.lastTs = now;
}
}
}
function calculatePacePressure(h, allHorses) {
var myStyle = (h.runningStyle || '').toLowerCase();
var myPos = h.settlingPosition || 0;
if (!myStyle && !myPos) {
var comments = (h.comments || '').toLowerCase();
var barrier = parseInt(h.barrier) || 0;
if (comments.indexOf('lead') !== -1 || comments.indexOf('front') !== -1 || comments.indexOf('on pace') !== -1) {
myStyle = 'leader';
} else if (comments.indexOf('stalk') !== -1 || comments.indexOf('sit') !== -1 || comments.indexOf('handy') !== -1) {
myStyle = 'pace';
} else if (comments.indexOf('midfield') !== -1 || comments.indexOf('settle mid') !== -1) {
myStyle = 'midfield';
} else if (comments.indexOf('back') !== -1 || comments.indexOf('last') !== -1 || comments.indexOf('tail') !== -1) {
myStyle = 'backmarker';
} else if (barrier <= 3 && h.odds <= 5) {
myStyle = 'pace';
}
}
if (!myStyle && !myPos) return 0;
var leaders = 0, paceRunners = 0, midfield = 0, backmarkers = 0;
var activeCount = 0;
for (var i = 0; i < allHorses.length; i++) {
if (allHorses[i].scratched) continue;
activeCount++;
var style = (allHorses[i].runningStyle || '').toLowerCase();
if (!style) {
var c = (allHorses[i].comments || '').toLowerCase();
if (c.indexOf('lead') !== -1 || c.indexOf('front') !== -1) style = 'leader';
else if (c.indexOf('back') !== -1 || c.indexOf('last') !== -1) style = 'backmarker';
}
if (style === 'leader') leaders++;
else if (style === 'pace') paceRunners++;
else if (style === 'midfield' || style === 'off midfield' || style === 'off pace') midfield++;
else if (style === 'backmarker') backmarkers++;
}
var totalFront = leaders + paceRunners;
var paceRatio = activeCount > 0 ? totalFront / activeCount : 0.3;
var score = 0;
if (myStyle === 'leader' || myPos <= 2) {
if (paceRatio < 0.2) score = app.W.pacePressure * 1.0;
else if (paceRatio < 0.3) score = app.W.pacePressure * 0.5;
else if (paceRatio < 0.4) score = app.W.pacePressure * -0.2;
else score = app.W.pacePressure * -0.6;
} else if (myStyle === 'pace' || (myPos > 2 && myPos <= 4)) {
if (paceRatio < 0.2) score = app.W.pacePressure * 0.2;
else if (paceRatio < 0.35) score = app.W.pacePressure * 0.6;
else score = app.W.pacePressure * 0.3;
} else if (myStyle === 'backmarker' || myPos >= 7) {
if (paceRatio >= 0.4) score = app.W.pacePressure * 0.9;
else if (paceRatio >= 0.3) score = app.W.pacePressure * 0.4;
else score = app.W.pacePressure * -0.3;
} else {
score = app.W.pacePressure * 0.2;
}
if (activeCount <= 6) score *= 0.6;
// Barrier trap / isolation risk overlay
var fieldSize2 = activeCount || 10;
var dist2 = parseInt((app.raceInfo && app.raceInfo.distance) || 1400);
var paceMatchDelta = calculatePaceMatch(myStyle, h.barrier, fieldSize2, dist2);
if (paceMatchDelta !== 0) {
  // Scale delta relative to the pacePressure weight (paceMatchDelta is in raw score units)
  var scaledDelta = paceMatchDelta * (app.W.pacePressure / 50);
  score += scaledDelta;
  if (paceMatchDelta < 0) h.trapRisk = true;
}
h.pacePressureScore = Math.round(score * 10) / 10;
return score;
}

// Speed Figure — standardises last-600m time to Good 4 / 1200m benchmark
// Benchmark 32.0s = rating 100.  Each 0.1s = 2pts.  Range 0-120.
function calculateSpeedFigure(last600Time, distance, trackCondition) {
  if (!last600Time || last600Time <= 0) return null;
  var condAdj = {
    'Firm 1': 0.98, 'Firm 2': 0.99, 'Firm': 1.0,
    'Good 3': 1.01, 'Good 4': 1.03, 'Good': 1.03,
    'Soft 5': 1.08, 'Soft 6': 1.12, 'Soft 7': 1.16, 'Soft': 1.12,
    'Heavy 8': 1.20, 'Heavy 9': 1.25, 'Heavy 10': 1.30, 'Heavy': 1.25
  };
  var cond = (trackCondition || '').trim();
  var condMulti = condAdj[cond];
  if (!condMulti) {
    var firstWord = cond.split(' ')[0];
    condMulti = condAdj[firstWord] || 1.03;
  }
  var dist = parseInt(distance) || 1200;
  var distAdj = Math.log(1200 / dist) * 0.5;
  var adjustedTime = last600Time * condMulti + distAdj;
  var rating = 100 - ((adjustedTime - 32.0) * 20);
  return Math.max(0, Math.min(120, Math.round(rating * 10) / 10));
}

// Pace / barrier trap-risk adjustment — returns a score delta (negative = penalty)
// Blended into calculatePacePressure result so it flows through existing weight logic
function calculatePaceMatch(runningStyle, barrier, fieldSize, distance) {
  barrier   = parseInt(barrier)   || 0;
  fieldSize = parseInt(fieldSize) || 10;
  distance  = parseInt(distance)  || 1400;
  var style = (runningStyle || '').toLowerCase();
  var isEarlySpeed = (style === 'leader' || style === 'pace');
  var isLate       = (style === 'backmarker' || style === 'midfield');
  // Early-speed horse drawn tight (1-4) in big sprint field - gets squeezed
  var trapRisk = isEarlySpeed && barrier <= 4 && fieldSize > 12 && distance < 1300;
  // Backmarker drawn very wide in small field - no cover, exposed
  var isolated = isLate && fieldSize <= 8 && barrier > Math.floor(fieldSize * 0.7);
  // Bonus: lone leader drawn inside in small sprint
  var freeRun  = isEarlySpeed && barrier <= 3 && fieldSize <= 8 && distance < 1400;
  if (trapRisk) return -8;
  if (isolated) return -5;
  if (freeRun)  return  4;
  return 0;
}


// ── ELO-style Class Ratings ───────────────────────────────────────────────────
// Maps the existing 1-11 classLevel scale to an ELO baseline (1=G1~1600, 11=Maiden~400)
// K=20 for early career (<10 races), K=12 for established horses
var CLASS_LEVEL_ELO = {
  1: 1600, 2: 1500, 3: 1350, 4: 1200, 5: 1100,
  6: 1000, 7:  900, 8:  800, 9:  700, 10: 600, 11: 400
};

function getEloRating(horseName) {
  if (!horseName) return 1000;
  return (app.classRatings && app.classRatings[horseName]) || 1000;
}

function updateEloRating(horseName, finishPos, fieldStrength, careerRuns) {
  if (!horseName) return;
  if (!app.classRatings) app.classRatings = {};
  var current = app.classRatings[horseName] || 1000;
  var K = (careerRuns && careerRuns < 10) ? 20 : 12;
  var expected = 1 / (1 + Math.pow(10, (fieldStrength - current) / 400));
  var actual = finishPos === 1 ? 1.0 : finishPos <= 3 ? 0.65 : finishPos <= 5 ? 0.35 : 0.05;
  var newRating = current + K * (actual - expected);
  app.classRatings[horseName] = Math.round(Math.max(200, Math.min(2000, newRating)));
}

function getClassAdvantage(horseName, raceClassLevel) {
  var elo = getEloRating(horseName);
  var required = CLASS_LEVEL_ELO[raceClassLevel] || 1000;
  // Each 100 ELO pts above/below requirement = raw advantage/disadvantage
  var diff = (elo - required) / 100;
  // Scale to weight contribution — capped to prevent domination
  var score = Math.max(-app.W.classChange * 0.8, Math.min(app.W.classChange * 1.0, diff * app.W.classChange * 0.18));
  return Math.round(score * 10) / 10;
}

// ── Weight-for-Age Allowance ──────────────────────────────────────────────────
// Official WFA scale adjustment (in kg) for 3yo and 4yo vs open handicap
// Returns a score contribution (positive = lighter than required → advantaged)
var WFA_SCALE = {
  '3': { 1000: -7.0, 1200: -8.5, 1400: -9.5, 1600: -10.5, 1800: -11.0, 2000: -12.0, 2400: -13.5 },
  '4': { 1000: -1.5, 1200: -2.0, 1400: -2.0, 1600: -2.5, 1800: -2.5, 2000: -3.0, 2400: -3.5 }
};

function getWeightForAgeAllowance(age, distance, sex) {
  var ageStr = String(parseInt(age) || 0);
  var dist = parseInt(distance) || 1400;
  var scale = WFA_SCALE[ageStr];
  if (!scale) return 0;
  // Find nearest distance bracket
  var brackets = Object.keys(scale).map(Number).sort(function(a,b){return a-b;});
  var nearest = brackets[0];
  for (var bi = 0; bi < brackets.length; bi++) {
    if (dist >= brackets[bi]) nearest = brackets[bi];
  }
  var allowance = scale[nearest] || 0;
  // Fillies/mares get an extra 1.5kg allowance
  var isFilly = sex && (sex.toLowerCase() === 'f' || sex.toLowerCase() === 'm' ||
                        sex.toLowerCase() === 'filly' || sex.toLowerCase() === 'mare');
  if (isFilly) allowance -= 1.5;
  return allowance; // negative = lighter than benchmark → raw kg advantage
}

// ── Form Line Pattern Recognition ─────────────────────────────────────────────
// Parses a margin-enriched form string like "1-0L 3-2.5L 2-0.8L" (most recent last)
// Also handles plain digit form strings "132" as fallback
function parseFormLine(formString) {
  if (!formString) return [];
  var results = [];
  // Try rich margin format first: entries separated by spaces
  var entries = formString.trim().split(/\s+/);
  for (var ei = 0; ei < entries.length; ei++) {
    var entry = entries[ei];
    // Format: position-marginL  e.g. "1-0L" "3-2.5L" "x" (unplaced)
    var richMatch = entry.match(/^(\d+)-?([\d.]*)[Ll]?$/);
    if (richMatch) {
      var pos = parseInt(richMatch[1]);
      var margin = richMatch[2] ? parseFloat(richMatch[2]) : 0;
      results.push({ pos: pos, margin: margin, beaten: pos <= 1 ? 0 : margin || (pos * 1.5) });
    } else {
      // Plain digit fallback
      var d = parseInt(entry);
      if (!isNaN(d) && d >= 0 && d <= 9) {
        results.push({ pos: d, margin: null, beaten: d === 0 ? 99 : (d <= 1 ? 0 : d * 1.5) });
      }
    }
  }
  // If no rich entries found, parse digit-by-digit
  if (results.length === 0) {
    var digits = formString.replace(/[^0-9]/g, '');
    for (var di = 0; di < digits.length; di++) {
      var p = parseInt(digits[di]);
      results.push({ pos: p, margin: null, beaten: p === 0 ? 99 : (p <= 1 ? 0 : p * 1.5) });
    }
  }
  return results; // chronological order, most recent last
}

function recentFormTrend(horse) {
  // Use finishPositions array (already stored on horse) — most recent last
  var positions = horse.finishPositions && horse.finishPositions.length >= 2
    ? horse.finishPositions.slice(-5)
    : null;
  // Fall back to parsing form string
  if (!positions || positions.length < 2) {
    var parsed = parseFormLine(horse.form || '');
    positions = parsed.map(function(r){ return r.pos; }).filter(function(p){ return p > 0 && p < 10; });
  }
  if (!positions || positions.length < 2) return 0;
  // Weighted trend: recent races count more
  var n = positions.length;
  var weightedSum = 0;
  var totalWeight = 0;
  for (var ti = 1; ti < n; ti++) {
    var improvement = positions[ti - 1] - positions[ti]; // positive = improved
    var w = Math.pow(1.4, ti);
    weightedSum += improvement * w;
    totalWeight += w;
  }
  var trend = totalWeight > 0 ? weightedSum / totalWeight : 0;
  // Map to a score: improving = positive, declining = negative
  if (trend < -2)      return  5;  // strong improvement (e.g. 5th→2nd→1st)
  else if (trend < -1) return  3;
  else if (trend < -0.3) return 1;
  else if (trend < 0.3)  return  0;
  else if (trend < 1)  return -1;
  else if (trend < 2)  return -3;
  else                 return -5;  // strong decline
}

function calculateClassChange(h, raceClassLevel) {
var horseClass = h.classLevel || h.lastClass || 0;
if (!horseClass && h.sbRating > 0) {
if (h.sbRating >= 100) horseClass = 3;
else if (h.sbRating >= 90) horseClass = 4;
else if (h.sbRating >= 80) horseClass = 5;
else if (h.sbRating >= 70) horseClass = 7;
else if (h.sbRating >= 60) horseClass = 8;
else horseClass = 9;
}
if (!horseClass && h.odds > 0) {
if (h.odds <= 3) horseClass = 5;
else if (h.odds <= 6) horseClass = 6;
else if (h.odds <= 15) horseClass = 8;
else horseClass = 9;
}
if (!horseClass && h.careerRuns >= 5) {
var wr = h.careerWins / h.careerRuns;
if (wr > 0.3) horseClass = 5;
else if (wr > 0.15) horseClass = 7;
else horseClass = 9;
}
if (!horseClass) return 0;
var currentClass = raceClassLevel || 7;
var prevClass = h.lastClass || horseClass;
var classDrop = prevClass - currentClass;
var score = 0;
if (classDrop >= 3) score = app.W.classChange * 1.0;
else if (classDrop === 2) score = app.W.classChange * 0.7;
else if (classDrop === 1) score = app.W.classChange * 0.4;
else if (classDrop === 0) score = 0;
else if (classDrop === -1) score = app.W.classChange * -0.3;
else if (classDrop === -2) score = app.W.classChange * -0.6;
else score = app.W.classChange * -0.8;
if (classDrop < 0 && h.careerRuns >= 10) {
var winRate = h.careerWins / h.careerRuns;
if (winRate > 0.25) score *= 0.5;
}
// ELO class advantage layered on top of historical class movement
var eloAdv = getClassAdvantage(h.name, currentClass);
score += eloAdv;
h.eloRating = getEloRating(h.name);
h.classChangeScore = Math.round(score * 10) / 10;
return score;
}
function calculateFormMomentum(h) {
var score = 0;
if (h.finishPositions && h.finishPositions.length >= 2) {
var positions = h.finishPositions;
var len = Math.min(5, positions.length);
var recentSlice = positions.slice(-len);
var momentum = 0;
var totalWeight = 0;
for (var i = 1; i < recentSlice.length; i++) {
var improvement = recentSlice[i - 1] - recentSlice[i];
var recencyWeight = Math.pow(1.5, i);
momentum += improvement * recencyWeight;
totalWeight += recencyWeight;
}
if (totalWeight > 0) {
var normalizedMomentum = Math.max(-5, Math.min(5, momentum / totalWeight));
score = (normalizedMomentum / 5) * app.W.formMomentum;
}
if (recentSlice.length >= 2) {
var last = recentSlice[recentSlice.length - 1];
var secondLast = recentSlice[recentSlice.length - 2];
if (last <= 3 && secondLast <= 3) score += app.W.formMomentum * 0.3;
if (last >= 7 && secondLast >= 7) score -= app.W.formMomentum * 0.2;
}
if (recentSlice[recentSlice.length - 1] === 1) score += app.W.formMomentum * 0.15;
}
var comments = (h.comments || '').toLowerCase();
if (comments.indexOf('improv') !== -1 || comments.indexOf('progressive') !== -1 ||
comments.indexOf('on the up') !== -1 || comments.indexOf('last win') !== -1 ||
comments.indexOf('peak') !== -1) {
score += app.W.formMomentum * 0.25;
}
if (comments.indexOf('declin') !== -1 || comments.indexOf('regress') !== -1 ||
comments.indexOf('disappoint') !== -1 || comments.indexOf('well below') !== -1) {
score -= app.W.formMomentum * 0.25;
}
if (h.lastMargin !== null && h.lastMargin !== undefined) {
if (h.lastMargin === 0) score += app.W.formMomentum * 0.1;
else if (h.lastMargin < 0.5) score += app.W.formMomentum * 0.05;
}
// Form trend overlay from pattern recognition
var trend = recentFormTrend(h);
if (trend !== 0) {
  var trendScore = (trend / 5) * app.W.formMomentum * 0.35;
  score += trendScore;
}
h.formTrend = trend;
h.formMomentumScore = Math.round(score * 10) / 10;
return score;
}
function calculateFinishStrength(h) {
var settlePos = h.lastSettling || 0;
var finishPos = h.lastFinishPos || 0;
var score = 0;
if (settlePos > 0 && finishPos > 0) {
var posGain = settlePos - finishPos;
if (posGain >= 4) score = app.W.finishStrength * 1.0;
else if (posGain >= 3) score = app.W.finishStrength * 0.8;
else if (posGain >= 2) score = app.W.finishStrength * 0.5;
else if (posGain >= 1) score = app.W.finishStrength * 0.3;
else if (posGain === 0) score = 0;
else if (posGain >= -1) score = app.W.finishStrength * -0.2;
else if (posGain >= -3) score = app.W.finishStrength * -0.5;
else score = app.W.finishStrength * -0.8;
if (posGain >= 2 && h.lastMargin !== null && h.lastMargin < 2) {
score += app.W.finishStrength * 0.3;
}
}
else {
var style = (h.runningStyle || '').toLowerCase();
var predictedPos = h.settlingPosition || 0;
if (style === 'backmarker' || predictedPos >= 7) {
if (finishPos > 0 && finishPos <= 3) score = app.W.finishStrength * 0.8;
else if (h.winPct > 15) score = app.W.finishStrength * 0.5;
else score = app.W.finishStrength * 0.2;
}
else if (style === 'midfield' || style === 'off pace' || style === 'off midfield' || (predictedPos >= 4 && predictedPos <= 6)) {
if (finishPos > 0 && finishPos <= 2) score = app.W.finishStrength * 0.5;
else if (h.winPct > 20) score = app.W.finishStrength * 0.3;
}
else if (style === 'leader' || style === 'pace' || predictedPos <= 2) {
if (finishPos > 5) score = app.W.finishStrength * -0.3;
else score = 0;
}
var comments = (h.comments || '').toLowerCase();
if (comments.indexOf('strong') !== -1 || comments.indexOf('rattl') !== -1 ||
comments.indexOf('burst') !== -1 || comments.indexOf('clos') !== -1 ||
comments.indexOf('storm') !== -1 || comments.indexOf('flew') !== -1) {
score += app.W.finishStrength * 0.3;
}
if (comments.indexOf('weaken') !== -1 || comments.indexOf('tired') !== -1 ||
comments.indexOf('faded') !== -1 || comments.indexOf('stopped') !== -1) {
score -= app.W.finishStrength * 0.3;
}
if (h.finishPositions && h.finishPositions.length >= 3) {
var recent3 = h.finishPositions.slice(-3);
var avgRecent = (recent3[0] + recent3[1] + recent3[2]) / 3;
if (avgRecent <= 2.5 && (style === 'backmarker' || style === 'midfield' || style === 'off pace')) {
score += app.W.finishStrength * 0.2;
}
}
}
h.finishStrengthScore = Math.round(score * 10) / 10;
return score;
}
function calculateSectionalSpeed(h, allHorses) {
// Speed Figure path — highest fidelity when raw last-600m seconds are available
if (h.last600Time > 0) {
  var dist = parseInt((app.raceInfo && app.raceInfo.distance) || 1200);
  var cond = (app.raceInfo && app.raceInfo.condition) || '';
  var sf = calculateSpeedFigure(h.last600Time, dist, cond);
  if (sf !== null) {
    h.speedFigure = sf;
    // Compare to field average (only horses that also have last600Time)
    var sfSum = 0, sfCount = 0;
    for (var sfi = 0; sfi < allHorses.length; sfi++) {
      if (!allHorses[sfi].scratched && allHorses[sfi].last600Time > 0) {
        var oSF = calculateSpeedFigure(allHorses[sfi].last600Time, dist, cond);
        if (oSF !== null) { sfSum += oSF; sfCount++; }
      }
    }
    var sfScore = 0;
    if (sfCount >= 2) {
      var sfAvg = sfSum / sfCount;
      var sfDiff = sf - sfAvg;
      if      (sfDiff >  8) sfScore = app.W.sectionalSpeed * 1.2;
      else if (sfDiff >  4) sfScore = app.W.sectionalSpeed * 0.9;
      else if (sfDiff >  1) sfScore = app.W.sectionalSpeed * 0.5;
      else if (sfDiff > -1) sfScore = 0;
      else if (sfDiff > -4) sfScore = app.W.sectionalSpeed * -0.4;
      else                  sfScore = app.W.sectionalSpeed * -0.8;
    } else {
      // Single benchmark comparison: 100 = good, each pt above/below
      var sfDiff2 = sf - 90; // 90 = solid field-grade benchmark
      sfScore = (sfDiff2 / 10) * app.W.sectionalSpeed * 0.6;
      sfScore = Math.max(-app.W.sectionalSpeed, Math.min(app.W.sectionalSpeed, sfScore));
    }
    h.sectionalSpeedScore = Math.round(sfScore * 10) / 10;
    return sfScore;
  }
}
// FormSectionals: use avgSpeed and lateSpeed for a richer comparison
if (h.avgSpeed > 0) {
var fsSum = 0, fsCount = 0;
for (var fi = 0; fi < allHorses.length; fi++) {
if (allHorses[fi].scratched) continue;
if (allHorses[fi].avgSpeed > 0) { fsSum += allHorses[fi].avgSpeed; fsCount++; }
}
if (fsCount >= 2) {
var fsAvg = fsSum / fsCount;
var fsDiff = h.avgSpeed - fsAvg; // positive = faster than field avg
var lateBonus = 0;
if (h.lateSpeed > 0 && h.earlySpeed > 0) {
// Horse that finishes faster than it started = strong finisher
var speedUp = h.lateSpeed - h.earlySpeed;
if (speedUp > 3) lateBonus = app.W.sectionalSpeed * 0.3;
else if (speedUp > 1) lateBonus = app.W.sectionalSpeed * 0.15;
else if (speedUp < -3) lateBonus = app.W.sectionalSpeed * -0.2;
}
var fsScore = 0;
if (fsDiff > 2.0) fsScore = app.W.sectionalSpeed * 1.0;
else if (fsDiff > 1.0) fsScore = app.W.sectionalSpeed * 0.7;
else if (fsDiff > 0.3) fsScore = app.W.sectionalSpeed * 0.4;
else if (fsDiff > -0.3) fsScore = 0;
else if (fsDiff > -1.0) fsScore = app.W.sectionalSpeed * -0.3;
else fsScore = app.W.sectionalSpeed * -0.6;
var total = Math.max(-app.W.sectionalSpeed, Math.min(app.W.sectionalSpeed * 1.2, fsScore + lateBonus));
h.sectionalSpeedScore = Math.round(total * 10) / 10;
return total;
}
}
// FormSectionals 600m speed in km/h (separate from seconds-based sectional600)
if (h.sectional600kmh > 0) {
var kmhSum = 0, kmhCount = 0;
for (var ki = 0; ki < allHorses.length; ki++) {
if (allHorses[ki].scratched) continue;
if (allHorses[ki].sectional600kmh > 0) { kmhSum += allHorses[ki].sectional600kmh; kmhCount++; }
}
if (kmhCount >= 2) {
var kmhAvg = kmhSum / kmhCount;
var kmhDiff = h.sectional600kmh - kmhAvg; // positive = faster at 600m
var kmhScore = 0;
if (kmhDiff > 2.0)       kmhScore = app.W.sectionalSpeed * 0.8;
else if (kmhDiff > 1.0)  kmhScore = app.W.sectionalSpeed * 0.5;
else if (kmhDiff > 0.3)  kmhScore = app.W.sectionalSpeed * 0.25;
else if (kmhDiff > -0.3) kmhScore = 0;
else if (kmhDiff > -1.0) kmhScore = app.W.sectionalSpeed * -0.25;
else                     kmhScore = app.W.sectionalSpeed * -0.5;
h.sectionalSpeedScore = (h.sectionalSpeedScore || 0) + Math.round(kmhScore * 10) / 10;
return kmhScore;
}
}
if (h.sectional600 > 0) {
var sum = 0, count = 0;
for (var i = 0; i < allHorses.length; i++) {
if (allHorses[i].scratched) continue;
if (allHorses[i].sectional600 > 0) { sum += allHorses[i].sectional600; count++; }
}
var score = 0;
if (count >= 3) {
var avg = sum / count;
var diff = avg - h.sectional600;
if (diff > 1.5) score = app.W.sectionalSpeed * 1.0;
else if (diff > 0.8) score = app.W.sectionalSpeed * 0.7;
else if (diff > 0.3) score = app.W.sectionalSpeed * 0.4;
else if (diff > -0.3) score = 0;
else if (diff > -0.8) score = app.W.sectionalSpeed * -0.3;
else score = app.W.sectionalSpeed * -0.6;
} else {
var benchmark = 35.5;
var dist = parseInt(app.raceInfo.distance) || 1400;
if (dist <= 1200) benchmark = 34.0;
else if (dist <= 1600) benchmark = 34.8;
else if (dist <= 2000) benchmark = 35.5;
else benchmark = 36.2;
var absDiff = benchmark - h.sectional600;
score = (absDiff / 2) * app.W.sectionalSpeed;
score = Math.max(-app.W.sectionalSpeed, Math.min(app.W.sectionalSpeed, score));
}
h.sectionalSpeedScore = Math.round(score * 10) / 10;
return score;
}
var style = (h.runningStyle || '').toLowerCase();
var settlePos = h.settlingPosition || 0;
var finishPos = h.lastFinishPos || 0;
var margin = h.lastMargin;
var score = 0;
if ((style === 'backmarker' || settlePos >= 7) && finishPos > 0 && finishPos <= 3) {
score = app.W.sectionalSpeed * 0.7;
if (margin !== null && margin < 1) score = app.W.sectionalSpeed * 0.9;
}
else if ((style === 'off pace' || style === 'off midfield' || style === 'midfield' || (settlePos >= 4 && settlePos <= 6)) && finishPos > 0 && finishPos <= 2) {
score = app.W.sectionalSpeed * 0.4;
if (margin !== null && margin === 0) score = app.W.sectionalSpeed * 0.6;
}
else if ((style === 'leader' || style === 'pace') && finishPos > 0 && finishPos > 5) {
score = app.W.sectionalSpeed * -0.3;
}
var comments = (h.comments || '').toLowerCase();
if (comments.indexOf('burst') !== -1 || comments.indexOf('sprint') !== -1 ||
comments.indexOf('quick') !== -1 || comments.indexOf('flashed') !== -1) {
score += app.W.sectionalSpeed * 0.2;
}
if (comments.indexOf('one pace') !== -1 || comments.indexOf('no sprint') !== -1 ||
comments.indexOf('plodded') !== -1 || comments.indexOf('battled') !== -1) {
score -= app.W.sectionalSpeed * 0.15;
}
score = Math.max(-app.W.sectionalSpeed, Math.min(app.W.sectionalSpeed, score));
h.sectionalSpeedScore = Math.round(score * 10) / 10;
return score;
}
function calculateWeatherRailBias(h, raceInfo) {
var barrier = parseInt(h.barrier) || 0;
if (barrier === 0) return 0;
var condition = (raceInfo.conditionType || 'good').toLowerCase();
var railOut = raceInfo.railOut || 0;
var weather = (raceInfo.weather || '').toLowerCase();
var isWet = condition === 'heavy' || condition === 'soft' || weather.indexOf('rain') >= 0 || weather.indexOf('shower') >= 0;
var score = 0;
if (isWet) {
if (barrier <= 3) score += app.W.weatherRailBias * 0.5;
else if (barrier <= 6) score += app.W.weatherRailBias * 0.15;
else if (barrier >= 10) score -= app.W.weatherRailBias * 0.35;
else if (barrier >= 7) score -= app.W.weatherRailBias * 0.1;
} else {
if (barrier <= 2) score += app.W.weatherRailBias * 0.2;
else if (barrier <= 4) score += app.W.weatherRailBias * 0.08;
else if (barrier >= 12) score -= app.W.weatherRailBias * 0.15;
else if (barrier >= 9) score -= app.W.weatherRailBias * 0.05;
}
if (railOut >= 6) {
if (barrier >= 8) score += app.W.weatherRailBias * 0.4;
else if (barrier <= 3) score -= app.W.weatherRailBias * 0.25;
} else if (railOut >= 3) {
if (barrier >= 8) score += app.W.weatherRailBias * 0.15;
}
if (isWet && h.heavyRuns + h.softRuns >= 2) {
var wetWins = (h.heavyWins || 0) + (h.softWins || 0);
var wetRuns = h.heavyRuns + h.softRuns;
var wetRate = wetWins / wetRuns;
if (wetRate > 0.2) score += app.W.weatherRailBias * 0.35;
else if (wetRate > 0) score += app.W.weatherRailBias * 0.1;
else score -= app.W.weatherRailBias * 0.15;
}
else if (!isWet && h.goodRuns + h.firmRuns >= 3) {
var dryWins = (h.goodWins || 0) + (h.firmWins || 0);
var dryRuns = h.goodRuns + h.firmRuns;
var dryRate = dryWins / dryRuns;
if (dryRate > 0.2) score += app.W.weatherRailBias * 0.15;
}
if (isWet && h.heavyRuns === 0 && h.softRuns === 0) {
score -= app.W.weatherRailBias * 0.2;
}
if (!isWet && h.goodRuns === 0 && h.firmRuns === 0 && (h.heavyRuns > 0 || h.softRuns > 0)) {
score -= app.W.weatherRailBias * 0.1;
}
h.weatherRailBiasScore = Math.round(score * 10) / 10;
return score;
}
function getMarginLearningMultiplier(actual, predicted, predictedRank, actualRank) {
if (actual.name === predicted.name) return 1.0;
if (actualRank && predictedRank && actualRank <= 3 && predictedRank <= 3 && actual.name !== predicted.name) {
return 0.5;
}
var margin = predicted.lastMargin;
if (margin !== null && margin !== undefined) {
if (margin < 0.5) return 1.2;
if (margin < 1.0) return 1.0;
if (margin < 2.0) return 0.8;
if (margin < 4.0) return 0.6;
return 0.4;
}
var predictedFinishPos = predicted.lastFinishPos || 0;
var actualFinishPos = actual.lastFinishPos || 0;
if (predictedFinishPos > 0 && actualFinishPos > 0) {
var posDiff = Math.abs(predictedFinishPos - actualFinishPos);
if (posDiff <= 1) return 1.0;
if (posDiff <= 3) return 0.7;
return 0.5;
}
return 0.8;
}
function calculateStatisticalBonus(h, fieldSize) {
var S = app.AUS_STATS;
var baseline = S.baselineStarter;
var bonus = 0;
if (h.lastMargin !== null && h.lastMargin !== undefined) {
var m = h.lastMargin;
var marginRate = baseline;
if (m === 0) marginRate = S.lastMargin[0];
else if (m < 1) marginRate = S.lastMargin[0.5];
else if (m < 2) marginRate = S.lastMargin[1.5];
else if (m < 3) marginRate = S.lastMargin[2.5];
else if (m < 4) marginRate = S.lastMargin[3.5];
else if (m < 5) marginRate = S.lastMargin[4.5];
else marginRate = S.lastMargin[5.5];
bonus += (marginRate - baseline) * 4;
}
if (h.careerRuns >= 10) {
var winPct = (h.careerWins / h.careerRuns) * 100;
var careerRate = baseline;
if (winPct >= 50) careerRate = S.careerWinPct[55];
else if (winPct >= 40) careerRate = S.careerWinPct[45];
else if (winPct >= 30) careerRate = S.careerWinPct[35];
else if (winPct >= 20) careerRate = S.careerWinPct[25];
else if (winPct >= 10) careerRate = S.careerWinPct[15];
else careerRate = S.careerWinPct[5];
bonus += (careerRate - baseline) * 3;
}
if (h.careerRuns >= 10) {
var placePct = ((h.careerWins + (h.careerPlaces || 0)) / h.careerRuns) * 100;
var placeRate = baseline;
if (placePct >= 70) placeRate = S.careerPlacePct[75];
else if (placePct >= 60) placeRate = S.careerPlacePct[65];
else if (placePct >= 50) placeRate = S.careerPlacePct[55];
else if (placePct >= 40) placeRate = S.careerPlacePct[45];
else if (placePct >= 30) placeRate = S.careerPlacePct[35];
else if (placePct >= 20) placeRate = S.careerPlacePct[25];
else if (placePct >= 10) placeRate = S.careerPlacePct[15];
else placeRate = S.careerPlacePct[5];
bonus += (placeRate - baseline) * 2;
}
if (h.form) {
var digits = h.form.replace(/[^0-9]/g, '');
if (digits.length > 0) {
var lastPos = parseInt(digits.charAt(digits.length - 1));
if (lastPos > 0 && lastPos <= 4 && S.lastFinish[lastPos]) {
bonus += (S.lastFinish[lastPos] - baseline) * 3;
}
}
}
var barrier = parseInt(h.barrier) || 0;
if (barrier > 0 && barrier <= 5) {
var barrierTable = fieldSize > 12 ? S.barrierLarge : S.barrierSmall;
var barrierRate = barrierTable[barrier] || baseline;
bonus += (barrierRate - baseline) * 2;
} else if (barrier > 12) {
bonus -= (fieldSize > 12 ? 3 : 1.5);
}
if (h.trackWins > 0) {
bonus += (S.wonTrackBefore - baseline) * 3;
}
if (h.distanceWins > 0) {
bonus += (S.wonDistanceBefore - baseline) * 2;
}
if (h.odds > 0 && h.odds <= 3.5 && fieldSize >= 4) {
var fSize = Math.min(16, Math.max(4, fieldSize));
var favRate = S.favFieldSize[fSize] || 30;
bonus += (favRate / 100) * 15;
}
h.statisticalBonus = Math.round(bonus * 10) / 10;
return bonus;
}
// Race Order score — raceNum=1 means top of race-order view (fastest expected early)
// Lower rank → more likely to run near front → positive modifier
function calculateRaceOrderScore(h, fieldSize) {
  var rank = h.raceNum || 0;
  if (rank <= 0) return 0;
  var W = app.W || {};
  var raceOrderW = W.raceOrder || 25;
  var fs = fieldSize || 10;
  // Top-ranked horses get a bonus; bottom-ranked get a penalty
  // rank 1 = best (+1.0x), rank fs = worst (-0.5x)
  var relativeRank = (fs - rank) / Math.max(fs - 1, 1); // 1.0 for rank 1, 0.0 for rank fs
  var score = (relativeRank - 0.4) * raceOrderW; // positive for top 60% of field by race order rank
  h.raceOrderScore = Math.round(score * 10) / 10;
  return score;
}

// Barrier Order score — barrierRank=1 means most favoured barrier draw
// Lower barrierRank → more advantageous starting position
function calculateBarrierOrderScore(h, fieldSize) {
  var rank = h.barrierRank || 0;
  if (rank <= 0) return 0;
  var W = app.W || {};
  var barrierOrderW = W.barrierOrder || 20;
  var fs = fieldSize || 10;
  var relativeRank = (fs - rank) / Math.max(fs - 1, 1); // 1.0 for rank 1, 0.0 for rank fs
  var score = (relativeRank - 0.3) * barrierOrderW; // positive for top 70% of field by barrier rank
  h.barrierOrderScore = Math.round(score * 10) / 10;
  return score;
}

function calculateTop3PlacementScore(h, allHorses, fieldSize) {
var score = 0;
if (h.consistencyScore !== undefined && h.consistencyScore !== null) {
score += h.consistencyScore * 150;
}
if (h.careerRuns > 0) {
var placeRate = (h.careerPlaces + h.careerWins) / h.careerRuns;
score += placeRate * 120;
}
if (h.form) {
var digits = h.form.replace(/[^0-9]/g, '');
var recentRuns = Math.min(5, digits.length);
var top3Count = 0;
for (var i = 0; i < recentRuns; i++) {
var pos = parseInt(digits[digits.length - 1 - i]);
if (!isNaN(pos) && pos <= 3) top3Count++;
}
if (recentRuns > 0) {
var recentTop3Rate = top3Count / recentRuns;
score += recentTop3Rate * 100;
}
}
if (h.odds > 0 && h.odds < 1000) {
var placeProbability = Math.min(1, (1 / h.odds) * 2.5);
score += placeProbability * 80;
}
if (h.trackDistRuns > 0) {
var trackDistPlaceRate = (h.trackDistWins + (h.trackDistPlaces || 0)) / h.trackDistRuns;
score += trackDistPlaceRate * 60;
}
if (h.sbRating > 0 && h.sbRating <= 200) {
var ratingPlaceBonus = (h.sbRating / 100) * 40;
score += ratingPlaceBonus;
}
// Note: finStr and momentum already flow through winScore — do not re-add here
// top3PlacementScore focuses purely on placement-specific signals
return Math.max(0, score);
}
function scoreHorses(list) {
var railOut = app.raceInfo.railOut || 0;
var fieldSize = list.filter(function(h) { return !h.scratched; }).length;
var W = app.W || app.baseWeights || {};
for (var i = 0; i < list.length; i++) {
var h = list[i];
if (h.scratched) { h.score = 0; continue; }
var s = 0;
h.factorContributions = {};
if (h.odds > 0 && h.odds < 1000) { var oddsScore = (1 / h.odds) * W.odds; s += oddsScore; h.factorContributions.odds = oddsScore; }
if (h.sbRating > 0 && h.sbRating <= 200) { var ratingScore = h.sbRating * W.rating; s += ratingScore; h.factorContributions.rating = ratingScore; }
if (h.careerRuns > 0) { var cws = (h.careerWins / h.careerRuns) * W.careerWin; var cps = (h.careerPlaces / h.careerRuns) * W.careerPlace; s += cws + cps; h.factorContributions.career = cws + cps; }
if (h.trackRuns > 0) { var ts = (h.trackWins / h.trackRuns) * W.trackWin; s += ts; h.factorContributions.track = ts; }
var formScore = calculateFormScore(h); s += formScore; h.factorContributions.form = formScore;
var freshnessScore = calculateFreshnessScore(h); s += freshnessScore; h.factorContributions.freshness = freshnessScore;
var tacticalScore = calculateTacticalScore(h); s += tacticalScore; h.factorContributions.tactical = tacticalScore;
if (h.jockey) { h.jockeyWinRate = getJockeyWinRate(h.jockey); var js = h.jockeyWinRate * W.jockeyWin; s += js; h.factorContributions.jockey = js; }
if (h.trainer) { h.trainerWinRate = getTrainerWinRate(h.trainer); var trs = h.trainerWinRate * W.trainerWin; s += trs; h.factorContributions.trainer = trs; }
if (h.trackDistRuns > 0) { var tds = (h.trackDistWins / h.trackDistRuns) * W.trackDistWin; s += tds; h.factorContributions.trackDist = tds; }
var trackCondScore = calculateTrackConditionScore(h, app.raceInfo.conditionType); s += trackCondScore; h.factorContributions.trackCond = trackCondScore;
var firstUpScore = calculateFirstUpScore(h); s += firstUpScore; h.factorContributions.firstUp = firstUpScore;
var distanceScore = calculateDistanceScore(h); s += distanceScore; h.factorContributions.distance = distanceScore;
var lastMarginScore = calculateLastMarginScore(h); s += lastMarginScore; h.factorContributions.lastMargin = lastMarginScore;
var gearScore = calculateGearScore(h); s += gearScore; h.factorContributions.gear = gearScore;
// Second-up / Third-up (only apply when relevant — detect run count from daysAgo)
var upPhase = h.secondUpRuns > 0 || h.thirdUpRuns > 0 ? (
  // Determine if this is 2nd or 3rd run from the daysAgo + spell detection
  // Conservative: apply secondUp if firstUpRuns>=1 and daysAgo<60 (likely a run back)
  (h.daysAgo < 60 && h.firstUpRuns >= 1 && h.secondUpRuns > 0) ? 'second' :
  (h.daysAgo < 45 && h.secondUpRuns >= 1 && h.thirdUpRuns > 0) ? 'third' : 'none'
) : 'none';
if (upPhase === 'second') {
  var su2 = calculateSecondUpScore(h); s += su2; h.factorContributions.secondUp = su2;
} else if (upPhase === 'third') {
  var tu2 = calculateThirdUpScore(h); s += tu2; h.factorContributions.thirdUp = tu2;
}
// Jockey-combo score
var jcScore = calculateJockeyComboScore(h); s += jcScore; h.factorContributions.jockeyCombo = jcScore;
// Claim allowance: jockey's weight claim reduces effective load — treat like weight relief
if (h.claimKg > 0) {
  var claimBonus = h.claimKg * 1.5 * (app.W.weight || 2.0);
  s += claimBonus; h.factorContributions.claimAllowance = Math.round(claimBonus * 10) / 10;
}
var railScore = calculateRailScore(h, railOut); s += railScore; h.factorContributions.rail = railScore;
if (h.weight > 0 && h.weight < 70) {
  var raceDist = parseInt(app.raceInfo.distance) || 1400;
  var wfaAdj = getWeightForAgeAllowance(h.age, raceDist, h.sex);
  // Effective weight adjusted for WFA — lower effective weight = lighter = faster
  var effectiveWeight = h.weight + wfaAdj; // wfaAdj is negative for younger horses
  var ws = (60 - effectiveWeight) * W.weight;
  h.wfaAllowance = Math.round(wfaAdj * 10) / 10;
  s += ws; h.factorContributions.weight = ws;
}
var statBonus = calculateStatisticalBonus(h, fieldSize); s += statBonus; h.factorContributions.stats = statBonus;
var paceScore = calculatePacePressure(h, list); s += paceScore; h.factorContributions.pace = paceScore;
var classScore = calculateClassChange(h, app.raceInfo.classLevel || 0); s += classScore; h.factorContributions.classChg = classScore;
var momentumScore = calculateFormMomentum(h); s += momentumScore; h.factorContributions.momentum = momentumScore;
var finStrScore = calculateFinishStrength(h); s += finStrScore; h.factorContributions.finStr = finStrScore;
var sectScore = calculateSectionalSpeed(h, list); s += sectScore; h.factorContributions.sectional = sectScore;
if (h.speedFigure !== undefined) h.factorContributions.speedFigure = h.speedFigure;
var wrbScore = calculateWeatherRailBias(h, app.raceInfo);
// Alert checks (layoff, trial, gear, debut)
var horseAlerts = checkAlerts(h);
h.alerts = horseAlerts;
var alertScore = 0;
horseAlerts.forEach(function(a){ alertScore += a.score; });
if (alertScore !== 0) { s += alertScore; h.factorContributions.alerts = alertScore; }
// Jockey affinity and prize money (genuinely new signals, not double-counted)
var jockeyAffinityScore = calculateJockeyAffinityScore(h);
if (jockeyAffinityScore !== 0) { s += jockeyAffinityScore; h.factorContributions.jockeyAffinity = jockeyAffinityScore; }
var prizeMoneyScore = calculatePrizeMoneyScore(app.horses, h);
if (prizeMoneyScore !== 0) { s += prizeMoneyScore; h.factorContributions.prizeMoney = prizeMoneyScore; }
// Note: secondUp/thirdUp scored above in upPhase block; inRunning requires pos800m data not yet parsed
var biasAdj = getBiasAdjustment(h, app.raceInfo.track);
if (biasAdj !== 0) { wrbScore += biasAdj; h.trackBiasAdjustment = biasAdj; }
s += wrbScore; h.factorContributions.weatherRail = wrbScore;
s += (1 - (parseInt(h.barrier) || 0) / 100) * 0.01;
// Race Order and Barrier Order from SpeedMap sort views
if (h.raceNum > 0) { var raceOrdScore = calculateRaceOrderScore(h, fieldSize); s += raceOrdScore; h.factorContributions.raceOrder = raceOrdScore; }
if (h.barrierRank > 0) { var barrOrdScore = calculateBarrierOrderScore(h, fieldSize); s += barrOrdScore; h.factorContributions.barrierOrder = barrOrdScore; }
h.winScore = Math.max(0, s);
h.factorContributions.winScore = h.winScore;
}
for (var i = 0; i < list.length; i++) {
var h = list[i];
if (h.scratched) {
h.top3Score = 0;
h.score = 0;
continue;
}
var top3PlacementScore = calculateTop3PlacementScore(h, list, fieldSize);
h.top3Score = top3PlacementScore;
h.factorContributions.top3Placement = top3PlacementScore;
var top3Weight = app.W.top3Weight || 0.70;
var winWeight = app.W.winWeight || 0.30;
h.score = (h.top3Score * top3Weight) + (h.winScore * winWeight);
}
list.sort(function(a, b) { return b.score - a.score; });
var total = 0;
for (var i = 0; i < list.length; i++) { if (!list[i].scratched) total += list[i].score; }
for (var i = 0; i < list.length; i++) { list[i].prob = (list[i].scratched || total === 0) ? 0 : Math.round((list[i].score / total) * 100); }
return list;
}



// ── Live Bet Panel ────────────────────────────────────────────────────────────
// Shows immediately after analyze() using app.horses — no saved prediction needed.
// Separate from the consensus advisor which requires multiple model submissions.
