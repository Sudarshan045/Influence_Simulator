const VARIANTS = {
  primary: 'badge-primary',
  success: 'badge-success',
  warning: 'badge-warning',
  danger: 'badge-danger',
  neutral: 'badge-neutral',
  secondary: 'badge-neutral',
};

export default function Badge({ label, variant = 'primary', size = 'md' }) {
  const sizeClass = size === 'sm' ? 'text-[10px] px-2 py-0.5' : '';
  return (
    <span className={`${VARIANTS[variant] ?? 'badge-primary'} ${sizeClass}`}>
      {label}
    </span>
  );
}
