import React from 'react';
import KPICards from '../../../components/KPICards';
import WorkflowDistribution from '../../../components/WorkflowDistribution';
import WeeklyThroughput from '../../../components/WeeklyThroughput';
import QuickActions from '../../../components/QuickActions';
import UrgentAlerts from '../../../components/UrgentAlerts';
import RevenueWidget from '../../../components/RevenueWidget';
import ActivityTimeline from '../../../components/ActivityTimeline';
import { Download, Plus, Sparkles, ShieldCheck, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore, getRoleDisplayName } from '@/stores/auth';
import { useDashboardSummary } from '@/hooks/useDashboard';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import PetugasLabDashboard from '../components/PetugasLabDashboard';
import QcDashboard from '../components/QcDashboard';
import AnalisDashboard from '../components/AnalisDashboard';
import KepalaUptdDashboard from '../components/KepalaUptdDashboard';

const AdminDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: summaryResponse, isLoading, dataUpdatedAt } = useDashboardSummary();
  const summary = summaryResponse?.data;

  // Dynamically render PetugasLabDashboard page as the dashboard for petugas_lab role
  if (user?.role === 'petugas_lab') {
    return <PetugasLabDashboard />;
  }

  // Dynamically render QcDashboard for qc role (separate from QcVerifikasi page)
  if (user?.role === 'qc') {
    return <QcDashboard />;
  }

  // Dynamically render AnalisDashboard page as the dashboard for analis role
  if (user?.role === 'analis') {
    return <AnalisDashboard />;
  }

  // Dynamically render KepalaUptdDashboard page as the dashboard for kepala_uptd role
  if (user?.role === 'kepala_uptd') {
    return <KepalaUptdDashboard />;
  }

  const handleExportReport = () => {
    toast.success('Laporan Ringkasan Administrasi berhasil diekspor!');
  };

  const handleNewApplication = () => {
    navigate('/permohonan');
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    toast.success('Data dashboard berhasil di-refresh.');
  };

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Selamat Pagi';
    if (hour < 15) return 'Selamat Siang';
    if (hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  const slaRate = summary?.sla_compliance_rate ?? 100;

  return (
    <div className="space-y-6">
      {/* ═══ Hero Banner ═══ */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-primary/5 via-transparent to-primary-container/10 -mx-4 px-4 py-5 rounded-2xl border border-outline-variant/20">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-headline-lg text-lg md:text-xl font-extrabold text-on-surface tracking-tight leading-tight">
              {getGreeting()}, {user?.name?.split(' ')[0]} 👋
            </h1>
            <span className="flex items-center gap-1 bg-primary/10 text-primary font-label-md text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              <Sparkles size={9} />
              ISO 17025
            </span>
          </div>
          <p className="font-body-md text-xs text-on-surface-variant mt-1.5 font-medium max-w-lg leading-relaxed">
            Ringkasan operasional laboratorium Purwakarta.
            {user?.role && (
              <span className="text-primary font-semibold ml-1">
                {getRoleDisplayName(user.role)}
              </span>
            )}
          </p>

          {/* SLA Compliance Mini Badge */}
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold ${
              slaRate >= 90 ? 'bg-status-success/10 text-status-success' : slaRate >= 70 ? 'bg-status-warning/10 text-status-warning' : 'bg-status-danger/10 text-status-danger'
            }`}>
              <ShieldCheck size={12} />
              SLA Compliance: {slaRate}%
            </div>
            {dataUpdatedAt && (
              <span className="text-[10px] text-on-surface-variant/60 font-medium">
                Diperbarui {new Date(dataUpdatedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleRefresh}
            className="p-2.5 rounded-lg border border-outline-variant bg-white text-on-surface-variant hover:bg-surface-container hover:text-primary transition-all cursor-pointer soft-shadow hover:scale-105 active:scale-95"
            title="Refresh Data"
          >
            <RefreshCw size={15} />
          </button>
          <button
            onClick={handleExportReport}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-white border border-outline-variant text-on-surface px-4 py-2.5 rounded-lg hover:bg-surface-container transition-all font-label-md text-xs font-semibold cursor-pointer soft-shadow hover:scale-[1.02] active:scale-[0.98]"
          >
            <Download size={14} />
            Ekspor
          </button>
          <button
            onClick={handleNewApplication}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-primary text-on-primary px-5 py-2.5 rounded-lg hover-lift hover:bg-primary-container transition-all font-label-md text-xs font-semibold cursor-pointer soft-shadow"
          >
            <Plus size={14} />
            Permohonan Baru
          </button>
        </div>
      </div>

      {/* ═══ Bento Grid Layout ═══ */}
      <div className="bento-grid">

        {/* Row 1: KPI Cards (6 cards, 3 columns) */}
        <KPICards summary={summary} isLoading={isLoading} />

        {/* Row 2: Main Charts + Sidebar */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-5">
          {/* Workflow Distribution — Donut Chart */}
          <WorkflowDistribution summary={summary} isLoading={isLoading} />

          {/* Weekly Throughput — Enhanced Bar Chart */}
          <WeeklyThroughput summary={summary} isLoading={isLoading} />
        </div>

        {/* Sidebar: Quick Actions + Revenue */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-5">
          {/* Quick Actions Panel */}
          <QuickActions summary={summary} />

          {/* Revenue Widget */}
          <RevenueWidget summary={summary} isLoading={isLoading} />
        </div>

        {/* Row 3: Activity Timeline + Urgent Alerts */}
        <div className="col-span-12 lg:col-span-6">
          <ActivityTimeline />
        </div>

        <div className="col-span-12 lg:col-span-6">
          <UrgentAlerts />
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
