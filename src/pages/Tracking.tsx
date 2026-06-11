import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQrLookup } from '@/hooks/useTracking';
import { QRCodeSVG } from 'qrcode.react';
import dayjs from 'dayjs';
import {
  MapPin,
  Building,
  FlaskConical,
  ShieldCheck,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Loader2,
  ArrowLeft,
  ExternalLink,
  BarChart3,
} from 'lucide-react';
import type { TrackingStage } from '@/services/tracking.service';

const stageIcons: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  'map-pin': MapPin,
  building: Building,
  'flask-conical': FlaskConical,
  'shield-check': ShieldCheck,
  'file-text': FileText,
};

const statusConfig: Record<
  string,
  { color: string; bg: string; border: string; icon: React.ComponentType<{ size?: number; className?: string }>; label: string }
> = {
  completed: {
    color: 'text-status-success',
    bg: 'bg-status-success',
    border: 'border-status-success',
    icon: CheckCircle2,
    label: 'Selesai',
  },
  in_progress: {
    color: 'text-status-info',
    bg: 'bg-status-info',
    border: 'border-status-info',
    icon: Loader2,
    label: 'Sedang Berlangsung',
  },
  pending: {
    color: 'text-on-surface-variant/40',
    bg: 'bg-on-surface-variant/20',
    border: 'border-on-surface-variant/20',
    icon: Clock,
    label: 'Menunggu',
  },
  rejected: {
    color: 'text-status-error',
    bg: 'bg-status-error',
    border: 'border-status-error',
    icon: XCircle,
    label: 'Ditolak',
  },
};

