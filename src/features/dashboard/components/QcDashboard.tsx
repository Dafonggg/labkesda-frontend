import React from 'react';
import {
  ClipboardCheck,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  History,
  Sparkles,
  Activity,
  Award,
  Clock,
  ShieldCheck,
  ChevronRight,
  RefreshCw,
  User,
  Layers,
  Zap,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth';
import { useDashboardSummary } from '@/hooks/useDashboard';
import { usePendingQc } from '@/hooks/usePengujian';
import { useQcHistory } from '@/hooks/useQc';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import dayjs from 'dayjs';

/* ═══════════════════════════════════════════════════════════
   QC DASHBOARD — Dedicated dashboard for Quality Control role
   ═══════════════════════════════════════════════════════════ */

/* ─── Radial Gauge Component ─── */
const RadialGauge: React.FC<{ value: number; size?: number }> = ({ value, size = 140 }) => {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(value, 100);
  const dashOffset = circumference - (progress / 100) * circumference;

  const getColor = () => {
    if (progress >= 90) return { stroke: '#16a34a', bg: 'rgba(22, 163, 74, 0.08)', text: 'text-status-success' };
    if (progress >= 70) return { stroke: '#d97706', bg: 'rgba(217, 119, 6, 0.08)', text: 'text-status-warning' };
    return { stroke: '#dc2626', bg: 'rgba(220, 38, 38, 0.08)', text: 'text-status-danger' };
  };

  const colors = getColor();

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-100"
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colors.stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)' }}
        />
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`font-headline-lg text-2xl font-black ${colors.text}`}>
          {progress.toFixed(0)}%
        </span>
        <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider mt-0.5">
          Pass Rate
        </span>
      </div>
    </div>
  );
};

/* ─── Stacked Bar Chart for Weekly Activity ─── */
const WeeklyActivityChart: React.FC<{
  data: Array<{ day: string; approved: number; rejected: number }>;
}> = ({ data }) => {
  const maxVal = Math.max(...data.map(d => d.approved + d.rejected), 1);

  return (
    <div className="flex items-end gap-2 h-32 px-1">
      {data.map((d, i) => {
        const total = d.approved + d.rejected;
        const approvedHeight = total > 0 ? (d.approved / maxVal) * 100 : 0;
        const rejectedHeight = total > 0 ? (d.rejected / maxVal) * 100 : 0;
        const isToday = i === data.length - 1;

        return (
          <div key={d.day} className="flex-1 flex flex-col items-center gap-1.5">
            {/* Count label */}
            <span className="text-[9px] font-bold text-on-surface-variant">
              {total > 0 ? total : ''}
            </span>
            {/* Stacked bar */}
            <div className="w-full flex flex-col items-center justify-end" style={{ height: '80px' }}>
              <div className="w-full max-w-[28px] flex flex-col justify-end rounded-t-md overflow-hidden">
                {rejectedHeight > 0 && (
                  <div
                    className="bg-status-danger/80 transition-all duration-500 ease-out"
                    style={{ height: `${rejectedHeight}%`, minHeight: rejectedHeight > 0 ? '3px' : 0 }}
                  />
                )}
                {approvedHeight > 0 && (
                  <div
                    className={`transition-all duration-500 ease-out ${isToday ? 'bg-primary' : 'bg-primary/70'}`}
                    style={{ height: `${approvedHeight}%`, minHeight: approvedHeight > 0 ? '3px' : 0 }}
                  />
                )}
                {total === 0 && (
                  <div className="bg-gray-100 rounded-t-md" style={{ height: '4px' }} />
                )}
              </div>
            </div>
            {/* Day label */}
            <span className={`text-[9px] font-bold tracking-wider ${isToday ? 'text-primary' : 'text-on-surface-variant'}`}>
              {d.day}
            </span>
          </div>
        );
      })}
    </div>
  );
};

