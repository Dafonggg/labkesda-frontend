import React, { useEffect, useState, useRef } from 'react';
import {
  FileText,
  Dna,
  FlaskConical,
  ClipboardCheck,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Banknote,
} from 'lucide-react';
import type { DashboardSummary } from '@/services/dashboard.service';

/* ─── Animated Counter Hook ─── */
const useAnimatedCounter = (target: number, duration = 1200) => {
  const [count, setCount] = useState(0);
  const prevTarget = useRef(0);

  useEffect(() => {
    if (target === prevTarget.current) return;
    prevTarget.current = target;

    const startTime = performance.now();
    const startValue = 0;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(startValue + (target - startValue) * eased));

      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [target, duration]);

  return count;
};

/* ─── Mini Sparkline ─── */
interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
  width?: number;
}

const MiniSparkline: React.FC<SparklineProps> = ({
  data,
  color = '#006a44',
  height = 28,
  width = 64,
}) => {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;

  const points = data
    .map((val, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(' ');

  const areaPoints = `0,${height} ${points} ${width},${height}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="shrink-0">
      <defs>
        <linearGradient id={`spark-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon
        points={areaPoints}
        fill={`url(#spark-${color.replace('#', '')})`}
      />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

/* ─── KPI Card ─── */
interface KPICardProps {
  title: string;
  value: number;
  formatValue?: (n: number) => string;
  trend?: number | null; // percentage change
  trendLabel?: string;
  trendType: 'success' | 'flat' | 'warning' | 'danger';
  icon: React.ComponentType<{ className?: string; size?: number }>;
  iconBg: string;
  iconColor: string;
  borderColor?: string;
  sparklineData?: number[];
  sparklineColor?: string;
}

const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  formatValue,
  trend,
  trendLabel,
  trendType,
  icon: Icon,
  iconBg,
  iconColor,
  borderColor,
  sparklineData,
  sparklineColor,
}) => {
  const animatedValue = useAnimatedCounter(value);

  const getTrendStyles = () => {
    switch (trendType) {
      case 'success':
        return 'text-status-success bg-status-success/10';
      case 'warning':
        return 'text-status-warning bg-status-warning/10';
      case 'danger':
        return 'text-status-danger bg-status-danger/10';
      default:
        return 'text-on-surface-variant bg-surface-variant/50';
    }
  };

  const getTrendIcon = () => {
    if (trend !== null && trend !== undefined) {
      if (trend > 0) return <ArrowUpRight size={12} />;
      if (trend < 0) return <ArrowDownRight size={12} />;
      return <ArrowRight size={12} />;
    }
    switch (trendType) {
      case 'success':
        return <ArrowUpRight size={12} />;
      case 'danger':
        return <AlertTriangle size={12} />;
      default:
        return <ArrowRight size={12} />;
    }
  };

  const displayValue = formatValue ? formatValue(animatedValue) : animatedValue.toLocaleString('id-ID');

  const trendText = trend !== null && trend !== undefined
    ? `${trend > 0 ? '+' : ''}${trend.toFixed(0)}%`
    : trendLabel || '';

  return (
    <div
      className={`bg-surface rounded-xl p-5 soft-shadow border border-outline-variant/30 flex flex-col justify-between hover-lift cursor-pointer group transition-all duration-300 ${
        borderColor ? `border-l-4 ${borderColor}` : ''
      } ${trendType === 'danger' ? 'animate-pulse-glow' : ''}`}
    >
      <div className="flex justify-between items-start mb-3">
        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center transition-transform group-hover:scale-110 duration-300`}>
          <Icon className={iconColor} size={20} />
        </div>
        {sparklineData && sparklineData.length > 1 && (
          <MiniSparkline data={sparklineData} color={sparklineColor || '#006a44'} />
        )}
      </div>

      <div className="mt-auto">
        <p className="font-body-sm text-[11px] text-on-surface-variant mb-1 font-medium tracking-wide uppercase">
          {title}
        </p>
        <div className="flex items-end justify-between gap-2">
          <h3 className="font-headline-lg text-xl md:text-2xl font-black text-on-surface leading-none">
            {displayValue}
          </h3>
          {trendText && (
            <span
              className={`inline-flex items-center gap-0.5 font-label-sm text-[10px] px-2 py-0.5 rounded-full font-bold ${getTrendStyles()}`}
            >
              {getTrendIcon()} {trendText}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── Skeleton Loader ─── */
const KPICardSkeleton: React.FC = () => (
  <div className="bg-surface rounded-xl p-5 soft-shadow border border-outline-variant/30 flex flex-col justify-between animate-pulse">
    <div className="flex justify-between items-start mb-4">
      <div className="w-10 h-10 rounded-xl bg-gray-200" />
      <div className="w-16 h-7 rounded bg-gray-100" />
    </div>
    <div>
      <div className="w-20 h-3 rounded bg-gray-200 mb-2" />
      <div className="w-24 h-7 rounded bg-gray-200" />
    </div>
  </div>
);

/* ─── KPI Cards Grid ─── */
interface KPICardsProps {
  summary?: DashboardSummary;
  isLoading?: boolean;
}

const KPICards: React.FC<KPICardsProps> = ({ summary, isLoading }) => {
  if (isLoading) {
    return (
      <div className="col-span-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
        {[...Array(6)].map((_, idx) => (
          <KPICardSkeleton key={idx} />
        ))}
      </div>
    );
  }

  // Calculate trends
  const permohonanTrend =
    summary?.permohonan_bulan_lalu && summary.permohonan_bulan_lalu > 0
      ? ((( summary.permohonan_bulan_ini || 0) - summary.permohonan_bulan_lalu) / summary.permohonan_bulan_lalu) * 100
      : null;

  const revenueTrend =
    summary?.revenue_bulan_lalu && summary.revenue_bulan_lalu > 0
      ? (((summary.revenue_bulan_ini || 0) - summary.revenue_bulan_lalu) / summary.revenue_bulan_lalu) * 100
      : null;

  // Mock sparkline data from weekly throughput
  const sparklineFromWeekly = summary?.weekly_throughput?.map(d => d.value) || [];

  const cards: KPICardProps[] = [
    {
      title: 'Total Permohonan',
      value: summary?.permohonan || 0,
      trend: permohonanTrend,
      trendType: permohonanTrend !== null && permohonanTrend > 0 ? 'success' : 'flat',
      icon: FileText,
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
      sparklineData: sparklineFromWeekly,
      sparklineColor: '#006a44',
    },
    {
      title: 'Pending Sampling',
      value: summary?.pending_sampling || 0,
      trendLabel: (summary?.pending_sampling || 0) > 0 ? 'Menunggu' : 'Aman',
      trendType: (summary?.pending_sampling || 0) > 0 ? 'warning' : 'success',
      icon: Dna,
      iconBg: 'bg-status-warning/10',
      iconColor: 'text-status-warning',
    },
    {
      title: 'Antrean Lab',
      value: summary?.lab_analysis_queue || 0,
      trendLabel: 'Proses',
      trendType: 'warning',
      icon: FlaskConical,
      iconBg: 'bg-status-info/10',
      iconColor: 'text-status-info',
    },
    {
      title: 'Menunggu QC',
      value: summary?.pending_qc || 0,
      trendLabel: summary?.pending_qc && summary.pending_qc > 0 ? 'Perlu Aksi' : 'Aman',
      trendType: summary?.pending_qc && summary.pending_qc > 0 ? 'danger' : 'success',
      icon: ClipboardCheck,
      iconBg:
        summary?.pending_qc && summary.pending_qc > 0
          ? 'bg-status-danger/10'
          : 'bg-status-success/10',
      iconColor:
        summary?.pending_qc && summary.pending_qc > 0
          ? 'text-status-danger'
          : 'text-status-success',
      borderColor:
        summary?.pending_qc && summary.pending_qc > 0
          ? 'border-l-status-danger'
          : undefined,
    },
    {
      title: 'Laporan Final',
      value: summary?.laporan_final || 0,
      trendLabel: `${summary?.laporan_final_bulan_ini || 0} bulan ini`,
      trendType: 'success',
      icon: CheckCircle2,
      iconBg: 'bg-status-success/10',
      iconColor: 'text-status-success',
    },
    {
      title: 'Total Pendapatan',
      value: summary?.total_payments || 0,
      formatValue: (n) => `Rp ${(n / 1_000_000).toFixed(1)}jt`,
      trend: revenueTrend,
      trendType: revenueTrend !== null && revenueTrend >= 0 ? 'success' : 'danger',
      icon: Banknote,
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
    },
  ];

  return (
    <div className="col-span-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 animate-stagger">
      {cards.map((card, idx) => (
        <KPICard key={idx} {...card} />
      ))}
    </div>
  );
};

export default KPICards;
