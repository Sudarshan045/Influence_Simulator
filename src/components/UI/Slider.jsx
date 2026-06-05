export default function Slider({ label, value, onChange, min = 0, max = 100, step = 1 }) {
  const percent = ((value - min) / (max - min)) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-300">{label}</label>
        <div className="flex items-center gap-1">
          <span
            className="text-sm font-bold tabular-nums"
            style={{ color: `hsl(${260 - percent * 1.2}, 70%, 70%)` }}
          >
            {value}
          </span>
          <span className="text-slate-600 text-xs">/ {max}</span>
        </div>
      </div>
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{
            background: `linear-gradient(to right, #7c3aed ${percent}%, rgba(255,255,255,0.1) ${percent}%)`,
          }}
        />
      </div>
    </div>
  );
}
