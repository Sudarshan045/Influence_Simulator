import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const SimulationHistoryContext = createContext(null);

const STORAGE_KEY = 'influence_simulations';

const loadFromStorage = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export function SimulationHistoryProvider({ children }) {
  const [savedSimulations, setSavedSimulations] = useState(loadFromStorage);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedSimulations));
    } catch {}
  }, [savedSimulations]);

  const saveSimulation = useCallback((idea, result, scenario = null) => {
    const entry = {
      id: `sim_${Date.now()}`,
      idea,
      result,
      scenario,
      savedAt: new Date().toISOString(),
    };
    setSavedSimulations((prev) => [entry, ...prev.slice(0, 49)]);
    return entry.id;
  }, []);

  const deleteSimulation = useCallback((id) => {
    setSavedSimulations((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setSavedSimulations([]);
  }, []);

  return (
    <SimulationHistoryContext.Provider
      value={{ savedSimulations, saveSimulation, deleteSimulation, clearAll }}
    >
      {children}
    </SimulationHistoryContext.Provider>
  );
}

export function useSimulationHistory() {
  const ctx = useContext(SimulationHistoryContext);
  if (!ctx) throw new Error('useSimulationHistory must be used within SimulationHistoryProvider');
  return ctx;
}
