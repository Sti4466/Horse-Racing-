'use strict';

function updateStats() {
var correct = 0, top2Count = 0, top3Count = 0, top2Eligible = 0, top3Eligible = 0;
for (var i = 0; i < app.raceHistory.length; i++) {
var r = app.raceHistory[i];
if (r.correct) correct++;
if (r.actual2 && r.predicted2) {
top2Eligible++;
if (typeof r.top2 === 'boolean') {
if (r.top2) top2Count++;
} else {
var pSet = [r.predicted, r.predicted2];
var aSet = [r.actual, r.actual2];
if (aSet.every(function(n) { return n && pSet.indexOf(n) !== -1; })) top2Count++;
}
}
if (r.actual3 && r.predicted3) {
top3Eligible++;
if (typeof r.top3 === 'boolean') {
if (r.top3) top3Count++;
} else {
var pSet3 = [r.predicted, r.predicted2, r.predicted3];
var aSet3 = [r.actual, r.actual2, r.actual3];
if (aSet3.every(function(n) { return n && pSet3.indexOf(n) !== -1; })) top3Count++;
}
}
}
var total = app.raceHistory.length;
document.getElementById('sCorrect').textContent = correct;
document.getElementById('sTotal').textContent = total;
document.getElementById('sPct').textContent = (total > 0 ? Math.round((correct / total) * 100) : 0) + '%';
document.getElementById('sTop2').textContent = (top2Eligible > 0 ? Math.round((top2Count / top2Eligible) * 100) : 0) + '%';
document.getElementById('sTop3').textContent = (top3Eligible > 0 ? Math.round((top3Count / top3Eligible) * 100) : 0) + '%';
document.getElementById('sPending').textContent = app.pendingRaces.length;
document.getElementById('historyCount').textContent = total;
document.getElementById('pendingCount').textContent = app.pendingRaces.length;
document.getElementById('bettingCount').textContent = app.bettingHistory.length;
var venueCountEl = document.getElementById('venueCount');
if (venueCountEl) venueCountEl.textContent = Object.keys(app.venueProfiles || {}).length;
if (total > 0 || app.pendingRaces.length > 0) document.getElementById('statsBar').classList.remove('hidden');
// ── Day P&L ────────────────────────────────────────────────────────────────
var today = new Date().toLocaleDateString();
var dayProfit = 0;
for (var di = 0; di < app.bettingHistory.length; di++) {
  var br = app.bettingHistory[di];
  if (br.date === today && typeof br.profit === 'number') dayProfit += br.profit;
}
var dayPnLEl = document.getElementById('sDayPnL');
if (dayPnLEl) {
  var sign = dayProfit >= 0 ? '+' : '';
  dayPnLEl.textContent = sign + '$' + Math.abs(dayProfit).toFixed(2);
  dayPnLEl.style.color = dayProfit >= 0 ? 'var(--accent-green)' : 'var(--accent-red)';
}
if (app.updateMonitorButton) app.updateMonitorButton();
}

// ── buildDropdown ─────────────────────────────────────
function buildDropdown() {
try {
var html = '<option value="">-- Select horse --</option>';
for (var i = 0; i < app.horses.length; i++) {
if (!app.horses[i].scratched) {
var h = app.horses[i];
var option = document.createElement('option');
option.value = h.name;
option.textContent = h.num + '. ' + h.name + ' ($' + (h.odds || 0).toFixed(2) + ')';
html += option.outerHTML;
}
}
var selectors = ['winner1Select', 'winner2Select', 'winner3Select'];
for (var si2 = 0; si2 < selectors.length; si2++) {
var sel = document.getElementById(selectors[si2]);
if (sel) sel.innerHTML = html;
}
} catch (e) {
console.error('Error building dropdowns:', e);
showError('Error building dropdowns: ' + e.message);
}
}

// ── renderPending ─────────────────────────────────────
function renderPending() {
var listContainer = document.getElementById('pendingList');
var deleteAllBtn = document.getElementById('deleteAllPendingBtn');
if (app.pendingRaces.length === 0) {
listContainer.innerHTML = '<p style="color:var(--text-muted);">No pending races. Analyze a race and save it to record results later!</p>';
if (deleteAllBtn) deleteAllBtn.style.display = 'none';
return;
}
listContainer.innerHTML = '';
if (deleteAllBtn) deleteAllBtn.style.display = app.pendingRaces.length > 1 ? 'block' : 'none';
for (var i = app.pendingRaces.length - 1; i >= 0; i--) {
var pending = app.pendingRaces[i];
var item = document.createElement('div');
item.className = 'pending-item';
var header = document.createElement('div');
header.className = 'pending-header';
var title = document.createElement('div');
title.className = 'pending-title';
title.textContent = pending.raceInfo.track + ' ' + pending.raceInfo.race;
var date = document.createElement('div');
date.className = 'pending-date';
date.textContent = new Date(pending.savedAt).toLocaleString();
header.appendChild(title);
header.appendChild(date);
item.appendChild(header);
var modelBadgeColors = { base:'#059669', custom:'#7c3aed', custom2:'#b45309', custom3:'#0e7490', custom4:'#1d4ed8', saturday:'#ef4444' };
var savedModel = pending.model || 'base';
var badgeColor = modelBadgeColors[savedModel] || '#475569';
var badgeLabel = (pending.modelIcon || '🤖') + ' ' + (pending.modelName || savedModel);
var badge = document.createElement('div');
badge.style.cssText = 'display:inline-block; margin-bottom:6px; padding:3px 10px; border-radius:12px; font-size:11px; font-weight:700; background:' + badgeColor + '22; color:' + badgeColor + '; border:1px solid ' + badgeColor + '55;';
badge.textContent = badgeLabel;
item.appendChild(badge);
var prediction = document.createElement('div');
prediction.className = 'pending-prediction';
var predictedTop3 = [];
for (var j = 0; j < pending.horses.length && predictedTop3.length < 3; j++) {
if (!pending.horses[j].scratched) predictedTop3.push(pending.horses[j].name);
}
prediction.textContent = '🏆 Predicted: ' + predictedTop3.join(', ');
item.appendChild(prediction);
var actions = document.createElement('div');
actions.className = 'pending-actions';
var loadBtn = document.createElement('button');
loadBtn.className = 'btn-load';
loadBtn.textContent = 'Load & Record';
loadBtn.onclick = (function(id) { return function() { app.loadPending(id); }; })(pending.id);
var deleteBtn = document.createElement('button');
deleteBtn.className = 'btn-delete';
deleteBtn.textContent = '🗑 Delete';
deleteBtn.onclick = (function(id) { return function(e) { e.stopPropagation(); app.deletePending(id); }; })(pending.id);
actions.appendChild(loadBtn);
actions.appendChild(deleteBtn);
item.appendChild(actions);
listContainer.appendChild(item);
}
}

// ── renderCards ───────────────────────────────────────
function renderCards(actualWinner) {
var container = document.getElementById('predictions');
container.innerHTML = '';
var pos = 0;
var scratchedHorses = [];
var activeCount = 0;
for (var i = 0; i < app.horses.length; i++) {
if (app.horses[i].scratched) { scratchedHorses.push(app.horses[i]); continue; }
activeCount++;
pos++;
if (pos > 4) continue;
var h = app.horses[i];
var card = document.createElement('div');
card.className = 'horse-card pos' + pos;
var topDiv = document.createElement('div');
topDiv.className = 'horse-top';
var nameSpan = document.createElement('span');
nameSpan.className = 'horse-name';
nameSpan.textContent = h.num + '. ' + h.name;
if (actualWinner && h.name === actualWinner) {
var actualTag = document.createElement('span');
actualTag.className = 'actual-tag';
actualTag.textContent = '⭐ ACTUAL WINNER';
nameSpan.appendChild(actualTag);
}
var probSpan = document.createElement('span');
probSpan.className = 'prob';
probSpan.textContent = h.prob + '%';
topDiv.appendChild(nameSpan);
topDiv.appendChild(probSpan);
card.appendChild(topDiv);
var badge = document.createElement('span');
badge.className = 'badge badge-' + pos;
badge.textContent = pos === 1 ? '🏆 Predicted Winner' : pos === 2 ? '🥈 2nd Place' : pos === 3 ? '🥉 3rd Place' : '4 4th Place';
card.appendChild(badge);
if (h.top3Score !== undefined && h.winScore !== undefined) {
var scoreBreakdown = document.createElement('div');
scoreBreakdown.style.cssText = 'font-size:11px; color:var(--text-secondary); margin-top:6px; padding:6px 8px; background:var(--bg-input); border-radius:6px;';
scoreBreakdown.innerHTML = '📊 <strong style="color:var(--accent-purple);">Top-3:</strong> ' +
Math.round(h.top3Score) + ' (70%) . <strong style="color:var(--accent-gold);">Win:</strong> ' +
Math.round(h.winScore) + ' (30%) = <strong style="color:var(--accent-green);">' +
Math.round(h.score) + '</strong>';
card.appendChild(scoreBreakdown);
}
var info = document.createElement('div');
info.className = 'horse-info';
info.textContent = 'J: ' + (h.jockey || '--') + ' . T: ' + (h.trainer || '--');
card.appendChild(info);
var statsRow = document.createElement('div');
statsRow.className = 'stats-row';
function addStat(text, isGood, isWarning, isGear) {
var stat = document.createElement('span');
stat.className = 'stat' + (isGood ? ' good' : '') + (isWarning ? ' warning' : '') + (isGear ? ' gear' : '');
stat.textContent = text;
statsRow.appendChild(stat);
}
if (h.odds > 0) addStat('Odds: $' + h.odds.toFixed(2), h.odds < 5, false, false);
if (h.sbRating > 0) addStat('Rating: ' + h.sbRating, h.sbRating >= 90, false, false);
if (h.runningStyle) { var styleText = h.settlingPosition ? h.runningStyle + ' (Pos ' + h.settlingPosition + ')' : h.runningStyle; addStat('Style: ' + styleText, h.tacticalScore > app.W.tactical * 0.8, false, false); }
if (h.gearChanges && h.gearChanges.length > 0) { for (var g = 0; g < h.gearChanges.length; g++) addStat('⚙ ' + h.gearChanges[g], false, false, true); }
if (h.careerRuns > 0) addStat('Career: ' + h.careerWins + 'W-' + h.careerPlaces + 'P (' + h.careerRuns + ')', false, false, false);
if (h.winPct > 0) addStat('Win: ' + h.winPct + '%', h.winPct >= 20, false, false);
if (h.trackRuns > 0) addStat('Track: ' + h.trackWins + 'W (' + h.trackRuns + ')', h.trackWins > 0, false, false);
if (h.daysAgo > 0) addStat('Last: ' + h.daysAgo + 'd ago', h.daysAgo >= 7 && h.daysAgo <= 21, h.daysAgo > 35, false);
if (h.lastFinish) addStat('Finished ' + h.lastFinish, false, false, false);
if (h.form && h.form !== '-') addStat('Form: ' + h.form, h.consistencyScore > 0.5, false, false);
if (h.consistencyScore > 0) addStat('Consistency: ' + Math.round(h.consistencyScore * 100) + '%', h.consistencyScore > 0.6, false, false);
if (h.jockeyWinRate > 0) addStat('Jockey: ' + Math.round(h.jockeyWinRate * 100) + '%', h.jockeyWinRate > 0.15, false, false);
if (h.trainerWinRate > 0) addStat('Trainer: ' + Math.round(h.trainerWinRate * 100) + '%', h.trainerWinRate > 0.15, false, false);
if (h.weight > 0) addStat('Wt: ' + h.weight + 'kg', h.weight < 56, false, false);
if (h.pacePressureScore > 0) addStat('🔥 Pace+', true, false, false);
else if (h.pacePressureScore < -5) addStat('⚠ Pace-', false, true, false);
if (h.classChangeScore > 5) addStat('⬇ Class Drop', true, false, false);
else if (h.classChangeScore < -5) addStat('⬆ Class Rise', false, true, false);
if (h.formMomentumScore > 10) addStat('📈 Improving', true, false, false);
else if (h.formMomentumScore < -5) addStat('📉 Declining', false, true, false);
if (h.finishStrengthScore > 5) addStat('💪 Strong Closer', true, false, false);
if (h.sectionalSpeedScore > 5) addStat('⏱ Fast Sectional', true, false, false);
if (h.weatherRailBiasScore > 5) addStat('🌧 Bias Fit', true, false, false);
card.appendChild(statsRow);
if (h.comments) {
var comments = document.createElement('p');
comments.className = 'comments';
comments.textContent = '"' + h.comments + '"';
card.appendChild(comments);
}
if (h.factorContributions && Object.keys(h.factorContributions).length > 0) {
var factorDiv = document.createElement('div');
factorDiv.className = 'factor-contrib';
var factorTitle = document.createElement('h4');
factorTitle.textContent = 'Score Breakdown';
factorDiv.appendChild(factorTitle);
var factors = [];
for (var fKey in h.factorContributions) {
if (h.factorContributions[fKey] > 0) factors.push({ name: fKey, value: h.factorContributions[fKey] });
}
factors.sort(function(a, b) { return b.value - a.value; });
var maxFactor = factors.length > 0 ? factors[0].value : 1;
for (var f = 0; f < Math.min(5, factors.length); f++) {
var factor = factors[f];
var pct = Math.round((factor.value / h.score) * 100);
var width = Math.round((factor.value / maxFactor) * 100);
var nameMap = { odds: 'Odds', rating: 'Rating', career: 'Career', track: 'Track', form: 'Form',
freshness: 'Freshness', tactical: 'Tactical', jockey: 'Jockey', trainer: 'Trainer',
trackDist: 'Track/Dist', trackCond: 'Track Cond', firstUp: '1st Up', distance: 'Distance',
lastMargin: 'Last Margin', gear: 'Gear', rail: 'Rail', weight: 'Weight', stats: 'Stats',
pace: 'Pace', classChg: 'Class', momentum: 'Momentum',
finStr: 'Finish Strength', sectional: 'Sectional', weatherRail: 'Weather/Rail',
raceOrder: 'Race Order', barrierOrder: 'Barrier Order',
top3Placement: 'Top-3 Placement', winScore: 'Win Potential' };
var displayName = nameMap[factor.name] || factor.name.charAt(0).toUpperCase() + factor.name.slice(1);
var label = document.createElement('div');
label.className = 'factor-label';
label.textContent = displayName + ': ' + pct + '%';
factorDiv.appendChild(label);
var bar = document.createElement('div');
bar.className = 'factor-bar';
var fill = document.createElement('div');
fill.className = 'factor-fill';
fill.style.width = width + '%';
fill.textContent = Math.round(factor.value);
bar.appendChild(fill);
factorDiv.appendChild(bar);
}
card.appendChild(factorDiv);
}
container.appendChild(card);
}
if (activeCount > 4) {
var otherP = document.createElement('p');
otherP.style.cssText = 'text-align:center; color:var(--text-muted); padding:12px; font-size:13px;';
otherP.textContent = '+ ' + (activeCount - 4) + ' other horses analyzed';
container.appendChild(otherP);
}
if (scratchedHorses.length > 0) {
var scratchedSection = document.createElement('div');
scratchedSection.style.cssText = 'margin-top:12px; padding-top:12px; border-top:1px solid var(--border);';
var scratchedTitle = document.createElement('p');
scratchedTitle.style.cssText = 'color:var(--accent-red); font-size:13px; font-weight:600; margin-bottom:8px;';
scratchedTitle.textContent = '[no] Scratched (' + scratchedHorses.length + ')';
scratchedSection.appendChild(scratchedTitle);
for (var si = 0; si < scratchedHorses.length; si++) {
var sh = scratchedHorses[si];
var scratchCard = document.createElement('div');
scratchCard.className = 'horse-card scratched-card';
scratchCard.innerHTML = '<div class="horse-top"><span class="horse-name">' + escapeHtml(sh.num + '. ' + sh.name) + '</span><span class="badge badge-scratched">SCRATCHED</span></div>';
scratchedSection.appendChild(scratchCard);
}
container.appendChild(scratchedSection);
}
}

