import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { getThemeBgLight, getThemeColor } from '../../utils/themeUtils';
import { User } from 'firebase/auth';
import LanguageSwitcher from '../LanguageSwitcher';

interface UserProfileCardProps {
  user: User;
  userRole?: string;
  cachedProfileUrl: string | null;
  imageError: boolean;
  setImageError: (error: boolean) => void;
  onLogout: () => void;
  onModeChange: (mode: 'report' | 'rescue') => void;
  currentMode: 'report' | 'rescue';
}

export const UserProfileCard: React.FC<UserProfileCardProps> = ({
  user,
  userRole,
  cachedProfileUrl,
  imageError,
  setImageError,
  onLogout,
  onModeChange,
  currentMode,
}) => {
  const { t } = useLanguage();
  const isRescueMode = currentMode === 'rescue';

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-gray-700">Profile</h2>
        <LanguageSwitcher />
      </div>
      <div className="flex items-center">
        <div className="mr-4">
          {cachedProfileUrl && !imageError ? (
            <img
              src={cachedProfileUrl}
              alt={user.displayName || "User"}
              className={`w-16 h-16 rounded-full object-cover border-2 ${getThemeBgLight(
                isRescueMode
              )}`}
              onError={() => setImageError(true)}
            />
          ) : (
            <div
              className={`w-16 h-16 rounded-full ${getThemeBgLight(
                isRescueMode
              )} flex items-center justify-center`}
            >
              <span
                className={`text-xl font-bold ${getThemeColor(
                  true,
                  isRescueMode
                )}`}
              >
                {user.displayName
                  ? user.displayName.charAt(0).toUpperCase()
                  : "U"}
              </span>
            </div>
          )}
        </div>
        <div className="flex-1">
          <h2 className="font-semibold text-lg text-gray-800">
            {user.displayName || "User"}
          </h2>
          <p className="text-sm text-gray-500">{user.email}</p>
          {userRole && (
            <p
              className={`text-sm font-medium ${getThemeColor(
                true,
                isRescueMode
              )}`}
            >
              {userRole === "admin"
                ? t("role.admin")
                : userRole === "rescuer"
                ? t("role.rescuer")
                : t("role.reporter")}
            </p>
          )}
        </div>
        <button
          onClick={onLogout}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
        >
          {t("auth.logout")}
        </button>
      </div>

      {/* Mode Toggle for Admin/Rescuer */}
      {(userRole === "admin" || userRole === "rescuer") && (
        <div className="mt-4 flex items-center justify-center">
          <div className="bg-gray-100 rounded-lg p-1 flex">
            <button
              onClick={() => onModeChange("report")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                currentMode === "report"
                  ? `${getThemeBgLight(isRescueMode)} ${getThemeColor(
                      true,
                      isRescueMode
                    )} shadow-sm`
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              {t("mode.report")}
            </button>
            <button
              onClick={() => onModeChange("rescue")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                currentMode === "rescue"
                  ? `${getThemeBgLight(isRescueMode)} ${getThemeColor(
                      true,
                      isRescueMode
                    )} shadow-sm`
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              {t("mode.rescue")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}; 