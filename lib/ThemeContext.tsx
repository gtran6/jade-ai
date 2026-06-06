// lib/ThemeContext.tsx — Jade AI global theme + language
import { createContext, useContext, useState } from 'react';
import { useColorScheme } from 'react-native';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ColorScheme = 'light' | 'dark';
export type Lang = 'vi' | 'en';

interface JadeThemeCtx {
  themeMode: ThemeMode;
  setThemeMode: (m: ThemeMode) => void;
  scheme: ColorScheme;
  lang: Lang;
  setLang: (l: Lang) => void;
}

const Ctx = createContext<JadeThemeCtx>({
  themeMode: 'system',
  setThemeMode: () => {},
  scheme: 'light',
  lang: 'vi',
  setLang: () => {},
});

export function JadeThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');
  const [lang, setLang] = useState<Lang>('vi');
  const systemScheme = useColorScheme();

  const scheme: ColorScheme =
    themeMode === 'system'
      ? (systemScheme === 'dark' ? 'dark' : 'light')
      : themeMode;

  return (
    <Ctx.Provider value={{ themeMode, setThemeMode, scheme, lang, setLang }}>
      {children}
    </Ctx.Provider>
  );
}

export function useJadeTheme() {
  return useContext(Ctx);
}