'use strict';

// § LEARN — weights, ELO, venue profiles, learning, post-mortem
// ═══════════════════════════════════════════════════════════════


// ── Additional restored functions ──────────────────────────────────────────
var VENUE_FACTORS = ['odds','form1','trackWin','jockeyWin','trainerWin','freshness',
'formConsistency','tactical','trackCondition','distanceSuit','lastStartMargin',
'gearChange','railPosition','pacePressure','classChange','formMomentum',
'finishStrength','sectionalSpeed','weatherRailBias'];


// ── getBiasAdjustment — applies venue track bias to a horse's rail score ──────


// ═══════════════════════════════════════════════════════════════


// § SCORE — factor calculations, scoreHorses()
// ═══════════════════════════════════════════════════════════════


// ── Restored missing functions ────────────────────────────────────────────


// ═══════════════════════════════════════════════════════════════
// § RENDER — UI rendering: cards, history, bet panel, dropdowns
// ═══════════════════════════════════════════════════════════════


if (app.raceHistory.length > 0 || app.pendingRaces.length > 0) updateStats();
if (app.raceHistory.length === 0 && app.pendingRaces.length === 0) {
showInfo('No race history found — use \u2b06 Restore Backup to load your saved data, then run \ud83d\udd04 Relearn from History to train the models.');
}
} catch (e) {
console.error('Error loading saved data:', e);
showError('Failed to load saved data. Starting fresh.');
}
}

// ═══════════════════════════════════════════════════════════════
// Restored from loadSavedData — these are top-level functions
// ═══════════════════════════════════════════════════════════════

// ── getRaceContext ────────────────────────────────────
function getRaceContext() {
  var ri = app.raceInfo || {};
  var dist = parseInt(ri.distance) || 0;
  var distBand = dist <= 1100 ? 'sprint' : dist <= 1400 ? 'mile' : dist <= 1800 ? 'middle' : 'staying';
  var fieldSize = (app.horses||[]).filter(function(h){return !h.scratched;}).length;
  var fieldBand = fieldSize <= 8 ? 'small' : fieldSize <= 12 ? 'mid' : 'large';
  var cond = (ri.conditionType || ri.condition || 'good').toLowerCase();
  var condType = cond.indexOf('heavy') !== -1 ? 'heavy'
               : cond.indexOf('soft') !== -1 ? 'soft'
               : cond.indexOf('firm') !== -1 ? 'firm' : 'good';
  var classLevel = ri.classLevel || 0;
  var classBand = classLevel >= 4 ? 'high' : classLevel >= 2 ? 'mid' : 'low';
  return { distBand:distBand, fieldBand:fieldBand, condType:condType, classBand:classBand };
}

// ── updateTrackBias ───────────────────────────────────
function updateTrackBias(track, finishers) {
  if (!track || !finishers || finishers.length === 0) return;
  if (!app.venueProfiles) app.venueProfiles = {};
  var key = track.toLowerCase().replace(/\s+/g,'_');
  if (!app.venueProfiles[key]) {
    app.venueProfiles[key] = { races:0, wins:0, top3:0, multipliers:{}, barrierHistory:[], bias:null };
  }
  var vp = app.venueProfiles[key];
  if (!vp.barrierHistory) vp.barrierHistory = [];
  var raceBarriers = finishers.filter(function(f){ return f && f.barrier > 0; })
                              .map(function(f){ return { b:f.barrier, s:f.runningStyle||'' }; });
  vp.barrierHistory.push(raceBarriers);
  if (vp.barrierHistory.length > 20) vp.barrierHistory = vp.barrierHistory.slice(-20);
  // Compute rail bias
  var allBarriers = [];
  vp.barrierHistory.forEach(function(race){ race.forEach(function(f){ allBarriers.push(f.b); }); });
  if (allBarriers.length >= 6) {
    var avgB = allBarriers.reduce(function(s,b){return s+b;},0) / allBarriers.length;
    vp.bias = { rail: avgB < 5 ? 'inside' : avgB > 9 ? 'outside' : 'neutral', sampleSize: allBarriers.length };
  }
  saveData();
}

// ── getVenueProfile ───────────────────────────────────
function getVenueProfile(trackName) {
if (!trackName) return null;
var key = trackName.toLowerCase().trim();
if (!app.venueProfiles[key]) {
app.venueProfiles[key] = { races: 0, wins: 0, top3: 0, multipliers: {} };
VENUE_FACTORS.forEach(function(f) { app.venueProfiles[key].multipliers[f] = 1.0; });
}
return app.venueProfiles[key];
}

// ── getVenueBlendedWeights ────────────────────────────
function getVenueBlendedWeights(trackName) {
  var W = app.W || app.baseWeights;
  if (!W) return {};
  try {
    var vp = getVenueProfile(trackName);
    if (!vp || vp.races < 3) return W;
    var blendStr = Math.min(0.35, vp.races * 0.01);
    var blended = {};
    for (var k in W) {
      if (!W.hasOwnProperty(k)) continue;
      var mult = (vp.multipliers && vp.multipliers[k] !== undefined) ? vp.multipliers[k] : 1.0;
      blended[k] = W[k] * (1 - blendStr + blendStr * mult);
    }
    return blended;
  } catch(e) {
    return app.W || app.baseWeights || {};
  }
}

// ── updateVenueProfile ────────────────────────────────
function updateVenueProfile(trackName, hits, actualHorse, predictedHorse) {
var vp = getVenueProfile(trackName);
if (!vp) return;
vp.races++;
if (hits >= 1) vp.wins++;
if (hits >= 2) vp.top3++;

// Learn: which factors contributed to the winner that we may have under/over-weighted
var af = actualHorse && actualHorse.factorContributions ? actualHorse.factorContributions : {};
var pf = predictedHorse && predictedHorse.factorContributions ? predictedHorse.factorContributions : {};
var hitRatio = hits / 3;

VENUE_FACTORS.forEach(function(fkey) {
var aVal = af[fkey] || af[fkey.replace('Win','').replace('Start','')] || 0;
var pVal = pf[fkey] || pf[fkey.replace('Win','').replace('Start','')] || 0;

if (hits >= 3) {
// Perfect prediction — reinforce whatever factors the winner had
if (aVal > 0) vp.multipliers[fkey] = Math.min(1.5, vp.multipliers[fkey] * 1.025);
} else if (hits >= 2) {
if (aVal > 0) vp.multipliers[fkey] = Math.min(1.5, vp.multipliers[fkey] * 1.012);
} else if (hits <= 1) {
// We missed — the winner had factors we under-valued at this track
if (aVal > pVal && aVal > 0) {
// Winner had more of this factor than our pick: boost it for this venue
vp.multipliers[fkey] = Math.min(1.6, vp.multipliers[fkey] * 1.018);
} else if (pVal > aVal && pVal > 0) {
// Our pick had this factor but lost: this factor is less reliable here
vp.multipliers[fkey] = Math.max(0.5, vp.multipliers[fkey] * 0.985);
}
}
// Decay toward neutral slowly to avoid over-fitting old data
vp.multipliers[fkey] = vp.multipliers[fkey] * 0.998 + 1.0 * 0.002;
});
}

// ── updateStats ───────────────────────────────────────

