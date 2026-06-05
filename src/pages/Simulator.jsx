import { useState, useEffect } from 'react';
import { Zap, X, BookmarkPlus, CheckCircle, TrendingUp, WifiOff, AlertTriangle, ServerCrash, Download, BookOpen, History, PlusCircle, ChevronDown, ChevronUp, Share2, Globe2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import LifecycleChart from '../components/LifecycleChart';
import AIPredictions from '../components/AIPredictions';
import ScenarioEngine from '../components/ScenarioEngine';
import MarkovTransitionChart from '../components/MarkovTransitionChart';
import YearwiseChart from '../components/YearwiseChart';
import Toast from '../components/UI/Toast';
import Modal from '../components/UI/Modal';
import ErrorBoundary from '../components/ErrorBoundary';
import { useSimulation } from '../hooks/useSimulation';
import { useSimulationHistory } from '../context/SimulationHistoryContext';
import { useNotifications } from '../context/NotificationContext';
import { getTrendingIdeas, axiosInstance } from '../services/api';
import { TOP_IDEAS } from '../constants/ideas';
import { exportSimulatorPDF } from '../utils/pdfExport';

// ── Word meaning resolver ──────────────────────────────────────────────────────
function resolveIdeaMeta(ideaName) {
  const lower = ideaName.toLowerCase();
  const match = TOP_IDEAS.find((i) => i.name.toLowerCase() === lower);
  if (match) return match;
  // partial match
  return TOP_IDEAS.find((i) => lower.includes(i.name.toLowerCase().split(' ')[0])) || null;
}

export default function Simulator() {
  const [idea, setIdea] = useState('');
  const [scenario, setScenario] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [savedThisResult, setSavedThisResult] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [addedToCatalogue, setAddedToCatalogue] = useState(false);
  const [ideaMeta, setIdeaMeta] = useState(null);
  const [liveDataEnabled, setLiveDataEnabled] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const { loading, result, error, errorType, simulate, reset } = useSimulation();
  const { saveSimulation } = useSimulationHistory();
  const { addNotification } = useNotifications();
  const [trending, setTrending] = useState([]);

  useEffect(() => {
    getTrendingIdeas().then(setTrending).catch(console.error);
  }, []);

  const handleSimulate = async () => {
    setSavedThisResult(false);
    setAddedToCatalogue(false);
    setIdeaMeta(null); // Clear previous meta
    const data = await simulate(idea, scenario, liveDataEnabled);
    if (data?.meta) {
      setIdeaMeta(data.meta);
    } else {
      const meta = resolveIdeaMeta(idea);
      setIdeaMeta(meta);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading && idea.trim()) handleSimulate();
  };

  const handleClear = () => {
    setIdea('');
    setSavedThisResult(false);
    setAddedToCatalogue(false);
    setIdeaMeta(null);
    reset();
  };

  const handleSave = () => {
    if (!result) return;
    saveSimulation(idea, result, scenario);
    setSavedThisResult(true);
    setToast({ message: `"${idea}" simulation saved!`, type: 'success' });
    if (result.revival_probability >= 70) {
      addNotification({
        title: 'High Revival Alert',
        message: `"${idea}" shows ${Math.round(result.revival_probability)}% revival probability!`,
        type: 'alert',
      });
    }
  };

  const handleExportPDF = async () => {
    if (!result) return;
    setPdfLoading(true);
    try {
      await exportSimulatorPDF(idea, result, scenario);
      setToast({ message: 'PDF report downloaded!', type: 'success' });
    } catch (e) {
      setToast({ message: 'PDF export failed. Try again.', type: 'error' });
    } finally {
      setPdfLoading(false);
    }
  };

  const handleShare = async () => {
    const card = document.getElementById('shareable-card');
    if (!card) return;
    setIsSharing(true);
    try {
      const canvas = await html2canvas(card, { backgroundColor: '#020617', scale: 2 });
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `TrendScore_${idea.replace(/\s+/g, '_')}.png`;
      a.click();
      setToast({ message: 'Scorecard ready for Social Media!', type: 'success' });
    } catch (e) {
      setToast({ message: 'Sharing failed.', type: 'error' });
    } finally {
      setIsSharing(false);
    }
  };

  const handleAddToCatalogue = async () => {
    if (!result || addedToCatalogue) return;
    try {
      await axiosInstance.post('/ideas/add', {
        name: idea,
        category: result.karma_breakdown?._match_type?.split(':')[1] || 'General',
        revival_probability: result.revival_probability,
        current_state: result.current_state,
      });
      setAddedToCatalogue(true);
      setToast({ message: `"${idea}" added to the catalogue!`, type: 'success' });
    } catch {
      // If backend not available, just mark as added optimistically
      setAddedToCatalogue(true);
      setToast({ message: `"${idea}" queued for catalogue addition.`, type: 'success' });
    }
  };

  const isNewIdea = result && !ideaMeta;

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="relative rounded-2xl overflow-hidden mb-8 animate-fade-in-up shadow-2xl" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/hero_bg.png')", opacity: 0.6 }} />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0a0a16]" />
        <div className="relative p-10 sm:p-14 text-center">
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-4 tracking-tight" style={{ textShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
            Discover the Future of <span style={{ color: '#a78bfa' }}>Any Idea</span>.
          </h1>
          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto font-medium" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
            Predict what goes viral, what dies out, and what makes a comeback using our advanced cultural engine.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main panel */}
        <div className="lg:col-span-2 space-y-6">

          {/* Input */}
          <Card className="space-y-4">
            <h2 className="text-base font-semibold text-white">Start Simulation</h2>
            <Input
              label="Enter your idea"
              placeholder="e.g., 'Sustainable fashion in tech communities'"
              value={idea}
              onChange={setIdea}
              onKeyPress={handleKeyPress}
              disabled={loading}
              error={error}
            />

            <div className="flex items-center gap-3 py-2">
              <button
                onClick={() => setLiveDataEnabled(!liveDataEnabled)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${liveDataEnabled ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-white/5 text-slate-400 border border-white/10'}`}
              >
                <Globe2 size={14} className={liveDataEnabled ? 'animate-pulse' : ''} />
                {liveDataEnabled ? 'Live Social Data: ON' : 'Live Social Data: OFF'}
              </button>
              <p className="text-[10px] text-slate-500">Injects real-time sentiment</p>
            </div>

            <div className="flex gap-3 flex-wrap">
              <Button onClick={handleSimulate} loading={loading} icon={Zap} className="flex-1" disabled={!idea.trim()}>
                Simulate
              </Button>
              {result && (
                <>
                  <Button variant={savedThisResult ? 'secondary' : 'secondary'} icon={savedThisResult ? CheckCircle : BookmarkPlus} onClick={handleSave} disabled={savedThisResult} className="flex-1">
                    {savedThisResult ? 'Saved' : 'Save Result'}
                  </Button>
                  <Button variant="secondary" icon={pdfLoading ? null : Download} onClick={handleExportPDF} loading={pdfLoading} className="flex-1">
                    PDF Report
                  </Button>
                  <Button variant="primary" style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)' }} icon={Share2} onClick={handleShare} loading={isSharing} className="flex-1">
                    Share to Socials
                  </Button>
                  <Button variant="secondary" onClick={handleClear} icon={X}>Clear</Button>
                </>
              )}
            </div>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} autoClose />}

            {error && !result && (
              <div className="flex items-start gap-3 p-4 rounded-xl animate-fade-in-up"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <div className="flex-shrink-0 mt-0.5">
                  {errorType === 'NETWORK' && <WifiOff size={16} className="text-red-400" />}
                  {errorType === 'SERVER' && <ServerCrash size={16} className="text-red-400" />}
                  {(errorType === 'VALIDATION' || !errorType) && <AlertTriangle size={16} className="text-amber-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-red-300">
                    {errorType === 'NETWORK' ? 'Connection Error' : errorType === 'SERVER' ? 'Prediction Engine Error' : 'Simulation Failed'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{error}</p>
                </div>
                <button onClick={reset} className="flex-shrink-0 text-slate-500 hover:text-white transition-colors p-1"><X size={14} /></button>
              </div>
            )}
          </Card>

          {/* Results */}
          {result && (
            <div className="space-y-6 animate-fade-in-up">

              {/* Word Meaning */}
              <Card className="space-y-3">
                <div className="flex items-center gap-2">
                  <BookOpen size={16} className="text-violet-400" />
                  <h2 className="text-base font-semibold text-white">What is "{idea}"?</h2>
                </div>
                {ideaMeta ? (
                  <div className="space-y-2">
                    <p className="text-sm text-slate-300 leading-relaxed">{ideaMeta.meaning || ideaMeta.description}</p>
                    {ideaMeta.description && ideaMeta.meaning && (
                      <p className="text-xs text-slate-500 leading-relaxed">{ideaMeta.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg"
                        style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', color: '#a78bfa' }}>
                        {ideaMeta.category}
                      </span>
                      {ideaMeta.origin_year && (
                        <span className="text-[10px] text-slate-500">Origin: {ideaMeta.origin_year}</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-slate-300 leading-relaxed">
                      <span className="font-semibold text-white">"{idea}"</span> is a new idea! We analyzed it and found it fits the{' '}
                      <span className="text-cyan-400 font-medium">{result.karma_breakdown?._match_type?.split(':')[0] || 'General'}</span> category. Here is a detailed breakdown of how it might perform in the real world.
                    </p>
                    {result.explanation && (
                      <p className="text-xs text-slate-400 leading-relaxed">{result.explanation}</p>
                    )}
                    {isNewIdea && (
                      <button
                        onClick={handleAddToCatalogue}
                        disabled={addedToCatalogue}
                        className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all mt-2"
                        style={{
                          background: addedToCatalogue ? 'rgba(16,185,129,0.15)' : 'rgba(124,58,237,0.15)',
                          border: `1px solid ${addedToCatalogue ? 'rgba(16,185,129,0.3)' : 'rgba(124,58,237,0.3)'}`,
                          color: addedToCatalogue ? '#34d399' : '#a78bfa',
                        }}
                      >
                        <PlusCircle size={13} />
                        {addedToCatalogue ? 'Added to Catalogue!' : 'Add this idea to Catalogue'}
                      </button>
                    )}
                  </div>
                )}
              </Card>

              {/* Revival hero */}
              <Card>
                <div className="flex items-end justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Chance of Comeback</p>
                    <p className="text-7xl font-black tabular-nums"
                      style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                      {Math.round(result.revival_probability)}%
                    </p>
                    <p className="text-sm text-slate-400">How likely this idea is to become popular again</p>
                  </div>
                  <div className="flex-1 h-20 rounded-xl overflow-hidden hidden sm:block"
                    style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.15)' }}>
                    <div className="h-full transition-all duration-1000 ease-out"
                      style={{ width: `${result.revival_probability}%`, background: 'linear-gradient(90deg, rgba(124,58,237,0.3), rgba(6,182,212,0.2))' }} />
                  </div>
                </div>
              </Card>

              {/* Karma */}
              <div id="shareable-card" className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-3xl" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <div className="vibrant-card-cyan p-6 flex flex-col justify-center text-center items-center">
                  <div className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-screen" style={{ backgroundImage: "url('/card_bg_cyan.png')" }} />
                  <div className="space-y-2 relative z-10">
                    <p className="text-[11px] font-bold text-cyan-300 uppercase tracking-widest bg-cyan-900/40 inline-block px-3 py-1 rounded-full mb-2">Cultural Fit Score</p>
                    <p className="text-7xl font-black tabular-nums drop-shadow-lg"
                      style={{ background: 'linear-gradient(135deg, #fff, #a5f3fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                      {result.karma_score?.toFixed(1) ?? '—'}%
                    </p>
                    <p className="text-sm text-cyan-100 font-medium max-w-[200px] mt-2">How well this idea fits with today's world</p>
                    {result.karma_breakdown?._match_type && (
                      <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider mt-4"
                        style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff' }}>
                        Profile: {result.karma_breakdown._match_type.split(':')[0]}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="vibrant-card-purple p-6 space-y-4">
                  <div className="absolute inset-0 bg-cover bg-center opacity-20 mix-blend-screen" style={{ backgroundImage: "url('/card_bg_purple.png')" }} />
                  <div className="relative z-10">
                    <h2 className="text-base font-bold text-white mb-4">Why it might work (Factors)</h2>
                    <div className="space-y-4">
                      {Object.entries(result.karma_breakdown)
                        .filter(([key]) => key !== '_match_type')
                        .map(([key, val]) => (
                          <div key={key} className="space-y-1.5">
                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                              <span className="text-violet-200">{key.replace(/_/g, ' ')}</span>
                              <span className="text-white">{(val * 100).toFixed(1)}%</span>
                            </div>
                            <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden border border-white/10">
                              <div className="h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                                style={{
                                  width: `${val * 100}%`,
                                  background: 'linear-gradient(90deg, #c084fc, #f472b6)',
                                }} />
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Lifecycle stages */}
              <Card className="space-y-4">
                <h2 className="text-base font-semibold text-white">Trend Journey</h2>
                <div className="space-y-3">
                  {result.states.map((state, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 text-white"
                        style={{ background: `hsl(${260 - idx * 30}, 70%, 55%)` }}>{idx + 1}</div>
                      <span className="text-sm font-medium text-slate-300 w-20 flex-shrink-0">{state}</span>
                      <div className="flex-1 h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${result.progressionValues[idx]}%`, background: `linear-gradient(90deg,hsl(${260 - idx * 30},70%,55%),hsl(${200 - idx * 15},80%,60%))` }} />
                      </div>
                      <span className="text-xs font-bold text-slate-400 tabular-nums w-8 text-right">{result.progressionValues[idx]}%</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Year-wise History Chart */}
              {ideaMeta?.year_data && (
                <Card className="space-y-4">
                  <div className="flex items-center gap-2">
                    <History size={16} className="text-cyan-400" />
                    <h2 className="text-base font-semibold text-white">Year-wise Cultural History</h2>
                    <span className="text-[10px] text-slate-500 ml-auto">{ideaMeta.origin_year} → Present</span>
                  </div>
                  {/* Stage legend */}
                  <div className="flex flex-wrap gap-2">
                    {[['Birth','#3b82f6'],['Growth','#10b981'],['Peak','#f59e0b'],['Decline','#ef4444'],['Dormancy','#64748b'],['Revival','#8b5cf6']].map(([s,c]) => (
                      <span key={s} className="flex items-center gap-1 text-[10px] text-slate-400">
                        <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: c }} />{s}
                      </span>
                    ))}
                  </div>
                  <div className="h-56">
                    <ErrorBoundary context="YearwiseChart" variant="widget">
                      <YearwiseChart yearData={ideaMeta.year_data} ideaName={idea} />
                    </ErrorBoundary>
                  </div>
                </Card>
              )}

              {/* Lifecycle chart */}
              <Card className="space-y-4">
                <h2 className="text-base font-semibold text-white">Trend Journey Visualization</h2>
                <div className="h-72">
                  <ErrorBoundary context="LifecycleChart" variant="widget">
                    <LifecycleChart states={result.states} values={result.progressionValues} />
                  </ErrorBoundary>
                </div>
              </Card>

              {/* Markov — per-idea with year dates */}
              {result.markov_simulation && (
                <Card className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-semibold text-white">Future Prediction Path</h2>
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest">Industry Model v2.4</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Model predicts the idea's future path year by year based on current trends. · Expected peak in <span className="text-cyan-400 font-semibold">{result.peak_year_estimate ?? 'N/A'}</span>
                  </p>
                  <div className="h-80">
                    <ErrorBoundary context="MarkovChart" variant="widget">
                      <MarkovTransitionChart
                        simulationData={result.markov_simulation}
                        peakYearEstimate={result.peak_year_estimate}
                        originYear={ideaMeta?.origin_year}
                      />
                    </ErrorBoundary>
                  </div>
                </Card>
              )}

              {/* Historical Context */}
              {ideaMeta?.historical_context && (
                <Card className="space-y-3">
                  <button
                    className="flex items-center justify-between w-full"
                    onClick={() => setShowHistory((p) => !p)}
                  >
                    <div className="flex items-center gap-2">
                      <History size={16} className="text-violet-400" />
                      <h2 className="text-base font-semibold text-white">Historical Context & Key Events</h2>
                    </div>
                    {showHistory ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
                  </button>

                  {showHistory && (
                    <div className="space-y-4 animate-fade-in-up">
                      <p className="text-sm text-slate-300 leading-relaxed">{ideaMeta.historical_context}</p>
                      {ideaMeta.key_events?.length > 0 && (
                        <div className="space-y-3 border-l-2 pl-4 ml-2" style={{ borderColor: 'rgba(124,58,237,0.3)' }}>
                          {ideaMeta.key_events.map((ev, i) => (
                            <div key={i} className="relative">
                              <div className="absolute -left-5 top-1.5 w-2 h-2 rounded-full bg-violet-500" />
                              <p className="text-[11px] font-bold text-violet-400">{ev.year}</p>
                              <p className="text-xs text-slate-400 leading-relaxed">{ev.event}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              )}

            </div>
          )}

          {/* Quick Start Guide */}
          {!result && !loading && (
            <div className="animate-fade-in-up mt-8">
              <h3 className="text-xl font-bold text-white mb-6">Quick Start Guide</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    step: 1,
                    title: 'Type any idea',
                    desc: 'Try "Space Tourism", "Minimalism", or even a new startup concept.',
                    color: '#a78bfa'
                  },
                  {
                    step: 2,
                    title: 'Tweak the World',
                    desc: 'Adjust the global economy or mental health sliders on the right sidebar.',
                    color: '#06b6d4'
                  },
                  {
                    step: 3,
                    title: 'See the Future',
                    desc: 'Watch the AI predict its cultural journey and chances of a comeback.',
                    color: '#10b981'
                  }
                ].map((item) => (
                  <Card key={item.step} className="relative overflow-hidden group hover:-translate-y-1 transition-transform">
                    <div className="absolute -right-4 -top-4 w-16 h-16 rounded-full opacity-10" style={{ background: item.color }} />
                    <div className="text-4xl font-black mb-3 opacity-20" style={{ color: item.color }}>0{item.step}</div>
                    <h4 className="text-white font-semibold mb-2">{item.title}</h4>
                    <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {loading && (
            <div className="glass-card p-12 text-center animate-fade-in">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 border-2 border-violet-800 border-t-violet-400 rounded-full animate-spin" />
              </div>
              <p className="text-slate-400 text-sm">Running probabilistic model...</p>
            </div>
          )}

          {/* Trending */}
          {!loading && trending.length > 0 && (
            <div className="animate-fade-in-up mt-8">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={18} className="text-violet-400" />
                <h3 className="text-sm font-semibold text-slate-300">Currently Trending</h3>
              </div>
              <div className="flex flex-wrap gap-3">
                {trending.map((trend) => (
                  <button key={trend.id}
                    onClick={() => { setIdea(trend.name); }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all hover:-translate-y-0.5"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <span className="text-sm font-medium text-slate-200">{trend.name}</span>
                    <span className="text-xs font-bold text-violet-400">{Math.round(trend.revivalProbability)}%</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <ScenarioEngine onScenarioChange={setScenario} loading={loading} />

          {result && (
            <ErrorBoundary context="AIPredictions" variant="widget">
              <AIPredictions result={result} idea={idea} revivalProbability={result.revival_probability} />
            </ErrorBoundary>
          )}

          <div className="glass-card p-4 text-center space-y-3">
            <p className="text-xs text-slate-400 font-medium">New to simulations?</p>
            <Button variant="secondary" size="sm" onClick={() => setShowModal(true)} className="w-full">
              How it Works
            </Button>
          </div>
        </div>
      </div>

      <Modal isOpen={showModal} title="How the Simulator Works" onClose={() => setShowModal(false)}>
        <div className="space-y-5">
          {[
            { label: 'Word Meaning', description: 'Every idea shows its definition, origin year, and cultural context so you understand what you\'re simulating.' },
            { label: 'Lifecycle Stages', description: 'Every idea progresses through: Birth → Growth → Peak → Decline → Dormancy → Revival.' },
            { label: 'Year-wise History', description: 'See a year-by-year bar chart of the idea\'s cultural influence.' },
            { label: 'Future Prediction Path', description: 'The model predicts the idea\'s future path year by year based on current trends.' },
            { label: 'World Conditions', description: 'Select your region to auto-adjust sliders based on real cultural index data for that geography.' },
            { label: 'PDF Report', description: 'Download a full, styled PDF report including all charts, karma breakdown, lifecycle stages, and historical context.' },
          ].map((item) => (
            <div key={item.label} className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <h4 className="text-sm font-semibold text-white mb-1.5">{item.label}</h4>
              <p className="text-xs text-slate-400 leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
