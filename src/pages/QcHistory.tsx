import React, { useState } from 'react';
import { 
  History, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCcw, 
  User, 
  Calendar, 
  Search, 
  Filter, 
  X,
  Layers,
  Activity,
  ClipboardCheck
} from 'lucide-react';
import { useQcHistory } from '@/hooks/useQc';
import dayjs from 'dayjs';

interface ParsedStatus {
  label: string;
  colorClass: string;
  badgeClass: string;
  icon: React.ReactNode;
}

const parseQcStatus = (status: string, catatan: string | null): ParsedStatus => {
  const notes = catatan || '';
  if (notes.startsWith('[PASS]')) {
    return {
      label: 'Pass',
      colorClass: 'text-status-success',
      badgeClass: 'bg-status-success/10 text-status-success border-status-success/15',
      icon: <CheckCircle size={13} />
    };
  }
  if (notes.startsWith('[FAIL]')) {
    return {
      label: 'Fail',
      colorClass: 'text-status-danger',
      badgeClass: 'bg-status-danger/10 text-status-danger border-status-danger/15',
      icon: <XCircle size={13} />
    };
  }
  if (notes.startsWith('[RE-TEST]')) {
    return {
      label: 'Re-test',
      colorClass: 'text-status-warning',
      badgeClass: 'bg-status-warning/10 text-status-warning border-status-warning/15',
      icon: <RefreshCcw size={13} />
    };
  }
  if (notes.startsWith('[REJECT SAMPLE]')) {
    return {
      label: 'Reject Sample',
      colorClass: 'text-red-900',
      badgeClass: 'bg-red-950/10 text-red-900 border-red-950/15',
      icon: <AlertTriangle size={13} />
    };
  }

  // Fallbacks
  if (status === 'approved') {
    return {
      label: 'Pass',
      colorClass: 'text-status-success',
      badgeClass: 'bg-status-success/10 text-status-success border-status-success/15',
      icon: <CheckCircle size={13} />
    };
  }
  return {
    label: 'Ditolak',
    colorClass: 'text-status-danger',
    badgeClass: 'bg-status-danger/10 text-status-danger border-status-danger/15',
    icon: <XCircle size={13} />
  };
};

// Strips the [TAG] prefix from notes for clean displaying in tables
const cleanCatatan = (catatan: string | null): string => {
  if (!catatan) return '-';
  return catatan.replace(/^\[(PASS|FAIL|RE-TEST|REJECT SAMPLE)\]\s*/, '').trim();
};

