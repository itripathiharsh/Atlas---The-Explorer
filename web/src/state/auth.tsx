import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { api, getToken, setToken } from "../api/client";
import type { AuthResponse, User } from "../api/types";

interface AuthCtx {
  user: User | null;
  loading: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const Ctx = createContext<AuthCtx>(null!);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(!!getToken());

  useEffect(() => {
    if (!getToken()) return;
    api<User>("/me")
      .then(setUser)
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const onUnauthorized = () => setUser(null);
    window.addEventListener("wg:unauthorized", onUnauthorized);
    return () => window.removeEventListener("wg:unauthorized", onUnauthorized);
  }, []);

  async function login(usernameOrEmail: string, password: string) {
    const res = await api<AuthResponse>("/auth/login", {
      method: "POST",
      body: { username_or_email: usernameOrEmail, password },
    });
    setToken(res.token);
    setUser(res.user);
  }

  async function register(username: string, email: string, password: string) {
    const res = await api<AuthResponse>("/auth/register", {
      method: "POST",
      body: { username, email, password },
    });
    setToken(res.token);
    setUser(res.user);
  }

  function logout() {
    setToken(null);
    setUser(null);
  }

  return (
    <Ctx.Provider value={{ user, loading, login, register, logout }}>{children}</Ctx.Provider>
  );
}

export function useAuth() {
  return useContext(Ctx);
}
