import React, { useEffect } from 'react';

interface StatusModalProps {
  isOpen: boolean;
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

export default function StatusModal({ isOpen, message, type, onClose }: StatusModalProps) {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(onClose, 5000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isError = type === 'error';

  return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl">
        {/* Icon based on type */}
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${isError ? 'bg-red-50 text-red-600' : 'bg-teal-50 text-teal-600'}`}>
          {isError ? (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          ) : (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
          )}
        </div>

        <h3 className={`text-xl font-bold ${isError ? 'text-red-600' : 'text-slate-900'}`}>
          {isError ? 'Error' : 'Success!'}
        </h3>
        <p className="text-slate-500 mt-2 mb-8">{message}</p>

        <button 
          onClick={onClose} 
          className={`w-full py-3 font-semibold rounded-xl transition ${isError ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-slate-900 hover:bg-slate-800 text-white'}`}
        >
          Close
        </button>
      </div>
    </div>
  );
}