import React, { useState, lazy, Suspense } from 'react';
import { Plus, Search, Filter, Eye, Edit2, Trash2, X, MapPin, CheckCircle2, CreditCard, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { usePermohonanList, useCreatePermohonan, useUpdatePermohonan, useDeletePermohonan, useVerifyPermohonan } from '@/hooks/usePermohonan';
import { useCreatePayment } from '@/hooks/usePayment';
import type { PermohonanData, PermohonanPayload } from '@/services/permohonan.service';
import dayjs from 'dayjs';

// Lazy load the map component to avoid loading Leaflet on page load
const LocationPicker = lazy(() => import('@/components/LocationPicker'));

const STATUS_MAP: Record<string, { label: string; style: string }> = {
  pending: { label: 'Pending', style: 'bg-status-warning/10 text-status-warning' },
  waiting_payment: { label: 'Menunggu Pembayaran', style: 'bg-orange-100 text-orange-600' },
  paid: { label: 'Lunas', style: 'bg-status-success/10 text-status-success' },
  scheduled: { label: 'Terjadwal', style: 'bg-status-info/10 text-status-info' },
  completed: { label: 'Selesai', style: 'bg-status-success/10 text-status-success' },
  approved: { label: 'Disetujui', style: 'bg-status-success/10 text-status-success' },
  rejected: { label: 'Ditolak', style: 'bg-status-danger/10 text-status-danger' },
  cancelled: { label: 'Dibatalkan', style: 'bg-gray-400/10 text-gray-700' },
};

const REGULASI_MAP: Record<string, string> = {
  'Air (Sanitasi / Minum)': 'Permenkes Air Minum & Higiene Sanitasi',
  'Air Limbah Industri / Domestik': 'Permen LHK Air Limbah',
  'Makanan & Minuman': 'BPOM, SNI, Permenkes',
  'Kualitas Udara': 'PP 22 Tahun 2021',
  'Tanah & Sedimen': 'PP 22 Tahun 2021',
  'Swab Lingkungan': 'Permenkes, SNI, HACCP',
};

const Permohonan: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<PermohonanData | null>(null);
  const [detailItem, setDetailItem] = useState<PermohonanData | null>(null);

  // Payment quick-modal state
  const [payModal, setPayModal] = useState<{ open: boolean; permohonanId: string; nomor: string } | null>(null);
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState('transfer');

  // Form state
  const [form, setForm] = useState<PermohonanPayload>({
    jenis_pemohon: 'instansi',
    nama_instansi: '',
    nama_pemohon: '',
    email: '',
    phone: '',
    alamat: '',
    jenis_sample: 'Air (Sanitasi / Minum)',
    catatan: '',
    latitude: null,
    longitude: null,
  });

  const { data: response, isLoading } = usePermohonanList({
    search: searchTerm || undefined,
    status: filterStatus || undefined,
    page,
    per_page: 10,
  });

  const createMutation = useCreatePermohonan();
  const updateMutation = useUpdatePermohonan();
  const deleteMutation = useDeletePermohonan();
  const verifyMutation = useVerifyPermohonan();
  const payMutation = useCreatePayment();

  const permohonanList = response?.data || [];
  const meta = response?.meta;

  const resetForm = () => {
    setForm({
      jenis_pemohon: 'instansi',
      nama_instansi: '',
      nama_pemohon: '',
      email: '',
      phone: '',
      alamat: '',
      jenis_sample: 'Air (Sanitasi / Minum)',
      catatan: '',
      latitude: null,
      longitude: null,
    });
    setEditingItem(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (item: PermohonanData) => {
    setEditingItem(item);
    setForm({
      jenis_pemohon: item.jenis_pemohon || 'instansi',
      nama_instansi: item.nama_instansi || '',
      nama_pemohon: item.nama_pemohon || '',
      email: item.email || '',
      phone: item.phone || '',
      alamat: item.alamat || '',
      jenis_sample: item.jenis_sample || 'Air (Sanitasi / Minum)',
      catatan: item.catatan || '',
      latitude: item.latitude || null,
      longitude: item.longitude || null,
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nama_pemohon || !form.alamat) {
      toast.error('Nama pemohon dan alamat wajib diisi.');
      return;
    }

    if (editingItem) {
      updateMutation.mutate(
        { id: editingItem.id, payload: form },
        {
          onSuccess: () => {
            setShowModal(false);
            resetForm();
          },
        }
      );
    } else {
      createMutation.mutate(form, {
        onSuccess: () => {
          setShowModal(false);
          resetForm();
        },
      });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus permohonan ini?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleVerify = (id: string, nomor: string) => {
    if (confirm(`Verifikasi permohonan ${nomor}? Status akan berubah ke Menunggu Pembayaran.`)) {
      verifyMutation.mutate(id);
    }
  };

  const openPayModal = (item: PermohonanData) => {
    setPayAmount(item.total_biaya || 0);
    setPayMethod('transfer');
    setPayModal({ open: true, permohonanId: item.id, nomor: item.nomor_permohonan });
  };

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payModal || payAmount <= 0) return;
    payMutation.mutate(
      { permohonan_id: payModal.permohonanId, jumlah: payAmount, metode_pembayaran: payMethod },
      { onSuccess: () => { setPayModal(null); setDetailItem(null); } }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-outline-variant pb-4">
        <div>
          <h1 className="font-headline-lg text-lg md:text-xl font-extrabold text-on-surface">
            Registrasi & Permohonan Pengujian
          </h1>
          <p className="font-body-md text-xs text-on-surface-variant mt-1 font-medium">
            Kelola dan daftarkan permohonan pengujian laboratorium baru dari klien.
          </p>
        </div>
        
        <button 
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-primary text-on-primary px-5 py-2.5 rounded-lg hover-lift hover:bg-primary-container transition-all font-label-md text-xs font-semibold cursor-pointer soft-shadow"
        >
          <Plus size={15} />
          Buat Permohonan Baru
        </button>
      </div>

      {/* Filter Bar Card */}
      <div className="bg-white p-4 rounded-xl border border-outline-variant soft-shadow flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={15} />
          <input
            type="text"
            placeholder="Cari nomor atau klien..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-outline-variant bg-surface-container-low text-xs text-on-surface outline-none focus:border-primary focus:bg-white transition-all"
          />
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-2 self-start md:self-auto overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          <span className="text-[11px] font-bold text-on-surface-variant flex items-center gap-1 shrink-0 mr-2">
            <Filter size={12} />
            Status:
          </span>
          {[
            { key: '', label: 'Semua' },
            { key: 'pending', label: 'Pending' },
            { key: 'waiting_payment', label: 'Menunggu Bayar' },
            { key: 'paid', label: 'Lunas' },
            { key: 'scheduled', label: 'Terjadwal' },
            { key: 'completed', label: 'Selesai' },
          ].map((opt) => (
            <button
              key={opt.key}
              onClick={() => {
                setFilterStatus(opt.key);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-full font-label-md text-[10px] font-bold border transition-all cursor-pointer ${
                filterStatus === opt.key
                  ? 'bg-primary text-on-primary border-primary soft-shadow'
                  : 'bg-white text-on-surface-variant border-outline-variant hover:bg-surface-container'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table Container Card */}
      <div className="bg-white rounded-xl border border-outline-variant overflow-hidden soft-shadow">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-surface-container border-b border-outline-variant text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                <th className="p-4">No. Permohonan</th>
                <th className="p-4">Pemohon / Instansi</th>
                <th className="p-4">Jenis Sampel</th>
                <th className="p-4">Alamat</th>
                <th className="p-4">Tanggal</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant text-xs text-on-surface">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="p-4"><div className="h-3 bg-gray-200 rounded w-24" /></td>
                    <td className="p-4"><div className="h-3 bg-gray-200 rounded w-32" /></td>
                    <td className="p-4"><div className="h-3 bg-gray-200 rounded w-20" /></td>
                    <td className="p-4"><div className="h-3 bg-gray-200 rounded w-28" /></td>
                    <td className="p-4"><div className="h-3 bg-gray-200 rounded w-20" /></td>
                    <td className="p-4"><div className="h-3 bg-gray-200 rounded w-16" /></td>
                    <td className="p-4"><div className="h-3 bg-gray-200 rounded w-16 mx-auto" /></td>
                  </tr>
                ))
              ) : permohonanList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-on-surface-variant font-semibold">
                    Tidak ada data permohonan ditemukan.
                  </td>
                </tr>
              ) : (
                permohonanList.map((req) => {
                  const statusInfo = STATUS_MAP[req.status] || { label: req.status, style: 'bg-gray-200 text-gray-700' };
                  return (
                    <tr key={req.id} className="hover:bg-surface-container-low transition-all">
                      <td className="p-4 font-bold text-primary">{req.nomor_permohonan || req.id.substring(0, 12)}</td>
                      <td className="p-4">
                        <div className="font-semibold">{req.nama_pemohon}</div>
                        {req.nama_instansi && (
                          <div className="text-[10px] text-on-surface-variant">{req.nama_instansi}</div>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="bg-surface-container px-2.5 py-1 rounded-md font-semibold text-on-surface-variant text-[10px]">
                          {req.jenis_sample}
                        </span>
                      </td>
                      <td className="p-4 text-on-surface-variant max-w-[200px] truncate">{req.alamat}</td>
                      <td className="p-4 text-on-surface-variant">{dayjs(req.created_at).format('YYYY-MM-DD')}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] inline-block ${statusInfo.style}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button 
                            onClick={() => setDetailItem(req)}
                            className="p-1.5 hover:bg-surface-container rounded-lg text-on-surface-variant hover:text-primary transition-all cursor-pointer"
                            title="Lihat Detail"
                          >
                            <Eye size={14} />
                          </button>
                          {req.status === 'pending' && (
                            <button 
                              onClick={() => handleVerify(req.id, req.nomor_permohonan)}
                              disabled={verifyMutation.isPending}
                              className="p-1.5 hover:bg-status-success/10 rounded-lg text-on-surface-variant hover:text-status-success transition-all cursor-pointer disabled:opacity-60"
                              title="Verifikasi (Pending → Menunggu Pembayaran)"
                            >
                              <CheckCircle2 size={14} />
                            </button>
                          )}
                          {req.status === 'waiting_payment' && (
                            <button 
                              onClick={() => openPayModal(req)}
                              className="p-1.5 hover:bg-primary/10 rounded-lg text-on-surface-variant hover:text-primary transition-all cursor-pointer"
                              title="Catat Pembayaran"
                            >
                              <CreditCard size={14} />
                            </button>
                          )}
                          <button 
                            onClick={() => openEditModal(req)}
                            className="p-1.5 hover:bg-surface-container rounded-lg text-on-surface-variant hover:text-primary transition-all cursor-pointer"
                            title="Edit Permohonan"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button 
                            onClick={() => handleDelete(req.id)}
                            className="p-1.5 hover:bg-status-danger/10 rounded-lg text-on-surface-variant hover:text-status-danger transition-all cursor-pointer"
                            title="Hapus"
                          >
                            <Trash2 size={14} />
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
        
        {/* Pagination */}
        <div className="p-4 bg-surface-container-lowest border-t border-outline-variant flex items-center justify-between text-[11px] text-on-surface-variant font-medium">
          <span>
            {meta ? `Menampilkan halaman ${meta.current_page} dari ${meta.last_page} (${meta.total} total)` : 'Memuat...'}
          </span>
          <div className="flex items-center gap-1.5">
            <button 
              className="px-2.5 py-1 rounded border border-outline-variant bg-white disabled:opacity-50 cursor-pointer"
              disabled={!meta || meta.current_page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Sebelumnya
            </button>
            <button 
              className="px-2.5 py-1 rounded border border-outline-variant bg-white disabled:opacity-50 cursor-pointer"
              disabled={!meta || meta.current_page >= meta.last_page}
              onClick={() => setPage((p) => p + 1)}
            >
              Selanjutnya
            </button>
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl soft-shadow border border-outline-variant w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-outline-variant">
              <h3 className="font-headline-md text-sm font-bold text-on-surface">
                {editingItem ? 'Edit Permohonan' : 'Buat Permohonan Baru'}
              </h3>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="p-1.5 hover:bg-surface-container rounded-lg cursor-pointer">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block font-label-sm text-[11px] font-bold text-on-surface-variant uppercase">Jenis Pemohon *</label>
                  <select
                    value={form.jenis_pemohon}
                    onChange={(e) => setForm({ ...form, jenis_pemohon: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-outline-variant bg-surface-container-low text-xs outline-none focus:border-primary transition-all"
                  >
                    <option value="instansi">Instansi</option>
                    <option value="perorangan">Perorangan</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block font-label-sm text-[11px] font-bold text-on-surface-variant uppercase">Jenis Sampel *</label>
                  <select
                    value={form.jenis_sample}
                    onChange={(e) => setForm({ ...form, jenis_sample: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-outline-variant bg-surface-container-low text-xs outline-none focus:border-primary transition-all"
                  >
                    <option value="Air (Sanitasi / Minum)">Air (Sanitasi / Minum)</option>
                    <option value="Air Limbah Industri / Domestik">Air Limbah Industri / Domestik</option>
                    <option value="Makanan & Minuman">Makanan & Minuman</option>
                    <option value="Kualitas Udara">Kualitas Udara</option>
                    <option value="Tanah & Sedimen">Tanah & Sedimen</option>
                    <option value="Swab Lingkungan">Swab Lingkungan</option>
                  </select>
                </div>
                {form.jenis_sample && (
                  <div className="col-span-2 bg-primary/5 p-3 rounded-lg border border-primary/10 flex items-center justify-between text-[11px] text-primary">
                    <span className="font-semibold text-primary/80">Acuan Regulasi Umum Kategori Sampel:</span>
                    <span className="font-extrabold bg-primary/10 px-2 py-0.5 rounded text-[10px]">
                      {REGULASI_MAP[form.jenis_sample] || '-'}
                    </span>
                  </div>
                )}
              </div>

              {form.jenis_pemohon === 'instansi' && (
                <div className="space-y-1.5">
                  <label className="block font-label-sm text-[11px] font-bold text-on-surface-variant uppercase">Nama Instansi</label>
                  <input
                    type="text"
                    value={form.nama_instansi}
                    onChange={(e) => setForm({ ...form, nama_instansi: e.target.value })}
                    placeholder="PT. Contoh Industri"
                    className="w-full px-3 py-2.5 rounded-lg border border-outline-variant bg-surface-container-low text-xs outline-none focus:border-primary transition-all"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block font-label-sm text-[11px] font-bold text-on-surface-variant uppercase">Nama Pemohon *</label>
                  <input
                    type="text"
                    value={form.nama_pemohon}
                    onChange={(e) => setForm({ ...form, nama_pemohon: e.target.value })}
                    placeholder="Nama lengkap"
                    className="w-full px-3 py-2.5 rounded-lg border border-outline-variant bg-surface-container-low text-xs outline-none focus:border-primary transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block font-label-sm text-[11px] font-bold text-on-surface-variant uppercase">No. Telepon</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="08xxxxxxxxxx"
                    className="w-full px-3 py-2.5 rounded-lg border border-outline-variant bg-surface-container-low text-xs outline-none focus:border-primary transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block font-label-sm text-[11px] font-bold text-on-surface-variant uppercase">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="email@contoh.com"
                  className="w-full px-3 py-2.5 rounded-lg border border-outline-variant bg-surface-container-low text-xs outline-none focus:border-primary transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-label-sm text-[11px] font-bold text-on-surface-variant uppercase">Alamat *</label>
                <textarea
                  value={form.alamat}
                  onChange={(e) => setForm({ ...form, alamat: e.target.value })}
                  placeholder="Alamat lengkap"
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-lg border border-outline-variant bg-surface-container-low text-xs outline-none focus:border-primary transition-all resize-none"
                />
              </div>

              {/* Interactive Map Picker */}
              <Suspense fallback={
                <div className="rounded-xl border border-outline-variant bg-surface-container-low flex items-center justify-center" style={{ height: '280px' }}>
                  <div className="text-center text-on-surface-variant text-xs">
                    <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                    Memuat peta...
                  </div>
                </div>
              }>
                <LocationPicker
                  latitude={form.latitude ?? null}
                  longitude={form.longitude ?? null}
                  onChange={(lat, lng) => setForm({ ...form, latitude: lat, longitude: lng })}
                />
              </Suspense>

              <div className="space-y-1.5">
                <label className="block font-label-sm text-[11px] font-bold text-on-surface-variant uppercase">Catatan</label>
                <textarea
                  value={form.catatan}
                  onChange={(e) => setForm({ ...form, catatan: e.target.value })}
                  placeholder="Catatan tambahan (opsional)"
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-lg border border-outline-variant bg-surface-container-low text-xs outline-none focus:border-primary transition-all resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="flex-1 py-2.5 border border-outline-variant text-on-surface rounded-lg font-semibold text-xs hover:bg-surface-container transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 py-2.5 bg-primary text-on-primary rounded-lg font-semibold text-xs hover:bg-primary-container transition-all cursor-pointer soft-shadow disabled:opacity-80"
                >
                  {(createMutation.isPending || updateMutation.isPending) ? 'Menyimpan...' : editingItem ? 'Perbarui' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailItem && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl soft-shadow border border-outline-variant w-full max-w-lg">
            <div className="flex justify-between items-center p-6 border-b border-outline-variant">
              <h3 className="font-headline-md text-sm font-bold text-on-surface">
                Detail Permohonan
              </h3>
              <button onClick={() => setDetailItem(null)} className="p-1.5 hover:bg-surface-container rounded-lg cursor-pointer">
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-primary">{detailItem.nomor_permohonan}</span>
                <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${STATUS_MAP[detailItem.status]?.style || 'bg-gray-200 text-gray-700'}`}>
                  {STATUS_MAP[detailItem.status]?.label || detailItem.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="block text-[10px] text-on-surface-variant font-bold uppercase">Pemohon</span>
                  <span className="font-semibold text-on-surface">{detailItem.nama_pemohon}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-on-surface-variant font-bold uppercase">Instansi</span>
                  <span className="font-semibold text-on-surface">{detailItem.nama_instansi || '-'}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-on-surface-variant font-bold uppercase">Jenis Sampel</span>
                  <span className="font-semibold text-on-surface">{detailItem.jenis_sample}</span>
                  <span className="block text-[9px] text-on-surface-variant/70 mt-1 uppercase font-bold">Acuan Regulasi</span>
                  <span className="font-semibold text-[10px] text-primary bg-primary/5 px-2 py-0.5 rounded block w-fit mt-0.5">
                    {REGULASI_MAP[detailItem.jenis_sample] || '-'}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-on-surface-variant font-bold uppercase">Jenis Pemohon</span>
                  <span className="font-semibold text-on-surface capitalize">{detailItem.jenis_pemohon}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-on-surface-variant font-bold uppercase">Email</span>
                  <span className="font-semibold text-on-surface">{detailItem.email || '-'}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-on-surface-variant font-bold uppercase">Telepon</span>
                  <span className="font-semibold text-on-surface">{detailItem.phone || '-'}</span>
                </div>
                <div className="col-span-2">
                  <span className="block text-[10px] text-on-surface-variant font-bold uppercase">Alamat</span>
                  <span className="font-semibold text-on-surface">{detailItem.alamat}</span>
                </div>
                {detailItem.latitude && detailItem.longitude && (
                  <div className="col-span-2">
                    <span className="block text-[10px] text-on-surface-variant font-bold uppercase flex items-center gap-1 mb-1">
                      <MapPin size={11} className="text-primary" />
                      Koordinat Lokasi Sampling
                    </span>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-mono font-bold text-primary bg-primary/5 px-2 py-1 rounded">
                        {parseFloat(String(detailItem.latitude)).toFixed(6)}, {parseFloat(String(detailItem.longitude)).toFixed(6)}
                      </span>
                      <a
                        href={`https://www.google.com/maps?q=${detailItem.latitude},${detailItem.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-primary font-semibold hover:underline"
                      >
                        Buka di Google Maps →
                      </a>
                    </div>
                    <div className="mt-2 rounded-lg overflow-hidden border border-outline-variant" style={{ height: '180px' }}>
                      <Suspense fallback={<div className="h-full bg-surface-container-low flex items-center justify-center text-xs text-on-surface-variant">Memuat peta...</div>}>
                        <LocationPicker
                          latitude={detailItem.latitude}
                          longitude={detailItem.longitude}
                          onChange={() => {}}
                          height="180px"
                          readOnly
                        />
                      </Suspense>
                    </div>
                  </div>
                )}
                {detailItem.total_biaya && (
                  <div>
                    <span className="block text-[10px] text-on-surface-variant font-bold uppercase">Total Biaya</span>
                    <span className="font-bold text-on-surface">Rp {detailItem.total_biaya.toLocaleString('id-ID')}</span>
                  </div>
                )}
                <div>
                  <span className="block text-[10px] text-on-surface-variant font-bold uppercase">Tanggal</span>
                  <span className="font-semibold text-on-surface">{dayjs(detailItem.created_at).format('DD MMMM YYYY HH:mm')}</span>
                </div>
              </div>

              {detailItem.catatan && (
                <div className="bg-surface-container-low p-3 rounded-lg border border-outline-variant">
                  <span className="block text-[10px] text-on-surface-variant font-bold uppercase mb-1">Catatan</span>
                  <p className="text-xs text-on-surface">{detailItem.catatan}</p>
                </div>
              )}

              {/* Workflow Action Buttons based on status */}
              <div className="border-t border-outline-variant pt-4 space-y-2">
                {detailItem.status === 'pending' && (
                  <button
                    onClick={() => { handleVerify(detailItem.id, detailItem.nomor_permohonan); setDetailItem(null); }}
                    disabled={verifyMutation.isPending}
                    className="w-full py-2.5 bg-status-success text-white rounded-lg font-bold text-xs hover:opacity-90 transition-all cursor-pointer soft-shadow flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    <CheckCircle2 size={14} />
                    Verifikasi Permohonan (Pending → Menunggu Pembayaran)
                  </button>
                )}
                {detailItem.status === 'waiting_payment' && (
                  <button
                    onClick={() => openPayModal(detailItem)}
                    className="w-full py-2.5 bg-primary text-on-primary rounded-lg font-bold text-xs hover:bg-primary-container transition-all cursor-pointer soft-shadow flex items-center justify-center gap-2"
                  >
                    <CreditCard size={14} />
                    Catat Pembayaran
                  </button>
                )}
                {detailItem.status === 'paid' && (
                  <div className="w-full py-2.5 bg-status-success/10 text-status-success rounded-lg font-bold text-xs flex items-center justify-center gap-2">
                    <CheckCircle2 size={14} />
                    Pembayaran Lunas — Siap Penjadwalan Sampling
                    <ArrowRight size={14} />
                  </div>
                )}
                <button
                  onClick={() => setDetailItem(null)}
                  className="w-full py-2.5 border border-outline-variant text-on-surface rounded-lg font-semibold text-xs hover:bg-surface-container transition-all cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Payment Modal (from Permohonan table/detail) */}
      {payModal?.open && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl soft-shadow border border-outline-variant w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b border-outline-variant">
              <div>
                <h3 className="font-headline-md text-sm font-bold text-on-surface">Catat Pembayaran</h3>
                <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">{payModal.nomor}</p>
              </div>
              <button onClick={() => setPayModal(null)} className="p-1.5 hover:bg-surface-container rounded-lg cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handlePay} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="block font-label-sm text-[11px] font-bold text-on-surface-variant uppercase">Jumlah Pembayaran *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-xs font-bold">Rp</span>
                  <input
                    type="number"
                    required
                    min={1}
                    value={payAmount || ''}
                    onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-outline-variant bg-surface-container-low text-xs outline-none focus:border-primary transition-all"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block font-label-sm text-[11px] font-bold text-on-surface-variant uppercase">Metode Pembayaran *</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-outline-variant bg-surface-container-low text-xs outline-none focus:border-primary transition-all"
                >
                  <option value="transfer">Transfer Bank</option>
                  <option value="cash">Tunai (Cash)</option>
                  <option value="qris">QRIS</option>
                </select>
              </div>
              <div className="bg-status-info/5 border border-status-info/20 rounded-lg p-3 text-[10px] text-status-info font-medium">
                ⚡ Setelah pembayaran dicatat, status permohonan otomatis berubah ke <strong>Lunas</strong>.
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setPayModal(null)} className="flex-1 py-2.5 border border-outline-variant rounded-lg text-xs font-semibold cursor-pointer hover:bg-surface-container transition-all">
                  Batal
                </button>
                <button type="submit" disabled={payMutation.isPending || payAmount <= 0} className="flex-1 py-2.5 bg-primary text-on-primary rounded-lg font-bold text-xs cursor-pointer soft-shadow disabled:opacity-80 hover:bg-primary-container transition-all">
                  {payMutation.isPending ? 'Menyimpan...' : 'Catat Pembayaran'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Permohonan;
