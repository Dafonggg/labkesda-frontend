import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Loader2 } from 'lucide-react';
import { useReportPreview, useDownloadLaporan } from '@/hooks/useLaporan';
import type { HasilUjiItem } from '@/services/laporan.service';
import logoPurwakarta from '@/assets/logo template laporan .png';
import logoKan from '@/assets/logo kan .jpg';

/* ── Helper Functions ── */
const formatNilai = (val: string | number | null | undefined): string => {
  if (val === null || val === undefined || val === '') return '-';
  if (typeof val === 'number' || !isNaN(Number(val))) {
    const num = Number(val);
    const formatted = num.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
    return formatted.replace('.', ',');
  }
  return String(val);
};

const formatBakuMutu = (min: string | number | null | undefined, max: string | number | null | undefined): string => {
  if ((min === null || min === undefined) && (max === null || max === undefined)) return '-';
  const fmt = (v: string | number) => {
    const num = Number(v);
    return num.toFixed(4).replace(/0+$/, '').replace(/\.$/, '').replace('.', ',');
  };
  if (min !== null && min !== undefined && max !== null && max !== undefined) {
    return `${fmt(min)} – ${fmt(max)}`;
  }
  if (max !== null && max !== undefined) return fmt(max);
  return fmt(min as string | number);
};

