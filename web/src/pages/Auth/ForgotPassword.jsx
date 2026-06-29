import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Mail, ArrowLeft, CheckCircle2,
} from 'lucide-react';
import PickaxeIcon from '../../icons/PickaxeIcon/index.js';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import { authApi } from '../../api/auth.js';
import './Login.css';
import './Auth.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    if (!email || loading) return;
    setError('');
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      // Always show success — don't reveal whether the email exists.
      setDone(true);
    } catch (err) {
      setError(err?.message || 'Could not send the reset link. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg" aria-hidden />

      <div className="login-card">
        <Link to="/login" className="login-back">
          <ArrowLeft size={14} /> Back to sign in
        </Link>

        <Link to="/" className="login-logo">
          <div className="login-logo-icon"><PickaxeIcon size={22} /></div>
          <span className="login-logo-text">Node<span className="login-logo-accent">Craft</span></span>
        </Link>

        {done ? (
          <>
            <div className="auth-status">
              <div className="auth-status-icon is-success"><CheckCircle2 size={28} /></div>
              <h1 className="auth-status-title">Check your email</h1>
              <p className="auth-status-sub">
                If an account exists for <strong>{email}</strong>, we've sent a link
                to reset your password. The link expires shortly.
              </p>
            </div>
            <div className="auth-actions">
              <Link to="/login" className="login-link" style={{ textAlign: 'center' }}>
                Back to sign in
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="login-header">
              <h1 className="login-title">Forgot your password?</h1>
              <p className="login-sub">
                Enter your account email and we'll send you a link to reset it.
              </p>
            </div>

            <form onSubmit={handle} className="login-form">
              {error && <div className="login-error">{error}</div>}

              <Input
                label="Email address"
                type="email"
                placeholder="you@example.com"
                icon={Mail}
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />

              <Button
                type="submit"
                loading={loading}
                disabled={!email || loading}
                size="lg"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Send reset link
              </Button>
            </form>

            <p className="login-register">
              Remembered it? <Link to="/login" className="login-link">Back to sign in</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
