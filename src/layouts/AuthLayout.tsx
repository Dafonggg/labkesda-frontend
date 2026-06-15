import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth';
import bgImage from '../assets/background.png';

const AuthLayout: React.FC = () => {
  const { isAuthenticated } = useAuthStore();

  // If already authenticated, redirect to root dashboard immediately
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center relative overflow-hidden font-body-md text-on-surface bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      {/* Dark overlay with slight tint to blend the abstract image and provide high readability / contrast */}
      <div className="absolute inset-0 bg-black/15 backdrop-blur-[2px] pointer-events-none" />

      {/* Dynamic Ambient Glows to enhance the premium visual design */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-teal-500/10 blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md p-6 relative z-10">
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;
