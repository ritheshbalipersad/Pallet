import { useState, useEffect } from 'react';
import { exportsApi } from '../api/client';

type ExportItem = { exportId: number; reportType: string; status: string; generatedAt: string };

function normalizeExportItem(raw: Record<string, unknown>): ExportItem {
  return {
    exportId: Number(raw.exportId ?? raw.export_id ?? 0),
    reportType: String(raw.reportType ?? raw.report_type ?? ''),
    status: String(raw.status ?? ''),
    generatedAt: String(raw.generatedAt ?? raw.generated_at ?? ''),
  };
}

export default function Exports() {
  const [list, setList] = useState<ExportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setError('');
    exportsApi
      .list(1, 30)
      .then((r) => {
        const rawItems = Array.isArray(r?.items) ? r.items : [];
        setList(rawItems.map((item) => normalizeExportItem(item as Record<string, unknown>)));
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load exports');
        setList([]);
      })
      .finally(() => setLoading(false));
  }, []);

  function handleDownload(id: number) {
    const token = localStorage.getItem('token');
    fetch(`/api/exports/${id}/download`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => {
        if (!res.ok) throw new Error('Download failed');
        return res.blob();
      })
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `export_${id}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      })
      .catch((err) => {
        console.error(err);
        alert('Download failed. The file may not be ready yet.');
      });
  }

  if (loading) return <div className="text-slate-400">Loading…</div>;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h2 className="text-lg font-semibold text-slate-100">My exports</h2>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <p className="text-sm text-slate-400">Request exports from Reports. When status is Completed, download the CSV.</p>
      <ul className="space-y-2">
        {list.length === 0 ? (
          <li className="rounded border border-slate-600 bg-slate-800 p-4 text-slate-400">No exports yet.</li>
        ) : (
          list.map((e) => (
            <li key={e.exportId} className="flex items-center justify-between rounded border border-slate-600 bg-slate-800 p-4">
              <div>
                <span className="font-medium text-slate-200">{e.reportType}</span>
                <span className="ml-2 text-sm text-slate-400">{new Date(e.generatedAt).toLocaleString()}</span>
                <span className={`ml-2 rounded px-2 py-0.5 text-xs ${e.status === 'Completed' ? 'bg-green-900 text-green-300' : e.status === 'Failed' ? 'bg-red-900 text-red-300' : 'bg-slate-600 text-slate-300'}`}>
                  {e.status}
                </span>
              </div>
              {e.status === 'Completed' && (
                <button
                  type="button"
                  onClick={() => handleDownload(e.exportId)}
                  className="rounded bg-primary-600 px-3 py-1 text-sm text-white hover:bg-primary-700"
                >
                  Download
                </button>
              )}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
