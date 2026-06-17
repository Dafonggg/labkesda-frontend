import React, { useRef } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { DeviceFrameset } from 'react-device-frameset';
import 'react-device-frameset/styles/marvel-devices.min.css';
import {
  FlaskConical,
  QrCode,
  FileText,
  ShieldCheck,
  BarChart3,
  MapPin,
  Download,
  LogIn,
  ArrowRight,
  ChevronDown,
  Smartphone,
  Monitor,
  ExternalLink,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth';

import logoSvg from '../assets/logo terbaru.svg';
import mockupDashboard from '../assets/dashboard.png';
import mockupMobile from '../assets/mobile.png';

/* ─── Custom GitHub Icon (not available in this lucide-react version) ──── */

const GithubIcon: React.FC<{ size?: number; className?: string }> = ({ size = 24, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
  </svg>
);

/* ─── Feature Data ────────────────────────────────────────────────────── */

const features = [
  {
    icon: FlaskConical,
    title: 'Manajemen Pengujian',
    description: 'Kelola seluruh alur pengujian sampel lingkungan dari registrasi hingga pelaporan secara digital.',
    color: 'bg-primary/10 text-primary',
  },
  {
    icon: QrCode,
    title: 'Tracking QR Code',
    description: 'Lacak progres sampel secara real-time melalui QR Code unik yang terverifikasi.',
    color: 'bg-status-info/10 text-status-info',
  },
  {
    icon: FileText,
    title: 'Laporan Digital & TTE',
    description: 'Cetak Laporan Hasil Pengujian resmi dengan Tanda Tangan Elektronik (TTE) SHA-256.',
    color: 'bg-tertiary/10 text-tertiary',
  },
  {
    icon: ShieldCheck,
    title: 'Quality Control',
    description: 'Verifikasi dan validasi hasil pengujian sesuai standar ISO/IEC 17025 terakreditasi.',
    color: 'bg-status-success/10 text-status-success',
  },
  {
    icon: BarChart3,
    title: 'Dashboard Analitik',
    description: 'Pantau KPI, throughput mingguan, distribusi workflow, dan pendapatan secara visual.',
    color: 'bg-status-warning/10 text-status-warning',
  },
  {
    icon: MapPin,
    title: 'Geolokasi Sampling',
    description: 'Catat titik pengambilan sampel dengan GPS presisi dan integrasikan ke Google Maps.',
    color: 'bg-error/10 text-error',
  },
];

/* ─── Stats Data ──────────────────────────────────────────────────────── */

const stats = [
  { value: '1000+', label: 'Sampel Diproses' },
  { value: '99.9%', label: 'Uptime Sistem' },
  { value: '50+', label: 'Parameter Uji' },
  { value: '24/7', label: 'Akses Real-time' },
];

/* ─── Animation Variants ──────────────────────────────────────────────── */

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } },
};

const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.15,
    },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
};

/* ─── Main Landing Page Component ─────────────────────────────────────── */

