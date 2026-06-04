import React, { useState, useEffect } from 'react';
import { 
  FlaskConical, 
  AlertTriangle, 
  CheckCircle, 
  Save, 
  Droplet, 
  Flame, 
  Wind, 
  Globe, 
  Sparkles, 
  Apple, 
  Activity,
  FileSpreadsheet
} from 'lucide-react';
import { toast } from 'sonner';
import { useSubmitHasilUji } from '@/hooks/usePengujian';
import { useRegistrasiList } from '@/hooks/useRegistrasi';

interface LocalParam {
  hasilUjiId: string;
  parameterId: string;
  name: string;
  unit: string;
  limitMin: number | null;
  limitMax: number | null;
  metode: string;
  enteredValue: string;
  status: string;
  tipePengujian: string;
}

const CATEGORY_STYLES: Record<string, { 
  bg: string; 
  border: string; 
  text: string; 
  icon: React.ReactNode; 
  label: string;
}> = {
  'Air (Sanitasi / Minum)': {
    bg: 'bg-blue-50/80 backdrop-blur-sm',
    border: 'border-blue-100',
    text: 'text-blue-700',
    icon: <Droplet size={18} className="text-blue-500 animate-pulse" />,
    label: 'Air (Sanitasi / Minum)',
  },
  'Air Limbah Industri / Domestik': {
    bg: 'bg-emerald-50/80 backdrop-blur-sm',
    border: 'border-emerald-100',
    text: 'text-emerald-700',
    icon: <Flame size={18} className="text-emerald-500 animate-pulse" />,
    label: 'Air Limbah Industri / Domestik',
  },
  'Makanan & Minuman': {
    bg: 'bg-amber-50/80 backdrop-blur-sm',
    border: 'border-amber-100',
    text: 'text-amber-700',
    icon: <Apple size={18} className="text-amber-500" />,
    label: 'Makanan & Minuman',
  },
  'Kualitas Udara': {
    bg: 'bg-sky-50/80 backdrop-blur-sm',
    border: 'border-sky-100',
    text: 'text-sky-700',
    icon: <Wind size={18} className="text-sky-500" />,
    label: 'Kualitas Udara',
  },
  'Tanah & Sedimen': {
    bg: 'bg-orange-50/80 backdrop-blur-sm',
    border: 'border-orange-100',
    text: 'text-orange-700',
    icon: <Globe size={18} className="text-orange-500" />,
    label: 'Tanah & Sedimen',
  },
  'Swab Lingkungan': {
    bg: 'bg-purple-50/80 backdrop-blur-sm',
    border: 'border-purple-100',
    text: 'text-purple-700',
    icon: <Activity size={18} className="text-purple-500" />,
    label: 'Swab Lingkungan',
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

const Pengujian: React.FC = () => {
  const { data: sampleResponse, isLoading: samplesLoading, refetch: refetchSamples } = useRegistrasiList();
  const submitMutation = useSubmitHasilUji();

  const samples = sampleResponse?.data || [];
  const [selectedSampleIdx, setSelectedSampleIdx] = useState(0);
  const [localParams, setLocalParams] = useState<LocalParam[]>([]);

  const activeSample = samples[selectedSampleIdx];
  const activePhysicalSample = activeSample?.samples?.[0] || activeSample?.sample;
  const jenisSample = activePhysicalSample?.jenis_sample || 'Air (Sanitasi / Minum)';

  // Synchronize local params when selected sample or its test parameters change
  useEffect(() => {
    if (activePhysicalSample && activePhysicalSample.hasil_uji) {
      setLocalParams(
        activePhysicalSample.hasil_uji.map((hu: any) => {
          const limitMin = hu.parameter_uji?.baku_mutu_min !== null && hu.parameter_uji?.baku_mutu_min !== undefined
            ? parseFloat(hu.parameter_uji.baku_mutu_min)
            : null;
          const limitMax = hu.parameter_uji?.baku_mutu_max !== null && hu.parameter_uji?.baku_mutu_max !== undefined
            ? parseFloat(hu.parameter_uji.baku_mutu_max)
            : null;

          return {
            hasilUjiId: hu.id,
            parameterId: hu.parameter_uji_id,
            name: hu.parameter_uji?.nama_parameter || 'Unknown',
            unit: hu.parameter_uji?.satuan || '-',
            limitMin,
            limitMax,
            metode: hu.metode_pengujian || hu.parameter_uji?.metode_uji || 'Manual',
            enteredValue: hu.nilai_hasil !== null && hu.nilai_hasil !== undefined ? String(hu.nilai_hasil) : '',
            status: (hu.status_hasil || 'DRAFT').toUpperCase(),
            tipePengujian: hu.parameter_uji?.tipe_pengujian || 'laboratorium',
          };
        })
      );
    } else {
      setLocalParams([]);
    }
  }, [selectedSampleIdx, activeSample, activePhysicalSample]);

  // Only lab parameters are entered here — on-site data comes from the mobile app
  const labParams = localParams.filter(p => p.tipePengujian !== 'on_site');

  const handleValueChange = (parameterId: string, val: string) => {
    setLocalParams(prev =>
      prev.map(p => (p.parameterId === parameterId ? { ...p, enteredValue: val } : p))
    );
  };

  const handleSaveResults = async () => {
    if (!activeSample) {
      toast.error('Pilih sampel terlebih dahulu.');
      return;
    }

    const targetSampleId = activePhysicalSample?.id;
    if (!targetSampleId) {
      toast.error('ID fisik sampel tidak valid.');
      return;
    }

    const activeParamsToSubmit = localParams.filter(p => p.status !== 'APPROVED' && p.status !== 'PENDING_QC');
    if (activeParamsToSubmit.length === 0) {
      toast.error('Seluruh parameter uji untuk sampel ini telah selesai diproses.');
      return;
    }

    const filledParams = activeParamsToSubmit.filter(p => p.enteredValue !== '');
    if (filledParams.length === 0) {
      toast.error('Isi minimal satu nilai hasil uji sebelum menyimpan.');
      return;
    }

    try {
      // Submit each parameter test result sequentially or via Promise.all
      await Promise.all(
        filledParams.map(p => 
          submitMutation.mutateAsync({
            sample_id: targetSampleId,
            parameter_uji_id: p.parameterId,
            nilai_hasil: parseFloat(p.enteredValue),
            metode_pengujian: p.metode,
            catatan: `Hasil diinput via web pengujian.`,
          })
        )
      );
      
      toast.success('Seluruh parameter hasil uji berhasil disimpan!');
      refetchSamples();
    } catch (error: any) {
      console.error(error);
      const errorMsg = error?.response?.data?.message || 'Terjadi kesalahan saat menyimpan hasil uji.';
      toast.error(errorMsg);
    }
  };

  const categoryStyle = CATEGORY_STYLES[jenisSample] || CATEGORY_STYLES['Air (Sanitasi / Minum)'];

  return (
    <div className="space-y-6">
      {/* Header and Sample Selection */}
      <div className="border-b border-outline-variant pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-headline-lg text-lg md:text-xl font-extrabold text-on-surface flex items-center gap-2">
            <FlaskConical className="text-primary animate-pulse" />
            Entri Hasil Pengujian Laboratorium
          </h1>
          <p className="font-body-md text-xs text-on-surface-variant mt-1 font-medium">
            Entri nilai parameter lab dan validasi kepatuhan baku mutu nasional berdasarkan jenis sampel.
          </p>
        </div>

        {/* Dropdown Sampel Aktif */}
        <div className="flex items-center gap-2 self-stretch md:self-auto">
          <span className="font-bold text-[10px] text-on-surface-variant uppercase shrink-0">Sampel Aktif:</span>
          <select
            value={selectedSampleIdx}
            onChange={(e) => setSelectedSampleIdx(parseInt(e.target.value))}
            className="flex-1 md:flex-none px-3.5 py-2.5 rounded-xl border border-outline-variant bg-white font-semibold text-xs text-on-surface cursor-pointer focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all shadow-sm"
          >
            {samplesLoading ? (
              <option>Memuat sampel...</option>
            ) : samples.length === 0 ? (
              <option>Tidak ada sampel terdaftar</option>
            ) : (
              samples.map((s, idx) => {
                const physical = s.samples?.[0] || s.sample;
                const totalParams = physical?.hasil_uji?.length || 0;
                const completedParams = physical?.hasil_uji?.filter((hu: any) => 
                  hu.status_hasil === 'approved' || hu.status_hasil === 'pending_qc'
                ).length || 0;

                let prefix = '';
                if (totalParams > 0) {
                  if (completedParams === totalParams) {
                    prefix = '[SELESAI QC/UJI] ';
                  } else if (completedParams > 0) {
                    prefix = `[SEBAGIAN: ${completedParams}/${totalParams}] `;
                  } else {
                    prefix = '[BELUM DIUJI] ';
                  }
                }

                return (
                  <option key={s.id} value={idx}>
                    {prefix}{physical?.kode_sample || s.kode_sample || s.nomor_registrasi} ({physical?.jenis_sample || 'Tanpa Jenis'})
                  </option>
                );
              })
            )}
          </select>
        </div>
      </div>

      {/* Main Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Param List Table (Col 8) */}
        <div className="bg-white p-6 rounded-2xl border border-outline-variant soft-shadow lg:col-span-8 space-y-5">
          {/* Header section with active card */}
          {activeSample ? (
            <div className={`p-4 rounded-xl border ${categoryStyle.border} ${categoryStyle.bg} flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white rounded-lg border border-outline-variant/60 shadow-sm">
                  {categoryStyle.icon}
                </div>
                <div>
                  <span className="text-[10px] font-bold text-on-surface-variant/80 uppercase tracking-wider block">Kategori Sampel</span>
                  <div className="flex items-center gap-2">
                    <span className={`font-extrabold text-sm ${categoryStyle.text}`}>{categoryStyle.label}</span>
                    <span className="text-[9px] font-extrabold bg-white/80 border border-outline-variant/35 px-2 py-0.5 rounded text-on-surface-variant shadow-sm">
                      {REGULASI_MAP[jenisSample]}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-on-surface-variant block uppercase">Kode Registrasi</span>
                <span className="font-mono font-bold text-xs text-on-surface">{activeSample.kode_sample || activeSample.nomor_registrasi}</span>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-on-surface-variant text-xs font-semibold bg-surface-container-low border border-dashed border-outline-variant rounded-xl">
              Silakan pilih sampel terlebih dahulu.
            </div>
          )}

          <div className="flex justify-between items-center pb-1">
            <h3 className="font-headline-md text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
              <FileSpreadsheet size={15} className="text-primary" />
              Parameter Uji Laboratorium ({labParams.length})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container border-b border-outline-variant text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                  <th className="p-3.5">Nama Parameter</th>
                  <th className="p-3.5">Baku Mutu Standard</th>
                  <th className="p-3.5 w-[140px] text-center">Nilai Hasil Uji</th>
                  <th className="p-3.5">Satuan</th>
                  <th className="p-3.5">Status Validasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant text-xs text-on-surface font-medium">
                {labParams.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-on-surface-variant font-semibold">
                      {samplesLoading ? 'Memuat data sampel...' : 'Tidak ada parameter uji laboratorium untuk sampel ini.'}
                    </td>
                  </tr>
                ) : (
                  labParams.map((param) => {
                    const num = parseFloat(param.enteredValue);
                    let isExceeded = false;
                    let isBelowMin = false;

                    if (!isNaN(num)) {
                      if (param.limitMax !== null && num > param.limitMax) {
                        isExceeded = true;
                      }
                      if (param.limitMin !== null && num < param.limitMin) {
                        isBelowMin = true;
                      }
                    }

                    const isOut = isExceeded || isBelowMin;

                    // Build string for baku mutu display
                    let limitDisplay = '-';
                    if (param.limitMin !== null && param.limitMax !== null) {
                      limitDisplay = `${param.limitMin} - ${param.limitMax}`;
                    } else if (param.limitMax !== null) {
                      limitDisplay = `≤ ${param.limitMax}`;
                    } else if (param.limitMin !== null) {
                      limitDisplay = `≥ ${param.limitMin}`;
                    }

                    return (
                      <tr 
                        key={param.parameterId} 
                        className={`transition-all ${isOut ? 'bg-status-danger/5 hover:bg-status-danger/10' : 'hover:bg-surface-container-low'}`}
                      >
                        <td className="p-3.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-on-surface">{param.name}</span>
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[8px] font-bold uppercase shrink-0">
                              <FlaskConical size={8} /> Lab
                            </span>
                          </div>
                          <div className="text-[10px] text-on-surface-variant font-normal mt-0.5">{param.metode}</div>
                        </td>
                        <td className="p-3.5 font-bold text-on-surface-variant">
                          {limitDisplay}
                        </td>
                        <td className="p-3.5">
                          <input
                            type="number"
                            step="any"
                            placeholder="0.0"
                            value={param.enteredValue}
                            onChange={(e) => handleValueChange(param.parameterId, e.target.value)}
                            disabled={param.status === 'APPROVED' || param.status === 'PENDING_QC'}
                            className={`w-full px-3 py-2 rounded-lg border text-center font-bold text-xs outline-none transition-all ${
                              param.status === 'APPROVED' || param.status === 'PENDING_QC'
                                ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed'
                                : isOut
                                ? 'border-status-danger bg-white text-status-danger focus:ring-1 focus:ring-status-danger'
                                : 'border-outline-variant bg-surface-container-low focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary'
                            }`}
                          />
                        </td>
                        <td className="p-3.5 font-bold text-on-surface-variant">{param.unit}</td>
                        <td className="p-3.5">
                          {param.enteredValue === '' ? (
                            <span className="text-[10px] text-on-surface-variant italic font-semibold">Belum diisi</span>
                          ) : param.status === 'APPROVED' ? (
                            <span className="px-2.5 py-1 rounded bg-status-success/15 text-status-success font-bold text-[9px] uppercase">
                              Sudah Verifikasi
                            </span>
                          ) : param.status === 'PENDING_QC' ? (
                            <span className="px-2.5 py-1 rounded bg-status-warning/15 text-status-warning font-bold text-[9px] uppercase">
                              Proses QC
                            </span>
                          ) : isExceeded ? (
                            <div className="flex items-center gap-1 text-status-danger font-bold text-[10px] bg-status-danger/10 px-2 py-1 rounded w-fit">
                              <AlertTriangle size={13} className="shrink-0" />
                              <span>Melebihi Baku Mutu</span>
                            </div>
                          ) : isBelowMin ? (
                            <div className="flex items-center gap-1 text-status-danger font-bold text-[10px] bg-status-danger/10 px-2 py-1 rounded w-fit">
                              <AlertTriangle size={13} className="shrink-0" />
                              <span>Kurang dari Baku Mutu</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-status-success font-bold text-[10px] bg-status-success/10 px-2 py-1 rounded w-fit">
                              <CheckCircle size={13} className="shrink-0" />
                              <span>Sesuai Standard</span>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {labParams.length > 0 && (
            <div className="flex justify-end gap-3 border-t border-outline-variant pt-4">
              <button 
                onClick={() => setLocalParams(prev => prev.map(p => ({ ...p, enteredValue: '' })))}
                className="px-4 py-2 border border-outline-variant text-on-surface rounded-xl font-semibold text-xs hover:bg-surface-container transition-all cursor-pointer soft-shadow"
              >
                Reset Formulir
              </button>
              <button 
                onClick={handleSaveResults}
                disabled={submitMutation.isPending}
                className="flex items-center gap-2 bg-primary text-on-primary px-5 py-2.5 rounded-xl hover:bg-primary-container transition-all font-semibold text-xs cursor-pointer soft-shadow hover-lift disabled:opacity-85"
              >
                <Save size={15} />
                {submitMutation.isPending ? 'Menyimpan Hasil...' : 'Simpan & Kirim ke QC'}
              </button>
            </div>
          )}
        </div>

        {/* Technical Guidelines (Col 4) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Card Panduan ISO 17025 */}
          <div className="bg-white p-6 rounded-2xl border border-outline-variant soft-shadow space-y-4">
            <h4 className="font-headline-sm text-xs font-bold text-on-surface border-b border-outline-variant pb-3 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={14} className="text-primary animate-pulse" />
              Pedoman Akreditasi ISO/IEC 17025
            </h4>
            <div className="space-y-4 text-[11px] text-on-surface-variant leading-relaxed">
              <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/60">
                <span className="font-bold text-on-surface block mb-1">1. Rekaman Teknis Pengujian</span>
                <span>Seluruh data hasil pengukuran mentah harus dimasukkan beserta metode analitik yang digunakan untuk audit trail.</span>
              </div>
              <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/60">
                <span className="font-bold text-on-surface block mb-1">2. Penanganan Nilai Outlier</span>
                <span>Hasil uji yang menyimpang drastis atau melebihi baku mutu nasional direkomendasikan untuk retest (uji konfirmasi ulang).</span>
              </div>
              <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/60">
                <span className="font-bold text-on-surface block mb-1">3. Jaminan Mutu Spektrofotometer</span>
                <span>Pastikan alat spektrofotometri atau AAS sudah terkalibrasi berkala sebelum melakukan pembacaan logam atau nilai COD/BOD.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pengujian;
