import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle } from 'lucide-react';

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-cream-bg flex flex-col items-center justify-center p-6 text-on-surface">
      <div className="bg-white p-8 md:p-10 rounded-2xl soft-shadow border border-outline-variant max-w-md w-full text-center hover-lift">
        <div className="w-16 h-16 bg-primary-container/20 text-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
          <HelpCircle size={36} />
        </div>
        
        <h1 className="font-headline-lg text-2xl font-bold tracking-tight mb-2">
          Halaman Tidak Ditemukan
        </h1>
        <p className="font-body-md text-xs text-on-surface-variant mb-8 leading-relaxed">
          Maaf, halaman yang Anda cari tidak dapat ditemukan atau telah dipindahkan.
        </p>

        <Link
          to="/"
          className="inline-flex w-full items-center justify-center bg-primary text-on-primary font-label-md text-xs font-semibold py-3 rounded-lg hover:bg-primary-container transition-all soft-shadow cursor-pointer"
        >
          Kembali ke Dashboard
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
