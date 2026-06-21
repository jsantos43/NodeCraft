import React, { useState } from 'react';
import { Save, User, Lock, Globe } from 'lucide-react';
import Layout from '../../components/Layout/Layout.jsx';
import Card, { CardHeader } from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useAction } from '../../hooks/useApi.js';
import { usersApi } from '../../api/users.js';
import './Settings.css';

const SETTING_TABS = [
  { id: 'profile',  label: 'Profile',  icon: User  },
  { id: 'security', label: 'Security', icon: Lock  },
  { id: 'api',      label: 'API',      icon: Globe },
];

export default function Settings() {
  const { user, fetchUser } = useAuth();
  const [tab, setTab] = useState('profile');
  const [profile, setProfile] = useState({ username: user?.username || '', email: user?.email || '' });
  const [passwords, setPasswords] = useState({ current: '', newPw: '', confirm: '' });
  const [saved, setSaved] = useState(false);

  const saveProfile = useAction(async () => {
    await usersApi.update({ username: profile.username });
    await fetchUser();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  });

  return (
    <Layout title="Settings">
      <div className="settings-layout">
        <div className="settings-tabs">
          {SETTING_TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`settings-tab ${tab === id ? 'settings-tab-active' : ''}`}
              onClick={() => setTab(id)}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        <div className="settings-content">
          {tab === 'profile' && (
            <Card>
              <CardHeader title="Profile" subtitle="Update your personal information" />
              <div className="settings-form">
                <Input
                  label="Username"
                  value={profile.username}
                  onChange={e => setProfile(p => ({ ...p, username: e.target.value }))}
                />
                <Input
                  label="Email address"
                  type="email"
                  value={profile.email}
                  disabled
                  hint="Contact admin to change email"
                />
                <div className="settings-form-footer">
                  <Button loading={saveProfile.loading} onClick={saveProfile.execute} icon={saved ? undefined : Save}>
                    {saved ? '✓ Saved' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {tab === 'security' && (
            <Card>
              <CardHeader title="Security" subtitle="Change your password" />
              <div className="settings-form">
                <Input
                  label="Current Password"
                  type="password"
                  value={passwords.current}
                  onChange={e => setPasswords(p => ({ ...p, current: e.target.value }))}
                  placeholder="••••••••"
                />
                <Input
                  label="New Password"
                  type="password"
                  value={passwords.newPw}
                  onChange={e => setPasswords(p => ({ ...p, newPw: e.target.value }))}
                  placeholder="••••••••"
                />
                <Input
                  label="Confirm New Password"
                  type="password"
                  value={passwords.confirm}
                  onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))}
                  placeholder="••••••••"
                />
                <div className="settings-form-footer">
                  <Button>Update Password</Button>
                </div>
              </div>
            </Card>
          )}

          {tab === 'api' && (
            <Card>
              <CardHeader title="API Access" subtitle="Manage your API keys for programmatic access" />
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                API key management coming soon
              </div>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
