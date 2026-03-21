'use strict';

app.recordAllModels = function() {
  if (!app._raceModelResults || app._raceModelResults.length === 0) {
    showError('No race mode results to record');
    return;
  }
  var name1 = document.getElementById('winner1Select').value;
  var name2 = document.getElementById('winner2Select').value;
  var name3 = document.getElementById('winner3Select').value;
  if (!name1) { showError('Please select at least the winner!'); return; }
  if (name2 && name1 === name2) { showError('Same horse in multiple positions!'); return; }
  if (name3 && (name1 === name3 || name2 === name3)) { showError('Same horse in multiple positions!'); return; }

  // Store actuals
  app._lastActuals = [name1, name2, name3].filter(Boolean);

  // Find actual horse objects from Base field (same horses across models)
  var baseResult = app._raceModelResults.filter(function(m){ return m.key === 'base'; })[0];
  var allHorses  = baseResult ? baseResult.field : app.horses;
  var actual1 = allHorses.filter(function(h){ return h.name === name1; })[0];
  var actual2 = name2 ? allHorses.filter(function(h){ return h.name === name2; })[0] : null;
  var actual3 = name3 ? allHorses.filter(function(h){ return h.name === name3; })[0] : null;
  if (!actual1) { showError('Could not find winner horse data!'); return; }

  var summaries = [];

  // Process each model
  app._raceModelResults.forEach(function(m) {
    var field     = m.field;
    var predicted1 = m.top3[0];
    var predicted2 = m.top3[1];
    // Grok (custom2) is a Top-2 Hunter — only evaluates against its 2 picks
    var isGrok     = m.key === 'custom2';
    var predicted3 = isGrok ? null : m.top3[2];
    if (!predicted1) return;

    var isCorrect  = actual1.name === predicted1.name;
    var pNames2    = [predicted1.name, predicted2 ? predicted2.name : ''];
    var pNames3    = isGrok ? pNames2 : [predicted1.name, predicted2 ? predicted2.name : '', predicted3 ? predicted3.name : ''];
    var aNames2    = [actual1.name, actual2 ? actual2.name : ''].filter(Boolean);
    var aNames3    = isGrok ? aNames2 : [actual1.name, actual2 ? actual2.name : '', actual3 ? actual3.name : ''].filter(Boolean);
    var top2Any    = aNames2.length >= 1 && aNames2.every(function(n){ return pNames2.indexOf(n) !== -1; });
    // top3Any: all provided actuals appear somewhere in predicted top-3 (order-agnostic)
    // For Grok (top-2 hunter) top3Any is the same as top2Any
    var top3Any    = isGrok ? top2Any : (aNames3.length >= 2 && aNames3.every(function(n){ return pNames3.indexOf(n) !== -1; }));

    // Count hits (Grok counts against its 2 picks only)
    var hits = 0;
    aNames3.forEach(function(n){ if (n && pNames3.indexOf(n) !== -1) hits++; });
    app._lastTop3Hits = hits;

    // Run learn() for this model
    var prevW   = app.W;
    var modelW  = m.key === 'base'    ? app.baseWeights    :
                  m.key === 'custom'  ? app.customWeights  :
                  m.key === 'custom2' ? app.custom2Weights :
                                        app.custom3Weights;
    app.W = modelW;

    // Find predicted horse objects from this model's field
    var p1obj = field.filter(function(h){ return h.name === predicted1.name; })[0] || predicted1;
    var p2obj = predicted2 ? field.filter(function(h){ return h.name === predicted2.name; })[0] || predicted2 : null;
    var p3obj = predicted3 ? field.filter(function(h){ return h.name === predicted3.name; })[0] || predicted3 : null;
    var a1obj = field.filter(function(h){ return h.name === actual1.name; })[0] || actual1;
    var a2obj = actual2 ? field.filter(function(h){ return h.name === actual2.name; })[0] || actual2 : null;
    var a3obj = actual3 ? field.filter(function(h){ return h.name === actual3.name; })[0] || actual3 : null;

    var learnMsg = learn(a1obj, p1obj, a2obj, p2obj, a3obj, p3obj);
    app.W = prevW;

    // Update metrics
    var metrics = m.key === 'base'    ? app.baseMetrics    :
                  m.key === 'custom'  ? app.customMetrics  :
                  m.key === 'custom2' ? app.custom2Metrics :
                                        app.custom3Metrics;
    metrics.total++;
    if (isCorrect) metrics.correct++;
    if (top2Any)   metrics.top2++;
    if (top3Any)   metrics.top3++;

    // Save to race history (Base saves the canonical record)
    if (m.key === 'base') {
      var _compactField = field.map(function(h) {
        return { name:h.name, odds:h.odds, barrier:h.barrier, weight:h.weight,
          scratched:h.scratched, score:h.score, winScore:h.winScore,
          factorContributions: h.factorContributions ? JSON.parse(JSON.stringify(h.factorContributions)) : {} };
      });
      app.raceHistory.push({
        race: (app.raceInfo.track||'Race') + ' ' + (app.raceInfo.race||''),
        track: app.raceInfo.track||'',
        predicted: predicted1.name, actual: actual1.name,
        actual2: actual2?actual2.name:'', actual3: actual3?actual3.name:'',
        predicted2: predicted2?predicted2.name:'', predicted3: predicted3?predicted3.name:'',
        correct: isCorrect, top2: !!top2Any, top3: !!top3Any,
        top3Hits: hits, learnMsg: learnMsg,
        predictedOdds: predicted1.odds||0, actualOdds: actual1.odds||0,
        date: new Date().toLocaleDateString(),
        winnerFactors: app._lastWinnerFactors||null,
        fieldSnapshot: _compactField,
        baseWeightsSnapshot: JSON.parse(JSON.stringify(app.baseWeights)),
        model: 'race_mode'
      });
      // Pattern library
      if (app._lastWinnerFactors && actual1) {
        if (typeof app.recordPattern === 'function') {
          app.recordPattern(actual1, app._lastWinnerFactors, isCorrect);
        }
      }
      // Trifecta box reinforcement
      if (top3Any && a1obj && a2obj && a3obj) {
        var placers = [a1obj, a2obj, a3obj];
        var boostRate = 0.003;
        placers.forEach(function(placer) {
          if (!placer.factorContributions) return;
          var fc = placer.factorContributions;
          if ((fc.odds||0)>20)    app.baseWeights.odds     = Math.min(1500, app.baseWeights.odds    *(1+boostRate));
          if ((fc.form||0)>20)    app.baseWeights.form1    = Math.min(280,  app.baseWeights.form1   *(1+boostRate));
          if ((fc.pace||0)>10)    app.baseWeights.pacePressure = Math.min(200, app.baseWeights.pacePressure*(1+boostRate));
          if ((fc.finStr||0)>10)  app.baseWeights.finishStrength = Math.min(200, app.baseWeights.finishStrength*(1+boostRate));
          if ((fc.momentum||0)>10)app.baseWeights.formMomentum = Math.min(200, app.baseWeights.formMomentum*(1+boostRate));
        });
      }
    }

    summaries.push({ model: m.key, name: m.name, color: m.color,
                     correct: isCorrect, hits: hits, top3Any: !!top3Any, predicted: predicted1.name,
                     maxPicks: isGrok ? 2 : 3 });
    var maxPicksLabel = isGrok ? '2' : '3';
    addLog('result', (isCorrect?'✅':'❌') + ' ' + m.name + ': ' + hits + '/' + maxPicksLabel + ' — ' + predicted1.name,
      'Actual: ' + name1 + (name2?'/'+name2:'') + (name3?'/'+name3:''));
  });

  // ── Base learns from all-model consensus ─────────────────────────────────
  // Collect all horses predicted by ALL specialist models (Kimi, Grok, GPT)
  // Horses that appear in 2+ models get an extra reinforcement in Base weights
  var specialistModels = ['custom', 'custom2', 'custom3'];
  var consensusCount = {};
  app._raceModelResults.forEach(function(m) {
    if (specialistModels.indexOf(m.key) === -1) return;
    m.top3.forEach(function(h) {
      consensusCount[h.name] = (consensusCount[h.name] || 0) + 1;
    });
  });
  var baseResult2 = app._raceModelResults.filter(function(m){ return m.key === 'base'; })[0];
  if (baseResult2) {
    var baseField = baseResult2.field;
    var actuals3Names = [name1, name2, name3].filter(Boolean);
    // Reinforce base weights for horses that all 3 specialists agreed on AND were actual placers
    Object.keys(consensusCount).forEach(function(horseName) {
      if (consensusCount[horseName] < 2) return; // skip unless at least 2 specialist models agree
      var horseObj = baseField.filter(function(h){ return h.name === horseName; })[0];
      if (!horseObj || !horseObj.factorContributions) return;
      var wasActual = actuals3Names.indexOf(horseName) !== -1;
      var isConsensus3 = consensusCount[horseName] >= 3;
      var prevW = app.W;
      app.W = app.baseWeights;
      var fc = horseObj.factorContributions;
      // Boost rates: consensus-3 actual = strong reinforce; consensus-2 actual = moderate reinforce
      // consensus miss = small penalty to discourage over-reliance on group-think
      var BOOST_C3_HIT = 0.006;  // all 3 specialists agreed AND horse placed
      var BOOST_C2_HIT = 0.004;  // 2 specialists agreed AND horse placed
      var PENALTY_C3   = -0.003; // all 3 agreed but horse missed
      var PENALTY_C2   = -0.002; // 2 agreed but horse missed
      var boostRate = isConsensus3 ? (wasActual ? BOOST_C3_HIT : PENALTY_C3) : (wasActual ? BOOST_C2_HIT : PENALTY_C2);
      // Apply micro-adjustments to base on consensus agreement / disagreement
      // Use weightSafeRanges for bounds consistency
      var wsr = app.weightSafeRanges || {};
      function adjBase(key, fcKey) {
        var r = wsr[key];
        if (!r) return;
        if ((fc[fcKey] || 0) > 0) app.baseWeights[key] = Math.min(r[1], Math.max(r[0], app.baseWeights[key] * (1 + boostRate)));
      }
      adjBase('form1',         'form');
      adjBase('pacePressure',  'pace');
      adjBase('odds',          'odds');
      adjBase('finishStrength','finStr');
      adjBase('formMomentum',  'momentum');
      adjBase('sectionalSpeed','sectional');
      adjBase('raceOrder',     'raceOrder');
      adjBase('barrierOrder',  'barrierOrder');
      app.W = prevW;
    });
  }

  saveData(); updateStats(); app.updateModelMetrics();
  app.winnerSet = true;

  // Show combined result banner
  var winnerBox = document.getElementById('winnerBox');
  winnerBox.innerHTML = '';
  var resultDiv = document.createElement('div');
  resultDiv.className = 'result-msg';
  var title = document.createElement('h3');
  var bestHits = Math.max.apply(null, summaries.map(function(s){ return s.hits; }));
  title.style.color = bestHits >= 3 ? '#a855f7' : bestHits >= 2 ? '#10b981' : bestHits === 1 ? '#f59e0b' : '#ef4444';
  title.textContent = bestHits >= 3 ? '🎰 TRIFECTA BOX — All 3 in frame!' : bestHits >= 2 ? '🎯 QUINELLA HIT' : bestHits === 1 ? '1 in frame' : '❌ All models missed';
  resultDiv.appendChild(title);

  // Summary table
  var tbl = document.createElement('div');
  tbl.style.cssText = 'display:grid; grid-template-columns:repeat(' + summaries.length + ',1fr); gap:6px; margin-top:10px;';
  summaries.forEach(function(s) {
    var cell = document.createElement('div');
    cell.style.cssText = 'background:rgba(15,23,42,0.5); border:1px solid ' + (s.correct?'#10b981':s.hits>=2?'#f59e0b':'#1e2740') + '; border-radius:8px; padding:8px; text-align:center;';
    var mp = s.maxPicks || 3;
    cell.innerHTML = '<div style="color:' + s.color + '; font-size:10px; font-weight:700; margin-bottom:3px;">' + s.name + '</div>' +
      '<div style="font-size:20px; font-weight:800; color:' + (s.hits>=2?'#10b981':s.hits===1?'#f59e0b':'#ef4444') + ';">' + s.hits + '/' + mp + '</div>' +
      '<div style="font-size:10px; color:#475569;">' + (s.correct?'✅ Win':s.hits>=2?'🎯 Frame':'❌') + '</div>';
    tbl.appendChild(cell);
  });
  resultDiv.appendChild(tbl);
  winnerBox.appendChild(resultDiv);

  // Show Re-run button
  if (bestHits < 3 && app.horses && app.horses.length > 0) {
    var cfDiv = document.createElement('div');
    cfDiv.style.cssText = 'margin-top:14px; padding:10px 12px; background:rgba(99,102,241,0.08); border:1px solid #6366f1; border-radius:10px;';
    cfDiv.innerHTML = '<p style="font-size:12px; color:#a5b4fc; margin-bottom:6px; font-weight:600;">🔁 Re-run with Lab hypothesis</p>' +
      '<button id="cfAnalyseBtn" class="btn" style="background:linear-gradient(135deg,#4f46e5,#6366f1); font-size:13px; padding:8px 16px; margin-top:0;" onclick="app.rerunRace()">🔁 Re-run This Race</button>' +
      '<div id="cfResult" style="margin-top:10px; display:none;"></div>';
    winnerBox.appendChild(cfDiv);
  }

  showSuccess('All models updated! Best result: ' + bestHits + '/3');
  document.getElementById('savePrompt').classList.add('hidden');
};

