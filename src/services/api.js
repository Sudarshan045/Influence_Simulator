/**
 * api.js — Influence Simulator API Service Layer
 * ================================================
 * Single source of truth for all backend communication.
 *
 * Architecture decisions:
 *  - axiosInstance: shared base with auth + retry interceptors
 *  - All functions return typed, predictable shapes
 *  - Errors are classified (network vs model vs auth) before surfacing to hooks
 *  - Fallback to mock TOP_IDEAS on /full-data failure (graceful degradation)
 */

import axios from 'axios';
import { TOP_IDEAS } from '../constants/ideas';

// ─────────────────────────────────────────────────────────────────────────────
// BASE INSTANCE
// ─────────────────────────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const axiosInstance = axios.create({
  baseURL: API_BASE,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});


// ─────────────────────────────────────────────────────────────────────────────
// RETRY INTERCEPTOR (exponential back-off, 3 attempts, network errors only)
// ─────────────────────────────────────────────────────────────────────────────

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;

    // Only retry on network-level failures (no response) or 5xx
    const isNetworkError = !error.response;
    const isServerError  = error.response?.status >= 500;

    if ((isNetworkError || isServerError) && !config._retryCount) {
      config._retryCount = 0;
    }

    const MAX_RETRIES = 2;

    if ((isNetworkError || isServerError) && config._retryCount < MAX_RETRIES) {
      config._retryCount += 1;
      const delay = 300 * Math.pow(2, config._retryCount); // 600ms, 1200ms
      await new Promise((r) => setTimeout(r, delay));
      return axiosInstance(config);
    }

    // Classify the error for the hook layer
    if (!error.response) {
      error._type = 'NETWORK';
      error._userMessage = 'Cannot reach the backend. Is the server running?';
    } else if (error.response.status === 422) {
      error._type = 'VALIDATION';
      error._userMessage = error.response.data?.detail || 'Invalid input data.';
    } else if (error.response.status >= 500) {
      error._type = 'SERVER';
      error._userMessage = 'The prediction engine encountered an error. Please try again.';
    } else {
      error._type = 'CLIENT';
      error._userMessage = error.response.data?.detail || 'Request failed.';
    }

    return Promise.reject(error);
  }
);


// ─────────────────────────────────────────────────────────────────────────────
// CORE: SIMULATE IDEA
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Runs the cultural lifecycle simulation for a given idea + scenario.
 *
 * @param {string} idea      - The idea text (free-form or from dataset)
 * @param {object|null} scenario - All 5 ScenarioEngine slider values + region
 *
 * @returns {object} Full simulation result contract:
 *   - revival_probability    : number (0-100)
 *   - current_state          : string (Birth|Growth|Peak|Decline|Dormancy|Revival)
 *   - peak_year_estimate     : number|null
 *   - confidence_score       : number (0-100)
 *   - states                 : string[]
 *   - progressionValues      : number[] (Markov-derived, aligned to states)
 *   - karma_score            : number (0-100, scaled)
 *   - karma_breakdown        : object (per-factor contribution)
 *   - markov_simulation      : number[][] (12-step × 6-state probability matrix)
 *   - markov_modifier        : object
 *   - feature_scores         : object (raw ML signals)
 *   - explanation            : string
 *   - raw_ml_result          : object (full ML engine output for debugging)
 */
