'use strict';

// § PARSE — form guide parser, speed map parser, race card text
// ═══════════════════════════════════════════════════════════════
app.importRaceResults = function(event) {
var files = event.target.files;
if (!files || files.length === 0) return;
var totalRaces = 0;
var totalLearned = 0;
var filesProcessed = 0;
var errors = [];
var processFile = function(file) {
var reader = new FileReader();
reader.onload = function(e) {
try {
var raw = JSON.parse(e.target.result);
var races = Array.isArray(raw) ? raw : [raw];
for (var r = 0; r < races.length; r++) {
var race = races[r];
totalRaces++;
if (!race.winner || !race.winner.name) {
errors.push(file.name + ' race ' + (r+1) + ': missing winner.name');
continue;
}
var predictedName = '';
var predicted2Name = '';
var predicted3Name = '';
if (race.modelScoreOrder && race.modelScoreOrder.length > 0) {
var winnerNum = race.winner.number;
var predictedNum = race.modelScoreOrder[0].number;
var isCorrect = (winnerNum === predictedNum);
predictedName = isCorrect ? race.winner.name : ('Horse #' + predictedNum);
if (race.modelScoreOrder.length > 1) predicted2Name = 'Horse #' + race.modelScoreOrder[1].number;
if (race.modelScoreOrder.length > 2) predicted3Name = 'Horse #' + race.modelScoreOrder[2].number;
} else {
predictedName = 'Unknown';
}
var isCorrect = (race.modelScoreOrder && race.modelScoreOrder[0] &&
race.modelScoreOrder[0].number === race.winner.number);
var exacta = false, trifecta = false;
if (isCorrect && race.placegetters && race.placegetters.length >= 1 && race.modelScoreOrder && race.modelScoreOrder.length >= 2) {
exacta = (race.placegetters[0].number === race.modelScoreOrder[1].number);
if (exacta && race.placegetters.length >= 2 && race.modelScoreOrder.length >= 3) {
trifecta = (race.placegetters[1].number === race.modelScoreOrder[2].number);
}
}
if (!app.factorStats) {
app.factorStats = { total: 0, oddsSuccess: 0, formSuccess: 0, trackSuccess: 0, jockeySuccess: 0, trainerSuccess: 0, freshnessSuccess: 0, consistencySuccess: 0, tacticalSuccess: 0, trackCondSuccess: 0, firstUpSuccess: 0, distanceSuccess: 0, lastMarginSuccess: 0, gearSuccess: 0, railSuccess: 0, paceSuccess: 0, classSuccess: 0, momentumSuccess: 0, finStrSuccess: 0, sectionalSuccess: 0, weatherRailSuccess: 0, careerSuccess: 0, trackDistSuccess: 0, ratingSuccess: 0, oddsFail: 0, formFail: 0, trackFail: 0, jockeyFail: 0, trainerFail: 0, freshnessFail: 0, consistencyFail: 0, tacticalFail: 0, trackCondFail: 0, firstUpFail: 0, distanceFail: 0, lastMarginFail: 0, gearFail: 0, railFail: 0, paceFail: 0, classFail: 0, momentumFail: 0, finStrFail: 0, sectionalFail: 0, weatherRailFail: 0, careerFail: 0, trackDistFail: 0, ratingFail: 0 };
}
app.factorStats.total++;
if (race.factors) {
var f = race.factors;
if (f.odds) app.factorStats.oddsSuccess++;
if (f.form) app.factorStats.formSuccess++;
if (f.track) app.factorStats.trackSuccess++;
if (f.jockey) app.factorStats.jockeySuccess++;
if (f.trainer) app.factorStats.trainerSuccess++;
if (f.fresh || f.freshness) app.factorStats.freshnessSuccess++;
if (f.consistency || f.formConsistency) app.factorStats.consistencySuccess++;
if (f.tactical) app.factorStats.tacticalSuccess++;
if (f.condition || f.trackCond || f.trackCondition) app.factorStats.trackCondSuccess++;
if (f.firstUp) app.factorStats.firstUpSuccess++;
if (f.distance || f.dist) app.factorStats.distanceSuccess++;
if (f.margin || f.lastMargin) app.factorStats.lastMarginSuccess++;
if (f.gear || f.gearChange) app.factorStats.gearSuccess++;
if (f.rail || f.railPosition) app.factorStats.railSuccess++;
if (f.pace || f.pacePressure) app.factorStats.paceSuccess++;
if (f.classChg || f.classChange || f.class) app.factorStats.classSuccess++;
if (f.momentum || f.formMomentum) app.factorStats.momentumSuccess++;
if (f.finStr || f.finishStrength) app.factorStats.finStrSuccess++;
if (f.sectional || f.sectionalSpeed) app.factorStats.sectionalSuccess++;
if (f.weatherRail || f.weatherRailBias) app.factorStats.weatherRailSuccess++;
}
if (race.weightsAfterLearn) {
var wl = race.weightsAfterLearn;
if (wl.odds) app.W.odds = Math.max(250, Math.min(600, wl.odds));
if (wl.form) { app.W.form1 = Math.max(30, Math.min(120, wl.form)); app.W.form2 = Math.max(15, Math.min(70, wl.form * 0.5)); }
if (wl.track) app.W.trackWin = Math.max(40, Math.min(180, wl.track));
if (wl.cond) app.W.trackCondition = Math.max(30, Math.min(150, wl.cond));
if (wl.dist) app.W.distanceSuit = Math.max(20, Math.min(90, wl.dist));
if (wl.tactical) app.W.tactical = Math.max(20, Math.min(80, wl.tactical));
if (wl.consistency) app.W.formConsistency = Math.max(20, Math.min(80, wl.consistency));
if (wl.fresh) app.W.freshness = Math.max(10, Math.min(60, wl.fresh));
if (wl.rail) app.W.railPosition = Math.max(10, Math.min(60, wl.rail));
if (wl.margin) app.W.lastStartMargin = Math.max(15, Math.min(70, wl.margin));
if (wl.gear) app.W.gearChange = Math.max(10, Math.min(60, wl.gear));
if (wl.firstUp) app.W.firstUp = Math.max(20, Math.min(100, wl.firstUp));
if (wl.jockey) app.W.jockeyWin = Math.max(20, Math.min(100, wl.jockey));
if (wl.trainer) app.W.trainerWin = Math.max(15, Math.min(80, wl.trainer));
}
if (race.winner.jockey) {
var jName = race.winner.jockey;
if (!app.jockeyStats[jName]) app.jockeyStats[jName] = { wins: 0, rides: 0 };
app.jockeyStats[jName].wins++;
app.jockeyStats[jName].rides++;
}
if (race.winner.trainer) {
var tName = race.winner.trainer;
if (!app.trainerStats[tName]) app.trainerStats[tName] = { wins: 0, runners: 0 };
app.trainerStats[tName].wins++;
app.trainerStats[tName].runners++;
}
var venue = race.raceVenue || 'Unknown';
var raceNum = race.raceNumber ? 'R' + race.raceNumber : '';
var raceLabel = venue + ' ' + raceNum;
var raceDate = race.raceDate || new Date().toLocaleDateString();
var dupKey = raceLabel + '|' + raceDate;
var isDup = false;
for (var d = 0; d < app.raceHistory.length; d++) {
if ((app.raceHistory[d].race + '|' + app.raceHistory[d].date) === dupKey) { isDup = true; break; }
}
if (!isDup) {
app.raceHistory.push({
race: raceLabel,
predicted: predictedName,
actual: race.winner.name,
actual2: race.placegetters && race.placegetters[0] ? race.placegetters[0].name : '',
actual3: race.placegetters && race.placegetters[1] ? race.placegetters[1].name : '',
predicted2: predicted2Name,
predicted3: predicted3Name,
correct: isCorrect,
exacta: exacta,
trifecta: trifecta,
learnMsg: race.learningNotes || (isCorrect ? '✅ Correct (imported)' : '❌ Wrong (imported)'),
predictedOdds: 0,
actualOdds: race.winner.odds || 0,
date: raceDate,
winnerFactors: race.factors ? {
goodOdds: !!race.factors.odds,
goodForm: !!race.factors.form,
trackRecord: !!race.factors.track,
goodJockey: !!race.factors.jockey,
goodTrainer: !!race.factors.trainer,
optimalFreshness: !!race.factors.fresh,
consistentForm: !!race.factors.consistency,
goodTactical: !!race.factors.tactical,
goodTrackCond: !!race.factors.condition,
goodFirstUp: !!race.factors.firstUp,
goodDistance: !!race.factors.distance,
closeLastStart: !!race.factors.margin,
gearBoost: !!race.factors.gear,
railAdvantage: !!race.factors.rail
} : null
});
totalLearned++;
}
}
} catch (err) {
errors.push(file.name + ': ' + err.message);
}
filesProcessed++;
if (filesProcessed === files.length) {
saveData();
updateStats();
if (errors.length > 0) {
showError('Errors: ' + errors.join('; '));
}
if (totalLearned > 0) {
showSuccess('Imported ' + totalLearned + '/' + totalRaces + ' races from ' + files.length + ' file(s). Model updated!');
} else if (errors.length === 0) {
showSuccess('All races already in history (duplicates skipped).');
}
}
};
reader.readAsText(file);
};
for (var i = 0; i < files.length; i++) {
processFile(files[i]);
}
event.target.value = '';
};
app._formGuideData = null;
app.loadFormGuide = function(event) {
var file = event.target.files[0];
if (!file) return;
var reader = new FileReader();
reader.onload = function(e) {
try {
var data = JSON.parse(e.target.result);
if (!data.races || !Array.isArray(data.races)) {
showError('Invalid form guide format. Expected { races: [...] }');
return;
}
app._formGuideData = data;
var select = document.getElementById('formGuideRaceSelect');
select.innerHTML = '';
for (var i = 0; i < data.races.length; i++) {
var r = data.races[i];
var opt = document.createElement('option');
opt.value = i;
var activeCount = r.horses.filter(function(h) { return !h.scratched; }).length;
opt.textContent = r.venue + ' R' + r.raceNumber + ' -- ' + r.raceName.substring(0, 40) + ' (' + activeCount + ' runners, ' + (r.distanceRaw || r.distance + 'm') + ')';
select.appendChild(opt);
}
document.getElementById('formGuideInfo').textContent = data.totalRaces + ' races, ' + data.totalHorses + ' horses from ' + (data.source || 'uploaded file');
document.getElementById('formGuidePicker').classList.remove('hidden');
showSuccess('Form guide loaded! ' + data.races.length + ' races available. Pick one and hit Analyze.');
} catch (err) {
showError('Failed to parse form guide: ' + err.message);
}
};
reader.readAsText(file);
event.target.value = '';
};
app.loadFormGuideRace = function() {
if (!app._formGuideData) { showError('No form guide loaded!'); return; }
var select = document.getElementById('formGuideRaceSelect');
var raceIdx = parseInt(select.value);
var race = app._formGuideData.races[raceIdx];
if (!race || !race.horses) { showError('Invalid race selection.'); return; }
app.winnerSet = false;
app.currentPendingId = null;
hideError();
document.getElementById('winnerBox').innerHTML =
'<h3>🏆 Who Actually Won?</h3>' +
'<p style="color:var(--text-secondary); font-size:14px; margin-bottom:10px;">Select the real finishing positions so we can learn</p>' +
'<label for="winner1Select">1st Place (Winner) *</label>' +
'<select id="winner1Select" aria-required="true"></select>' +
'<label for="winner2Select">2nd Place (Optional)</label>' +
'<select id="winner2Select"></select>' +
'<label for="winner3Select">3rd Place (Optional)</label>' +
'<select id="winner3Select"></select>' +
'<button class="btn btn-winner" onclick="app.recordWinner()">Record Winner</button>';
document.getElementById('savePrompt').innerHTML =
'<h3>💾 Save this prediction?</h3>' +
'<p style="color:var(--text-secondary); font-size:14px; margin-bottom:10px;">Save now and record results after the race finishes</p>' +
'<button class="btn btn-save" onclick="app.savePending()">Save Prediction</button>';
document.getElementById('predictions').innerHTML = '';
var horses = [];
for (var i = 0; i < race.horses.length; i++) {
var fg = race.horses[i];
var h = {
num: fg.num || String(i + 1),
name: fg.name || 'Horse ' + (i + 1),
barrier: fg.barrier || String(i + 1),
jockey: fg.jockey || '',
trainer: fg.trainer || '',
weight: fg.weight || 0,
form: fg.form || '',
odds: fg.odds || 0,
careerRuns: fg.careerRuns || 0,
careerWins: fg.careerWins || 0,
careerPlaces: fg.careerPlaces || 0,
trackRuns: fg.trackRuns || 0,
trackWins: fg.trackWins || 0,
trackDistRuns: fg.trackDistRuns || 0,
trackDistWins: fg.trackDistWins || 0,
distanceRuns: fg.distanceRuns || 0,
distanceWins: fg.distanceWins || 0,
goodRuns: fg.goodRuns || 0,
goodWins: fg.goodWins || 0,
softRuns: fg.softRuns || 0,
softWins: fg.softWins || 0,
heavyRuns: fg.heavyRuns || 0,
heavyWins: fg.heavyWins || 0,
firmRuns: fg.firmRuns || 0,
firmWins: fg.firmWins || 0,
firstUpRuns: fg.firstUpRuns || 0,
firstUpWins: fg.firstUpWins || 0,
secondUpRuns: fg.secondUpRuns || 0,
secondUpWins: fg.secondUpWins || 0,
thirdUpRuns: fg.thirdUpRuns || 0,
thirdUpWins: fg.thirdUpWins || 0,
monthsRuns: fg.monthsRuns || 0,
monthsWins: fg.monthsWins || 0,
monthsPlaces: fg.monthsPlaces || 0,
jockeyComboRuns: fg.jockeyComboRuns || 0,
jockeyComboWins: fg.jockeyComboWins || 0,
sire: fg.sire || '',
dam: fg.dam || '',
foalDate: fg.foalDate || '',
claimKg: fg.claimKg || 0,
effectiveWeight: fg.effectiveWeight || fg.weight || 0,
totalPrizemoney: fg.totalPrizemoney || 0,
lastBarrier: fg.lastBarrier || 0,
lastWeight: fg.lastWeight || 0,
lastPrizewon: fg.lastPrizewon || 0,
lastPrizepool: fg.lastPrizepool || 0,
lastPastCond: fg.lastPastCond || '',
raceHistory: fg.raceHistory || [],
firstUpWins: fg.firstUpWins || 0,
secondUpRuns: fg.secondUpRuns || 0,
secondUpWins: fg.secondUpWins || 0,
sbRating: fg.sbRating || 0,
scratched: fg.scratched || false,
comments: fg.comment || '',
score: 0, prob: 0,
lastStart: '',
lastFinish: '',
lastMargin: fg.lastMargin,
daysAgo: fg.daysAgo || 0,
winPct: fg.careerRuns > 0 ? Math.round((fg.careerWins / fg.careerRuns) * 100) : 0,
placePct: fg.careerRuns > 0 ? Math.round(((fg.careerWins + fg.careerPlaces) / fg.careerRuns) * 100) : 0,
formScore: 0,
consistencyScore: 0,
freshnessScore: 0,
jockeyWinRate: fg.jockeyWinRate || 0,
trainerWinRate: fg.trainerWinRate || 0,
runningStyle: '',
settlingPosition: null,
tacticalScore: 0,
trackConditionScore: 0,
firstUpScore: 0,
distanceScore: 0,
lastMarginScore: 0,
gearChanges: fg.gearChanges || [],
gearScore: 0,
railScore: 0,
classLevel: fg.classLevel || 0,
lastClass: fg.lastClass || 0,
sectional600: fg.sectional600 || 0,
last600Time: fg.last600Time || fg.sectional600 || 0,  // alias so Speed Figure path fires
positionsInRun: fg.positionsInRun || [],
finishPositions: fg.finishPositions || [],
lastSettling: fg.lastSettling || 0,
lastFinishPos: fg.lastFinishPos || 0,
pacePressureScore: 0,
classChangeScore: 0,
formMomentumScore: 0,
finishStrengthScore: 0,
sectionalSpeedScore: 0,
weatherRailBiasScore: 0,
eloRating: 0,
formTrend: 0,
factorContributions: {}
};
horses.push(h);
}
app.raceInfo = {
track: race.venue || '',
race: 'R' + (race.raceNumber || ''),
name: race.raceName || '',
distance: race.distance || 0,
condition: race.condition || 'Good',
conditionType: 'good',
classLevel: 0,
railOut: 0,
railPosition: '',
humidity: '',
weather: race.weather || '',
temp: ''
};
var cond = (race.condition || '').toLowerCase();
if (cond.indexOf('heavy') >= 0) app.raceInfo.conditionType = 'heavy';
else if (cond.indexOf('soft') >= 0) app.raceInfo.conditionType = 'soft';
else if (cond.indexOf('firm') >= 0) app.raceInfo.conditionType = 'firm';
else app.raceInfo.conditionType = 'good';
var rn = (race.raceName || '').toLowerCase();
if (/group\s*1/i.test(rn)) app.raceInfo.classLevel = 1;
else if (/group\s*2/i.test(rn)) app.raceInfo.classLevel = 2;
else if (/group\s*3/i.test(rn)) app.raceInfo.classLevel = 3;
else if (/listed/i.test(rn)) app.raceInfo.classLevel = 4;
else if (/bm\s*(\d+)/i.test(rn)) { var fgBm = parseInt(rn.match(/bm\s*(\d+)/i)[1]); app.raceInfo.classLevel = fgBm >= 80 ? 4 : fgBm >= 65 ? 5 : fgBm >= 50 ? 6 : 7; }
else if (/open/i.test(rn)) app.raceInfo.classLevel = 5;
else if (/maiden/i.test(rn)) app.raceInfo.classLevel = 11;
else if (/class\s*(\d)/i.test(rn)) app.raceInfo.classLevel = 11 - parseInt(rn.match(/class\s*(\d)/i)[1]);
else if (/restricted/i.test(rn)) app.raceInfo.classLevel = 9;
else app.raceInfo.classLevel = 7;
app.horses = scoreHorses(horses);
renderRaceInfoPanel();
renderCards(null);
buildDropdown();
buildBetDropdown();
app.activeBets = [];
renderActiveBets();
document.getElementById('predictions').classList.remove('hidden');
document.getElementById('savePrompt').classList.remove('hidden');
document.getElementById('allModelPicksPanel').style.display = 'block';
document.getElementById('singleModelSave').style.display = 'none';
if(typeof app.renderAllModelPicks==='function') app.renderAllModelPicks();
document.getElementById('raceInfo').classList.remove('hidden');
document.getElementById('betSection').classList.remove('hidden'); if(typeof renderLiveBetPanel==='function') renderLiveBetPanel(); if(typeof renderConsensusAdvisor==='function') renderConsensusAdvisor();
document.getElementById('savePrompt').scrollIntoView({ behavior: 'smooth', block: 'start' });
var activeHorses = app.horses.filter(function(h) { return !h.scratched; }).length;
showSuccess(race.venue + ' R' + race.raceNumber + ': ' + activeHorses + ' runners analyzed from form guide!');
};
app.uploadFormGuide = function() {
var input = document.getElementById('formGuideTextInput').value.trim();
if (!input) {
showError('Please paste form guide JSON data');
return;
}
var data = null;
var parsedFromPlainText = false;
try {
data = JSON.parse(input);
if (!data.horses || !Array.isArray(data.horses)) {
throw new Error('Invalid format');
}
} catch (jsonErr) {
try {
var parsedHorses = parseHorses(input);
if (parsedHorses.length === 0) {
showError('Failed to parse form guide. Expected JSON format or valid plain text race card.');
return;
}
data = { horses: parsedHorses };
parsedFromPlainText = true;
} catch (plainTextErr) {
showError('Failed to parse form guide: ' + jsonErr.message);
return;
}
}
try {
app.formGuideData = {
loadedAt: new Date().toISOString(),
horses: data.horses.map(function(h) {
return {
num: h.num || h.silkNumber || '0',
silkNumber: h.silkNumber || h.num || 0,
name: h.name || '',
barrier: h.barrier || null,
jockey: h.jockey || '',
trainer: h.trainer || '',
weight: h.weight || 0,
form: h.form || '',
odds: h.odds || 0,
careerRuns: h.careerRuns || 0,
careerWins: h.careerWins || 0,
careerPlaces: h.careerPlaces || 0,
trackRuns: h.trackRuns || 0,
trackWins: h.trackWins || 0,
trackDistRuns: h.trackDistRuns || 0,
trackDistWins: h.trackDistWins || 0,
distanceRuns: h.distanceRuns || 0,
distanceWins: h.distanceWins || 0,
goodRuns: h.goodRuns || 0,
goodWins: h.goodWins || 0,
softRuns: h.softRuns || 0,
softWins: h.softWins || 0,
heavyRuns: h.heavyRuns || 0,
heavyWins: h.heavyWins || 0,
firmRuns: h.firmRuns || 0,
firmWins: h.firmWins || 0,
firstUpRuns: h.firstUpRuns || 0,
firstUpWins: h.firstUpWins || 0,
secondUpRuns: h.secondUpRuns || 0,
secondUpWins: h.secondUpWins || 0,
sbRating: h.sbRating || h.rating || 0,
scratched: h.scratched || false,
comments: h.comment || h.comments || '',
lastMargin: h.lastMargin || h.lastRaceMargin || 0,
lastMarginScore: h.lastMarginScore || 0,
daysAgo: h.daysAgo || h.daysSpell || 0,
lastFinish: h.lastFinish || '',
lastFinishPos: h.lastFinishPos || 0,
classLevel: h.classLevel || 0,
lastClass: h.lastClass || 0,
sectional600: h.sectional600 || 0,
last600Time: h.last600Time || h.sectional600 || 0,  // alias so Speed Figure path fires
positionsInRun: h.positionsInRun || [],
finishPositions: h.finishPositions || [],
lastSettling: h.lastSettling || 0,
jockeyWinRate: h.jockeyWinRate || 0,
trainerWinRate: h.trainerWinRate || 0,
gearChanges: h.gearChanges || [],
winPct: h.careerRuns > 0 ? Math.round((h.careerWins / h.careerRuns) * 100) : 0,
placePct: h.careerRuns > 0 ? Math.round(((h.careerWins + h.careerPlaces) / h.careerRuns) * 100) : 0,
score: 0,
prob: 0,
formScore: 0,
consistencyScore: 0,
freshnessScore: 0,
runningStyle: '',
settlingPosition: null,
tacticalScore: 0,
trackConditionScore: 0,
firstUpScore: 0,
distanceScore: 0,
gearScore: 0,
railScore: 0,
pacePressureScore: 0,
classChangeScore: 0,
formMomentumScore: 0,
finishStrengthScore: 0,
sectionalSpeedScore: 0,
weatherRailBiasScore: 0,
factorContributions: {}
};
})
};
localStorage.setItem('formGuideData', JSON.stringify(app.formGuideData));
var loadedCount = app.formGuideData.horses.filter(function(h) { return !h.scratched; }).length;
var totalCount = app.formGuideData.horses.length;
document.getElementById('formGuideDetails').textContent =
'Horses loaded: ' + loadedCount + '/' + totalCount + ' | Loaded at: ' +
new Date(app.formGuideData.loadedAt).toLocaleTimeString();
document.getElementById('formGuideStatus').classList.remove('hidden');
checkCombinedReadiness();
var parseMethod = parsedFromPlainText ? ' (parsed from plain text)' : '';
showSuccess('Form Guide loaded successfully! ' + loadedCount + ' horses ready.' + parseMethod);
} catch (err) {
showError('Failed to parse form guide JSON: ' + err.message);
}
};
function parseSpeedMapPlainText(text) {
var result = {
track: {
name: '',
circumference: 0,
straight: 0,
conditions: '',
railPosition: ''
},
weather: {
temp: 0,
condition: '',
wind: '',
humidity: 0
},
horses: []
};
var positionSection = text.match(/Speed Map[\s\S]*?Predicted settling positions[\s\S]*?Barriers([\s\S]*?)(?:Replay speed map|Weather|$)/i);
if (positionSection) {
var positionText = positionSection[1];
var positionPattern = /Silk\s+(\d+)\.\s+([^\n]+?)\s+(\d+)/gi;
var posMatch;
while ((posMatch = positionPattern.exec(positionText)) !== null) {
var silkNum = parseInt(posMatch[1]);
var horseName = posMatch[2].trim();
var settlingPos = parseInt(posMatch[3]);
result.horses.push({
silkNumber: silkNum,
name: horseName,
barrier: silkNum,
settlingPosition: settlingPos
});
}
}
var trackMatch = text.match(/Track:\s*([^,\n]+)/i);
if (trackMatch) {
result.track.name = trackMatch[1].trim();
}
var conditionsMatch = text.match(/Conditions?:\s*(Good|Soft|Heavy|Firm)\s*(\d)?/i);
if (conditionsMatch) {
result.track.conditions = conditionsMatch[1] + (conditionsMatch[2] ? ' ' + conditionsMatch[2] : '');
}
var railMatch = text.match(/Rail Position:\s*([^\n]+)/i);
if (railMatch) {
result.track.railPosition = railMatch[1].trim();
}
var straightMatch = text.match(/Straight:\s*(\d+)\s*metres?/i);
if (straightMatch) {
result.track.straight = parseInt(straightMatch[1]);
}
var circumferenceMatch = text.match(/Circumference:\s*(\d+)/i);
if (circumferenceMatch) {
result.track.circumference = parseInt(circumferenceMatch[1]);
}
var tempMatch = text.match(/(\d+)deg\s+([^\n]+)/);
if (tempMatch) {
result.weather.temp = parseInt(tempMatch[1]);
result.weather.condition = tempMatch[2].trim();
}
var windMatch = text.match(/Wind:\s*([^\n]+)/i);
if (windMatch) {
result.weather.wind = windMatch[1].trim();
}
var humidityMatch = text.match(/Humidity:\s*(\d+)%/i);
if (humidityMatch) {
result.weather.humidity = parseInt(humidityMatch[1]);
}
return result;
}

