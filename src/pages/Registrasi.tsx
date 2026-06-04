import React, { useState } from 'react';
import { Tag, AlertCircle, Plus, Check, MapPin, FlaskConical, Play, Eye, Search, X, ClipboardList, Activity, Sun, Cloud, CloudRain, Compass, ExternalLink, Thermometer, Printer, Beaker } from 'lucide-react';
import { toast } from 'sonner';
import { useRegistrasiList, useRegisterSample } from '@/hooks/useRegistrasi';
import { usePermohonanList } from '@/hooks/usePermohonan';
import QrLabelPrint from '@/components/QrLabelPrint';
import dayjs from 'dayjs';

// ─── Predefined Parameter Options ────────────────────────────────────────────

interface ParamGroup {
  onSite: string[];
  laboratorium: string[];
}

const parameterOptions: Record<string, ParamGroup> = {
  'Air (Sanitasi / Minum)': {
    onSite: ['Suhu', 'Warna', 'Bau', 'Rasa', 'pH'],
    laboratorium: [
      'Kekeruhan (Turbidity)',
      'TDS (Total Dissolved Solid)',
      'Warna',
      'Bau',
      'Rasa',
      'Kesadahan',
      'Besi (Fe)',
      'Mangan (Mn)',
      'Nitrat',
      'Nitrit',
      'Fluorida',
      'Klorida',
      'Total Coliform',
      'Fecal Coliform',
      'E. coli'
    ],
  },
  'Air Limbah Industri / Domestik': {
    onSite: ['pH', 'Suhu', 'Debit'],
    laboratorium: [
      'TSS',
      'TDS',
      'BOD',
      'COD',
      'Minyak & Lemak',
      'Amonia',
      'Nitrat',
      'Nitrit',
      'Fosfat',
      'Hg',
      'Pb',
      'Cd',
      'Cr Total',
      'Cr6+',
      'Cu',
      'Zn',
      'Fe',
      'Mn',
      'Total Coliform',
      'E. coli'
    ],
  },
  'Makanan & Minuman': {
    onSite: ['Kondisi fisik', 'Warna', 'Bau'],
    laboratorium: [
      'Kadar Air',
      'Abu',
      'Protein',
      'Lemak',
      'Karbohidrat',
      'pH',
      'Pb',
      'Cd',
      'Hg',
      'As',
      'Total Plate Count (TPC)',
      'Coliform',
      'E. coli',
      'Salmonella',
      'Staphylococcus aureus',
      'Kapang & Khamir',
      'Formalin',
      'Boraks',
      'Pewarna Sintetis',
      'Pemanis Buatan'
    ],
  },
  'Kualitas Udara': {
    onSite: ['Suhu udara', 'Kelembaban'],
    laboratorium: [
      'PM2.5',
      'PM10',
      'SO₂',
      'NO₂',
      'CO',
      'O₃',
      'HC',
      'TSP',
      'Debu Total',
      'Kebisingan',
      'Getaran',
      'Pencahayaan',
      'Temperatur',
      'Kelembaban',
      'NOx',
      'Opasitas',
      'Partikulat'
    ],
  },
  'Tanah & Sedimen': {
    onSite: ['Suhu tanah', 'pH tanah'],
    laboratorium: [
      'Tekstur',
      'Kadar Air',
      'Berat Jenis',
      'pH Tanah',
      'C Organik',
      'Nitrogen Total',
      'Fosfor',
      'Kalium',
      'Pb',
      'Cd',
      'Hg',
      'Cr',
      'As'
    ],
  },
  'Swab Lingkungan': {
    onSite: ['Kondisi kebersihan'],
    laboratorium: [
      'Total Plate Count (TPC)',
      'Coliform',
      'E. coli',
      'Salmonella',
      'Listeria',
      'Staphylococcus aureus',
      'Jamur & Khamir'
    ],
  },
};

const REGULASI_MAP: Record<string, string> = {
  'Air (Sanitasi / Minum)': 'Permenkes Air Minum & Higiene Sanitasi',
  'Air Limbah Industri / Domestik': 'Permen LHK Air Limbah',
  'Makanan & Minuman': 'BPOM, SNI, Permenkes',
  'Kualitas Udara': 'PP 22 Tahun 2021',
  'Tanah & Sedimen': 'PP 22 Tahun 2021',
  'Swab Lingkungan': 'Permenkes, SNI, HACCP',
};

// ─── Main Component ──────────────────────────────────────────────────────────

