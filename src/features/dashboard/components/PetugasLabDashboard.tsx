import React from 'react';
import { 
  ClipboardList, 
  MapPin, 
  Tag, 
  ChevronRight, 
  Activity,
  FlaskConical
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth';
import { usePermohonanList } from '@/hooks/usePermohonan';
import { useRegistrasiList } from '@/hooks/useRegistrasi';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

const PetugasLabDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  
  const { data: permohonanResponse, isLoading: permohonanLoading } = usePermohonanList({ unregistered: 1, per_page: 5 });
  const { data: registrasiResponse, isLoading: registrasiLoading } = useRegistrasiList();

  const permohonanList = permohonanResponse?.data || [];
  const registeredSamples = registrasiResponse?.data || [];
  
  // Calculate metrics
  const antreanMenunggu = permohonanResponse?.meta?.total || permohonanList.length;
  const sampelTerdaftarHariIni = registeredSamples.filter((s: any) => dayjs(s.created_at).isSame(dayjs(), 'day')).length;
  const menungguUji = registeredSamples.filter((s: any) => s.status === 'registered').length; // Assuming registered means waiting for testing

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-primary/90 to-primary-container p-6 rounded-2xl border border-primary/20 soft-shadow text-on-primary relative overflow-hidden group">
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 opacity-10 group-hover:scale-110 transition-transform duration-350">
          <Tag size={200} />
        </div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-white/20 text-white font-bold px-2 py-0.5 rounded-full border border-white/20">
                Petugas Lab
              </span>
            </div>
            <h1 className="font-headline-lg text-lg md:text-xl font-extrabold text-white mt-2 tracking-tight">
              Dashboard Registrasi Sampel
            </h1>
            <p className="font-body-md text-xs text-white/80 mt-1 font-medium max-w-xl leading-relaxed">
              Selamat datang, <span className="font-bold text-white">{user?.name}</span>. 
              Kelola kedatangan sampel fisik, daftarkan parameter uji, dan pantau antrean permohonan dari lapangan.
            </p>
          </div>
          <div className="flex items-center gap-1.5 bg-white/10 w-fit px-3 py-1.5 rounded-xl border border-white/10 backdrop-blur-sm self-stretch sm:self-auto justify-center">
            <Activity size={14} className="text-status-success animate-pulse" />
            <span className="text-[10px] font-bold tracking-wide uppercase text-white">Sistem Aktif</span>
          </div>
        </div>
      </div>

      {/* Metrik KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* KPI 1: Antrean Menunggu */}
        <div className="bg-white p-4 rounded-xl border border-outline-variant soft-shadow relative overflow-hidden group hover:border-status-warning transition-all cursor-pointer" onClick={() => navigate('/registrasi')}>
          <div className="absolute right-2 top-2 p-1.5 bg-status-warning/10 rounded-lg text-status-warning">
            <ClipboardList size={16} />
          </div>
          <span className="text-[9px] uppercase font-bold tracking-wider text-on-surface-variant block">Antrean Registrasi</span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="font-headline-lg text-2xl font-black text-status-warning">
              {permohonanLoading ? '...' : antreanMenunggu}
            </span>
            <span className="text-[10px] font-bold text-on-surface-variant">Permohonan</span>
          </div>
          <span className="text-[9px] text-on-surface-variant/70 block mt-2 font-medium">
            Sampel siap didaftarkan
          </span>
        </div>

        {/* KPI 2: Sampel Terdaftar Hari Ini */}
        <div className="bg-white p-4 rounded-xl border border-outline-variant soft-shadow relative overflow-hidden group hover:border-primary transition-all cursor-pointer" onClick={() => navigate('/registrasi')}>
          <div className="absolute right-2 top-2 p-1.5 bg-primary/10 rounded-lg text-primary">
            <Tag size={16} />
          </div>
          <span className="text-[9px] uppercase font-bold tracking-wider text-on-surface-variant block">Terdaftar Hari Ini</span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="font-headline-lg text-2xl font-black text-primary">
              {registrasiLoading ? '...' : sampelTerdaftarHariIni}
            </span>
            <span className="text-[10px] font-bold text-on-surface-variant">Sampel</span>
          </div>
          <span className="text-[9px] text-on-surface-variant/70 block mt-2 font-medium">
            Telah didaftarkan hari ini
          </span>
        </div>

        {/* KPI 3: Menunggu Uji */}
        <div className="bg-white p-4 rounded-xl border border-outline-variant soft-shadow relative overflow-hidden group hover:border-indigo-400 transition-all cursor-pointer" onClick={() => navigate('/pengujian')}>
          <div className="absolute right-2 top-2 p-1.5 bg-indigo-50 rounded-lg text-indigo-500">
            <FlaskConical size={16} />
          </div>
          <span className="text-[9px] uppercase font-bold tracking-wider text-on-surface-variant block">Menunggu Uji</span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="font-headline-lg text-2xl font-black text-indigo-600">
              {registrasiLoading ? '...' : menungguUji}
            </span>
            <span className="text-[10px] font-bold text-on-surface-variant">Sampel</span>
          </div>
          <span className="text-[9px] text-on-surface-variant/70 block mt-2 font-medium">
            Menunggu giliran pengujian
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Antrean Registrasi Ringkas */}
        <div className="bg-white rounded-xl border border-outline-variant soft-shadow overflow-hidden flex flex-col">
          <div className="p-4 border-b border-outline-variant bg-surface-container-low flex justify-between items-center">
            <h3 className="font-headline-md text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-2">
              <ClipboardList size={15} className="text-status-warning" />
              Antrean Permohonan Terbaru
            </h3>
            <button 
              onClick={() => navigate('/registrasi')}
              className="text-[10px] font-bold text-primary hover:underline"
            >
              Lihat Semua
            </button>
          </div>
          
          <div className="p-3 overflow-y-auto max-h-[300px] bg-surface-container-low/30">
            {permohonanLoading ? (
              <div className="p-4 text-center text-xs text-on-surface-variant animate-pulse">Memuat data...</div>
            ) : permohonanList.length === 0 ? (
              <div className="p-8 text-center text-on-surface-variant">
                <span className="block text-xs font-bold">Antrean Kosong</span>
                <span className="text-[10px]">Tidak ada permohonan yang menunggu registrasi.</span>
              </div>
            ) : (
              <div className="space-y-2">
                {permohonanList.map((p: any) => {
                  const hasSampling = !!(p.registrasi_sample?.[0]?.samples?.[0] || p.registrasi_sample?.[0]?.sample);
                  return (
                    <div key={p.id} className="bg-white p-3 rounded-xl border border-outline-variant hover:border-primary/30 transition-all soft-shadow-sm flex justify-between items-center group cursor-pointer" onClick={() => navigate('/registrasi')}>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{p.nomor_permohonan}</span>
                          {hasSampling && (
                            <MapPin size={12} className="text-status-success" />
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-on-surface mt-1.5">{p.nama_pemohon}</h4>
                        <span className="text-[10px] font-semibold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-md mt-1 inline-block">
                          {p.jenis_sample}
                        </span>
                      </div>
                      <ChevronRight size={16} className="text-on-surface-variant group-hover:text-primary transition-all group-hover:translate-x-1" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Quick Action Panel */}
        <div className="bg-white rounded-xl border border-outline-variant soft-shadow overflow-hidden p-6 flex flex-col justify-center text-center space-y-4 hover-lift">
          <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-primary">
            <Tag size={32} />
          </div>
          <div>
            <h3 className="font-headline-sm text-base font-extrabold text-on-surface">Mulai Registrasi Sampel</h3>
            <p className="text-xs text-on-surface-variant font-medium mt-1">Buka halaman registrasi untuk mendaftarkan sampel dari antrean dan mencetak label QR ISO 17025.</p>
          </div>
          <button 
            onClick={() => navigate('/registrasi')}
            className="w-full bg-primary text-white py-3 rounded-xl font-bold text-xs hover:bg-primary-container transition-all flex items-center justify-center gap-2 mt-2 soft-shadow"
          >
            Buka Workspace Registrasi <ChevronRight size={14} />
          </button>
        </div>

      </div>
    </div>
  );
};

export default PetugasLabDashboard;
