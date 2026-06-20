import { createContext } from "react";

export type Theme = "light" | "dark" | "system";

export interface ThemeContextType {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  themeLogs: string[];
  clearThemeLogs: () => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
