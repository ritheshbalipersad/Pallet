import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { palletsApi, areasApi } from '../api/client';

export default function AddPallet() {
  const location = useLocation();
  const navigate = useNavigate();
  const initialBarcode = (location.state as { barcode?: string } | null)?.barcode ?? '';
  const [barcode, setBarcode] = useState(initialBarcode);
  const [type, setType] = useState('');
  const [size, setSize] = useState('');
  const [currentAreaId, setCurrentAreaId] = useState<number | ''>('');
  const [owner, setOwner] = useState('');
  const [areas, setAreas] = useState<{ areaId: number; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    areasApi.list().then((list) => setAreas(Array.isArray(list) ? list : []));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!barcode.trim() || !currentAreaId) {
      setError('Barcode and area are required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const pallet = await palletsApi.create({
        barcode: barcode.trim(),
        type: type.trim() || undefined,
        size: size.trim() || undefined,
        currentAreaId: Number(currentAreaId),
        owner: owner.trim() || undefined,
      }) as { palletId?: number; pallet_id?: number };
      const id = pallet?.palletId ?? pallet?.pallet_id;
      if (id != null && !Number.isNaN(Number(id))) {
        navigate(`/pallet/${id}`);
      } else {
        navigate('/pallets');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h2 className="text-lg font-semibold text-slate-100">Add pallet</h2>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-600 bg-slate-800 p-4">
        <div>
          <label className="block text-sm text-slate-400">Barcode *</label>
          <input
            type="text"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            className="mt-1 w-full rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white"
            required
          />
        </div>
        <div>
          <label className="block text-sm text-slate-400">Area *</label>
          <select
            value={currentAreaId}
            onChange={(e) => setCurrentAreaId(e.target.value ? Number(e.target.value) : '')}
            className="mt-1 w-full rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white"
            required
          >
            <option value="">Select area</option>
            {areas.map((a) => (
              <option key={a.areaId} value={a.areaId}>{a.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-slate-400">Type</label>
          <input
            type="text"
            value={type}
            onChange={(e) => setType(e.target.value)}
            placeholder="e.g. Euro, Standard"
            className="mt-1 w-full rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white placeholder-slate-500"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-400">Size</label>
          <input
            type="text"
            value={size}
            onChange={(e) => setSize(e.target.value)}
            placeholder="e.g. 120x80"
            className="mt-1 w-full rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white placeholder-slate-500"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-400">Owner</label>
          <input
            type="text"
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            className="mt-1 w-full rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white"
          />
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-primary-600 py-2 font-medium text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {loading ? 'Creating…' : 'Create pallet'}
        </button>
      </form>
    </div>
  );
}
