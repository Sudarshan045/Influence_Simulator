import { useState, useEffect } from 'react';
import { HelpCircle, X, ArrowRight, Check } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

const TOUR_STEPS = [
  {
    title: 'Welcome to Influence OS',
    content: 'This platform predicts the rise and fall of cultural trends using AI. Let us show you around!',
    path: '/',
  },
  {
    title: 'Dashboard',
    content: 'Get a bird\'s-eye view of all active ideas, their current Markov states, and system health.',
    path: '/',
  },
  {
    title: 'The Simulator',
    content: 'This is the core engine. Enter any idea (e.g. "Virtual Reality"), adjust the Karma sliders, and hit Simulate to see its future trajectory.',
    path: '/simulator',
  },
  {
    title: 'VS Mode',
    content: 'Compare two different ideas head-to-head to see which one will survive the cultural test of time.',
    path: '/comparison',
  },
  {
    title: 'Trends & Rankings',
    content: 'Explore global and regional trends, and the top 50 ranked ideas in the database.',
    path: '/rankings',
  }
];

export default function TourGuide() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasSeenTour, setHasSeenTour] = useState(localStorage.getItem('influence_tour_seen') === 'true');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Auto open on first visit
    if (!hasSeenTour) {
      const timer = setTimeout(() => setIsOpen(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [hasSeenTour]);

  // Sync route with tour step if it changes
  useEffect(() => {
    if (isOpen && TOUR_STEPS[currentStep].path !== location.pathname) {
      navigate(TOUR_STEPS[currentStep].path);
    }
  }, [currentStep, isOpen, navigate, location.pathname]);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(s => s + 1);
    } else {
      closeTour();
    }
  };

  const closeTour = () => {
    setIsOpen(false);
    setHasSeenTour(true);
    localStorage.setItem('influence_tour_seen', 'true');
  };

  const openTour = () => {
    setCurrentStep(0);
    setIsOpen(true);
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={openTour}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white shadow-[0_0_20px_rgba(79,70,229,0.5)] flex items-center justify-center transition-all hover:scale-110 group border-2 border-white/20"
          title="How to use this site"
        >
          <HelpCircle size={28} className="group-hover:rotate-12 transition-transform" />
        </button>
      )}

      {/* Tour Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md p-8 rounded-3xl border border-indigo-500/30 bg-slate-900/90 shadow-2xl shadow-indigo-500/20 overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-cyan-500/20 blur-[50px] pointer-events-none" />

            {/* Close Button */}
            <button onClick={closeTour} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors z-10">
              <X size={20} />
            </button>

            {/* Content */}
            <div className="text-center mb-8 relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 flex items-center justify-center mx-auto mb-5 border border-indigo-500/30 shadow-[0_0_15px_rgba(79,70,229,0.4)]">
                <HelpCircle size={32} className="text-cyan-400" />
              </div>
              <h2 className="text-2xl font-black text-white mb-3 tracking-wide">{TOUR_STEPS[currentStep].title}</h2>
              <p className="text-slate-300 leading-relaxed font-medium">
                {TOUR_STEPS[currentStep].content}
              </p>
            </div>

            {/* Progress Dots */}
            <div className="flex justify-center gap-2 mb-8 relative z-10">
              {TOUR_STEPS.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    idx === currentStep ? 'w-8 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]' : 'w-2 bg-slate-700'
                  }`}
                />
              ))}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between relative z-10">
              <button
                onClick={closeTour}
                className="text-sm text-slate-400 hover:text-white font-medium px-4 py-2"
              >
                Skip Tour
              </button>
              
              <button
                onClick={handleNext}
                className="btn-primary py-2.5 px-6 rounded-xl flex items-center gap-2"
              >
                {currentStep === TOUR_STEPS.length - 1 ? (
                  <>Get Started <Check size={16} /></>
                ) : (
                  <>Next <ArrowRight size={16} /></>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
