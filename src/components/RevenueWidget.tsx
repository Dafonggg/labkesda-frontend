import React from 'react';
import { Banknote, TrendingUp, Receipt, AlertCircle } from 'lucide-react';
import type { DashboardSummary } from '@/services/dashboard.service';

interface RevenueWidgetProps {
  summary?: DashboardSummary;
  isLoading?: boolean;
}

const RevenueWidget: React.FC<RevenueWidgetProps> = ({ summary, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-surface rounded-xl p-6 soft-shadow border border-outline-variant/30 animate-pulse">
        <div className="h-5 w-40 bg-gray-200 rounded mb-6" />
        <div className="h-8 w-32 bg-gray-200 rounded mb-4" />
        <div className="h-4 w-full bg-gray-100 rounded-full mb-4" />
        <div className="flex gap-4">
          <div className="h-16 flex-1 bg-gray-100 rounded-lg" />
          <div className="h-16 flex-1 bg-gray-100 rounded-lg" />
        </div>
      </div>
    );
  }

  const revenueBulanIni = summary?.revenue_bulan_ini || 0;
  const revenueBulanLalu = summary?.revenue_bulan_lalu || 0;
  const paidInvoices = summary?.paid_invoices || 0;
  const unpaidInvoices = summary?.unpaid_invoices || 0;
  const totalInvoices = paidInvoices + unpaidInvoices;

  // Use last month as baseline for progress
  const target = revenueBulanLalu > 0 ? revenueBulanLalu : revenueBulanIni || 1;
  const progressPercent = Math.min(Math.round((revenueBulanIni / target) * 100), 150);

  const revenueTrend =
    revenueBulanLalu > 0
      ? (((revenueBulanIni - revenueBulanLalu) / revenueBulanLalu) * 100)
      : 0;

  const formatRupiah = (n: number) => {
    if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)} M`;
    if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)} jt`;
    if (n >= 1_000) return `Rp ${(n / 1_000).toFixed(0)} rb`;
    return `Rp ${n.toLocaleString('id-ID')}`;
  };

  return (
    <div className="bg-surface rounded-xl soft-shadow border border-outline-variant/30 overflow-hidden transition-all gradient-mesh">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Banknote className="text-primary" size={18} />
            </div>
            <div>
              <h3 className="font-headline-sm text-sm font-bold text-on-surface">Ringkasan Pendapatan</h3>
              <p className="text-[10px] text-on-surface-variant font-medium">Bulan berjalan</p>
            </div>
          </div>
          {revenueTrend !== 0 && (
            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
              revenueTrend >= 0 ? 'bg-status-success/10 text-status-success' : 'bg-status-danger/10 text-status-danger'
            }`}>
              <TrendingUp size={10} />
              {revenueTrend > 0 ? '+' : ''}{revenueTrend.toFixed(0)}%
            </span>
          )}
        </div>

        {/* Revenue Amount */}
        <div className="mb-4">
          <p className="font-headline-lg text-2xl md:text-3xl font-black text-on-surface">
            {formatRupiah(revenueBulanIni)}
          </p>
          <p className="text-[10px] text-on-surface-variant mt-1 font-medium">
            vs {formatRupiah(revenueBulanLalu)} bulan lalu
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[10px] text-on-surface-variant font-semibold">Progress vs bulan lalu</span>
            <span className="text-[10px] font-bold text-primary">{progressPercent}%</span>
          </div>
          <div className="h-2.5 bg-surface-container-low rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-primary-container animate-progress-fill transition-all"
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Invoice Stats */}
      <div className="grid grid-cols-2 border-t border-outline-variant/30">
        <div className="p-4 flex items-center gap-3 border-r border-outline-variant/30 hover:bg-surface-container-low/50 transition-colors cursor-pointer">
          <div className="w-8 h-8 rounded-lg bg-status-success/10 flex items-center justify-center shrink-0">
            <Receipt size={14} className="text-status-success" />
          </div>
          <div>
            <p className="text-[10px] text-on-surface-variant font-medium uppercase tracking-wider">Lunas</p>
            <p className="font-headline-sm text-lg font-black text-status-success leading-none mt-0.5">
              {paidInvoices}
            </p>
          </div>
        </div>
        <div className="p-4 flex items-center gap-3 hover:bg-surface-container-low/50 transition-colors cursor-pointer">
          <div className="w-8 h-8 rounded-lg bg-status-warning/10 flex items-center justify-center shrink-0">
            <AlertCircle size={14} className="text-status-warning" />
          </div>
          <div>
            <p className="text-[10px] text-on-surface-variant font-medium uppercase tracking-wider">Pending</p>
            <p className="font-headline-sm text-lg font-black text-status-warning leading-none mt-0.5">
              {unpaidInvoices}
            </p>
          </div>
        </div>
      </div>

      {/* Total Invoice Footer */}
      <div className="px-6 py-3 bg-surface-container-low/40 border-t border-outline-variant/20">
        <div className="flex justify-between items-center">
          <span className="text-[10px] text-on-surface-variant font-semibold">Total Invoice</span>
          <span className="text-xs font-bold text-on-surface">{totalInvoices}</span>
        </div>
      </div>
    </div>
  );
};

export default RevenueWidget;
