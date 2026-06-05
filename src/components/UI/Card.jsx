export default function Card({ children, className = '', hover = false, delay = 0, onClick }) {
  return (
    <div
      className={`glass-card p-5 ${hover ? 'glass-card-hover' : ''} ${className}`}
      style={delay ? { animationDelay: `${delay * 0.1}s` } : undefined}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
