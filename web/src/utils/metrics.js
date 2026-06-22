/* Helpers to turn raw worker heartbeats into chart-ready series.
 * Heartbeats arrive every ~15s, so we downsample into time buckets before
 * charting to keep things smooth (and to align points across workers). */

export const RANGES = [
  { key: '1h',  label: '1h', bucketMs: 60 * 1000 },
  { key: '6h',  label: '6h', bucketMs: 5 * 60 * 1000 },
  { key: '24h', label: '1d', bucketMs: 15 * 60 * 1000 },
  { key: '3d',  label: '3d', bucketMs: 60 * 60 * 1000 },
  { key: '7d',  label: '7d', bucketMs: 2 * 60 * 60 * 1000 },
];

const DEFAULT_RANGE = '24h';

export function getRange(key) {
  return RANGES.find((r) => r.key === key) || RANGES.find((r) => r.key === DEFAULT_RANGE);
}

const round = (n, d = 1) => {
  const f = 10 ** d;
  return Math.round(n * f) / f;
};

function formatLabel(time, rangeKey) {
  const d = new Date(time);
  const hm = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (rangeKey === '1h' || rangeKey === '6h' || rangeKey === '24h') return hm;
  const dm = d.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
  return `${dm} ${hm}`;
}

/* Average a single worker's heartbeats into [{ time, cpu, memUsed, memTotal, diskFree }]. */
function bucketWorker(heartbeats, bucketMs) {
  const buckets = new Map();

  for (const hb of heartbeats) {
    const time = new Date(hb.createdAt).getTime();
    const key = Math.floor(time / bucketMs) * bucketMs;

    let b = buckets.get(key);
    if (!b) {
      b = { cpu: 0, cpuN: 0, memUsed: 0, memTotal: 0, memN: 0, disk: 0, diskN: 0 };
      buckets.set(key, b);
    }
    if (hb.cpuUsage != null) { b.cpu += hb.cpuUsage; b.cpuN += 1; }
    if (hb.memorieUsed != null && hb.memorieTotal != null) {
      b.memUsed += hb.memorieUsed; b.memTotal += hb.memorieTotal; b.memN += 1;
    }
    if (hb.diskAvailable != null) { b.disk += hb.diskAvailable; b.diskN += 1; }
  }

  return [...buckets.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([time, b]) => ({
      time,
      cpu: b.cpuN ? b.cpu / b.cpuN : 0,
      memUsed: b.memN ? b.memUsed / b.memN : 0,
      memTotal: b.memN ? b.memTotal / b.memN : 0,
      diskFree: b.diskN ? b.disk / b.diskN : 0,
    }));
}

/* Single worker -> chart series with CPU %, Memory % (+ raw MB) and free disk (GB). */
export function workerChartData(heartbeats = [], rangeKey) {
  const { bucketMs } = getRange(rangeKey);

  return bucketWorker(heartbeats, bucketMs).map((b) => ({
    time: b.time,
    label: formatLabel(b.time, rangeKey),
    cpu: round(b.cpu),
    mem: b.memTotal ? round((b.memUsed / b.memTotal) * 100) : 0,
    memUsedGb: round(b.memUsed / 1024),
    memTotalGb: round(b.memTotal / 1024),
    diskFreeGb: round(b.diskFree / 1024),
  }));
}

/* Many workers -> cluster series: CPU averaged across workers, memory summed. */
export function clusterChartData(perWorker = [], rangeKey) {
  const { bucketMs } = getRange(rangeKey);
  const merged = new Map();

  for (const heartbeats of perWorker) {
    for (const b of bucketWorker(heartbeats, bucketMs)) {
      let m = merged.get(b.time);
      if (!m) { m = { cpu: 0, cpuN: 0, memUsed: 0, memTotal: 0 }; merged.set(b.time, m); }
      m.cpu += b.cpu; m.cpuN += 1;
      m.memUsed += b.memUsed; m.memTotal += b.memTotal;
    }
  }

  return [...merged.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([time, m]) => ({
      time,
      label: formatLabel(time, rangeKey),
      cpu: m.cpuN ? round(m.cpu / m.cpuN) : 0,
      mem: m.memTotal ? round((m.memUsed / m.memTotal) * 100) : 0,
    }));
}
