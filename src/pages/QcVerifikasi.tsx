import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Check, 
  X, 
  RefreshCcw, 
  CheckSquare, 
  Square, 
  ChevronDown, 
  ChevronUp, 
  FlaskConical, 
  Cpu, 
  FileText, 
  User, 
  ClipboardCheck, 
  ArrowRight,
  ShieldAlert,
  Sliders,
  Thermometer,
  Layers,
  Search,
  Eye,
  Award,
  ArrowLeft,
  Calendar,
  Sparkles,
  CheckCircle,
  FileSpreadsheet,
  Building2,
  ListTodo
} from 'lucide-react';
import { usePendingQc } from '@/hooks/usePengujian';
import { useApproveQc, useRejectQc, useApproveBulkQc } from '@/hooks/useQc';
import dayjs from 'dayjs';

interface QcCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  items: string[];
}

const QC_CATEGORIES: QcCategory[] = [
  {
    id: 'sampel',
    title: 'QC Sampel',
    description: 'Pemeriksaan kualitas fisik dan keutuhan sampel',
    icon: <Layers size={16} className="text-primary" />,
    items: [
      'Label lengkap',
      'Volume cukup',
      'Tidak bocor',
      'Tidak terkontaminasi',
      'Suhu penyimpanan sesuai',
      'Waktu pengiriman sesuai holding time'
    ]
  },
  {
    id: 'pengambilan',
    title: 'QC Pengambilan Sampel',
    description: 'Verifikasi kepatuhan pengambilan sampel sesuai SOP',
    icon: <Sliders size={16} className="text-secondary" />,
    items: [
      'Metode sampling sesuai SOP',
      'Botol sampling sesuai',
      'Titik sampling benar',
      'Petugas tersertifikasi',
      'Chain of custody lengkap'
    ]
  },
  {
    id: 'alat',
    title: 'QC Alat',
    description: 'Status kalibrasi dan kehandalan alat instrumentasi',
    icon: <Cpu size={16} className="text-indigo-600" />,
    items: [
      'Kalibrasi masih berlaku',
      'Alat bersih',
      'Fungsi alat normal',
      'Ada maintenance record'
    ]
  },
  {
    id: 'pengujian',
    title: 'QC Pengujian',
    description: 'Validasi kontrol blanko, duplo, dan deviasi metode',
    icon: <FlaskConical size={16} className="text-rose-600" />,
    items: [
      'Blanko sesuai',
      'Duplo/triplo sesuai',
      'Control sample lolos',
      'Standard curve valid',
      'Recovery sesuai range',
      'Tidak ada deviasi besar'
    ]
  },
  {
    id: 'lingkungan',
    title: 'QC Lingkungan Lab',
    description: 'Kontrol suhu, kelembaban, dan sterilitas lab',
    icon: <Thermometer size={16} className="text-amber-600" />,
    items: [
      'Suhu ruangan sesuai',
      'Kelembaban sesuai',
      'Tidak ada kontaminasi silang'
    ]
  },
  {
    id: 'dataLims',
    title: 'QC Data / LIMS',
    description: 'Integritas entri data, barcode, dan otorisasi bertingkat',
    icon: <FileText size={16} className="text-blue-600" />,
    items: [
      'Input parameter benar',
      'Barcode sesuai',
      'Tidak duplicate sample',
      'Hasil diverifikasi analis & supervisor'
    ]
  }
];

// Flat list of all criteria items for quick indexing
const ALL_CRITERIA_ITEMS = QC_CATEGORIES.flatMap(cat => 
  cat.items.map(item => ({ categoryId: cat.id, categoryTitle: cat.title, itemName: item }))
);

type QcStatusOption = 'PASS' | 'FAIL' | 'RE-TEST' | 'REJECT_SAMPLE';





interface GroupedPermohonan {
  id: string;
  nomor_permohonan: string;
  nama_pemohon: string;
  nama_instansi: string;
  jenis_sample: string;
  tanggal_pengajuan: string;
  items: any[];
}

