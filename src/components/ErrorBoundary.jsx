/**
 * ErrorBoundary.jsx
 * =================
 * Production-grade React Error Boundary.
 *
 * Features:
 *  - Catches render-phase JS errors anywhere in the subtree
 *  - Beautiful glassmorphism fallback UI matching app design
 *  - "Try Again" resets the boundary state
 *  - "Go Home" navigates to dashboard
 *  - Dev-only error detail collapse panel
 *  - Logs every error via errorLogger.captureError()
 *  - Configurable: variant="page" | "widget" | "inline"
 *    • page   → full-page fallback (for route wrapping)
 *    • widget → card-sized fallback (for section wrapping)
 *    • inline → small inline message (for minor components)
 *
 * Usage:
 *   <ErrorBoundary context="Simulator" variant="page">
 *     <Simulator />
 *   </ErrorBoundary>
 */

import { Component } from 'react';
import { captureError } from '../utils/errorLogger';

const IS_DEV = import.meta.env.DEV;

// ─────────────────────────────────────────────────────────────────────────────
// FALLBACK UI PIECES (pure functions, no hooks)
// ─────────────────────────────────────────────────────────────────────────────

function ErrorIcon({ size = 48 }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 48 48" fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="24" cy="24" r="22" stroke="rgba(239,68,68,0.3)" strokeWidth="2" />
      <circle cx="24" cy="24" r="18" fill="rgba(239,68,68,0.08)" />
      <path d="M24 14v13" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="24" cy="33" r="1.5" fill="#f87171" />
    </svg>
  );
}

