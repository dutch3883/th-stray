import React, { createContext, useContext } from 'react';
import { useMode } from './ModeContext';

interface ThemeColors {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  primaryBg: string;
  primaryBgLight: string;
  primaryBgDark: string;
  primaryText: string;
  primaryTextLight: string;
  primaryTextDark: string;
}

const reporterTheme: ThemeColors = {
  primary: '#3B82F6', // blue-500
  primaryLight: '#60A5FA', // blue-400
  primaryDark: '#2563EB', // blue-600
  primaryBg: '#EFF6FF', // blue-50
  primaryBgLight: '#DBEAFE', // blue-100
  primaryBgDark: '#BFDBFE', // blue-200
  primaryText: '#1E40AF', // blue-800
  primaryTextLight: '#3B82F6', // blue-500
  primaryTextDark: '#1E3A8A', // blue-900
};

const rescuerTheme: ThemeColors = {
  primary: '#10B981', // emerald-500
  primaryLight: '#34D399', // emerald-400
  primaryDark: '#059669', // emerald-600
  primaryBg: '#ECFDF5', // emerald-50
  primaryBgLight: '#D1FAE5', // emerald-100
  primaryBgDark: '#A7F3D0', // emerald-200
  primaryText: '#065F46', // emerald-800
  primaryTextLight: '#10B981', // emerald-500
  primaryTextDark: '#064E3B', // emerald-900
};

interface ThemeContextType {
  colors: ThemeColors;
  isRescueMode: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { mode } = useMode();
  const isRescueMode = mode === 'rescue';
  const colors = isRescueMode ? rescuerTheme : reporterTheme;

  return (
    <ThemeContext.Provider value={{ colors, isRescueMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
} 