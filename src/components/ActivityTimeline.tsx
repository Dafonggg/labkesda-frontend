import React from 'react';
import {
  Plus,
  Edit3,
  Trash2,
  LogIn,
  CheckCircle,
  Send,
  FileText,
  Clock,
  Activity,
} from 'lucide-react';
import { useActivityLogs } from '@/hooks/useActivityLog';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/id';

dayjs.extend(relativeTime);
dayjs.locale('id');

/* ─── Action Config ─── */
const ACTION_CONFIG: Record<string, { icon: React.ComponentType<{ size?: number; className?: string }>; color: string; bg: string; label: string }> = {
  created: { icon: Plus, color: 'text-status-success', bg: 'bg-status-success/10', label: 'Membuat' },
  updated: { icon: Edit3, color: 'text-status-info', bg: 'bg-status-info/10', label: 'Mengubah' },
  deleted: { icon: Trash2, color: 'text-status-danger', bg: 'bg-status-danger/10', label: 'Menghapus' },
  login: { icon: LogIn, color: 'text-primary', bg: 'bg-primary/10', label: 'Login' },
  approved: { icon: CheckCircle, color: 'text-status-success', bg: 'bg-status-success/10', label: 'Menyetujui' },
  submitted: { icon: Send, color: 'text-status-info', bg: 'bg-status-info/10', label: 'Mengirim' },
};

const DEFAULT_CONFIG = { icon: FileText, color: 'text-on-surface-variant', bg: 'bg-surface-variant/50', label: 'Aksi' };

/* ─── Entity Label Map ─── */
const ENTITY_LABELS: Record<string, string> = {
  permohonan_pengujian: 'Permohonan',
  sample: 'Sampel',
  hasil_uji: 'Hasil Uji',
  draft_laporan: 'Draft Laporan',
  laporan_final: 'Laporan Final',
  payment: 'Pembayaran',
  jadwal_sampling: 'Jadwal Sampling',
  user: 'Pengguna',
  registrasi_sample: 'Registrasi',
};

const getEntityLabel = (type: string) => {
  const normalized = type?.toLowerCase().replace(/\\/g, '_').split('_').slice(-2).join('_');
  return ENTITY_LABELS[normalized] || ENTITY_LABELS[type] || type;
};

/* ─── Timeline Item ─── */
interface TimelineItemProps {
  action: string;
  entityType: string;
  userName: string;
  createdAt: string;
  isLast: boolean;
}

const TimelineItem: React.FC<TimelineItemProps> = ({
  action,
  entityType,
  userName,
  createdAt,
  isLast,
}) => {
  const config = ACTION_CONFIG[action] || DEFAULT_CONFIG;
  const Icon = config.icon;
  const entityLabel = getEntityLabel(entityType);
  const timeAgo = dayjs(createdAt).fromNow();

  return (
    <div className="flex gap-3 group animate-fade-in">
      {/* Timeline Dot & Line */}
      <div className="flex flex-col items-center shrink-0">
        <div className={`w-8 h-8 rounded-full ${config.bg} flex items-center justify-center ring-2 ring-surface transition-transform group-hover:scale-110 duration-200`}>
          <Icon size={14} className={config.color} />
        </div>
        {!isLast && (
          <div className="w-[2px] flex-1 bg-outline-variant/30 min-h-[20px]" />
        )}
      </div>

      {/* Content */}
      <div className={`pb-4 flex-1 min-w-0 ${!isLast ? '' : ''}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs text-on-surface leading-snug">
              <span className="font-bold">{userName}</span>
              {' '}
              <span className="text-on-surface-variant">{config.label.toLowerCase()}</span>
              {' '}
              <span className={`font-semibold ${config.color}`}>{entityLabel}</span>
            </p>
          </div>
          <span className="text-[10px] text-on-surface-variant/70 font-medium whitespace-nowrap shrink-0 flex items-center gap-1 mt-0.5">
            <Clock size={10} />
            {timeAgo}
          </span>
        </div>
      </div>
    </div>
  );
};

/* ─── Skeleton ─── */
const TimelineSkeleton: React.FC = () => (
  <div className="space-y-4 animate-pulse">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="flex gap-3">
        <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0" />
        <div className="flex-1">
          <div className="h-3.5 bg-gray-200 rounded w-3/4 mb-1.5" />
          <div className="h-2.5 bg-gray-100 rounded w-1/3" />
        </div>
      </div>
    ))}
  </div>
);

/* ─── Main Component ─── */
const ActivityTimeline: React.FC = () => {
  const { data, isLoading } = useActivityLogs({ per_page: 8 });
  const logs = data?.data || [];

  return (
    <div className="bg-surface rounded-xl soft-shadow border border-outline-variant/30 overflow-hidden flex flex-col flex-1">
      {/* Header */}
      <div className="bg-surface-container px-6 py-4 border-b border-outline-variant/30 flex justify-between items-center shrink-0">
        <h3 className="font-headline-sm text-base md:text-lg font-bold text-on-surface flex items-center gap-2">
          <Activity className="text-primary" size={18} />
          Aktivitas Terkini
        </h3>
        <span className="text-[10px] text-on-surface-variant font-medium bg-surface-container-low px-2 py-0.5 rounded-lg">
          Real-time
        </span>
      </div>

      {/* Timeline List */}
      <div className="p-5 overflow-y-auto max-h-[380px] flex-1">
        {isLoading ? (
          <TimelineSkeleton />
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-on-surface-variant">
            <Activity size={32} className="text-on-surface-variant/30 mb-2" />
            <p className="text-xs font-semibold">Belum ada aktivitas.</p>
            <p className="text-[10px] mt-0.5">Aktivitas sistem akan muncul di sini.</p>
          </div>
        ) : (
          <div>
            {logs.map((log, idx) => (
              <TimelineItem
                key={log.id}
                action={log.action}
                entityType={log.entity_type}
                userName={log.user?.name || 'Sistem'}
                createdAt={log.created_at}
                isLast={idx === logs.length - 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityTimeline;
