import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Play, Square, RotateCcw, Trash2, Terminal, Folder, HardDrive,
  Network, Variable, ArrowLeft, RefreshCw, Copy, Check, Save,
  FileText, FilePlus, FolderPlus, Upload, Download, ChevronRight, X,
} from 'lucide-react';
import Layout from '../../components/Layout/Layout.jsx';
import Card, { CardHeader } from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Input, { Select } from '../../components/ui/Input.jsx';
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

const INSTANCE_FIELDS = [
  { key: 'name',       label: 'Server Name',  type: 'text',   min: 3,   max: 32  },
  { key: 'memory',     label: 'Memory (MB)',  type: 'number', min: 512, step: 256 },
  { key: 'cpu',        label: 'CPU Cores',    type: 'number', min: 1            },
  { key: 'maxPlayers', label: 'Max Players',  type: 'number', min: 1,   max: 1000 },
];

const GAME_FIELDS = {
  minecraft: {
    fields: [
      { key: 'software',     label: 'Software',      type: 'select', options: ['vanilla', 'paper', 'purpur'] },
      { key: 'gamemode',     label: 'Gamemode',      type: 'select', options: ['survival', 'creative', 'adventure'] },
      { key: 'difficulty',   label: 'Difficulty',    type: 'select', options: ['peaceful', 'easy', 'normal', 'hard'] },
      { key: 'levelType',    label: 'Level Type',    type: 'select', options: ['minecraft:normal', 'minecraft:flat', 'minecraft:large_biomes', 'minecraft:amplified'] },
      { key: 'motd',         label: 'MOTD',          type: 'text'  },
      { key: 'seed',         label: 'Seed',          type: 'text'  },
      { key: 'viewDistance', label: 'View Distance', type: 'number', min: 3,  max: 32   },
      { key: 'spawn',        label: 'Spawn Radius',  type: 'number', min: 0,  max: 32   },
      { key: 'idle',         label: 'Idle Timeout',  type: 'number', min: 0,  max: 1440 },
    ],
    toggles: [
      ['pvp',           'PvP'],
      ['licensed',      'Online Mode (Licensed)'],
      ['allowlist',     'Allowlist'],
      ['nether',        'Nether'],
      ['commandBlock',  'Command Blocks'],
      ['bedrock',       'Bedrock (Geyser)'],
      ['hardcore',      'Hardcore'],
      ['secureProfile', 'Secure Profile'],
      ['forceGamemode', 'Force Gamemode'],
      ['animals',       'Animals'],
      ['monsters',      'Monsters'],
      ['npcs',          'NPCs'],
      ['cheats',        'Cheats'],
    ],
  },
  counterstrike: {
    fields: [
      { key: 'servername',   label: 'Server Name',    type: 'text'  },
      { key: 'steamToken',   label: 'Steam Token',    type: 'text'  },
      { key: 'password',     label: 'Password',       type: 'text'  },
      { key: 'rconPassword', label: 'RCON Password',  type: 'text'  },
      { key: 'mode',         label: 'Mode',           type: 'select', options: ['casual', 'competitive', 'wingman', 'deathmatch'] },
      { key: 'map',          label: 'Map',            type: 'select', options: ['mirage', 'dust2', 'inferno', 'nuke', 'overpass', 'vertigo', 'ancient', 'anubis', 'officie', 'italy', 'lake', 'thistle', 'assembly', 'memento'] },
      { key: 'botMode',      label: 'Bot Mode',       type: 'select', options: ['fill', 'normal'] },
      { key: 'botDifficulty',label: 'Bot Difficulty', type: 'number', min: 0, max: 3  },
      { key: 'botQuota',     label: 'Bot Quota',      type: 'number', min: 0, max: 20 },
    ],
    toggles: [],
  },
  terraria: {
    fields: [
      { key: 'difficulty', label: 'Difficulty', type: 'select', options: [
        { value: 0, label: 'Classic' },
        { value: 1, label: 'Expert'  },
        { value: 2, label: 'Master'  },
        { value: 3, label: 'Journey' },
      ]},
      { key: 'password', label: 'Password', type: 'text' },
      { key: 'motd',     label: 'MOTD',     type: 'text' },
    ],
    toggles: [],
  },
  kerbal: {
    fields: [
      { key: 'servername', label: 'Server Name', type: 'text'   },
      { key: 'gamemode',   label: 'Gamemode',    type: 'select', options: ['SANDBOX', 'SCIENCE', 'CARRER'] },
      { key: 'difficulty', label: 'Difficulty',  type: 'select', options: ['EASY', 'NORMAL', 'MODERATE', 'HARD', 'CUSTOM'] },
      { key: 'warp',       label: 'Warp',        type: 'select', options: ['MCW_FORCE', 'MCW_VOTE', 'MCW_LOWEST', 'SUBSPACE_SIMPLE', 'SUBSPACE', 'NONE'] },
    ],
    toggles: [
      ['allowlist', 'Allowlist'],
      ['cheats',    'Cheats'],
    ],
  },
  hytale: {
    fields: [
      { key: 'servername', label: 'Server Name', type: 'text'   },
      { key: 'motd',       label: 'MOTD',        type: 'text'   },
      { key: 'password',   label: 'Password',    type: 'text'   },
      { key: 'worldname',  label: 'World Name',  type: 'text'   },
      { key: 'gamemode',   label: 'Gamemode',    type: 'select', options: ['adventure', 'creative'] },
      { key: 'maxView',    label: 'Max View',    type: 'number', min: 3, max: 100 },
    ],
    toggles: [],
  },
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

      {instance[instance.type] && Object.keys(instance[instance.type]).length > 0 && (
        <div className="overview-props">
          <h4 className="overview-section-title">Game Configuration</h4>
          {Object.entries(instance[instance.type])
            .filter(([k]) => !['id', 'instanceId', 'createdAt', 'updatedAt'].includes(k))
            .map(([k, v]) => (
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
  const [path, setPath] = useState('');
  const [editFile, setEditFile] = useState(null); // { path, content }
  const [showCreate, setShowCreate] = useState(null); // 'file' | 'folder'
  const [createName, setCreateName] = useState('');
  const [createContent, setCreateContent] = useState('');
  const [opError, setOpError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const uploadRef = useRef(null);

  const { data, loading, refetch } = useApi(
    () => instancesApi.listFiles(instanceId, path),
    [instanceId, path],
  );

  const entries = [...(data?.content || [])].sort((a, b) => {
    if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  const segments = path.split('/').filter(Boolean);
  const join = (name) => path ? `${path}/${name}` : name;

  const navigateTo = (newPath) => {
    setPath(newPath);
    setOpError(null);
  };

  const openEntry = async (entry) => {
    setOpError(null);
    if (entry.type === 'directory') {
      navigateTo(join(entry.name));
    } else {
      try {
        const res = await instancesApi.listFiles(instanceId, join(entry.name));
        setEditFile({ path: join(entry.name), content: res.content ?? '' });
      } catch (err) {
        setOpError(err.message || 'Failed to open file');
      }
    }
  };

  const deleteEntry = async (e, entry) => {
    e.stopPropagation();
    setOpError(null);
    try {
      await instancesApi.deleteFile(instanceId, join(entry.name));
      refetch();
    } catch (err) {
      setOpError(err.message || 'Failed to delete');
    }
  };

  const downloadEntry = (e, entry) => {
    e.stopPropagation();
    window.open(instancesApi.downloadUrl(instanceId, join(entry.name)), '_blank');
  };

  const saveEdit = async () => {
    setSaving(true);
    setOpError(null);
    try {
      await instancesApi.updateFile(instanceId, editFile.content, editFile.path);
    } catch (err) {
      setOpError(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const doCreate = async () => {
    if (!createName.trim()) return;
    setCreating(true);
    setOpError(null);
    try {
      const destiny = join(createName.trim());
      const body = showCreate === 'file'
        ? { type: 'file', content: createContent }
        : { type: 'directory' };
      await instancesApi.createFile(instanceId, body, destiny);
      setShowCreate(null);
      setCreateName('');
      setCreateContent('');
      refetch();
    } catch (err) {
      setOpError(err.message || 'Failed to create');
    } finally {
      setCreating(false);
    }
  };

  const doUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOpError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      await instancesApi.uploadFile(instanceId, formData, join(file.name));
      refetch();
    } catch (err) {
      setOpError(err.message || 'Upload failed');
    } finally {
      e.target.value = '';
    }
  };

  // ── Editor view ──────────────────────────────────────────────────────────
  if (editFile) {
    return (
      <div className="files-wrap">
        <div className="files-toolbar">
          <button className="files-nav-btn" onClick={() => { setEditFile(null); setOpError(null); }}>
            <ArrowLeft size={14} />
          </button>
          <span className="files-edit-name">{editFile.path.split('/').pop()}</span>
          <div style={{ flex: 1 }} />
          {opError && <span className="files-error-inline">{opError}</span>}
          <Button size="sm" icon={Save} loading={saving} onClick={saveEdit}>Save</Button>
        </div>
        <textarea
          className="files-editor"
          value={editFile.content}
          onChange={e => setEditFile(f => ({ ...f, content: e.target.value }))}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
        />
      </div>
    );
  }

  // ── Directory listing ────────────────────────────────────────────────────
  return (
    <div className="files-wrap">
      <div className="files-toolbar">
        <div className="files-breadcrumb">
          <button className="files-crumb" onClick={() => navigateTo('')}>/</button>
          {segments.map((seg, i) => (
            <React.Fragment key={i}>
              <ChevronRight size={11} className="files-crumb-sep" />
              <button
                className={`files-crumb ${i === segments.length - 1 ? 'files-crumb-current' : ''}`}
                onClick={() => navigateTo(segments.slice(0, i + 1).join('/'))}
              >
                {seg}
              </button>
            </React.Fragment>
          ))}
        </div>
        <div className="files-toolbar-actions">
          <button className="files-icon-btn" title="New File" onClick={() => { setShowCreate('file'); setCreateName(''); setCreateContent(''); setOpError(null); }}>
            <FilePlus size={14} />
          </button>
          <button className="files-icon-btn" title="New Folder" onClick={() => { setShowCreate('folder'); setCreateName(''); setOpError(null); }}>
            <FolderPlus size={14} />
          </button>
          <button className="files-icon-btn" title="Upload" onClick={() => uploadRef.current?.click()}>
            <Upload size={14} />
          </button>
          <button className="files-icon-btn" title="Refresh" onClick={refetch}>
            <RefreshCw size={14} />
          </button>
          <input ref={uploadRef} type="file" style={{ display: 'none' }} onChange={doUpload} />
        </div>
      </div>

      {opError && <div className="files-op-error">{opError}</div>}

      {loading ? (
        <div className="files-loading"><Spinner /></div>
      ) : entries.length === 0 ? (
        <div className="files-empty">This directory is empty</div>
      ) : (
        <div className="files-list">
          {entries.map(entry => (
            <div key={entry.name} className="file-row" onClick={() => openEntry(entry)}>
              <span className={`file-icon ${entry.type === 'directory' ? 'file-icon-dir' : ''}`}>
                {entry.type === 'directory' ? <Folder size={15} /> : <FileText size={15} />}
              </span>
              <span className="file-name">{entry.name}</span>
              <span className="file-row-actions">
                <button className="files-icon-btn" title="Download" onClick={e => downloadEntry(e, entry)}>
                  <Download size={13} />
                </button>
                <button className="files-icon-btn files-icon-danger" title="Delete" onClick={e => deleteEntry(e, entry)}>
                  <Trash2 size={13} />
                </button>
              </span>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="files-overlay" onClick={() => setShowCreate(null)}>
          <div className="files-dialog" onClick={e => e.stopPropagation()}>
            <div className="files-dialog-header">
              <span className="files-dialog-title">{showCreate === 'file' ? 'New File' : 'New Folder'}</span>
              <button className="files-dialog-close" onClick={() => setShowCreate(null)}><X size={14} /></button>
            </div>
            <div className="files-dialog-body">
              <Input
                label="Name"
                placeholder={showCreate === 'file' ? 'config.yml' : 'my-folder'}
                value={createName}
                onChange={e => setCreateName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && doCreate()}
                autoFocus
              />
              {showCreate === 'file' && (
                <div className="ui-input-wrap">
                  <label className="ui-input-label">Content (optional)</label>
                  <div className="ui-input-field">
                    <textarea
                      className="ui-input ui-textarea"
                      value={createContent}
                      onChange={e => setCreateContent(e.target.value)}
                      style={{ minHeight: 80, resize: 'vertical' }}
                    />
                  </div>
                </div>
              )}
              {opError && <span className="files-error-inline">{opError}</span>}
            </div>
            <div className="files-dialog-footer">
              <Button variant="secondary" size="sm" onClick={() => setShowCreate(null)}>Cancel</Button>
              <Button size="sm" loading={creating} onClick={doCreate}>Create</Button>
            </div>
          </div>
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

function VariablesTab({ instance, onSaved }) {
  const [inst, setInst] = useState({
    name:       instance.name       ?? '',
    memory:     instance.memory     ?? 1024,
    cpu:        instance.cpu        ?? 1,
    maxPlayers: instance.maxPlayers ?? 20,
  });
  const [game, setGame] = useState({ ...(instance[instance.type] || {}) });
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    setInst({
      name:       instance.name       ?? '',
      memory:     instance.memory     ?? 1024,
      cpu:        instance.cpu        ?? 1,
      maxPlayers: instance.maxPlayers ?? 20,
    });
    setGame({ ...(instance[instance.type] || {}) });
  }, [instance.id]);

  const setI = (k, v) => setInst(f => ({ ...f, [k]: v }));
  const setG = (k, v) => setGame(f => ({ ...f, [k]: v }));

  const { execute: save, loading } = useAction(async () => {
    setSaved(false);
    setSaveError(null);
    try {
      await instancesApi.update(instance.id, {
        name:       inst.name,
        memory:     Number(inst.memory),
        cpu:        Number(inst.cpu),
        maxPlayers: Number(inst.maxPlayers),
        type:       instance.type,
        game,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      onSaved?.();
    } catch (err) {
      setSaveError(err.message || 'Failed to save');
    }
  });

  const gameCfg = GAME_FIELDS[instance.type] || { fields: [], toggles: [] };
  const gameLabel = GAME_LABELS[instance.type] || instance.type;

  const renderField = (f, value, onChange) => {
    if (f.type === 'select') {
      const opts = f.options || [];
      return (
        <Select key={f.key} label={f.label} value={value ?? ''} onChange={e => {
          const raw = e.target.value;
          const isNumOpts = opts.length > 0 && typeof opts[0] === 'object' && typeof opts[0].value === 'number';
          onChange(isNumOpts ? Number(raw) : raw);
        }}>
          {opts.map(o =>
            typeof o === 'string'
              ? <option key={o} value={o}>{o}</option>
              : <option key={o.value} value={o.value}>{o.label}</option>
          )}
        </Select>
      );
    }
    return (
      <Input
        key={f.key}
        label={f.label}
        type={f.type}
        min={f.min}
        max={f.max}
        step={f.step}
        value={value ?? ''}
        onChange={e => onChange(f.type === 'number' ? e.target.value : e.target.value)}
      />
    );
  };

  return (
    <div className="vars-wrap">
      <div className="vars-section">
        <h4 className="vars-section-title">Instance</h4>
        <div className="vars-grid">
          {INSTANCE_FIELDS.map(f => renderField(f, inst[f.key], v => setI(f.key, v)))}
        </div>
      </div>

      {gameCfg.fields.length > 0 && (
        <div className="vars-section">
          <h4 className="vars-section-title">{gameLabel} Settings</h4>
          <div className="vars-grid">
            {gameCfg.fields.map(f => renderField(f, game[f.key], v => setG(f.key, v)))}
          </div>
        </div>
      )}

      {gameCfg.toggles.length > 0 && (
        <div className="vars-section">
          <h4 className="vars-section-title">Toggles</h4>
          <div className="vars-toggles">
            {gameCfg.toggles.map(([key, label]) => (
              <label key={key} className="create-toggle">
                <input
                  type="checkbox"
                  checked={!!game[key]}
                  onChange={e => setG(key, e.target.checked)}
                />
                <span className="toggle-track" />
                <span className="toggle-label">{label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="vars-footer">
        {saveError && <span className="vars-error">{saveError}</span>}
        {saved && <span className="vars-saved">Saved</span>}
        <Button icon={Save} loading={loading} onClick={save}>Save Changes</Button>
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

  if (loading && !instance) return (
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
          {tab === 'env'      && <Card><VariablesTab instance={instance} onSaved={refetch} /></Card>}
          {tab === 'network'  && <Card><NetworkTab instance={instance} /></Card>}
        </div>
      </div>
    </Layout>
  );
}
