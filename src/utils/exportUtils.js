/**
 * exportUtils.js — Influence Simulator Export Engine
 * ====================================================
 * Pure utility module. Zero dependencies — uses only the browser File API.
 * All functions are synchronous and return void (side-effect: browser download).
 *
 * Exported functions:
 *   exportSimulationsToCSV(simulations, filename?)
 *   exportSimulationsToJSON(simulations, filename?)
 *   exportRankingsToCSV(ideas, filename?)
 *   exportRankingsToJSON(ideas, filename?)
 *   exportSingleToJSON(sim, filename?)
 */


// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL: trigger a browser download from a Blob
// ─────────────────────────────────────────────────────────────────────────────

function _download(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}


// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL: array of objects → RFC 4180 CSV string
// ─────────────────────────────────────────────────────────────────────────────

function _toCSV(rows) {
  if (!rows || rows.length === 0) return '';

  const headers = Object.keys(rows[0]);
  const escape  = (v) => {
    const s = v == null ? '' : String(v);
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };

  const lines = [
    headers.join(','),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(',')),
  ];
  return lines.join('\r\n');
}


// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL: flatten a saved-simulation entry to a single-row object
// ─────────────────────────────────────────────────────────────────────────────

function _flattenSimulation(sim) {
  const { idea, result, scenario, savedAt } = sim;
  const s = scenario ?? {};
  const r = result   ?? {};

  return {
    // Core identity
    id:                      sim.id,
    idea,
    saved_at:                savedAt,

    // Prediction outputs
    revival_probability:     r.revival_probability   ?? '',
    karma_score:             r.karma_score            ?? '',
    karma_match_type:        r.karma_match_type       ?? '',
    current_state:           r.current_state          ?? '',
    peak_year_estimate:      r.peak_year_estimate     ?? '',
    confidence_score:        r.confidence_score       ?? '',
    explanation:             r.explanation            ?? '',

    // Karma breakdown (4 factors)
    karma_mental_health:     r.karma_breakdown?.mental_health_index   ?? '',
    karma_economic:          r.karma_breakdown?.economic_instability  ?? '',
    karma_productivity:      r.karma_breakdown?.productivity_culture  ?? '',
    karma_fragmentation:     r.karma_breakdown?.social_fragmentation  ?? '',

    // ML feature signals
    trend_score:             r.feature_scores?.trend_score            ?? '',
    momentum:                r.feature_scores?.momentum               ?? '',
    sentiment:               r.feature_scores?.sentiment              ?? '',
    engagement_rate:         r.feature_scores?.engagement_rate        ?? '',

    // Lifecycle progression (6 stages)
    stage_birth:             r.progressionValues?.[0] ?? '',
    stage_growth:            r.progressionValues?.[1] ?? '',
    stage_peak:              r.progressionValues?.[2] ?? '',
    stage_decline:           r.progressionValues?.[3] ?? '',
    stage_dormancy:          r.progressionValues?.[4] ?? '',
    stage_revival:           r.progressionValues?.[5] ?? '',

    // Scenario inputs (the 5 cultural sliders)
    economic_conditions:     s.economicConditions    ?? 50,
    mental_health_index:     s.mentalHealthIndex     ?? 50,
    social_trend_intensity:  s.socialTrendIntensity  ?? 50,
    productivity_culture:    s.productivityCulture   ?? 50,
    social_fragmentation:    s.socialFragmentation   ?? 50,
    region:                  s.region                ?? 'Global',
  };
}


// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL: flatten a ranking/idea entry to a single-row object
// ─────────────────────────────────────────────────────────────────────────────

