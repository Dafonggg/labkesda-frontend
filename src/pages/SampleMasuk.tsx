import React from 'react';
import { Layers } from 'lucide-react';
import { useRegistrasiList } from '@/hooks/useRegistrasi';
import dayjs from 'dayjs';

const SampleMasuk: React.FC = () => {
  const { data: response, isLoading } = useRegistrasiList();
  const samples = response?.data || [];

  return (
    <div className="space-y-6">
      <div className="border-b border-outline-variant pb-4">
        <h1 className="font-headline-lg text-lg md:text-xl font-extrabold text-on-surface flex items-center gap-2">
          <Layers className="text-primary" />
          Sample Masuk Laboratorium
        </h1>
        <p className="font-body-md text-xs text-on-surface-variant mt-1 font-medium">
          Daftar sampel yang telah diterima dan diregistrasi untuk pengujian laboratorium.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-outline-variant overflow-hidden soft-shadow">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container border-b border-outline-variant text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                <th className="p-4">Kode Sampel</th>
                <th className="p-4">No. Registrasi</th>
                <th className="p-4">Status</th>
                <th className="p-4">Tanggal Masuk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant text-xs text-on-surface font-medium">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="p-4"><div className="h-3 bg-gray-200 rounded w-24" /></td>
                    <td className="p-4"><div className="h-3 bg-gray-200 rounded w-28" /></td>
                    <td className="p-4"><div className="h-3 bg-gray-200 rounded w-20" /></td>
                    <td className="p-4"><div className="h-3 bg-gray-200 rounded w-24" /></td>
                  </tr>
                ))
              ) : samples.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-on-surface-variant font-semibold">
                    Belum ada sampel masuk.
                  </td>
                </tr>
              ) : (
                samples.map((sample) => (
                  <tr key={sample.id} className="hover:bg-surface-container-low transition-all">
                    <td className="p-4 font-bold text-primary">{sample.kode_sample || '-'}</td>
                    <td className="p-4 font-semibold">{sample.nomor_registrasi}</td>
                    <td className="p-4">
                      <span className="bg-status-info/10 text-status-info px-2.5 py-0.5 rounded-full font-bold text-[10px]">
                        {sample.status}
                      </span>
                    </td>
                    <td className="p-4 text-on-surface-variant">{dayjs(sample.created_at).format('YYYY-MM-DD HH:mm')}</td>
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

export default SampleMasuk;
