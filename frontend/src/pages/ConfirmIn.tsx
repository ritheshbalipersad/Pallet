import { useState, useEffect } from 'react';
import { palletsApi, movementsApi } from '../api/client';
import BarcodeInput from '../components/BarcodeInput';

type Movement = {
  movementId: number;
  pallet: { palletId: number; barcode: string };
  toArea: { name: string };
  fromArea?: { name: string };
  movementStatus: string;
  outAt: string;
};

function toDatetimeLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day}T${h}:${min}`;
}

function normalizeMovement(m: Record<string, unknown>): Movement {
  const movementId = Number((m as { movementId?: number }).movementId ?? (m as { movement_id?: number }).movement_id);
  const pallet = (m.pallet ?? (m as { pallet?: unknown }).pallet) as { palletId?: number; pallet_id?: number; barcode?: string };
  const toArea = (m.toArea ?? (m as { to_area?: unknown }).to_area) as { name?: string };
  return {
    movementId: Number.isNaN(movementId) ? 0 : movementId,
    pallet: {
      palletId: Number(pallet?.palletId ?? pallet?.pallet_id ?? 0),
      barcode: String(pallet?.barcode ?? ''),
    },
    toArea: { name: String(toArea?.name ?? '') },
    fromArea: (m.fromArea ?? (m as { from_area?: unknown }).from_area) as { name?: string } | undefined,
    movementStatus: String((m as { movementStatus?: string }).movementStatus ?? (m as { movement_status?: string }).movement_status ?? ''),
    outAt: String((m as { outAt?: string }).outAt ?? (m as { out_at?: string }).out_at ?? ''),
  };
}

export default function ConfirmIn() {
  const [barcode, setBarcode] = useState('');
  const [pending, setPending] = useState<Movement[]>([]);
  const [selected, setSelected] = useState<Movement | null>(null);
  const [inDateTime, setInDateTime] = useState(() => toDatetimeLocal(new Date()));
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function loadPending() {
    movementsApi.list({ movementStatus: 'Pending', limit: 50 }).then((r) => {
      const raw = (r as { items: unknown[] }).items ?? [];
      const list = raw
        .map((item) => normalizeMovement(item as Record<string, unknown>))
        .filter((m) => m.movementId > 0);
      setPending(list);
    }).catch(() => setPending([]));
  }

  useEffect(() => {
    loadPending();
  }, []);

  async function handleLookup() {
    const code = barcode.trim();
    if (!code) return;
    setError('');
    try {
      const { found, pallet } = await palletsApi.lookup(code);
      if (!found || !pallet) {
        setError('Pallet not found');
        setSelected(null);
        return;
      }
      const palletId = (pallet as { palletId?: number }).palletId ?? (pallet as { pallet_id?: number }).pallet_id;
      const m = pending.find((x) => x.pallet.palletId === palletId);
      if (m) {
        setSelected(m);
        setInDateTime(toDatetimeLocal(new Date()));
      } else setError('No pending movement for this pallet');
    } catch {
      setError('Lookup failed');
      setSelected(null);
    }
  }

  async function handleConfirm() {
    if (!selected || !selected.movementId) return;
    setLoading(true);
    setError('');
    try {
      const inAt = inDateTime.trim() ? new Date(inDateTime.trim()).toISOString() : undefined;
      await movementsApi.confirm(selected.movementId, { notes: notes.trim() || undefined, inAt });
      setPending((prev) => prev.filter((m) => m.movementId !== selected.movementId));
      setSelected(null);
      setBarcode('');
      setNotes('');
      setInDateTime(toDatetimeLocal(new Date()));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Confirm failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h2 className="text-lg font-semibold text-slate-100">Confirm in</h2>
      <div className="rounded-xl border border-slate-600 bg-slate-800 p-4">
        <label className="block text-sm text-slate-400">Scan pallet barcode</label>
        <div className="mt-1 flex gap-2 items-start">
          <BarcodeInput
            value={barcode}
            onChange={(v) => { setBarcode(v); setSelected(null); setError(''); }}
            placeholder="Barcode"
            compact
            inputClassName="flex-1"
          />
          <button type="button" onClick={handleLookup} className="rounded bg-slate-600 px-4 py-2 text-white hover:bg-slate-500">
            Lookup
          </button>
        </div>
        {selected && (
          <div className="mt-3 rounded bg-slate-700 p-3">
            <p className="font-medium text-slate-200">{selected.pallet.barcode} → {selected.toArea.name}</p>
            <p className="text-sm text-slate-400">Out at {new Date(selected.outAt).toLocaleString()}</p>
            <div className="mt-2">
              <label className="block text-sm text-slate-400">In date & time</label>
              <input
                type="datetime-local"
                value={inDateTime}
                onChange={(e) => setInDateTime(e.target.value)}
                className="mt-1 w-full rounded border border-slate-600 bg-slate-800 px-3 py-2 text-white"
              />
            </div>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes (optional)"
              className="mt-2 w-full rounded border border-slate-600 bg-slate-800 px-3 py-2 text-white"
            />
            <button
              type="button"
              onClick={handleConfirm}
              disabled={loading}
              className="mt-2 w-full rounded bg-primary-600 py-2 text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? 'Confirming…' : 'Confirm in'}
            </button>
          </div>
        )}
        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
      </div>
      <div className="rounded-xl border border-slate-600 bg-slate-800 p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-slate-200">Pending movements ({pending.length})</h3>
          <button type="button" onClick={loadPending} className="rounded border border-slate-600 px-2 py-1 text-sm text-slate-400 hover:bg-slate-700">
            Refresh
          </button>
        </div>
        <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto text-sm text-slate-400">
          {pending.slice(0, 20).map((m) => (
            <li key={m.movementId}>
              {m.pallet.barcode} → {m.toArea.name} ({new Date(m.outAt).toLocaleDateString()})
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
