import { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onClose: () => void;
}

export function Toast({ message, type = 'success', duration = 3000, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: <CheckCircle size={20} className="text-green-400" />,
    error: <AlertCircle size={20} className="text-red-400" />,
    info: <Info size={20} className="text-blue-400" />,
  };

  const bgColors = {
    success: 'bg-green-900/90',
    error: 'bg-red-900/90',
    info: 'bg-blue-900/90',
  };

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-down">
      <div
        className={`${bgColors[type]} backdrop-blur-sm border border-slate-700 rounded-xl shadow-2xl p-4 flex items-center gap-3 min-w-[300px] max-w-[400px]`}
      >
        {icons[type]}
        <p className="flex-1 text-white font-medium">{message}</p>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-700/50 rounded transition-colors"
        >
          <X size={18} className="text-slate-400" />
        </button>
      </div>
    </div>
  );
}