// ── learn ─────────────────────────────────────────────
function learn(actual, predicted, actual2, predicted2, actual3, predicted3) {
var msg = '';
// Load scar tissue drift guard for base model protection
app._scarTissueDriftGuard = null;
try { app._scarTissueDriftGuard = JSON.parse(localStorage.getItem('horseBaseDriftGuard') || 'null'); } catch(e) {}
var actualTop3 = [actual, actual2, actual3].filter(function(h) { return h; });
var predictedTop3 = [predicted, predicted2, predicted3].filter(function(h) { return h; });
var predictedNames = predictedTop3.map(function(h) { return h.name; });
var actualNames = actualTop3.map(function(h) { return h.name; });
var hits = 0;
var misses = [];
var surprises = [];
for (var i = 0; i < predictedTop3.length; i++) {
if (actualNames.indexOf(predictedTop3[i].name) !== -1) hits++;
else misses.push(predictedTop3[i]);
}
for (var j = 0; j < actualTop3.length; j++) {
if (predictedNames.indexOf(actualTop3[j].name) === -1) surprises.push(actualTop3[j]);
}
var isWinnerCorrect = (actual.name === predicted.name);
var isExacta = isWinnerCorrect && actual2 && predicted2 && actual2.name === predicted2.name;
var isTrifecta = isExacta && actual3 && predicted3 && actual3.name === predicted3.name;
var hasTop3Hit = hits >= 3;
app._lastTop3Hits = hits;
var predictedRank = 999, actualRank = 999;
for (var r = 0; r < actualTop3.length; r++) {
if (actualTop3[r].name === predicted.name) predictedRank = r + 1;
if (actualTop3[r].name === actual.name) actualRank = r + 1;
}
var marginMult = getMarginLearningMultiplier(actual, predicted, predictedRank, actualRank);
[actual, predicted, actual2, predicted2, actual3, predicted3].forEach(function(h) {
if (!h) return;
if (!h.formScore && h.form) calculateFormScore(h);
if (!h.freshnessScore && h.daysAgo) calculateFreshnessScore(h);
if (!h.tacticalScore && h.runningStyle) calculateTacticalScore(h);
if (!h.trackConditionScore && app.raceInfo.conditionType) calculateTrackConditionScore(h, app.raceInfo.conditionType);
if (!h.firstUpScore && h.daysAgo >= 30 && h.firstUpRuns > 0) calculateFirstUpScore(h);
if (!h.distanceScore && h.distanceRuns > 0) calculateDistanceScore(h);
if (!h.lastMarginScore && h.lastMargin !== null) calculateLastMarginScore(h);
if (!h.gearScore && h.gearChanges && h.gearChanges.length > 0) calculateGearScore(h);
if (!h.railScore && parseInt(h.barrier) > 0) calculateRailScore(h, app.raceInfo.railOut || 0);
if (!h.pacePressureScore) calculatePacePressure(h, app.horses || [h, actual]);
if (!h.classChangeScore) calculateClassChange(h, app.raceInfo.classLevel || 0);
if (!h.formMomentumScore) calculateFormMomentum(h);
if (!h.finishStrengthScore) calculateFinishStrength(h);
if (!h.sectionalSpeedScore) calculateSectionalSpeed(h, app.horses || [h, actual]);
if (!h.weatherRailBiasScore) calculateWeatherRailBias(h, app.raceInfo);
});
function getFactorContributions(horse) {
if (!horse || !horse.factorContributions) return {};
return horse.factorContributions;
}
var actualFactors = getFactorContributions(actual);
var predictedFactors = getFactorContributions(predicted);
if (!app.factorStats) {
app.factorStats = {
total: 0, oddsSuccess: 0, formSuccess: 0, trackSuccess: 0,
jockeySuccess: 0, trainerSuccess: 0, freshnessSuccess: 0,
consistencySuccess: 0, tacticalSuccess: 0, trackCondSuccess: 0,
firstUpSuccess: 0, distanceSuccess: 0, lastMarginSuccess: 0,
gearSuccess: 0, railSuccess: 0, paceSuccess: 0, classSuccess: 0,
momentumSuccess: 0, finStrSuccess: 0, sectionalSuccess: 0,
weatherRailSuccess: 0,
careerSuccess: 0, trackDistSuccess: 0, ratingSuccess: 0,
oddsFail: 0, formFail: 0, trackFail: 0, jockeyFail: 0,
trainerFail: 0, freshnessFail: 0, consistencyFail: 0,
tacticalFail: 0, trackCondFail: 0, firstUpFail: 0,
distanceFail: 0, lastMarginFail: 0, gearFail: 0, railFail: 0,
paceFail: 0, classFail: 0, momentumFail: 0, finStrFail: 0,
sectionalFail: 0, weatherRailFail: 0,
careerFail: 0, trackDistFail: 0, ratingFail: 0
};
}
app.factorStats.total++;
var isCorrect = (actual.name === predicted.name);
app._lastWinnerFactors = {
goodOdds: actual.odds > 0 && actual.odds < 5,
highRating: actual.sbRating > 85,
goodForm: !!(actual.form && actual.form.replace(/[^0-9]/g, '').length > 0),
consistentForm: actual.consistencyScore != null && Math.abs(actual.consistencyScore) > 0.01,
trackRecord: actual.trackRuns > 0 && actual.trackWins > 0,
goodCareer: actual.careerRuns > 0 && (actual.careerWins / actual.careerRuns) > 0.15,
lightWeight: actual.weight > 0 && actual.weight < 56,
optimalFreshness: actual.freshnessScore != null && Math.abs(actual.freshnessScore) > 0.01,
goodJockey: actual.jockeyWinRate > 0.1,
goodTrainer: actual.trainerWinRate > 0.1,
goodTactical: actual.tacticalScore != null && Math.abs(actual.tacticalScore) > 0.01,
goodTrackCond: actual.trackConditionScore != null && Math.abs(actual.trackConditionScore) > 0.01,
goodFirstUp: actual.firstUpScore != null && Math.abs(actual.firstUpScore) > 0.01,
goodDistance: actual.distanceScore != null && Math.abs(actual.distanceScore) > 0.01,
closeLastStart: actual.lastMarginScore != null && Math.abs(actual.lastMarginScore) > 0.01,
gearBoost: actual.gearScore != null && Math.abs(actual.gearScore) > 0.01,
railAdvantage: actual.railScore != null && Math.abs(actual.railScore) > 0.01,
goodPace: actual.pacePressureScore != null && Math.abs(actual.pacePressureScore) > 0.01,
goodClass: actual.classChangeScore != null && Math.abs(actual.classChangeScore) > 0.01,
goodMomentum: actual.formMomentumScore != null && Math.abs(actual.formMomentumScore) > 0.01,
goodFinStr: actual.finishStrengthScore != null && Math.abs(actual.finishStrengthScore) > 0.01,
goodSectional: actual.sectionalSpeedScore != null && Math.abs(actual.sectionalSpeedScore) > 0.01,
goodWeatherRail: actual.weatherRailBiasScore != null && Math.abs(actual.weatherRailBiasScore) > 0.01
};
function adjustWeight(weightKey, statKey, adjustment, strength, trackStats) {
strength = strength || 1;
trackStats = (trackStats === undefined) ? true : trackStats;
var change = adjustment * strength * marginMult;
// Scar tissue drift guard: reduce reinforcement 50% on protected factors for base model
if (adjustment > 0 && app.W === app.baseWeights) {
  var _dg = app._scarTissueDriftGuard;
  if (_dg && _dg.active && _dg.protectedFactors && _dg.protectedFactors.indexOf(weightKey) !== -1) {
    change *= 0.5;
  }
}
app.W[weightKey] = Math.max(0.1, (app.W[weightKey] || 1) * (1 + change));
if (trackStats) {
if (adjustment > 0 && app.factorStats[statKey + 'Success'] !== undefined)
app.factorStats[statKey + 'Success']++;
else if (adjustment < 0 && app.factorStats[statKey + 'Fail'] !== undefined)
app.factorStats[statKey + 'Fail']++;
}
}
function reinforceAll(horse, strength, trackStats) {
if (trackStats === undefined) trackStats = true;
var f = getFactorContributions(horse);
if (f.odds > 0) adjustWeight('odds', 'odds', 0.015, strength, trackStats);
if (f.form > 0) { adjustWeight('form1', 'form', 0.015, strength, trackStats); adjustWeight('form2', 'form', 0.012, strength, trackStats); }
if (f.consistency > 0) adjustWeight('formConsistency', 'consistency', 0.015, strength, trackStats);
if (f.track > 0) adjustWeight('trackWin', 'track', 0.018, strength, trackStats);
if (f.career > 0) adjustWeight('careerWin', 'career', 0.012, strength, trackStats);
if (f.freshness > 0) adjustWeight('freshness', 'freshness', 0.012, strength, trackStats);
if (f.jockey > 0) adjustWeight('jockeyWin', 'jockey', 0.020, strength, trackStats);
if (f.trainer > 0) adjustWeight('trainerWin', 'trainer', 0.015, strength, trackStats);
if (f.tactical > 0) adjustWeight('tactical', 'tactical', 0.012, strength, trackStats);
if (f.trackCond > 0) adjustWeight('trackCondition', 'trackCond', 0.015, strength, trackStats);
if (f.firstUp > 0) adjustWeight('firstUp', 'firstUp', 0.015, strength, trackStats);
if (f.distance > 0) adjustWeight('distanceSuit', 'distance', 0.012, strength, trackStats);
if (f.lastMargin > 0) adjustWeight('lastStartMargin', 'lastMargin', 0.012, strength, trackStats);
if (f.gear > 0) adjustWeight('gearChange', 'gear', 0.015, strength, trackStats);
if (f.rail > 0) adjustWeight('railPosition', 'rail', 0.012, strength, trackStats);
if (f.pace > 0) adjustWeight('pacePressure', 'pace', 0.012, strength, trackStats);
if (f.classChg > 0) adjustWeight('classChange', 'class', 0.018, strength, trackStats);
if (f.momentum > 0) adjustWeight('formMomentum', 'momentum', 0.015, strength, trackStats);
if (f.finStr > 0) adjustWeight('finishStrength', 'finStr', 0.012, strength, trackStats);
if (f.sectional > 0) adjustWeight('sectionalSpeed', 'sectional', 0.015, strength, trackStats);
if (f.weatherRail > 0) adjustWeight('weatherRailBias', 'weatherRail', 0.012, strength, trackStats);
}
function penalizeAll(horse, strength) {
var f = getFactorContributions(horse);
if (f.odds > 0) adjustWeight('odds', 'odds', -0.012, strength);
if (f.form > 0) adjustWeight('form1', 'form', -0.012, strength);
if (f.consistency > 0) adjustWeight('formConsistency', 'consistency', -0.010, strength);
if (f.track > 0) adjustWeight('trackWin', 'track', -0.012, strength);
if (f.jockey > 0) adjustWeight('jockeyWin', 'jockey', -0.012, strength);
if (f.trainer > 0) adjustWeight('trainerWin', 'trainer', -0.010, strength);
if (f.pace > 0) adjustWeight('pacePressure', 'pace', -0.010, strength);
if (f.classChg > 0) adjustWeight('classChange', 'class', -0.012, strength);
if (f.momentum > 0) adjustWeight('formMomentum', 'momentum', -0.012, strength);
if (f.sectional > 0) adjustWeight('sectionalSpeed', 'sectional', -0.012, strength);
}
if (hits === 3) {
msg = hits === 3 && isTrifecta ? '🎯 PERFECT TRIFECTA! All 3 correct + exact order.'
: '✅ All 3 in Top 3 (any order) -- Boxed trifecta win!';
for (var pi = 0; pi < predictedTop3.length; pi++) {
reinforceAll(predictedTop3[pi], 1.0, true);
}
}
else if (hits === 2) {
msg = '⚠ 2/3 in Top 3 -- Strong partial. One miss.';
for (var pi2 = 0; pi2 < predictedTop3.length; pi2++) {
if (actualNames.indexOf(predictedTop3[pi2].name) !== -1) {
reinforceAll(predictedTop3[pi2], 0.7, true);
}
}
for (var mi = 0; mi < misses.length; mi++) {
penalizeAll(misses[mi], 0.25);
}
for (var si = 0; si < surprises.length; si++) {
reinforceAll(surprises[si], 0.5, false);
}
}
else if (hits === 1) {
msg = '❌ Only 1/3 in Top 3 -- Adjusting.';
for (var mi2 = 0; mi2 < misses.length; mi2++) {
penalizeAll(misses[mi2], 0.4);
}
for (var pi3 = 0; pi3 < predictedTop3.length; pi3++) {
if (actualNames.indexOf(predictedTop3[pi3].name) !== -1) {
reinforceAll(predictedTop3[pi3], 0.5, true);
}
}
for (var si2 = 0; si2 < surprises.length; si2++) {
reinforceAll(surprises[si2], 0.35, false);
}
}
else {
msg = '❌❌ Complete miss (0/3) -- Correction applied.';
for (var mi3 = 0; mi3 < predictedTop3.length; mi3++) {
penalizeAll(predictedTop3[mi3], 0.8);
}
for (var si3 = 0; si3 < surprises.length; si3++) {
reinforceAll(surprises[si3], 0.9, si3 === 0);
}
}
if (actual2 && predicted2 && actual2.name === predicted2.name) {
if (actual2.odds > 0 && actual2.odds < 7) app.W.odds = Math.min(1500, (app.W.odds||400) * 1.003);
if (actual2.trackWins > 0) app.W.trackWin = Math.min(350, (app.W.trackWin||70) * 1.003);
msg += ' | 🥈 2nd exact!';
}
if (actual3 && predicted3 && actual3.name === predicted3.name) {
if (actual3.jockeyWinRate > 0.15) app.W.jockeyWin = Math.min(200, (app.W.jockeyWin||50) * 1.003);
msg += ' | 🥉 3rd exact!';
}
updateJockeyTrainerStats(actual, app.horses);
var bounds = {
odds: [50, 1500],
form1: [10, 250],
form2: [5, 150],
formConsistency: [5, 150],
trackWin: [10, 350],
trackDistWin: [20, 300],
rating: [0.2, 5.0],
careerWin: [20, 400],
careerPlace: [10, 200],
jockeyWin: [5, 200],
trainerWin: [5, 180],
freshness: [5, 120],
weight: [0.5, 8.0],
tactical: [5, 150],
trackCondition: [10, 250],
firstUp: [5, 200],
distanceSuit: [5, 180],
lastStartMargin: [5, 150],
gearChange: [5, 100],
railPosition: [5, 100],
pacePressure: [10, 80],
classChange: [10, 100],
formMomentum: [10, 100],
finishStrength: [5, 90],
sectionalSpeed: [10, 80],
weatherRailBias: [5, 90],
marginLearning: [0.5, 2.0],
raceOrder: [2, 100],
barrierOrder: [2, 80],
top3Weight: [0.4, 0.9],
winWeight: [0.1, 0.6]
};
for (var key in bounds) {
if (app.W[key] !== undefined) {
app.W[key] = Math.max(bounds[key][0], Math.min(bounds[key][1], app.W[key]));
}
}
// Update venue-specific profile for the current track
var currentTrack = app.raceInfo && app.raceInfo.track ? app.raceInfo.track : null;
if (currentTrack) updateVenueProfile(currentTrack, hits, actual, predicted);
// Update drift guard race counter if base model just learned
if (app.W === app.baseWeights) {
  var _dgu = app._scarTissueDriftGuard;
  if (_dgu && _dgu.active) {
    _dgu.racesRun = (_dgu.racesRun || 0) + 1;
    if (_dgu.racesRun >= (_dgu.guardsUntilRace || 100)) _dgu.active = false;
    localStorage.setItem('horseBaseDriftGuard', JSON.stringify(_dgu));
    app._scarTissueDriftGuard = _dgu;
  }
}
saveData();
return msg + ' (Top 3 hits: ' + hits + '/3)';
}

