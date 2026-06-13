import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Zap, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import './Login.css';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const registered = location.state?.registered;
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handle = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg" aria-hidden />

      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon"><Zap size={20} /></div>
          <span className="login-logo-text">NodeCraft</span>
        </div>

        <div className="login-header">
          <h1 className="login-title">Welcome back</h1>
          <p className="login-sub">Sign in to your account to continue</p>
        </div>

        <form onSubmit={handle} className="login-form">
          {registered && <div className="login-success">Account created! Check your email to verify your account.</div>}
          {error && <div className="login-error">{error}</div>}

          <Input
            label="Email address"
            type="email"
            placeholder="you@example.com"
            icon={Mail}
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            required
            autoComplete="email"
          />

          <div className="login-pw-wrap">
            <Input
              label="Password"
              type={showPw ? 'text' : 'password'}
              placeholder="Your password"
              icon={Lock}
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required
              autoComplete="current-password"
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

          <Button type="submit" loading={loading} size="lg" style={{ width: '100%', justifyContent: 'center' }}>
            Sign in
          </Button>
        </form>

        <p className="login-register">
          Don't have an account?{' '}
          <Link to="/register" className="login-link">Create one</Link>
        </p>
      </div>
    </div>
  );
}
