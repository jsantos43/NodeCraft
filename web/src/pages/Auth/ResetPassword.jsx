import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Lock, Eye, EyeOff, CheckCircle2, XCircle,
} from 'lucide-react';
import PickaxeIcon from '../../icons/PickaxeIcon/index.js';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import { authApi } from '../../api/auth.js';
import './Login.css';
import './Auth.css';

const MIN_LEN = 8;

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const tooShort = password.length > 0 && password.length < MIN_LEN;
  const mismatch = confirm.length > 0 && confirm !== password;
  const canSubmit = password.length >= MIN_LEN && password === confirm && !loading;

  const handle = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError('');
    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      setDone(true);
    } catch (err) {
      setError(err?.message || 'This reset link is invalid or has expired.');
    } finally {
      setLoading(false);
    }
  };

  // Missing token — nothing to reset against.
  if (!token) {
    return (
      <div className="login-page">
        <div className="login-bg" aria-hidden />
        <div className="login-card">
          <div className="login-logo">
            <div className="login-logo-icon"><PickaxeIcon size={22} /></div>
            <span className="login-logo-text">Node<span className="login-logo-accent">Craft</span></span>
          </div>
          <div className="auth-status">
            <div className="auth-status-icon is-error"><XCircle size={28} /></div>
            <h1 className="auth-status-title">Invalid reset link</h1>
            <p className="auth-status-sub">
              This link is missing its token. Request a new one from the sign-in page.
            </p>
          </div>
          <div className="auth-actions">
            <Button
              variant="secondary"
              size="lg"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => navigate('/login')}
            >
              Back to sign in
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-bg" aria-hidden />

      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon"><PickaxeIcon size={22} /></div>
          <span className="login-logo-text">Node<span className="login-logo-accent">Craft</span></span>
        </div>

        {done ? (
          <>
            <div className="auth-status">
              <div className="auth-status-icon is-success"><CheckCircle2 size={28} /></div>
              <h1 className="auth-status-title">Password updated</h1>
              <p className="auth-status-sub">
                Your password has been changed. Sign in with your new credentials.
              </p>
            </div>
            <div className="auth-actions">
              <Button size="lg" style={{ width: '100%', justifyContent: 'center' }} onClick={() => navigate('/login')}>
                Continue to sign in
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="login-header">
              <h1 className="login-title">Set a new password</h1>
              <p className="login-sub">Choose a strong password you don't use elsewhere.</p>
            </div>

            <form onSubmit={handle} className="login-form">
              {error && <div className="login-error">{error}</div>}

              <div className="login-pw-wrap">
                <Input
                  label="New password"
                  type={showPw ? 'text' : 'password'}
                  placeholder="At least 8 characters"
                  icon={Lock}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  error={tooShort ? `Use at least ${MIN_LEN} characters.` : undefined}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="login-pw-toggle"
                  onClick={() => setShowPw(s => !s)}
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>

              <Input
                label="Confirm password"
                type={showPw ? 'text' : 'password'}
                placeholder="Re-enter your password"
                icon={Lock}
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                error={mismatch ? 'Passwords do not match.' : undefined}
                required
                autoComplete="new-password"
              />

              <Button
                type="submit"
                loading={loading}
                disabled={!canSubmit}
                size="lg"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Update password
              </Button>
            </form>
          </>
        )}

        <p className="login-register">
          Remembered it? <Link to="/login" className="login-link">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