// ── renderRaceInfoPanel ───────────────────────────────
function renderRaceInfoPanel() {
var raceInfoEl = document.getElementById('raceInfo');
raceInfoEl.innerHTML = '';
var h3 = document.createElement('h3');
h3.textContent = (app.raceInfo.track || '') + ' ' + (app.raceInfo.race || '') + (app.raceInfo.name ? ' -- ' + app.raceInfo.name : '');
raceInfoEl.appendChild(h3);
var p = document.createElement('p');
p.textContent = (app.raceInfo.distance || '') + ' . ' + (app.raceInfo.condition || '');
raceInfoEl.appendChild(p);
if (app.raceInfo.temperature || app.raceInfo.railPosition) {
var weatherRail = document.createElement('div');
weatherRail.className = 'weather-rail';
if (app.raceInfo.temperature) { var d = document.createElement('div'); d.innerHTML = '<span class="label">Temp:</span> <span class="value">' + escapeHtml(app.raceInfo.temperature) + '</span>'; weatherRail.appendChild(d); }
if (app.raceInfo.wind) { var d = document.createElement('div'); d.innerHTML = '<span class="label">Wind:</span> <span class="value">' + escapeHtml(app.raceInfo.wind) + '</span>'; weatherRail.appendChild(d); }
if (app.raceInfo.humidity) { var d = document.createElement('div'); d.innerHTML = '<span class="label">Humidity:</span> <span class="value">' + escapeHtml(app.raceInfo.humidity) + '</span>'; weatherRail.appendChild(d); }
if (app.raceInfo.railPosition) { var d = document.createElement('div'); d.innerHTML = '<span class="label">Rail:</span> <span class="value">' + escapeHtml(app.raceInfo.railPosition) + '</span>'; weatherRail.appendChild(d); }
raceInfoEl.appendChild(weatherRail);
}
raceInfoEl.classList.remove('hidden');
}
function renderLiveBetPanel() {
  var container = document.getElementById('consensusAdvisor');
  if (!container) return;
  var horses = (app.horses || []).filter(function(h){ return !h.scratched; });
  if (horses.length === 0) return;

  // ── Score field with each model, get their top 3 ─────────────────────────
  var modelDefs = [
    { key:'base',    label:'Base', icon:'🧠', weights: app.baseWeights    },
    { key:'custom',  label:'Kimi', icon:'🔵', weights: app.customWeights  },
    { key:'custom2', label:'Grok', icon:'🟠', weights: app.custom2Weights },
    { key:'custom3', label:'GPT',  icon:'🟢', weights: app.custom3Weights }
  ];

  var prevW = app.W;
  var modelPicks = {};
  modelDefs.forEach(function(m) {
    if (!m.weights) return;
    var tf = JSON.parse(JSON.stringify(horses));
    app.W = m.weights;
    scoreHorses(tf);
    // Grok is a Top-2 Hunter — only returns 2 picks
    var maxPicks = m.key === 'custom2' ? 2 : 3;
    modelPicks[m.key] = tf.slice(0, maxPicks);
  });
  app.W = prevW;

  // ── Derive best bets per model ────────────────────────────────────────────
  // Each model recommends based on its own top picks + odds profile
  // Classify a 2-hit result — are the hits in positions useful for quinella?
  // Returns: 'quinella' (pred1+pred2 both in frame), '1+3' (pred1+pred3), '2+3', 'other'
  function classify2Hits(pred1Name, pred2Name, pred3Name, actual1Name, actual2Name, actual3Name) {
    var actuals = [actual1Name, actual2Name, actual3Name].filter(Boolean);
    var p1hit = actuals.indexOf(pred1Name) !== -1;
    var p2hit = pred2Name && actuals.indexOf(pred2Name) !== -1;
    var p3hit = pred3Name && actuals.indexOf(pred3Name) !== -1;
    // Quinella: both pred1 and pred2 in actual top 2 (any order)
    var actualTop2 = [actual1Name, actual2Name].filter(Boolean);
    var quinellaHit = p1hit && p2hit &&
      actualTop2.indexOf(pred1Name) !== -1 && actualTop2.indexOf(pred2Name) !== -1;
    if (quinellaHit) return 'quinella';
    if (p1hit && p3hit && !p2hit) return '1+3';
    if (p2hit && p3hit && !p1hit) return '2+3';
    if (p1hit && p2hit) return '1+2_not_quinella'; // in frame but not both in top 2
    return 'other';
  }

  function modelBet(key) {
    var top = modelPicks[key] || [];
    var p1 = top[0], p2 = top[1], p3 = top[2];
    if (!p1) return null;

    var o1 = p1.odds || 99, o2 = p2 ? p2.odds||99 : 99, o3 = p3 ? p3.odds||99 : 99;
    var gap  = p2 ? (p1.prob||0) - (p2.prob||0) : 99;
    var conf = p1.prob || 0;

    // Decision logic — each model has a personality
    var betType, horses, stake, rationale;

    if (key === 'custom') {
      // Kimi: Form-First — likes quinellas when both horses have form
      if (o1 <= 5 && conf >= 40) {
        betType = 'win'; horses = [p1.name]; stake = 15;
        rationale = 'Strong favourite, form confirms';
      } else if (p2 && o1 <= 10 && o2 <= 12) {
        betType = 'quinella'; horses = [p1.name, p2.name]; stake = 5;
        rationale = 'Both horses show form';
      } else if (p3 && gap < 8) {
        betType = 'boxed_trifecta'; horses = [p1.name, p2.name, p3.name]; stake = 6;
        rationale = 'Tight field — box the top 3';
      } else {
        betType = 'quinella'; horses = [p1.name, p2.name||'']; stake = 3;
        rationale = 'Low confidence — small quinella';
      }
    } else if (key === 'custom2') {
      // Grok: Top-2 Hunter — odds-focused, backs short pairs
      if (o1 <= 4) {
        betType = 'win'; horses = [p1.name]; stake = 20;
        rationale = 'Short favourite — back to win';
      } else if (p2 && o1 <= 8 && o2 <= 10) {
        betType = 'quinella'; horses = [p1.name, p2.name]; stake = 8;
        rationale = 'Short pair — quinella value';
      } else if (o1 <= 8) {
        betType = 'win'; horses = [p1.name]; stake = 10;
        rationale = 'Reasonable favourite';
      } else {
        betType = 'quinella'; horses = [p1.name, p2 ? p2.name : '']; stake = 3;
        rationale = 'Wide open — minimal play';
      }
    } else if (key === 'custom3') {
      // GPT: Place Finder — focuses on getting horses into the frame
      if (p3 && o1 <= 8 && o2 <= 12 && o3 <= 20) {
        betType = 'boxed_trifecta'; horses = [p1.name, p2.name, p3.name]; stake = 6;
        rationale = 'Track condition suits all 3';
      } else if (p2 && conf >= 45) {
        betType = 'quinella'; horses = [p1.name, p2.name]; stake = 5;
        rationale = 'High confidence in top 2';
      } else if (o1 <= 6) {
        betType = 'win'; horses = [p1.name]; stake = 12;
        rationale = 'Short price with strong finish';
      } else {
        betType = 'quinella'; horses = [p1.name, p2 ? p2.name : '']; stake = 3;
        rationale = 'Conservative play';
      }
    } else {
      // Base: balanced signal-count approach
      var sigOddsShort = o1 <= 5;
      var sigTop2Short = p2 && o2 <= 8;
      var sigPattern   = !!(p1.patternMatches > 0);
      var sigMargin    = gap >= 6;
      var signals = [sigOddsShort, sigTop2Short, sigPattern, sigMargin].filter(Boolean).length;
      if (signals >= 3) {
        if (o1 <= 5) { betType='win'; horses=[p1.name]; stake=15; rationale='Strong signals — back the win'; }
        else { betType='boxed_trifecta'; horses=[p1.name,p2?p2.name:'',p3?p3.name:'']; stake=6; rationale='Strong signals — box trifecta'; }
      } else if (signals >= 2) {
        betType = 'quinella'; horses = [p1.name, p2 ? p2.name : '']; stake = 5;
        rationale = 'Moderate confidence';
      } else {
        return null;
      }
    }

    horses = horses.filter(Boolean);
    if (horses.length === 0) return null;

    return { key:key, label: modelDefs.find(function(m){return m.key===key;}).label,
             icon: modelDefs.find(function(m){return m.key===key;}).icon,
             betType:betType, horses:horses, stake:stake, rationale:rationale,
             top1: p1, top2: p2||null, top3: p3||null };
  }

  var bets = modelDefs.map(function(m){ return modelBet(m.key); }).filter(Boolean);

  // ── Build HTML ────────────────────────────────────────────────────────────
  var typeLabel = { win:'Win', quinella:'Quinella', boxed_trifecta:'Box Trifecta' };

  var html = '<div style="background:var(--bg-card);border:1px solid var(--border);border-left:4px solid var(--accent-gold);border-radius:14px;padding:16px;margin-bottom:16px;">';
  html += '<h4 style="color:var(--accent-gold);font-size:15px;font-weight:700;margin-bottom:12px;">🎯 Live Consensus Advisor</h4>';

  if (bets.length === 0) {
    html += '<p style="color:var(--text-muted);font-size:13px;">No high-confidence bets this race. Low signal — skip or watch.</p>';
  } else {
    // Tally horse appearances across all model bets for consensus highlight
    var horseCounts = {};
    bets.forEach(function(b) {
      b.horses.forEach(function(n) {
        if (n) horseCounts[n] = (horseCounts[n] || 0) + 1;
      });
    });
    var consensusHorses = Object.keys(horseCounts).filter(function(n){ return horseCounts[n] >= 2; });

    if (consensusHorses.length > 0) {
      html += '<div style="background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.3);border-radius:10px;padding:10px 12px;margin-bottom:12px;">';
      html += '<span style="color:#10b981;font-weight:700;font-size:13px;">🤝 Consensus: </span>';
      html += '<span style="color:var(--text-primary);font-size:13px;">' + consensusHorses.join(', ') + '</span>';
      html += '<span style="color:var(--text-muted);font-size:11px;margin-left:6px;">(' + consensusHorses.length + ' horse' + (consensusHorses.length > 1 ? 's' : '') + ' backed by 2+ models)</span>';
      html += '</div>';
    }

    bets.forEach(function(b) {
      var modelColors = { base:'#10b981', custom:'#a855f7', custom2:'#f59e0b', custom3:'#06b6d4' };
      var col = modelColors[b.key] || '#94a3b8';
      html += '<div style="display:grid;grid-template-columns:auto 1fr auto;gap:8px;align-items:center;padding:8px 10px;background:var(--bg-input);border-radius:8px;margin-bottom:6px;border-left:3px solid ' + col + ';">';
      html += '<span style="font-size:14px;">' + b.icon + '</span>';
      html += '<div>';
      html += '<div style="font-size:12px;font-weight:700;color:' + col + ';">' + b.label + ' → ' + (typeLabel[b.betType] || b.betType) + '</div>';
      html += '<div style="font-size:12px;color:var(--text-primary);">' + b.horses.join(' + ') + '</div>';
      html += '<div style="font-size:11px;color:var(--text-muted);">' + b.rationale + '</div>';
      html += '</div>';
      html += '<div style="text-align:right;">';
      html += '<div style="font-size:13px;font-weight:700;color:var(--accent-gold);">$' + b.stake + '</div>';
      html += '<button onclick="app.quickAddBet(' + JSON.stringify(b.betType) + ',' + JSON.stringify(b.horses) + ')" style="font-size:10px;padding:3px 8px;border-radius:6px;border:none;background:var(--accent-green);color:white;cursor:pointer;margin-top:3px;">+ Add</button>';
      html += '</div>';
      html += '</div>';
    });
  }
  html += '</div>';

  container.innerHTML = html;
};

// Record result for ALL models simultaneously
function renderActivityLog() {
var list = document.getElementById('activityLogList');
if (!list) return;
if (app.activityLog.length === 0) {
list.innerHTML = '<p style="color:#475569;">No activity yet.</p>';
return;
}
var html = '';
for (var i = 0; i < app.activityLog.length; i++) {
var e = app.activityLog[i];
var icon = LOG_ICONS[e.type] || 'ℹ';
var color = LOG_COLORS[e.type] || '#94a3b8';
var modelBadge = '<span style="background:rgba(148,163,184,0.15); color:#94a3b8; font-size:10px; padding:1px 5px; border-radius:4px; margin-right:4px;">' + e.model + '</span>';
html += '<div style="padding:5px 0; border-bottom:1px solid #1e293b; display:flex; gap:6px; align-items:flex-start;">';
html += '<span style="color:' + color + '; flex-shrink:0;">' + icon + '</span>';
html += '<div style="flex:1; min-width:0;">';
html += '<div style="display:flex; align-items:center; gap:4px; flex-wrap:wrap;">';
html += modelBadge;
html += '<span style="color:' + color + '; font-weight:600;">' + escapeHtml(e.message) + '</span>';
html += '</div>';
if (e.detail) html += '<div style="color:#475569; margin-top:1px; word-break:break-word;">' + escapeHtml(e.detail) + '</div>';
html += '<div style="color:#334155; font-size:10px;">' + e.ts + '</div>';
html += '</div></div>';
}
list.innerHTML = html;
}
app.toggleActivityLog = function() {
var panel = document.getElementById('activityLogPanel');
var isHidden = panel.classList.contains('hidden');
document.getElementById('pendingPanel').classList.add('hidden');
document.getElementById('historyPanel').classList.add('hidden');
document.getElementById('bettingPanel').classList.add('hidden');
document.getElementById('venueProfilesPanel').classList.add('hidden');
if (isHidden) {
renderActivityLog();
panel.classList.remove('hidden');
} else {
panel.classList.add('hidden');
}
};

app.toggleVenueProfiles = function() {
var panel = document.getElementById('venueProfilesPanel');
var isHidden = panel.classList.contains('hidden');
document.getElementById('pendingPanel').classList.add('hidden');
document.getElementById('historyPanel').classList.add('hidden');
document.getElementById('bettingPanel').classList.add('hidden');
document.getElementById('activityLogPanel').classList.add('hidden');
if (isHidden) {
app.renderVenueProfiles();
panel.classList.remove('hidden');
} else {
panel.classList.add('hidden');
}
};

app.renderVenueProfiles = function() {
var container = document.getElementById('venueProfilesList');
var tracks = Object.keys(app.venueProfiles);
// Update count badge
var countEl = document.getElementById('venueCount');
if (countEl) countEl.textContent = tracks.length;
if (!tracks.length) {
container.innerHTML = '<p style="color:#475569; font-size:13px; padding:12px;">No venue data yet. Race results from different tracks will build profiles automatically.</p>';
return;
}
// Sort by most races
tracks.sort(function(a,b) { return (app.venueProfiles[b].races||0) - (app.venueProfiles[a].races||0); });
var fLabels = { odds:'Odds', form1:'Form', trackWin:'Track Record', jockeyWin:'Jockey', trainerWin:'Trainer',
freshness:'Freshness', formConsistency:'Consistency', tactical:'Tactical', trackCondition:'Track Cond',
distanceSuit:'Distance', lastStartMargin:'Last Margin', gearChange:'Gear', railPosition:'Rail',
pacePressure:'Pace', classChange:'Class', formMomentum:'Momentum', finishStrength:'Finish',
sectionalSpeed:'Sectional', weatherRailBias:'Weather/Rail' };
var html = '';
tracks.forEach(function(key) {
var vp = app.venueProfiles[key];
var winPct  = vp.races > 0 ? Math.round((vp.wins/vp.races)*100) : 0;
var top3Pct = vp.races > 0 ? Math.round((vp.top3/vp.races)*100) : 0;
var blendPct = Math.round(Math.min(35, vp.races * 1));
var barColor = top3Pct >= 70 ? '#10b981' : top3Pct >= 50 ? '#f59e0b' : '#ef4444';
// Sort factors by deviation from 1.0
var factors = Object.keys(vp.multipliers || {});
factors.sort(function(a,b) { return Math.abs((vp.multipliers[b]||1)-1) - Math.abs((vp.multipliers[a]||1)-1); });
var topFactors = factors.slice(0,8);
html += '<div style="background:rgba(3,105,161,0.08); border:1px solid #0369a1; border-radius:10px; padding:14px; margin-bottom:10px;">';
html += '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">';
html += '<div><span style="color:#38bdf8; font-weight:700; font-size:14px;">🗺 ' + key.charAt(0).toUpperCase() + key.slice(1) + '</span>';
html += ' <span style="color:#475569; font-size:11px;">(' + vp.races + ' races | blend: ' + blendPct + '%' + (vp.races < 3 ? ' - need 3+ to activate' : '') + ')</span></div>';
html += '<div style="text-align:right;">';
html += '<span style="color:' + barColor + '; font-weight:700; font-size:13px;">' + top3Pct + '% top-3</span>';
html += ' <span style="color:#94a3b8; font-size:11px;">| ' + winPct + '% wins</span>';
html += '</div></div>';
// Factor multiplier bars
html += '<div style="display:grid; grid-template-columns:1fr 1fr; gap:4px; margin-top:6px;">';
topFactors.forEach(function(f) {
var m = vp.multipliers[f] || 1.0;
var dev = m - 1.0;
var label = fLabels[f] || f;
var color = dev > 0.05 ? '#10b981' : dev < -0.05 ? '#ef4444' : '#94a3b8';
var sign = dev >= 0 ? '+' : '';
var barW = Math.min(100, Math.abs(dev) * 300);
html += '<div style="display:flex; align-items:center; gap:6px;">';
html += '<span style="color:#94a3b8; font-size:10px; min-width:72px;">' + label + '</span>';
html += '<div style="flex:1; background:rgba(255,255,255,0.05); border-radius:3px; height:6px; position:relative;">';
if (dev > 0) html += '<div style="background:' + color + '; width:' + barW + '%; height:6px; border-radius:3px; margin-left:50%; transform:translateX(-100%); max-width:50%;"></div>';
else if (dev < 0) html += '<div style="background:' + color + '; width:' + barW + '%; height:6px; border-radius:3px; float:right; max-width:50%;"></div>';
html += '</div>';
html += '<span style="color:' + color + '; font-size:10px; min-width:36px; text-align:right;">' + sign + Math.round(dev*100) + '%</span>';
html += '</div>';
});
html += '</div>';
if (vp.races < 3) html += '<p style="color:#475569; font-size:10px; margin-top:6px;">Profile building... ' + (3 - vp.races) + ' more races needed before it influences predictions.</p>';
html += '</div>';
});
container.innerHTML = html;
};

app.clearVenueProfiles = function() {
app.venueProfiles = {};
saveData();
app.renderVenueProfiles();
var countEl = document.getElementById('venueCount');
if (countEl) countEl.textContent = '0';
showSuccess('Venue profiles cleared.');
};

// ── Day Monitor ──
// Read-only report of what the learning code did today.
// Reads from raceHistory — never touches weights.

app.updateMonitorButton = function() {
var today = new Date().toLocaleDateString();
var todayRaces = app.raceHistory.filter(function(r) { return r.date === today; });
var btn = document.getElementById('monitorBtn');
var lbl = document.getElementById('monitorRaceCount');
if (!btn || !lbl) return;
var n = todayRaces.length;
if (n >= 10) {
btn.disabled = false;
btn.style.opacity = '1';
btn.style.cursor = 'pointer';
lbl.textContent = '(' + n + ' races today)';
} else {
btn.disabled = true;
btn.style.opacity = '0.45';
btn.style.cursor = 'not-allowed';
lbl.textContent = '(need 10 races today — ' + n + '/' + 10 + ')';
}
};

