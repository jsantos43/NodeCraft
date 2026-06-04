import React from 'react';
import './StatCard.css';

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'green', trend }) {
  return (
    <div className={`stat-card stat-card-${color}`}>
      <div className="stat-card-top">
        <span className="stat-card-title">{title}</span>
        {Icon && (
          <div className={`stat-card-icon stat-icon-${color}`}>
            <Icon size={16} />
          </div>
        )}
      </div>
      <div className="stat-card-value">{value ?? '—'}</div>
      {subtitle && <div className="stat-card-sub">{subtitle}</div>}
      {trend !== undefined && (
        <div className={`stat-card-trend ${trend >= 0 ? 'trend-up' : 'trend-down'}`}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </div>
      )}
    </div>
  );
}