// ── Pattern Library: record race fingerprints ─────────────────────────────
app.recordPattern = function(winnerHorse, winnerFactors, wasCorrect) {
  if (!winnerHorse || !winnerFactors) return;
  if (!app.patternLibrary) app.patternLibrary = {};
  // Build a fingerprint from key race context + winner attributes
  var ri = app.raceInfo || {};
  var dist = parseInt(ri.distance) || 0;
  var distBand = dist <= 1100 ? 'sprint' : dist <= 1400 ? 'mile' : dist <= 1800 ? 'middle' : 'staying';
  var cond = (ri.conditionType || 'good');
  var style = (winnerHorse.runningStyle || 'unknown').toLowerCase();
  var oddsRange = winnerHorse.odds <= 3 ? 'fav' : winnerHorse.odds <= 7 ? 'mid' : 'long';
  var key = [distBand, cond, style, oddsRange].join('|');
  if (!app.patternLibrary[key]) {
    app.patternLibrary[key] = { count: 0, wins: 0, factors: {} };
  }
  var p = app.patternLibrary[key];
  p.count++;
  if (wasCorrect) p.wins++;
  // Accumulate which factors the winner had
  for (var fk in winnerFactors) {
    if (winnerFactors[fk]) {
      p.factors[fk] = (p.factors[fk] || 0) + 1;
    }
  }
  // Keep pattern library from growing unbounded
  var keys = Object.keys(app.patternLibrary);
  if (keys.length > 200) {
    // Drop the least-seen pattern
    var leastKey = keys.reduce(function(a, b) {
      return app.patternLibrary[a].count < app.patternLibrary[b].count ? a : b;
    });
    delete app.patternLibrary[leastKey];
  }
  try { localStorage.setItem('horsePatternLibrary', JSON.stringify(app.patternLibrary)); } catch(e) {}
};

