import React, { useState } from 'react';
import { 
  ClipboardCheck, 
  Search, 
  Filter, 
  Eye, 
  Edit3, 
  X, 
  Layers, 
  AlertTriangle, 
  User, 
  MapPin, 
  Save, 
  Lock, 
  FlaskConical,
  FileText,
  Droplet,
  Flame,
  Apple,
  Wind,
  Globe,
  Activity,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';
import { useRegistrasiList } from '@/hooks/useRegistrasi';
import { useSubmitHasilUji } from '@/hooks/usePengujian';
import dayjs from 'dayjs';

interface LocalParam {
  parameterId: string;
  name: string;
  unit: string;
  limitMin: number | null;
  limitMax: number | null;
  metode: string;
  enteredValue: string;
  status: string;
  tipePengujian: string;
  catatan: string;
}

const CATEGORY_STYLES: Record<string, { 
  bg: string; 
  border: string; 
  text: string; 
  icon: React.ReactNode; 
  label: string;
  gradient: string;
}> = {
  'Air (Sanitasi / Minum)': {
    bg: 'bg-blue-50/80 backdrop-blur-sm',
    border: 'border-blue-100',
    text: 'text-blue-700',
    icon: <Droplet size={18} className="text-blue-500" />,
    label: 'Air (Sanitasi / Minum)',
    gradient: 'from-blue-500 to-indigo-600',
  },
  'Air Limbah Industri / Domestik': {
    bg: 'bg-emerald-50/80 backdrop-blur-sm',
    border: 'border-emerald-100',
    text: 'text-emerald-700',
    icon: <Flame size={18} className="text-emerald-500" />,
    label: 'Air Limbah Industri / Domestik',
    gradient: 'from-emerald-500 to-teal-600',
  },
  'Makanan & Minuman': {
    bg: 'bg-amber-50/80 backdrop-blur-sm',
    border: 'border-amber-100',
    text: 'text-amber-700',
    icon: <Apple size={18} className="text-amber-500" />,
    label: 'Makanan & Minuman',
    gradient: 'from-amber-500 to-orange-600',
  },
  'Kualitas Udara': {
    bg: 'bg-sky-50/80 backdrop-blur-sm',
    border: 'border-sky-100',
    text: 'text-sky-700',
    icon: <Wind size={18} className="text-sky-500" />,
    label: 'Kualitas Udara',
    gradient: 'from-sky-400 to-blue-500',
  },
  'Tanah & Sedimen': {
    bg: 'bg-orange-50/80 backdrop-blur-sm',
    border: 'border-orange-100',
    text: 'text-orange-700',
    icon: <Globe size={18} className="text-orange-500" />,
    label: 'Tanah & Sedimen',
    gradient: 'from-orange-500 to-amber-700',
  },
  'Swab Lingkungan': {
    bg: 'bg-purple-50/80 backdrop-blur-sm',
    border: 'border-purple-100',
    text: 'text-purple-700',
    icon: <Activity size={18} className="text-purple-500" />,
    label: 'Swab Lingkungan',
    gradient: 'from-purple-500 to-pink-600',
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

const SampleDiuji: React.FC = () => {
  const { data: sampleResponse, isLoading: samplesLoading, refetch } = useRegistrasiList();
  const submitMutation = useSubmitHasilUji();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedSample, setSelectedSample] = useState<any | null>(null);
  const [editingSample, setEditingSample] = useState<any | null>(null);
  
  // Local state for editing form parameters
  const [editParams, setEditParams] = useState<LocalParam[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const rawSamples = sampleResponse?.data || [];

  // Parse and calculate metrics for active and tested samples
  const processedSamples = rawSamples.map((s: any) => {
    const physical = s.samples?.[0] || s.sample;
    const totalParams = physical?.hasil_uji?.length || 0;
    const completedParams = physical?.hasil_uji?.filter((hu: any) => 
      hu.nilai_hasil !== null && hu.nilai_hasil !== undefined
    ).length || 0;

    const approvedParams = physical?.hasil_uji?.filter((hu: any) => 
      hu.status_hasil === 'approved'
    ).length || 0;

    const pendingQcParams = physical?.hasil_uji?.filter((hu: any) => 
      hu.status_hasil === 'pending_qc'
    ).length || 0;

    const rejectedParams = physical?.hasil_uji?.filter((hu: any) => 
      hu.status_hasil === 'rejected'
    ).length || 0;

    const draftParams = physical?.hasil_uji?.filter((hu: any) => 
      hu.status_hasil === 'draft'
    ).length || 0;

    return {
      ...s,
      physical,
      totalParams,
      completedParams,
      approvedParams,
      pendingQcParams,
      rejectedParams,
      draftParams,
      isTested: completedParams > 0
    };
  });

  // Filter only tested samples (completedParams > 0)
  const testedSamples = processedSamples.filter(s => s.isTested);

  // Apply search and category filters
  const filteredSamples = testedSamples.filter(s => {
    const physical = s.physical;
    const code = physical?.kode_sample || s.kode_sample || s.nomor_registrasi || '';
    const regNo = s.nomor_registrasi || '';
    const category = physical?.jenis_sample || 'Air (Sanitasi / Minum)';
    const location = physical?.lokasi_pengambilan || '';

    const matchesSearch = 
      code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      regNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'ALL' || category === selectedCategory;

    const isFullyTested = s.completedParams === s.totalParams;
    const matchesStatus = 
      selectedStatus === 'ALL' ||
      (selectedStatus === 'COMPLETED' && isFullyTested) ||
      (selectedStatus === 'PARTIAL' && !isFullyTested);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Open Edit Modal & synchronize editing state
  const handleOpenEdit = (sample: any) => {
    setEditingSample(sample);
    if (sample.physical && sample.physical.hasil_uji) {
      setEditParams(
        sample.physical.hasil_uji.map((hu: any) => {
          const limitMin = hu.parameter_uji?.baku_mutu_min !== null && hu.parameter_uji?.baku_mutu_min !== undefined
            ? parseFloat(hu.parameter_uji.baku_mutu_min)
            : null;
          const limitMax = hu.parameter_uji?.baku_mutu_max !== null && hu.parameter_uji?.baku_mutu_max !== undefined
            ? parseFloat(hu.parameter_uji.baku_mutu_max)
            : null;

          return {
            parameterId: hu.parameter_uji_id,
            name: hu.parameter_uji?.nama_parameter || 'Unknown',
            unit: hu.parameter_uji?.satuan || '-',
            limitMin,
            limitMax,
            metode: hu.metode_pengujian || hu.parameter_uji?.metode_uji || 'Manual',
            enteredValue: hu.nilai_hasil !== null && hu.nilai_hasil !== undefined ? String(hu.nilai_hasil) : '',
            status: (hu.status_hasil || 'DRAFT').toUpperCase(),
            tipePengujian: hu.parameter_uji?.tipe_pengujian || 'laboratorium',
            catatan: hu.catatan || '',
          };
        })
      );
    } else {
      setEditParams([]);
    }
  };

  // Handle edit form inputs
  const handleEditValueChange = (parameterId: string, val: string) => {
    setEditParams(prev =>
      prev.map(p => (p.parameterId === parameterId ? { ...p, enteredValue: val } : p))
    );
  };

  const handleEditMetodeChange = (parameterId: string, val: string) => {
    setEditParams(prev =>
      prev.map(p => (p.parameterId === parameterId ? { ...p, metode: val } : p))
    );
  };

  const handleEditCatatanChange = (parameterId: string, val: string) => {
    setEditParams(prev =>
      prev.map(p => (p.parameterId === parameterId ? { ...p, catatan: val } : p))
    );
  };

  // Submit edit form modifications
  const handleSaveEdits = async () => {
    if (!editingSample || !editingSample.physical) return;

    // Filter only parameters that have been modified/entered and are NOT locked (draft or rejected)
    const editableParams = editParams.filter(p => p.status === 'DRAFT' || p.status === 'REJECTED');
    
    if (editableParams.length === 0) {
      toast.error('Tidak ada parameter yang dapat diedit (seluruh parameter sedang dalam peninjauan QC atau sudah disetujui).');
      return;
    }

    const unfilledParams = editableParams.filter(p => p.enteredValue.trim() === '');
    if (unfilledParams.length > 0) {
      toast.error(`Mohon lengkapi seluruh nilai hasil uji parameter.`);
      return;
    }

    setIsSubmitting(true);
    try {
      await Promise.all(
        editableParams.map(p => 
          submitMutation.mutateAsync({
            sample_id: editingSample.physical.id,
            parameter_uji_id: p.parameterId,
            nilai_hasil: parseFloat(p.enteredValue),
            metode_pengujian: p.metode,
            catatan: p.catatan || `Hasil diubah/diupdate via web pengujian oleh petugas lab.`,
          })
        )
      );

      toast.success('Perubahan hasil pengujian berhasil disimpan!');
      setEditingSample(null);
      refetch();
    } catch (error: any) {
      console.error(error);
      const errMsg = error?.response?.data?.message || 'Terjadi kesalahan saat menyimpan perubahan hasil uji.';
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Total tested samples count across categories
  const totalCount = testedSamples.length;
  const fullyTestedCount = testedSamples.filter(s => s.completedParams === s.totalParams).length;
  const partialTestedCount = totalCount - fullyTestedCount;

  return (
    <div className="space-y-6">
      {/* Upper Navigation / Title */}
      <div className="border-b border-outline-variant pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-headline-lg text-lg md:text-xl font-extrabold text-on-surface flex items-center gap-2">
            <ClipboardCheck className="text-primary animate-pulse" />
            Daftar Sampel yang Sudah Diuji
          </h1>
          <p className="font-body-md text-xs text-on-surface-variant mt-1 font-medium">
            Kelola, periksa detail ISO 17025, dan perbaiki entri hasil pengujian laboratorium yang berstatus draft atau ditolak.
          </p>
        </div>
      </div>

      {/* Modern Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Total Diuji */}
        <div className="bg-gradient-to-br from-primary to-primary-container p-5 rounded-2xl border border-primary-fixed/20 soft-shadow text-on-primary relative overflow-hidden group">
          <div className="absolute right-0 bottom-0 translate-x-2 translate-y-4 opacity-10 group-hover:scale-110 transition-transform duration-350">
            <ClipboardCheck size={140} />
          </div>
          <span className="text-[10px] uppercase font-bold tracking-wider opacity-85 block">Total Sampel Diuji</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="font-headline-lg text-3xl font-black">{totalCount}</span>
            <span className="text-xs font-semibold opacity-90">sampel fisik</span>
          </div>
          <div className="flex items-center gap-1.5 mt-3 text-[10px] bg-white/10 w-fit px-2.5 py-1 rounded-full backdrop-blur-sm">
            <TrendingUp size={12} />
            <span className="font-bold">Mutu Terkendali (ISO 17025)</span>
          </div>
        </div>

        {/* Card 2: Pengujian Selesai */}
        <div className="bg-white p-5 rounded-2xl border border-outline-variant soft-shadow relative overflow-hidden group">
          <span className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant block">Hasil Pengujian Lengkap</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="font-headline-lg text-3xl font-black text-status-success">{fullyTestedCount}</span>
            <span className="text-xs font-semibold text-on-surface-variant">sampel</span>
          </div>
          <p className="text-[10px] text-on-surface-variant/80 mt-3 font-medium">
            Semua parameter uji pada sampel ini sudah diinput nilainya.
          </p>
        </div>

        {/* Card 3: Belum Lengkap */}
        <div className="bg-white p-5 rounded-2xl border border-outline-variant soft-shadow relative overflow-hidden group">
          <span className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant block">Sedang Proses / Sebagian</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="font-headline-lg text-3xl font-black text-status-warning">{partialTestedCount}</span>
            <span className="text-xs font-semibold text-on-surface-variant">sampel</span>
          </div>
          <p className="text-[10px] text-on-surface-variant/80 mt-3 font-medium">
            Beberapa parameter masih kosong atau menunggu input analis pendamping.
          </p>
        </div>
      </div>

      {/* Filter and Search controls */}
      <div className="bg-white p-5 rounded-2xl border border-outline-variant soft-shadow flex flex-col gap-4 text-xs">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="relative w-full lg:w-96">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-on-surface-variant">
              <Search size={15} />
            </span>
            <input
              type="text"
              placeholder="Cari kode sampel, no. registrasi, lokasi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-outline-variant rounded-xl focus:outline-none focus:border-primary font-semibold shadow-sm focus:ring-1 focus:ring-primary transition-all bg-surface-container-low focus:bg-white"
            />
          </div>

          <div className="flex flex-wrap gap-3 w-full lg:w-auto items-center justify-end">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[10px] text-on-surface-variant uppercase tracking-wider shrink-0 flex items-center gap-1">
                <Filter size={12} /> Status:
              </span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3.5 py-2 border border-outline-variant rounded-xl font-semibold bg-white cursor-pointer hover:border-outline outline-none text-xs"
              >
                <option value="ALL">Semua Status Pengujian</option>
                <option value="COMPLETED">Lengkap (Semua Teruji)</option>
                <option value="PARTIAL">Belum Lengkap (Sebagian)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Category quick selectors */}
        <div className="border-t border-outline-variant/65 pt-3.5 flex items-center gap-2.5 overflow-x-auto pb-1">
          <span className="font-bold text-[10px] text-on-surface-variant uppercase shrink-0">Kategori:</span>
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded-lg border font-bold text-[9px] uppercase tracking-wider transition-all shrink-0 cursor-pointer ${
              selectedCategory === 'ALL' 
                ? 'bg-primary text-on-primary border-primary shadow-sm' 
                : 'bg-white border-outline-variant text-on-surface-variant hover:border-outline'
            }`}
          >
            Semua
          </button>
          {Object.keys(CATEGORY_STYLES).map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg border font-bold text-[9px] uppercase tracking-wider transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                selectedCategory === cat 
                  ? 'bg-primary text-on-primary border-primary shadow-sm' 
                  : 'bg-white border-outline-variant text-on-surface-variant hover:border-outline'
              }`}
            >
              {CATEGORY_STYLES[cat].icon}
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Tested Samples Table */}
      <div className="bg-white rounded-2xl border border-outline-variant overflow-hidden soft-shadow">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container border-b border-outline-variant text-[10px] font-extrabold text-on-surface-variant uppercase tracking-wider">
                <th className="p-4">Kode & Kategori</th>
                <th className="p-4">No. Registrasi</th>
                <th className="p-4">Lokasi Pengambilan</th>
                <th className="p-4 w-[160px] text-center">Progress Uji</th>
                <th className="p-4">Rincian Status Parameter</th>
                <th className="p-4 w-[160px] text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant text-xs text-on-surface font-semibold">
              {samplesLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="p-4"><div className="h-4 bg-gray-200 rounded w-32" /></td>
                    <td className="p-4"><div className="h-4 bg-gray-200 rounded w-28" /></td>
                    <td className="p-4"><div className="h-4 bg-gray-200 rounded w-40" /></td>
                    <td className="p-4"><div className="h-4 bg-gray-200 rounded w-24 mx-auto" /></td>
                    <td className="p-4"><div className="h-4 bg-gray-200 rounded w-36" /></td>
                    <td className="p-4"><div className="h-8 bg-gray-200 rounded w-24 mx-auto" /></td>
                  </tr>
                ))
              ) : filteredSamples.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-16 text-center text-on-surface-variant font-bold">
                    {totalCount === 0 
                      ? 'Belum ada sampel yang telah diuji hasil parameternya.' 
                      : 'Tidak ada sampel diuji yang sesuai dengan kriteria filter.'}
                  </td>
                </tr>
              ) : (
                filteredSamples.map((s: any) => {
                  const physical = s.physical;
                  const category = physical?.jenis_sample || 'Air (Sanitasi / Minum)';
                  const catStyle = CATEGORY_STYLES[category] || CATEGORY_STYLES['Air (Sanitasi / Minum)'];
                  const code = physical?.kode_sample || s.kode_sample || s.nomor_registrasi;

                  // Progress percentage
                  const progressPct = s.totalParams > 0 ? (s.completedParams / s.totalParams) * 100 : 0;
                  const isFullyCompleted = s.completedParams === s.totalParams;

                  return (
                    <tr key={s.id} className="hover:bg-surface-container-low transition-all">
                      <td className="p-4">
                        <span className="font-bold text-on-surface block text-[13px]">{code}</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 mt-1 rounded-full text-[9px] font-bold uppercase border ${catStyle.border} ${catStyle.bg} ${catStyle.text}`}>
                          {catStyle.icon}
                          {category}
                        </span>
                      </td>
                      <td className="p-4 font-mono font-bold text-gray-500">{s.nomor_registrasi}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-1 text-on-surface-variant font-medium">
                          <MapPin size={12} className="text-primary/70 shrink-0" />
                          <span className="truncate max-w-[200px]">{physical?.lokasi_pengambilan || '-'}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="max-w-[120px] mx-auto space-y-1">
                          <div className="flex justify-between items-center text-[9px] font-extrabold">
                            <span className={isFullyCompleted ? 'text-status-success' : 'text-on-surface-variant'}>
                              {s.completedParams} / {s.totalParams} Uji
                            </span>
                            <span>{Math.round(progressPct)}%</span>
                          </div>
                          <div className="w-full bg-gray-150 h-2 rounded-full overflow-hidden border border-gray-200/50">
                            <div 
                              className={`h-full transition-all duration-350 ${
                                isFullyCompleted ? 'bg-status-success' : 'bg-primary'
                              }`} 
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1.5 max-w-[280px]">
                          {s.approvedParams > 0 && (
                            <span className="px-2 py-0.5 rounded bg-status-success/10 text-status-success font-extrabold text-[8px] uppercase tracking-wider shrink-0 border border-status-success/15">
                              {s.approvedParams} Approved
                            </span>
                          )}
                          {s.pendingQcParams > 0 && (
                            <span className="px-2 py-0.5 rounded bg-status-warning/10 text-status-warning font-extrabold text-[8px] uppercase tracking-wider shrink-0 border border-status-warning/15">
                              {s.pendingQcParams} Pending QC
                            </span>
                          )}
                          {s.rejectedParams > 0 && (
                            <span className="px-2 py-0.5 rounded bg-status-danger/10 text-status-danger font-extrabold text-[8px] uppercase tracking-wider shrink-0 border border-status-danger/15 animate-pulse">
                              {s.rejectedParams} Rejected
                            </span>
                          )}
                          {s.draftParams > 0 && (
                            <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-500 font-extrabold text-[8px] uppercase tracking-wider shrink-0 border border-gray-200">
                              {s.draftParams} Draft
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setSelectedSample(s)}
                            className="p-2 border border-outline-variant hover:border-primary text-on-surface hover:text-primary rounded-xl transition-all cursor-pointer shadow-sm hover:bg-primary/5 shrink-0 flex items-center gap-1 font-bold text-[10px] uppercase"
                            title="Lihat Detail Laporan"
                          >
                            <Eye size={14} />
                            Detail
                          </button>
                          <button
                            onClick={() => handleOpenEdit(s)}
                            className="p-2 bg-primary text-on-primary hover:bg-primary-container rounded-xl transition-all cursor-pointer shadow-sm hover-lift shrink-0 flex items-center gap-1 font-bold text-[10px] uppercase"
                            title="Edit Entri Hasil"
                          >
                            <Edit3 size={14} />
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ISO 17025 Standard Detail Modal */}
      {selectedSample && (() => {
        const physical = selectedSample.physical;
        const category = physical?.jenis_sample || 'Air (Sanitasi / Minum)';
        const catStyle = CATEGORY_STYLES[category] || CATEGORY_STYLES['Air (Sanitasi / Minum)'];
        const code = physical?.kode_sample || selectedSample.kode_sample || selectedSample.nomor_registrasi;

        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-backdrop-fade">
            <div className="bg-white rounded-2xl w-full max-w-4xl overflow-hidden soft-shadow border border-outline-variant animate-modal-zoom">
              
              {/* Report Header */}
              <div className="bg-gradient-to-r from-primary to-primary-container p-5 text-on-primary flex justify-between items-center relative">
                <div className="flex items-center gap-3">
                  <div className="bg-white/15 p-2 rounded-xl backdrop-blur-sm border border-white/20">
                    <FlaskConical size={22} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-headline-md text-sm md:text-base font-black tracking-wide">
                      LAPORAN ANALISIS HASIL PENGUJIAN LABORATORIUM
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[8px] uppercase tracking-widest bg-status-success text-white px-2 py-0.5 rounded font-black border border-white/10 shadow-sm">
                        Akreditasi KAN ISO/IEC 17025
                      </span>
                      <span className="text-[10px] text-on-primary/80 font-medium">Labkesda UPTD Kab. Purwakarta</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedSample(null)}
                  className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all cursor-pointer text-on-primary"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Report Body */}
              <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs">
                
                {/* Visual Header Grid - Metadata */}
                <div className="bg-cream-bg rounded-2xl border border-outline-variant p-4 space-y-4">
                  <h4 className="font-extrabold text-[11px] text-primary uppercase tracking-wider flex items-center gap-1.5 border-b border-outline-variant/60 pb-2">
                    <FileText size={14} />
                    Deskripsi Registrasi & Informasi Lapangan
                  </h4>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                    <div>
                      <span className="text-on-surface-variant font-bold text-[9px] uppercase tracking-wider block">Nomor Registrasi</span>
                      <span className="font-bold text-on-surface text-[12px]">{selectedSample.nomor_registrasi}</span>
                    </div>
                    <div>
                      <span className="text-on-surface-variant font-bold text-[9px] uppercase tracking-wider block">Kode Sampel Fisik</span>
                      <span className="font-mono font-extrabold text-primary text-[12px]">{code}</span>
                    </div>
                    <div>
                      <span className="text-on-surface-variant font-bold text-[9px] uppercase tracking-wider block">Kategori Sampel</span>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase mt-1 border ${catStyle.border} ${catStyle.bg} ${catStyle.text}`}>
                        {catStyle.icon}
                        {category}
                      </span>
                      <span className="block text-[8px] text-on-surface-variant/80 font-bold mt-1.5 uppercase">Acuan Regulasi:</span>
                      <span className="font-bold text-[10px] text-primary mt-0.5 block">{REGULASI_MAP[category] || '-'}</span>
                    </div>
                    <div>
                      <span className="text-on-surface-variant font-bold text-[9px] uppercase tracking-wider block">Tanggal Registrasi</span>
                      <span className="font-bold text-on-surface">{dayjs(selectedSample.created_at).format('DD MMMM YYYY HH:mm')}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-5 border-t border-outline-variant/40 pt-3">
                    <div>
                      <span className="text-on-surface-variant font-bold text-[9px] uppercase tracking-wider block">Lokasi / Titik Sampling</span>
                      <span className="font-bold text-on-surface flex items-center gap-0.5 mt-0.5">
                        <MapPin size={11} className="text-primary/70 shrink-0" />
                        {physical?.lokasi_pengambilan || '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-on-surface-variant font-bold text-[9px] uppercase tracking-wider block">Kondisi Sampel (On-Site)</span>
                      <span className="font-bold text-on-surface capitalize mt-0.5 block">{physical?.kondisi_sample || 'Baik'}</span>
                    </div>
                    <div>
                      <span className="text-on-surface-variant font-bold text-[9px] uppercase tracking-wider block">Suhu & Cuaca</span>
                      <span className="font-bold text-on-surface mt-0.5 block">
                        {physical?.suhu !== undefined && physical?.suhu !== null ? `${physical.suhu}°C` : '-'} 
                        {physical?.cuaca ? ` | ${physical.cuaca}` : ''}
                      </span>
                    </div>
                    <div>
                      <span className="text-on-surface-variant font-bold text-[9px] uppercase tracking-wider block">Metode Pengambilan</span>
                      <span className="font-bold text-on-surface mt-0.5 block">{physical?.metode_pengambilan || '-'}</span>
                    </div>
                  </div>
                </div>

                {/* Parameters Table */}
                <div className="space-y-3">
                  <h4 className="font-extrabold text-[11px] text-on-surface uppercase tracking-wider flex items-center gap-1.5 border-b border-outline-variant pb-2">
                    <Layers size={14} className="text-primary" />
                    Daftar Nilai Pengukuran Parameter Uji
                  </h4>

                  <div className="border border-outline-variant rounded-xl overflow-hidden shadow-sm bg-white">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-surface-container text-[10px] font-bold text-on-surface-variant border-b border-outline-variant uppercase tracking-wider">
                          <th className="p-3">Parameter Uji</th>
                          <th className="p-3">Tipe</th>
                          <th className="p-3">Metode</th>
                          <th className="p-3 text-center">Baku Mutu</th>
                          <th className="p-3 text-center">Nilai Uji</th>
                          <th className="p-3">Satuan</th>
                          <th className="p-3">Status Kepatuhan</th>
                          <th className="p-3">Analis</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant font-medium text-on-surface text-xs">
                        {(!physical?.hasil_uji || physical.hasil_uji.length === 0) ? (
                          <tr>
                            <td colSpan={8} className="p-8 text-center text-on-surface-variant font-bold italic">
                              Tidak ada parameter uji terdaftar.
                            </td>
                          </tr>
                        ) : (
                          physical.hasil_uji.map((hu: any) => {
                            const pUji = hu.parameter_uji;
                            const limitMin = pUji?.baku_mutu_min !== null && pUji?.baku_mutu_min !== undefined ? parseFloat(pUji.baku_mutu_min) : null;
                            const limitMax = pUji?.baku_mutu_max !== null && pUji?.baku_mutu_max !== undefined ? parseFloat(pUji.baku_mutu_max) : null;
                            const num = hu.nilai_hasil !== null ? parseFloat(hu.nilai_hasil) : NaN;

                            let isExceeded = false;
                            let isBelowMin = false;

                            if (!isNaN(num)) {
                              if (limitMax !== null && num > limitMax) isExceeded = true;
                              if (limitMin !== null && num < limitMin) isBelowMin = true;
                            }

                            const isOut = isExceeded || isBelowMin;

                            // Standard Display build
                            let limitDisplay = '-';
                            if (limitMin !== null && limitMax !== null) {
                              limitDisplay = `${limitMin} - ${limitMax}`;
                            } else if (limitMax !== null) {
                              limitDisplay = `≤ ${limitMax}`;
                            } else if (limitMin !== null) {
                              limitDisplay = `≥ ${limitMin}`;
                            }

                            return (
                              <tr 
                                key={hu.id} 
                                className={`transition-all ${
                                  isOut ? 'bg-status-danger/5 hover:bg-status-danger/10' : 'hover:bg-surface-container-low'
                                }`}
                              >
                                <td className="p-3 font-bold text-on-surface">{pUji?.nama_parameter || 'Unknown'}</td>
                                <td className="p-3">
                                  {pUji?.tipe_pengujian === 'on_site' ? (
                                    <span className="px-1.5 py-0.5 rounded bg-status-success/10 text-status-success font-extrabold text-[8px] uppercase">
                                      On-Site
                                    </span>
                                  ) : (
                                    <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-extrabold text-[8px] uppercase">
                                      Lab
                                    </span>
                                  )}
                                </td>
                                <td className="p-3 text-on-surface-variant font-semibold text-[11px]">{hu.metode_pengujian || pUji?.metode_uji || '-'}</td>
                                <td className="p-3 text-center font-bold text-on-surface-variant">{limitDisplay}</td>
                                <td className="p-3 text-center font-extrabold text-[13px] text-primary">{hu.nilai_hasil !== null && hu.nilai_hasil !== undefined ? hu.nilai_hasil : '-'}</td>
                                <td className="p-3 font-bold text-on-surface-variant">{pUji?.satuan || '-'}</td>
                                <td className="p-3">
                                  {hu.nilai_hasil === null || hu.nilai_hasil === undefined ? (
                                    <span className="text-[10px] text-on-surface-variant italic font-semibold">Belum diisi</span>
                                  ) : hu.status_hasil === 'approved' ? (
                                    <span className="px-2 py-0.5 rounded bg-status-success/15 text-status-success font-extrabold text-[9px] uppercase border border-status-success/20">
                                      Verified
                                    </span>
                                  ) : hu.status_hasil === 'pending_qc' ? (
                                    <span className="px-2 py-0.5 rounded bg-status-warning/15 text-status-warning font-extrabold text-[9px] uppercase border border-status-warning/20">
                                      QC Review
                                    </span>
                                  ) : hu.status_hasil === 'rejected' ? (
                                    <span className="px-2 py-0.5 rounded bg-status-danger/15 text-status-danger font-extrabold text-[9px] uppercase border border-status-danger/20 animate-pulse">
                                      Rejected
                                    </span>
                                  ) : isExceeded ? (
                                    <span className="px-2 py-0.5 rounded bg-status-danger/10 text-status-danger font-extrabold text-[9px] uppercase">
                                      Exceeded BM
                                    </span>
                                  ) : isBelowMin ? (
                                    <span className="px-2 py-0.5 rounded bg-status-danger/10 text-status-danger font-extrabold text-[9px] uppercase">
                                      Under BM
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded bg-status-success/10 text-status-success font-extrabold text-[9px] uppercase">
                                      Sesuai
                                    </span>
                                  )}
                                </td>
                                <td className="p-3">
                                  <div className="flex items-center gap-1 text-[11px] font-semibold text-on-surface-variant">
                                    <User size={11} className="text-gray-400" />
                                    <span>{hu.analis?.name || 'Belum diisi'}</span>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Audit and Analyst Comments Section */}
                <div className="space-y-3">
                  <h4 className="font-extrabold text-[11px] text-on-surface uppercase tracking-wider flex items-center gap-1.5 border-b border-outline-variant pb-2">
                    <User size={14} className="text-primary" />
                    Catatan Audit Laboratorium & Ulasan QC
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {physical?.hasil_uji?.map((hu: any) => {
                      if (!hu.catatan && hu.status_hasil !== 'rejected') return null;
                      return (
                        <div key={hu.id} className="p-3 bg-surface-container-low border border-outline-variant/70 rounded-xl space-y-1.5">
                          <div className="flex justify-between items-center">
                            <span className="font-extrabold text-on-surface text-[10px] uppercase">
                              {hu.parameter_uji?.nama_parameter || 'Parameter'}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded font-black text-[7px] uppercase tracking-wider ${
                              hu.status_hasil === 'approved' ? 'bg-status-success/15 text-status-success' :
                              hu.status_hasil === 'rejected' ? 'bg-status-danger/15 text-status-danger animate-pulse' :
                              'bg-status-warning/15 text-status-warning'
                            }`}>
                              {hu.status_hasil}
                            </span>
                          </div>
                          <p className="font-mono text-[10px] text-on-surface-variant bg-white p-2.5 rounded-lg border border-outline-variant/40 leading-relaxed max-h-24 overflow-y-auto">
                            {hu.catatan || 'Hasil pengujian berhasil disimpan di database.'}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Report Footer */}
              <div className="bg-surface-container p-4 flex justify-end gap-3 border-t border-outline-variant">
                <button
                  onClick={() => setSelectedSample(null)}
                  className="px-5 py-2.5 bg-primary text-on-primary font-extrabold text-xs rounded-xl hover:bg-primary-container soft-shadow cursor-pointer transition-all hover-lift"
                >
                  Selesai Peninjauan
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Editable Modal Form */}
      {editingSample && (() => {
        const physical = editingSample.physical;
        const category = physical?.jenis_sample || 'Air (Sanitasi / Minum)';
        const code = physical?.kode_sample || editingSample.kode_sample || editingSample.nomor_registrasi;

        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-backdrop-fade">
            <div className="bg-white rounded-2xl w-full max-w-4xl overflow-hidden soft-shadow border border-outline-variant animate-modal-zoom">
              
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-primary to-primary-container p-5 text-on-primary flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="bg-white/15 p-2 rounded-xl backdrop-blur-sm border border-white/20">
                    <Edit3 size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-headline-md text-sm md:text-base font-black tracking-wide">
                      EDIT FORMULIR HASIL PENGUJIAN LABORATORIUM
                    </h3>
                    <span className="text-[9px] uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded font-black border border-white/10 mt-1 inline-block">
                      Kode: {code} ({category})
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => setEditingSample(null)}
                  className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all cursor-pointer text-on-primary"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto text-xs">
                
                {/* Banner Guidance ISO 17025 Lock policy */}
                <div className="p-3.5 bg-status-warning/10 border border-status-warning/20 rounded-xl text-on-surface-variant flex items-start gap-2.5">
                  <AlertTriangle size={16} className="text-status-warning shrink-0 mt-0.5 animate-bounce" />
                  <div className="leading-relaxed">
                    <span className="font-extrabold text-on-surface block text-[11px] mb-0.5">Kebijakan Penguncian Keamanan Mutu (Audit Trail)</span>
                    <span>Sesuai standar akreditasi ISO 17025, parameter dengan status <span className="font-bold">Pending QC</span> atau <span className="font-bold">Approved</span> telah dikunci secara otomatis. Petugas hanya diperbolehkan mengoreksi data dengan status <span className="font-bold">Draft</span> atau <span className="font-bold">Rejected (Ditolak)</span>.</span>
                  </div>
                </div>

                {/* Parameters Editing Grid */}
                <div className="space-y-4">
                  <h4 className="font-bold text-[11px] text-on-surface uppercase tracking-wider flex items-center gap-1.5 border-b border-outline-variant pb-2">
                    <FlaskConical size={14} className="text-primary" />
                    Parameter Uji & Formulir Hasil
                  </h4>

                  <div className="space-y-5">
                    {editParams.map((param) => {
                      const isLocked = param.status === 'APPROVED' || param.status === 'PENDING_QC';
                      
                      // Calculate baku mutu display
                      let limitDisplay = '-';
                      if (param.limitMin !== null && param.limitMax !== null) {
                        limitDisplay = `${param.limitMin} - ${param.limitMax}`;
                      } else if (param.limitMax !== null) {
                        limitDisplay = `≤ ${param.limitMax}`;
                      } else if (param.limitMin !== null) {
                        limitDisplay = `≥ ${param.limitMin}`;
                      }

                      return (
                        <div 
                          key={param.parameterId} 
                          className={`p-4 rounded-2xl border transition-all ${
                            isLocked 
                              ? 'bg-gray-50 border-gray-200/80 text-gray-400 opacity-80' 
                              : 'bg-white border-outline-variant shadow-sm hover:border-primary-fixed/60'
                          }`}
                        >
                          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                            
                            {/* Param Name & Baku Mutu display (Col 4) */}
                            <div className="lg:col-span-4 space-y-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`font-black text-[13px] ${isLocked ? 'text-gray-400' : 'text-on-surface'}`}>
                                  {param.name}
                                </span>
                                {param.tipePengujian === 'on_site' ? (
                                  <span className="px-1.5 py-0.5 rounded-full bg-status-success/10 text-status-success text-[8px] font-black uppercase">
                                    On Site
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[8px] font-black uppercase">
                                    Lab
                                  </span>
                                )}
                                {isLocked && (
                                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-gray-200 text-gray-500 text-[8px] font-black uppercase">
                                    <Lock size={8} /> Terkunci
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-on-surface-variant font-medium">
                                Baku Mutu Standard: <span className="font-bold">{limitDisplay} {param.unit}</span>
                              </div>
                              <div className="flex gap-1.5 items-center mt-1">
                                <span className="text-[10px]">Status:</span>
                                <span className={`px-2 py-0.5 rounded font-black text-[8px] uppercase ${
                                  param.status === 'APPROVED' ? 'bg-status-success/15 text-status-success border border-status-success/20' :
                                  param.status === 'PENDING_QC' ? 'bg-status-warning/15 text-status-warning border border-status-warning/20' :
                                  param.status === 'REJECTED' ? 'bg-status-danger/15 text-status-danger border border-status-danger/20 animate-pulse' :
                                  'bg-gray-100 text-gray-500 border border-gray-200'
                                }`}>
                                  {param.status}
                                </span>
                              </div>
                            </div>

                            {/* Entered Value Input (Col 3) */}
                            <div className="lg:col-span-3 space-y-1.5">
                              <span className="font-bold text-[9px] uppercase tracking-wider text-on-surface-variant block">Nilai Hasil Uji ({param.unit})</span>
                              <div className="relative">
                                <input
                                  type="number"
                                  step="any"
                                  placeholder="0.0"
                                  value={param.enteredValue}
                                  onChange={(e) => handleEditValueChange(param.parameterId, e.target.value)}
                                  disabled={isLocked}
                                  className={`w-full px-3 py-2 rounded-xl border font-bold text-center text-xs outline-none transition-all ${
                                    isLocked
                                      ? 'bg-gray-150 border-gray-200 text-gray-400 cursor-not-allowed'
                                      : 'border-outline-variant bg-surface-container-low focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary'
                                  }`}
                                />
                              </div>
                            </div>

                            {/* Testing Method Input (Col 2) */}
                            <div className="lg:col-span-2 space-y-1.5">
                              <span className="font-bold text-[9px] uppercase tracking-wider text-on-surface-variant block">Metode Uji</span>
                              <input
                                type="text"
                                placeholder="Misal: AAS / Spektrofotometri"
                                value={param.metode}
                                onChange={(e) => handleEditMetodeChange(param.parameterId, e.target.value)}
                                disabled={isLocked}
                                className={`w-full px-3 py-2 rounded-xl border font-semibold text-xs outline-none transition-all ${
                                  isLocked
                                    ? 'bg-gray-150 border-gray-200 text-gray-400 cursor-not-allowed'
                                    : 'border-outline-variant bg-surface-container-low focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary'
                                }`}
                              />
                            </div>

                            {/* Analyst Note / Audit Trail (Col 3) */}
                            <div className="lg:col-span-3 space-y-1.5">
                              <span className="font-bold text-[9px] uppercase tracking-wider text-on-surface-variant block">Catatan Analis</span>
                              <textarea
                                placeholder="Tambahkan catatan koreksi..."
                                value={param.catatan}
                                onChange={(e) => handleEditCatatanChange(param.parameterId, e.target.value)}
                                disabled={isLocked}
                                rows={1}
                                className={`w-full px-3 py-2 rounded-xl border font-medium text-xs outline-none transition-all resize-none ${
                                  isLocked
                                    ? 'bg-gray-150 border-gray-200 text-gray-400 cursor-not-allowed'
                                    : 'border-outline-variant bg-surface-container-low focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary'
                                }`}
                              />
                            </div>

                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="bg-surface-container p-4 flex justify-end gap-3 border-t border-outline-variant">
                <button
                  onClick={() => setEditingSample(null)}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 border border-outline-variant hover:bg-gray-50 text-on-surface font-extrabold text-xs rounded-xl cursor-pointer transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveEdits}
                  disabled={isSubmitting || submitMutation.isPending}
                  className="flex items-center gap-2 bg-primary text-on-primary px-6 py-2.5 rounded-xl hover:bg-primary-container transition-all font-extrabold text-xs cursor-pointer soft-shadow hover-lift disabled:opacity-80"
                >
                  <Save size={15} />
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan & Ajukan'}
                </button>
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
};

export default SampleDiuji;
