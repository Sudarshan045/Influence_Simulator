/**
 * useAsyncError.js
 * ================
 * React Error Boundaries only catch synchronous render errors.
 * This hook bridges async errors (fetch failures, rejected promises)
 * into the nearest boundary by throwing inside a setState() call —
 * which React treats as a synchronous render error.
 *
 * Usage:
 *   const throwToErrorBoundary = useAsyncError();
 *
 *   try {
 *     await riskyOperation();
 *   } catch (err) {
 *     throwToErrorBoundary(err);   // ← boundary catches this
 *   }
 *
 * Only use this for FATAL async errors that should crash the page
 * and show the full error boundary fallback.
 * For recoverable API errors, use the hook's own error state instead.
 */

import { useCallback, useState } from 'react';

export function useAsyncError() {
  // eslint-disable-next-line no-unused-vars
  const [_, setError] = useState(null);

  return useCallback((error) => {
    setError(() => {
      // Throwing inside setState causes React to treat this
      // as a synchronous render-phase error, which ErrorBoundary catches.
      throw error;
    });
  }, []);
}
