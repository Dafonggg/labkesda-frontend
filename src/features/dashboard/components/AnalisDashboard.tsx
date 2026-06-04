import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Printer, 
  Send, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Sparkles, 
  ClipboardList, 
  Layers, 
  ChevronRight, 
  CalendarDays,
  Activity
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth';
import { useDashboardSummary } from '@/hooks/useDashboard';
import { usePermohonanList } from '@/hooks/usePermohonan';
import { useDrafts, useDownloadLaporan, useGenerateLaporan, useSubmitLaporan } from '@/hooks/useLaporan';
import dayjs from 'dayjs';

const STATUS_MAP: Record<string, { label: string; style: string; icon: React.ReactNode }> = {
  draft: { 
    label: 'Draft LHP', 
    style: 'bg-blue-50 text-blue-700 border-blue-200/60',
    icon: <Clock size={12} className="text-blue-500" />
  },
  pending_approval: { 
    label: 'Menunggu UPTD', 
    style: 'bg-amber-50 text-amber-700 border-amber-200/60',
    icon: <Clock size={12} className="text-amber-500" />
  },
  approved: { 
    label: 'Disetujui', 
    style: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
    icon: <CheckCircle2 size={12} className="text-emerald-500" />
  },
  final: { 
    label: 'Laporan Final', 
    style: 'bg-primary/10 text-primary border-primary/20',
    icon: <CheckCircle2 size={12} className="text-primary" />
  },
};

const AnalisDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { data: summaryResponse, isLoading: summaryLoading } = useDashboardSummary();
  const { data: permohonanResponse, isLoading: permohonanLoading, refetch: refetchPermohonan } = usePermohonanList({ ready_for_laporan: true });
  const { data: draftsResponse, isLoading: draftsLoading, refetch: refetchDrafts } = useDrafts();

  const downloadMutation = useDownloadLaporan();
  const generateMutation = useGenerateLaporan();
  const submitMutation = useSubmitLaporan();

  const [activeTab, setActiveTab] = useState<'all' | 'revisi'>('all');

  const summary = summaryResponse?.data;
  const readyPermohonan = permohonanResponse?.data || [];
  const drafts = draftsResponse?.data || [];

  // Filter drafts if they are rejected by Kepala UPTD
  // In our flow, if UPTD head rejects, the draft status transitions back to 'draft', 
  // but it might have a latest record in persetujuan relation with status 'rejected'
  const processedDrafts = drafts.map((draft: any) => {
    const latestPersetujuan = draft.persetujuan && draft.persetujuan.length > 0 
      ? draft.persetujuan[draft.persetujuan.length - 1] 
      : null;
    
    const isRejected = draft.status === 'draft' && latestPersetujuan?.status === 'rejected';
    const rejectionNote = isRejected ? latestPersetujuan?.catatan : null;

    return {
      ...draft,
      isRejected,
      rejectionNote
    };
  });

  const filteredDrafts = activeTab === 'revisi' 
    ? processedDrafts.filter(d => d.isRejected) 
    : processedDrafts;

  const handleCompile = (permohonanId: string) => {
    generateMutation.mutate(
      { permohonan_id: permohonanId, catatan: 'Draft kompilasi otomatis LHP oleh Analis.' },
      { 
        onSuccess: () => {
          refetchPermohonan();
          refetchDrafts();
        } 
      }
    );
  };

  const handleSubmit = (draftId: string) => {
    if (confirm('Kirim draft laporan ini ke Kepala UPTD untuk mendapatkan persetujuan formal?')) {
      submitMutation.mutate(draftId, {
        onSuccess: () => {
          refetchDrafts();
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Welcome Section */}
      <div className="bg-gradient-to-r from-primary/90 to-primary-container p-6 rounded-2xl border border-primary/20 soft-shadow text-on-primary relative overflow-hidden group">
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 opacity-10 group-hover:scale-110 transition-transform duration-350">
          <FileSpreadsheet size={200} />
        </div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 bg-white/15 text-white font-label-md text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-white/10 shadow-sm">
                <Sparkles size={10} />
                ISO 17025 Standard
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">
                Analis Lab
              </span>
            </div>
            <h1 className="font-headline-lg text-lg md:text-xl font-extrabold text-white mt-2 tracking-tight">
              Dashboard Analis & Kompilasi LHP
            </h1>
            <p className="font-body-md text-xs text-white/80 mt-1 font-medium max-w-xl leading-relaxed">
              Selamat datang kembali, <span className="font-bold text-white">{user?.name}</span>. 
              Kelola lembar kerja pengujian yang telah selesai diverifikasi oleh Quality Control, lalu lakukan kompilasi formal menjadi LHP.
            </p>
          </div>
          <div className="flex items-center gap-1.5 bg-white/10 w-fit px-3 py-1.5 rounded-xl border border-white/10 backdrop-blur-sm self-stretch sm:self-auto justify-center">
            <Activity size={14} className="text-emerald-300 animate-pulse" />
            <span className="text-[10px] font-bold tracking-wide uppercase text-white">Sistem Validasi Aktif</span>
          </div>
        </div>
      </div>

      {/* 2. Metrik KPIs Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Ready to Compile */}
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 p-4 rounded-xl border border-indigo-200/50 soft-shadow relative overflow-hidden group">
          <div className="absolute right-2 top-2 p-1.5 bg-indigo-500/10 rounded-lg text-indigo-600">
            <Layers size={16} />
          </div>
          <span className="text-[9px] uppercase font-bold tracking-wider text-indigo-700/80 block">Siap Kompilasi</span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="font-headline-lg text-2xl font-black text-indigo-900">
              {summaryLoading ? '...' : (summary?.analyst_ready_count ?? 0)}
            </span>
            <span className="text-[10px] font-bold text-indigo-700/75">Permohonan</span>
          </div>
          <span className="text-[9px] text-indigo-700/60 block mt-2 font-medium">
            QC Approved & Belum Kompilasi
          </span>
        </div>

        {/* KPI 2: Active Drafts */}
        <div className="bg-white p-4 rounded-xl border border-outline-variant soft-shadow relative overflow-hidden group hover:border-blue-200 transition-all">
          <div className="absolute right-2 top-2 p-1.5 bg-blue-50 rounded-lg text-blue-600">
            <Clock size={16} />
          </div>
          <span className="text-[9px] uppercase font-bold tracking-wider text-on-surface-variant block">Draf Aktif Anda</span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="font-headline-lg text-2xl font-black text-blue-600">
              {summaryLoading ? '...' : (summary?.analyst_draft_count ?? 0)}
            </span>
            <span className="text-[10px] font-bold text-on-surface-variant">Draf</span>
          </div>
          <span className="text-[9px] text-on-surface-variant/70 block mt-2 font-medium">
            Draf aktif dalam revisi / input
          </span>
        </div>

        {/* KPI 3: Pending UPTD Approval */}
        <div className="bg-white p-4 rounded-xl border border-outline-variant soft-shadow relative overflow-hidden group hover:border-amber-200 transition-all">
          <div className="absolute right-2 top-2 p-1.5 bg-amber-50 rounded-lg text-amber-600">
            <Send size={16} />
          </div>
          <span className="text-[9px] uppercase font-bold tracking-wider text-on-surface-variant block">Menunggu UPTD</span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="font-headline-lg text-2xl font-black text-amber-600">
              {summaryLoading ? '...' : (summary?.analyst_pending_count ?? 0)}
            </span>
            <span className="text-[10px] font-bold text-on-surface-variant">Laporan</span>
          </div>
          <span className="text-[9px] text-on-surface-variant/70 block mt-2 font-medium">
            Terkirim & Menunggu Approval
          </span>
        </div>

        {/* KPI 4: Approved / Final */}
        <div className="bg-white p-4 rounded-xl border border-outline-variant soft-shadow relative overflow-hidden group hover:border-emerald-200 transition-all">
          <div className="absolute right-2 top-2 p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
            <CheckCircle2 size={16} />
          </div>
          <span className="text-[9px] uppercase font-bold tracking-wider text-on-surface-variant block">Telah Disetujui</span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="font-headline-lg text-2xl font-black text-emerald-600">
              {summaryLoading ? '...' : (summary?.analyst_approved_count ?? 0)}
            </span>
            <span className="text-[10px] font-bold text-on-surface-variant">Laporan</span>
          </div>
          <span className="text-[9px] text-on-surface-variant/70 block mt-2 font-medium">
            Laporan final selesai diarsip
          </span>
        </div>
      </div>

      {/* 3. Bento Grid - Operational Layout */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* Left Bento: Active Draft LHP List */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-4">
          <div className="bg-white rounded-xl border border-outline-variant soft-shadow overflow-hidden flex-1">
            
            {/* Header with filter tabs */}
            <div className="p-4 border-b border-outline-variant bg-surface-container-low flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h3 className="font-headline-md text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-2">
                <FileSpreadsheet size={15} className="text-primary" />
                Daftar Draft LHP Aktif Anda
              </h3>
              
              <div className="flex bg-surface-container rounded-lg p-0.5 border border-outline-variant text-[10px] font-bold">
                <button 
                  onClick={() => setActiveTab('all')}
                  className={`px-3 py-1.5 rounded-md cursor-pointer transition-all ${activeTab === 'all' ? 'bg-white shadow-sm text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'}`}
                >
                  Semua Draft ({drafts.length})
                </button>
                <button 
                  onClick={() => setActiveTab('revisi')}
                  className={`px-3 py-1.5 rounded-md cursor-pointer transition-all flex items-center gap-1 ${activeTab === 'revisi' ? 'bg-white shadow-sm text-status-danger font-bold' : 'text-on-surface-variant hover:text-on-surface'}`}
                >
                  Butuh Revisi UPTD ({processedDrafts.filter(d => d.isRejected).length})
                </button>
              </div>
            </div>

            {/* Table of drafts */}
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-container border-b border-outline-variant text-[9px] font-extrabold text-on-surface-variant uppercase tracking-wider">
                    <th className="p-3.5">Nomor Laporan / Permohonan</th>
                    <th className="p-3.5 w-[150px]">Status</th>
                    <th className="p-3.5">Catatan Terakhir</th>
                    <th className="p-3.5 w-[120px] text-center">Aksi Kerja</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant text-xs text-on-surface font-medium">
                  {draftsLoading ? (
                    Array.from({ length: 3 }).map((_, idx) => (
                      <tr key={idx} className="animate-pulse">
                        <td className="p-3.5"><div className="h-3.5 bg-gray-250 rounded w-44" /><div className="h-2.5 bg-gray-200 rounded w-20 mt-1" /></td>
                        <td className="p-3.5"><div className="h-5 bg-gray-200 rounded-full w-24" /></td>
                        <td className="p-3.5"><div className="h-3.5 bg-gray-200 rounded w-32" /></td>
                        <td className="p-3.5"><div className="h-7 bg-gray-200 rounded w-20 mx-auto" /></td>
                      </tr>
                    ))
                  ) : filteredDrafts.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-12 text-center text-on-surface-variant font-bold">
                        {activeTab === 'revisi' 
                          ? 'Tidak ada draft yang ditolak oleh Kepala UPTD. Semua draft aman!' 
                          : 'Belum ada draft laporan terdaftar. Silakan pilih permohonan siap kompilasi di panel kanan.'}
                      </td>
                    </tr>
                  ) : (
                    filteredDrafts.map((draft) => {
                      const statusInfo = STATUS_MAP[draft.status] || { label: draft.status, style: 'bg-gray-200 text-gray-700', icon: null };
                      const isEditable = draft.status === 'draft';
                      const isPendingApproval = draft.status === 'pending_approval';

                      return (
                        <tr key={draft.id} className="hover:bg-surface-container-low transition-all">
                          <td className="p-3.5">
                            <span className="font-extrabold text-primary block text-[13px]">
                              {draft.nomor_laporan}
                            </span>
                            <span className="text-[10px] text-on-surface-variant font-semibold mt-0.5 block">
                              Permohonan: {draft.permohonan?.nomor_permohonan || 'No. Permohonan'}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <div className="flex flex-col gap-1 items-start">
                              {draft.isRejected ? (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-black text-[9px] uppercase tracking-wider border border-status-danger/25 bg-status-danger/10 text-status-danger animate-pulse">
                                  <AlertTriangle size={10} />
                                  Ditolak & Butuh Revisi
                                </span>
                              ) : (
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wider border ${statusInfo.style}`}>
                                  {statusInfo.icon}
                                  {statusInfo.label}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3.5">
                            {draft.isRejected ? (
                              <div className="p-2 rounded bg-status-danger/5 border border-status-danger/10 text-[11px] text-status-danger font-medium leading-relaxed max-w-[280px]">
                                <span className="font-bold block uppercase text-[8px] tracking-wider mb-0.5">Catatan Penolakan UPTD:</span>
                                "{draft.rejectionNote || 'Periksa kembali hasil pengujian.'}"
                              </div>
                            ) : (
                              <span className="text-on-surface-variant text-[11px] font-medium italic block max-w-[280px] truncate">
                                {draft.catatan || 'Kompilasi formal LHP.'}
                              </span>
                            )}
                          </td>
                          <td className="p-3.5">
                            <div className="flex items-center justify-center gap-2">
                              <button 
                                onClick={() => downloadMutation.mutate(draft.id)}
                                disabled={downloadMutation.isPending}
                                className="inline-flex items-center gap-1 bg-white border border-outline-variant text-on-surface hover:text-primary hover:border-primary/45 px-2 py-1.5 rounded-lg hover:bg-primary/5 transition-all text-[10px] font-bold cursor-pointer soft-shadow disabled:opacity-60"
                                title="Download / Preview PDF"
                              >
                                <Printer size={12} />
                                Preview
                              </button>

                              {isEditable && (
                                <button 
                                  onClick={() => handleSubmit(draft.id)}
                                  disabled={submitMutation.isPending}
                                  className="inline-flex items-center gap-1.5 bg-primary text-on-primary px-3 py-1.5 rounded-lg hover:bg-primary-container transition-all text-[10px] font-extrabold cursor-pointer soft-shadow disabled:opacity-80 hover:translate-x-0.5"
                                  title="Kirim ke Kepala UPTD"
                                >
                                  <Send size={11} />
                                  Kirim UPTD
                                </button>
                              )}

                              {isPendingApproval && (
                                <span className="inline-flex items-center gap-1 text-status-warning text-[10px] font-bold">
                                  <Clock size={11} />
                                  Reviewing
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Bento: Ready to Compile List */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
          <div className="bg-white rounded-xl border border-outline-variant soft-shadow overflow-hidden flex flex-col h-full">
            
            {/* Header */}
            <div className="p-4 border-b border-outline-variant bg-surface-container-low">
              <h3 className="font-headline-md text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-2">
                <ClipboardList size={15} className="text-indigo-600 animate-bounce" />
                Antrean Siap Kompilasi
              </h3>
            </div>

            {/* List */}
            <div className="divide-y divide-outline-variant overflow-y-auto max-h-[450px] flex-1">
              {permohonanLoading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} className="p-4 animate-pulse space-y-2">
                    <div className="h-3 bg-gray-250 rounded w-32" />
                    <div className="h-2.5 bg-gray-200 rounded w-20" />
                    <div className="h-6 bg-gray-200 rounded-lg w-full mt-2" />
                  </div>
                ))
              ) : readyPermohonan.length === 0 ? (
                <div className="p-8 text-center text-on-surface-variant font-bold flex flex-col items-center justify-center gap-2.5 h-full">
                  <div className="p-3 bg-emerald-50 text-emerald-500 rounded-full border border-emerald-100">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <span className="block text-xs font-extrabold text-on-surface">Antrean Kosong</span>
                    <span className="text-[10px] text-on-surface-variant/80 mt-0.5 block font-medium">
                      Semua permohonan selesai dikompilasi!
                    </span>
                  </div>
                </div>
              ) : (
                readyPermohonan.map((permohonan) => (
                  <div key={permohonan.id} className="p-4 hover:bg-indigo-50/20 transition-all space-y-3 group/item">
                    <div className="space-y-1">
                      <span className="font-extrabold text-on-surface block text-xs">
                        {permohonan.nama_pemohon}
                      </span>
                      {permohonan.nama_instansi && (
                        <span className="text-[10px] text-on-surface-variant font-medium block">
                          Instansi: {permohonan.nama_instansi}
                        </span>
                      )}
                      
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-bold text-[8px] uppercase tracking-wider border border-outline-variant/60">
                          {permohonan.jenis_sample}
                        </span>
                        <span className="inline-flex items-center gap-0.5 text-[9px] text-on-surface-variant/80 font-medium">
                          <CalendarDays size={10} />
                          {dayjs(permohonan.created_at).format('DD/MM/YY')}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleCompile(permohonan.id)}
                      disabled={generateMutation.isPending}
                      className="w-full flex items-center justify-center gap-1.5 bg-indigo-650 hover:bg-indigo-700 text-white font-extrabold text-[10px] uppercase py-2 rounded-lg cursor-pointer transition-all shadow-sm group-hover/item:translate-y-[-2px] active:translate-y-[0px] hover:shadow disabled:opacity-85"
                    >
                      {generateMutation.isPending ? 'Mengompilasi...' : 'Kompilasi LHP'}
                      <ChevronRight size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer with hint */}
            <div className="p-3 bg-surface-container border-t border-outline-variant text-center">
              <span className="text-[9px] text-on-surface-variant/85 font-semibold leading-relaxed block italic">
                *Permohonan masuk ke antrean setelah seluruh parameter uji terverifikasi &amp; disetujui oleh Quality Control.
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AnalisDashboard;