// ── Lab Model — Base-generated hypothesis weights ─────────────────────────
// After a race Base looks at the gap between its prediction and the actual result.
// It boosts weights for factors the winner had that Base undervalued,
// and reduces weights for factors Base was relying on that the winner didn't have.
// This is Base talking to itself — purely for post-race testing, no live predictions.

app.generateLabWeights = function() {
  // Need the actual winner's factor contributions and Base's predicted horse's
  if (!app.horses || app.horses.length === 0) return null;

  // Find actual winner and Base's top pick from current horses
  // Read from stored actuals (winner selects may be gone)
  var actuals = app._lastActuals || [];
  if (actuals.length === 0) {
    var a1 = (document.getElementById('winner1Select')||{}).value||'';
    var a2 = (document.getElementById('winner2Select')||{}).value||'';
    var a3 = (document.getElementById('winner3Select')||{}).value||'';
    actuals = [a1, a2, a3].filter(Boolean);
  }
  if (actuals.length === 0) return null;

  // Get factor contributions for each actual placer
  var placers = actuals.map(function(n) {
    return app.horses.filter(function(h){ return h.name === n; })[0];
  }).filter(Boolean);

  // Get Base's top 3 picks
  var basePicks = app.horses.filter(function(h){ return !h.scratched; }).slice(0,3);

  if (placers.length === 0) return null;

  // Factor key → weight key mapping
  var fcToWeight = {
    odds:       'odds',
    form:       'form1',
    track:      'trackWin',
    freshness:  'freshness',
    tactical:   'tactical',
    trackCond:  'trackCondition',
    firstUp:    'firstUp',
    distance:   'distanceSuit',
    lastMargin: 'lastStartMargin',
    gear:       'gearChange',
    rail:       'railPosition',
    pace:       'pacePressure',
    classChg:   'classChange',
    momentum:   'formMomentum',
    finStr:     'finishStrength',
    sectional:  'sectionalSpeed',
    weatherRail:'weatherRailBias',
    secondUp:   'secondUpForm'
  };

  // Always start from wherever Base currently is — not factory defaults, not fixed config.
  // As Base learns and its weights shift, Lab's starting point shifts with it.
  // The hypothesis is always relative to Base's current understanding.
  var labW = JSON.parse(JSON.stringify(app.baseWeights));

  // For each factor: compare average contribution in actual placers vs Base picks
  // If placers scored HIGH on a factor that Base picks scored LOW → boost that weight
  // If Base picks scored HIGH on a factor that placers scored LOW → reduce that weight
  var maxChange = 0.15; // ±15% cap — looking for direction, not perfection

  Object.keys(fcToWeight).forEach(function(fcKey) {
    var wKey = fcToWeight[fcKey];
    if (!labW[wKey]) return;

    // Average contribution of this factor in actual placers
    var placerAvg = 0;
    placers.forEach(function(h) {
      if (h.factorContributions && h.factorContributions[fcKey] !== undefined) {
        placerAvg += Math.abs(h.factorContributions[fcKey]);
      }
    });
    placerAvg = placers.length > 0 ? placerAvg / placers.length : 0;

    // Average contribution in Base picks
    var pickAvg = 0;
    basePicks.forEach(function(h) {
      if (h.factorContributions && h.factorContributions[fcKey] !== undefined) {
        pickAvg += Math.abs(h.factorContributions[fcKey]);
      }
    });
    pickAvg = basePicks.length > 0 ? pickAvg / basePicks.length : 0;

    // Normalise: only adjust if there's meaningful signal
    var totalSignal = placerAvg + pickAvg;
    if (totalSignal < 1) return;

    // Gap: positive = placers had more of this factor
    var gap = (placerAvg - pickAvg) / totalSignal; // -1 to +1

    // Apply proportional adjustment capped at ±15%
    var adjustment = gap * maxChange;
    labW[wKey] = Math.round(labW[wKey] * (1 + adjustment));

    // Keep within reasonable bounds (50% - 200% of default)
    var def = app.defaultWeights[wKey] || labW[wKey];
    labW[wKey] = Math.max(Math.round(def * 0.5), Math.min(Math.round(def * 2.0), labW[wKey]));
  });

  labW.learningObjective = 'lab'; // marker so it doesn't interfere with normal learning
  app.labWeights = labW;
  addLog('info', '🧪 Lab weights generated from race gap analysis', '');
  return labW;
};

