import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { palletsApi, areasApi, movementsApi } from '../api/client';
import BarcodeInput from '../components/BarcodeInput';

export default function MoveOut() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { palletId?: number; barcode?: string } | null;
  const [barcode, setBarcode] = useState(state?.barcode ?? '');
  const [pallet, setPallet] = useState<{ palletId: number; barcode: string; currentAreaId?: number; currentArea?: { name: string } } | null>(null);
  const [areas, setAreas] = useState<{ areaId: number; name: string }[]>([]);
  const [toAreaId, setToAreaId] = useState<number | ''>('');
  const [dueBack, setDueBack] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    areasApi.list().then((list) => setAreas(Array.isArray(list) ? list : []));
  }, []);

  useEffect(() => {
    if (state?.palletId) {
      palletsApi.get(state.palletId).then((p) => setPallet(p as { palletId: number; barcode: string; currentArea?: { name: string } }));
    } else {
      setPallet(null);
    }
  }, [state?.palletId]);

  async function handleLookup() {
    const code = barcode.trim();
    if (!code) return;
    setError('');
    try {
      const { found, pallet: p } = await palletsApi.lookup(code);
      const pid = (p as { palletId?: number; pallet_id?: number })?.palletId ?? (p as { pallet_id?: number })?.pallet_id;
      if (found && p && pid != null && !Number.isNaN(Number(pid))) {
        setPallet({
          palletId: Number(pid),
          barcode: String((p as { barcode?: string }).barcode ?? ''),
          currentAreaId: (p as { currentAreaId?: number }).currentAreaId ?? (p as { current_area_id?: number }).current_area_id,
          currentArea: (p as { currentArea?: { name: string } }).currentArea ?? (p as { current_area?: { name: string } }).current_area,
        });
      } else {
        setError('Pallet not found');
        setPallet(null);
      }
    } catch {
      setError('Lookup failed');
      setPallet(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pallet || !toAreaId) return;
    setLoading(true);
    setError('');
    try {
      const eta = dueBack.trim() ? new Date(dueBack.trim()).toISOString() : undefined;
      await movementsApi.start({ palletId: pallet.palletId, toAreaId: Number(toAreaId), eta, notes: notes.trim() || undefined });
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Start movement failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h2 className="text-lg font-semibold text-slate-100">Move out</h2>
      <div className="rounded-xl border border-slate-600 bg-slate-800 p-4">
        <label className="block text-sm text-slate-400">Pallet barcode</label>
        <div className="mt-1 flex gap-2 items-start">
          <BarcodeInput
            value={barcode}
            onChange={(v) => { setBarcode(v); setPallet(null); }}
            placeholder="Scan or enter"
            compact
            inputClassName="flex-1"
          />
          <button type="button" onClick={handleLookup} className="rounded bg-slate-600 px-4 py-2 text-white hover:bg-slate-500">
            Lookup
          </button>
        </div>
        {pallet && (
          <p className="mt-2 text-sm text-slate-300">
            Pallet {pallet.barcode} · Current: {pallet.currentArea?.name ?? '—'}
          </p>
        )}
      </div>
      {pallet && (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-600 bg-slate-800 p-4">
          <div>
            <label className="block text-sm text-slate-400">Destination area *</label>
            <select
              value={toAreaId}
              onChange={(e) => setToAreaId(e.target.value ? Number(e.target.value) : '')}
              className="mt-1 w-full rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white"
              required
            >
              <option value="">Select area</option>
              {areas.filter((a) => a.areaId !== pallet.currentAreaId).map((a) => (
                <option key={a.areaId} value={a.areaId}>{a.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400">Due back date</label>
            <input
              type="datetime-local"
              value={dueBack}
              onChange={(e) => setDueBack(e.target.value)}
              className="mt-1 w-full rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400">Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 w-full rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white"
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-primary-600 py-2 font-medium text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? 'Starting…' : 'Start movement'}
          </button>
        </form>
      )}
    </div>
  );
}
