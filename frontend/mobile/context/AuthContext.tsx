import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";



type AuthCtx = {
  departamento: string | null;
  loading: boolean;
  token: string | null;
  login: (departamento: string, accessToken: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [departamento, setDepartamento] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.multiGet(["departamento","accessToken"]);
        const savedDepto = saved.find(([k]) => k === "departamento")?.[1];
        const savedToken = saved.find(([k]) => k === "accessToken")?.[1];
        setDepartamento(savedDepto ?? null);
        setToken(savedToken ?? null);
      } catch (e) {
        console.error("Error loading storage", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (departamento: string, accessToken: string) => {
    await AsyncStorage.multiSet([[ "departamento", departamento ], [ "accessToken", accessToken ]])
    setDepartamento(departamento);
    setToken(accessToken);
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(["departamento", "accessToken"]);
    setDepartamento(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ departamento, loading, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
