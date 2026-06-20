import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { ThemeContext } from "./ThemeContextObject";
import type { Theme } from "./ThemeContextObject";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark" || saved === "system") {
      return saved;
    }
    return "dark"; // Default to dark first
  });

  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("dark");

  const [themeLogs, setThemeLogs] = useState<string[]>(() => {
    const saved = localStorage.getItem("themeLogs");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fallback
      }
    }
    return [`[${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}] Theme initialized: system`];
  });

  const location = useLocation();

  const isPublicRoute = location
    ? ["/", "/auth", "/login", "/signup", "/forgot-password"].includes(location.pathname)
    : false;

  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = () => {
      let activeTheme: "light" | "dark";
      if (isPublicRoute) {
        activeTheme = "dark";
      } else if (theme === "system") {
        activeTheme = mediaQuery.matches ? "dark" : "light";
      } else {
        activeTheme = theme;
      }

      setResolvedTheme(activeTheme);

      if (activeTheme === "dark") {
        root.classList.add("dark");
        root.classList.remove("light");
      } else {
        root.classList.add("light");
        root.classList.remove("dark");
      }
    };

    applyTheme();

    if (theme === "system" && !isPublicRoute) {
      mediaQuery.addEventListener("change", applyTheme);
      return () => mediaQuery.removeEventListener("change", applyTheme);
    }
  }, [theme, isPublicRoute]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("theme", newTheme);

    const now = new Date();
    const logEntry = `[${now.toLocaleDateString()} ${now.toLocaleTimeString()}] Switched theme to: ${newTheme}`;

    setThemeLogs((prev) => {
      if (prev.length > 0 && prev[prev.length - 1].includes(`Switched theme to: ${newTheme}`)) {
        return prev;
      }
      const updated = [...prev, logEntry].slice(-50);
      localStorage.setItem("themeLogs", JSON.stringify(updated));
      return updated;
    });
  };

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const clearThemeLogs = () => {
    const now = new Date();
    const cleared = [`[${now.toLocaleDateString()} ${now.toLocaleTimeString()}] Logs cleared. Current theme: ${theme}`];
    setThemeLogs(cleared);
    localStorage.setItem("themeLogs", JSON.stringify(cleared));
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme, themeLogs, clearThemeLogs }}>
      {children}
    </ThemeContext.Provider>
  );
}

