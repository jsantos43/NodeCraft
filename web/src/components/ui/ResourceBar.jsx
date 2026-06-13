import React from 'react';
import './ResourceBar.css';

function getBarColor(pct) {
  if (pct >= 90) return 'bar-red';
  if (pct >= 70) return 'bar-yellow';
  return 'bar-green';
}

export default function ResourceBar({ label, value, max, unit = 'MB', showPercent = true }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const colorClass = getBarColor(pct);

  return (
    <div className="resource-bar">
      <div className="resource-bar-header">
        <span className="resource-bar-label">{label}</span>
        <span className="resource-bar-value">
          {unit === '%' ? `${value.toFixed(1)}%` : `${(value / 1024).toFixed(1)} / ${(max / 1024).toFixed(1)} GB`}
          {showPercent && unit !== '%' && <span className="resource-bar-pct"> · {pct.toFixed(0)}%</span>}
        </span>
      </div>
      <div className="resource-bar-track">
        <div className={`resource-bar-fill ${colorClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
