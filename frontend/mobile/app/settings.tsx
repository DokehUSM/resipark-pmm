import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";

import { Colors, Typography } from "@/theme";
import { useApiConfig } from "@/context/ApiConfigContext";
import { isValidApiUrl, normalizeApiUrl } from "@/config/api";

export default function SettingsScreen() {
  const { apiUrl, defaultSuggestion, loading, saveApiUrl } = useApiConfig();
  const [value, setValue] = useState(apiUrl ?? "");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (apiUrl) {
      setValue(apiUrl);
      return;
    }
    setValue((prev) => prev || defaultSuggestion || "");
  }, [apiUrl, defaultSuggestion]);

  const normalizedValue = useMemo(() => normalizeApiUrl(value), [value]);
  const isValid = useMemo(() => isValidApiUrl(value), [value]);

  const handleSubmit = useCallback(async () => {
    if (!isValid) {
      Alert.alert("URL no valida", "Ingresa una URL que comience con http o https");
      return;
    }

    try {
      setSubmitting(true);
      await saveApiUrl(normalizedValue);
      if (router.canGoBack()) router.back();
      else router.replace("/");
    } catch (error) {
      console.error("No se pudo guardar la URL", error);
      Alert.alert("Error", "No se pudo guardar la URL. Intentalo nuevamente.");
    } finally {
      setSubmitting(false);
    }
  }, [isValid, normalizedValue, saveApiUrl]);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.select({ ios: "padding", android: undefined })}
    >
      <View style={styles.inner}>
        <Text style={styles.title}>Ajustes de API</Text>
        <Text style={styles.subtitle}>
          Ingresa la URL base del servicio que usara la app.
        </Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>URL de la API</Text>
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={setValue}
            placeholder="https://tu-servidor"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            editable={!submitting}
          />
          {!!defaultSuggestion && !apiUrl && (
            <TouchableOpacity
              style={styles.suggestionButton}
              onPress={() => setValue(defaultSuggestion)}
            >
              <Text style={styles.suggestionText}>Usar sugerencia: {defaultSuggestion}</Text>
            </TouchableOpacity>
          )}
        </View>

        {!isValid && value.trim().length > 0 && (
          <Text style={styles.helper}>Ejemplo: https://resipark.miempresa.cl</Text>
        )}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, (!isValid || submitting) && styles.buttonDisabled]}
          disabled={!isValid || submitting}
          onPress={handleSubmit}
        >
          <Text style={styles.buttonText}>{submitting ? "Guardando..." : "Guardar"}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light,
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light,
  },
  inner: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  title: {
    fontSize: Typography.h1,
    fontWeight: "bold",
    color: Colors.dark,
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: Typography.body,
    color: Colors.gray,
    marginBottom: 24,
    textAlign: "center",
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: Typography.h2,
    color: Colors.dark,
    marginBottom: 6,
  },
  input: {
    borderWidth: 2,
    borderColor: Colors.lightGray,
    borderRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: Typography.body,
    color: Colors.dark,
    backgroundColor: Colors.white,
  },
  suggestionButton: {
    marginTop: 8,
  },
  suggestionText: {
    fontSize: Typography.small,
    color: Colors.accent,
    textDecorationLine: "underline",
  },
  helper: {
    fontSize: Typography.small,
    color: Colors.accent,
    textAlign: "center",
  },
  footer: {
    padding: 24,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: Typography.h2,
    fontWeight: "600",
    color: Colors.white,
  },
});
