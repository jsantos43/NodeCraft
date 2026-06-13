import React from 'react';
import { BarChart2, Cpu, HardDrive, Activity } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import Layout from '../../components/Layout/Layout.jsx';
import Card, { CardHeader } from '../../components/ui/Card.jsx';
import ResourceBar from '../../components/ui/ResourceBar.jsx';
import { StatusBadge } from '../../components/ui/Badge.jsx';
import { useApi } from '../../hooks/useApi.js';
import { workersApi } from '../../api/workers.js';
import Spinner from '../../components/ui/Spinner.jsx';
import './Monitoring.css';

const mockHistory = Array.from({ length: 20 }, (_, i) => ({
  t: `${i}m`,
  cpu: Math.round(15 + Math.sin(i / 3) * 20 + Math.random() * 10),
  mem: Math.round(50 + Math.cos(i / 4) * 15 + Math.random() * 8),
}));

export default function Monitoring() {
  const { data, loading } = useApi(() => workersApi.list());
  const workers = data?.workers || [];

  return (
    <Layout title="Monitoring">
      <div className="monitoring-grid">
        <Card className="monitoring-chart-card">
          <CardHeader title="Cluster CPU Usage" subtitle="Real-time aggregated view" />
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={mockHistory} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="gradCpu" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="var(--accent)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="t" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} unit="%" domain={[0, 100]} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: 'var(--text-secondary)' }}
                itemStyle={{ color: 'var(--text-primary)' }}
              />
              <Area type="monotone" dataKey="cpu" stroke="var(--accent)" strokeWidth={2} fill="url(#gradCpu)" name="CPU" unit="%" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="monitoring-chart-card">
          <CardHeader title="Cluster Memory Usage" subtitle="Real-time aggregated view" />
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={mockHistory} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="gradMem" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="var(--blue)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--blue)" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="t" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} unit="%" domain={[0, 100]} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: 'var(--text-secondary)' }}
                itemStyle={{ color: 'var(--text-primary)' }}
              />
              <Area type="monotone" dataKey="mem" stroke="var(--blue)" strokeWidth={2} fill="url(#gradMem)" name="Memory" unit="%" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card>
        <CardHeader title="Worker Health" subtitle="Live status across all nodes" />
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner /></div>
        ) : workers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: 13 }}>
            No workers available
          </div>
        ) : (
          <div className="monitoring-workers">
            {workers.map(w => (
              <div key={w.id} className="monitoring-worker">
                <div className="monitoring-worker-header">
                  <span className="monitoring-worker-name">{w.name}</span>
                  <StatusBadge status={w.healthy ? 'online' : 'offline'} />
                </div>
                <div className="monitoring-worker-bars">
                  {w.cpuUsage != null && (
                    <ResourceBar label="CPU" value={w.cpuUsage} max={100} unit="%" showPercent={false} />
                  )}
                  {w.memorieTotal != null && (
                    <ResourceBar label="RAM" value={w.memorieUsed || 0} max={w.memorieTotal} unit="MB" />
                  )}
                </div>
                <div className="monitoring-worker-footer">
                  <span className="monitoring-footer-item">
                    <Cpu size={11} /> {w.cpuUsage != null ? `${w.cpuUsage.toFixed(1)}%` : '—'}
                  </span>
                  <span className="monitoring-footer-item">
                    <HardDrive size={11} /> {w.diskAvailable != null ? `${(w.diskAvailable/1024).toFixed(0)} GB free` : '—'}
                  </span>
                  <span className="monitoring-footer-item">
                    <Activity size={11} /> {w.lastSeenAt ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </Layout>
  );
}
