/**
 * errorLogger.js — Structured Error Logging
 * ==========================================
 * Centralised error capture with structured output.
 * In production, extend captureError() to send to Sentry / your backend.
 *
 * Usage:
 *   import { captureError, captureAsyncError } from '../utils/errorLogger';
 *   captureError(error, { componentStack, context: 'Simulator' });
 */

const IS_DEV = import.meta.env.DEV;

// ─────────────────────────────────────────────────────────────────────────────
// FORMAT HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function _timestamp() {
  return new Date().toISOString();
}

function _errorToObj(error) {
  if (!error) return { message: 'Unknown error', name: 'UnknownError' };
  return {
    name:    error.name    ?? 'Error',
    message: error.message ?? String(error),
    stack:   error.stack   ?? null,
    type:    error.type    ?? null,
    code:    error.code    ?? null,
    status:  error.status  ?? null,
  };
}


// ─────────────────────────────────────────────────────────────────────────────
// SEVERITY LEVELS
// ─────────────────────────────────────────────────────────────────────────────

export const Severity = Object.freeze({
  LOW:      'low',
  MEDIUM:   'medium',
  HIGH:     'high',
  CRITICAL: 'critical',
});


// ─────────────────────────────────────────────────────────────────────────────
// CORE CAPTURE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * captureError — log a structured error record.
 *
 * @param {Error|unknown}  error
 * @param {object}         meta  — optional { context, componentStack, severity, userId }
 */
export function captureError(error, meta = {}) {
  const record = {
    timestamp:      _timestamp(),
    severity:       meta.severity ?? Severity.HIGH,
    context:        meta.context  ?? 'Unknown',
    error:          _errorToObj(error),
    componentStack: meta.componentStack ?? null,
    userId:         meta.userId ?? null,
    url:            window.location.href,
    userAgent:      navigator.userAgent,
  };

  if (IS_DEV) {
    // Rich dev output with grouping
    console.group(
      `%c[ErrorLogger] ${record.severity.toUpperCase()} — ${record.context}`,
      'color: #f87171; font-weight: bold;'
    );
    console.error('Error:',    error);
    console.info ('Record:',   record);
    if (meta.componentStack) {
      console.info('Component Stack:', meta.componentStack);
    }
    console.groupEnd();
  } else {
    // Production: minimal console + extend here for Sentry / backend
    console.error('[InfluenceSim]', record.error.name, record.error.message);

    // ── EXTEND FOR PRODUCTION ────────────────────────────────────────────────
    // Example Sentry integration:
    // if (window.Sentry) {
    //   window.Sentry.withScope((scope) => {
    //     scope.setTag('context', record.context);
    //     scope.setLevel(record.severity);
    //     window.Sentry.captureException(error);
    //   });
    // }

    // Example backend logging:
    // fetch('/api/logs/error', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(record),
    //   keepalive: true,   // survives page unload
    // }).catch(() => {});  // never throw from an error logger
  }

  return record;
}


/**
 * captureAsyncError — for async failures outside render (fetch, hooks, etc.)
 */
export function captureAsyncError(error, context = 'Async') {
  return captureError(error, { context, severity: Severity.MEDIUM });
}


// ─────────────────────────────────────────────────────────────────────────────
// GLOBAL UNHANDLED REJECTION HANDLER
// Boot this once in main.jsx / index.jsx
// ─────────────────────────────────────────────────────────────────────────────

let _globalHandlerRegistered = false;

export function registerGlobalHandlers() {
  if (_globalHandlerRegistered) return;
  _globalHandlerRegistered = true;

  // Unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    captureError(event.reason ?? new Error('Unhandled promise rejection'), {
      context:  'UnhandledRejection',
      severity: Severity.HIGH,
    });
    // Don't prevent default — let the browser log it too in dev
  });

  // Synchronous JS errors not caught by React
  window.addEventListener('error', (event) => {
    captureError(event.error ?? new Error(event.message), {
      context:  'WindowError',
      severity: Severity.CRITICAL,
    });
  });
}
