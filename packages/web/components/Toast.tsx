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

  return (
    <div className="fixed bottom-4 right-4 border-b border-relic-mist py-1 px-2 animate-slide-up z-50">
      <div className="flex items-center gap-2">
        <p className="font-mono text-xs text-relic-silver">{message}</p>
        <button
          onClick={onClose}
          className="text-relic-silver hover:text-relic-slate text-xs ml-1"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
