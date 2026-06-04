import React from 'react';
import { Archive, Download, Search, Mail } from 'lucide-react';
import { useLaporanFinal, useDownloadLaporan, useSendLaporanEmail } from '@/hooks/useLaporan';
import dayjs from 'dayjs';

const Arsip: React.FC = () => {
  const { data: response, isLoading } = useLaporanFinal();
  const downloadMutation = useDownloadLaporan();
  const sendEmailMutation = useSendLaporanEmail();
  const [searchTerm, setSearchTerm] = React.useState('');

  const allLaporan = response?.data || [];
  const filteredLaporan = allLaporan.filter(l => 
    (l.nomor_laporan || l.id).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="border-b border-outline-variant pb-4">
        <h1 className="font-headline-lg text-lg md:text-xl font-extrabold text-on-surface flex items-center gap-2">
          <Archive className="text-primary" />
          Arsip Dokumen & Laporan
        </h1>
        <p className="font-body-md text-xs text-on-surface-variant mt-1 font-medium">
          Arsip seluruh dokumen laporan hasil pengujian yang telah diotorisasi dan diarsipkan secara resmi.
        </p>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl border border-outline-variant soft-shadow">
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={15} />
          <input
            type="text"
            placeholder="Cari nomor laporan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-outline-variant bg-surface-container-low text-xs text-on-surface outline-none focus:border-primary focus:bg-white transition-all"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-outline-variant overflow-hidden soft-shadow">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container border-b border-outline-variant text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                <th className="p-4">No. Laporan</th>
                <th className="p-4">Status</th>
                <th className="p-4">SHA-256 Hash</th>
                <th className="p-4">Tanggal Arsip</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant text-xs text-on-surface font-medium">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="p-4"><div className="h-3 bg-gray-200 rounded w-24" /></td>
                    <td className="p-4"><div className="h-3 bg-gray-200 rounded w-16" /></td>
                    <td className="p-4"><div className="h-3 bg-gray-200 rounded w-32" /></td>
                    <td className="p-4"><div className="h-3 bg-gray-200 rounded w-20" /></td>
                    <td className="p-4"><div className="h-3 bg-gray-200 rounded w-20 mx-auto" /></td>
                  </tr>
                ))
              ) : filteredLaporan.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-on-surface-variant font-semibold">
                    {searchTerm ? 'Tidak ditemukan hasil pencarian.' : 'Belum ada dokumen arsip.'}
                  </td>
                </tr>
              ) : (
                filteredLaporan.map((lap) => (
                  <tr key={lap.id} className="hover:bg-surface-container-low transition-all">
                    <td className="p-4 font-bold text-primary">{lap.nomor_laporan || lap.id.substring(0, 12)}</td>
                    <td className="p-4">
                      <span className="bg-status-success/10 text-status-success px-2.5 py-0.5 rounded-full font-bold text-[10px]">
                        Diarsipkan
                      </span>
                    </td>
                    <td className="p-4 font-mono text-[10px] text-on-surface-variant">{lap.hash_sha256?.substring(0, 20) || '-'}...</td>
                    <td className="p-4 text-on-surface-variant">{dayjs(lap.created_at).format('YYYY-MM-DD')}</td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => downloadMutation.mutate(lap.draft_laporan_id)}
                          disabled={downloadMutation.isPending}
                          className="inline-flex items-center gap-1 bg-white border border-outline-variant text-on-surface px-2.5 py-1.5 rounded hover:bg-surface-container transition-all text-[10px] font-semibold cursor-pointer soft-shadow disabled:opacity-80"
                          title="Unduh PDF Laporan"
                        >
                          <Download size={12} />
                          Unduh
                        </button>
                        <button
                          onClick={() => sendEmailMutation.mutate(lap.id)}
                          disabled={sendEmailMutation.isPending}
                          className="inline-flex items-center gap-1 bg-primary text-white px-2.5 py-1.5 rounded hover:bg-primary/95 active:scale-95 transition-all text-[10px] font-semibold cursor-pointer soft-shadow disabled:opacity-80"
                          title={lap.email_client ? `Kirim ke ${lap.email_client}` : 'Email client tidak terdaftar'}
                        >
                          <Mail size={12} />
                          {sendEmailMutation.isPending && sendEmailMutation.variables === lap.id ? 'Mengirim...' : 'Kirim Email'}
                        </button>
                      </div>
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

export default Arsip;
