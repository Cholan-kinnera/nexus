import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

import type { ReactNode } from "react";
import api from "../api/client";

export interface User {
  id?: number;
  full_name: string | null;
  name?: string | null;
  email: string;
  role?: string | null;
  avatar_url?: string | null;
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  hasBooted: boolean;
  setHasBooted: (val: boolean) => void;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [hasBooted, setHasBootedState] = useState(() => {
    return sessionStorage.getItem("hasBooted") === "true";
  });

  const setHasBooted = (val: boolean) => {
    sessionStorage.setItem("hasBooted", val ? "true" : "false");
    setHasBootedState(val);
  };
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  );

  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("user");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return null;
  });

  const login = (newToken: string, userData: User) => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
  };

  const logout = useCallback(() => {
    // Clear local storage and state immediately for smooth UI transitions
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("hasBooted");
    setHasBootedState(false);
    setToken(null);
    setUser(null);

    // Revoke the refresh token on the backend in the background
    api.post("/auth/logout").catch((err) => {
      console.error("Failed to revoke session on backend during logout:", err);
    });
  }, []);

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      localStorage.setItem("user", JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Automatic profile hydration on token changes or page refresh
  useEffect(() => {
    const hydrateUserProfile = async () => {
      if (!token) return;
      try {
        const response = await api.get("/users/me");
        const freshUser = response.data;
        setUser(freshUser);
        localStorage.setItem("user", JSON.stringify(freshUser));
      } catch (err: any) {
        console.error("Failed to automatically hydrate user profile:", err);
        if (err.response?.status === 401) {
          logout();
        }
      }
    };

    hydrateUserProfile();
  }, [token, logout]);

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
        user,
        hasBooted,
        setHasBooted,
        login,
        logout,
        updateUser,
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
