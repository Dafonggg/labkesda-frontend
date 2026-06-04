import React, { useState } from 'react';
import {
  Users, UserPlus, Search, X, Edit3, Trash2, Eye, EyeOff,
  Shield, Phone, Mail, Check, AlertCircle, ChevronLeft, ChevronRight, Hash
} from 'lucide-react';
import { toast } from 'sonner';
import { useUserList, useRoles, useCreateUser, useUpdateUser, useDeleteUser } from '@/hooks/useUser';
import type { UserData, UserPayload } from '@/services/user.service';
import { ROLE_DISPLAY_NAMES } from '@/stores/auth';
import dayjs from 'dayjs';

// ─── Role badge color map ────────────────────────────────────────────────────

const ROLE_BADGE: Record<string, string> = {
  admin: 'bg-status-error/10 text-status-error border-status-error/20',
  petugas_lab: 'bg-primary/10 text-primary border-primary/20',
  petugas_lapangan: 'bg-status-success/10 text-status-success border-status-success/20',
  qc: 'bg-status-warning/10 text-status-warning border-status-warning/20',
  analis: 'bg-status-info/10 text-status-info border-status-info/20',
  kepala_uptd: 'bg-purple-100 text-purple-700 border-purple-200',
};

// ─── Main Component ──────────────────────────────────────────────────────────

