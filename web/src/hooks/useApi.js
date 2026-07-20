/* eslint-disable */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '../context/ToastContext.jsx';

// Data-fetching hook. `error` holds the full thrown error (an ApiError carrying
// `code`/`details`), so callers can render it with <Alert error={error} />.
export function useApi(fn, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fn();
      setData(result);
      return result;
    } catch (err) {
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => {
    execute();
  }, [execute]);

  return { data, loading, error, refetch: execute };
}

/**
 * Mutation hook. `error` holds the full thrown error and is re-thrown so callers
 * can still await/catch. Options wire it into the notification system:
 *   errorToast:   true | { title }        — toast the caught error
 *   successToast: "Title" | { title, description } — toast on success
 */
export function useAction(fn, options = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const optRef = useRef(options);
  optRef.current = options;
  const toast = useToast();

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fnRef.current(...args);
      const s = optRef.current.successToast;
      if (s) {
        if (typeof s === 'string') toast.success(s);
        else toast.success(s.title, s.description);
      }
      return result;
    } catch (err) {
      setError(err);
      const e = optRef.current.errorToast;
      if (e) toast.error(err, e === true ? undefined : e);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return { execute, loading, error };
}
