import { useState, useRef, useCallback, useEffect } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';

type BarcodeInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  /** Called when a barcode is scanned (after onChange). Use to e.g. trigger lookup. */
  onScanned?: (code: string) => void;
  /** If true, show a compact camera button next to the input instead of below. */
  compact?: boolean;
  disabled?: boolean;
  required?: boolean;
};

export default function BarcodeInput({
  value,
  onChange,
  placeholder = 'Barcode',
  className = '',
  inputClassName = '',
  onScanned,
  compact = false,
  disabled = false,
  required = false,
}: BarcodeInputProps) {
  const [scanning, setScanning] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
    if (readerRef.current) {
      readerRef.current.reset();
      readerRef.current = null;
    }
    setScanning(false);
    setCameraError('');
  }, [stream]);

  useEffect(() => {
    if (!scanning) {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
        setStream(null);
      }
      return;
    }
    setCameraError('');
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
          setCameraError('Camera not available');
          setScanning(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [scanning]);

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

  useEffect(() => {
    if (!scanning || !stream || !videoRef.current) return;
    const video = videoRef.current;
    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;
    reader.decodeFromVideoDevice(undefined, video, (result) => {
      if (result && stream.active) {
        const code = result.getText();
        onChange(code);
        stream.getTracks().forEach((t) => t.stop());
        setStream(null);
        setScanning(false);
        readerRef.current = null;
        onScanned?.(code);
      }
    });
    return () => {
      reader.reset();
      readerRef.current = null;
    };
  }, [scanning, stream, onChange, onScanned]);

  const cameraButton = (
    <button
      type="button"
      onClick={() => setScanning(true)}
      disabled={disabled}
      className={compact ? 'rounded border border-slate-500 bg-slate-700 px-2 py-2 text-white hover:bg-slate-600 disabled:opacity-50' : 'rounded-xl border border-slate-600 bg-slate-800 px-4 py-2 text-slate-200 hover:bg-slate-700 disabled:opacity-50'}
      title="Open camera to scan"
    >
      📷
    </button>
  );

  return (
    <div className={className}>
      <div className={compact ? 'flex gap-2' : 'space-y-2'}>
        <div className="flex gap-2 flex-1 min-w-0">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            className={`flex-1 rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white placeholder-slate-500 focus:border-primary-500 focus:outline-none ${inputClassName}`}
          />
          {cameraButton}
        </div>
      </div>
      {cameraError && <p className="mt-1 text-xs text-red-400">{cameraError}</p>}
      {scanning && (
        <div className="relative mt-2 min-h-[200px] w-full overflow-hidden rounded-lg bg-slate-900">
          <video
            ref={videoRef}
            className="h-full min-h-[200px] w-full rounded-lg object-cover"
            playsInline
            muted
            autoPlay
          />
          <button
            type="button"
            onClick={stopCamera}
            className="absolute right-2 top-2 rounded bg-red-600 px-2 py-1 text-sm text-white"
          >
            Stop
          </button>
        </div>
      )}
    </div>
  );
}
