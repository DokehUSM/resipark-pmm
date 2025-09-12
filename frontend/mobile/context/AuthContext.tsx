import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

type AuthCtx = {
  departamento: number | null;
  loading: boolean;
  login: (depto: number) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [departamento, setDepartamento] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem("departamento");
      if (saved) setDepartamento(Number(saved));
      setLoading(false);
    })();
  }, []);

  const login = async (depto: number) => {
    await AsyncStorage.setItem("departamento", String(depto));
    setDepartamento(depto);
  };

  const logout = async () => {
    await AsyncStorage.removeItem("departamento");
    setDepartamento(null);
  };

  return (
    <AuthContext.Provider value={{ departamento, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
