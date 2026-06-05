export default function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  loading = false,
  disabled = false,
  className = '',
  type = 'button',
}) {
  const variantClass = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    danger: 'btn-danger',
  }[variant] ?? 'btn-primary';

  const sizeClass = {
    sm: 'text-xs px-3 py-2',
    md: '',
    lg: 'text-base px-6 py-3',
  }[size] ?? '';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${variantClass} ${sizeClass} ${className}`}
      style={{ opacity: disabled || loading ? 0.6 : 1 }}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
      ) : Icon ? (
        <Icon size={16} />
      ) : null}
      {children}
    </button>
  );
}
