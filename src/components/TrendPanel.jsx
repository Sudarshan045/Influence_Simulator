import { TrendingUp, TrendingDown, Minus, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TREND_CONFIG = {
  rising: { icon: TrendingUp, color: 'text-emerald-400', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)', label: 'Rising' },
  stable: { icon: Minus, color: 'text-amber-400', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)', label: 'Stable' },
  declining: { icon: TrendingDown, color: 'text-red-400', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)', label: 'Declining' },
};

export default function TrendPanel({ ideas }) {
  const navigate = useNavigate();

  return (
    <div className="space-y-2">
      {ideas.map((idea, idx) => {
        const config = TREND_CONFIG[idea.trend] ?? TREND_CONFIG.stable;
        const Icon = config.icon;

        return (
          <div
            key={idea.id}
            onClick={() => navigate('/rankings')}
            className="flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 group"
            style={{ background: 'rgba(255,255,255,0.03)' }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
          >
            {/* Rank */}
            <span className="text-[11px] font-bold w-5 text-center text-slate-600 tabular-nums flex-shrink-0">
              {idx + 1}
            </span>

            {/* Trend icon */}
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: config.bg, border: `1px solid ${config.border}` }}>
              <Icon size={14} className={config.color} />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate group-hover:text-violet-300 transition-colors">
                {idea.name}
              </p>
              <p className="text-[11px] text-slate-500 truncate">{idea.category}</p>
            </div>

            {/* Revival bar */}
            <div className="hidden sm:flex flex-col items-end gap-1 flex-shrink-0 w-24">
              <span className="text-xs font-bold text-slate-300 tabular-nums">{idea.revivalProbability}%</span>
              <div className="w-full h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${idea.revivalProbability}%`,
                    background: 'linear-gradient(90deg, #7c3aed, #06b6d4)',
                  }}
                />
              </div>
            </div>

            {/* Score */}
            <span className="text-xs font-bold text-violet-400 flex-shrink-0 tabular-nums hidden md:block">
              {idea.trendScore.toFixed(1)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