export const simulateIdea = async (idea, scenario = null, liveDataEnabled = false) => {
  // Build scenario payload — always send all 5 fields with safe defaults
  const scenarioPayload = scenario
    ? {
        economicConditions:   scenario.economicConditions   ?? 50,
        mentalHealthIndex:    scenario.mentalHealthIndex    ?? 50,
        socialTrendIntensity: scenario.socialTrendIntensity ?? 50,
        productivityCulture:  scenario.productivityCulture  ?? 50,
        socialFragmentation:  scenario.socialFragmentation  ?? 50,
        region:               scenario.region               ?? 'Global',
      }
    : null;

  try {
    const response = await axiosInstance.post('/simulate_idea', {
      idea,
      scenario: scenarioPayload,
      liveDataEnabled,
    });

    const d = response.data;

    // Return a flat, typed contract — no consumer should need to touch raw_ml_result
    return {
      revival_probability:  d.revival_probability,
      current_state:        d.current_state,
      peak_year_estimate:   d.peak_year_estimate,
      confidence_score:     d.confidence_score,
      states:               d.states,
      progressionValues:    d.progressionValues,
      karma_score:          d.karma_score,
      karma_breakdown:      d.karma_breakdown   ?? {},
      markov_simulation:    d.markov_simulation ?? null,
      markov_modifier:      d.markov_modifier   ?? {},
      feature_scores:       d.feature_scores    ?? {},
      explanation:          d.explanation       ?? '',
      raw_ml_result:        d.raw_ml_result     ?? {},
      meta:                 d.meta              ?? null,
    };
  } catch (error) {
    console.error('[simulateIdea]', error._type, error._userMessage || error.message);
    throw Object.assign(
      new Error(error._userMessage || 'Simulation failed. Please try again.'),
      { type: error._type || 'UNKNOWN' }
    );
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// RANKINGS / TRENDS: GET TOP IDEAS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetches the heap-ranked, enriched idea list from the backend.
 * Falls back to the bundled TOP_IDEAS constant if the backend is unreachable
 * or the database is empty (fresh install).
 *
 * @returns {Array} Array of enriched idea objects
 */
export const getTopIdeas = async () => {
  try {
    const response = await axiosInstance.get('/full-data');
    const data     = response.data;

    if (Array.isArray(data) && data.length > 0) {
      return data; // Already sorted by backend aggregation pipeline
    }

    console.info('[getTopIdeas] DB empty — using mock TOP_IDEAS');
    return TOP_IDEAS;
  } catch (error) {
    console.warn('[getTopIdeas] Backend /full-data failed — using mock TOP_IDEAS');
    return TOP_IDEAS;
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// SIMULATOR SUGGESTIONS: SEARCH IDEAS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Live search for the simulator auto-suggest dropdown.
 * Returns ideas matching the query string, enriched with their latest score.
 *
 * @param {string} query - Minimum 2 characters
 * @returns {Array}      - [{id, name, category, revivalProbability}]
 */
export const searchIdeas = async (query = '') => {
  if (query.length < 2) return [];
  try {
    const response = await axiosInstance.get('/ideas/search', {
      params: { q: query },
    });
    return response.data ?? [];
  } catch (error) {
    console.warn('[searchIdeas] Search failed:', error.message);
    // Graceful degradation: filter mock data locally
    return TOP_IDEAS.filter((i) =>
      i.name.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 8);
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// TRENDS
// ─────────────────────────────────────────────────────────────────────────────

export const getTrendingIdeas = async () => {
  try {
    const ideas = await getTopIdeas();
    return ideas.filter((i) => i.trend === 'rising').slice(0, 5);
  } catch (error) {
    console.error('[getTrendingIdeas]', error.message);
    return [];
  }
};

export const getGlobalTrends = async () => {
  try {
    const response = await axiosInstance.get('/global-trends');
    return response.data ?? [];
  } catch (error) {
    console.warn('[getGlobalTrends] Failed:', error.message);
    return [];
  }
};

export const getRegionalTrends = async () => {
  try {
    const response = await axiosInstance.get('/regional-trends');
    return response.data ?? {};
  } catch (error) {
    console.warn('[getRegionalTrends] Failed:', error.message);
    return {};
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// ANALYTICS
// ─────────────────────────────────────────────────────────────────────────────

export const getAnalytics = async () => {
  try {
    const response = await axiosInstance.get('/analytics');
    return response.data;
  } catch (error) {
    console.warn('[getAnalytics] Failed:', error.message);
    return {
      total_simulations: 0,
      unique_ideas: 0,
      average_revival_probability: 0,
      highest_revival: 0,
      rising_ideas: 0,
    };
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// COMPARISON
// ─────────────────────────────────────────────────────────────────────────────

export const compareIdeas = async (ideaIds) => {
  try {
    const ideas = await getTopIdeas();
    return ideas.filter((i) => ideaIds.includes(i.id));
  } catch (error) {
    console.error('[compareIdeas]', error.message);
    return [];
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// AUTH SYNC
// ─────────────────────────────────────────────────────────────────────────────

export const syncUser = async (user) => {
  // Demo sessions must never be synced — they have a fake uid
  if (!user || user.provider === 'demo' || user.isDemo || user.uid === 'demo-user-001') {
    return null;
  }

  try {
    const payload = {
      uid:       user.uid   || user.id,
      email:     user.email,
      name:      user.name  || user.displayName || null,
      photo_url: user.photoURL || null,
      provider:  user.provider || null,
      role:      user.role  || 'Analyst',
    };
    const response = await axiosInstance.post('/users/sync', payload);
    return response.data;
  } catch (error) {
    // Non-critical — user can still use the app without syncing
    console.warn('[syncUser] Sync failed:', error.message);
    return null;
  }
};

export default axiosInstance;
