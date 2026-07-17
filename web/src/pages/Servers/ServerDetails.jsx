import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Play, Square, RotateCcw, Trash2, Terminal, Folder, HardDrive,
  Network, Variable, ArrowLeft, RefreshCw, Copy, Check, Save,
  FileText, FilePlus, FolderPlus, Upload, Download, ChevronRight, X,
  Plus, Edit2, Users, Scissors, Archive, Gamepad2, Coffee, Smartphone, Signal,
  Shield, ArrowRight, AlertTriangle,
} from 'lucide-react';
import Layout from '../../components/Layout/Layout.jsx';
import Card, { CardHeader } from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Input, { Select } from '../../components/ui/Input.jsx';
import { StatusBadge } from '../../components/ui/Badge.jsx';
import { useApi, useAction } from '../../hooks/useApi.js';
import { instancesApi } from '../../api/instances.js';
import { usersApi } from '../../api/users.js';
import { workersApi } from '../../api/workers.js';
import { useAuth } from '../../context/AuthContext.jsx';
import ConfirmDelete from '../../components/ui/ConfirmDelete.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import './ServerDetails.css';

const TABS = [
  { id: 'overview',  label: 'Overview',   icon: RefreshCw  },
  { id: 'console',   label: 'Console',    icon: Terminal   },
  { id: 'files',     label: 'Files',      icon: Folder     },
  { id: 'backups',   label: 'Backups',    icon: HardDrive  },
  { id: 'env',       label: 'Variables',  icon: Variable   },
  { id: 'connect',   label: 'Connect',    icon: Gamepad2   },
  { id: 'players',   label: 'Players',    icon: Users      },
];

// Admin-only tab, appended to TABS only when the current user is an admin.
const ADMIN_TAB = { id: 'admin', label: 'Admin', icon: Shield };

const PERMISSION_GROUPS = [
  {
    label: 'General',
    perms: [
      { id: 'instance:read',    label: 'View'    },
      { id: 'instance:edit',    label: 'Edit'    },
      { id: 'instance:execute', label: 'Execute' },
      { id: 'instance:backup',  label: 'Backup'  },
    ],
  },
  {
    label: 'Console',
    perms: [
      { id: 'instance:console:read',  label: 'Read' },
      { id: 'instance:console:write', label: 'Send' },
    ],
  },
  {
    label: 'Files',
    perms: [
      { id: 'instance:files:read',  label: 'Read'          },
      { id: 'instance:files:edit',  label: 'Edit content'  },
      { id: 'instance:files:write', label: 'Create/delete' },
    ],
  },
];

// Each permission's prerequisites (flattened to include transitive deps).
// Checking a permission auto-adds these; unchecking a prerequisite cascades
// removal to everything that depends on it.
const PERMISSION_DEPS = {
  'instance:edit':          ['instance:read'],
  'instance:execute':       ['instance:read'],
  'instance:backup':        ['instance:read'],
  'instance:console:read':  ['instance:read'],
  'instance:console:write': ['instance:read', 'instance:console:read'],
  'instance:files:read':    ['instance:read'],
  'instance:files:write':   ['instance:read', 'instance:files:read', 'instance:files:edit'],
  'instance:files:edit':    ['instance:read', 'instance:files:read'],
};

