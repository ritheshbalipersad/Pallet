import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { palletsApi, movementsApi } from '../api/client';

type Pallet = {
  palletId: number;
  barcode: string;
  type: string;
  size: string;
  conditionStatus: string;
  currentArea: { areaId: number; name: string } | null;
  owner: string | null;
};

function normalizePallet(p: Record<string, unknown> | null): Pallet | null {
  if (!p) return null;
  const palletId = Number((p as { palletId?: number; pallet_id?: number }).palletId ?? (p as { pallet_id?: number }).pallet_id);
  if (Number.isNaN(palletId)) return null;
  const currentArea = (p.currentArea ?? (p as { current_area?: unknown }).current_area) as { areaId?: number; name?: string; area_id?: number } | null | undefined;
  return {
    palletId,
    barcode: String(p.barcode ?? ''),
    type: String((p as { type?: string }).type ?? ''),
    size: String((p as { size?: string }).size ?? ''),
    conditionStatus: String((p as { conditionStatus?: string }).conditionStatus ?? (p as { condition_status?: string }).condition_status ?? 'Good'),
    currentArea: currentArea ? { areaId: currentArea.areaId ?? currentArea.area_id ?? 0, name: currentArea.name ?? '' } : null,
    owner: p.owner != null ? String(p.owner) : null,
  };
}

const STATUS_OPTIONS = ['Good', 'Damaged', 'Lost', 'Stolen', 'Unfit'] as const;

export default function PalletDetail() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const palletFromState = (location.state as { palletFromLookup?: Record<string, unknown> } | null)?.palletFromLookup;
  const initialPallet = normalizePallet(palletFromState ?? null);
  const [pallet, setPallet] = useState<Pallet | null>(initialPallet);
  const [movements, setMovements] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState<string>(initialPallet?.conditionStatus ?? '');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!id) return;
    const numId = Number(id);
    if (Number.isNaN(numId)) {
      setLoading(false);
      return;
    }
    setPallet((prev) => prev ?? normalizePallet(palletFromState ?? null));
    Promise.all([
      palletsApi.get(numId),
      movementsApi.list({ palletId: numId, limit: 10 }),
    ])
      .then(([p, m]) => {
        const normalized = normalizePallet(p as Record<string, unknown>);
        if (normalized) {
          setPallet(normalized);
          setNewStatus(normalized.conditionStatus);
        }
        setMovements((m as { items: unknown[] }).items ?? []);
      })
      .catch(() => {
        if (!palletFromState) setPallet(null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function handleStatusChange() {
    if (!id || !newStatus || newStatus === pallet?.conditionStatus) return;
    setUpdating(true);
    try {
      await palletsApi.update(Number(id), {
        conditionStatus: newStatus,
        ...(reason.trim() ? { statusChangeReason: reason.trim() } : {}),
      });
      setPallet((prev) => (prev ? { ...prev, conditionStatus: newStatus } : null));
      setReason('');
    } finally {
      setUpdating(false);
    }
  }

  if (loading || !pallet) {
    return <div className="text-slate-400">{loading ? 'Loading…' : 'Pallet not found.'}</div>;
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="rounded-xl border border-slate-600 bg-slate-800 p-4">
        <h2 className="text-lg font-semibold text-slate-100">Pallet {pallet.barcode}</h2>
        <dl className="mt-3 space-y-1 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-400">Type / Size</dt>
            <dd className="text-slate-200">{pallet.type || '—'} / {pallet.size || '—'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-400">Condition</dt>
            <dd className="text-slate-200">{pallet.conditionStatus}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-400">Current area</dt>
            <dd className="text-slate-200">{pallet.currentArea?.name ?? '—'}</dd>
          </div>
          {pallet.owner && (
            <div className="flex justify-between">
              <dt className="text-slate-400">Owner</dt>
              <dd className="text-slate-200">{pallet.owner}</dd>
            </div>
          )}
        </dl>
      </div>

      <div className="rounded-xl border border-slate-600 bg-slate-800 p-4">
        <h3 className="font-medium text-slate-200">Change status</h3>
        <p className="mt-1 text-sm text-slate-400">Optionally add a reason (e.g. for Damaged/Lost).</p>
        <div className="mt-3 space-y-2">
          <select
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            className="w-full rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason (optional)"
            className="w-full rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white placeholder-slate-500"
          />
          <button
            type="button"
            onClick={handleStatusChange}
            disabled={updating || newStatus === pallet.conditionStatus}
            className="w-full rounded bg-primary-600 py-2 text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {updating ? 'Saving…' : 'Update status'}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-600 bg-slate-800 p-4">
        <h3 className="font-medium text-slate-200">Recent movements</h3>
        <ul className="mt-2 space-y-2">
          {movements.length === 0 ? (
            <li className="text-sm text-slate-400">No movements</li>
          ) : (
            (movements as { movementId: number; fromArea?: { name: string }; toArea: { name: string }; movementStatus: string; outAt: string }[]).map((m) => (
              <li key={m.movementId} className="flex justify-between text-sm">
                <span className="text-slate-300">{m.fromArea?.name ?? '?'} → {m.toArea?.name}</span>
                <span className="text-slate-400">{m.movementStatus} · {new Date(m.outAt).toLocaleDateString()}</span>
              </li>
            ))
          )}
        </ul>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => navigate('/move-out', { state: { palletId: pallet.palletId, barcode: pallet.barcode } })}
          className="flex-1 rounded bg-slate-600 py-2 text-white hover:bg-slate-500"
        >
          Move out
        </button>
        <button type="button" onClick={() => navigate('/scan')} className="rounded border border-slate-600 px-4 py-2 text-slate-300">
          Scan another
        </button>
      </div>
    </div>
  );
}
