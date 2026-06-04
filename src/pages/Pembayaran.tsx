import React, { useState } from 'react';
import { Clock, CheckCircle2, ShieldAlert, Plus, X, DollarSign } from 'lucide-react';
import { usePaymentList, useCreatePayment } from '@/hooks/usePayment';
import { usePermohonanList } from '@/hooks/usePermohonan';
import type { PaymentPayload } from '@/services/payment.service';
import dayjs from 'dayjs';

const Pembayaran: React.FC = () => {
  const { data: response, isLoading: isPaymentsLoading } = usePaymentList({ per_page: 100 });
  const { data: permohonanResponse, isLoading: isPermohonanLoading } = usePermohonanList({
    status: 'waiting_payment',
    per_page: 100,
  });
  const createMutation = useCreatePayment();

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<PaymentPayload>({
    permohonan_id: '',
    jumlah: 0,
    metode_pembayaran: 'transfer',
  });

  const payments = response?.data || [];
  const permohonanWaiting = permohonanResponse?.data || [];

  // Calculate summary stats
  const totalLunas = payments.reduce((sum, p) => sum + Number(p.jumlah), 0);

  // Overdue = waiting payment & created more than 3 days ago
  const thresholdDate = dayjs().subtract(3, 'day');
  const overduePermohonan = permohonanWaiting.filter(p => dayjs(p.created_at).isBefore(thresholdDate));
  const pendingPermohonan = permohonanWaiting.filter(p => !dayjs(p.created_at).isBefore(thresholdDate));

  const totalPending = pendingPermohonan.reduce((sum, p) => sum + Number(p.total_biaya || 0), 0);
  const totalOverdue = overduePermohonan.reduce((sum, p) => sum + Number(p.total_biaya || 0), 0);

  const formatCurrency = (val: number) => `Rp ${val.toLocaleString('id-ID')}`;

  const STATUS_MAP: Record<string, { label: string; style: string }> = {
    paid: { label: 'Lunas', style: 'bg-status-success/10 text-status-success' },
    pending: { label: 'Belum Bayar', style: 'bg-status-warning/10 text-status-warning' },
    overdue: { label: 'Jatuh Tempo', style: 'bg-status-danger/10 text-status-danger' },
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.permohonan_id.trim()) return;
    if (!form.jumlah || form.jumlah <= 0) return;

    createMutation.mutate(form, {
      onSuccess: () => {
        setShowModal(false);
        setForm({ permohonan_id: '', jumlah: 0, metode_pembayaran: 'transfer' });
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-outline-variant pb-4">
        <div>
          <h1 className="font-headline-lg text-lg md:text-xl font-extrabold text-on-surface">
            Keuangan &amp; Verifikasi Pembayaran
          </h1>
          <p className="font-body-md text-xs text-on-surface-variant mt-1 font-medium">
            Pantau billing invoice, verifikasi bukti pembayaran, dan kelola administrasi keuangan pengujian.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-primary text-on-primary font-label-md text-xs font-semibold px-4 py-2.5 rounded-lg hover:bg-primary-container transition-all cursor-pointer soft-shadow"
        >
          <Plus size={14} />
          Catat Pembayaran Baru
        </button>
      </div>

      {/* KPI summaries */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-outline-variant soft-shadow hover-lift flex items-center gap-4">
          <div className="w-12 h-12 bg-status-success/10 text-status-success rounded-xl flex items-center justify-center">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Total Pendapatan</div>
            <div className="font-bold text-sm text-on-surface mt-0.5">
              {isPaymentsLoading ? '...' : formatCurrency(totalLunas)}
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-outline-variant soft-shadow hover-lift flex items-center gap-4">
          <div className="w-12 h-12 bg-status-warning/10 text-status-warning rounded-xl flex items-center justify-center">
            <Clock size={24} />
          </div>
          <div>
            <div className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Piutang Pending</div>
            <div className="font-bold text-sm text-on-surface mt-0.5">
              {isPermohonanLoading ? '...' : formatCurrency(totalPending)}
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-outline-variant soft-shadow hover-lift flex items-center gap-4">
          <div className="w-12 h-12 bg-status-danger/10 text-status-danger rounded-xl flex items-center justify-center">
            <ShieldAlert size={24} />
          </div>
          <div>
            <div className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Terlambat Bayar</div>
            <div className="font-bold text-sm text-on-surface mt-0.5">
              {isPermohonanLoading ? '...' : formatCurrency(totalOverdue)}
            </div>
          </div>
        </div>
      </div>

      {/* Invoice list table */}
      <div className="bg-white rounded-xl border border-outline-variant overflow-hidden soft-shadow">
        <div className="p-4 border-b border-outline-variant bg-surface-container-low flex justify-between items-center">
          <h3 className="font-headline-md text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-2">
            <DollarSign size={14} className="text-primary" />
            Riwayat Pembayaran
          </h3>
          <span className="text-[10px] text-on-surface-variant font-medium">{payments.length} transaksi</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container border-b border-outline-variant text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                <th className="p-4">ID Pembayaran</th>
                <th className="p-4">Metode Bayar</th>
                <th className="p-4">Total Biaya</th>
                <th className="p-4">Tanggal</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant text-xs text-on-surface">
              {isPaymentsLoading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="p-4"><div className="h-3 bg-gray-200 rounded w-24" /></td>
                    <td className="p-4"><div className="h-3 bg-gray-200 rounded w-20" /></td>
                    <td className="p-4"><div className="h-3 bg-gray-200 rounded w-24" /></td>
                    <td className="p-4"><div className="h-3 bg-gray-200 rounded w-20" /></td>
                    <td className="p-4"><div className="h-3 bg-gray-200 rounded w-16" /></td>
                    <td className="p-4"><div className="h-3 bg-gray-200 rounded w-16 mx-auto" /></td>
                  </tr>
                ))
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-on-surface-variant font-semibold">
                    Belum ada data pembayaran. Klik "Catat Pembayaran Baru" untuk menambahkan.
                  </td>
                </tr>
              ) : (
                payments.map((inv) => {
                  const statusInfo = STATUS_MAP[inv.status] || { label: inv.status, style: 'bg-gray-200 text-gray-700' };
                  return (
                    <tr key={inv.id} className="hover:bg-surface-container-low transition-all">
                      <td className="p-4 font-bold text-primary font-mono text-[10px]">{inv.id.substring(0, 12)}...</td>
                      <td className="p-4 font-semibold capitalize">{inv.metode_pembayaran?.replace('_', ' ')}</td>
                      <td className="p-4 font-bold">{formatCurrency(inv.jumlah)}</td>
                      <td className="p-4 text-on-surface-variant">{dayjs(inv.created_at).format('DD MMM YYYY')}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${statusInfo.style}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="text-[10px] text-on-surface-variant font-medium">
                          {inv.tanggal_bayar ? dayjs(inv.tanggal_bayar).format('HH:mm') : '-'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl soft-shadow border border-outline-variant w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b border-outline-variant">
              <h3 className="font-headline-md text-sm font-bold text-on-surface">Catat Pembayaran Baru</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-surface-container rounded-lg cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="block font-label-sm text-[11px] font-bold text-on-surface-variant uppercase">ID Permohonan *</label>
                <input
                  type="text"
                  required
                  value={form.permohonan_id}
                  onChange={(e) => setForm({ ...form, permohonan_id: e.target.value })}
                  placeholder="UUID permohonan pengujian..."
                  className="w-full px-3 py-2.5 rounded-lg border border-outline-variant bg-surface-container-low text-xs outline-none focus:border-primary transition-all"
                />
                <p className="text-[10px] text-on-surface-variant">Salin dari halaman Permohonan (kolom No. Permohonan)</p>
              </div>

              <div className="space-y-1.5">
                <label className="block font-label-sm text-[11px] font-bold text-on-surface-variant uppercase">Jumlah Pembayaran *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-xs font-bold">Rp</span>
                  <input
                    type="number"
                    required
                    min={1}
                    value={form.jumlah || ''}
                    onChange={(e) => setForm({ ...form, jumlah: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-outline-variant bg-surface-container-low text-xs outline-none focus:border-primary transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block font-label-sm text-[11px] font-bold text-on-surface-variant uppercase">Metode Pembayaran *</label>
                <select
                  value={form.metode_pembayaran}
                  onChange={(e) => setForm({ ...form, metode_pembayaran: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-outline-variant bg-surface-container-low text-xs outline-none focus:border-primary transition-all"
                >
                  <option value="transfer">Transfer Bank</option>
                  <option value="cash">Tunai (Cash)</option>
                  <option value="qris">QRIS</option>
                </select>
              </div>

              <div className="bg-status-info/5 border border-status-info/20 rounded-lg p-3 text-[10px] text-status-info font-medium">
                ⚡ Pembayaran yang dicatat akan otomatis mengubah status permohonan menjadi <strong>Lunas</strong> dan membuka penjadwalan sampling.
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 border border-outline-variant text-on-surface rounded-lg font-semibold text-xs hover:bg-surface-container transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex-1 py-2.5 bg-primary text-on-primary rounded-lg font-bold text-xs hover:bg-primary-container transition-all cursor-pointer soft-shadow disabled:opacity-80"
                >
                  {createMutation.isPending ? 'Menyimpan...' : 'Catat Pembayaran'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pembayaran;
