import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrowserMultiFormatReader } from '@zxing/library';
import { palletsApi } from '../api/client';

export default function Scan() {
  const [barcode, setBarcode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const navigate = useNavigate();

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
    if (readerRef.current) {
      readerRef.current.reset();
      readerRef.current = null;
    }
  }, [stream]);

  useEffect(() => {
    if (!scanning) {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
        setStream(null);
      }
      return;
    }
    setError('');
    let cancelled = false;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      .catch(() => navigator.mediaDevices.getUserMedia({ video: true, audio: false }))
      .then((s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        setStream(s);
      })
      .catch(() => {
        if (!cancelled) {
          setError('Camera access denied or not available. Use the barcode field to type or paste.');
          setScanning(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [scanning]);

  // Attach stream to video once both stream and video element are ready (fixes black screen)
  useEffect(() => {
    if (!stream || !videoRef.current) return;
    const video = videoRef.current;
    video.srcObject = stream;
    video.muted = true;
    video.playsInline = true;
    video.play().catch(() => {});
    return () => {
      video.srcObject = null;
    };
  }, [stream]);

  // Start barcode decoder when we have stream and video
  useEffect(() => {
    if (!scanning || !stream || !videoRef.current) return;
    const video = videoRef.current;
    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;
    reader.decodeFromVideoDevice(undefined, video, (result) => {
      if (result && stream.active) {
        const code = result.getText();
        setBarcode(code);
        stream.getTracks().forEach((t) => t.stop());
        setStream(null);
        setScanning(false);
        handleLookup(code);
      }
    });
    return () => {
      reader.reset();
      readerRef.current = null;
    };
  }, [scanning, stream]);

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
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          placeholder="Barcode"
          className="flex-1 rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white placeholder-slate-500 focus:border-primary-500 focus:outline-none"
          autoFocus
        />
        <button type="submit" className="rounded bg-primary-600 px-4 py-2 font-medium text-white hover:bg-primary-700">
          Lookup
        </button>
      </form>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="flex justify-center">
        {!scanning ? (
          <button
            type="button"
            onClick={() => setScanning(true)}
            className="rounded-xl border border-slate-600 bg-slate-800 px-6 py-4 text-slate-200 hover:bg-slate-700"
          >
            📷 Open camera to scan
          </button>
        ) : (
          <div className="relative min-h-[240px] w-full overflow-hidden rounded-lg bg-slate-900">
            <video
              ref={videoRef}
              className="h-full min-h-[240px] w-full rounded-lg object-cover"
              playsInline
              muted
              autoPlay
              style={{ transform: 'scaleX(1)' }}
            />
            <button
              type="button"
              onClick={() => {
                stopCamera();
                setScanning(false);
              }}
              className="absolute right-2 top-2 rounded bg-red-600 px-2 py-1 text-sm text-white"
            >
              Stop
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
