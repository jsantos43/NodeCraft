import React from 'react';
import { Server, Cpu, Activity, HardDrive, Users, Zap } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import Layout from '../../components/Layout/Layout.jsx';
import StatCard from '../../components/ui/StatCard.jsx';
import Card, { CardHeader } from '../../components/ui/Card.jsx';
import { StatusBadge } from '../../components/ui/Badge.jsx';
import { useApi } from '../../hooks/useApi.js';
import { instancesApi } from '../../api/instances.js';
import { workersApi } from '../../api/workers.js';
import Spinner from '../../components/ui/Spinner.jsx';
import './Dashboard.css';

const demoChart = Array.from({ length: 12 }, (_, i) => ({
  time: `${i * 2}h`,
  cpu: Math.round(20 + Math.random() * 40),
  mem: Math.round(40 + Math.random() * 30),
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
  const { data: workersData, loading: loadingW } = useApi(() => workersApi.list());

  const instances = instancesData?.instances || [];
  const workers = workersData?.workers || [];

  const onlineServers = instances.filter(i => i.status === 'running').length;
  const onlineWorkers = workers.filter(w => w.healthy).length;

  const totalCpu = workers.length > 0
    ? workers.reduce((sum, w) => sum + (w.cpuUsage || 0), 0) / workers.length
    : 0;
  const totalMemUsed = workers.reduce((sum, w) => sum + (w.memorieUsed || 0), 0);
  const totalMemTotal = workers.reduce((sum, w) => sum + (w.memorieTotal || 0), 0);
  const memPct = totalMemTotal > 0 ? Math.round((totalMemUsed / totalMemTotal) * 100) : 0;

  const recentInstances = [...instances].slice(0, 6);

  return (
    <Layout title="Dashboard">
      <div className="dash-grid">
        <StatCard title="Total Servers" value={instances.length} icon={Server} color="blue" />
        <StatCard title="Online Servers" value={onlineServers} subtitle={`${instances.length - onlineServers} offline`} icon={Zap} color="green" />
        <StatCard title="Total Workers" value={workers.length} icon={Cpu} color="purple" />
        <StatCard title="Online Workers" value={onlineWorkers} subtitle={`${workers.length - onlineWorkers} offline`} icon={Activity} color={onlineWorkers === workers.length ? 'green' : 'yellow'} />
        <StatCard title="Avg CPU Usage" value={`${totalCpu.toFixed(1)}%`} icon={Cpu} color="yellow" />
        <StatCard title="Memory Usage" value={`${memPct}%`} subtitle={totalMemTotal ? `${(totalMemUsed/1024).toFixed(1)} / ${(totalMemTotal/1024).toFixed(1)} GB` : 'No data'} icon={HardDrive} color={memPct > 80 ? 'red' : 'blue'} />
        <StatCard title="Total Users" value="—" icon={Users} color="purple" />
      </div>

      <div className="dash-row">
        <Card className="dash-chart-card">
          <CardHeader title="Resource Usage (24h)" subtitle="Aggregated across all workers" />
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={demoChart} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="gCpu" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gMem" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--blue)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="var(--blue)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
              <Tooltip
                contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: 12 }}
                labelStyle={{ color: 'var(--text-secondary)' }}
                itemStyle={{ color: 'var(--text-primary)' }}
              />
              <Area type="monotone" dataKey="cpu" stroke="var(--accent)" strokeWidth={2} fill="url(#gCpu)" name="CPU" unit="%" />
              <Area type="monotone" dataKey="mem" stroke="var(--blue)" strokeWidth={2} fill="url(#gMem)" name="Memory" unit="%" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="dash-recent-card">
          <CardHeader title="Recent Servers" />
          {loadingI ? (
            <div className="dash-loading"><Spinner /></div>
          ) : recentInstances.length === 0 ? (
            <div className="dash-empty">No servers yet</div>
          ) : (
            <div className="dash-server-list">
              {recentInstances.map(inst => (
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
      </div>

      <Card>
        <CardHeader title="Workers Overview" />
        {loadingW ? (
          <div className="dash-loading"><Spinner /></div>
        ) : workers.length === 0 ? (
          <div className="dash-empty">No workers registered</div>
        ) : (
          <div className="worker-overview-grid">
            {workers.map(w => (
              <div key={w.id} className="worker-overview-item">
                <div className="worker-ov-header">
                  <span className="worker-ov-name">{w.name}</span>
                  <StatusBadge status={w.healthy ? 'online' : 'offline'} />
                </div>
                <div className="worker-ov-metrics">
                  <div className="worker-ov-metric">
                    <span className="wov-label">CPU</span>
                    <span className="wov-value">{w.cpuUsage != null ? `${w.cpuUsage.toFixed(1)}%` : '—'}</span>
                  </div>
                  <div className="worker-ov-metric">
                    <span className="wov-label">RAM</span>
                    <span className="wov-value">
                      {w.memorieUsed != null ? `${(w.memorieUsed/1024).toFixed(1)}GB` : '—'}
                    </span>
                  </div>
                  <div className="worker-ov-metric">
                    <span className="wov-label">Disk</span>
                    <span className="wov-value">
                      {w.diskAvailable != null ? `${(w.diskAvailable/1024).toFixed(0)}GB free` : '—'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </Layout>
  );
}