const ManajemenUser: React.FC = () => {
  // ── Filters ──
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);

  // ── Modal ──
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<UserData | null>(null);

  // ── Form State ──
  const [formData, setFormData] = useState({
    name: '',
    nip: '',
    email: '',
    password: '',
    phone: '',
    role_id: '',
    sub_role: '',
    is_active: true,
  });
  const [showPassword, setShowPassword] = useState(false);

  // ── Queries ──
  const filters = {
    search: searchQuery || undefined,
    role: roleFilter || undefined,
    is_active: statusFilter === '' ? undefined : statusFilter === 'active',
    per_page: 10,
    page: currentPage,
  };
  const { data: response, isLoading } = useUserList(filters);
  const { data: rolesResponse } = useRoles();

  const users = response?.data || [];
  const meta = response?.meta;
  const roles = rolesResponse?.data || [];

  // ── Mutations ──
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();

  // ── Handlers ──
  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({ name: '', nip: '', email: '', password: '', phone: '', role_id: '', sub_role: '', is_active: true });
    setShowPassword(false);
    setModalOpen(true);
  };

  const openEditModal = (user: UserData) => {
    setEditingUser(user);
    const matchedRole = roles.find((r) => r.code === user.role);
    setFormData({
      name: user.name,
      nip: user.nip || '',
      email: user.email,
      password: '',
      phone: user.phone || '',
      role_id: matchedRole?.id || '',
      sub_role: user.sub_role || '',
      is_active: user.is_active,
    });
    setShowPassword(false);
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.role_id) {
      toast.error('Nama, Email, dan Role wajib diisi.');
      return;
    }
    if (!editingUser && !formData.password) {
      toast.error('Password wajib diisi untuk user baru.');
      return;
    }

    const selectedRoleCode = roles.find((r) => r.id === formData.role_id)?.code;

    const payload: UserPayload = {
      name: formData.name,
      nip: formData.nip || undefined,
      email: formData.email,
      phone: formData.phone || undefined,
      role_id: formData.role_id,
      sub_role: selectedRoleCode === 'petugas_lapangan' ? formData.sub_role || undefined : undefined,
      is_active: formData.is_active,
    };
    if (formData.password) {
      payload.password = formData.password;
    }

    if (editingUser) {
      updateMutation.mutate(
        { id: editingUser.id, payload },
        { onSuccess: () => setModalOpen(false) }
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => setModalOpen(false),
      });
    }
  };

  const handleDelete = () => {
    if (!deleteConfirm) return;
    deleteMutation.mutate(deleteConfirm.id, {
      onSuccess: () => setDeleteConfirm(null),
    });
  };

  const isMutating = createMutation.isPending || updateMutation.isPending;

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 relative">
      {/* Header */}
      <div className="border-b border-outline-variant pb-4">
        <h1 className="font-headline-lg text-lg md:text-xl font-extrabold text-on-surface">
          Manajemen User
        </h1>
        <p className="font-body-md text-xs text-on-surface-variant mt-1 font-medium">
          Kelola akun pengguna sistem, atur role dan status akses.
        </p>
      </div>

      {/* KPI Banners */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-outline-variant soft-shadow flex items-center gap-4">
          <div className="bg-primary/10 p-3 rounded-lg text-primary">
            <Users size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-on-surface-variant uppercase">Total User</p>
            <h4 className="text-xl font-extrabold text-on-surface">{meta?.total ?? '-'}</h4>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-outline-variant soft-shadow flex items-center gap-4">
          <div className="bg-status-success/10 p-3 rounded-lg text-status-success">
            <Check size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-on-surface-variant uppercase">Aktif</p>
            <h4 className="text-xl font-extrabold text-on-surface">
              {users.filter((u) => u.is_active).length}
            </h4>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-outline-variant soft-shadow flex items-center gap-4">
          <div className="bg-status-error/10 p-3 rounded-lg text-status-error">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-on-surface-variant uppercase">Nonaktif</p>
            <h4 className="text-xl font-extrabold text-on-surface">
              {users.filter((u) => !u.is_active).length}
            </h4>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-outline-variant soft-shadow flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              type="text"
              placeholder="Cari nama, email, telepon..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-outline-variant focus:border-primary outline-none transition-all"
            />
          </div>
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 text-xs rounded-lg border border-outline-variant focus:border-primary outline-none transition-all cursor-pointer"
          >
            <option value="">Semua Role</option>
            {roles.map((r) => (
              <option key={r.id} value={r.code}>{r.name}</option>
            ))}
          </select>
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 text-xs rounded-lg border border-outline-variant focus:border-primary outline-none transition-all cursor-pointer"
          >
            <option value="">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-primary text-on-primary font-label-md text-xs font-semibold px-4 py-2.5 rounded-xl hover-lift hover:bg-primary-container transition-all cursor-pointer shrink-0"
        >
          <UserPlus size={16} />
          Tambah User
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-outline-variant soft-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant">
                <th className="text-left px-4 py-3 font-bold text-on-surface-variant uppercase text-[10px] tracking-wider">Nama</th>
                <th className="text-left px-4 py-3 font-bold text-on-surface-variant uppercase text-[10px] tracking-wider">NIP</th>
                <th className="text-left px-4 py-3 font-bold text-on-surface-variant uppercase text-[10px] tracking-wider">Email</th>
                <th className="text-left px-4 py-3 font-bold text-on-surface-variant uppercase text-[10px] tracking-wider">Telepon</th>
                <th className="text-left px-4 py-3 font-bold text-on-surface-variant uppercase text-[10px] tracking-wider">Role</th>
                <th className="text-center px-4 py-3 font-bold text-on-surface-variant uppercase text-[10px] tracking-wider">Status</th>
                <th className="text-left px-4 py-3 font-bold text-on-surface-variant uppercase text-[10px] tracking-wider">Login Terakhir</th>
                <th className="text-center px-4 py-3 font-bold text-on-surface-variant uppercase text-[10px] tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={8} className="text-center py-12 text-on-surface-variant">Memuat data user...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-on-surface-variant">Tidak ada user ditemukan.</td></tr>
              ) : (
                users.map((user) => {
                  const roleClass = ROLE_BADGE[user.role || ''] || 'bg-surface-container text-on-surface-variant border-outline-variant';
                  return (
                    <tr key={user.id} className="border-b border-outline-variant/50 hover:bg-surface-container-low/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
                            {user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                          </div>
                          <span className="font-semibold text-on-surface">{user.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-on-surface-variant font-mono text-[10px]">{user.nip || '-'}</td>
                      <td className="px-4 py-3 text-on-surface-variant">{user.email}</td>
                      <td className="px-4 py-3 text-on-surface-variant">{user.phone || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border ${roleClass}`}>
                          <Shield size={10} />
                          {ROLE_DISPLAY_NAMES[user.role as keyof typeof ROLE_DISPLAY_NAMES] || user.role_name || user.role}
                          {user.role === 'petugas_lapangan' && user.sub_role && (
                            <span className="capitalize font-semibold text-[9px] opacity-90 border-l border-current pl-1 ml-1">
                              {user.sub_role}
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block text-[10px] font-bold px-2.5 py-1 rounded-full ${
                          user.is_active
                            ? 'bg-status-success/10 text-status-success'
                            : 'bg-status-error/10 text-status-error'
                        }`}>
                          {user.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-on-surface-variant">
                        {user.last_login_at ? dayjs(user.last_login_at).format('DD MMM YYYY, HH:mm') : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openEditModal(user)}
                            className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-md transition-all cursor-pointer"
                            title="Edit User"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(user)}
                            className="p-1.5 text-on-surface-variant hover:text-status-error hover:bg-status-error/10 rounded-md transition-all cursor-pointer"
                            title="Hapus User"
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
        {meta && meta.last_page > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-outline-variant bg-surface-container-low/30">
            <span className="text-[11px] text-on-surface-variant font-medium">
              Menampilkan {users.length} dari {meta.total} user
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-md border border-outline-variant hover:bg-surface-container disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-xs font-semibold px-3 py-1 bg-primary/10 text-primary rounded-md">
                {currentPage} / {meta.last_page}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(meta.last_page, p + 1))}
                disabled={currentPage === meta.last_page}
                className="p-1.5 rounded-md border border-outline-variant hover:bg-surface-container disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Create/Edit Modal ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 backdrop-blur-sm bg-black/45 animate-backdrop-fade" onClick={() => setModalOpen(false)}></div>
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl relative z-10 flex flex-col max-h-[90vh] animate-modal-zoom border border-outline-variant">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-outline-variant bg-surface-container-low/30 rounded-t-2xl">
              <div>
                <h3 className="font-headline-sm text-base font-bold text-on-surface">
                  {editingUser ? 'Edit User' : 'Tambah User Baru'}
                </h3>
                <p className="text-[11px] text-on-surface-variant">
                  {editingUser ? `Mengubah data ${editingUser.name}` : 'Isi data untuk membuat akun baru'}
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 text-on-surface-variant hover:text-status-error hover:bg-status-error/10 rounded-full transition-all cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-5 overflow-y-auto custom-scrollbar flex-1 space-y-4">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-on-surface-variant uppercase" htmlFor="user-name">
                  Nama Lengkap *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant z-10 pointer-events-none">
                    <Users size={14} />
                  </span>
                  <input
                    id="user-name"
                    type="text"
                    placeholder="Contoh: Ahmad Fauzi"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest text-xs focus:border-primary outline-none transition-all"
                  />
                </div>
              </div>

              {/* NIP */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-on-surface-variant uppercase" htmlFor="user-nip">
                  NIP
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant z-10 pointer-events-none">
                    <Hash size={14} />
                  </span>
                  <input
                    id="user-nip"
                    type="text"
                    placeholder="Nomor Induk Pegawai"
                    value={formData.nip}
                    onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                    className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest text-xs focus:border-primary outline-none transition-all"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-on-surface-variant uppercase" htmlFor="user-email">
                  Email *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant z-10 pointer-events-none">
                    <Mail size={14} />
                  </span>
                  <input
                    id="user-email"
                    type="email"
                    placeholder="email@labkesda.go.id"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest text-xs focus:border-primary outline-none transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-on-surface-variant uppercase" htmlFor="user-password">
                  {editingUser ? 'Password Baru (kosongkan jika tidak ingin mengubah)' : 'Password *'}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant z-10 pointer-events-none">
                    <Shield size={14} />
                  </span>
                  <input
                    id="user-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Minimal 6 karakter"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-9 pr-10 py-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest text-xs focus:border-primary outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors z-10 cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-on-surface-variant uppercase" htmlFor="user-phone">
                  Telepon
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant z-10 pointer-events-none">
                    <Phone size={14} />
                  </span>
                  <input
                    id="user-phone"
                    type="text"
                    placeholder="08xxxxxxxxxx"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest text-xs focus:border-primary outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Role */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-on-surface-variant uppercase" htmlFor="user-role">
                    Role *
                  </label>
                  <select
                    id="user-role"
                    value={formData.role_id}
                    onChange={(e) => {
                      const val = e.target.value;
                      const matched = roles.find((r) => r.id === val);
                      setFormData({
                        ...formData,
                        role_id: val,
                        sub_role: matched?.code === 'petugas_lapangan' ? formData.sub_role : '',
                      });
                    }}
                    className="w-full px-3 py-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest text-xs focus:border-primary outline-none transition-all cursor-pointer"
                  >
                    <option value="">-- Pilih Role --</option>
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>

                {/* Status */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-on-surface-variant uppercase">
                    Status
                  </label>
                  <div className="flex gap-3 mt-1">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, is_active: true })}
                      className={`flex-1 py-2.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        formData.is_active
                          ? 'bg-status-success/10 text-status-success border-status-success/30'
                          : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant hover:border-status-success/30'
                      }`}
                    >
                      Aktif
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, is_active: false })}
                      className={`flex-1 py-2.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        !formData.is_active
                          ? 'bg-status-error/10 text-status-error border-status-error/30'
                          : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant hover:border-status-error/30'
                      }`}
                    >
                      Nonaktif
                    </button>
                  </div>
                </div>
              </div>
              {roles.find((r) => r.id === formData.role_id)?.code === 'petugas_lapangan' && (
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-on-surface-variant uppercase" htmlFor="user-sub-role">
                    Sub-Role (Petugas Lapangan) *
                  </label>
                  <select
                    id="user-sub-role"
                    required
                    value={formData.sub_role}
                    onChange={(e) => setFormData({ ...formData, sub_role: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest text-xs focus:border-primary outline-none transition-all cursor-pointer"
                  >
                    <option value="">-- Pilih Sub-Role --</option>
                    <option value="ketua">Ketua</option>
                    <option value="anggota">Anggota</option>
                  </select>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isMutating}
                className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary font-label-md text-xs font-semibold py-3 rounded-xl hover-lift hover:bg-primary-container transition-all soft-shadow cursor-pointer disabled:opacity-80 mt-2"
              >
                {isMutating ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    {editingUser ? 'Simpan Perubahan' : 'Buat User'}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 backdrop-blur-sm bg-black/45 animate-backdrop-fade" onClick={() => setDeleteConfirm(null)}></div>
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl relative z-10 p-6 animate-modal-zoom border border-outline-variant text-center">
            <div className="bg-status-error/10 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={24} className="text-status-error" />
            </div>
            <h3 className="font-headline-sm text-base font-bold text-on-surface mb-1">
              Hapus User?
            </h3>
            <p className="text-xs text-on-surface-variant mb-6">
              Anda akan menghapus akun <strong className="text-on-surface">{deleteConfirm.name}</strong> ({deleteConfirm.email}). Aksi ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-xl border border-outline-variant text-xs font-semibold text-on-surface-variant hover:bg-surface-container transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="flex-1 py-2.5 rounded-xl bg-status-error text-white text-xs font-semibold hover:bg-red-700 transition-all cursor-pointer disabled:opacity-80"
              >
                {deleteMutation.isPending ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManajemenUser;
