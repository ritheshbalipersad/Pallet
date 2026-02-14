import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { movementsApi, areasApi, palletsApi } from '../api/client';
import BarcodeInput from '../components/BarcodeInput';

type Movement = {
  movementId: number;
  pallet: { palletId: number; barcode: string };
  fromArea: { areaId: number; name: string } | null;
  toArea: { areaId: number; name: string };
  movementStatus: string;
  outAt: string;
  inAt: string | null;
  createdAt?: string;
};

function normalizeMovement(m: Record<string, unknown>): Movement {
  const movementId = Number(m.movementId ?? (m as { movement_id?: number }).movement_id);
  const pallet = (m.pallet ?? (m as { pallet?: unknown }).pallet) as { palletId?: number; pallet_id?: number; barcode?: string };
  const fromArea = (m.fromArea ?? (m as { from_area?: unknown }).from_area) as { areaId?: number; name?: string } | null;
  const toArea = (m.toArea ?? (m as { to_area?: unknown }).to_area) as { areaId?: number; name?: string };
  return {
    movementId: Number.isNaN(movementId) ? 0 : movementId,
    pallet: {
      palletId: Number(pallet?.palletId ?? pallet?.pallet_id ?? 0),
      barcode: String(pallet?.barcode ?? ''),
    },
    fromArea: fromArea ? { areaId: fromArea.areaId ?? 0, name: String(fromArea.name ?? '') } : null,
    toArea: { areaId: toArea?.areaId ?? 0, name: String(toArea?.name ?? '') },
    movementStatus: String(m.movementStatus ?? (m as { movement_status?: string }).movement_status ?? ''),
    outAt: String(m.outAt ?? (m as { out_at?: string }).out_at ?? ''),
    inAt: m.inAt != null ? String(m.inAt) : (m as { in_at?: string }).in_at != null ? String((m as { in_at: string }).in_at) : null,
    createdAt: m.createdAt != null ? String(m.createdAt) : (m as { created_at?: string }).created_at,
  };
}

const ORDER_OPTIONS = [
  { value: 'out_at-DESC', label: 'Out date (newest first)', orderBy: 'out_at' as const, order: 'DESC' as const },
  { value: 'out_at-ASC', label: 'Out date (oldest first)', orderBy: 'out_at' as const, order: 'ASC' as const },
  { value: 'in_at-DESC', label: 'In date (newest first)', orderBy: 'in_at' as const, order: 'DESC' as const },
  { value: 'in_at-ASC', label: 'In date (oldest first)', orderBy: 'in_at' as const, order: 'ASC' as const },
  { value: 'created_at-DESC', label: 'Movement date (newest first)', orderBy: 'created_at' as const, order: 'DESC' as const },
  { value: 'created_at-ASC', label: 'Movement date (oldest first)', orderBy: 'created_at' as const, order: 'ASC' as const },
];

