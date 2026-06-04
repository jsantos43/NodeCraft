import React from 'react';
import './Badge.css';

const colorMap = {
  green: 'badge-green',
  red: 'badge-red',
  yellow: 'badge-yellow',
  blue: 'badge-blue',
  purple: 'badge-purple',
  gray: 'badge-gray',
};

export default function Badge({ children, color = 'gray', dot = false }) {
  return (
    <span className={`badge ${colorMap[color] || 'badge-gray'}`}>
      {dot && <span className="badge-dot" />}
      {children}
    </span>
  );
}

export function StatusBadge({ status }) {
  const map = {
    running: { label: 'Running', color: 'green' },
    online:  { label: 'Online',  color: 'green' },
    stopped: { label: 'Stopped', color: 'gray'  },
    offline: { label: 'Offline', color: 'red'   },
    starting:{ label: 'Starting',color: 'yellow'},
    stopping:{ label: 'Stopping',color: 'yellow'},
    error:   { label: 'Error',   color: 'red'   },
    healthy: { label: 'Healthy', color: 'green' },
  };
  const cfg = map[status] || { label: status, color: 'gray' };
  return <Badge color={cfg.color} dot>{cfg.label}</Badge>;
}
