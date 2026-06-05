import { useState } from 'react';
import { Plus, X, GitCompare } from 'lucide-react';
import Card from '../components/UI/Card';
import ComparisonChart from '../components/Charts/ComparisonChart';
import LifecycleChart from '../components/LifecycleChart';
import Badge from '../components/UI/Badge';
import { useLiveIdeas } from '../hooks/useLiveIdeas';

const IDEA_COLORS = ['#7c3aed', '#06b6d4', '#10b981', '#f59e0b'];

export default function Comparison() {
  const { ideas: TOP_IDEAS, loading } = useLiveIdeas();
  const [selectedIds, setSelectedIds] = useState([]);

  // Default to first two once loaded
  if (selectedIds.length === 0 && TOP_IDEAS.length > 1) {
    setSelectedIds([TOP_IDEAS[0].id, TOP_IDEAS[1].id]);
  }

  const selected = TOP_IDEAS.filter((i) => selectedIds.includes(i.id));

  const toggleIdea = (ideaId) => {
    if (selectedIds.includes(ideaId)) {
      setSelectedIds(selectedIds.filter((id) => id !== ideaId));
    } else if (selectedIds.length < 4) {
      setSelectedIds([...selectedIds, ideaId]);
    }
  };

  const colorFor = (idea) => IDEA_COLORS[selectedIds.indexOf(idea.id) % IDEA_COLORS.length];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="animate-fade-in-up">
        <h1 className="page-title">VS Mode: Ultimate Showdown</h1>
        <p className="page-subtitle">Pitting ideas against each other. Select up to 4 concepts for a deep-dive comparison.</p>
      </div>

      {/* Selector */}
      <Card className="space-y-4 animate-fade-in-up">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Select Ideas</h2>
          <span className="badge-neutral">{selectedIds.length}/4 selected</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto pr-1">
          {TOP_IDEAS.map((idea) => {
            const isSelected = selectedIds.includes(idea.id);
            const color = isSelected ? colorFor(idea) : null;
            return (
              <button
                key={idea.id}
                onClick={() => toggleIdea(idea.id)}
                disabled={!isSelected && selectedIds.length >= 4}
                className="p-3 rounded-xl text-left transition-all duration-200 relative group"
                style={
                  isSelected
                    ? { background: `${color}20`, border: `1px solid ${color}50` }
                    : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }
                }
              >
                {isSelected && (
                  <div
                    className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center text-white"
                    style={{ background: color, fontSize: 9, fontWeight: 700 }}
                  >
                    ✓
                  </div>
                )}
                <p className="text-sm font-semibold text-white pr-5">{idea.name}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{idea.category}</p>
                <p className="text-[11px] mt-1.5" style={{ color: isSelected ? color : '#64748b' }}>
                  {idea.revivalProbability}% revival
                </p>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Comparison chart */}
      {selected.length > 0 && (
        <div className="space-y-6 animate-fade-in">
          <Card className="space-y-4">
            <div className="flex items-center gap-2">
              <GitCompare size={18} className="text-violet-400" />
              <h2 className="text-base font-semibold text-white">Comparison Chart</h2>
            </div>
            <div className="h-72">
              <ComparisonChart ideas={selected} />
            </div>
          </Card>

          {/* Individual cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {selected.map((idea) => {
              const color = colorFor(idea);
              return (
                <Card key={idea.id} className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div
                        className="w-2.5 h-2.5 rounded-full mt-2 flex-shrink-0"
                        style={{ background: color, boxShadow: `0 0 8px ${color}60` }}
                      />
                      <div className="min-w-0">
                        <h3 className="text-base font-bold text-white truncate">{idea.name}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">{idea.description}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleIdea(idea.id)}
                      className="text-slate-600 hover:text-red-400 transition-colors ml-2 flex-shrink-0"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Revival', value: `${idea.revivalProbability}%`, color: 'text-violet-400' },
                      { label: 'Score', value: `${idea.trendScore.toFixed(1)}`, color: 'text-cyan-400' },
                      { label: 'Trend', value: idea.trend.charAt(0).toUpperCase() + idea.trend.slice(1), color: idea.trend === 'rising' ? 'text-emerald-400' : idea.trend === 'declining' ? 'text-red-400' : 'text-amber-400' },
                    ].map((s) => (
                      <div key={s.label} className="text-center p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{s.label}</p>
                        <p className={`text-sm font-bold ${s.color}`}>{s.value}</p>
                      </div>
                    ))}
                  </div>

                  <div>
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Lifecycle</p>
                    <div className="h-32">
                      <LifecycleChart states={idea.states} values={idea.progressionValues} />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Detailed comparison table */}
          <Card className="space-y-4">
            <h2 className="text-base font-semibold text-white">Detailed Comparison</h2>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Metric</th>
                    {selected.map((idea) => (
                      <th key={idea.id} style={{ color: colorFor(idea) }}>{idea.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: 'Revival Probability', render: (i) => <span className="font-bold text-violet-400">{i.revivalProbability}%</span> },
                    { label: 'Trend Score', render: (i) => `${i.trendScore.toFixed(1)}/10` },
                    { label: 'Category', render: (i) => i.category },
                    { label: 'Trend Direction', render: (i) => (
                      <Badge
                        label={i.trend.charAt(0).toUpperCase() + i.trend.slice(1)}
                        variant={i.trend === 'rising' ? 'success' : i.trend === 'declining' ? 'danger' : 'warning'}
                        size="sm"
                      />
                    )},
                    { label: 'Peak Value', render: (i) => `${Math.max(...i.progressionValues)}%` },
                  ].map(({ label, render }) => (
                    <tr key={label}>
                      <td className="font-semibold text-slate-300">{label}</td>
                      {selected.map((idea) => (
                        <td key={idea.id}>{render(idea)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {selected.length === 0 && (
        <div
          className="glass-card p-16 text-center border-dashed border-2 animate-fade-in"
          style={{ borderColor: 'rgba(255,255,255,0.08)' }}
        >
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}>
            <Plus size={24} className="text-violet-600" />
          </div>
          <p className="text-slate-400 font-medium">Ready for Battle?</p>
          <p className="text-sm text-slate-600 mt-1">Select up to 4 ideas above to start the ultimate VS Mode comparison.</p>
        </div>
      )}
    </div>
  );
}