app.openMonitor = function() {
var today = new Date().toLocaleDateString();
var todayRaces = app.raceHistory.filter(function(r) { return r.date === today; });
if (todayRaces.length < 10) { showError('Need at least 10 races today to open the monitor.'); return; }

// Close other panels
['pendingPanel','historyPanel','bettingPanel','activityLogPanel','venueProfilesPanel'].forEach(function(id) {
var el = document.getElementById(id);
if (el) el.classList.add('hidden');
});

var panel = document.getElementById('monitorPanel');
var dateLabel = document.getElementById('monitorDateLabel');
var body = document.getElementById('monitorBody');
dateLabel.textContent = 'Showing ' + todayRaces.length + ' races recorded today  ' + today;
body.innerHTML = app.buildMonitorReport(todayRaces);
panel.classList.remove('hidden');
panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

app.buildMonitorReport = function(races) {
var modelNames = { base:app.getModelName('base'), custom:app.getModelName('custom'), custom2:app.getModelName('custom2'), custom3:app.getModelName('custom3'), saturday:app.getModelName('saturday') };
var modelColors = { base:'#10b981', custom:'#a855f7', custom2:'#f59e0b', custom3:'#06b6d4', saturday:'#fca5a5' };
var defW = app.defaultWeights;
var weightLabels = {
odds:'Odds', form1:'Form (1st)', form2:'Form (2nd)', formConsistency:'Consistency',
trackWin:'Track Record', trackDistWin:'Track+Dist', jockeyWin:'Jockey', trainerWin:'Trainer',
freshness:'Freshness', tactical:'Tactical', trackCondition:'Track Condition',
distanceSuit:'Distance', lastStartMargin:'Last Margin', railPosition:'Rail',
gearChange:'Gear Change', pacePressure:'Pace', classChange:'Class Change',
formMomentum:'Momentum', finishStrength:'Finish Str', sectionalSpeed:'Sectional',
weatherRailBias:'Weather/Rail', careerWin:'Career Win', rating:'Rating'
};

// ── Section 1: Day summary stats ──
var wins=0, top2=0, top3=0, misses=0, exactas=0, trifectas=0;
var modelBreakdown = {};
races.forEach(function(r) {
if (r.correct) wins++;
if (r.top2) top2++;
if (r.top3) top3++;
if (!r.correct && !r.top3) misses++;
if (r.exacta) exactas++;
if (r.trifecta) trifectas++;
var m = r.model || 'base';
if (!modelBreakdown[m]) modelBreakdown[m] = { races:0, wins:0, top3:0 };
modelBreakdown[m].races++;
if (r.correct) modelBreakdown[m].wins++;
if (r.top3) modelBreakdown[m].top3++;
});
var n = races.length;
var winPct = Math.round((wins/n)*100);
var top3Pct = Math.round((top3/n)*100);
var perfColor = top3Pct >= 70 ? '#10b981' : top3Pct >= 50 ? '#f59e0b' : '#ef4444';
var perfLabel = top3Pct >= 70 ? 'Target Hit' : top3Pct >= 50 ? 'Getting There' : 'Below Target';

var html = '';

// Summary strip
html += '<div style="display:grid; grid-template-columns:repeat(4,1fr); gap:8px; margin-bottom:16px;">';
var stats = [
{ val: n, lbl: 'Races', color: '#a5b4fc' },
{ val: winPct+'%', lbl: 'Win Rate', color: wins/n >= 0.3 ? '#10b981' : '#ef4444' },
{ val: top3Pct+'%', lbl: 'Top-3 Rate', color: perfColor },
{ val: misses, lbl: 'Misses', color: misses > n*0.5 ? '#ef4444' : '#94a3b8' }
];
stats.forEach(function(s) {
html += '<div style="background:rgba(99,102,241,0.1); border:1px solid #312e81; border-radius:10px; padding:12px 8px; text-align:center;">';
html += '<div style="font-size:22px; font-weight:700; color:'+s.color+'; font-family:monospace;">'+s.val+'</div>';
html += '<div style="font-size:11px; color:#6366f1; margin-top:3px;">'+s.lbl+'</div>';
html += '</div>';
});
html += '</div>';

// Performance verdict
html += '<div style="background:rgba('+( top3Pct>=70?'16,185,129':top3Pct>=50?'245,158,11':'239,68,68' )+',0.1); border:1px solid '+perfColor+'; border-radius:10px; padding:12px 16px; margin-bottom:16px; display:flex; align-items:center; gap:12px;">';
html += '<div style="font-size:28px;">'+(top3Pct>=70?'🎯':top3Pct>=50?'🟡':'❌')+'</div>';
html += '<div><div style="color:'+perfColor+'; font-weight:700; font-size:15px;">'+perfLabel+' — '+top3Pct+'% top-3 accuracy today</div>';
html += '<div style="color:#94a3b8; font-size:12px; margin-top:2px;">'+wins+' wins · '+top3+' top-3 hits · '+exactas+' exactas · '+trifectas+' trifectas</div></div>';
html += '</div>';

// ── Section 2: Model breakdown ──
var modelKeys = Object.keys(modelBreakdown);
if (modelKeys.length > 1) {
html += '<div style="background:rgba(15,23,42,0.6); border:1px solid #1e2740; border-radius:10px; padding:14px; margin-bottom:16px;">';
html += '<div style="color:#6366f1; font-weight:700; font-size:13px; margin-bottom:10px; letter-spacing:0.5px;">MODEL BREAKDOWN TODAY</div>';
modelKeys.forEach(function(m) {
var mb = modelBreakdown[m];
var mc = modelColors[m] || '#a5b4fc';
var mn = modelNames[m] || m;
var mt3 = mb.races > 0 ? Math.round((mb.top3/mb.races)*100) : 0;
var mwin = mb.races > 0 ? Math.round((mb.wins/mb.races)*100) : 0;
var barW = Math.min(100, mt3);
var barC = mt3 >= 70 ? '#10b981' : mt3 >= 50 ? '#f59e0b' : '#ef4444';
html += '<div style="margin-bottom:8px;">';
html += '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:3px;">';
html += '<span style="color:'+mc+'; font-weight:600; font-size:13px;">'+mn+'</span>';
html += '<span style="color:#94a3b8; font-size:12px;">'+mb.races+' races · '+mwin+'% wins · <span style="color:'+barC+'">'+mt3+'% top-3</span></span>';
html += '</div>';
html += '<div style="background:#1e2740; border-radius:4px; height:6px;">';
html += '<div style="background:'+barC+'; width:'+barW+'%; height:6px; border-radius:4px; transition:width 0.4s;"></div>';
html += '</div></div>';
});
html += '</div>';
}

// ── Section 3: Weight shift report ──
// Compare current weights to defaults for each model that raced today
html += '<div style="background:rgba(15,23,42,0.6); border:1px solid #1e2740; border-radius:10px; padding:14px; margin-bottom:16px;">';
html += '<div style="color:#6366f1; font-weight:700; font-size:13px; margin-bottom:4px; letter-spacing:0.5px;">WHAT THE LEARNING CODE DID TODAY</div>';
html += '<div style="color:#475569; font-size:11px; margin-bottom:10px;">Compares current weights to factory defaults — shows what learning has pushed up or down</div>';

var weightSets = {
base:     { weights: app.baseWeights,     label: 'BasePredictor', color: '#10b981' },
custom:   { weights: app.customWeights,   label: app.getModelName('custom'),   color: '#a855f7' },
custom2:  { weights: app.custom2Weights,  label: app.getModelName('custom2'),  color: '#f59e0b' },
custom3:  { weights: app.custom3Weights,  label: app.getModelName('custom3'),  color: '#06b6d4' },
saturday: { weights: app.saturdayWeights, label: 'Saturday', color: '#fca5a5' }
};
// Only show models that raced today, plus always show the active model
var modelsToShow = {};
races.forEach(function(r) { if (r.model) modelsToShow[r.model] = true; });
modelsToShow[app.activeModel] = true;

Object.keys(modelsToShow).forEach(function(mKey) {
var ws = weightSets[mKey];
if (!ws || !ws.weights) return;
var shifts = [];
Object.keys(weightLabels).forEach(function(k) {
if (ws.weights[k] === undefined || defW[k] === undefined) return;
var cur = ws.weights[k];
var def = defW[k];
var pct = Math.round(((cur - def) / def) * 100);
if (Math.abs(pct) >= 1) shifts.push({ key: k, label: weightLabels[k], cur: cur, def: def, pct: pct });
});
shifts.sort(function(a,b) { return Math.abs(b.pct) - Math.abs(a.pct); });

html += '<div style="margin-bottom:14px;">';
html += '<div style="color:'+ws.color+'; font-weight:700; font-size:13px; margin-bottom:8px; padding-bottom:4px; border-bottom:1px solid #1e2740;">'+ws.label+(mKey===app.activeModel?' (active)':'')+'</div>';

if (shifts.length === 0) {
html += '<div style="color:#475569; font-size:12px; padding:6px 0;">No significant weight shifts yet — weights still at defaults.</div>';
} else {
// Top movers — show up to 12
var show = shifts.slice(0, 12);
html += '<div style="display:grid; grid-template-columns:1fr 1fr; gap:4px;">';
show.forEach(function(s) {
var dir = s.pct > 0 ? '+' : '';
var col = s.pct > 0 ? '#10b981' : '#ef4444';
var barMax = 40; // 40% shift = full bar
var barW = Math.min(100, (Math.abs(s.pct) / barMax) * 100);
html += '<div style="display:flex; align-items:center; gap:6px; padding:4px 0;">';
html += '<span style="color:#6b7280; font-size:10px; min-width:80px; flex-shrink:0;">'+s.label+'</span>';
html += '<div style="flex:1; background:#1e2740; border-radius:3px; height:14px; position:relative; overflow:hidden;">';
html += '<div style="background:'+col+'; width:'+barW+'%; height:100%; border-radius:3px; opacity:0.7;"></div>';
html += '<span style="position:absolute; left:5px; top:0; line-height:14px; font-size:9px; color:#e8ecf4; font-weight:600;">'+dir+s.pct+'%</span>';
html += '</div></div>';
});
html += '</div>';
if (shifts.length > 12) {
html += '<div style="color:#475569; font-size:11px; margin-top:6px;">+' + (shifts.length-12) + ' more factors with smaller shifts</div>';
}
}
html += '</div>';
});
html += '</div>';

// ── Section 4: Race-by-race breakdown ──
html += '<div style="background:rgba(15,23,42,0.6); border:1px solid #1e2740; border-radius:10px; padding:14px; margin-bottom:16px;">';
html += '<div style="color:#6366f1; font-weight:700; font-size:13px; margin-bottom:10px; letter-spacing:0.5px;">RACE-BY-RACE BREAKDOWN</div>';
races.forEach(function(r, i) {
var mc = modelColors[r.model||'base'] || '#a5b4fc';
var mn = modelNames[r.model||'base'] || r.model;
var hits = r.top3Hits;
if (hits === undefined || hits === null) {
  // Recalculate from names
  hits = 0;
  var _pn = [r.predicted, r.predicted2, r.predicted3].filter(Boolean);
  var _an = [r.actual, r.actual2, r.actual3].filter(Boolean);
  _pn.forEach(function(n){ if (_an.indexOf(n) !== -1) hits++; });
  if (hits === 0 && r.correct) hits = 1;
}
var icon = r.correct ? '✅' : hits >= 3 ? '🎰' : hits >= 2 ? '🎯' : '❌';
var iconCol = r.correct ? '#10b981' : hits >= 3 ? '#a855f7' : hits >= 2 ? '#3b82f6' : '#ef4444';
var raceLabel = r.race || ('Race '+(i+1));
var borderCol = r.correct ? '#10b981' : hits >= 3 ? '#a855f7' : hits >= 2 ? '#3b82f6' : '#374151';

html += '<div style="border-left:3px solid '+borderCol+'; padding:8px 10px; margin-bottom:6px; background:rgba(255,255,255,0.02); border-radius:0 6px 6px 0;">';
html += '<div style="display:flex; justify-content:space-between; align-items:center;">';
html += '<div style="display:flex; align-items:center; gap:8px;">';
html += '<span style="color:'+iconCol+'; font-size:13px;">'+icon+'</span>';
html += '<span style="color:#e8ecf4; font-weight:600; font-size:13px;">'+raceLabel+'</span>';
html += '<span style="color:'+mc+'; font-size:10px; background:rgba(0,0,0,0.3); padding:2px 7px; border-radius:10px;">'+mn+'</span>';
html += '</div>';
html += '<span style="color:'+iconCol+'; font-size:12px; font-weight:700;">'+hits+'/3</span>';
html += '</div>';
html += '<div style="color:#6b7280; font-size:11px; margin-top:4px;">';
html += 'Picked: <span style="color:#a5b4fc;">'+r.predicted+'</span>';
if (r.predicted2) html += ', <span style="color:#a5b4fc;">'+r.predicted2+'</span>';
if (r.predicted3) html += ', <span style="color:#a5b4fc;">'+r.predicted3+'</span>';
html += '  &rarr;  Actual: <span style="color:'+(r.correct?'#10b981':'#fca5a5')+';">'+r.actual+'</span>';
if (r.actual2) html += ', <span style="color:#94a3b8;">'+r.actual2+'</span>';
if (r.actual3) html += ', <span style="color:#94a3b8;">'+r.actual3+'</span>';
html += '</div>';
// Show the learning msg in a muted way — read only, just observing
if (r.learnMsg) {
html += '<div style="color:#374151; font-size:10px; margin-top:3px; font-style:italic; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; max-width:100%;">'+r.learnMsg+'</div>';
}
html += '</div>';
});
html += '</div>';

// ── Section 5: What the model needs to work on ──
var factorSuccessMap = {};
var factorFailMap = {};
races.forEach(function(r) {
var wf = r.winnerFactors;
if (!wf) return;
var fMap = {
odds: wf.goodOdds, form: wf.goodForm, track: wf.trackRecord,
jockey: wf.goodJockey, trainer: wf.goodTrainer, freshness: wf.optimalFreshness,
consistency: wf.consistentForm, tactical: wf.goodTactical, condition: wf.goodTrackCond,
firstUp: wf.goodFirstUp, distance: wf.goodDistance, margin: wf.closeLastStart,
gear: wf.gearBoost, rail: wf.railAdvantage, pace: wf.goodPace,
classChg: wf.goodClass, momentum: wf.goodMomentum, finStr: wf.goodFinStr,
sectional: wf.goodSectional, weather: wf.goodWeatherRail
};
var fLabels = { odds:'Odds', form:'Form', track:'Track Record', jockey:'Jockey', trainer:'Trainer',
freshness:'Freshness', consistency:'Consistency', tactical:'Tactical', condition:'Track Cond',
firstUp:'First Up', distance:'Distance', margin:'Last Margin', gear:'Gear',
rail:'Rail', pace:'Pace', classChg:'Class', momentum:'Momentum', finStr:'Finish',
sectional:'Sectional', weather:'Weather/Rail' };
Object.keys(fMap).forEach(function(k) {
if (fMap[k]) { factorSuccessMap[k] = (factorSuccessMap[k]||0) + 1; }
});
if (!r.correct) {
Object.keys(fMap).forEach(function(k) {
if (!fMap[k]) { factorFailMap[k] = (factorFailMap[k]||0) + 1; }
});
}
});

var successFactors = Object.keys(factorSuccessMap).sort(function(a,b){ return factorSuccessMap[b]-factorSuccessMap[a]; }).slice(0,5);
var struggleFactors = Object.keys(factorFailMap).sort(function(a,b){ return factorFailMap[b]-factorFailMap[a]; }).slice(0,5);
var fLabels2 = { odds:'Odds', form:'Form', track:'Track Record', jockey:'Jockey', trainer:'Trainer',
freshness:'Freshness', consistency:'Consistency', tactical:'Tactical', condition:'Track Cond',
firstUp:'First Up', distance:'Distance', margin:'Last Margin', gear:'Gear',
rail:'Rail', pace:'Pace', classChg:'Class', momentum:'Momentum', finStr:'Finish',
sectional:'Sectional', weather:'Weather/Rail' };

html += '<div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:16px;">';

// What worked
html += '<div style="background:rgba(16,185,129,0.06); border:1px solid rgba(16,185,129,0.2); border-radius:10px; padding:12px;">';
html += '<div style="color:#10b981; font-weight:700; font-size:12px; margin-bottom:8px; letter-spacing:0.4px;">WORKING WELL TODAY</div>';
if (successFactors.length === 0) {
html += '<div style="color:#475569; font-size:11px;">Not enough data</div>';
} else {
successFactors.forEach(function(k) {
var pct = Math.round((factorSuccessMap[k]/wins||1)*100);
html += '<div style="display:flex; justify-content:space-between; font-size:11px; padding:3px 0; border-bottom:1px solid rgba(16,185,129,0.1);">';
html += '<span style="color:#d1fae5;">'+(fLabels2[k]||k)+'</span>';
html += '<span style="color:#10b981; font-weight:700;">'+factorSuccessMap[k]+'x</span>';
html += '</div>';
});
}
html += '</div>';

// What isn't working
html += '<div style="background:rgba(239,68,68,0.06); border:1px solid rgba(239,68,68,0.2); border-radius:10px; padding:12px;">';
html += '<div style="color:#ef4444; font-weight:700; font-size:12px; margin-bottom:8px; letter-spacing:0.4px;">MISSING ON MISSES</div>';
if (struggleFactors.length === 0) {
html += '<div style="color:#475569; font-size:11px;">All good!</div>';
} else {
struggleFactors.forEach(function(k) {
html += '<div style="display:flex; justify-content:space-between; font-size:11px; padding:3px 0; border-bottom:1px solid rgba(239,68,68,0.1);">';
html += '<span style="color:#fecaca;">'+(fLabels2[k]||k)+'</span>';
html += '<span style="color:#ef4444; font-weight:700;">'+factorFailMap[k]+'x missed</span>';
html += '</div>';
});
}
html += '</div>';
html += '</div>';

// ── Section 6: Venue summary for today ──
var todayTracks = {};
races.forEach(function(r) { if (r.track) todayTracks[r.track] = (todayTracks[r.track]||0)+1; });
var trackKeys = Object.keys(todayTracks);
if (trackKeys.length > 0) {
html += '<div style="background:rgba(15,23,42,0.6); border:1px solid #1e2740; border-radius:10px; padding:14px;">';
html += '<div style="color:#6366f1; font-weight:700; font-size:13px; margin-bottom:10px; letter-spacing:0.5px;">TRACKS RACED TODAY</div>';
trackKeys.forEach(function(t) {
var vp = app.venueProfiles && app.venueProfiles[t.toLowerCase().trim()];
var vi = vp ? { races: vp.races, winPct: vp.races>0?Math.round((vp.wins/vp.races)*100):0, top3Pct: vp.races>0?Math.round((vp.top3/vp.races)*100):0 } : null;
html += '<div style="display:flex; align-items:center; justify-content:space-between; padding:6px 0; border-bottom:1px solid #1e2740;">';
html += '<span style="color:#e8ecf4; font-weight:600;">'+t+'</span>';
html += '<span style="color:#6b7280; font-size:11px;">'+todayTracks[t]+' races today';
if (vi && vi.races >= 3) {
  html += ' · Profile: '+vi.races+' total · '+vi.top3Pct+'% top-3';
  var vp3 = app.venueProfiles[t.toLowerCase().trim()];
  if (vp3 && vp3.bias) {
    html += ' · Bias: <span style="color:#f59e0b;">' + vp3.bias.rail + ' rail</span>';
    if (vp3.bias.speed !== 'mixed') html += ' / <span style="color:#818cf8;">' + vp3.bias.speed + ' pace</span>';
  }
}
else if (vi) html += ' · Profile building ('+vi.races+' races)';
else html += ' · No profile yet';
html += '</span></div>';
});
html += '</div>';
}

return html;
};

app.exportActivityLog = function() {
if (app.activityLog.length === 0) { showError('No activity to export.'); return; }
var entries = ['HORSE PREDICTOR - ACTIVITY LOG', 'Exported: ' + new Date().toLocaleString(), '============================================================', ''];
for (var i = 0; i < app.activityLog.length; i++) {
var e = app.activityLog[i];
entries.push('[' + e.ts + '] [' + e.model + '] [' + e.type.toUpperCase() + '] ' + e.message);
if (e.detail) entries.push('    ' + e.detail.replace(/\n/g, '\n    '));
}
var text = entries.join('\n');
try {
var blob2 = new Blob([text], { type: 'text/plain' });
var url2 = URL.createObjectURL(blob2);
var a = document.createElement('a');
a.href = url2;
a.download = 'activity-log-' + new Date().toISOString().slice(0,10) + '.txt';
document.body.appendChild(a);
a.click();
document.body.removeChild(a);
setTimeout(function() { URL.revokeObjectURL(url2); }, 1000);
showSuccess('Log exported (' + app.activityLog.length + ' entries)');
return;
} catch(err) {}
if (navigator.clipboard && navigator.clipboard.writeText) {
navigator.clipboard.writeText(text).then(function() {
showSuccess('Copied to clipboard (' + app.activityLog.length + ' entries) - paste into a text file to save.');
}).catch(function() { app._showLogModal(text); });
return;
}
app._showLogModal(text);
};
app._showLogModal = function(text) {
var existing = document.getElementById('logExportModal');
if (existing) existing.remove();
var overlay = document.createElement('div');
overlay.id = 'logExportModal';
overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.88);z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px;';
var box = document.createElement('div');
box.style.cssText = 'background:#131927;border:1px solid #2a3554;border-radius:14px;padding:20px;width:100%;max-width:700px;max-height:90vh;display:flex;flex-direction:column;gap:12px;';
box.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;">' +
'<span style="color:#e8ecf4;font-weight:600;font-size:15px;">📋 Activity Log Export</span>' +
'<button id="logModalClose" style="background:#dc2626;border:none;color:white;padding:5px 12px;border-radius:8px;cursor:pointer;font-size:13px;">✕ Close</button>' +
'</div>' +
'<p style="color:#94a3b8;font-size:12px;margin:0;">Direct download is blocked in this environment. Use the Copy button or select all and copy manually.</p>' +
'<textarea id="logExportText" style="flex:1;min-height:300px;background:#0a0e1a;border:1px solid #2a3554;border-radius:8px;color:#cbd5e1;font-family:monospace;font-size:11px;padding:10px;resize:vertical;"></textarea>' +
'<button id="logModalCopy" style="padding:11px;background:linear-gradient(135deg,#059669,#10b981);border:none;color:white;border-radius:10px;cursor:pointer;font-size:14px;font-weight:600;">📋 Copy All to Clipboard</button>';
overlay.appendChild(box);
document.body.appendChild(overlay);
document.getElementById('logModalClose').onclick = function() { overlay.remove(); };
var ta = document.getElementById('logExportText');
ta.value = text;
setTimeout(function() { ta.select(); }, 50);
document.getElementById('logModalCopy').onclick = function() {
ta.select();
if (navigator.clipboard && navigator.clipboard.writeText) {
navigator.clipboard.writeText(text).then(function() {
showSuccess('Copied!'); overlay.remove();
}).catch(function() { document.execCommand('copy'); showSuccess('Copied!'); });
} else {
document.execCommand('copy');
showSuccess('Copied!');
}
};
};
app.clearActivityLog = function() {
app.activityLog = [];
try { localStorage.removeItem('horseActivityLog'); } catch(e) {}
var countEl = document.getElementById('logCount');
if (countEl) countEl.textContent = '0';
renderActivityLog();
showSuccess('Activity log cleared.');
};
app.togglePending = function() {
var panel = document.getElementById('pendingPanel');
if (panel.classList.contains('hidden')) { renderPending(); panel.classList.remove('hidden'); document.getElementById('historyPanel').classList.add('hidden'); }
else panel.classList.add('hidden');
};
app.setHistoryFilter = function(filter) {
app.historyFilter = filter;
var filters = ['all', 'base', 'custom', 'custom2', 'custom3'];
var ids     = ['hfAll', 'hfBase', 'hfCustom', 'hfCustom2', 'hfCustom3', 'hfSaturday'];
var colors  = ['var(--accent-indigo)', 'var(--accent-green)', 'var(--accent-purple)', 'var(--accent-gold)', 'var(--accent-blue)', '#818cf8'];
for (var i = 0; i < filters.length; i++) {
var btn = document.getElementById(ids[i]);
if (!btn) continue;
if (filters[i] === filter) {
btn.style.background = colors[i];
btn.style.color = 'white';
} else {
btn.style.background = 'var(--bg-input)';
btn.style.color = 'var(--text-secondary)';
}
}
renderHistory();
};
app.toggleHistory = function() {
var panel = document.getElementById('historyPanel');
if (panel.classList.contains('hidden')) { renderHistory(); panel.classList.remove('hidden'); document.getElementById('pendingPanel').classList.add('hidden'); document.getElementById('bettingPanel').classList.add('hidden'); }
else panel.classList.add('hidden');
};
app.toggleBetting = function() {
var panel = document.getElementById('bettingPanel');
if (panel.classList.contains('hidden')) {
renderBettingStats();
panel.classList.remove('hidden');
document.getElementById('pendingPanel').classList.add('hidden');
document.getElementById('historyPanel').classList.add('hidden');
} else panel.classList.add('hidden');
};
function buildBetDropdown() {
if (!document.getElementById('betHorse')) return; // manual form removed
var optionsHTML = '<option value="">-- Pick horse --</option>';
for (var i = 0; i < app.horses.length; i++) {
if (app.horses[i].scratched) continue;
var h = app.horses[i];
optionsHTML += '<option value="' + escapeHtml(h.name) + '">' +
h.num + '. ' + escapeHtml(h.name) +
(h.odds ? ' ($' + h.odds.toFixed(2) + ')' : '') + '</option>';
}
var selectors = ['betHorse', 'betHorse1', 'betHorse2', 'betHorse3', 'betHorse4'];
for (var j = 0; j < selectors.length; j++) {
var sel = document.getElementById(selectors[j]);
if (sel) sel.innerHTML = optionsHTML;
}
}
app.updateBetInterface = function() {
if (!document.getElementById('betType')) return;
var betType = document.getElementById('betType').value;
var singleSelect = document.getElementById('singleHorseSelect');
var multiSelect = document.getElementById('multiHorseSelect');
var horse3 = document.getElementById('betHorse3');
var horse4 = document.getElementById('betHorse4');
var multiTypes = ['quinella','exacta','trifecta','boxed_trifecta','first4'];
if (multiTypes.indexOf(betType) !== -1) {
singleSelect.classList.add('hidden');
multiSelect.classList.remove('hidden');
if (betType === 'trifecta' || betType === 'boxed_trifecta') {
horse3.classList.remove('hidden');
if (horse4) horse4.classList.add('hidden');
} else if (betType === 'first4') {
horse3.classList.remove('hidden');
if (horse4) horse4.classList.remove('hidden');
} else {
horse3.classList.add('hidden');
if (horse4) horse4.classList.add('hidden');
}
} else {
singleSelect.classList.remove('hidden');
multiSelect.classList.add('hidden');
}
};
app.addBet = function() {
var betType = document.getElementById('betType').value;
var stake = parseFloat(document.getElementById('betStake').value);
if (!stake || stake <= 0) { showError('Enter a stake amount!'); return; }
var multiTypes = ['quinella','exacta','trifecta','boxed_trifecta','first4'];
if (multiTypes.indexOf(betType) !== -1) {
var horse1Name = document.getElementById('betHorse1').value;
var horse2Name = document.getElementById('betHorse2').value;
var horse3Name = (betType==='trifecta'||betType==='boxed_trifecta'||betType==='first4') ? document.getElementById('betHorse3').value : '';
var horse4Name = betType==='first4' ? (document.getElementById('betHorse4')||{}).value||'' : '';
if (!horse1Name || !horse2Name) { showError('Select at least 2 horses!'); return; }
if ((betType==='trifecta'||betType==='boxed_trifecta') && !horse3Name) { showError('Select 3 horses for trifecta!'); return; }
if (betType==='first4' && (!horse3Name||!horse4Name)) { showError('Select 4 horses for First 4!'); return; }
var selectedHorses = [horse1Name, horse2Name];
if (horse3Name) selectedHorses.push(horse3Name);
if (horse4Name) selectedHorses.push(horse4Name);
var uniqueHorses = selectedHorses.filter(function(h,i){ return h && selectedHorses.indexOf(h)===i; });
if (uniqueHorses.length !== selectedHorses.length) { showError('Cannot select the same horse multiple times!'); return; }
var typeLabels = {quinella:'Quinella',exacta:'Exacta',trifecta:'Trifecta',boxed_trifecta:'Boxed Trifecta',first4:'First 4'};
var bet = {
id: generateId(), horse: selectedHorses.join(' / '), horses: selectedHorses,
horseNum: '', odds: 0, type: betType, stake: stake,
race: (app.raceInfo.track || '') + ' ' + (app.raceInfo.race || ''), prob: 0
};
app.activeBets.push(bet);
renderActiveBets();
showSuccess((typeLabels[betType]||betType) + ' $' + stake.toFixed(2) + ' on ' + selectedHorses.join(', '));
['betHorse1','betHorse2','betHorse3','betHorse4'].forEach(function(id){ var el=document.getElementById(id); if(el) el.value=''; });
return;
}
var horseName = document.getElementById('betHorse').value;
if (!horseName) { showError('Pick a horse!'); return; }
var horse = null;
for (var i = 0; i < app.horses.length; i++) {
if (app.horses[i].name === horseName) { horse = app.horses[i]; break; }
}
if (!horse) { showError('Horse not found!'); return; }
var bet = {
id: generateId(),
horse: horseName,
horseNum: horse.num,
odds: horse.odds || 0,
type: betType,
stake: stake,
race: (app.raceInfo.track || '') + ' ' + (app.raceInfo.race || ''),
prob: horse.prob || 0
};
app.activeBets.push(bet);
renderActiveBets();
showSuccess(betType.charAt(0).toUpperCase() + betType.slice(1) + ' $' + stake.toFixed(2) + ' on ' + horseName);
document.getElementById('betHorse').value = '';
};
app.updateBetDiv = function(betId, divValue) {
  var div = parseFloat(divValue);
  if (isNaN(div) || div <= 0) return;
  for (var i = 0; i < app.activeBets.length; i++) {
    if (app.activeBets[i].id === betId) {
      app.activeBets[i].actualDiv = div;
      break;
    }
  }
};

