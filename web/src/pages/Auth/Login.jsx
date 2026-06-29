import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import PickaxeIcon from '../../icons/PickaxeIcon/index.js';
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
      const loggedUser = await login(form.email, form.password);
      navigate(loggedUser?.admin ? '/dashboard' : '/servers');
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
        <Link to="/" className="login-back">
          <ArrowLeft size={14} /> Back to home
        </Link>

        <Link to="/" className="login-logo">
          <div className="login-logo-icon"><PickaxeIcon size={22} /></div>
          <span className="login-logo-text">Node<span className="login-logo-accent">Craft</span></span>
        </Link>

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

          <div className="login-forgot">
            <Link to="/forgot" className="login-link">Forgot password?</Link>
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
