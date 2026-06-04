import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CameraOff, Search, AlertCircle } from 'lucide-react';

interface QrScannerProps {
  onScanSuccess: (token: string) => void;
  onScanError?: (error: string) => void;
}

const QrScanner: React.FC<QrScannerProps> = ({ onScanSuccess, onScanError }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualToken, setManualToken] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'qr-scanner-container';

  const startScanner = async () => {
    setError(null);

    try {
      const scanner = new Html5Qrcode(scannerContainerId);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        (decodedText) => {
          // Extract token from URL or use directly
          let token = decodedText;
          const trackingMatch = decodedText.match(/\/tracking\/([A-Za-z0-9]+)$/);
          if (trackingMatch) {
            token = trackingMatch[1];
          }

          stopScanner();
          onScanSuccess(token);
        },
        () => {
          // Ignore scan failures (continuously scanning)
        }
      );

      setIsScanning(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal mengakses kamera';
      setError(message);
      onScanError?.(message);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current?.isScanning) {
      try {
        await scannerRef.current.stop();
      } catch {
        // Ignore stop errors
      }
    }
    setIsScanning(false);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = manualToken.trim().toUpperCase();
    if (trimmed.length >= 8) {
      onScanSuccess(trimmed);
      setManualToken('');
    }
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-4">
      {/* Scanner Viewport */}
      <div className="relative bg-gray-900 rounded-2xl overflow-hidden border border-outline-variant" style={{ minHeight: '300px' }}>
        <div id={scannerContainerId} className="w-full" />

        {!isScanning && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gray-900/95">
            <div className="bg-primary/20 p-5 rounded-full">
              <Camera size={36} className="text-primary" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-bold text-white">QR Scanner</p>
              <p className="text-xs text-white/60">Arahkan kamera ke label QR pada sampel</p>
            </div>
            <button
              type="button"
              onClick={startScanner}
              className="flex items-center gap-2 bg-primary text-on-primary px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-primary-container transition-all cursor-pointer soft-shadow hover-lift"
            >
              <Camera size={16} />
              Aktifkan Kamera
            </button>
          </div>
        )}

        {isScanning && (
          <button
            type="button"
            onClick={stopScanner}
            className="absolute top-3 right-3 flex items-center gap-1.5 bg-status-error/90 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold hover:bg-status-error transition-all cursor-pointer z-10"
          >
            <CameraOff size={12} />
            Stop
          </button>
        )}

        {/* Scan Overlay Frame */}
        {isScanning && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-[250px] h-[250px] border-2 border-primary/50 rounded-2xl relative">
              <div className="absolute -top-0.5 -left-0.5 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-xl" />
              <div className="absolute -top-0.5 -right-0.5 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-xl" />
              <div className="absolute -bottom-0.5 -left-0.5 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-xl" />
              <div className="absolute -bottom-0.5 -right-0.5 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-xl" />
              {/* Scanning animation line */}
              <div className="absolute left-2 right-2 h-0.5 bg-primary/80 animate-scan-line" />
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 bg-status-error/10 border border-status-error/20 text-status-error p-3 rounded-xl text-xs">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Gagal mengakses kamera</p>
            <p className="text-status-error/80 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 border-t border-outline-variant" />
        <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
          Atau masukkan kode manual
        </span>
        <div className="flex-1 border-t border-outline-variant" />
      </div>

      {/* Manual Input */}
      <form onSubmit={handleManualSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input
            type="text"
            value={manualToken}
            onChange={(e) => setManualToken(e.target.value)}
            placeholder="Masukkan QR token atau kode sample..."
            className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-outline-variant focus:border-primary outline-none transition-all bg-surface-container-low"
          />
        </div>
        <button
          type="submit"
          disabled={manualToken.trim().length < 8}
          className="px-4 py-2.5 bg-primary text-on-primary text-xs font-bold rounded-xl hover:bg-primary-container transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cari
        </button>
      </form>
    </div>
  );
};

export default QrScanner;
