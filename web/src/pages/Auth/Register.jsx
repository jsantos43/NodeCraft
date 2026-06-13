import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, Zap } from 'lucide-react';
import { usersApi } from '../../api/users.js';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import './Login.css';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handle = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirm) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await usersApi.create({ name: form.name, email: form.email, password: form.password });
      navigate('/login', { state: { registered: true } });
    } catch (err) {
      setError(err.message || 'Could not create account');
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
          <h1 className="login-title">Create an account</h1>
          <p className="login-sub">Get started with NodeCraft for free</p>
        </div>

        <form onSubmit={handle} className="login-form">
          {error && <div className="login-error">{error}</div>}

          <Input
            label="Display name"
            type="text"
            placeholder="Your name"
            icon={User}
            value={form.name}
            onChange={set('name')}
            required
            autoComplete="name"
          />

          <Input
            label="Email address"
            type="email"
            placeholder="you@example.com"
            icon={Mail}
            value={form.email}
            onChange={set('email')}
            required
            autoComplete="email"
          />

          <div className="login-pw-wrap">
            <Input
              label="Password"
              type={showPw ? 'text' : 'password'}
              placeholder="Choose a password"
              icon={Lock}
              value={form.password}
              onChange={set('password')}
              required
              autoComplete="new-password"
            />
            <button type="button" className="login-pw-toggle" onClick={() => setShowPw(s => !s)} tabIndex={-1}>
              {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>

          <div className="login-pw-wrap">
            <Input
              label="Confirm password"
              type={showConfirm ? 'text' : 'password'}
              placeholder="Repeat your password"
              icon={Lock}
              value={form.confirm}
              onChange={set('confirm')}
              required
              autoComplete="new-password"
            />
            <button type="button" className="login-pw-toggle" onClick={() => setShowConfirm(s => !s)} tabIndex={-1}>
              {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>

          <Button type="submit" loading={loading} size="lg" style={{ width: '100%', justifyContent: 'center' }}>
            Create account
          </Button>
        </form>

        <p className="login-register">
          Already have an account?{' '}
          <Link to="/login" className="login-link">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
