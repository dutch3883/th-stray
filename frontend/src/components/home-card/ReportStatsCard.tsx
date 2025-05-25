import React from 'react';
import { getThemeBgLight, getThemeColor } from '../../utils/themeUtils';

interface ReportStatsCardProps {
  isRescueMode: boolean;
  loading: boolean;
  recentCount: number;
}

export const ReportStatsCard: React.FC<ReportStatsCardProps> = ({ 
  isRescueMode, 
  loading, 
  recentCount 
}) => {
  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
      <h2 className="text-lg font-medium text-gray-700 mb-3">สถิติล่าสุด / Recent Activity</h2>
      <div className="flex items-center">
        <div className={`w-12 h-12 ${getThemeBgLight(isRescueMode)} rounded-full flex items-center justify-center mr-4`}>
          <svg className={`w-6 h-6 ${getThemeColor(true, isRescueMode)}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <div>
          <p className="text-sm text-gray-500">จำนวนรายงานล่าสุด / Recent Reports</p>
          <p className="text-xl font-semibold">
            {loading ? 
              <span className="text-gray-400">กำลังโหลด / Loading...</span> : 
              recentCount
            }
          </p>
        </div>
      </div>
    </div>
  );
}; 