import React, { useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  isVisible: boolean;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, isVisible, onClose }) => {
  const { t } = useLanguage();

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
  const icon = type === 'success' ? '✓' : '✕';

  return (
    <div className={`fixed top-4 right-4 z-50 transition-all duration-500 ease-out transform ${
      isVisible 
        ? 'translate-y-0 opacity-100' 
        : '-translate-y-full opacity-0 pointer-events-none'
    }`}>
      <div className={`${bgColor} text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 min-w-64`}>
        <span className="text-lg font-bold">{icon}</span>
        <span>{message}</span>
        <button
          onClick={onClose}
          className="ml-auto text-white hover:text-gray-200 text-lg font-bold"
          title={t('toast.close')}
          aria-label={t('toast.close')}
        >
          ×
        </button>
      </div>
    </div>
  );
}; 