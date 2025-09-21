import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  API_URL_STORAGE_KEY,
  DEFAULT_API_URL,
  normalizeApiUrl,
  setCurrentApiUrl,
  tryGetCurrentApiUrl,
} from "@/config/api";

type ApiConfigContextValue = {
  apiUrl: string | null;
  defaultSuggestion: string;
  loading: boolean;
  saveApiUrl: (value: string) => Promise<void>;
  clearApiUrl: () => Promise<void>;
};

const ApiConfigContext = createContext<ApiConfigContextValue | null>(null);

export function ApiConfigProvider({ children }: { children: React.ReactNode }) {
  const [apiUrl, setApiUrl] = useState<string | null>(tryGetCurrentApiUrl());
  const [loading, setLoading] = useState(true);
  const defaultSuggestion = useMemo(
    () => normalizeApiUrl(process.env.EXPO_PUBLIC_API_BASE ?? DEFAULT_API_URL),
    []
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(API_URL_STORAGE_KEY);
        if (!mounted) return;
        if (stored) {
          const normalized = normalizeApiUrl(stored);
          setApiUrl(normalized);
          setCurrentApiUrl(normalized);
        }
      } catch (err) {
        console.warn("Failed to load API URL", err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const saveApiUrl = useCallback(async (value: string) => {
    const normalized = normalizeApiUrl(value);
    await AsyncStorage.setItem(API_URL_STORAGE_KEY, normalized);
    setCurrentApiUrl(normalized);
    setApiUrl(normalized);
  }, []);

  const clearApiUrl = useCallback(async () => {
    await AsyncStorage.removeItem(API_URL_STORAGE_KEY);
    setCurrentApiUrl(null);
    setApiUrl(null);
  }, []);

  const value = useMemo(
    () => ({ apiUrl, defaultSuggestion, loading, saveApiUrl, clearApiUrl }),
    [apiUrl, defaultSuggestion, loading, saveApiUrl, clearApiUrl]
  );

  return <ApiConfigContext.Provider value={value}>{children}</ApiConfigContext.Provider>;
}

export function useApiConfig() {
  const ctx = useContext(ApiConfigContext);
  if (!ctx) throw new Error("useApiConfig must be used within an ApiConfigProvider");
  return ctx;
}