// ── postMortemAnalysis ────────────────────────────────
function postMortemAnalysis(actual1, actual2, actual3, predicted1, predicted2, predicted3, hits) {
if (hits >= 3) return;
var lines = [];
var allHorses = (app.horses || []).filter(function(h) { return !h.scratched; });
var fieldSize = allHorses.length;
var actualTop3 = [actual1, actual2, actual3].filter(function(h) { return h && h.name; });
var predictedTop3 = [predicted1, predicted2, predicted3].filter(function(h) { return h && h.name; });
lines.push('=== POST-MORTEM: ' + (app.raceInfo.track || 'Race') + ' ' + (app.raceInfo.race || '') + ' ===');
lines.push('Result: ' + hits + '/3 correct | Field: ' + fieldSize + ' | Condition: ' + (app.raceInfo.condition || 'Unknown'));
lines.push('');
lines.push('-- AI PICKS (what we saw) --');
for (var pi = 0; pi < predictedTop3.length; pi++) {
var ph = predictedTop3[pi];
var inActual = actualTop3.some(function(a) { return a.name === ph.name; });
var tag = inActual ? '✅ CORRECT' : '❌ WRONG';
var fc = ph.factorContributions || {};
var topFactors = [];
for (var fk in fc) {
if (fc[fk] > 0 && fk !== 'winScore' && fk !== 'top3Placement') {
topFactors.push({ name: fk, val: fc[fk] });
}
}
topFactors.sort(function(a, b) { return b.val - a.val; });
var factorStr = topFactors.slice(0, 4).map(function(f) {
var nameMap = { odds:'Odds', rating:'Rating', career:'Career', track:'Track', form:'Form',
freshness:'Fresh', tactical:'Tactical', jockey:'Jockey', trainer:'Trainer',
trackDist:'Trk/Dist', trackCond:'Cond', firstUp:'1stUp', distance:'Dist',
lastMargin:'Margin', gear:'Gear', rail:'Rail', weight:'Wt', stats:'Stats',
pace:'Pace', classChg:'Class', momentum:'Momentum', finStr:'FinStr',
sectional:'Sectional', weatherRail:'Weather/Rail' };
return (nameMap[f.name] || f.name) + ':' + Math.round(f.val);
}).join(' | ');
var oddsStr = ph.odds > 0 ? ' $' + ph.odds.toFixed(2) : '';
var formStr = ph.form ? ' Form:' + ph.form : '';
lines.push('  ' + (pi + 1) + '. ' + ph.name + oddsStr + formStr + ' [Score:' + Math.round(ph.score) + '] ' + tag);
if (factorStr) lines.push('     Driven by -> ' + factorStr);
}
lines.push('');
lines.push('-- ACTUAL RESULT (what we missed) --');
for (var ai = 0; ai < actualTop3.length; ai++) {
var ah = actualTop3[ai];
var wasPredicted = predictedTop3.some(function(p) { return p.name === ah.name; });
if (wasPredicted) continue;
var fullHorse = null;
for (var hi = 0; hi < allHorses.length; hi++) {
if (allHorses[hi].name === ah.name) { fullHorse = allHorses[hi]; break; }
}
if (!fullHorse) { lines.push('  ' + (ai + 1) + '. ' + ah.name + ' -- data not available for analysis'); continue; }
var rank = 0;
for (var ri = 0; ri < allHorses.length; ri++) {
if (allHorses[ri].score >= fullHorse.score) rank++;
}
var ahOdds = fullHorse.odds > 0 ? ' $' + fullHorse.odds.toFixed(2) : '';
var ahForm = fullHorse.form ? ' Form:' + fullHorse.form : '';
lines.push('  ' + (ai + 1) + '. ' + fullHorse.name + ahOdds + ahForm + ' [Score:' + Math.round(fullHorse.score) + ', Ranked #' + rank + ']');
var reasons = [];
var afc = fullHorse.factorContributions || {};
if (fullHorse.odds > 15) reasons.push('long odds ($' + fullHorse.odds.toFixed(2) + ') reduced model confidence');
if (fullHorse.form && fullHorse.form.replace(/[^0-9]/g,'').indexOf('1') === -1) reasons.push('no recent wins in form string (' + fullHorse.form + ')');
if (fullHorse.consistencyScore < 0.3) reasons.push('inconsistent form (consistency score low)');
if (fullHorse.trackRuns === 0) reasons.push('no track record at this venue');
if (fullHorse.daysAgo > 45) reasons.push('long spell (' + fullHorse.daysAgo + ' days since last start)');
if (afc.pace && afc.pace < 0) reasons.push('pace scenario scored against it');
if (afc.classChg && afc.classChg < 0) reasons.push('rising in class penalized it');
if (fullHorse.settlingPosition > 8) reasons.push('backmarker style in likely-fast pace race');
if (fullHorse.gearChanges && fullHorse.gearChanges.length > 0) reasons.push('gear changes present but weighted low: ' + fullHorse.gearChanges[0]);
var goodFactors = [];
for (var gk in afc) {
if (afc[gk] > 20 && gk !== 'winScore' && gk !== 'top3Placement' && gk !== 'stats') {
var gnmap = { odds:'Odds', rating:'Rating', career:'Career', track:'Track', form:'Form',
freshness:'Fresh', tactical:'Tactical', jockey:'Jockey', trainer:'Trainer',
trackDist:'Trk/Dist', trackCond:'Cond', firstUp:'1stUp', distance:'Dist',
lastMargin:'Margin', gear:'Gear', rail:'Rail', pace:'Pace', classChg:'Class',
momentum:'Momentum', finStr:'FinStr', sectional:'Sectional', weatherRail:'Weather/Rail' };
goodFactors.push((gnmap[gk] || gk) + ':' + Math.round(afc[gk]));
}
}
if (reasons.length > 0) lines.push('     Missed because: ' + reasons.join('; '));
if (goodFactors.length > 0) lines.push('     Strengths we underweighted: ' + goodFactors.join(' | '));
}
lines.push('');
lines.push('-- KEY DIVERGENCE ANALYSIS --');
if (predicted1 && actual1 && predicted1.name !== actual1.name) {
var p1fc = predicted1.factorContributions || {};
var a1fc = (function() {
for (var i = 0; i < allHorses.length; i++) {
if (allHorses[i].name === actual1.name) return allHorses[i].factorContributions || {};
}
return {};
})();
var biggerInPredicted = [], biggerInActual = [];
var compKeys = ['odds', 'form', 'track', 'career', 'tactical', 'freshness', 'jockey', 'trainer',
'trackCond', 'distance', 'lastMargin', 'gear', 'rail', 'pace', 'classChg',
'momentum', 'finStr', 'sectional', 'weatherRail'];
var cNameMap = { odds:'Odds', form:'Form', track:'Track', career:'Career', tactical:'Tactical',
freshness:'Fresh', jockey:'Jockey', trainer:'Trainer', trackCond:'Cond', distance:'Dist',
lastMargin:'Margin', gear:'Gear', rail:'Rail', pace:'Pace', classChg:'Class',
momentum:'Momentum', finStr:'FinStr', sectional:'Sectional', weatherRail:'Weather/Rail' };
for (var ck = 0; ck < compKeys.length; ck++) {
var key = compKeys[ck];
var pv = p1fc[key] || 0;
var av = a1fc[key] || 0;
var diff = Math.abs(pv - av);
if (diff > 8) {
if (pv > av) biggerInPredicted.push((cNameMap[key] || key) + '(+' + Math.round(diff) + ')');
else biggerInActual.push((cNameMap[key] || key) + '(+' + Math.round(diff) + ')');
}
}
lines.push('  ' + predicted1.name + ' outscored on: ' + (biggerInPredicted.length ? biggerInPredicted.join(', ') : 'no major factors'));
lines.push('  ' + actual1.name + ' underweighted on: ' + (biggerInActual.length ? biggerInActual.join(', ') : 'no major factors'));
if (biggerInActual.length > 0) {
var topMissed = biggerInActual[0].split('(')[0];
lines.push('  ⚠ Root cause: ' + actual1.name + ' had superior "' + topMissed + '" that model did not weight heavily enough');
}
if (actual1.odds > 0 && predicted1.odds > 0 && actual1.odds > predicted1.odds * 2) {
lines.push('  ⚠ Upset alert: actual winner was $' + actual1.odds.toFixed(2) + ' vs our pick at $' + predicted1.odds.toFixed(2) + ' -- market also missed this');
}
}
lines.push('');
lines.push('-- WATCH NEXT TIME --');
var watchItems = [];
if (hits === 0) watchItems.push('Complete miss -- review track condition and pace scenario for this race type');
if (actual1 && actual1.gearChanges && actual1.gearChanges.length > 0) watchItems.push('Gear change on winner: ' + actual1.gearChanges.join(', ') + ' -- may need higher gear weight');
if (actual1 && actual1.daysAgo > 0 && actual1.daysAgo < 8) watchItems.push('Winner was very fresh (' + actual1.daysAgo + 'd since last) -- freshness weight may be undervalued');
if (app.raceInfo.conditionType === 'heavy' || app.raceInfo.conditionType === 'soft') {
watchItems.push('Wet track -- check wet track specialist record on any subsequent wet races');
}
if (actual1 && actual1.settlingPosition && actual1.settlingPosition >= 7) {
watchItems.push('Winner came from back (position ' + actual1.settlingPosition + ') -- finishing strength a key factor');
}
if (watchItems.length === 0) watchItems.push('No specific flags -- standard learning adjustment applied');
for (var wi = 0; wi < watchItems.length; wi++) lines.push('  * ' + watchItems[wi]);
lines.push('=======================================');
var summary = hits + '/3 correct -- ' + (actual1 ? actual1.name : '?') +
(actual2 ? '/' + actual2.name : '') + (actual3 ? '/' + actual3.name : '') + ' won';
addLog('learn', '[analysis] Post-Mortem: ' + summary, lines.join('\n'));
}



// ── getBiasAdjustment ─────────────────────────────────────────────────────────
function getBiasAdjustment(horse, trackName) {
  if (!trackName || !horse) return 0;
  var vp = getVenueProfile(trackName);
  if (!vp || !vp.bias) return 0;
  var barrier = parseInt(horse.barrier) || 0;
  var style = (horse.runningStyle || '').toLowerCase();
  var score = 0;
  var bias = vp.bias.rail;
  if (bias === 'inside') {
    if (barrier > 0 && barrier <= 4) score += 3;
    else if (barrier > 8) score -= 2;
  } else if (bias === 'outside') {
    if (barrier > 8) score += 2;
    else if (barrier <= 4) score -= 2;
  }
  return score;
}

function applySaturdayLogLearning(results) {
var statusEl = document.getElementById('satLogStatus');
if (!results.length) {
if (statusEl) statusEl.textContent = 'No result entries found. Make sure you upload exported activity log .txt files.';
return;
}
// Reset Saturday weights fresh from defaults
app.saturdayWeights = Object.assign({}, app.defaultWeights);
var wins = 0, top3s = 0, total = results.length;
results.forEach(function(r) {
if (r.isWin) {
wins++;
// Saturday winners tend to reward track record and form over raw odds
app.saturdayWeights.trackWin   = Math.min(220, app.saturdayWeights.trackWin   * 1.02);
app.saturdayWeights.form1      = Math.min(150, app.saturdayWeights.form1      * 1.015);
app.saturdayWeights.odds       = Math.min(550, app.saturdayWeights.odds       * 1.01);
} else {
// Penalise over-reliance on short odds on Saturdays (more competitive fields)
app.saturdayWeights.odds       = Math.max(200, app.saturdayWeights.odds       * 0.988);
app.saturdayWeights.trackWin   = Math.min(220, app.saturdayWeights.trackWin   * 1.008);
app.saturdayWeights.classChange = Math.min(120, app.saturdayWeights.classChange * 1.008);
}
if (r.hits >= 2) top3s++;
});
// Update metrics counters with seeded data
app.saturdayMetrics.total   = total;
app.saturdayMetrics.correct = wins;
app.saturdayMetrics.top3    = top3s;
app.saturdayMetrics.top2    = results.filter(function(r) { return r.hits >= 2; }).length;
if (app.activeModel === 'saturday') app.W = app.saturdayWeights;
saveData();
app.updateModelMetrics();
var winPct  = total > 0 ? Math.round((wins/total)*100) : 0;
var top3Pct = total > 0 ? Math.round((top3s/total)*100) : 0;
addLog('learn', '🐴 Saturday model seeded: ' + total + ' races | ' + winPct + '% wins | ' + top3Pct + '% top-3', 'Weights adjusted based on Saturday race patterns. Odds weight: ' + Math.round(app.saturdayWeights.odds) + ', Track weight: ' + Math.round(app.saturdayWeights.trackWin));
if (statusEl) statusEl.textContent = 'Seeded from ' + total + ' races | ' + wins + ' wins (' + winPct + '%) | ' + top3s + ' top-3 (' + top3Pct + '%)';
showSuccess('Saturday model seeded from ' + total + ' log entries!');
}