const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  const heroY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  // Jika user sudah login, langsung redirect ke dashboard (sesuai role)
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-cream-bg font-body-md text-on-surface overflow-x-hidden">
      {/* ═══ Sticky Navbar ═══ */}
      <Navbar />

      {/* ═══ Hero Section ═══ */}
      <section ref={heroRef} className="relative flex items-center pt-24 pb-12 sm:min-h-screen sm:pt-20 overflow-hidden">
        {/* Ambient glows */}
        <div className="absolute top-[-15%] left-[-10%] w-[55%] h-[55%] rounded-full bg-primary/8 blur-[120px] pointer-events-none animate-hero-glow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full bg-tertiary/6 blur-[100px] pointer-events-none animate-hero-glow" style={{ animationDelay: '3s' }} />
        <div className="absolute top-[40%] right-[20%] w-[25%] h-[25%] rounded-full bg-secondary/5 blur-[80px] pointer-events-none animate-hero-glow" style={{ animationDelay: '1.5s' }} />

        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10"
        >
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-8 items-center">
            {/* Left: Text Content */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="text-center lg:text-left space-y-4 sm:space-y-6"
            >
              {/* Badge */}
              <motion.div variants={fadeInUp}>
                <span className="inline-flex items-center gap-1.5 sm:gap-2 bg-primary/8 text-primary text-[11px] sm:text-xs font-semibold px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-primary/15">
                  <ShieldCheck size={13} />
                  Terakreditasi ISO/IEC 17025
                </span>
              </motion.div>

              {/* Headline */}
              <motion.h1
                variants={fadeInUp}
                className="font-headline-xl text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]"
              >
                <span className="gradient-text">Sistem Informasi</span>
                <br />
                <span className="text-on-surface">Analitik Labkesda</span>
                <br />
                <span className="gradient-text-gold">Purwakarta</span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                variants={fadeInUp}
                className="text-sm sm:text-base lg:text-lg text-on-surface-variant max-w-lg mx-auto lg:mx-0 leading-relaxed"
              >
                Platform digital terintegrasi untuk pengelolaan pengujian sampel lingkungan — 
                dari sampling lapangan hingga pelaporan resmi dengan tanda tangan elektronik.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Link
                  to="/login"
                  id="hero-login-btn"
                  className="group inline-flex items-center justify-center gap-2 sm:gap-2.5 bg-primary text-on-primary font-semibold text-xs sm:text-sm px-5 sm:px-7 py-3 sm:py-3.5 rounded-xl hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl hover:shadow-primary/20 active:scale-[0.98]"
                >
                  <LogIn size={16} />
                  Masuk Dashboard
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <a
                  href="https://github.com/Dafonggg/labkesda-mobile-app/releases/tag/v1.0.0"
                  target="_blank"
                  rel="noopener noreferrer"
                  id="hero-download-btn"
                  className="group inline-flex items-center justify-center gap-2 sm:gap-2.5 bg-on-surface text-surface font-semibold text-xs sm:text-sm px-5 sm:px-7 py-3 sm:py-3.5 rounded-xl hover:bg-on-surface/85 transition-all shadow-lg active:scale-[0.98]"
                >
                  <GithubIcon size={16} />
                  Download APK
                  <Download size={14} className="group-hover:translate-y-0.5 transition-transform" />
                </a>
              </motion.div>

              {/* Trust Badges */}
              <motion.div variants={fadeInUp} className="flex items-center gap-4 sm:gap-6 justify-center lg:justify-start pt-2">
                {stats.slice(0, 3).map((stat) => (
                  <div key={stat.label} className="text-center">
                    <p className="font-headline-md text-lg sm:text-xl font-extrabold text-primary stat-glow">{stat.value}</p>
                    <p className="text-[9px] sm:text-[10px] text-on-surface-variant font-medium">{stat.label}</p>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right: Device Mockups */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] as const }}
              className="relative flex items-center justify-center lg:justify-end mt-4 lg:mt-0"
            >
              <HeroDevices />
            </motion.div>
          </div>

          {/* Scroll Down Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="hidden sm:flex absolute bottom-8 left-1/2 -translate-x-1/2 flex-col items-center gap-1 text-on-surface-variant/50"
          >
            <span className="text-[10px] font-medium uppercase tracking-widest">Scroll</span>
            <ChevronDown size={18} className="animate-bounce" />
          </motion.div>
        </motion.div>
      </section>

      {/* ═══ Features Section ═══ */}
      <FeaturesSection />

      {/* ═══ Interactive Showcase Section ═══ */}
      <ShowcaseSection />

      {/* ═══ Stats Bar ═══ */}
      <StatsSection />

      {/* ═══ Download CTA Section ═══ */}
      <DownloadCTA />

      {/* ═══ Footer ═══ */}
      <Footer />
    </div>
  );
};

/* ─── Navbar Component ────────────────────────────────────────────────── */

const Navbar: React.FC = () => {
  return (
    <motion.nav
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }}
      className="fixed top-0 left-0 right-0 z-50 navbar-glass"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2 sm:gap-3">
          <img src={logoSvg} alt="SIA Labkesda" className="h-7 sm:h-8 w-auto" />
          <div className="hidden sm:block">
            <p className="font-headline-md text-sm font-bold text-primary leading-tight">SIA Labkesda</p>
            <p className="text-[9px] text-on-surface-variant font-medium">Kab. Purwakarta</p>
          </div>
        </div>

        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-6">
          <a href="#features" className="text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors">Fitur</a>
          <a href="#showcase" className="text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors">Platform</a>
          <a href="#download" className="text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors">Download</a>
        </div>

        {/* CTA */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <a
            href="https://github.com/Dafonggg/labkesda-mobile-app/releases/tag/v1.0.0"
            target="_blank"
            rel="noopener noreferrer"
            id="nav-download-btn"
            className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-on-surface-variant hover:text-on-surface border border-outline-variant px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg transition-all hover:bg-surface-container"
          >
            <Download size={13} />
            <span className="hidden sm:inline">APK</span>
          </a>
          <Link
            to="/login"
            id="nav-login-btn"
            className="inline-flex items-center gap-1.5 bg-primary text-on-primary text-[11px] sm:text-xs font-semibold px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-primary/90 transition-all shadow-sm active:scale-[0.97]"
          >
            <LogIn size={13} />
            Masuk
          </Link>
        </div>
      </div>
    </motion.nav>
  );
};

