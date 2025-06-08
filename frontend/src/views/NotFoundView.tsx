import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

export const NotFoundView = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center px-4">
        <h1 className="text-9xl font-bold text-blue-500">404</h1>
        <div className="mt-4">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            {t('error.not_found.title')}
          </h2>
          <p className="text-gray-600 mb-8">
            {t('error.not_found.description')}
          </p>
          <div className="space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
            >
              {t('error.not_found.go_back')}
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              {t('error.not_found.go_home')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 