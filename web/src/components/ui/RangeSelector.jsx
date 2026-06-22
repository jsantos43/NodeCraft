import React from 'react';
import { RANGES } from '../../utils/metrics.js';
import './RangeSelector.css';

export default function RangeSelector({ value, onChange, ranges = RANGES }) {
  return (
    <div className="range-selector" role="tablist">
      {ranges.map((r) => (
        <button
          key={r.key}
          role="tab"
          aria-selected={value === r.key}
          className={`range-selector-btn ${value === r.key ? 'active' : ''}`}
          onClick={() => onChange(r.key)}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}
