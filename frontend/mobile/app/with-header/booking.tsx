import { View, Text, StyleSheet, TextInput, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Colors, Typography } from "@/theme";

export default function Booking() {
  return (
    <View style={styles.container}>
      {/* Título */}
      <View style={{flexDirection: 'row', alignItems: 'center', gap: 10,}}>
      <TouchableOpacity onPress={() => router.push("/with-header/availability")}>
        <Ionicons name="arrow-back-circle-outline" size={Typography.h1} color={Colors.gray} />
      </TouchableOpacity>
      <Text style={[styles.title]}>Reserva</Text>

      </View>

      {/* Ícono central */}
      <Ionicons name="car-outline" size={120} color={Colors.dark} style={styles.icon} />

      {/* Input: Número de patente */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          Número de patente{" "}
          <Ionicons name="help-circle-outline" size={16} color={Colors.gray} />
        </Text>
        <TextInput
          style={styles.input}
          placeholder="RFDT69"
          placeholderTextColor={Colors.gray}
        />
      </View>

      {/* Input: Hora de ingreso */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          Hora de ingreso{" "}
          <Ionicons name="help-circle-outline" size={16} color={Colors.gray} />
        </Text>
        <TextInput
          style={styles.input}
          placeholder="3:15 PM"
          placeholderTextColor={Colors.gray}
        />
      </View>

      {/* Botón Reservar */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => console.log("Reserva confirmada")}
      >
        <Text style={styles.buttonText}>Reservar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.lightGray,
    padding: 24,
  },
  title: {
    fontSize: Typography.h1,
    fontWeight: "bold",
    color: Colors.dark,
  },
  icon: {
    alignSelf: "center",
    marginBottom: 32,
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
    borderColor: Colors.gray,
    backgroundColor: "#fff",
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
    marginTop: 24,
  },
  buttonText: {
    color: Colors.white,
    fontSize: Typography.h2,
    fontWeight: "600",
  },
});
