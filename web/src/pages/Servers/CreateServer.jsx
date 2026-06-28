import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react';
import Layout from '../../components/Layout/Layout.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Input, { Select } from '../../components/ui/Input.jsx';
import { useApi, useAction } from '../../hooks/useApi.js';
import { instancesApi } from '../../api/instances.js';
import { workersApi } from '../../api/workers.js';
import { useAuth } from '../../context/AuthContext.jsx';
import './CreateServer.css';

const GAMES = [
  { id: 'minecraft',    name: 'Minecraft',       desc: 'Java & Bedrock editions', emoji: '⛏️' },
  { id: 'counterstrike',name: 'Counter-Strike 2', desc: 'CS2 dedicated server',   emoji: '🎯' },
  { id: 'terraria',     name: 'Terraria',         desc: 'Sandbox adventure',       emoji: '🌳' },
  { id: 'kerbal',       name: 'Kerbal Space',     desc: 'Space simulation',        emoji: '🚀' },
  { id: 'hytale',       name: 'Hytale',           desc: 'Adventure RPG',           emoji: '⚔️' },
];

const STEPS = ['Select Game', 'Resources', 'Worker', 'Settings', 'Deploy'];

const defaultGameConfig = {
  minecraft: { gamemode: 'survival', difficulty: 'normal', software: 'paper', seed: '', allowlist: false, bedrock: false, licensed: true, pvp: true },
  counterstrike: {},
  terraria: {},
  kerbal: {},
  hytale: {},
};