// Reset lab weights (called before each new race)
app.resetLabWeights = function() {
  app.labWeights = null;
};

app.rerunRace = function() {
  var btn = document.getElementById('cfAnalyseBtn');
  var resultDiv = document.getElementById('cfResult');
  if (!btn || !resultDiv) return;
  if (!app.horses || app.horses.length === 0) {
    showError('Horse data no longer in memory');
    return;
  }

  btn.disabled = true;
  btn.textContent = '⏳ Re-scoring...';
  resultDiv.style.display = 'block';

  // Actual result — read from stored actuals (winner selects are gone by now)
  var actuals = app._lastActuals || [];
  if (actuals.length === 0) {
    // Fallback: try selects in case they still exist
    var a1 = (document.getElementById('winner1Select')||{}).value||'';
    var a2 = (document.getElementById('winner2Select')||{}).value||'';
    var a3 = (document.getElementById('winner3Select')||{}).value||'';
    actuals = [a1, a2, a3].filter(Boolean);
  }
  if (actuals.length === 0) {
    resultDiv.innerHTML = '<p style="color:#ef4444; font-size:12px;">Could not read race result — try immediately after recording winner.</p>';
    btn.disabled = false; btn.textContent = '🔁 Re-run This Race';
    return;
  }
  var baseHits = app._lastTop3Hits || 0;

  // Race context — used to tag the reference config
  var ctx = getRaceContext();
  var contextKey = ctx.condType + '|' + ctx.distBand + '|' + ctx.fieldBand + '|' + ctx.classBand;

  // Re-score with each specialist
  // Generate Lab weights — Base hypothesis for this specific race
  var labW = app.generateLabWeights();

  var models = [
    { key:'custom',  name: app.getModelName('custom'),  weights: app.customWeights  },
    { key:'custom2', name: app.getModelName('custom2'), weights: app.custom2Weights },
    { key:'custom3', name: app.getModelName('custom3'), weights: app.custom3Weights },
    { key:'lab',     name: '🧪 Lab',                   weights: labW, isLab: true   }
  ].filter(function(m){ return !!m.weights; });

  var results = models.map(function(m) {
    var testField = JSON.parse(JSON.stringify(app.horses));
    var prevW = app.W;
    app.W = m.weights;
    scoreHorses(testField);
    app.W = prevW;
    var top3 = testField.filter(function(h){ return !h.scratched; }).slice(0,3).map(function(h){ return h.name; });
    var hits = actuals.filter(function(n){ return top3.indexOf(n) !== -1; }).length;
    return { key: m.key, name: m.name, hits: hits, top3: top3, weights: m.weights,
             improved: hits > baseHits, same: hits === baseHits };
  });

  results.sort(function(a,b){ return b.hits - a.hits; });
  var best = results[0];
  var anyImproved = best && best.improved;

  // ── AUTO-STORE reference config if better result found ───────────────────
  // No button needed — if it got closer, store it automatically as a reference
  // tagged to this race context. Base can consult these references over time.
  if (anyImproved) {
    if (!app.weightReferences) app.weightReferences = {};
    if (!app.weightReferences[contextKey]) app.weightReferences[contextKey] = [];
    app.weightReferences[contextKey].push({
      date:       new Date().toLocaleDateString(),
      race:       (app.raceInfo.track||'') + ' ' + (app.raceInfo.race||''),
      context:    ctx,
      model:      best.key,
      modelName:  best.name,
      hits:       best.hits,
      baseHits:   baseHits,
      weights:    JSON.parse(JSON.stringify(best.weights)),
      actuals:    actuals,
      top3:       best.top3
    });
    localStorage.setItem('horseWeightReferences', JSON.stringify(app.weightReferences));
    addLog('learn', '📌 Reference stored: ' + best.name + ' got ' + best.hits + '/3 vs Base ' + baseHits + '/3 on ' + contextKey, best.top3.join(', '));
  }

  // ── BUILD RESULT HTML ─────────────────────────────────────────────────────
  var html = '<div style="font-size:12px;">';

  // Base
  html += '<div style="display:flex; align-items:center; gap:8px; margin-bottom:6px; padding:6px 8px; background:rgba(16,185,129,0.08); border-radius:6px; border:1px solid #1e2740;">';
  html += '<span style="min-width:52px; color:#94a3b8; font-size:11px;">Base</span>';
  html += '<span style="font-size:18px; font-weight:800; color:' + (baseHits>=2?'#10b981':baseHits===1?'#f59e0b':'#ef4444') + ';">' + baseHits + '/3</span>';
  html += '<span style="color:#475569; font-size:10px;">current</span>';
  html += '</div>';

  // Specialists
  results.forEach(function(r) {
    var color = r.improved ? '#10b981' : r.same ? '#94a3b8' : '#475569';
    var badge = r.improved ? '✅ Better' : r.same ? '= Same' : '— Worse';
    var isLab = r.key === 'lab';
    var rowBorder = r.improved ? '#10b981' : isLab ? '#fbbf24' : '#1e2740';
    var rowBg = r.improved ? 'rgba(16,185,129,0.06)' : isLab ? 'rgba(251,191,36,0.04)' : 'transparent';
    html += '<div style="display:flex; align-items:center; gap:8px; margin-bottom:4px; padding:6px 8px; border-radius:6px; border:1px solid ' + rowBorder + '; background:' + rowBg + ';">';
    html += '<span style="min-width:52px; color:' + (isLab ? '#fbbf24' : '#94a3b8') + '; font-size:11px;">' + r.name + '</span>';
    html += '<span style="font-size:18px; font-weight:800; color:' + color + ';">' + r.hits + '/3</span>';
    html += '<span style="font-size:10px; color:' + color + ';">' + badge + (isLab ? ' (Base hypothesis)' : '') + '</span>';
    html += '<span style="color:#475569; font-size:10px; flex:1; text-align:right;">' + r.top3.join(' · ') + '</span>';
    html += '</div>';
  });

  // Outcome message
  html += '<div style="margin-top:8px; padding:8px; border-radius:6px; border:1px solid ' + (anyImproved ? '#10b981' : '#1e2740') + '; background:' + (anyImproved ? 'rgba(16,185,129,0.06)' : 'rgba(15,23,42,0.4)') + ';">';
  if (anyImproved) {
    var refCount = (app.weightReferences[contextKey]||[]).length;
    var labWon = best.key === 'lab';
    html += '<div style="color:' + (labWon ? '#fbbf24' : '#10b981') + '; font-weight:700; margin-bottom:4px;">' + (labWon ? '🧪 Lab hypothesis was right!' : '📌 Stored') + ' — ' + best.name + ' got closer (' + best.hits + '/3 vs ' + baseHits + '/3)</div>';
    if (labWon) {
      html += '<div style="color:#94a3b8; font-size:10px; margin-bottom:4px;">Base thinking was correct — these weights matched the race better. Storing as reference.</div>';
    }
    html += '<div style="color:#475569; font-size:10px;">Context: ' + contextKey + ' · Reference #' + refCount + ' stored</div>';
    html += '<button onclick="app.acceptCounterfactualNudge(' + JSON.stringify(JSON.stringify(best.weights)) + ')" class="btn" style="background:linear-gradient(135deg,#059669,#10b981); font-size:11px; padding:5px 12px; margin-top:6px; margin-right:6px;">↑ Apply nudge to Base now</button>';
  } else {
    html += '<div style="color:#94a3b8; font-weight:600; margin-bottom:4px;">No better angle found — moving on</div>';
    html += '<div style="color:#475569; font-size:10px;">Base tries a different approach next race.</div>';
  }
  html += '</div>';
  html += '</div>';

  // Store on race history
  if (app.raceHistory.length > 0) {
    app.raceHistory[app.raceHistory.length-1].rerunResults = {
      baseHits: baseHits,
      specialists: results.map(function(r){ return { model:r.key, name:r.name, hits:r.hits, top3:r.top3 }; }),
      stored: anyImproved,
      contextKey: contextKey
    };
    saveData();
  }

  resultDiv.innerHTML = html;
  btn.style.display = 'none';

  // Log the comparison result
  var logParts = ['Base ' + baseHits + '/3'];
  results.forEach(function(r) {
    logParts.push(r.name + ' ' + r.hits + '/3' + (r.improved ? ' ✅' : r.same ? ' =' : ' ✗'));
  });
  addLog('info', '🔁 Re-run: ' + logParts.join(' | ') + (anyImproved ? ' → stored' : ' → no gain'), contextKey);
};