// ── FormSectionals parser ──
// Handles paste from the FormSectionals / Speed Sectionals website.
// Extracts each horse's recent sectional data and computes:
//   earlySpeed, midSpeed, lateSpeed, avgSpeed, lastFinishPos,
//   barrier, silkNumber, settlingPosition
function parseFormSectionals(text) {
  // Normalize Unicode whitespace (non-breaking space etc.) that web copy-paste introduces
  text = text.replace(/[\u00a0\u202f\u2009\u2007\u2008\u200b\ufeff]/g, ' ');
  var result = {
    track: { name: '', circumference: 0, straight: 0, conditions: '', railPosition: '' },
    weather: { temp: 0, condition: '', wind: '', humidity: 0 },
    horses: [],
    isFormSectionals: true,
    detectedSortView: null  // set after detection below
  };

  // Must contain EARLY / MID / LATE / AVG markers
  if (!/EARLY[\s\S]*?MID[\s\S]*?LATE[\s\S]*?AVG/i.test(text)) return null;

  // ── INLINE FORMAT DETECTION ───────────────────────────────────────────
  // FormSectionals sometimes pastes as one long unbroken string with no
  // newlines, e.g:  "Results3Nic's Choice (12)58.3EARLY61.0MID61.1LATE59.35AVG KM/H..."
  // Detect: "Results" followed immediately by a digit then a horse name

  // Detect sort view first (applies to both inline and multiline paths)
  var sortView = 'average';
  if (/Sort By\s*Early Speed/i.test(text))    sortView = 'early';
  if (/Sort By\s*Mid Late Speed/i.test(text)) sortView = 'midlate';
  if (/Sort By\s*Race Order/i.test(text))     sortView = 'race';
  if (/Sort By\s*Barrier Order/i.test(text))  sortView = 'barrier';
  // Store detected view for validation by caller
  if (sortView !== 'average') result.detectedSortView = sortView;

  var isInline = /Results\d+[A-Za-z]/.test(text) ||
                 (/\d+[A-Za-z][A-Za-z ]+\(\d+\)[\d.]+EARLY/.test(text) &&
                  text.split(/\r?\n/).filter(function(l){return l.trim();}).length <= 6);

  if (isInline) {
    // Pull track from the filter UI text (e.g. "Pakenham" appears as an option)
    var knownTracks = ['Pakenham','Flemington','Randwick','Caulfield','Moonee Valley',
      'Eagle Farm','Doomben','Rosehill','Morphettville','Sandown','Ballarat',
      'Bendigo','Geelong','Werribee','Hawkesbury','Gosford','Newcastle',
      'Kembla','Warwick Farm','Moe','Sale','Seymour','Echuca','Swan Hill',
      'Stawell','Hamilton','Casterton','Ararat','Horsham','Wangaratta',
      'Wodonga','Albury','Wagga','Goulburn','Canberra','Darwin','Alice Springs',
      'Gold Coast','Ipswich','Toowoomba','Sunshine Coast','Rockhampton',
      'Mackay','Cairns','Townsville','Ascot','Belmont','Bunbury'];
    for (var ti = 0; ti < knownTracks.length; ti++) {
      if (text.indexOf(knownTracks[ti]) !== -1) {
        result.track.name = knownTracks[ti]; break;
      }
    }

    // Extract results block (everything after last "Results")
    var resIdx = text.lastIndexOf('Results');
    var resStr = resIdx >= 0 ? text.substring(resIdx + 7) : text;

    // Match every horse: RANK + NAME (BARRIER) + EARLY_VAL + EARLY + MID_VAL + MID + LATE_VAL + LATE + AVG_VAL + AVG KM/H
    var inlineRe = /(\d+)([A-Za-z][A-Za-z0-9 '\-]+?)\s*\((\d+)\)\s*([\d.]+)EARLY([\d.]+)MID([\d.]+)LATE([\d.]+)AVG KM\/H/g;
    var m;
    while ((m = inlineRe.exec(resStr)) !== null) {
      var b = {
        sortRank:  parseInt(m[1]),
        name:      m[2].trim(),
        barrier:   parseInt(m[3]),
        earlySpeed: parseFloat(m[4]),
        midSpeed:   parseFloat(m[5]),
        lateSpeed:  parseFloat(m[6]),
        avgSpeed:   parseFloat(m[7])
      };
      // Settling position from early speed
      var sp = 5;
      if      (b.earlySpeed >= 60) sp = 1;
      else if (b.earlySpeed >= 57) sp = 2;
      else if (b.earlySpeed >= 55) sp = 3;
      else if (b.earlySpeed >= 52) sp = 4;
      else if (b.earlySpeed >= 49) sp = 5;
      else                          sp = 6;

      // Dedup across multiple pasted views
      var existing = null;
      for (var di = 0; di < result.horses.length; di++) {
        if (result.horses[di].barrier === b.barrier ||
            result.horses[di].name.toLowerCase() === b.name.toLowerCase()) {
          existing = result.horses[di]; break;
        }
      }
      if (existing) {
        if (b.earlySpeed > 0) existing.earlySpeed = b.earlySpeed;
        if (b.midSpeed   > 0) existing.midSpeed   = b.midSpeed;
        if (b.lateSpeed  > 0) existing.lateSpeed  = b.lateSpeed;
        if (b.avgSpeed   > 0) existing.avgSpeed   = b.avgSpeed;
        existing.settlingPosition = sp;
        // Store sort rank for each view
        if (sortView === 'early')   existing.earlyRank   = b.sortRank;
        if (sortView === 'midlate') existing.midlateRank = b.sortRank;
        if (sortView === 'average') existing.avgRank     = b.sortRank;
        if (sortView === 'race')    existing.raceNum     = b.sortRank;
        if (sortView === 'barrier') existing.barrierRank = b.sortRank;
      } else {
        // For Race Order, silkNumber = saddle cloth (sortRank), not barrier
        var inlineSilk = (sortView === 'race' && b.sortRank > 0) ? b.sortRank : b.barrier;
        var horse = {
          silkNumber:       inlineSilk,
          num:              String(inlineSilk),
          name:             b.name,
          barrier:          b.barrier,
          settlingPosition: sp,
          earlySpeed:       b.earlySpeed,
          midSpeed:         b.midSpeed,
          lateSpeed:        b.lateSpeed,
          avgSpeed:         b.avgSpeed,
          sectional600kmh:  0,
          lastFinishPos:    0,
          lastFieldSize:    0,
          recentRaces:      0
        };
        if (sortView === 'early')   horse.earlyRank   = b.sortRank;
        if (sortView === 'midlate') horse.midlateRank = b.sortRank;
        if (sortView === 'average') horse.avgRank     = b.sortRank;
        if (sortView === 'race')    horse.raceNum     = b.sortRank;
        if (sortView === 'barrier') horse.barrierRank = b.sortRank;
        result.horses.push(horse);
      }
    }
    // ── Relative settling position (inline path) ─────────────────────────────
    if (result.horses.length > 1) {
      var sorted2 = result.horses.slice().sort(function(a,b) {
        return (b.earlySpeed||0) - (a.earlySpeed||0);
      });
      sorted2.forEach(function(h, idx) {
        var n2 = sorted2.length;
        var pos2;
        if      (idx < Math.ceil(n2 * 0.15)) pos2 = 1;
        else if (idx < Math.ceil(n2 * 0.35)) pos2 = 2;
        else if (idx < Math.ceil(n2 * 0.55)) pos2 = 3;
        else if (idx < Math.ceil(n2 * 0.70)) pos2 = 4;
        else if (idx < Math.ceil(n2 * 0.85)) pos2 = 5;
        else                                  pos2 = 6;
        h.settlingPosition = pos2;
      });
    }
    return result.horses.length > 0 ? result : null;
  }
  // ── END INLINE FORMAT ─────────────────────────────────────────────────

  // Keep ALL lines including blanks to preserve look-back indexing
  var lines = text.split(/\r?\n/).map(function(l) { return l.trim(); });

  var horseBlocks = [];
  var i = 0;

  while (i < lines.length) {
    var line = lines[i];

    // Horse name line: "Horse Name (barrier)"
    var nameMatch = line.match(/^([A-Za-z][A-Za-z '\-]+?)\s+\((\d+)\)\s*$/);
    if (nameMatch) {
      // The rank number appears on the line immediately before the horse name
      var sortRankFromPrev = 0;
      if (i > 0 && /^\d+$/.test(lines[i-1].trim())) {
        sortRankFromPrev = parseInt(lines[i-1].trim());
      }
      var block = {
        name: nameMatch[1].trim(),
        barrier: parseInt(nameMatch[2]),
        sortRank: sortRankFromPrev,
        earlySpeed: 0, midSpeed: 0, lateSpeed: 0, avgSpeed: 0,
        lastFinishPos: 0, lastFieldSize: 0,
        races: [],
        rawSectionals: {}
      };
      var blockStart = i; // only look back to here for speed values

      i++;
      while (i < lines.length) {
        var l = lines[i].trim();

        // Next horse starts — stop
        if (l.match(/^[A-Za-z][A-Za-z '\-]+?\s+\(\d+\)\s*$/)) break;

        // Speed labels — value is on the line BEFORE the label
        if (l === 'EARLY') {
          for (var b = i-1; b >= Math.max(blockStart, i-8); b--) {
            var bv = lines[b].trim();
            if (/^[\d.]+$/.test(bv)) { block.earlySpeed = parseFloat(bv); break; }
          }
          i++; continue;
        }
        if (l === 'MID') {
          for (var b2 = i-1; b2 >= Math.max(blockStart, i-8); b2--) {
            var bv2 = lines[b2].trim();
            if (/^[\d.]+$/.test(bv2)) { block.midSpeed = parseFloat(bv2); break; }
          }
          i++; continue;
        }
        if (l === 'LATE') {
          for (var b3 = i-1; b3 >= Math.max(blockStart, i-8); b3--) {
            var bv3 = lines[b3].trim();
            if (/^[\d.]+$/.test(bv3)) { block.lateSpeed = parseFloat(bv3); break; }
          }
          i++; continue;
        }
        if (l === 'AVG KM/H' || l === 'AVG KM / H' || l === 'AVG') {
          for (var b4 = i-1; b4 >= Math.max(blockStart, i-8); b4--) {
            var bv4 = lines[b4].trim();
            if (/^[\d.]+$/.test(bv4)) { block.avgSpeed = parseFloat(bv4); break; }
          }
          i++; continue;
        }

        // "X of Y" — most recent finishing position
        // Appears as "3 of 14" on one line OR split: "3" then "of 14"
        var posMatch = l.match(/^(\d+)\s+of\s+(\d+)$/);
        if (posMatch) {
          if (block.lastFinishPos === 0) {
            block.lastFinishPos = parseInt(posMatch[1]);
            block.lastFieldSize = parseInt(posMatch[2]);
          }
          i++; continue;
        }
        // Split across two lines: "3" / "of 14"
        if (/^\d+$/.test(l) && i+1 < lines.length) {
          var ofLine = lines[i+1].trim();
          var ofMatch = ofLine.match(/^of\s+(\d+)$/);
          if (ofMatch && block.lastFinishPos === 0) {
            block.lastFinishPos = parseInt(l);
            block.lastFieldSize = parseInt(ofMatch[1]);
            i += 2; continue;
          }
        }

        // Track + condition: "BunburyGood 4" or "AlbanySoft 5"
        // Must start with uppercase, venue portion must be 2+ chars, no stray matches
        var trkMatch = l.match(/^([A-Z][A-Za-z '\-]{1,40})(Good|Soft|Heavy|Firm|Synthetic|Wet)\s*(\d+)?$/);
        if (trkMatch && !l.match(/^\d{2}\/\d{2}\/\d{4}/) && trkMatch[1].trim().length >= 2) {
          var trkName = trkMatch[1].trim();
          var trkCond = trkMatch[2].charAt(0).toUpperCase() + trkMatch[2].slice(1).toLowerCase();
          var trkGrade = trkMatch[3] || '';
          // Store as pending venue for the next date line
          block._pendingVenue = trkName;
          block._pendingCond  = trkCond + (trkGrade ? ' ' + trkGrade : '');
          // Also set track-level name if not set
          if (trkName.length > 1 && result.track.name === '') {
            result.track.name = trkName;
            result.track.conditions = trkCond + (trkGrade ? ' ' + trkGrade : '');
          }
          i++; continue;
        }

        // Race date line: "DD/MM/YYYY, 1100m, 65.32s"
        var dateMatch = l.match(/^(\d{2}\/\d{2}\/\d{4}),\s*(\d+)m,\s*([\d.]+)s$/);
        if (dateMatch) {
          block.races.push({
            date: dateMatch[1],
            distance: parseInt(dateMatch[2]),
            totalTime: parseFloat(dateMatch[3]),
            venue: block._pendingVenue || '',
            condition: block._pendingCond || ''
          });
          block._pendingVenue = ''; block._pendingCond = '';
          i++; continue;
        }

        // Sectional distance markers: 1000m, 800m, 600m, 400m, 200m, Fnsh
        var sectMarker = l.match(/^(1000m|800m|600m|400m|200m|Fnsh)$/i);
        if (sectMarker) {
          var dist = sectMarker[1].toLowerCase();
          // Next two non-blank non-dash lines are split time and km/h
          var sv1 = '', sv2 = '';
          var nx = i + 1;
          while (nx < lines.length && lines[nx].trim() === '') nx++;
          sv1 = (nx < lines.length) ? lines[nx].trim() : '';
          var nx2 = nx + 1;
          while (nx2 < lines.length && lines[nx2].trim() === '') nx2++;
          sv2 = (nx2 < lines.length) ? lines[nx2].trim() : '';
          if (sv1 !== '-' && sv2 !== '-' && /^[\d.]+$/.test(sv1) && /^[\d.]+$/.test(sv2)) {
            if (!block.rawSectionals[dist]) {
              block.rawSectionals[dist] = { split: parseFloat(sv1), kmh: parseFloat(sv2) };
            }
          }
          i++; continue;
        }

        // Skip "Split" / "km/h" header rows
        if (l === 'Split' || l === 'km/h') { i++; continue; }

        i++;
      }

      horseBlocks.push(block);
      continue;
    }
    i++;
  }

  // ── Detect filter context from pasted text ──────────────────────────────────
  // FormSectionals shows "Last 5 Runs / On Same Track / All Tracks" + condition filter
  var filterContext = 'all_tracks'; // default
  if (/Last 5 Runs/i.test(text) && /All Tracks/i.test(text)) filterContext = 'all_tracks';
  if (/On\s+Same\s+Track/i.test(text) || /Same\s+Track/i.test(text)) filterContext = 'same_track';
  // Detect if a specific condition filter was set - look for "Good", "Soft", etc. in filter UI
  var condFilter = '';
  var condFilterMatch = text.match(/(?:Good|Soft|Heavy|Firm)\s*(?:\d)?(?=\s|$)/);
  if (condFilterMatch) condFilter = condFilterMatch[0].trim();
  // Build a list of all unique venues from race data
  var allVenues = {}, allConds = {};
  horseBlocks.forEach(function(b) {
    b.races.forEach(function(r) {
      if (r.venue) allVenues[r.venue] = true;
      if (r.condition) {
        // Store only the base condition word (Good/Soft/Heavy/Firm), not grade
        var condWord = r.condition.split(' ')[0];
        if (/^(Good|Soft|Heavy|Firm|Synthetic|Wet)$/i.test(condWord)) {
          allConds[condWord.charAt(0).toUpperCase() + condWord.slice(1).toLowerCase()] = true;
        }
      }
    });
  });
  var venueCount = Object.keys(allVenues).length;
  var condCount  = Object.keys(allConds).length;
  // If only one venue appears across all runs — same-track filter is active
  if (venueCount === 1) filterContext = 'same_track';
  // If only one condition type — condition filter is active  
  var dataIsSameCondition = condCount <= 1;
  result.filterContext    = filterContext;
  result.dataIsSameCondition = dataIsSameCondition;
  result.uniqueVenues     = Object.keys(allVenues);
  result.uniqueConditions = Object.keys(allConds);

  // ── Relative settling position ────────────────────────────────────────────
  // Sort blocks by earlySpeed desc to get field-relative positions
  // Only use horses that have speed data
  var speedBlocks = horseBlocks.filter(function(b) {
    return b.earlySpeed > 0 || b.midSpeed > 0 || b.lateSpeed > 0 || b.avgSpeed > 0;
  });
  speedBlocks.sort(function(a, b) { return (b.earlySpeed || 0) - (a.earlySpeed || 0); });
  var relativePos = {};
  speedBlocks.forEach(function(b, idx) {
    // Position 1 = fastest early, position N = slowest early
    // Scale to field size: divide into thirds as leader/pace/midfield/back
    var fieldSize = speedBlocks.length;
    var pos;
    if      (idx < Math.ceil(fieldSize * 0.15)) pos = 1;       // top 15%: leader
    else if (idx < Math.ceil(fieldSize * 0.35)) pos = 2;       // 15-35%: pace
    else if (idx < Math.ceil(fieldSize * 0.55)) pos = 3;       // 35-55%: on pace
    else if (idx < Math.ceil(fieldSize * 0.70)) pos = 4;       // 55-70%: midfield
    else if (idx < Math.ceil(fieldSize * 0.85)) pos = 5;       // 70-85%: off pace
    else                                         pos = 6;       // 85-100%: backmarker
    relativePos[b.name.toLowerCase()] = pos;
  });

  // Convert blocks to speedMapData horse format
  horseBlocks.forEach(function(b) {
    if (!b.name) return;
    // Skip horses with no speed data at all
    if (b.earlySpeed === 0 && b.midSpeed === 0 && b.lateSpeed === 0 && b.avgSpeed === 0) return;

    // Use field-relative settling position (falls back to absolute bracket if not in speedBlocks)
    var settlingPos = relativePos[b.name.toLowerCase()] || 5;
    if (!relativePos[b.name.toLowerCase()] && b.earlySpeed > 0) {
      // Fallback: absolute bracket for horses not in speedBlocks (shouldn't happen)
      if      (b.earlySpeed >= 60) settlingPos = 1;
      else if (b.earlySpeed >= 57) settlingPos = 2;
      else if (b.earlySpeed >= 55) settlingPos = 3;
      else if (b.earlySpeed >= 52) settlingPos = 4;
      else if (b.earlySpeed >= 49) settlingPos = 5;
      else                         settlingPos = 6;
    }

    // Most recent 600m split as sectional600
    var sect600 = 0;
    var sect600kmh = 0;
    if (b.rawSectionals['600m'] && b.rawSectionals['600m'].kmh > 0) {
      sect600kmh = b.rawSectionals['600m'].kmh; // km/h speed for FormSectionals path
    }

    // Dedup by barrier — if same horse appears in multiple sort views, merge best data
    var existing = null;
    for (var di = 0; di < result.horses.length; di++) {
      if (result.horses[di].barrier === b.barrier ||
          result.horses[di].name.toLowerCase() === b.name.toLowerCase()) {
        existing = result.horses[di]; break;
      }
    }
    if (existing) {
      // Merge: take best (non-zero) values from each sort view
      if (b.earlySpeed > 0)  existing.earlySpeed  = b.earlySpeed;
      if (b.midSpeed > 0)    existing.midSpeed    = b.midSpeed;
      if (b.lateSpeed > 0)   existing.lateSpeed   = b.lateSpeed;
      if (b.avgSpeed > 0)    existing.avgSpeed    = b.avgSpeed;
      if (sect600kmh > 0)    existing.sectional600kmh = sect600kmh;
      if (b.lastFinishPos > 0) existing.lastFinishPos = b.lastFinishPos;
      if (b.lastFieldSize > 0) existing.lastFieldSize = b.lastFieldSize;
      if (settlingPos > 0)   existing.settlingPosition = settlingPos;
      if (sortView === 'race'    && b.sortRank > 0) existing.raceNum     = b.sortRank;
      if (sortView === 'barrier' && b.sortRank > 0) existing.barrierRank = b.sortRank;
      if (sortView === 'average' && b.sortRank > 0) existing.avgRank     = b.sortRank;
      if (sortView === 'early'   && b.sortRank > 0) existing.earlyRank   = b.sortRank;
      if (sortView === 'midlate' && b.sortRank > 0) existing.midlateRank = b.sortRank;
    } else {
      // For Race Order view, use raceNum as silkNumber so merge with form guide works
      var useSilk = (sortView === 'race' && b.sortRank > 0) ? b.sortRank : b.barrier;
      var newH = {
        silkNumber:      useSilk,
        num:             String(useSilk),
        name:            b.name,
        barrier:         b.barrier,
        settlingPosition: settlingPos,
        earlySpeed:      b.earlySpeed,
        midSpeed:        b.midSpeed,
        lateSpeed:       b.lateSpeed,
        avgSpeed:        b.avgSpeed,
        sectional600kmh: sect600kmh,
        lastFinishPos:   b.lastFinishPos || 0,
        lastFieldSize:   b.lastFieldSize || 0,
        recentRaces:     b.races.length
      };
      if (sortView === 'race'    && b.sortRank > 0) newH.raceNum     = b.sortRank;
      if (sortView === 'barrier' && b.sortRank > 0) newH.barrierRank = b.sortRank;
      if (sortView === 'average' && b.sortRank > 0) newH.avgRank     = b.sortRank;
      if (sortView === 'early'   && b.sortRank > 0) newH.earlyRank   = b.sortRank;
      if (sortView === 'midlate' && b.sortRank > 0) newH.midlateRank = b.sortRank;
      result.horses.push(newH);
    }
  });

  // Fallback track name
  if (result.track.name === '') {
    var trkFallback = text.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)(GOOD|SOFT|HEAVY|FIRM)/);
    if (trkFallback) result.track.name = trkFallback[1].trim();
  }

  return result.horses.length > 0 ? result : null;
}
app.uploadSpeedMap = function() {
var input = document.getElementById('speedMapTextInput').value.trim();
  // Normalize non-breaking spaces from web copy-paste
  input = input.replace(/[\u00a0\u202f\u2009\u2007\u2008\u200b\ufeff]/g, ' ');
if (!input) {
showError('Please paste speed map JSON data');
return;
}
var data = null;
var parsedFromPlainText = false;
try {
data = JSON.parse(input);
if (!data.track || !data.horses || !Array.isArray(data.horses)) {
throw new Error('Invalid format');
}
} catch (jsonErr) {
try {
// Try FormSectionals format first (EARLY/MID/LATE/AVG KM/H)
var fsData = parseFormSectionals(input);
if (fsData && fsData.horses && fsData.horses.length > 0) {
data = fsData;
parsedFromPlainText = true;
} else {
data = parseSpeedMapPlainText(input);
if (!data || !data.horses || data.horses.length === 0) {
showError('Failed to parse speed map. Try pasting from FormSectionals (EARLY/MID/LATE format) or standard JSON.');
return;
}
parsedFromPlainText = true;
}
} catch (plainTextErr) {
showError('Failed to parse speed map: ' + jsonErr.message);
return;
}
}
try {
var newHorses = data.horses.map(function(h) {
return {
silkNumber: h.silkNumber || h.num || 0,
barrier: h.barrier || 0,
settlingPosition: h.settlingPosition || 0,
name: h.name || '',
num: h.num || String(h.silkNumber || h.barrier || 0),
earlySpeed: h.earlySpeed || 0,
midSpeed: h.midSpeed || 0,
lateSpeed: h.lateSpeed || 0,
avgSpeed: h.avgSpeed || 0,
lastFinishPos: h.lastFinishPos || 0,
lastFieldSize: h.lastFieldSize || 0
};
});
// Merge with existing speed map horses if already loaded (handles 3-view paste workflow)
var mergedHorseList = [];
if (app.speedMapData && app.speedMapData.horses && data.isFormSectionals) {
mergedHorseList = app.speedMapData.horses.slice();
newHorses.forEach(function(nh) {
var found = null;
for (var mi = 0; mi < mergedHorseList.length; mi++) {
if (mergedHorseList[mi].barrier === nh.barrier ||
    mergedHorseList[mi].name.toLowerCase() === nh.name.toLowerCase()) {
  found = mergedHorseList[mi]; break;
}
}
if (found) {
if (nh.earlySpeed > 0)  found.earlySpeed  = nh.earlySpeed;
if (nh.midSpeed > 0)    found.midSpeed    = nh.midSpeed;
if (nh.lateSpeed > 0)   found.lateSpeed   = nh.lateSpeed;
if (nh.avgSpeed > 0)    found.avgSpeed    = nh.avgSpeed;
if (nh.lastFinishPos > 0) found.lastFinishPos = nh.lastFinishPos;
if (nh.lastFieldSize > 0) found.lastFieldSize = nh.lastFieldSize;
if (nh.settlingPosition > 0) found.settlingPosition = nh.settlingPosition;
} else {
mergedHorseList.push(nh);
}
});
} else {
mergedHorseList = newHorses;
}
app.speedMapData = {
loadedAt: new Date().toISOString(),
filterContext: data.filterContext || 'all_tracks',
dataIsSameCondition: data.dataIsSameCondition || false,
uniqueVenues: data.uniqueVenues || [],
uniqueConditions: data.uniqueConditions || [],
track: {
name: data.track.name || (app.speedMapData && app.speedMapData.track.name) || '',
circumference: data.track.circumference || 0,
straight: data.track.straight || 0,
conditions: data.track.conditions || (app.speedMapData && app.speedMapData.track.conditions) || '',
railPosition: data.track.railPosition || ''
},
weather: data.weather || (app.speedMapData && app.speedMapData.weather) || { temp:0, condition:'', wind:'', humidity:0 },
horses: mergedHorseList
};
localStorage.setItem('speedMapData', JSON.stringify(app.speedMapData));
var isFS = data.isFormSectionals;
var fsHorseCount = app.speedMapData.horses.length;
var fsWithSpeed = app.speedMapData.horses.filter(function(h){ return h.avgSpeed > 0; }).length;
var filterNote = '';
if (app.speedMapData.filterContext === 'same_track') filterNote = ' · Same track filter ✓';
else if (app.speedMapData.dataIsSameCondition) filterNote = ' · Same condition ✓';
else filterNote = ' · All tracks (mixed conditions)';
if (app.speedMapData.uniqueConditions && app.speedMapData.uniqueConditions.length > 0) {
  filterNote += ' [' + app.speedMapData.uniqueConditions.join('/') + ']';
}
document.getElementById('speedMapDetails').textContent = isFS
? 'FormSectionals: ' + fsHorseCount + ' horses loaded (' + fsWithSpeed + ' with speed data)' +
  (app.speedMapData.track.name ? ' | Track: ' + app.speedMapData.track.name : '') + filterNote
: 'Track: ' + app.speedMapData.track.name + ' | ' +
  'Conditions: ' + app.speedMapData.track.conditions + ' | ' +
  'Rail: ' + app.speedMapData.track.railPosition + ' | ' +
  'Weather: ' + app.speedMapData.weather.condition + ' ' + app.speedMapData.weather.temp + 'degC';
// Race identity pre-check
var mismatchWarning = '';
if (app.formGuideData && app.formGuideData.horses && app.formGuideData.horses.length > 0) {
  var fgH = app.formGuideData.horses, smH = app.speedMapData.horses;
  var nameHits = 0;
  fgH.forEach(function(f) {
    var fn = f.name.toLowerCase();
    var fn1 = fn.split(' ')[0];
    smH.forEach(function(s) {
      var sn = s.name.toLowerCase();
      var sn1 = sn.split(' ')[0];
      // Match on full name, first word, or 4+ char prefix
      if (fn === sn || fn1 === sn1 ||
          (fn1.length >= 4 && (sn.indexOf(fn1) === 0 || fn.indexOf(sn1) === 0))) {
        nameHits++;
      }
    });
  });
  // Deduplicate: cap at fgH.length (multiple sm horses can match one fg horse)
  nameHits = Math.min(nameHits, fgH.length);
  var matchPct = fgH.length > 0 ? Math.round((nameHits / fgH.length) * 100) : 100;
  var statusEl = document.getElementById('speedMapStatus');
  var titleEl  = statusEl ? statusEl.querySelector('p') : null;
  if (matchPct < 20) {  // Reduced threshold — only flag clear mismatches
    mismatchWarning = ' ⚠️ Only ' + matchPct + '% name overlap with loaded form guide — this speed map appears to be from a DIFFERENT RACE. Barrier-only matching will be blocked at analysis.';
    app.speedMapData._mismatch = true;
    if (statusEl) { statusEl.style.background = 'rgba(239,68,68,0.1)'; statusEl.style.border = '1px solid #ef4444'; }
    if (titleEl)  { titleEl.style.color = '#ef4444'; titleEl.textContent = '⚠️ Speed Map — Race Mismatch'; }
  } else {
    if (app.speedMapData) app.speedMapData._mismatch = false;
    if (titleEl)  { titleEl.textContent = '✓ Speed Data Loaded (' + matchPct + '% horses matched)'; }
  }
}
document.getElementById('speedMapStatus').classList.remove('hidden');
checkCombinedReadiness();
var parseMethod = isFS ? ' (FormSectionals — ' + fsWithSpeed + ' horses with speed data)' : (parsedFromPlainText ? ' (parsed from plain text)' : '');
showSuccess('Speed Map loaded! ' + (isFS ? fsHorseCount + ' horses' : 'Track: ' + app.speedMapData.track.name) + parseMethod);
} catch (err) {
showError('Failed to parse speed map JSON: ' + err.message);
}
};
app.clearFormGuide = function() {
document.getElementById('formGuideTextInput').value = '';
app.formGuideData = null;
localStorage.removeItem('formGuideData');
document.getElementById('formGuideStatus').classList.add('hidden');
checkCombinedReadiness();
showSuccess('Form Guide cleared');
};
app.clearSpeedMap = function() {
document.getElementById('speedMapTextInput').value = '';
app.speedMapData = null;
localStorage.removeItem('speedMapData');
document.getElementById('speedMapStatus').classList.add('hidden');
checkCombinedReadiness();
showSuccess('Speed Data cleared');
};

// ── Race Order & Barrier Order separate loaders ──────────────────────────

function _parseFSView(inputId, expectedView, friendlyName) {
  var raw = document.getElementById(inputId).value.trim();
  if (!raw) { showError('Please paste ' + friendlyName + ' data first'); return null; }
  raw = raw.replace(/[\u00a0\u202f\u2009\u2007\u2008\u200b\ufeff]/g, ' ');
  var data = parseFormSectionals(raw);
  if (!data || !data.horses || data.horses.length === 0) {
    showError('Could not parse ' + friendlyName + ' — make sure you\'re pasting the correct sort view from FormSectionals');
    return null;
  }
  // Validate sort view if we can detect it
  var detectedView = data.detectedSortView || null;
  if (detectedView && expectedView && detectedView !== expectedView) {
    // Warn but don't block — user may have pasted a view that still has valid data
    // Non-blocking warning: use addLog so it's recorded but doesn't block the user
    if (typeof addLog === 'function') addLog('info', '⚠ Sort view mismatch for ' + friendlyName +
      ' — detected "' + detectedView + '" view. Data loaded anyway.', 'Check you pasted the correct FormSectionals tab.');
    console.warn('Sort view mismatch:', expectedView, 'vs detected:', detectedView);
  }
  return data;
}

function _mergeIntoSpeedMap(data, rankField) {
  // Ensure speedMapData exists
  if (!app.speedMapData) {
    app.speedMapData = {
      loadedAt: new Date().toISOString(),
      track: { name:'', circumference:0, straight:0, conditions:'', railPosition:'' },
      weather: { temp:0, condition:'', wind:'', humidity:0 },
      horses: []
    };
  }
  data.horses.forEach(function(nh) {
    var found = null;
    for (var i = 0; i < app.speedMapData.horses.length; i++) {
      var ex = app.speedMapData.horses[i];
      if (ex.barrier === nh.barrier ||
          ex.name.toLowerCase() === nh.name.toLowerCase()) {
        found = ex; break;
      }
    }
    if (found) {
      // Merge rank field + any speed data present
      if (nh[rankField])           found[rankField]        = nh[rankField];
      if (nh.earlySpeed > 0)       found.earlySpeed        = nh.earlySpeed;
      if (nh.midSpeed > 0)         found.midSpeed          = nh.midSpeed;
      if (nh.lateSpeed > 0)        found.lateSpeed         = nh.lateSpeed;
      if (nh.avgSpeed > 0)         found.avgSpeed          = nh.avgSpeed;
      if (nh.settlingPosition > 0) found.settlingPosition  = nh.settlingPosition;
      if (nh.silkNumber > 0 && rankField === 'raceNum') found.silkNumber = nh.silkNumber;
    } else {
      var newH = {
        silkNumber:      nh.silkNumber || nh.barrier,
        num:             String(nh.silkNumber || nh.barrier),
        name:            nh.name,
        barrier:         nh.barrier,
        settlingPosition: nh.settlingPosition || 0,
        earlySpeed:      nh.earlySpeed || 0,
        midSpeed:        nh.midSpeed || 0,
        lateSpeed:       nh.lateSpeed || 0,
        avgSpeed:        nh.avgSpeed || 0,
        sectional600kmh: 0,
        lastFinishPos:   0,
        lastFieldSize:   0,
        recentRaces:     0
      };
      newH[rankField] = nh[rankField];
      app.speedMapData.horses.push(newH);
    }
  });
  localStorage.setItem('speedMapData', JSON.stringify(app.speedMapData));
}

app.uploadRaceOrder = function() {
  var data = _parseFSView('raceOrderTextInput', 'race', 'Race Order');
  if (!data) return;
  _mergeIntoSpeedMap(data, 'raceNum');
  var n = data.horses.length;
  document.getElementById('raceOrderDetails').textContent =
    n + ' horses · race numbers stored for matching' +
    (data.track.name ? ' · ' + data.track.name : '');
  document.getElementById('raceOrderStatus').classList.remove('hidden');
  checkCombinedReadiness();
  showSuccess('Race Order loaded — ' + n + ' horses merged into speed data');
};

app.clearRaceOrder = function() {
  document.getElementById('raceOrderTextInput').value = '';
  document.getElementById('raceOrderStatus').classList.add('hidden');
  // Strip raceNum from all speedMapData horses
  if (app.speedMapData && app.speedMapData.horses) {
    app.speedMapData.horses.forEach(function(h) { delete h.raceNum; });
    localStorage.setItem('speedMapData', JSON.stringify(app.speedMapData));
  }
  showSuccess('Race Order cleared');
};

app.uploadBarrierOrder = function() {
  var data = _parseFSView('barrierOrderTextInput', 'barrier', 'Barrier Order');
  if (!data) return;
  _mergeIntoSpeedMap(data, 'barrierRank');
  var n = data.horses.length;
  // Build a readable barrier summary: "1→inside ... 8→outside"
  var sorted = data.horses.slice().sort(function(a,b){ return (a.barrierRank||99)-(b.barrierRank||99); });
  var summary = sorted.slice(0,3).map(function(h){ return 'B'+h.barrier+' #'+(h.barrierRank||'?'); }).join(', ');
  // Show barrier → speed mapping to confirm correct draw was loaded
  var barrierSpeedSummary = sorted.slice(0,4).map(function(h){
    return 'B' + h.barrier + (h.earlySpeed > 0 ? ' ' + h.earlySpeed.toFixed(1) : '');
  }).join(' · ');
  document.getElementById('barrierOrderDetails').textContent =
    n + ' horses · barriers confirmed · Early: ' + barrierSpeedSummary + (n > 4 ? '...' : '') +
    (data.track.name ? ' · ' + data.track.name : '');
  document.getElementById('barrierOrderStatus').classList.remove('hidden');
  checkCombinedReadiness();
  showSuccess('Barrier Order loaded — ' + n + ' horses · draw positions stored');
};

app.clearBarrierOrder = function() {
  document.getElementById('barrierOrderTextInput').value = '';
  document.getElementById('barrierOrderStatus').classList.add('hidden');
  if (app.speedMapData && app.speedMapData.horses) {
    app.speedMapData.horses.forEach(function(h) { delete h.barrierRank; });
    localStorage.setItem('speedMapData', JSON.stringify(app.speedMapData));
  }
  showSuccess('Barrier Order cleared');
};
function checkCombinedReadiness() {
var btn = document.getElementById('combinedAnalyzeBtn');
var status = document.getElementById('combinedStatus');
if (app.formGuideData && app.speedMapData) {
btn.disabled = false;
status.textContent = '✓ Both guides loaded. Ready to analyze!';
status.style.color = 'var(--accent-green)';
} else {
btn.disabled = true;
var missing = [];
if (!app.formGuideData) missing.push('Form Guide');
if (!app.speedMapData) missing.push('Speed Map');
status.textContent = 'Missing: ' + missing.join(', ');
status.style.color = 'var(--text-muted)';
}
}
app.analyze = function() {
  if (app.isAnalyzing) { showError('Analysis already in progress.'); return; }
  var text = document.getElementById('raceData').value.trim();
  if (!text) { showError('Please paste race card data first!'); return; }

  // If JSON import (race results)
  if (text.charAt(0) === '{' || text.charAt(0) === '[') {
    try {
      var jsonData = JSON.parse(text);
      var races = Array.isArray(jsonData) ? jsonData : [jsonData];
      if (races[0] && (races[0].winner || races[0].factors)) {
        var fakeFile = new File([text], 'pasted-result.json', { type: 'application/json' });
        app.importRaceResults({ target: { files: [fakeFile], value: '' } });
        document.getElementById('raceData').value = '';
        return;
      }
    } catch(e) { /* not JSON, fall through to text parse */ }
  }

  hideError();
  app.horses = [];
  app.resetLabWeights ? app.resetLabWeights() : null;
  app.raceInfo = { track:'', race:'', name:'', distance:'', condition:'Good',
    conditionType:'good', temperature:'', wind:'', humidity:'',
    railPosition:'', railOut:0, classLevel:0, weather:'' };
  document.getElementById('predictions').innerHTML = '';
  document.getElementById('predictions').classList.add('hidden');
  document.getElementById('raceInfo').classList.add('hidden');
  document.getElementById('savePrompt').classList.add('hidden');
  document.getElementById('betSection').classList.add('hidden');
  document.getElementById('loading').classList.remove('hidden');
  var analyzeBtn = document.getElementById('analyzeBtn');
  if (analyzeBtn) analyzeBtn.disabled = true;
  app.isAnalyzing = true;

  setTimeout(function() {
    try {
      var horses = parseHorses(text);
      if (!horses || horses.length === 0) {
        throw new Error('No horses found in pasted text');
      }
      app.horses = scoreHorses(horses);
      // Parse race info from text
      var trackM = text.match(/^([A-Z][A-Za-z\s]+(?:Park|Farm|Valley|Racecourse|Downs|Heath|Grange|Track)?)\s*R(\d+)/m);
      if (trackM) { app.raceInfo.track = trackM[1].trim(); app.raceInfo.race = 'R' + trackM[2]; }
      var distM = text.match(/(\d{3,4})m/);
      if (distM) app.raceInfo.distance = distM[1] + 'm';
      var condM = text.match(/(Good|Soft|Heavy|Firm)\s*(\d)/i);
      if (condM) {
        app.raceInfo.condition = condM[1] + ' ' + condM[2];
        app.raceInfo.conditionType = condM[1].toLowerCase();
      }

      renderRaceInfoPanel();
      renderCards(null);
      buildDropdown();
      buildBetDropdown();
      document.getElementById('predictions').classList.remove('hidden');
      document.getElementById('savePrompt').classList.remove('hidden');
      document.getElementById('allModelPicksPanel').style.display = 'block';
      document.getElementById('singleModelSave').style.display = 'none';
      if (typeof app.renderAllModelPicks === 'function') app.renderAllModelPicks();
      document.getElementById('raceInfo').classList.remove('hidden');
      document.getElementById('betSection').classList.remove('hidden');
      if (typeof renderLiveBetPanel === 'function') renderLiveBetPanel();
      app.activeBets = [];
      renderActiveBets();
      document.getElementById('savePrompt').scrollIntoView({ behavior:'smooth', block:'start' });
      var activeHorses = app.horses.filter(function(h) { return !h.scratched; }).length;
      var scratchedCount = app.horses.length - activeHorses;
      addLog('predict', (app.getModelName ? app.getModelName(app.activeModel) : 'AI') + ' analyzed ' + activeHorses + ' horses' + (scratchedCount > 0 ? ', ' + scratchedCount + ' scratched' : ''));
      showSuccess('Analyzed ' + activeHorses + ' horses!');
    } catch(err) {
      showError('Analysis failed: ' + err.message);
    } finally {
      document.getElementById('loading').classList.add('hidden');
      if (analyzeBtn) analyzeBtn.disabled = false;
      app.isAnalyzing = false;
      document.getElementById('raceData').value = '';
    }
  }, 100);
};

app.analyzeCombined = function() {
if (!app.formGuideData || !app.speedMapData) {
showError('Please load both Form Guide and Speed Map first');
return;
}
hideError();
document.getElementById('loading').classList.remove('hidden');
document.getElementById('winnerBox').innerHTML =
'<h3>🏆 Who Actually Won?</h3>' +
'<p style="color:var(--text-secondary); font-size:14px; margin-bottom:10px;">Select the real finishing positions so we can learn</p>' +
'<label for="winner1Select">1st Place (Winner) *</label>' +
'<select id="winner1Select" aria-required="true"></select>' +
'<label for="winner2Select">2nd Place (Optional)</label>' +
'<select id="winner2Select"></select>' +
'<label for="winner3Select">3rd Place (Optional)</label>' +
'<select id="winner3Select"></select>' +
'<button class="btn btn-winner" onclick="app.recordWinner()">Record Winner</button>';
app.winnerSet = false;
app.currentPendingId = null;
setTimeout(function() {
try {
var mergedHorses = mergeFormGuideAndSpeedMap();
if (mergedHorses.length === 0) {
document.getElementById('loading').classList.add('hidden');
showError('No horses found after merging data');
return;
}
app.raceInfo = {
track: app.speedMapData.track.name || '',
race: '',
name: '',
distance: '',
condition: app.speedMapData.track.conditions || 'Good',
conditionType: 'good',
temperature: app.speedMapData.weather.temp ? app.speedMapData.weather.temp + 'deg' : '',
wind: app.speedMapData.weather.wind || '',
humidity: app.speedMapData.weather.humidity ? app.speedMapData.weather.humidity + '%' : '',
railPosition: app.speedMapData.track.railPosition || '',
railOut: 0,
classLevel: 0,
weather: app.speedMapData.weather.condition || ''
};
var cond = (app.speedMapData.track.conditions || '').toLowerCase();
if (cond.indexOf('heavy') >= 0) app.raceInfo.conditionType = 'heavy';
else if (cond.indexOf('soft') >= 0) app.raceInfo.conditionType = 'soft';
else if (cond.indexOf('firm') >= 0) app.raceInfo.conditionType = 'firm';
else app.raceInfo.conditionType = 'good';
var railMatch = app.raceInfo.railPosition.match(/Out\s*(\d+)m|(\+?)(\d+)m/i);
if (railMatch) {
app.raceInfo.railOut = parseInt(railMatch[1] || railMatch[3] || 0);
}
app.horses = scoreHorses(mergedHorses);
renderRaceInfoPanel();
renderCards(null);
buildDropdown();
buildBetDropdown();
document.getElementById('predictions').classList.remove('hidden');
document.getElementById('savePrompt').classList.remove('hidden');
document.getElementById('allModelPicksPanel').style.display = 'block';
document.getElementById('singleModelSave').style.display = 'none';
if(typeof app.renderAllModelPicks==='function') app.renderAllModelPicks();
document.getElementById('raceInfo').classList.remove('hidden');
document.getElementById('betSection').classList.remove('hidden'); if(typeof renderLiveBetPanel==='function') renderLiveBetPanel(); if(typeof renderConsensusAdvisor==='function') renderConsensusAdvisor();
app.activeBets = [];
renderActiveBets();
document.getElementById('savePrompt').scrollIntoView({ behavior: 'smooth', block: 'start' });
document.getElementById('loading').classList.add('hidden');
var activeHorses = app.horses.filter(function(h) { return !h.scratched; }).length;
showSuccess('Combined analysis complete! ' + activeHorses + ' horses analyzed with full 24-factor engine.');
} catch (err) {
document.getElementById('loading').classList.add('hidden');
showError('Analysis failed: ' + err.message);
}
}, 300);
};
function mergeFormGuideAndSpeedMap() {
var merged = [];

// ── Race identity check ───────────────────────────────────────────────────────
// If speed map and form guide have very different field sizes, they are likely
// from different races — barrier numbers will match by coincidence and give wrong
// settling positions to the wrong horses. Only allow merge if at least 40% of
// form guide horses find a NAME match in the speed map.
var fgCount  = app.formGuideData.horses.length;
var smCount  = app.speedMapData.horses.length;
var nameMatches = 0;
app.formGuideData.horses.forEach(function(fgh) {
  app.speedMapData.horses.forEach(function(smh) {
    if (smh.name.toLowerCase() === fgh.name.toLowerCase() ||
        smh.name.toLowerCase().indexOf(fgh.name.split(' ')[0].toLowerCase()) !== -1 ||
        fgh.name.toLowerCase().indexOf(smh.name.split(' ')[0].toLowerCase()) !== -1) {
      nameMatches++;
    }
  });
});
var nameMatchRate = fgCount > 0 ? nameMatches / fgCount : 0;
var racesMismatch = nameMatchRate < 0.20; // less than 20% name overlap = different race

if (racesMismatch) {
  // Speed map is from a different race — use form guide data only, ignore speed map
  addLog('info', '⚠️ Speed map race mismatch — ' + Math.round(nameMatchRate*100) + '% name overlap. Speed map ignored to prevent wrong settling positions.');
  app.formGuideData.horses.forEach(function(fgh) { merged.push(Object.assign({}, fgh)); });
  return merged;
}

for (var i = 0; i < app.formGuideData.horses.length; i++) {
var fgh = app.formGuideData.horses[i];
var speedMapHorse = null;

// Priority 1: exact name match (safest)
for (var j = 0; j < app.speedMapData.horses.length; j++) {
  var smh = app.speedMapData.horses[j];
  if (smh.name.toLowerCase() === fgh.name.toLowerCase()) { speedMapHorse = smh; break; }
}
// Priority 2: partial name match (handles truncation)
if (!speedMapHorse) {
  for (var j = 0; j < app.speedMapData.horses.length; j++) {
    var smh = app.speedMapData.horses[j];
    var fgFirst = fgh.name.split(' ')[0].toLowerCase();
    var smFirst = smh.name.split(' ')[0].toLowerCase();
    if (fgFirst.length >= 4 && (smh.name.toLowerCase().indexOf(fgFirst) !== -1 || fgh.name.toLowerCase().indexOf(smFirst) !== -1)) {
      speedMapHorse = smh; break;
    }
  }
}
// Priority 3: silk/race number match (reliable when same race)
if (!speedMapHorse) {
  for (var j = 0; j < app.speedMapData.horses.length; j++) {
    var smh = app.speedMapData.horses[j];
    if (smh.silkNumber === fgh.silkNumber || smh.silkNumber === parseInt(fgh.num) || smh.raceNum === parseInt(fgh.num)) {
      speedMapHorse = smh; break;
    }
  }
}
// Priority 4: barrier ONLY if field sizes are very close (within 2) — prevents false matches
if (!speedMapHorse && Math.abs(fgCount - smCount) <= 2) {
  for (var j = 0; j < app.speedMapData.horses.length; j++) {
    var smh = app.speedMapData.horses[j];
    if (smh.barrier === parseInt(fgh.barrier)) { speedMapHorse = smh; break; }
  }
}

var mergedHorse = Object.assign({}, fgh);
if (speedMapHorse) {
mergedHorse.barrier = speedMapHorse.barrier;
mergedHorse.settlingPosition = speedMapHorse.settlingPosition;
// FormSectionals extra fields
if (speedMapHorse.earlySpeed > 0)  mergedHorse.earlySpeed  = speedMapHorse.earlySpeed;
if (speedMapHorse.midSpeed > 0)    mergedHorse.midSpeed    = speedMapHorse.midSpeed;
if (speedMapHorse.lateSpeed > 0)   mergedHorse.lateSpeed   = speedMapHorse.lateSpeed;
if (speedMapHorse.avgSpeed > 0)    mergedHorse.avgSpeed    = speedMapHorse.avgSpeed;
if (speedMapHorse.lastFinishPos > 0) mergedHorse.fsLastFinishPos = speedMapHorse.lastFinishPos;
if (speedMapHorse.lastFieldSize > 0) mergedHorse.fsLastFieldSize = speedMapHorse.lastFieldSize;
if (speedMapHorse.raceNum > 0)     mergedHorse.raceNum     = speedMapHorse.raceNum;
if (speedMapHorse.barrierRank > 0) mergedHorse.barrierRank = speedMapHorse.barrierRank;
}
// Derive runningStyle from settlingPosition if not set by SpeedMap JSON
if (!mergedHorse.runningStyle && mergedHorse.settlingPosition > 0) {
  var sp = mergedHorse.settlingPosition;
  mergedHorse.runningStyle = sp <= 2 ? 'leader' : sp <= 3 ? 'pace'
                           : sp <= 4 ? 'midfield' : sp <= 5 ? 'off pace' : 'backmarker';
}
merged.push(mergedHorse);
}
return merged;
}
function parseSportsBetForm(text) {
  // Pre-process: normalize whitespace, fix split venue codes & class names
  text = text.replace(/[\u00a0\u202f\u2009]/g, ' ');
  text = text.replace(/^www\.sportsbetform\.com\.au$/mg, '');
  text = text.replace(/^Eagle Farm \| Page \d+$/mg, '');
  text = text.replace(/^.+ \| Page \d+$/mg, '');
  // Fix venue+day with no space: DOOMSat -> DOOM Sat
  text = text.replace(/([A-Z]{2,6})(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\b/g, '$1 $2');
  // Fix split venue code: "7 of 8 MWB\nH Mon" -> "7 of 8 MWBH Mon"
  text = text.replace(/(\d+ of \d+ [A-Z]{2,5})\n([A-Z]{1,3}) (Mon|Tue|Wed|Thu|Fri|Sat|Sun)/g, '$1$2 $3');
  // Fix split class name: "GC MAYORS\nVASE Good" -> "GC MAYORS VASE Good"
  text = text.replace(/([A-Z][A-Z0-9 ]{3,})\n([A-Z][A-Z0-9]+) (Good|Soft|Heavy|Firm)/g, '$1 $2 $3');

  var RACE_PAT = /(\d+) of (\d+)\s+([A-Z]{2,7})\s+(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+(\d{1,2}[A-Za-z]{3}\d{2})\s+(\d+)m\s+([A-Z0-9][A-Z0-9 +\-]*?)\s+((?:Good|Soft|Heavy|Firm)\d?)\s+([A-Z][A-Za-z \.\-]+?)\s+([\d\.]+|n\/a)\s+(\d+)\s+([\d\.]+)\s+(.+?)\s+(?:[\d\.]+kg|n\/a)\s+([\d\.]+L)\s+([\d:\.]+)/g;

  function parseStat(block, key) {
    var re = new RegExp('(?:^|\\n)' + key.replace(/\//g,'\\/').replace(/\+/g,'\\+') + '[ \\t]+(\\d+):(\\d+)-(\\d+)-(\\d+)');
    var m = block.match(re);
    return m ? [parseInt(m[1]),parseInt(m[2]),parseInt(m[3]),parseInt(m[4])] : [0,0,0,0];
  }

  // Find all horse header positions: "^N HORSENAME$" on its own line
  var headerRe = /^(\d+) ([A-Z][A-Z'\-\s]+?)$/mg;
  var positions = [], hm;
  while ((hm = headerRe.exec(text)) !== null) {
    positions.push(hm.index);
  }
  if (positions.length === 0) return null; // not this format

  var today = new Date();
  var horses = [];

  for (var bi = 0; bi < positions.length; bi++) {
    var block = text.slice(positions[bi], bi + 1 < positions.length ? positions[bi+1] : text.length).trim();

    var nm = block.match(/^(\d+) ([A-Z][A-Z'\-\s]+?)$/m);
    if (!nm) continue;
    var h = {
      num: nm[1],
      name: nm[2].trim(),
      scratched: false,
      gearChanges: [],
      positionsInRun: [],
      finishPositions: [],
    };

    // Detect scratch signals in SportsBet format
    var sbBlockLower = block.toLowerCase();
    if (sbBlockLower.indexOf('scratched') !== -1 || /\bscr\b/.test(sbBlockLower) ||
        sbBlockLower.indexOf('w/d') !== -1 || sbBlockLower.indexOf('withdrawn') !== -1 ||
        sbBlockLower.indexOf('(scr)') !== -1) {
      h.scratched = true;
      horses.push(h);
      continue;
    }

    var tm = block.match(/\nTrainer (.+)/); h.trainer = tm ? tm[1].trim() : '';
    var jm = block.match(/\nJockey (.+?) ([\d\.]+)kg/);
    h.jockey = jm ? jm[1].trim() : ''; h.weight = jm ? parseFloat(jm[2]) : 0;
    var bm = block.match(/\nBarrier (\d+)/); h.barrier = bm ? bm[1] : '';
    var pm = block.match(/\nPrizemoney \$([\d,]+)/); h.prizemoney = pm ? parseInt(pm[1].replace(/,/g,'')) : 0;
    var wm = block.match(/\nWin Range (\d+)m - (\d+)m/);
    h.winRangeMin = wm ? parseInt(wm[1]) : 0; h.winRangeMax = wm ? parseInt(wm[2]) : 9999;

    var car=parseStat(block,'Career'); h.careerRuns=car[0]; h.careerWins=car[1]; h.careerPlaces=car[2];
    var trk=parseStat(block,'Track'); h.trackRuns=trk[0]; h.trackWins=trk[1]; h.trackPlaces=trk[2];
    var td =parseStat(block,'Trk/Dst'); h.trackDistRuns=td[0]; h.trackDistWins=td[1];
    var dst=parseStat(block,'Dist'); h.distanceRuns=dst[0]; h.distanceWins=dst[1];
    var fu =parseStat(block,'1st Up'); h.firstUpRuns=fu[0]; h.firstUpWins=fu[1];
    var su =parseStat(block,'2nd Up'); h.secondUpRuns=su[0]; h.secondUpWins=su[1];
    var gd =parseStat(block,'Good'); h.goodRuns=gd[0]; h.goodWins=gd[1];
    var sf =parseStat(block,'Soft'); h.softRuns=sf[0]; h.softWins=sf[1];
    var hv =parseStat(block,'Heavy'); h.heavyRuns=hv[0]; h.heavyWins=hv[1];
    var fm =parseStat(block,'Firm'); h.firmRuns=fm[0]; h.firmWins=fm[1];
    // ── NEW: 3rd Up, 12 months, jockey-combo, sire/dam, foal date, claim ──
    var tu = parseStat(block,'3rd Up'); h.thirdUpRuns = tu[0]; h.thirdUpWins = tu[1];
    var mo = parseStat(block,'12 months'); h.monthsRuns = mo[0]; h.monthsWins = mo[1]; h.monthsPlaces = mo[2];
    var jc = parseStat(block,'Jockey'); h.jockeyComboRuns = jc[0]; h.jockeyComboWins = jc[1];
    var sm = block.match(/Sire:\s*([^\t\n\r]+)/); h.sire = sm ? sm[1].trim() : '';
    var dm = block.match(/\nDam:\s*([^\t\n\r]+)/); h.dam = dm ? dm[1].trim() : '';
    var fm2= block.match(/Foaled:\s*([\d\/]+)/); h.foalDate = fm2 ? fm2[1].trim() : '';
    // Age/sex from "7 year old bay mare (female)" or header "7yoM"
    var agem = block.match(/(\d+)\s+year\s+old/i); h.age = agem ? parseInt(agem[1]) : 0;
    var sexm = block.match(/\(?(female|male|gelding|mare|colt|filly)\)?/i);
    h.sex = sexm ? sexm[1].toLowerCase() : '';
    // Jockey claim allowance: "J Braith Nock (a-1.5)"
    var clm = block.match(/\nJ[^\n]+\(a-([\d.]+)\)/); h.claimKg = clm ? parseFloat(clm[1]) : 0;
    // Effective weight after claim
    h.effectiveWeight = h.weight > 0 && h.claimKg > 0 ? h.weight - h.claimKg : h.weight;
    // Total prizemoney (separate from ave prizemoney — already have prizemoney as ave*runs)
    var tpm = block.match(/Prizemoney\s*\n\$([\d,]+)/); h.totalPrizemoney = tpm ? parseInt(tpm[1].replace(/,/g,'')) : 0;

    h.winPct   = h.careerRuns > 0 ? Math.round((h.careerWins / h.careerRuns) * 100) : 0;
    h.placePct = h.careerRuns > 0 ? Math.round(((h.careerWins + h.careerPlaces) / h.careerRuns) * 100) : 0;

    // Parse race history
    RACE_PAT.lastIndex = 0;
    var races = [], rm;
    while ((rm = RACE_PAT.exec(block)) !== null) {
      races.push({
        pos: parseInt(rm[1]), field: parseInt(rm[2]), venue: rm[3], date: rm[4],
        dist: parseInt(rm[5]), cls: rm[6].trim(), cond: rm[7],
        jockey: rm[8].trim(), odds: parseFloat(rm[11]),
        winner: rm[12].trim(), margin: rm[13], time: rm[14]
      });
    }

    h.form = races.slice(0,5).map(function(r){return r.pos;}).join('-');
    h.finishPositions = races.slice(0,5).map(function(r){return r.pos;});

    // ── Parse run-detail lines from Sportsbet format ──────────────────────
    // Each run block: "Finished X/Y Z.ZZL [$PRIZE] (of $POOL), Jockey NAME, Barrier N, Weight X.Xkg ODDS"
    // Followed by: "In running [Settled Nth,] 800m Nth, 400m Nth Sectionals 600m XX.XXXs"
    // Followed by: "1st HORSE (JOCKEY Wkg) Winning Time T:TT.TTT"
    //              "2nd HORSE (JOCKEY Wkg) X.XXL"
    //              "3rd HORSE (JOCKEY Wkg) X.XXL"
    var runDetailPat = /Finished (\d+)\/(\d+)\s+[\d.]+L(?:\s+\$([ \d,]+))? \(of \$([\d,]+)\), Jockey ([^,]+), Barrier (\d+), Weight ([\d.]+)kg\s*([\d.]*)([\s\S]*?)(?=\n\d+\/\d+|\n\d+d(?:days|\s+(?:Spell|Fresh|Trial))|$)/g;
    var runIdx = 0;
    var rdm;
    runDetailPat.lastIndex = 0;
    while ((rdm = runDetailPat.exec(block)) !== null && runIdx < races.length) {
      var r2 = races[runIdx];
      r2.prizewon  = rdm[3] ? parseInt(rdm[3].replace(/[ ,]/g,'')) : 0;
      r2.prizepool = rdm[4] ? parseInt(rdm[4].replace(/,/g,''))    : 0;
      r2.runJockey = rdm[5] ? rdm[5].trim() : '';
      r2.barrier   = rdm[6] ? parseInt(rdm[6]) : 0;
      r2.weight    = rdm[7] ? parseFloat(rdm[7]) : 0;
      r2.runOdds   = rdm[8] ? parseFloat(rdm[8]) : 0;
      // In-running positions from the detail block
      var detail   = rdm[9] || '';
      var sm2 = detail.match(/Settled (\d+)(?:st|nd|rd|th)/);  r2.settledPos = sm2 ? parseInt(sm2[1]) : 0;
      var m800 = detail.match(/800m (\d+)(?:st|nd|rd|th)/);    r2.pos800 = m800 ? parseInt(m800[1]) : 0;
      var m400 = detail.match(/400m (\d+)(?:st|nd|rd|th)/);    r2.pos400 = m400 ? parseInt(m400[1]) : 0;
      var m1200= detail.match(/1200m (\d+)(?:st|nd|rd|th)/);   r2.pos1200= m1200? parseInt(m1200[1]): 0;
      var sect = detail.match(/Sectionals 600m ([\d.]+)s/);    r2.sect600 = sect ? parseFloat(sect[1]) : 0;
      var wt   = detail.match(/Winning Time ([\d:]+\.[\d]+)/);r2.winTime = wt ? wt[1] : '';
      // 1st/2nd/3rd horses
      var first= detail.match(/1st ([^(]+?)\s*\(/);           r2.horse1 = first ? first[1].trim() : '';
      var sec2 = detail.match(/\n2nd ([^(]+?)\s*\(/);         r2.horse2 = sec2  ? sec2[1].trim()  : '';
      var thd  = detail.match(/\n3rd ([^(]+?)\s*\(/);         r2.horse3 = thd   ? thd[1].trim()   : '';
      // Past run condition from venue line: "Rosehill Gardens (Good) 14/03/2026"
      var condm= detail.match(/\(([A-Za-z]+)\)\s+\d{2}\/\d{2}\/\d{4}/);
      if (!condm) condm = block.match(new RegExp(r2.date + '[^\n]*\(([A-Za-z]+)\)'));
      r2.pastCond = condm ? condm[1].toLowerCase() : '';
      runIdx++;
    }

    // ── Derive last-run detail from runs[0] if available ─────────────────
    if (races.length > 0 && races[0].barrier) {
      h.lastBarrier   = races[0].barrier;
      h.lastWeight    = races[0].weight;
      h.lastPrizewon  = races[0].prizewon;
      h.lastPrizepool = races[0].prizepool;
      h.lastPastCond  = races[0].pastCond;
      if (races[0].settledPos > 0) h.lastSettling = races[0].settledPos;
      if (races[0].pos800  > 0) { if (!h.positionsInRun) h.positionsInRun = []; h.positionsInRun.push(races[0].pos800); }
      if (races[0].pos400  > 0) { if (!h.positionsInRun) h.positionsInRun = []; h.positionsInRun.push(races[0].pos400); }
      if (races[0].sect600 > 0) h.sectional600 = races[0].sect600;
      if (races[0].horse1)  h.lastWinner = races[0].horse1;
    }
    h.raceHistory = races; // store full run history for future use

    if (races.length > 0) {
      var last = races[0];
      try {
        var dp = last.date.match(/(\d{1,2})([A-Za-z]{3})(\d{2})/);
        if (dp) {
          var months = {Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11};
          var ld = new Date(2000+parseInt(dp[3]), months[dp[2]], parseInt(dp[1]));
          h.daysAgo = Math.round((today - ld) / 86400000);
        } else { h.daysAgo = 14; }
      } catch(e) { h.daysAgo = 14; }
      h.lastMargin = parseFloat(last.margin.replace('L','')) || 0;
      h.lastPos    = last.pos;
      h.lastField  = last.field;
      h.lastOdds   = last.odds;
      // Derive rough classLevel from class string
      var clsStr = last.cls || '';
      h.classLevel = clsStr.match(/BM(\d+)/) ? parseInt(clsStr.match(/BM(\d+)/)[1]) :
                     clsStr.match(/CL(\d+)/)  ? parseInt(clsStr.match(/CL(\d+)/)[1])  * 10 : 60;
      h.lastClass  = h.classLevel;
    } else {
      h.daysAgo = 99; h.lastMargin = 0; h.lastPos = 0; h.lastField = 0; h.lastOdds = 0;
      h.classLevel = 60; h.lastClass = 60;
    }

    // Derive running style hint from @400/@800 positions if available (sectional positional data)
    // Not directly parsable from this format without sectionals - leave blank
    h.runningStyle = '';
    h.settlingPosition = null;
    h.lastSettling = 0;
    h.sbRating = 0;
    h.odds = 0; // odds not listed in this format - user sets manually
    h.comments = '';
    h.score = 0; h.prob = 0;
    h.formScore = 0; h.consistencyScore = 0; h.freshnessScore = 0;
    h.tacticalScore = 0; h.trackConditionScore = 0; h.firstUpScore = 0;
    h.distanceScore = 0; h.gearScore = 0; h.railScore = 0;
    h.pacePressureScore = 0; h.classChangeScore = 0; h.formMomentumScore = 0;
    h.finishStrengthScore = 0; h.sectionalSpeedScore = 0; h.weatherRailBiasScore = 0;
    h.factorContributions = {};
    h.jockeyWinRate = 0; h.trainerWinRate = 0;

    horses.push(h);
  }
  return horses.length > 0 ? horses : null;
}

function parseHorses(text) {
var result = [];
if (!text || typeof text !== 'string') return result;

// ─── Sportsbet/TABform detailed format ───────────────────────────────────────
if (/\d+ year old|Win Range|Trk\/Dist|Prizemoney \$|Race Details.*Track.*Jockey/i.test(text)) {
  var sbfHorses = parseSportsBetForm(text);
  if (sbfHorses && sbfHorses.length > 0) return sbfHorses;
}

// ─── Parse gear changes from header section ───────────────────────────────────
var gearChanges = {};
var gearSection = text.match(/Gear Changes:([^\n]*(?:\n(?![\w\s]+:)[^\n]*)*)/i);
if (gearSection) {
var gearText = gearSection[1];
var gearPattern = /(\d+)\.\s+([^:]+?)\s+((?:Blinkers|Winkers|Visor|Tongue Tie|Lugging Bit|Concussion Plates|Pacifiers|Bar Plates|Cross Over Nose Band|Ear Muffs|Nose Roll)(?:\s+\([^)]+\))?\s+(?:FIRST TIME|OFF FIRST TIME|AGAIN|ON))/gi;
var gm;
while ((gm = gearPattern.exec(gearText)) !== null) {
var gHorseNum = gm[1];
var gChange = gm[3].trim();
if (!gearChanges[gHorseNum]) gearChanges[gHorseNum] = [];
gearChanges[gHorseNum].push(gChange);
}
}

// ─── Speed map ───────────────────────────────────────────────────────────────
speedMap = {};
var speedMapSection = text.match(/Barrier Order[\s\S]*?(?:WinPlace[\s\S]*?)?((?:\d+\s+\d+\.\s+[^\n]+\s+(?:Leader|Pace|Off Pace|Midfield|Off Midfield|Backmarker|No Speed Map)[^\n]*\n?)+)/i);
if (speedMapSection) {
var speedMapText = speedMapSection[1];
var speedMapPattern = /\d+\.\s+([^\n]+?)\s+(Leader|Pace|Off Pace|Midfield|Off Midfield|Backmarker)/gi;
var speedMatch;
while ((speedMatch = speedMapPattern.exec(speedMapText)) !== null) {
speedMap[speedMatch[1].trim().toLowerCase()] = { style: speedMatch[2].trim(), position: null };
}
}

// ─── Main horse block extraction ─────────────────────────────────────────────
// Matches "1. African Daisy (4)" or "African Daisy (4)" block headers
var pattern1 = /(\d+)\.\s+([^\n(]+?)\s*\((\d+)\)/g;
var found = [];
var m;
while ((m = pattern1.exec(text)) !== null) {
found.push({ idx: m.index, num: m[1], name: m[2].trim().replace(/[<>]/g, ''), barrier: m[3] });
}
if (found.length === 0) {
var pattern2 = /^([A-Z][a-zA-Z\s']+)\s*\((\d+)\)/gm;
while ((m = pattern2.exec(text)) !== null) {
found.push({ idx: m.index, num: (found.length + 1).toString(), name: m[1].trim().replace(/[<>]/g, ''), barrier: m[2] });
}
}
if (found.length === 0) return result;

// Build last-6 overview form map from summary table
var overviewFormMap = {};
var overviewText = text.substring(0, found[0].idx);
var overviewPattern = /0?(\d{1,2})\s+([A-Za-z][\w\s\-\'.]+?)\s+.*?\d+%\s+\d+%\s+([0-9x]{3,8})(?=\s|$)/g;
var ovMatch;
while ((ovMatch = overviewPattern.exec(overviewText)) !== null) {
overviewFormMap[ovMatch[2].trim().toLowerCase()] = ovMatch[3];
}

// ─── Regex patterns for per-run history ──────────────────────────────────────
// Matches: "13/14  157ddays  Rosehill Gardens (Good) 14/03/2026 Race 1 1200m MIDWAY 5Y+ BM72"
// followed by: "Finished 13/14 7.05L (of $120,000), Jockey ..., Barrier 4, Weight 60.5kg 21.00"
// followed by: "In running [Settled Nth,] 800m Nth, 400m Nth Sectionals 600m 34.780s"
var RUN_HDR = /(\d+)\/(\d+)\s+\S+?days?\s+([^\t\n(]+?)\s*\(([^)]+)\)[^\n]*?(\d{3,4})m\s+([^\n]+?)\nFinished\s+\d+\/\d+\s+(?:([\d.]+)L\s+)?(?:\$[\d,]+\s+)?(?:\(of[^)]+\))?,?\s*Jockey\s+([^,\n]+),\s+Barrier\s+(\d+),\s+Weight\s+([\d.]+)kg\s+([\d.]+)/gi;

// Matches in-running positions
var IR_PAT = /In running(?:\s+Settled\s+(\d+)\w*,)?\s+800m\s+(\d+)\w*,\s+400m\s+(\d+)\w*\s+Sectionals 600m\s+([\d.]+)/i;

// Matches barrier trial result line
var BT_HDR = /(\d+)\/(\d+)\s+Barrier\s*\nTrial\s+([^\t\n(]+?)\s*\(([^)]+)\)[^\n]+\nFinished\s+\d+\/\d+\s+([\d.]+)L[^\n]*\nSectionals 600m\s+([\d.]+)/gi;

// Matches spell/freshened indicator
var SPELL_PAT = /(\d+)d\s+(Spell|Freshened)/i;

for (var i = 0; i < found.length; i++) {
var start = found[i].idx;
var end = i + 1 < found.length ? found[i + 1].idx : text.length;
var chunk = text.substring(start, end);
var h = {
num: found[i].num, name: found[i].name, barrier: found[i].barrier,
jockey: '', trainer: '', weight: 0, form: '', odds: 0,
sire: '', dam: '',
careerRuns: 0, careerWins: 0, careerPlaces: 0,
trackRuns: 0, trackWins: 0, trackDistRuns: 0, trackDistWins: 0,
distanceRuns: 0, distanceWins: 0,
goodRuns: 0, goodWins: 0, softRuns: 0, softWins: 0,
heavyRuns: 0, heavyWins: 0, firmRuns: 0, firmWins: 0,
firstUpRuns: 0, firstUpWins: 0, secondUpRuns: 0, secondUpWins: 0,
thirdUpRuns: 0, thirdUpWins: 0,
months12Runs: 0, months12Wins: 0,
jockeyThisRuns: 0, jockeyThisWins: 0,
sbRating: 0, scratched: false, comments: '', score: 0, prob: 0,
lastStart: '', lastFinish: '', lastMargin: null, daysAgo: 0,
winPct: 0, placePct: 0, formScore: 0, consistencyScore: 0,
freshnessScore: 0, jockeyWinRate: 0, trainerWinRate: 0,
runningStyle: '', settlingPosition: null, tacticalScore: 0,
trackConditionScore: 0, firstUpScore: 0, distanceScore: 0,
lastMarginScore: 0, gearChanges: [], gearScore: 0, railScore: 0,
classLevel: 0, lastClass: 0, sectional600: 0, prizemoney: 0,
winRangeMin: 0, winRangeMax: 9999,
spellDays: 0, spellType: '',
lastWeight: 0, lastBarrier: 0, lastOdds: 0,
recentRuns: [],
trialCount: 0, trialBestPos: 99, trialBestSect: 0,
positionsInRun: [], finishPositions: [], lastSettling: 0, lastFinishPos: 0,
pacePressureScore: 0, classChangeScore: 0, formMomentumScore: 0,
finishStrengthScore: 0, sectionalSpeedScore: 0, weatherRailBiasScore: 0,
factorContributions: {}
};

// Detect scratches from multiple formats:
// "scratched", "SCR", "W/D", "Withdrawn", "(Scr)", "SCRATCHED"
var chunkLower = chunk.toLowerCase();
var scratchSignals = [
  chunkLower.indexOf('scratched') !== -1,
  chunkLower.indexOf('\nscr\n') !== -1 || chunkLower.indexOf(' scr ') !== -1 || /\bscr\b/.test(chunkLower),
  chunkLower.indexOf('w/d') !== -1,
  chunkLower.indexOf('withdrawn') !== -1,
  chunkLower.indexOf('(scr)') !== -1,
  // No odds, no jockey, no form — horse is a shell entry (likely late scratch not yet removed)
  (chunkLower.match(/\d\.\d/) === null && chunkLower.indexOf('jockey') === -1 && chunkLower.length < 120)
];
if (scratchSignals.some(Boolean)) {
  h.scratched = true;
  result.push(h);
  continue;
}

if (gearChanges[h.num]) h.gearChanges = gearChanges[h.num];

// ── Core horse details ───────────────────────────────────────────────────────
var tmp;
tmp = chunk.match(/J[:\s]+([^\n\rW]+?)(?:\s+W\s+|\s*W\s+[\d.]+kg|\n|$)/i);
if (tmp) h.jockey = tmp[1].trim().replace(/[<>]/g, '').replace(/\s*\([^)]*\)/, '');
if (!h.jockey) { tmp = chunk.match(/Jockey[:\s]+([^,\n]+)/i); if (tmp) h.jockey = tmp[1].trim().replace(/[<>]/g, '').replace(/\s*\([^)]*\)/, ''); }

tmp = chunk.match(/T[:\s]+([^\n\r(]+?)(?:\s+\(|J\s+|$|\n)/i);
if (tmp) h.trainer = tmp[1].trim().replace(/[<>]/g, '');
if (!h.trainer) { tmp = chunk.match(/Trainer[:\s]+([^,\n]+)/i); if (tmp) h.trainer = tmp[1].trim().replace(/[<>]/g, ''); }

tmp = chunk.match(/W[:\s]+([\d.]+)\s*kgs?/i);
if (tmp) h.weight = parseFloat(tmp[1]);
if (!h.weight || isNaN(h.weight)) { tmp = chunk.match(/Weight[:\s]+([\d.]+)\s*kgs?/i); if (tmp) h.weight = parseFloat(tmp[1]); }

// ── Pedigree ─────────────────────────────────────────────────────────────────
tmp = chunk.match(/Sire:\s*([^\t\n,]+)/i);
if (tmp) h.sire = tmp[1].trim();
tmp = chunk.match(/Dam:\s*([^\t\n,]+)/i);
if (tmp) h.dam = tmp[1].trim();

// ── Prizemoney and win range ──────────────────────────────────────────────────
// Total prizemoney (career earnings)
tmp = chunk.match(/Prizemoney\s*\n\s*\$([\d,]+)/i);
if (tmp) h.prizemoney = parseInt(tmp[1].replace(/,/g, ''));
// Win range
tmp = chunk.match(/Win Range\s*\n\s*([\d]+m)\s*[-–]\s*([\d]+m)/i);
if (tmp) { h.winRangeMin = parseInt(tmp[1]); h.winRangeMax = parseInt(tmp[2]); }

// ── Career stats ─────────────────────────────────────────────────────────────
tmp = chunk.match(/Career[:\s]*\n?\s*(\d+):\s*(\d+)-(\d+)-(\d+)/);
if (tmp) { h.careerRuns = parseInt(tmp[1]); h.careerWins = parseInt(tmp[2]); h.careerPlaces = parseInt(tmp[3]); }
if (!tmp) { tmp = chunk.match(/Career\s*\|\s*(\d+):\s*(\d+)\s*[-\n]\s*(\d+)\s*[-\n]\s*(\d+)/); if (tmp) { h.careerRuns = parseInt(tmp[1]); h.careerWins = parseInt(tmp[2]); h.careerPlaces = parseInt(tmp[3]); } }

tmp = chunk.match(/Win[:\s]*(\d+)%/); if (tmp) h.winPct = parseInt(tmp[1]);
tmp = chunk.match(/Place[:\s]*(\d+)%/); if (tmp) h.placePct = parseInt(tmp[1]);

// 12 months form
tmp = chunk.match(/12\s*months?\s*\n\s*(\d+):\s*(\d+)-(\d+)-(\d+)/i);
if (tmp) { h.months12Runs = parseInt(tmp[1]); h.months12Wins = parseInt(tmp[2]); }

// With this jockey
tmp = chunk.match(/Jockey\s*\n\s*(\d+):\s*(\d+)-(\d+)-(\d+)/);
if (tmp) { h.jockeyThisRuns = parseInt(tmp[1]); h.jockeyThisWins = parseInt(tmp[2]); }

// ── Track / distance / condition splits ───────────────────────────────────────
tmp = chunk.match(/(?:^|\n)Track[:\s]*\n?\s*(\d+):\s*(\d+)-(\d+)-(\d+)/);
if (tmp) { h.trackRuns = parseInt(tmp[1]); h.trackWins = parseInt(tmp[2]); }
tmp = chunk.match(/Trk\/Dist[:\s]*\n?\s*(\d+):\s*(\d+)-(\d+)-(\d+)/);
if (tmp) { h.trackDistRuns = parseInt(tmp[1]); h.trackDistWins = parseInt(tmp[2]); }
tmp = chunk.match(/Distance[:\s]*\n?\s*(\d+):\s*(\d+)-(\d+)-(\d+)/);
if (tmp) { h.distanceRuns = parseInt(tmp[1]); h.distanceWins = parseInt(tmp[2]); }
tmp = chunk.match(/Good[:\s]*\n?\s*(\d+):\s*(\d+)-(\d+)-(\d+)/);
if (tmp) { h.goodRuns = parseInt(tmp[1]); h.goodWins = parseInt(tmp[2]); }
tmp = chunk.match(/Soft[:\s]*\n?\s*(\d+):\s*(\d+)-(\d+)-(\d+)/);
if (tmp) { h.softRuns = parseInt(tmp[1]); h.softWins = parseInt(tmp[2]); }
tmp = chunk.match(/Heavy[:\s]*\n?\s*(\d+):\s*(\d+)-(\d+)-(\d+)/);
if (tmp) { h.heavyRuns = parseInt(tmp[1]); h.heavyWins = parseInt(tmp[2]); }
tmp = chunk.match(/Firm[:\s]*\n?\s*(\d+):\s*(\d+)-(\d+)-(\d+)/);
if (tmp) { h.firmRuns = parseInt(tmp[1]); h.firmWins = parseInt(tmp[2]); }

// ── Prep splits (1st/2nd/3rd up) ─────────────────────────────────────────────
tmp = chunk.match(/1st\s*Up[:\s]*\n?\s*(\d+):\s*(\d+)-(\d+)-(\d+)/i);
if (tmp) { h.firstUpRuns = parseInt(tmp[1]); h.firstUpWins = parseInt(tmp[2]); }
tmp = chunk.match(/2nd\s*Up[:\s]*\n?\s*(\d+):\s*(\d+)-(\d+)-(\d+)/i);
if (tmp) { h.secondUpRuns = parseInt(tmp[1]); h.secondUpWins = parseInt(tmp[2]); }
tmp = chunk.match(/3rd\s*Up[:\s]*\n?\s*(\d+):\s*(\d+)-(\d+)-(\d+)/i);
if (tmp) { h.thirdUpRuns = parseInt(tmp[1]); h.thirdUpWins = parseInt(tmp[2]); }

// ── Days since last run ────────────────────────────────────────────────────────
tmp = chunk.match(/(\d+)\s*days?\s*since\s*last\s*start/i);
if (tmp) { h.daysAgo = parseInt(tmp[1]); h.lastStart = tmp[1] + ' days ago'; }

// ── Spell type (last gap before these runs) ───────────────────────────────────
// "157d Spell" = came off a spell; "35d Freshened" = short break
var spellMatch = SPELL_PAT.exec(chunk);
if (spellMatch) { h.spellDays = parseInt(spellMatch[1]); h.spellType = spellMatch[2]; }

// ── Per-run history (last 6 runs as structured objects) ───────────────────────
var recentRuns = [];
var sectionals = [];
RUN_HDR.lastIndex = 0;
var runM;
while ((runM = RUN_HDR.exec(chunk)) !== null) {
var runBlock = chunk.substring(runM.index, runM.index + 600);
var irM = IR_PAT.exec(runBlock);
var run = {
pos: parseInt(runM[1]), fieldSize: parseInt(runM[2]),
venue: runM[3].trim(), condition: runM[4].trim(),
distance: parseInt(runM[5]), raceClass: runM[6].trim(),
margin: runM[7] ? parseFloat(runM[7]) : 0,
jockey: runM[8].trim(), barrier: parseInt(runM[9]),
weight: parseFloat(runM[10]), odds: parseFloat(runM[11]),
settle: irM && irM[1] ? parseInt(irM[1]) : 0,
pos800m: irM && irM[2] ? parseInt(irM[2]) : 0,
pos400m: irM && irM[3] ? parseInt(irM[3]) : 0,
sectional600: irM && irM[4] ? parseFloat(irM[4]) : 0
};
recentRuns.push(run);
if (run.sectional600 > 0) sectionals.push(run.sectional600);
}
h.recentRuns = recentRuns;

// ── Barrier trial results ─────────────────────────────────────────────────────
var trialRuns = [];
BT_HDR.lastIndex = 0;
var btM;
while ((btM = BT_HDR.exec(chunk)) !== null) {
trialRuns.push({
pos: parseInt(btM[1]), fieldSize: parseInt(btM[2]),
venue: btM[3].trim(), condition: btM[4].trim(),
margin: parseFloat(btM[5]), sectional600: parseFloat(btM[6])
});
}
h.trialCount = trialRuns.length;
h.trialBestPos = trialRuns.length > 0 ? Math.min.apply(null, trialRuns.map(function(t){return t.pos;})) : 99;
h.trialBestSect = trialRuns.length > 0 ? Math.min.apply(null, trialRuns.map(function(t){return t.sectional600||99;})) : 0;
h.trialRuns = trialRuns;

// ── Derived fields from run history ──────────────────────────────────────────
if (recentRuns.length > 0) {
var last = recentRuns[0];
h.lastFinish = last.pos + '/' + last.fieldSize;
h.lastMargin = last.margin;
h.lastPos = last.pos;
h.lastField = last.fieldSize;
h.lastOdds = last.odds;
h.lastWeight = last.weight;
h.lastBarrier = last.barrier;
h.sectional600 = last.sectional600 || (sectionals.length > 0 ? sectionals[0] : 0);
// Last settling position
if (last.settle > 0) h.lastSettling = last.settle;
else if (last.pos800m > 0) h.lastSettling = last.pos800m;
h.positionsInRun = [];
if (last.settle > 0) h.positionsInRun.push(last.settle);
if (last.pos800m > 0) h.positionsInRun.push(last.pos800m);
if (last.pos400m > 0) h.positionsInRun.push(last.pos400m);
// Derive class level from last run class string
var clsStr = last.raceClass || '';
if (/Group\s*1/i.test(clsStr)) h.classLevel = 1;
else if (/Group\s*2/i.test(clsStr)) h.classLevel = 2;
else if (/Group\s*3/i.test(clsStr)) h.classLevel = 3;
else if (/Listed/i.test(clsStr)) h.classLevel = 4;
else if (/BM\s*(\d+)/i.test(clsStr)) {
var bm2 = parseInt(clsStr.match(/BM\s*(\d+)/i)[1]);
h.classLevel = bm2 >= 90 ? 3 : bm2 >= 80 ? 4 : bm2 >= 65 ? 5 : bm2 >= 50 ? 6 : 7;
} else if (/Maiden/i.test(clsStr)) h.classLevel = 11;
else if (/CL\s*(\d+)/i.test(clsStr)) h.classLevel = 11 - parseInt(clsStr.match(/CL\s*(\d+)/i)[1]);
else h.classLevel = 6;
h.lastClass = h.classLevel;
// Running style from last run's settling position
if (last.settle > 0 && !speedMap[h.name.toLowerCase()]) {
if (last.settle <= 2) h.runningStyle = 'leader';
else if (last.settle <= 4) h.runningStyle = 'pace';
else if (last.settle <= 7) h.runningStyle = 'midfield';
else h.runningStyle = 'backmarker';
}
// Days ago from "0 days since last start"
if (!h.daysAgo && !h.lastStart) {
// Default to 14 if unknown
h.daysAgo = 14;
}
}

// ── Form string ───────────────────────────────────────────────────────────────
h.form = recentRuns.slice(0, 6).map(function(r) {
return r.pos > 9 ? '0' : String(r.pos);
}).join('');
// Override with overview table form if available (includes 'x' for barriers)
var ovForm = overviewFormMap[h.name.toLowerCase()];
if (ovForm) {
  // Sanity check: overview digit count should roughly match recentRuns count
  // If they differ by more than 2, the overview row may be misattributed — skip it
  var ovDigits = ovForm.replace(/[^0-9x]/gi,'').length;
  var rrCount = recentRuns.length;
  if (rrCount === 0 || Math.abs(ovDigits - rrCount) <= 2) {
    h.form = ovForm;
  }
  // Additional check: first digit of ovForm should match recentRuns[0].pos if available
  if (recentRuns.length > 0 && ovDigits > 0) {
    var firstOvPos = ovForm.replace(/[^0-9x]/i,'')[0];
    var firstRrPos = recentRuns[0].pos > 9 ? '0' : String(recentRuns[0].pos);
    if (firstOvPos && firstRrPos && firstOvPos !== 'x' && firstOvPos !== firstRrPos) {
      // Mismatch — overview form is from a different horse, use recentRuns instead
      h.form = recentRuns.slice(0,6).map(function(r){ return r.pos > 9 ? '0' : String(r.pos); }).join('');
      h._formSourceMismatch = true;
    }
  }
}
// Fall back to Finished position pattern
if (!h.form) {
var finishPattern = /Finished\s+(\d+)\/\d+/g;
var finishes = [];
var fM;
while ((fM = finishPattern.exec(chunk)) !== null) {
var fp2 = parseInt(fM[1]);
finishes.push(fp2 > 9 ? '0' : String(fp2));
}
if (finishes.length >= 2) h.form = finishes.slice(0, 6).reverse().join('');
}

// ── Finish positions array ─────────────────────────────────────────────────────
h.finishPositions = recentRuns.slice(0,6).map(function(r){ return r.pos > 0 ? r.pos : 10; });
h.formRuns = recentRuns.slice(0,6).map(function(r){
  return { pos:r.pos, venue:r.venue||'', dist:r.distance||0, cond:r.condition||'', date:'' };
});
if (h.lastFinish) h.lastFinishPos = parseInt(h.lastFinish.split('/')[0]) || 0;
else if (h.finishPositions.length > 0) h.lastFinishPos = h.finishPositions[0];

// ── Odds ──────────────────────────────────────────────────────────────────────
tmp = chunk.match(/^\s*([\d.]+)\s*\n\s*([\d.]+)\s*\n/m);
if (tmp && parseFloat(tmp[1]) > 1 && parseFloat(tmp[1]) < 500) h.odds = parseFloat(tmp[1]);
if (!h.odds) { tmp = chunk.match(/Fixed Win[^\d]+([\d.]+)/); if (tmp && parseFloat(tmp[1]) > 1) h.odds = parseFloat(tmp[1]); }
if (!h.odds) { tmp = chunk.match(/\((\d+)\)[^\d]+([\d.]+)/); if (tmp && parseFloat(tmp[2]) > 1) h.odds = parseFloat(tmp[2]); }

// ── Speed map ─────────────────────────────────────────────────────────────────
var nameLower = h.name.toLowerCase();
if (speedMap[nameLower]) {
  h.runningStyle = speedMap[nameLower].style;
  h.settlingPosition = speedMap[nameLower].position;
  h._speedMapMatched = true;
} else {
  // Horse not found in speed map — mark so we can warn user
  h._speedMapMissed = true;
}

// ── Comments / rating ────────────────────────────────────────────────────────
tmp = chunk.match(/SB Rating\s*\n?\s*(\d+)/i);
if (tmp) h.sbRating = parseInt(tmp[1]);
tmp = chunk.match(/Runner Comments\s*\n?\s*([\s\S]+?)(?:\nBio:|\n\n|$)/);
if (tmp) h.comments = tmp[1].trim().replace(/[<>]/g, '');

result.push(h);
}
return result;
}
function parseRaceInfo(text) {
var info = { track: '', race: '', name: '', distance: '', condition: '', conditionType: '', temperature: '', wind: '', humidity: '', railPosition: '', railOut: 0, classLevel: 0, weather: '' };
var tmp;
tmp = text.match(/>\s*([A-Za-z]+)\s*\n/); if (tmp) info.track = tmp[1].trim();
tmp = text.match(/(\d+)m\s+R(\d+)\s+(.+?)(?:\n|Race)/);
if (tmp) { info.distance = tmp[1] + 'm'; info.race = 'Race ' + tmp[2]; info.name = tmp[3].trim(); }
tmp = text.match(/(Good|Soft|Heavy|Firm)\s*(\d)?/i);
if (tmp) { info.condition = tmp[1] + (tmp[2] ? ' ' + tmp[2] : ''); info.conditionType = tmp[1].toLowerCase(); }
if (!info.conditionType) { tmp = text.match(/Conditions?:\s*(Good|Soft|Heavy|Firm)\s*(\d)?/i); if (tmp) { info.condition = tmp[1] + (tmp[2] ? ' ' + tmp[2] : ''); info.conditionType = tmp[1].toLowerCase(); } }
tmp = text.match(/(\d+)deg\s+([^\n]+)/); if (tmp) info.temperature = tmp[1] + 'deg';
tmp = text.match(/Wind:\s*([^\n]+)/i); if (tmp) info.wind = tmp[1].trim();
tmp = text.match(/Humidity:\s*(\d+)%/i); if (tmp) info.humidity = tmp[1] + '%';
tmp = text.match(/Weather:\s*([^\n]+)/i); if (tmp) info.weather = tmp[1].trim().toLowerCase();
if (!info.weather && text.match(/\b(rain|shower|drizzle|overcast|fine|cloudy|humid)\b/i)) {
info.weather = text.match(/\b(rain|shower|drizzle|overcast|fine|cloudy|humid)\b/i)[1].toLowerCase();
}
tmp = text.match(/Rail Position:\s*Out\s*(\d+)m/i);
if (tmp) { info.railOut = parseInt(tmp[1]); info.railPosition = 'Out ' + tmp[1] + 'm'; }
else { tmp = text.match(/Rail Position:\s*([^\n]+)/i); if (tmp) { info.railPosition = tmp[1].trim(); if (info.railPosition.toLowerCase() === 'true') info.railOut = 0; } }
if (/Group\s*1/i.test(info.name)) info.classLevel = 1;
else if (/Group\s*2/i.test(info.name)) info.classLevel = 2;
else if (/Group\s*3/i.test(info.name)) info.classLevel = 3;
else if (/Listed/i.test(info.name)) info.classLevel = 4;
else if (/BM\s*(\d+)/i.test(info.name)) { var rBm = parseInt(info.name.match(/BM\s*(\d+)/i)[1]); info.classLevel = rBm >= 80 ? 4 : rBm >= 65 ? 5 : rBm >= 50 ? 6 : 7; }
else if (/Open/i.test(info.name)) info.classLevel = 5;
else if (/Maiden/i.test(info.name)) info.classLevel = 11;
else if (/Class\s*(\d)/i.test(info.name)) { info.classLevel = 11 - parseInt(info.name.match(/Class\s*(\d)/i)[1]); }
else if (/Restricted/i.test(info.name)) info.classLevel = 9;
return info;
}
function parseSaturdayLogText(text) {
var results = [];
var lines = text.split('\n');
for (var i = 0; i < lines.length; i++) {
var line = lines[i];
if (line.indexOf('[RESULT]') === -1 && line.indexOf('[result]') === -1) continue;
var top3Match = line.match(/Actual:\s*([^\/\n|,]+)(?:\/([^\/\n|,]+))?(?:\/([^\/\n|]+))?/i);
var predMatch = line.match(/Predicted:\s*([^\/\n|,]+)(?:\/([^\/\n|,]+))?(?:\/([^\/\n|]+))?/i);
if (!top3Match) continue;
var r = {
actual1: top3Match[1].trim(),
actual2: top3Match[2] ? top3Match[2].trim() : null,
actual3: top3Match[3] ? top3Match[3].replace(/\|.*/, '').trim() : null,
predicted1: predMatch ? predMatch[1].trim() : null,
predicted2: predMatch && predMatch[2] ? predMatch[2].trim() : null,
predicted3: predMatch && predMatch[3] ? predMatch[3].replace(/\|.*/, '').trim() : null,
isWin: line.indexOf('WIN correct') !== -1,
isTop3: line.indexOf('Top-3') !== -1 || line.indexOf('Top3') !== -1,
hits: 0
};
var actuals = [r.actual1, r.actual2, r.actual3].filter(Boolean);
var preds = [r.predicted1, r.predicted2, r.predicted3].filter(Boolean);
preds.forEach(function(p) { if (actuals.indexOf(p) !== -1) r.hits++; });
results.push(r);
}
return results;
}
