import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

export type AppMode = 'report' | 'rescue';

interface ModeContextType {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
}

const ModeContext = createContext<ModeContextType | undefined>(undefined);

export function ModeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [savedMode, setSavedMode] = useState<AppMode | null>(null);
  const [currentMode, setCurrentMode] = useState<AppMode>('report');

  // Load saved mode from localStorage
  useEffect(() => {
    if (user) {
      const storedMode = localStorage.getItem(`appMode_${user.uid}`);
      console.log('ModeProvider: Loading saved mode:', storedMode);
      if (storedMode === 'rescue' || storedMode === 'report') {
        setSavedMode(storedMode);
        setCurrentMode(storedMode);
      }
    }
  }, [user]);

  // Save mode to localStorage when it changes
  useEffect(() => {
    if (user && savedMode) {
      console.log('ModeProvider: Saving mode to localStorage:', savedMode);
      localStorage.setItem(`appMode_${user.uid}`, savedMode);
    }
  }, [savedMode, user]);

  const setMode = (newMode: AppMode) => {
    console.log('ModeProvider: Setting new mode:', newMode);
    setSavedMode(newMode);
    setCurrentMode(newMode);
  };

  return (
    <ModeContext.Provider value={{ mode: currentMode, setMode }}>
      {children}
    </ModeContext.Provider>
  );
}

export function useMode() {
  const context = useContext(ModeContext);
  if (context === undefined) {
    throw new Error('useMode must be used within a ModeProvider');
  }
  return context;
} 