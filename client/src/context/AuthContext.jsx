import { useCallback, useMemo, useState } from "react";
import { AuthContext } from "./AuthContext.js";
import { apiRequest } from "../lib/api";

const STORAGE_KEY = "bookleaf_session";

function readSession() {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readSession);

  const login = useCallback(async (credentials, expectedRole) => {
    const data = await apiRequest("/auth/login", {
      method: "POST",
      body: credentials,
    });

    if (!data.token || !data.user) {
      throw new Error("The server returned an incomplete login response.");
    }

    if (data.user.role !== expectedRole) {
      throw new Error(
        expectedRole === "admin"
          ? "This account does not have administrator access."
          : "Please use the correct sign-in option for your account.",
      );
    }

    const nextSession = { token: data.token, user: data.user };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
    setSession(nextSession);

    return data.user;
  }, []);

  const register = useCallback(async (details) => {
    const data = await apiRequest("/auth/register", {
      method: "POST",
      body: details,
    });

    if (!data.token || !data.user || data.user.role !== "author") {
      throw new Error("Registration returned an unexpected response.");
    }

    const nextSession = { token: data.token, user: data.user };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
    setSession(nextSession);

    return data.user;
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      token: session?.token ?? null,
      login,
      register,
      logout,
    }),
    [session, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
