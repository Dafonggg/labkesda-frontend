import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusCircle,
  CalendarDays,
  ClipboardCheck,
  Award,
  FileSpreadsheet,
  Users,
} from 'lucide-react';
import type { DashboardSummary } from '@/services/dashboard.service';

interface QuickActionProps {
  label: string;
  subText: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  onClick: () => void;
  badge?: number;
  badgeType?: 'primary' | 'warning' | 'danger';
  gradient: string;
}

const QuickActionItem: React.FC<QuickActionProps> = ({
  label,
  subText,
  icon: Icon,
  onClick,
  badge,
  badgeType = 'primary',
  gradient,
}) => {
  const badgeColors = {
    primary: 'bg-primary text-white',
    warning: 'bg-status-warning text-white',
    danger: 'bg-status-danger text-white animate-pulse',
  };

  return (
    <button
      onClick={onClick}
      className="relative flex flex-col items-center justify-center p-4 rounded-xl bg-surface-container-low hover:bg-primary/10 border border-transparent hover:border-primary/20 transition-all duration-300 text-primary cursor-pointer group soft-shadow hover:scale-[1.03] active:scale-[0.97]"
    >
      {/* Badge */}
      {badge !== undefined && badge > 0 && (
        <span className={`absolute -top-1.5 -right-1.5 min-w-[20px] h-5 flex items-center justify-center text-[9px] font-bold rounded-full px-1.5 ring-2 ring-surface ${badgeColors[badgeType]}`}>
          {badge > 99 ? '99+' : badge}
        </span>
      )}

      <div className={`w-11 h-11 rounded-xl ${gradient} flex items-center justify-center mb-2.5 transition-transform group-hover:scale-110 group-hover:rotate-3 duration-300`}>
        <Icon size={20} className="text-white drop-shadow-sm" />
      </div>
      <span className="font-label-md text-[11px] font-bold text-on-surface group-hover:text-primary transition-colors leading-tight text-center">
        {label}
      </span>
      <span className="text-[9px] text-on-surface-variant/70 mt-0.5 font-semibold">
        {subText}
      </span>
    </button>
  );
};

interface QuickActionsProps {
  summary?: DashboardSummary;
}

const QuickActions: React.FC<QuickActionsProps> = ({ summary }) => {
  const navigate = useNavigate();

  const actions: QuickActionProps[] = [
    {
      label: 'Permohonan Baru',
      subText: 'Buat Pengajuan',
      icon: PlusCircle,
      onClick: () => navigate('/permohonan'),
      badge: summary?.permohonan_pending,
      badgeType: 'warning',
      gradient: 'bg-gradient-to-br from-primary to-primary-container',
    },
    {
      label: 'Jadwal Sampling',
      subText: 'Kelola Jadwal',
      icon: CalendarDays,
      onClick: () => navigate('/jadwal'),
      badge: summary?.pending_sampling,
      badgeType: 'primary',
      gradient: 'bg-gradient-to-br from-status-info to-blue-400',
    },
    {
      label: 'Registrasi Sampel',
      subText: 'Pindai & Catat',
      icon: ClipboardCheck,
      onClick: () => navigate('/registrasi'),
      gradient: 'bg-gradient-to-br from-teal-500 to-emerald-400',
    },
    {
      label: 'Verifikasi QC',
      subText: 'Quality Control',
      icon: Award,
      onClick: () => navigate('/qc/verifikasi'),
      badge: summary?.pending_qc,
      badgeType: 'danger',
      gradient: 'bg-gradient-to-br from-status-warning to-amber-400',
    },
    {
      label: 'Buat LHU',
      subText: 'Ekspor Hasil',
      icon: FileSpreadsheet,
      onClick: () => navigate('/arsip'),
      gradient: 'bg-gradient-to-br from-indigo-500 to-violet-400',
    },
    {
      label: 'Manajemen User',
      subText: 'Kelola Akun',
      icon: Users,
      onClick: () => navigate('/manajemen-user'),
      gradient: 'bg-gradient-to-br from-gray-600 to-gray-500',
    },
  ];

  return (
    <div className="bg-surface rounded-xl p-5 soft-shadow border border-outline-variant/30">
      <h3 className="font-headline-sm text-base font-bold text-on-surface mb-4">Aksi Cepat</h3>
      <div className="grid grid-cols-3 gap-3 animate-stagger">
        {actions.map((act, idx) => (
          <QuickActionItem key={idx} {...act} />
        ))}
      </div>
    </div>
  );
};

export default QuickActions;