function generateBatchSummary(session) {
var races = session.races;
var n = races.length;
if (n === 0) return;
var lines = [];
lines.push('+==============================================+');
lines.push('|        BATCH SESSION COMPLETE -- SUMMARY       |');
lines.push('+==============================================+');
lines.push('Processed ' + n + ' pending races | Session started: ' + new Date(session.startedAt).toLocaleTimeString());
lines.push('');
var winCount = 0, top3Count = 0, top2Count = 0;
var upsets = 0, biggestUpset = 0, biggestUpsetRace = '';
var favWins = 0, favTotal = 0;
var totalHits = 0;
var modelBreakdown = {};
for (var i = 0; i < races.length; i++) {
var r = races[i];
if (r.isWinnerCorrect) winCount++;
if (r.top3AnyOrder) top3Count++;
if (r.top2AnyOrder) top2Count++;
totalHits += r.hits;
if (r.predictedOdds > 0 && r.predictedOdds < 5) { favTotal++; if (r.isWinnerCorrect) favWins++; }
if (!r.isWinnerCorrect && r.winnerOdds > 0 && r.predictedOdds > 0 && r.winnerOdds > r.predictedOdds * 2) {
upsets++;
if (r.winnerOdds > biggestUpset) { biggestUpset = r.winnerOdds; biggestUpsetRace = r.race; }
}
var m = r.model || 'base';
if (!modelBreakdown[m]) modelBreakdown[m] = { total: 0, wins: 0, top3: 0 };
modelBreakdown[m].total++;
if (r.isWinnerCorrect) modelBreakdown[m].wins++;
if (r.top3AnyOrder) modelBreakdown[m].top3++;
}
var winPct = Math.round((winCount / n) * 100);
var top3Pct = Math.round((top3Count / n) * 100);
var avgHits = (totalHits / n).toFixed(1);
lines.push('-- PERFORMANCE --');
lines.push('  Win accuracy:   ' + winCount + '/' + n + '  (' + winPct + '%)' + (winPct >= 40 ? '  ✅ Strong' : winPct >= 25 ? '  ⚠ Moderate' : '  ❌ Needs work'));
lines.push('  Top-3 accuracy: ' + top3Count + '/' + n + '  (' + top3Pct + '%)' + (top3Pct >= 70 ? '  🎯 Target hit!' : top3Pct >= 50 ? '  ⚠ Close' : '  ❌ Below target'));
lines.push('  Top-2 accuracy: ' + top2Count + '/' + n + '  (' + Math.round((top2Count / n) * 100) + '%)');
lines.push('  Avg hits/race:  ' + avgHits + '/3');
if (favTotal > 0) lines.push('  Favourite wins: ' + favWins + '/' + favTotal + '  (' + Math.round((favWins / favTotal) * 100) + '%)');
if (upsets > 0) lines.push('  Upsets beaten:  ' + upsets + (biggestUpsetRace ? ' (biggest: $' + biggestUpset.toFixed(2) + ' @ ' + biggestUpsetRace + ')' : ''));
var modelKeys = Object.keys(modelBreakdown);
if (modelKeys.length > 1) {
lines.push('');
lines.push('-- MODEL BREAKDOWN --');
var mLabels = { base: '🧠 Base', custom: app.getModelName('custom'), custom2: app.getModelName('custom2'), custom3: app.getModelName('custom3') };
for (var mk = 0; mk < modelKeys.length; mk++) {
var key = modelKeys[mk];
var mb = modelBreakdown[key];
var label = mLabels[key] || key;
lines.push('  ' + label + ': ' + mb.wins + '/' + mb.total + ' wins, ' + mb.top3 + '/' + mb.total + ' top-3');
}
}
lines.push('');
lines.push('-- RACE RECAP --');
for (var ri = 0; ri < races.length; ri++) {
var rc = races[ri];
var icon = rc.isWinnerCorrect ? '✅' : rc.top3AnyOrder ? '🟡' : rc.top2AnyOrder ? '🔵' : '❌';
var hitsStr = rc.hits + '/3';
var oddsNote = rc.winnerOdds > 0 ? ' ($' + rc.winnerOdds.toFixed(2) + ')' : '';
lines.push('  ' + icon + ' ' + rc.race + ' -- Winner: ' + rc.actual1 + oddsNote + ' | Hits: ' + hitsStr);
if (!rc.isWinnerCorrect) {
lines.push('     Predicted: ' + rc.predicted1 + (rc.predicted2 ? '/' + rc.predicted2 : '') + (rc.predicted3 ? '/' + rc.predicted3 : ''));
}
}
lines.push('');
lines.push('-- WHAT THE WINNERS HAD IN COMMON --');
var factorCounts = {};
var factorLabels = {
goodOdds: '💰 Good Odds (<$5)', goodForm: '📈 Good Form', consistentForm: '🎯 Consistent Form',
trackRecord: '🏁 Track Record', optimalFreshness: '⏰ Optimal Freshness',
goodJockey: '🏇 Good Jockey', goodTrainer: '👔 Good Trainer',
goodTactical: '⚔ Tactical Advantage', goodTrackCond: '🌧 Track Condition Fit',
goodFirstUp: '🔄 First-Up Form', goodDistance: '📏 Distance Form',
closeLastStart: '🏃 Close Last Start', gearBoost: '⚙ Gear Change',
railAdvantage: '🛤 Rail Advantage', goodPace: '🔥 Pace Advantage',
goodClass: '📊 Class Drop', goodMomentum: '📈 Improving Form',
goodFinStr: '💪 Finishing Strength', goodSectional: '⏱ Fast Sectional',
goodWeatherRail: '🌧 Weather/Rail Fit'
};
var totalWithFactors = 0;
for (var fi = 0; fi < races.length; fi++) {
var wf = races[fi].winnerFactors;
if (!wf) continue;
totalWithFactors++;
for (var fk in wf) {
if (wf[fk]) {
factorCounts[fk] = (factorCounts[fk] || 0) + 1;
}
}
}
if (totalWithFactors > 0) {
var sortedFactors = Object.keys(factorCounts).sort(function(a, b) {
return factorCounts[b] - factorCounts[a];
});
var top5 = sortedFactors.slice(0, 6);
for (var tf = 0; tf < top5.length; tf++) {
var fkey = top5[tf];
var fPct = Math.round((factorCounts[fkey] / totalWithFactors) * 100);
var bar = '';
for (var b = 0; b < Math.round(fPct / 10); b++) bar += '#';
lines.push('  ' + (factorLabels[fkey] || fkey) + ': ' + fPct + '% ' + bar);
}
var absentFactors = Object.keys(factorLabels).filter(function(fk) { return !factorCounts[fk]; });
if (absentFactors.length > 0 && absentFactors.length <= 6) {
lines.push('  Not seen on any winner: ' + absentFactors.map(function(k) { return factorLabels[k]; }).join(', '));
}
} else {
lines.push('  No factor data available for this batch');
}
lines.push('');
lines.push('-- WHAT THE MODEL THINKS IT LEARNED --');
var weightShifts = [];
var wNames = {
odds: 'Odds', form1: 'Form (1st)', formConsistency: 'Consistency',
trackWin: 'Track Record', trackCondition: 'Track Condition',
jockeyWin: 'Jockey', trainerWin: 'Trainer', freshness: 'Freshness',
tactical: 'Tactical', distanceSuit: 'Distance', lastStartMargin: 'Last Margin',
gearChange: 'Gear', railPosition: 'Rail', pacePressure: 'Pace Pressure',
classChange: 'Class Change', formMomentum: 'Form Momentum',
finishStrength: 'Finishing Strength', sectionalSpeed: 'Sectional Speed',
weatherRailBias: 'Weather/Rail Bias', careerWin: 'Career Wins', firstUp: 'First Up'
};
for (var wk in wNames) {
var current = app.baseWeights[wk];
var def = app.defaultWeights[wk];
if (current === undefined || def === undefined || def === 0) continue;
var pctChange = ((current - def) / def) * 100;
if (Math.abs(pctChange) >= 3) {
weightShifts.push({ key: wk, name: wNames[wk], pctChange: pctChange, current: current });
}
}
weightShifts.sort(function(a, b) { return Math.abs(b.pctChange) - Math.abs(a.pctChange); });
if (weightShifts.length === 0) {
lines.push('  No significant weight shifts detected in this batch.');
} else {
var increased = weightShifts.filter(function(w) { return w.pctChange > 0; }).slice(0, 4);
var decreased = weightShifts.filter(function(w) { return w.pctChange < 0; }).slice(0, 3);
if (increased.length > 0) {
lines.push('  Reinforced (^ trusting more):');
for (var ui = 0; ui < increased.length; ui++) {
var ws = increased[ui];
lines.push('    + ' + ws.name + ': ' + (ws.pctChange > 0 ? '+' : '') + Math.round(ws.pctChange) + '% -> now ' + Math.round(ws.current));
}
}
if (decreased.length > 0) {
lines.push('  Penalised (v trusting less):');
for (var di = 0; di < decreased.length; di++) {
var ws2 = decreased[di];
lines.push('    - ' + ws2.name + ': ' + Math.round(ws2.pctChange) + '% -> now ' + Math.round(ws2.current));
}
}
}
lines.push('');
lines.push('-- RECOMMENDATION --');
if (top3Pct >= 70) {
lines.push('  🎯 Target achieved! Model is performing well on this batch.');
lines.push('  Consider running "Rebalance" to lock in these learnings.');
} else if (top3Pct >= 50) {
lines.push('  ⚠ Close to target. ' + (n - top3Count) + ' more top-3 hits needed to reach 70%.');
if (upsets > 1) lines.push('  Upsets are hurting accuracy -- consider reviewing odds weighting.');
} else {
lines.push('  ❌ Below target. Common causes in this batch:');
if (upsets >= 2) lines.push('    * ' + upsets + ' upsets -- market odds may be misleading the model');
if (winPct < 20) lines.push('    * Low win rate suggests factor weighting needs review');
lines.push('  Try "Relearn from History" to rebuild weights from scratch across all data.');
}
lines.push('');
lines.push('==============================================');
var summaryTitle = '📋 Batch Complete: ' + n + ' races | ' + winPct + '% wins | ' + top3Pct + '% top-3';
addLog('relearn', summaryTitle, lines.join('\n'));
showSuccess('Batch session complete! ' + n + ' races processed. Check Activity Log for full summary.');
}
var LOG_ICONS = {
predict:  '🔍', result:   '🏆', learn:    '🧠', peer:     '👁',
weights:  '⚖',  switch:   '🔄', relearn:  '📋', rebalance:'⚖',
reset:    '🗑',  save:     '💾', error:    '❌', info:     'ℹ'
};
var LOG_COLORS = {
predict:  '#60a5fa', result:   '#34d399', learn:    '#a78bfa',
peer:     '#fbbf24', weights:  '#f59e0b', switch:   '#94a3b8',
relearn:  '#22d3ee', rebalance:'#c084fc', reset:    '#f87171',
save:     '#6ee7b7', error:    '#f87171', info:     '#94a3b8'
};
function replayRaceForModel(r, modelWeights) {
  var prevW = app.W;
  app.W = modelWeights;
  var a1 = { name: r.actual   || '', factorContributions: r.factorSnapshot         || {} };
  var a2 = { name: r.actual2  || '', factorContributions: {} };
  var a3 = { name: r.actual3  || '', factorContributions: {} };
  var p1 = { name: r.predicted  || '', factorContributions: r.predictedFactorSnapshot || {} };
  var p2 = { name: r.predicted2 || '', factorContributions: {} };
  var p3 = { name: r.predicted3 || '', factorContributions: {} };
  // Mark scores as calculated so learn() doesn't try to recalculate missing fields
  var scoreGuards = ['formScore','freshnessScore','tacticalScore','trackConditionScore',
    'firstUpScore','distanceScore','lastMarginScore','gearScore','railScore',
    'pacePressureScore','classChangeScore','formMomentumScore',
    'finishStrengthScore','sectionalSpeedScore','weatherRailBiasScore'];
  [a1,p1,a2,p2,a3,p3].forEach(function(h) {
    scoreGuards.forEach(function(k) { h[k] = 1; });
  });
  learn(a1, p1, a2.name ? a2 : null, p2.name ? p2 : null, a3.name ? a3 : null, p3.name ? p3 : null);
  app.W = prevW;
}

