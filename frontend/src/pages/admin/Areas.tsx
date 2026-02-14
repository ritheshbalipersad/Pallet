import { useState, useEffect } from 'react';
import { areasApi } from '../../api/client';

type Area = { areaId: number; name: string; type: string; capacity: number; parentAreaId?: number };

export default function Areas() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Area | null>(null);
  const [form, setForm] = useState({ name: '', type: '', capacity: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function load() {
    areasApi.list().then((r) => setAreas(Array.isArray(r) ? r : [])).finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editing) {
        await areasApi.update(editing.areaId, {
          name: form.name,
          type: form.type || undefined,
          capacity: form.capacity ? parseInt(form.capacity, 10) : undefined,
        });
      } else {
        await areasApi.create({
          name: form.name,
          type: form.type || undefined,
          capacity: form.capacity ? parseInt(form.capacity, 10) : undefined,
        });
      }
      setEditing(null);
      setForm({ name: '', type: '', capacity: '' });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this area?')) return;
    try {
      await areasApi.delete(id);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  }

  if (loading) return <div className="text-slate-400">Loading…</div>;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h2 className="text-lg font-semibold text-slate-100">Areas</h2>
      <form onSubmit={handleSubmit} className="flex flex-wrap gap-2 rounded border border-slate-600 bg-slate-800 p-4">
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="Name"
          className="rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white"
          required
        />
        <input
          type="text"
          value={form.type}
          onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
          placeholder="Type"
          className="rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white"
        />
        <input
          type="number"
          value={form.capacity}
          onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
          placeholder="Capacity"
          className="w-24 rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white"
        />
        <button type="submit" disabled={saving} className="rounded bg-primary-600 px-4 py-2 text-white hover:bg-primary-700 disabled:opacity-50">
          {editing ? 'Update' : 'Add'}
        </button>
        {editing && (
          <button type="button" onClick={() => { setEditing(null); setForm({ name: '', type: '', capacity: '' }); }} className="rounded border border-slate-600 px-4 py-2 text-slate-300">
            Cancel
          </button>
        )}
      </form>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <ul className="space-y-2">
        {areas.map((a) => (
          <li key={a.areaId} className="flex items-center justify-between rounded border border-slate-600 bg-slate-800 p-3">
            <div>
              <span className="font-medium text-slate-200">{a.name}</span>
              <span className="ml-2 text-sm text-slate-400">{a.type} {a.capacity != null ? `· Cap ${a.capacity}` : ''}</span>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => { setEditing(a); setForm({ name: a.name, type: a.type || '', capacity: a.capacity != null ? String(a.capacity) : '' }); }} className="text-sm text-primary-400 hover:underline">
                Edit
              </button>
              <button type="button" onClick={() => handleDelete(a.areaId)} className="text-sm text-red-400 hover:underline">
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
