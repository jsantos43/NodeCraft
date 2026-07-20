import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Server, Save, Trash2, Shield, CheckCircle2, XCircle, Copy, Check,
} from 'lucide-react';
import Layout from '../../components/Layout/Layout.jsx';
import Card, { CardHeader } from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Input, { Select } from '../../components/ui/Input.jsx';
import Badge, { StatusBadge } from '../../components/ui/Badge.jsx';
import ConfirmDelete from '../../components/ui/ConfirmDelete.jsx';
import Alert from '../../components/ui/Alert.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import { useApi, useAction } from '../../hooks/useApi.js';
import { usersApi } from '../../api/users.js';
import { instancesApi } from '../../api/instances.js';
import { workersApi } from '../../api/workers.js';
import './UserDetails.css';

const GAMES = [
  { id: 'minecraft', label: 'Minecraft' },
  { id: 'hytale', label: 'Hytale' },
  { id: 'counterstrike', label: 'CS2' },
  { id: 'terraria', label: 'Terraria' },
  { id: 'kerbal', label: 'KSP' },
];
const GAME_LABELS = Object.fromEntries(GAMES.map(g => [g.id, g.label]));

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button className="copy-btn" onClick={copy} title="Copy">
      {copied ? <Check size={12} /> : <Copy size={12} />}
    </button>
  );
}

