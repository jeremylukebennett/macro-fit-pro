import React, { createContext, useContext, useState, useEffect } from 'react';

interface SettingsContextType {
  showDrinks: boolean;
  setShowDrinks: (show: boolean) => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [showDrinks, setShowDrinksState] = useState<boolean>(() => {
    const saved = localStorage.getItem('showDrinks');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    return (saved as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    localStorage.setItem('showDrinks', JSON.stringify(showDrinks));
  }, [showDrinks]);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const setShowDrinks = (show: boolean) => {
    setShowDrinksState(show);
  };

  const setTheme = (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
  };

  return (
    <SettingsContext.Provider value={{ showDrinks, setShowDrinks, theme, setTheme }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
