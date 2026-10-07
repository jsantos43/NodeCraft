/* eslint-disable */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '../context/ToastContext.jsx';

// Data-fetching hook. `error` holds the full thrown error (an ApiError carrying
// `code`/`details`), so callers can render it with <Alert error={error} />.
export function useApi(fn, deps = []) {
  const key = JSON.stringify(deps);
  const currentKey = useRef(key);
  const requestId = useRef(0);
  const [state, setState] = useState({ key, data: null, loading: true, error: null });

  const execute = useCallback(async () => {
    const id = ++requestId.current;
    setState((previous) => ({
      key,
      data: previous.key === key ? previous.data : null,
      loading: true,
      error: null,
    }));
    try {
      const result = await fn();
      if (currentKey.current === key && requestId.current === id) {
        setState({ key, data: result, loading: false, error: null });
      }
      return result;
    } catch (err) {
      if (currentKey.current === key && requestId.current === id) {
        setState((previous) => ({
          key,
          data: previous.key === key ? previous.data : null,
          loading: false,
          error: err,
        }));
      }
      return null;
    }
  }, deps);

  useEffect(() => {
    currentKey.current = key;
    execute();
    return () => { requestId.current += 1; };
  }, [execute]);

  const visible = state.key === key ? state : { data: null, loading: true, error: null };
  return { data: visible.data, loading: visible.loading, error: visible.error, refetch: execute };
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
