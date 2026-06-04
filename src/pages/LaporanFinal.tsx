import React from 'react';
import { Archive, Download } from 'lucide-react';
import { useLaporanFinal, useDownloadLaporan } from '@/hooks/useLaporan';
import dayjs from 'dayjs';

const LaporanFinal: React.FC = () => {
  const { data: response, isLoading } = useLaporanFinal();
  const downloadMutation = useDownloadLaporan();

  const laporanList = response?.data || [];

  return (
    <div className="space-y-6">
      <div className="border-b border-outline-variant pb-4">
        <h1 className="font-headline-lg text-lg md:text-xl font-extrabold text-on-surface flex items-center gap-2">
          <Archive className="text-primary" />
          Laporan Final & Arsip Resmi
        </h1>
        <p className="font-body-md text-xs text-on-surface-variant mt-1 font-medium">
          Daftar Laporan Hasil Pengujian (LHP) yang telah disetujui dan ditandatangani secara digital.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-outline-variant overflow-hidden soft-shadow">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container border-b border-outline-variant text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                <th className="p-4">No. Laporan</th>
                <th className="p-4">Status</th>
                <th className="p-4">Hash SHA-256</th>
                <th className="p-4">Tanggal</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant text-xs text-on-surface font-medium">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="p-4"><div className="h-3 bg-gray-200 rounded w-24" /></td>
                    <td className="p-4"><div className="h-3 bg-gray-200 rounded w-20" /></td>
                    <td className="p-4"><div className="h-3 bg-gray-200 rounded w-36" /></td>
                    <td className="p-4"><div className="h-3 bg-gray-200 rounded w-20" /></td>
                    <td className="p-4"><div className="h-3 bg-gray-200 rounded w-20 mx-auto" /></td>
                  </tr>
                ))
              ) : laporanList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-on-surface-variant font-semibold">
                    Belum ada laporan final.
                  </td>
                </tr>
              ) : (
                laporanList.map((lap) => (
                  <tr key={lap.id} className="hover:bg-surface-container-low transition-all">
                    <td className="p-4 font-bold text-primary">{lap.nomor_laporan || lap.id.substring(0, 12)}</td>
                    <td className="p-4">
                      <span className="bg-status-success/10 text-status-success px-2.5 py-0.5 rounded-full font-bold text-[10px]">
                        {lap.status === 'final' ? 'Final' : lap.status}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-[10px] text-on-surface-variant">{lap.hash_sha256?.substring(0, 16) || '-'}...</td>
                    <td className="p-4 text-on-surface-variant">{dayjs(lap.created_at).format('YYYY-MM-DD')}</td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => downloadMutation.mutate(lap.draft_laporan_id)}
                        disabled={downloadMutation.isPending}
                        className="inline-flex items-center gap-1 bg-primary text-on-primary px-3 py-1.5 rounded hover:bg-primary-container transition-all text-[10px] font-bold cursor-pointer soft-shadow disabled:opacity-80"
                      >
                        <Download size={12} />
                        Unduh PDF
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LaporanFinal;