var preBaseWeights = Object.assign({}, app.baseWeights);
var relearned = 0;
for (var i = 0; i < app.raceHistory.length; i++) {
var r = app.raceHistory[i];
var wf = r.winnerFactors;
if (!wf && !r.factorSnapshot) continue;
relearned++;
// Global factorStats (Base perspective)
if (wf) {
app.factorStats.total++;
if (wf.goodOdds) app.factorStats.oddsSuccess++;
if (wf.goodForm) app.factorStats.formSuccess++;
if (wf.trackRecord) app.factorStats.trackSuccess++;
if (wf.goodJockey) app.factorStats.jockeySuccess++;
if (wf.goodTrainer) app.factorStats.trainerSuccess++;
if (wf.optimalFreshness) app.factorStats.freshnessSuccess++;
if (wf.consistentForm) app.factorStats.consistencySuccess++;
if (wf.goodTactical) app.factorStats.tacticalSuccess++;
if (wf.goodTrackCond) app.factorStats.trackCondSuccess++;
if (wf.goodFirstUp) app.factorStats.firstUpSuccess++;
if (wf.goodDistance) app.factorStats.distanceSuccess++;
if (wf.closeLastStart) app.factorStats.lastMarginSuccess++;
if (wf.gearBoost) app.factorStats.gearSuccess++;
if (wf.railAdvantage) app.factorStats.railSuccess++;
if (wf.goodPace) app.factorStats.paceSuccess++;
if (wf.goodClass) app.factorStats.classSuccess++;
if (wf.goodMomentum) app.factorStats.momentumSuccess++;
if (wf.goodFinStr) app.factorStats.finStrSuccess++;
if (wf.goodSectional) app.factorStats.sectionalSuccess++;
if (wf.goodWeatherRail) app.factorStats.weatherRailSuccess++;
}
// Replay through each model — each uses its own learningObjective
replayRaceForModel(r, app.baseWeights);    // Base
replayRaceForModel(r, app.customWeights);  // Kimi  (top3)
replayRaceForModel(r, app.custom2Weights); // Grok  (top2)
replayRaceForModel(r, app.custom3Weights); // GPT   (top3)
// Rebuild pattern library from this historical result
if (r.winnerFactors) {
  var relearWinner = { odds: r.actualOdds || 0,
    settlingPosition: r.fieldSnapshot ? (function(){
      var w = r.fieldSnapshot.filter(function(h){return h.name===r.actual;})[0];
      return w ? w.settlingPosition||0 : 0; })() : 0,
    runningStyle: '' };
  app.recordPattern(relearWinner, r.winnerFactors, r.correct);
}
}
// Rebuild venue profiles
for (var vi = 0; vi < app.raceHistory.length; vi++) {
var vr = app.raceHistory[vi];
if (!vr.track) continue;
var vp = getVenueProfile(vr.track);
vp.races++;
if (vr.correct) vp.wins++;
if (vr.top3 || vr.top3Hits >= 2) vp.top3++;
var hits3 = vr.top3Hits || (vr.top3 ? 2 : (vr.correct ? 1 : 0));
if (vr.factorSnapshot) {
var fs3 = vr.factorSnapshot;
VENUE_FACTORS.forEach(function(fkey) {
var val = fs3[fkey] || 0;
if (hits3 >= 3 && val > 0) vp.multipliers[fkey] = Math.min(1.5, (vp.multipliers[fkey]||1) * 1.02);
else if (hits3 <= 1 && val > 0) vp.multipliers[fkey] = Math.max(0.6, (vp.multipliers[fkey]||1) * 0.99);
});
}
}
// Enforce objectives after replay and restore app.W
app.customWeights.learningObjective = 'top3';
if (app.custom2Weights.learningObjective !== 'top2') {
  app.custom2Weights.learningObjective = 'top2';
  app.custom2Weights.top3Weight = 0.30;
  app.custom2Weights.winWeight  = 0.70;
}
app.custom3Weights.learningObjective = 'top3';
if (app.activeModel === 'custom')        app.W = app.customWeights;
else if (app.activeModel === 'custom2')  app.W = app.custom2Weights;
else if (app.activeModel === 'custom3')  app.W = app.custom3Weights;
else if (app.activeModel === 'saturday') app.W = app.saturdayWeights;
else app.W = app.baseWeights;
// ── Learning Direction Report ─────────────────────────────────────
var factorWeightMap = [
  { wkey: 'odds',           skey: 'odds',        label: 'Odds' },
  { wkey: 'form1',          skey: 'form',        label: 'Form' },
  { wkey: 'formConsistency',skey: 'consistency', label: 'Form Consistency' },
  { wkey: 'trackWin',       skey: 'track',       label: 'Track Win' },
  { wkey: 'jockeyWin',      skey: 'jockey',      label: 'Jockey' },
  { wkey: 'trainerWin',     skey: 'trainer',     label: 'Trainer' },
  { wkey: 'freshness',      skey: 'freshness',   label: 'Freshness' },
  { wkey: 'pacePressure',   skey: 'pace',        label: 'Pace Pressure' },
  { wkey: 'classChange',    skey: 'class',       label: 'Class Change' },
  { wkey: 'formMomentum',   skey: 'momentum',    label: 'Form Momentum' },
  { wkey: 'sectionalSpeed', skey: 'sectional',   label: 'Sectional Speed' },
  { wkey: 'trackCondition', skey: 'trackCond',   label: 'Track Condition' },
  { wkey: 'careerWin',      skey: 'career',      label: 'Career Win' },
  { wkey: 'finishStrength', skey: 'finStr',      label: 'Finish Strength' },
  { wkey: 'weatherRailBias',skey: 'weatherRail', label: 'Weather/Rail' }
];
var rptLines = [];
// --- BASE RESET MEMORY ---
var _scarTissueData = [];
try { _scarTissueData = JSON.parse(localStorage.getItem('horseBaseScarTissue') || '[]'); } catch(e) {}
var _driftGuardData = null;
try { _driftGuardData = JSON.parse(localStorage.getItem('horseBaseDriftGuard') || 'null'); } catch(e) {}
rptLines.push('--- BASE RESET MEMORY ---');
if (_scarTissueData.length === 0) {
  rptLines.push('No Base resets recorded. Base has been learning continuously.');
} else {
  var _scarReversed = _scarTissueData.slice().reverse();
  for (var _sri = 0; _sri < _scarReversed.length; _sri++) {
    var _sc = _scarReversed[_sri];
    var _resetNum = _scarTissueData.length - _sri;
    var _resetDate = new Date(_sc.timestamp);
    var _months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var _dateStr = _resetDate.getDate() + ' ' + _months[_resetDate.getMonth()] + ' ' + _resetDate.getFullYear();
    var _tIcon = _sc.trend === 'declining' ? '\ud83d\udcc9 Declining' : _sc.trend === 'improving' ? '\ud83d\udcc8 Improving' : '\u27a1 Stable';
    rptLines.push('Reset #' + _resetNum + ' \u2014 ' + _dateStr + ' \u2014 Accuracy: ' + _sc.accuracyAtReset + '% \u2014 Trend: ' + _tIcon);
    if (_sc.overweightedFactors && _sc.overweightedFactors.length > 0) {
      var _owStrs = _sc.overweightedFactors.map(function(fk) {
        var _dflt = app.defaultWeights[fk];
        var _atReset = _sc.weightSnapshot ? (_sc.weightSnapshot[fk] || _dflt) : _dflt;
        var _pct = _dflt > 0 ? Math.round(((_atReset - _dflt) / _dflt) * 100) : 0;
        return fk + ' (+' + _pct + '%)';
      });
      rptLines.push('  Overweighted at reset: ' + _owStrs.join(', '));
    } else {
      rptLines.push('  Overweighted at reset: none');
    }
    rptLines.push('  Races completed before reset: ' + (_sc.racesCompleted || 0));
    if (_sri === 0 && _driftGuardData && _driftGuardData.active) {
      var _remaining = Math.max(0, (_driftGuardData.guardsUntilRace || 100) - (_driftGuardData.racesRun || 0));
      rptLines.push('  Drift Guard: \u2705 Active (' + _remaining + ' races remaining)');
    } else {
      rptLines.push('  Drift Guard: \u274c Expired');
    }
    rptLines.push('');
  }
}
rptLines.push('');
rptLines.push('=== BASE MODEL LEARNING DIRECTION REPORT ===');
rptLines.push('Replayed ' + relearned + ' races | ' + new Date().toLocaleDateString());
rptLines.push('');
rptLines.push('Factor         Old  New   Chg    Hit Rate   Direction');
rptLines.push('------------------------------------------------------');
var wrongCount = 0, rightCount = 0, neutralCount = 0;
var wrongItems = [];
for (var rli = 0; rli < factorWeightMap.length; rli++) {
  var fm = factorWeightMap[rli];
  var oldW = Math.round(preBaseWeights[fm.wkey] || 0);
  var newW = Math.round(app.baseWeights[fm.wkey] || 0);
  var change = newW - oldW;
  var pctChg = oldW > 0 ? Math.round((change / oldW) * 100) : 0;
  var succ = app.factorStats[fm.skey + 'Success'] || 0;
  var fail = app.factorStats[fm.skey + 'Fail'] || 0;
  var total2 = succ + fail;
  var hitRate = total2 >= 3 ? Math.round((succ / total2) * 100) : -1; // need ≥3 samples for a meaningful rate
  var arrow = pctChg > 0 ? '\u2191' : pctChg < 0 ? '\u2193' : '\u2192';
  var verdict = '  ';
  var isRight = null;
  // require ≥2% weight change (signal) and ≥5 samples (confidence) before classifying direction
  if (Math.abs(pctChg) >= 2 && total2 >= 5) {
    if (hitRate > 50 && pctChg > 0) { verdict = '\u2705'; isRight = true; }
    else if (hitRate > 50 && pctChg < 0) { verdict = '\u26a0'; isRight = false; }
    else if (hitRate < 40 && pctChg < 0) { verdict = '\u2705'; isRight = true; }
    else if (hitRate < 40 && pctChg > 0) { verdict = '\u26a0'; isRight = false; }
  }
  if (isRight === true) rightCount++;
  else if (isRight === false) { wrongCount++; wrongItems.push(fm.label); }
  else neutralCount++;
  var hitStr = hitRate >= 0 ? hitRate + '% (' + succ + '/' + total2 + ')' : 'n/a';
  var chgStr = (pctChg >= 0 ? '+' : '') + pctChg + '% ' + arrow;
  rptLines.push(verdict + ' ' + fm.label.padEnd(14) + ' ' + String(oldW).padStart(4) + ' ' + String(newW).padStart(4) + '  ' + chgStr.padEnd(8) + ' ' + hitStr);
}
rptLines.push('');
// ── Progressive Top-3 Trend ─────────────────────────────────────────────────
rptLines.push('--- PROGRESSIVE TOP-3 TREND ---');
var TREND_BLOCKS = 6;
var TREND_ICON_THRESHOLD = 0.2;
var TREND_MSG_THRESHOLD  = 0.2;
var trendBlockSize = Math.max(5, Math.floor(app.raceHistory.length / TREND_BLOCKS));
var trendValues = [];
for (var ti = 0; ti < app.raceHistory.length; ti += trendBlockSize) {
  var tBlock = app.raceHistory.slice(ti, ti + trendBlockSize);
  if (tBlock.length < 3) break; // skip tiny trailing blocks
  var tHitsSum = 0;
  for (var tbi = 0; tbi < tBlock.length; tbi++) tHitsSum += (tBlock[tbi].top3Hits || 0);
  var tAvg = (tHitsSum / tBlock.length);
  trendValues.push(tAvg);
  var tWins = 0, tAll3 = 0;
  for (var tbi2 = 0; tbi2 < tBlock.length; tbi2++) {
    if (tBlock[tbi2].correct) tWins++;
    if ((tBlock[tbi2].top3Hits || 0) >= 3) tAll3++;
  }
  rptLines.push('  Races ' + (ti + 1) + '-' + Math.min(ti + trendBlockSize, app.raceHistory.length) + ':  avg ' + tAvg.toFixed(1) + '/3 hits  wins=' + tWins + '  all-3=' + tAll3);
}
if (trendValues.length >= 2) {
  var tHalfIdx = Math.ceil(trendValues.length / 2);
  var tFirstHalf  = trendValues.slice(0, tHalfIdx);
  var tSecondHalf = trendValues.slice(tHalfIdx);
  var tFirst  = tFirstHalf.reduce(function(a, b)  { return a + b; }, 0) / tFirstHalf.length;
  var tSecond = tSecondHalf.reduce(function(a, b) { return a + b; }, 0) / tSecondHalf.length;
  var tDiff = tSecond - tFirst;
  var tTrendIcon = tDiff > TREND_ICON_THRESHOLD ? '\ud83d\udcc8' : tDiff < -TREND_ICON_THRESHOLD ? '\ud83d\udcc9' : '\u27a1';
  rptLines.push('  Overall trend: ' + tTrendIcon + ' ' + (tDiff >= 0 ? '+' : '') + tDiff.toFixed(2) + ' avg hits/race (2nd half vs 1st half)');
  if (tDiff < -TREND_MSG_THRESHOLD) {
    rptLines.push('  \u26a0 Top-3 rate is declining — check recent race data quality or try Reset + Relearn.');
  } else if (tDiff > TREND_MSG_THRESHOLD) {
    rptLines.push('  \u2705 Top-3 rate is improving — Base is learning in the right direction.');
  } else {
    rptLines.push('  \u2139 Top-3 rate is roughly stable across history.');
  }
}
rptLines.push('');
rptLines.push('--- VERDICT ---');
var dirVerdict;
if (relearned < 5) {
  dirVerdict = '\u2139 Not enough replayed races to determine direction (need at least 5 with factor data).';
  rptLines.push(dirVerdict);
} else if (wrongCount === 0 && rightCount > 0) {
  dirVerdict = '\u2705 Base is learning in the RIGHT direction.';
  rptLines.push(dirVerdict);
  rptLines.push('   All significant weight changes align with factor success rates.');
} else if (wrongCount > 0 && wrongCount <= 2) {
  dirVerdict = '\u26a0 Mostly correct — ' + wrongCount + ' factor(s) may be drifting the wrong way.';
  rptLines.push(dirVerdict);
  rptLines.push('   Review these: ' + wrongItems.join(', '));
  rptLines.push('   This is often normal noise. Monitor over more races before adjusting.');
} else {
  dirVerdict = '\u274c WARNING: ' + wrongCount + ' factors appear to be going the wrong way!';
  rptLines.push(dirVerdict);
  rptLines.push('   Affected: ' + wrongItems.join(', '));
  rptLines.push('   Possible causes: small sample, noisy data, or conflicting signals.');
  rptLines.push('   Try "Reset Weights to Factory" then Relearn again from a clean baseline.');
}
rptLines.push('   Right direction: ' + rightCount + ' | Wrong: ' + wrongCount + ' | Insufficient data: ' + neutralCount);
rptLines.push('');
rptLines.push('Tip: Open Activity Log (\ud83d\udcca) and expand this entry to see full detail.');
var dirIcon = (relearned < 5 || (wrongCount === 0 && rightCount === 0)) ? '\u2139' : wrongCount > 2 ? '\u274c' : wrongCount > 0 ? '\u26a0' : '\u2705';
addLog('relearn', dirIcon + ' Learning Direction Check \u2014 ' + dirVerdict, rptLines.join('\n'));
saveData();
updateStats();
if (!document.getElementById('historyPanel').classList.contains('hidden')) renderHistory();
addLog('relearn', 'Relearned from ' + relearned + ' races (Base + Kimi + Grok + GPT) \u00b7 rebuilt ' + Object.keys(app.venueProfiles).length + ' venue profiles', '');
showSuccess('Relearned from ' + relearned + ' races across all models. Rebuilt ' + Object.keys(app.venueProfiles).length + ' venue profiles.');
setTimeout(function() {
showInfo(dirIcon + ' Learning Direction: ' + dirVerdict + ' — see Activity Log for details.');
}, 4500); // delayed so it follows after the success toast (which auto-hides after 4s)
}
app.resetSpecialistsOnly = function() {
if (!confirm('Reset Kimi, Grok and GPT to their starting philosophies?\n\nBase keeps all its learned weights — only the 3 specialists reset.\nThis cannot be undone.')) return;
// Kimi: Form-First (top3) — AI Audit 17/03/2026 v2
app.customWeights = app.sanitizeWeights(Object.assign({}, app.defaultWeights, {
  odds: 236, form1: 89, form2: 60, form3: 30, form4: 15, form5: 8,
  formConsistency: 68, freshness: 32,
  jockeyWin: 38, trainerWin: 27,
  trackWin: 70, trackDistWin: 90,
  trackCondition: 79, tactical: 44,
  classChange: 40, pacePressure: 33,
  formMomentum: 74, finishStrength: 54,
  sectionalSpeed: 46, weatherRailBias: 32,
  secondUpForm: 30, jockeyForm: 37, trainerForm: 26,
  learningObjective: 'top3'
}));
// Grok: Top-2 Hunter (top2) — AI Audit 17/03/2026 v2: odds -10% (3rd consecutive cut)
app.custom2Weights = app.sanitizeWeights(Object.assign({}, app.defaultWeights, {
  odds: 548, form1: 39, form2: 20, form3: 12, form4: 8, form5: 4,
  formConsistency: 27, freshness: 22,
  jockeyWin: 64, trainerWin: 50,
  trackWin: 70, trackDistWin: 90,
  trackCondition: 91, tactical: 43,
  classChange: 59, pacePressure: 44,
  formMomentum: 32, finishStrength: 27,
  sectionalSpeed: 40, weatherRailBias: 30,
  secondUpForm: 30, jockeyForm: 35, trainerForm: 25,
  top3Weight: 0.30, winWeight: 0.70, learningObjective: 'top2'
}));
// GPT: Place Finder (top3) — AI Audit 17/03/2026 v2: formConsistency cut, tactical+odds boosted
app.custom3Weights = app.sanitizeWeights(Object.assign({}, app.defaultWeights, {
  odds: 166, form1: 34,
  formConsistency: 96, freshness: 63,
  jockeyWin: 32, trainerWin: 29,
  trackWin: 59, trackDistWin: 74,
  trackCondition: 117, tactical: 43,
  classChange: 40, pacePressure: 30,
  formMomentum: 55, finishStrength: 81,
  sectionalSpeed: 33, weatherRailBias: 36,
  secondUpForm: 30, jockeyForm: 32, trainerForm: 29,
  top3Weight: 0.85, winWeight: 0.15, learningObjective: 'top3'
}));
app.custom3Metrics = { correct:0, total:0, top2:0, top3:0 };
if (app.activeModel === 'custom')  app.W = app.customWeights;
if (app.activeModel === 'custom2') app.W = app.custom2Weights;
if (app.activeModel === 'custom3') app.W = app.custom3Weights;
saveData();
addLog('relearn', 'Specialists reset to philosophy defaults — Base weights preserved', '');
showSuccess('Kimi, Grok & GPT reset to philosophy defaults. Base weights unchanged.');
};

