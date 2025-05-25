import React from 'react';
import { getThemeGradient, getThemeColor } from '../../utils/themeUtils';

interface WelcomeCardProps {
  isRescueMode: boolean;
  mode: string;
}

export const WelcomeCard: React.FC<WelcomeCardProps> = ({ isRescueMode, mode }) => {
  return (
    <div className={`bg-gradient-to-r ${getThemeGradient(isRescueMode)} text-white p-6 rounded-xl shadow-md`}>
      <h1 className="text-2xl font-bold mb-2">ยินดีต้อนรับ / Welcome</h1>
      <p className={`${getThemeColor(true, isRescueMode, 100)}`}>
        {mode === 'rescue' ? 'ขอบคุณที่ช่วยเหลือแมวจรในชุมชนของเรา ♥' : 'ขอบคุณที่แจ้งข้อมูลแมวจรในชุมชนของเรา ♥'}
      </p>
    </div>
  );
}; 