const QcVerifikasi: React.FC = () => {
  const { data: response, isLoading } = usePendingQc();
  const approveMutation = useApproveQc();
  const rejectMutation = useRejectQc();
  const bulkApproveMutation = useApproveBulkQc();

  const pendingItems = response?.data || [];

  // Page level state
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDeviation, setFilterDeviation] = useState<'all' | 'deviations_only'>('all');
  const [showDetailModal, setShowDetailModal] = useState<any | null>(null);
  const [expandedPermohonans, setExpandedPermohonans] = useState<Record<string, boolean>>({});

  // Expanded categories in the checklist UI (focused workspace)
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    sampel: true,
    pengujian: true
  });

  // Checklist state: key is `categoryId:itemName`
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  // QC Status state
  const [qcStatus, setQcStatus] = useState<QcStatusOption>('PASS');

  // Custom text notes state
  const [catatanTambahan, setCatatanTambahan] = useState<string>('');

  // Generated note state
  const [generatedCatatan, setGeneratedCatatan] = useState<string>('');

  // Helper function to check if a parameter's value deviates from its standards
  const isExceedingBakuMutu = (item: any) => {
    if (!item.nilai_hasil) return false;
    const value = parseFloat(item.nilai_hasil);
    if (isNaN(value)) return false;
    const min = item.parameter_uji?.baku_mutu_min !== null && item.parameter_uji?.baku_mutu_min !== undefined
      ? parseFloat(item.parameter_uji.baku_mutu_min) 
      : null;
    const max = item.parameter_uji?.baku_mutu_max !== null && item.parameter_uji?.baku_mutu_max !== undefined
      ? parseFloat(item.parameter_uji.baku_mutu_max) 
      : null;
    if (min !== null && value < min) return true;
    if (max !== null && value > max) return true;
    return false;
  };

  // Group pending items by Permohonan ID
  const getGroupedPermohonan = (items: any[]): GroupedPermohonan[] => {
    const groups: Record<string, GroupedPermohonan> = {};

    items.forEach(item => {
      const permohonan = item.sample?.registrasi_sample?.permohonan;
      const permohonanId = permohonan?.id || 'unregistered';
      const nomorPermohonan = permohonan?.nomor_permohonan || 'Belum Terregistrasi';
      const namaPemohon = permohonan?.nama_pemohon || 'Tanpa Pemohon';
      const namaInstansi = permohonan?.nama_instansi || '';
      const jenisSample = item.sample?.jenis_sample || permohonan?.jenis_sample || 'Lainnya';
      const tanggalPengajuan = permohonan?.created_at || item.created_at;

      if (!groups[permohonanId]) {
        groups[permohonanId] = {
          id: permohonanId,
          nomor_permohonan: nomorPermohonan,
          nama_pemohon: namaPemohon,
          nama_instansi: namaInstansi,
          jenis_sample: jenisSample,
          tanggal_pengajuan: tanggalPengajuan,
          items: []
        };
      }

      groups[permohonanId].items.push(item);
    });

    return Object.values(groups);
  };

  // Initialize checklist & reset details when active item changes
  useEffect(() => {
    if (selectedItem) {
      // By default, pre-check all items to speed up workflow
      const initialChecked: Record<string, boolean> = {};
      ALL_CRITERIA_ITEMS.forEach(c => {
        initialChecked[`${c.categoryId}:${c.itemName}`] = true;
      });
      setCheckedItems(initialChecked);
      setQcStatus('PASS');
      setCatatanTambahan('');
      setExpandedCategories({
        sampel: true,
        pengujian: true,
        pengambilan: false,
        alat: false,
        lingkungan: false,
        dataLims: false
      });
    }
  }, [selectedItem]);

  // Compute live generated note whenever checks or status changes
  useEffect(() => {
    if (!selectedItem) return;

    const failedItems: string[] = [];
    let passedCount = 0;

    QC_CATEGORIES.forEach(cat => {
      const catFailed: string[] = [];

      cat.items.forEach(item => {
        const isChecked = checkedItems[`${cat.id}:${item}`];
        if (isChecked) {
          passedCount++;
        } else {
          catFailed.push(item);
        }
      });

      if (catFailed.length > 0) {
        failedItems.push(`${cat.title}: ${catFailed.join(', ')}`);
      }
    });

    const totalCount = ALL_CRITERIA_ITEMS.length;
    
    let noteText = '';
    
    if (qcStatus === 'PASS') {
      noteText = `[PASS] Verifikasi QC Lolos. ${passedCount}/${totalCount} Kriteria ISO 17025 terpenuhi dengan baik.`;
    } else if (qcStatus === 'FAIL') {
      noteText = `[FAIL] Hasil Uji Gagal Verifikasi QC.\n`;
      if (failedItems.length > 0) {
        noteText += `Kriteria QC Belum Terpenuhi:\n` + failedItems.map(f => `- ${f}`).join('\n') + `\n`;
      }
    } else if (qcStatus === 'RE-TEST') {
      noteText = `[RE-TEST] Perlu Pengujian Ulang (Retest) hasil parameter.\n`;
      if (failedItems.length > 0) {
        noteText += `Kriteria QC Belum Terpenuhi:\n` + failedItems.map(f => `- ${f}`).join('\n') + `\n`;
      }
    } else if (qcStatus === 'REJECT_SAMPLE') {
      noteText = `[REJECT SAMPLE] Sampel ditolak karena tidak memenuhi kriteria kualitas.\n`;
      if (failedItems.length > 0) {
        noteText += `Kriteria QC Belum Terpenuhi:\n` + failedItems.map(f => `- ${f}`).join('\n') + `\n`;
      }
    }

    if (catatanTambahan.trim()) {
      noteText += `\nCatatan Tambahan: ${catatanTambahan.trim()}`;
    }

    setGeneratedCatatan(noteText);
  }, [checkedItems, qcStatus, catatanTambahan, selectedItem]);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const handleCheckItem = (categoryId: string, itemName: string) => {
    const key = `${categoryId}:${itemName}`;
    setCheckedItems(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      
      // Auto-suggest changing status if something is unchecked
      const hasUnchecked = ALL_CRITERIA_ITEMS.some(c => {
        const itemKey = `${c.categoryId}:${c.itemName}`;
        return itemKey === key ? !prev[key] === false : !updated[itemKey];
      });

      if (hasUnchecked && qcStatus === 'PASS') {
        setQcStatus('RE-TEST');
      } else if (!hasUnchecked && qcStatus !== 'PASS') {
        setQcStatus('PASS');
      }

      return updated;
    });
  };

  const handleCheckCategoryAll = (categoryId: string, checked: boolean) => {
    const category = QC_CATEGORIES.find(c => c.id === categoryId);
    if (!category) return;

    setCheckedItems(prev => {
      const updated = { ...prev };
      category.items.forEach(item => {
        updated[`${categoryId}:${item}`] = checked;
      });

      // Auto-adjust status
      const hasUnchecked = ALL_CRITERIA_ITEMS.some(c => !updated[`${c.categoryId}:${c.itemName}`]);
      if (hasUnchecked && qcStatus === 'PASS') {
        setQcStatus('RE-TEST');
      } else if (!hasUnchecked && qcStatus !== 'PASS') {
        setQcStatus('PASS');
      }

      return updated;
    });
  };

  const handleCheckAllPerfect = () => {
    const updated: Record<string, boolean> = {};
    ALL_CRITERIA_ITEMS.forEach(c => {
      updated[`${c.categoryId}:${c.itemName}`] = true;
    });
    setCheckedItems(updated);
    setQcStatus('PASS');
  };

  const handleSubmitVerification = () => {
    if (!selectedItem) return;

    const payload = {
      hasil_uji_id: selectedItem.id,
      catatan: generatedCatatan
    };

    const isMutating = approveMutation.isPending || rejectMutation.isPending;
    if (isMutating) return;

    if (qcStatus === 'PASS') {
      approveMutation.mutate(payload, {
        onSuccess: () => setSelectedItem(null)
      });
    } else {
      rejectMutation.mutate(payload, {
        onSuccess: () => setSelectedItem(null)
      });
    }
  };

  const togglePermohonan = (id: string) => {
    setExpandedPermohonans(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Calculations for KPIs
  const criticalCount = pendingItems.filter(isExceedingBakuMutu).length;

  // Group pending items
  const groupedPermohonans = getGroupedPermohonan(pendingItems);

  // Filter grouped permohonans based on Search Query and Deviation filter
  const filteredGroupedPermohonans = groupedPermohonans.map(group => {
    // Filter the items inside this group
    const matchingItems = group.items.filter(item => {
      const namaParameter = item.parameter_uji?.nama_parameter || '';
      const sampleId = item.sample_id || '';
      const analisName = item.analis?.name || '';
      const metode = item.metode_pengujian || item.parameter_uji?.metode_uji || '';

      const matchesSearch = 
        namaParameter.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sampleId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        analisName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        metode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDeviation = 
        filterDeviation === 'all' || 
        (filterDeviation === 'deviations_only' && isExceedingBakuMutu(item));

      return matchesSearch && matchesDeviation;
    });

    return {
      ...group,
      items: matchingItems
    };
  }).filter(group => {
    // Keep group if its metadata matches search, OR if it has matching nested items
    const matchesMetadata = 
      group.nomor_permohonan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.nama_pemohon.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.nama_instansi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.jenis_sample.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesMetadata || group.items.length > 0;
  });

  // Calculate total pending parameters after filters
  const totalFilteredItemsCount = filteredGroupedPermohonans.reduce((sum, group) => sum + group.items.length, 0);

  // Checklist helper stats for workspace
  const totalCount = ALL_CRITERIA_ITEMS.length;
  const passedCount = Object.values(checkedItems).filter(Boolean).length;
  const passPercentage = Math.round((passedCount / totalCount) * 100);

  return (
    <div className="space-y-6">
      {/* ----------------- STATE 1: FOCUSED QC WORKSPACE VIEW ----------------- */}
      {selectedItem ? (
        <div className="space-y-6 animate-backdrop-fade">
          {/* Upper Nav & Focus Header */}
          <div className="bg-white rounded-2xl border border-outline-variant p-4 md:p-6 soft-shadow flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setSelectedItem(null)}
                className="bg-gray-100 hover:bg-gray-200 text-on-surface-variant p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center border border-outline-variant/60"
                title="Kembali ke Daftar Antrean"
              >
                <ArrowLeft size={16} />
              </button>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-headline-lg text-base md:text-lg font-extrabold text-on-surface">
                    Lembar Kerja Verifikasi Mutu
                  </h1>
                  <span className="bg-status-warning/10 text-status-warning px-2 py-0.5 rounded font-extrabold text-[9px] uppercase tracking-wider border border-status-warning/15">
                    Antrean Aktif
                  </span>
                  <span className="bg-blue-600/10 text-blue-600 px-2 py-0.5 rounded font-extrabold text-[9px] uppercase tracking-wider border border-blue-600/15">
                    ISO 17025 Audit
                  </span>
                </div>
                <p className="font-body-md text-xs text-on-surface-variant mt-1 font-medium">
                  ID Verifikasi Uji: <span className="font-mono font-bold">{selectedItem.id}</span>
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedItem(null)}
              className="text-xs font-bold text-on-surface-variant bg-white border border-outline-variant px-4 py-2 rounded-lg hover:bg-surface-container transition-all cursor-pointer flex items-center gap-1.5"
            >
              <ArrowLeft size={14} />
              Kembali ke Daftar
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* WORKSPACE LEFT COLUMN: ISO Accordions (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-outline-variant soft-shadow overflow-hidden">
              <div className="bg-gradient-to-r from-primary to-primary-container p-5 text-on-primary flex justify-between items-center">
                <div>
                  <span className="text-[9px] uppercase tracking-widest font-extrabold bg-white/20 px-2.5 py-0.5 rounded-full">
                    Kriteria Pengujian Laboratorium
                  </span>
                  <h3 className="font-headline-md text-sm md:text-base font-extrabold mt-1.5">
                    {selectedItem.parameter_uji?.nama_parameter || 'Parameter Uji'}
                  </h3>
                  <p className="text-[11px] opacity-90 mt-0.5 font-medium">
                    Metode: {selectedItem.metode_pengujian || selectedItem.parameter_uji?.metode_uji || 'SOP Lab'}
                  </p>
                </div>
                <FlaskConical size={28} className="opacity-80" />
              </div>

              {/* Sample info alert */}
              <div className="p-5 space-y-6">
                <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/60 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold">
                  <div>
                    <span className="text-on-surface-variant font-bold text-[9px] uppercase tracking-wider block">ID Sampel</span>
                    <span className="font-mono font-bold text-primary">{selectedItem.sample_id}</span>
                  </div>
                  <div>
                    <span className="text-on-surface-variant font-bold text-[9px] uppercase tracking-wider block">Analis Penguji</span>
                    <span className="font-bold text-on-surface">{selectedItem.analis?.name || 'Lab Analyst'}</span>
                  </div>
                  <div>
                    <span className="text-on-surface-variant font-bold text-[9px] uppercase tracking-wider block">Nilai Hasil</span>
                    <span className={`font-extrabold text-[13px] ${isExceedingBakuMutu(selectedItem) ? 'text-status-danger' : 'text-on-surface'}`}>
                      {selectedItem.nilai_hasil} {selectedItem.parameter_uji?.satuan}
                    </span>
                  </div>
                  <div>
                    <span className="text-on-surface-variant font-bold text-[9px] uppercase tracking-wider block">Standar Baku Mutu</span>
                    <span className="font-bold text-on-surface">
                      {selectedItem.parameter_uji?.baku_mutu_min !== null || selectedItem.parameter_uji?.baku_mutu_max !== null ? (
                        <>
                          {selectedItem.parameter_uji?.baku_mutu_min !== null && `${selectedItem.parameter_uji?.baku_mutu_min}`}
                          {selectedItem.parameter_uji?.baku_mutu_min !== null && selectedItem.parameter_uji?.baku_mutu_max !== null && ' - '}
                          {selectedItem.parameter_uji?.baku_mutu_max !== null && `${selectedItem.parameter_uji?.baku_mutu_max}`}
                        </>
                      ) : (
                        'Tidak ada'
                      )}
                    </span>
                  </div>
                </div>

                {selectedItem.catatan && (
                  <div className="bg-cream-bg p-3.5 rounded-xl text-xs text-on-surface-variant leading-relaxed italic border border-outline-variant/60 relative">
                    <span className="font-bold text-[8px] uppercase tracking-wider text-primary block not-italic mb-1">Catatan Analis:</span>
                    "{selectedItem.catatan}"
                  </div>
                )}

                {/* Progress bar */}
                <div className="bg-gray-50 p-4 rounded-xl border border-outline-variant/50 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-on-surface">Kepatuhan Kriteria QC Laboratorium</span>
                    <span className={`font-extrabold px-2 py-0.5 rounded text-[10px] uppercase ${
                      passPercentage === 100 
                        ? 'bg-status-success/15 text-status-success' 
                        : 'bg-status-warning/15 text-status-warning'
                    }`}>
                      {passedCount} / {totalCount} Kriteria ({passPercentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 rounded-full ${
                        passPercentage === 100 ? 'bg-status-success' : 'bg-status-warning'
                      }`} 
                      style={{ width: `${passPercentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-[10px] text-on-surface-variant font-medium">
                      Semua kriteria wajib diperiksa secara objektif berdasarkan SOP.
                    </span>
                    <button 
                      onClick={handleCheckAllPerfect}
                      className="text-[10px] font-bold text-primary hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <CheckSquare size={12} />
                      Centang Semua Kriteria (Lolos)
                    </button>
                  </div>
                </div>

                {/* The 6 QC Checklists Accordions */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-on-surface flex items-center gap-1.5 border-b border-outline-variant pb-2">
                    <Sliders size={14} className="text-primary" />
                    Kriteria Checklist Pengujian ISO 17025
                  </h4>

                  <div className="space-y-2">
                    {QC_CATEGORIES.map((cat) => {
                      const isExpanded = !!expandedCategories[cat.id];
                      const catCheckedCount = cat.items.filter(item => checkedItems[`${cat.id}:${item}`]).length;
                      const catTotalCount = cat.items.length;
                      const isCatAllChecked = catCheckedCount === catTotalCount;

                      return (
                        <div 
                          key={cat.id} 
                          className={`border rounded-xl overflow-hidden transition-all duration-200 ${
                            isExpanded 
                              ? 'border-outline border-b-2 bg-white' 
                              : 'border-outline-variant bg-surface-container-lowest'
                          }`}
                        >
                          {/* Accordion Trigger */}
                          <div 
                            className="p-3.5 flex justify-between items-center bg-surface-container/35 cursor-pointer hover:bg-surface-container/60 select-none"
                            onClick={() => toggleCategory(cat.id)}
                          >
                            <div className="flex items-center gap-2.5">
                              {cat.icon}
                              <div>
                                <span className="text-xs font-bold text-on-surface block leading-tight">
                                  {cat.title}
                                </span>
                                <span className="text-[9px] text-on-surface-variant font-medium hidden md:inline">
                                  {cat.description}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
                              {/* Check all inside category */}
                              <button
                                type="button"
                                onClick={() => handleCheckCategoryAll(cat.id, !isCatAllChecked)}
                                className={`text-[9px] font-bold px-2 py-0.5 rounded border transition-all ${
                                  isCatAllChecked 
                                    ? 'bg-status-success/10 border-status-success/20 text-status-success' 
                                    : 'bg-white border-outline-variant hover:border-outline text-on-surface-variant'
                                }`}
                              >
                                {isCatAllChecked ? 'Semua Lolos' : 'Loloskan Semua'}
                              </button>

                              <div 
                                onClick={() => toggleCategory(cat.id)} 
                                className="text-on-surface-variant hover:text-on-surface cursor-pointer"
                              >
                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </div>
                            </div>
                          </div>

                          {/* Accordion Body */}
                          {isExpanded && (
                            <div className="p-4 bg-white border-t border-outline-variant/60 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                              {cat.items.map((item) => {
                                const itemKey = `${cat.id}:${item}`;
                                const isChecked = !!checkedItems[itemKey];
                                return (
                                  <label 
                                    key={item}
                                    className={`flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer select-none transition-all ${
                                      isChecked 
                                        ? 'bg-emerald-50/50 border-emerald-100 text-emerald-800' 
                                        : 'bg-gray-50/30 border-gray-100 hover:bg-gray-50/80 text-on-surface'
                                    }`}
                                  >
                                    <input 
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => handleCheckItem(cat.id, item)}
                                      className="sr-only"
                                    />
                                    <div className="mt-0.5">
                                      {isChecked ? (
                                        <CheckSquare size={14} className="text-status-success fill-status-success/10" />
                                      ) : (
                                        <Square size={14} className="text-gray-400" />
                                      )}
                                    </div>
                                    <span className="font-semibold text-[11px] leading-tight">
                                      {item}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* WORKSPACE RIGHT COLUMN: Decision & Submission Form (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white rounded-2xl border border-outline-variant p-5 soft-shadow space-y-6">
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-on-surface flex items-center gap-1.5 border-b border-outline-variant pb-2">
                    <ShieldAlert size={14} className="text-primary" />
                    Keputusan Hasil Quality Control (QC)
                  </h4>

                  <div className="grid grid-cols-2 gap-3">
                    {/* PASS (Disetujui) */}
                    <div 
                      onClick={() => {
                        setQcStatus('PASS');
                        // If passing, set all checked by default
                        const updated: Record<string, boolean> = {};
                        ALL_CRITERIA_ITEMS.forEach(c => {
                          updated[`${c.categoryId}:${c.itemName}`] = true;
                        });
                        setCheckedItems(updated);
                      }}
                      className={`p-4 rounded-xl border cursor-pointer flex flex-col items-center text-center justify-between gap-1 transition-all ${
                        qcStatus === 'PASS' 
                          ? 'border-status-success bg-status-success/5 text-status-success shadow-sm ring-1 ring-status-success/45' 
                          : 'border-outline-variant hover:border-outline bg-white text-on-surface-variant'
                      }`}
                    >
                      <Check size={18} className={qcStatus === 'PASS' ? 'text-status-success' : 'text-gray-400'} />
                      <span className="font-extrabold text-[10px] tracking-wider uppercase mt-1.5">PASS</span>
                      <span className="text-[8px] opacity-75 leading-tight font-medium">Lolos Kriteria</span>
                    </div>

                    {/* RE-TEST (Uji Ulang) */}
                    <div 
                      onClick={() => setQcStatus('RE-TEST')}
                      className={`p-4 rounded-xl border cursor-pointer flex flex-col items-center text-center justify-between gap-1 transition-all ${
                        qcStatus === 'RE-TEST' 
                          ? 'border-status-warning bg-status-warning/5 text-status-warning shadow-sm ring-1 ring-status-warning/45' 
                          : 'border-outline-variant hover:border-outline bg-white text-on-surface-variant'
                      }`}
                    >
                      <RefreshCcw size={18} className={qcStatus === 'RE-TEST' ? 'text-status-warning animate-spin-slow' : 'text-gray-400'} />
                      <span className="font-extrabold text-[10px] tracking-wider uppercase mt-1.5">RE-TEST</span>
                      <span className="text-[8px] opacity-75 leading-tight font-medium">Pengujian Ulang</span>
                    </div>

                    {/* FAIL (Ditolak) */}
                    <div 
                      onClick={() => setQcStatus('FAIL')}
                      className={`p-4 rounded-xl border cursor-pointer flex flex-col items-center text-center justify-between gap-1 transition-all ${
                        qcStatus === 'FAIL' 
                          ? 'border-status-danger bg-status-danger/5 text-status-danger shadow-sm ring-1 ring-status-danger/45' 
                          : 'border-outline-variant hover:border-outline bg-white text-on-surface-variant'
                      }`}
                    >
                      <X size={18} className={qcStatus === 'FAIL' ? 'text-status-danger' : 'text-gray-400'} />
                      <span className="font-extrabold text-[10px] tracking-wider uppercase mt-1.5">FAIL</span>
                      <span className="text-[8px] opacity-75 leading-tight font-medium">Uji Gagal Total</span>
                    </div>

                    {/* REJECT SAMPLE (Tolak Sampel Fisik) */}
                    <div 
                      onClick={() => setQcStatus('REJECT_SAMPLE')}
                      className={`p-4 rounded-xl border cursor-pointer flex flex-col items-center text-center justify-between gap-1 transition-all ${
                        qcStatus === 'REJECT_SAMPLE' 
                          ? 'border-red-900 bg-red-950/5 text-red-900 shadow-sm ring-1 ring-red-900/45' 
                          : 'border-outline-variant hover:border-outline bg-white text-on-surface-variant'
                      }`}
                    >
                      <AlertTriangle size={18} className={qcStatus === 'REJECT_SAMPLE' ? 'text-red-900' : 'text-gray-400'} />
                      <span className="font-extrabold text-[10px] tracking-wider uppercase mt-1.5">REJECT SAMPLE</span>
                      <span className="text-[8px] opacity-75 leading-tight font-medium">Sampel Cacat/Fisik</span>
                    </div>
                  </div>
                </div>

                {/* Notes Input & Live Notes Output */}
                <div className="space-y-4 border-t border-outline-variant pt-4 text-xs">
                  <div className="space-y-1.5">
                    <label htmlFor="catatanTambahan" className="font-bold text-on-surface">
                      Catatan Tambahan Verifikasi (Opsional)
                    </label>
                    <textarea
                      id="catatanTambahan"
                      value={catatanTambahan}
                      onChange={(e) => setCatatanTambahan(e.target.value)}
                      placeholder="Masukkan ulasan laboratorium atau catatan pengecualian khusus..."
                      rows={3}
                      className="w-full p-3 border border-outline-variant rounded-xl focus:outline-none focus:border-primary text-xs font-semibold bg-gray-50 focus:bg-white transition-all leading-relaxed"
                    />
                  </div>

                  {/* Audit trail preview */}
                  <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/60 space-y-2">
                    <span className="block font-bold text-[9px] uppercase tracking-wider text-on-surface-variant">
                      Review Catatan Log Audit QC (Akan Disimpan ke Database)
                    </span>
                    <pre className="text-[10px] text-on-surface-variant font-mono whitespace-pre-wrap leading-relaxed max-h-28 overflow-y-auto bg-white/70 p-2.5 rounded-lg border border-outline-variant/30">
                      {generatedCatatan}
                    </pre>
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-3 border-t border-outline-variant pt-4">
                  <button
                    onClick={() => setSelectedItem(null)}
                    disabled={approveMutation.isPending || rejectMutation.isPending}
                    className="flex-1 py-3 bg-white border border-outline-variant text-on-surface font-extrabold text-xs hover:bg-surface-container rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 disabled:opacity-60"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSubmitVerification}
                    disabled={approveMutation.isPending || rejectMutation.isPending}
                    className={`flex-[2] py-3 font-extrabold text-xs rounded-xl transition-all cursor-pointer soft-shadow flex items-center justify-center gap-1.5 disabled:opacity-85 text-white ${
                      qcStatus === 'PASS' 
                        ? 'bg-status-success hover:bg-status-success/95 hover:scale-[1.01] active:scale-[0.99]' 
                        : qcStatus === 'RE-TEST' 
                          ? 'bg-status-warning hover:bg-status-warning/95 hover:scale-[1.01] active:scale-[0.99]'
                          : qcStatus === 'FAIL'
                            ? 'bg-status-danger hover:bg-status-danger/95 hover:scale-[1.01] active:scale-[0.99]'
                            : 'bg-red-900 hover:bg-red-950 hover:scale-[1.01] active:scale-[0.99]'
                    }`}
                  >
                    {approveMutation.isPending || rejectMutation.isPending ? (
                      'Memproses...'
                    ) : (
                      <>
                        <Check size={15} />
                        Kirim Keputusan QC ({qcStatus})
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // ----------------- STATE 2: NO CLUTTER NESTED ACCORDION VIEW -----------------
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="border-b border-outline-variant pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-headline-lg text-lg md:text-xl font-extrabold text-on-surface flex items-center gap-2">
                  <ClipboardCheck className="text-primary" size={24} />
                  Verifikasi Mutu & QC Laboratorium
                </h1>
                <span className="flex items-center gap-1 bg-primary/10 text-primary font-label-md text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  <Sparkles size={10} />
                  ISO 17025
                </span>
              </div>
              <p className="font-body-md text-xs text-on-surface-variant mt-1 font-medium">
                Pemeriksaan kualitas hasil pengujian berdasarkan kriteria akreditasi laboratorium ISO/IEC 17025. Terkelompok secara sistematis berdasarkan permohonan.
              </p>
            </div>
          </div>

          {/* Premium KPI Summary Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* KPI 1: Active Applications */}
            <div className="bg-white p-5 rounded-2xl border border-outline-variant soft-shadow flex items-center justify-between hover-lift">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Permohonan Aktif QC</span>
                <span className="font-headline-lg text-2xl font-extrabold text-primary block">
                  {isLoading ? '...' : groupedPermohonans.length}
                </span>
                <span className="text-[9px] text-on-surface-variant font-medium block">Berkas pengujian terkelompok</span>
              </div>
              <div className="p-3.5 bg-primary/10 rounded-2xl text-primary border border-primary/15">
                <FileText size={22} />
              </div>
            </div>

            {/* KPI 2: Total Pending Parameters */}
            <div className="bg-white p-5 rounded-2xl border border-outline-variant soft-shadow flex items-center justify-between hover-lift">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Total Antrean Parameter</span>
                <span className="font-headline-lg text-2xl font-extrabold text-status-warning block">
                  {isLoading ? '...' : pendingItems.length}
                </span>
                <span className="text-[9px] text-on-surface-variant font-medium block">Hasil uji menunggu validasi QC</span>
              </div>
              <div className="p-3.5 bg-status-warning/10 rounded-2xl text-status-warning border border-status-warning/15">
                <Layers size={22} />
              </div>
            </div>

            {/* KPI 3: Status Accreditation */}
            <div className="bg-white p-5 rounded-2xl border border-outline-variant soft-shadow flex items-center justify-between hover-lift">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Standar Penilaian</span>
                <span className="font-headline-lg text-lg font-extrabold text-primary flex items-center gap-1 block mt-1">
                  KAN REGISTERED
                </span>
                <span className="text-[9px] text-on-surface-variant font-medium block">Laboratorium Penguji LP-XXX-IDN</span>
              </div>
              <div className="p-3.5 bg-emerald-50 text-status-success rounded-2xl border border-emerald-100">
                <Award size={22} />
              </div>
            </div>
          </div>

          {/* Search Bar & Controls */}
          <div className="bg-white p-4 rounded-2xl border border-outline-variant soft-shadow flex flex-col md:flex-row gap-4 items-center justify-between text-xs">
            <div className="relative w-full md:w-80">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-on-surface-variant">
                <Search size={14} />
              </span>
              <input
                type="text"
                placeholder="Cari permohonan, parameter, analis, metode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-outline-variant rounded-xl focus:outline-none focus:border-primary font-medium"
              />
            </div>

            <div className="flex gap-2 w-full md:w-auto overflow-x-auto self-start md:self-center">
              <span className="text-on-surface-variant font-bold flex items-center gap-1.5 shrink-0">
                Penyaringan Baku Mutu:
              </span>
              <button
                onClick={() => setFilterDeviation('all')}
                className={`px-4 py-2 rounded-lg border font-bold text-[10px] uppercase transition-all cursor-pointer ${
                  filterDeviation === 'all' 
                    ? 'bg-primary text-on-primary border-primary shadow-sm' 
                    : 'bg-white border-outline-variant text-on-surface-variant hover:border-outline'
                }`}
              >
                Semua ({pendingItems.length})
              </button>
              <button
                onClick={() => setFilterDeviation('deviations_only')}
                className={`px-4 py-2 rounded-lg border font-bold text-[10px] uppercase transition-all cursor-pointer flex items-center gap-1.5 ${
                  filterDeviation === 'deviations_only' 
                    ? 'bg-status-danger text-white border-status-danger shadow-sm' 
                    : 'bg-white border-outline-variant text-on-surface-variant hover:border-outline'
                }`}
              >
                <AlertTriangle size={12} />
                Menyimpang ({criticalCount})
              </button>
            </div>
          </div>

          {/* Hierarchical Accordions */}
          <div className="space-y-4">
            <div className="bg-white px-4.5 py-3.5 rounded-xl border border-outline-variant/60 flex justify-between items-center text-xs font-bold text-on-surface-variant">
              <span>Daftar Permohonan Menunggu QC: {isLoading ? '...' : filteredGroupedPermohonans.length} Permohonan</span>
              <span className="text-[10px] text-primary bg-primary/5 px-2.5 py-0.5 rounded-full font-bold">
                Total {totalFilteredItemsCount} Parameter Uji
              </span>
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {[1, 2].map((idx) => (
                  <div key={idx} className="bg-white p-5 rounded-2xl border border-outline-variant soft-shadow animate-pulse space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                    <div className="h-3.5 bg-gray-100 rounded w-1/4" />
                  </div>
                ))}
              </div>
            ) : filteredGroupedPermohonans.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-2xl border border-outline-variant soft-shadow text-on-surface-variant text-xs font-semibold">
                Tidak ada antrean QC yang cocok dengan filter pencarian saat ini.
              </div>
            ) : (
              <div className="space-y-3.5">
                {filteredGroupedPermohonans.map((group) => {
                  const isExpanded = !!expandedPermohonans[group.id];
                  const hasGroupDeviation = group.items.some(isExceedingBakuMutu);

                  return (
                    <div 
                      key={group.id} 
                      className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden soft-shadow ${
                        isExpanded 
                          ? 'border-primary ring-1 ring-primary/20' 
                          : 'border-outline-variant hover:border-primary-fixed'
                      }`}
                    >
                      {/* Accordion Trigger (Permohonan Header Row) */}
                      <div 
                        onClick={() => togglePermohonan(group.id)}
                        className={`p-4 md:p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 cursor-pointer select-none transition-colors ${
                          isExpanded ? 'bg-primary/5' : 'hover:bg-gray-50/50'
                        }`}
                      >
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-extrabold text-sm text-primary">
                              {group.nomor_permohonan}
                            </span>
                            <span className="text-[10px] font-bold text-on-surface-variant flex items-center gap-1 font-semibold">
                              <Calendar size={12} className="text-gray-400" />
                              {dayjs(group.tanggal_pengajuan).format('DD MMM YYYY')}
                            </span>
                            {hasGroupDeviation && (
                              <span className="bg-status-danger/10 text-status-danger px-2.5 py-0.5 rounded-full font-bold text-[9px] uppercase flex items-center gap-1 border border-status-danger/15 shrink-0">
                                <AlertTriangle size={10} />
                                Butuh Perhatian (Menyimpang)
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs flex-wrap font-semibold">
                            <span className="text-on-surface flex items-center gap-1">
                              <User size={13} className="text-gray-400" />
                              {group.nama_pemohon}
                            </span>
                            {group.nama_instansi && (
                              <span className="text-on-surface-variant flex items-center gap-1 border-l border-outline-variant/60 pl-3">
                                <Building2 size={13} className="text-gray-400" />
                                {group.nama_instansi}
                              </span>
                            )}
                            <span className="text-on-surface-variant flex items-center gap-1 border-l border-outline-variant/60 pl-3 uppercase text-[10px] tracking-wider font-extrabold">
                              Kategori: {group.jenis_sample}
                            </span>
                          </div>
                        </div>

                        {/* Accordion Stats & Toggle Controls */}
                        <div className="flex items-center gap-4.5 self-end md:self-center shrink-0" onClick={e => e.stopPropagation()}>
                          <div className="text-right hidden sm:block">
                            <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider block">Kekurangan Validasi</span>
                            <span className="font-extrabold text-xs text-status-warning flex items-center justify-end gap-1">
                              <ListTodo size={13} />
                              {group.items.length} Parameter Uji
                            </span>
                          </div>

                          <button
                            onClick={() => togglePermohonan(group.id)}
                            className="bg-white hover:bg-gray-100 text-on-surface-variant p-2 rounded-xl transition-all cursor-pointer border border-outline-variant/60 flex items-center justify-center"
                          >
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        </div>
                      </div>

                      {/* Accordion Body (Expanded Nested Samples & Parameters Table) */}
                      {isExpanded && (
                        <div className="border-t border-outline-variant bg-gray-50/30 p-4 md:p-5">
                          <div className="bg-white rounded-xl border border-outline-variant overflow-hidden soft-shadow">
                            <table className="w-full text-left">
                              <thead>
                                <tr className="bg-surface-container border-b border-outline-variant text-[9px] font-extrabold text-on-surface-variant uppercase tracking-wider">
                                  <th className="p-3">Kode Sampel</th>
                                  <th className="p-3">Parameter Uji</th>
                                  <th className="p-3">Hasil Uji</th>
                                  <th className="p-3">Baku Mutu</th>
                                  <th className="p-3">Analis</th>
                                  <th className="p-3 text-center">Tindakan</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-outline-variant text-xs font-semibold text-on-surface">
                                {group.items.map((item: any) => {
                                  const hasItemDeviation = isExceedingBakuMutu(item);
                                  return (
                                    <tr key={item.id} className="hover:bg-surface-container-low transition-all">
                                      <td className="p-3 font-mono text-[11px] text-on-surface-variant font-semibold">
                                        {item.sample?.kode_sample || item.sample_id.substring(0, 12)}
                                      </td>
                                      <td className="p-3 font-extrabold text-primary">
                                        <div>{item.parameter_uji?.nama_parameter || 'Parameter Uji'}</div>
                                        <span className="text-[9px] font-semibold text-on-surface-variant block uppercase mt-0.5">
                                          Metode: {item.metode_pengujian || item.parameter_uji?.metode_uji || 'SOP Lab'}
                                        </span>
                                      </td>
                                      <td className="p-3">
                                        <span className={`font-extrabold text-sm ${hasItemDeviation ? 'text-status-danger bg-status-danger/5 px-2 py-0.5 rounded border border-status-danger/10 block w-fit' : 'text-on-surface'}`}>
                                          {item.nilai_hasil}
                                          <span className="text-[10px] font-medium ml-0.5 text-on-surface-variant">
                                            {item.parameter_uji?.satuan || ''}
                                          </span>
                                        </span>
                                      </td>
                                      <td className="p-3 text-on-surface-variant font-bold text-[11px]">
                                        {item.parameter_uji?.baku_mutu_min !== null || item.parameter_uji?.baku_mutu_max !== null ? (
                                          <>
                                            {item.parameter_uji?.baku_mutu_min !== null && `${item.parameter_uji?.baku_mutu_min}`}
                                            {item.parameter_uji?.baku_mutu_min !== null && item.parameter_uji?.baku_mutu_max !== null && ' - '}
                                            {item.parameter_uji?.baku_mutu_max !== null && `${item.parameter_uji?.baku_mutu_max}`}
                                          </>
                                        ) : (
                                          'Tidak ada'
                                        )}
                                      </td>
                                      <td className="p-3 text-on-surface-variant flex items-center gap-1 font-semibold mt-2">
                                        <User size={12} className="text-primary/70" />
                                        {item.analis?.name || 'Analis'}
                                      </td>
                                      <td className="p-3">
                                        <div className="flex items-center justify-center gap-2">
                                          <button
                                            onClick={() => setShowDetailModal(item)}
                                            className="px-3 py-1.5 border border-outline-variant text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-lg font-bold text-[10px] uppercase flex items-center gap-1 transition-all cursor-pointer"
                                          >
                                            <Eye size={12} />
                                            Detail
                                          </button>

                                          <button
                                            onClick={() => setSelectedItem(item)}
                                            className="px-3 py-1.5 bg-primary text-on-primary hover:bg-primary-container rounded-lg font-bold text-[10px] uppercase flex items-center gap-1.5 soft-shadow transition-all cursor-pointer hover:translate-x-0.5"
                                          >
                                            Mulai
                                            <ArrowRight size={12} />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>

                          {group.items.length > 0 && (
                            <div className="mt-3.5 flex justify-end">
                              <button
                                id={`bulk-approve-${group.id}`}
                                disabled={bulkApproveMutation.isPending}
                                onClick={() => {
                                  if (window.confirm(`Apakah Anda yakin ingin menyetujui (PASS) semua ${group.items.length} parameter uji untuk permohonan ${group.nomor_permohonan}?`)) {
                                    bulkApproveMutation.mutate({
                                      hasil_uji_ids: group.items.map((it: any) => it.id),
                                      catatan: `[PASS] Verifikasi QC Lolos secara Masal (Bulk Approve) Kriteria ISO 17025 terpenuhi.`
                                    });
                                  }
                                }}
                                className="px-4 py-2 bg-status-success hover:bg-status-success/90 text-white font-extrabold text-[10px] uppercase rounded-xl transition-all cursor-pointer flex items-center gap-1.5 soft-shadow disabled:opacity-60"
                              >
                                <CheckCircle size={13} />
                                {bulkApproveMutation.isPending ? 'Memproses...' : 'Kirim Semua Keputusan (Lolos)'}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ----------------- STATIC DETAIL PREVIEW MODAL ----------------- */}
      {showDetailModal && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-backdrop-fade">
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden soft-shadow border border-outline-variant animate-modal-zoom">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-primary to-primary-container p-4.5 text-on-primary flex justify-between items-center">
              <div className="flex items-center gap-2">
                <FileSpreadsheet size={20} />
                <div>
                  <h3 className="font-headline-md text-sm md:text-base font-extrabold">
                    Tinjauan Teknis Parameter Pengujian
                  </h3>
                  <span className="text-[9px] uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded font-extrabold block w-fit mt-0.5">
                    Antrean Verifikasi Mutu ISO 17025
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setShowDetailModal(null)}
                className="bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-all cursor-pointer text-on-primary"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto text-xs font-semibold text-on-surface">
              
              {/* Status & ID Badge */}
              <div className="flex justify-between items-center border-b border-outline-variant/60 pb-4">
                <div>
                  <span className="text-[10px] text-on-surface-variant font-bold block uppercase tracking-wider">ID Pengujian</span>
                  <span className="font-mono font-bold text-sm text-on-surface">{showDetailModal.id}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-on-surface-variant font-bold block uppercase tracking-wider mb-1">Penyimpangan Baku Mutu</span>
                  {isExceedingBakuMutu(showDetailModal) ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full font-extrabold text-[10px] uppercase bg-status-danger/10 border border-status-danger/15 text-status-danger">
                      <AlertTriangle size={11} />
                      Menyimpang (Out of Range)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full font-extrabold text-[10px] uppercase bg-status-success/10 border border-status-success/15 text-status-success">
                      <CheckCircle size={11} />
                      Dalam Batas Baku Mutu
                    </span>
                  )}
                </div>
              </div>

              {/* Sample and Parameter Details Card */}
              <div className="bg-cream-bg border border-outline-variant p-4 rounded-xl space-y-4">
                <h4 className="font-bold text-xs text-primary flex items-center gap-1.5">
                  <Layers size={14} />
                  Informasi Parameter & Hasil Pengujian
                </h4>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <span className="text-on-surface-variant font-bold text-[9px] uppercase tracking-wider block">Nama Parameter</span>
                    <span className="font-extrabold text-on-surface text-[12px] block mt-0.5">
                      {showDetailModal.parameter_uji?.nama_parameter || 'Parameter Uji'}
                    </span>
                  </div>
                  <div>
                    <span className="text-on-surface-variant font-bold text-[9px] uppercase tracking-wider block">ID Sampel</span>
                    <span className="font-mono font-bold text-on-surface block mt-0.5">{showDetailModal.sample_id}</span>
                  </div>
                  <div>
                    <span className="text-on-surface-variant font-bold text-[9px] uppercase tracking-wider block">Nilai Hasil</span>
                    <span className="font-extrabold text-primary text-[12px] block mt-0.5">
                      {showDetailModal.nilai_hasil} {showDetailModal.parameter_uji?.satuan}
                    </span>
                  </div>
                  <div>
                    <span className="text-on-surface-variant font-bold text-[9px] uppercase tracking-wider block">Metode Pengujian</span>
                    <span className="font-bold text-on-surface block mt-0.5">{showDetailModal.metode_pengujian || showDetailModal.parameter_uji?.metode_uji || 'SOP Lab'}</span>
                  </div>
                </div>
              </div>

              {/* Audit trail metadata */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-surface-container-low p-3.5 rounded-lg border border-outline-variant/60 flex items-center gap-3">
                  <div className="p-2.5 bg-primary/10 rounded-full text-primary">
                    <User size={16} />
                  </div>
                  <div>
                    <span className="text-on-surface-variant font-bold text-[9px] uppercase tracking-wider block">Analis Laboratorium</span>
                    <span className="font-bold text-on-surface text-[11px] block mt-0.5">{showDetailModal.analis?.name || 'Analis'}</span>
                    <span className="text-[9px] text-on-surface-variant block font-medium">Petugas Pembuat Laporan</span>
                  </div>
                </div>

                <div className="bg-surface-container-low p-3.5 rounded-lg border border-outline-variant/60 flex items-center gap-3">
                  <div className="p-2.5 bg-secondary/10 rounded-full text-secondary">
                    <Calendar size={16} />
                  </div>
                  <div>
                    <span className="text-on-surface-variant font-bold text-[9px] uppercase tracking-wider block">Waktu Pengajuan</span>
                    <span className="font-bold text-on-surface text-[11px] block mt-0.5">
                      {dayjs(showDetailModal.created_at).format('DD MMMM YYYY HH:mm')}
                    </span>
                    <span className="text-[9px] text-on-surface-variant block font-medium">Masuk antrean QC</span>
                  </div>
                </div>
              </div>

              {/* Checklist & Comments parsed report */}
              {showDetailModal.catatan && (
                <div className="space-y-2">
                  <h4 className="font-bold text-xs text-on-surface flex items-center gap-1.5 border-b border-outline-variant pb-2">
                    Catatan Tambahan dari Analis
                  </h4>
                  <p className="bg-gray-50 p-4 rounded-xl border border-outline-variant/60 text-[11px] text-on-surface-variant leading-relaxed italic">
                    "{showDetailModal.catatan}"
                  </p>
                </div>
              )}

              {/* QC criteria guideline alert */}
              <div className="bg-blue-50/30 border border-blue-200/50 p-4 rounded-xl flex items-start gap-2.5">
                <CheckSquare className="text-blue-600 mt-0.5 shrink-0" size={16} />
                <div className="text-[11px] leading-relaxed text-blue-900 font-medium">
                  <span className="font-bold block mb-0.5 text-blue-950">Pedoman Kepatuhan KAN & ISO 17025</span>
                  Data di atas adalah hasil perekaman pengujian primer. Untuk memulai checklist audit kepatuhan (seperti volume sampel, keutuhan kemasan, kalibrasi alat, blanko, dan duplo), silakan tutup jendela detail ini dan klik tombol <span className="font-extrabold text-blue-950">Mulai</span> untuk masuk ke Lembar Kerja QC penuh.
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-surface-container p-4 flex justify-between gap-3 border-t border-outline-variant">
              <button
                onClick={() => {
                  const targetItem = showDetailModal;
                  setShowDetailModal(null);
                  setSelectedItem(targetItem);
                }}
                className="px-5 py-2.5 bg-primary text-on-primary font-bold text-xs rounded-xl hover:bg-primary-container soft-shadow cursor-pointer transition-all flex items-center gap-1.5"
              >
                Mulai Verifikasi
                <ArrowRight size={14} />
              </button>
              <button
                onClick={() => setShowDetailModal(null)}
                className="px-5 py-2.5 bg-white border border-outline-variant text-on-surface font-bold text-xs rounded-xl hover:bg-surface-container cursor-pointer transition-all"
              >
                Tutup Ringkasan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QcVerifikasi;
