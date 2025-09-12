import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Colors, Typography } from "@/theme";
// fetch
import { login } from "@/services/login";

export default function Login() {

  const [depto, setDepto] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const data = await login(Number(depto), password);
      console.log("Login exitoso", data);
      router.replace("/with-header/onboarding"); // navegar tras login
    } catch (e: any) {
      console.error(e.message);
    }
  };

  return (
    <View style={styles.container}>
      {/* Encabezado */}
      <Text style={styles.welcome}>¡Bienvenido!</Text>
      <Text style={styles.title}>Iniciar Sesión</Text>

      {/* Logo / Imagen */}
      <View style={styles.logoPlaceholder}>
        <Image
          source={require("../assets/resipark-logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* Input: Número de depto. */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          Número de depto.
          <Ionicons name="help-circle-outline" size={Typography.h2} color={Colors.gray} />
        </Text>
        <TextInput
          style={styles.input}
          placeholder="1108A"
          placeholderTextColor={Colors.gray}
          value={depto}
          onChangeText={setDepto}
        />
      </View>

      {/* Input: Contraseña */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          Contraseña
          <Ionicons name="help-circle-outline" size={Typography.h2} color={Colors.gray} />
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

      {/* Botón principal */}
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Ingresar</Text>
      </TouchableOpacity>

      {/* Link Olvidaste contraseña */}
      <TouchableOpacity>
        <Text style={styles.link}>¿Olvidaste tu contraseña?</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light,
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  welcome: {
    fontSize: Typography.small,
    fontWeight: 700,
    textAlign: "center",
    color: Colors.gray,
    marginBottom: 4,
  },
  title: {
    fontSize: Typography.h1,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 24,
    color: Colors.dark,
  },
  logoPlaceholder: {
    height: 100,
    borderRadius: 8,
    marginBottom: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: Typography.h2,
    color: Colors.dark,
    marginBottom: 6,
    flexDirection: "row",
  },
  input: {
    borderWidth: 3,
    borderColor: Colors.lightGray,
    backgroundColor: Colors.white,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: Typography.body,
    color: Colors.dark,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 16,
  },
  buttonText: {
    color: Colors.white,
    fontSize: Typography.h2,
    fontWeight: "600",
  },
  link: {
    fontSize: Typography.small,
    color: Colors.accent,
    textAlign: "center",
    marginTop: 16,
    textDecorationLine: "underline",
  },
  logo: {
    height: 100,
    width: undefined,
    aspectRatio: 1024/432,     // relación ancho/alto de la imagen
    resizeMode: "contain",
  },
});
