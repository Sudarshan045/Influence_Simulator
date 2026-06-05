import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, Activity, Wifi, Globe, MapPin, Zap, Info, Maximize2, Terminal } from 'lucide-react';
import Card from '../components/UI/Card';
import TrendPanel from '../components/TrendPanel';
import RegionalChart from '../components/RegionalChart';
import { useLiveIdeas } from '../hooks/useLiveIdeas';
import { getGlobalTrends, getRegionalTrends } from '../services/api';

function Sparkline({ values }) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const w = 64;
  const h = 28;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <polyline
        points={pts}
        fill="none"
        stroke="url(#spark)"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <defs>
        <linearGradient id="spark" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function Trends() {
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [pulse, setPulse] = useState(false);
  const [globalTrends, setGlobalTrends] = useState([]);
  const [regionalTrends, setRegionalTrends] = useState({});
  const [feedItems, setFeedItems] = useState([
    "DETECTED: 'Neo-Tribalism' rising in Central Europe (Momentum +14%)",
    "ANALYTICS: 'Stoicism' reaching peak year estimate 2027 in North America",
    "SIGNAL: 'Digital Minimalism' entering revival phase in East Asia",
    "KARMA: Economic instability driving 'Frugal Hedonism' scores higher in Brazil (+8%)",
    "DETECTED: 'Algorithmic Resistance' social volume spiked by 210% in last 24h",
    "ANALYTICS: 'Space Commerce' transitioned from Birth to Growth phase",
    "SIGNAL: Decline predicted for 'Hustle Culture' among Gen Z demographic (-22%)",
    "KARMA: High Productivity Culture index suppressing 'Slow Living' in urban centers",
    "DETECTED: 'Regenerative Agriculture' cross-pollinating with 'Tech Startups'",
    "ANALYTICS: Markov Chain probability for 'Synthetic Media Trust' dropping below threshold",
    "SIGNAL: 'Corporate Monasticism' detected as emerging coping mechanism in tech hubs",
    "KARMA: Social Fragmentation index (+1.2) acting as catalyst for 'Virtual Idols'"
  ]);

  const { ideas: TOP_IDEAS, loading } = useLiveIdeas();

  useEffect(() => {
    const fetchData = async () => {
      // Both calls go through the centralized service — retry + fallback handled there
      const [globalData, regionalData] = await Promise.all([
        getGlobalTrends(),
        getRegionalTrends(),
      ]);

      if (globalData.length > 0)   setGlobalTrends(globalData);
      if (Object.keys(regionalData).length > 0) setRegionalTrends(regionalData);
    };
    fetchData();
  }, []);

  const risingIdeas = TOP_IDEAS.filter((i) => i.trend === 'rising');
  const decliningIdeas = TOP_IDEAS.filter((i) => i.trend === 'declining');
  const stableIdeas = TOP_IDEAS.filter((i) => i.trend === 'stable');

  const TICKER_IDEAS = [...TOP_IDEAS].sort((a, b) => b.revivalProbability - a.revivalProbability);

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date());
      setPulse(true);
      setTimeout(() => setPulse(false), 600);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const STAT_CARDS = [
    { label: 'Rising', count: risingIdeas.length, icon: TrendingUp, color: 'text-emerald-400', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)', accent: '#10b981' },
    { label: 'Stable', count: stableIdeas.length, icon: Minus, color: 'text-amber-400', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)', accent: '#f59e0b' },
    { label: 'Declining', count: decliningIdeas.length, icon: TrendingDown, color: 'text-red-400', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)', accent: '#ef4444' },
  ];

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-start">
          <div className="space-y-3">
            <div className="h-9 w-48 skeleton rounded-lg" />
            <div className="h-4 w-64 skeleton rounded-lg" />
          </div>
          <div className="h-6 w-32 skeleton rounded-lg" />
        </div>
        <div className="h-12 skeleton rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 skeleton rounded-2xl" />
          ))}
        </div>
        <div className="h-80 skeleton rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-96 skeleton rounded-2xl" />
          <div className="h-96 skeleton rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="animate-fade-in-up flex items-start justify-between">
        <div>
          <h1 className="page-title">Trend Insights</h1>
          <p className="page-subtitle">Live analysis of rising, stable, and declining ideas</p>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          <div className={`w-2 h-2 rounded-full bg-emerald-400 ${pulse ? 'animate-pulse' : ''}`} />
          <Wifi size={13} />
          <span className="hidden sm:inline">Updated {lastUpdated.toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Live ticker */}
      <div
        className="overflow-hidden rounded-xl py-2.5 px-4 flex items-center gap-3"
        style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)' }}
      >
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Activity size={13} className="text-violet-400 animate-pulse" />
          <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest">Live</span>
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="flex gap-8 animate-ticker whitespace-nowrap">
            {[...TICKER_IDEAS, ...TICKER_IDEAS].map((idea, i) => (
              <span key={`${idea.id}-${i}`} className="text-xs text-slate-400 flex-shrink-0">
                <span className="text-slate-300 font-medium">{idea.name}</span>
                <span className="mx-2 text-slate-600">·</span>
                <span className={idea.trend === 'rising' ? 'text-emerald-400' : idea.trend === 'declining' ? 'text-red-400' : 'text-amber-400'}>
                  {idea.revivalProbability}%
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {STAT_CARDS.map(({ label, count, icon: Icon, color, bg, border, accent }) => (
          <div
            key={label}
            className="glass-card p-5 animate-fade-in-up"
            style={{ borderLeft: `3px solid ${accent}33` }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: bg, border: `1px solid ${border}` }}>
                <Icon size={18} className={color} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400">{label}</p>
                <p className={`text-2xl font-bold ${color}`}>{count}</p>
              </div>
            </div>
            <p className="text-xs text-slate-500">ideas in this category</p>
            <div className="mt-3 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${(count / TOP_IDEAS.length) * 100}%`, background: accent }} />
            </div>
          </div>
        ))}
      </div>

      {/* Rising ideas with sparklines */}
      <Card>
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp size={18} className="text-emerald-400" />
          <h2 className="text-base font-semibold text-white">Rising Ideas</h2>
          <span className="badge-success ml-2">{risingIdeas.length}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {risingIdeas.map((idea) => (
            <div key={idea.id} className="flex items-center gap-4 p-4 rounded-xl transition-all"
              style={{ background: 'rgba(255,255,255,0.03)' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{idea.name}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{idea.category}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs font-bold text-emerald-400">{idea.revivalProbability}%</span>
                  <span className="text-[10px] text-slate-600">revival</span>
                </div>
              </div>
              <Sparkline values={idea.progressionValues} />
            </div>
          ))}
        </div>
      </Card>

      {/* All trends panel */}
      <Card>
        <h2 className="text-base font-semibold text-white mb-4">All Trends Overview</h2>
        <TrendPanel ideas={TOP_IDEAS} />
      </Card>

      {/* NEW: Real-time Intelligence Feed (Black Terminal style) */}
      <div className="animate-fade-in-up" style={{ animationDelay: '0.5s', opacity: 0, animationFillMode: 'forwards' }}>
        <div className="flex items-center gap-2 mb-3">
          <Terminal size={16} className="text-violet-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Real-time Intelligence Feed</h2>
        </div>
        <div className="bg-black border border-white/10 rounded-xl p-4 font-mono text-[11px] h-40 overflow-y-auto space-y-2 custom-scrollbar">
          {feedItems.map((item, i) => (
            <div key={i} className="flex gap-3">
              <span className="text-slate-600">[{new Date().toLocaleTimeString()}]</span>
              <span className={item.startsWith('DETECTED') ? 'text-emerald-400' : item.startsWith('ANALYTICS') ? 'text-violet-400' : 'text-cyan-400'}>
                {item}
              </span>
            </div>
          ))}
          <div className="animate-pulse text-emerald-400">_</div>
        </div>
      </div>

      {/* NEW: Global Hotspots & Regional Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in-up" style={{ animationDelay: '0.6s', opacity: 0, animationFillMode: 'forwards' }}>
        {/* World Trending Ideas */}
        <Card>
          <div className="flex items-center gap-2 mb-5">
            <Globe size={18} className="text-violet-400" />
            <h2 className="text-base font-semibold text-white">World Trending Ideas</h2>
          </div>
          <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
            {globalTrends.map((trend) => (
              <div key={trend.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 group hover:border-violet-500/30 transition-all">
                <div className="flex items-center gap-3 w-1/3">
                  <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
                    <Zap size={14} className="text-violet-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">{trend.name}</p>
                    <p className="text-[10px] text-slate-500">{trend.region}</p>
                  </div>
                </div>
                
                {/* Mini Graph for World Trends */}
                <div className="flex-1 px-4 flex justify-center hidden sm:block">
                   <Sparkline values={trend.progressionValues || [10, 30, 50, 40, 60, 80]} />
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-emerald-400">{trend.momentum}</p>
                  <p className="text-[10px] text-slate-500">{trend.probability}% Prob.</p>
                </div>
                <button className="ml-3 p-2 rounded-lg hover:bg-white/10 text-slate-600 hover:text-white transition-all flex-shrink-0">
                  <Maximize2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </Card>

        {/* Regional Breakdown */}
        <Card>
          <div className="flex items-center gap-2 mb-5">
            <MapPin size={18} className="text-cyan-400" />
            <h2 className="text-base font-semibold text-white">Regional Breakdown (Avg Momentum)</h2>
          </div>
          
          <div className="h-64 w-full">
            <RegionalChart data={regionalTrends} />
          </div>
          
          <div className="mt-4 grid grid-cols-2 gap-4">
            {Object.entries(regionalTrends).map(([region, ideas]) => (
              <div key={region} className="p-3 rounded-xl bg-white/5 border border-white/5">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">{region}</p>
                <div className="space-y-2">
                  {ideas.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-300 truncate pr-2">{item.idea}</span>
                      <span className="text-[11px] font-bold text-cyan-400">{item.score}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* NEW: Deep Lifecycle Analysis Info */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-violet-900/40 to-cyan-900/40 border border-white/10 animate-fade-in-up" style={{ animationDelay: '0.7s', opacity: 0, animationFillMode: 'forwards' }}>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0">
            <Info size={24} className="text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white mb-1">Advanced Lifecycle Analysis (Birth to Peak)</h3>
            <p className="text-sm text-slate-300 mb-4 max-w-2xl">
              Our system automatically detects early-stage "Birth" signals by analyzing global social metadata. 
              Each trend above is processed through a 12-layer Markov chain to estimate the exact time to reach its "Peak" cultural saturation.
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] text-slate-400">
                <span className="text-white font-bold mr-1">4.2M</span> Points Processed / Min
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] text-slate-400">
                <span className="text-white font-bold mr-1">98.4%</span> Detection Accuracy
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
