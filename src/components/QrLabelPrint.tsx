import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, X, Tag } from 'lucide-react';
import dayjs from 'dayjs';

interface QrLabelPrintProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    kode_sample: string;
    nomor_registrasi: string;
    jenis_sample: string;
    tanggal_registrasi: string;
    qr_token: string;
    tracking_url: string;
  };
}

const QrLabelPrint: React.FC<QrLabelPrintProps> = ({ isOpen, onClose, data }) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank', 'width=600,height=400');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Label QR - ${data.kode_sample}</title>
        <style>
          @page {
            size: 50mm 25mm;
            margin: 0;
          }
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            width: 50mm;
            height: 25mm;
            font-family: 'Arial', 'Helvetica', sans-serif;
            display: flex;
            align-items: center;
            padding: 1.5mm;
          }
          .label-container {
            display: flex;
            align-items: center;
            gap: 2mm;
            width: 100%;
            height: 100%;
          }
          .qr-section {
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .qr-section svg {
            width: 18mm;
            height: 18mm;
          }
          .info-section {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            gap: 0.5mm;
            overflow: hidden;
            min-width: 0;
          }
          .kode-sample {
            font-size: 7pt;
            font-weight: 900;
            letter-spacing: 0.3pt;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .nomor-reg {
            font-size: 5pt;
            font-weight: 600;
            color: #444;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .jenis {
            font-size: 5pt;
            color: #666;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .tanggal {
            font-size: 4.5pt;
            color: #888;
            white-space: nowrap;
          }
          .labkesda {
            font-size: 4pt;
            color: #999;
            letter-spacing: 0.2pt;
            text-transform: uppercase;
            margin-top: 0.3mm;
          }
        </style>
      </head>
      <body>
        <div class="label-container">
          <div class="qr-section">
            ${printContent.querySelector('.qr-code-area')?.innerHTML || ''}
          </div>
          <div class="info-section">
            <div class="kode-sample">${data.kode_sample}</div>
            <div class="nomor-reg">${data.nomor_registrasi}</div>
            <div class="jenis">${data.jenis_sample}</div>
            <div class="tanggal">${dayjs(data.tanggal_registrasi).format('DD/MM/YYYY')}</div>
            <div class="labkesda">Labkesda Purwakarta</div>
          </div>
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 backdrop-blur-md bg-black/60 animate-backdrop-fade"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl relative z-10 flex flex-col animate-modal-zoom border border-outline-variant overflow-hidden">
        {/* Header */}
        <div className="bg-primary/5 border-b border-outline-variant p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Tag size={18} className="text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-on-surface">Cetak Label QR</h3>
              <p className="text-[10px] text-on-surface-variant">
                Preview label untuk printer thermal 50×25mm
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-on-surface-variant hover:text-status-error hover:bg-status-error/10 rounded-full transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Preview Area */}
        <div className="p-6 space-y-5">
          {/* Label Preview Card */}
          <div className="flex justify-center">
            <div
              ref={printRef}
              className="border-2 border-dashed border-primary/30 rounded-xl p-4 bg-white inline-flex items-center gap-4 shadow-lg"
              style={{ minWidth: '320px' }}
            >
              {/* QR Code */}
              <div className="qr-code-area shrink-0">
                <QRCodeSVG
                  value={data.tracking_url}
                  size={90}
                  level="M"
                  includeMargin={false}
                  bgColor="transparent"
                />
              </div>

              {/* Info */}
              <div className="flex flex-col gap-1 min-w-0">
                <span className="text-sm font-black text-on-surface tracking-wide">
                  {data.kode_sample}
                </span>
                <span className="text-[11px] font-semibold text-on-surface-variant">
                  {data.nomor_registrasi}
                </span>
                <span className="text-[10px] text-on-surface-variant/80">
                  {data.jenis_sample}
                </span>
                <span className="text-[10px] text-on-surface-variant/60">
                  {dayjs(data.tanggal_registrasi).format('DD/MM/YYYY')}
                </span>
                <span className="text-[8px] text-on-surface-variant/40 uppercase tracking-widest mt-0.5">
                  Labkesda Purwakarta
                </span>
              </div>
            </div>
          </div>

          {/* Info Callout */}
          <div className="bg-primary/5 border border-primary/10 rounded-xl p-3 text-[11px] text-primary/90 leading-relaxed">
            <strong>Tips:</strong> Pastikan printer thermal label terhubung dan ukuran kertas
            sudah diatur ke <strong>50×25mm</strong>. QR code berisi link tracking yang bisa
            di-scan dari mana saja.
          </div>

          {/* Detail Table */}
          <div className="bg-surface-container-low rounded-xl p-3 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-on-surface-variant font-medium">Kode Sample</span>
              <span className="font-bold text-on-surface">{data.kode_sample}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant font-medium">Nomor Registrasi</span>
              <span className="font-bold text-on-surface">{data.nomor_registrasi}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant font-medium">QR Token</span>
              <span className="font-mono font-bold text-primary">{data.qr_token}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant font-medium">Tracking URL</span>
              <a
                href={data.tracking_url}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-primary hover:underline truncate max-w-[200px]"
              >
                {data.tracking_url}
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-outline-variant p-4 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 text-xs font-bold text-on-surface-variant border border-outline-variant rounded-xl hover:bg-surface-container transition-all cursor-pointer"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex-[2] flex items-center justify-center gap-2 py-2.5 text-xs font-bold bg-primary text-on-primary rounded-xl hover:bg-primary-container hover:text-on-primary transition-all cursor-pointer soft-shadow hover-lift"
          >
            <Printer size={15} />
            Cetak Label QR
          </button>
        </div>
      </div>
    </div>
  );
};

export default QrLabelPrint;