app.removeBet = function(id) {
app.activeBets = app.activeBets.filter(function(b) { return b.id !== id; });
renderActiveBets();
};
function renderActiveBets() {
var container = document.getElementById('activeBets');
if (!container) return;
if (app.activeBets.length === 0) { container.innerHTML = ''; return; }
container.innerHTML = '';
var totalStake = 0;
for (var i = 0; i < app.activeBets.length; i++) {
var b = app.activeBets[i];
totalStake += b.type === 'eachway' ? b.stake * 2 : b.stake;
var div = document.createElement('div');
div.className = 'bet-entry';
var isMultiLeg = ['quinella','exacta','trifecta','boxed_trifecta','first4'].indexOf(b.type) !== -1;
var typeLabelsMap = {'win':'Win','place':'Place','eachway':'E/W','each-way':'E/W','exacta':'Exacta','quinella':'Quinella','trifecta':'Trifecta','boxed_trifecta':'Box Trifecta','first4':'First 4'}; var typeLabel = typeLabelsMap[b.type] || b.type.charAt(0).toUpperCase() + b.type.slice(1); if (b.fromConsensus) typeLabel = '[C] ' + typeLabel;
var potentialWin = b.odds > 0 ? '$' + (b.stake * b.odds).toFixed(2) : '?';
var divInputHtml = isMultiLeg
  ? ' <input type="number" placeholder="Div $?" min="1" step="0.5" value="' + (b.actualDiv || '') + '" style="width:80px; padding:3px 6px; background:var(--bg-input); border:1px solid var(--border); border-radius:4px; color:var(--text-primary); font-size:11px;" oninput="app.updateBetDiv(\'' + b.id + '\', this.value)" title="Enter actual TAB dividend">'
  : '';
div.innerHTML = '<span class="bet-info"><strong>' + escapeHtml(b.horse) + '</strong> ' + typeLabel + ' $' + b.stake.toFixed(2) + (b.odds > 0 ? ' @ $' + b.odds.toFixed(2) + ' -> ' + potentialWin : '') + divInputHtml + '</span>' +
'<button class="bet-remove" data-id="' + b.id + '">✕</button>';
div.querySelector('.bet-remove').onclick = (function(id) { return function() { app.removeBet(id); }; })(b.id);
container.appendChild(div);
}
var totalDiv = document.createElement('div');
totalDiv.style.cssText = 'text-align:right; color:var(--text-muted); font-size:12px; margin-top:4px;';
totalDiv.textContent = 'Total outlay: $' + totalStake.toFixed(2);
container.appendChild(totalDiv);
}
function buildConsensusForRace(pendingGroup) {
  // pendingGroup = array of pending entries for the SAME race, different models
  if (!pendingGroup || pendingGroup.length === 0) return null;
  var modelCount = pendingGroup.length;
  var modelNames = { base:app.getModelName('base'), custom:app.getModelName('custom'), custom2:app.getModelName('custom2'), custom3:app.getModelName('custom3'), saturday:app.getModelName('saturday') };
  var modelColors = { base:'#10b981', custom:'#a855f7', custom2:'#f59e0b', custom3:'#06b6d4', saturday:'#fca5a5' };

  // Gather all unique horses from all models
  var horseData = {};
  pendingGroup.forEach(function(pending) {
    var horses = (pending.horses || []).filter(function(h){ return !h.scratched; });
    // Always sort by score desc so rank = position in scored list
    horses.sort(function(a, b){ return (b.score || b.prob || 0) - (a.score || a.prob || 0); });
    horses.forEach(function(h, rank) {
      var n = h.name;
      if (!n) return;
      if (!horseData[n]) {
        horseData[n] = {
          name: n,
          num: h.num || h.silkNumber || h.barrier || '',
          odds: h.odds || 0,
          barrier: h.barrier || 0,
          totalScore: 0, voteCount: 0, top3Votes: 0,
          rankSum: 0, rankCount: 0,
          probSum: 0, scoreSum: 0,
          models: []
        };
      }
      // Keep best num we find across models
      if (!horseData[n].num && (h.num || h.silkNumber)) {
        horseData[n].num = h.num || h.silkNumber || '';
      }
      // Keep lowest (best) odds
      if (h.odds > 0 && (horseData[n].odds === 0 || h.odds < horseData[n].odds)) {
        horseData[n].odds = h.odds;
      }
      horseData[n].rankSum  += (rank + 1);
      horseData[n].rankCount++;
      horseData[n].scoreSum += (h.score || 0);
      horseData[n].probSum  += (h.prob  || 0);
      if (rank < 3) {
        horseData[n].top3Votes++;
        horseData[n].voteCount++;
      }
      horseData[n].models.push({
        model: pending.model,
        rank:  rank + 1,
        prob:  h.prob  || 0,
        score: h.score || 0
      });
    });
  });

  // Score each horse
  var horses = [];
  for (var k in horseData) { if (horseData.hasOwnProperty(k)) horses.push(horseData[k]); }
  horses.forEach(function(h) {
    h.avgRank  = h.rankCount > 0 ? h.rankSum  / h.rankCount : 99;
    h.avgProb  = h.rankCount > 0 ? h.probSum  / h.rankCount : 0;
    h.avgScore = h.rankCount > 0 ? h.scoreSum / h.rankCount : 0;
    h.agreement = h.voteCount / modelCount;
    // Primary: average score (most direct measure), secondary: rank & prob
    var scoreNorm = h.avgScore > 0 ? Math.min(1, h.avgScore / 500) : 0;
    var rankScore = Math.max(0, (10 - h.avgRank) / 10);
    var probScore = h.avgProb / 100;
    var valueScore = (h.odds > 0 && h.odds < 50) ? Math.min(1, 3 / h.odds) : 0;
    h.consensusScore = (scoreNorm * 0.40) + (rankScore * 0.30) + (probScore * 0.20) + (valueScore * 0.10);
    // Carry pattern match info from factor contributions if available
    h.patternMatches = h.patternMatches || (h.avgFactorContribs && h.avgFactorContribs.patternBonus > 0 ? 1 : 0);
    // Base confidence from consensus score
var baseConf = Math.min(99, Math.round(h.consensusScore * 100));
// Field size penalty: more runners = more uncertainty
var fieldSizeConf = pendingGroup.length > 0 ? pendingGroup[0].horses ? pendingGroup[0].horses.length : 12 : 12;
fieldSizeConf = parseInt(fieldSizeConf) || 12;
var fieldPenalty = Math.max(0, (fieldSizeConf - 8) * 0.8);
// Data quality: presence of odds, form, track data
var hasOdds = h.odds > 0 && h.odds < 100 ? 0 : 8;
var hasForm = h.avgScore > 10 ? 0 : 5;
var dataPenalty = hasOdds + hasForm;
// Agreement bonus — enhanced for 3-specialist convergence
// When all 3 distinct-philosophy models (Kimi/Grok/GPT) agree, that's strong signal
var specialistModels = ['custom','custom2','custom3'];
var specialistVotes = 0;
if (h.models) {
  h.models.forEach(function(mv) {
    if (specialistModels.indexOf(mv.model) !== -1 && mv.rank <= 3) specialistVotes++;
  });
}
var tripleConvergence = specialistVotes >= 3; // all 3 specialists in top-3
var agreementBonus = tripleConvergence ? 18
                   : h.agreement >= 1.0 ? 10
                   : h.agreement >= 0.75 ? 5 : 0;
h.tripleConvergence = tripleConvergence;
h.confidencePct = Math.max(15, Math.min(99, Math.round(baseConf - fieldPenalty - dataPenalty + agreementBonus)));
  });

  // Sort by consensus score
  horses.sort(function(a, b) { return b.consensusScore - a.consensusScore; });

  var top1 = horses[0];
  var top2 = horses[1];
  var top3 = horses[2];
  var top4 = horses[3];

  if (!top1) return null;

  // ─── Generate the 4 fixed bet types ───────────────────────────────────
  var bets = [];
  var allAgree = function(list) {
    return list.every(function(h){ return h.top3Votes >= Math.ceil(modelCount * 0.5); });
  };
  var orderConsistent = function(list) {
    return list.every(function(h, i){ return h.avgRank <= i + 1.8; });
  };

    // ── PRIMARY BET: Boxed Trifecta — the main objective ──────────────────────
  var _bankroll = parseFloat(document.getElementById('betStake') && document.getElementById('betStake').value || '0') || 500;
  if (top3) {
    var trifConf = Math.round((top1.confidencePct + top2.confidencePct + top3.confidencePct) / 3);
    trifConf = Math.max(10, Math.min(88, trifConf));
    var tripleBoost = top1.tripleConvergence ? 12 : 0;
    var allAgreeBoost3 = allAgree([top1, top2, top3]) ? 8 : 0;
    trifConf = Math.min(88, trifConf + tripleBoost + allAgreeBoost3);
    var trifStakeUnit = trifConf >= 60 ? 2 : trifConf >= 45 ? 1 : 0.5;
    var trifType = (orderConsistent([top1, top2, top3]) && allAgree([top1, top2, top3]) && trifConf >= 70) ? 'trifecta' : 'boxed_trifecta';
    var trifReason = allAgree([top1, top2, top3]) ? 'All 3 consensus picks — strong frame' : 'Best 3-horse combination — any order';
    if (top1.tripleConvergence) trifReason = '🔥 TRIPLE CONVERGENCE · ' + trifReason;
    trifReason += trifType === 'trifecta' ? ' · Order consistent — exact trifecta' : ' · $6 box trifecta · need 1 in 8 to profit';
    bets.push({
      rank: 1, type: trifType,
      label: trifType === 'trifecta' ? '🎰 Trifecta (exact)' : '🎰 Boxed Trifecta',
      horses: [top1.name, top2.name, top3.name], odds: 0,
      confidence: trifConf, reason: trifReason,
      stakeNote: trifType === 'boxed_trifecta' ? '$6 box (100% div) · avg pays $50-$200 · break-even = 1 in 8 races' : 'Exact order · Full trifecta dividend',
      color: trifConf >= 55 ? '#a855f7' : trifConf >= 38 ? '#f59e0b' : '#ef4444', isPrimary: true
    });
  }

  // ── SECONDARY BET: Quinella — stacks with trifecta ──────────────────────────
  if (top2) {
    var quConf = Math.round(top1.confidencePct * 0.55 + top2.confidencePct * 0.40);
    var quBoost = allAgree([top1, top2]) ? 8 : 0;
    if (top1.tripleConvergence) quBoost += 8;
    quConf = Math.min(88, quConf + quBoost);
    var quType = (orderConsistent([top1, top2]) && quConf >= 65) ? 'exacta' : 'quinella';
    var quReason = allAgree([top1, top2]) ? 'Both horses backed by all models — quinella nearly certain' : 'Strongest 2-horse combination';
    if (top1.tripleConvergence) quReason = '🔥 TRIPLE CONVERGENCE · ' + quReason;
    quReason += ' · Stacks with trifecta for double payout on same race';
    bets.push({
      rank: 2, type: quType,
      label: quType === 'exacta' ? '🎯 Exacta (in order)' : '🎯 Quinella (any order)',
      horses: [top1.name, top2.name], odds: 0,
      confidence: quConf, reason: quReason,
      stakeNote: quType === 'exacta' ? 'Exacta — higher dividend than quinella' : (quConf >= 55 ? '$5 quinella · stacks with trifecta for double payout' : '$3 quinella · top 2 easier than top 3 · avg pays $8-$20'),
      color: quConf >= 60 ? '#3b82f6' : quConf >= 40 ? '#f59e0b' : '#ef4444'
    });
  }

  // ── WIN/EACH-WAY — bonus when standout pick ──────────────────────────────────
  var winConf = top1.confidencePct;
  if (top1.top3Votes >= modelCount) winConf = Math.min(99, winConf + 12);
  var bet1Type = (top1.odds > 0 && top1.odds > 5.0) ? 'each-way' : 'win';
  var bet1Reason = top1.top3Votes >= modelCount ? 'All ' + modelCount + ' models backed this — standout pick' : top1.top3Votes + '/' + modelCount + ' models on top';
  if (top1.tripleConvergence) bet1Reason = '🔥 TRIPLE CONVERGENCE · ' + bet1Reason;
  if (top1.odds > 5.0) bet1Reason += ' · Each-way covers place too';
  var _kelly1 = getKellyLabel(winConf, top1.odds, _bankroll);
  var _kellyNote = _kelly1 && _kelly1.stake > 0 ? ' · Kelly: $' + _kelly1.stake.toFixed(2) : '';
  bets.push({
    rank: 3, type: bet1Type,
    label: bet1Type === 'each-way' ? '🏇 Each-Way (bonus)' : '🏇 Win (bonus)',
    horses: [top1.name], odds: top1.odds, confidence: winConf, reason: bet1Reason,
    stakeNote: (bet1Type === 'each-way' ? 'Win + place · 2 bets' : 'Win only') + _kellyNote,
    kellyStake: _kelly1 ? _kelly1.stake : 0,
    color: winConf >= 65 ? '#10b981' : winConf >= 45 ? '#f59e0b' : '#ef4444'
  });

  // ── FIRST 4 — if high confidence across 4 horses ────────────────────────────
  if (top4) {
    var f4Conf = Math.round((top1.confidencePct + top2.confidencePct + top3.confidencePct + top4.confidencePct) / 4) - 10;
    f4Conf = Math.max(8, Math.min(75, f4Conf));
    if (allAgree([top1, top2, top3, top4])) f4Conf = Math.min(75, f4Conf + 8);
    bets.push({
      rank: 4, type: 'first4', label: '🃏 First 4 (boxed)',
      horses: [top1.name, top2.name, top3.name, top4.name], odds: 0,
      confidence: f4Conf, reason: 'All 4 any order · Biggest payout · $1 unit = $24',
      stakeNote: '$0.50 unit × 24 combos = $12 · Pays $100-$2000+',
      color: f4Conf >= 40 ? '#06b6d4' : f4Conf >= 25 ? '#f59e0b' : '#ef4444'
    });
  }

    return {
    raceKey: getRaceKey(pendingGroup[0]),
    raceLabel: (pendingGroup[0].raceInfo.track || '') + ' ' + (pendingGroup[0].raceInfo.race || ''),
    modelCount: modelCount,
    models: pendingGroup.map(function(p){ return { model: p.model, name: modelNames[p.model]||p.model, color: modelColors[p.model]||'#94a3b8' }; }),
    horses: horses.slice(0, 6),
    bets: bets,
    top1: top1, top2: top2, top3: top3, top4: top4
  };
}

