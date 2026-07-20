import React, { useState, useMemo } from 'react';
import { Cpu, HardDrive, Activity } from 'lucide-react';
import Layout from '../../components/Layout/Layout.jsx';
import Card, { CardHeader } from '../../components/ui/Card.jsx';
import MetricsChart from '../../components/ui/MetricsChart.jsx';
import RangeSelector from '../../components/ui/RangeSelector.jsx';
import ResourceBar from '../../components/ui/ResourceBar.jsx';
import { StatusBadge } from '../../components/ui/Badge.jsx';
import Alert from '../../components/ui/Alert.jsx';
import { useApi } from '../../hooks/useApi.js';
import { workersApi } from '../../api/workers.js';
import { clusterChartData } from '../../utils/metrics.js';
import Spinner from '../../components/ui/Spinner.jsx';
import './Monitoring.css';

export default function Monitoring() {
  const [range, setRange] = useState('1h');

  const { data, loading, error } = useApi(async () => {
    const { workers = [] } = await workersApi.list();
    const perWorker = await Promise.all(
      workers.map((w) => workersApi.heartbeats(w.id, range)
        .then((r) => r.heartbeats || [])
        .catch(() => [])),
    );
    return { workers, perWorker };
  }, [range]);

  const workers = data?.workers || [];
  const clusterData = useMemo(
    () => clusterChartData(data?.perWorker || [], range),
    [data, range],
  );

  return (
    <Layout title="Monitoring">
      {error && !loading && (
        <div style={{ marginBottom: 16 }}>
          <Alert error={error} override={{ title: "Couldn't load monitoring data" }} />
        </div>
      )}
      <div className="monitoring-grid">
        <Card className="monitoring-chart-card">
          <CardHeader
            title="Cluster CPU Usage"
            subtitle="Averaged across all workers"
            action={<RangeSelector value={range} onChange={setRange} />}
          />
          <MetricsChart
            data={clusterData}
            dataKey="cpu"
            name="CPU"
            unit="%"
            domain={[0, 100]}
            color="var(--accent)"
            height={200}
          />
        </Card>

        <Card className="monitoring-chart-card">
          <CardHeader title="Cluster Memory Usage" subtitle="Total used across all workers" />
          <MetricsChart
            data={clusterData}
            dataKey="mem"
            name="Memory"
            unit="%"
            domain={[0, 100]}
            color="var(--blue)"
            height={200}
          />
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
