import React, { createContext, useContext, useState, useEffect } from 'react';

export type AppMode = 'report' | 'rescue';

interface ModeContextType {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
}

const ModeContext = createContext<ModeContextType | undefined>(undefined);

export function ModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<AppMode>(() => {
    const savedMode = localStorage.getItem('appMode');
    return (savedMode === 'rescue' || savedMode === 'report') ? savedMode : 'report';
  });

  useEffect(() => {
    localStorage.setItem('appMode', mode);
  }, [mode]);

  return (
    <ModeContext.Provider value={{ mode, setMode }}>
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