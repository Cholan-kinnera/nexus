import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

import type { ReactNode } from "react";
interface AuthContextType {
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  );

  const login = (newToken: string) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  };

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setToken(null);
  }, []);

  // 15-minute auto-logout inactivity tracker
  useEffect(() => {
    if (!token) return;

    let timeoutId: number;

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      // 15 minutes = 15 * 60 * 1000 = 900,000 ms
      timeoutId = window.setTimeout(() => {
        logout();
        alert("Session expired due to 15 minutes of inactivity. Please log in again.");
        window.location.href = "/auth";
      }, 15 * 60 * 1000);
    };

    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    // Initial trigger
    resetTimer();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [token, logout]);

  return (
    <AuthContext.Provider
      value={{
        token,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}