import { useState, useEffect } from 'react';
import { reportsApi, exportsApi } from '../api/client';

type AreaSummary = { areaId: number; name: string; type: string; capacity: number; palletCount: number };
type PalletStatus = { conditionStatus: string; count: number };

export default function Reports() {
  const [areaSummary, setAreaSummary] = useState<AreaSummary[]>([]);
  const [palletStatus, setPalletStatus] = useState<PalletStatus[]>([]);
  const [movementHistory, setMovementHistory] = useState<unknown[]>([]);
  const [lostDamaged, setLostDamaged] = useState<unknown[]>([]);
  const [overdue, setOverdue] = useState<unknown[]>([]);
  const [tab, setTab] = useState<'area' | 'status' | 'movement' | 'lost' | 'overdue'>('area');
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');

  useEffect(() => {
    reportsApi.areaSummary().then(setAreaSummary);
    reportsApi.palletStatus().then(setPalletStatus);
    reportsApi.movementHistory({ limit: 50 }).then((r) => setMovementHistory(Array.isArray(r) ? r : []));
    reportsApi.lostDamaged().then((r) => setLostDamaged(Array.isArray(r) ? r : []));
    reportsApi.overdueInbound().then((r) => setOverdue(Array.isArray(r) ? r : []));
  }, []);

  async function handleExport(reportType: string) {
    setExporting(true);
    setExportError('');
    try {
      await exportsApi.create({ reportType });
      window.location.href = '/exports';
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Export request failed');
    } finally {
      setExporting(false);
    }
  }

  const tabs = [
    { id: 'area' as const, label: 'Area summary', count: areaSummary.length },
    { id: 'status' as const, label: 'Pallet status', count: palletStatus.length },
    { id: 'movement' as const, label: 'Movement history', count: movementHistory.length },
    { id: 'lost' as const, label: 'Lost/Damaged', count: lostDamaged.length },
    { id: 'overdue' as const, label: 'Overdue inbound', count: overdue.length },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <h2 className="text-lg font-semibold text-slate-100">Reports</h2>
      {exportError && <p className="text-sm text-red-400">{exportError}</p>}
      <div className="flex gap-2 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`whitespace-nowrap rounded px-3 py-2 text-sm ${tab === t.id ? 'bg-primary-600 text-white' : 'bg-slate-700 text-slate-300'}`}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>
      <div className="rounded-xl border border-slate-600 bg-slate-800 p-4">
        {tab === 'area' && (
          <>
            <div className="flex justify-between">
              <h3 className="font-medium text-slate-200">Area summary</h3>
              <button
                type="button"
                disabled={exporting}
                onClick={() => handleExport('area-summary')}
                className="text-sm text-primary-400 hover:underline disabled:opacity-50"
              >
                Export CSV
              </button>
            </div>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400">
                    <th className="p-2">Name</th>
                    <th className="p-2">Type</th>
                    <th className="p-2">Capacity</th>
                    <th className="p-2">Pallets</th>
                  </tr>
                </thead>
                <tbody>
                  {areaSummary.map((r) => (
                    <tr key={r.areaId} className="border-t border-slate-600">
                      <td className="p-2">{r.name}</td>
                      <td className="p-2">{r.type}</td>
                      <td className="p-2">{r.capacity ?? '—'}</td>
                      <td className="p-2">{r.palletCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        {tab === 'status' && (
          <>
            <div className="flex justify-between">
              <h3 className="font-medium text-slate-200">Pallet status</h3>
              <button type="button" disabled={exporting} onClick={() => handleExport('pallet-status')} className="text-sm text-primary-400 hover:underline">
                Export CSV
              </button>
            </div>
            <ul className="mt-2 space-y-1 text-sm">
              {palletStatus.map((r) => (
                <li key={r.conditionStatus} className="flex justify-between">
                  <span className="text-slate-300">{r.conditionStatus}</span>
                  <span className="text-slate-400">{r.count}</span>
                </li>
              ))}
            </ul>
          </>
        )}
        {tab === 'movement' && (
          <>
            <div className="flex justify-between">
              <h3 className="font-medium text-slate-200">Movement history</h3>
              <button type="button" disabled={exporting} onClick={() => handleExport('movement-history')} className="text-sm text-primary-400 hover:underline">
                Export CSV
              </button>
            </div>
            <ul className="mt-2 max-h-64 space-y-1 overflow-y-auto text-sm text-slate-400">
              {(movementHistory as { pallet?: { barcode: string }; fromArea?: { name: string }; toArea: { name: string }; outAt: string }[]).slice(0, 50).map((m, i) => (
                <li key={i}>{m.pallet?.barcode} {m.fromArea?.name ?? '?'} → {m.toArea?.name} ({new Date(m.outAt).toLocaleString()})</li>
              ))}
            </ul>
          </>
        )}
        {tab === 'lost' && (
          <>
            <div className="flex justify-between">
              <h3 className="font-medium text-slate-200">Lost / Damaged / Stolen / Unfit</h3>
              <button type="button" disabled={exporting} onClick={() => handleExport('lost-damaged')} className="text-sm text-primary-400 hover:underline">
                Export CSV
              </button>
            </div>
            <ul className="mt-2 max-h-64 space-y-1 overflow-y-auto text-sm text-slate-400">
              {(lostDamaged as { barcode: string; conditionStatus: string; currentArea?: { name: string } }[]).map((p) => (
                <li key={p.barcode}>{p.barcode} · {p.conditionStatus} · {p.currentArea?.name ?? '—'}</li>
              ))}
            </ul>
          </>
        )}
        {tab === 'overdue' && (
          <>
            <div className="flex justify-between">
              <h3 className="font-medium text-slate-200">Overdue inbound</h3>
              <button type="button" disabled={exporting} onClick={() => handleExport('overdue-inbound')} className="text-sm text-primary-400 hover:underline">
                Export CSV
              </button>
            </div>
            <ul className="mt-2 max-h-64 space-y-1 overflow-y-auto text-sm text-slate-400">
              {(overdue as { pallet?: { barcode: string }; toArea?: { name: string }; eta?: string }[]).map((m, i) => (
                <li key={i}>{m.pallet?.barcode} → {m.toArea?.name} (ETA {m.eta ? new Date(m.eta).toLocaleString() : '—'})</li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