// Re-run outputting to a specific div (used by inline pending panel)
app._rerunToDiv = function(targetDiv) {
  if (!app.horses || app.horses.length === 0) {
    targetDiv.innerHTML = '<p style="color:#ef4444;font-size:11px;">Field not in memory.</p>';
    return;
  }
  var actuals  = app._lastActuals || [];
  var baseHits = app._lastTop3Hits || 0;
  if (actuals.length === 0) {
    targetDiv.innerHTML = '<p style="color:#ef4444;font-size:11px;">No result stored.</p>';
    return;
  }

  var ctx = getRaceContext();
  var contextKey = ctx.condType + '|' + ctx.distBand + '|' + ctx.fieldBand + '|' + ctx.classBand;
  var labW = app.generateLabWeights();

  var models = [
    { key:'custom',  name: app.getModelName('custom'),  weights: app.customWeights  },
    { key:'custom2', name: app.getModelName('custom2'), weights: app.custom2Weights },
    { key:'custom3', name: app.getModelName('custom3'), weights: app.custom3Weights },
    { key:'lab',     name: '🧪 Lab',                   weights: labW               }
  ].filter(function(m){ return !!m.weights; });

  var results = models.map(function(m) {
    var testField = JSON.parse(JSON.stringify(app.horses));
    var prevW = app.W;
    app.W = m.weights;
    scoreHorses(testField);
    app.W = prevW;
    var top3 = testField.filter(function(h){ return !h.scratched; }).slice(0,3).map(function(h){ return h.name; });
    var hits = actuals.filter(function(n){ return top3.indexOf(n) !== -1; }).length;
    return { key:m.key, name:m.name, hits:hits, top3:top3, improved:hits>baseHits, same:hits===baseHits, weights:m.weights };
  });

  results.sort(function(a,b){ return b.hits - a.hits; });
  var best = results[0];
  var anyImproved = best && best.improved;

  if (anyImproved) {
    if (!app.weightReferences) app.weightReferences = {};
    if (!app.weightReferences[contextKey]) app.weightReferences[contextKey] = [];
    app.weightReferences[contextKey].push({
      date: new Date().toLocaleDateString(), race: (app.raceInfo.track||'') + ' ' + (app.raceInfo.race||''),
      context: ctx, model: best.key, modelName: best.name,
      hits: best.hits, baseHits: baseHits, weights: JSON.parse(JSON.stringify(best.weights)),
      actuals: actuals, top3: best.top3
    });
    localStorage.setItem('horseWeightReferences', JSON.stringify(app.weightReferences));
    addLog('learn', '📌 Reference stored: ' + best.name + ' got ' + best.hits + '/3 vs Base ' + baseHits + '/3 on ' + contextKey, best.top3.join(', '));
  }

  var html = '<div style="font-size:11px;">';
  html += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;"><span style="color:#94a3b8;min-width:48px;">Base</span><span style="font-weight:800;color:' + (baseHits>=2?'#10b981':baseHits===1?'#f59e0b':'#ef4444') + ';">' + baseHits + '/3</span><span style="color:#475569;font-size:10px;">current</span></div>';
  results.forEach(function(r) {
    var c = r.improved?'#10b981':r.same?'#94a3b8':'#475569';
    var isLab = r.key==='lab';
    html += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;padding:3px 6px;border-radius:5px;border:1px solid ' + (r.improved?'#10b981':isLab?'#fbbf24':'#1e2740') + ';">';
    html += '<span style="color:' + (isLab?'#fbbf24':'#94a3b8') + ';min-width:48px;font-size:10px;">' + r.name + '</span>';
    html += '<span style="font-weight:800;color:' + c + ';">' + r.hits + '/3</span>';
    html += '<span style="font-size:10px;color:' + c + ';">' + (r.improved?'✅ Better':r.same?'= Same':'— Worse') + '</span>';
    html += '<span style="color:#374151;font-size:10px;flex:1;text-align:right;">' + r.top3.slice(0,2).join(' · ') + '</span>';
    html += '</div>';
  });
  if (anyImproved) {
    html += '<div style="margin-top:5px;padding:5px;border-radius:5px;background:rgba(16,185,129,0.06);border:1px solid #10b98133;">';
    html += '<div style="color:#10b981;font-weight:700;font-size:10px;">📌 Stored · ' + best.name + ' ' + best.hits + '/3 · Context: ' + contextKey + '</div>';
    html += '<button onclick="app.acceptCounterfactualNudge(' + JSON.stringify(JSON.stringify(best.weights)) + ')" class="btn" style="background:linear-gradient(135deg,#059669,#10b981);font-size:10px;padding:4px 10px;margin-top:4px;">↑ Nudge Base now</button>';
    html += '</div>';
  } else {
    html += '<div style="color:#475569;font-size:10px;margin-top:4px;">No better angle — moving on.</div>';
  }
  html += '</div>';

  targetDiv.innerHTML = html;
  addLog('info', '🔁 Re-run: Base ' + baseHits + '/3 | ' + results.map(function(r){ return r.name+' '+r.hits+'/3'+(r.improved?' ✅':r.same?' =':' ✗'); }).join(' | ') + (anyImproved?' → stored':' → no gain'), contextKey);
};

