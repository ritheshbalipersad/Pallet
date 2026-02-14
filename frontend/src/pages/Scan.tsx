import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { palletsApi } from '../api/client';
import BarcodeInput from '../components/BarcodeInput';

export default function Scan() {
  const [barcode, setBarcode] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function handleLookup(code: string) {
    setError('');
    try {
      const { found, pallet } = await palletsApi.lookup(code);
      const p = pallet as { palletId?: number; pallet_id?: number; [k: string]: unknown } | null;
      const id = p?.palletId ?? p?.pallet_id;
      if (found && p && id != null && !Number.isNaN(Number(id))) {
        navigate(`/pallet/${id}`, { state: { palletFromLookup: p } });
      } else {
        navigate('/add-pallet', { state: { barcode: code } });
      }
    } catch {
      setError('Lookup failed');
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const code = barcode.trim();
    if (!code) return;
    handleLookup(code);
  }

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h2 className="text-lg font-semibold text-slate-100">Scan or enter barcode</h2>
      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="flex gap-2">
          <div className="flex-1 min-w-0">
            <BarcodeInput
              value={barcode}
              onChange={setBarcode}
              placeholder="Barcode"
              onScanned={handleLookup}
              compact
              inputClassName="flex-1"
            />
          </div>
          <button type="submit" className="rounded bg-primary-600 px-4 py-2 font-medium text-white hover:bg-primary-700">
            Lookup
          </button>
        </div>
      </form>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
