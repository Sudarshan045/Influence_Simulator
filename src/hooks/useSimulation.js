/**
 * useSimulation.js
 * ================
 * Custom hook managing the full simulation lifecycle:
 *   idle → loading → success | error
 *
 * Error classification mirrors api.js (_type: NETWORK | VALIDATION | SERVER | UNKNOWN)
 * so the UI can show contextually correct messages and actions.
 */

import { useState, useCallback, useRef } from 'react';
import { simulateIdea } from '../services/api';

const ERROR_MESSAGES = {
  NETWORK:    'Cannot reach the backend. Make sure the server is running on port 8000.',
  VALIDATION: 'The simulation input was rejected. Please check your idea text.',
  SERVER:     'The prediction engine hit an internal error. Try a different idea.',
  UNKNOWN:    'Something went wrong. Please try again.',
};

export function useSimulation() {
  const [loading,  setLoading]  = useState(false);
  const [result,   setResult]   = useState(null);
  const [error,    setError]    = useState(null);
  const [errorType, setErrorType] = useState(null); // NETWORK | VALIDATION | SERVER | UNKNOWN

  // Track if a simulation is in progress so we can cancel stale responses
  const abortRef = useRef(false);

  const simulate = useCallback(async (idea, scenario = null, liveDataEnabled = false) => {
    if (!idea?.trim()) {
      setError('Please enter an idea to simulate.');
      setErrorType('VALIDATION');
      return;
    }

    abortRef.current = false;
    setLoading(true);
    setError(null);
    setErrorType(null);
    setResult(null);

    try {
      const data = await simulateIdea(idea.trim(), scenario, liveDataEnabled);

      if (abortRef.current) return null; // Stale response — a new simulation was started

      setResult(data);
      return data;
    } catch (err) {
      if (abortRef.current) return;

      const type    = err.type || 'UNKNOWN';
      const message = ERROR_MESSAGES[type] || err.message || ERROR_MESSAGES.UNKNOWN;

      setError(message);
      setErrorType(type);
      console.error(`[useSimulation] ${type}:`, err.message);
    } finally {
      if (!abortRef.current) {
        setLoading(false);
      }
    }
  }, []);

  const reset = useCallback(() => {
    abortRef.current = true; // Cancel any in-flight request's result
    setResult(null);
    setError(null);
    setErrorType(null);
    setLoading(false);
  }, []);

  return {
    loading,
    result,
    error,
    errorType,
    simulate,
    reset,
  };
}
