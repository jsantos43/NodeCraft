import React from 'react';
import AlertIcon from './AlertIcon.jsx';
import { resolveError } from '../../utils/errors.js';
import './Alert.css';

/**
 * Inline alert — for errors that belong inside the screen (form validation,
 * a failed section). Pass a thrown `error` to resolve it through the shared
 * catalog, or set tone/title/description explicitly.
 *
 *   <Alert error={action.error} override={{ description: "Couldn't save changes" }} />
 *   <Alert tone="notice" title="No servers yet" description="Create one to get started." />
 */
export default function Alert({
  error, override, tone, icon, title, description, fields, onClose, compact = false,
}) {
  let d = { tone, icon, title, description, fields: fields || [] };
  if (error) d = resolveError(error, override);

  if (!d.title && !d.description) return null;

  return (
    <div className={`alert alert-${d.tone || 'danger'}${compact ? ' alert-compact' : ''}`} role="alert">
      <span className="alert-icon"><AlertIcon name={d.icon || 'server'} size={compact ? 16 : 18} /></span>
      <div className="alert-body">
        {d.title && <p className="alert-title">{d.title}</p>}
        {/* With several field errors, list them instead of the crammed one-liner. */}
        {d.fields && d.fields.length > 1 ? (
          <ul className="alert-fields">
            {d.fields.map((f, i) => <li key={i}>{f}</li>)}
          </ul>
        ) : (
          d.description && <p className="alert-desc">{d.description}</p>
        )}
      </div>
      {onClose && (
        <button className="alert-close" onClick={onClose} aria-label="Dismiss">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <path d="m3.5 3.5 7 7M10.5 3.5l-7 7" />
          </svg>
        </button>
      )}
    </div>
  );
}
