import React from 'react';
import { getThemeBgLight, getThemeColor } from '../../utils/themeUtils';

interface RescueStatsCardProps {
  isRescueMode: boolean;
  pendingCount: number;
  completedCount: number;
}

export const RescueStatsCard: React.FC<RescueStatsCardProps> = ({ 
  isRescueMode, 
  pendingCount, 
  completedCount 
}) => {
  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
      <h2 className="text-lg font-medium text-gray-700 mb-3">สถิติล่าสุด / Recent Activity</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center">
          <div className={`w-12 h-12 ${getThemeBgLight(isRescueMode)} rounded-full flex items-center justify-center mr-4`}>
            <svg className={`w-6 h-6 ${getThemeColor(true, isRescueMode)}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-500">ช่วยเหลือสำเร็จ / Completed</p>
            <p className="text-xl font-semibold">{completedCount}</p>
          </div>
        </div>
        <div className="flex items-center">
          <div className={`w-12 h-12 ${getThemeBgLight(isRescueMode)} rounded-full flex items-center justify-center mr-4`}>
            <svg className={`w-6 h-6 ${getThemeColor(true, isRescueMode)}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-500">รอช่วยเหลือ / Pending</p>
            <p className="text-xl font-semibold">{pendingCount}</p>
          </div>
        </div>
      </div>
    </div>
  );
}; 