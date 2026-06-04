import { apiClient } from './axios';

export interface DashboardSummary {
  permohonan: number;
  permohonan_pending?: number;
  pending_sampling: number;
  lab_analysis_queue: number;
  pending_qc: number;
  draft_laporan?: number;
  laporan_final: number;
  laporan_final_bulan_ini?: number;
  total_payments: number;
  weekly_throughput?: Array<{ day: string; value: number }>;

  // Monthly trend metrics
  permohonan_bulan_ini?: number;
  permohonan_bulan_lalu?: number;
  revenue_bulan_ini?: number;
  revenue_bulan_lalu?: number;
  paid_invoices?: number;
  unpaid_invoices?: number;
  sla_compliance_rate?: number;

  // Analyst metrics
  analyst_ready_count?: number;
  analyst_draft_count?: number;
  analyst_pending_count?: number;
  analyst_approved_count?: number;

  // UPTD metrics
  uptd_pending_count?: number;
  uptd_final_count?: number;

  // QC Officer metrics
  qc_pending_count?: number;
  qc_approved_today?: number;
  qc_rejected_today?: number;
  qc_total_verified?: number;
  qc_pass_rate?: number;
  qc_deviation_count?: number;
  qc_weekly_activity?: Array<{ day: string; approved: number; rejected: number }>;
  qc_avg_turnaround_hours?: number;
  qc_monthly_approved?: number;
  qc_monthly_rejected?: number;
}

export const getDashboardSummary = async (): Promise<{ data: DashboardSummary }> => {
  const response = await apiClient.get('/dashboard/summary');
  return response.data;
};

