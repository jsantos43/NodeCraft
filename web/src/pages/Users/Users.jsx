import React, { useState } from 'react';
import { UserPlus, Trash2, Shield, User } from 'lucide-react';
import Layout from '../../components/Layout/Layout.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Modal, { ModalFooter } from '../../components/ui/Modal.jsx';
import Input from '../../components/ui/Input.jsx';
import { useApi, useAction } from '../../hooks/useApi.js';
import { usersApi } from '../../api/users.js';
import Spinner from '../../components/ui/Spinner.jsx';
import './Users.css';

export default function Users() {
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ username: '', email: '', password: '' });

  const { data, loading, refetch } = useApi(() => usersApi.list());
  const users = data?.users || [];

  const createUser = useAction(async () => {
    await usersApi.create(form);
    setCreateOpen(false);
    setForm({ username: '', email: '', password: '' });
    refetch();
  });

  const deleteUser = useAction(async (id) => {
    await usersApi.deleteOther(id);
    refetch();
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <Layout title="Users">
      <div className="users-toolbar">
        <div />
        <Button icon={UserPlus} onClick={() => setCreateOpen(true)}>
          Invite User
        </Button>
      </div>

      <Card padding={false}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><Spinner /></div>
        ) : users.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)', fontSize: 13 }}>
            No users found
          </div>
        ) : (
          <table className="users-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="users-row">
                  <td>
                    <div className="user-cell">
                      <div className="user-avatar">
                        <User size={12} />
                      </div>
                      <span className="user-name">{u.username}</span>
                    </div>
                  </td>
                  <td><span className="user-email">{u.email}</span></td>
                  <td>
                    <Badge color={u.role === 'admin' ? 'purple' : 'gray'}>
                      {u.role === 'admin' ? <><Shield size={10} /> Admin</> : 'User'}
                    </Badge>
                  </td>
                  <td><span className="user-date">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</span></td>
                  <td>
                    <button className="action-btn action-btn-danger" title="Delete user" onClick={() => deleteUser.execute(u.id)}>
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Invite User" size="sm">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input label="Username" placeholder="johndoe" value={form.username} onChange={e => set('username', e.target.value)} />
          <Input label="Email" type="email" placeholder="john@example.com" value={form.email} onChange={e => set('email', e.target.value)} />
          <Input label="Password" type="password" placeholder="••••••••" value={form.password} onChange={e => set('password', e.target.value)} />
          <ModalFooter>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button loading={createUser.loading} onClick={createUser.execute}>Create User</Button>
          </ModalFooter>
        </div>
      </Modal>
    </Layout>
  );
}
