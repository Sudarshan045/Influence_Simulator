import { useState } from 'react';
import { Award, Trophy, ChevronUp, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import Card from '../components/UI/Card';
import RankingTable from '../components/RankingTable';
import Modal from '../components/UI/Modal';
import LifecycleChart from '../components/LifecycleChart';
import Badge from '../components/UI/Badge';
import ExportMenu from '../components/UI/ExportMenu';
import { useLiveIdeas } from '../hooks/useLiveIdeas';
import { exportRankingsToCSV, exportRankingsToJSON } from '../utils/exportUtils';

// ─────────────────────────────────────────────────────────────────────────────
// TREND ICON
// ─────────────────────────────────────────────────────────────────────────────

function TrendIcon({ trend }) {
  if (trend === 'rising')   return <TrendingUp   size={13} className="text-emerald-400" />;
  if (trend === 'declining') return <TrendingDown size={13} className="text-red-400" />;
  return <Minus size={13} className="text-slate-500" />;
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function Rankings() {
  const [selectedIdea, setSelectedIdea] = useState(null);
  const { ideas: TOP_IDEAS, loading } = useLiveIdeas();

  const maxProb    = TOP_IDEAS.length > 0 ? Math.max(...TOP_IDEAS.map((i) => i.revivalProbability)) : 0;
  const risingCount = TOP_IDEAS.filter((i) => i.trend === 'rising').length;
  const avgTrend   = TOP_IDEAS.length
    ? (TOP_IDEAS.reduce((a, b) => a + (b.trendScore ?? 0), 0) / TOP_IDEAS.length).toFixed(1)
    : '0.0';

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-8">
        <div className="space-y-3">
          <div className="h-9 w-48 skeleton rounded-lg" />
          <div className="h-4 w-64 skeleton rounded-lg" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => <div key={i} className="h-32 skeleton rounded-2xl" />)}
        </div>
        <div className="h-[500px] skeleton rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="animate-fade-in-up flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-title">Idea Rankings</h1>
          <p className="page-subtitle">
            Top ideas ranked by revival probability and cultural momentum
          </p>
        </div>

        {/* Export leaderboard */}
        {TOP_IDEAS.length > 0 && (
          <ExportMenu
            label="Export Rankings"
            onExportCSV={() => exportRankingsToCSV(TOP_IDEAS)}
            onExportJSON={() => exportRankingsToJSON(TOP_IDEAS)}
          />
        )}
      </div>

      {/* ── Summary cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        {[
          {
            label: 'Highest Revival',
            value: `${maxProb}%`,
            sub:   TOP_IDEAS.find((i) => i.revivalProbability === maxProb)?.name ?? '—',
            icon:  Trophy,
            color: 'text-amber-400',
            glow:  'rgba(245,158,11,0.2)',
            bg:    'rgba(245,158,11,0.1)',
          },
          {
            label: 'Avg Trend Score',
            value: `${avgTrend}/10`,
            sub:   'Across all ideas',
            icon:  ChevronUp,
            color: 'text-violet-400',
            glow:  'rgba(124,58,237,0.2)',
            bg:    'rgba(124,58,237,0.1)',
          },
          {
            label: 'Rising Ideas',
            value: `${risingCount}`,
            sub:   'Gaining cultural momentum',
            icon:  Award,
            color: 'text-emerald-400',
            glow:  'rgba(16,185,129,0.2)',
            bg:    'rgba(16,185,129,0.1)',
          },
        ].map(({ label, value, sub, icon: Icon, color, glow, bg }) => (
          <div key={label} className="glass-card p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: bg }}>
                <Icon size={18} className={color} />
              </div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
            </div>
            <p className={`text-2xl font-bold ${color} mb-1`}>{value}</p>
            <p className="text-[11px] text-slate-500 truncate">{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Leaderboard ───────────────────────────────────────────────────── */}
      <Card className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
          <div className="flex items-center gap-2">
            <Award size={20} className="text-amber-400" />
            <h2 className="text-base font-semibold text-white">Top Performing Ideas</h2>
            <span className="badge-neutral">{TOP_IDEAS.length} total</span>
          </div>
          {/* Category breakdown pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {['rising', 'stable', 'declining'].map((trend) => {
              const count = TOP_IDEAS.filter((i) => i.trend === trend).length;
              if (!count) return null;
              return (
                <span
                  key={trend}
                  className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full"
                  style={{
                    background: trend === 'rising'   ? 'rgba(16,185,129,0.12)'
                              : trend === 'declining' ? 'rgba(239,68,68,0.12)'
                              : 'rgba(100,116,139,0.12)',
                    border: trend === 'rising'   ? '1px solid rgba(16,185,129,0.25)'
                          : trend === 'declining' ? '1px solid rgba(239,68,68,0.25)'
                          : '1px solid rgba(100,116,139,0.25)',
                    color: trend === 'rising'   ? '#34d399'
                         : trend === 'declining' ? '#f87171'
                         : '#94a3b8',
                  }}
                >
                  <TrendIcon trend={trend} />
                  {count} {trend}
                </span>
              );
            })}
          </div>
        </div>
        <RankingTable ideas={TOP_IDEAS} onSelect={(idea) => setSelectedIdea(idea)} />
      </Card>

      {/* ── Detail Modal ──────────────────────────────────────────────────── */}
      <Modal
        isOpen={Boolean(selectedIdea)}
        title={selectedIdea?.name ?? ''}
        onClose={() => setSelectedIdea(null)}
        size="lg"
      >
        {selectedIdea && (
          <div className="space-y-6">
            {/* Badges + export single idea */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-start gap-2 flex-wrap">
                <Badge label={selectedIdea.category} variant="neutral" />
                <Badge
                  label={selectedIdea.trend.charAt(0).toUpperCase() + selectedIdea.trend.slice(1)}
                  variant={selectedIdea.trend === 'rising' ? 'success' : selectedIdea.trend === 'declining' ? 'danger' : 'warning'}
                />
                {selectedIdea.current_state && (
                  <Badge label={selectedIdea.current_state} variant="neutral" />
                )}
              </div>
              <ExportMenu
                label="Export"
                size="sm"
                onExportCSV={() => exportRankingsToCSV([selectedIdea], `influence_${selectedIdea.name.replace(/\s+/g, '_').toLowerCase()}.csv`)}
                onExportJSON={() => exportRankingsToJSON([selectedIdea], `influence_${selectedIdea.name.replace(/\s+/g, '_').toLowerCase()}.json`)}
              />
            </div>

            {/* Stat grid */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Revival Probability', value: `${selectedIdea.revivalProbability}%`, color: 'text-violet-400' },
                { label: 'Trend Score',          value: `${selectedIdea.trendScore?.toFixed(1) ?? '—'}/10`, color: 'text-cyan-400' },
                { label: 'Peak Value',            value: `${Math.max(...(selectedIdea.progressionValues ?? [0]))}%`, color: 'text-emerald-400' },
              ].map((s) => (
                <div key={s.label} className="text-center p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{s.label}</p>
                  <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* Description */}
            <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Description</p>
              <p className="text-sm text-slate-300 leading-relaxed">{selectedIdea.description}</p>
            </div>

            {/* Lifecycle chart */}
            <div>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Lifecycle Progression</p>
              <div className="h-64">
                <LifecycleChart states={selectedIdea.states} values={selectedIdea.progressionValues} />
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
