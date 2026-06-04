import React, { useState } from 'react';
import { BarChart3, TrendingUp, Calendar } from 'lucide-react';
import type { DashboardSummary } from '@/services/dashboard.service';

interface DayData {
  day: string;
  value: number;
  heightPercent: number;
}

interface WeeklyThroughputProps {
  summary?: DashboardSummary;
  isLoading?: boolean;
}

const DAY_LABELS: Record<string, string> = {
  Mon: 'Sen', Tue: 'Sel', Wed: 'Rab', Thu: 'Kam', Fri: 'Jum', Sat: 'Sab', Sun: 'Min',
  W1: 'Mg 1', W2: 'Mg 2', W3: 'Mg 3', W4: 'Mg 4',
};

const WeeklyThroughput: React.FC<WeeklyThroughputProps> = ({ summary, isLoading }) => {
  const [filter, setFilter] = useState<'7days' | 'month'>('7days');
  const [activeDayIdx, setActiveDayIdx] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="bg-surface rounded-xl p-6 soft-shadow border border-outline-variant/30 animate-pulse">
        <div className="h-5 w-40 bg-gray-200 rounded mb-6" />
        <div className="flex gap-4 mb-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 flex-1 bg-gray-100 rounded-lg" />
          ))}
        </div>
        <div className="flex items-end gap-3 h-40">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="flex-1 bg-gray-100 rounded-t-md" style={{ height: `${30 + Math.random() * 60}%` }} />
          ))}
        </div>
      </div>
    );
  }

  const rawWeeklyData = summary?.weekly_throughput || [];
  const maxWeeklyValue = rawWeeklyData.length > 0 ? Math.max(...rawWeeklyData.map(d => d.value)) : 0;

  const weeklyData: DayData[] = rawWeeklyData.length > 0
    ? rawWeeklyData.map(d => ({
        day: d.day,
        value: d.value,
        heightPercent: maxWeeklyValue > 0 ? Math.max(8, Math.round((d.value / maxWeeklyValue) * 100)) : 8,
      }))
    : [
        { day: 'Mon', value: 45, heightPercent: 40 },
        { day: 'Tue', value: 72, heightPercent: 65 },
        { day: 'Wed', value: 105, heightPercent: 90 },
        { day: 'Thu', value: 55, heightPercent: 50 },
        { day: 'Fri', value: 88, heightPercent: 75 },
        { day: 'Sat', value: 22, heightPercent: 20 },
        { day: 'Sun', value: 12, heightPercent: 10 },
      ];

  const monthlyData: DayData[] = [
    { day: 'W1', value: 340, heightPercent: 70 },
    { day: 'W2', value: 410, heightPercent: 85 },
    { day: 'W3', value: 480, heightPercent: 95 },
    { day: 'W4', value: 280, heightPercent: 60 },
  ];

  const currentData = filter === '7days' ? weeklyData : monthlyData;

  // Summary stats
  const totalWeek = currentData.reduce((sum, d) => sum + d.value, 0);
  const avgDaily = currentData.length > 0 ? Math.round(totalWeek / currentData.length) : 0;
  const busiestDay = currentData.reduce((max, d) => d.value > max.value ? d : max, currentData[0]);
  const busiestLabel = DAY_LABELS[busiestDay?.day] || busiestDay?.day || '-';

  // Gradient colors for bars
  const getBarGradient = (_idx: number, isHighest: boolean, isHovered: boolean) => {
    if (isHighest) {
      return isHovered
        ? 'bg-gradient-to-t from-primary via-primary-container to-primary-container'
        : 'bg-gradient-to-t from-primary to-primary-container';
    }
    return isHovered
      ? 'bg-gradient-to-t from-primary/70 to-primary/40'
      : 'bg-gradient-to-t from-primary/50 to-primary/25';
  };

  return (
    <div className="bg-surface rounded-xl p-6 soft-shadow border border-outline-variant/30 flex flex-col flex-1 h-full">
      {/* Header */}
      <div className="flex justify-between items-start mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <BarChart3 className="text-primary" size={18} />
          </div>
          <div>
            <h3 className="font-headline-sm text-base font-bold text-on-surface">Throughput Mingguan</h3>
            <p className="font-body-sm text-[10px] text-on-surface-variant mt-0.5">Pengujian laboratorium selesai</p>
          </div>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as '7days' | 'month')}
          className="bg-surface-container-low border border-outline-variant/30 rounded-lg text-[11px] font-semibold text-on-surface-variant py-1.5 pl-3 pr-7 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all cursor-pointer"
        >
          <option value="7days">7 Hari Terakhir</option>
          <option value="month">Bulan Ini</option>
        </select>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-surface-container-low/60 rounded-xl p-3 text-center transition-all hover:bg-surface-container-low">
          <p className="text-[9px] text-on-surface-variant font-bold uppercase tracking-wider mb-1">Total</p>
          <p className="font-headline-sm text-lg font-black text-on-surface">{totalWeek}</p>
        </div>
        <div className="bg-surface-container-low/60 rounded-xl p-3 text-center transition-all hover:bg-surface-container-low">
          <p className="text-[9px] text-on-surface-variant font-bold uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
            <TrendingUp size={9} /> Rata-rata
          </p>
          <p className="font-headline-sm text-lg font-black text-primary">{avgDaily}</p>
        </div>
        <div className="bg-surface-container-low/60 rounded-xl p-3 text-center transition-all hover:bg-surface-container-low">
          <p className="text-[9px] text-on-surface-variant font-bold uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
            <Calendar size={9} /> Tersibuk
          </p>
          <p className="font-headline-sm text-lg font-black text-status-warning">{busiestLabel}</p>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="flex-1 flex items-end justify-between gap-3 border-b border-outline-variant/20 pb-4 h-44 relative animate-stagger">
        {currentData.map((data, idx) => {
          const isHighest = data.value === Math.max(...currentData.map(d => d.value));
          const isHovered = activeDayIdx === idx;
          const dayLabel = DAY_LABELS[data.day] || data.day;

          return (
            <div
              key={idx}
              className="w-full flex flex-col items-center gap-2 group relative cursor-pointer animate-fade-in-up"
              onMouseEnter={() => setActiveDayIdx(idx)}
              onMouseLeave={() => setActiveDayIdx(null)}
            >
              {/* Animated Bar */}
              <div
                className={`w-full max-w-[40px] rounded-t-lg relative transition-all duration-400 ease-out ${getBarGradient(idx, isHighest, isHovered)} ${
                  isHovered ? 'shadow-lg scale-x-110' : ''
                }`}
                style={{
                  height: `${data.heightPercent}%`,
                  minHeight: '6px',
                }}
              >
                {/* Floating Tooltip */}
                <div
                  className={`
                    absolute -top-11 left-1/2 -translate-x-1/2 bg-inverse-surface text-inverse-on-surface text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all duration-200 z-10 pointer-events-none soft-shadow whitespace-nowrap
                    ${isHovered ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 translate-y-2'}
                  `}
                >
                  {data.value} sampel
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-inverse-surface rotate-45" />
                </div>

                {/* Peak indicator */}
                {isHighest && (
                  <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-primary ring-2 ring-surface" />
                )}
              </div>

              {/* Day Label */}
              <span
                className={`font-body-sm text-[10px] transition-colors duration-200 font-semibold ${
                  isHighest ? 'text-primary font-bold' : isHovered ? 'text-on-surface' : 'text-on-surface-variant'
                }`}
              >
                {dayLabel}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WeeklyThroughput;
