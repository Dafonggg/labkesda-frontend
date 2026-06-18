import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Signature, Check, X, FileText, User, Clock, Eye } from 'lucide-react';
import { usePendingApprovals, useApproveFinal, useRejectFinal } from '@/hooks/useApproval';
import type { ApprovalPayload } from '@/services/approval.service';
import dayjs from 'dayjs';

const Approval: React.FC = () => {
  const navigate = useNavigate();
  const { data: response, isLoading } = usePendingApprovals();
  const approveMutation = useApproveFinal();
  const rejectMutation = useRejectFinal();

  const [rejectModal, setRejectModal] = useState<{ open: boolean; laporanId: string | null }>({
    open: false,
    laporanId: null,
  });
  const [rejectNote, setRejectNote] = useState('');

  // Use the dedicated /approval/pending endpoint — only returns pending_approval items
  const pendingApprovals = response?.data || [];

  const handleApprove = (laporanId: string) => {
    const payload: ApprovalPayload = { laporan_id: laporanId, catatan: 'Disetujui oleh Kepala UPTD' };
    approveMutation.mutate(payload);
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
      onSuccess: () => setRejectModal({ open: false, laporanId: null }),
    });
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-outline-variant pb-4">
        <h1 className="font-headline-lg text-lg md:text-xl font-extrabold text-on-surface">
          Otorisasi &amp; Tanda Tangan Kepala UPTD
        </h1>
        <p className="font-body-md text-xs text-on-surface-variant mt-1 font-medium">
          Tinjau draf Laporan Hasil Pengujian (LHP) final dan bubuhkan tanda tangan elektronik terverifikasi keamanan.
        </p>
      </div>

      {/* Summary badge */}
      {!isLoading && pendingApprovals.length > 0 && (
        <div className="flex items-center gap-2 bg-status-warning/10 border border-status-warning/30 rounded-xl px-4 py-2.5 text-xs font-bold text-status-warning">
          <Clock size={14} />
          {pendingApprovals.length} laporan menunggu persetujuan Anda
        </div>
      )}

      <div className="space-y-4">
        {isLoading ? (
          <div className="bg-white p-6 rounded-xl border border-outline-variant soft-shadow animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-32" />
            <div className="h-20 bg-gray-200 rounded" />
          </div>
        ) : pendingApprovals.length > 0 ? (
          pendingApprovals.map((app) => (
            <div key={app.id} className="bg-white p-6 rounded-xl border border-outline-variant soft-shadow grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Document Info (Col 7) */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-xs text-primary">{app.nomor_laporan || app.id.substring(0, 12)}</span>
                  <span className="bg-status-warning/10 text-status-warning px-2.5 py-0.5 rounded font-bold text-[9px] uppercase">
                    MENUNGGU APPROVAL
                  </span>
                </div>
                <h3 className="font-headline-lg text-sm font-extrabold text-on-surface leading-tight">
                  Laporan Hasil Pengujian
                </h3>

                <div className="grid grid-cols-2 gap-2 text-[10px] text-on-surface-variant font-bold uppercase tracking-wider border-t border-outline-variant pt-3.5">
                  <div>
                    <span className="block text-gray-400">Status</span>
                    <span className="font-semibold text-on-surface capitalize">{app.status}</span>
                  </div>
                  <div>
                    <span className="block text-gray-400">Tanggal Dibuat</span>
                    <span className="font-semibold text-on-surface">{dayjs(app.created_at).format('DD MMM YYYY')}</span>
                  </div>
                  {app.catatan && (
                    <div className="col-span-2">
                      <span className="block text-gray-400">Catatan Analis</span>
                      <span className="font-semibold text-on-surface">{app.catatan}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Digital Signature Card Box (Col 5) */}
              <div className="lg:col-span-5 bg-surface-container-low border border-outline-variant rounded-xl p-4 text-center space-y-3.5 hover-lift">
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-primary border-b border-outline-variant pb-2">
                  <Signature size={15} />
                  <span>Lembar Tanda Tangan Elektronik</span>
                </div>
                
                <div className="p-4 bg-white border border-outline-variant border-dashed rounded-lg text-[10px] text-on-surface-variant font-medium flex flex-col items-center justify-center min-h-[90px]">
                  <FileText size={24} className="text-primary mb-2" />
                  <span className="text-primary font-bold mb-1">[TANDA TANGAN DIGITAL TERSEGEL]</span>
                  <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Menunggu Otorisasi</span>
                </div>

                {/* Preview button */}
                <button
                  onClick={() => navigate(`/dashboard/approval/preview/${app.id}`)}
                  className="w-full py-2 bg-white border border-outline-variant text-on-surface hover:bg-surface-container font-semibold text-[10px] rounded transition-all cursor-pointer soft-shadow flex items-center justify-center gap-1.5 mb-1"
                >
                  <Eye size={12} />
                  Lihat Preview Laporan
                </button>

                <div className="flex gap-2">
                  <button 
                    onClick={() => openRejectModal(app.id)}
                    disabled={approveMutation.isPending || rejectMutation.isPending}
                    className="flex-1 py-2 bg-white border border-status-danger/40 text-status-danger hover:bg-status-danger/5 font-semibold text-[10px] rounded transition-all cursor-pointer soft-shadow flex items-center justify-center gap-1 disabled:opacity-60"
                  >
                    <X size={12} />
                    Tolak / Revisi
                  </button>
                  <button 
                    onClick={() => handleApprove(app.id)}
                    disabled={approveMutation.isPending || rejectMutation.isPending}
                    className="flex-1 py-2 bg-primary text-on-primary hover:bg-primary-container font-bold text-[10px] rounded transition-all cursor-pointer flex items-center justify-center gap-1 soft-shadow disabled:opacity-80"
                  >
                    <Check size={12} />
                    {approveMutation.isPending ? 'Proses...' : 'Approve & Segel LHP'}
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white p-12 text-center rounded-xl border border-outline-variant soft-shadow">
            <User size={32} className="text-on-surface-variant mx-auto mb-3" />
            <p className="text-on-surface-variant text-xs font-semibold">
              Semua draf laporan telah ditandatangani. Antrean persetujuan Kepala UPTD kosong.
            </p>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectModal.open && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl soft-shadow border border-outline-variant w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b border-outline-variant">
              <h3 className="font-headline-md text-sm font-bold text-on-surface">
                Tolak &amp; Kembalikan ke Analis
              </h3>
              <button onClick={() => setRejectModal({ open: false, laporanId: null })} className="p-1.5 hover:bg-surface-container rounded-lg cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-xs text-on-surface-variant font-medium">
                Berikan catatan revisi yang jelas agar Analis dapat memperbaiki laporan.
              </p>
              <div className="space-y-1.5">
                <label className="block font-label-sm text-[11px] font-bold text-on-surface-variant uppercase">Catatan Revisi *</label>
                <textarea
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                  placeholder="Contoh: Data parameter pH tidak sesuai standar, harap diulang..."
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-lg border border-outline-variant bg-surface-container-low text-xs outline-none focus:border-status-danger transition-all resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setRejectModal({ open: false, laporanId: null })}
                  className="flex-1 py-2.5 border border-outline-variant text-on-surface rounded-lg font-semibold text-xs hover:bg-surface-container transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={handleReject}
                  disabled={!rejectNote.trim() || rejectMutation.isPending}
                  className="flex-1 py-2.5 bg-status-danger text-white rounded-lg font-bold text-xs hover:opacity-90 transition-all cursor-pointer soft-shadow disabled:opacity-60"
                >
                  {rejectMutation.isPending ? 'Mengirim...' : 'Tolak & Kembalikan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Approval;
