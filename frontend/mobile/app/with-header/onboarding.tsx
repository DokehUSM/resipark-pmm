import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Typography, Colors } from "@/theme";

export default function Onboarding() {
  return (
    <View style={styles.container}>
      {/* Icono */}
      <Ionicons name="car-outline" size={200} color="#333" style={styles.icon} />

      {/* Título */}
      <Text style={styles.title}>
        Reserva de estacionamientos de visita
      </Text>

      {/* Subtítulo */}
      <Text style={styles.subtitle}>
        Consulta disponibilidad y gestiona fácilmente los espacios para tus visitas
      </Text>

      {/* Botón */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/with-header/availability")}
      >
        <Text style={styles.buttonText}>Reservar →</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.lightGray,
  },
  icon: {
    marginBottom: 30,
  },
  title: {
    fontSize: Typography.h1,
    fontWeight: "bold",
    textAlign: "center",
    width: '85%',
    marginBottom: 12,
    color: "#000",
  },
  subtitle: {
    fontSize: Typography.h2,
    textAlign: "center",
    color: "#555",
    marginBottom: 30,
  },
  button: {
    backgroundColor: Colors.primary, // aquí pon tu color primario del theme
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