const QcHistory: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedHistory, setSelectedHistory] = useState<any | null>(null);

  // Fetch QC History
  const { data: response, isLoading } = useQcHistory({ per_page: 50 });
  const historyItems = response?.data || [];

  // Filter items
  const filteredItems = historyItems.filter((item: any) => {
    const parameterName = item.hasil_uji?.parameter_uji?.nama_parameter || '';
    const sampleId = item.hasil_uji?.sample_id || '';
    const catatanStr = item.catatan || '';
    const qcOfficerName = item.qc_officer?.name || '';
    const statusInfo = parseQcStatus(item.status, item.catatan);

    const matchesSearch = 
      parameterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sampleId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      catatanStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      qcOfficerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = 
      statusFilter === 'ALL' || 
      (statusFilter === 'PASS' && statusInfo.label === 'Pass') ||
      (statusFilter === 'FAIL' && statusInfo.label === 'Fail') ||
      (statusFilter === 'RE-TEST' && statusInfo.label === 'Re-test') ||
      (statusFilter === 'REJECT_SAMPLE' && statusInfo.label === 'Reject Sample');

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-outline-variant pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-headline-lg text-lg md:text-xl font-extrabold text-on-surface flex items-center gap-2">
            <History className="text-primary" />
            Riwayat Verifikasi QC
          </h1>
          <p className="font-body-md text-xs text-on-surface-variant mt-1 font-medium">
            Catatan audit internal mutu laboratorium ISO 17025 & riwayat rilis parameter hasil uji.
          </p>
        </div>
      </div>

      {/* Filter and Search controls */}
      <div className="bg-white p-4 rounded-xl border border-outline-variant soft-shadow flex flex-col md:flex-row gap-4 items-center justify-between text-xs">
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface-variant">
            <Search size={14} />
          </span>
          <input
            type="text"
            placeholder="Cari ID, Parameter, Sample, Analyst..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-outline-variant rounded-lg focus:outline-none focus:border-primary font-medium"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto overflow-x-auto self-start md:self-center">
          <span className="text-on-surface-variant font-bold flex items-center gap-1.5 shrink-0">
            <Filter size={13} />
            Filter Status:
          </span>
          {[
            { id: 'ALL', label: 'Semua' },
            { id: 'PASS', label: 'Pass' },
            { id: 'RE-TEST', label: 'Re-test' },
            { id: 'FAIL', label: 'Fail' },
            { id: 'REJECT_SAMPLE', label: 'Reject Sample' }
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => setStatusFilter(opt.id)}
              className={`px-3 py-1.5 rounded-lg border font-bold text-[10px] uppercase transition-all cursor-pointer ${
                statusFilter === opt.id 
                  ? 'bg-primary text-on-primary border-primary shadow-sm' 
                  : 'bg-white border-outline-variant text-on-surface-variant hover:border-outline'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-xl border border-outline-variant overflow-hidden soft-shadow">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container border-b border-outline-variant text-[10px] font-extrabold text-on-surface-variant uppercase tracking-wider">
                <th className="p-4">ID Verifikasi</th>
                <th className="p-4">Parameter Uji</th>
                <th className="p-4">ID Sampel</th>
                <th className="p-4">Nilai Hasil</th>
                <th className="p-4">Status QC</th>
                <th className="p-4">Verifikator / QC</th>
                <th className="p-4">Catatan</th>
                <th className="p-4">Tanggal Verifikasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant text-xs text-on-surface font-semibold">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="p-4"><div className="h-3 bg-gray-200 rounded w-24" /></td>
                    <td className="p-4"><div className="h-3 bg-gray-200 rounded w-32" /></td>
                    <td className="p-4"><div className="h-3 bg-gray-200 rounded w-28" /></td>
                    <td className="p-4"><div className="h-3 bg-gray-200 rounded w-16" /></td>
                    <td className="p-4"><div className="h-3 bg-gray-200 rounded w-20" /></td>
                    <td className="p-4"><div className="h-3 bg-gray-200 rounded w-24" /></td>
                    <td className="p-4"><div className="h-3 bg-gray-200 rounded w-36" /></td>
                    <td className="p-4"><div className="h-3 bg-gray-200 rounded w-28" /></td>
                  </tr>
                ))
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-on-surface-variant font-semibold">
                    Belum ada riwayat verifikasi QC yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item: any) => {
                  const statusInfo = parseQcStatus(item.status, item.catatan);
                  return (
                    <tr 
                      key={item.id} 
                      onClick={() => setSelectedHistory(item)}
                      className="hover:bg-surface-container-low transition-all cursor-pointer"
                    >
                      <td className="p-4 font-mono font-bold text-gray-500 hover:text-primary">
                        {item.id.substring(0, 8)}...
                      </td>
                      <td className="p-4 font-extrabold text-primary">
                        {item.hasil_uji?.parameter_uji?.nama_parameter || 'Parameter Uji'}
                      </td>
                      <td className="p-4 font-mono text-[11px] text-on-surface-variant">
                        {item.hasil_uji?.sample_id?.substring(0, 12) || '-'}
                      </td>
                      <td className="p-4 font-bold text-on-surface">
                        {item.hasil_uji?.nilai_hasil} {item.hasil_uji?.parameter_uji?.satuan}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.7 rounded-full font-bold text-[9px] uppercase border ${statusInfo.badgeClass}`}>
                          {statusInfo.icon}
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="p-4 text-on-surface-variant flex items-center gap-1 font-semibold mt-1">
                        <User size={12} className="text-primary/70" />
                        {item.qc_officer?.name || 'QC Officer'}
                      </td>
                      <td className="p-4 text-on-surface-variant font-medium max-w-[200px] truncate">
                        {cleanCatatan(item.catatan)}
                      </td>
                      <td className="p-4 text-on-surface-variant font-semibold">
                        {dayjs(item.diverifikasi_pada || item.created_at).format('YYYY-MM-DD HH:mm')}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ISO 17025 Detailed QC Report Modal */}
      {selectedHistory && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-backdrop-fade">
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden soft-shadow border border-primary-fixed animate-modal-zoom">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-primary to-primary-container p-4 text-on-primary flex justify-between items-center">
              <div className="flex items-center gap-2">
                <ClipboardCheck size={20} />
                <div>
                  <h3 className="font-headline-md text-sm md:text-base font-extrabold">
                    Laporan Verifikasi Mutu Laboratorium
                  </h3>
                  <span className="text-[9px] uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded font-bold">
                    Standar Akreditasi KAN ISO 17025
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedHistory(null)}
                className="bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-all cursor-pointer text-on-primary"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto text-xs">
              
              {/* Status & ID Badge */}
              <div className="flex justify-between items-center border-b border-outline-variant/60 pb-4">
                <div>
                  <span className="text-[10px] text-on-surface-variant font-bold block uppercase tracking-wider">ID Audit QC</span>
                  <span className="font-mono font-bold text-sm text-on-surface">{selectedHistory.id}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-on-surface-variant font-bold block uppercase tracking-wider mb-1">Status Penilaian</span>
                  {(() => {
                    const statusInfo = parseQcStatus(selectedHistory.status, selectedHistory.catatan);
                    return (
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-extrabold text-[10px] uppercase border ${statusInfo.badgeClass}`}>
                        {statusInfo.icon}
                        {statusInfo.label}
                      </span>
                    );
                  })()}
                </div>
              </div>

              {/* Sample and Parameter Details Card */}
              <div className="bg-cream-bg border border-outline-variant/80 p-4 rounded-xl space-y-4">
                <h4 className="font-bold text-xs text-primary flex items-center gap-1">
                  <Layers size={14} />
                  Informasi Parameter & Hasil Pengujian
                </h4>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <span className="text-on-surface-variant font-bold text-[9px] uppercase tracking-wider block">Parameter</span>
                    <span className="font-extrabold text-on-surface text-[13px]">
                      {selectedHistory.hasil_uji?.parameter_uji?.nama_parameter || 'Parameter Uji'}
                    </span>
                  </div>
                  <div>
                    <span className="text-on-surface-variant font-bold text-[9px] uppercase tracking-wider block">ID Sampel</span>
                    <span className="font-mono font-bold text-on-surface">{selectedHistory.hasil_uji_id?.substring(0, 12)}</span>
                  </div>
                  <div>
                    <span className="text-on-surface-variant font-bold text-[9px] uppercase tracking-wider block">Hasil Analisis</span>
                    <span className="font-extrabold text-primary text-[13px]">
                      {selectedHistory.hasil_uji?.nilai_hasil} {selectedHistory.hasil_uji?.parameter_uji?.satuan}
                    </span>
                  </div>
                  <div>
                    <span className="text-on-surface-variant font-bold text-[9px] uppercase tracking-wider block">Metode Pengujian</span>
                    <span className="font-bold text-on-surface">{selectedHistory.hasil_uji?.metode_pengujian || 'Manual Lab'}</span>
                  </div>
                </div>
              </div>

              {/* Audit trail metadata */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-surface-container-low p-3.5 rounded-lg border border-outline-variant/60 flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-full text-primary">
                    <User size={16} />
                  </div>
                  <div>
                    <span className="text-on-surface-variant font-bold text-[9px] uppercase tracking-wider block">Petugas Verifikator (QC)</span>
                    <span className="font-bold text-on-surface text-[11px]">{selectedHistory.qc_officer?.name || 'QC Officer'}</span>
                    <span className="text-[9px] text-on-surface-variant block font-medium">Internal Lab Inspector</span>
                  </div>
                </div>

                <div className="bg-surface-container-low p-3.5 rounded-lg border border-outline-variant/60 flex items-center gap-3">
                  <div className="p-2 bg-secondary/10 rounded-full text-secondary">
                    <Calendar size={16} />
                  </div>
                  <div>
                    <span className="text-on-surface-variant font-bold text-[9px] uppercase tracking-wider block">Waktu Penilaian</span>
                    <span className="font-bold text-on-surface text-[11px]">
                      {dayjs(selectedHistory.diverifikasi_pada || selectedHistory.created_at).format('DD MMMM YYYY HH:mm')}
                    </span>
                    <span className="text-[9px] text-on-surface-variant block font-medium">Terdaftar di server</span>
                  </div>
                </div>
              </div>

              {/* Checklist & Comments parsed report */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs text-on-surface flex items-center gap-1.5 border-b border-outline-variant pb-2">
                  <Activity size={14} className="text-primary" />
                  Rincian Penilaian & Checklist
                </h4>

                <div className="space-y-3.5 bg-gray-50 p-4 rounded-xl border border-outline-variant/60 font-mono text-[11px] leading-relaxed max-h-56 overflow-y-auto text-on-surface-variant whitespace-pre-wrap">
                  {selectedHistory.catatan || 'Tidak ada catatan terlampir.'}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-surface-container p-4 flex justify-end border-t border-outline-variant">
              <button
                onClick={() => setSelectedHistory(null)}
                className="px-5 py-2 bg-primary text-on-primary font-bold text-xs rounded-lg hover:bg-primary-container soft-shadow cursor-pointer transition-all"
              >
                Selesai Ulasan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QcHistory;
