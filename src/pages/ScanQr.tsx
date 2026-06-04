import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QrScanner from '@/components/QrScanner';
import { useQrLookup } from '@/hooks/useTracking';
import { QrCode, Clock, ArrowRight, CheckCircle2, AlertCircle, Loader2, Search } from 'lucide-react';
import dayjs from 'dayjs';
import { toast } from 'sonner';

const ScanQr: React.FC = () => {
  const navigate = useNavigate();
  const [scannedToken, setScannedToken] = useState<string | undefined>(undefined);
  const [scanHistory, setScanHistory] = useState<Array<{ token: string; kode_sample?: string; timestamp: Date }>>([]);

  const { data: response, isLoading, isError } = useQrLookup(scannedToken);

  const handleScanSuccess = (token: string) => {
    setScannedToken(token);
    toast.success(`QR Code terdeteksi: ${token}`);
  };

  // Navigate to tracking when data is loaded
  React.useEffect(() => {
    if (response?.data && scannedToken) {
      const trackingData = response.data;

      // Add to history
      setScanHistory((prev) => [
        { token: scannedToken, kode_sample: trackingData.registrasi.kode_sample, timestamp: new Date() },
        ...prev.filter((h) => h.token !== scannedToken).slice(0, 9),
      ]);

      // Navigate to tracking page
      setTimeout(() => {
        navigate(`/tracking/${scannedToken}`);
      }, 800);
    }
  }, [response, scannedToken, navigate]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-outline-variant pb-4">
        <h1 className="font-headline-lg text-lg md:text-xl font-extrabold text-on-surface flex items-center gap-2">
          <QrCode size={22} className="text-primary" />
          Scan QR Sample
        </h1>
        <p className="font-body-md text-xs text-on-surface-variant mt-1 font-medium">
          Scan label QR pada wadah sampel untuk melihat tracking lengkap dari sampling hingga laporan.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Scanner Column */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl border border-outline-variant soft-shadow p-5">
            <h3 className="text-sm font-bold text-on-surface mb-4 flex items-center gap-2">
              <QrCode size={16} className="text-primary" />
              Scanner QR Code
            </h3>

            <QrScanner
              onScanSuccess={handleScanSuccess}
              onScanError={(err) => toast.error(`Scanner error: ${err}`)}
            />
          </div>

          {/* Loading / Result Preview */}
          {scannedToken && (
            <div className="bg-white rounded-2xl border border-outline-variant soft-shadow p-4">
              {isLoading && (
                <div className="flex items-center gap-3 text-primary">
                  <Loader2 size={20} className="animate-spin" />
                  <div>
                    <p className="text-xs font-bold">Mencari data sampel...</p>
                    <p className="text-[10px] text-on-surface-variant">Token: {scannedToken}</p>
                  </div>
                </div>
              )}

              {isError && (
                <div className="flex items-center gap-3 text-status-error">
                  <AlertCircle size={20} />
                  <div>
                    <p className="text-xs font-bold">Sampel tidak ditemukan</p>
                    <p className="text-[10px] text-status-error/70">
                      Token "{scannedToken}" tidak terdaftar dalam sistem.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setScannedToken(undefined)}
                    className="ml-auto text-[10px] font-bold text-primary hover:underline cursor-pointer"
                  >
                    Scan Ulang
                  </button>
                </div>
              )}

              {response?.data && (
                <div className="flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
                  <div className="bg-status-success/10 p-2.5 rounded-full">
                    <CheckCircle2 size={20} className="text-status-success" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-status-success">Sampel Ditemukan!</p>
                    <p className="text-[11px] font-bold text-on-surface">
                      {response.data.registrasi.kode_sample}
                    </p>
                    <p className="text-[10px] text-on-surface-variant">
                      {response.data.registrasi.jenis_sample} • {response.data.current_stage}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-primary">
                    <span>Membuka tracking</span>
                    <ArrowRight size={12} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* History Column */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-2xl border border-outline-variant soft-shadow overflow-hidden">
            <div className="bg-surface-container-low p-4 border-b border-outline-variant">
              <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
                <Clock size={16} className="text-primary" />
                Riwayat Scan Terakhir
              </h3>
            </div>

            <div className="p-3 space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar">
              {scanHistory.length === 0 ? (
                <div className="text-center py-10 space-y-3">
                  <div className="bg-surface-container p-4 rounded-full inline-flex">
                    <Search size={24} className="text-on-surface-variant/30" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-on-surface-variant/50">Belum ada riwayat</p>
                    <p className="text-[10px] text-on-surface-variant/30 mt-1">
                      Scan QR code untuk mulai menelusuri sampel
                    </p>
                  </div>
                </div>
              ) : (
                scanHistory.map((item, i) => (
                  <button
                    key={`${item.token}-${i}`}
                    type="button"
                    onClick={() => navigate(`/tracking/${item.token}`)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-surface-container-low hover:bg-primary/5 border border-outline-variant/50 hover:border-primary/20 transition-all cursor-pointer text-left group"
                  >
                    <div className="bg-primary/10 p-2 rounded-lg group-hover:bg-primary/15 transition-all">
                      <QrCode size={16} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-on-surface truncate">
                        {item.kode_sample || item.token}
                      </p>
                      <p className="text-[10px] text-on-surface-variant font-mono">
                        {item.token}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] text-on-surface-variant">
                        {dayjs(item.timestamp).format('HH:mm')}
                      </p>
                      <ArrowRight size={12} className="text-primary/50 group-hover:text-primary ml-auto mt-0.5 transition-all" />
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScanQr;
