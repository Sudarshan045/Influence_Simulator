export default function Input({
  label,
  placeholder,
  value,
  onChange,
  onKeyPress,
  disabled,
  error,
  type = 'text',
  icon: Icon,
  className = '',
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && <label className="form-label">{label}</label>}
      <div className="relative">
        {Icon && (
          <Icon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={onKeyPress}
          placeholder={placeholder}
          disabled={disabled}
          className={`form-input ${Icon ? 'pl-10' : ''} ${error ? 'error' : ''}`}
        />
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
