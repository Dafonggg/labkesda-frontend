import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

const DashboardLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-cream-bg font-body-md text-xs text-on-surface">
      {/* Side Navigation Panel */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area Wrapper */}
      <div className="flex-1 md:ml-sidebar-width flex flex-col min-h-screen transition-all duration-300">
        
        {/* Top Navbar */}
        <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

        {/* Dynamic Pages Canvas */}
        <main className="flex-1 p-container-padding pb-12 overflow-x-hidden">
          <Outlet />
        </main>
        
      </div>
    </div>
  );
};

export default DashboardLayout;
