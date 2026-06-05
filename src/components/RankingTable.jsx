import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import Badge from './UI/Badge';

const TREND_ICONS = {
  rising: { icon: TrendingUp, color: 'text-emerald-400' },
  stable: { icon: Minus, color: 'text-amber-400' },
  declining: { icon: TrendingDown, color: 'text-red-400' },
};

const RANK_MEDALS = ['🥇', '🥈', '🥉'];

export default function RankingTable({ ideas, onSelect }) {
  return (
    <div className="overflow-x-auto">
      <table className="data-table">
        <thead>
          <tr>
            <th className="w-12">#</th>
            <th>Idea</th>
            <th className="hidden sm:table-cell">Category</th>
            <th>Revival</th>
            <th className="hidden md:table-cell">Score</th>
            <th>Trend</th>
          </tr>
        </thead>
        <tbody>
          {ideas.map((idea, idx) => {
            const { icon: Icon, color } = TREND_ICONS[idea.trend] ?? TREND_ICONS.stable;
            return (
              <tr
                key={idea.id}
                onClick={() => onSelect?.(idea)}
                className="cursor-pointer"
              >
                <td>
                  <span className="text-sm">
                    {idx < 3 ? RANK_MEDALS[idx] : (
                      <span className="text-slate-500 font-mono text-xs">{String(idx + 1).padStart(2, '0')}</span>
                    )}
                  </span>
                </td>
                <td>
                  <div>
                    <p className="text-sm font-semibold text-white">{idea.name}</p>
                    <p className="text-[11px] text-slate-600 mt-0.5 sm:hidden">{idea.category}</p>
                  </div>
                </td>
                <td className="hidden sm:table-cell">
                  <span className="badge-neutral">{idea.category}</span>
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-violet-400 tabular-nums">{idea.revivalProbability}%</span>
                    <div className="hidden lg:block w-16 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${idea.revivalProbability}%`,
                          background: 'linear-gradient(90deg, #7c3aed, #06b6d4)',
                        }}
                      />
                    </div>
                  </div>
                </td>
                <td className="hidden md:table-cell">
                  <span className="text-sm font-semibold text-slate-300 tabular-nums">{idea.trendScore.toFixed(1)}</span>
                  <span className="text-slate-600 text-xs">/10</span>
                </td>
                <td>
                  <div className="flex items-center gap-1.5">
                    <Icon size={14} className={color} />
                    <span className={`text-xs font-medium capitalize hidden sm:inline ${color}`}>{idea.trend}</span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
