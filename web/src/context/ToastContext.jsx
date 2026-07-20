import React, {
  createContext, useContext, useState, useCallback, useRef,
} from 'react';
import { createPortal } from 'react-dom';
import { resolveError } from '../utils/errors.js';
import AlertIcon from '../components/ui/AlertIcon.jsx';
import '../components/ui/Toast.css';

const ToastContext = createContext(null);

let seq = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const push = useCallback((toast) => {
    const id = ++seq;
    const duration = toast.duration ?? (toast.tone === 'danger' ? 8000 : 6000);
    setToasts((list) => {
      // Collapse exact duplicates fired in quick succession (e.g. a burst of 403s).
      const dupe = list.find(
        (t) => t.title === toast.title && t.description === toast.description,
      );
      if (dupe) return list;
      return [...list, { ...toast, id, duration }];
    });
    if (duration > 0) {
      timers.current.set(id, setTimeout(() => dismiss(id), duration));
    }
    return id;
  }, [dismiss]);

  // Push a fully-resolved error from any thrown value.
  const error = useCallback(
    (err, override) => push({ ...resolveError(err, override) }),
    [push],
  );

  const success = useCallback(
    (title, description) => push({ tone: 'success', icon: 'check', title, description }),
    [push],
  );

  const value = { toast: push, error, success, dismiss };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div className="toast-stack" role="region" aria-label="Notifications" aria-live="polite">
          {toasts.map((t) => (
            <ToastCard key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}

function ToastCard({ toast, onDismiss }) {
  return (
    <div className={`toast toast-${toast.tone}`} role="alert">
      <span className="toast-icon"><AlertIcon name={toast.icon} /></span>
      <div className="toast-body">
        <p className="toast-title">{toast.title}</p>
        {toast.description && <p className="toast-desc">{toast.description}</p>}
      </div>
      <button className="toast-close" onClick={onDismiss} aria-label="Dismiss">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
          <path d="m3.5 3.5 7 7M10.5 3.5l-7 7" />
        </svg>
      </button>
      {toast.duration > 0 && (
        <span
          className="toast-progress"
          style={{ animationDuration: `${toast.duration}ms` }}
        />
      )}
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
