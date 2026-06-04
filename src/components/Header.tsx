import React, { useState } from 'react';
import { Menu, Search, Bell, HelpCircle, Hand } from 'lucide-react';
import { useAuthStore, getRoleDisplayName } from '@/stores/auth';
import { useNotifications, useMarkAsRead } from '@/hooks/useNotification';
import { toast } from 'sonner';

interface HeaderProps {
  onMenuToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuToggle }) => {
  const { user } = useAuthStore();
  const [searchVal, setSearchVal] = useState('');
  
  // Fetch notifications from API
  const { data: notifData } = useNotifications();
  const markAsReadMutation = useMarkAsRead();

  const notifications = notifData?.data || [];
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleNotificationClick = () => {
    if (unreadCount > 0) {
      markAsReadMutation.mutate(undefined);
      toast.success('Semua notifikasi telah ditandai sebagai dibaca.');
    }
  };

  return (
    <header className="flex justify-between items-center h-[72px] px-6 bg-white border-b border-outline-variant docked full-width top-0 sticky z-40 transition-all duration-200 ease-in-out soft-shadow">
      <div className="flex items-center gap-4 md:gap-6 flex-1 max-w-xl">
        {/* Hamburger Menu Trigger */}
        <button
          onClick={onMenuToggle}
          className="md:hidden p-2 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors shrink-0 cursor-pointer"
        >
          <Menu size={22} />
        </button>

        {/* Portal Title */}
        <div className="hidden sm:block shrink-0">
          <h2 className="font-headline-md text-base md:text-lg font-bold text-primary">
            Welcome, {user?.name?.split(' ')[0] || 'User'} <Hand size={18} className="inline ml-1 text-primary/70" />
          </h2>
        </div>

        {/* Search Bar */}
        <div className="relative w-full ml-1 md:ml-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant shrink-0" size={16} />
          <input
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-outline-variant bg-surface-container-low placeholder-on-surface-variant/70 focus:border-primary focus:ring-1 focus:ring-primary outline-none font-body-sm text-xs text-on-surface transition-all focus:bg-white focus:shadow-sm"
            placeholder="Cari permohonan, kode sampel, parameter..."
            type="text"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-4 shrink-0">
        {/* Notifications Button */}
        <button 
          onClick={handleNotificationClick}
          className="relative text-on-surface-variant hover:bg-surface-container rounded-full p-2 transition-all duration-200 ease-in-out cursor-pointer"
          title="Notifikasi"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-status-danger rounded-full ring-2 ring-white animate-pulse" />
          )}
        </button>

        {/* Help Button */}
        <button 
          onClick={() => toast.info('Bantuan: Sistem Informasi Labkesda Terintegrasi ISO 17025.')}
          className="text-on-surface-variant hover:bg-surface-container rounded-full p-2 transition-all duration-200 ease-in-out cursor-pointer"
          title="Bantuan"
        >
          <HelpCircle size={18} />
        </button>

        {/* Vertical divider */}
        <div className="h-8 w-[1px] bg-outline-variant hidden xs:block" />

        {/* Profile Card */}
        <div className="flex items-center gap-2.5">
          <div className="text-right hidden xs:flex flex-col">
            <span className="font-label-md text-xs font-bold text-on-surface leading-tight">
              {user?.name || 'Guest User'}
            </span>
            <span className="text-[10px] text-primary font-semibold uppercase tracking-wider leading-none mt-0.5">
              {user ? getRoleDisplayName(user.role) : 'Guest'}
            </span>
          </div>

          <div className="w-9 h-9 rounded-full bg-primary-container/30 border border-primary/20 overflow-hidden cursor-pointer transition-transform hover:scale-105 active:scale-95 duration-200 flex items-center justify-center font-bold text-primary bg-primary-container/40 text-xs">
            {user?.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2) : 'G'}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
