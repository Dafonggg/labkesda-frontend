import React from 'react';
import { Terminal, Activity, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import { useActivityLogs } from '@/hooks/useActivityLog';
import dayjs from 'dayjs';

const ACTION_STYLE: Record<string, string> = {
  login: 'text-status-success bg-status-success/10',
  create: 'text-status-info bg-status-info/10',
  update: 'text-status-warning bg-status-warning/10',
  delete: 'text-status-danger bg-status-danger/10',
  approve: 'text-primary bg-primary/10',
  reject: 'text-status-danger bg-status-danger/10',
  sync: 'text-purple-600 bg-purple-100',
  download: 'text-gray-600 bg-gray-100',
  submit_approval: 'text-primary bg-primary/10',
};

const Monitoring: React.FC = () => {
  const { data: response, isLoading } = useActivityLogs({ per_page: 50 });
  const logs = response?.data || [];

  // Compute stats from real log data
  const logsByAction = logs.reduce<Record<string, number>>((acc, l) => {
    acc[l.action] = (acc[l.action] || 0) + 1;
    return acc;
  }, {});

  const uniqueUsers = new Set(logs.map(l => l.user?.name || l.user_id)).size;
  const last24h = logs.filter(l => dayjs(l.created_at).isAfter(dayjs().subtract(24, 'hour'))).length;

  return (
    <div className="space-y-6">
      <div className="border-b border-outline-variant pb-4">
        <h1 className="font-headline-lg text-lg md:text-xl font-extrabold text-on-surface">
          Monitoring &amp; Audit Trail Aktivitas
        </h1>
        <p className="font-body-md text-xs text-on-surface-variant mt-1 font-medium">
          Pantau aktivitas sistem LIMS dan audit log lengkap seluruh pengguna sesuai standar ISO 17025.
        </p>
      </div>

      {/* Summary KPI */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Log', value: isLoading ? '-' : logs.length, icon: <Terminal size={18} />, color: 'text-primary bg-primary/10' },
          { label: 'Aktif 24 Jam', value: isLoading ? '-' : last24h, icon: <Clock size={18} />, color: 'text-status-warning bg-status-warning/10' },
          { label: 'Pengguna Unik', value: isLoading ? '-' : uniqueUsers, icon: <Activity size={18} />, color: 'text-status-success bg-status-success/10' },
          { label: 'Aksi Berisiko', value: isLoading ? '-' : (logsByAction['reject'] || 0) + (logsByAction['delete'] || 0), icon: <AlertCircle size={18} />, color: 'text-status-danger bg-status-danger/10' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-4 rounded-xl border border-outline-variant soft-shadow flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${stat.color}`}>
              {stat.icon}
            </div>
            <div>
              <div className="text-[10px] text-on-surface-variant font-bold uppercase">{stat.label}</div>
              <div className="font-bold text-sm text-on-surface">{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Audit Logs */}
        <div className="bg-white p-6 rounded-xl border border-outline-variant soft-shadow space-y-4">
          <h3 className="font-headline-md text-sm font-bold text-on-surface border-b border-outline-variant pb-3 flex items-center gap-2">
            <Terminal size={18} className="text-primary" />
            Audit Trail (Aktivitas Pengguna)
          </h3>
          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="p-3 bg-surface-container-low border border-outline-variant rounded-lg animate-pulse space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-24" />
                  <div className="h-3 bg-gray-200 rounded w-48" />
                  <div className="h-3 bg-gray-200 rounded w-36" />
                </div>
              ))
            ) : logs.length === 0 ? (
              <div className="p-8 text-center text-on-surface-variant text-xs">Belum ada log aktivitas.</div>
            ) : (
              logs.map((log) => {
                const actionStyle = ACTION_STYLE[log.action] || 'text-on-surface-variant bg-gray-100';
                return (
                  <div key={log.id} className="p-3 bg-surface-container-low border border-outline-variant rounded-lg space-y-1.5 hover:bg-surface-container transition-all">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-[11px] text-primary">{log.user?.name || 'System'}</span>
                      <span className="text-[9px] text-on-surface-variant font-medium">{dayjs(log.created_at).format('DD MMM HH:mm:ss')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${actionStyle}`}>{log.action}</span>
                      <span className="text-xs font-semibold text-on-surface capitalize">{log.entity_type}</span>
                    </div>
                    {log.entity_id && (
                      <div className="flex justify-between text-[9px] text-on-surface-variant font-bold uppercase tracking-wider">
                        <span>Entity: {log.entity_id?.substring(0, 12)}...</span>
                        <span>IP: {log.ip_address || '-'}</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Real-time action summary */}
        <div className="bg-white p-6 rounded-xl border border-outline-variant soft-shadow space-y-4">
          <h3 className="font-headline-md text-sm font-bold text-on-surface border-b border-outline-variant pb-3 flex items-center gap-2">
            <Activity size={18} className="text-primary" />
            Ringkasan Aktivitas per Aksi
          </h3>

          <div className="space-y-3">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
              ))
            ) : Object.keys(logsByAction).length === 0 ? (
              <div className="p-8 text-center text-on-surface-variant text-xs">
                <CheckCircle2 size={24} className="mx-auto mb-2 opacity-40" />
                Belum ada aktivitas tercatat
              </div>
            ) : (
              Object.entries(logsByAction)
                .sort(([, a], [, b]) => b - a)
                .map(([action, count]) => {
                  const actionStyle = ACTION_STYLE[action] || 'text-on-surface-variant bg-gray-100';
                  const pct = logs.length > 0 ? Math.round((count / logs.length) * 100) : 0;
                  return (
                    <div key={action} className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase shrink-0 min-w-[80px] text-center ${actionStyle}`}>{action}</span>
                      <div className="flex-1">
                        <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                          <div className="h-full bg-primary/40 rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-on-surface shrink-0">{count}</span>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Monitoring;