/* ─── Main QcDashboard Component ─── */
const QcDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: summaryResponse, isLoading: summaryLoading, dataUpdatedAt } = useDashboardSummary();
  const { data: pendingResponse, isLoading: pendingLoading } = usePendingQc();
  const { data: historyResponse, isLoading: historyLoading } = useQcHistory({ per_page: 5 });

  const summary = summaryResponse?.data;
  const pendingItems = pendingResponse?.data || [];
  const historyItems = historyResponse?.data || [];

  // Helper: check if value exceeds baku mutu
  const isExceedingBakuMutu = (item: any) => {
    if (!item.nilai_hasil) return false;
    const value = parseFloat(item.nilai_hasil);
    if (isNaN(value)) return false;
    const min = item.parameter_uji?.baku_mutu_min !== null && item.parameter_uji?.baku_mutu_min !== undefined
      ? parseFloat(item.parameter_uji.baku_mutu_min)
      : null;
    const max = item.parameter_uji?.baku_mutu_max !== null && item.parameter_uji?.baku_mutu_max !== undefined
      ? parseFloat(item.parameter_uji.baku_mutu_max)
      : null;
    if (min !== null && value < min) return true;
    if (max !== null && value > max) return true;
    return false;
  };

  // Parse QC status from catatan for history items
  const parseQcStatusLabel = (status: string, catatan: string | null) => {
    const notes = catatan || '';
    if (notes.startsWith('[PASS]')) return { label: 'Pass', cls: 'bg-status-success/10 text-status-success border-status-success/15' };
    if (notes.startsWith('[FAIL]')) return { label: 'Fail', cls: 'bg-status-danger/10 text-status-danger border-status-danger/15' };
    if (notes.startsWith('[RE-TEST]')) return { label: 'Re-test', cls: 'bg-status-warning/10 text-status-warning border-status-warning/15' };
    if (notes.startsWith('[REJECT SAMPLE]')) return { label: 'Reject', cls: 'bg-red-950/10 text-red-900 border-red-950/15' };
    if (status === 'approved') return { label: 'Pass', cls: 'bg-status-success/10 text-status-success border-status-success/15' };
    return { label: 'Ditolak', cls: 'bg-status-danger/10 text-status-danger border-status-danger/15' };
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['pending-qc'] });
    queryClient.invalidateQueries({ queryKey: ['qc-history'] });
    toast.success('Data dashboard QC berhasil di-refresh.');
  };

  // Greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Selamat Pagi';
    if (hour < 15) return 'Selamat Siang';
    if (hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  // Take top 5 pending items for preview
  const previewPending = pendingItems.slice(0, 5);

  // Weekly activity data (fallback to empty)
  const weeklyActivity = summary?.qc_weekly_activity || Array.from({ length: 7 }, (_, i) => ({
    day: dayjs().subtract(6 - i, 'day').format('ddd'),
    approved: 0,
    rejected: 0,
  }));

  return (
    <div className="space-y-6">
      {/* ═══ 1. Hero Banner ═══ */}
      <div className="bg-gradient-to-r from-primary/90 to-primary-container p-6 rounded-2xl border border-primary/20 soft-shadow text-on-primary relative overflow-hidden group">
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 opacity-10 group-hover:scale-110 transition-transform duration-350">
          <ShieldCheck size={200} />
        </div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1 bg-white/15 text-white font-label-md text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-white/10 shadow-sm">
                <Sparkles size={10} />
                ISO 17025
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">
                Quality Control
              </span>
            </div>
            <h1 className="font-headline-lg text-lg md:text-xl font-extrabold text-white mt-2 tracking-tight">
              {getGreeting()}, {user?.name?.split(' ')[0]} 👋
            </h1>
            <p className="font-body-md text-xs text-white/80 mt-1 font-medium max-w-xl leading-relaxed">
              Pusat kendali mutu laboratorium. Pantau antrean verifikasi, performa QC, dan parameter kritis secara real-time.
            </p>

            {/* Live pending badge */}
            <div className="flex items-center gap-3 mt-3 flex-wrap">
              <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-bold border border-white/10">
                <Activity size={12} className="text-emerald-300 animate-pulse" />
                {summaryLoading ? '...' : (summary?.qc_pending_count ?? 0)} Parameter Menunggu Review
              </div>
              {dataUpdatedAt && (
                <span className="text-[10px] text-white/60 font-medium">
                  Diperbarui {new Date(dataUpdatedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleRefresh}
              className="p-2.5 rounded-lg border border-white/20 bg-white/10 text-white hover:bg-white/20 transition-all cursor-pointer hover:scale-105 active:scale-95"
              title="Refresh Data"
            >
              <RefreshCw size={15} />
            </button>
            <button
              onClick={() => navigate('/qc/history')}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-white/10 border border-white/20 text-white px-4 py-2.5 rounded-lg hover:bg-white/20 transition-all font-label-md text-xs font-semibold cursor-pointer backdrop-blur-sm"
            >
              <History size={14} />
              Riwayat
            </button>
            <button
              onClick={() => navigate('/qc/verifikasi')}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-white text-primary px-5 py-2.5 rounded-lg hover:bg-white/90 transition-all font-label-md text-xs font-bold cursor-pointer soft-shadow hover:scale-[1.02] active:scale-[0.98]"
            >
              <ClipboardCheck size={14} />
              Mulai Verifikasi
            </button>
          </div>
        </div>
      </div>

      {/* ═══ 2. KPI Cards Row ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {/* KPI 1: Antrean Verifikasi */}
        <div
          onClick={() => navigate('/qc/verifikasi')}
          className={`bg-white rounded-xl p-5 soft-shadow border flex flex-col justify-between hover-lift cursor-pointer group transition-all duration-300 ${
            (summary?.qc_pending_count ?? 0) > 0
              ? 'border-l-4 border-l-status-warning border-outline-variant/30'
              : 'border-outline-variant/30'
          }`}
        >
          <div className="flex justify-between items-start mb-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300 ${
              (summary?.qc_pending_count ?? 0) > 0 ? 'bg-status-warning/10' : 'bg-status-success/10'
            }`}>
              <ClipboardCheck className={(summary?.qc_pending_count ?? 0) > 0 ? 'text-status-warning' : 'text-status-success'} size={20} />
            </div>
          </div>
          <div>
            <p className="font-body-sm text-[11px] text-on-surface-variant mb-1 font-medium tracking-wide uppercase">
              Antrean Verifikasi
            </p>
            <div className="flex items-end justify-between gap-2">
              <h3 className="font-headline-lg text-2xl font-black text-on-surface leading-none">
                {summaryLoading ? '...' : (summary?.qc_pending_count ?? 0)}
              </h3>
              <span className={`inline-flex items-center gap-0.5 font-label-sm text-[10px] px-2 py-0.5 rounded-full font-bold ${
                (summary?.qc_pending_count ?? 0) > 0
                  ? 'text-status-warning bg-status-warning/10'
                  : 'text-status-success bg-status-success/10'
              }`}>
                {(summary?.qc_pending_count ?? 0) > 0 ? 'Menunggu' : 'Aman'}
              </span>
            </div>
          </div>
        </div>

        {/* KPI 2: Diverifikasi Hari Ini */}
        <div className="bg-white rounded-xl p-5 soft-shadow border border-outline-variant/30 flex flex-col justify-between hover-lift cursor-pointer group transition-all duration-300">
          <div className="flex justify-between items-start mb-3">
            <div className="w-10 h-10 rounded-xl bg-status-success/10 flex items-center justify-center transition-transform group-hover:scale-110 duration-300">
              <CheckCircle2 className="text-status-success" size={20} />
            </div>
          </div>
          <div>
            <p className="font-body-sm text-[11px] text-on-surface-variant mb-1 font-medium tracking-wide uppercase">
              Diverifikasi Hari Ini
            </p>
            <div className="flex items-end justify-between gap-2">
              <h3 className="font-headline-lg text-2xl font-black text-on-surface leading-none">
                {summaryLoading ? '...' : ((summary?.qc_approved_today ?? 0) + (summary?.qc_rejected_today ?? 0))}
              </h3>
              <span className="inline-flex items-center gap-0.5 font-label-sm text-[10px] px-2 py-0.5 rounded-full font-bold text-status-success bg-status-success/10">
                <CheckCircle2 size={10} />
                {summaryLoading ? '...' : (summary?.qc_approved_today ?? 0)} Pass
              </span>
            </div>
          </div>
        </div>

        {/* KPI 3: Pass Rate Bulan Ini */}
        <div className="bg-white rounded-xl p-5 soft-shadow border border-outline-variant/30 flex flex-col justify-between hover-lift cursor-pointer group transition-all duration-300">
          <div className="flex justify-between items-start mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center transition-transform group-hover:scale-110 duration-300">
              <TrendingUp className="text-primary" size={20} />
            </div>
          </div>
          <div>
            <p className="font-body-sm text-[11px] text-on-surface-variant mb-1 font-medium tracking-wide uppercase">
              Pass Rate Bulan Ini
            </p>
            <div className="flex items-end justify-between gap-2">
              <h3 className="font-headline-lg text-2xl font-black text-on-surface leading-none">
                {summaryLoading ? '...' : `${(summary?.qc_pass_rate ?? 100).toFixed(0)}%`}
              </h3>
              <span className={`inline-flex items-center gap-0.5 font-label-sm text-[10px] px-2 py-0.5 rounded-full font-bold ${
                (summary?.qc_pass_rate ?? 100) >= 90
                  ? 'text-status-success bg-status-success/10'
                  : (summary?.qc_pass_rate ?? 100) >= 70
                    ? 'text-status-warning bg-status-warning/10'
                    : 'text-status-danger bg-status-danger/10'
              }`}>
                <TrendingUp size={10} />
                {(summary?.qc_monthly_approved ?? 0) + (summary?.qc_monthly_rejected ?? 0)} total
              </span>
            </div>
          </div>
        </div>

        {/* KPI 4: Parameter Kritis */}
        <div
          onClick={() => navigate('/qc/verifikasi')}
          className={`bg-white rounded-xl p-5 soft-shadow border flex flex-col justify-between hover-lift cursor-pointer group transition-all duration-300 ${
            (summary?.qc_deviation_count ?? 0) > 0
              ? 'border-l-4 border-l-status-danger border-outline-variant/30 animate-pulse-glow'
              : 'border-outline-variant/30'
          }`}
        >
          <div className="flex justify-between items-start mb-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300 ${
              (summary?.qc_deviation_count ?? 0) > 0 ? 'bg-status-danger/10' : 'bg-status-success/10'
            }`}>
              <AlertTriangle className={(summary?.qc_deviation_count ?? 0) > 0 ? 'text-status-danger' : 'text-status-success'} size={20} />
            </div>
          </div>
          <div>
            <p className="font-body-sm text-[11px] text-on-surface-variant mb-1 font-medium tracking-wide uppercase">
              Parameter Kritis
            </p>
            <div className="flex items-end justify-between gap-2">
              <h3 className="font-headline-lg text-2xl font-black text-on-surface leading-none">
                {summaryLoading ? '...' : (summary?.qc_deviation_count ?? 0)}
              </h3>
              <span className={`inline-flex items-center gap-0.5 font-label-sm text-[10px] px-2 py-0.5 rounded-full font-bold ${
                (summary?.qc_deviation_count ?? 0) > 0
                  ? 'text-status-danger bg-status-danger/10'
                  : 'text-status-success bg-status-success/10'
              }`}>
                <AlertTriangle size={10} />
                {(summary?.qc_deviation_count ?? 0) > 0 ? 'Perlu Aksi' : 'Aman'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ 3. Main Content Bento Grid ═══ */}
      <div className="grid grid-cols-12 gap-5">

        {/* ─── Left: Weekly Activity Chart ─── */}
        <div className="col-span-12 lg:col-span-8 bg-white rounded-2xl border border-outline-variant soft-shadow overflow-hidden">
          <div className="p-5 border-b border-outline-variant bg-surface-container-low/50 flex justify-between items-center">
            <div>
              <h3 className="font-headline-md text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-2">
                <Activity size={15} className="text-primary" />
                Aktivitas Verifikasi QC — 7 Hari Terakhir
              </h3>
              <p className="text-[10px] text-on-surface-variant mt-0.5 font-medium">
                Stacked chart: <span className="text-primary font-bold">■ Approved</span> vs <span className="text-status-danger font-bold">■ Rejected</span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-on-surface-variant">
                <Zap size={12} className="text-primary" />
                Total: {summaryLoading ? '...' : (summary?.qc_total_verified ?? 0)} verifikasi
              </div>
            </div>
          </div>
          <div className="p-5">
            {summaryLoading ? (
              <div className="h-32 flex items-center justify-center text-on-surface-variant text-xs animate-pulse">
                Memuat chart...
              </div>
            ) : (
              <WeeklyActivityChart data={weeklyActivity} />
            )}
            {/* Summary row below chart */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-outline-variant/50">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm bg-primary" />
                  <span className="text-[10px] font-bold text-on-surface-variant">
                    Approved: {weeklyActivity.reduce((sum, d) => sum + d.approved, 0)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm bg-status-danger/80" />
                  <span className="text-[10px] font-bold text-on-surface-variant">
                    Rejected: {weeklyActivity.reduce((sum, d) => sum + d.rejected, 0)}
                  </span>
                </div>
              </div>
              <span className="text-[9px] text-on-surface-variant/60 font-medium">
                Data per {dayjs().format('DD MMM YYYY')}
              </span>
            </div>
          </div>
        </div>

        {/* ─── Right: Performance Gauge + Turnaround ─── */}
        <div className="col-span-12 lg:col-span-4 bg-white rounded-2xl border border-outline-variant soft-shadow overflow-hidden flex flex-col">
          <div className="p-5 border-b border-outline-variant bg-surface-container-low/50">
            <h3 className="font-headline-md text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-2">
              <Award size={15} className="text-primary" />
              Performa QC Bulan Ini
            </h3>
          </div>
          <div className="p-5 flex-1 flex flex-col items-center justify-center gap-4">
            {summaryLoading ? (
              <div className="w-[140px] h-[140px] rounded-full bg-gray-100 animate-pulse" />
            ) : (
              <RadialGauge value={summary?.qc_pass_rate ?? 100} />
            )}

            <div className="w-full grid grid-cols-2 gap-3 mt-2">
              <div className="bg-status-success/5 border border-status-success/10 rounded-xl p-3 text-center">
                <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider block">Approved</span>
                <span className="font-headline-lg text-lg font-black text-status-success block mt-0.5">
                  {summaryLoading ? '...' : (summary?.qc_monthly_approved ?? 0)}
                </span>
              </div>
              <div className="bg-status-danger/5 border border-status-danger/10 rounded-xl p-3 text-center">
                <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider block">Rejected</span>
                <span className="font-headline-lg text-lg font-black text-status-danger block mt-0.5">
                  {summaryLoading ? '...' : (summary?.qc_monthly_rejected ?? 0)}
                </span>
              </div>
            </div>

            {/* Avg turnaround */}
            <div className="w-full bg-surface-container-low rounded-xl p-3.5 border border-outline-variant/50 flex items-center gap-3 mt-1">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Clock size={16} />
              </div>
              <div>
                <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider block">
                  Rata-rata Turnaround
                </span>
                <span className="font-headline-md text-sm font-extrabold text-on-surface">
                  {summaryLoading ? '...' : (summary?.qc_avg_turnaround_hours ?? 0)} jam
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Bottom Left: Pending Queue Preview ─── */}
        <div className="col-span-12 lg:col-span-7 bg-white rounded-2xl border border-outline-variant soft-shadow overflow-hidden">
          <div className="p-4 border-b border-outline-variant bg-surface-container-low/50 flex justify-between items-center">
            <h3 className="font-headline-md text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-2">
              <Layers size={15} className="text-status-warning" />
              Antrean Menunggu QC
            </h3>
            <button
              onClick={() => navigate('/qc/verifikasi')}
              className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
            >
              Lihat Semua
              <ChevronRight size={12} />
            </button>
          </div>

          {pendingLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse flex items-center gap-3">
                  <div className="w-full h-10 bg-gray-100 rounded-lg" />
                </div>
              ))}
            </div>
          ) : previewPending.length === 0 ? (
            <div className="p-8 text-center text-on-surface-variant">
              <div className="p-3 bg-emerald-50 text-emerald-500 rounded-full border border-emerald-100 inline-flex mb-3">
                <CheckCircle2 size={24} />
              </div>
              <span className="block text-xs font-extrabold text-on-surface">Antrean Kosong</span>
              <span className="text-[10px] text-on-surface-variant/80 mt-0.5 block font-medium">
                Semua parameter telah terverifikasi! 🎉
              </span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-container border-b border-outline-variant text-[9px] font-extrabold text-on-surface-variant uppercase tracking-wider">
                    <th className="p-3">Parameter</th>
                    <th className="p-3">Kode Sampel</th>
                    <th className="p-3">Nilai Hasil</th>
                    <th className="p-3">Baku Mutu</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant text-xs font-semibold text-on-surface">
                  {previewPending.map((item: any) => {
                    const hasDeviation = isExceedingBakuMutu(item);
                    return (
                      <tr key={item.id} className="hover:bg-surface-container-low transition-all cursor-pointer" onClick={() => navigate('/qc/verifikasi')}>
                        <td className="p-3 font-extrabold text-primary">
                          {item.parameter_uji?.nama_parameter || 'Parameter Uji'}
                        </td>
                        <td className="p-3 font-mono text-[11px] text-on-surface-variant">
                          {item.sample?.kode_sample || item.sample_id?.substring(0, 12)}
                        </td>
                        <td className="p-3">
                          <span className={`font-extrabold ${hasDeviation ? 'text-status-danger bg-status-danger/5 px-2 py-0.5 rounded border border-status-danger/10' : 'text-on-surface'}`}>
                            {item.nilai_hasil}
                            <span className="text-[10px] font-medium ml-0.5 text-on-surface-variant">
                              {item.parameter_uji?.satuan || ''}
                            </span>
                          </span>
                        </td>
                        <td className="p-3 text-on-surface-variant font-bold text-[11px]">
                          {item.parameter_uji?.baku_mutu_min !== null || item.parameter_uji?.baku_mutu_max !== null ? (
                            <>
                              {item.parameter_uji?.baku_mutu_min !== null && `${item.parameter_uji?.baku_mutu_min}`}
                              {item.parameter_uji?.baku_mutu_min !== null && item.parameter_uji?.baku_mutu_max !== null && ' - '}
                              {item.parameter_uji?.baku_mutu_max !== null && `${item.parameter_uji?.baku_mutu_max}`}
                            </>
                          ) : (
                            'Tidak ada'
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {hasDeviation ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-status-danger/10 text-status-danger border border-status-danger/15">
                              <AlertTriangle size={10} />
                              Menyimpang
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-status-success/10 text-status-success border border-status-success/15">
                              <CheckCircle2 size={10} />
                              Normal
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ─── Bottom Right: Quick Actions + Recent History ─── */}
        <div className="col-span-12 lg:col-span-5 flex flex-col gap-5">
          {/* Quick Actions */}
          <div className="bg-white rounded-2xl border border-outline-variant soft-shadow overflow-hidden p-5 space-y-3">
            <h3 className="font-headline-md text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-2">
              <Zap size={15} className="text-primary" />
              Aksi Cepat
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate('/qc/verifikasi')}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-outline-variant hover:border-primary bg-surface-container-lowest hover:bg-primary/5 transition-all cursor-pointer group"
              >
                <div className="p-2.5 bg-primary/10 rounded-xl text-primary group-hover:scale-110 transition-transform">
                  <ClipboardCheck size={20} />
                </div>
                <span className="text-[10px] font-bold text-on-surface">Buka Verifikasi</span>
              </button>
              <button
                onClick={() => navigate('/qc/history')}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-outline-variant hover:border-secondary bg-surface-container-lowest hover:bg-secondary/5 transition-all cursor-pointer group"
              >
                <div className="p-2.5 bg-secondary/10 rounded-xl text-secondary group-hover:scale-110 transition-transform">
                  <History size={20} />
                </div>
                <span className="text-[10px] font-bold text-on-surface">Riwayat Lengkap</span>
              </button>
            </div>
          </div>

          {/* Recent History */}
          <div className="bg-white rounded-2xl border border-outline-variant soft-shadow overflow-hidden flex-1">
            <div className="p-4 border-b border-outline-variant bg-surface-container-low/50 flex justify-between items-center">
              <h3 className="font-headline-md text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-2">
                <History size={15} className="text-secondary" />
                Verifikasi Terakhir
              </h3>
              <button
                onClick={() => navigate('/qc/history')}
                className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
              >
                Semua <ChevronRight size={12} />
              </button>
            </div>

            {historyLoading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse h-14 bg-gray-50 rounded-xl" />
                ))}
              </div>
            ) : historyItems.length === 0 ? (
              <div className="p-6 text-center text-on-surface-variant text-xs font-medium">
                Belum ada riwayat verifikasi.
              </div>
            ) : (
              <div className="divide-y divide-outline-variant">
                {historyItems.slice(0, 5).map((item: any) => {
                  const statusInfo = parseQcStatusLabel(item.status, item.catatan);
                  return (
                    <div
                      key={item.id}
                      className="p-3.5 hover:bg-surface-container-low transition-all cursor-pointer flex items-center justify-between gap-3"
                      onClick={() => navigate('/qc/history')}
                    >
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold text-on-surface block truncate">
                          {item.hasil_uji?.parameter_uji?.nama_parameter || 'Parameter Uji'}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[9px] text-on-surface-variant font-medium flex items-center gap-0.5">
                            <User size={9} />
                            {item.qc_officer?.name || 'QC'}
                          </span>
                          <span className="text-[9px] text-on-surface-variant/60 font-medium">
                            {dayjs(item.diverifikasi_pada || item.created_at).format('DD/MM HH:mm')}
                          </span>
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[9px] uppercase border shrink-0 ${statusInfo.cls}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QcDashboard;
