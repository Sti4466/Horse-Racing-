'use strict';





// ╔══════════════════════════════════════════════════════════════╗
// ║  HORSE PREDICTOR v3.0 — FUNCTION MANIFEST                   ║
// ║  Search for "§ SECTIONNAME" to jump to any section          ║
// ╠══════════════════════════════════════════════════════════════╣
// ║  § PARSE   — parsers: form guide, speed map, race card      ║
// ║  § SCORE   — scoring: factors + scoreHorses()               ║
// ║  § LEARN   — learning: ELO, weights, venue, post-mortem     ║
// ║  § RENDER  — UI: cards, history, bet panel, dropdowns       ║
// ║  § RECORD  — recording: results, re-run, settle bets        ║
// ║  § APP     — app methods: analyze, models, save/load        ║
// ╚══════════════════════════════════════════════════════════════╝
//
// § PARSE (19 functions):
//   importRaceResults
//   loadFormGuide
//   loadFormGuideRace
//   uploadFormGuide
//   parseSpeedMapPlainText
//   parseFormSectionals
//   uploadSpeedMap
//   clearFormGuide
//   clearSpeedMap
//   _parseFSView
//   _mergeIntoSpeedMap
//   checkCombinedReadiness
//   mergeFormGuideAndSpeedMap
//   parseSportsBetForm
//   parseStat
//   parseHorses
//   parseRaceInfo
//   parseFormLine
//   parseSaturdayLogText
// § SCORE (29 functions):
//   getBiasAdjustment
//   getVenueBlendedWeights
//   calculateFormScore
//   calculateFreshnessScore
//   calculateTacticalScore
//   calculateTrackConditionScore
//   calculateSecondUpScore
//   calculateThirdUpScore
//   calculateFirstUpScore
//   calculateJockeyAffinityScore
//   calculatePrizeMoneyScore
//   calculateInRunningPattern
//   calculateDistanceScore
//   calculateLastMarginScore
//   calculateJockeyComboScore
//   calculateGearScore
//   calculateRailScore
//   calculatePacePressure
//   calculateSpeedFigure
//   calculatePaceMatch
//   recentFormTrend
//   calculateClassChange
//   calculateFormMomentum
//   calculateFinishStrength
//   calculateSectionalSpeed
//   calculateWeatherRailBias
//   calculateStatisticalBonus
//   calculateTop3PlacementScore
//   scoreHorses
// § LEARN (30 functions):
//   getRaceContext
//   updateTrackBias
//   getVenueProfile
//   updateVenueProfile
//   learn
//   postMortemAnalysis
//   getEloRating
//   updateEloRating
//   getMarginLearningMultiplier
//   classify2Hits
//   generateLabWeights
//   applySaturdayLogLearning
//   generateBatchSummary
//   toggleVenueProfiles
//   renderVenueProfiles
//   clearVenueProfiles
//   updateMonitorButton
//   openMonitor
//   buildMonitorReport
//   checkAIAuditTrigger
//   buildAuditPayload
//   runAIAudit
//   auditShowError
//   _processManualAuditResponse
//   renderAuditResults
//   applyAuditToBase
//   applyAuditToAll
//   openManualAudit
//   relearnFromHistory
//   rebalanceModel
// § RENDER (13 functions):
//   updateStats
//   buildDropdown
//   renderPending
//   renderCards
//   renderRaceInfoPanel
//   renderLiveBetPanel
//   renderHistory
//   renderAllModelPicks
//   buildBetDropdown
//   renderActiveBets
//   renderConsensusAdvisor
//   renderBettingStats
//   rebuildWeightInputs
// § RECORD (9 functions):
//   recordAndRerun
//   recordInline
//   _inlineRerun
//   recordWinner
//   recordAllModels
//   rerunRace
//   _rerunToDiv
//   acceptCounterfactualNudge
//   settleBets
// § APP (77 functions):
//   showToast
//   showError
//   showSuccess
//   hideError
//   escapeHtml
//   generateId
//   loadSavedData
//   addStat
//   getFactorContributions
//   adjustWeight
//   reinforceAll
//   penalizeAll
//   saveData
//   exportData
//   importData
//   uploadRaceOrder
//   clearRaceOrder
//   uploadBarrierOrder
//   clearBarrierOrder
//   analyzeCombined
//   checkAlerts
//   getJockeyWinRate
//   getTrainerWinRate
//   updateJockeyTrainerStats
//   getClassAdvantage
//   getWeightForAgeAllowance
//   modelBet
//   savePending
//   saveAllModels
//   loadPending
//   deletePending
//   deleteAllPending
//   safePercent
//   addFS
//   scoreAllModels
//   resetLabWeights
//   exitSaturdayMode
//   importSaturdayLog
//   addLog
//   renderActivityLog
//   toggleActivityLog
//   exportActivityLog
//   _showLogModal
//   clearActivityLog
//   togglePending
//   setHistoryFilter
//   toggleHistory
//   toggleBetting
//   updateBetInterface
//   addBet
//   updateBetDiv
//   removeBet
//   getRaceKey
//   kellyStake
//   getKellyLabel
//   buildConsensusForRace
//   quickAddBet
//   clearConsensus
//   clearAllBets
//   clearAll
//   resetWeightsOnly
//   resetAllData
//   safeReset
//   resetFactorStats
//   replayRaceForModel
//   resetSpecialistsOnly
//   switchModel
//   applyPastedWeights
//   showCustomEditor
//   getModelName
//   saveModelName
//   closeCustomEditor
//   saveCustomWeights
//   resetCustomToBase
//   updateModelMetrics
//   copyTextToClipboard
//   doFallback
//


