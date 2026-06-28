import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Zap, CheckCircle2, XCircle, Loader2,
} from 'lucide-react';
import Button from '../../components/ui/Button.jsx';
import { authApi } from '../../api/auth.js';
import { useAuth } from '../../context/AuthContext.jsx';
import './Login.css';
import './Auth.css';

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { fetchUser } = useAuth();
  const token = params.get('token');

  // 'pending' | 'success' | 'error'
  const [status, setStatus] = useState('pending');
  const [message, setMessage] = useState('');
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    if (!token) {
      setStatus('error');
      setMessage('This verification link is missing its token. Use the button in your email.');
      return;
    }

    (async () => {
      try {
        await authApi.validateAccount(token);
        await fetchUser().catch(() => {});
        setStatus('success');
      } catch (err) {
        setStatus('error');
        setMessage(
          err?.status === 401
            ? 'Sign in first, then open the verification link again.'
            : err?.message || 'This link is invalid or has expired.',
        );
      }
    })();
  }, [token, fetchUser]);

  return (
    <div className="login-page">
      <div className="login-bg" aria-hidden />

      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon"><Zap size={20} /></div>
          <span className="login-logo-text">NodeCraft</span>
        </div>

        {status === 'pending' && (
          <div className="auth-status">
            <div className="auth-status-icon is-pending">
              <Loader2 size={26} className="auth-spin" />
            </div>
            <h1 className="auth-status-title">Verifying your email</h1>
            <p className="auth-status-sub">Hold on a moment while we confirm your address…</p>
          </div>
        )}

        {status === 'success' && (
          <>
            <div className="auth-status">
              <div className="auth-status-icon is-success">
                <CheckCircle2 size={28} />
              </div>
              <h1 className="auth-status-title">Email verified</h1>
              <p className="auth-status-sub">
                Your account is confirmed. You're all set to deploy your servers.
              </p>
            </div>
            <div className="auth-actions">
              <Button size="lg" style={{ width: '100%', justifyContent: 'center' }} onClick={() => navigate('/')}>
                Go to dashboard
              </Button>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="auth-status">
              <div className="auth-status-icon is-error">
                <XCircle size={28} />
              </div>
              <h1 className="auth-status-title">Verification failed</h1>
              <p className="auth-status-sub">{message}</p>
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
          </>
        )}

        <p className="login-register">
          Need help? <Link to="/login" className="login-link">Return home</Link>
        </p>
      </div>
    </div>
  );
}
