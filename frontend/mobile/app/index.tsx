import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Colors, Typography } from "@/theme";
import { login as loginApi } from "@/services/login";
import { useAuth } from "@/context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const [depto, setDepto] = useState("");
  const [password, setPassword] = useState("");
  const isDisabled = !depto.trim() || !password.trim();

  const handleLogin = async () => {
    const result = await loginApi(parseInt(depto, 10), password);
    if (!result.ok) {
      Alert.alert("No pudimos iniciar sesión", result.error);
      console.log("No se pudo iniciar sesión");
      return;
    }
    await login(result.data.departamento);
    router.replace("/with-header/onboarding");
    console.log("Se ha iniciado la sesión");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.welcome}>¡Bienvenido!</Text>
      <Text style={styles.title}>Iniciar Sesión</Text>

      <View style={styles.logoWrapper}>
        <Image
          source={require("../assets/resipark-logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          Número de depto.
        </Text>
        <TextInput
          style={styles.input}
          placeholder="1108"
          keyboardType="number-pad"
          placeholderTextColor={Colors.gray}
          value={depto}
          onChangeText={setDepto}
          returnKeyType="next"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          Contraseña
        </Text>
        <TextInput
          style={styles.input}
          secureTextEntry
          placeholder="********"
          placeholderTextColor={Colors.gray}
          value={password}
          onChangeText={setPassword}
        />
      </View>

      <TouchableOpacity
        style={[styles.button, isDisabled && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={isDisabled}
      >
        <Text style={styles.buttonText}>Ingresar</Text>
      </TouchableOpacity>

      <TouchableOpacity>
        <Text style={styles.link}>¿Olvidaste tu contraseña?</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: Colors.light,
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
