import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Colors, Typography } from "@/theme";
import { useAuth } from "@/context/AuthContext";

export default function Account() {
  const { departamento, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.replace("/"); // vuelve al login
  };

  return (
    <View style={styles.container}>
      {/* Título */}
      <Text style={styles.title}>Cuenta</Text>

      {/* Avatar */}
      <View style={styles.avatar}>
        <Ionicons name="business-outline" size={128} color={Colors.gray} />
      </View>

      {/* Número de depto */}
      <Text style={styles.info}>Número de depto.: {departamento ?? "—"}</Text>

      {/* Cerrar Sesión */}
      <TouchableOpacity style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>Cerrar Sesión</Text>
      </TouchableOpacity>

      {/* Link Cambiar contraseña */}
      <TouchableOpacity>
        <Text style={styles.link}>Cambiar contraseña</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24
  },
  title: {
    fontSize: Typography.h1,
    fontWeight: "bold",
    color: Colors.dark,
    marginBottom: 24
  },
  avatar: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Colors.lightGray,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24
  },
  info: {
    fontSize: Typography.h2,
    color: Colors.dark,
    marginBottom: 32
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: "center",
    width: "100%",
    marginBottom: 12
  },
  buttonText: {
    color: Colors.white,
    fontSize: Typography.h2,
    fontWeight: "600"
  },
  link: {
    fontSize: Typography.small,
    color: Colors.accent,
    marginTop: 16,
    textDecorationLine: "underline"
  },
});
