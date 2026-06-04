import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileCheck2, 
  Archive, 
  FileText, 
  CreditCard, 
  Signature, 
  Check, 
  X, 
  Sparkles, 
  Activity, 
  Clock, 
  AlertTriangle,
  Download,
  Eye,
  CalendarDays,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth';
import { useDashboardSummary } from '@/hooks/useDashboard';
import { usePendingApprovals, useApproveFinal, useRejectFinal } from '@/hooks/useApproval';
import { useLaporanFinal, useDownloadLaporan } from '@/hooks/useLaporan';
import type { ApprovalPayload } from '@/services/approval.service';
import dayjs from 'dayjs';
import WorkflowDistribution from '../../../components/WorkflowDistribution';
import WeeklyThroughput from '../../../components/WeeklyThroughput';

const KepalaUptdDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { data: summaryResponse, isLoading: summaryLoading } = useDashboardSummary();
  const { data: pendingResponse, isLoading: pendingLoading, refetch: refetchPending } = usePendingApprovals();
  const { data: finalResponse, isLoading: finalLoading, refetch: refetchFinal } = useLaporanFinal({ per_page: 5 });
  const approveMutation = useApproveFinal();
  const rejectMutation = useRejectFinal();
  const downloadMutation = useDownloadLaporan();

  const [rejectModal, setRejectModal] = useState<{ open: boolean; laporanId: string | null }>({
    open: false,
    laporanId: null,
  });
  const [rejectNote, setRejectNote] = useState('');

  const summary = summaryResponse?.data;
  const pendingApprovals = pendingResponse?.data || [];
  const finalLaporan = finalResponse?.data || [];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const handleApprove = (laporanId: string) => {
    if (confirm('Apakah Anda yakin ingin menyetujui dan membubuhkan Segel Digital (Tanda Tangan Elektronik) resmi pada laporan ini?')) {
      const payload: ApprovalPayload = { laporan_id: laporanId, catatan: 'Disetujui dan ditandatangani secara elektronik oleh Kepala UPTD' };
      approveMutation.mutate(payload, {
        onSuccess: () => {
          refetchPending();
          refetchFinal();
        }
      });
    }
  };

  const openRejectModal = (laporanId: string) => {
    setRejectNote('');
    setRejectModal({ open: true, laporanId });
  };

  const handleReject = () => {
    if (!rejectModal.laporanId) return;
    if (!rejectNote.trim()) return;
    const payload: ApprovalPayload = { laporan_id: rejectModal.laporanId, catatan: rejectNote };
    rejectMutation.mutate(payload, {
      onSuccess: () => {
        setRejectModal({ open: false, laporanId: null });
        refetchPending();
      },
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. Header Welcome Banner */}
      <div className="bg-gradient-to-r from-primary-container via-primary to-primary-container p-6 rounded-2xl border border-primary/20 soft-shadow text-on-primary relative overflow-hidden group">
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 opacity-10 group-hover:scale-110 transition-transform duration-350">
          <Signature size={200} />
        </div>
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 bg-white/15 text-white font-label-md text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-white/10 shadow-sm">
                <Sparkles size={10} className="text-amber-300" />
                ISO 17025 Certified
              </span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 font-extrabold px-2.5 py-0.5 rounded-full border border-amber-500/20 tracking-wider">
                KEPALA UPTD LABKESDA
              </span>
            </div>
            
            <h1 className="font-headline-lg text-lg md:text-xl font-extrabold text-white mt-2 tracking-tight">
              Portal Otorisasi & Eksekutif UPTD
            </h1>
            <p className="font-body-md text-xs text-white/85 mt-1 font-medium max-w-xl leading-relaxed">
              Selamat datang kembali, Bapak/Ibu <span className="font-bold text-white">{user?.name}</span>. 
              Tinjau draf hasil uji laboratorium yang siap rilis, bubuhkan tanda tangan elektronik legal, dan pantau ringkasan pendapatan serta kinerja mingguan secara real-time.
            </p>
          </div>
          
          <div className="flex items-center gap-2 bg-white/10 w-fit px-3 py-1.5 rounded-xl border border-white/10 backdrop-blur-sm self-stretch sm:self-auto justify-center">
            <Activity size={14} className="text-emerald-300 animate-pulse" />
            <span className="text-[10px] font-bold tracking-wide uppercase text-white">Monitoring Live Aktif</span>
          </div>
        </div>
      </div>

      {/* 2. Metrik Bento Grid KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Pending Approvals */}
        <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 p-4 rounded-xl border border-amber-200/50 soft-shadow relative overflow-hidden group hover:border-amber-300 transition-all duration-200">
          <div className="absolute right-2 top-2 p-1.5 bg-amber-500/10 rounded-lg text-amber-600">
            <Clock size={18} className="animate-spin-slow" />
          </div>
          <span className="text-[9px] uppercase font-bold tracking-wider text-amber-700/80 block">Menunggu Otorisasi</span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="font-headline-lg text-2xl font-black text-amber-900">
              {summaryLoading ? '...' : (summary?.uptd_pending_count ?? pendingApprovals.length)}
            </span>
            <span className="text-[10px] font-bold text-amber-700/75">LHP</span>
          </div>
          <span className="text-[9px] text-amber-700/60 block mt-2 font-semibold">
            Butuh tanda tangan Anda
          </span>
        </div>

        {/* KPI 2: Total Laporan Final */}
        <div className="bg-white p-4 rounded-xl border border-outline-variant soft-shadow relative overflow-hidden group hover:border-primary-container/40 transition-all duration-200">
          <div className="absolute right-2 top-2 p-1.5 bg-emerald-50 rounded-lg text-primary">
            <ShieldCheck size={18} />
          </div>
          <span className="text-[9px] uppercase font-bold tracking-wider text-on-surface-variant block">Laporan Final Tersegel</span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="font-headline-lg text-2xl font-black text-primary">
              {summaryLoading ? '...' : (summary?.uptd_final_count ?? 0)}
            </span>
            <span className="text-[10px] font-bold text-on-surface-variant">Laporan</span>
          </div>
          <span className="text-[9px] text-on-surface-variant/75 block mt-2 font-medium">
            Telah ditandatangani digital
          </span>
        </div>

        {/* KPI 3: Total Permohonan Uji */}
        <div className="bg-white p-4 rounded-xl border border-outline-variant soft-shadow relative overflow-hidden group hover:border-indigo-200 transition-all duration-200">
          <div className="absolute right-2 top-2 p-1.5 bg-indigo-50 rounded-lg text-indigo-600">
            <FileText size={18} />
          </div>
          <span className="text-[9px] uppercase font-bold tracking-wider text-on-surface-variant block">Total Permohonan Uji</span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="font-headline-lg text-2xl font-black text-indigo-950">
              {summaryLoading ? '...' : (summary?.permohonan ?? 0)}
            </span>
            <span className="text-[10px] font-bold text-on-surface-variant">Pendaftaran</span>
          </div>
          <span className="text-[9px] text-on-surface-variant/75 block mt-2 font-medium">
            Seluruh data masuk labkesda
          </span>
        </div>

        {/* KPI 4: Total Pendapatan Lab */}
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/40 p-4 rounded-xl border border-emerald-200/50 soft-shadow relative overflow-hidden group hover:border-emerald-300 transition-all duration-200">
          <div className="absolute right-2 top-2 p-1.5 bg-emerald-500/10 rounded-lg text-emerald-600">
            <CreditCard size={18} />
          </div>
          <span className="text-[9px] uppercase font-bold tracking-wider text-emerald-700 block">Total Pendapatan Terbayar</span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="font-headline-lg text-lg font-black text-emerald-950 tracking-tight">
              {summaryLoading ? '...' : formatCurrency(summary?.total_payments ?? 0)}
            </span>
          </div>
          <span className="text-[9px] text-emerald-700/70 block mt-2.5 font-bold uppercase tracking-wider">
            Invoice Status Lunas
          </span>
        </div>
      </div>

      {/* 3. Pusat Review & Persetujuan LHP Terintegrasi */}
      <div className="grid grid-cols-12 gap-6">
        {/* Antrean LHP Pending Approval */}
        <div className="col-span-12 xl:col-span-8 flex flex-col gap-4">
          <div className="bg-white rounded-xl border border-outline-variant soft-shadow overflow-hidden flex-1 flex flex-col">
            <div className="p-4 border-b border-outline-variant bg-surface-container-low flex items-center justify-between">
              <h3 className="font-headline-md text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-2">
                <FileCheck2 size={15} className="text-amber-500 animate-pulse" />
                Antrean Utama Peninjauan & Otorisasi LHP
              </h3>
              {!pendingLoading && pendingApprovals.length > 0 && (
                <span className="px-2 py-0.5 rounded bg-status-warning/10 text-status-warning font-black text-[9px] border border-status-warning/20">
                  {pendingApprovals.length} PERLU TINJAUAN
                </span>
              )}
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-container border-b border-outline-variant text-[9px] font-extrabold text-on-surface-variant uppercase tracking-wider">
                    <th className="p-3.5">Detail Permohonan & No. Laporan</th>
                    <th className="p-3.5 w-[130px]">Kategori & Sampel</th>
                    <th className="p-3.5">Catatan Analis</th>
                    <th className="p-3.5 text-center w-[230px]">Aksi Review & Approval</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant text-xs text-on-surface font-medium">
                  {pendingLoading ? (
                    Array.from({ length: 3 }).map((_, idx) => (
                      <tr key={idx} className="animate-pulse">
                        <td className="p-3.5">
                          <div className="h-3.5 bg-gray-200 rounded w-44" />
                          <div className="h-2.5 bg-gray-150 rounded w-28 mt-1.5" />
                        </td>
                        <td className="p-3.5"><div className="h-5 bg-gray-150 rounded-full w-20" /></td>
                        <td className="p-3.5"><div className="h-3.5 bg-gray-150 rounded w-36" /></td>
                        <td className="p-3.5"><div className="h-7 bg-gray-200 rounded w-40 mx-auto" /></td>
                      </tr>
                    ))
                  ) : pendingApprovals.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-12 text-center text-on-surface-variant font-bold">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <ShieldCheck size={28} className="text-emerald-500" />
                          <span className="block text-xs text-on-surface font-extrabold">Semua Laporan Bersih</span>
                          <span className="text-[10px] text-on-surface-variant/80 font-medium">
                            Tidak ada LHP yang menunggu otorisasi Anda. Bagus sekali!
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    pendingApprovals.map((app) => (
                      <tr key={app.id} className="hover:bg-surface-container-low transition-all">
                        <td className="p-3.5">
                          <div className="font-extrabold text-primary text-[13px] block">
                            {app.nomor_laporan || `LHP-${app.id.substring(0, 8).toUpperCase()}`}
                          </div>
                          <div className="text-[10px] text-on-surface-variant font-semibold mt-1 space-y-0.5">
                            <span className="block font-bold text-on-surface">{app.permohonan?.nama_pemohon || 'Klien Umum'}</span>
                            {app.permohonan?.nama_instansi && (
                              <span className="block text-[9px] text-gray-500 uppercase">Instansi: {app.permohonan.nama_instansi}</span>
                            )}
                          </div>
                        </td>
                        
                        <td className="p-3.5">
                          <div className="space-y-1.5">
                            <span className="inline-block px-2 py-0.5 rounded bg-surface-container border border-outline-variant/60 font-bold text-[9px] text-on-surface-variant uppercase tracking-wide">
                              {app.permohonan?.jenis_sample || 'Sampel'}
                            </span>
                            <span className="flex items-center gap-1 text-[9px] text-on-surface-variant font-semibold">
                              <CalendarDays size={10} />
                              {dayjs(app.created_at).format('DD/MM/YYYY')}
                            </span>
                          </div>
                        </td>

                        <td className="p-3.5">
                          <span className="text-on-surface-variant text-[11px] font-medium block max-w-[200px] leading-relaxed italic border-l-2 border-primary/20 pl-2">
                            {app.catatan || 'Kompilasi formal LHP oleh analis.'}
                          </span>
                        </td>

                        <td className="p-3.5">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Preview LHP */}
                            <button
                              onClick={() => navigate(`/approval/preview/${app.id}`)}
                              className="inline-flex items-center justify-center gap-1 bg-white border border-outline-variant text-on-surface hover:text-primary hover:border-primary/50 px-2.5 py-1.5 rounded-lg hover:bg-primary/5 transition-all text-[10px] font-bold cursor-pointer soft-shadow"
                              title="Tinjau draft laporan"
                            >
                              <Eye size={12} />
                              Preview
                            </button>

                            {/* Tolak & Revisi */}
                            <button
                              onClick={() => openRejectModal(app.id)}
                              disabled={approveMutation.isPending || rejectMutation.isPending}
                              className="inline-flex items-center justify-center gap-1 bg-white border border-status-danger/45 text-status-danger hover:bg-status-danger/5 px-2.5 py-1.5 rounded-lg transition-all text-[10px] font-bold cursor-pointer soft-shadow disabled:opacity-60"
                              title="Kembalikan ke Analis dengan catatan revisi"
                            >
                              <X size={12} />
                              Tolak
                            </button>

                            {/* Approve & Segel Digital */}
                            <button
                              onClick={() => handleApprove(app.id)}
                              disabled={approveMutation.isPending || rejectMutation.isPending}
                              className="inline-flex items-center justify-center gap-1 bg-primary text-on-primary hover:bg-primary-container px-3.5 py-1.5 rounded-lg transition-all text-[10px] font-black cursor-pointer soft-shadow hover:scale-[1.02] active:scale-[0.98] disabled:opacity-75"
                              title="Setujui dan kunci LHP dengan segel digital"
                            >
                              <Check size={12} />
                              {approveMutation.isPending ? 'Proses...' : 'Approve & Segel'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-3.5 bg-surface-container border-t border-outline-variant text-center">
              <span className="text-[10px] text-on-surface-variant font-bold italic block">
                * Menyetujui laporan akan melampirkan Segel Digital SHA-256 yang aman &amp; tidak dapat diubah (ISO 17025 Compliant).
              </span>
            </div>
          </div>
        </div>

        {/* Histori 5 Laporan Final Terkini (Right panel) */}
        <div className="col-span-12 xl:col-span-4 flex flex-col gap-4">
          <div className="bg-white rounded-xl border border-outline-variant soft-shadow overflow-hidden flex flex-col h-full">
            <div className="p-4 border-b border-outline-variant bg-surface-container-low flex items-center gap-2">
              <Archive size={15} className="text-primary" />
              <h3 className="font-headline-md text-xs font-bold text-on-surface uppercase tracking-wider">
                Histori Arsip LHP Resmi
              </h3>
            </div>

            <div className="divide-y divide-outline-variant overflow-y-auto max-h-[380px] flex-1">
              {finalLoading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} className="p-4 animate-pulse space-y-2">
                    <div className="h-3 bg-gray-250 rounded w-28" />
                    <div className="h-2.5 bg-gray-200 rounded w-36" />
                    <div className="h-6 bg-gray-200 rounded w-full mt-2" />
                  </div>
                ))
              ) : finalLaporan.length === 0 ? (
                <div className="p-8 text-center text-on-surface-variant font-bold flex flex-col items-center justify-center gap-2 h-full">
                  <Archive size={24} className="text-gray-300" />
                  <span className="block text-xs font-bold text-on-surface">Belum Ada Arsip</span>
                  <span className="text-[10px] text-on-surface-variant/80 font-medium">
                    Belum ada LHP final yang diterbitkan.
                  </span>
                </div>
              ) : (
                finalLaporan.map((lap) => (
                  <div key={lap.id} className="p-4 hover:bg-primary/5 transition-all space-y-2.5 group">
                    <div className="flex justify-between items-start">
                      <div className="space-y-0.5">
                        <span className="font-extrabold text-primary text-[12px] block">
                          {lap.nomor_laporan}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[9px] text-on-surface-variant font-semibold">
                          <CalendarDays size={9} />
                          Disetujui: {dayjs(lap.created_at).format('DD MMM YYYY')}
                        </span>
                      </div>
                      
                      <span className="bg-emerald-500/10 text-emerald-700 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border border-emerald-500/20">
                        FINAL
                      </span>
                    </div>

                    <div className="font-mono text-[9px] text-on-surface-variant bg-surface-container-low border border-outline-variant/60 rounded px-2 py-1 flex items-center justify-between">
                      <span className="truncate max-w-[130px]">SEAL: {lap.hash_sha256 || 'SHA-256 SECURED'}</span>
                      <ShieldCheck size={11} className="text-emerald-600 shrink-0 ml-1" />
                    </div>

                    <button
                      onClick={() => downloadMutation.mutate(lap.draft_laporan_id)}
                      disabled={downloadMutation.isPending}
                      className="w-full flex items-center justify-center gap-1.5 bg-primary/10 text-primary border border-primary/20 font-bold text-[10px] py-1.5 rounded-lg cursor-pointer hover:bg-primary hover:text-on-primary transition-all duration-200 disabled:opacity-70"
                    >
                      <Download size={11} />
                      Unduh PDF Resmi
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 bg-surface-container border-t border-outline-variant text-center">
              <a 
                href="/laporan-final"
                className="text-[10px] font-bold text-primary hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                Lihat Semua Arsip LHP
                <ArrowRight size={11} />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Bento Visual Analytics - Bird's eye view of lab */}
      <div className="grid grid-cols-12 gap-6">
        {/* Workflow Distribution Chart */}
        <div className="col-span-12 lg:col-span-7">
          <WorkflowDistribution summary={summary} />
        </div>
        
        {/* Weekly Throughput Bar Chart */}
        <div className="col-span-12 lg:col-span-5">
          <WeeklyThroughput summary={summary} />
        </div>
      </div>

      {/* Modal Penolakan / Catat Revisi */}
      {rejectModal.open && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-backdrop-fade">
          <div className="bg-white rounded-2xl soft-shadow border border-outline-variant w-full max-w-md animate-modal-zoom overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-outline-variant bg-surface-container-low">
              <h3 className="font-headline-md text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-1.5 text-status-danger">
                <AlertTriangle size={15} />
                Tolak &amp; Kembalikan ke Analis
              </h3>
              <button 
                onClick={() => setRejectModal({ open: false, laporanId: null })} 
                className="p-1 text-on-surface-variant hover:bg-surface-container rounded-lg cursor-pointer transition-all"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <p className="text-xs text-on-surface-variant font-semibold leading-relaxed">
                Harap tuliskan catatan revisi dengan jelas dan rinci agar Analis mengetahui letak kesalahan data pengujian atau administratif, lalu memperbaikinya.
              </p>
              
              <div className="space-y-1.5">
                <label className="block font-label-sm text-[10px] font-extrabold text-on-surface-variant uppercase tracking-wider">
                  Catatan Masukan Revisi *
                </label>
                <textarea
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                  placeholder="Contoh: Lampiran parameter logam Timbal (Pb) tidak sinkron dengan data mentah, harap verifikasi ulang dengan lab..."
                  rows={4}
                  className="w-full px-3 py-2.5 rounded-lg border border-outline-variant bg-surface-container-low text-xs outline-none focus:border-status-danger focus:ring-1 focus:ring-status-danger transition-all resize-none font-medium"
                />
              </div>
              
              <div className="flex gap-2.5 pt-1.5">
                <button
                  onClick={() => setRejectModal({ open: false, laporanId: null })}
                  className="flex-1 py-2.5 border border-outline-variant text-on-surface rounded-lg font-bold text-[11px] uppercase tracking-wider hover:bg-surface-container transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={handleReject}
                  disabled={!rejectNote.trim() || rejectMutation.isPending}
                  className="flex-1 py-2.5 bg-status-danger text-white rounded-lg font-black text-[11px] uppercase tracking-wider hover:opacity-90 transition-all cursor-pointer soft-shadow disabled:opacity-60 flex items-center justify-center gap-1"
                >
                  {rejectMutation.isPending ? 'Mengirim...' : 'Kirim Revisi'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KepalaUptdDashboard;
