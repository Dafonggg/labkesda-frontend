import React, { useState } from 'react';
import { Award, Upload, Image as ImageIcon, HelpCircle, CheckCircle, ShieldAlert } from 'lucide-react';
import { useUploadSignature } from '@/hooks/useUser';
import { useAuthStore } from '@/stores/auth';

const SignatureKepala: React.FC = () => {
  const { user } = useAuthStore();
  const uploadMutation = useUploadSignature();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(user?.signature_image_url || null);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('File harus berupa gambar (PNG, JPG, JPEG)!');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran file maksimal adalah 2MB!');
      return;
    }
    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = () => {
    if (!selectedFile) return;
    uploadMutation.mutate(selectedFile, {
      onSuccess: () => {
        setSelectedFile(null);
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-outline-variant pb-4">
        <h1 className="font-headline-lg text-lg md:text-xl font-extrabold text-on-surface flex items-center gap-2">
          <Award className="text-primary" />
          Pengaturan Tanda Tangan Elektronik
        </h1>
        <p className="font-body-md text-xs text-on-surface-variant mt-1 font-medium">
          Kelola berkas tanda tangan basah digital yang akan dibubuhkan pada dokumen resmi Laporan Hasil Pemeriksaan (LHP).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left/Middle Column: Uploader */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-outline-variant overflow-hidden soft-shadow p-6 space-y-6">
          <h2 className="text-sm font-bold text-on-surface">Unggah Tanda Tangan Basah Baru</h2>
          
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center flex flex-col items-center justify-center transition-all ${
              isDragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-outline-variant hover:border-primary/60 hover:bg-surface-container-low'
            }`}
          >
            <Upload size={32} className="text-on-surface-variant/80 mb-3" />
            <p className="text-xs font-semibold text-on-surface">
              Seret dan lepaskan file gambar Anda di sini, atau
            </p>
            <label className="mt-3 inline-flex items-center bg-primary text-on-primary text-[10px] font-bold px-3 py-1.5 rounded-lg cursor-pointer hover:bg-primary-container transition-all soft-shadow">
              Pilih File
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
            </label>
            <p className="text-[10px] text-on-surface-variant/70 mt-2">
              Mendukung PNG, JPG, atau JPEG (Maks. 2MB)
            </p>
          </div>

          {selectedFile && (
            <div className="bg-surface-container-low border border-outline-variant rounded-lg p-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 truncate">
                <ImageIcon size={16} className="text-primary shrink-0" />
                <span className="font-semibold text-on-surface truncate">{selectedFile.name}</span>
                <span className="text-[10px] text-on-surface-variant shrink-0">
                  ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              </div>
              <button
                onClick={handleUpload}
                disabled={uploadMutation.isPending}
                className="bg-primary text-on-primary px-4 py-1.5 rounded text-[10px] font-bold cursor-pointer hover:bg-primary-container disabled:opacity-75"
              >
                {uploadMutation.isPending ? 'Mengunggah...' : 'Simpan Tanda Tangan'}
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Preview & Status */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-outline-variant overflow-hidden soft-shadow p-6 space-y-4">
            <h2 className="text-sm font-bold text-on-surface">Preview Tanda Tangan Aktif</h2>
            
            <div className="aspect-[4/3] rounded-lg border border-outline-variant bg-slate-50 flex items-center justify-center overflow-hidden p-4 relative group">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Tanda Tangan UPTD"
                  className="max-h-full max-w-full object-contain drop-shadow-md"
                />
              ) : (
                <div className="text-center text-on-surface-variant/60">
                  <ShieldAlert size={24} className="mx-auto mb-2 text-on-surface-variant/40" />
                  <p className="text-[10px] font-semibold">Tanda tangan belum diunggah</p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 text-[10px] font-bold p-2.5 rounded-lg border bg-surface-container-low border-outline-variant">
              {user?.signature_image ? (
                <>
                  <CheckCircle size={14} className="text-status-success shrink-0" />
                  <span className="text-status-success">Tanda Tangan Aktif Tersimpan</span>
                </>
              ) : (
                <>
                  <HelpCircle size={14} className="text-amber-600 shrink-0" />
                  <span className="text-amber-700">Menggunakan QR Code Fallback</span>
                </>
              )}
            </div>
          </div>

          {/* Guide Card */}
          <div className="bg-gradient-to-br from-primary/5 to-primary-container/10 border border-primary/20 rounded-xl p-5 space-y-3">
            <h3 className="text-xs font-bold text-primary flex items-center gap-1.5">
              <HelpCircle size={14} />
              Panduan Gambar Tanda Tangan
            </h3>
            <ul className="text-[10px] text-on-surface-variant font-medium leading-relaxed list-disc list-inside space-y-1.5">
              <li>Gunakan kertas putih polos bersih tanpa garis saat memfoto/men-scan tanda tangan.</li>
              <li>Sangat disarankan menggunakan format **PNG dengan latar belakang transparan** agar membaur indah pada sertifikat PDF.</li>
              <li>Pastikan gambar memiliki pencahayaan cukup dan garis tanda tangan terlihat kontras dan tajam.</li>
              <li>Ukuran resolusi optimal sekitar **400x200 pixel** dengan orientasi horisontal.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignatureKepala;
