// index.tsx

import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";

import { Colors, Typography } from "@/theme";
import { login as loginApi } from "@/services/login";
import { useAuth } from "@/context/AuthContext";
import { useApiConfig } from "@/context/ApiConfigContext";

export default function Login() {
  const { login } = useAuth();
  const { apiUrl, loading: apiLoading } = useApiConfig();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const tapCountRef = useRef(0);
  const lastTapRef = useRef(0);

  useEffect(() => {
    if (apiLoading) return;
    if (!apiUrl) {
      router.replace("/settings");
    }
  }, [apiLoading, apiUrl]);

  const handleSecretTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current > 1200) {
      tapCountRef.current = 0;
    }
    tapCountRef.current += 1;
    lastTapRef.current = now;

    if (tapCountRef.current >= 5) {
      tapCountRef.current = 0;
      router.push("/settings");
    }
  };

  const handleLogin = async () => {
    if (!apiUrl) return;

    const result = await loginApi(email.trim(), password);

    if (!result.ok) {
      Alert.alert("No pudimos iniciar sesion", result.error);
      console.log("No se pudo iniciar sesion");
      return;
    }

    await login(result.data.departamento, result.data.access_token);
    router.replace("/with-header/home");
    console.log("Se ha iniciado la sesion");
  };

  if (apiLoading || !apiUrl) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Cargando configuracion...</Text>
      </View>
    );
  }

  const isDisabled = !email.trim() || !password.trim();

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.select({ ios: "padding", android: "height" })}
      keyboardVerticalOffset={Platform.select({ ios: 0, android: 24 })}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.welcome}>Bienvenido</Text>
        <Text style={styles.title}>Iniciar Sesion</Text>

        <TouchableOpacity
          style={styles.logoWrapper}
          activeOpacity={1}
          onPress={handleSecretTap}
        >
          <Image
            source={require("../assets/resipark-logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </TouchableOpacity>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Correo electronico</Text>
          <TextInput
            style={styles.input}
            placeholder="correo@ejemplo.com"
            keyboardType="email-address"
            placeholderTextColor={Colors.gray}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            returnKeyType="next"
            textContentType="emailAddress"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Contrasena</Text>
          <View style={styles.passwordWrapper}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              secureTextEntry={!showPassword}
              placeholder="********"
              placeholderTextColor={Colors.gray}
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
              autoComplete="password"
              autoCorrect={false}
              textContentType="password"
              returnKeyType="done"
            />
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={
                showPassword ? "Ocultar contrasena" : "Mostrar contrasena"
              }
              onPress={() => setShowPassword((prev) => !prev)}
              style={styles.togglePassword}
            >
              <Text style={styles.togglePasswordText}>
                {showPassword ? "Ocultar" : "Ver"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, isDisabled && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={isDisabled}
        >
          <Text style={styles.buttonText}>Ingresar</Text>
        </TouchableOpacity>

        {/* <TouchableOpacity>
          <Text style={styles.link}>Olvidaste tu contrasena?</Text>
        </TouchableOpacity> */}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.light,
  },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 32,
    backgroundColor: Colors.light,
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.light,
  },
  loadingText: {
    marginTop: 12,
    fontSize: Typography.body,
    color: Colors.gray,
  },
  welcome: {
    marginBottom: 4,
    fontSize: Typography.small,
    fontWeight: "700",
    textAlign: "center",
    color: Colors.gray,
  },
  title: {
    marginBottom: 24,
    fontSize: Typography.h1,
    fontWeight: "bold",
    textAlign: "center",
    color: Colors.dark,
  },
  logoWrapper: {
    height: 100,
    marginBottom: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    height: 100,
    aspectRatio: 1024 / 432,
    resizeMode: "contain",
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    flexDirection: "row",
    marginBottom: 6,
    fontSize: Typography.h2,
    color: Colors.dark,
  },
  input: {
    borderWidth: 3,
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: Typography.body,
    color: Colors.dark,
    backgroundColor: Colors.white,
    borderColor: Colors.lightGray,
  },
  passwordWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  passwordInput: {
    flex: 1,
    paddingRight: 48,
  },
  togglePassword: {
    position: "absolute",
    right: 12,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  togglePasswordText: {
    fontSize: Typography.small,
    fontWeight: "600",
    color: Colors.primary,
  },
  button: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: "center",
    backgroundColor: Colors.primary,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: Typography.h2,
    fontWeight: "600",
    color: Colors.white,
  },
  link: {
    marginTop: 16,
    fontSize: Typography.small,
    textAlign: "center",
    color: Colors.accent,
    textDecorationLine: "underline",
  },
});
