import React, { useState } from 'react';
import type { DashboardSummary } from '@/services/dashboard.service';

interface Stage {
  name: string;
  indonesianName: string;
  percentage: number;
  color: string;
  count: number;
}

interface WorkflowDistributionProps {
  summary?: DashboardSummary;
  isLoading?: boolean;
}

/* ─── Donut Segment ─── */
const RADIUS = 80;
const STROKE_WIDTH = 24;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const CENTER = 100;

const WorkflowDistribution: React.FC<WorkflowDistributionProps> = ({ summary, isLoading }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="bg-surface rounded-xl p-6 soft-shadow border border-outline-variant/30 animate-pulse">
        <div className="h-5 w-40 bg-gray-200 rounded mb-6" />
        <div className="flex items-center gap-8">
          <div className="w-[200px] h-[200px] rounded-full bg-gray-100 shrink-0" />
          <div className="flex-1 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-100 rounded w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const countPermohonan = summary ? (summary.permohonan_pending || 0) : 312;
  const countSampling = summary ? (summary.pending_sampling || 0) : 187;
  const countAnalisis = summary ? (summary.lab_analysis_queue || 0) : 499;
  const countQc = summary ? (summary.pending_qc || 0) : 125;
  const countFinal = summary ? (summary.laporan_final || 0) : 125;

  const totalActive = countPermohonan + countSampling + countAnalisis + countQc + countFinal;

  const getPercentage = (count: number) => {
    return totalActive > 0 ? Math.round((count / totalActive) * 100) : 20;
  };

  const COLORS = ['#006a44', '#0b8658', '#2563EB', '#F59E0B', '#16A34A'];

  const stages: Stage[] = [
    { name: 'Permohonan', indonesianName: 'Registrasi', percentage: getPercentage(countPermohonan), color: COLORS[0], count: countPermohonan },
    { name: 'Sampling', indonesianName: 'Lapangan', percentage: getPercentage(countSampling), color: COLORS[1], count: countSampling },
    { name: 'Analisis', indonesianName: 'Lab', percentage: getPercentage(countAnalisis), color: COLORS[2], count: countAnalisis },
    { name: 'Verifikasi', indonesianName: 'QC', percentage: getPercentage(countQc), color: COLORS[3], count: countQc },
    { name: 'Selesai', indonesianName: 'Final', percentage: getPercentage(countFinal), color: COLORS[4], count: countFinal },
  ];

  // Calculate donut segments
  let cumulativePercent = 0;
  const segments = stages.map((stage, idx) => {
    const percent = totalActive > 0 ? (stage.count / totalActive) * 100 : 20;
    const dashLength = (percent / 100) * CIRCUMFERENCE;
    const gap = CIRCUMFERENCE - dashLength;
    const offset = -(cumulativePercent / 100) * CIRCUMFERENCE;
    cumulativePercent += percent;

    return {
      ...stage,
      dashArray: `${dashLength} ${gap}`,
      dashOffset: offset,
      idx,
    };
  });

  const hovered = hoveredIndex !== null ? stages[hoveredIndex] : null;

  return (
    <div className="bg-surface rounded-xl p-6 soft-shadow border border-outline-variant/30 transition-all">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-headline-sm text-lg font-bold text-on-surface">Distribusi Alur Kerja</h3>
        <span className="text-xs text-on-surface-variant font-medium bg-surface-container-low px-2.5 py-1 rounded-lg">
          Aktif: {totalActive.toLocaleString('id-ID')}
        </span>
      </div>

      <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-10">
        {/* Donut Chart */}
        <div className="relative shrink-0">
          <svg width="200" height="200" viewBox="0 0 200 200" className="transform -rotate-90">
            {/* Background ring */}
            <circle
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              fill="none"
              stroke="var(--color-surface-container-low)"
              strokeWidth={STROKE_WIDTH}
            />
            {/* Segments */}
            {segments.map((seg) => {
              const isHovered = hoveredIndex === seg.idx;
              const isAnyHovered = hoveredIndex !== null;
              return (
                <circle
                  key={seg.idx}
                  cx={CENTER}
                  cy={CENTER}
                  r={RADIUS}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={isHovered ? STROKE_WIDTH + 6 : STROKE_WIDTH}
                  strokeDasharray={seg.dashArray}
                  strokeDashoffset={seg.dashOffset}
                  strokeLinecap="butt"
                  className="transition-all duration-300 cursor-pointer"
                  style={{
                    opacity: isAnyHovered && !isHovered ? 0.35 : 1,
                    filter: isHovered ? 'drop-shadow(0 2px 8px rgba(0,0,0,0.15))' : 'none',
                    '--ring-circumference': `${CIRCUMFERENCE}`,
                  } as React.CSSProperties}
                  onMouseEnter={() => setHoveredIndex(seg.idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              );
            })}
          </svg>

          {/* Center Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            {hovered ? (
              <>
                <span className="font-headline-lg text-2xl font-black" style={{ color: hovered.color }}>
                  {hovered.count}
                </span>
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                  {hovered.indonesianName}
                </span>
              </>
            ) : (
              <>
                <span className="font-headline-lg text-2xl font-black text-on-surface">
                  {totalActive}
                </span>
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                  Total Aktif
                </span>
              </>
            )}
          </div>
        </div>

        {/* Legend & Breakdown */}
        <div className="flex-1 w-full space-y-2.5">
          {stages.map((stage, idx) => {
            const isHovered = hoveredIndex === idx;
            const percent = totalActive > 0 ? ((stage.count / totalActive) * 100).toFixed(1) : '20.0';
            return (
              <div
                key={idx}
                className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all duration-200 ${
                  isHovered ? 'bg-surface-container-low scale-[1.02] soft-shadow' : 'hover:bg-surface-container-low/50'
                }`}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Color dot */}
                <div
                  className={`w-3 h-3 rounded-full shrink-0 transition-transform duration-200 ${isHovered ? 'scale-125' : ''}`}
                  style={{ backgroundColor: stage.color }}
                />
                {/* Name */}
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-semibold text-on-surface">{stage.name}</span>
                  <span className="text-[10px] text-on-surface-variant ml-1">({stage.indonesianName})</span>
                </div>
                {/* Count & Percent */}
                <div className="text-right shrink-0">
                  <span className="text-xs font-black text-on-surface">{stage.count}</span>
                  <span className="text-[10px] text-on-surface-variant ml-1.5">{percent}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WorkflowDistribution;
