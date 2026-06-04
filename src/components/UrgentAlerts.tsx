import React, { useState, useMemo } from 'react';
import { AlertCircle, Clock, ShieldAlert, X, Bell, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useNotifications, useMarkAsRead } from '@/hooks/useNotification';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/id';

dayjs.extend(relativeTime);
dayjs.locale('id');

/* ─── Alert Severity Config ─── */
const SEVERITY_CONFIG = {
  danger: {
    icon: ShieldAlert,
    borderColor: 'border-l-status-danger',
    textColor: 'text-status-danger',
    bg: 'bg-status-danger/5',
  },
  warning: {
    icon: Clock,
    borderColor: 'border-l-status-warning',
    textColor: 'text-status-warning',
    bg: 'bg-status-warning/5',
  },
};

const UrgentAlerts: React.FC = () => {
  const { data: notifData, isLoading } = useNotifications();
  const markAsReadMutation = useMarkAsRead();
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const notifications = useMemo(() => {
    const raw = notifData?.data || [];
    return raw
      .filter((n) => !dismissedIds.has(n.id))
      .slice(0, 6); // Show max 6
  }, [notifData, dismissedIds]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissedIds((prev) => new Set(prev).add(id));
    toast.success('Notifikasi dihapus.');
  };

  const handleAlertClick = (title: string) => {
    toast.info(`Membuka detail: "${title}"`);
  };

  const handleMarkAllRead = () => {
    if (unreadCount > 0) {
      markAsReadMutation.mutate(undefined);
      toast.success('Semua notifikasi ditandai sebagai dibaca.');
    }
  };

  // Determine severity from notification content
  const getSeverity = (n: any): 'danger' | 'warning' => {
    const msg = (n.message || n.title || '').toLowerCase();
    if (msg.includes('gagal') || msg.includes('error') || msg.includes('melebihi') || msg.includes('batas')) {
      return 'danger';
    }
    return 'warning';
  };

  if (isLoading) {
    return (
      <div className="bg-surface rounded-xl soft-shadow border border-outline-variant/30 overflow-hidden flex flex-col flex-1">
        <div className="bg-surface-container px-6 py-4 border-b border-outline-variant/30">
          <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="p-4 space-y-3 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl p-0 soft-shadow border border-outline-variant/30 overflow-hidden flex flex-col flex-1">
      {/* Alert Header */}
      <div className="bg-surface-container px-5 py-3.5 border-b border-outline-variant/30 flex justify-between items-center shrink-0">
        <h3 className="font-headline-sm text-sm md:text-base font-bold text-on-surface flex items-center gap-2">
          <AlertCircle className="text-status-danger" size={18} />
          Peringatan Mendesak
        </h3>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
            >
              Tandai dibaca
            </button>
          )}
          {notifications.length > 0 && (
            <span className="bg-status-danger text-on-error font-label-sm text-[10px] font-bold px-2 py-0.5 rounded-full ring-2 ring-white/10">
              {notifications.length}
            </span>
          )}
        </div>
      </div>

      {/* Alert List */}
      <div className="divide-y divide-outline-variant/20 flex-1 overflow-y-auto max-h-[360px]">
        {notifications.length > 0 ? (
          notifications.map((notif: any) => {
            const severity = getSeverity(notif);
            const config = SEVERITY_CONFIG[severity];
            const Icon = config.icon;
            const timeAgo = dayjs(notif.created_at).fromNow();
            const title = notif.title || notif.message || 'Notifikasi';
            const body = notif.message || notif.body || '';

            return (
              <div
                key={notif.id}
                onClick={() => handleAlertClick(title)}
                className={`p-4 hover:bg-surface-container-low transition-all cursor-pointer border-l-4 ${config.borderColor} flex justify-between items-start gap-3 group ${
                  !notif.is_read ? config.bg : ''
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1 flex-wrap gap-1">
                    <span className={`font-label-sm text-[11px] font-bold flex items-center gap-1.5 ${config.textColor}`}>
                      <Icon size={13} />
                      {title}
                    </span>
                    <span className="font-body-sm text-[10px] text-on-surface-variant font-medium flex items-center gap-1">
                      <Clock size={9} />
                      {timeAgo}
                    </span>
                  </div>
                  {body && body !== title && (
                    <p className="font-body-sm text-[11px] text-on-surface leading-relaxed pr-4 mt-1 font-medium line-clamp-2">
                      {body}
                    </p>
                  )}
                  {!notif.is_read && (
                    <span className="inline-block mt-1.5 w-1.5 h-1.5 rounded-full bg-status-danger" />
                  )}
                </div>

                {/* Dismiss Button */}
                <button
                  onClick={(e) => handleDismiss(notif.id, e)}
                  className="text-on-surface-variant/40 hover:text-on-surface-variant hover:bg-surface-variant/40 p-1 rounded-md transition-all shrink-0 opacity-0 group-hover:opacity-100"
                  title="Tutup peringatan"
                >
                  <X size={13} />
                </button>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-on-surface-variant">
            <CheckCircle2 size={36} className="text-status-success/40 mb-2" />
            <p className="text-xs font-bold">Semua aman!</p>
            <p className="text-[10px] mt-0.5">Tidak ada peringatan mendesak.</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 text-center border-t border-outline-variant/30 shrink-0 bg-surface">
        <button
          onClick={() => toast.info('Membuka riwayat semua notifikasi...')}
          className="text-primary hover:text-primary-container font-label-sm text-[11px] font-bold hover:underline cursor-pointer flex items-center gap-1.5 justify-center mx-auto"
        >
          <Bell size={12} />
          Lihat Semua Notifikasi
        </button>
      </div>
    </div>
  );
};

export default UrgentAlerts;