app.acceptCounterfactualNudge = function(suggestedWJson) {
  var suggestedW;
  try { suggestedW = JSON.parse(suggestedWJson); } catch(e) { showError('Invalid weight data'); return; }
  var nudgeRate = 0.10; // 10% step toward AI suggestion
  var nudged = [];
  for (var k in suggestedW) {
    if (app.baseWeights[k] !== undefined && typeof suggestedW[k] === 'number' && suggestedW[k] > 0) {
      var diff = suggestedW[k] - app.baseWeights[k];
      if (Math.abs(diff) > 1) {
        app.baseWeights[k] += diff * nudgeRate;
        nudged.push(k);
      }
    }
  }
  app.sanitizeWeights(app.baseWeights);
  if (app.activeModel === 'base') app.W = app.baseWeights;
  saveData();
  var cfBtn = document.getElementById('cfResult');
  if (cfBtn) {
    var old = cfBtn.innerHTML;
    cfBtn.innerHTML = old + '<p style="color:#10b981; font-size:12px; margin-top:6px; font-weight:700;">✅ Base nudged on ' + nudged.length + ' weights (' + nudgeRate*100 + '% step toward AI suggestion)</p>';
  }
  addLog('weights', '🤖 Counterfactual nudge applied — ' + nudged.length + ' weights adjusted 10% toward AI suggestion', nudged.join(', '));
  showSuccess('Base nudged toward AI-suggested weights (' + nudged.length + ' factors)');
};

