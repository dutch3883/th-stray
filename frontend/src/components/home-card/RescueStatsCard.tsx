import React, { useEffect, useState } from 'react';
import { getThemeBgLight, getThemeColor } from '../../utils/themeUtils';
import { api } from '../../services/apiService';
import { ReportStatus } from '../../types/report';
import { useLanguage } from '../../contexts/LanguageContext';

interface RescueStatsCardProps {
  isRescueMode: boolean;
}

export const RescueStatsCard: React.FC<RescueStatsCardProps> = ({ isRescueMode }) => {
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [completedCount, setCompletedCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const { getDualLanguageText, t } = useLanguage();

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        setLoading(true);
        const [pending, completed] = await Promise.all([
          api.countAllReports({ status: ReportStatus.PENDING }),
          api.countAllReports({ status: ReportStatus.COMPLETED })
        ]);
        setPendingCount(pending);
        setCompletedCount(completed);
      } catch (error) {
        console.error('Error fetching rescue stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCounts();
  }, []);

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
      <h2 className="text-lg font-medium text-gray-700 mb-3">{getDualLanguageText('card.stats.title')}</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center">
          <div className={`w-12 h-12 ${getThemeBgLight(isRescueMode)} rounded-full flex items-center justify-center mr-4`}>
            <svg className={`w-6 h-6 ${getThemeColor(true, isRescueMode)}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-500">{getDualLanguageText('card.stats.completed')}</p>
            <p className="text-xl font-semibold">
              {loading ? 
                <span className="text-gray-400">{getDualLanguageText('card.stats.loading')}</span> : 
                completedCount
              }
            </p>
          </div>
        </div>
        <div className="flex items-center">
          <div className={`w-12 h-12 ${getThemeBgLight(isRescueMode)} rounded-full flex items-center justify-center mr-4`}>
            <svg className={`w-6 h-6 ${getThemeColor(true, isRescueMode)}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-500">{getDualLanguageText('card.stats.pending')}</p>
            <p className="text-xl font-semibold">
              {loading ? 
                <span className="text-gray-400">{getDualLanguageText('card.stats.loading')}</span> : 
                pendingCount
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}; 