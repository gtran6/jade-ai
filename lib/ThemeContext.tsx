// lib/ThemeContext.tsx — Jade AI global theme
import { createContext, useContext, useState } from 'react';
import { useColorScheme } from 'react-native';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ColorScheme = 'light' | 'dark';

interface JadeThemeCtx {
  themeMode: ThemeMode;
  setThemeMode: (m: ThemeMode) => void;
  scheme: ColorScheme;   // resolved: always 'light' | 'dark'
}

const Ctx = createContext<JadeThemeCtx>({
  themeMode: 'system',
  setThemeMode: () => {},
  scheme: 'light',
});

export function JadeThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');
  const systemScheme = useColorScheme();

  const scheme: ColorScheme =
    themeMode === 'system'
      ? (systemScheme === 'dark' ? 'dark' : 'light')
      : themeMode;

  return (
    <Ctx.Provider value={{ themeMode, setThemeMode, scheme }}>
      {children}
    </Ctx.Provider>
  );
}

export function useJadeTheme() {
  return useContext(Ctx);
}