function WidgetErrorIcon({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <circle cx="14" cy="14" r="13" stroke="rgba(245,158,11,0.4)" strokeWidth="1.5" />
      <path d="M14 8v8" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
      <circle cx="14" cy="20" r="1" fill="#fbbf24" />
    </svg>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// PAGE-LEVEL FALLBACK
// ─────────────────────────────────────────────────────────────────────────────

function PageFallback({ error, componentStack, context, onRetry, showDetail, onToggleDetail }) {
  return (
    <div
      style={{
        minHeight:      '60vh',
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        padding:        '2rem',
        gap:            '0',
      }}
    >
      {/* Card */}
      <div
        style={{
          maxWidth:     '520px',
          width:        '100%',
          borderRadius: '20px',
          padding:      '2.5rem',
          background:   'rgba(15,23,42,0.8)',
          border:       '1px solid rgba(239,68,68,0.2)',
          backdropFilter: 'blur(20px)',
          boxShadow:    '0 25px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(239,68,68,0.1)',
        }}
      >
        {/* Icon */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <ErrorIcon size={56} />
        </div>

        {/* Text */}
        <h2 style={{ color: 'white', fontSize: '1.25rem', fontWeight: 700, textAlign: 'center', marginBottom: '0.5rem' }}>
          Something went wrong
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '0.875rem', textAlign: 'center', lineHeight: 1.6, marginBottom: '0.25rem' }}>
          {context
            ? `The ${context} page encountered an unexpected error.`
            : 'An unexpected error occurred in this part of the application.'}
        </p>
        <p style={{ color: '#64748b', fontSize: '0.75rem', textAlign: 'center', marginBottom: '1.75rem' }}>
          Your saved data is safe. Try refreshing or returning home.
        </p>

        {/* Error message pill */}
        {error?.message && (
          <div
            style={{
              background:   'rgba(239,68,68,0.08)',
              border:       '1px solid rgba(239,68,68,0.2)',
              borderRadius: '10px',
              padding:      '0.625rem 1rem',
              marginBottom: '1.5rem',
              fontFamily:   'ui-monospace, monospace',
              fontSize:     '0.75rem',
              color:        '#fca5a5',
              wordBreak:    'break-all',
            }}
          >
            {error.message}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={onRetry}
            style={{
              flex:         1,
              padding:      '0.625rem 1rem',
              borderRadius: '10px',
              border:       '1px solid rgba(124,58,237,0.4)',
              background:   'rgba(124,58,237,0.15)',
              color:        'white',
              fontSize:     '0.875rem',
              fontWeight:   600,
              cursor:       'pointer',
              transition:   'all 0.2s',
            }}
            onMouseEnter={(e) => { e.target.style.background = 'rgba(124,58,237,0.25)'; }}
            onMouseLeave={(e) => { e.target.style.background = 'rgba(124,58,237,0.15)'; }}
          >
            Try Again
          </button>
          <button
            onClick={() => { window.location.href = '/'; }}
            style={{
              flex:         1,
              padding:      '0.625rem 1rem',
              borderRadius: '10px',
              border:       '1px solid rgba(255,255,255,0.1)',
              background:   'rgba(255,255,255,0.05)',
              color:        '#94a3b8',
              fontSize:     '0.875rem',
              fontWeight:   600,
              cursor:       'pointer',
              transition:   'all 0.2s',
            }}
            onMouseEnter={(e) => { e.target.style.color = 'white'; e.target.style.background = 'rgba(255,255,255,0.1)'; }}
            onMouseLeave={(e) => { e.target.style.color = '#94a3b8'; e.target.style.background = 'rgba(255,255,255,0.05)'; }}
          >
            Go Home
          </button>
        </div>

        {/* Dev-only error detail */}
        {IS_DEV && (error?.stack || componentStack) && (
          <div style={{ marginTop: '1.25rem' }}>
            <button
              onClick={onToggleDetail}
              style={{
                width:      '100%',
                background: 'none',
                border:     '1px solid rgba(255,255,255,0.07)',
                borderRadius: '8px',
                padding:    '0.4rem 0.75rem',
                color:      '#475569',
                fontSize:   '0.7rem',
                cursor:     'pointer',
                fontFamily: 'ui-monospace, monospace',
              }}
            >
              {showDetail ? '▾ Hide' : '▸ Show'} stack trace (dev only)
            </button>
            {showDetail && (
              <pre
                style={{
                  marginTop:    '0.5rem',
                  padding:      '0.75rem',
                  borderRadius: '8px',
                  background:   'rgba(0,0,0,0.4)',
                  border:       '1px solid rgba(255,255,255,0.06)',
                  color:        '#64748b',
                  fontSize:     '0.65rem',
                  overflowX:    'auto',
                  maxHeight:    '180px',
                  lineHeight:   1.6,
                  whiteSpace:   'pre-wrap',
                  wordBreak:    'break-all',
                }}
              >
                {error?.stack ?? ''}{componentStack ? `\n\nComponent Stack:\n${componentStack}` : ''}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// WIDGET-LEVEL FALLBACK (card-sized)
// ─────────────────────────────────────────────────────────────────────────────

function WidgetFallback({ error, onRetry }) {
  return (
    <div
      style={{
        borderRadius: '16px',
        padding:      '1.5rem',
        background:   'rgba(15,23,42,0.8)',
        border:       '1px solid rgba(245,158,11,0.2)',
        display:      'flex',
        flexDirection:'column',
        alignItems:   'center',
        gap:          '0.75rem',
        textAlign:    'center',
      }}
    >
      <WidgetErrorIcon />
      <div>
        <p style={{ color: 'white', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.25rem' }}>
          Widget Error
        </p>
        {error?.message && (
          <p style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
            {error.message}
          </p>
        )}
      </div>
      <button
        onClick={onRetry}
        style={{
          padding:      '0.375rem 1rem',
          borderRadius: '8px',
          border:       '1px solid rgba(245,158,11,0.3)',
          background:   'rgba(245,158,11,0.1)',
          color:        '#fbbf24',
          fontSize:     '0.75rem',
          fontWeight:   600,
          cursor:       'pointer',
        }}
      >
        Retry
      </button>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// INLINE FALLBACK (for minor components)
// ─────────────────────────────────────────────────────────────────────────────

function InlineFallback({ error, onRetry }) {
  return (
    <div
      style={{
        display:      'flex',
        alignItems:   'center',
        gap:          '0.5rem',
        padding:      '0.5rem 0.75rem',
        borderRadius: '8px',
        background:   'rgba(239,68,68,0.08)',
        border:       '1px solid rgba(239,68,68,0.2)',
      }}
    >
      <span style={{ color: '#f87171', fontSize: '0.75rem' }}>⚠ Component error</span>
      {error?.message && (
        <span style={{ color: '#64748b', fontSize: '0.7rem', fontFamily: 'ui-monospace, monospace' }}>
          {error.message.slice(0, 60)}{error.message.length > 60 ? '…' : ''}
        </span>
      )}
      <button
        onClick={onRetry}
        style={{
          marginLeft:   'auto',
          padding:      '0.2rem 0.5rem',
          borderRadius: '6px',
          border:       '1px solid rgba(239,68,68,0.3)',
          background:   'rgba(239,68,68,0.1)',
          color:        '#f87171',
          fontSize:     '0.7rem',
          cursor:       'pointer',
        }}
      >
        Retry
      </button>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// THE BOUNDARY (class component — only classes can use getDerivedStateFromError)
// ─────────────────────────────────────────────────────────────────────────────

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError:       false,
      error:          null,
      componentStack: null,
      showDetail:     false,
    };
    this.handleRetry       = this.handleRetry.bind(this);
    this.handleToggleDetail= this.handleToggleDetail.bind(this);
  }

  // ── Static: update state from thrown error ─────────────────────────────────
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  // ── Lifecycle: log the error + component stack ─────────────────────────────
  componentDidCatch(error, { componentStack }) {
    this.setState({ componentStack });
    captureError(error, {
      context:        this.props.context ?? 'Component',
      componentStack,
      severity:       this.props.severity ?? 'high',
    });
  }

  // ── Reset: allow child to re-render ───────────────────────────────────────
  handleRetry() {
    this.setState({
      hasError:       false,
      error:          null,
      componentStack: null,
      showDetail:     false,
    });
  }

  handleToggleDetail() {
    this.setState((s) => ({ showDetail: !s.showDetail }));
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const { error, componentStack, showDetail } = this.state;
    const { variant = 'page', context } = this.props;

    const commonProps = {
      error,
      componentStack,
      context,
      onRetry: this.handleRetry,
    };

    if (variant === 'inline') return <InlineFallback {...commonProps} />;
    if (variant === 'widget') return <WidgetFallback {...commonProps} />;

    // Default: page
    return (
      <PageFallback
        {...commonProps}
        showDetail={showDetail}
        onToggleDetail={this.handleToggleDetail}
      />
    );
  }
}
