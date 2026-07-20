import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Server } from 'lucide-react';
import Layout from '../../components/Layout/Layout.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import { StatusBadge } from '../../components/ui/Badge.jsx';
import Alert from '../../components/ui/Alert.jsx';
import { useApi } from '../../hooks/useApi.js';
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

export default function Servers() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const { data, loading, error } = useApi(() => instancesApi.list());

  const instances = (data?.instances || []).filter(i =>
    !search || i.name.toLowerCase().includes(search.toLowerCase())
  );

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
        ) : error ? (
          <div style={{ padding: 20 }}><Alert error={error} override={{ title: "Couldn't load your servers" }} /></div>
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
                <th>Worker</th>
                <th>Uptime</th>
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
                  <td><span className="server-worker">{inst.workerId ? inst.workerId.slice(0, 8) + '...' : '—'}</span></td>
                  <td><span className="server-uptime">{formatUptime(inst.status)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </Layout>
  );
}
