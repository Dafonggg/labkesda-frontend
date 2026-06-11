import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../stores/auth';
import type { RoleCode } from '../stores/auth';
import { useLogout } from '@/hooks/useAuth';
import { 
  LayoutDashboard, 
  FileText, 
  History, 
  HelpCircle, 
  LogOut,
  X,
  ClipboardCheck,
  CalendarDays,
  CreditCard,
  Eye,
  Archive,
  FlaskConical,
  Award,
  Layers,
  FileCheck2,
  FileSpreadsheet,
  Users
} from 'lucide-react';
import { toast } from 'sonner';
import logoTerbaru from '../assets/logo terbaru.svg';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MenuItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ size: number; className?: string }>;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuthStore();

  const logoutMutation = useLogout();

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    logoutMutation.mutate();
  };

  // Get dynamic menu options depending on User Role
  const getMenuItems = (role: RoleCode): MenuItem[] => {
    const items: MenuItem[] = [];

    // Global Menu - Available for everyone
    items.push({ name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard });

    switch (role) {
      case 'admin':
        items.push(
          { name: 'Permohonan', path: '/dashboard/permohonan', icon: FileText },
          { name: 'Jadwal Sampling', path: '/dashboard/jadwal', icon: CalendarDays },
          { name: 'Pembayaran', path: '/dashboard/pembayaran', icon: CreditCard },
          { name: 'Monitoring Log', path: '/dashboard/monitoring', icon: Eye },
          { name: 'Arsip Dokumen', path: '/dashboard/arsip', icon: Archive },
          { name: 'Manajemen User', path: '/dashboard/manajemen-user', icon: Users }
        );
        break;
      
      case 'petugas_lab':
        items.push(
          { name: 'Registrasi Sampel', path: '/dashboard/registrasi', icon: ClipboardCheck },
          { name: 'Scan QR Sample', path: '/dashboard/scan-qr', icon: Eye },
          { name: 'Hasil Pengujian', path: '/dashboard/sample-diuji', icon: ClipboardCheck },
          { name: 'Sample Masuk', path: '/dashboard/sample-masuk', icon: Layers },
          { name: 'Pengujian Parameter', path: '/dashboard/pengujian', icon: FlaskConical }
        );
        break;
      
      case 'qc':
        items.push(
          { name: 'Verifikasi QC', path: '/dashboard/qc/verifikasi', icon: Award },
          { name: 'Riwayat QC', path: '/dashboard/qc/history', icon: History }
        );
        break;
      
      case 'analis':
        items.push(
          { name: 'Draft Laporan', path: '/dashboard/laporan', icon: FileSpreadsheet }
        );
        break;
      
      case 'kepala_uptd':
        items.push(
          { name: 'Persetujuan (Approval)', path: '/dashboard/approval', icon: FileCheck2 },
          { name: 'Laporan Final', path: '/dashboard/laporan-final', icon: Archive },
          { name: 'Tanda Tangan', path: '/dashboard/signature', icon: Award }
        );
        break;
    }

    return items;
  };

  const menuItems = user ? getMenuItems(user.role) : [];

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-50 md:hidden backdrop-blur-sm transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <nav className={`
        fixed left-0 top-0 h-full w-sidebar-width bg-primary text-on-primary py-6 flex flex-col z-50 transition-transform duration-300 ease-in-out
        md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Mobile Close Icon Button */}
        <button 
          onClick={onClose} 
          className="absolute right-4 top-6 text-on-primary/70 hover:text-on-primary md:hidden p-1.5 rounded-lg hover:bg-primary-container/20 transition-all cursor-pointer"
        >
          <X size={20} />
        </button>

        {/* Logo Branding */}
        <div className="px-6 mb-8 flex justify-center shrink-0">
          <div className="bg-white/95 px-4 py-3 rounded-xl soft-shadow w-full flex items-center justify-center transition-all hover:bg-white duration-250">
            <img src={logoTerbaru} alt="Labkesda Purwakarta Logo" className="h-8 w-auto max-w-full object-contain" />
          </div>
        </div>

        {/* Dynamic Nav Links */}
        <div className="flex-1 overflow-y-auto px-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                end
                onClick={onClose}
                className={({ isActive }) => `
                  flex items-center gap-3 px-4 py-3 rounded-lg mx-2 my-0.5 transition-all duration-200
                  ${isActive 
                    ? 'bg-primary-container text-on-primary-container font-semibold soft-shadow' 
                    : 'text-on-primary/70 hover:text-on-primary hover:bg-primary-container/20 hover:translate-x-1'
                  }
                `}
              >
                {({ isActive }) => (
                  <>
                    <Icon size={18} className={isActive ? 'text-on-primary-container' : 'text-on-primary/70'} />
                    <span className="font-label-md text-xs leading-none">{item.name}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Bottom Panel Actions */}
        <div className="px-6 mt-auto">
          {/* Quick Sync for Offline Field Operations */}

          <div className="space-y-1 border-t border-on-primary/20 pt-4">
            <a 
              className="flex items-center gap-3 px-4 py-2 text-on-primary/70 hover:text-on-primary hover:bg-primary-container/20 transition-all duration-200 rounded-lg text-xs" 
              href="#"
              onClick={(e) => {
                e.preventDefault();
                toast.info('Pusat Bantuan: Hubungi admin di admin@labkesda.go.id');
              }}
            >
              <HelpCircle size={16} />
              <span className="font-label-md">Pusat Bantuan</span>
            </a>
            
            <a 
              className="flex items-center gap-3 px-4 py-2 text-on-primary/70 hover:text-on-primary hover:bg-primary-container/20 transition-all duration-200 rounded-lg text-xs" 
              href="#"
              onClick={handleLogout}
            >
              <LogOut size={16} />
              <span className="font-label-md">Keluar</span>
            </a>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Sidebar;
