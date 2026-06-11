import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLogin } from '@/hooks/useAuth';
import { ShieldCheck, Mail, Lock, ArrowRight, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import logoTerbaru from '../assets/logo terbaru.svg';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const loginMutation = useLogin();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotAlert, setShowForgotAlert] = useState(false);

  const from = location.state?.from?.pathname || '/dashboard';

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Silakan isi email Anda.');
      return;
    }
    if (!password) {
      toast.error('Silakan isi kata sandi Anda.');
      return;
    }
    
    loginMutation.mutate(
      { email, password },
      {
        onSuccess: (response) => {
          toast.success(`Selamat datang kembali, ${response.data.user.name}! Login berhasil.`);
          navigate(from, { replace: true });
        },
      }
    );
  };

  return (
    <div className="bg-white/85 rounded-3xl shadow-2xl border border-white/30 p-8 w-full backdrop-blur-xl transition-all relative">
      {/* Upper header */}
      <div className="flex flex-col items-center mb-8 text-center">
        {/* Brand Logo Wrapper */}
        <div className="bg-white p-3 rounded-2xl border border-outline-variant soft-shadow mb-4 max-w-[200px] flex items-center justify-center">
          <img src={logoTerbaru} alt="Labkesda Purwakarta Logo" className="h-9 w-auto object-contain" />
        </div>
        
        <h2 className="font-headline-lg text-lg font-extrabold text-primary tracking-tight">
          SIA Labkesda
        </h2>
        <p className="font-body-md text-xs text-on-surface-variant font-medium mt-1">
          Sistem Informasi Pengujian Sampel Lingkungan
        </p>
      </div>

      {/* Main Login Form */}
      <form onSubmit={handleFormSubmit} className="space-y-4">
        {/* Email Field */}
        <div className="space-y-1.5">
          <label className="block font-label-sm text-xs font-semibold text-on-surface-variant" htmlFor="email">
            Email
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none z-10">
              <Mail size={16} />
            </span>
            <input
              id="email"
              type="email"
              placeholder="nama@labkesda.go.id"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loginMutation.isPending}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none font-body-sm text-sm text-on-surface transition-colors disabled:opacity-60"
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="block font-label-sm text-xs font-semibold text-on-surface-variant" htmlFor="password">
              Password
            </label>
            <button
              type="button"
              onClick={() => setShowForgotAlert(true)}
              className="font-label-sm text-[11px] font-medium text-primary hover:underline cursor-pointer"
            >
              Lupa Password?
            </button>
          </div>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none z-10">
              <Lock size={16} />
            </span>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loginMutation.isPending}
              className="w-full pl-10 pr-11 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none font-body-sm text-sm text-on-surface transition-colors disabled:opacity-60"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors z-10 cursor-pointer p-0.5"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Submit Action Button */}
        <button
          type="submit"
          disabled={loginMutation.isPending}
          className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary font-label-md text-xs font-semibold py-3.5 rounded-xl hover-lift hover:bg-primary-container transition-all soft-shadow cursor-pointer disabled:opacity-80"
        >
          {loginMutation.isPending ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Menghubungkan...
            </>
          ) : (
            <>
              Masuk Aplikasi
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>

      {/* Institutional Disclaimer */}
      <div className="mt-8 pt-4 border-t border-outline-variant flex items-center justify-center gap-2 text-center text-[10px] text-on-surface-variant font-medium">
        <ShieldCheck size={14} className="text-primary" />
        Sistem Terakreditasi ISO/IEC 17025 • UPTD Purwakarta
      </div>

      {/* Forgot Password Alert Modal */}
      {showForgotAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
            onClick={() => setShowForgotAlert(false)}
          />
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full relative z-10 border border-outline-variant flex flex-col items-center text-center transform scale-100 transition-all duration-200 animate-in zoom-in-95">
            <div className="bg-amber-50 p-4 rounded-full text-amber-500 mb-4 border border-amber-100">
              <ShieldAlert size={36} />
            </div>
            <h3 className="text-base font-bold text-on-surface mb-2">
              Lupa Kata Sandi?
            </h3>
            <p className="text-xs text-on-surface-variant leading-relaxed mb-6">
              Untuk alasan keamanan, pemulihan kata sandi akun SIA Labkesda dilakukan oleh Administrator. Silakan hubungi <strong>Administrator UPTD Labkesda Purwakarta</strong> untuk mereset kata sandi Anda.
            </p>
            <button
              type="button"
              onClick={() => setShowForgotAlert(false)}
              className="w-full bg-primary text-on-primary font-semibold text-xs py-3 rounded-xl hover:bg-primary/95 transition-all active:scale-[0.98] cursor-pointer shadow-md"
            >
              Saya Mengerti
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
