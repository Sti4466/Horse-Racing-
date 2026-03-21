'use strict';

// § APP — analyze, model switching, save/load, app.* methods
// ═══════════════════════════════════════════════════════════════
function showToast(msg, type) {
var el = document.getElementById('toast');
el.textContent = msg;
el.className = 'toast ' + type;
void el.offsetWidth;
el.classList.add('show');
if (toastTimer) clearTimeout(toastTimer);
toastTimer = setTimeout(function() { el.classList.remove('show'); }, 4000);
}
function showError(msg) { showToast(msg, 'error'); }
function showSuccess(msg) { showToast(msg, 'success'); }
function showInfo(msg) {
var el = document.getElementById('toast');
el.textContent = msg;
el.className = 'toast info';
void el.offsetWidth;
el.classList.add('show');
if (toastTimer) clearTimeout(toastTimer);
toastTimer = setTimeout(function() { el.classList.remove('show'); }, 8000);
}
function hideError() { document.getElementById('toast').classList.remove('show'); }
function escapeHtml(text) {
var div = document.createElement('div');
div.textContent = text;
return div.innerHTML;
}
function generateId() {
return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
function loadSavedData() {
try {
if (!app.factorStats) {
app.factorStats = {
total: 0, oddsSuccess: 0, formSuccess: 0, trackSuccess: 0,
jockeySuccess: 0, trainerSuccess: 0, freshnessSuccess: 0,
consistencySuccess: 0, tacticalSuccess: 0, trackCondSuccess: 0,
firstUpSuccess: 0, distanceSuccess: 0, lastMarginSuccess: 0,
gearSuccess: 0, railSuccess: 0, paceSuccess: 0, classSuccess: 0,
momentumSuccess: 0, finStrSuccess: 0, sectionalSuccess: 0, weatherRailSuccess: 0,
careerSuccess: 0, trackDistSuccess: 0, ratingSuccess: 0,
secondUpSuccess: 0, thirdUpSuccess: 0, jockeyComboSuccess: 0,
jockeyAffinitySuccess: 0, prizeMoneySuccess: 0,
oddsFail: 0, formFail: 0, trackFail: 0, jockeyFail: 0,
trainerFail: 0, freshnessFail: 0, consistencyFail: 0,
tacticalFail: 0, trackCondFail: 0, firstUpFail: 0,
distanceFail: 0, lastMarginFail: 0, gearFail: 0, railFail: 0,
paceFail: 0, classFail: 0, momentumFail: 0, finStrFail: 0,
sectionalFail: 0, weatherRailFail: 0,
careerFail: 0, trackDistFail: 0, ratingFail: 0,
secondUpFail: 0, thirdUpFail: 0, jockeyComboFail: 0,
jockeyAffinityFail: 0, prizeMoneyFail: 0
};
}
var savedClassRatings = localStorage.getItem('horseClassRatings');
try { app.classRatings = savedClassRatings ? JSON.parse(savedClassRatings) : {}; }
catch(e) { app.classRatings = {}; }
var savedHistory = localStorage.getItem('horseRaceHistoryV2');
if (savedHistory) {
var parsed = JSON.parse(savedHistory);
if (Array.isArray(parsed)) app.raceHistory = parsed;
}
var savedPending = localStorage.getItem('horsePendingRacesV2');
if (savedPending) {
var parsedPending = JSON.parse(savedPending);
if (Array.isArray(parsedPending)) app.pendingRaces = parsedPending;
}
var savedWeights = localStorage.getItem('horseModelWeightsV2');
if (savedWeights) {
var parsedWeights = JSON.parse(savedWeights);
if (parsedWeights && typeof parsedWeights.odds === 'number') {
app.baseWeights = parsedWeights;
if (!app.baseWeights.railPosition) app.baseWeights.railPosition = app.defaultWeights.railPosition;
if (!app.baseWeights.gearChange) app.baseWeights.gearChange = app.defaultWeights.gearChange;
if (!app.baseWeights.pacePressure) app.baseWeights.pacePressure = app.defaultWeights.pacePressure;
if (!app.baseWeights.classChange) app.baseWeights.classChange = app.defaultWeights.classChange;
if (!app.baseWeights.formMomentum) app.baseWeights.formMomentum = app.defaultWeights.formMomentum;
if (!app.baseWeights.finishStrength) app.baseWeights.finishStrength = app.defaultWeights.finishStrength;
if (!app.baseWeights.sectionalSpeed) app.baseWeights.sectionalSpeed = app.defaultWeights.sectionalSpeed;
if (!app.baseWeights.weatherRailBias) app.baseWeights.weatherRailBias = app.defaultWeights.weatherRailBias;
if (!app.baseWeights.secondUpForm) app.baseWeights.secondUpForm = app.defaultWeights.secondUpForm;
if (!app.baseWeights.jockeyForm)   app.baseWeights.jockeyForm   = app.defaultWeights.jockeyForm;
if (!app.baseWeights.trainerForm)  app.baseWeights.trainerForm  = app.defaultWeights.trainerForm;
if (!app.baseWeights.raceOrder)    app.baseWeights.raceOrder    = app.defaultWeights.raceOrder;
if (!app.baseWeights.barrierOrder) app.baseWeights.barrierOrder = app.defaultWeights.barrierOrder;
// Ensure custom3 (GPT Place Specialist) has its philosophy if loading old save
// ── Learning objective guards — ensure saved weights carry correct objective ──
// custom (Kimi): Form-First, top3 objective
if (app.customWeights && !app.customWeights.learningObjective) {
  app.customWeights.learningObjective = 'top3';
}
// custom2 (Grok): Top-2 Hunter — MUST be top2, not top3
if (app.custom2Weights && app.custom2Weights.learningObjective !== 'top2') {
  app.custom2Weights.learningObjective = 'top2';
  app.custom2Weights.top3Weight = Math.min(app.custom2Weights.top3Weight || 0.70, 0.35);
  app.custom2Weights.winWeight  = Math.max(app.custom2Weights.winWeight  || 0.30, 0.65);
}
// custom3 (GPT): Place Finder, top3 objective
if (app.custom3Weights && !app.custom3Weights.learningObjective) {
  app.custom3Weights.careerPlace     = Math.max(app.custom3Weights.careerPlace   || 60,  120);
  app.custom3Weights.formConsistency = Math.max(app.custom3Weights.formConsistency || 35, 80);
  app.custom3Weights.finishStrength  = Math.max(app.custom3Weights.finishStrength  || 30, 60);
  app.custom3Weights.top3Weight    = 0.85;
  app.custom3Weights.winWeight     = 0.15;
  app.custom3Weights.learningObjective = 'top3';
}
if (!app.baseWeights.marginLearning) app.baseWeights.marginLearning = app.defaultWeights.marginLearning;
app.sanitizeWeights(app.baseWeights);
}
}
var savedCustomWeights = localStorage.getItem('horseCustomWeightsV3');
if (savedCustomWeights) {
var parsedCustom = JSON.parse(savedCustomWeights);
if (parsedCustom && typeof parsedCustom.odds === 'number') {
app.customWeights = parsedCustom;
app.sanitizeWeights(app.customWeights);
}
}
var savedCustom2Weights = localStorage.getItem('horseCustom2WeightsV3');
if (savedCustom2Weights) {
var parsedCustom2 = JSON.parse(savedCustom2Weights);
if (parsedCustom2 && typeof parsedCustom2.odds === 'number') {
app.custom2Weights = parsedCustom2;
app.sanitizeWeights(app.custom2Weights);
}
}
var savedCustom3Weights = localStorage.getItem('horseCustom3WeightsV3');
if (savedCustom3Weights) {
var parsedCustom3 = JSON.parse(savedCustom3Weights);
if (parsedCustom3 && typeof parsedCustom3.odds === 'number') {
app.custom3Weights = parsedCustom3;
app.sanitizeWeights(app.custom3Weights);
}
}

var savedSaturdayWeights = localStorage.getItem('horseSaturdayWeightsV3');
if (savedSaturdayWeights) {
try { var parsedSat = JSON.parse(savedSaturdayWeights); if (parsedSat && typeof parsedSat.odds === 'number') { app.saturdayWeights = parsedSat; app.sanitizeWeights(app.saturdayWeights); } } catch(e) {}
}
var savedActiveModel = localStorage.getItem('horseActiveModel');
if (savedActiveModel && ['base','custom','custom2','custom3','saturday'].indexOf(savedActiveModel) !== -1) {
app.activeModel = savedActiveModel;
}
if (app.activeModel === 'custom') app.W = app.customWeights;
else if (app.activeModel === 'custom2') app.W = app.custom2Weights;
else if (app.activeModel === 'custom3') app.W = app.custom3Weights;
else if (app.activeModel === 'saturday') app.W = app.saturdayWeights;
else app.W = app.baseWeights;
// Auto-switch to Saturday model on Saturdays — only if user hasn't manually chosen a model
var satAutoDisabled = localStorage.getItem('horseSatAutoDisabled') === 'true';
if (new Date().getDay() === 6 && !satAutoDisabled && savedActiveModel !== 'base' && savedActiveModel !== 'custom' && savedActiveModel !== 'custom2' && savedActiveModel !== 'custom3') {
app.activeModel = 'saturday';
app.W = app.saturdayWeights;
}
var savedBaseMetrics = localStorage.getItem('horseBaseMetrics');
if (savedBaseMetrics) { try { app.baseMetrics = JSON.parse(savedBaseMetrics); } catch(e) {} }
var savedCustomMetrics = localStorage.getItem('horseCustomMetrics');
if (savedCustomMetrics) { try { app.customMetrics = JSON.parse(savedCustomMetrics); } catch(e) {} }
var savedCustom2Metrics = localStorage.getItem('horseCustom2Metrics');
if (savedCustom2Metrics) { try { app.custom2Metrics = JSON.parse(savedCustom2Metrics); } catch(e) {} }
var savedCustom3Metrics = localStorage.getItem('horseCustom3Metrics');
if (savedCustom3Metrics) { try { app.custom3Metrics = JSON.parse(savedCustom3Metrics); } catch(e) {} }
var savedCustom4Metrics = localStorage.getItem('horseCustom4Metrics');
var savedSaturdayMetrics = localStorage.getItem('horseSaturdayMetrics');
if (savedSaturdayMetrics) { try { app.saturdayMetrics = JSON.parse(savedSaturdayMetrics); } catch(e) {} }
var savedVenueProfiles = localStorage.getItem('horseVenueProfiles');
if (savedVenueProfiles) { try { app.venueProfiles = JSON.parse(savedVenueProfiles) || {}; } catch(e) {} }
var savedCustomModelNames = localStorage.getItem('horseCustomModelNames');
if (savedCustomModelNames) { try { app.customModelNames = Object.assign(app.customModelNames, JSON.parse(savedCustomModelNames)); } catch(e) {} }
var savedLog = localStorage.getItem('horseActivityLog');
if (savedLog) { try { app.activityLog = JSON.parse(savedLog); } catch(e) {} }
var savedFactorStats = localStorage.getItem('horseFactorStatsV2');
if (savedFactorStats) {
var parsedStats = JSON.parse(savedFactorStats);
if (parsedStats && typeof parsedStats.total === 'number') {
app.factorStats = parsedStats;
var defaultFields = ['trackCondSuccess','firstUpSuccess','distanceSuccess','lastMarginSuccess','gearSuccess','railSuccess','paceSuccess','classSuccess','momentumSuccess','finStrSuccess','sectionalSuccess','weatherRailSuccess','oddsFail','formFail','trackFail','jockeyFail','trainerFail','freshnessFail','consistencyFail','tacticalFail','trackCondFail','firstUpFail','distanceFail','lastMarginFail','gearFail','railFail','paceFail','classFail','momentumFail','finStrFail','sectionalFail','weatherRailFail','careerSuccess','careerFail','trackDistSuccess','trackDistFail','ratingSuccess','ratingFail'];
for (var d = 0; d < defaultFields.length; d++) {
if (typeof app.factorStats[defaultFields[d]] === 'undefined') {
app.factorStats[defaultFields[d]] = 0;
}
}
}
}
var savedJockeyStats = localStorage.getItem('horseJockeyStatsV2');
if (savedJockeyStats) app.jockeyStats = JSON.parse(savedJockeyStats);
var savedTrainerStats = localStorage.getItem('horseTrainerStatsV2');
if (savedTrainerStats) app.trainerStats = JSON.parse(savedTrainerStats);
var savedBetting = localStorage.getItem('horseBettingHistoryV2');
if (savedBetting) {
var parsedBetting = JSON.parse(savedBetting);
if (Array.isArray(parsedBetting)) app.bettingHistory = parsedBetting;
}
var savedFormGuide = localStorage.getItem('formGuideData');
if (savedFormGuide) {
try {
app.formGuideData = JSON.parse(savedFormGuide);
if (app.formGuideData && app.formGuideData.horses) {
var loadedCount = app.formGuideData.horses.filter(function(h) { return !h.scratched; }).length;
var totalCount = app.formGuideData.horses.length;
document.getElementById('formGuideDetails').textContent =
'Horses loaded: ' + loadedCount + '/' + totalCount + ' | Loaded at: ' +
new Date(app.formGuideData.loadedAt).toLocaleTimeString();
document.getElementById('formGuideStatus').classList.remove('hidden');
}
} catch (e) {
console.error('Error loading form guide data:', e);
}
}
var savedSpeedMap = localStorage.getItem('speedMapData');
if (savedSpeedMap) {
try {
app.speedMapData = JSON.parse(savedSpeedMap);
if (app.speedMapData && app.speedMapData.track) {
document.getElementById('speedMapDetails').textContent =
'Track: ' + app.speedMapData.track.name + ' | ' +
'Conditions: ' + app.speedMapData.track.conditions + ' | ' +
'Rail: ' + app.speedMapData.track.railPosition + ' | ' +
'Weather: ' + app.speedMapData.weather.condition + ' ' + app.speedMapData.weather.temp + 'degC';
document.getElementById('speedMapStatus').classList.remove('hidden');
}
} catch (e) {
console.error('Error loading speed map data:', e);
}
}
setTimeout(checkCombinedReadiness, 100);


// ── getRaceContext — derives context key from current race info ───────────────


// ═══════════════════════════════════════════════════════════════
function saveData() {
try {
localStorage.setItem('horseRaceHistoryV2', JSON.stringify(app.raceHistory));
localStorage.setItem('horsePendingRacesV2', JSON.stringify(app.pendingRaces));
localStorage.setItem('horseModelWeightsV2', JSON.stringify(app.baseWeights));
localStorage.setItem('horseCustomWeightsV3', JSON.stringify(app.customWeights));
localStorage.setItem('horseCustom2WeightsV3', JSON.stringify(app.custom2Weights));
localStorage.setItem('horseCustom3WeightsV3', JSON.stringify(app.custom3Weights));
localStorage.setItem('horseSaturdayWeightsV3', JSON.stringify(app.saturdayWeights));
localStorage.setItem('horseActiveModel', app.activeModel);
localStorage.setItem('horseBaseMetrics', JSON.stringify(app.baseMetrics));
localStorage.setItem('horseCustomMetrics', JSON.stringify(app.customMetrics));
localStorage.setItem('horseCustom2Metrics', JSON.stringify(app.custom2Metrics));
localStorage.setItem('horseCustom3Metrics', JSON.stringify(app.custom3Metrics));
localStorage.setItem('horseSaturdayMetrics', JSON.stringify(app.saturdayMetrics));
localStorage.setItem('horseVenueProfiles', JSON.stringify(app.venueProfiles));
localStorage.setItem('horsePatternLibrary', JSON.stringify(app.patternLibrary || {}));
localStorage.setItem('horseWeightReferences', JSON.stringify(app.weightReferences || {}));
localStorage.setItem('horseCustomModelNames', JSON.stringify(app.customModelNames));
localStorage.setItem('horseActivityLog', JSON.stringify(app.activityLog.slice(-500)));
if (app.factorStats) localStorage.setItem('horseFactorStatsV2', JSON.stringify(app.factorStats));
localStorage.setItem('horseJockeyStatsV2', JSON.stringify(app.jockeyStats));
localStorage.setItem('horseTrainerStatsV2', JSON.stringify(app.trainerStats));
localStorage.setItem('horseBettingHistoryV2', JSON.stringify(app.bettingHistory));
localStorage.setItem('horseClassRatings', JSON.stringify(app.classRatings));
} catch (e) {
console.error('Error saving data:', e);
if (e.name === 'QuotaExceededError') {
if (app.raceHistory.length > 20) {
app.raceHistory = app.raceHistory.slice(-20);
try { saveData(); showError('Storage full -- trimmed oldest history entries.'); return; } catch(e2) {}
}
showError('Storage quota exceeded! Export your data and reset.');
} else {
showError('Failed to save data: ' + e.message);
}
}
}
app.exportData = function() {
var data = {
version: "3.0",
exportedAt: new Date().toISOString(),
raceHistory: app.raceHistory,
pendingRaces: app.pendingRaces,
modelWeights: app.W,
baseWeights: app.baseWeights,
customWeights: app.customWeights,
custom2Weights: app.custom2Weights,
custom3Weights: app.custom3Weights,
  saturdayWeights: app.saturdayWeights,
};
var jsonStr = JSON.stringify(data, null, 2);
try {
var blob = new Blob([jsonStr], { type: 'application/json' });
var url = URL.createObjectURL(blob);
var a = document.createElement('a');
a.href = url;
a.download = 'horse-predictor-backup-' + new Date().toISOString().slice(0,10) + '.json';
document.body.appendChild(a);
a.click();
document.body.removeChild(a);
setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
showSuccess('Backup downloaded successfully!');
} catch(err) {
if (navigator.clipboard && navigator.clipboard.writeText) {
navigator.clipboard.writeText(jsonStr).then(function() {
showSuccess('Backup copied to clipboard — paste into a .json file to save.');
}).catch(function() { showError('Download blocked. Try a different browser.'); });
} else {
showError('Download blocked by browser. Try Chrome or Firefox.');
}
}
};
app.importData = function(event) {
var file = event.target.files[0];
if (!file) return;
var reader = new FileReader();
reader.onload = function(e) {
try {
var data = JSON.parse(e.target.result);
if (data.winner || (Array.isArray(data) && data.length > 0 && data[0].winner)) {
app.importRaceResults({ target: { files: [file], value: '' } });
event.target.value = '';
return;
}
if (!data.raceHistory || !Array.isArray(data.raceHistory)) {
showError('Invalid file format. Expected a backup file or race result JSON.');
return;
}
if (!confirm('Import will merge with existing data (' + data.raceHistory.length + ' races, ' + (data.pendingRaces ? data.pendingRaces.length : 0) + ' pending). Continue?')) return;
var existingKeys = {};
for (var i = 0; i < app.raceHistory.length; i++) {
existingKeys[app.raceHistory[i].race + '|' + app.raceHistory[i].date] = true;
}
for (var j = 0; j < data.raceHistory.length; j++) {
var key = data.raceHistory[j].race + '|' + data.raceHistory[j].date;
if (!existingKeys[key]) {
app.raceHistory.push(data.raceHistory[j]);
}
}
if (data.pendingRaces) {
for (var k = 0; k < data.pendingRaces.length; k++) {
app.pendingRaces.push(data.pendingRaces[k]);
}
}
if (data.modelWeights) app.W = data.modelWeights;
if (data.baseWeights) app.baseWeights = data.baseWeights;
if (data.customWeights) app.customWeights = data.customWeights;
if (data.custom2Weights) app.custom2Weights = data.custom2Weights;
if (data.custom3Weights) app.custom3Weights = data.custom3Weights;
if (data.saturdayWeights) app.saturdayWeights = data.saturdayWeights;
// Sanitize all imported weights to fix any scale-confusion values
app.sanitizeWeights(app.baseWeights);
app.sanitizeWeights(app.customWeights);
app.sanitizeWeights(app.custom2Weights);
app.sanitizeWeights(app.custom3Weights);
app.sanitizeWeights(app.saturdayWeights);
if (data.factorStats) app.factorStats = data.factorStats;
if (data.jockeyStats) Object.assign(app.jockeyStats, data.jockeyStats);
if (data.trainerStats) Object.assign(app.trainerStats, data.trainerStats);
if (data.venueProfiles) app.venueProfiles = data.venueProfiles;
if (data.patternLibrary) app.patternLibrary = data.patternLibrary;
if (data.customModelNames) app.customModelNames = Object.assign(app.customModelNames, data.customModelNames);
if (data.bettingHistory && Array.isArray(data.bettingHistory)) {
for (var b = 0; b < data.bettingHistory.length; b++) {
app.bettingHistory.push(data.bettingHistory[b]);
}
}
saveData();
updateStats();
showSuccess('Imported ' + data.raceHistory.length + ' races successfully!');
if (data.raceHistory.length >= 5) {
setTimeout(function() {
showInfo('Backup loaded (' + data.raceHistory.length + ' races). Run \ud83d\udd04 Relearn from History to train the models on this data and get a Learning Direction report.');
}, 4500); // delayed so it follows after the success toast (which auto-hides after 4s)
}
} catch (err) {
showError('Failed to parse backup file: ' + err.message);
}
};
reader.readAsText(file);
event.target.value = '';
};


// ═══════════════════════════════════════════════════════════════
function addLog(type, message, detail) {
var now = new Date();
var ts = now.toLocaleDateString() + ' ' + now.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', second:'2-digit'});
var modelNames = { base:'Base', custom:app.getModelName('custom'), custom2:app.getModelName('custom2'), custom3:app.getModelName('custom3'), saturday:app.getModelName('saturday') };
var entry = {
ts: ts,
type: type,
model: modelNames[app.activeModel] || app.activeModel,
message: message,
detail: detail || ''
};
app.activityLog.unshift(entry);
if (app.activityLog.length > 500) app.activityLog.pop();
var countEl = document.getElementById('logCount');
if (countEl) countEl.textContent = app.activityLog.length;
var panel = document.getElementById('activityLogPanel');
if (panel && !panel.classList.contains('hidden')) {
renderActivityLog();
}
try { localStorage.setItem('horseActivityLog', JSON.stringify(app.activityLog.slice(-500))); } catch(e) {}
}
function copyTextToClipboard(text, btn, successLabel, resetLabel) {
  successLabel = successLabel || '✓ Copied!';
  resetLabel   = resetLabel   || btn ? btn.textContent : 'Copy';
  function doFallback() {
    var ta = document.createElement('textarea');
    ta.value = text; ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;';
    document.body.appendChild(ta); ta.focus(); ta.select();
    try { document.execCommand('copy'); } catch(e) {}
    document.body.removeChild(ta);
    if (btn) { btn.textContent = successLabel; setTimeout(function(){ btn.textContent = resetLabel; }, 2000); }
  }
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(function() {
      if (btn) { btn.textContent = successLabel; setTimeout(function(){ btn.textContent = resetLabel; }, 2000); }
    }).catch(doFallback);
  } else { doFallback(); }
}


// ── renderAllModelPicks ───────────────────────────────────────────────────────
// Fills #allModelPicksTable with each model's top-3 picks for the current race.
app.renderAllModelPicks = function() {
  var table = document.getElementById('allModelPicksTable');
  if (!table) return;
  var horses = (app.horses || []).filter(function(h){ return !h.scratched; });
  if (horses.length === 0) { table.innerHTML = ''; return; }

  var modelDefs = [
    { key:'base',    label:'🧠 Base',   color:'#10b981', weights: app.baseWeights    },
    { key:'custom',  label:'🔵 ' + app.getModelName('custom'),  color:'#a855f7', weights: app.customWeights  },
    { key:'custom2', label:'⚡ ' + app.getModelName('custom2'), color:'#f59e0b', weights: app.custom2Weights },
    { key:'custom3', label:'🤖 ' + app.getModelName('custom3'), color:'#06b6d4', weights: app.custom3Weights }
  ].filter(function(m){ return !!m.weights; });

  var prevW = app.W;
  app._raceModelResults = [];
  var html = '';

  modelDefs.forEach(function(m) {
    var tf = JSON.parse(JSON.stringify(horses));
    app.W = m.weights;
    scoreHorses(tf);
    app.W = prevW;
    // Grok (custom2) is a Top-2 Hunter — only picks 2 horses
    var maxPicks = m.key === 'custom2' ? 2 : 3;
    var top3 = tf.slice(0, maxPicks);
    app._raceModelResults.push({ key: m.key, name: m.label, color: m.color, field: tf, top3: top3, maxPicks: maxPicks });
    var pickColors = ['#10b981','#3b82f6','#a855f7'];
    html += '<div style="display:flex; align-items:center; gap:8px; padding:6px 0; border-bottom:1px solid var(--border);">' +
      '<span style="font-size:12px; font-weight:700; color:' + m.color + '; min-width:80px;">' + escapeHtml(m.label) + '</span>' +
      '<span style="font-size:13px; color:var(--text-primary);">' +
        top3.map(function(h, i){ return '<span style="color:' + pickColors[i] + ';">' + escapeHtml(h.name) + '</span>'; }).join(' · ') +
        (m.key === 'custom2' ? ' <span style="font-size:10px; color:#f59e0b; opacity:0.7;">(Top-2 only)</span>' : '') +
      '</span>' +
    '</div>';
  });
  app.W = prevW;

  table.innerHTML = html || '<p style="color:var(--text-muted); font-size:12px;">No model picks available.</p>';

  // Populate late-scratch buttons
  var scratchBtns = document.getElementById('lateScratchBtns');
  if (scratchBtns) {
    scratchBtns.innerHTML = '';
    horses.forEach(function(h) {
      var btn = document.createElement('button');
      btn.style.cssText = 'background:rgba(239,68,68,0.15); border:1px solid #ef4444; color:#ef4444; border-radius:6px; padding:3px 10px; font-size:12px; cursor:pointer;';
      btn.textContent = h.num + '. ' + h.name;
      btn.onclick = (function(horse) {
        return function() {
          horse.scratched = true;
          btn.style.opacity = '0.4';
          btn.disabled = true;
          app.renderAllModelPicks();
          buildDropdown();
        };
      })(h);
      scratchBtns.appendChild(btn);
    });
  }
  // Always populate the result dropdowns from app.horses
  buildDropdown();
};

// ── _showLivePanel ────────────────────────────────────────────────────────────
// Switches the savePrompt to show the live all-model picks panel.
app._showLivePanel = function() {
  var live = document.getElementById('allModelPicksPanel');
  var later = document.getElementById('singleModelSave');
  var prompt = document.getElementById('savePrompt');
  if (live)   live.style.display   = 'block';
  if (later)  later.style.display  = 'none';
  if (prompt) prompt.classList.remove('hidden');
  if (typeof app.renderAllModelPicks === 'function') app.renderAllModelPicks();
  buildDropdown();
};

// ── _showSaveForLater ─────────────────────────────────────────────────────────
// Switches the savePrompt to show the save-for-later panel.
app._showSaveForLater = function() {
  var live  = document.getElementById('allModelPicksPanel');
  var later = document.getElementById('singleModelSave');
  var prompt = document.getElementById('savePrompt');
  if (live)   live.style.display  = 'none';
  if (later)  later.style.display = 'block';
  if (prompt) prompt.classList.remove('hidden');
};

// ── _toggleScratchBar ─────────────────────────────────────────────────────────
// Shows / hides the late-scratch bar inside the live panel.
app._toggleScratchBar = function() {
  var bar = document.getElementById('lateScratchBar');
  if (!bar) return;
  bar.style.display = bar.style.display === 'none' ? 'block' : 'none';
};

// ── savePending ───────────────────────────────────────────────────────────────
// Saves the current active-model prediction as a single pending entry.
app.savePending = function() {
  if (!app.horses || app.horses.length === 0) { showError('No race data to save!'); return; }
  var modelIcons = { base:'🧠', custom:'🔵', custom2:'⚡', custom3:'🤖', saturday:'🐴' };
  var entry = {
    id:        generateId(),
    savedAt:   Date.now(),
    raceInfo:  JSON.parse(JSON.stringify(app.raceInfo)),
    horses:    JSON.parse(JSON.stringify(app.horses)),
    model:     app.activeModel,
    modelName: app.getModelName ? app.getModelName(app.activeModel) : app.activeModel,
    modelIcon: modelIcons[app.activeModel] || '🤖'
  };
  app.pendingRaces.push(entry);
  app.currentPendingId = entry.id;
  saveData();
  updateStats();
  renderPending();
  document.getElementById('savePrompt').classList.add('hidden');
  addLog('save', '💾 Saved: ' + entry.raceInfo.track + ' ' + entry.raceInfo.race, 'Model: ' + entry.modelName);
  showSuccess('Saved! Open Pending to record results after the race.');
};

// ── saveAllModels ─────────────────────────────────────────────────────────────
// Saves a pending entry for every loaded model simultaneously.
app.saveAllModels = function() {
  if (!app.horses || app.horses.length === 0) { showError('No race data to save!'); return; }
  var modelIcons  = { base:'🧠', custom:'🔵', custom2:'⚡', custom3:'🤖', saturday:'🐴' };
  var modelKeys   = ['base','custom','custom2','custom3'];
  var weightMap   = { base: app.baseWeights, custom: app.customWeights, custom2: app.custom2Weights, custom3: app.custom3Weights };
  var savedCount  = 0;
  var prevW = app.W;

  modelKeys.forEach(function(mk) {
    if (!weightMap[mk]) return;
    // Score field with this model's weights
    var tf = JSON.parse(JSON.stringify(app.horses));
    app.W = weightMap[mk];
    scoreHorses(tf);
    app.W = prevW;

    var entry = {
      id:        generateId(),
      savedAt:   Date.now(),
      raceInfo:  JSON.parse(JSON.stringify(app.raceInfo)),
      horses:    tf,
      model:     mk,
      modelName: app.getModelName ? app.getModelName(mk) : mk,
      modelIcon: modelIcons[mk] || '🤖'
    };
    app.pendingRaces.push(entry);
    savedCount++;
  });

  app.W = prevW;
  saveData();
  updateStats();
  renderPending();
  document.getElementById('savePrompt').classList.add('hidden');
  addLog('save', '💾 Saved all ' + savedCount + ' models: ' + app.raceInfo.track + ' ' + app.raceInfo.race);
  showSuccess('Saved ' + savedCount + ' model predictions to Pending!');
};

// ── loadPending ───────────────────────────────────────────────────────────────
// Restores a pending race into the analysis view so the user can record results.
app.loadPending = function(id) {
  var pending = null;
  for (var i = 0; i < app.pendingRaces.length; i++) {
    if (app.pendingRaces[i].id === id) { pending = app.pendingRaces[i]; break; }
  }
  if (!pending) { showError('Pending race not found!'); return; }

  app.horses        = JSON.parse(JSON.stringify(pending.horses));
  app.raceInfo      = JSON.parse(JSON.stringify(pending.raceInfo));
  app.currentPendingId = id;
  app.winnerSet     = false;

  // Switch to the model that saved this entry
  if (pending.model && app.switchModel) {
    app.switchModel(pending.model, true);
  }

  // Re-score with the active model
  if (app.W && app.horses.length > 0) {
    scoreHorses(app.horses);
  }

  renderRaceInfoPanel();
  renderCards(null);
  buildDropdown();
  buildBetDropdown();

  document.getElementById('predictions').classList.remove('hidden');
  document.getElementById('savePrompt').classList.remove('hidden');
  document.getElementById('allModelPicksPanel').style.display = 'block';
  document.getElementById('singleModelSave').style.display = 'none';
  document.getElementById('raceInfo').classList.remove('hidden');
  document.getElementById('betSection').classList.add('hidden');

  if (typeof app.renderAllModelPicks === 'function') app.renderAllModelPicks();

  app.activeBets = [];
  renderActiveBets();

  document.getElementById('savePrompt').scrollIntoView({ behavior: 'smooth', block: 'start' });
  addLog('predict', '📂 Loaded pending: ' + pending.raceInfo.track + ' ' + pending.raceInfo.race);
  showSuccess('Loaded! Enter the actual result above.');
};

// ── deletePending ─────────────────────────────────────────────────────────────
app.deletePending = function(id) {
  app.pendingRaces = app.pendingRaces.filter(function(p){ return p.id !== id; });
  if (app.currentPendingId === id) app.currentPendingId = null;
  saveData();
  updateStats();
  renderPending();
};

// ── deleteAllPending ──────────────────────────────────────────────────────────
app.deleteAllPending = function() {
  if (!confirm('Delete all ' + app.pendingRaces.length + ' pending races?')) return;
  app.pendingRaces = [];
  app.currentPendingId = null;
  saveData();
  updateStats();
  renderPending();
  showSuccess('All pending races deleted.');
};

// ── recordWinner ──────────────────────────────────────────────────────────────
// Records the result for the currently loaded (single-model) prediction.
app.recordWinner = function() {
  var name1 = (document.getElementById('winner1Select') || {}).value || '';
  var name2 = (document.getElementById('winner2Select') || {}).value || '';
  var name3 = (document.getElementById('winner3Select') || {}).value || '';
  if (!name1) { showError('Please select at least the winner!'); return; }
  if (name2 && name1 === name2) { showError('Same horse in multiple positions!'); return; }
  if (name3 && (name1 === name3 || name2 === name3)) { showError('Same horse in multiple positions!'); return; }

  var allHorses = app.horses || [];
  var actual1   = allHorses.filter(function(h){ return h.name === name1; })[0];
  if (!actual1) { showError('Could not find winner horse data!'); return; }
  var actual2 = name2 ? allHorses.filter(function(h){ return h.name === name2; })[0] : null;
  var actual3 = name3 ? allHorses.filter(function(h){ return h.name === name3; })[0] : null;

  app._lastActuals = [name1, name2, name3].filter(Boolean);

  var active = allHorses.filter(function(h){ return !h.scratched; });
  var predicted1 = active[0] || null;
  var predicted2 = active[1] || null;
  var predicted3 = active[2] || null;
  if (!predicted1) { showError('No predictions to compare!'); return; }

  var pNames3 = [predicted1.name, predicted2 ? predicted2.name : '', predicted3 ? predicted3.name : ''].filter(Boolean);
  var aNames3 = [name1, name2, name3].filter(Boolean);
  var isCorrect = predicted1.name === name1;
  var top3Any   = aNames3.length >= 2 && aNames3.every(function(n){ return pNames3.indexOf(n) !== -1; });
  var hits      = aNames3.filter(function(n){ return pNames3.indexOf(n) !== -1; }).length;
  app._lastTop3Hits = hits;

  var learnMsg = (typeof learn === 'function') ? learn(actual1, predicted1, actual2, predicted2, actual3, predicted3) : '';

  var metrics = app.activeModel === 'base'    ? app.baseMetrics
              : app.activeModel === 'custom'  ? app.customMetrics
              : app.activeModel === 'custom2' ? app.custom2Metrics
              : app.activeModel === 'custom3' ? app.custom3Metrics
              :                                 app.saturdayMetrics;
  metrics.total++;
  if (isCorrect) metrics.correct++;
  if (aNames3.length >= 2 && [name1, name2].filter(Boolean).every(function(n){ return [predicted1.name, predicted2 ? predicted2.name : ''].indexOf(n) !== -1; })) metrics.top2++;
  if (top3Any) metrics.top3++;

  app.raceHistory.push({
    race:        (app.raceInfo.track || 'Race') + ' ' + (app.raceInfo.race || ''),
    track:       app.raceInfo.track || '',
    predicted:   predicted1.name,
    actual:      name1,
    actual2:     name2 || '',
    actual3:     name3 || '',
    predicted2:  predicted2 ? predicted2.name : '',
    predicted3:  predicted3 ? predicted3.name : '',
    correct:     isCorrect,
    top3:        top3Any,
    top3Hits:    hits,
    learnMsg:    learnMsg,
    date:        new Date().toLocaleDateString(),
    model:       app.activeModel
  });

  // Remove from pending if loaded from there
  if (app.currentPendingId) {
    app.pendingRaces = app.pendingRaces.filter(function(p){ return p.id !== app.currentPendingId; });
    app.currentPendingId = null;
  }

  saveData(); updateStats(); app.updateModelMetrics();
  app.winnerSet = true;

  var hitColor = hits >= 3 ? '#a855f7' : hits >= 2 ? '#10b981' : hits === 1 ? '#f59e0b' : '#ef4444';
  var hitMsg   = hits >= 3 ? '🎰 TRIFECTA BOX!' : hits >= 2 ? '🎯 Quinella hit!' : hits === 1 ? '1 in frame' : '❌ Missed';
  document.getElementById('winnerBox').innerHTML =
    '<div class="result-msg"><h3 style="color:' + hitColor + ';">' + hitMsg + '</h3>' +
    '<p>Actual: <strong>' + escapeHtml(name1) + (name2 ? ' / ' + escapeHtml(name2) : '') + (name3 ? ' / ' + escapeHtml(name3) : '') + '</strong></p>' +
    '<p>Predicted: <strong>' + escapeHtml(predicted1.name) + '</strong>' +
    (learnMsg ? '<p class="learn">' + escapeHtml(learnMsg) + '</p>' : '') +
    '</div>';

  document.getElementById('savePrompt').classList.add('hidden');
  addLog('result', (isCorrect ? '✅' : '❌') + ' ' + (app.getModelName ? app.getModelName(app.activeModel) : app.activeModel) + ': ' + hits + '/3', 'Actual: ' + name1 + (name2 ? '/' + name2 : '') + (name3 ? '/' + name3 : ''));
  showSuccess('Result recorded! ' + hitMsg);
};

// ── recordAndRerun ────────────────────────────────────────────────────────────
// Records result for all models and shows a rerun comparison in the unified panel.
app.recordAndRerun = function() {
  // Build _raceModelResults from current horses + all model weights if not yet set
  if (!app._raceModelResults || app._raceModelResults.length === 0) {
    if (typeof app.renderAllModelPicks === 'function') app.renderAllModelPicks();
  }
  // Reset winnerSet so we can detect success vs validation failure
  app.winnerSet = false;
  // Delegate to the full multi-model recorder
  app.recordAllModels();
  // recordAllModels returns early (without setting winnerSet) if validation fails
  if (!app.winnerSet) return;

  // Remove from pending so the race moves to History
  if (app.currentPendingId) {
    app.pendingRaces = app.pendingRaces.filter(function(p){ return p.id !== app.currentPendingId; });
    app.currentPendingId = null;
    saveData();
    updateStats();
    renderPending();
  }

  // Settle any active bets for this race using the recorded actuals
  var actuals = app._lastActuals || [];
  if (actuals.length > 0) {
    var allH = app.horses || [];
    var horseByName = {};
    allH.forEach(function(h){ horseByName[h.name] = h; });
    var firstPlace  = actuals[0] ? horseByName[actuals[0]] || null : null;
    var secondPlace = actuals[1] ? horseByName[actuals[1]] || null : null;
    var thirdPlace  = actuals[2] ? horseByName[actuals[2]] || null : null;
    if (typeof settleBets === 'function' && firstPlace) settleBets(firstPlace, secondPlace, thirdPlace);
  }

  // Show re-run results inside the unified panel
  var rerunDiv = document.getElementById('unifiedRerunResult');
  if (rerunDiv) {
    rerunDiv.style.display = 'block';
    if (typeof app._rerunToDiv === 'function') app._rerunToDiv(rerunDiv);
  }

  // Show the Betting panel and refresh all betting components
  var bettingPanel = document.getElementById('bettingPanel');
  if (bettingPanel) bettingPanel.classList.remove('hidden');
  if (typeof renderBettingStats === 'function') renderBettingStats();
  if (typeof renderActiveBets === 'function') renderActiveBets();

  // Re-run: re-score horses with the freshly updated weights and display new predictions
  if (app.horses && app.horses.length > 0) {
    scoreHorses(app.horses);
    renderRaceInfoPanel();
    renderCards(null);
    document.getElementById('predictions').classList.remove('hidden');
    document.getElementById('raceInfo').classList.remove('hidden');
    document.getElementById('betSection').classList.remove('hidden');
    if (typeof renderLiveBetPanel === 'function') renderLiveBetPanel();
    if (typeof renderConsensusAdvisor === 'function') renderConsensusAdvisor();
    document.getElementById('predictions').scrollIntoView({ behavior: 'smooth', block: 'start' });
    showSuccess('Weights updated — fresh prediction shown below!');
  }
};

var speedMap = {};
loadSavedData();
setTimeout(function() {
app.switchModel(app.activeModel, true);
app.updateModelMetrics();
var countEl = document.getElementById('logCount');
if (countEl) countEl.textContent = app.activityLog.length;
if (app.updateMonitorButton) app.updateMonitorButton();
}, 100);
