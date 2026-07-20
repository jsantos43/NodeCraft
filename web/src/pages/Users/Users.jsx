import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, User, Search } from 'lucide-react';
import Layout from '../../components/Layout/Layout.jsx';
import Card from '../../components/ui/Card.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Alert from '../../components/ui/Alert.jsx';
import { useApi } from '../../hooks/useApi.js';
import { usersApi } from '../../api/users.js';
import Spinner from '../../components/ui/Spinner.jsx';
import './Users.css';

export default function Users() {
  const navigate = useNavigate();

  const { data, loading, error } = useApi(() => usersApi.list());
  const [search, setSearch] = useState('');

  const users = (data?.users || []).filter(u => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q);
  });

  return (
    <Layout title="Users">
      <div className="users-toolbar">
        <div className="users-search">
          <Search size={14} className="search-icon" />
          <input
            className="search-input"
            placeholder="Search users..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Card padding={false}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><Spinner /></div>
        ) : error ? (
          <div style={{ padding: 20 }}><Alert error={error} override={{ title: "Couldn't load users" }} /></div>
        ) : users.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)', fontSize: 13 }}>
            No users found
          </div>
        ) : (
          <div className="table-scroll">
          <table className="users-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="users-row" onClick={() => navigate(`/users/${u.id}`)}>
                  <td>
                    <div className="user-cell">
                      <div className="user-avatar">
                        <User size={12} />
                      </div>
                      <span className="user-name">{u.name}</span>
                    </div>
                  </td>
                  <td><span className="user-email">{u.email}</span></td>
                  <td>
                    <Badge color={u.admin ? 'purple' : 'gray'}>
                      {u.admin ? <><Shield size={10} /> Admin</> : 'User'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </Card>
    </Layout>
  );
}