function renderConsensusAdvisor() {
  var container = document.getElementById('consensusAdvisor');
  if (!container) return;

  // Find current race key
  var currentKey = '';
  if (app.raceInfo && (app.raceInfo.track || app.raceInfo.race)) {
    var t = (app.raceInfo.track || '').trim().toLowerCase();
    var r = (app.raceInfo.race  || '').trim().toLowerCase();
    currentKey = t + '|' + r;
  }
  if (!currentKey) { container.innerHTML = ''; return; }

  // All 6 models that must submit before advisor unlocks
  var ALL_MODELS = [
    { key: 'base',     label: 'Base',    color: '#10b981' },
    { key: 'custom',   label: app.getModelName('custom'),   color: '#a855f7' },
    { key: 'custom2',  label: app.getModelName('custom2'),  color: '#f59e0b' },
    { key: 'custom3',  label: app.getModelName('custom3'),  color: '#06b6d4' },
    { key: 'saturday', label: 'Saturday', color: '#fca5a5' }
  ];

  // Group pending races by race key
  var group = app.pendingRaces.filter(function(p){ return getRaceKey(p) === currentKey; });
  var submittedKeys = group.map(function(p){ return p.model; });
  var totalModels = ALL_MODELS.length;
  var submittedCount = submittedKeys.length;
  var allIn = submittedCount >= totalModels;

  var clearBtn2 = document.getElementById('clearConsensusBtn');

  // ── MODEL PROGRESS TRACKER (shown above recommendations, not a gate) ──────
  if (clearBtn2) clearBtn2.style.display = submittedCount > 0 ? 'block' : 'none';
  var pct = Math.round((submittedCount / totalModels) * 100);
  var progressHtml = '<div style="background:rgba(15,23,42,0.5); border:1px solid #1e2740; border-radius:8px; padding:8px 10px; margin-bottom:10px;">';
  progressHtml += '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">';
  progressHtml += '<span style="color:#6366f1; font-size:11px; font-weight:700; letter-spacing:0.4px;">MODELS SUBMITTED</span>';
  progressHtml += '<span style="color:' + (allIn ? '#10b981' : '#f59e0b') + '; font-size:12px; font-weight:700;">' + submittedCount + ' / ' + totalModels + (allIn ? ' ✓ Full consensus' : ' — partial') + '</span>';
  progressHtml += '</div>';
  progressHtml += '<div style="background:#1e2740; border-radius:4px; height:4px; margin-bottom:6px;">';
  progressHtml += '<div style="background:linear-gradient(90deg,#6366f1,' + (allIn ? '#10b981' : '#f59e0b') + '); width:' + pct + '%; height:4px; border-radius:4px;"></div>';
  progressHtml += '</div>';
  progressHtml += '<div style="display:flex; flex-wrap:wrap; gap:4px;">';
  ALL_MODELS.forEach(function(m) {
    var done = submittedKeys.indexOf(m.key) !== -1;
    progressHtml += '<span style="font-size:10px; padding:2px 6px; border-radius:8px; background:' + (done ? m.color + '22' : 'transparent') + '; color:' + (done ? m.color : '#475569') + '; border:1px solid ' + (done ? m.color : '#1e2740') + ';">' + (done ? '✓ ' : '') + m.label + '</span>';
  });
  progressHtml += '</div>';
  if (!allIn && submittedCount > 0) {
    progressHtml += '<div style="color:#475569; font-size:10px; margin-top:5px;">Showing recommendations from ' + submittedCount + ' model' + (submittedCount > 1 ? 's' : '') + ' · add more for stronger consensus</div>';
  }
  progressHtml += '</div>';
  // If nothing submitted yet — nothing to show
  if (submittedCount === 0) {
    container.innerHTML = progressHtml;
    return;
  }
  var consensus = buildConsensusForRace(group);
  if (!consensus) { container.innerHTML = ''; return; }

  var html = progressHtml;

  // Header: which models contributed
  html += '<div style="margin-bottom:10px;">';
  html += '<div style="font-size:11px; color:#6366f1; font-weight:700; margin-bottom:5px; letter-spacing:0.4px;">' + consensus.modelCount + ' MODELS ANALYSED</div>';
  html += '<div style="display:flex; flex-wrap:wrap; gap:4px;">';
  consensus.models.forEach(function(m) {
    html += '<span style="background:' + m.color + '22; color:' + m.color + '; border:1px solid ' + m.color + '44; border-radius:10px; padding:2px 9px; font-size:11px; font-weight:600;">' + m.name + '</span>';
  });
  html += '</div></div>';

  // Consensus form guide — top 6 horses ranked
  html += '<div style="background:rgba(15,23,42,0.7); border:1px solid #1e2740; border-radius:10px; padding:12px; margin-bottom:12px;">';
  html += '<div style="font-size:11px; color:#6366f1; font-weight:700; margin-bottom:8px; letter-spacing:0.4px;">CONSENSUS RANKINGS</div>';
  consensus.horses.forEach(function(h, i) {
    var rankColors = ['#f59e0b','#94a3b8','#b45309','#475569','#374151','#374151'];
    var rankLabels = ['1st','2nd','3rd','4th','5th','6th'];
    var barW = Math.round(h.consensusScore * 100);
    var barColor = i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#b45309' : '#374151';
    html += '<div style="margin-bottom:6px;">';
    html += '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2px;">';
    html += '<div style="display:flex; align-items:center; gap:6px;">';
    html += '<span style="color:' + rankColors[i] + '; font-size:10px; font-weight:700; min-width:24px;">' + (i+1) + '.</span>';
    if (h.num) html += '<span style="color:#475569; font-size:10px; font-weight:600; background:#1e2740; border-radius:4px; padding:1px 5px;">#' + h.num + '</span>';
    html += '<span style="color:#e8ecf4; font-size:13px; font-weight:600;">' + h.name + '</span>';
    if (h.odds > 0) html += '<span style="color:#6b7280; font-size:10px;">$' + h.odds.toFixed(2) + '</span>';
    html += '</div>';
    html += '<div style="display:flex; gap:3px; align-items:center;">';
    // Show which models picked this horse in top 3
    h.models.forEach(function(mv) {
      var modelColors2 = { base:'#10b981', custom:'#a855f7', custom2:'#f59e0b', custom3:'#06b6d4', saturday:'#fca5a5' };
      var modelAbbr = { base:'B', custom:'Ki', custom2:'Gr', custom3:'GP', saturday:'Sa' };
      if (mv.rank <= 3) {
        html += '<span style="background:' + (modelColors2[mv.model]||'#94a3b8') + '33; color:' + (modelColors2[mv.model]||'#94a3b8') + '; border-radius:4px; padding:1px 5px; font-size:9px; font-weight:700;">' + (modelAbbr[mv.model]||mv.model[0].toUpperCase()) + mv.rank + '</span>';
      }
    });
    html += '</div></div>';
    html += '<div style="background:#1e2740; border-radius:3px; height:5px;">';
    html += '<div style="background:' + barColor + '; width:' + barW + '%; height:5px; border-radius:3px; opacity:0.8;"></div>';
    html += '</div></div>';
  });
  html += '</div>';

  // ── RACE CONFIDENCE GATE ─────────────────────────────────────────────────
  // Evaluate whether this race is worth betting on.
  // Targeting ~80% hit rate on selected races by only betting green gates.
  var trifBet = consensus.bets && consensus.bets.filter(function(b){ return b.type === 'boxed_trifecta' || b.type === 'trifecta'; })[0];
  var quBet   = consensus.bets && consensus.bets.filter(function(b){ return b.type === 'quinella' || b.type === 'exacta'; })[0];
  var trifConf = trifBet ? trifBet.confidence : 0;

  // Signal 1: Triple convergence (all 3 specialists agree on top 3)
  var sigTriple = !!(consensus.top1 && consensus.top1.tripleConvergence);
  // Signal 2: Full model agreement (all models agree on top 2)
  var sigAllAgree = !!(consensus.top1 && consensus.top2 &&
    consensus.top1.top3Votes >= consensus.modelCount &&
    consensus.top2.top3Votes >= Math.ceil(consensus.modelCount * 0.75));
  // Signal 3: Pattern library match on top horse
  var sigPattern = !!(consensus.top1 && consensus.top1.patternMatches > 0);
  // Signal 4: High trifecta confidence
  var sigConf = trifConf >= 58;
  // Signal 5: Short odds top 2 (market agrees with model)
  var sigMarket = !!(consensus.top1 && consensus.top2 &&
    consensus.top1.odds > 0 && consensus.top1.odds <= 5.0 &&
    consensus.top2.odds > 0 && consensus.top2.odds <= 8.0);

  var signalsFiring = [sigTriple, sigAllAgree, sigPattern, sigConf, sigMarket].filter(Boolean).length;

  // Gate decision
  var gateLevel, gateColor, gateIcon, gateAction, gateDetail;
  if (signalsFiring >= 3 || (sigTriple && signalsFiring >= 2) || trifConf >= 70) {
    gateLevel  = 'BET';
    gateColor  = '#10b981';
    gateIcon   = '🟢';
    gateAction = 'Bet BOTH — Trifecta Box ($6) + Quinella ($5) = $11 · confident race';
    gateDetail = 'High confidence race · ' + signalsFiring + '/5 signals firing · ~80% hit rate on these races';
  } else if (signalsFiring >= 2 || trifConf >= 48) {
    gateLevel  = 'CAUTION';
    gateColor  = '#f59e0b';
    gateIcon   = '🟡';
    gateAction = '$3 Quinella only · Skip trifecta · Top 2 easier than top 3';
    gateDetail = 'Moderate confidence · ' + signalsFiring + '/5 signals · Quinella still profitable at 65% hit rate';
  } else {
    gateLevel  = 'PASS';
    gateColor  = '#ef4444';
    gateIcon   = '🔴';
    gateAction = 'Skip this race · Wait for clearer setup';
    gateDetail = 'Low confidence · Only ' + signalsFiring + '/5 signals · Race too open or model disagreement';
  }

  // Signal labels
  var sigLabels = [
    { firing: sigTriple,   label: '🔥 Triple convergence' },
    { firing: sigAllAgree, label: '🤝 Full model agreement' },
    { firing: sigPattern,  label: '🧩 Pattern match' },
    { firing: sigConf,     label: '📊 High confidence (' + trifConf + '%)' },
    { firing: sigMarket,   label: '💰 Market agrees' }
  ];

  html += '<div style="background:rgba(0,0,0,0.25); border:2px solid ' + gateColor + '; border-radius:12px; padding:12px; margin-bottom:12px;">';
  html += '<div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px;">';
  html += '<div style="display:flex; align-items:center; gap:8px;">';
  html += '<span style="font-size:18px;">' + gateIcon + '</span>';
  html += '<div>';
  html += '<div style="font-weight:800; font-size:14px; color:' + gateColor + ';">' + gateLevel + ' THIS RACE</div>';
  html += '<div style="font-size:10px; color:#94a3b8; margin-top:1px;">' + gateDetail + '</div>';
  html += '</div></div>';
  html += '<div style="text-align:right;">';
  html += '<div style="font-size:11px; font-weight:700; color:' + gateColor + ';">' + signalsFiring + '/5</div>';
  html += '<div style="font-size:9px; color:#475569;">signals</div>';
  html += '</div></div>';

  // Signal pills
  html += '<div style="display:flex; flex-wrap:wrap; gap:4px; margin-bottom:8px;">';
  sigLabels.forEach(function(s) {
    html += '<span style="font-size:10px; padding:2px 7px; border-radius:10px; border:1px solid ' +
      (s.firing ? gateColor : '#1e2740') + '; color:' + (s.firing ? gateColor : '#475569') +
      '; background:' + (s.firing ? gateColor + '18' : 'transparent') + ';">' + s.label + '</span>';
  });
  html += '</div>';

  // Action line
  html += '<div style="font-size:12px; font-weight:700; color:' + gateColor + '; padding:6px 8px; background:' + gateColor + '15; border-radius:6px;">';
  html += gateAction;
  if (gateLevel === 'BET') {
    html += ' <span style="color:#94a3b8; font-weight:400; font-size:10px;">· break-even = 1 in 8</span>';
  } else if (gateLevel === 'CAUTION') {
    html += ' <span style="color:#94a3b8; font-weight:400; font-size:10px;">· 65% hit rate = +$24 profit on 5 races</span>';
  }
  html += '</div>';
  html += '</div>';

  // TOP 3 BET RECOMMENDATIONS
  html += '<div style="font-size:11px; color:#f59e0b; font-weight:700; margin-bottom:8px; letter-spacing:0.4px;">RECOMMENDED BETS</div>';

  consensus.bets.forEach(function(bet) {
    var rankBadge = ['🏆','🥈','🥉'][bet.rank - 1] || '';
    html += '<div style="background:rgba(' + (bet.rank===1?'245,158,11':bet.rank===2?'59,130,246':'168,85,247') + ',0.07); border:1px solid ' + bet.color + '55; border-radius:10px; padding:12px; margin-bottom:8px;">';
    
    // Bet header
    html += '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">';
    html += '<div style="display:flex; align-items:center; gap:8px;">';
    html += '<span style="color:' + bet.color + '; font-weight:700; font-size:14px;">' + rankBadge + ' ' + bet.label + '</span>';
    html += '</div>';
    // Confidence meter
    var confColor = bet.confidence >= 65 ? '#10b981' : bet.confidence >= 45 ? '#f59e0b' : '#ef4444';
    html += '<div style="text-align:right;">';
    html += '<span style="color:' + confColor + '; font-weight:700; font-size:16px; font-family:monospace;">' + bet.confidence + '%</span>';
    html += '<div style="color:#475569; font-size:9px;">confidence</div>';
    html += '</div></div>';

    // Horses
    html += '<div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:6px;">';
    bet.horses.forEach(function(h, i) {
      var posColors = ['#f59e0b','#94a3b8','#b45309','#475569'];
      // Look up horse number from consensus data
      var hData = null;
      for (var ci = 0; ci < consensus.horses.length; ci++) { if (consensus.horses[ci].name === h) { hData = consensus.horses[ci]; break; } }
      var numLabel = hData && hData.num ? '<span style="opacity:0.7; font-size:10px; margin-right:3px;">#' + hData.num + '</span>' : '';
      html += '<span style="background:' + posColors[i] + '22; color:' + posColors[i] + '; border:1px solid ' + posColors[i] + '55; border-radius:8px; padding:4px 10px; font-size:12px; font-weight:700;">' + numLabel + h + '</span>';
    });
    html += '</div>';

    // Confidence bar
    html += '<div style="background:#1e2740; border-radius:4px; height:6px; margin-bottom:6px;">';
    html += '<div style="background:' + confColor + '; width:' + bet.confidence + '%; height:6px; border-radius:4px; transition:width 0.5s;"></div>';
    html += '</div>';

    // Reason & stake note
    html += '<div style="color:#94a3b8; font-size:11px; margin-bottom:4px;">' + bet.reason + '</div>';
    html += '<div style="color:#475569; font-size:10px; font-style:italic;">' + bet.stakeNote + '</div>';

    // Quick-add button
    html += '<button onclick="app.quickAddBet(\'' + bet.type + '\',' + JSON.stringify(bet.horses) + ')" style="margin-top:8px; width:100%; padding:7px; background:' + bet.color + '22; border:1px solid ' + bet.color + '55; border-radius:7px; color:' + bet.color + '; font-size:12px; font-weight:600; cursor:pointer; font-family:inherit; transition:all 0.2s;" onmouseover="this.style.background=\'' + bet.color + '44\'" onmouseout="this.style.background=\'' + bet.color + '22\'">💰 Add this bet</button>';

    html += '</div>';
  });

  container.innerHTML = html;
  var clearBtn = document.getElementById('clearConsensusBtn');
  if (clearBtn) clearBtn.style.display = consensus ? 'block' : 'none';
}

app.quickAddBet = function(betType, horses) {
  var stakeDefaults = { boxed_trifecta: 6, quinella: 5, exacta: 5, trifecta: 1, win: 10, 'each-way': 10 };
  var stakeEl = document.getElementById('betStake'); var stake = stakeEl ? parseFloat(stakeEl.value)||stakeDefaults[betType]||10 : stakeDefaults[betType]||10;
  var bet = {
    id: generateId(),
    horse: horses.join(' / '),
    horses: horses,
    horseNum: '',
    odds: 0,
    type: betType,
    stake: stake,
    race: (app.raceInfo.track || '') + ' ' + (app.raceInfo.race || ''),
    prob: 0,
    fromConsensus: true
  };
  // Try to fill in odds for win/each-way
  if ((betType === 'win' || betType === 'each-way') && horses[0]) {
    for (var i = 0; i < app.horses.length; i++) {
      if (app.horses[i].name === horses[0]) { bet.odds = app.horses[i].odds || 0; break; }
    }
  }
  app.activeBets.push(bet);
  renderActiveBets();
  var typeLabels = {win:'Win', 'each-way':'Each-Way', exacta:'Exacta', quinella:'Quinella', trifecta:'Trifecta', boxed_trifecta:'Boxed Trifecta', first4:'First 4'};
  showSuccess('💰 ' + (typeLabels[betType]||betType) + ' added: ' + horses.join(', '));
};

// Clear consensus: removes all pending predictions for the CURRENT race key
// so the advisor resets clean for the next race.
app.clearConsensus = function() {
  var currentKey = '';
  if (app.raceInfo && (app.raceInfo.track || app.raceInfo.race)) {
    var t = (app.raceInfo.track || '').trim().toLowerCase();
    var r = (app.raceInfo.race  || '').trim().toLowerCase();
    currentKey = t + '|' + r;
  }
  if (!currentKey) { showError('No current race to clear.'); return; }
  var before = app.pendingRaces.length;
  app.pendingRaces = app.pendingRaces.filter(function(p){ return getRaceKey(p) !== currentKey; });
  var removed = before - app.pendingRaces.length;
  app.activeBets = [];
  saveData();
  updateStats();
  renderActiveBets();
  // Reset the advisor panel
  var adv = document.getElementById('consensusAdvisor');
  if (adv) adv.innerHTML = '<div style="color:#475569; font-size:11px; padding:8px 0;">Cleared. Save new model predictions to start again.</div>';
  var clearBtn = document.getElementById('clearConsensusBtn');
  if (clearBtn) clearBtn.style.display = 'none';
  showSuccess('Consensus cleared (' + removed + ' predictions removed). Ready for next race.');
};

function renderBettingStats() {
var container = document.getElementById('bettingStatsBox');
var list = document.getElementById('bettingList');
if (!container || !list) return;
if (app.bettingHistory.length === 0) {
container.innerHTML = '';
list.innerHTML = '<p style="color:var(--text-muted);">No bets recorded yet. Place bets on any analyzed race!</p>';
return;
}
var totalStaked = 0, totalProfit = 0, wins = 0, totalBets = 0;
var bestWin = 0, worstLoss = 0, streak = 0, bestStreak = 0, currentStreak = 0;
for (var i = 0; i < app.bettingHistory.length; i++) {
var b = app.bettingHistory[i];
totalBets++;
var outlay = b.type === 'eachway' ? b.stake * 2 : b.stake;
totalStaked += outlay;
totalProfit += b.profit;
if (b.outcome === 'win' || b.outcome === 'place') {
wins++;
currentStreak++;
if (currentStreak > bestStreak) bestStreak = currentStreak;
} else {
currentStreak = 0;
}
if (b.profit > bestWin) bestWin = b.profit;
if (b.profit < worstLoss) worstLoss = b.profit;
}
var roi = totalStaked > 0 ? ((totalProfit / totalStaked) * 100).toFixed(1) : '0';
var profitColor = totalProfit >= 0 ? 'var(--accent-green)' : 'var(--accent-red)';
var roiColor = parseFloat(roi) >= 0 ? 'var(--accent-green)' : 'var(--accent-red)';
container.innerHTML = '<div class="betting-stats" style="margin-bottom:14px;">' +
'<div class="bstat"><div class="bval">' + totalBets + '</div><div class="blabel">Total Bets</div></div>' +
'<div class="bstat"><div class="bval" style="color:' + profitColor + ';">' + (totalProfit >= 0 ? '+' : '') + '$' + totalProfit.toFixed(2) + '</div><div class="blabel">Profit/Loss</div></div>' +
'<div class="bstat"><div class="bval" style="color:' + roiColor + ';">' + roi + '%</div><div class="blabel">ROI</div></div>' +
'<div class="bstat"><div class="bval">' + Math.round((wins / totalBets) * 100) + '%</div><div class="blabel">Strike Rate</div></div>' +
'</div>' +
'<div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; font-size:12px; color:var(--text-secondary); margin-bottom:12px;">' +
'<div>💰 Staked: <strong>$' + totalStaked.toFixed(2) + '</strong></div>' +
'<div>🏆 Best Win: <strong style="color:var(--accent-green);">+$' + bestWin.toFixed(2) + '</strong></div>' +
'<div>🎯 Best Streak: <strong>' + bestStreak + '</strong></div>' +
'<div>📉 Worst Loss: <strong style="color:var(--accent-red);">-$' + Math.abs(worstLoss).toFixed(2) + '</strong></div>' +
'</div>';
list.innerHTML = '';
var recent = app.bettingHistory.slice(-20).reverse();
for (var j = 0; j < recent.length; j++) {
var r = recent[j];
var div = document.createElement('div');
var typeLabel = r.type === 'eachway' ? 'E/W' : r.type.charAt(0).toUpperCase() + r.type.slice(1);
if (r.outcome === 'loss') {
div.className = 'bet-result loss';
div.innerHTML = '❌ <strong>' + escapeHtml(r.horse) + '</strong> ' + typeLabel + ' $' + r.stake.toFixed(2) + (r.odds ? ' @ $' + r.odds.toFixed(2) : '') + ' -- <strong>-$' + Math.abs(r.profit).toFixed(2) + '</strong>' + '<span style="float:right; font-size:11px; opacity:0.7;">' + escapeHtml(r.race) + ' ' + (r.date || '') + '</span>';
} else {
div.className = 'bet-result win';
var label = r.outcome === 'place' ? '🟡' : '✅';
div.innerHTML = label + ' <strong>' + escapeHtml(r.horse) + '</strong> ' + typeLabel + ' $' + r.stake.toFixed(2) + (r.odds ? ' @ $' + r.odds.toFixed(2) : '') + ' -- <strong>+$' + r.profit.toFixed(2) + '</strong>' + '<span style="float:right; font-size:11px; opacity:0.7;">' + escapeHtml(r.race) + ' ' + (r.date || '') + '</span>';
}
list.appendChild(div);
}
}
app.clearAllBets = function() {
app.bettingHistory = [];
app.activeBets = [];
localStorage.removeItem('horseBettingHistoryV2');
renderBettingStats();
renderActiveBets();
updateStats();
showSuccess('All betting data cleared.');
};
app.clearAll = function() {
if (app.horses.length > 0 && !app.winnerSet) {
if (!confirm('You have unsaved analysis. Clear anyway?')) return;
}
document.getElementById('raceData').value = '';
document.getElementById('predictions').classList.add('hidden');
document.getElementById('winnerBox').classList.add('hidden');
document.getElementById('raceInfo').classList.add('hidden');
document.getElementById('savePrompt').classList.add('hidden');
document.getElementById('historyPanel').classList.add('hidden');
document.getElementById('pendingPanel').classList.add('hidden');
document.getElementById('betSection').classList.add('hidden');
document.getElementById('bettingPanel').classList.add('hidden');
app.horses = [];
app.raceInfo = {};
app.winnerSet = false;
app.currentPendingId = null;
app.activeBets = [];
var winnerBox = document.getElementById('winnerBox');
winnerBox.innerHTML = '<h3>🏆 Who Actually Won?</h3>' +
'<p style="color:var(--text-secondary); font-size:14px; margin-bottom:10px;">Select the real finishing positions so we can learn</p>' +
'<label for="winner1Select">1st Place (Winner) *</label>' +
'<select id="winner1Select" aria-required="true"><option value="">-- Select horse --</option></select>' +
'<label for="winner2Select">2nd Place (Optional)</label>' +
'<select id="winner2Select"><option value="">-- Select horse --</option></select>' +
'<label for="winner3Select">3rd Place (Optional)</label>' +
'<select id="winner3Select"><option value="">-- Select horse --</option></select>' +
'<button class="btn btn-winner" onclick="app.recordWinner()">Record Winner</button>';
};
// ============================================================
// AI AUDIT SYSTEM — every 20 races, Claude analyses all 4
// custom models and recommends weight adjustments for Base
// ============================================================
app.aiAuditRaceCount = parseInt(localStorage.getItem('horseAIAuditCount') || '0');

