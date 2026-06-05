import { useState } from 'react';
import {
  BookMarked, Trash2, RefreshCw, Clock, Zap,
  ChevronDown, ChevronUp, Download,
} from 'lucide-react';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import Badge from '../components/UI/Badge';
import Modal from '../components/UI/Modal';
import ExportMenu from '../components/UI/ExportMenu';
import LifecycleChart from '../components/LifecycleChart';
import { useSimulationHistory } from '../context/SimulationHistoryContext';
import { useNavigate } from 'react-router-dom';
import {
  exportSimulationsToCSV,
  exportSimulationsToJSON,
  exportSingleToCSV,
  exportSingleToJSON,
} from '../utils/exportUtils';

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1)  return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}

// ─────────────────────────────────────────────────────────────────────────────
// SIMULATION CARD
// ─────────────────────────────────────────────────────────────────────────────

function SimulationCard({ sim, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const { idea, result, savedAt } = sim;
  const prob = Math.round(result.revival_probability ?? 0);

  const probColor   = prob >= 80 ? 'text-emerald-400' : prob >= 60 ? 'text-amber-400' : 'text-red-400';
  const probVariant = prob >= 80 ? 'success' : prob >= 60 ? 'warning' : 'danger';

  return (
    <div className="glass-card p-5 space-y-4 animate-fade-in-up">
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="p-2 rounded-xl flex-shrink-0" style={{ background: 'rgba(124,58,237,0.15)' }}>
            <Zap size={16} className="text-violet-400" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-white truncate">{idea}</h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`text-lg font-bold tabular-nums ${probColor}`}>{prob}%</span>
              <span className="text-[11px] text-slate-500">revival probability</span>
              <Badge
                label={prob >= 80 ? 'High' : prob >= 60 ? 'Moderate' : 'Low'}
                variant={probVariant}
                size="sm"
              />
              {result.current_state && (
                <span
                  className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                  style={{
                    background: 'rgba(124,58,237,0.15)',
                    border:     '1px solid rgba(124,58,237,0.25)',
                    color:      '#a78bfa',
                  }}
                >
                  {result.current_state}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Card actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Per-card export */}
          <ExportMenu
            label=""
            size="sm"
            onExportCSV={() => exportSingleToCSV(sim)}
            onExportJSON={() => exportSingleToJSON(sim)}
          />

          <button
            onClick={() => setExpanded(!expanded)}
            className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-all"
            title={expanded ? 'Collapse' : 'Expand chart'}
          >
            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
          <button
            onClick={() => onDelete(sim.id)}
            className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
            title="Delete"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-3 flex-wrap text-[11px] text-slate-500">
        <span className="flex items-center gap-1">
          <Clock size={12} />
          Saved {timeAgo(savedAt)}
        </span>
        {sim.scenario && (
          <span
            className="px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)', color: '#22d3ee' }}
          >
            Custom scenario
          </span>
        )}
        {result.karma_score != null && (
          <span className="text-slate-600">
            Karma: <span className="text-cyan-500 font-semibold">{result.karma_score?.toFixed?.(1)}%</span>
          </span>
        )}
        {result.peak_year_estimate && (
          <span className="text-slate-600">
            Peak: <span className="text-violet-400 font-semibold">{result.peak_year_estimate}</span>
          </span>
        )}
      </div>

      {/* Lifecycle stage pills */}
      {result.states && result.progressionValues && (
        <div className="flex gap-1.5 flex-wrap">
          {result.states.map((state, i) => (
            <div
              key={state}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: `hsl(${260 - i * 30}, 70%, 65%)` }} />
              <span className="text-slate-300">{state}</span>
              <span className="text-slate-500 tabular-nums">{result.progressionValues[i]}%</span>
            </div>
          ))}
        </div>
      )}

      {/* Expanded lifecycle chart */}
      {expanded && (
        <div className="h-48 pt-2 animate-fade-in">
          <LifecycleChart states={result.states} values={result.progressionValues} />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STAT CARD
// ─────────────────────────────────────────────────────────────────────────────

function StatCard({ label, value, color }) {
  return (
    <div className="glass-card p-4 text-center">
      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function SavedSimulations() {
  const { savedSimulations, deleteSimulation, clearAll } = useSimulationHistory();
  const navigate = useNavigate();
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const count   = savedSimulations.length;
  const avgProb = count
    ? Math.round(savedSimulations.reduce((a, s) => a + (s.result.revival_probability ?? 0), 0) / count)
    : 0;
  const bestProb = count
    ? Math.round(Math.max(...savedSimulations.map((s) => s.result.revival_probability ?? 0)))
    : 0;
  const risingCount = savedSimulations.filter(
    (s) => (s.result.revival_probability ?? 0) >= 65
  ).length;

  return (
    <div className="space-y-8">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="animate-fade-in-up flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-title">Saved Simulations</h1>
          <p className="page-subtitle">
            Your simulation history — {count} saved result{count !== 1 ? 's' : ''}
          </p>
        </div>

        {count > 0 && (
          <div className="flex items-center gap-2">
            {/* Bulk export */}
            <ExportMenu
              label="Export All"
              disabled={count === 0}
              onExportCSV={() => exportSimulationsToCSV(savedSimulations)}
              onExportJSON={() => exportSimulationsToJSON(savedSimulations)}
            />
            <Button
              variant="danger"
              size="sm"
              icon={Trash2}
              onClick={() => setShowClearConfirm(true)}
            >
              Clear All
            </Button>
          </div>
        )}
      </div>

      {/* ── Stats row ──────────────────────────────────────────────────────── */}
      {count > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in-up">
          <StatCard label="Total Saved"  value={count}        color="text-violet-400" />
          <StatCard label="Avg Revival"  value={`${avgProb}%`} color="text-cyan-400" />
          <StatCard label="Best Result"  value={`${bestProb}%`} color="text-emerald-400" />
          <StatCard label="High Revival" value={risingCount}   color="text-amber-400" />
        </div>
      )}

      {/* ── Simulation list ─────────────────────────────────────────────────── */}
      {count > 0 ? (
        <div className="space-y-4">
          {savedSimulations.map((sim) => (
            <SimulationCard key={sim.id} sim={sim} onDelete={deleteSimulation} />
          ))}
        </div>
      ) : (
        <div
          className="glass-card p-16 text-center border-2 border-dashed animate-fade-in-up"
          style={{ borderColor: 'rgba(255,255,255,0.08)' }}
        >
          <div className="flex justify-center mb-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}
            >
              <BookMarked size={32} className="text-violet-600" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No saved simulations yet</h3>
          <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">
            Run a simulation and click "Save Result" to build your personal forecasting history.
          </p>
          <Button onClick={() => navigate('/simulator')} icon={Zap}>
            Go to Simulator
          </Button>
        </div>
      )}

      {/* ── Clear Confirm Modal ─────────────────────────────────────────────── */}
      <Modal
        isOpen={showClearConfirm}
        title="Clear All Simulations"
        onClose={() => setShowClearConfirm(false)}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-400">
            This will permanently delete all {count} saved simulations. This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setShowClearConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              icon={Trash2}
              className="flex-1"
              onClick={() => { clearAll(); setShowClearConfirm(false); }}
            >
              Delete All
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