const Registrasi: React.FC = () => {
  const [sampleName, setSampleName] = useState('');
  const [sampleSource, setSampleSource] = useState('');
  const [category, setCategory] = useState('Air (Sanitasi / Minum)');
  const [selectedParams, setSelectedParams] = useState<string[]>([]);
  const [customParams, setCustomParams] = useState<string[]>([]);
  const [newCustomParam, setNewCustomParam] = useState('');
  
  // New States
  const [queueTab, setQueueTab] = useState<'belum' | 'sudah'>('belum');
  const [searchQuery, setSearchQuery] = useState('');
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<any>(null);
  const [detailType, setDetailType] = useState<'permohonan' | 'sample'>('permohonan');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // QR Label Print state
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printData, setPrintData] = useState<{
    kode_sample: string;
    nomor_registrasi: string;
    jenis_sample: string;
    tanggal_registrasi: string;
    qr_token: string;
    tracking_url: string;
  } | null>(null);

  const { data: response } = useRegistrasiList();
  const { data: permohonanResponse } = usePermohonanList({ unregistered: 1, per_page: 100 });
  const registerMutation = useRegisterSample();

  const registeredSamples = response?.data || [];
  const permohonanList = permohonanResponse?.data || [];

  const selectedPermohonanData = permohonanList.find((p: any) => p.id === sampleSource);
  const activeSample = selectedPermohonanData?.registrasi_sample?.[0]?.samples?.[0] || selectedPermohonanData?.registrasi_sample?.[0]?.sample;

  const currentParamGroup = parameterOptions[category] || parameterOptions['Air (Sanitasi / Minum)'];
  // Only laboratorium params are selectable — on-site data comes from mobile + custom params
  const allParams = [...currentParamGroup.laboratorium, ...customParams];

  const handleSelectPermohonan = (val: string) => {
    setSampleSource(val);
    const selectedPermohonan = permohonanList.find((p: any) => p.id === val);
    if (selectedPermohonan) {
      const matchedCategory = Object.keys(parameterOptions).find(
        cat => cat.toLowerCase() === selectedPermohonan.jenis_sample.toLowerCase()
      );
      const cat = matchedCategory || 'Air (Sanitasi / Minum)';
      setCategory(cat);
      setCustomParams([]);

      const activeReg = selectedPermohonan.registrasi_sample?.[0];
      const activeSample = activeReg?.samples?.[0] || activeReg?.sample;

      // Pre-fill sample name from mobile data if available
      if (activeSample?.lokasi_pengambilan) {
        setSampleName(activeSample.lokasi_pengambilan);
      } else {
        setSampleName('');
      }

      // Do NOT auto-select any on-site params — those are handled by mobile.
      // Start with empty lab params selection so user can choose explicitly.
      setSelectedParams([]);
    } else {
      setSampleName('');
      setSelectedParams([]);
      setCustomParams([]);
    }
  };

  const handleParamToggle = (param: string) => {
    setSelectedParams((prev: string[]) => 
      prev.includes(param) ? prev.filter((p: string) => p !== param) : [...prev, param]
    );
  };

  const handleSelectAll = (group: 'onSite' | 'laboratorium' | 'all') => {
    if (group === 'all') {
      setSelectedParams(allParams);
    } else {
      const groupParams = group === 'laboratorium' 
        ? [...currentParamGroup.laboratorium, ...customParams] 
        : currentParamGroup[group];
      const allGroupSelected = groupParams.every(p => selectedParams.includes(p));
      if (allGroupSelected) {
        setSelectedParams(prev => prev.filter(p => !groupParams.includes(p)));
      } else {
        setSelectedParams(prev => [...new Set([...prev, ...groupParams])]);
      }
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sampleName) {
      toast.error('Silakan isi Nama Sampel.');
      return;
    }
    if (!sampleSource) {
      toast.error('Silakan pilih Permohonan.');
      return;
    }
    if (selectedParams.length === 0) {
      toast.error('Pilih minimal satu parameter pengujian.');
      return;
    }

    const payload = {
      permohonan_id: sampleSource,
      jenis_sample: category,
      nama_sample: sampleName,
      parameters: selectedParams,
    };

    registerMutation.mutate(
      payload,
      {
        onSuccess: (result: any) => {
          setSampleName('');
          setSampleSource('');
          setSelectedParams([]);
          setCustomParams([]);
          setQueueTab('sudah');

          // Open QR label print modal with returned data
          const regData = result?.data;
          if (regData?.qr_token) {
            setPrintData({
              kode_sample: regData.kode_sample || 'N/A',
              nomor_registrasi: regData.nomor_registrasi || 'N/A',
              jenis_sample: category,
              tanggal_registrasi: regData.tanggal_registrasi || new Date().toISOString(),
              qr_token: regData.qr_token,
              tracking_url: regData.tracking_url || `${window.location.origin}/tracking/${regData.qr_token}`,
            });
            setPrintModalOpen(true);
          }
        },
      }
    );
  };

  const renderMobileDataReview = (activeSample: any) => {
    let unit = activeSample.jumlah_sample_unit;
    let detail = activeSample.jumlah_sample_detail;
    let parsedCatatan: any = {};
    try {
      parsedCatatan = typeof activeSample.catatan === 'string' 
        ? JSON.parse(activeSample.catatan) 
        : activeSample.catatan || {};
      if (!unit) {
        unit = parsedCatatan.jumlah_sample_unit;
        detail = parsedCatatan.jumlah_sample_detail;
      }
    } catch (e) {
      parsedCatatan = { catatan_petugas: activeSample.catatan };
    }

    const weatherIcon = () => {
      const c = (activeSample.cuaca || '').toLowerCase();
      if (c.includes('cerah')) return <Sun size={14} className="text-amber-500 fill-amber-500/20" />;
      if (c.includes('hujan')) return <CloudRain size={14} className="text-blue-500" />;
      return <Cloud size={14} className="text-gray-500" />;
    };

    const conditionBadgeColor = () => {
      const cond = (activeSample.kondisi_sample || '').toLowerCase();
      if (cond === 'baik') return 'bg-status-success/10 text-status-success border-status-success/20';
      if (cond === 'rusak') return 'bg-status-error/10 text-status-error border-status-error/20';
      return 'bg-status-warning/10 text-status-warning border-status-warning/20';
    };

    const mapsUrl = activeSample.latitude && activeSample.longitude
      ? `https://www.google.com/maps/search/?api=1&query=${activeSample.latitude},${activeSample.longitude}`
      : null;

    return (
      <div className="space-y-4 bg-white p-4 rounded-xl border border-outline-variant soft-shadow-sm">
        <div className="flex items-center justify-between border-b border-outline-variant pb-2.5">
          <div className="flex items-center gap-1.5">
            <MapPin size={14} className="text-status-success" />
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
              Data Sampling Lapangan (On-Site)
            </span>
          </div>
          <span className="text-[9px] font-bold text-status-success bg-status-success/8 px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-status-success/15 animate-pulse">
            <Check size={10} /> Terverifikasi dari Mobile
          </span>
        </div>

        {/* Media Preview / Photos Grid */}
        {activeSample.files && activeSample.files.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider block">Foto Lapangan ({activeSample.files.length})</span>
            <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
              {activeSample.files.map((file: any) => {
                const imgUrl = `${import.meta.env.VITE_API_URL.replace(/\/api(\/v\d+)?$/, '')}/storage/${file.file_path}`;
                return (
                  <div 
                    key={file.id} 
                    onClick={() => setPreviewImage(imgUrl)}
                    className="relative h-20 w-20 rounded-lg overflow-hidden border border-outline-variant shrink-0 cursor-pointer group"
                  >
                    <img 
                      src={imgUrl} 
                      alt={file.file_name}
                      className="h-full w-full object-cover group-hover:scale-105 transition-all duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://placehold.co/100x100?text=No+Image';
                      }}
                    />
                    <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Eye size={14} className="text-white drop-shadow-sm" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Key-Value Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* Lokasi */}
          <div className="bg-surface-container-lowest p-3 rounded-lg border border-outline-variant/60 flex gap-2.5 items-start">
            <Compass size={15} className="text-primary mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <span className="block text-[9px] font-bold text-on-surface-variant uppercase tracking-wider">Lokasi Pengambilan</span>
              <span className="font-bold text-on-surface line-clamp-2 mt-0.5">{activeSample.lokasi_pengambilan || '-'}</span>
              {activeSample.latitude && activeSample.longitude && (
                <div className="flex items-center gap-1.5 mt-1 pt-1 border-t border-outline-variant/30">
                  <span className="text-[10px] text-on-surface-variant/80 font-medium">
                    {Number(activeSample.latitude).toFixed(6)}, {Number(activeSample.longitude).toFixed(6)}
                  </span>
                  {mapsUrl && (
                    <a 
                      href={mapsUrl} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-[10px] text-primary hover:underline font-bold flex items-center gap-0.5 shrink-0 ml-auto"
                    >
                      Buka Peta <ExternalLink size={9} />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Cuaca & Suhu */}
          <div className="bg-surface-container-lowest p-3 rounded-lg border border-outline-variant/60 flex gap-2.5 items-start">
            <Thermometer size={15} className="text-status-error mt-0.5 shrink-0" />
            <div>
              <span className="block text-[9px] font-bold text-on-surface-variant uppercase tracking-wider">Cuaca & Suhu</span>
              <div className="flex items-center gap-1.5 mt-1 font-bold text-on-surface">
                {weatherIcon()}
                <span className="capitalize">{activeSample.cuaca || 'Tidak diketahui'}</span>
                {activeSample.suhu && (
                  <>
                    <span className="text-on-surface-variant/40">•</span>
                    <span>{activeSample.suhu}°C</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Kondisi Sampel */}
          <div className="bg-surface-container-lowest p-3 rounded-lg border border-outline-variant/60 flex gap-2.5 items-start">
            <AlertCircle size={15} className="text-primary mt-0.5 shrink-0" />
            <div>
              <span className="block text-[9px] font-bold text-on-surface-variant uppercase tracking-wider">Kondisi Sampel</span>
              <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 mt-1 border rounded-md capitalize ${conditionBadgeColor()}`}>
                {(activeSample.kondisi_sample || 'baik').replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Volume / Jumlah */}
          <div className="bg-surface-container-lowest p-3 rounded-lg border border-outline-variant/60 flex gap-2.5 items-start">
            <ClipboardList size={15} className="text-primary mt-0.5 shrink-0" />
            <div>
              <span className="block text-[9px] font-bold text-on-surface-variant uppercase tracking-wider">Volume & Jumlah</span>
              <span className="font-extrabold text-primary block mt-1 text-xs">
                {activeSample.jumlah_sample || 1} {unit || 'Wadah'} {detail ? `(${detail})` : ''}
              </span>
            </div>
          </div>

          {/* Metode Pengambilan Sampel */}
          {activeSample.metode_pengambilan && (
            <div className="bg-surface-container-lowest p-3 rounded-lg border border-outline-variant/60 flex gap-2.5 items-start col-span-1 sm:col-span-2">
              <Beaker size={15} className="text-primary mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="block text-[9px] font-bold text-on-surface-variant uppercase tracking-wider">Metode Pengambilan Sampel</span>
                <span className="font-bold text-on-surface block mt-1">{activeSample.metode_pengambilan}</span>
              </div>
            </div>
          )}
        </div>

        {/* Report / Field Notes Callout */}
        {(parsedCatatan.kondisi_lingkungan || parsedCatatan.catatan_petugas) && (
          <div className="bg-primary/5 border border-primary/10 rounded-xl p-3.5 space-y-2">
            {parsedCatatan.kondisi_lingkungan && (
              <div>
                <span className="block text-[9px] font-bold text-primary uppercase tracking-wider">Kondisi Lingkungan</span>
                <p className="text-xs text-on-surface mt-0.5 font-medium">{parsedCatatan.kondisi_lingkungan}</p>
              </div>
            )}
            {parsedCatatan.catatan_petugas && (
              <div className={parsedCatatan.kondisi_lingkungan ? 'border-t border-primary/10 pt-2 mt-2' : ''}>
                <span className="block text-[9px] font-bold text-primary uppercase tracking-wider">Catatan Petugas Lapangan</span>
                <p className="text-xs text-on-surface mt-0.5 italic font-medium">"{parsedCatatan.catatan_petugas}"</p>
              </div>
            )}
          </div>
        )}


      </div>
    );
  };

  const renderParamSection = (title: string, icon: React.ReactNode, params: string[], groupKey: 'onSite' | 'laboratorium') => {
    const allSelected = params.every(p => selectedParams.includes(p));
    const someSelected = params.some(p => selectedParams.includes(p));
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {icon}
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">{title}</span>
            <span className="text-[9px] font-semibold text-on-surface-variant/60 bg-surface-container px-1.5 py-0.5 rounded-full">
              {params.filter(p => selectedParams.includes(p)).length}/{params.length}
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleSelectAll(groupKey)}
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-all cursor-pointer ${
              allSelected 
                ? 'bg-primary/10 text-primary' 
                : someSelected 
                ? 'bg-status-warning/10 text-status-warning' 
                : 'bg-surface-container text-on-surface-variant hover:bg-primary/5 hover:text-primary'
            }`}
          >
            {allSelected ? 'Hapus Semua' : 'Pilih Semua'}
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {params.map((param) => {
            const isSelected = selectedParams.includes(param);
            return (
              <button
                key={param}
                type="button"
                onClick={() => handleParamToggle(param)}
                className={`p-2.5 rounded-lg border text-left text-xs transition-all flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-primary/10 border-primary text-primary font-bold'
                    : 'bg-white border-outline-variant text-on-surface hover:border-primary/50'
                }`}
              >
                <span>{param}</span>
                {isSelected && <Check size={14} />}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const openDetailModal = (data: any, type: 'permohonan' | 'sample') => {
    setSelectedDetail(data);
    setDetailType(type);
    setDetailModalOpen(true);
  };

  const filteredPermohonan = permohonanList.filter((p: any) => 
    p.nomor_permohonan.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.nama_pemohon.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.instansi && p.instansi.toLowerCase().includes(searchQuery.toLowerCase())) ||
    p.jenis_sample.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredRegistered = registeredSamples.filter((s: any) =>
    (s.kode_sample && s.kode_sample.toLowerCase().includes(searchQuery.toLowerCase())) ||
    s.nomor_registrasi.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.nama_sample && s.nama_sample.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const antreanMenunggu = permohonanList.length;
  const sampelTerdaftar = registeredSamples.length;
  const samplingLapangan = permohonanList.filter((p: any) => p.registrasi_sample?.[0]?.samples?.[0] || p.registrasi_sample?.[0]?.sample).length;

  return (
    <div className="space-y-6 relative">
      <div className="border-b border-outline-variant pb-4">
        <h1 className="font-headline-lg text-lg md:text-xl font-extrabold text-on-surface">
          Registrasi & Kodifikasi Sampel
        </h1>
        <p className="font-body-md text-xs text-on-surface-variant mt-1 font-medium">
          Daftarkan sampel fisik dari lapangan, tentukan parameter uji, dan kelola antrean registrasi.
        </p>
      </div>

      {/* KPI Banners */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-outline-variant soft-shadow flex items-center gap-4">
          <div className="bg-status-warning/10 p-3 rounded-lg text-status-warning">
            <ClipboardList size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-on-surface-variant uppercase">Antrean Menunggu</p>
            <h4 className="text-xl font-extrabold text-on-surface">{antreanMenunggu}</h4>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-outline-variant soft-shadow flex items-center gap-4">
          <div className="bg-primary/10 p-3 rounded-lg text-primary">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-on-surface-variant uppercase">Sampel Terdaftar</p>
            <h4 className="text-xl font-extrabold text-on-surface">{sampelTerdaftar}</h4>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-outline-variant soft-shadow flex items-center gap-4">
          <div className="bg-status-success/10 p-3 rounded-lg text-status-success">
            <MapPin size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-on-surface-variant uppercase">Sampling Lapangan</p>
            <h4 className="text-xl font-extrabold text-on-surface">{samplingLapangan}</h4>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Queue Center (Col 5) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-white rounded-xl border border-outline-variant soft-shadow overflow-hidden flex flex-col h-[750px]">
            {/* Header & Tabs */}
            <div className="bg-surface-container-low p-4 border-b border-outline-variant shrink-0">
              <h3 className="font-headline-md text-sm font-bold text-on-surface mb-3 flex items-center gap-2">
                <ClipboardList size={16} className="text-primary" />
                Antrean Registrasi
              </h3>
              
              <div className="relative mb-4">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                <input 
                  type="text" 
                  placeholder="Cari permohonan, nama pemohon, instansi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-outline-variant focus:border-primary outline-none transition-all"
                />
              </div>

              <div className="flex bg-surface-container rounded-lg p-1">
                <button 
                  onClick={() => setQueueTab('belum')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${queueTab === 'belum' ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
                >
                  Belum Registrasi ({antreanMenunggu})
                </button>
                <button 
                  onClick={() => setQueueTab('sudah')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${queueTab === 'sudah' ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
                >
                  Sudah Registrasi ({sampelTerdaftar})
                </button>
              </div>
            </div>

            {/* List Content */}
            <div className="flex-1 overflow-y-auto p-2 bg-surface-container-low/30 custom-scrollbar">
              {queueTab === 'belum' ? (
                <div className="space-y-2">
                  {filteredPermohonan.length === 0 ? (
                    <div className="text-center p-6 text-xs text-on-surface-variant">Tidak ada antrean ditemukan.</div>
                  ) : (
                    filteredPermohonan.map((p: any) => {
                      const hasSampling = !!(p.registrasi_sample?.[0]?.samples?.[0] || p.registrasi_sample?.[0]?.sample);
                      return (
                        <div key={p.id} className="bg-white p-3 rounded-xl border border-outline-variant hover:border-primary/30 transition-all soft-shadow-sm flex flex-col gap-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{p.nomor_permohonan}</span>
                              <h4 className="text-sm font-bold text-on-surface mt-1.5 line-clamp-1" title={p.nama_pemohon}>{p.nama_pemohon}</h4>
                              <p className="text-[11px] text-on-surface-variant line-clamp-1">{p.instansi || 'Personal'}</p>
                            </div>
                            {hasSampling && (
                              <div className="bg-status-success/10 text-status-success p-1.5 rounded-full" title="Data Lapangan Tersedia">
                                <MapPin size={14} />
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between mt-1 pt-2 border-t border-outline-variant/50">
                            <span className="text-[10px] font-semibold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-md">
                              {p.jenis_sample}
                            </span>
                            <div className="flex gap-1.5">
                              <button 
                                type="button"
                                onClick={() => openDetailModal(p, 'permohonan')}
                                className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-md transition-all cursor-pointer"
                                title="Detail Permohonan"
                              >
                                <Eye size={14} />
                              </button>
                              <button 
                                type="button"
                                onClick={() => handleSelectPermohonan(p.id)}
                                className="flex items-center gap-1 text-[10px] font-bold bg-primary text-white px-2.5 py-1.5 rounded-md hover:bg-primary-container hover:text-on-primary transition-all cursor-pointer"
                              >
                                <Play size={12} className="fill-current" />
                                Mulai Registrasi
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredRegistered.length === 0 ? (
                    <div className="text-center p-6 text-xs text-on-surface-variant">Belum ada sampel terdaftar.</div>
                  ) : (
                    filteredRegistered.map((s: any) => (
                      <div key={s.id} className="bg-white p-3 rounded-xl border border-outline-variant hover:border-primary/30 transition-all soft-shadow-sm flex flex-col gap-2">
                         <div className="flex justify-between items-start">
                            <div>
                              <span className="text-[10px] font-bold text-on-surface bg-surface-container px-2 py-0.5 rounded-full">{s.nomor_registrasi}</span>
                              <h4 className="text-sm font-bold text-primary mt-1.5">{s.kode_sample || 'Proses...'}</h4>
                              <p className="text-[11px] text-on-surface-variant line-clamp-1 mt-0.5">{s.nama_sample || '-'}</p>
                            </div>
                            <span className="text-[10px] font-bold text-status-success bg-status-success/10 px-2 py-0.5 rounded-md shrink-0">
                              {s.status}
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between mt-1 pt-2 border-t border-outline-variant/50">
                            <span className="text-[10px] font-medium text-on-surface-variant">
                              {dayjs(s.created_at).format('DD MMM YYYY, HH:mm')}
                            </span>
                            <div className="flex gap-1.5">
                              {s.qr_token && (
                                <button 
                                  type="button"
                                  onClick={() => {
                                    setPrintData({
                                      kode_sample: s.kode_sample || 'N/A',
                                      nomor_registrasi: s.nomor_registrasi || 'N/A',
                                      jenis_sample: s.sample?.jenis_sample || s.samples?.[0]?.jenis_sample || '-',
                                      tanggal_registrasi: s.tanggal_registrasi || s.created_at,
                                      qr_token: s.qr_token,
                                      tracking_url: s.tracking_url || `${window.location.origin}/tracking/${s.qr_token}`,
                                    });
                                    setPrintModalOpen(true);
                                  }}
                                  className="flex items-center gap-1 text-[10px] font-bold text-status-success bg-status-success/10 px-2 py-1.5 rounded-md hover:bg-status-success/20 transition-all cursor-pointer"
                                >
                                  <Printer size={12} />
                                  Cetak QR
                                </button>
                              )}
                              <button 
                                type="button"
                                onClick={() => openDetailModal(s, 'sample')}
                                className="flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 px-2 py-1.5 rounded-md hover:bg-primary/20 transition-all cursor-pointer"
                              >
                                <Eye size={12} />
                                Detail
                              </button>
                            </div>
                          </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Registration Form Workspace (Col 7) */}
        <div className="lg:col-span-7 space-y-6">
          {sampleSource && (
            <div className="bg-primary/10 border border-primary/20 p-3 rounded-xl flex items-center justify-between animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2">
                <div className="bg-primary text-white p-1.5 rounded-full">
                  <Play size={14} className="fill-current" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-primary">Workspace Aktif</p>
                  <p className="text-[10px] text-on-surface-variant">Mendaftar sampel untuk permohonan terpilih.</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => handleSelectPermohonan('')}
                className="text-xs font-bold text-status-error hover:underline px-2 cursor-pointer"
              >
                Batal
              </button>
            </div>
          )}

          <form onSubmit={handleRegister} className="bg-white p-6 rounded-xl border border-outline-variant soft-shadow space-y-5">
            <h3 className="font-headline-md text-sm font-bold text-primary flex items-center gap-1.5 border-b border-outline-variant pb-3 mb-2">
              <Tag size={16} />
              Formulir Pendaftaran Sampel
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block font-label-sm text-[11px] font-bold text-on-surface-variant uppercase">Pilih Permohonan *</label>
                <select
                  value={sampleSource}
                  onChange={(e) => handleSelectPermohonan(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-outline-variant bg-surface-container-low text-xs text-on-surface outline-none focus:border-primary focus:bg-white transition-all cursor-pointer font-medium"
                >
                  <option value="">-- Pilih Permohonan --</option>
                  {permohonanList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nomor_permohonan} - {p.nama_pemohon} ({p.jenis_sample})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block font-label-sm text-[11px] font-bold text-on-surface-variant uppercase">Nama Sampel *</label>
                <input
                  type="text"
                  placeholder="Contoh: Air Sungai Citarum"
                  value={sampleName}
                  onChange={(e) => setSampleName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-outline-variant bg-surface-container-low text-xs text-on-surface outline-none focus:border-primary focus:bg-white transition-all"
                />
              </div>
            </div>

            {sampleSource && (() => {
              const activeSample = selectedPermohonanData?.registrasi_sample?.[0]?.samples?.[0] || selectedPermohonanData?.registrasi_sample?.[0]?.sample;
              if (activeSample) {
                return (
                  <div className="p-2.5 bg-status-success/10 border border-status-success/20 rounded-lg flex items-center gap-2 text-[11px] text-status-success font-semibold">
                    <Check size={14} className="shrink-0" />
                    <span>Data sampling lapangan dari mobile terdeteksi. Silakan pilih parameter lab yang akan diuji.</span>
                  </div>
                );
              }
              return null;
            })()}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block font-label-sm text-[11px] font-bold text-on-surface-variant uppercase">Jenis / Kategori Sampel</label>
                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    setSelectedParams([]);
                    setCustomParams([]);
                  }}
                  className="w-full px-3 py-2.5 rounded-lg border border-outline-variant bg-surface-container-low text-xs text-on-surface outline-none focus:border-primary focus:bg-white transition-all"
                >
                  <option value="Air (Sanitasi / Minum)">Air (Sanitasi / Minum)</option>
                  <option value="Air Limbah Industri / Domestik">Air Limbah Industri / Domestik</option>
                  <option value="Makanan & Minuman">Makanan & Minuman</option>
                  <option value="Kualitas Udara">Kualitas Udara</option>
                  <option value="Tanah & Sedimen">Tanah & Sedimen</option>
                  <option value="Swab Lingkungan">Swab Lingkungan</option>
                </select>
              </div>
              
              <div className="bg-primary/5 p-3 rounded-lg border border-primary/10 flex flex-col gap-2 text-[11px] text-primary leading-normal justify-between">
                <div className="flex items-start gap-2">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>Sistem otomatis mencocokkan baku mutu standar nasional untuk parameter yang dipilih.</span>
                </div>
                <div className="pt-1.5 border-t border-primary/10 flex items-center justify-between text-[10px]">
                  <span className="font-semibold text-primary/80">Acuan Regulasi Umum:</span>
                  <span className="font-extrabold bg-primary/10 px-2 py-0.5 rounded text-[10px]">
                    {REGULASI_MAP[category] || '-'}
                  </span>
                </div>
              </div>
            </div>

            {/* Parameter Selector */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block font-label-sm text-[11px] font-bold text-on-surface-variant uppercase">Pilih Parameter Pengujian Uji *</label>
                <span className="text-[10px] font-bold text-primary bg-primary/8 px-2.5 py-1 rounded-full">
                  {selectedParams.length} / {allParams.length} dipilih
                </span>
              </div>

              <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant space-y-5">
                {/* Mobile data review card — only shown when on-site data synced from mobile */}
                {activeSample && (
                  <>
                    {renderMobileDataReview(activeSample)}
                    <div className="border-t border-outline-variant" />
                  </>
                )}

                {/* Lab parameters — always shown */}
                {renderParamSection(
                  'Parameter Uji Laboratorium',
                  <FlaskConical size={13} className="text-primary" />,
                  [...currentParamGroup.laboratorium, ...customParams],
                  'laboratorium'
                )}

                {/* Tambah Parameter Kustom Section */}
                <div className="border-t border-outline-variant/60 pt-4 mt-4 space-y-2">
                  <label className="block text-[11px] font-bold text-on-surface-variant uppercase">
                    Parameter Kustom Tambahan
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Nama parameter kustom (contoh: Salinitas Air)"
                      value={newCustomParam}
                      onChange={(e) => setNewCustomParam(e.target.value)}
                      className="flex-1 px-3 py-2.5 text-xs rounded-lg border border-outline-variant focus:border-primary outline-none bg-white transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const name = newCustomParam.trim();
                        if (!name) {
                          toast.error('Masukkan nama parameter.');
                          return;
                        }
                        if (currentParamGroup.laboratorium.includes(name) || customParams.includes(name)) {
                          toast.error('Parameter sudah terdaftar.');
                          return;
                        }
                        setCustomParams((prev) => [...prev, name]);
                        setSelectedParams((prev) => [...prev, name]);
                        setNewCustomParam('');
                        toast.success(`Parameter kustom "${name}" ditambahkan.`);
                      }}
                      className="bg-primary text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-primary-container transition-all cursor-pointer shadow-sm"
                    >
                      Tambah
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={registerMutation.isPending}
              className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary font-label-md text-xs font-semibold py-3 rounded-xl hover-lift hover:bg-primary-container transition-all soft-shadow cursor-pointer disabled:opacity-80 mt-4"
            >
              <Plus size={15} />
              {registerMutation.isPending ? 'Mendaftarkan...' : 'Daftarkan Sampel & Cetak Barcode Label'}
            </button>
          </form>
          {/* Photo Preview Modal */}
          {previewImage && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 backdrop-blur-md bg-black/75 animate-backdrop-fade" onClick={() => setPreviewImage(null)}></div>
              <div className="relative z-10 max-w-4xl max-h-[85vh] flex flex-col items-center animate-modal-zoom">
                <button 
                  type="button"
                  onClick={() => setPreviewImage(null)}
                  className="absolute -top-12 right-0 p-2 text-white/85 hover:text-white hover:bg-white/10 rounded-full transition-all cursor-pointer"
                >
                  <X size={24} />
                </button>
                <img 
                  src={previewImage} 
                  alt="Foto Lapangan Detail" 
                  className="max-w-full max-h-[80vh] object-contain rounded-xl border border-white/10 shadow-2xl"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=Foto+Tidak+Tersedia';
                  }}
                />
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Detail Modal */}
      {detailModalOpen && selectedDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 backdrop-blur-sm bg-black/45 animate-backdrop-fade" onClick={() => setDetailModalOpen(false)}></div>
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl relative z-10 flex flex-col max-h-[90vh] animate-modal-zoom border border-outline-variant">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-outline-variant bg-surface-container-low/30 rounded-t-2xl">
              <div>
                <h3 className="font-headline-sm text-base font-bold text-on-surface">
                  {detailType === 'permohonan' ? 'Detail Permohonan' : 'Detail Sampel Terdaftar'}
                </h3>
                <p className="text-[11px] text-on-surface-variant">
                  {detailType === 'permohonan' ? selectedDetail.nomor_permohonan : selectedDetail.kode_sample}
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setDetailModalOpen(false)}
                className="p-2 text-on-surface-variant hover:text-status-error hover:bg-status-error/10 rounded-full transition-all cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto custom-scrollbar flex-1 space-y-6">
              {detailType === 'permohonan' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="block text-[10px] text-on-surface-variant uppercase font-bold">Nama Pemohon</span>
                      <span className="font-medium text-sm text-on-surface">{selectedDetail.nama_pemohon}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-on-surface-variant uppercase font-bold">Instansi</span>
                      <span className="font-medium text-sm text-on-surface">{selectedDetail.instansi || '-'}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-on-surface-variant uppercase font-bold">Kontak</span>
                      <span className="font-medium text-sm text-on-surface">{selectedDetail.no_hp || selectedDetail.email || '-'}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-on-surface-variant uppercase font-bold">Jenis Sampel</span>
                      <span className="font-medium text-sm text-on-surface">{selectedDetail.jenis_sample}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="block text-[10px] text-on-surface-variant uppercase font-bold">Alamat</span>
                      <span className="font-medium text-sm text-on-surface">{selectedDetail.alamat || '-'}</span>
                    </div>
                  </div>

                  {/* Sampling Data if available */}
                  {(() => {
                    const activeReg = selectedDetail.registrasi_sample?.[0];
                    const sampleData = activeReg?.samples?.[0] || activeReg?.sample;
                    if (sampleData) {
                      return (
                        <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant">
                          <h4 className="font-bold text-xs text-primary mb-3 flex items-center gap-2">
                            <MapPin size={14} /> Data Sampling Lapangan
                          </h4>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-on-surface-variant font-medium">Waktu:</span> {dayjs(sampleData.waktu_pengambilan).format('DD MMM YYYY HH:mm')}
                            </div>
                            <div>
                              <span className="text-on-surface-variant font-medium">Suhu/Cuaca:</span> {sampleData.suhu ? `${sampleData.suhu}°C` : '-'} / {sampleData.cuaca || '-'}
                            </div>
                            {sampleData.metode_pengambilan && (
                              <div className="col-span-2">
                                <span className="text-on-surface-variant font-medium">Metode Pengambilan:</span> {sampleData.metode_pengambilan}
                              </div>
                            )}
                            {(() => {
                              let unit = sampleData.jumlah_sample_unit;
                              let detail = sampleData.jumlah_sample_detail;
                              if (!unit && sampleData.catatan) {
                                try {
                                  const parsed = typeof sampleData.catatan === 'string' ? JSON.parse(sampleData.catatan) : sampleData.catatan;
                                  unit = parsed.jumlah_sample_unit;
                                  detail = parsed.jumlah_sample_detail;
                                } catch (e) {}
                              }
                              return (
                                <div>
                                  <span className="text-on-surface-variant font-medium">Volume/Jumlah:</span> {sampleData.jumlah_sample || 1} {unit || 'Wadah'} {detail ? `(${detail})` : ''}
                                </div>
                              );
                            })()}
                            {(() => {
                              try {
                                const parsed = typeof sampleData.catatan === 'string' ? JSON.parse(sampleData.catatan) : sampleData.catatan;
                                return (
                                  <>
                                    {parsed?.kondisi_lingkungan && (
                                      <div className="col-span-2">
                                        <span className="text-on-surface-variant font-medium">Kondisi Lingkungan:</span> {parsed.kondisi_lingkungan}
                                      </div>
                                    )}
                                    <div className="col-span-2">
                                      <span className="text-on-surface-variant font-medium">Catatan Petugas:</span> {parsed?.catatan_petugas || 'Tidak ada'}
                                    </div>
                                  </>
                                );
                              } catch {
                                return (
                                  <div className="col-span-2">
                                    <span className="text-on-surface-variant font-medium">Catatan:</span> {sampleData.catatan || 'Tidak ada'}
                                  </div>
                                );
                              }
                            })()}
                          </div>
                        </div>
                      )
                    }
                    return null;
                  })()}
                </>
              )}

              {detailType === 'sample' && (
                <>
                  <div className="flex justify-between items-center bg-primary/5 p-4 rounded-xl border border-primary/10">
                    <div>
                      <span className="block text-[10px] text-primary uppercase font-bold">Kode Sampel</span>
                      <span className="font-extrabold text-xl text-primary">{selectedDetail.kode_sample}</span>
                    </div>
                    <div className="text-right">
                      <span className="block text-[10px] text-on-surface-variant uppercase font-bold">Status</span>
                      <span className="font-bold text-sm text-status-success">{selectedDetail.status}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="block text-[10px] text-on-surface-variant uppercase font-bold">Nomor Registrasi</span>
                      <span className="font-medium text-sm text-on-surface">{selectedDetail.nomor_registrasi}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-on-surface-variant uppercase font-bold">Nama Sampel</span>
                      <span className="font-medium text-sm text-on-surface">{selectedDetail.nama_sample || '-'}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="block text-[10px] text-on-surface-variant uppercase font-bold">Waktu Pendaftaran</span>
                      <span className="font-medium text-sm text-on-surface">{dayjs(selectedDetail.created_at).format('DD MMMM YYYY, HH:mm')}</span>
                    </div>
                  </div>

                  {selectedDetail.parameters && selectedDetail.parameters.length > 0 && (
                    <div>
                      <span className="block text-[10px] text-on-surface-variant uppercase font-bold mb-2">Parameter Diuji ({selectedDetail.parameters.length})</span>
                      <div className="flex flex-wrap gap-2">
                        {selectedDetail.parameters.map((p: any, i: number) => (
                          <span key={i} className="text-[11px] font-medium bg-surface-container px-2 py-1 rounded-md text-on-surface border border-outline-variant/50">
                            {p.parameter_name || p}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {selectedDetail.qr_token && (
                    <div className="flex justify-center mt-4">
                      <div className="flex flex-col items-center p-4 bg-surface-container border border-outline-variant border-dashed rounded-xl">
                        <div className="bg-white p-2 rounded-lg soft-shadow border border-outline-variant mb-2">
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(selectedDetail.tracking_url || `${window.location.origin}/tracking/${selectedDetail.qr_token}`)}`}
                            alt="QR Code"
                            className="w-20 h-20"
                          />
                        </div>
                        <div className="text-center space-y-0.5">
                          <div className="font-bold text-xs text-primary">{selectedDetail.kode_sample}</div>
                          <div className="font-mono text-[9px] text-on-surface-variant">{selectedDetail.qr_token}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-outline-variant flex justify-end gap-2 bg-surface-container-low/30 rounded-b-2xl">
              {detailType === 'permohonan' && (
                <button 
                  type="button"
                  onClick={() => {
                    handleSelectPermohonan(selectedDetail.id);
                    setDetailModalOpen(false);
                  }}
                  className="bg-primary text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-primary-container transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Play size={14} className="fill-current" />
                  Mulai Registrasi
                </button>
              )}
              {detailType === 'sample' && selectedDetail.qr_token && (
                <button 
                  type="button"
                  onClick={() => {
                    setPrintData({
                      kode_sample: selectedDetail.kode_sample || 'N/A',
                      nomor_registrasi: selectedDetail.nomor_registrasi || 'N/A',
                      jenis_sample: selectedDetail.sample?.jenis_sample || selectedDetail.samples?.[0]?.jenis_sample || '-',
                      tanggal_registrasi: selectedDetail.tanggal_registrasi || selectedDetail.created_at,
                      qr_token: selectedDetail.qr_token,
                      tracking_url: selectedDetail.tracking_url || `${window.location.origin}/tracking/${selectedDetail.qr_token}`,
                    });
                    setPrintModalOpen(true);
                    setDetailModalOpen(false);
                  }}
                  className="bg-primary text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-primary-container transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer size={14} />
                  Cetak Label QR
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* QR Label Print Modal */}
      {printData && (
        <QrLabelPrint
          isOpen={printModalOpen}
          onClose={() => {
            setPrintModalOpen(false);
            setPrintData(null);
          }}
          data={printData}
        />
      )}
    </div>
  );
};

export default Registrasi;
