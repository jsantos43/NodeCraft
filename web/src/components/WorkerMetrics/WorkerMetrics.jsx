import React, { useState, useMemo } from 'react';
import Card, { CardHeader } from '../ui/Card.jsx';
import MetricsChart from '../ui/MetricsChart.jsx';
import RangeSelector from '../ui/RangeSelector.jsx';
import Spinner from '../ui/Spinner.jsx';
import { useApi } from '../../hooks/useApi.js';
import { workersApi } from '../../api/workers.js';
import { workerChartData } from '../../utils/metrics.js';
import './WorkerMetrics.css';

export default function WorkerMetrics({ workerId }) {
  const [range, setRange] = useState('24h');
  const { data, loading } = useApi(() => workersApi.heartbeats(workerId, range), [workerId, range]);

  const series = useMemo(
    () => workerChartData(data?.heartbeats || [], range),
    [data, range],
  );

  const hasDisk = series.some((p) => p.diskFreeGb > 0);

  return (
    <Card className="worker-metrics">
      <CardHeader
        title="Resource History"
        subtitle="Heartbeat metrics over time"
        action={<RangeSelector value={range} onChange={setRange} />}
      />

      {loading ? (
        <div className="worker-metrics-loading"><Spinner /></div>
      ) : (
        <div className="worker-metrics-charts">
          <div className="worker-metrics-chart">
            <span className="worker-metrics-label">CPU Usage</span>
            <MetricsChart
              data={series}
              dataKey="cpu"
              name="CPU"
              unit="%"
              domain={[0, 100]}
              color="var(--accent)"
            />
          </div>

          <div className="worker-metrics-chart">
            <span className="worker-metrics-label">Memory Usage</span>
            <MetricsChart
              data={series}
              dataKey="mem"
              name="Memory"
              unit="%"
              domain={[0, 100]}
              color="var(--blue)"
            />
          </div>

          {hasDisk && (
            <div className="worker-metrics-chart">
              <span className="worker-metrics-label">Disk Available (GB)</span>
              <MetricsChart
                data={series}
                dataKey="diskFreeGb"
                name="Disk Free"
                unit=" GB"
                color="var(--green, #3fb950)"
              />
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
