import React from 'react';
import { Server, Cpu, Activity, HardDrive, Users, Zap } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import Layout from '../../components/Layout/Layout.jsx';
import StatCard from '../../components/ui/StatCard.jsx';
import Card, { CardHeader } from '../../components/ui/Card.jsx';
import ResourceBar from '../../components/ui/ResourceBar.jsx';
import { StatusBadge } from '../../components/ui/Badge.jsx';
import { useApi } from '../../hooks/useApi.js';
import { instancesApi } from '../../api/instances.js';
import { workersApi } from '../../api/workers.js';
import Spinner from '../../components/ui/Spinner.jsx';
import './Dashboard.css';

const mockHistory = Array.from({ length: 20 }, (_, i) => ({
  t: `${i}m`,
  cpu: Math.round(15 + Math.sin(i / 3) * 20 + Math.random() * 10),
  mem: Math.round(50 + Math.cos(i / 4) * 15 + Math.random() * 8),
}));

const GAME_LABELS = {
  minecraft: 'Minecraft',
  counterstrike: 'Counter-Strike',
  terraria: 'Terraria',
  kerbal: 'Kerbal Space',
  hytale: 'Hytale',
};

export default function Dashboard() {
  const { data: instancesData, loading: loadingI } = useApi(() => instancesApi.list());
  const { data: workersData,  loading: loadingW } = useApi(() => workersApi.list());

  const instances = instancesData?.instances || [];
  const workers   = workersData?.workers   || [];

  const onlineServers = instances.filter(i => i.status === 'running').length;
  const onlineWorkers = workers.filter(w => w.healthy).length;

  const totalCpu      = workers.length > 0
    ? workers.reduce((s, w) => s + (w.cpuUsage || 0), 0) / workers.length
    : 0;
  const totalMemUsed  = workers.reduce((s, w) => s + (w.memorieUsed  || 0), 0);
  const totalMemTotal = workers.reduce((s, w) => s + (w.memorieTotal || 0), 0);
  const memPct = totalMemTotal > 0 ? Math.round((totalMemUsed / totalMemTotal) * 100) : 0;

  return (
    <Layout title="Dashboard">

      {/* ── Stat cards ── */}
      <div className="dash-grid">
        <StatCard title="Total Servers"  value={instances.length}  icon={Server}   color="blue"   />
        <StatCard title="Online Servers" value={onlineServers}
          subtitle={`${instances.length - onlineServers} offline`} icon={Zap}     color="green"  />
        <StatCard title="Total Workers"  value={workers.length}    icon={Cpu}      color="purple" />
        <StatCard title="Online Workers" value={onlineWorkers}
          subtitle={`${workers.length - onlineWorkers} offline`}
          icon={Activity}
          color={onlineWorkers === workers.length ? 'green' : 'yellow'} />
        <StatCard title="Avg CPU"   value={`${totalCpu.toFixed(1)}%`}  icon={Cpu}      color="yellow" />
        <StatCard title="Memory"    value={`${memPct}%`}
          subtitle={totalMemTotal ? `${(totalMemUsed/1024).toFixed(1)} / ${(totalMemTotal/1024).toFixed(1)} GB` : 'No data'}
          icon={HardDrive}
          color={memPct > 80 ? 'red' : 'blue'} />
        <StatCard title="Total Users" value="—" icon={Users} color="purple" />
      </div>

      {/* ── Charts ── */}
      <div className="dash-charts-row">
        <Card>
          <CardHeader title="CPU Usage" subtitle="Cluster — last 20 min" />
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={mockHistory} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="gCpu" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="var(--accent)" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="t"   tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis unit="%" domain={[0, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: 'var(--text-secondary)' }}
                itemStyle={{ color: 'var(--text-primary)' }}
              />
              <Area type="monotone" dataKey="cpu" stroke="var(--accent)" strokeWidth={2} fill="url(#gCpu)" name="CPU" unit="%" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <CardHeader title="Memory Usage" subtitle="Cluster — last 20 min" />
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={mockHistory} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="gMem" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="var(--blue)" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="var(--blue)" stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="t"   tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis unit="%" domain={[0, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: 'var(--text-secondary)' }}
                itemStyle={{ color: 'var(--text-primary)' }}
              />
              <Area type="monotone" dataKey="mem" stroke="var(--blue)" strokeWidth={2} fill="url(#gMem)" name="Memory" unit="%" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* ── Worker health ── */}
      <Card className="dash-section">
        <CardHeader title="Worker Health" subtitle="Live status across all nodes" />
        {loadingW ? (
          <div className="dash-loading"><Spinner /></div>
        ) : workers.length === 0 ? (
          <div className="dash-empty">No workers registered</div>
        ) : (
          <div className="dash-workers-grid">
            {workers.map(w => (
              <div key={w.id} className="dash-worker">
                <div className="dash-worker-header">
                  <span className="dash-worker-name">{w.name}</span>
                  <StatusBadge status={w.healthy ? 'online' : 'offline'} />
                </div>
                <div className="dash-worker-bars">
                  {w.cpuUsage != null && (
                    <ResourceBar label="CPU" value={w.cpuUsage} max={100} unit="%" showPercent={false} />
                  )}
                  {w.memorieTotal != null && (
                    <ResourceBar label="RAM" value={w.memorieUsed || 0} max={w.memorieTotal} unit="MB" />
                  )}
                </div>
                <div className="dash-worker-footer">
                  <span className="dash-worker-stat">
                    <Cpu size={11} /> {w.cpuUsage != null ? `${w.cpuUsage.toFixed(1)}%` : '—'}
                  </span>
                  <span className="dash-worker-stat">
                    <HardDrive size={11} /> {w.diskAvailable != null ? `${(w.diskAvailable / 1024).toFixed(0)} GB free` : '—'}
                  </span>
                  <span className="dash-worker-stat">
                    <Activity size={11} /> {w.lastSeenAt ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ── Recent servers ── */}
      <Card className="dash-section">
        <CardHeader title="Recent Servers" />
        {loadingI ? (
          <div className="dash-loading"><Spinner /></div>
        ) : instances.length === 0 ? (
          <div className="dash-empty">No servers yet</div>
        ) : (
          <div className="dash-server-list">
            {[...instances].slice(0, 8).map(inst => (
              <div key={inst.id} className="dash-server-row">
                <div className="dash-server-info">
                  <span className="dash-server-name">{inst.name}</span>
                  <span className="dash-server-type">{GAME_LABELS[inst.type] || inst.type}</span>
                </div>
                <StatusBadge status={inst.status} />
              </div>
            ))}
          </div>
        )}
      </Card>

    </Layout>
  );
}
