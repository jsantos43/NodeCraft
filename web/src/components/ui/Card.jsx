import React from 'react';
import './Card.css';

export default function Card({ children, className = '', padding = true, ...props }) {
  return (
    <div className={`card ${padding ? '' : 'card-no-pad'} ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, className = '' }) {
  return (
    <div className={`card-header ${className}`}>
      <div className="card-header-text">
        {title && <h3 className="card-title">{title}</h3>}
        {subtitle && <p className="card-subtitle">{subtitle}</p>}
      </div>
      {action && <div className="card-header-action">{action}</div>}
    </div>
  );
}