export default function Movements() {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [areas, setAreas] = useState<{ areaId: number; name: string }[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fromAreaId, setFromAreaId] = useState<number | ''>('');
  const [toAreaId, setToAreaId] = useState<number | ''>('');
  const [palletBarcode, setPalletBarcode] = useState('');
  const [palletId, setPalletId] = useState<number | ''>('');
  const [palletSearchError, setPalletSearchError] = useState('');
  const [orderValue, setOrderValue] = useState(ORDER_OPTIONS[0].value);
  const [page, setPage] = useState(1);
  const limit = 25;

  async function handlePalletSearch(code?: string) {
    const searchCode = (code ?? palletBarcode).trim();
    if (!searchCode) {
      setPalletId('');
      setPalletSearchError('');
      setPage(1);
      return;
    }
    if (!code) setPalletBarcode(searchCode);
    setPalletSearchError('');
    try {
      const res = await palletsApi.lookup(searchCode);
      const found = res?.found === true;
      const pallet = res?.pallet as { palletId?: number; pallet_id?: number } | null | undefined;
      const id = pallet?.palletId ?? pallet?.pallet_id;
      const numId = id != null ? Number(id) : NaN;
      if (found && !Number.isNaN(numId) && numId > 0) {
        setPalletId(numId);
        setPalletBarcode((p) => p.trim() || searchCode);
        setPage(1);
      } else {
        setPalletSearchError('Pallet not found');
        setPalletId('');
      }
    } catch {
      setPalletSearchError('Lookup failed');
      setPalletId('');
    }
  }

  function clearPalletFilter() {
    setPalletBarcode('');
    setPalletId('');
    setPalletSearchError('');
    setPage(1);
  }

  useEffect(() => {
    areasApi.list().then((list) => setAreas(Array.isArray(list) ? list : [])).catch(() => setAreas([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    setError('');
    const opt = ORDER_OPTIONS.find((o) => o.value === orderValue) ?? ORDER_OPTIONS[0];
    movementsApi
      .list({
        palletId: palletId === '' || palletId === undefined ? undefined : Number(palletId),
        fromAreaId: fromAreaId === '' ? undefined : fromAreaId,
        toAreaId: toAreaId === '' ? undefined : toAreaId,
        orderBy: opt.orderBy,
        order: opt.order,
        page,
        limit,
      })
      .then((r) => {
        const raw = (r as { items: unknown[] }).items ?? [];
        setMovements(raw.map((item) => normalizeMovement(item as Record<string, unknown>)));
        setTotal(Number((r as { total: number }).total ?? 0));
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load movements');
        setMovements([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [palletId, fromAreaId, toAreaId, orderValue, page]);

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <h2 className="text-lg font-semibold text-slate-100">Movements</h2>
      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="space-y-4 rounded-xl border border-slate-600 bg-slate-800 p-4">
        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-400">Pallet search</label>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex-1 min-w-[140px] max-w-xs">
              <BarcodeInput
                value={palletBarcode}
                onChange={(v) => { setPalletBarcode(v); setPalletSearchError(''); }}
                placeholder="Scan or enter barcode"
                compact
                inputClassName="flex-1 min-w-0 w-full"
                onScanned={(scannedCode) => handlePalletSearch(scannedCode)}
              />
            </div>
            <button
              type="button"
              onClick={() => handlePalletSearch()}
              className="rounded bg-slate-600 px-3 py-2 text-sm text-white hover:bg-slate-500 whitespace-nowrap"
            >
              Search
            </button>
            {palletId !== '' && (
              <button
                type="button"
                onClick={clearPalletFilter}
                className="rounded border border-slate-500 bg-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-600 whitespace-nowrap"
              >
                Clear pallet
              </button>
            )}
          </div>
          {palletSearchError && <p className="text-xs text-red-400">{palletSearchError}</p>}
          {palletId !== '' && !palletSearchError && <p className="text-xs text-green-400">Showing movements for this pallet only</p>}
        </div>

        <div className="flex flex-wrap items-end gap-4 border-t border-slate-600 pt-4">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-400">From area</label>
            <select
              value={fromAreaId === '' ? '' : fromAreaId}
              onChange={(e) => { setFromAreaId(e.target.value === '' ? '' : Number(e.target.value)); setPage(1); }}
              className="rounded border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white min-w-[120px]"
            >
              <option value="">All</option>
              {areas.map((a) => (
                <option key={a.areaId} value={a.areaId}>{a.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-400">To area</label>
            <select
              value={toAreaId === '' ? '' : toAreaId}
              onChange={(e) => { setToAreaId(e.target.value === '' ? '' : Number(e.target.value)); setPage(1); }}
              className="rounded border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white min-w-[120px]"
            >
              <option value="">All</option>
              {areas.map((a) => (
                <option key={a.areaId} value={a.areaId}>{a.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-400">Order by</label>
            <select
              value={orderValue}
              onChange={(e) => { setOrderValue(e.target.value); setPage(1); }}
              className="rounded border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white min-w-[180px]"
            >
              {ORDER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-slate-400">Loading…</div>
      ) : (
        <>
          <ul className="space-y-2">
            {movements.length === 0 ? (
              <li className="rounded border border-slate-600 bg-slate-800 p-4 text-slate-400">No movements found.</li>
            ) : (
              movements.map((m) => (
                <li key={m.movementId} className="flex flex-wrap items-center justify-between gap-2 rounded border border-slate-600 bg-slate-800 p-3 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link to={`/pallet/${m.pallet.palletId}`} className="font-mono text-primary-400 hover:underline">
                      {m.pallet.barcode}
                    </Link>
                    <span className="text-slate-400">
                      {m.fromArea?.name ?? '—'} → {m.toArea.name}
                    </span>
                    <span className={`rounded px-2 py-0.5 text-xs ${m.movementStatus === 'Completed' ? 'bg-green-900 text-green-300' : m.movementStatus === 'Pending' ? 'bg-amber-900 text-amber-300' : 'bg-slate-600 text-slate-300'}`}>
                      {m.movementStatus}
                    </span>
                  </div>
                  <div className="text-slate-500">
                    Out: {new Date(m.outAt).toLocaleString()}
                    {m.inAt && <> · In: {new Date(m.inAt).toLocaleString()}</>}
                  </div>
                </li>
              ))
            )}
          </ul>
          <div className="flex items-center justify-between text-sm text-slate-400">
            <span>Page {page} · {total} total</span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded border border-slate-600 px-2 py-1 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page * limit >= total}
                onClick={() => setPage((p) => p + 1)}
                className="rounded border border-slate-600 px-2 py-1 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
