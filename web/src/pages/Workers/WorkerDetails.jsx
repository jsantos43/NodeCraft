import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Server, Save, Trash2 } from 'lucide-react';
import Layout from '../../components/Layout/Layout.jsx';
import Card, { CardHeader } from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import { StatusBadge } from '../../components/ui/Badge.jsx';
import ResourceBar from '../../components/ui/ResourceBar.jsx';
import { useApi, useAction } from '../../hooks/useApi.js';
import { workersApi } from '../../api/workers.js';
import ConfirmDelete from '../../components/ui/ConfirmDelete.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import './WorkerDetails.css';

const GAME_LABELS = { minecraft: 'Minecraft', counterstrike: 'CS2', terraria: 'Terraria', kerbal: 'KSP', hytale: 'Hytale' };

export default function WorkerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, loading, refetch } = useApi(() => workersApi.get(id), [id]);
  const { data: instData } = useApi(() => workersApi.listInstances(id), [id]);

  const worker = data?.worker;
  const instances = instData?.instances || [];

  const [form, setForm] = useState({ name: '', url: '', secret: '' });
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { execute: deleteWorker, loading: deleting } = useAction(async () => {
    await workersApi.delete(id);
    navigate('/workers');
  });

  useEffect(() => {
    if (worker) setForm({ name: worker.name || '', url: worker.url || '', secret: worker.secret || '' });
  }, [worker?.id]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const { execute: save, loading: saving } = useAction(async () => {
    setSaved(false);
    setSaveError(null);
    try {
      await workersApi.update(id, { name: form.name, url: form.url, secret: form.secret });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      refetch();
    } catch (err) {
      setSaveError(err.message || 'Failed to save');
    }
  });

  if (loading) return (
    <Layout breadcrumbs={['Workers', '...']}>
      <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size={24} /></div>
    </Layout>
  );

  if (!worker) return (
    <Layout breadcrumbs={['Workers', 'Not Found']}>
      <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Worker not found</div>
    </Layout>
  );

  return (
    <Layout breadcrumbs={['Workers', worker.name]}>
      <div className="worker-details">
        <div className="worker-details-header">
          <button className="back-btn" onClick={() => navigate('/workers')}>
            <ArrowLeft size={14} />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 className="worker-details-title">{worker.name}</h1>
              <StatusBadge status={worker.healthy ? 'online' : 'offline'} />
            </div>
            <span className="worker-details-id">{worker.id}</span>
          </div>
          <Button icon={Trash2} variant="ghost" size="sm" onClick={() => setConfirmDelete(true)} />
        </div>

        <div className="worker-details-grid">
          <Card>
            <CardHeader title="Resource Usage" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {worker.cpuUsage != null && (
                <ResourceBar label="CPU" value={worker.cpuUsage} max={100} unit="%" showPercent={false} />
              )}
              {worker.memorieTotal != null && (
                <ResourceBar label="Memory" value={worker.memorieUsed || 0} max={worker.memorieTotal} unit="MB" />
              )}
              {worker.diskAvailable != null && (
                <div className="disk-info">
                  <span className="overview-key">Disk Available</span>
                  <span className="overview-val">{(worker.diskAvailable / 1024).toFixed(1)} GB</span>
                </div>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader title="Details" />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {[
                ['ID',        worker.id],
                ['Status',    null],
                ['Last Seen', worker.lastSeenAt ? new Date(worker.lastSeenAt).toLocaleString() : 'Never'],
              ].map(([k, v]) => (
                <div key={k} className="overview-row">
                  <span className="overview-key">{k}</span>
                  <span className="overview-val">
                    {k === 'Status' ? <StatusBadge status={worker.healthy ? 'healthy' : 'offline'} /> : v}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card>
          <CardHeader title="Settings" subtitle="Changes take effect on the next worker connection" />
          <div className="worker-settings-grid">
            <Input
              label="Name"
              value={form.name}
              onChange={e => set('name', e.target.value)}
            />
            <Input
              label="URL"
              placeholder="http://worker-host:9184"
              value={form.url}
              onChange={e => set('url', e.target.value)}
            />
            <Input
              label="Secret (MANAGER_SECRET)"
              placeholder="Leave blank to keep current"
              value={form.secret}
              onChange={e => set('secret', e.target.value)}
            />
          </div>
          <div className="worker-settings-footer">
            {saveError && <span className="worker-url-error">{saveError}</span>}
            {saved && <span className="worker-url-saved">Saved</span>}
            <Button icon={Save} loading={saving} onClick={save}>Save Changes</Button>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Hosted Servers"
            subtitle={`${instances.length} server${instances.length !== 1 ? 's' : ''} on this worker`}
          />
          {instances.length === 0 ? (
            <div className="worker-no-servers">
              <Server size={24} style={{ opacity: 0.3 }} />
              <p>No servers deployed on this worker</p>
            </div>
          ) : (
            <table className="servers-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Game</th>
                  <th>Status</th>
                  <th>Port</th>
                  <th>Memory</th>
                </tr>
              </thead>
              <tbody>
                {instances.map(inst => (
                  <tr
                    key={inst.id}
                    className="servers-row"
                    onClick={() => navigate(`/servers/${inst.id}`)}
                  >
                    <td><span className="server-name">{inst.name}</span></td>
                    <td><span className="server-game">{GAME_LABELS[inst.type] || inst.type}</span></td>
                    <td><StatusBadge status={inst.status || 'stopped'} /></td>
                    <td><code className="server-port">{inst.port || '—'}</code></td>
                    <td><span className="server-mem">{inst.memory ? `${inst.memory} MB` : '—'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      <ConfirmDelete
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={deleteWorker}
        name={worker.name}
        loading={deleting}
      />
    </Layout>
  );
}
