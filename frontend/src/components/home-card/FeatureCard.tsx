import React from 'react';
import { getThemeBgLight, getThemeColor } from '../../utils/themeUtils';

interface FeatureCardProps {
  isRescueMode: boolean;
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  isRescueMode,
  title,
  description,
  icon,
  onClick
}) => {
  return (
    <div 
      className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center cursor-pointer hover:bg-gray-50"
      onClick={onClick}
    >
      <div className={`w-12 h-12 ${getThemeBgLight(isRescueMode)} rounded-full flex items-center justify-center mr-4`}>
        {icon}
      </div>
      <div>
        <h3 className="font-medium text-gray-800">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
      <svg className="w-5 h-5 ml-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </div>
  );
}; 