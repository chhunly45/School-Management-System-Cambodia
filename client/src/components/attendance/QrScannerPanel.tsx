import { useEffect, useMemo, useRef, useState } from 'react';
import QrScanner from 'qr-scanner';
import { normalizeDecodedToken } from './qrTokenPayload';

QrScanner.WORKER_PATH = new URL('qr-scanner/qr-scanner-worker.min.js', import.meta.url).toString();

type PermissionState = 'idle' | 'requesting' | 'granted' | 'denied' | 'error';

export type CameraStatus = 'Ready' | 'Permission Required' | 'Unavailable';

interface QrScannerPanelProps {
  onDecodedToken: (token: string) => void;
  onClose?: () => void;
  onStatusChange?: (status: CameraStatus) => void;
}

const QrScannerPanel = ({ onDecodedToken, onClose, onStatusChange }: QrScannerPanelProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerRef = useRef<QrScanner | null>(null);

  const [permissionState, setPermissionState] = useState<PermissionState>('idle');
  const [scannerRunning, setScannerRunning] = useState(false);
  const [message, setMessage] = useState('');

  const canStart = permissionState !== 'requesting' && !scannerRunning;

  const permissionMessage = useMemo(() => {
    if (permissionState === 'denied') return 'Camera permission denied. Enable camera access and try again.';
    if (permissionState === 'error') return 'Unable to initialize camera scanner on this device.';
    if (permissionState === 'granted') return 'Camera active. Point the camera at a QR code.';
    if (permissionState === 'requesting') return 'Requesting camera permission...';
    return 'Tap start to enable camera and scan a QR code.';
  }, [permissionState]);

  const stopScanner = async () => {
    if (!scannerRef.current) return;
    try {
      await scannerRef.current.stop();
    } catch {
      // Ignore stop failures during teardown.
    }
    scannerRef.current.destroy();
    scannerRef.current = null;
    setScannerRunning(false);
  };

  useEffect(() => {
    return () => {
      void stopScanner();
    };
  }, []);

  const handleDecode = async (result: QrScanner.ScanResult) => {
    const decodedText = result.data || '';

    const token = normalizeDecodedToken(decodedText);
    if (!token) {
      setMessage('QR decoded but token format is invalid for attendance.');
      return;
    }

    setMessage('QR code captured successfully.');
    onDecodedToken(token);
    await stopScanner();
  };

  const handleScannerError = (error: unknown) => {
    const text = error instanceof Error ? error.message : 'Unknown scanner error';
    setMessage('Camera access is currently unavailable.');
    if (text.toLowerCase().includes('permission') || text.toLowerCase().includes('notallowed')) {
      onStatusChange?.('Permission Required');
    } else {
      onStatusChange?.('Unavailable');
    }
  };

  const requestAndStart = async () => {
    if (!videoRef.current) return;

    setPermissionState('requesting');
    setMessage('');

    try {
      const scanner = new QrScanner(videoRef.current, handleDecode, {
        preferredCamera: 'environment',
        highlightScanRegion: true,
        highlightCodeOutline: true,
        onDecodeError: handleScannerError
      });

      scannerRef.current = scanner;
      await scanner.start();
      setPermissionState('granted');
      setScannerRunning(true);
      onStatusChange?.('Ready');
    } catch (error) {
      const messageText = error instanceof Error ? error.message.toLowerCase() : '';
      if (messageText.includes('permission') || messageText.includes('notallowed')) {
        setPermissionState('denied');
        onStatusChange?.('Permission Required');
      } else {
        setPermissionState('error');
        onStatusChange?.('Unavailable');
      }
      setMessage('Camera access is unavailable on this device.');
      await stopScanner();
    }
  };

  return (
    <div className="space-y-3 rounded-2xl border border-muted bg-background p-4" role="region" aria-label="QR scanner panel">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-text-primary">QR Scanner</p>
        <p className="text-xs text-text-secondary">{permissionMessage}</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-muted bg-black/80">
        <video
          ref={videoRef}
          className="h-52 w-full object-cover sm:h-64"
          muted
          playsInline
          aria-label="Camera preview for QR scanning"
        />
      </div>

      {message && <p className="text-xs text-text-secondary">{message}</p>}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            void requestAndStart();
          }}
          disabled={!canStart}
          className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white transition hover:bg-primary-hover disabled:opacity-60"
        >
          {scannerRunning ? 'Scanning...' : 'Start Camera Scan'}
        </button>
        <button
          type="button"
          onClick={() => {
            void stopScanner();
          }}
          disabled={!scannerRunning}
          className="inline-flex items-center justify-center rounded-full border border-muted bg-white px-4 py-2 text-xs font-semibold text-text-primary hover:bg-background disabled:opacity-60"
        >
          Stop Camera
        </button>
        {onClose && (
          <button
            type="button"
            onClick={() => {
              void stopScanner();
              onClose();
            }}
            className="inline-flex items-center justify-center rounded-full border border-muted bg-white px-4 py-2 text-xs font-semibold text-text-primary hover:bg-background"
          >
            Close Scanner
          </button>
        )}
      </div>
    </div>
  );
};

export default QrScannerPanel;