const formatTanggal = (dt: string | null | undefined): string => {
  if (!dt) return '-';
  try {
    const d = new Date(dt);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}/${pad(d.getHours())}.${pad(d.getMinutes())}`;
  } catch {
    return dt;
  }
};

const formatTanggalShort = (dt: string | null | undefined): string => {
  if (!dt) return '-';
  try {
    const d = new Date(dt);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
  } catch {
    return dt;
  }
};

const getBulanIndo = (month: number): string => {
  const bulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  return bulan[month] || '';
};

const CATEGORY_ORDER = ['MIKROBIOLOGI', 'FISIK', 'KIMIA WAJIB', 'KIMIA TAMBAHAN'];

const PreviewLaporan: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: response, isLoading, isError } = useReportPreview(id || '');
  const downloadMutation = useDownloadLaporan();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-primary" size={32} />
          <p className="text-xs font-semibold text-on-surface-variant">Memuat data laporan...</p>
        </div>
      </div>
    );
  }

  if (isError || !response?.data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-sm font-semibold text-status-error">Gagal memuat data laporan.</p>
        <button onClick={() => navigate(-1)} className="text-xs text-primary font-bold hover:underline cursor-pointer">
          ← Kembali
        </button>
      </div>
    );
  }

  const data = response.data;
  const permohonan = data.permohonan || {};
  const sample = data.sample || {};
  const registrasi = data.registrasi || {};
  const hasilUji = data.hasil_uji || [];
  const koordinator = data.koordinator_teknis || { name: '-', nip: '-' };

  // Group hasil uji by kategori
  const grouped: Record<string, HasilUjiItem[]> = {};
  for (const cat of CATEGORY_ORDER) {
    grouped[cat] = [];
  }
  for (const item of hasilUji) {
    const cat = (item.kategori || 'LAINNYA').toUpperCase();
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(item);
  }
  // Filter empty
  const filteredGroups = Object.entries(grouped).filter(([, items]) => items.length > 0);

  let rowNumber = 1;

  const now = new Date();
  const tanggalTtd = `${now.getDate()} ${getBulanIndo(now.getMonth())} ${now.getFullYear()}`;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-outline-variant pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-surface-container rounded-lg transition-all cursor-pointer"
          >
            <ArrowLeft size={18} className="text-on-surface" />
          </button>
          <div>
            <h1 className="font-headline-lg text-lg font-extrabold text-on-surface">
              Preview Laporan Hasil Pengujian
            </h1>
            <p className="font-body-md text-xs text-on-surface-variant font-medium mt-0.5">
              {data.nomor_laporan || '-'}
            </p>
          </div>
        </div>
        <button
          onClick={() => id && downloadMutation.mutate(id)}
          disabled={downloadMutation.isPending}
          className="bg-primary text-on-primary font-label-md text-xs font-bold px-4 py-2.5 rounded-lg hover:bg-primary-container transition-all cursor-pointer soft-shadow flex items-center gap-2 disabled:opacity-60"
        >
          {downloadMutation.isPending ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Download size={14} />
          )}
          {downloadMutation.isPending ? 'Mengunduh...' : 'Download PDF'}
        </button>
      </div>

      {/* Report Preview */}
      <div className="flex justify-center">
        <div
          id="laporan-preview"
          style={{
            width: '210mm',
            minHeight: '297mm',
            background: '#fff',
            border: '2px solid #000',
            fontFamily: "'Times New Roman', Times, serif",
            fontSize: '11px',
            color: '#000',
            lineHeight: '1.3',
            boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
          }}
        >
          {/* ── KOP SURAT ── */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              borderBottom: '3px double #000',
              padding: '10px 16px',
            }}
          >
            {/* Logo Purwakarta */}
            <div style={{ width: '12%', textAlign: 'center' }}>
              <img
                src={logoPurwakarta}
                alt="Logo Purwakarta"
                style={{ width: '55px', height: 'auto' }}
              />
            </div>

            {/* Center text */}
            <div style={{ flex: 1, textAlign: 'center', padding: '0 8px' }}>
              <h1 style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 1px 0' }}>
                Pemerintah Kabupaten Purwakarta
              </h1>
              <h2 style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', margin: '0 0 1px 0' }}>
                Dinas Kesehatan
              </h2>
              <h3 style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', textDecoration: 'underline', margin: '0 0 3px 0' }}>
                UPTD Laboratorium Kesehatan
              </h3>
              <p style={{ fontSize: '9.5px', margin: 0 }}>
                Jalan : <u>Kapten Halim Nomor : 1</u> Telepon (0264) 8392744<br />
                <a href="mailto:labkesda.pwk@gmail.com" style={{ color: '#0000cc', textDecoration: 'underline' }}>
                  Email : labkesda.pwk@gmail.com
                </a><br />
                Purwakarta 41111
              </p>
            </div>

            {/* Logo KAN */}
            <div style={{ width: '20%', textAlign: 'center' }}>
              <img
                src={logoKan}
                alt="Logo KAN"
                style={{ width: '80px', height: 'auto' }}
              />
              <div style={{ fontSize: '9px', fontWeight: 'bold', color: '#003399', marginTop: '2px' }}>
                LP-1959-IDN
              </div>
            </div>
          </div>

          {/* ── CONTENT ── */}
          <div style={{ padding: '8px 20px 12px 20px' }}>
            {/* Form number */}
            <div style={{ fontSize: '9px', fontStyle: 'italic', marginBottom: '8px' }}>
              FORM-7.8-1/01 – <i>Rev.</i> 00 / 03-10-2022
            </div>

            {/* Title */}
            <div style={{ textAlign: 'center', fontSize: '13px', fontWeight: 'bold', textDecoration: 'underline', textTransform: 'uppercase', marginBottom: '10px' }}>
              Hasil Pemeriksaan Air Minum
            </div>

            {/* Metadata table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '6px', fontSize: '10.5px' }}>
              <tbody>
                <tr>
                  <td style={{ width: '28%', fontWeight: 'bold', padding: '1.5px 0', verticalAlign: 'top' }}>No. Kode Sampel</td>
                  <td style={{ width: '2%', textAlign: 'center' }}>:</td>
                  <td style={{ width: '20%' }}>{(registrasi as Record<string, unknown>).kode_sample as string || '-'}</td>
                  <td style={{ width: '14%', fontWeight: 'bold', verticalAlign: 'top' }}>Nama<br />Pelanggan</td>
                  <td style={{ width: '2%', textAlign: 'center' }}>:</td>
                  <td style={{ width: '34%' }}>{(permohonan as Record<string, unknown>).nama_instansi as string || (permohonan as Record<string, unknown>).nama_pemohon as string || '-'}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold', padding: '1.5px 0', verticalAlign: 'top' }}>Lokasi/Asal Sampel</td>
                  <td style={{ textAlign: 'center' }}>:</td>
                  <td>{(sample as Record<string, unknown>).lokasi_pengambilan as string || '-'}</td>
                  <td style={{ fontWeight: 'bold', verticalAlign: 'top' }}>Alamat</td>
                  <td style={{ textAlign: 'center' }}>:</td>
                  <td rowSpan={3} style={{ verticalAlign: 'top' }}>{(permohonan as Record<string, unknown>).alamat as string || '-'}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold', padding: '1.5px 0' }}>Tanggal/Jam Pengambilan</td>
                  <td style={{ textAlign: 'center' }}>:</td>
                  <td>{formatTanggal((sample as Record<string, unknown>).waktu_pengambilan as string)}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold', padding: '1.5px 0' }}>Tanggal/Jam Penerimaan</td>
                  <td style={{ textAlign: 'center' }}>:</td>
                  <td>{formatTanggal((registrasi as Record<string, unknown>).tanggal_registrasi as string)}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold', padding: '1.5px 0' }}>Tanggal Pemeriksaan</td>
                  <td style={{ textAlign: 'center' }}>:</td>
                  <td>{formatTanggalShort((registrasi as Record<string, unknown>).tanggal_registrasi as string)}</td>
                  <td colSpan={3}></td>
                </tr>
              </tbody>
            </table>

            {/* Regulation text */}
            <div style={{ textAlign: 'center', fontSize: '10px', fontStyle: 'italic', color: '#cc0000', marginBottom: '8px', lineHeight: '1.4', textDecoration: 'underline' }}>
              Mengacu Kepada Permenkes No.2 Tahun 2023<br />
              Tentang Peraturan Pelaksanaan PP No. 66 Tahun 2014 Tentang Kesehatan Lingkungan.
            </div>

            {/* Parameter Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '8px', fontSize: '10px' }}>
              <thead>
                <tr>
                  <th style={{ border: '1px solid #000', padding: '3px 5px', backgroundColor: '#d9d9d9', fontWeight: 'bold', textAlign: 'center', width: '5%' }}>No</th>
                  <th style={{ border: '1px solid #000', padding: '3px 5px', backgroundColor: '#d9d9d9', fontWeight: 'bold', textAlign: 'center', width: '24%' }}>Jenis Parameter</th>
                  <th style={{ border: '1px solid #000', padding: '3px 5px', backgroundColor: '#d9d9d9', fontWeight: 'bold', textAlign: 'center', width: '10%' }}>Satuan</th>
                  <th style={{ border: '1px solid #000', padding: '3px 5px', backgroundColor: '#d9d9d9', fontWeight: 'bold', textAlign: 'center', width: '14%' }}>Hasil<br />Pemeriksaan</th>
                  <th style={{ border: '1px solid #000', padding: '3px 5px', backgroundColor: '#d9d9d9', fontWeight: 'bold', textAlign: 'center', width: '14%' }}>Batas<br />Maksimum</th>
                  <th style={{ border: '1px solid #000', padding: '3px 5px', backgroundColor: '#d9d9d9', fontWeight: 'bold', textAlign: 'center', width: '33%', fontSize: '9px' }}>Metode</th>
                </tr>
              </thead>
              <tbody>
                {filteredGroups.map(([category, items]) => (
                  <React.Fragment key={category}>
                    {/* Category header */}
                    <tr>
                      <td style={{ border: '1px solid #000', padding: '3px 5px', fontWeight: 'bold', backgroundColor: '#f0f0f0' }}></td>
                      <td colSpan={5} style={{ border: '1px solid #000', padding: '3px 5px', fontWeight: 'bold', backgroundColor: '#f0f0f0' }}>{category}</td>
                    </tr>
                    {/* Parameter rows */}
                    {items.map((item, idx) => {
                      const num = rowNumber++;
                      return (
                        <tr key={`${category}-${idx}`}>
                          <td style={{ border: '1px solid #000', padding: '3px 5px', textAlign: 'center' }}>{num}</td>
                          <td style={{ border: '1px solid #000', padding: '3px 5px' }}>
                            {item.nama_parameter || '-'}
                            {item.is_outside_accreditation && ' *'}
                          </td>
                          <td style={{ border: '1px solid #000', padding: '3px 5px', textAlign: 'center' }}>{item.satuan || '-'}</td>
                          <td style={{ border: '1px solid #000', padding: '3px 5px', textAlign: 'center' }}>{formatNilai(item.nilai_hasil)}</td>
                          <td style={{ border: '1px solid #000', padding: '3px 5px', textAlign: 'center' }}>{formatBakuMutu(item.baku_mutu_min, item.baku_mutu_max)}</td>
                          <td style={{ border: '1px solid #000', padding: '3px 5px', fontSize: '9px' }}>{item.metode || '-'}</td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))}

                {/* Empty state */}
                {filteredGroups.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ border: '1px solid #000', padding: '12px', textAlign: 'center', color: '#999', fontStyle: 'italic' }}>
                      Belum ada data hasil pengujian.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Footnotes */}
            <div style={{ marginTop: '8px', fontSize: '9.5px', paddingLeft: '5px' }}>
              <p style={{ fontWeight: 'bold', textDecoration: 'underline', marginBottom: '3px' }}>Ket :</p>
              <ul style={{ listStyleType: 'disc', marginLeft: '20px', padding: 0 }}>
                <li style={{ marginBottom: '2px', textDecoration: 'underline', color: '#cc0000', fontStyle: 'italic' }}>
                  Data hasil pengujian hanya berlaku untuk sampel yang diterima dan diuji oleh laboratorium.
                </li>
                <li style={{ marginBottom: '2px', textDecoration: 'underline', color: '#cc0000', fontStyle: 'italic' }}>
                  Laboratorium tidak menerima permintaan pengulangan pengujian apabila jumlah sampel tidak memadai atau parameter uji tidak stabil.
                </li>
                <li style={{ marginBottom: '2px', textDecoration: 'underline', color: '#cc0000', fontStyle: 'italic' }}>
                  Parameter yang bertanda bintang (*) merupakan parameter di luar lingkup akreditasi.
                </li>
                <li style={{ marginBottom: '2px', textDecoration: 'underline', color: '#cc0000', fontStyle: 'italic' }}>
                  Pengukuran parameter suhu dan pH dilakukan di lapangan.
                </li>
              </ul>
            </div>

            {/* Footer Section (QR Verification + Signature) */}
            <div style={{ marginTop: '15px', width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '0 20px' }}>
              {/* Verification QR */}
              <div style={{ width: '45%', textAlign: 'left', paddingLeft: '10px' }}>
                {data.qr_code_base64 && (
                  <div style={{ border: '1px solid #ddd', padding: '5px', width: '130px', backgroundColor: '#fafafa', borderRadius: '4px', display: 'inline-block' }}>
                    <p style={{ fontSize: '7px', marginBottom: '3px', fontWeight: 'bold', textAlign: 'center', textTransform: 'uppercase', fontFamily: "'Times New Roman', Times, serif", color: '#333', margin: '0 0 3px 0' }}>Verifikasi Keaslian LHP</p>
                    <div style={{ textAlign: 'center' }}>
                      <img src={`data:image/png;base64,${data.qr_code_base64}`} alt="QR Code Tracking" style={{ width: '60px', height: '60px', display: 'inline-block' }} />
                    </div>
                    <p style={{ fontSize: '6px', marginTop: '3px', textAlign: 'center', color: '#666', fontFamily: "'Times New Roman', Times, serif", lineHeight: '1.1', margin: '3px 0 0 0' }}>Pindai QR ini untuk verifikasi keaslian dokumen via portal resmi.</p>
                  </div>
                )}
              </div>

              {/* Signature */}
              <div style={{ width: '55%', textAlign: 'right', paddingRight: '10px', fontSize: '10.5px' }}>
                <div style={{ display: 'inline-block', textAlign: 'center', minWidth: '220px' }}>
                  <p style={{ marginBottom: '3px', textAlign: 'center' }}>Purwakarta, {tanggalTtd}</p>
                  <p style={{
                    textDecoration: 'underline',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    marginBottom: (data.signature_image_base64 || data.qr_code_base64) ? '5px' : '40px'
                  }}>
                    Kepala UPTD,
                  </p>
                  {data.signature_image_base64 ? (
                    <div style={{ margin: '5px auto', width: '120px', height: '60px', textAlign: 'center' }}>
                      <img
                        src={`data:image/png;base64,${data.signature_image_base64}`}
                        alt="Tanda Tangan Kepala UPTD"
                        style={{ width: '120px', height: '60px', display: 'inline-block', objectFit: 'contain' }}
                      />
                    </div>
                  ) : data.qr_code_base64 ? (
                    <div style={{ margin: '5px auto', width: '90px', height: '90px', border: '1px solid #ddd', padding: '4px', backgroundColor: '#fafafa', borderRadius: '4px', display: 'inline-block' }}>
                      <img
                        src={`data:image/png;base64,${data.qr_code_base64}`}
                        alt="QR Code Signature"
                        style={{ width: '80px', height: '80px', display: 'block', margin: '0 auto' }}
                      />
                    </div>
                  ) : null}
                  <p style={{ fontWeight: 'bold', textDecoration: 'underline', margin: 0, textAlign: 'center' }}>{koordinator.name}</p>
                  <p style={{ fontSize: '9.5px', margin: 0, textAlign: 'center' }}>NIP. {koordinator.nip}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewLaporan;
