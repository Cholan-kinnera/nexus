import { createContext } from "react";

export interface User {
  id?: number;
  full_name: string | null;
  name?: string | null;
  email: string;
  role?: string | null;
  avatar_url?: string | null;
}

export interface AuthContextType {
  token: string | null;
  user: User | null;
  hasBooted: boolean;
  setHasBooted: (val: boolean) => void;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
