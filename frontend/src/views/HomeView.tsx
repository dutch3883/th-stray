import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from 'firebase/auth';
import { UserProfileCard } from '../components/home-card/UserProfileCard';
import { WelcomeCard } from '../components/home-card/WelcomeCard';
import { ReportStatsCard } from '../components/home-card/ReportStatsCard';
import { RescueStatsCard } from '../components/home-card/RescueStatsCard';
import { MapCard } from '../components/home-card/MapCard';
import { AllReportsCard } from '../components/home-card/AllReportsCard';
import { NewReportCard } from '../components/home-card/NewReportCard';
import { MyReportsCard } from '../components/home-card/MyReportsCard';
import { TipsCard } from '../components/home-card/TipsCard';
import { useTheme } from '../contexts/ThemeContext';
import { useMode } from '../contexts/ModeContext';

interface HomeViewProps {
  user: User;
  userRole?: string;
  cachedProfileUrl: string | null;
  imageError: boolean;
  setImageError: (error: boolean) => void;
  onLogout: () => Promise<void>;
}

export const HomeView: React.FC<HomeViewProps> = ({
  user,
  userRole,
  cachedProfileUrl,
  imageError,
  setImageError,
  onLogout,
}) => {
  const navigate = useNavigate();
  const { isRescueMode } = useTheme();
  const { mode, setMode } = useMode();

  return (
    <div className="p-4 space-y-6">
      {/* User Profile Card */}
      <UserProfileCard
        user={user}
        userRole={userRole}
        cachedProfileUrl={cachedProfileUrl}
        imageError={imageError}
        setImageError={setImageError}
        onLogout={onLogout}
        onModeChange={setMode}
        currentMode={mode}
      />

      {/* Welcome Card */}
      <WelcomeCard isRescueMode={isRescueMode} mode={mode} />

      {/* Stats Card */}
      {mode === "rescue" ? (
        <RescueStatsCard isRescueMode={isRescueMode} />
      ) : (
        <ReportStatsCard isRescueMode={isRescueMode} />
      )}

      {/* Feature cards */}
      <div className="grid grid-cols-1 gap-4 mb-4">
        {mode === "rescue" ? (
          <>
            <MapCard
              isRescueMode={isRescueMode}
              onClick={() => navigate("/map?status=pending")}
            />
            <AllReportsCard
              isRescueMode={isRescueMode}
              onClick={() => navigate("/reports")}
            />
          </>
        ) : (
          <>
            <NewReportCard
              isRescueMode={isRescueMode}
              onClick={() => navigate("/submit")}
            />
            <MyReportsCard
              isRescueMode={isRescueMode}
              onClick={() => navigate("/my-reports")}
            />
          </>
        )}
      </div>

      {/* Tips Card */}
      <TipsCard isRescueMode={isRescueMode} />
    </div>
  );
}; 