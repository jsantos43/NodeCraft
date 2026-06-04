import React from 'react';
import './UIInput.css';

export default function Input({
  label,
  error,
  hint,
  icon: Icon,
  className = '',
  ...props
}) {
  return (
    <div className={`ui-input-wrap ${className}`}>
      {label && <label className="ui-input-label">{label}</label>}
      <div className={`ui-input-field ${Icon ? 'has-icon' : ''} ${error ? 'has-error' : ''}`}>
        {Icon && <Icon size={14} className="ui-input-icon" />}
        <input className="ui-input" {...props} />
      </div>
      {error && <span className="ui-input-error">{error}</span>}
      {hint && !error && <span className="ui-input-hint">{hint}</span>}
    </div>
  );
}

export function Select({ label, error, children, className = '', ...props }) {
  return (
    <div className={`ui-input-wrap ${className}`}>
      {label && <label className="ui-input-label">{label}</label>}
      <div className={`ui-input-field ${error ? 'has-error' : ''}`}>
        <select className="ui-input ui-select" {...props}>
          {children}
        </select>
      </div>
      {error && <span className="ui-input-error">{error}</span>}
    </div>
  );
}

export function Textarea({ label, error, className = '', ...props }) {
  return (
    <div className={`ui-input-wrap ${className}`}>
      {label && <label className="ui-input-label">{label}</label>}
      <div className={`ui-input-field ${error ? 'has-error' : ''}`}>
        <textarea className="ui-input ui-textarea" {...props} />
      </div>
      {error && <span className="ui-input-error">{error}</span>}
    </div>
  );
}