var app = {
raceHistory: [],
pendingRaces: [],
horses: [],
raceInfo: {},
winnerSet: false,
isAnalyzing: false,
currentPendingId: null,
factorStats: null,
activeBets: [],
bettingHistory: [],
historyFilter: 'all',
formGuideData: null,
speedMapData: null,
combinedAnalysisResult: null,
activeModel: 'base',
baseWeights: null,
customModelNames: { custom: 'Kimi', custom2: 'Grok', custom3: 'GPT' },
customWeights: null,
saturdayWeights: null,
custom2Weights: null,
custom3Weights: null,
baseMetrics:    { correct: 0, total: 0, top2: 0, top3: 0 },
customMetrics:  { correct: 0, total: 0, top2: 0, top3: 0 },
saturdayMetrics: { correct: 0, total: 0, top2: 0, top3: 0 },
custom2Metrics: { correct: 0, total: 0, top2: 0, top3: 0 },
custom3Metrics: { correct: 0, total: 0, top2: 0, top3: 0 },
activityLog: [],
venueProfiles: {},   // per-track learned weight multipliers
patternLibrary: {},  // race signature patterns — key = fingerprint hash
weightReferences: {}, // weight configs that got better results, tagged by race context
labWeights: null,     // Base-generated hypothesis weights for post-race testing (sandbox only)
raceMode: false,      // Race Mode: score all models simultaneously, record all at once — key = fingerprint hash
_batchSession: null,
defaultWeights: {
odds: 400,
rating: 1.2,
careerWin: 120,
careerPlace: 60,
trackWin: 70,
trackDistWin: 90,
jockeyWin: 40,
trainerWin: 30,
form1: 50,
form2: 30,
form3: 18,
form4: 10,
form5: 5,
formConsistency: 35,
freshness: 25,
weight: 2.0,
tactical: 40,
trackCondition: 80,
firstUp: 50,
distanceSuit: 45,
lastStartMargin: 35,
railPosition: 30,
gearChange: 25,
pacePressure: 35,
classChange: 45,
formMomentum: 40,
finishStrength: 30,
sectionalSpeed: 35,
weatherRailBias: 30,
secondUpForm: 30,
jockeyForm: 35,
trainerForm: 25,
marginLearning: 1.0,
raceOrder: 25,
barrierOrder: 20,
top3Weight: 0.70,
winWeight: 0.30
},
// ── WEIGHT SAFE RANGES ──────────────────────────────────────────────────
// Prevents scale-confusion explosions (e.g. rating typed as 90 instead of 1.2)
// Each entry: [hardMin, hardMax, softWarnAbove]
// 'rating' and 'weight' are MULTIPLIERS — all others are additive integers.
weightSafeRanges: {
  rating:        [0.1,   10.0,  5.0],
  weight:        [0.0,   20.0,  10.0],
  marginLearning:[0.1,    3.0,  2.0],
  top3Weight:    [0.05,   0.95, 0.95],
  winWeight:     [0.05,   0.95, 0.95],
  odds:          [10,   2000,   1500],
  careerWin:     [5,     600,   400],
  careerPlace:   [2,     300,   200],
  trackWin:      [5,     500,   350],
  trackDistWin:  [5,     500,   300],
  jockeyWin:     [2,     300,   200],
  trainerWin:    [2,     250,   180],
  form1:         [2,     400,   250],
  form2:         [2,     250,   150],
  form3:         [1,     150,   100],
  form4:         [1,     100,   80],
  form5:         [1,      80,   60],
  formConsistency:[2,    250,   150],
  freshness:     [2,     200,   120],
  tactical:      [2,     250,   150],
  trackCondition:[5,     400,   250],
  firstUp:       [2,     300,   200],
  distanceSuit:  [2,     250,   180],
  lastStartMargin:[2,    200,   150],
  railPosition:  [2,     150,   100],
  gearChange:    [2,     150,   100],
  pacePressure:  [5,     150,   80],
  classChange:   [5,     150,   100],
  formMomentum:  [5,     150,   100],
  finishStrength:[2,     130,   90],
  sectionalSpeed:[5,     120,   80],
  weatherRailBias:[2,    130,   90],
  raceOrder:     [2,     100,   60],
  barrierOrder:  [2,     80,    50]
},
sanitizeWeights: function(w) {
  if (!w) return w;
  var ranges = app.weightSafeRanges;
  for (var k in ranges) {
    if (w[k] !== undefined && w[k] !== null) {
      var min = ranges[k][0], max = ranges[k][1];
      if (isNaN(w[k]) || w[k] < min) w[k] = app.defaultWeights[k];
      else if (w[k] > max) w[k] = max;
    }
  }
  // Extra guard: if rating > 10 it was almost certainly entered on the wrong scale
  // (user typed 90 thinking it was like other weights) — reset to default
  if (w.rating && w.rating > 10) w.rating = app.defaultWeights.rating;
  if (w.weight && w.weight > 20) w.weight = app.defaultWeights.weight;
  if (w.top3Weight && w.top3Weight > 1) w.top3Weight = app.defaultWeights.top3Weight;
  if (w.winWeight  && w.winWeight  > 1) w.winWeight  = app.defaultWeights.winWeight;
  return w;
},
jockeyStats: {},
trainerStats: {},
AUS_STATS: {
lastMargin: {
0:   12.72,
0.5: 15.0,
1.5: 13.5,
2.5: 11.62,
3.5: 10.16,
4.5: 9.09,
5.5: 7.84
},
lastFinish: { 1: 15.2, 2: 15.8, 3: 12.77, 4: 10.87 },
daysSince: {
7: 10.68, 10: 9.86, 14: 10.36, 17: 10.22,
21: 10.34, 26: 10.22, 31: 10.22
},
careerWinPct: {
5: 6.94, 15: 9.07, 25: 11.1, 35: 13.75, 45: 16.22, 55: 19.81
},
careerPlacePct: {
5: 3.46, 15: 5.12, 25: 6.56, 35: 8.37, 45: 9.82,
55: 11.84, 65: 14.53, 75: 18.14
},
startsSinceSpell: {
0: 8.16, 1: 9.21, 2: 10.93, 3: 11.44,
4: 11.47, 5: 11.33, 6: 11.33
},
barrierSmall: { 1: 10.7, 2: 10.4, 3: 10.3, 4: 10.7, 5: 10.0 },
barrierLarge: { 1: 7.8, 2: 7.7, 3: 8.1, 4: 7.3, 5: 7.6 },
favFieldSize: {
4: 49.4, 5: 44.8, 6: 41.4, 7: 37.9, 8: 35.6,
9: 32.9, 10: 32.3, 11: 30.8, 12: 29.3, 13: 28.7,
14: 27.8, 15: 28.0, 16: 23.5
},
wonTrackBefore: 11.51,
wonDistanceBefore: 10.52,
baselineStarter: 10.0
}
};
app.baseWeights = Object.assign({}, app.defaultWeights);
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
app.W = app.baseWeights;
var toastTimer = null;


// ═══════════════════════════════════════════════════════════════
