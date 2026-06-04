import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Play, Square, RotateCcw, Trash2, MoreHorizontal, Server } from 'lucide-react';
import Layout from '../../components/Layout/Layout.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import { StatusBadge } from '../../components/ui/Badge.jsx';
import { useApi, useAction } from '../../hooks/useApi.js';
import { instancesApi } from '../../api/instances.js';
import Spinner from '../../components/ui/Spinner.jsx';
import './Servers.css';

const GAME_LABELS = {
  minecraft: 'Minecraft', counterstrike: 'CS2', terraria: 'Terraria',
  kerbal: 'KSP', hytale: 'Hytale',
};

const GAME_COLOR = {
  minecraft: 'green', counterstrike: 'yellow', terraria: 'blue',
  kerbal: 'purple', hytale: 'red',
};

function formatUptime(status) {
  return status === 'running' ? 'Running' : '—';
}

function formatMemory(mb) {
  if (!mb) return '—';
  return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb} MB`;
}

export default function Servers() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeMenu, setActiveMenu] = useState(null);
  const { data, loading, refetch } = useApi(() => instancesApi.list());
  const runAction = useAction((fn) => fn());

  const instances = (data?.instances || []).filter(i =>
    !search || i.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAction = async (action, id, e) => {
    e.stopPropagation();
    setActiveMenu(null);
    try {
      if (action === 'run')     await runAction.execute(() => instancesApi.run(id));
      if (action === 'stop')    await runAction.execute(() => instancesApi.stop(id));
      if (action === 'restart') await runAction.execute(() => instancesApi.restart(id));
      if (action === 'delete')  await runAction.execute(() => instancesApi.delete(id));
      refetch();
    } catch {}
  };

  return (
    <Layout title="Servers">
      <div className="servers-toolbar">
        <div className="servers-search">
          <Search size={14} className="search-icon" />
          <input
            className="search-input"
            placeholder="Search servers..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Button icon={Plus} onClick={() => navigate('/servers/create')}>
          New Server
        </Button>
      </div>

      <Card padding={false}>
        {loading ? (
          <div className="servers-loading"><Spinner /></div>
        ) : instances.length === 0 ? (
          <div className="servers-empty">
            <Server size={32} className="empty-icon" />
            <p>No servers found</p>
            <Button icon={Plus} size="sm" onClick={() => navigate('/servers/create')}>
              Create your first server
            </Button>
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
                <th>Worker</th>
                <th>Uptime</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {instances.map(inst => (
                <tr
                  key={inst.id}
                  className="servers-row"
                  onClick={() => navigate(`/servers/${inst.id}`)}
                >
                  <td>
                    <div className="server-name-cell">
                      <div className={`server-game-dot dot-${GAME_COLOR[inst.type] || 'gray'}`} />
                      <span className="server-name">{inst.name}</span>
                    </div>
                  </td>
                  <td><span className="server-game">{GAME_LABELS[inst.type] || inst.type}</span></td>
                  <td><StatusBadge status={inst.status || 'stopped'} /></td>
                  <td><code className="server-port">{inst.port || '—'}</code></td>
                  <td><span className="server-mem">{formatMemory(inst.memory)}</span></td>
                  <td><span className="server-worker">{inst.workerId ? inst.workerId.slice(0, 8) + '...' : '—'}</span></td>
                  <td><span className="server-uptime">{formatUptime(inst.status)}</span></td>
                  <td>
                    <div className="server-actions" onClick={e => e.stopPropagation()}>
                      {inst.status !== 'running' && (
                        <button className="action-btn action-run" title="Start" onClick={e => handleAction('run', inst.id, e)}>
                          <Play size={13} />
                        </button>
                      )}
                      {inst.status === 'running' && (
                        <button className="action-btn action-stop" title="Stop" onClick={e => handleAction('stop', inst.id, e)}>
                          <Square size={13} />
                        </button>
                      )}
                      <button className="action-btn" title="Restart" onClick={e => handleAction('restart', inst.id, e)}>
                        <RotateCcw size={13} />
                      </button>
                      <div className="action-menu-wrap">
                        <button
                          className="action-btn"
                          title="More"
                          onClick={e => { e.stopPropagation(); setActiveMenu(activeMenu === inst.id ? null : inst.id); }}
                        >
                          <MoreHorizontal size={13} />
                        </button>
                        {activeMenu === inst.id && (
                          <div className="action-menu" onMouseLeave={() => setActiveMenu(null)}>
                            <button className="action-menu-item action-menu-danger" onClick={e => handleAction('delete', inst.id, e)}>
                              <Trash2 size={12} /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </Layout>
  );
}
