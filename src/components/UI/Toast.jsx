import { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const TYPES = {
  success: { icon: CheckCircle, color: 'text-emerald-400', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)' },
  error: { icon: AlertCircle, color: 'text-red-400', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.25)' },
  info: { icon: Info, color: 'text-blue-400', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.25)' },
};

export default function Toast({ message, type = 'info', onClose, autoClose = true }) {
  const [visible, setVisible] = useState(true);
  const { icon: Icon, color, bg, border } = TYPES[type] ?? TYPES.info;

  useEffect(() => {
    if (!autoClose) return;
    const t = setTimeout(() => { setVisible(false); setTimeout(onClose, 300); }, 4000);
    return () => clearTimeout(t);
  }, [autoClose, onClose]);

  if (!visible) return null;

  return (
    <div
      className="flex items-start gap-3 rounded-xl px-4 py-3 text-sm animate-fade-in"
      style={{ background: bg, border: `1px solid ${border}` }}
    >
      <Icon size={16} className={`${color} mt-0.5 flex-shrink-0`} />
      <p className="text-slate-300 flex-1">{message}</p>
      <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
        <X size={14} />
      </button>
    </div>
  );
}
