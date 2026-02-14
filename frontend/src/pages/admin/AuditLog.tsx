import { useState, useEffect } from 'react';
import { auditApi } from '../../api/client';

type Entry = { auditId: string; entityType: string; entityId: string; action: string; changedBy?: number; changedAt: string; beforeData?: unknown; afterData?: unknown };

function normalizeEntry(raw: Record<string, unknown>): Entry {
  return {
    auditId: String(raw.auditId ?? raw.audit_id ?? ''),
    entityType: String(raw.entityType ?? raw.entity_type ?? ''),
    entityId: String(raw.entityId ?? raw.entity_id ?? ''),
    action: String(raw.action ?? ''),
    changedBy: raw.changedBy != null ? Number(raw.changedBy) : raw.changed_by != null ? Number(raw.changed_by) : undefined,
    changedAt: String(raw.changedAt ?? raw.changed_at ?? ''),
    beforeData: (raw.beforeData ?? raw.before_data) as unknown,
    afterData: (raw.afterData ?? raw.after_data) as unknown,
  };
}

function getPalletBarcode(entry: Entry): string | null {
  const after = entry.afterData as { barcode?: string } | undefined;
  const before = entry.beforeData as { barcode?: string } | undefined;
  return after?.barcode ?? before?.barcode ?? null;
}

export default function AuditLog() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [entityType, setEntityType] = useState('');
  const [palletBarcode, setPalletBarcode] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError('');
    auditApi
      .list({
        entityType: entityType.trim() || undefined,
        palletBarcode: palletBarcode.trim() || undefined,
        page,
        limit: 30,
      })
      .then((r) => {
        const rawItems = Array.isArray(r?.items) ? r.items : [];
        setEntries(rawItems.map((item) => normalizeEntry(item as Record<string, unknown>)));
        setTotal(Number(r?.total ?? 0));
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load audit log');
        setEntries([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [entityType, palletBarcode, page]);

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <h2 className="text-lg font-semibold text-slate-100">Audit log</h2>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="flex flex-wrap gap-2 items-center">
        <input
          type="text"
          value={entityType}
          onChange={(e) => { setEntityType(e.target.value); setPage(1); }}
          placeholder="Entity type (e.g. Pallet, Area)"
          className="rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white w-48"
        />
        <input
          type="text"
          value={palletBarcode}
          onChange={(e) => { setPalletBarcode(e.target.value); setPage(1); }}
          placeholder="Pallet barcode"
          className="rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white w-40"
        />
        <button type="button" onClick={() => setPage(1)} className="rounded bg-slate-600 px-4 py-2 text-white hover:bg-slate-500">
          Filter
        </button>
      </div>
      {loading ? (
        <div className="text-slate-400">Loading…</div>
      ) : (
        <>
          <ul className="space-y-2">
            {entries.length === 0 && !loading ? (
              <li className="rounded border border-slate-600 bg-slate-800 p-4 text-slate-400">No audit entries found.</li>
            ) : (
              entries.map((e) => (
              <li key={String(e.auditId) || `audit-${e.entityType}-${e.entityId}-${e.changedAt}`} className="rounded border border-slate-600 bg-slate-800 p-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-primary-400">{e.action}</span>
                  <span className="text-slate-400">{e.entityType}#{e.entityId}</span>
                  {e.entityType === 'Pallet' && getPalletBarcode(e) && (
                    <span className="rounded bg-slate-600 px-2 py-0.5 text-slate-200 font-mono text-xs">{getPalletBarcode(e)}</span>
                  )}
                  <span className="text-slate-500">{new Date(e.changedAt).toLocaleString()}</span>
                  {e.changedBy != null && <span className="text-slate-500">by user {e.changedBy}</span>}
                </div>
                {(e.beforeData != null || e.afterData != null) && (
                  <pre className="mt-2 max-h-24 overflow-auto rounded bg-slate-900 p-2 text-xs text-slate-400">
                    {JSON.stringify({ before: e.beforeData, after: e.afterData }, null, 1)}
                  </pre>
                )}
              </li>
              ))
            )}
          </ul>
          <div className="flex justify-between text-sm text-slate-400">
            <span>Page {page} · {total} total</span>
            <div className="gap-2">
              <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded border border-slate-600 px-2 py-1 disabled:opacity-50">
                Previous
              </button>
              <button type="button" disabled={page * 30 >= total} onClick={() => setPage((p) => p + 1)} className="ml-2 rounded border border-slate-600 px-2 py-1 disabled:opacity-50">
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
