import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Play, Square, RotateCcw, Trash2, Terminal, Folder, HardDrive,
  Network, Variable, ArrowLeft, RefreshCw, Copy, Check,
} from 'lucide-react';
import Layout from '../../components/Layout/Layout.jsx';
import Card, { CardHeader } from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import { StatusBadge } from '../../components/ui/Badge.jsx';
import { useApi, useAction } from '../../hooks/useApi.js';
import { instancesApi } from '../../api/instances.js';
import Spinner from '../../components/ui/Spinner.jsx';
import './ServerDetails.css';

const TABS = [
  { id: 'overview',  label: 'Overview',   icon: RefreshCw  },
  { id: 'console',   label: 'Console',    icon: Terminal   },
  { id: 'files',     label: 'Files',      icon: Folder     },
  { id: 'backups',   label: 'Backups',    icon: HardDrive  },
  { id: 'env',       label: 'Variables',  icon: Variable   },
  { id: 'network',   label: 'Network',    icon: Network    },
];

const GAME_LABELS = {
  minecraft: 'Minecraft', counterstrike: 'CS2', terraria: 'Terraria',
  kerbal: 'KSP', hytale: 'Hytale',
};

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

function OverviewTab({ instance }) {
  const details = [
    ['ID',          instance.id],
    ['Name',        instance.name],
    ['Game',        GAME_LABELS[instance.type] || instance.type],
    ['Status',      instance.status || 'stopped'],
    ['Port',        instance.port || '—'],
    ['Memory',      instance.memory ? `${instance.memory} MB` : '—'],
    ['CPU Cores',   instance.cpu || '—'],
    ['Max Players', instance.maxPlayers || '—'],
    ['Worker ID',   instance.workerId || 'Not assigned'],
  ];

  return (
    <div className="overview-grid">
      <div className="overview-props">
        <h4 className="overview-section-title">Instance Details</h4>
        {details.map(([k, v]) => (
          <div key={k} className="overview-row">
            <span className="overview-key">{k}</span>
            <div className="overview-val-wrap">
              <span className={`overview-val ${k === 'Status' ? 'ov-status' : ''}`}>
                {k === 'Status' ? <StatusBadge status={v} /> : v}
              </span>
              {k === 'ID' && <CopyButton text={v} />}
            </div>
          </div>
        ))}
      </div>

      {instance.game && Object.keys(instance.game).length > 0 && (
        <div className="overview-props">
          <h4 className="overview-section-title">Game Configuration</h4>
          {Object.entries(instance.game).map(([k, v]) => (
            <div key={k} className="overview-row">
              <span className="overview-key">{k}</span>
              <span className="overview-val">{String(v)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ConsoleTab({ instance }) {
  const logs = instance.history || [];
  return (
    <div className="console-wrap">
      <div className="console-log">
        {logs.length === 0 ? (
          <span className="console-empty">No console output yet</span>
        ) : (
          logs.map((line, i) => (
            <div key={i} className="console-line">
              <span className="console-line-num">{i + 1}</span>
              <span>{line}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function FilesTab({ instanceId }) {
  const [path, setPath] = useState('/');
  const { data, loading } = useApi(() => instancesApi.listFiles(instanceId, path), [instanceId, path]);
  const files = data?.files || [];

  return (
    <div className="files-wrap">
      <div className="files-path">
        <Folder size={13} />
        <span>{path}</span>
      </div>
      {loading ? (
        <div className="files-loading"><Spinner /></div>
      ) : files.length === 0 ? (
        <div className="files-empty">Directory is empty</div>
      ) : (
        <div className="files-list">
          {files.map((f, i) => (
            <div key={i} className="file-row" onClick={() => f.type === 'directory' && setPath(f.path)}>
              <span className="file-icon">{f.type === 'directory' ? '📁' : '📄'}</span>
              <span className="file-name">{f.name}</span>
              <span className="file-size">{f.size ?? ''}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BackupsTab({ instanceId }) {
  const { data: inst } = useApi(() => instancesApi.get(instanceId), [instanceId]);
  const createBackup = useAction(() => instancesApi.backup(instanceId));

  return (
    <div className="backups-wrap">
      <div className="backups-header">
        <Button size="sm" variant="secondary" icon={HardDrive} onClick={createBackup.execute} loading={createBackup.loading}>
          Create Backup
        </Button>
      </div>
      <div className="backups-empty">No backups available</div>
    </div>
  );
}

function NetworkTab({ instance }) {
  const { data, loading, refetch } = useApi(() => instancesApi.listLinks(instance.id), [instance.id]);
  const remapPort = useAction(async () => { await instancesApi.remapPort(instance.id); refetch(); });
  const links = data?.links || [];

  return (
    <div className="network-wrap">
      <div className="network-header">
        <div className="network-info-row">
          <span className="network-label">Game Port</span>
          <code className="network-port">{instance.port || '—'}</code>
          <Button size="sm" variant="ghost" onClick={remapPort.execute} loading={remapPort.loading}>Remap</Button>
        </div>
      </div>
      <div className="network-links">
        <h4 className="network-section-title">Access Links</h4>
        {links.length === 0 ? (
          <div className="network-empty">No links configured</div>
        ) : (
          links.map(l => (
            <div key={l.id} className="link-row">
              <span className="link-name">{l.name}</span>
              <span className="link-url">{l.url}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function ServerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  const { data, loading, refetch } = useApi(() => instancesApi.get(id), [id]);
  const instance = data?.instance;

  const runAction = useAction(async (fn) => { await fn(); refetch(); });

  if (loading) return (
    <Layout breadcrumbs={['Servers', '...']}>
      <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
        <Spinner size={24} />
      </div>
    </Layout>
  );

  if (!instance) return (
    <Layout breadcrumbs={['Servers', 'Not Found']}>
      <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
        Server not found
      </div>
    </Layout>
  );

  const isRunning = instance.status === 'running';

  return (
    <Layout breadcrumbs={['Servers', instance.name]}>
      <div className="server-details">
        <div className="server-details-header">
          <button className="back-btn" onClick={() => navigate('/servers')}>
            <ArrowLeft size={14} />
          </button>
          <div className="server-details-meta">
            <h1 className="server-details-title">{instance.name}</h1>
            <StatusBadge status={instance.status || 'stopped'} />
            <span className="server-details-game">{GAME_LABELS[instance.type] || instance.type}</span>
          </div>
          <div className="server-details-actions">
            {!isRunning && (
              <Button icon={Play} size="sm" onClick={() => runAction.execute(() => instancesApi.run(id))}>
                Start
              </Button>
            )}
            {isRunning && (
              <Button icon={Square} variant="danger" size="sm" onClick={() => runAction.execute(() => instancesApi.stop(id))}>
                Stop
              </Button>
            )}
            <Button icon={RotateCcw} variant="secondary" size="sm" onClick={() => runAction.execute(() => instancesApi.restart(id))}>
              Restart
            </Button>
            <Button icon={Trash2} variant="ghost" size="sm" onClick={async () => {
              await instancesApi.delete(id);
              navigate('/servers');
            }}>
            </Button>
          </div>
        </div>

        <div className="server-tabs">
          {TABS.map(({ id: tid, label, icon: Icon }) => (
            <button
              key={tid}
              className={`server-tab ${tab === tid ? 'tab-active' : ''}`}
              onClick={() => setTab(tid)}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>

        <div className="server-tab-content">
          {tab === 'overview' && <Card><OverviewTab instance={instance} /></Card>}
          {tab === 'console'  && <Card padding={false}><ConsoleTab instance={instance} /></Card>}
          {tab === 'files'    && <Card><FilesTab instanceId={id} /></Card>}
          {tab === 'backups'  && <Card><BackupsTab instanceId={id} /></Card>}
          {tab === 'env'      && <Card>
            <CardHeader title="Environment Variables" subtitle="These override the default game configuration" />
            <div className="env-empty">No environment variables set</div>
          </Card>}
          {tab === 'network'  && <Card><NetworkTab instance={instance} /></Card>}
        </div>
      </div>
    </Layout>
  );
}