const Tracking: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const { data: response, isLoading, isError, error } = useQrLookup(token);

  const trackingData = response?.data;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream-bg flex items-center justify-center">
        <div className="text-center space-y-4 animate-pulse">
          <div className="bg-primary/10 p-6 rounded-full inline-flex">
            <Loader2 size={40} className="text-primary animate-spin" />
          </div>
          <p className="text-sm font-bold text-on-surface-variant">Memuat data tracking...</p>
        </div>
      </div>
    );
  }

  if (isError || !trackingData) {
    return (
      <div className="min-h-screen bg-cream-bg flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-outline-variant shadow-xl p-8 max-w-md w-full text-center space-y-4">
          <div className="bg-status-error/10 p-5 rounded-full inline-flex">
            <AlertCircle size={40} className="text-status-error" />
          </div>
          <h2 className="text-lg font-bold text-on-surface">Sampel Tidak Ditemukan</h2>
          <p className="text-sm text-on-surface-variant">
            QR Code tidak valid atau sampel tidak ditemukan dalam sistem.
            {(error as Error)?.message && (
              <span className="block mt-1 text-xs text-status-error">{(error as Error).message}</span>
            )}
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline mt-4"
          >
            <ArrowLeft size={16} />
            Kembali ke Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const { registrasi, pemohon, current_stage, timeline, parameter_progress } = trackingData;

  // Calculate overall progress percentage
  const completedStages = timeline.filter((s) => s.status === 'completed').length;
  const overallProgress = Math.round((completedStages / timeline.length) * 100);

  return (
    <div className="min-h-screen bg-cream-bg">
      {/* Top Bar */}
      <div className="bg-primary text-on-primary">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="p-2 rounded-lg hover:bg-primary-container/20 transition-all"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-sm font-bold">Tracking Sampel</h1>
              <p className="text-[10px] text-on-primary/70">SIA Labkesda</p>
            </div>
          </div>
          <div className="bg-white/10 px-3 py-1.5 rounded-lg">
            <span className="text-[10px] font-bold font-mono">{registrasi.qr_token}</span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Sample Info Card */}
        <div className="bg-white rounded-2xl border border-outline-variant shadow-lg overflow-hidden">
          <div className="p-5 flex items-start gap-4">
            {/* QR Code Mini */}
            <div className="shrink-0 bg-surface-container-low p-2 rounded-xl border border-outline-variant">
              <QRCodeSVG
                value={window.location.href}
                size={72}
                level="M"
                bgColor="transparent"
              />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 space-y-2">
              <div>
                <h2 className="text-lg font-black text-on-surface tracking-wide">
                  {registrasi.kode_sample}
                </h2>
                <p className="text-[11px] font-semibold text-on-surface-variant">
                  {registrasi.nomor_registrasi}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="text-[10px] font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-full">
                  {registrasi.jenis_sample}
                </span>
                <span className="text-[10px] font-medium bg-surface-container text-on-surface-variant px-2.5 py-1 rounded-full">
                  {dayjs(registrasi.tanggal_registrasi).format('DD MMM YYYY')}
                </span>
              </div>

              {pemohon && (
                <p className="text-[11px] text-on-surface-variant">
                  Pemohon: <span className="font-medium">{pemohon.nama}</span>
                  {pemohon.instansi && <span> — {pemohon.instansi}</span>}
                </p>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="px-5 pb-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                Progress Keseluruhan
              </span>
              <span className="text-xs font-black text-primary">{overallProgress}%</span>
            </div>
            <div className="h-2.5 bg-surface-container rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-status-success rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Parameter Progress (if has parameters) */}
        {parameter_progress.total > 0 && (
          <div className="bg-white rounded-2xl border border-outline-variant shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 size={15} className="text-primary" />
              <span className="text-[11px] font-bold text-on-surface uppercase tracking-wider">
                Progress Parameter Pengujian
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-surface-container-low p-3 rounded-xl text-center">
                <span className="text-lg font-black text-on-surface">{parameter_progress.total}</span>
                <p className="text-[9px] font-bold text-on-surface-variant uppercase mt-0.5">Total</p>
              </div>
              <div className="bg-status-success/5 border border-status-success/10 p-3 rounded-xl text-center">
                <span className="text-lg font-black text-status-success">{parameter_progress.completed}</span>
                <p className="text-[9px] font-bold text-on-surface-variant uppercase mt-0.5">Selesai</p>
              </div>
              <div className="bg-status-info/5 border border-status-info/10 p-3 rounded-xl text-center">
                <span className="text-lg font-black text-status-info">{parameter_progress.qc_approved}</span>
                <p className="text-[9px] font-bold text-on-surface-variant uppercase mt-0.5">QC OK</p>
              </div>
              <div className="bg-status-warning/5 border border-status-warning/10 p-3 rounded-xl text-center">
                <span className="text-lg font-black text-status-warning">{parameter_progress.draft}</span>
                <p className="text-[9px] font-bold text-on-surface-variant uppercase mt-0.5">Draft</p>
              </div>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="bg-white rounded-2xl border border-outline-variant shadow-sm p-5">
          <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider mb-5">
            Timeline Penelusuran Sampel
          </h3>

          <div className="space-y-0">
            {timeline.map((stage, index) => (
              <TimelineStage
                key={stage.stage}
                stage={stage}
                registrasi={registrasi}
                isFirst={index === 0}
                isLast={index === timeline.length - 1}
                isCurrent={stage.stage === current_stage}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-4 space-y-1">
          <p className="text-[10px] text-on-surface-variant/60">
            SIA Labkesda • Sistem Tracking Sampel
          </p>
          <p className="text-[9px] text-on-surface-variant/40">
            Data terakhir diperbarui: {dayjs().format('DD MMM YYYY, HH:mm')} WIB
          </p>
        </div>
      </div>
    </div>
  );
};

/* ─── Timeline Stage Component ──────────────────────────────────────────── */

interface TimelineStageProps {
  stage: TrackingStage;
  registrasi: any;
  isFirst: boolean;
  isLast: boolean;
  isCurrent: boolean;
}

const TimelineStage: React.FC<TimelineStageProps> = ({ stage, registrasi, isLast, isCurrent }) => {
  const config = statusConfig[stage.status] || statusConfig.pending;
  const StatusIcon = config.icon;
  const StageIcon = stageIcons[stage.icon] || MapPin;

  return (
    <div className="flex gap-4">
      {/* Timeline Line + Dot */}
      <div className="flex flex-col items-center shrink-0">
        {/* Dot */}
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
            isCurrent
              ? `${config.border} ${config.bg}/10 ring-4 ring-offset-1 ring-${stage.status === 'in_progress' ? 'status-info' : 'primary'}/20`
              : stage.status === 'completed'
                ? `${config.border} ${config.bg}/10`
                : 'border-on-surface-variant/15 bg-surface-container-low'
          }`}
        >
          {stage.status === 'in_progress' ? (
            <Loader2 size={18} className={`${config.color} animate-spin`} />
          ) : (
            <StageIcon size={18} className={stage.status === 'completed' ? config.color : 'text-on-surface-variant/30'} />
          )}
        </div>

        {/* Line */}
        {!isLast && (
          <div
            className={`w-0.5 flex-1 min-h-[40px] my-1 rounded-full transition-all ${
              stage.status === 'completed' ? 'bg-status-success/40' : 'bg-on-surface-variant/10'
            }`}
          />
        )}
      </div>

      {/* Content */}
      <div className={`flex-1 pb-6 ${isLast ? 'pb-0' : ''}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <h4
            className={`text-sm font-bold ${
              stage.status === 'pending' ? 'text-on-surface-variant/40' : 'text-on-surface'
            }`}
          >
            {stage.label}
          </h4>
          <div className={`flex items-center gap-1 text-[10px] font-bold ${config.color}`}>
            <StatusIcon size={12} />
            {config.label}
          </div>
        </div>

        {/* Timestamp */}
        {stage.timestamp && (
          <p className="text-[10px] text-on-surface-variant/60 mb-2">
            {dayjs(stage.timestamp).format('DD MMM YYYY, HH:mm')} WIB
          </p>
        )}

        {/* Detail Card */}
        {stage.detail && (
          <div
            className={`rounded-xl p-3 text-xs space-y-1.5 mt-1 border ${
              isCurrent
                ? 'bg-primary/5 border-primary/15'
                : 'bg-surface-container-low border-outline-variant/50'
            }`}
          >
            {renderStageDetail(stage, registrasi)}
          </div>
        )}
      </div>
    </div>
  );
};

/* ─── Stage Detail Renderers ──────────────────────────────────────────── */

function renderStageDetail(stage: TrackingStage, registrasi: any) {
  const detail = stage.detail;
  if (!detail) return null;

  switch (stage.stage) {
    case 'sampling':
      return (
        <>
          {detail.lokasi && (
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Lokasi</span>
              <span className="font-medium text-on-surface text-right max-w-[60%]">
                {detail.lokasi as string}
              </span>
            </div>
          )}
          {detail.cuaca && (
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Cuaca</span>
              <span className="font-medium text-on-surface capitalize">{detail.cuaca as string}</span>
            </div>
          )}
          {detail.suhu && (
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Suhu</span>
              <span className="font-medium text-on-surface">{detail.suhu as string}°C</span>
            </div>
          )}
          {detail.kondisi && (
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Kondisi Sampel</span>
              <span className="font-medium text-on-surface capitalize">{(detail.kondisi as string).replace('_', ' ')}</span>
            </div>
          )}
          {detail.petugas && (
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Petugas</span>
              <span className="font-medium text-on-surface">{detail.petugas as string}</span>
            </div>
          )}
          {detail.latitude && detail.longitude && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${detail.latitude},${detail.longitude}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-[10px] font-bold text-primary hover:underline mt-1"
            >
              <ExternalLink size={10} />
              Lihat di Google Maps
            </a>
          )}
        </>
      );

    case 'penerimaan_lab':
      return (
        <>
          <div className="flex justify-between">
            <span className="text-on-surface-variant">No. Registrasi</span>
            <span className="font-bold text-on-surface">{detail.nomor_registrasi as string}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-on-surface-variant">Kode Sample</span>
            <span className="font-bold text-primary">{detail.kode_sample as string}</span>
          </div>
          {detail.petugas && (
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Petugas Lab</span>
              <span className="font-medium text-on-surface">{detail.petugas as string}</span>
            </div>
          )}
        </>
      );

    case 'pengujian':
      return (
        <>
          <div className="flex justify-between">
            <span className="text-on-surface-variant">Total Parameter</span>
            <span className="font-bold text-on-surface">{detail.total_parameter as number}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-on-surface-variant">Selesai Diuji</span>
            <span className="font-bold text-status-success">
              {detail.selesai as number} / {detail.total_parameter as number}
            </span>
          </div>
          {/* Progress bar */}
          <div className="mt-1">
            <div className="h-2 bg-surface-container rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-status-success rounded-full transition-all"
                style={{ width: `${detail.progress_pct as number}%` }}
              />
            </div>
          </div>
        </>
      );

    case 'qc':
      return (
        <>
          <div className="flex justify-between">
            <span className="text-on-surface-variant">Diperiksa</span>
            <span className="font-bold text-on-surface">
              {detail.total_diperiksa as number} / {detail.total_parameter as number}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-on-surface-variant">Disetujui</span>
            <span className="font-bold text-status-success">{detail.approved as number}</span>
          </div>
          {(detail.rejected as number) > 0 && (
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Ditolak</span>
              <span className="font-bold text-status-error">{detail.rejected as number}</span>
            </div>
          )}
        </>
      );

    case 'laporan':
      return (
        <div className="space-y-4 w-full">
          {!!detail.nomor_laporan && (
            <div className="flex justify-between items-center border-b border-outline-variant/30 pb-2">
              <span className="text-on-surface-variant font-medium">No. Laporan</span>
              <span className="font-black text-on-surface text-sm">{String(detail.nomor_laporan)}</span>
            </div>
          )}
          
          {detail.type === 'final' ? (
            <div className="bg-status-success/5 border border-status-success/20 rounded-xl p-4 space-y-3">
              {/* TTE Valid Badge */}
              <div className="flex items-center gap-2 text-status-success">
                <ShieldCheck size={18} className="fill-status-success/10 shrink-0" />
                <span className="text-xs font-bold uppercase tracking-wider">Tanda Tangan Elektronik Sah</span>
              </div>
              
              <p className="text-[11px] text-on-surface-variant leading-relaxed">
                Dokumen ini telah disetujui secara resmi dan ditandatangani secara elektronik (TTE) menggunakan sertifikat digital yang diterbitkan melalui SIM Labkesda Kabupaten Purwakarta.
              </p>

              <div className="bg-white/50 rounded-lg p-2.5 space-y-1.5 border border-status-success/10 text-[11px] text-left">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Penandatangan:</span>
                  <span className="font-semibold text-on-surface">{String(detail.signed_by || 'Kepala UPTD')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">NIP:</span>
                  <span className="font-mono text-on-surface">{String(detail.signed_nip || '-')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Jabatan:</span>
                  <span className="font-medium text-on-surface">Kepala UPTD Labkesda</span>
                </div>
                {!!detail.approved_at && (
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Tanggal TTE:</span>
                    <span className="font-medium text-on-surface">
                      {dayjs(String(detail.approved_at)).format('DD MMM YYYY, HH:mm')} WIB
                    </span>
                  </div>
                )}
              </div>

              {/* SHA-256 Hash Integrity */}
              {!!detail.hash_sha256 && (
                <div className="space-y-1 text-left">
                  <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider block">
                    Kode Integritas (SHA-256 Hash)
                  </span>
                  <div className="bg-surface-container-low border border-outline-variant p-2 rounded-lg font-mono text-[9px] break-all select-all text-on-surface text-center">
                    {detail.hash_sha256 as string}
                  </div>
                </div>
              )}

              {/* Download PDF Button */}
              <div className="pt-1">
                <a
                  href={`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'}/tracking/${registrasi.qr_token}/download`}
                  className="w-full flex items-center justify-center gap-2 bg-status-success text-white text-[11px] font-bold py-2 px-3 rounded-lg hover:bg-status-success/90 active:scale-95 transition-all shadow-sm"
                >
                  <FileText size={14} />
                  Unduh LHP Resmi (PDF)
                </a>
              </div>
            </div>
          ) : (
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Status</span>
              <span className="font-bold text-status-warning capitalize">📝 Draft Laporan</span>
            </div>
          )}
        </div>
      );

    default:
      return null;
  }
}

export default Tracking;