export default function CreateServer() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: '',
    type: '',
    memory: 1024,
    cpu: 1,
    maxPlayers: 20,
    workerId: '',
    game: {},
  });
  const [errors, setErrors] = useState({});

  const { user } = useAuth();
  const allowedWorkers = user?.allowedWorkers || [];

  const allowedGames = user?.allowedGames || [];

  const { data: workersData } = useApi(() => workersApi.list());
  // Workers this user is allowed to use. Allowed access takes priority over
  // online status, so offline workers remain selectable.
  const workers = (workersData?.workers || [])
    .filter(w => allowedWorkers.includes(w.id));

  // Quota usage across the instances this user owns. Mirrors the manager's
  // Quota.verifyCanCreate checks so the user gets feedback before submitting.
  const { data: instData } = useApi(() => instancesApi.list());
  const owned = (instData?.instances || []).filter(i => i.owner === user?.id);
  const usage = owned.reduce((a, i) => ({
    count: a.count + 1,
    memory: a.memory + (i.memory || 0),
    cpu: a.cpu + (i.cpu || 0),
  }), { count: 0, memory: 0, cpu: 0 });

  const limits = {
    instances: user?.maxInstances ?? 0,
    memory: user?.maxMemory ?? 0,
    cpu: user?.maxCpu ?? 0,
  };
  const remaining = {
    instances: limits.instances - usage.count,
    memory: limits.memory - usage.memory,
    cpu: limits.cpu - usage.cpu,
  };

  // Reasons the current configuration cannot be created (empty = OK).
  const quotaIssues = [];
  if (remaining.instances <= 0) {
    quotaIssues.push(`Instance limit reached (${usage.count}/${limits.instances}).`);
  }
  if (Number(form.memory) > remaining.memory) {
    quotaIssues.push(`Memory exceeds your quota (${Math.max(0, remaining.memory)} MB available).`);
  }
  if (Number(form.cpu) > remaining.cpu) {
    quotaIssues.push(`CPU exceeds your quota (${Math.max(0, remaining.cpu)} core(s) available).`);
  }
  if (form.type && !allowedGames.includes(form.type)) {
    quotaIssues.push('This game is not allowed for your account.');
  }
  const canCreate = quotaIssues.length === 0 && !!form.workerId && form.name.length >= 3;

  const { execute: createServer, loading } = useAction(async () => {
    const payload = {
      name: form.name,
      type: form.type,
      memory: Number(form.memory),
      cpu: Number(form.cpu),
      maxPlayers: Number(form.maxPlayers),
      workerId: form.workerId,
      game: form.game,
    };
    const res = await instancesApi.create(payload);
    navigate(`/servers/${res.instance.id}`);
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const setGame = (key, val) => setForm(f => ({ ...f, game: { ...f.game, [key]: val } }));

  const validate = () => {
    const e = {};
    if (step === 0 && !form.type) e.type = 'Select a game';
    if (step === 1) {
      if (!form.name || form.name.length < 3) e.name = 'Min 3 characters';
      if (form.memory < 512) e.memory = 'Min 512 MB';
      if (remaining.instances <= 0) e.quota = `Instance limit reached (${usage.count}/${limits.instances})`;
      if (Number(form.memory) > remaining.memory) e.memory = `Exceeds available memory (${Math.max(0, remaining.memory)} MB left)`;
      if (Number(form.cpu) > remaining.cpu) e.cpu = `Exceeds available CPU (${Math.max(0, remaining.cpu)} core(s) left)`;
    }
    if (step === 2 && !form.workerId) e.workerId = 'Select a worker';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validate()) setStep(s => s + 1); };
  const back = () => setStep(s => s - 1);

  const selectGame = (id) => {
    set('type', id);
    setForm(f => ({ ...f, type: id, game: defaultGameConfig[id] || {} }));
    setStep(1);
  };

  return (
    <Layout
      breadcrumbs={['Servers', 'Create Server']}
    >
      <div className="create-layout">
        {/* Steps indicator */}
        <div className="create-steps">
          {STEPS.map((s, i) => (
            <div key={i} className={`create-step ${i === step ? 'step-active' : ''} ${i < step ? 'step-done' : ''}`}>
              <div className="step-indicator">
                {i < step ? <CheckCircle2 size={14} /> : <span>{i + 1}</span>}
              </div>
              <span className="step-label">{s}</span>
              {i < STEPS.length - 1 && <div className="step-line" />}
            </div>
          ))}
        </div>

        <Card className="create-card">
          {/* Step 0: Game Selection */}
          {step === 0 && (
            <div className="create-section">
              <h2 className="create-section-title">Choose a game</h2>
              <p className="create-section-sub">Select the game type for your new server</p>
              <div className="game-grid">
                {GAMES.map(g => {
                  const blocked = !allowedGames.includes(g.id);
                  return (
                    <button
                      key={g.id}
                      className={`game-card ${form.type === g.id ? 'game-card-selected' : ''} ${blocked ? 'game-card-blocked' : ''}`}
                      onClick={() => !blocked && selectGame(g.id)}
                      disabled={blocked}
                      title={blocked ? 'Not allowed for your account' : undefined}
                    >
                      <span className="game-emoji">{g.emoji}</span>
                      <span className="game-name">{g.name}</span>
                      <span className="game-desc">{blocked ? 'Not allowed for your account' : g.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 1: Resources */}
          {step === 1 && (
            <div className="create-section">
              <h2 className="create-section-title">Configure Resources</h2>
              <p className="create-section-sub">Set the resource limits for your server</p>

              <div className="quota-panel">
                <div className={`quota-item ${remaining.instances <= 0 ? 'quota-over' : ''}`}>
                  <span className="quota-item-label">Instances</span>
                  <span className="quota-item-val">{usage.count} / {limits.instances}</span>
                </div>
                <div className={`quota-item ${Number(form.memory) > remaining.memory ? 'quota-over' : ''}`}>
                  <span className="quota-item-label">Memory available</span>
                  <span className="quota-item-val">{Math.max(0, remaining.memory)} MB</span>
                </div>
                <div className={`quota-item ${Number(form.cpu) > remaining.cpu ? 'quota-over' : ''}`}>
                  <span className="quota-item-label">CPU available</span>
                  <span className="quota-item-val">{Math.max(0, remaining.cpu)} core(s)</span>
                </div>
              </div>
              {errors.quota && <span className="ui-input-error">{errors.quota}</span>}

              <div className="create-form">
                <Input
                  label="Server Name"
                  placeholder="My Minecraft Server"
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  error={errors.name}
                />
                <div className="create-row">
                  <Input
                    label="Memory (MB)"
                    type="number"
                    min="512"
                    step="256"
                    value={form.memory}
                    onChange={e => set('memory', e.target.value)}
                    error={errors.memory}
                    hint={`Min 512 MB · ${Math.max(0, remaining.memory)} MB available`}
                  />
                  <Input
                    label="CPU Cores"
                    type="number"
                    min="1"
                    value={form.cpu}
                    onChange={e => set('cpu', e.target.value)}
                    error={errors.cpu}
                    hint={`${Math.max(0, remaining.cpu)} core(s) available`}
                  />
                </div>
                <Input
                  label="Max Players"
                  type="number"
                  min="1"
                  max="1000"
                  value={form.maxPlayers}
                  onChange={e => set('maxPlayers', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Step 2: Worker */}
          {step === 2 && (
            <div className="create-section">
              <h2 className="create-section-title">Choose a Worker</h2>
              <p className="create-section-sub">Select the node that will host this server</p>
              <div className="worker-picker">
                {workers.map(w => (
                  <div
                    key={w.id}
                    className={`worker-option ${form.workerId === w.id ? 'worker-option-selected' : ''}`}
                    onClick={() => set('workerId', w.id)}
                  >
                    <div className="worker-option-info">
                      <span className="worker-option-name">
                        {w.name}
                        <span className={`worker-status ${w.healthy ? 'is-online' : 'is-offline'}`}>
                          {w.healthy ? 'Online' : 'Offline'}
                        </span>
                      </span>
                      <span className="worker-option-detail">
                        CPU {w.cpuUsage?.toFixed(1)}% · RAM {w.memorieUsed ? `${(w.memorieUsed/1024).toFixed(1)} GB` : '—'} · Disk {w.diskAvailable ? `${(w.diskAvailable/1024).toFixed(0)} GB free` : '—'}
                      </span>
                    </div>
                    {form.workerId === w.id && <CheckCircle2 size={16} className="worker-check" />}
                  </div>
                ))}

                {workers.length === 0 && (
                  <div className="no-workers">
                    No workers available for your account. Contact an administrator to be granted access to a worker.
                  </div>
                )}
              </div>
              {errors.workerId && <span className="ui-input-error">{errors.workerId}</span>}
            </div>
          )}

          {/* Step 3: Game Settings */}
          {step === 3 && (
            <div className="create-section">
              <h2 className="create-section-title">Game Settings</h2>
              <p className="create-section-sub">Configure {GAMES.find(g => g.id === form.type)?.name} specific settings</p>

              {form.type === 'minecraft' && (
                <div className="create-form">
                  <div className="create-row">
                    <Select
                      label="Gamemode"
                      value={form.game.gamemode}
                      onChange={e => setGame('gamemode', e.target.value)}
                    >
                      <option value="survival">Survival</option>
                      <option value="creative">Creative</option>
                      <option value="adventure">Adventure</option>
                    </Select>
                    <Select
                      label="Difficulty"
                      value={form.game.difficulty}
                      onChange={e => setGame('difficulty', e.target.value)}
                    >
                      <option value="peaceful">Peaceful</option>
                      <option value="easy">Easy</option>
                      <option value="normal">Normal</option>
                      <option value="hard">Hard</option>
                    </Select>
                  </div>
                  <div className="create-row">
                    <Select
                      label="Software"
                      value={form.game.software}
                      onChange={e => setGame('software', e.target.value)}
                    >
                      <option value="vanilla">Vanilla</option>
                      <option value="paper">Paper</option>
                      <option value="purpur">Purpur</option>
                    </Select>
                    <Input
                      label="Seed"
                      placeholder="Leave empty for random"
                      value={form.game.seed || ''}
                      onChange={e => setGame('seed', e.target.value)}
                    />
                  </div>
                  <div className="create-toggles">
                    {[
                      ['allowlist', 'Allowlist'],
                      ['bedrock', 'Bedrock'],
                      ['licensed', 'Online Mode'],
                      ['pvp', 'PvP'],
                    ].map(([key, label]) => (
                      <label key={key} className="create-toggle">
                        <input
                          type="checkbox"
                          checked={!!form.game[key]}
                          onChange={e => setGame(key, e.target.checked)}
                        />
                        <span className="toggle-track" />
                        <span className="toggle-label">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {form.type !== 'minecraft' && (
                <div className="no-settings">
                  <p>No additional settings required for {GAMES.find(g => g.id === form.type)?.name}.</p>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Deploy */}
          {step === 4 && (
            <div className="create-section">
              <h2 className="create-section-title">Ready to Deploy</h2>
              <p className="create-section-sub">Review your configuration and create the server</p>
              <div className="deploy-summary">
                <div className="deploy-row">
                  <span className="deploy-key">Name</span>
                  <span className="deploy-val">{form.name}</span>
                </div>
                <div className="deploy-row">
                  <span className="deploy-key">Game</span>
                  <span className="deploy-val">{GAMES.find(g => g.id === form.type)?.name}</span>
                </div>
                <div className="deploy-row">
                  <span className="deploy-key">Memory</span>
                  <span className="deploy-val">{form.memory} MB</span>
                </div>
                <div className="deploy-row">
                  <span className="deploy-key">CPU</span>
                  <span className="deploy-val">{form.cpu} core{form.cpu > 1 ? 's' : ''}</span>
                </div>
                <div className="deploy-row">
                  <span className="deploy-key">Max Players</span>
                  <span className="deploy-val">{form.maxPlayers}</span>
                </div>
                <div className="deploy-row">
                  <span className="deploy-key">Worker</span>
                  <span className="deploy-val">{workers.find(w => w.id === form.workerId)?.name || form.workerId || '—'}</span>
                </div>
              </div>

              {quotaIssues.length > 0 && (
                <div className="deploy-blocked">
                  <strong>Cannot create this instance:</strong>
                  <ul>
                    {quotaIssues.map((msg) => <li key={msg}>{msg}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="create-nav">
            {step > 0 && (
              <Button variant="secondary" icon={ChevronLeft} onClick={back}>
                Back
              </Button>
            )}
            <div style={{ flex: 1 }} />
            {step < STEPS.length - 1 && step > 0 && (
              <Button iconRight={ChevronRight} disabled={step === 2 && !form.workerId} onClick={next}>
                Continue
              </Button>
            )}
            {step === STEPS.length - 1 && (
              <Button loading={loading} disabled={!canCreate} onClick={createServer}>
                Deploy Server
              </Button>
            )}
          </div>
        </Card>
      </div>
    </Layout>
  );
}