app.rebalanceModel = function() {
if (app.raceHistory.length < 10) { showError('Need at least 10 races before rebalancing.'); return; }
var favWins = 0, favTotal = 0, totalWins = 0;
for (var i = 0; i < app.raceHistory.length; i++) {
var r = app.raceHistory[i];
if (r.correct) { totalWins++; if (r.predictedOdds && r.predictedOdds < 5) favWins++; }
if (r.predictedOdds && r.predictedOdds < 5) favTotal++;
}
var favAccuracy = favTotal > 0 ? (favWins / favTotal) : 0;
var overallAccuracy = totalWins / app.raceHistory.length;
var newWeights = Object.assign({}, app.defaultWeights);
if (favAccuracy > 0.5) { newWeights.odds *= 1.15; newWeights.rating *= 1.1; }
else if (favAccuracy < 0.35) { newWeights.odds *= 0.8; newWeights.form1 *= 1.3; newWeights.formConsistency *= 1.25; newWeights.jockeyWin *= 1.2; newWeights.trackWin *= 1.2; }
if (app.factorStats && app.factorStats.total > 10) {
var total = app.factorStats.total;
if (app.factorStats.formSuccess / total < 0.3) newWeights.form1 *= 1.3;
if (app.factorStats.trackSuccess / total < 0.3) newWeights.trackWin *= 1.25;
if (app.factorStats.jockeySuccess / total < 0.25) newWeights.jockeyWin *= 1.2;
if (app.factorStats.freshnessSuccess / total < 0.25) newWeights.freshness *= 1.2;
if (app.factorStats.tacticalSuccess / total < 0.25) newWeights.tactical *= 1.2;
if (app.factorStats.gearSuccess / total < 0.2) newWeights.gearChange *= 1.15;
}
if (overallAccuracy > 0.5) {
for (var key in newWeights) {
if (newWeights.hasOwnProperty(key) && app.baseWeights.hasOwnProperty(key)) newWeights[key] = (app.baseWeights[key] * 0.6 + newWeights[key] * 0.4);
}
}
app.baseWeights = newWeights;
if (app.activeModel === 'base') {
app.W = app.baseWeights;
}
saveData();
showSuccess('BasePredictor rebalanced! Fav: ' + Math.round(favAccuracy * 100) + '% | Overall: ' + Math.round(overallAccuracy * 100) + '%');
if (!document.getElementById('historyPanel').classList.contains('hidden')) renderHistory();
};
app.switchModel = function(modelType, skipSave) {
if (['base','custom','custom2','custom3','saturday','lab'].indexOf(modelType) === -1) return;
app.activeModel = modelType;
if (modelType === 'custom') app.W = app.customWeights;
else if (modelType === 'custom2') app.W = app.custom2Weights;
else if (modelType === 'custom3') app.W = app.custom3Weights;
else if (modelType === 'saturday') app.W = app.saturdayWeights;
else if (modelType === 'lab')     app.W = app.labWeights || app.baseWeights;
else app.W = app.baseWeights;
// Enforce learningObjective — belt-and-braces in case localStorage loaded old data
if (modelType === 'custom2' && app.W.learningObjective !== 'top2') {
  app.W.learningObjective = 'top2';
  if (!app.W.top3Weight || app.W.top3Weight > 0.35) app.W.top3Weight = 0.30;
  if (!app.W.winWeight  || app.W.winWeight  < 0.65) app.W.winWeight  = 0.70;
}
if ((modelType === 'custom' || modelType === 'custom3') && !app.W.learningObjective) {
  app.W.learningObjective = 'top3';
}
var btns = {
base:     document.getElementById('baseModelBtn'),
custom:   document.getElementById('customModelBtn'),
custom2:  document.getElementById('custom2ModelBtn'),
custom3:  document.getElementById('custom3ModelBtn'),
saturday: document.getElementById('saturdayModelBtn')
};
var dimColors = {
base:     'linear-gradient(135deg,#065f46,#047857)',
custom:   'linear-gradient(135deg,#4c1d95,#6d28d9)',
custom2:  'linear-gradient(135deg,#78350f,#b45309)',
custom3:  'linear-gradient(135deg,#164e63,#0e7490)',
saturday: 'linear-gradient(135deg,#4c0f0f,#7f1d1d)'
};
var activeColors = {
base:     'linear-gradient(135deg,#059669,#10b981)',
custom:   'linear-gradient(135deg,#7c3aed,#a855f7)',
custom2:  'linear-gradient(135deg,#b45309,#f59e0b)',
custom3:  'linear-gradient(135deg,#0e7490,#06b6d4)',
saturday: 'linear-gradient(135deg,#b91c1c,#ef4444)'
};
var statusColors = {
base:     'var(--accent-green)',
custom:   'var(--accent-purple)',
custom2:  'var(--accent-gold)',
custom3:  'var(--accent-blue)',
saturday: '#fca5a5'
};
var statusLabels = {
base:     '🧠 Active: BasePredictor (Self-Learning AI)',
custom:   '[' + app.getModelName('custom') + '] Active: ' + app.getModelName('custom') + ' (Custom Weights)',
custom2:  '[' + app.getModelName('custom2') + '] Active: ' + app.getModelName('custom2') + ' (Custom Weights)',
custom3:  '[' + app.getModelName('custom3') + '] Active: ' + app.getModelName('custom3') + ' (Custom Weights)',
saturday: '🐴 Active: Saturday Model (Saturday-Only Learning)'
};
var badgeLabels = {
base:     '🧠 BasePredictor',
custom:   '[' + app.getModelName('custom') + '] ' + app.getModelName('custom'),
custom2:  '[' + app.getModelName('custom2') + '] ' + app.getModelName('custom2'),
custom3:  '[' + app.getModelName('custom3') + '] ' + app.getModelName('custom3'),
saturday: '🐴 Saturday'
};
// Show/hide Saturday panel in the race card area
var satPanel = document.getElementById('saturdayPanel');
if (satPanel) satPanel.style.display = modelType === 'saturday' ? 'block' : 'none';
// Show AUTO badge if today is Saturday
var satTag = document.getElementById('satAutoTag');
if (satTag) satTag.style.display = (modelType === 'saturday' && new Date().getDay() === 6) ? 'inline' : 'none';
// Update race card title
var rcTitle = document.getElementById('raceCardTitle');
var rcSub = document.getElementById('raceCardSubtitle');
if (modelType === 'saturday') {
if (rcTitle) rcTitle.style.color = '#fca5a5';
if (rcSub) rcSub.textContent = 'Saturday mode -- using Saturday-only weights';
} else {
if (rcTitle) rcTitle.style.color = 'var(--accent-green)';
if (rcSub) rcSub.textContent = 'Paste race card text - all 4 models predict, enter result immediately';
}
var badgeBgs = {
base:    'linear-gradient(135deg,#059669,#10b981)',
custom:  'linear-gradient(135deg,#7c3aed,#a855f7)',
custom2: 'linear-gradient(135deg,#b45309,#f59e0b)',
custom3: 'linear-gradient(135deg,#0e7490,#06b6d4)',
};
for (var k in btns) {
if (btns[k]) btns[k].style.background = (k === modelType) ? activeColors[k] : dimColors[k];
if (k === 'custom2' && btns[k]) btns[k].style.color = (k === modelType) ? '#000' : '';
}
// Refresh model button labels with custom names
var btnLabels = { custom: 'customModelBtnLabel', custom2: 'custom2ModelBtnLabel', custom3: 'custom3ModelBtnLabel' };
for (var slot in btnLabels) {
var lbl = document.getElementById(btnLabels[slot]);
if (lbl) lbl.textContent = '[' + app.getModelName(slot) + '] ' + app.getModelName(slot);
}
var editBtn = document.getElementById('editCustomBtn');
var statusDiv = document.getElementById('modelStatus');
if (modelType === 'base') {
editBtn.classList.add('hidden');
} else {
editBtn.classList.remove('hidden');
var names = { custom: app.getModelName('custom'), custom2: app.getModelName('custom2'), custom3: app.getModelName('custom3') };
editBtn.textContent = '✏ Edit ' + names[modelType] + ' Weights';
}
statusDiv.style.background = 'rgba(0,0,0,0.15)';
statusDiv.style.borderColor = statusColors[modelType];
statusDiv.innerHTML = '<p style="color:' + statusColors[modelType] + '; font-size:13px; font-weight:600;">' + statusLabels[modelType] + '</p>';
var cardBadge = document.getElementById('raceCardModelBadge');
if (cardBadge) {
cardBadge.textContent = badgeLabels[modelType];
cardBadge.style.background = badgeBgs[modelType];
cardBadge.style.color = modelType === 'custom2' ? '#000' : 'white';
}
if (!skipSave) {
if (modelType !== 'saturday') localStorage.setItem('horseLastWeekdayModel', modelType);
saveData();
var names2 = { base: app.getModelName('base'), custom: app.getModelName('custom'), custom2: app.getModelName('custom2'), custom3: app.getModelName('custom3'), saturday: app.getModelName('saturday') };
addLog('switch', 'Switched to ' + (names2[modelType] || modelType), '');
if (modelType !== 'saturday') showSuccess('Switched to ' + (names2[modelType] || modelType));
}
};
app.applyPastedWeights = function() {
var text = document.getElementById('weightPasteInput').value;
var statusEl = document.getElementById('weightPasteStatus');
if (!text.trim()) return;
var labelMap = {
'odds': 'odds',
'rating': 'rating',
'career win': 'careerWin', 'careerwin': 'careerWin', 'career wins': 'careerWin',
'career place': 'careerPlace', 'careerplace': 'careerPlace', 'career places': 'careerPlace',
'track win': 'trackWin', 'trackwin': 'trackWin', 'track wins': 'trackWin',
'track dist win': 'trackDistWin', 'trackdistwin': 'trackDistWin', 'track dist wins': 'trackDistWin', 'track distance win': 'trackDistWin',
'distance suit': 'distanceSuit', 'distancesuit': 'distanceSuit',
'track condition': 'trackCondition', 'trackcondition': 'trackCondition', 'condition': 'trackCondition',
'form1': 'form1', 'form 1': 'form1',
'form2': 'form2', 'form 2': 'form2',
'form3': 'form3', 'form 3': 'form3',
'form4': 'form4', 'form 4': 'form4',
'form5': 'form5', 'form 5': 'form5',
'form consistency': 'formConsistency', 'formconsistency': 'formConsistency', 'consistency': 'formConsistency',
'jockey win': 'jockeyWin', 'jockeywin': 'jockeyWin', 'jockey wins': 'jockeyWin', 'jockey': 'jockeyWin',
'trainer win': 'trainerWin', 'trainerwin': 'trainerWin', 'trainer wins': 'trainerWin', 'trainer': 'trainerWin',
'tactical': 'tactical',
'freshness': 'freshness', 'fresh': 'freshness',
'weight': 'weight',
'rail position': 'railPosition', 'railposition': 'railPosition', 'rail': 'railPosition',
'first up': 'firstUp', 'firstup': 'firstUp', '1st up': 'firstUp',
'last start margin': 'lastStartMargin', 'laststartmargin': 'lastStartMargin', 'last margin': 'lastStartMargin', 'margin': 'lastStartMargin',
'gear change': 'gearChange', 'gearchange': 'gearChange', 'gear': 'gearChange',
'pace pressure': 'pacePressure', 'pacepressure': 'pacePressure', 'pace': 'pacePressure',
'class change': 'classChange', 'classchange': 'classChange', 'class': 'classChange',
'form momentum': 'formMomentum', 'formmomentum': 'formMomentum', 'momentum': 'formMomentum',
'finish strength': 'finishStrength', 'finishstrength': 'finishStrength', 'finish str': 'finishStrength', 'fin str': 'finishStrength', 'finishing strength': 'finishStrength',
'sectional speed': 'sectionalSpeed', 'sectionalspeed': 'sectionalSpeed', 'sectional': 'sectionalSpeed',
'weather rail bias': 'weatherRailBias', 'weatherrailbias': 'weatherRailBias', 'weather rail': 'weatherRailBias', 'weather': 'weatherRailBias',
'top3 weight': 'top3Weight', 'top3weight': 'top3Weight', 'top 3 weight': 'top3Weight', 'top3': 'top3Weight',
'win weight': 'winWeight', 'winweight': 'winWeight',
'margin learning': 'marginLearning', 'marginlearning': 'marginLearning'
};
var applied = [], notFound = [];
var lines = text.split('\n');
for (var i = 0; i < lines.length; i++) {
var line = lines[i];
var clean = line
.replace(/\*\*/g, '')
.replace(/\*/g, '')
.replace(/`/g, '')
.replace(/\([^)]*\)/g, '')
.replace(/^[\s\-\*\#]+/, '')
.trim();
if (!clean) continue;
var colonIdx = clean.indexOf(':');
if (colonIdx === -1) continue;
var labelRaw = clean.substring(0, colonIdx).trim();
var valuePart = clean.substring(colonIdx + 1).trim();
var allNums = valuePart.match(/[\d]+(?:\.[\d]+)?/g);
if (!allNums || allNums.length === 0) continue;
var val = parseFloat(allNums[allNums.length - 1]);
if (isNaN(val) || val < 0) continue;
var labelKey = labelRaw.toLowerCase().replace(/\s+/g, ' ').trim();
var weightKey = labelMap[labelKey];
if (!weightKey) weightKey = labelMap[labelKey.replace(/s$/, '')];
if (!weightKey) {
var best = null, bestLen = 0;
for (var lk in labelMap) {
if ((lk.indexOf(labelKey) !== -1 || labelKey.indexOf(lk) !== -1) && lk.length > bestLen) {
best = labelMap[lk]; bestLen = lk.length;
}
}
weightKey = best;
}
if (weightKey) {
var activeWeightsRef = app.activeModel === 'custom2' ? app.custom2Weights :
app.activeModel === 'custom3' ? app.custom3Weights :
app.customWeights;
if (activeWeightsRef && activeWeightsRef[weightKey] !== undefined) {
activeWeightsRef[weightKey] = val;
applied.push(labelRaw + ' -> ' + val);
}
} else if (labelRaw.length > 1 && labelRaw.length < 35) {
notFound.push(labelRaw);
}
}
statusEl.style.display = 'block';
if (applied.length > 0) {
var savedPaste = document.getElementById('weightPasteInput').value;
app.rebuildWeightInputs();
document.getElementById('weightPasteInput').value = savedPaste;
statusEl.style.display = 'block';
statusEl.style.background = 'rgba(16,185,129,0.15)';
statusEl.style.color = 'var(--accent-green)';
statusEl.innerHTML = '✅ Applied <strong>' + applied.length + '</strong> weights. Hit <strong>💾 Save Changes</strong> to confirm.' +
(notFound.length > 0 ? '<br><span style="color:var(--text-muted); font-size:11px;">⚠ Unrecognised: ' + notFound.join(', ') + '</span>' : '');
applied.forEach(function(a) {
var k = a.split(' -> ')[0];
});
} else {
statusEl.style.background = 'rgba(239,68,68,0.1)';
statusEl.style.color = 'var(--accent-red)';
statusEl.textContent = '❌ No weights found. Paste needs "Label: value" format.';
}
};
app.rebuildWeightInputs = function() {
var contentEl = document.getElementById('weightEditorContent');
var activeWeights = app.activeModel === 'custom2'  ? app.custom2Weights  :
app.activeModel === 'custom3'  ? app.custom3Weights  :
app.activeModel === 'saturday' ? app.saturdayWeights :
app.activeModel === 'base'     ? app.baseWeights     : app.customWeights;
// Philosophy banner — shows model objective and key emphasis
var philosophyBanners = {
  custom:   { label: '🔮 Form-First', desc: 'Optimises for Top-3 any order · High: form, momentum, finishStrength · Low: odds', color: '#a855f7' },
  custom2:  { label: '⚡ Top-2 Hunter', desc: 'Optimises for Top-2 placement (1st or 2nd) · High: odds value, jockey, class · Low: form, consistency · objective: top2', color: '#f59e0b' },
  custom3:  { label: '🎯 Place Finder', desc: 'Optimises for Top-3 placement · High: careerPlace, consistency, secondUpForm · Low: odds', color: '#06b6d4' },
  saturday: { label: '🏇 Saturday', desc: 'Saturday-only model · learns from weekend races only', color: '#fca5a5' },
  base:     { label: '🧠 BasePredictor', desc: 'Self-learning AI · blends all specialist signals after each race', color: '#10b981' }
};
var pb = philosophyBanners[app.activeModel];
var bannerHtml = pb
  ? '<div style="background:rgba(0,0,0,0.2);border:1px solid ' + pb.color + ';border-radius:8px;padding:8px 12px;margin-bottom:12px;">' +
    '<span style="font-weight:700;color:' + pb.color + ';">' + pb.label + '</span>' +
    ' <span style="color:#94a3b8;font-size:11px;">· ' + pb.desc + '</span>' +
    (activeWeights.learningObjective ? ' <span style="color:#818cf8;font-size:10px;background:rgba(129,140,248,0.15);padding:1px 6px;border-radius:4px;margin-left:4px;">objective: ' + activeWeights.learningObjective + '</span>' : '') +
    '</div>'
  : '';
var weightGroups = {
'Core Factors': ['odds', 'rating', 'careerWin', 'careerPlace'],
'Track & Distance': ['trackWin', 'trackDistWin', 'distanceSuit', 'trackCondition'],
'Form': ['form1', 'form2', 'form3', 'form4', 'form5', 'formConsistency'],
'People': ['jockeyWin', 'trainerWin'],
'Tactical': ['tactical', 'freshness', 'weight', 'railPosition'],
'Conditions': ['firstUp', 'lastStartMargin', 'gearChange'],
'Advanced (v2.5)': ['pacePressure', 'classChange', 'formMomentum', 'finishStrength', 'sectionalSpeed', 'weatherRailBias'],
'Specialist Signals': ['secondUpForm', 'jockeyForm', 'trainerForm'],
'Optimization': ['top3Weight', 'winWeight', 'marginLearning']
};
var html = bannerHtml + '<div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">';
// Scale hints for special multiplier weights
var scaleHints = {
  rating: 'multiplier × sbRating (default 1.2, max 10)',
  weight: 'multiplier × kg diff (default 2.0, max 20)',
  marginLearning: 'learn strength multiplier (default 1.0)',
  top3Weight: 'fraction 0–1 (default 0.70)',
  winWeight: 'fraction 0–1 (default 0.30)',
  secondUpForm: '2nd & 3rd-up run specialist signal (default 30)',
  jockeyForm: 'jockey-horse combo + recent form rate (default 35)',
  trainerForm: 'trainer recent form rate weighting (default 25)'
};
for (var groupName in weightGroups) {
html += '<div style="background:rgba(99,102,241,0.05); border:1px solid var(--border); border-radius:8px; padding:12px;">';
html += '<h4 style="font-size:14px; font-weight:600; color:var(--accent-indigo); margin-bottom:10px;">' + groupName + '</h4>';
var keys = weightGroups[groupName];
for (var i = 0; i < keys.length; i++) {
var key = keys[i];
var value = activeWeights[key];
if (value === undefined) continue;
var displayName = key.replace(/([A-Z])/g, ' $1').replace(/^./, function(s){ return s.toUpperCase(); });
var hint = scaleHints[key] || '';
var ranges = app.weightSafeRanges[key];
var stepVal = (key === 'rating' || key === 'weight' || key === 'marginLearning') ? '0.1' :
              (key === 'top3Weight' || key === 'winWeight') ? '0.01' : '1';
var borderColor = (key === 'rating' || key === 'weight' || key === 'top3Weight' || key === 'winWeight') ? '#f59e0b' : 'var(--border)';
html += '<div style="margin-bottom:8px;">';
html += '<label style="font-size:12px; color:var(--text-secondary); display:block; margin-bottom:2px;">' + displayName;
if (hint) html += ' <span style="color:#f59e0b;font-size:10px;">⚠ ' + hint + '</span>';
html += '</label>';
html += '<input type="number" id="weight_' + key + '" value="' + value.toFixed(key === 'rating' || key === 'weight' || key === 'marginLearning' || key === 'top3Weight' || key === 'winWeight' ? 2 : 0) + '"';
html += ' step="' + stepVal + '" min="' + (ranges ? ranges[0] : 0) + '" max="' + (ranges ? ranges[1] : 9999) + '"';
html += ' style="width:100%; padding:6px; background:var(--bg-input); border:1px solid ' + borderColor + '; border-radius:6px; color:var(--text-primary); font-size:13px;">';
html += '</div>';
}
html += '</div>';
}
html += '</div>';
contentEl.innerHTML = html;
};
app.showCustomEditor = function() {
var modal = document.getElementById('customEditorModal');
var slot = app.activeModel; // 'custom', 'custom2', 'custom3'
var modelName = app.getModelName(slot);
document.querySelector('#customEditorModal h2').textContent = '🧩 Edit ' + modelName + ' Weights';
// Populate name field
var nameInput = document.getElementById('modelNameInput');
if (nameInput) nameInput.value = modelName;
var pasteEl = document.getElementById('weightPasteInput');
var statusEl = document.getElementById('weightPasteStatus');
if (pasteEl) pasteEl.value = '';
if (statusEl) statusEl.style.display = 'none';
app.rebuildWeightInputs();
modal.style.display = 'block';
};

app.getModelName = function(slot) {
var defaults = { custom: 'Kimi', custom2: 'Grok', custom3: 'GPT', base: 'BasePredictor', saturday: 'Saturday' };
return (app.customModelNames && app.customModelNames[slot]) || defaults[slot] || slot;
};

app.saveModelName = function() {
var nameInput = document.getElementById('modelNameInput');
if (!nameInput) return;
var newName = nameInput.value.trim();
if (!newName) { showError('Name cannot be empty'); return; }
if (newName.length > 20) { showError('Name too long (max 20 chars)'); return; }
var slot = app.activeModel;
if (!app.customModelNames) app.customModelNames = {};
app.customModelNames[slot] = newName;
document.querySelector('#customEditorModal h2').textContent = '🧩 Edit ' + newName + ' Weights';
saveData();
updateModelSelector();
showSuccess('Model renamed to "' + newName + '"');
};
app.closeCustomEditor = function() {
var modal = document.getElementById('customEditorModal');
modal.style.display = 'none';
var pasteEl = document.getElementById('weightPasteInput');
var statusEl = document.getElementById('weightPasteStatus');
if (pasteEl) pasteEl.value = '';
if (statusEl) statusEl.style.display = 'none';
};
app.saveCustomWeights = function() {
var targetWeights = app.activeModel === 'custom2'  ? app.custom2Weights  :
app.activeModel === 'custom3'  ? app.custom3Weights  :
app.activeModel === 'saturday' ? app.saturdayWeights :
app.activeModel === 'base'     ? app.baseWeights     : app.customWeights;
var warnings = [];
for (var key in targetWeights) {
var input = document.getElementById('weight_' + key);
if (input) {
var val = parseFloat(input.value);
if (!isNaN(val) && val >= 0) {
// Scale-confusion guard: if entering a large number for a multiplier-scale weight
if ((key === 'rating' || key === 'weight' || key === 'marginLearning') && val > 20) {
warnings.push(key + ' (' + val + ' looks like wrong scale — max is ~10 for this weight)');
val = app.defaultWeights[key]; // reset to safe default
}
if ((key === 'top3Weight' || key === 'winWeight') && val > 1) {
warnings.push(key + ' (' + val + ' — must be 0.0 to 1.0, e.g. 0.70)');
val = app.defaultWeights[key];
}
// Apply hard range cap
var ranges = app.weightSafeRanges[key];
if (ranges) val = Math.max(ranges[0], Math.min(ranges[1], val));
targetWeights[key] = val;
}
}
}
app.sanitizeWeights(targetWeights);
if (app.activeModel === 'custom') app.W = app.customWeights;
else if (app.activeModel === 'custom2') app.W = app.custom2Weights;
else if (app.activeModel === 'custom3') app.W = app.custom3Weights;
app.closeCustomEditor();
var names = { custom: app.getModelName('custom'), custom2: app.getModelName('custom2'), custom3: app.getModelName('custom3') };
var mname = names[app.activeModel] || 'Model';
if (warnings.length > 0) {
showError('⚠ Scale warning — reset to defaults: ' + warnings.join('; '));
} else {
addLog('weights', mname + ' weights saved manually', '');
showSuccess(mname + ' weights updated!');
}
};
app.resetCustomToBase = function() {
// For specialist models (Kimi/Grok/GPT), offer to reset to THEIR philosophy defaults
// For others, reset to base weights as before
var philosophyNames = { custom: 'Form-First philosophy', custom2: 'Top-2 Hunter philosophy', custom3: 'Place Finder philosophy' };
var targetName = philosophyNames[app.activeModel] || 'BasePredictor weights';
var confirmMsg = philosophyNames[app.activeModel]
  ? 'Reset to ' + app.getModelName(app.activeModel) + '\u2019s original ' + targetName + '? (restores starting weights)'
  : 'Reset this model\u2019s weights to match current BasePredictor weights?';
if (confirm(confirmMsg)) {
if (app.activeModel === 'custom') {
  app.customWeights = app.sanitizeWeights(Object.assign({}, app.defaultWeights, {
    odds: 200, form1: 90, form2: 60, form3: 30, form4: 15, form5: 8,
    formConsistency: 70, freshness: 30, jockeyWin: 35, trainerWin: 25,
    trackCondition: 75, lastStartMargin: 60, formMomentum: 75, finishStrength: 55,
    pacePressure: 30, classChange: 40, sectionalSpeed: 45
  }));
  app.W = app.customWeights;
} else if (app.activeModel === 'custom2') {
  app.custom2Weights = app.sanitizeWeights(Object.assign({}, app.defaultWeights, {
    odds: 650, form1: 35, form2: 20, form3: 12, form4: 8, form5: 4,
    formConsistency: 25, freshness: 20, jockeyWin: 70, trainerWin: 55,
    trackCondition: 90, lastStartMargin: 25, formMomentum: 30, finishStrength: 25,
    pacePressure: 45, classChange: 65, sectionalSpeed: 40, jockeyForm: 55, trainerForm: 40,
    top3Weight: 0.30, winWeight: 0.70, learningObjective: 'top2'
  }));
  app.W = app.custom2Weights;
} else if (app.activeModel === 'custom3') {
  app.custom3Weights = app.sanitizeWeights(Object.assign({}, app.defaultWeights, {
    odds: 120, rating: 0.9, careerWin: 80, careerPlace: 180,
    trackWin: 55, trackDistWin: 70, jockeyWin: 30, trainerWin: 28,
    form1: 30, form2: 25, form3: 22, form4: 18, form5: 14,
    formConsistency: 110, freshness: 65, trackCondition: 120, firstUp: 55, distanceSuit: 60,
    lastStartMargin: 45, pacePressure: 28, classChange: 40, formMomentum: 55, finishStrength: 85,
    sectionalSpeed: 30, weatherRailBias: 35,
    secondUpForm: 70, jockeyForm: 25, trainerForm: 22,
    top3Weight: 0.85, winWeight: 0.15, learningObjective: 'top3'
  }));
  app.W = app.custom3Weights;
} else if (app.activeModel === 'saturday') {
  app.saturdayWeights = Object.assign({}, app.defaultWeights); app.W = app.saturdayWeights;
} else {
  app.customWeights = Object.assign({}, app.baseWeights); app.W = app.customWeights;
}
saveData();
app.rebuildWeightInputs();
showSuccess('Reset to ' + targetName);
}
};
app.updateModelMetrics = function() {
var metricsDiv = document.getElementById('modelMetrics');
var rowsDiv    = document.getElementById('leaderboardRows');
var models = [
{ key: 'base',     label: '🧠 BasePredictor', color: '#10b981', metrics: app.baseMetrics },
{ key: 'custom',   label: '🔮 ' + app.getModelName('custom'),   color: '#a855f7', metrics: app.customMetrics },
{ key: 'custom2',  label: '⚡ ' + app.getModelName('custom2'),  color: '#f59e0b', metrics: app.custom2Metrics },
{ key: 'custom3',  label: '🎯 ' + app.getModelName('custom3'),  color: '#06b6d4', metrics: app.custom3Metrics },
{ key: 'saturday', label: '🐴 Saturday',      color: '#fca5a5', metrics: app.saturdayMetrics }
];
var anyData = models.some(function(m) { return m.metrics.total > 0; });
if (!anyData) return;
metricsDiv.style.display = 'block';
models.sort(function(a, b) {
var ap = a.metrics.total > 0 ? a.metrics.top3 / a.metrics.total : -1;
var bp = b.metrics.total > 0 ? b.metrics.top3 / b.metrics.total : -1;
return bp - ap;
});
var html = '';
models.forEach(function(m, rank) {
var mt = m.metrics;
if (mt.total === 0) {
html += '<div style="display:flex; align-items:center; gap:8px; padding:6px 0; border-bottom:1px solid var(--border); font-size:12px;">' +
'<span style="font-size:14px; min-width:20px;">' + (rank+1) + '.</span>' +
'<span style="flex:1; font-weight:600; color:' + m.color + ';">' + m.label + '</span>' +
'<span style="color:var(--text-muted);">No races yet</span></div>';
return;
}
var winPct   = Math.round((mt.correct / mt.total) * 100);
var top3Pct  = Math.round((mt.top3 / mt.total) * 100);
var reached  = top3Pct >= 70;
var medal    = rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : (rank+1) + '.';
var barWidth = Math.min(top3Pct, 100);
var barColor = top3Pct >= 70 ? '#10b981' : top3Pct >= 50 ? '#f59e0b' : '#ef4444';
html += '<div style="padding:7px 0; border-bottom:1px solid var(--border);">' +
'<div style="display:flex; align-items:center; gap:6px; margin-bottom:4px;">' +
'<span style="font-size:14px; min-width:24px;">' + medal + '</span>' +
'<span style="flex:1; font-weight:700; font-size:12px; color:' + m.color + ';">' + m.label + '</span>' +
(reached ? '<span style="font-size:11px; background:#10b981; color:#000; font-weight:700; padding:2px 7px; border-radius:10px;">🎯 TARGET HIT!</span>' : '') +
'<span style="font-size:12px; font-weight:700; color:' + barColor + ';">' + top3Pct + '%</span>' +
'</div>' +
'<div style="background:var(--bg-input); border-radius:4px; height:6px; margin-bottom:4px;">' +
'<div style="background:' + barColor + '; width:' + barWidth + '%; height:6px; border-radius:4px; transition:width 0.4s;"></div>' +
'</div>' +
'<div style="font-size:11px; color:var(--text-muted);">' +
'Top-3: ' + mt.top3 + '/' + mt.total +
' &nbsp;.&nbsp; Win: ' + winPct + '% (' + mt.correct + '/' + mt.total + ')' +
'</div></div>';
});
rowsDiv.innerHTML = html;
};
window.app = app;

// Cross-browser clipboard copy helper
