import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, onUnauthorized, tokenStore } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => tokenStore.get());
  const [user, setUser] = useState(null);
  const [balance, setBalance] = useState(null);
  // "loading" while the stored token is being checked, then "ready".
  const [status, setStatus] = useState(() => (tokenStore.get() ? "loading" : "ready"));

  const logout = useCallback(() => {
    tokenStore.clear();
    setToken(null);
    setUser(null);
    setBalance(null);
    setStatus("ready");
  }, []);

  useEffect(() => onUnauthorized(logout), [logout]);

  const refresh = useCallback(async () => {
    const data = await api.me();
    setUser(data.user);
    setBalance(data.balance);
    return data;
  }, []);

  // Validate a stored token on first load.
  useEffect(() => {
    if (!token || user) return;
    let cancelled = false;
    api
      .me()
      .then((data) => {
        if (cancelled) return;
        setUser(data.user);
        setBalance(data.balance);
      })
      .catch(() => !cancelled && logout())
      .finally(() => !cancelled && setStatus("ready"));
    return () => {
      cancelled = true;
    };
  }, [token, user, logout]);

  const startSession = useCallback((data) => {
    tokenStore.set(data.token);
    setToken(data.token);
    setUser(data.user);
    if (data.balance !== undefined) setBalance(data.balance);
    setStatus("ready");
  }, []);

  const value = useMemo(
    () => ({ token, user, balance, status, setBalance, setUser, refresh, startSession, logout }),
    [token, user, balance, status, refresh, startSession, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
