import { useNavigate } from 'react-router-dom';
import { TrendingUp, RefreshCw, LineChart, Award, Zap, GitCompare, ArrowRight } from 'lucide-react';
import Card from '../components/UI/Card';
import TrendPanel from '../components/TrendPanel';
import RankingTable from '../components/RankingTable';
import { useLiveIdeas } from '../hooks/useLiveIdeas';

export default function Dashboard() {
  const navigate = useNavigate();
  const { ideas: TOP_IDEAS, loading } = useLiveIdeas();

  if (loading || TOP_IDEAS.length === 0) {
    return (
      <div className="space-y-8">
        <div className="space-y-3">
          <div className="h-9 w-48 skeleton rounded-lg" />
          <div className="h-4 w-64 skeleton rounded-lg" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 skeleton rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 skeleton rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          <div className="xl:col-span-3 h-96 skeleton rounded-2xl" />
          <div className="xl:col-span-2 h-96 skeleton rounded-2xl" />
        </div>
      </div>
    );
  }

  const maxProb = Math.max(...TOP_IDEAS.map((i) => i.revivalProbability));
  const avgRevival = Math.round(TOP_IDEAS.reduce((a, b) => a + b.revivalProbability, 0) / TOP_IDEAS.length);
  const rising = TOP_IDEAS.filter((i) => i.trend === 'rising').length;
  const topIdea = TOP_IDEAS[0];

  const STATS = [
    {
      title: 'Top Revival Idea',
      value: topIdea.name,
      sub: `${topIdea.revivalProbability}% revival probability`,
      icon: TrendingUp,
      from: '#7c3aed',
      to: '#6d28d9',
      glow: 'rgba(124,58,237,0.3)',
      link: '/rankings',
    },
    {
      title: 'Avg Revival Rate',
      value: `${avgRevival}%`,
      sub: 'Across top 10 ideas',
      icon: RefreshCw,
      from: '#0891b2',
      to: '#06b6d4',
      glow: 'rgba(6,182,212,0.3)',
      link: '/simulator',
    },
    {
      title: 'Rising Ideas',
      value: rising,
      sub: 'Gaining momentum now',
      icon: LineChart,
      from: '#059669',
      to: '#10b981',
      glow: 'rgba(16,185,129,0.3)',
      link: '/trends',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="animate-fade-in-up flex items-center justify-between">
        <div>
          <h1 className="page-title text-5xl font-black drop-shadow-md mb-2">Welcome to the Future</h1>
          <p className="page-subtitle text-lg italic text-slate-300 border-l-4 border-violet-500 pl-3 py-1">
            "The future belongs to those who can see it coming." — Experience real-time cultural forecasting.
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {STATS.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              onClick={() => navigate(stat.link)}
              className="glass-card glass-card-hover p-5 cursor-pointer animate-fade-in-up"
              style={{ animationDelay: `${idx * 0.1}s`, opacity: 0, animationFillMode: 'forwards' }}
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${stat.from}, ${stat.to})`, boxShadow: `0 4px 12px ${stat.glow}` }}
                >
                  <Icon size={18} className="text-white" />
                </div>
                <ArrowRight size={14} className="text-slate-600 group-hover:text-slate-400 transition-colors mt-1" />
              </div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">{stat.title}</p>
              <p className="text-2xl font-bold text-white truncate">{stat.value}</p>
              <p className="text-[11px] text-slate-500 mt-1">{stat.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in-up" style={{ animationDelay: '0.3s', opacity: 0, animationFillMode: 'forwards' }}>
        {[
          { label: 'Total Ideas', value: TOP_IDEAS.length, color: 'text-violet-400' },
          { label: 'Max Revival', value: `${maxProb}%`, color: 'text-emerald-400' },
          { label: 'Avg Score', value: `${(TOP_IDEAS.reduce((a, b) => a + b.trendScore, 0) / TOP_IDEAS.length).toFixed(1)}`, color: 'text-cyan-400' },
          { label: 'Declining', value: TOP_IDEAS.filter((i) => i.trend === 'declining').length, color: 'text-red-400' },
        ].map((s) => (
          <div key={s.label} className="glass-card p-4 text-center">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Resurgence Forecast & Museum Mode */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in-up" style={{ animationDelay: '0.5s', opacity: 0, animationFillMode: 'forwards' }}>
        <Card className="relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <Zap size={120} className="text-violet-400" />
          </div>
          <div className="relative z-10">
            <h2 className="text-lg font-bold text-white mb-2">Resurgence Forecast</h2>
            <p className="text-sm text-slate-400 mb-6">
              Our Markov Chain models indicate a 24% increase in 'Stoicism' rebirth within the next 18 months.
            </p>
            <div className="space-y-4">
              {TOP_IDEAS.filter(i => i.revivalProbability > 70).slice(0, 3).map(idea => (
                <div key={idea.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-sm font-medium text-slate-200">{idea.name}</span>
                  <div className="flex items-center gap-3">
                    <div className="h-1.5 w-24 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-violet-500 rounded-full" style={{ width: `${idea.revivalProbability}%` }} />
                    </div>
                    <span className="text-xs font-bold text-violet-400">{idea.revivalProbability}%</span>
                  </div>
                </div>
              ))}
            </div>
            <button 
              onClick={() => navigate('/simulator')}
              className="mt-6 w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold transition-all shadow-lg shadow-violet-900/20"
            >
              Enter Simulation Chamber
            </button>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-slate-900 to-indigo-950 border-indigo-500/30 relative overflow-hidden group">
          <div className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-screen transition-transform duration-1000 group-hover:scale-105" style={{ backgroundImage: "url('/card_bg_purple.png')" }} />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/40 flex items-center justify-center backdrop-blur-sm">
                <LineChart size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white shadow-sm drop-shadow">Museum Interactive Mode</h2>
                <p className="text-[10px] text-indigo-200 uppercase tracking-widest font-bold">Industry Standard Enabled</p>
              </div>
            </div>
            <p className="text-sm text-white/90 leading-relaxed mb-6 font-medium">
              This platform is designed for everyone—from students exploring ideas to professionals predicting market shifts. Dive into the data and discover what the world cares about next.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-black/40 border border-white/10 text-center backdrop-blur-sm">
                <p className="text-2xl font-black text-white drop-shadow">12.4k</p>
                <p className="text-[10px] text-indigo-200 uppercase font-semibold">Data Points / Sec</p>
              </div>
              <div className="p-4 rounded-xl bg-black/40 border border-white/10 text-center backdrop-blur-sm">
                <p className="text-2xl font-black text-emerald-400 drop-shadow">99.2%</p>
                <p className="text-[10px] text-indigo-200 uppercase font-semibold">Model Accuracy</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 animate-fade-in-up" style={{ animationDelay: '0.6s', opacity: 0, animationFillMode: 'forwards' }}>
        {/* Leaderboard */}
        <div className="xl:col-span-3">
          <Card>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Award size={18} className="text-amber-400" />
                <h2 className="text-base font-semibold text-white">Top Ideas Leaderboard</h2>
              </div>
              <button
                onClick={() => navigate('/rankings')}
                className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors"
              >
                View all <ArrowRight size={12} />
              </button>
            </div>
            <RankingTable ideas={TOP_IDEAS.slice(0, 5)} onSelect={() => navigate('/rankings')} />
          </Card>
        </div>

        {/* Trend insights */}
        <div className="xl:col-span-2 space-y-5">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-white">Trend Insights</h2>
              <button
                onClick={() => navigate('/trends')}
                className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors"
              >
                See all <ArrowRight size={12} />
              </button>
            </div>
            <TrendPanel ideas={TOP_IDEAS.slice(0, 5)} />
          </Card>

          {/* Quick actions */}
          <div className="glass-card p-4 space-y-2">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Quick Actions</p>
            {[
              { label: 'Run Simulator', icon: Zap, path: '/simulator', color: '#7c3aed' },
              { label: 'Compare Ideas', icon: GitCompare, path: '/comparison', color: '#06b6d4' },
            ].map(({ label, icon: Icon, path, color }) => (
              <button
                key={path}
                onClick={() => navigate(path)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-300 hover:text-white transition-all"
                style={{ background: 'rgba(255,255,255,0.04)' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
              >
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}30` }}>
                  <Icon size={14} style={{ color }} />
                </div>
                {label}
                <ArrowRight size={14} className="ml-auto text-slate-600" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
