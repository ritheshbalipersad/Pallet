import { useState, useEffect } from 'react';
import { usersApi, rolesApi } from '../../api/client';

type User = { userId: number; username: string; displayName: string; email: string; roleId: number; role: { name: string }; isActive: boolean };
type Role = { roleId: number; name: string };

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ username: '', password: '', displayName: '', email: '', roleId: 0 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function load() {
    setLoading(true);
    Promise.all([usersApi.list(1, 100), rolesApi.list()])
      .then(([u, r]) => {
        setUsers((u.items as User[]) || []);
        setRoles(Array.isArray(r) ? r : []);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.roleId) { setError('Select a role'); return; }
    setSaving(true);
    setError('');
    try {
      await usersApi.create({
        username: form.username,
        password: form.password,
        displayName: form.displayName || undefined,
        email: form.email || undefined,
        roleId: form.roleId,
      });
      setForm({ username: '', password: '', displayName: '', email: '', roleId: 0 });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="text-slate-400">Loading…</div>;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h2 className="text-lg font-semibold text-slate-100">Users</h2>
      <form onSubmit={handleSubmit} className="space-y-2 rounded border border-slate-600 bg-slate-800 p-4">
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            type="text"
            value={form.username}
            onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
            placeholder="Username"
            className="rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white"
            required
          />
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            placeholder="Password"
            className="rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white"
            required
          />
          <input
            type="text"
            value={form.displayName}
            onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
            placeholder="Display name"
            className="rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white"
          />
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="Email"
            className="rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white"
          />
          <select
            value={form.roleId}
            onChange={(e) => setForm((f) => ({ ...f, roleId: parseInt(e.target.value, 10) }))}
            className="rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white"
          >
            <option value={0}>Select role</option>
            {roles.map((r) => (
              <option key={r.roleId} value={r.roleId}>{r.name}</option>
            ))}
          </select>
        </div>
        <button type="submit" disabled={saving} className="rounded bg-primary-600 px-4 py-2 text-white hover:bg-primary-700 disabled:opacity-50">
          Add user
        </button>
      </form>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <ul className="space-y-2">
        {users.map((u) => (
          <li key={u.userId} className="flex items-center justify-between rounded border border-slate-600 bg-slate-800 p-3">
            <div>
              <span className="font-medium text-slate-200">{u.username}</span>
              {u.displayName && <span className="ml-2 text-slate-400">{u.displayName}</span>}
              <span className="ml-2 rounded bg-slate-600 px-2 py-0.5 text-xs text-slate-300">{u.role?.name}</span>
              {!u.isActive && <span className="ml-2 text-xs text-red-400">Inactive</span>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
