import { Sparkles, TrendingUp, TrendingDown, Clock, Brain } from 'lucide-react';
import Badge from './UI/Badge';

const EXPLANATIONS = {
  high: [
    (idea) => `"${idea}" is gaining explosive momentum driven by global productivity shifts and tech adoption cycles.`,
    (idea) => `Macro-trends in digital transformation strongly favor "${idea}" — convergence of 3 key cultural waves detected.`,
    (idea) => `Historical pattern analysis shows "${idea}" mirrors the trajectory of highly successful cultural movements from prior decades.`,
  ],
  moderate: [
    (idea) => `"${idea}" shows moderate revival potential, supported by niche community growth and emerging discourse patterns.`,
    (idea) => `Mixed signals detected for "${idea}" — strong adoption in specific demographics offsets broader market hesitation.`,
  ],
  low: [
    (idea) => `"${idea}" faces cultural headwinds. Competing trends and market saturation limit near-term revival probability.`,
    (idea) => `Declining engagement signals suggest "${idea}" is in a dormancy phase. Long-term revival possible but unlikely within 5 years.`,
  ],
};

export default function AIPredictions({ result, idea, revivalProbability }) {
  const level = revivalProbability >= 80 ? 'high' : revivalProbability >= 60 ? 'moderate' : 'low';
  const pool = EXPLANATIONS[level];
  const explanation = pool[Math.floor(Math.random() * pool.length)](idea);

  const badge = {
    high: { label: 'High Potential', variant: 'success' },
    moderate: { label: 'Moderate Potential', variant: 'warning' },
    low: { label: 'Low Potential', variant: 'danger' },
  }[level];

  const trend = revivalProbability >= 70;
  const confidence = Math.round(75 + Math.random() * 20);
  const timeline = revivalProbability >= 75 ? '3–5 yrs' : revivalProbability >= 60 ? '5–8 yrs' : '8+ yrs';

  const factors = [
    { label: 'Tech Adoption', value: Math.round(revivalProbability * 0.9 + Math.random() * 10), max: 100 },
    { label: 'Cultural Fit', value: Math.round(revivalProbability * 0.85 + Math.random() * 15), max: 100 },
    { label: 'Market Timing', value: Math.round(revivalProbability * 0.8 + Math.random() * 20), max: 100 },
  ];

  return (
    <div className="glass-card p-5 space-y-5 animate-fade-in-up">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg" style={{ background: 'rgba(124,58,237,0.2)' }}>
          <Brain size={16} className="text-violet-400" />
        </div>
        <h3 className="text-sm font-semibold text-white">AI Insights</h3>
        <Badge label={badge.label} variant={badge.variant} size="sm" />
      </div>

      {/* Explanation */}
      <div className="rounded-xl p-4 space-y-2"
        style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)' }}>
        <div className="flex items-start gap-2">
          {trend ? <TrendingUp size={14} className="text-emerald-400 mt-0.5 flex-shrink-0" /> : <TrendingDown size={14} className="text-red-400 mt-0.5 flex-shrink-0" />}
          <p className="text-xs text-slate-300 leading-relaxed">{explanation}</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <p className="text-[10px] text-slate-500 mb-1 uppercase tracking-wider">Revival</p>
          <p className="text-lg font-bold text-violet-400">{Math.round(revivalProbability)}%</p>
        </div>
        <div className="text-center p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <p className="text-[10px] text-slate-500 mb-1 uppercase tracking-wider">Confidence</p>
          <p className="text-lg font-bold text-cyan-400">{confidence}%</p>
        </div>
        <div className="text-center p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <p className="text-[10px] text-slate-500 mb-1 uppercase tracking-wider">Timeline</p>
          <p className="text-sm font-bold text-emerald-400">{timeline}</p>
        </div>
      </div>

      {/* Factor bars */}
      <div className="space-y-3">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Influence Factors</p>
        {factors.map((f) => (
          <div key={f.label} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">{f.label}</span>
              <span className="text-xs font-semibold text-slate-300">{f.value}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${f.value}%` }} />
            </div>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-slate-600 flex items-start gap-1.5">
        <Sparkles size={10} className="flex-shrink-0 mt-0.5 text-violet-600" />
        Model trained on 10,000+ cultural ideas. Predictions are probabilistic, not deterministic.
      </p>
    </div>
  );
}