app.checkAIAuditTrigger = function() {
  app.aiAuditRaceCount++;
  localStorage.setItem('horseAIAuditCount', app.aiAuditRaceCount);
  if (app.aiAuditRaceCount % 20 === 0) {
    // Show notification banner
    var banner = document.createElement('div');
    banner.id = 'aiAuditBanner';
    banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99999;background:linear-gradient(135deg,#312e81,#4338ca);color:white;padding:14px 20px;display:flex;align-items:center;justify-content:space-between;gap:12px;box-shadow:0 4px 24px rgba(99,102,241,0.5);';
    banner.innerHTML =
      '<div style="display:flex;align-items:center;gap:10px;">' +
      '<span style="font-size:22px;">🤖</span>' +
      '<div><strong style="font-size:15px;">20-Race Milestone!</strong>' +
      '<p style="font-size:12px;margin:2px 0 0;color:#c7d2fe;">AI audit ready — Claude will analyse your models and recommend weight updates for BasePredictor</p></div></div>' +
      '<div style="display:flex;gap:8px;flex-shrink:0;">' +
      '<button onclick="if(!window.ANTHROPIC_API_KEY){alert(\'Enter your Anthropic API key in Data Management first\');}else{app.runAIAudit();}" style="background:#6366f1;border:none;color:white;padding:8px 16px;border-radius:8px;cursor:pointer;font-weight:700;font-size:13px;">🔍 Run AI Audit</button>' +
      '<button onclick="document.getElementById(\'aiAuditBanner\').remove()" style="background:rgba(255,255,255,0.15);border:none;color:white;padding:8px 12px;border-radius:8px;cursor:pointer;font-size:13px;">Later</button>' +
      '</div>';
    document.body.appendChild(banner);
  }
};

app.buildAuditPayload = function() {
  // Build last-20 race logs for each model
  // Only audit models that have recorded races — skip empty/inactive slots
  var allModelKeys = ['custom','custom2','custom3'];
  var modelKeys = allModelKeys.filter(function(mk) {
    return app.raceHistory.some(function(r){ return r.model === mk; });
  });
  // Always include at least custom and custom2
  if (modelKeys.indexOf('custom') === -1) modelKeys.unshift('custom');
  if (modelKeys.indexOf('custom2') === -1 && app.raceHistory.length > 0) modelKeys.push('custom2');
  if (modelKeys.indexOf('custom3') === -1 && app.raceHistory.length > 0) modelKeys.push('custom3');
  var modelNames = {};
  var modelWeights = {};
  modelKeys.forEach(function(mk) {
    modelNames[mk] = app.getModelName(mk);
    modelWeights[mk] = mk === 'custom' ? app.customWeights
                     : mk === 'custom2' ? app.custom2Weights
                     : mk === 'custom3' ? app.custom3Weights
                     : app.baseWeights;
  });

  var modeData = {};
  modelKeys.forEach(function(mk) {
    var races = app.raceHistory.filter(function(r) { return r.model === mk; }).slice(-20);
    var wins = races.filter(function(r) { return r.correct; }).length;
    var top3 = races.filter(function(r) { return r.top3 || r.top3Hits >= 2; }).length;
    // Simple ROI: assume $10 bet, avg odds on winners
    var roi = 0;
    if (races.length > 0) {
      var totalReturn = 0;
      races.forEach(function(r) {
        if (r.correct && r.actualOdds > 0) totalReturn += r.actualOdds * 10;
        totalReturn -= 10;
      });
      roi = Math.round((totalReturn / (races.length * 10)) * 100) / 100;
    }
    // Rank stability: how consistent is model in top3 across rolling windows
    var stability = 1.0;
    if (races.length >= 6) {
      var windows = [];
      for (var w = 0; w <= races.length - 5; w++) {
        var wRaces = races.slice(w, w + 5);
        windows.push(wRaces.filter(function(r) { return r.top3 || r.top3Hits >= 2; }).length / 5);
      }
      var mean = windows.reduce(function(a,b){return a+b;},0) / windows.length;
      var variance = windows.reduce(function(s,v){return s+Math.pow(v-mean,2);},0) / windows.length;
      stability = Math.round((1 - Math.min(1, Math.sqrt(variance) * 2)) * 100) / 100;
    }
    // Factor success breakdown from factorStats (rough per-model not tracked, use global)
    var raceLogs = races.map(function(r) {
      return {
        race: r.race,
        date: r.date,
        predicted: r.predicted,
        actual: r.actual,
        correct: r.correct,
        top3Hits: r.top3Hits || 0,
        predictedOdds: r.predictedOdds || 0,
        actualOdds: r.actualOdds || 0,
        condition: r.condition || '',
        topFactors: r.winnerFactors ? Object.keys(r.winnerFactors).filter(function(k){return r.winnerFactors[k];}) : []
      };
    });
    modeData[mk] = {
      name: modelNames[mk],
      races: races.length,
      wins: wins,
      top3: top3,
      win_pct: races.length > 0 ? Math.round((wins/races.length)*100) : 0,
      top3_pct: races.length > 0 ? Math.round((top3/races.length)*100) : 0,
      roi: roi,
      stability: stability,
      learning_objective: (modelWeights[mk] && modelWeights[mk].learningObjective) || 'top3',
      current_weights: {
        odds: Math.round(modelWeights[mk].odds),
        form: Math.round(modelWeights[mk].form1),
        formConsistency: Math.round(modelWeights[mk].formConsistency),
        trackWin: Math.round(modelWeights[mk].trackWin),
        trackDistWin: Math.round(modelWeights[mk].trackDistWin),
        jockeyWin: Math.round(modelWeights[mk].jockeyWin),
        trainerWin: Math.round(modelWeights[mk].trainerWin),
        freshness: Math.round(modelWeights[mk].freshness),
        tactical: Math.round(modelWeights[mk].tactical),
        trackCondition: Math.round(modelWeights[mk].trackCondition),
        classChange: Math.round(modelWeights[mk].classChange),
        pacePressure: Math.round(modelWeights[mk].pacePressure),
        formMomentum: Math.round(modelWeights[mk].formMomentum),
        finishStrength: Math.round(modelWeights[mk].finishStrength),
        sectionalSpeed: Math.round(modelWeights[mk].sectionalSpeed),
        weatherRailBias: Math.round(modelWeights[mk].weatherRailBias)
      },
      race_log: raceLogs
    };
  });

  var baseData = {
    name: 'BasePredictor',
    current_weights: {
      odds: Math.round(app.baseWeights.odds),
      form: Math.round(app.baseWeights.form1),
      formConsistency: Math.round(app.baseWeights.formConsistency),
      trackWin: Math.round(app.baseWeights.trackWin),
      trackDistWin: Math.round(app.baseWeights.trackDistWin),
      jockeyWin: Math.round(app.baseWeights.jockeyWin),
      trainerWin: Math.round(app.baseWeights.trainerWin),
      freshness: Math.round(app.baseWeights.freshness),
      tactical: Math.round(app.baseWeights.tactical),
      trackCondition: Math.round(app.baseWeights.trackCondition),
      classChange: Math.round(app.baseWeights.classChange),
      pacePressure: Math.round(app.baseWeights.pacePressure),
      formMomentum: Math.round(app.baseWeights.formMomentum),
      finishStrength: Math.round(app.baseWeights.finishStrength),
      sectionalSpeed: Math.round(app.baseWeights.sectionalSpeed),
      weatherRailBias: Math.round(app.baseWeights.weatherRailBias)
    },
    total_races: app.raceHistory.filter(function(r){return !r.model || r.model==='base';}).length
  };

  return { modes: modeData, base: baseData, total_history: app.raceHistory.length };
};

app.runAIAudit = function() {
  var banner = document.getElementById('aiAuditBanner');
  if (banner) banner.remove();

  var payload = app.buildAuditPayload();

  // Check if any model has data
  var hasData = Object.keys(payload.modes).some(function(mk) {
    return payload.modes[mk].races > 0;
  });
  if (!hasData) {
    showError('No custom model race data yet. Run races with Kimi/Grok/GPT first.');
    return;
  }

  // Show audit modal
  var overlay = document.createElement('div');
  overlay.id = 'aiAuditModal';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.9);z-index:99998;display:flex;align-items:center;justify-content:center;padding:16px;';
  var box = document.createElement('div');
  box.style.cssText = 'background:#0f1729;border:2px solid #4338ca;border-radius:16px;padding:24px;width:100%;max-width:720px;max-height:90vh;overflow-y:auto;display:flex;flex-direction:column;gap:16px;';
  box.innerHTML =
    '<div style="display:flex;justify-content:space-between;align-items:center;">' +
    '<h2 style="color:#818cf8;font-size:18px;font-weight:700;">🤖 AI Model Audit — 20-Race Analysis</h2>' +
    '<button id="auditClose" style="background:#dc2626;border:none;color:white;padding:5px 12px;border-radius:8px;cursor:pointer;">✕</button>' +
    '</div>' +
    '<div id="auditStatus" style="text-align:center;padding:30px;color:#94a3b8;">' +
    '<div style="font-size:32px;margin-bottom:12px;">🔍</div>' +
    '<p style="font-size:15px;font-weight:600;color:#c7d2fe;">Sending model logs to Claude AI...</p>' +
    '<p style="font-size:12px;margin-top:6px;">Analysing ' + Object.keys(payload.modes).length + ' models across up to 20 races each</p>' +
    '<div style="margin-top:16px;height:4px;background:#1e2d4a;border-radius:2px;overflow:hidden;">' +
    '<div id="auditProgress" style="height:4px;background:linear-gradient(90deg,#4338ca,#818cf8);width:0%;border-radius:2px;transition:width 2s ease;"></div></div>' +
    '</div>' +
    '<div id="auditResults" style="display:none;"></div>' +
    '<div id="auditActions" style="display:none;gap:10px;flex-wrap:wrap;"></div>' +
    '<div id="auditManualInput" style="display:none;"></div>';
  overlay.appendChild(box);
  document.body.appendChild(overlay);
  document.getElementById('auditClose').onclick = function() { overlay.remove(); };

  // Animate progress bar
  setTimeout(function() {
    var bar = document.getElementById('auditProgress');
    if (bar) bar.style.width = '70%';
  }, 100);

  // Build system prompt
  // Build dynamic model name list from actual slot names
  var auditModelNames = Object.keys(payload.modes).map(function(mk) {
    return payload.modes[mk].name || mk;
  }).join(', ');
  var auditModeCount = Object.keys(payload.modes).length;
  var systemPrompt = 'You are a horse-racing model analyst and performance auditor.\n' +
    'You receive performance data for ' + auditModeCount + ' custom learning models (' + auditModelNames + ') that each predict horse racing outcomes.\n' +
    'Each model has its own weight table. ALL of these weight keys exist and must be included in recommendations: ' +
    'odds, form, formConsistency, trackWin, trackDistWin, jockeyWin, trainerWin, freshness, tactical, trackCondition, ' +
    'classChange, pacePressure, formMomentum, finishStrength, sectionalSpeed, weatherRailBias, secondUpForm, jockeyForm, trainerForm.\n\n' +
    'TASKS:\n' +
    '1. Review the race logs for all ' + auditModeCount + ' models.\n' +
    '2. For every model calculate and report: win_pct, top3_pct, roi, stability (0=unstable, 1=stable).\n' +
    '   Note: models with learning_objective=\"top2\" are optimised for top-2 placement — evaluate their top3_pct but acknowledge their different goal.\n' +
    '3. Identify the top-performing model and briefly explain why.\n' +
    '4. Recommend refined weights for each model (change each weight by at most \u00b110%). Respect each model\'s learning_objective when suggesting weight emphasis.\n' +
    '5. Build a meta-blend for the BasePredictor: assign % influence per model (total=100) and propose new base weights.\n\n' +
    'RULES:\n' +
    '- Respond with VALID JSON ONLY — no markdown, no explanation outside the JSON.\n' +
    '- Weights must stay within \u00b110% of current values per factor.\n' +
    '- Prioritise rank stability over short win streaks.\n' +
    '- If a model has fewer than 5 races, flag data_quality as "insufficient" and do NOT change its weights — return current values unchanged.\n' +
    '- Models with identical predictions to others should be noted in best_mode_reason.\n\n' +
    'OUTPUT FORMAT (strict, use exact mode keys from the input data e.g. "custom", "custom2"):\n' +
    '{\n' +
    '  "mode_performance": {\n' +
    '    "custom": {"name":"...","win_pct":...,"top3_pct":...,"roi":...,"stability":...,"data_quality":"good|insufficient"},\n' +
    '    "custom2": {...}\n' +
    '  },\n' +
    '  "best_mode": "custom",\n' +
    '  "best_mode_reason": "short explanation",\n' +
    '  "recommended_weights": {\n' +
    '    "custom": {"odds":...,"form":...,"formConsistency":...,"trackWin":...,"trackDistWin":...,"jockeyWin":...,"trainerWin":...,"freshness":...,"tactical":...,"trackCondition":...,"classChange":...,"pacePressure":...,"formMomentum":...,"finishStrength":...,"sectionalSpeed":...,"weatherRailBias":...,"secondUpForm":...,"jockeyForm":...,"trainerForm":...,"notes":"..."},\n' +
    '    "custom2": {...}\n' +
    '  },\n' +
    '  "meta_blend": {"custom":percent,"custom2":percent},\n' +
    '  "predictor_adjustment": {\n' +
    '    "summary": "short rationale",\n' +
    '    "new_base_weights": {"odds":...,"form":...,"formConsistency":...,"trackWin":...,"trackDistWin":...,"jockeyWin":...,"trainerWin":...,"freshness":...,"tactical":...,"trackCondition":...,"classChange":...,"pacePressure":...,"formMomentum":...,"finishStrength":...,"sectionalSpeed":...,"weatherRailBias":...,"secondUpForm":...,"jockeyForm":...,"trainerForm":...}\n' +
    '  }\n' +
    '}';

  var userMsg = 'Here is the 20-race performance data for all 4 models:\n\n' + JSON.stringify(payload, null, 2);

  // Helper: safely show error inside modal
  function auditShowError(errorHtml, manualHtml) {
    var el = document.getElementById('auditStatus');
    if (el) { el.style.display = 'block'; el.innerHTML = errorHtml; }
    var mi = document.getElementById('auditManualInput');
    if (mi) { 
      if (manualHtml) { mi.style.display = 'block'; mi.innerHTML = manualHtml; }
      else { mi.style.display = 'none'; mi.innerHTML = ''; }
    }
  }

  var xhr = new XMLHttpRequest();
  xhr.open('POST', 'https://api.anthropic.com/v1/messages', true);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.setRequestHeader('x-api-key', window.ANTHROPIC_API_KEY || '');
  xhr.setRequestHeader('anthropic-version', '2023-06-01');
  xhr.setRequestHeader('anthropic-dangerous-direct-browser-access', 'true');
  xhr.timeout = 60000;

  xhr.ontimeout = function() {
    auditShowError('<p style="color:#ef4444;">⚠ Request timed out (60s). Try again.</p>');
  };

  xhr.onerror = function() {
    var isCORS = location.protocol === 'file:';
    var errorHtml =
      '<p style="color:#ef4444; font-weight:700; margin-bottom:8px;">⚠ Network error — browser blocked the API call.</p>' +
      (isCORS
        ? '<div style="background:#1e1a0a;border:1px solid #f59e0b;border-radius:8px;padding:10px;">' +
          '<p style="color:#f59e0b;font-size:12px;font-weight:700;">Running from file:// — CORS blocks direct API calls.</p>' +
          '<p style="color:#94a3b8;font-size:11px;margin-top:4px;">Use Manual Mode below instead ↓</p>' +
          '</div>'
        : '<p style="font-size:12px;color:#94a3b8;margin-top:6px;">Check your internet connection and API key, then try again.</p>');
    var manualHtml =
      '<div style="background:#0f172a;border:1px solid #4338ca;border-radius:8px;padding:14px;">' +
      '<p style="color:#c7d2fe;font-size:13px;font-weight:700;margin-bottom:6px;">🤖 Manual Mode — Run via Claude.ai</p>' +
      '<p style="color:#94a3b8;font-size:12px;margin-bottom:10px;">Copy the prompt, paste into <a href="https://claude.ai" target="_blank" style="color:#818cf8;">claude.ai</a>, then paste the JSON response back here.</p>' +
      '<button onclick="copyTextToClipboard(document.getElementById(\'manualAuditPrompt\').value,this,\'✓ Copied!\',\'📋 Copy Full Prompt\');" style="background:#4338ca;border:none;color:white;padding:8px 16px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:700;margin-bottom:8px;width:100%;">📋 Copy Full Prompt</button>' +
      '<textarea id="manualAuditPrompt" style="width:100%;height:60px;font-size:10px;background:#0a0e1a;color:#475569;border:1px solid #2a3554;border-radius:6px;padding:6px;resize:none;" readonly>' + (systemPrompt + '\n\n---\n\n' + userMsg).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') + '</textarea>' +
      '<p style="color:#94a3b8;font-size:12px;margin-top:10px;margin-bottom:6px;">Paste Claude\'s JSON response here:</p>' +
      '<textarea id="manualAuditResponse" placeholder="Paste the JSON response from Claude.ai here..." style="width:100%;height:120px;font-size:11px;background:#0a0e1a;color:#e2e8f0;border:1px solid #4338ca;border-radius:6px;padding:8px;resize:vertical;"></textarea>' +
      '<button onclick="app._processManualAuditResponse(document.getElementById(\'manualAuditResponse\').value);" style="background:linear-gradient(135deg,#059669,#10b981);border:none;color:white;padding:10px 16px;border-radius:8px;cursor:pointer;font-size:14px;font-weight:700;margin-top:8px;width:100%;">✅ Apply This Response</button>' +
      '</div>';
    auditShowError(errorHtml, manualHtml);
  };

  xhr.onload = function() {
    var bar = document.getElementById('auditProgress');
    if (bar) bar.style.width = '100%';

    var data;
    try { data = JSON.parse(xhr.responseText); }
    catch(e) {
      auditShowError('<p style="color:#ef4444;">⚠ Could not parse server response (HTTP ' + xhr.status + ').</p>' +
        '<textarea style="width:100%;height:120px;font-size:11px;background:#0a0e1a;color:#cbd5e1;border:1px solid #2a3554;border-radius:8px;padding:8px;margin-top:8px;" readonly>' + xhr.responseText.slice(0,500) + '</textarea>');
      return;
    }

    if (data.error) {
      var errType = data.error.type || 'api_error';
      var errMsg  = data.error.message || 'Unknown API error';
      var hint = errType === 'authentication_error'
        ? '<p style="color:#f59e0b;font-size:12px;margin-top:6px;">Your API key is invalid or missing. Close this, enter it in the field above the audit button, and retry.</p>'
        : errType === 'insufficient_quota'
        ? '<p style="color:#f59e0b;font-size:12px;margin-top:6px;">API quota exceeded — check your Anthropic account billing.</p>'
        : '';
      auditShowError('<p style="color:#ef4444;">⚠ API Error (' + errType + '): ' + errMsg + '</p>' + hint);
      return;
    }

    var raw = '';
    if (data.content && data.content.length > 0) {
      raw = data.content.map(function(b){ return b.text || ''; }).join('');
    }
    raw = raw.replace(/```json[\s\S]*?```|```/g, '').trim();
    var jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) raw = jsonMatch[0];

    var audit;
    try { audit = JSON.parse(raw); }
    catch(e) {
      auditShowError('<p style="color:#ef4444;">⚠ Could not parse AI response as JSON.</p>' +
        '<textarea style="width:100%;height:160px;font-size:11px;background:#0a0e1a;color:#cbd5e1;border:1px solid #2a3554;border-radius:8px;padding:8px;margin-top:8px;" readonly>' + raw.slice(0,800) + '</textarea>');
      return;
    }

    app._lastAuditResult = audit;
    app._lastAuditPayload = payload;
    app.renderAuditResults(audit, payload);
  };

  // Watchdog: if nothing fires within 5s (silent CORS block on file://), show manual mode
  var _auditWatchdog = setTimeout(function() {
    if (document.getElementById('auditManualInput') &&
        document.getElementById('auditManualInput').style.display !== 'block' &&
        document.getElementById('auditResults') &&
        document.getElementById('auditResults').style.display !== 'block') {
      // Still showing spinner - trigger manual mode
      var _isCORS = location.protocol === 'file:';
      var _errorHtml = '<p style="color:#f59e0b; font-weight:700; margin-bottom:8px;">⚠ Request timed out — switching to Manual Mode.</p>' +
        (_isCORS ? '<p style="color:#94a3b8;font-size:12px;">Running from file:// means CORS silently blocks API calls in some browsers.</p>' : '');
      var _manualHtml =
        '<div style="background:#0f172a;border:1px solid #4338ca;border-radius:8px;padding:14px;">' +
        '<p style="color:#c7d2fe;font-size:13px;font-weight:700;margin-bottom:6px;">🤖 Manual Mode — Run via Claude.ai</p>' +
        '<p style="color:#94a3b8;font-size:12px;margin-bottom:10px;">Copy the prompt below, paste it into <a href="https://claude.ai" target="_blank" style="color:#818cf8;">claude.ai</a>, then paste the JSON response back here.</p>' +
        '<button onclick="copyTextToClipboard(document.getElementById(\'manualAuditPrompt\').value,this,\'✓ Copied!\',\'📋 Copy Full Prompt\');" style="background:#4338ca;border:none;color:white;padding:8px 16px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:700;margin-bottom:8px;width:100%;">📋 Copy Full Prompt</button>' +
        '<textarea id="manualAuditPrompt" style="width:100%;height:60px;font-size:10px;background:#0a0e1a;color:#475569;border:1px solid #2a3554;border-radius:6px;padding:6px;resize:none;" readonly>' + (systemPrompt + '\n\n---\n\n' + userMsg).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') + '</textarea>' +
        '<p style="color:#94a3b8;font-size:12px;margin-top:10px;margin-bottom:6px;">Paste Claude\'s JSON response here:</p>' +
        '<textarea id="manualAuditResponse" placeholder="Paste the JSON response from Claude.ai here..." style="width:100%;height:120px;font-size:11px;background:#0a0e1a;color:#e2e8f0;border:1px solid #4338ca;border-radius:6px;padding:8px;resize:vertical;"></textarea>' +
        '<button onclick="app._processManualAuditResponse(document.getElementById(\'manualAuditResponse\').value);" style="background:linear-gradient(135deg,#059669,#10b981);border:none;color:white;padding:10px 16px;border-radius:8px;cursor:pointer;font-size:14px;font-weight:700;margin-top:8px;width:100%;">✅ Apply This Response</button>' +
        '</div>';
      auditShowError(_errorHtml, _manualHtml);
      xhr.abort();
    }
  }, 5000);
  // Cancel watchdog if any handler fires first
  var _origOnload  = xhr.onload;
  var _origOnerror = xhr.onerror;
  var _origOntimeout = xhr.ontimeout;
  xhr.onload = function() { clearTimeout(_auditWatchdog); _origOnload.call(this); };
  xhr.onerror = function() { clearTimeout(_auditWatchdog); _origOnerror.call(this); };
  xhr.ontimeout = function() { clearTimeout(_auditWatchdog); _origOntimeout.call(this); };


  xhr.send(JSON.stringify({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMsg }]
  }));
};

app._processManualAuditResponse = function(raw) {
  if (!raw || !raw.trim()) { alert('Please paste the JSON response first.'); return; }
  raw = raw.replace(/```json[\s\S]*?```|```/g, '').trim();
  var jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (jsonMatch) raw = jsonMatch[0];
  var audit;
  try { audit = JSON.parse(raw); }
  catch(e) {
    alert('Could not parse as JSON. Make sure you copied the full response from Claude.');
    return;
  }
  var payload = app._lastAuditPayload || app.buildAuditPayload();
  app._lastAuditResult = audit;
  app._lastAuditPayload = payload;
  // Hide the manual input section — results will appear below
  var mi = document.getElementById('auditManualInput');
  if (mi) mi.style.display = 'none';
  var se = document.getElementById('auditStatus');
  if (se) se.style.display = 'none';
  app.renderAuditResults(audit, payload);
};

app.renderAuditResults = function(audit, payload) {
  var statusEl = document.getElementById('auditStatus');
  var resultsEl = document.getElementById('auditResults');
  var actionsEl = document.getElementById('auditActions');
  if (!resultsEl || !actionsEl) return;

  if (statusEl) statusEl.style.display = 'none';
  resultsEl.style.display = 'block';
  actionsEl.style.display = 'flex';

  var perf = audit.mode_performance || {};
  var perfKeys = Object.keys(perf); // use actual keys from AI response (e.g. 'custom','custom2')
  var modelSlots = perfKeys; // slots ARE the keys now

  // Performance table
  var tableHtml = '<h3 style="color:#818cf8;font-size:15px;font-weight:700;margin-bottom:10px;">📊 Model Performance</h3>';
  tableHtml += '<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:12px;">';
  tableHtml += '<tr style="color:#94a3b8;border-bottom:1px solid #2a3554;">' +
    '<th style="text-align:left;padding:6px 8px;">Model</th>' +
    '<th style="padding:6px 8px;">Races</th>' +
    '<th style="padding:6px 8px;">Win%</th>' +
    '<th style="padding:6px 8px;">Top3%</th>' +
    '<th style="padding:6px 8px;">ROI</th>' +
    '<th style="padding:6px 8px;">Stability</th>' +
    '<th style="padding:6px 8px;">Quality</th></tr>';

  perfKeys.forEach(function(mk, idx) {
    var p = perf[mk];
    var slot = mk; // keys are now direct slot names
    var modelName = app.getModelName(slot) || p.name || mk;
    var isBest = audit.best_mode === mk;
    var top3Color = p.top3_pct >= 60 ? '#10b981' : p.top3_pct >= 40 ? '#f59e0b' : '#ef4444';
    tableHtml += '<tr style="border-bottom:1px solid #1e2d4a;' + (isBest ? 'background:rgba(99,102,241,0.1);' : '') + '">' +
      '<td style="padding:7px 8px;font-weight:700;color:' + (isBest ? '#818cf8' : '#e2e8f0') + ';">' + (isBest ? '🏆 ' : '') + modelName + '</td>' +
      '<td style="padding:7px 8px;text-align:center;color:#94a3b8;">' + (p.races || (payload.modes[slot] || {}).races || '?') + '</td>' +
      '<td style="padding:7px 8px;text-align:center;color:#10b981;">' + (p.win_pct || 0) + '%</td>' +
      '<td style="padding:7px 8px;text-align:center;color:' + top3Color + ';font-weight:700;">' + (p.top3_pct || 0) + '%</td>' +
      '<td style="padding:7px 8px;text-align:center;color:' + (p.roi >= 0 ? '#10b981' : '#ef4444') + ';">' + (p.roi >= 0 ? '+' : '') + (p.roi || 0) + '</td>' +
      '<td style="padding:7px 8px;text-align:center;">' + Math.round((p.stability || 0) * 100) + '%</td>' +
      '<td style="padding:7px 8px;text-align:center;color:' + (p.data_quality === 'insufficient' ? '#f59e0b' : '#10b981') + ';">' + (p.data_quality || 'good') + '</td></tr>';
  });
  tableHtml += '</table></div>';

  // Best mode callout
  var bestHtml = '';
  if (audit.best_mode && audit.best_mode_reason) {
    var bestIdx = perfKeys.indexOf(audit.best_mode);
    var bestName = bestIdx >= 0 ? app.getModelName(modelSlots[bestIdx]) : audit.best_mode;
    bestHtml = '<div style="background:rgba(16,185,129,0.1);border:1px solid #10b981;border-radius:10px;padding:12px;">' +
      '<p style="color:#10b981;font-weight:700;font-size:13px;">🏆 Best Model: ' + bestName + '</p>' +
      '<p style="color:#94a3b8;font-size:12px;margin-top:4px;">' + audit.best_mode_reason + '</p></div>';
  }

  // Meta blend
  var blendHtml = '';
  if (audit.meta_blend) {
    blendHtml = '<h3 style="color:#818cf8;font-size:14px;font-weight:700;margin-bottom:8px;">⚖ Meta-Blend Influence</h3><div style="display:flex;gap:8px;flex-wrap:wrap;">';
    var blendKeys = Object.keys(audit.meta_blend);
    blendKeys.forEach(function(mk, idx) {
      var pct = audit.meta_blend[mk];
      var name = app.getModelName(mk) || mk;
      var color = pct >= 35 ? '#10b981' : pct >= 20 ? '#f59e0b' : '#94a3b8';
      blendHtml += '<div style="flex:1;min-width:120px;background:#1e2d4a;border-radius:8px;padding:10px;text-align:center;">' +
        '<div style="font-size:11px;color:#94a3b8;">' + name + '</div>' +
        '<div style="font-size:20px;font-weight:700;color:' + color + ';">' + pct + '%</div></div>';
    });
    blendHtml += '</div>';
  }

  // Predictor adjustment summary
  var adjHtml = '';
  if (audit.predictor_adjustment) {
    adjHtml = '<div style="background:rgba(67,56,202,0.15);border:1px solid #4338ca;border-radius:10px;padding:14px;">' +
      '<h3 style="color:#818cf8;font-size:14px;font-weight:700;margin-bottom:6px;">🎯 BasePredictor Recommendation</h3>' +
      '<p style="color:#c7d2fe;font-size:12px;margin-bottom:10px;">' + (audit.predictor_adjustment.summary || '') + '</p>';
    if (audit.predictor_adjustment.new_base_weights) {
      var nw = audit.predictor_adjustment.new_base_weights;
      var curr = payload.base.current_weights;
      adjHtml += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:6px;font-size:11px;">';
      Object.keys(nw).forEach(function(k) {
        var oldVal = curr[k] || 0;
        var newVal = nw[k] || 0;
        var diff = newVal - oldVal;
        var diffStr = diff === 0 ? '' : (diff > 0 ? ' <span style="color:#10b981;">(+' + Math.round(diff) + ')</span>' : ' <span style="color:#ef4444;">(' + Math.round(diff) + ')</span>');
        adjHtml += '<div style="background:#0f1729;padding:5px 8px;border-radius:6px;">' +
          '<span style="color:#94a3b8;">' + k + ':</span> <strong style="color:#e2e8f0;">' + newVal + '</strong>' + diffStr + '</div>';
      });
      adjHtml += '</div>';
    }
    adjHtml += '</div>';
  }

  resultsEl.innerHTML = tableHtml + '<div style="height:12px;"></div>' + bestHtml +
    '<div style="height:12px;"></div>' + blendHtml +
    '<div style="height:12px;"></div>' + adjHtml;

  // Action buttons
  actionsEl.innerHTML =
    '<button id="auditApplyBase" style="flex:1;min-width:200px;background:linear-gradient(135deg,#059669,#10b981);border:none;color:white;padding:11px 16px;border-radius:10px;cursor:pointer;font-size:14px;font-weight:700;">✅ Apply to BasePredictor</button>' +
    '<button id="auditApplyAll" style="flex:1;min-width:200px;background:linear-gradient(135deg,#4338ca,#6366f1);border:none;color:white;padding:11px 16px;border-radius:10px;cursor:pointer;font-size:14px;font-weight:700;">⚡ Apply All (Base + Models)</button>' +
    '<button id="auditDismiss" style="background:rgba(255,255,255,0.08);border:none;color:#94a3b8;padding:11px 16px;border-radius:10px;cursor:pointer;font-size:13px;">Dismiss</button>';

  document.getElementById('auditApplyBase').onclick = function() { app.applyAuditToBase(audit, payload); };
  document.getElementById('auditApplyAll').onclick = function() { app.applyAuditToAll(audit, payload); };
  document.getElementById('auditDismiss').onclick = function() { document.getElementById('aiAuditModal').remove(); };
};

app.applyAuditToBase = function(audit, payload, skipClose) {
  if (!audit.predictor_adjustment || !audit.predictor_adjustment.new_base_weights) {
    showError('No base weight recommendations in audit result.'); return;
  }
  var nw = audit.predictor_adjustment.new_base_weights;
  var keyMap = { odds:'odds', form:'form1', formConsistency:'formConsistency',
    trackWin:'trackWin', trackDistWin:'trackDistWin', jockeyWin:'jockeyWin',
    trainerWin:'trainerWin', freshness:'freshness', tactical:'tactical',
    trackCondition:'trackCondition', classChange:'classChange', pacePressure:'pacePressure',
    formMomentum:'formMomentum', finishStrength:'finishStrength',
    sectionalSpeed:'sectionalSpeed', weatherRailBias:'weatherRailBias',
    secondUpForm:'secondUpForm', jockeyForm:'jockeyForm', trainerForm:'trainerForm' };
  var changed = 0;
  Object.keys(nw).forEach(function(k) {
    var wk = keyMap[k];
    if (wk && app.baseWeights[wk] !== undefined && nw[k] > 0) {
      // AI audit uses ±20% cap (wider than regular learning ±10%)
      var curr = app.baseWeights[wk];
      var proposed = nw[k];
      var capped = Math.max(curr * 0.80, Math.min(curr * 1.20, proposed));
      app.baseWeights[wk] = Math.round(capped * 10) / 10;
      changed++;
    }
  });
  if (app.activeModel === 'base') app.W = app.baseWeights;
  addLog('aiaudit', '🤖 AI Audit applied to BasePredictor — ' + changed + ' weights updated', audit.predictor_adjustment.summary || '');
  if (!skipClose) {
    saveData();
    showSuccess('✅ AI Audit applied to BasePredictor (' + changed + ' weights updated).');
    var modal = document.getElementById('aiAuditModal');
    if (modal) modal.remove();
  }
  return changed;
};

app.applyAuditToAll = function(audit, payload) {
  var baseChanged = app.applyAuditToBase(audit, payload, true);

  var modelWeights = {
    custom: app.customWeights, custom2: app.custom2Weights,
    custom3: app.custom3Weights
  };
  // Complete factor key map including new factors
  var keyMap = { odds:'odds', form:'form1', formConsistency:'formConsistency',
    trackWin:'trackWin', trackDistWin:'trackDistWin', jockeyWin:'jockeyWin',
    trainerWin:'trainerWin', freshness:'freshness', tactical:'tactical',
    trackCondition:'trackCondition', classChange:'classChange', pacePressure:'pacePressure',
    formMomentum:'formMomentum', finishStrength:'finishStrength',
    sectionalSpeed:'sectionalSpeed', weatherRailBias:'weatherRailBias',
    secondUpForm:'secondUpForm', jockeyForm:'jockeyForm', trainerForm:'trainerForm' };
  var rec = audit.recommended_weights || {};
  var perf = audit.mode_performance || {};
  var modelsUpdated = 0;

  // Match by SLOT KEY directly (AI now returns exact slot keys e.g. "custom", "custom2")
  Object.keys(rec).forEach(function(mk) {
    // Skip if this model had insufficient data
    var perfEntry = perf[mk];
    if (perfEntry && perfEntry.data_quality === 'insufficient') return;

    var weights = modelWeights[mk];
    var recWeights = rec[mk];
    if (!weights || !recWeights) return;

    var changed = 0;
    Object.keys(recWeights).forEach(function(k) {
      if (k === 'notes') return;
      var wk = keyMap[k];
      if (wk && weights[wk] !== undefined && recWeights[k] > 0) {
        var curr = weights[wk];
        var capped = Math.max(curr * 0.80, Math.min(curr * 1.20, recWeights[k]));
        weights[wk] = Math.round(capped * 10) / 10;
        changed++;
      }
    });
    if (changed > 0) {
      modelsUpdated++;
      addLog('aiaudit', '🤖 AI Audit applied to ' + app.getModelName(mk) + ' — ' + changed + ' weights updated', recWeights.notes || '');
    }
    if (app.activeModel === mk) app.W = weights;
  });

  saveData();
  var modal = document.getElementById('aiAuditModal');
  if (modal) modal.remove();
  showSuccess('⚡ AI Audit applied: BasePredictor (' + (baseChanged||0) + ' weights) + ' + modelsUpdated + ' custom models updated.');
};

// Manual trigger button (accessible from activity log area)
app.openManualAudit = function() {
  if (app.raceHistory.length < 5) {
    showError('Need at least 5 races in history before running an audit.');
    return;
  }
  if (!window.ANTHROPIC_API_KEY && location.protocol !== 'file:') {
    showError('Enter your Anthropic API key in the field above the audit button first.');
    document.getElementById('apiKeyInput').focus();
    return;
  }
  app.runAIAudit();
};

app.resetWeightsOnly = function() {
if (!confirm('Reset ALL model weights back to factory defaults?\n\nThis resets: BasePredictor, Kimi, Grok, GPT, Saturday weights + venue profiles + factor stats.\n\nYour race history and jockey/trainer stats are KEPT so you can Relearn from History afterwards.\n\nContinue?')) return;
// Reset all model weights
app.baseWeights    = Object.assign({}, app.defaultWeights);
app.customWeights  = Object.assign({}, app.defaultWeights, {
    odds: 200, form1: 90, form2: 60, form3: 30, form4: 15, form5: 8,
    formConsistency: 70, freshness: 30, jockeyWin: 35, trainerWin: 25,
    trackCondition: 75, lastStartMargin: 60, formMomentum: 75, finishStrength: 55,
    pacePressure: 30, classChange: 40, sectionalSpeed: 45
  });
app.custom2Weights = Object.assign({}, app.defaultWeights, {
    odds: 650, form1: 35, form2: 20, form3: 12, form4: 8, form5: 4,
    formConsistency: 25, freshness: 20, jockeyWin: 70, trainerWin: 55,
    trackCondition: 90, lastStartMargin: 25, formMomentum: 30, finishStrength: 25,
    pacePressure: 45, classChange: 65, sectionalSpeed: 40, jockeyForm: 55, trainerForm: 40,
    top3Weight: 0.30, winWeight: 0.70,
    learningObjective: 'top2'
  });
app.custom3Weights = Object.assign({}, app.defaultWeights, {
    // GPT: Place Specialist — finds the frame, not necessarily the win
    // High: consistency, career places, freshness, secondUp, finishStrength, trackCondition
    // Low: odds, jockey glamour, win-form
    odds: 120, rating: 0.9, careerWin: 80, careerPlace: 180,
    trackWin: 55, trackDistWin: 70, jockeyWin: 30, trainerWin: 28,
    form1: 30, form2: 25, form3: 22, form4: 18, form5: 14,
    formConsistency: 110, freshness: 65, weight: 2.0,
    tactical: 35, trackCondition: 120, firstUp: 55, distanceSuit: 60,
    lastStartMargin: 45, railPosition: 25, gearChange: 20,
    pacePressure: 28, classChange: 40, formMomentum: 55, finishStrength: 85,
    sectionalSpeed: 30, weatherRailBias: 35,
    secondUpForm: 70, jockeyForm: 25, trainerForm: 22,
    top3Weight: 0.85, winWeight: 0.15,
    learningObjective: 'top3'
  });
app.saturdayWeights = Object.assign({}, app.defaultWeights);
// Reset venue profiles
app.venueProfiles = {};
localStorage.removeItem('horseVenueProfiles');
// Reset factor stats
app.factorStats = {
total: 0, oddsSuccess: 0, formSuccess: 0, trackSuccess: 0,
jockeySuccess: 0, trainerSuccess: 0, freshnessSuccess: 0,
consistencySuccess: 0, tacticalSuccess: 0, trackCondSuccess: 0,
firstUpSuccess: 0, distanceSuccess: 0, lastMarginSuccess: 0,
gearSuccess: 0, railSuccess: 0, paceSuccess: 0, classSuccess: 0,
momentumSuccess: 0, finStrSuccess: 0, sectionalSuccess: 0, weatherRailSuccess: 0,
careerSuccess: 0, trackDistSuccess: 0, ratingSuccess: 0,
oddsFail: 0, formFail: 0, trackFail: 0, jockeyFail: 0,
trainerFail: 0, freshnessFail: 0, consistencyFail: 0,
tacticalFail: 0, trackCondFail: 0, firstUpFail: 0,
distanceFail: 0, lastMarginFail: 0, gearFail: 0, railFail: 0,
paceFail: 0, classFail: 0, momentumFail: 0, finStrFail: 0,
sectionalFail: 0, weatherRailFail: 0,
careerFail: 0, trackDistFail: 0, ratingFail: 0
};
// Point app.W to whichever model is active
if (app.activeModel === 'custom') app.W = app.customWeights;
else if (app.activeModel === 'custom2') app.W = app.custom2Weights;
else if (app.activeModel === 'custom3') app.W = app.custom3Weights;
else if (app.activeModel === 'saturday') app.W = app.saturdayWeights;
else { app.W = app.baseWeights; app.activeModel = 'base'; }
saveData();
updateStats();
addLog('reset', 'All model weights reset to factory defaults', 'History kept — use Relearn from History to rebuild weights from your ' + app.raceHistory.length + ' saved races');
showSuccess('Weights reset to factory defaults. History preserved (' + app.raceHistory.length + ' races). Hit Relearn from History to rebuild from scratch.');
};
app.resetAllData = function() {
if (confirm('This will delete ALL data: race history, pending races, jockey/trainer stats, and reset all models. This cannot be undone!\n\nContinue?')) {
localStorage.removeItem('horseRaceHistoryV2');
localStorage.removeItem('horsePendingRacesV2');
localStorage.removeItem('horseModelWeightsV2');
localStorage.removeItem('horseCustomWeightsV3');
localStorage.removeItem('horseCustom2WeightsV3');
localStorage.removeItem('horseCustom3WeightsV3');
localStorage.removeItem('horseCustom4WeightsV3');
localStorage.removeItem('horseActiveModel');
localStorage.removeItem('horseBaseMetrics');
localStorage.removeItem('horseCustomMetrics');
localStorage.removeItem('horseCustom2Metrics');
localStorage.removeItem('horseCustom3Metrics');
localStorage.removeItem('horseCustom4Metrics');
localStorage.removeItem('horseActivityLog');
app.activityLog = [];
localStorage.removeItem('horseFactorStatsV2');
localStorage.removeItem('horseJockeyStatsV2');
localStorage.removeItem('horseTrainerStatsV2');
localStorage.removeItem('horseBettingHistoryV2');
app.raceHistory = [];
app.pendingRaces = [];
app.factorStats = null;
app.jockeyStats = {};
app.trainerStats = {};
app.bettingHistory = [];
app.activeBets = [];
app.baseWeights    = Object.assign({}, app.defaultWeights);
app.customWeights  = Object.assign({}, app.defaultWeights, {
    odds: 200, form1: 90, form2: 60, form3: 30, form4: 15, form5: 8,
    formConsistency: 70, freshness: 30, jockeyWin: 35, trainerWin: 25,
    trackCondition: 75, lastStartMargin: 60, formMomentum: 75, finishStrength: 55,
    pacePressure: 30, classChange: 40, sectionalSpeed: 45
  });
app.custom2Weights = Object.assign({}, app.defaultWeights, {
    odds: 650, form1: 35, form2: 20, form3: 12, form4: 8, form5: 4,
    formConsistency: 25, freshness: 20, jockeyWin: 70, trainerWin: 55,
    trackCondition: 90, lastStartMargin: 25, formMomentum: 30, finishStrength: 25,
    pacePressure: 45, classChange: 65, sectionalSpeed: 40, jockeyForm: 55, trainerForm: 40,
    top3Weight: 0.30, winWeight: 0.70,
    learningObjective: 'top2'
  });
app.custom3Weights = Object.assign({}, app.defaultWeights, {
    // GPT: Place Specialist — finds the frame, not necessarily the win
    // High: consistency, career places, freshness, secondUp, finishStrength, trackCondition
    // Low: odds, jockey glamour, win-form
    odds: 120, rating: 0.9, careerWin: 80, careerPlace: 180,
    trackWin: 55, trackDistWin: 70, jockeyWin: 30, trainerWin: 28,
    form1: 30, form2: 25, form3: 22, form4: 18, form5: 14,
    formConsistency: 110, freshness: 65, weight: 2.0,
    tactical: 35, trackCondition: 120, firstUp: 55, distanceSuit: 60,
    lastStartMargin: 45, railPosition: 25, gearChange: 20,
    pacePressure: 28, classChange: 40, formMomentum: 55, finishStrength: 85,
    sectionalSpeed: 30, weatherRailBias: 35,
    secondUpForm: 70, jockeyForm: 25, trainerForm: 22,
    top3Weight: 0.85, winWeight: 0.15,
    learningObjective: 'top3'
  });
app.W = app.baseWeights;
app.activeModel = 'base';
app.baseMetrics    = { correct: 0, total: 0, top2: 0, top3: 0 };
app.saturdayMetrics = { correct: 0, total: 0, top2: 0, top3: 0 };
app.customMetrics  = { correct: 0, total: 0, top2: 0, top3: 0 };
app.custom2Metrics = { correct: 0, total: 0, top2: 0, top3: 0 };
app.custom3Metrics = { correct: 0, total: 0, top2: 0, top3: 0 };
app.updateModelMetrics();
app.switchModel('base', true);
updateStats();
document.getElementById('statsBar').classList.add('hidden');
showSuccess('All data reset to defaults.');
if (!document.getElementById('historyPanel').classList.contains('hidden')) renderHistory();
if (!document.getElementById('pendingPanel').classList.contains('hidden')) renderPending();
}
};
app.safeReset = function() {
var msg = '\u{1F6E1} SAFE RESET (Non-Base Models)\n\n';
msg += 'This will reset weights for:\n';
msg += '  \u2713 Kimi, Grok, GPT, Gemini, Saturday \u2014 back to factory defaults\n\n';
msg += 'This will NOT touch:\n';
msg += '  \u2717 BasePredictor weights (protected)\n';
msg += '  \u2717 Race history, jockey/trainer stats\n';
msg += '  \u2717 Factor stats, venue profiles\n\n';
msg += 'Continue?';
if (!confirm(msg)) return;
app.customWeights = Object.assign({}, app.defaultWeights, {
  odds: 200, form1: 90, form2: 60, form3: 30, form4: 15, form5: 8,
  formConsistency: 70, freshness: 30, jockeyWin: 35, trainerWin: 25,
  trackCondition: 75, lastStartMargin: 60, formMomentum: 75, finishStrength: 55,
  pacePressure: 30, classChange: 40, sectionalSpeed: 45
});
app.custom2Weights = Object.assign({}, app.defaultWeights, {
  odds: 650, form1: 35, form2: 20, form3: 12, form4: 8, form5: 4,
  formConsistency: 25, freshness: 20, jockeyWin: 70, trainerWin: 55,
  trackCondition: 90, lastStartMargin: 25, formMomentum: 30, finishStrength: 25,
  pacePressure: 45, classChange: 65, sectionalSpeed: 40, jockeyForm: 55, trainerForm: 40,
  top3Weight: 0.30, winWeight: 0.70,
  learningObjective: 'top2'
});
app.custom3Weights = Object.assign({}, app.defaultWeights, {
  odds: 120, rating: 0.9, careerWin: 80, careerPlace: 180,
  trackWin: 55, trackDistWin: 70, jockeyWin: 30, trainerWin: 28,
  form1: 30, form2: 25, form3: 22, form4: 18, form5: 14,
  formConsistency: 110, freshness: 65, weight: 2.0,
  tactical: 35, trackCondition: 120, firstUp: 55, distanceSuit: 60,
  lastStartMargin: 45, railPosition: 25, gearChange: 20,
  pacePressure: 28, classChange: 40, formMomentum: 55, finishStrength: 85,
  sectionalSpeed: 30, weatherRailBias: 35,
  secondUpForm: 70, jockeyForm: 25, trainerForm: 22,
  top3Weight: 0.85, winWeight: 0.15,
  learningObjective: 'top3'
});
app.saturdayWeights = Object.assign({}, app.defaultWeights);
app.customMetrics  = { correct: 0, total: 0, top2: 0, top3: 0 };
app.custom2Metrics = { correct: 0, total: 0, top2: 0, top3: 0 };
app.custom3Metrics = { correct: 0, total: 0, top2: 0, top3: 0 };
app.saturdayMetrics = { correct: 0, total: 0, top2: 0, top3: 0 };
if (app.activeModel === 'custom') app.W = app.customWeights;
else if (app.activeModel === 'custom2') app.W = app.custom2Weights;
else if (app.activeModel === 'custom3') app.W = app.custom3Weights;
else if (app.activeModel === 'saturday') app.W = app.saturdayWeights;
saveData();
updateStats();
app.updateModelMetrics();
showSuccess('Safe Reset complete \u2014 Kimi/Grok/GPT/Gemini/Saturday reset to factory defaults. BasePredictor protected.');
addLog('info', 'Safe Reset \u2014 5 non-Base models reset to factory weights. BasePredictor protected.', 'Race history preserved. Base weights unchanged.');
};
app.resetBaseModel = function() {
var msg = '\u26a0 RESET BASE MODEL\n\n';
msg += 'This will wipe Base\'s learned weights. Its scar tissue memory will be saved first.\n\n';
msg += 'Base will return to factory defaults and resume learning fresh.\n';
msg += 'Overweighted factors will be remembered and dampened for the next 100 races.\n\n';
msg += 'This cannot be undone. Continue?';
if (!confirm(msg)) return;
// --- A) Compute scar tissue snapshot before wiping ---
var now = new Date();
var timestamp = now.toISOString().slice(0, 19);
// Accuracy at reset
var accuracyAtReset = 0;
if (app.baseMetrics && app.baseMetrics.total > 0) {
  accuracyAtReset = Math.round((app.baseMetrics.top3 / app.baseMetrics.total) * 1000) / 10;
}
// Trend from last 20 races
var trend = 'stable';
var history = app.raceHistory || [];
if (history.length >= 20) {
  var last20 = history.slice(-20);
  var prev10 = last20.slice(0, 10);
  var last10 = last20.slice(10);
  var prev10Acc = prev10.reduce(function(s, r) { return s + (r.top3Hits || 0); }, 0) / 10;
  var last10Acc = last10.reduce(function(s, r) { return s + (r.top3Hits || 0); }, 0) / 10;
  var diff = (last10Acc - prev10Acc) / 3 * 100; // divide by 3 to normalise against max possible hits/race
  if (diff < -5) trend = 'declining';
  else if (diff > 5) trend = 'improving';
}
// Overweighted factors (>15% above factory default)
var scarFactorKeys = ['odds', 'form1', 'formConsistency', 'trackWin', 'trackDistWin', 'jockeyWin',
  'trainerWin', 'freshness', 'pacePressure', 'classChange', 'formMomentum', 'sectionalSpeed',
  'trackCondition', 'careerWin', 'finishStrength', 'weatherRailBias', 'form2', 'tactical',
  'firstUp', 'distanceSuit', 'lastStartMargin', 'railPosition', 'gearChange'];
var overweightedFactors = [];
for (var owi = 0; owi < scarFactorKeys.length; owi++) {
  var fk = scarFactorKeys[owi];
  var dflt = app.defaultWeights[fk];
  var curr = app.baseWeights[fk];
  if (dflt && curr && curr > dflt * 1.15) overweightedFactors.push(fk);
}
// Build snapshot
var snapshot = {
  timestamp: timestamp,
  accuracyAtReset: accuracyAtReset,
  trend: trend,
  racesCompleted: app.baseMetrics ? (app.baseMetrics.total || 0) : 0,
  overweightedFactors: overweightedFactors,
  weightSnapshot: Object.assign({}, app.baseWeights)
};
// Append to scar tissue array (max 10)
var scarTissue = [];
try { scarTissue = JSON.parse(localStorage.getItem('horseBaseScarTissue') || '[]'); } catch(e) { scarTissue = []; }
scarTissue.push(snapshot);
if (scarTissue.length > 10) scarTissue = scarTissue.slice(-10);
localStorage.setItem('horseBaseScarTissue', JSON.stringify(scarTissue));
// --- Reset base weights to factory defaults ---
app.baseWeights = app.sanitizeWeights(Object.assign({}, app.defaultWeights, {
  odds: 680, formConsistency: 51, trackWin: 130, trackDistWin: 111, jockeyWin: 81, trainerWin: 52, freshness: 52, tactical: 53, trackCondition: 138, classChange: 91, pacePressure: 70, formMomentum: 101, finishStrength: 85, sectionalSpeed: 48, weatherRailBias: 69
}));
app.baseMetrics = { correct: 0, total: 0, top2: 0, top3: 0 };
if (app.activeModel === 'base') app.W = app.baseWeights;
// --- B) Create drift guard ---
var driftGuard = {
  active: true,
  resetAt: timestamp,
  racesRun: 0,
  guardsUntilRace: 100,
  protectedFactors: overweightedFactors
};
localStorage.setItem('horseBaseDriftGuard', JSON.stringify(driftGuard));
app._scarTissueDriftGuard = driftGuard;
saveData();
updateStats();
app.updateModelMetrics();
var trendIcon = trend === 'declining' ? '\ud83d\udcc9' : trend === 'improving' ? '\ud83d\udcc8' : '\u27a1';
showSuccess('Base model reset. Scar tissue saved (accuracy: ' + accuracyAtReset + '%, trend: ' + trendIcon + '). Drift guard active — see Activity Log for details.');
addLog('info', 'Base model reset \u2014 scar tissue saved. Drift guard active on: ' + (overweightedFactors.join(', ') || 'none'), 'Accuracy at reset: ' + accuracyAtReset + '% | Trend: ' + trend + ' | Races completed: ' + snapshot.racesCompleted);
};
app.resetFactorStats = function() {
if (!confirm('Reset factor effectiveness tracking?\n\nThis zeros all factor percentages. Use "Relearn from History" after to rebuild stats from any races that have stored factor data.\n\nContinue?')) return;
app.factorStats = {
total: 0, oddsSuccess: 0, formSuccess: 0, trackSuccess: 0,
jockeySuccess: 0, trainerSuccess: 0, freshnessSuccess: 0,
consistencySuccess: 0, tacticalSuccess: 0, trackCondSuccess: 0,
firstUpSuccess: 0, distanceSuccess: 0, lastMarginSuccess: 0,
gearSuccess: 0, railSuccess: 0, paceSuccess: 0, classSuccess: 0,
momentumSuccess: 0, finStrSuccess: 0, sectionalSuccess: 0, weatherRailSuccess: 0,
careerSuccess: 0, trackDistSuccess: 0, ratingSuccess: 0,
oddsFail: 0, formFail: 0, trackFail: 0, jockeyFail: 0,
trainerFail: 0, freshnessFail: 0, consistencyFail: 0,
tacticalFail: 0, trackCondFail: 0, firstUpFail: 0,
distanceFail: 0, lastMarginFail: 0, gearFail: 0, railFail: 0,
paceFail: 0, classFail: 0, momentumFail: 0, finStrFail: 0,
sectionalFail: 0, weatherRailFail: 0,
careerFail: 0, trackDistFail: 0, ratingFail: 0
};
saveData();
showSuccess('Factor stats reset! Percentages will rebuild as you record new races.');
if (!document.getElementById('historyPanel').classList.contains('hidden')) renderHistory();
};
app.relearnFromHistory = function() {
if (app.raceHistory.length === 0) {
showError('No race history to learn from.');
return;
}
var msg = 'Relearn from ' + app.raceHistory.length + ' races?\n\n';
msg += 'This will:\n';
msg += '* Keep Base weights unchanged (Base replays from current learned state)\n';
msg += '* Reset Kimi, Grok and GPT to latest audit-calibrated starting weights\n';
msg += '* Replay every race through each model using its own objective\n';
msg += '* Rebuild venue profiles and pattern library\n\n';
msg += 'This takes a few seconds. Continue?';
if (!confirm(msg)) return;

// ── Reset specialist models to philosophy starting points ────────────────
// BASE IS NOT RESET — it keeps its learned state and replays history from there.
// Preserves everything Base has genuinely learned. Only specialists reset.

// Kimi — AI Audit 20/03/2026: Grok leads 40% wins; Kimi/GPT tactical fixed
app.customWeights = app.sanitizeWeights(Object.assign({}, app.defaultWeights, {
  odds: 22, form: 74, formConsistency: 133, trackWin: 131, trackDistWin: 116, jockeyWin: 103, trainerWin: 58, freshness: 134, tactical: 22, trackCondition: 116, classChange: 133, pacePressure: 136, formMomentum: 43, finishStrength: 134, sectionalSpeed: 84, weatherRailBias: 79, secondUpForm: 31, jockeyForm: 37, trainerForm: 26
}));
// Grok: Top-2 Hunter top2 — AI Audit 20/03/2026: best model 40% wins
app.custom2Weights = app.sanitizeWeights(Object.assign({}, app.defaultWeights, {
  odds: 94, form: 108, formConsistency: 165, trackWin: 154, trackDistWin: 170, jockeyWin: 126, trainerWin: 116, freshness: 94, tactical: 116, trackCondition: 165, classChange: 142, pacePressure: 146, formMomentum: 154, finishStrength: 134, sectionalSpeed: 124, weatherRailBias: 129, secondUpForm: 30, jockeyForm: 37, trainerForm: 27
}));

// GPT/deeplearn: Place Finder top3 — AI Audit 17/03/2026 (top performer)
app.custom3Weights = app.sanitizeWeights(Object.assign({}, app.defaultWeights, {
  odds: 171, form1: 35, form2: 25, form3: 22, form4: 18, form5: 14,
  formConsistency: 102, freshness: 63,
  jockeyWin: 34, trainerWin: 30,
  trackWin: 61, trackDistWin: 77,
  trackCondition: 118, tactical: 41,
  classChange: 41, pacePressure: 32,
  formMomentum: 57, finishStrength: 80,
  sectionalSpeed: 33, weatherRailBias: 38,
  secondUpForm: 35, jockeyForm: 34, trainerForm: 30,
  top3Weight: 0.85, winWeight: 0.15, learningObjective: 'top3'
}));

// Saturday stays as-is - only learns on Saturdays

app.W = app.baseWeights;

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
app.jockeyStats = {};
app.trainerStats = {};
app.venueProfiles = {};
app.patternLibrary = {}; // rebuild patterns from scratch during relearn

// ── Helper: replay one race through learn() for a specific model weight object ──
