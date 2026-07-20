import React, { useState, useMemo } from 'react';
import { Server, Cpu, Activity, HardDrive, Users, Zap } from 'lucide-react';
import Layout from '../../components/Layout/Layout.jsx';
import StatCard from '../../components/ui/StatCard.jsx';
import Card, { CardHeader } from '../../components/ui/Card.jsx';
import MetricsChart from '../../components/ui/MetricsChart.jsx';
import RangeSelector from '../../components/ui/RangeSelector.jsx';
import ResourceBar from '../../components/ui/ResourceBar.jsx';
import { StatusBadge } from '../../components/ui/Badge.jsx';
import Alert from '../../components/ui/Alert.jsx';
import { useApi } from '../../hooks/useApi.js';
import { instancesApi } from '../../api/instances.js';
import { workersApi } from '../../api/workers.js';
import { usersApi } from '../../api/users.js';
import { clusterChartData } from '../../utils/metrics.js';
import Spinner from '../../components/ui/Spinner.jsx';
import './Dashboard.css';

const GAME_LABELS = {
  minecraft: 'Minecraft',
  counterstrike: 'Counter-Strike',
  terraria: 'Terraria',
  kerbal: 'Kerbal Space',
  hytale: 'Hytale',
};

export default function Dashboard() {
  const [range, setRange] = useState('1h');
  const { data: instancesData, loading: loadingI, error: instErr } = useApi(() => instancesApi.list());
  const { data: workersData,  loading: loadingW, error: workErr } = useApi(() => workersApi.list());
  const { data: usersData } = useApi(() => usersApi.list());

  const { data: histData } = useApi(async () => {
    const { workers = [] } = await workersApi.list();
    const perWorker = await Promise.all(
      workers.map((w) => workersApi.heartbeats(w.id, range)
        .then((r) => r.heartbeats || [])
        .catch(() => [])),
    );
    return perWorker;
  }, [range]);

  const instances = instancesData?.instances || [];
  const workers   = workersData?.workers   || [];
  const totalUsers = usersData?.users?.length;

  const clusterData = useMemo(() => clusterChartData(histData || [], range), [histData, range]);

  const onlineServers = instances.filter(i => i.status === 'running').length;
  const onlineWorkers = workers.filter(w => w.healthy).length;

  const totalCpu      = workers.length > 0
    ? workers.reduce((s, w) => s + (w.cpuUsage || 0), 0) / workers.length
    : 0;
  const totalMemUsed  = workers.reduce((s, w) => s + (w.memorieUsed  || 0), 0);
  const totalMemTotal = workers.reduce((s, w) => s + (w.memorieTotal || 0), 0);
  const memPct = totalMemTotal > 0 ? Math.round((totalMemUsed / totalMemTotal) * 100) : 0;

  const loadError = instErr || workErr;

  return (
    <Layout title="Dashboard">

      {loadError && (
        <div style={{ marginBottom: 16 }}>
          <Alert error={loadError} override={{ title: "Couldn't load dashboard data" }} />
        </div>
      )}

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
        <StatCard title="Total Users" value={totalUsers ?? '—'} icon={Users} color="purple" />
      </div>

      {/* ── Charts ── */}
      <div className="dash-charts-row">
        <Card>
          <CardHeader
            title="CPU Usage"
            subtitle="Cluster average"
            action={<RangeSelector value={range} onChange={setRange} />}
          />
          <MetricsChart
            data={clusterData}
            dataKey="cpu"
            name="CPU"
            unit="%"
            domain={[0, 100]}
            color="var(--accent)"
          />
        </Card>

        <Card>
          <CardHeader title="Memory Usage" subtitle="Cluster total" />
          <MetricsChart
            data={clusterData}
            dataKey="mem"
            name="Memory"
            unit="%"
            domain={[0, 100]}
            color="var(--blue)"
          />
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
