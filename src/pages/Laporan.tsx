import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileSpreadsheet, Printer, Send, CheckCircle2, Clock, XCircle, Eye } from 'lucide-react';
import { useDrafts, useDownloadLaporan, useGenerateLaporan, useSubmitLaporan } from '@/hooks/useLaporan';
import { usePermohonanList } from '@/hooks/usePermohonan';
import type { DraftLaporanData } from '@/services/laporan.service';
import dayjs from 'dayjs';

const STATUS_MAP: Record<string, { label: string; style: string }> = {
  draft: { label: 'Draft', style: 'bg-status-info/10 text-status-info' },
  pending_approval: { label: 'Menunggu Approval', style: 'bg-status-warning/10 text-status-warning' },
  approved: { label: 'Disetujui', style: 'bg-status-success/10 text-status-success' },
  final: { label: 'Final', style: 'bg-primary/10 text-primary' },
  archived: { label: 'Diarsipkan', style: 'bg-gray-400/10 text-gray-600' },
};

const Laporan: React.FC = () => {
  const { data: response, isLoading, refetch: refetchDrafts } = useDrafts();
  const { data: permohonanResponse, refetch: refetchPermohonan } = usePermohonanList({ ready_for_laporan: true });
  const downloadMutation = useDownloadLaporan();
  const generateMutation = useGenerateLaporan();
  const submitMutation = useSubmitLaporan();

  const [generateModal, setGenerateModal] = useState(false);
  const [permohonanId, setPermohonanId] = useState('');
  const navigate = useNavigate();

  const drafts: DraftLaporanData[] = response?.data || [];
  const readyPermohonan = permohonanResponse?.data || [];

  const handleGenerate = () => {
    if (!permohonanId) return;
    generateMutation.mutate(
      { permohonan_id: permohonanId, catatan: 'Draft kompilasi LHP oleh Analis.' },
      { 
        onSuccess: () => { 
          setGenerateModal(false); 
          setPermohonanId(''); 
          refetchDrafts();
          refetchPermohonan();
        } 
      }
    );
  };

  const handleSubmit = (draftId: string) => {
    if (confirm('Kirim laporan ini ke Kepala UPTD untuk persetujuan?')) {
      submitMutation.mutate(draftId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-outline-variant pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-headline-lg text-lg md:text-xl font-extrabold text-on-surface">
            Draft &amp; Kompilasi Laporan Hasil Pengujian (LHP)
          </h1>
          <p className="font-body-md text-xs text-on-surface-variant mt-1 font-medium">
            Susun lembar kerja pengujian laboratorium menjadi dokumen LHP formal institusi pemerintah.
          </p>
        </div>
        <button
          onClick={() => setGenerateModal(true)}
          className="bg-primary text-on-primary font-label-md text-xs font-bold px-4 py-2.5 rounded-lg hover:bg-primary-container transition-all cursor-pointer soft-shadow flex items-center gap-2"
        >
          <FileSpreadsheet size={15} />
          + Generate Draft
        </button>
      </div>

      {/* Status summary pills */}
      {!isLoading && drafts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'draft', icon: <Clock size={12} />, count: drafts.filter(d => d.status === 'draft').length },
            { key: 'pending_approval', icon: <Send size={12} />, count: drafts.filter(d => d.status === 'pending_approval').length },
            { key: 'approved', icon: <CheckCircle2 size={12} />, count: drafts.filter(d => d.status === 'approved').length },
          ].map(({ key, icon, count }) => {
            const s = STATUS_MAP[key];
            return count > 0 ? (
              <span key={key} className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold border ${s.style}`}>
                {icon} {count} {s.label}
              </span>
            ) : null;
          })}
        </div>
      )}

      <div className="bg-white rounded-xl border border-outline-variant overflow-hidden soft-shadow">
        <div className="p-4 border-b border-outline-variant bg-surface-container-low">
          <h3 className="font-headline-md text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-2">
            <FileSpreadsheet size={16} className="text-primary" />
            Antrean Draft Laporan Analis
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container border-b border-outline-variant text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                <th className="p-4">No. Laporan</th>
                <th className="p-4">Status</th>
                <th className="p-4">Catatan</th>
                <th className="p-4">Tanggal</th>
                <th className="p-4 text-center">Aksi Kompilasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant text-xs text-on-surface font-medium">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="p-4"><div className="h-3 bg-gray-200 rounded w-24" /></td>
                    <td className="p-4"><div className="h-3 bg-gray-200 rounded w-20" /></td>
                    <td className="p-4"><div className="h-3 bg-gray-200 rounded w-32" /></td>
                    <td className="p-4"><div className="h-3 bg-gray-200 rounded w-20" /></td>
                    <td className="p-4"><div className="h-3 bg-gray-200 rounded w-32 mx-auto" /></td>
                  </tr>
                ))
              ) : drafts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-on-surface-variant font-semibold">
                    Belum ada draft laporan. Klik "+ Generate Draft" untuk membuat laporan baru.
                  </td>
                </tr>
              ) : (
                drafts.map((draft) => {
                  const statusInfo = STATUS_MAP[draft.status] || { label: draft.status, style: 'bg-gray-200 text-gray-700' };
                  const isEditable = draft.status === 'draft';
                  const isPendingApproval = draft.status === 'pending_approval';

                  return (
                    <tr key={draft.id} className="hover:bg-surface-container-low transition-all">
                      <td className="p-4 font-bold text-primary">{draft.nomor_laporan || draft.id.substring(0, 12)}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] inline-block ${statusInfo.style}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="p-4 text-on-surface-variant">{draft.catatan || '-'}</td>
                      <td className="p-4 text-on-surface-variant">{dayjs(draft.created_at).format('YYYY-MM-DD')}</td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => navigate(`/laporan/preview/${draft.id}`)}
                            className="inline-flex items-center gap-1 bg-white border border-outline-variant text-on-surface px-2.5 py-1.5 rounded hover:bg-surface-container transition-all text-[10px] font-semibold cursor-pointer soft-shadow"
                          >
                            <Eye size={12} />
                            Preview
                          </button>

                          <button 
                            onClick={() => downloadMutation.mutate(draft.id)}
                            disabled={downloadMutation.isPending}
                            className="inline-flex items-center gap-1 bg-white border border-outline-variant text-on-surface px-2.5 py-1.5 rounded hover:bg-surface-container transition-all text-[10px] font-semibold cursor-pointer soft-shadow disabled:opacity-60"
                          >
                            <Printer size={12} />
                            Download PDF
                          </button>

                          {isEditable && (
                            <button 
                              onClick={() => handleSubmit(draft.id)}
                              disabled={submitMutation.isPending}
                              className="inline-flex items-center gap-1 bg-primary text-on-primary px-3 py-1.5 rounded hover:bg-primary-container transition-all text-[10px] font-bold cursor-pointer soft-shadow disabled:opacity-80"
                            >
                              <Send size={11} />
                              {submitMutation.isPending ? 'Mengirim...' : 'Kirim ke Kepala UPTD'}
                            </button>
                          )}

                          {isPendingApproval && (
                            <span className="inline-flex items-center gap-1 text-status-warning text-[10px] font-bold">
                              <Clock size={11} />
                              Menunggu Approval
                            </span>
                          )}

                          {draft.status === 'approved' && (
                            <span className="inline-flex items-center gap-1 text-status-success text-[10px] font-bold">
                              <CheckCircle2 size={11} />
                              Disetujui
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

      {/* Generate Draft Modal */}
      {generateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl soft-shadow border border-outline-variant w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b border-outline-variant">
              <h3 className="font-headline-md text-sm font-bold text-on-surface">Generate Draft Laporan</h3>
              <button onClick={() => setGenerateModal(false)} className="p-1.5 hover:bg-surface-container rounded-lg cursor-pointer">
                <XCircle size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-xs text-on-surface-variant font-medium">
                Pilih Permohonan Uji yang telah selesai diverifikasi QC untuk mengompilasi Draft LHP otomatis.
              </p>
              <div className="space-y-1.5">
                <label className="block font-label-sm text-[11px] font-bold text-on-surface-variant uppercase">Permohonan Uji Siap Kompilasi</label>
                {readyPermohonan.length === 0 ? (
                  <div className="p-3 bg-amber-50 text-amber-700 border border-amber-200/50 rounded-lg text-[11px] font-semibold leading-relaxed">
                    Tidak ada permohonan yang siap dikompilasi saat ini (seluruh hasil uji parameter harus disetujui QC).
                  </div>
                ) : (
                  <select
                    value={permohonanId}
                    onChange={(e) => setPermohonanId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-outline-variant bg-surface-container-low text-xs outline-none focus:border-primary transition-all font-semibold"
                  >
                    <option value="">-- Pilih Permohonan --</option>
                    {readyPermohonan.map((p: any) => (
                      <option key={p.id} value={p.id}>
                        {p.nomor_permohonan} - {p.nama_pemohon} ({p.jenis_sample})
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setGenerateModal(false)}
                  className="flex-1 py-2.5 border border-outline-variant text-on-surface rounded-lg font-semibold text-xs hover:bg-surface-container transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={generateMutation.isPending || !permohonanId}
                  className="flex-1 py-2.5 bg-primary text-on-primary rounded-lg font-bold text-xs hover:bg-primary-container transition-all cursor-pointer soft-shadow disabled:opacity-50"
                >
                  {generateMutation.isPending ? 'Membuat...' : 'Generate Draft'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Laporan;
