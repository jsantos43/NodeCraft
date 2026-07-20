import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Cpu, Search } from 'lucide-react';
import Layout from '../../components/Layout/Layout.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import { StatusBadge } from '../../components/ui/Badge.jsx';
import ResourceBar from '../../components/ui/ResourceBar.jsx';
import Modal, { ModalFooter } from '../../components/ui/Modal.jsx';
import Input from '../../components/ui/Input.jsx';
import Alert from '../../components/ui/Alert.jsx';
import { useApi, useAction } from '../../hooks/useApi.js';
import { workersApi } from '../../api/workers.js';
import Spinner from '../../components/ui/Spinner.jsx';
import './Workers.css';

export default function Workers() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [createdKeys, setCreatedKeys] = useState(null); // { apiKey, secret }

  const { data, loading, error, refetch } = useApi(() => workersApi.list());
  const createWorker = useAction(async () => {
    const res = await workersApi.create({ name: newName });
    setCreatedKeys({ apiKey: res.apiKey, secret: res.secret });
    refetch();
    setNewName('');
    return res;
  });

  const workers = (data?.workers || []).filter(w =>
    !search || w.name.toLowerCase().includes(search.toLowerCase())
  );

  const formatLastSeen = (ts) => {
    if (!ts) return 'Never';
    const d = new Date(ts);
    if (isNaN(d)) return 'Never';
    const diff = Date.now() - d.getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return d.toLocaleTimeString();
  };

  return (
    <Layout title="Workers">
      <div className="workers-toolbar">
        <div className="servers-search">
          <Search size={14} className="search-icon" />
          <input
            className="search-input"
            placeholder="Search workers..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Button icon={Plus} onClick={() => setCreateOpen(true)}>
          Add Worker
        </Button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
          <Spinner size={24} />
        </div>
      ) : error ? (
        <Alert error={error} override={{ title: "Couldn't load workers" }} />
      ) : workers.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            <Cpu size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>No workers registered yet</p>
            <Button icon={Plus} size="sm" style={{ marginTop: 16 }} onClick={() => setCreateOpen(true)}>
              Add first worker
            </Button>
          </div>
        </Card>
      ) : (
        <div className="workers-grid">
          {workers.map(w => {
            const memPct = w.memorieTotal ? Math.round((w.memorieUsed / w.memorieTotal) * 100) : 0;
            return (
              <div
                key={w.id}
                className="worker-card"
                onClick={() => navigate(`/workers/${w.id}`)}
              >
                <div className="worker-card-header">
                  <div className="worker-card-meta">
                    <span className="worker-card-name">{w.name}</span>
                    <span className="worker-card-id">{w.id?.slice(0, 12)}...</span>
                  </div>
                  <StatusBadge status={w.healthy ? 'online' : 'offline'} />
                </div>

                <div className="worker-metrics">
                  {w.cpuUsage != null && (
                    <ResourceBar
                      label="CPU"
                      value={w.cpuUsage}
                      max={100}
                      unit="%"
                      showPercent={false}
                    />
                  )}
                  {w.memorieTotal != null && (
                    <ResourceBar
                      label="Memory"
                      value={w.memorieUsed || 0}
                      max={w.memorieTotal}
                      unit="MB"
                    />
                  )}
                </div>

                <div className="worker-card-footer">
                  <div className="worker-footer-item">
                    <span className="footer-label">Disk Free</span>
                    <span className="footer-value">
                      {w.diskAvailable != null ? `${(w.diskAvailable / 1024).toFixed(1)} GB` : '—'}
                    </span>
                  </div>
                  <div className="worker-footer-item">
                    <span className="footer-label">Last Seen</span>
                    <span className="footer-value">{formatLastSeen(w.lastSeenAt)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Worker Modal */}
      <Modal
        open={createOpen && !createdKeys}
        onClose={() => setCreateOpen(false)}
        title="Add Worker"
        size="sm"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input
            label="Worker Name"
            placeholder="worker-us-east-1"
            value={newName}
            onChange={e => setNewName(e.target.value)}
          />
          {createWorker.error && <Alert error={createWorker.error} override={{ title: "Couldn't create the worker" }} compact />}
          <ModalFooter>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button loading={createWorker.loading} onClick={createWorker.execute} disabled={!newName}>
              Create Worker
            </Button>
          </ModalFooter>
        </div>
      </Modal>

      {/* API Key Modal */}
      <Modal
        open={!!createdKeys}
        onClose={() => { setCreatedKeys(null); setCreateOpen(false); }}
        title="Worker Created"
        size="sm"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="api-key-notice">
            Save these credentials — they will only be shown once.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div className="api-key-label">MANAGER_API_KEY (worker → manager auth)</div>
            <div className="api-key-box">
              <code className="api-key">{createdKeys?.apiKey}</code>
            </div>
            <div className="api-key-label">MANAGER_SECRET (manager → worker auth)</div>
            <div className="api-key-box">
              <code className="api-key">{createdKeys?.secret}</code>
            </div>
          </div>
          <ModalFooter>
            <Button onClick={() => { setCreatedKeys(null); setCreateOpen(false); }}>
              I've saved them
            </Button>
          </ModalFooter>
        </div>
      </Modal>
    </Layout>
  );
}
