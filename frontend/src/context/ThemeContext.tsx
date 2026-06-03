import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  themeLogs: string[];
  clearThemeLogs: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") {
      return saved;
    }
    return "light"; // Default to light mode as requested
  });

  const [themeLogs, setThemeLogs] = useState<string[]>(() => {
    const saved = localStorage.getItem("themeLogs");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback
      }
    }
    return [`[${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}] Theme initialized: ${theme}`];
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);

    const now = new Date();
    const logEntry = `[${now.toLocaleDateString()} ${now.toLocaleTimeString()}] Switched theme to: ${theme}`;

    setThemeLogs((prev) => {
      // Avoid duplicate logs during initialization
      if (prev.length > 0 && prev[prev.length - 1].includes(`Switched theme to: ${theme}`)) {
        return prev;
      }
      const updated = [...prev, logEntry].slice(-50);
      localStorage.setItem("themeLogs", JSON.stringify(updated));
      return updated;
    });
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const clearThemeLogs = () => {
    const now = new Date();
    const cleared = [`[${now.toLocaleDateString()} ${now.toLocaleTimeString()}] Logs cleared. Current theme: ${theme}`];
    setThemeLogs(cleared);
    localStorage.setItem("themeLogs", JSON.stringify(cleared));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, themeLogs, clearThemeLogs }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
