import { useEffect, useState } from 'react';
import { Terminal, Cpu, Globe, Activity, CheckCircle2 } from 'lucide-react';

const BOOT_SEQUENCE = [
  { text: 'ESTABLISHING SECURE CONNECTION...', icon: Globe, delay: 500 },
  { text: 'LINKING TO GLOBAL DATA STREAMS [WIKIPEDIA, RSS]...', icon: Activity, delay: 1200 },
  { text: 'CALIBRATING KARMA ENGINE NEURAL NET...', icon: Cpu, delay: 2000 },
  { text: 'SYNCHRONIZING MARKOV MATRICES...', icon: Terminal, delay: 2800 },
  { text: 'SYSTEM ONLINE.', icon: CheckCircle2, delay: 3500 },
];

export default function Splash({ onComplete }) {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timers = BOOT_SEQUENCE.map((item, i) =>
      setTimeout(() => setStep(i), item.delay)
    );

    const done = setTimeout(() => {
      setVisible(false);
      setTimeout(onComplete, 500);
    }, BOOT_SEQUENCE[BOOT_SEQUENCE.length - 1].delay + 1000);

    return () => { timers.forEach(clearTimeout); clearTimeout(done); };
  }, [onComplete]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black font-mono select-none">
      {/* Sci-Fi Glow Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-20"
             style={{ background: 'radial-gradient(circle, #06b6d4 0%, transparent 60%)', animation: 'pulse 3s infinite' }} />
        <div className="absolute inset-0 opacity-10"
             style={{
               backgroundImage: 'linear-gradient(rgba(6, 182, 212, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.2) 1px, transparent 1px)',
               backgroundSize: '40px 40px',
             }} />
      </div>

      <div className="relative z-10 w-full max-w-2xl px-8">
        <div className="mb-8 flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-cyan-950 border border-cyan-500/50 flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.5)]">
            <Cpu size={32} className="text-cyan-400" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
              INFLUENCE OS
            </h1>
            <p className="text-cyan-500/70 text-sm tracking-widest mt-1">v2.4.0 // INITIALIZATION SEQUENCE</p>
          </div>
        </div>

        <div className="space-y-4">
          {BOOT_SEQUENCE.map((item, index) => {
            if (index > step) return null;
            const Icon = item.icon;
            const isLast = index === step;
            return (
              <div key={index} className="flex items-center gap-4 animate-fade-in-up">
                <Icon size={18} className={isLast && index !== BOOT_SEQUENCE.length -1 ? "text-cyan-400 animate-pulse" : "text-cyan-600"} />
                <span className={isLast && index !== BOOT_SEQUENCE.length -1 ? "text-cyan-300 font-bold tracking-widest text-sm" : "text-cyan-700 tracking-widest text-sm"}>
                  {item.text}
                </span>
                {isLast && index !== BOOT_SEQUENCE.length - 1 && (
                  <div className="w-2 h-4 bg-cyan-400 animate-ping ml-2" />
                )}
              </div>
            );
          })}
        </div>
        
        {/* Progress Bar Bottom */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-64">
           <div className="h-1 bg-cyan-950 rounded-full overflow-hidden">
             <div className="h-full bg-cyan-400 shadow-[0_0_10px_#22d3ee] transition-all duration-300"
                  style={{ width: `${((step + 1) / BOOT_SEQUENCE.length) * 100}%` }} />
           </div>
        </div>
      </div>
    </div>
  );
}