const ACCESS_OPTS = [
  { value: 'always',    label: 'Always',    desc: 'Always allowed to join'              },
  { value: 'super',     label: 'Super',     desc: 'Always + enables Monitored users'    },
  { value: 'monitored', label: 'Monitored', desc: 'Only when a Super user is online'    },
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

// Admin-only control to reassign the instance to another user.
function OwnerTransfer({ instance, onChanged }) {
  const { data: usersData } = useApi(() => usersApi.list(), []);
  const users = usersData?.users || [];
  const [selected, setSelected] = useState('');
  const [confirming, setConfirming] = useState(false);

  const isRunning = instance.status === 'running';
  const currentOwner = users.find(u => u.id === instance.owner);
  const target = users.find(u => u.id === selected);
  const staged = !!selected && selected !== instance.owner;

  const transfer = useAction(async () => {
    if (!staged) return;
    await instancesApi.transferOwner(instance.id, selected);
    setConfirming(false);
    setSelected('');
    if (onChanged) onChanged();
  });

  return (
    <section className="admin-panel">
      <div className="admin-panel-head">
        <span className="admin-panel-eyebrow">Ownership</span>
        <p className="admin-panel-desc">Who this server is billed to and fully controls.</p>
      </div>

      <div className={`admin-move ${staged ? 'is-staged' : ''}`}>
        <span className="admin-move-label admin-slot-a admin-row-label">Current</span>
        <div className="admin-chip admin-slot-a admin-row-control">
          <span className="admin-chip-name">{currentOwner?.name || 'Unknown'}</span>
          <span className="admin-chip-sub">{currentOwner?.email || instance.owner}</span>
        </div>

        <ArrowRight className="admin-arrow" size={16} />

        <span className="admin-move-label admin-slot-b admin-row-label">New owner</span>
        <Select
          className="admin-select admin-slot-b admin-row-control"
          value={selected}
          disabled={isRunning}
          onChange={e => { setSelected(e.target.value); setConfirming(false); }}
        >
          <option value="">Select a user…</option>
          {users.filter(u => u.id !== instance.owner).map(u => (
            <option key={u.id} value={u.id}>{u.name} — {u.email}</option>
          ))}
        </Select>
      </div>

      {isRunning && (
        <p className="admin-note admin-note-error">Stop the server before transferring ownership.</p>
      )}
      {transfer.error && (
        <p className="admin-note admin-note-error">{transfer.error.message || 'Transfer failed'}</p>
      )}

      <div className="admin-panel-foot">
        {!confirming ? (
          <Button size="sm" variant="secondary" disabled={isRunning || !staged} onClick={() => setConfirming(true)}>
            Transfer ownership
          </Button>
        ) : (
          <div className="admin-confirm">
            <span className="admin-confirm-q">Give this server to <b>{target?.name}</b>?</span>
            <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>Cancel</Button>
            <Button size="sm" variant="danger" loading={transfer.loading} onClick={transfer.execute}>
              Transfer
            </Button>
          </div>
        )}
      </div>
    </section>
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

// Admin-only control to reassign the instance to a different worker or detach it.
function WorkerAssign({ instance, onChanged }) {
  const { data: workersData } = useApi(() => workersApi.list(), []);
  const workers = workersData?.workers || [];
  // '' represents "no worker" (detach); otherwise a worker id.
  const [selected, setSelected] = useState(instance.workerId || '');
  const [confirming, setConfirming] = useState(false);

  const isRunning = instance.status === 'running';
  const current = workers.find(w => w.id === instance.workerId);
  const dirty = (selected || null) !== (instance.workerId || null);

  const change = useAction(async () => {
    await instancesApi.changeWorker(instance.id, selected || null);
    setConfirming(false);
    if (onChanged) onChanged();
  });

  const target = workers.find(w => w.id === selected);

  return (
    <section className="admin-panel">
      <div className="admin-panel-head">
        <span className="admin-panel-eyebrow">Placement</span>
        <p className="admin-panel-desc">Which worker machine runs this server.</p>
      </div>

      <div className={`admin-move ${dirty ? 'is-staged' : ''}`}>
        <span className="admin-move-label admin-slot-a admin-row-label">Current</span>
        <div className="admin-chip admin-slot-a admin-row-control">
          {current ? (
            <>
              <span className="admin-chip-name">{current.name}</span>
              <span className="admin-chip-sub">{current.url}</span>
            </>
          ) : (
            <span className="admin-chip-name admin-chip-empty">Not assigned</span>
          )}
        </div>

        <ArrowRight className="admin-arrow" size={16} />

        <span className="admin-move-label admin-slot-b admin-row-label">Target worker</span>
        <Select
          className="admin-select admin-slot-b admin-row-control"
          value={selected}
          disabled={isRunning}
          onChange={e => { setSelected(e.target.value); setConfirming(false); }}
        >
          <option value="">— Detach (no worker) —</option>
          {workers.map(w => (
            <option key={w.id} value={w.id}>{w.name} — {w.url}</option>
          ))}
        </Select>
      </div>

      <p className="admin-note admin-note-warn">
        <AlertTriangle size={14} />
        <span>Data isn't migrated. The server starts fresh on the new worker unless you restore a backup there.</span>
      </p>

      {isRunning && (
        <p className="admin-note admin-note-error">Stop the server before changing its worker.</p>
      )}
      {change.error && (
        <p className="admin-note admin-note-error">{change.error.message || 'Failed to change worker'}</p>
      )}

      <div className="admin-panel-foot">
        {!confirming ? (
          <Button size="sm" variant="secondary" disabled={isRunning || !dirty} onClick={() => setConfirming(true)}>
            {selected ? 'Change worker' : 'Detach worker'}
          </Button>
        ) : (
          <div className="admin-confirm">
            <span className="admin-confirm-q">
              {selected
                ? <>Move to <b>{target?.name}</b>?</>
                : <>Detach from <b>{current?.name || 'its worker'}</b>?</>}
            </span>
            <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>Cancel</Button>
            <Button size="sm" variant="danger" loading={change.loading} onClick={change.execute}>
              {selected ? 'Move' : 'Detach'}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}

// Admin-only tab: instance-level actions reserved for administrators.
function AdminTab({ instance, onOwnerChanged }) {
  return (
    <div className="admin-tab">
      <header className="admin-banner">
        <span className="admin-banner-badge"><Shield size={15} /></span>
        <div className="admin-banner-text">
          <h3 className="admin-banner-title">Administrative controls</h3>
          <p className="admin-banner-desc">
            Reassignments available to admins only. Changes apply immediately, and the
            server must be stopped first.
          </p>
        </div>
      </header>

      <OwnerTransfer instance={instance} onChanged={onOwnerChanged} />
      <WorkerAssign instance={instance} onChanged={onOwnerChanged} />
    </div>
  );
}

function ConsoleTab({ instance }) {
  const [lines, setLines] = useState(instance.history || []);
  const [command, setCommand] = useState('');
  const [connected, setConnected] = useState(false);
  const [canWrite, setCanWrite] = useState(false);
  const [error, setError] = useState(null);
  const socketRef = useRef(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    let socket;

    const connect = async () => {
      try {
        const { token, workerUrl, permissions } = await instancesApi.consoleToken(instance.id);
        setCanWrite((permissions || []).includes('console:write'));

        // workerUrl may include a path prefix (e.g. https://host/worker) used by
        // the nginx reverse proxy. A path in the io() URL would be treated as a
        // Socket.IO namespace, not an HTTP path, so connect to the origin and
        // pass the prefix through the `path` option instead.
        const parsed = new URL(workerUrl);
        const prefix = parsed.pathname.replace(/\/+$/, '');

        // Start with HTTP long-polling (works through any proxy that forwards
        // plain HTTP) and let Socket.IO upgrade to WebSocket when the proxy
        // supports the Upgrade handshake. Websocket-only would hang/timeout
        // behind a proxy that doesn't upgrade (e.g. missing nginx Upgrade
        // headers on the worker's /socket.io/ location).
        socket = io(parsed.origin, {
          auth: { token },
          transports: ['polling', 'websocket'],
          path: `${prefix}/socket.io/`,
        });
        socketRef.current = socket;

        socket.on('connect', () => {
          setConnected(true);
          setError(null);
          socket.emit('join-console', { instanceId: instance.id });
        });

        socket.on('disconnect', () => setConnected(false));

        socket.on('connect_error', (err) => {
          setError(err.message || 'Connection failed');
          setConnected(false);
        });

        socket.on('instance-output', (line) => {
          setLines((prev) => [...prev, line]);
        });
      } catch (err) {
        setError(err.message || 'Failed to get console token');
      }
    };

    connect();

    return () => {
      socket?.disconnect();
      socketRef.current = null;
    };
  }, [instance.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  const sendCommand = () => {
    const cmd = command.trim();
    if (!cmd || !canWrite || !socketRef.current?.connected) return;
    socketRef.current.emit('send-command', { instanceId: instance.id, command: cmd });
    setLines((prev) => [...prev, `> ${cmd}`]);
    setCommand('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') sendCommand();
  };

  return (
    <div className="console-wrap">
      <div className="console-status-bar">
        <span className={`console-status-dot ${connected ? 'console-status-ok' : 'console-status-off'}`} />
        <span className="console-status-label">{connected ? 'Connected' : 'Disconnected'}</span>
        {error && <span className="console-status-error">{error}</span>}
      </div>
      <div className="console-log" onClick={() => inputRef.current?.focus()}>
        {lines.length === 0 ? (
          <span className="console-empty">No console output yet</span>
        ) : (
          lines.map((line, i) => (
            <div key={i} className="console-line">
              <span className="console-line-num">{i + 1}</span>
              <span>{line}</span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
      {canWrite ? (
        <div className="console-input-row">
          <span className="console-prompt">&gt;</span>
          <input
            ref={inputRef}
            className="console-input"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter command..."
            disabled={!connected}
            autoComplete="off"
            spellCheck={false}
          />
          <button className="console-send-btn" onClick={sendCommand} disabled={!connected}>
            Send
          </button>
        </div>
      ) : (
        <div className="console-readonly-note">Read-only — you don&apos;t have permission to send commands.</div>
      )}
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
  const [actionDialog, setActionDialog] = useState(null); // { type: 'copy'|'move'|'unzip', entry }
  const [actionDest, setActionDest] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [upload, setUpload] = useState(null); // { name, percent }
  const uploadRef = useRef(null);

  const { data, loading, refetch } = useApi(
    () => instancesApi.listFiles(instanceId, path),
    [instanceId, path],
  );

  const { data: permData } = useApi(() => instancesApi.getPermissions(instanceId), [instanceId]);
  const perms = permData?.permissions || [];
  const canRead = perms.includes('instance:files:read');
  const canWrite = perms.includes('instance:files:write'); // create / upload / delete / move / unzip
  // write implies edit — anyone who can create/delete files can also modify contents
  const canEdit = perms.includes('instance:files:edit') || canWrite;

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
    if (!canWrite) return;
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
    if (!canEdit) return;
    setSaving(true);
    setOpError(null);
    try {
      await instancesApi.updateFile(instanceId, editFile.content, editFile.path);
      setEditFile(null); // return to the directory listing
      refetch();
    } catch (err) {
      setOpError(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const doCreate = async () => {
    if (!canWrite || !createName.trim()) return;
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
    if (!canWrite || !file) return;
    setOpError(null);
    setUpload({ name: file.name, percent: 0 });
    try {
      const formData = new FormData();
      formData.append('file', file);
      await instancesApi.uploadFile(instanceId, formData, join(file.name), (percent) => {
        setUpload({ name: file.name, percent });
      });
      refetch();
    } catch (err) {
      setOpError(err.message || 'Upload failed');
    } finally {
      setUpload(null);
      e.target.value = '';
    }
  };

  const openActionDialog = (type, entry) => {
    const defaultDest = type === 'unzip'
      ? join(entry.name.replace(/\.zip$/i, ''))
      : join(entry.name);
    setActionDialog({ type, entry });
    setActionDest(defaultDest);
    setOpError(null);
  };

  const doAction = async () => {
    if (!actionDialog || !canWrite) return;
    setActionLoading(true);
    setOpError(null);
    try {
      const src = join(actionDialog.entry.name);
      if (actionDialog.type === 'unzip') {
        await instancesApi.unzipFile(instanceId, src, actionDest);
      } else {
        await instancesApi.transferFile(instanceId, src, actionDest, actionDialog.type);
      }
      setActionDialog(null);
      refetch();
    } catch (err) {
      setOpError(err.message || 'Operation failed');
    } finally {
      setActionLoading(false);
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
          {!canEdit && <span className="files-edit-readonly">read-only</span>}
          <div style={{ flex: 1 }} />
          {opError && <span className="files-error-inline">{opError}</span>}
          {canEdit && <Button size="sm" icon={Save} loading={saving} onClick={saveEdit}>Save</Button>}
        </div>
        <textarea
          className="files-editor"
          value={editFile.content}
          onChange={e => setEditFile(f => ({ ...f, content: e.target.value }))}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          readOnly={!canEdit}
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
          {canWrite && (
            <>
              <button className="files-icon-btn" title="New File" onClick={() => { setShowCreate('file'); setCreateName(''); setCreateContent(''); setOpError(null); }}>
                <FilePlus size={14} />
              </button>
              <button className="files-icon-btn" title="New Folder" onClick={() => { setShowCreate('folder'); setCreateName(''); setOpError(null); }}>
                <FolderPlus size={14} />
              </button>
              <button className="files-icon-btn" title="Upload" disabled={!!upload} onClick={() => uploadRef.current?.click()}>
                <Upload size={14} />
              </button>
            </>
          )}
          <button className="files-icon-btn" title="Refresh" onClick={refetch}>
            <RefreshCw size={14} />
          </button>
          <input ref={uploadRef} type="file" style={{ display: 'none' }} onChange={doUpload} />
        </div>
      </div>

      {upload && (
        <div className="files-upload-status">
          <div className="files-upload-head">
            <span className="files-upload-name">
              <Upload size={12} /> {upload.name}
            </span>
            <span className="files-upload-pct">
              {upload.percent < 100 ? `${upload.percent}%` : 'Finishing…'}
            </span>
          </div>
          <div className="files-upload-track">
            <div className="files-upload-fill" style={{ width: `${upload.percent}%` }} />
          </div>
        </div>
      )}

      {opError && <div className="files-op-error">{opError}</div>}

      {permData && !canRead ? (
        <div className="files-empty">You don&apos;t have permission to view files.</div>
      ) : loading ? (
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
                {canWrite && entry.name.endsWith('.zip') && (
                  <button className="files-icon-btn" title="Extract" onClick={e => { e.stopPropagation(); openActionDialog('unzip', entry); }}>
                    <Archive size={13} />
                  </button>
                )}
                {canWrite && (
                  <button className="files-icon-btn" title="Copy to..." onClick={e => { e.stopPropagation(); openActionDialog('copy', entry); }}>
                    <Copy size={13} />
                  </button>
                )}
                {canWrite && (
                  <button className="files-icon-btn" title="Move to..." onClick={e => { e.stopPropagation(); openActionDialog('move', entry); }}>
                    <Scissors size={13} />
                  </button>
                )}
                <button className="files-icon-btn" title="Download" onClick={e => downloadEntry(e, entry)}>
                  <Download size={13} />
                </button>
                {canWrite && (
                  <button className="files-icon-btn files-icon-danger" title="Delete" onClick={e => deleteEntry(e, entry)}>
                    <Trash2 size={13} />
                  </button>
                )}
              </span>
            </div>
          ))}
        </div>
      )}

      {actionDialog && (
        <div className="files-overlay" onClick={() => setActionDialog(null)}>
          <div className="files-dialog" onClick={e => e.stopPropagation()}>
            <div className="files-dialog-header">
              <span className="files-dialog-title">
                {actionDialog.type === 'copy' ? 'Copy' : actionDialog.type === 'move' ? 'Move' : 'Extract'}&nbsp;
                <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>{actionDialog.entry.name}</span>
              </span>
              <button className="files-dialog-close" onClick={() => setActionDialog(null)}><X size={14} /></button>
            </div>
            <div className="files-dialog-body">
              <Input
                label="Destination path"
                value={actionDest}
                onChange={e => setActionDest(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && doAction()}
                autoFocus
              />
              {opError && <span className="files-error-inline">{opError}</span>}
            </div>
            <div className="files-dialog-footer">
              <Button variant="secondary" size="sm" onClick={() => setActionDialog(null)}>Cancel</Button>
              <Button size="sm" loading={actionLoading} onClick={doAction}>
                {actionDialog.type === 'copy' ? 'Copy here' : actionDialog.type === 'move' ? 'Move here' : 'Extract here'}
              </Button>
            </div>
          </div>
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

const BACKUP_BADGE = { success: 'backup-badge-ok', failed: 'backup-badge-fail', skipped: 'backup-badge-skip' };

const BACKUP_TIMEOUT = 5 * 60 * 1000; // give up watching after 5 min

function BackupsTab({ instance, canBackup, onRefetch }) {
  const [backingUp, setBackingUp] = useState(false);
  const [error, setError] = useState(null);
  const [timedOut, setTimedOut] = useState(false);
  const baselineRef = useRef(null);   // lastBackupAt captured when we triggered
  const pollRef = useRef(null);
  const deadlineRef = useRef(0);

  const stopPolling = () => { clearInterval(pollRef.current); pollRef.current = null; };
  useEffect(() => () => stopPolling(), []);

  // The worker stamps lastBackupAt when a backup finishes (success or failed).
  // Once it moves past our baseline, the backup is done.
  useEffect(() => {
    if (!backingUp) return;
    if (instance.lastBackupAt !== baselineRef.current) {
      setBackingUp(false);
      stopPolling();
    }
  }, [instance.lastBackupAt, backingUp]);

  const startBackup = async () => {
    setError(null);
    setTimedOut(false);
    baselineRef.current = instance.lastBackupAt ?? null;
    try {
      await instancesApi.backup(instance.id);
    } catch (err) {
      setError(err.message || 'Failed to start backup');
      return;
    }
    setBackingUp(true);
    deadlineRef.current = Date.now() + BACKUP_TIMEOUT;
    onRefetch?.();
    pollRef.current = setInterval(() => {
      if (Date.now() > deadlineRef.current) {
        stopPolling();
        setBackingUp(false);
        setTimedOut(true);
        return;
      }
      onRefetch?.();
    }, 3000);
  };

  const formatDate = (iso) => iso
    ? new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
    : null;

  return (
    <div className="backups-wrap">
      <div className="backup-info-card">
        <div className="backup-info-row">
          <span className="backup-info-label">Last backup</span>
          <span className="backup-info-value">
            {instance.lastBackupAt ? formatDate(instance.lastBackupAt) : <span className="backup-info-never">never run</span>}
          </span>
        </div>
        <div className="backup-info-row">
          <span className="backup-info-label">Status</span>
          <span className="backup-info-value">
            {backingUp
              ? <span className="backup-inprogress"><Spinner size={12} /> Backing up…</span>
              : instance.lastBackupStatus
                ? <span className={`backup-badge ${BACKUP_BADGE[instance.lastBackupStatus] || ''}`}>{instance.lastBackupStatus}</span>
                : <span className="backup-info-never">—</span>
            }
          </span>
        </div>
      </div>

      {canBackup && (
        <div className="backups-header">
          <Button
            size="sm"
            variant="secondary"
            icon={HardDrive}
            onClick={startBackup}
            loading={backingUp}
            disabled={backingUp}
          >
            {backingUp ? 'Backing up…' : 'Create Backup'}
          </Button>
        </div>
      )}

      {error && <span className="backup-error">{error}</span>}
      {timedOut && (
        <span className="backup-error">
          Still running after 5 minutes — check the status again shortly.
        </span>
      )}

      <p className="backup-note">
        Backups run automatically at 3:00 AM daily. The last 7 daily and 4 weekly backups are kept.
      </p>
    </div>
  );
}

function LinkDialog({ instanceId, link, onSaved, onClose }) {
  const isEdit = !!link;
  const [userId, setUserId] = useState(link?.userId || '');
  const [lookedUpUser, setLookedUpUser] = useState(link?.user || null);
  const [gamertags, setGamertags] = useState(link?.gamertags || []);
  const [gamertagInput, setGamertagInput] = useState('');
  const [permissions, setPermissions] = useState(link?.permissions || ['instance:read']);
  const [access, setAccess] = useState(link?.access || 'always');
  const [privileges, setPrivileges] = useState(link?.privileges ?? false);
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState(null);

  const { execute: save, loading: saving, error: saveError } = useAction(async () => {
    const body = { gamertags, permissions, access, privileges };
    if (userId.trim()) body.userId = userId.trim();
    if (isEdit) {
      await instancesApi.updateLink(instanceId, link.id, body);
    } else {
      await instancesApi.createLink(instanceId, body);
    }
    onSaved();
  });

  const lookupUser = async () => {
    if (!userId.trim()) return;
    setLookingUp(true);
    setLookupError(null);
    try {
      const res = await usersApi.get(userId.trim());
      setLookedUpUser(res.user);
    } catch {
      setLookupError('User not found');
      setLookedUpUser(null);
    } finally {
      setLookingUp(false);
    }
  };

  const addGamertag = () => {
    const gt = gamertagInput.trim();
    if (!gt || gamertags.includes(gt) || gamertags.length >= 4) return;
    setGamertags(prev => [...prev, gt]);
    setGamertagInput('');
  };

  const togglePermission = (perm) => {
    setPermissions(prev => {
      const set = new Set(prev);
      if (set.has(perm)) {
        // Remove the permission, then drop anything whose prerequisites are no
        // longer all present (cascade), until the set stabilizes.
        set.delete(perm);
        let changed = true;
        while (changed) {
          changed = false;
          for (const p of [...set]) {
            if ((PERMISSION_DEPS[p] || []).some(dep => !set.has(dep))) {
              set.delete(p);
              changed = true;
            }
          }
        }
      } else {
        // Add the permission plus all its prerequisites.
        set.add(perm);
        (PERMISSION_DEPS[perm] || []).forEach(dep => set.add(dep));
      }
      return [...set];
    });
  };

  return (
    <div className="files-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="files-dialog link-dialog">
        <div className="files-dialog-header">
          <span className="files-dialog-title">{isEdit ? 'Edit Access Link' : 'New Access Link'}</span>
          <button className="files-dialog-close" onClick={onClose}><X size={14} /></button>
        </div>

        <div className="files-dialog-body">
          <div className="link-form-field">
            <label className="link-form-label">User ID <span className="link-form-optional">(optional)</span></label>
            <div className="link-form-row">
              <Input
                value={userId}
                onChange={e => { setUserId(e.target.value); setLookedUpUser(null); setLookupError(null); }}
                onKeyDown={e => e.key === 'Enter' && lookupUser()}
                placeholder="Paste user UUID..."
              />
              <Button size="sm" variant="secondary" onClick={lookupUser} loading={lookingUp}>Verify</Button>
            </div>
            {lookupError && <span className="link-form-error">{lookupError}</span>}
            {lookedUpUser && (
              <span className="link-form-user-ok"><Check size={12} /> {lookedUpUser.name} ({lookedUpUser.email})</span>
            )}
          </div>

          <div className="link-form-field">
            <label className="link-form-label">Gamertags <span className="link-form-optional">(up to 4, used for allowlist & OP)</span></label>
            <div className="link-form-row">
              <Input
                value={gamertagInput}
                onChange={e => setGamertagInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addGamertag()}
                placeholder="Type gamertag and press Enter..."
                disabled={gamertags.length >= 4}
              />
              <Button size="sm" variant="secondary" onClick={addGamertag} disabled={gamertags.length >= 4}>Add</Button>
            </div>
            {gamertags.length > 0 && (
              <div className="link-tags">
                {gamertags.map(gt => (
                  <span key={gt} className="link-tag">
                    {gt}
                    <button className="link-tag-rm" onClick={() => setGamertags(prev => prev.filter(g => g !== gt))}>×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="link-form-field">
            <label className="link-form-label">Access Type</label>
            <Select value={access} onChange={e => setAccess(e.target.value)}>
              {ACCESS_OPTS.map(o => (
                <option key={o.value} value={o.value}>{o.label} — {o.desc}</option>
              ))}
            </Select>
          </div>

          <div className="link-form-field">
            <label className="link-form-label">Panel Permissions</label>
            {PERMISSION_GROUPS.map(group => (
              <div key={group.label} className="link-perm-group">
                <span className="link-perm-group-label">{group.label}</span>
                <div className="link-perms">
                  {group.perms.map(({ id: pId, label }) => (
                    <label key={pId} className="link-perm-toggle">
                      <input type="checkbox" checked={permissions.includes(pId)} onChange={() => togglePermission(pId)} />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="link-form-field">
            <label className="link-form-label">Admin</label>
            <label className="link-perm-toggle">
              <input type="checkbox" checked={privileges} onChange={e => setPrivileges(e.target.checked)} />
              Grant OP / admin privileges in-game
            </label>
          </div>

          {saveError && <span className="link-form-error">{saveError}</span>}
        </div>

        <div className="files-dialog-footer">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="sm" loading={saving} onClick={save}>
            {isEdit ? 'Save Changes' : 'Create Link'}
          </Button>
        </div>
      </div>
    </div>
  );
}

const ACCESS_META = {
  super:     { color: 'purple', label: 'Super',     desc: 'Always joins and lets Monitored players in' },
  always:    { color: 'blue',   label: 'Always',    desc: 'Always allowed to join' },
  monitored: { color: 'yellow', label: 'Monitored', desc: 'Joins only while a Super player is online' },
};

function RosterRow({ link, canManage, onEdit, onDelete }) {
  const del = useAction(onDelete);
  const access = ACCESS_META[link.access] || { color: 'gray', label: link.access, desc: '' };
  const name = link.user?.name || 'Anonymous';
  const initial = link.user ? name.charAt(0).toUpperCase() : '∗';
  return (
    <div className="roster-row">
      <div className={`roster-avatar avatar-${access.color}`}>{initial}</div>
      <div className="roster-main">
        <div className="roster-line">
          <span className="roster-name">{name}</span>
          {link.privileges && <span className="roster-op" title="OP / admin in-game">OP</span>}
        </div>
        <span className="roster-meta">
          {link.user ? link.user.email : 'No linked account'}
          {link.gamertags?.length > 0 && <> · {link.gamertags.join(', ')}</>}
        </span>
        {link.permissions?.length > 0 && (
          <div className="roster-perms">
            {link.permissions.map(p => <span key={p} className="roster-perm">{p.replace('instance:', '')}</span>)}
          </div>
        )}
      </div>
      <span className={`roster-access roster-access-${access.color}`} title={access.desc}>{access.label}</span>
      {canManage && (
        <div className="roster-actions">
          <button className="files-icon-btn" onClick={onEdit} title="Edit"><Edit2 size={13} /></button>
          <button className="files-icon-btn files-icon-danger" onClick={del.execute} disabled={del.loading} title="Remove">
            {del.loading ? <Spinner size={13} /> : <Trash2 size={13} />}
          </button>
        </div>
      )}
    </div>
  );
}

// Extract a connectable host from a worker URL (with or without protocol).
function parseHost(url) {
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return url.replace(/^\w+:\/\//, '').split('/')[0].split(':')[0] || null;
  }
}

// Click-anywhere-to-copy value chip with inline confirmation.
function CopyValue({ value, size = 'md' }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };
  const iconSize = size === 'lg' ? 16 : 13;
  return (
    <button
      className={`copy-value copy-value-${size} ${copied ? 'is-copied' : ''}`}
      onClick={copy}
      disabled={!value}
      title="Copy"
    >
      <span className="copy-value-text">{value || '—'}</span>
      <span className="copy-value-icon">
        {copied ? <Check size={iconSize} /> : <Copy size={iconSize} />}
      </span>
    </button>
  );
}

// One edition's connect details, mirroring the field names the game itself uses.
function EditionCard({ icon: Icon, title, fields, steps }) {
  return (
    <div className="edition-card">
      <div className="edition-head"><Icon size={15} /> <span>{title}</span></div>
      <div className="edition-fields">
        {fields.map(([label, val]) => (
          <div className="edition-field" key={label}>
            <span className="edition-field-label">{label}</span>
            <CopyValue value={val} />
          </div>
        ))}
      </div>
      <ol className="join-steps">
        {steps.map((s, i) => <li key={i}>{s}</li>)}
      </ol>
    </div>
  );
}

function ConnectTab({ instance, onRefetch }) {
  const remapPort = useAction(async () => { await instancesApi.remapPort(instance.id); onRefetch?.(); });
  const host = parseHost(instance.worker?.url);
  const port = instance.port;
  const address = host && port ? `${host}:${port}` : null;
  const isMinecraft = instance.type === 'minecraft';
  const bedrock = !!instance.minecraft?.bedrock;
  const live = instance.status === 'running';

  const subParts = [GAME_LABELS[instance.type] || instance.type];
  const software = instance.minecraft?.software;
  if (isMinecraft && software) subParts.push(software.charAt(0).toUpperCase() + software.slice(1));
  if (instance.maxPlayers) subParts.push(`${instance.maxPlayers} slots`);

  if (!host) {
    return (
      <div className="connect-empty">
        <Signal size={26} />
        <h3>No address yet</h3>
        <p>This server isn’t on a worker yet. Once it’s deployed, the connection address shows up here.</p>
      </div>
    );
  }

  return (
    <div className="connect-wrap">
      {/* Signature: a Minecraft-style server-list plate with a live ping */}
      <div className={`server-plate ${live ? 'is-live' : 'is-offline'}`}>
        <div className="plate-status">
          <span className="plate-ping" />
          {live ? 'Live' : 'Offline'}
        </div>
        <div className="plate-id">
          <span className="plate-name">{instance.name}</span>
          <span className="plate-sub">{subParts.join('  ·  ')}</span>
        </div>
        <CopyValue value={address} size="lg" />
      </div>

      {host && !instance.worker?.healthy && (
        <span className="connect-note">This worker is offline right now — players may not be able to reach the server.</span>
      )}

      <div className="join">
        <span className="join-eyebrow">How to join</span>
        <div className="join-cards">
          {isMinecraft ? (
            <>
              <EditionCard
                icon={Coffee}
                title="Java Edition"
                fields={[['Server Address', address]]}
                steps={[
                  <>Open <b>Multiplayer</b>.</>,
                  <>Click <b>Add Server</b>.</>,
                  <>Paste the address, then click <b>Done</b>.</>,
                  <>Double-click the server to join.</>,
                ]}
              />
              {bedrock && (
                <EditionCard
                  icon={Smartphone}
                  title="Bedrock Edition"
                  fields={[['Server Address', host], ['Port', port ? String(port) : '']]}
                  steps={[
                    <>Go to <b>Servers</b> → <b>Add Server</b>.</>,
                    <>Enter any server name.</>,
                    <>Fill in the address and port above.</>,
                    <>Save, then tap the server to join.</>,
                  ]}
                />
              )}
            </>
          ) : (
            <EditionCard
              icon={Gamepad2}
              title={`${GAME_LABELS[instance.type] || 'Direct'} connect`}
              fields={[['Server Address', address]]}
              steps={[<>Add this address in your game client’s server browser to join.</>]}
            />
          )}
        </div>
      </div>

      <div className="connect-footer">
        <span className="connect-footer-text">Need a fresh address? A new port is assigned at random.</span>
        <Button size="sm" variant="ghost" onClick={remapPort.execute} loading={remapPort.loading}>Remap port</Button>
      </div>
    </div>
  );
}

function PlayersTab({ instance, canManage }) {
  const { data, loading, refetch } = useApi(() => instancesApi.listLinks(instance.id), [instance.id]);
  const links = data?.links || [];
  const [dialog, setDialog] = useState(null);

  const onSaved = () => { setDialog(null); refetch(); };
  const onDelete = (linkId) => instancesApi.deleteLink(instance.id, linkId).then(refetch);

  return (
    <div className="players-wrap">
      <div className="players-head">
        <div className="players-head-text">
          <span className="players-title">Player access</span>
          <span className="players-count">
            {links.length === 0 ? 'No players yet' : `${links.length} ${links.length === 1 ? 'player' : 'players'} invited`}
          </span>
        </div>
        {canManage && <Button size="sm" variant="secondary" icon={Plus} onClick={() => setDialog('new')}>Add player</Button>}
      </div>

      {loading ? (
        <div className="players-loading"><Spinner size={18} /></div>
      ) : links.length === 0 ? (
        <div className="players-empty">
          <Users size={26} />
          <h3>No one’s been invited yet</h3>
          <p>Add a player to let them join and choose what they can do on the server.</p>
          {canManage && <Button size="sm" variant="secondary" icon={Plus} onClick={() => setDialog('new')}>Add player</Button>}
        </div>
      ) : (
        <div className="roster">
          {links.map(link => (
            <RosterRow key={link.id} link={link} canManage={canManage} onEdit={() => setDialog(link)} onDelete={() => onDelete(link.id)} />
          ))}
        </div>
      )}

      {dialog && (
        <LinkDialog
          instanceId={instance.id}
          link={dialog === 'new' ? null : dialog}
          onSaved={onSaved}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  );
}

function VariablesTab({ instance, canEdit, onSaved }) {
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
        <Select key={f.key} label={f.label} value={value ?? ''} disabled={!canEdit} onChange={e => {
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
        disabled={!canEdit}
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
                  disabled={!canEdit}
                  onChange={e => setG(key, e.target.checked)}
                />
                <span className="toggle-track" />
                <span className="toggle-label">{label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {canEdit && (
        <div className="vars-footer">
          {saveError && <span className="vars-error">{saveError}</span>}
          {saved && <span className="vars-saved">Saved</span>}
          <Button icon={Save} loading={loading} onClick={save}>Save Changes</Button>
        </div>
      )}
    </div>
  );
}

export default function ServerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pendingStatus, setPendingStatus] = useState(null); // 'starting' | 'stopping' | null
  const pollRef = useRef(null);

  const { data, loading, refetch } = useApi(() => instancesApi.get(id), [id]);
  const instance = data?.instance;

  const { user: authUser } = useAuth();
  const isAdmin = !!authUser?.admin;

  const { data: permData } = useApi(() => instancesApi.getPermissions(id), [id]);
  const permissions = permData?.permissions || [];
  const canExecute = permissions.includes('instance:execute');
  const canEditInstance = permissions.includes('instance:edit');
  const canBackup = permissions.includes('instance:backup');
  const canManageLinks = permissions.includes('instance:owner');

  // Resolve pending when real status matches expected
  useEffect(() => {
    if (!instance || !pendingStatus) return;
    const done = (pendingStatus === 'starting' && instance.status === 'running') ||
                 (pendingStatus === 'stopping' && instance.status !== 'running');
    if (done) {
      setPendingStatus(null);
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, [instance?.status, pendingStatus]);

  useEffect(() => () => clearInterval(pollRef.current), []);

  const startPolling = useCallback(() => {
    if (pollRef.current) return;
    const deadline = Date.now() + 30_000;
    pollRef.current = setInterval(() => {
      if (Date.now() > deadline) {
        clearInterval(pollRef.current);
        pollRef.current = null;
        setPendingStatus(null);
        return;
      }
      refetch();
    }, 3000);
  }, [refetch]);

  const runAction = useAction(async (fn) => { await fn(); });
  const deleteAction = useAction(async () => {
    await instancesApi.delete(id);
    navigate('/servers');
  });

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

  const effectiveStatus = pendingStatus || instance.status || 'stopped';
  const isRunning = effectiveStatus === 'running' || effectiveStatus === 'starting';
  const transitioning = !!pendingStatus;

  const handleRun = async () => {
    setPendingStatus('starting');
    try { await runAction.execute(() => instancesApi.run(id)); } catch { setPendingStatus(null); return; }
    startPolling();
  };
  const handleStop = async () => {
    setPendingStatus('stopping');
    try { await runAction.execute(() => instancesApi.stop(id)); } catch { setPendingStatus(null); return; }
    startPolling();
  };
  const handleRestart = async () => {
    setPendingStatus('starting');
    try { await runAction.execute(() => instancesApi.restart(id)); } catch { setPendingStatus(null); return; }
    startPolling();
  };

  return (
    <Layout breadcrumbs={['Servers', instance.name]}>
      <div className="server-details">
        <div className="server-details-header">
          <button className="back-btn" onClick={() => navigate('/servers')}>
            <ArrowLeft size={14} />
          </button>
          <div className="server-details-meta">
            <h1 className="server-details-title">{instance.name}</h1>
            <StatusBadge status={effectiveStatus} />
            <span className="server-details-game">{GAME_LABELS[instance.type] || instance.type}</span>
          </div>
          <div className="server-details-actions">
            {canExecute && !isRunning && (
              <Button icon={Play} size="sm" disabled={transitioning} onClick={handleRun}>
                Start
              </Button>
            )}
            {canExecute && isRunning && (
              <Button icon={Square} variant="danger" size="sm" disabled={transitioning} onClick={handleStop}>
                Stop
              </Button>
            )}
            {canExecute && (
              <Button icon={RotateCcw} variant="secondary" size="sm" disabled={transitioning} onClick={handleRestart}>
                Restart
              </Button>
            )}
            {canManageLinks && <Button icon={Trash2} variant="ghost" size="sm" onClick={() => setConfirmDelete(true)} />}
          </div>
        </div>

        <div className="server-tabs">
          {(isAdmin ? [...TABS, ADMIN_TAB] : TABS).map(({ id: tid, label, icon: Icon }) => (
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
          {tab === 'backups'  && <Card><BackupsTab instance={instance} canBackup={canBackup} onRefetch={refetch} /></Card>}
          {tab === 'env'      && <Card><VariablesTab instance={instance} canEdit={canEditInstance} onSaved={refetch} /></Card>}
          {tab === 'connect'  && <Card><ConnectTab instance={instance} onRefetch={refetch} /></Card>}
          {tab === 'players'  && <Card><PlayersTab instance={instance} canManage={canManageLinks} /></Card>}
          {tab === 'admin' && isAdmin && <Card><AdminTab instance={instance} onOwnerChanged={refetch} /></Card>}
        </div>
      </div>

      <ConfirmDelete
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={deleteAction.execute}
        name={instance.name}
        loading={deleteAction.loading}
      />
    </Layout>
  );
}
