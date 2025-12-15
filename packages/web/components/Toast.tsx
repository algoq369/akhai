'use client';

import { useEffect } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const colors = {
    success: 'bg-green-50 border-green-200 text-green-700',
    error: 'bg-red-50 border-red-200 text-red-700',
    info: 'bg-blue-50 border-blue-200 text-blue-700'
  };

  return (
    <div className={`fixed bottom-4 right-4 px-4 py-2 border rounded-md shadow-lg ${colors[type]} animate-slide-up z-50`}>
      <div className="flex items-center gap-2">
        <p className="text-[12px] font-medium">{message}</p>
        <button
          onClick={onClose}
          className="text-[10px] opacity-60 hover:opacity-100 ml-2"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