// Exit Saturday mode - return to whichever weekday model was last used
app.exitSaturdayMode = function() {
var lastWeekday = localStorage.getItem('horseLastWeekdayModel') || 'base';
app.switchModel(lastWeekday, false);
showSuccess('Switched back to ' + lastWeekday + ' model');
};

// ── Saturday Log Import ──
app.importSaturdayLog = function(event) {
var files = Array.from(event.target.files);
if (!files.length) return;
var statusEl = document.getElementById('satLogStatus');
if (statusEl) statusEl.textContent = 'Reading ' + files.length + ' file(s)...';
var allResults = [];
var processed = 0;
files.forEach(function(file) {
var reader = new FileReader();
reader.onload = function(e) {
var text = e.target.result;
var results = parseSaturdayLogText(text);
allResults = allResults.concat(results);
processed++;
if (processed === files.length) { applySaturdayLogLearning(allResults); event.target.value = ''; }
};
reader.readAsText(file);
});
};
function settleBets(winner1, winner2, winner3) {
if (app.activeBets.length === 0) return;
var results = [];
var name1 = winner1 ? winner1.name : '';
var name2 = winner2 ? winner2.name : '';
var name3 = winner3 ? winner3.name : '';
for (var i = 0; i < app.activeBets.length; i++) {
var b = app.activeBets[i];
var result = {
id: generateId(),
horse: b.horse,
horseNum: b.horseNum,
type: b.type,
stake: b.stake,
odds: b.odds,
race: b.race,
prob: b.prob,
date: new Date().toLocaleDateString(),
winReturn: 0,
placeReturn: 0,
profit: 0,
outcome: 'loss'
};
var isWin = (b.horse === name1);
var isPlace = (b.horse === name1 || b.horse === name2 || b.horse === name3);
var placeOdds = b.odds > 0 ? Math.max(1 + (b.odds - 1) / 4, 1.1) : 0;
if (b.type === 'win') {
if (isWin && b.odds > 0) {
result.winReturn = b.stake * b.odds;
result.profit = result.winReturn - b.stake;
result.outcome = 'win';
} else {
result.profit = -b.stake;
}
} else if (b.type === 'place') {
if (isPlace && placeOdds > 0) {
result.placeReturn = b.stake * placeOdds;
result.profit = result.placeReturn - b.stake;
result.outcome = 'win';
} else {
result.profit = -b.stake;
}
} else if (b.type === 'eachway') {
var totalStake = b.stake * 2;
var returns = 0;
if (isWin && b.odds > 0) {
returns += b.stake * b.odds;
returns += b.stake * placeOdds;
result.outcome = 'win';
} else if (isPlace && placeOdds > 0) {
returns += b.stake * placeOdds;
result.outcome = 'place';
}
result.winReturn = isWin ? b.stake * b.odds : 0;
result.placeReturn = isPlace ? b.stake * placeOdds : 0;
result.profit = returns - totalStake;
if (!isWin && !isPlace) result.outcome = 'loss';
} else if (b.type === 'quinella') {
var predictedTop2 = b.horses || [];
var actualTop2 = [name1, name2].filter(function(n) { return n; });
var hits = 0;
for (var q = 0; q < predictedTop2.length; q++) {
if (actualTop2.indexOf(predictedTop2[q]) !== -1) hits++;
}
if (hits === 2) {
// Quinella: dividend per $1. If user entered actual div, use it.
var quinellaDividend = b.actualDiv || 15;
result.winReturn = b.stake * quinellaDividend;
result.estimatedDiv = quinellaDividend;
result.profit = result.winReturn - b.stake;
result.outcome = 'win';
} else {
result.profit = -b.stake;
}
} else if (b.type === 'exacta') {
var ePredicted = b.horses || [];
if (ePredicted[0] === name1 && ePredicted[1] === name2) {
var exactaDividend = 25;
result.winReturn = b.stake * exactaDividend;
result.profit = result.winReturn - b.stake;
result.outcome = 'win';
} else { result.profit = -b.stake; }
} else if (b.type === 'trifecta') {
// Exact order required
var tPredicted = b.horses || [];
if (tPredicted[0]===name1 && tPredicted[1]===name2 && tPredicted[2]===name3) {
// Exact trifecta: per $1 unit, dividend ≈ $100-$500
// Return = stake × dividend (correct for $1 unit stake)
var trifectaDividend = 150; // slightly higher than box since exact order
result.winReturn = b.stake * trifectaDividend;
result.profit = result.winReturn - b.stake;
result.outcome = 'win';
} else { result.profit = -b.stake; }
} else if (b.type === 'boxed_trifecta') {
var btPredicted = b.horses || [];
var btActual = [name1, name2, name3].filter(function(n){ return n; });
var btHits = 0;
for (var bt = 0; bt < btPredicted.length; bt++) { if (btActual.indexOf(btPredicted[bt]) !== -1) btHits++; }
if (btHits === 3) {
// $6 box trifecta: dividend is per $1 unit
// If user entered actual div, use it. Otherwise estimate $100.
var btEstDiv = b.actualDiv || 100;
result.winReturn = (b.stake / 6) * btEstDiv;
result.estimatedDiv = btEstDiv;
result.actualDiv = b.actualDiv || 0;
result.profit = result.winReturn - b.stake;
result.outcome = 'win';
} else { result.profit = -b.stake; }
} else if (b.type === 'first4') {
// Any order first 4 — needs 4 actual finishers; approximate with 3 we have
var f4Predicted = b.horses || [];
var f4Actual = [name1, name2, name3].filter(function(n){ return n; });
var f4Hits = 0;
for (var f4 = 0; f4 < f4Predicted.length; f4++) { if (f4Actual.indexOf(f4Predicted[f4]) !== -1) f4Hits++; }
if (f4Hits >= 3) {
result.winReturn = b.stake * 150;
result.profit = result.winReturn - b.stake;
result.outcome = 'win';
} else { result.profit = -b.stake; }
}
results.push(result);
app.bettingHistory.push(result);
}
app.activeBets = [];
renderActiveBets();
saveData();
updateStats();
var totalProfit = 0;
var betSummaries = [];
for (var j = 0; j < results.length; j++) {
var r = results[j];
totalProfit += r.profit;
var typeLabelsH = {'win':'Win','place':'Place','eachway':'E/W','each-way':'E/W','exacta':'Exacta','quinella':'Quinella','trifecta':'Trifecta','boxed_trifecta':'Box Tri','first4':'First 4'}; var typeLabel = typeLabelsH[r.type] || r.type.charAt(0).toUpperCase() + r.type.slice(1);
if (r.outcome === 'win') betSummaries.push('✅ ' + r.horse + ' ' + typeLabel + ' +$' + r.profit.toFixed(2));
else if (r.outcome === 'place') betSummaries.push('🟡 ' + r.horse + ' ' + typeLabel + ' ' + (r.profit >= 0 ? '+' : '') + '$' + r.profit.toFixed(2));
else betSummaries.push('❌ ' + r.horse + ' ' + typeLabel + ' -$' + Math.abs(r.profit).toFixed(2));
}
return { results: results, totalProfit: totalProfit, summaries: betSummaries };
}