function _flattenRanking(idea, rank) {
  return {
    rank:                rank,
    id:                  idea.id        ?? '',
    name:                idea.name      ?? '',
    category:            idea.category  ?? '',
    revival_probability: idea.revivalProbability ?? '',
    trend_score:         idea.trendScore          ?? '',
    trend:               idea.trend               ?? '',
    current_state:       idea.current_state       ?? '',
    description:         idea.description         ?? '',
    stage_birth:         idea.progressionValues?.[0] ?? '',
    stage_growth:        idea.progressionValues?.[1] ?? '',
    stage_peak:          idea.progressionValues?.[2] ?? '',
    stage_decline:       idea.progressionValues?.[3] ?? '',
    stage_dormancy:      idea.progressionValues?.[4] ?? '',
    stage_revival:       idea.progressionValues?.[5] ?? '',
  };
}


// ─────────────────────────────────────────────────────────────────────────────
// EXPORT METADATA WRAPPER (JSON only)
// ─────────────────────────────────────────────────────────────────────────────

function _wrapForJSON(data, type) {
  return {
    export_metadata: {
      platform:   'Influence Simulator',
      version:    '2.4.0',
      type,
      exported_at: new Date().toISOString(),
      record_count: Array.isArray(data) ? data.length : 1,
    },
    data,
  };
}


// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC API — SIMULATIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Exports all saved simulations as a flat CSV file.
 * Each row = one simulation, columns cover all prediction outputs + scenario inputs.
 */
export function exportSimulationsToCSV(
  simulations,
  filename = `influence_simulations_${_dateStamp()}.csv`
) {
  if (!simulations?.length) return false;
  const rows = simulations.map(_flattenSimulation);
  _download(_toCSV(rows), filename, 'text/csv;charset=utf-8;');
  return true;
}

/**
 * Exports all saved simulations as a structured JSON file.
 * Includes export metadata and preserves the full nested result structure.
 */
export function exportSimulationsToJSON(
  simulations,
  filename = `influence_simulations_${_dateStamp()}.json`
) {
  if (!simulations?.length) return false;
  const payload = _wrapForJSON(simulations, 'saved_simulations');
  _download(JSON.stringify(payload, null, 2), filename, 'application/json');
  return true;
}

/**
 * Exports a single saved simulation as JSON.
 * Includes the full result + scenario + Markov matrix.
 */
export function exportSingleToJSON(sim, filename) {
  const name = filename ?? `influence_${sim.idea.replace(/\s+/g, '_').toLowerCase()}_${_dateStamp()}.json`;
  const payload = _wrapForJSON(sim, 'single_simulation');
  _download(JSON.stringify(payload, null, 2), name, 'application/json');
  return true;
}

/**
 * Exports a single simulation as a one-row CSV.
 */
export function exportSingleToCSV(sim) {
  const filename = `influence_${sim.idea.replace(/\s+/g, '_').toLowerCase()}_${_dateStamp()}.csv`;
  _download(_toCSV([_flattenSimulation(sim)]), filename, 'text/csv;charset=utf-8;');
  return true;
}


// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC API — RANKINGS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Exports the full leaderboard as CSV, ordered by rank (current sort order).
 */
export function exportRankingsToCSV(
  ideas,
  filename = `influence_rankings_${_dateStamp()}.csv`
) {
  if (!ideas?.length) return false;
  const rows = ideas.map((idea, i) => _flattenRanking(idea, i + 1));
  _download(_toCSV(rows), filename, 'text/csv;charset=utf-8;');
  return true;
}

/**
 * Exports the full leaderboard as JSON with metadata.
 */
export function exportRankingsToJSON(
  ideas,
  filename = `influence_rankings_${_dateStamp()}.json`
) {
  if (!ideas?.length) return false;
  const ranked  = ideas.map((idea, i) => ({ rank: i + 1, ...idea }));
  const payload = _wrapForJSON(ranked, 'rankings');
  _download(JSON.stringify(payload, null, 2), filename, 'application/json');
  return true;
}


// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL: date stamp for filenames (YYYYMMDD_HHMM)
// ─────────────────────────────────────────────────────────────────────────────

function _dateStamp() {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
    '_',
    String(d.getHours()).padStart(2, '0'),
    String(d.getMinutes()).padStart(2, '0'),
  ].join('');
}