function UsageBar({ label, value, max, unit }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const color = pct >= 90 ? 'bar-red' : pct >= 70 ? 'bar-yellow' : 'bar-green';
  const fmt = unit === 'GB' ? (n) => (n / 1024).toFixed(1) : (n) => n;
  return (
    <div className="usage-bar">
      <div className="usage-bar-head">
        <span className="usage-bar-label">{label}</span>
        <span className="usage-bar-value">{fmt(value)} / {fmt(max)} {unit}</span>
      </div>
      <div className="usage-bar-track">
        <div className={`usage-bar-fill ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function UserDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, loading, error: loadError, refetch } = useApi(() => usersApi.get(id), [id]);
  const { data: instData } = useApi(() => instancesApi.list(), [id]);
  const { data: workerData } = useApi(() => workersApi.list(), []);

  const user = data?.user;
  const workers = workerData?.workers || [];
  const owned = (instData?.instances || []).filter(i => i.owner === id);

  // Memory/CPU limits are enforced across running instances only (that is when
  // the resources are actually occupied); disk counts every owned instance.
  const usage = owned.reduce((a, i) => {
    const running = i.status === 'running';
    return {
      count: a.count + 1,
      memory: a.memory + (running ? (i.memory || 0) : 0),
      cpu: a.cpu + (running ? (i.cpu || 0) : 0),
      disk: a.disk + (i.diskUsage || 0),
    };
  }, {
    count: 0, memory: 0, cpu: 0, disk: 0,
  });

  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        admin: !!user.admin,
        maxInstances: user.maxInstances ?? 0,
        maxMemory: user.maxMemory ?? 0,
        maxCpu: user.maxCpu ?? 0,
        maxDisk: user.maxDisk ?? 0,
        allowedGames: Array.isArray(user.allowedGames) ? user.allowedGames : [],
        allowedWorkers: Array.isArray(user.allowedWorkers) ? user.allowedWorkers : [],
      });
    }
  }, [user?.id]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleGame = (gid) => setForm(f => ({
    ...f,
    allowedGames: f.allowedGames.includes(gid)
      ? f.allowedGames.filter(g => g !== gid)
      : [...f.allowedGames, gid],
  }));
  const toggleWorker = (wid) => setForm(f => ({
    ...f,
    allowedWorkers: f.allowedWorkers.includes(wid)
      ? f.allowedWorkers.filter(w => w !== wid)
      : [...f.allowedWorkers, wid],
  }));

  const { execute: save, loading: saving, error: saveError } = useAction(async () => {
    setSaved(false);
    await usersApi.updateOther(id, {
      name: form.name,
      admin: form.admin,
      maxInstances: Number(form.maxInstances),
      maxMemory: Number(form.maxMemory),
      maxCpu: Number(form.maxCpu),
      maxDisk: Number(form.maxDisk),
      allowedGames: form.allowedGames,
      allowedWorkers: form.allowedWorkers,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    refetch();
  });

  const { execute: deleteUser, loading: deleting } = useAction(async () => {
    await usersApi.deleteOther(id);
    navigate('/users');
  }, { errorToast: { title: "Couldn't delete this user" } });

  if (loading) return (
    <Layout breadcrumbs={['Users', '...']}>
      <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size={24} /></div>
    </Layout>
  );

  if (!user) return (
    <Layout breadcrumbs={['Users', loadError ? 'Error' : 'Not Found']}>
      {loadError ? (
        <div style={{ maxWidth: 480, margin: '60px auto 0' }}>
          <Alert error={loadError} override={{ title: "Couldn't load this user" }} />
        </div>
      ) : (
      <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>User not found</div>
      )}
    </Layout>
  );

  return (
    <Layout breadcrumbs={['Users', user.name]}>
      <div className="user-details">
        <div className="user-details-header">
          <button className="back-btn" onClick={() => navigate('/users')}>
            <ArrowLeft size={14} />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 className="user-details-title">{user.name}</h1>
              <Badge color={user.admin ? 'purple' : 'gray'}>
                {user.admin ? <><Shield size={10} /> Admin</> : 'User'}
              </Badge>
            </div>
            <span className="user-details-id">{user.email}</span>
          </div>
          <Button icon={Trash2} variant="ghost" size="sm" onClick={() => setConfirmDelete(true)} />
        </div>

        <div className="user-details-grid">
          <Card>
            <CardHeader title="Quota Usage" subtitle="Memory & CPU across running instances; disk across all" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <UsageBar label="Instances" value={usage.count} max={user.maxInstances ?? 0} unit="" />
              <UsageBar label="CPU" value={usage.cpu} max={user.maxCpu ?? 0} unit="cores" />
              <UsageBar label="Memory" value={usage.memory} max={user.maxMemory ?? 0} unit="MB" />
              <UsageBar label="Disk" value={usage.disk} max={user.maxDisk ?? 0} unit="MB" />
            </div>
          </Card>

          <Card>
            <CardHeader title="Details" />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {[
                ['ID', user.id],
                ['Email', user.email],
                ['Role', null],
                ['Verified', null],
              ].map(([k, v]) => (
                <div key={k} className="overview-row">
                  <span className="overview-key">{k}</span>
                  <span className="overview-val-wrap">
                    <span className="overview-val">
                      {k === 'Role' ? (
                        <Badge color={user.admin ? 'purple' : 'gray'}>{user.admin ? 'Admin' : 'User'}</Badge>
                      ) : k === 'Verified' ? (
                        user.verified
                          ? <span className="verified-yes"><CheckCircle2 size={13} /> Verified</span>
                          : <span className="verified-no"><XCircle size={13} /> Unverified</span>
                      ) : v}
                    </span>
                    {k === 'ID' && <CopyButton text={v} />}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {form && (
          <Card>
            <CardHeader title="Account & Quotas" subtitle="Instance count on create; memory & CPU on start; disk monitored" />
            <div className="user-settings-top">
              <Input label="Name" value={form.name} onChange={e => set('name', e.target.value)} />
              <Select label="Role" value={form.admin ? 'admin' : 'user'} onChange={e => set('admin', e.target.value === 'admin')}>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </Select>
            </div>

            <div className="quota-grid">
              <Input label="Max Instances" type="number" min="0" value={form.maxInstances} onChange={e => set('maxInstances', e.target.value)} />
              <Input label="Max CPU (cores)" type="number" min="0" value={form.maxCpu} onChange={e => set('maxCpu', e.target.value)} />
              <Input label="Max Memory (MB)" type="number" min="0" value={form.maxMemory} onChange={e => set('maxMemory', e.target.value)} />
              <Input label="Max Disk (MB)" type="number" min="0" value={form.maxDisk} onChange={e => set('maxDisk', e.target.value)} />
            </div>

            <div className="games-field">
              <label className="ui-input-label">Allowed Games</label>
              <div className="games-grid">
                {GAMES.map(g => (
                  <label key={g.id} className={`game-check ${form.allowedGames.includes(g.id) ? 'is-on' : ''}`}>
                    <input type="checkbox" checked={form.allowedGames.includes(g.id)} onChange={() => toggleGame(g.id)} />
                    {g.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="games-field">
              <label className="ui-input-label">Allowed Workers</label>
              {workers.length === 0 ? (
                <span className="workers-empty">No workers registered</span>
              ) : (
                <>
                  <div className="games-grid">
                    {workers.map(w => (
                      <label key={w.id} className={`game-check ${form.allowedWorkers.includes(w.id) ? 'is-on' : ''}`}>
                        <input type="checkbox" checked={form.allowedWorkers.includes(w.id)} onChange={() => toggleWorker(w.id)} />
                        {w.name}
                      </label>
                    ))}
                  </div>
                  <span className="workers-hint">
                    {form.allowedWorkers.length === 0
                      ? 'No workers selected — the user cannot create any instances.'
                      : 'The user can only create instances on the selected workers.'}
                  </span>
                </>
              )}
            </div>

            {saveError && <Alert error={saveError} override={{ title: "Couldn't save changes" }} compact />}
            <div className="user-settings-footer">
              {saved && <span className="user-save-ok">Saved</span>}
              <Button icon={Save} loading={saving} onClick={save}>Save Changes</Button>
            </div>
          </Card>
        )}

        <Card>
          <CardHeader
            title="Owned Instances"
            subtitle={`${owned.length} instance${owned.length !== 1 ? 's' : ''} owned by this user`}
          />
          {owned.length === 0 ? (
            <div className="user-no-servers">
              <Server size={24} style={{ opacity: 0.3 }} />
              <p>This user does not own any instances</p>
            </div>
          ) : (
            <div className="table-scroll">
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
                {owned.map(inst => (
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
            </div>
          )}
        </Card>
      </div>

      <ConfirmDelete
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={deleteUser}
        name={user.email}
        loading={deleting}
      />
    </Layout>
  );
}