// ─────────────────────────────────────────────
// CONSENSUS BET ADVISOR
// Groups pending races by track+race, scores horses
// across all saved model predictions, then recommends
// the top 3 bets with confidence % and bet type.
// Read-only — never touches weights.
// ─────────────────────────────────────────────

function getRaceKey(pending) {
  var t = (pending.raceInfo && pending.raceInfo.track) ? pending.raceInfo.track.trim().toLowerCase() : '';
  var r = (pending.raceInfo && pending.raceInfo.race)  ? pending.raceInfo.race.trim().toLowerCase()  : '';
  return t + '|' + r;
}


// ── Kelly Criterion Staking ───────────────────────────────────────────────────
// Returns recommended stake using fractional Kelly (quarter Kelly by default)
// confidence: 0-100 (model's win probability estimate)
// odds: decimal odds
// bankroll: current bankroll (from betStake * 20 as a proxy if not set)
function kellyStake(confidence, odds, bankroll, fraction) {
  fraction = fraction || 0.25; // Quarter Kelly for safety
  bankroll = bankroll || 200;
  if (!odds || odds <= 1.0 || !confidence || confidence <= 0) return 0;
  var p = confidence / 100;
  var q = 1 - p;
  var b = odds - 1;
  var kelly = (b * p - q) / b;
  if (kelly <= 0) return 0; // No value — expected loss
  var stake = Math.floor(bankroll * kelly * fraction * 100) / 100;
  return Math.max(0, Math.min(stake, bankroll * 0.20)); // Never more than 20% bankroll
}

function getKellyLabel(confidence, odds, bankroll) {
  var stake = kellyStake(confidence, odds, bankroll);
  if (stake <= 0) return null;
  var pct = Math.round((kellyStake(confidence, odds, bankroll, 1.0) / bankroll) * 100);
  return { stake: stake, fullKellyPct: pct };
}

