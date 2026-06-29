import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Save, Mail, Shield, CheckCircle2, AlertCircle, Send, Copy, Check, Lock, Trash2, ArrowLeft,
} from 'lucide-react';
import Layout from '../../components/Layout/Layout.jsx';
import Card, { CardHeader } from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import Badge from '../../components/ui/Badge.jsx';
import ConfirmDelete from '../../components/ui/ConfirmDelete.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useAction } from '../../hooks/useApi.js';
import { usersApi } from '../../api/users.js';
import { authApi } from '../../api/auth.js';
import './Settings.css';

const GAME_LABELS = {
  minecraft: 'Minecraft', hytale: 'Hytale', counterstrike: 'CS2',
  terraria: 'Terraria', kerbal: 'KSP',
};

function fmtMb(mb) {
  if (!mb) return '0';
  return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb} MB`;
}

function initials(name) {
  if (!name) return '?';
  return name.trim().split(/\s+/).slice(0, 2).map(p => p[0].toUpperCase()).join('');
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button className="copy-btn" onClick={copy} title="Copy user ID">
      {copied ? <Check size={12} /> : <Copy size={12} />}
    </button>
  );
}

export default function Settings() {
  const { user, fetchUser, logout } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || '');
  const [saved, setSaved] = useState(false);
  const [verifySent, setVerifySent] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setName(user?.name || '');
  }, [user?.name]);

  const saveProfile = useAction(async () => {
    await usersApi.update({ name: name.trim() });
    await fetchUser();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  });

  const sendVerification = useAction(async () => {
    await authApi.verifyEmail();
    setVerifySent(true);
  });

  const changePassword = useAction(async () => {
    await authApi.forgotPassword(user.email);
    setResetSent(true);
  });

  const deleteAccount = useAction(async () => {
    await usersApi.delete();
    await logout();
    navigate('/login', { replace: true });
  });

  const nameChanged = name.trim() !== (user?.name || '');
  const nameValid = name.trim().length >= 3 && name.trim().length <= 32;
  const allowedGames = Array.isArray(user?.allowedGames) ? user.allowedGames : [];

  return (
    <Layout title="Settings">
      <div className="settings-page">

        {/* Common users have no sidebar, so give them a way back to servers. */}
        {!user?.admin && (
          <button
            type="button"
            className="settings-back"
            onClick={() => navigate('/servers')}
          >
            <ArrowLeft size={15} /> Back to servers
          </button>
        )}

        {/* Identity hero */}
        <Card className="identity-card">
          <div className="identity-top">
            <div className="identity-avatar">{initials(user?.name)}</div>
            <div className="identity-main">
              <div className="identity-name-row">
                <h2 className="identity-name">{user?.name}</h2>
                <Badge color={user?.admin ? 'purple' : 'gray'}>
                  {user?.admin ? <><Shield size={10} /> Admin</> : 'Member'}
                </Badge>
              </div>
              <div className="identity-email">
                <Mail size={13} /> {user?.email}
                {user?.verified ? (
                  <span className="verify-pill verify-ok"><CheckCircle2 size={12} /> Verified</span>
                ) : (
                  <span className="verify-pill verify-warn"><AlertCircle size={12} /> Unverified</span>
                )}
              </div>
            </div>
          </div>
          <div className="identity-foot">
            <span className="identity-id-label">User ID</span>
            <code className="identity-id">{user?.id}</code>
            {user?.id && <CopyButton text={user.id} />}
          </div>
        </Card>

        {/* Verify email — only when needed, sits up top */}
        {!user?.verified && (
          <Card className="notice-card">
            <div className="notice-row">
              <div className="notice-text">
                <AlertCircle size={18} className="notice-icon" />
                <div>
                  <p className="notice-title">Verify your email</p>
                  <p className="notice-sub">
                    {verifySent
                      ? 'Link sent — check your inbox to confirm your address.'
                      : 'Confirm your address to secure your account and enable recovery.'}
                  </p>
                </div>
              </div>
              <Button
                variant={verifySent ? 'secondary' : 'primary'}
                loading={sendVerification.loading}
                onClick={sendVerification.execute}
                icon={Send}
              >
                {verifySent ? 'Resend' : 'Send link'}
              </Button>
            </div>
            {sendVerification.error && (
              <span className="settings-error">{sendVerification.error.message || 'Could not send the verification email.'}</span>
            )}
          </Card>
        )}

        {/* Profile + Security */}
        <div className="settings-grid">
          <Card>
            <CardHeader title="Profile" subtitle="The name shown across NodeCraft" />
            <div className="settings-form">
              <Input
                label="Display name"
                value={name}
                onChange={e => setName(e.target.value)}
                error={name && !nameValid ? 'Use between 3 and 32 characters.' : undefined}
              />
              <div className="settings-form-footer">
                <Button
                  loading={saveProfile.loading}
                  disabled={!nameChanged || !nameValid}
                  onClick={saveProfile.execute}
                  icon={saved ? undefined : Save}
                >
                  {saved ? '✓ Saved' : 'Save changes'}
                </Button>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Password" subtitle="Reset via a secure email link" />
            <div className="settings-form">
              <p className="settings-hint">
                {resetSent
                  ? `Reset link sent to ${user?.email}. Check your inbox.`
                  : 'We\'ll email a link to set a new password — no current password needed.'}
              </p>
              <div className="settings-form-footer">
                <Button
                  variant={resetSent ? 'secondary' : 'primary'}
                  loading={changePassword.loading}
                  onClick={changePassword.execute}
                  icon={Lock}
                >
                  {resetSent ? 'Resend link' : 'Change password'}
                </Button>
              </div>
              {changePassword.error && (
                <span className="settings-error">{changePassword.error.message || 'Could not send the reset email.'}</span>
              )}
            </div>
          </Card>
        </div>

        {/* Plan & limits */}
        <Card>
          <CardHeader title="Plan & limits" subtitle="Resource quotas for your account" />
          <div className="limits-grid">
            <div className="limit-item">
              <span className="limit-label">Instances</span>
              <span className="limit-value">{user?.maxInstances ?? 0}</span>
            </div>
            <div className="limit-item">
              <span className="limit-label">CPU</span>
              <span className="limit-value">{user?.maxCpu ?? 0} <small>cores</small></span>
            </div>
            <div className="limit-item">
              <span className="limit-label">Memory</span>
              <span className="limit-value">{fmtMb(user?.maxMemory)}</span>
            </div>
            <div className="limit-item">
              <span className="limit-label">Disk</span>
              <span className="limit-value">{fmtMb(user?.maxDisk)}</span>
            </div>
          </div>
          <div className="limits-games">
            <span className="limit-label">Allowed games</span>
            <div className="limits-games-list">
              {allowedGames.length === 0 ? (
                <span className="limit-value">None</span>
              ) : (
                allowedGames.map(g => (
                  <Badge key={g} color="gray">{GAME_LABELS[g] || g}</Badge>
                ))
              )}
            </div>
          </div>
        </Card>

        {/* Danger zone */}
        <Card className="danger-card">
          <div className="danger-row">
            <div className="danger-text">
              <p className="danger-title">Delete account</p>
              <p className="danger-sub">
                Permanently removes your account and all data you own. This can't be undone.
              </p>
            </div>
            <Button variant="danger" icon={Trash2} onClick={() => setConfirmDelete(true)}>
              Delete account
            </Button>
          </div>
        </Card>
      </div>

      <ConfirmDelete
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={deleteAccount.execute}
        name={user?.email}
        loading={deleteAccount.loading}
      />
    </Layout>
  );
}