/* ─── Hero Devices Component ──────────────────────────────────────────── */

const HeroDevices: React.FC = () => {
  return (
    <div className="relative w-full mx-auto max-w-[280px] sm:max-w-sm md:max-w-none">
      {/* ── Mobile Version: simple framed images ── */}
      <div className="md:hidden">
        <div className="relative">
          {/* Dashboard image */}
          <div className="device-monitor animate-float w-full">
            <div className="device-screen">
              <img src={mockupDashboard} alt="SIA Labkesda Dashboard" loading="eager" />
            </div>
          </div>
          {/* Phone image overlapping */}
          <div className="absolute -bottom-4 -right-2 w-[38%] device-phone animate-float-slow">
            <div className="device-screen">
              <img src={mockupMobile} alt="SIA Labkesda Mobile" loading="eager" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Desktop Version: DeviceFrameset ── */}
      <div className="hidden md:block relative">
        <div className="animate-float">
          <DeviceFrameset device="MacBook Pro" zoom={0.5}>
            <img src={mockupDashboard} alt="SIA Labkesda Dashboard" className="w-full h-full object-cover object-top" loading="eager" />
          </DeviceFrameset>
          <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-md border border-outline-variant rounded-lg px-2.5 py-1 flex items-center gap-1.5 shadow-md z-20">
            <Monitor size={11} className="text-primary" />
            <span className="text-[9px] font-bold text-on-surface">Web Dashboard</span>
          </div>
        </div>
        <div className="absolute -bottom-6 right-4 z-10 animate-float-slow">
          <DeviceFrameset device="iPhone X" zoom={0.5}>
            <img src={mockupMobile} alt="SIA Labkesda Mobile App" className="w-full h-full object-cover object-top" loading="eager" />
          </DeviceFrameset>
          <div className="absolute -bottom-2 right-0 bg-white/90 backdrop-blur-md border border-outline-variant rounded-lg px-2 py-1 flex items-center gap-1 shadow-md z-20">
            <Smartphone size={10} className="text-tertiary" />
            <span className="text-[8px] font-bold text-on-surface">Mobile App</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Features Section ────────────────────────────────────────────────── */

const FeaturesSection: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="features" className="py-16 sm:py-24 lg:py-32 relative">
      {/* Background subtle pattern */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent pointer-events-none" />

      <div ref={ref} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={staggerContainer}
          className="text-center mb-10 sm:mb-16 space-y-3 sm:space-y-4"
        >
          <motion.span variants={fadeInUp} className="inline-block text-[11px] sm:text-xs font-semibold text-primary uppercase tracking-widest">
            Fitur Unggulan
          </motion.span>
          <motion.h2 variants={fadeInUp} className="font-headline-lg text-2xl sm:text-3xl lg:text-4xl font-extrabold text-on-surface">
            Solusi Lengkap untuk{' '}
            <span className="gradient-text">Laboratorium Modern</span>
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-xs sm:text-sm text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
            SIA Labkesda menghadirkan fitur-fitur canggih yang dirancang khusus untuk mendigitalkan
            seluruh proses pengujian sampel lingkungan di UPTD Labkesda Kabupaten Purwakarta.
          </motion.p>
        </motion.div>

        {/* Feature Grid */}
        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={staggerContainer}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5"
        >
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                variants={fadeInUp}
                className="feature-card bg-white rounded-2xl border border-outline-variant/60 p-5 sm:p-6 space-y-3 sm:space-y-4 cursor-default"
              >
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${feature.color} flex items-center justify-center`}>
                  <Icon size={20} />
                </div>
                <h3 className="font-headline-sm text-sm sm:text-base font-bold text-on-surface">{feature.title}</h3>
                <p className="text-[11px] sm:text-xs text-on-surface-variant leading-relaxed">{feature.description}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};

/* ─── Interactive Showcase Section ────────────────────────────────────── */

const ShowcaseSection: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="showcase" className="py-16 sm:py-24 lg:py-32 bg-gradient-to-br from-on-surface via-[#1a2e23] to-[#0a1f14] relative overflow-hidden">
      {/* Ambient glows */}
      <div className="absolute top-[10%] left-[5%] w-[35%] h-[50%] rounded-full bg-primary/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[5%] w-[30%] h-[40%] rounded-full bg-tertiary/8 blur-[80px] pointer-events-none" />

      <div ref={ref} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={staggerContainer}
          className="grid lg:grid-cols-2 gap-10 sm:gap-16 items-center"
        >
          {/* Left: Monitor Showcase */}
          <motion.div variants={scaleIn} className="relative">
            {/* Mobile: simple image */}
            <div className="lg:hidden animate-float">
              <div className="device-monitor w-full">
                <div className="device-screen">
                  <img src={mockupDashboard} alt="Dashboard Web SIA Labkesda" />
                </div>
              </div>
            </div>
            {/* Desktop: DeviceFrameset */}
            <div className="hidden lg:block animate-float">
              <DeviceFrameset device="MacBook Pro" zoom={0.5}>
                <img src={mockupDashboard} alt="Dashboard Web SIA Labkesda" className="w-full h-full object-cover object-top" />
              </DeviceFrameset>
            </div>
            {/* Floating label */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.6 }}
              className="absolute left-0 top-4 sm:top-8 bg-primary text-on-primary text-[9px] sm:text-[10px] font-bold px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg shadow-lg z-20"
            >
              <Monitor size={11} className="inline mr-1 -mt-0.5" />
              Web Dashboard
            </motion.div>
          </motion.div>

          {/* Right: Text + Phone */}
          <motion.div variants={staggerContainer} className="space-y-5 sm:space-y-8">
            <motion.span variants={fadeInUp} className="inline-block text-[11px] sm:text-xs font-semibold text-primary/80 uppercase tracking-widest">
              Multi-Platform
            </motion.span>
            <motion.h2 variants={fadeInUp} className="font-headline-lg text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight">
              Akses dari Mana Saja,{' '}
              <span className="text-primary-fixed-dim">Kapan Saja</span>
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-xs sm:text-sm text-white/60 leading-relaxed">
              SIA Labkesda tersedia dalam dua platform — Dashboard Web untuk pengelolaan administratif 
              dan Mobile App untuk petugas lapangan. Data tersinkronisasi secara real-time.
            </motion.p>

            {/* Platform Cards */}
            <motion.div variants={staggerContainer} className="grid grid-cols-2 gap-3 sm:gap-4">
              <motion.div variants={fadeInUp} className="bg-white/5 border border-white/10 rounded-xl p-3 sm:p-4 space-y-2 backdrop-blur-sm">
                <Monitor size={18} className="text-primary-fixed-dim" />
                <h4 className="text-xs sm:text-sm font-bold text-white">Web Dashboard</h4>
                <p className="text-[10px] sm:text-[11px] text-white/50 leading-relaxed">
                  Kelola permohonan, jadwal, pembayaran, pengujian, dan laporan dari browser.
                </p>
              </motion.div>
              <motion.div variants={fadeInUp} className="bg-white/5 border border-white/10 rounded-xl p-3 sm:p-4 space-y-2 backdrop-blur-sm">
                <Smartphone size={18} className="text-tertiary-fixed-dim" />
                <h4 className="text-xs sm:text-sm font-bold text-white">Mobile App</h4>
                <p className="text-[10px] sm:text-[11px] text-white/50 leading-relaxed">
                  Scan QR, input data sampling, dan pantau jadwal langsung dari genggaman.
                </p>
              </motion.div>
            </motion.div>

            {/* Phone Mockup */}
            <motion.div variants={scaleIn} className="flex justify-center lg:justify-start">
              {/* Mobile: simple image */}
              <div className="lg:hidden animate-float-slow">
                <div className="device-phone w-[140px]">
                  <div className="device-screen">
                    <img src={mockupMobile} alt="Mobile App SIA Labkesda" />
                  </div>
                </div>
              </div>
              {/* Desktop: DeviceFrameset */}
              <div className="hidden lg:block animate-float-slow">
                <DeviceFrameset device="iPhone X" zoom={0.5}>
                  <img src={mockupMobile} alt="Mobile App SIA Labkesda" className="w-full h-full object-cover object-top" />
                </DeviceFrameset>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

/* ─── Stats Section ───────────────────────────────────────────────────── */

const StatsSection: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <section className="py-10 sm:py-16 bg-primary/[0.03] border-y border-outline-variant/30">
      <div ref={ref} className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={staggerContainer}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8"
        >
          {stats.map((stat) => (
            <motion.div key={stat.label} variants={fadeInUp} className="text-center space-y-1">
              <p className="font-headline-lg text-2xl sm:text-3xl lg:text-4xl font-extrabold text-primary stat-glow">
                {stat.value}
              </p>
              <p className="text-[10px] sm:text-xs text-on-surface-variant font-medium">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

/* ─── Download CTA Section ────────────────────────────────────────────── */

const DownloadCTA: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="download" className="py-16 sm:py-24 lg:py-32 relative overflow-hidden">
      {/* Gradient bg */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-cream-bg to-tertiary/5 pointer-events-none" />

      <div ref={ref} className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={staggerContainer}
          className="bg-white rounded-2xl sm:rounded-3xl border border-outline-variant shadow-2xl p-6 sm:p-8 md:p-12 text-center space-y-4 sm:space-y-6 relative overflow-hidden"
        >
          {/* Decorative gradient blob */}
          <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-primary/8 blur-[60px] pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-tertiary/6 blur-[50px] pointer-events-none" />

          <motion.div variants={fadeInUp} className="relative z-10">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-on-surface text-surface mb-3 sm:mb-4">
              <Smartphone size={24} />
            </div>
          </motion.div>

          <motion.h2 variants={fadeInUp} className="relative z-10 font-headline-lg text-xl sm:text-2xl md:text-3xl font-extrabold text-on-surface">
            Download Aplikasi Mobile
          </motion.h2>

          <motion.p variants={fadeInUp} className="relative z-10 text-xs sm:text-sm text-on-surface-variant max-w-lg mx-auto leading-relaxed">
            Unduh aplikasi SIA Labkesda untuk Android dan akses fitur sampling, QR tracking, 
            dan jadwal langsung dari smartphone Anda.
          </motion.p>

          <motion.div variants={fadeInUp} className="relative z-10 flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="https://github.com/Dafonggg/labkesda-mobile-app/releases/tag/v1.0.0"
              target="_blank"
              rel="noopener noreferrer"
              id="cta-download-btn"
              className="group inline-flex items-center justify-center gap-2 sm:gap-2.5 bg-on-surface text-surface font-semibold text-xs sm:text-sm px-5 sm:px-8 py-3 sm:py-4 rounded-xl hover:bg-on-surface/85 transition-all shadow-lg active:scale-[0.98]"
            >
              <GithubIcon size={18} />
              Download dari GitHub
              <ExternalLink size={13} className="opacity-50 group-hover:opacity-100 transition-opacity" />
            </a>
            <Link
              to="/login"
              id="cta-login-btn"
              className="group inline-flex items-center justify-center gap-2 sm:gap-2.5 bg-primary text-on-primary font-semibold text-xs sm:text-sm px-5 sm:px-8 py-3 sm:py-4 rounded-xl hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl hover:shadow-primary/15 active:scale-[0.98]"
            >
              <LogIn size={16} />
              Masuk via Web
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>

          {/* Platform info */}
          <motion.p variants={fadeInUp} className="relative z-10 text-[9px] sm:text-[10px] text-on-surface-variant/60 font-medium">
            📱 Android 8.0+ • 💾 ~120 MB • 🔄 Auto-update via GitHub Releases
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
};

/* ─── Footer ──────────────────────────────────────────────────────────── */

const Footer: React.FC = () => {
  return (
    <footer className="bg-on-surface text-white/60 py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-5 sm:gap-6 md:flex-row md:justify-between">
          {/* Left: Logo & brand */}
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-1.5 sm:p-2 rounded-lg sm:rounded-xl">
              <img src={logoSvg} alt="SIA Labkesda" className="h-5 sm:h-6 w-auto brightness-0 invert" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-white">SIA Labkesda</p>
              <p className="text-[9px] sm:text-[10px] text-white/40">UPTD Labkesda Kabupaten Purwakarta</p>
            </div>
          </div>

          {/* Center: Links */}
          <div className="flex items-center gap-4 sm:gap-6 text-[11px] sm:text-xs font-medium">
            <a href="#features" className="hover:text-white transition-colors">Fitur</a>
            <a href="#showcase" className="hover:text-white transition-colors">Platform</a>
            <a href="#download" className="hover:text-white transition-colors">Download</a>
            <Link to="/login" className="hover:text-white transition-colors">Login</Link>
          </div>

          {/* Right: ISO badge */}
          <div className="flex items-center gap-2 text-[9px] sm:text-[10px] font-medium text-white/40">
            <ShieldCheck size={13} className="text-primary-fixed-dim" />
            ISO/IEC 17025 Terakreditasi
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/10 mt-6 sm:mt-8 pt-4 sm:pt-6 text-center">
          <p className="text-[9px] sm:text-[10px] text-white/30 leading-relaxed">
            © {new Date().getFullYear()} SIA Labkesda — Sistem Informasi Analitik Laboratorium Kesehatan Daerah Kabupaten Purwakarta.
            Seluruh hak cipta dilindungi.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default LandingPage;
