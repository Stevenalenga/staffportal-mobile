import React, { createContext, useContext, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { authApi, type ApiUser } from "@/lib/api";

interface AuthState {
  user: ApiUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateStoredUser: (user: ApiUser) => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    restoreSession();
  }, []);

  async function restoreSession() {
    try {
      const [storedToken, storedUser] = await Promise.all([
        SecureStore.getItemAsync("auth_token"),
        SecureStore.getItemAsync("auth_user"),
      ]);
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch {
      // corrupt storage — clear it
      await SecureStore.deleteItemAsync("auth_token");
      await SecureStore.deleteItemAsync("auth_user");
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, password: string) {
    const result = await authApi.login(email, password);
    console.log("[AuthContext] login response:", JSON.stringify(result));

    const newToken = result?.token;
    const newUser = result?.user;

    if (!newToken || typeof newToken !== "string") {
      throw new Error(
        `Server response missing token.\nReceived: ${JSON.stringify(result)}`
      );
    }
    if (!newUser || typeof newUser !== "object") {
      throw new Error("Server response missing user data.");
    }

    const userJson = JSON.stringify(newUser);
    if (!userJson) {
      throw new Error("Failed to serialize user data.");
    }

    await SecureStore.setItemAsync("auth_token", newToken);
    await SecureStore.setItemAsync("auth_user", userJson);
    setToken(newToken);
    setUser(newUser);
  }

  async function logout() {
    await Promise.all([
      SecureStore.deleteItemAsync("auth_token"),
      SecureStore.deleteItemAsync("auth_user"),
    ]);
    setToken(null);
    setUser(null);
  }

  async function updateStoredUser(next: ApiUser) {
    const userJson = JSON.stringify(next);
    await SecureStore.setItemAsync("auth_user", userJson);
    setUser(next);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        login,
        logout,
        updateStoredUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
