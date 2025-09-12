import React, { useMemo, useState } from "react";
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Colors, Typography } from "@/theme";
import { crearReserva } from "@/services/reservas";
import { useAuth } from "@/context/AuthContext";

// TODO: reemplaza por tu fuente real (ej. contexto de auth)
// Si ya tienes useAuth con `departamento`, úsalo aquí.

const DURATION_MIN = 120; // fijo e inmutable

export default function Booking() {
  const { departamento } = useAuth();
  const params = useLocalSearchParams<{ slotId?: string }>();
  const slotId = useMemo(() => {
    const n = Number(params.slotId);
    return Number.isFinite(n) ? n : null;
  }, [params.slotId]);

  const [patente, setPatente] = useState("");
  const [loading, setLoading] = useState(false);

  const canSubmit =
    !!slotId &&
    typeof departamento === "number" &&
    patente.trim().length > 0 &&
    !loading;


  async function onReservar() {
    if (!canSubmit) return;

    // por si acaso, otra guarda en runtime:
    if (departamento == null) {
      Alert.alert("Sesión requerida", "Inicia sesión para asociar tu número de departamento.");
      return;
    }

    const now = new Date();
    const startISO = now.toISOString();
    const endISO = new Date(now.getTime() + DURATION_MIN * 60_000).toISOString();

    setLoading(true);
    const resp = await crearReserva({
      hora_inicio: startISO,
      hora_termino: endISO,
      placa_patente_visitante: patente.trim().toUpperCase(),
      numero_estacionamiento: slotId!,           
      numero_departamento: departamento!,
    });

    if (!resp.ok) {
      Alert.alert("No se pudo reservar", resp.error);
      return;
    }

    Alert.alert(
      "Listo",
      `Reserva #${resp.data.id_reserva} (${resp.data.estado})`,
      [{ text: "OK", onPress: () => router.replace("/with-header/availability") }]
    );
  }

  return (
    <View style={styles.container}>
      {/* Título */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <TouchableOpacity onPress={() => router.push("/with-header/availability")}>
          <Ionicons name="arrow-back-circle-outline" size={Typography.h1} color={Colors.gray} />
        </TouchableOpacity>
        <Text style={styles.title}>Reserva</Text>
      </View>

      {/* Ícono central */}
      <Ionicons name="car-outline" size={120} color={Colors.dark} style={styles.icon} />

      {/* Slot seleccionado */}
      <Text style={{ textAlign: "center", marginBottom: 12, color: Colors.dark }}>
        Estacionamiento seleccionado: <Text style={{ fontWeight: "700" }}>{slotId ?? "—"}</Text>
      </Text>

      {/* Resumen fijo: comienza ahora + duración 120 */}
      <View style={styles.summaryBox}>
        <Ionicons name="time-outline" size={20} color={Colors.gray} />
        <View style={{ flex: 1 }}>
          <Text style={styles.summaryLine}>Comienza: <Text style={{ fontWeight: "600" }}>ahora</Text></Text>
          <Text style={styles.summaryLine}>Duración: <Text style={{ fontWeight: "600" }}>{DURATION_MIN} min</Text></Text>
        </View>
      </View>

      {/* Patente */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Número de patente</Text>
        <TextInput
          style={styles.input}
          placeholder="RFDT69"
          placeholderTextColor={Colors.gray}
          autoCapitalize="characters"
          autoCorrect={false}
          value={patente}
          onChangeText={(t) => setPatente(t.toUpperCase())}
        />
      </View>

      {/* Botón Reservar */}
      <TouchableOpacity
        style={[styles.button, (!canSubmit ? styles.buttonDisabled : undefined)]}
        onPress={onReservar}
        disabled={!canSubmit}
      >
        {loading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.buttonText}>Reservar</Text>}
      </TouchableOpacity>

      {/* Hint departamento */}
      <Text style={{ marginTop: 10, textAlign: "center", color: Colors.gray }}>
        Departamento usado: {departamento} (cámbialo por el real tras el login)
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.lightGray, padding: 24 },
  title: { fontSize: Typography.h1, fontWeight: "bold", color: Colors.dark },
  icon: { alignSelf: "center", marginBottom: 16 },
  inputGroup: { marginBottom: 12 },
  label: { fontSize: Typography.h2, color: Colors.dark, marginBottom: 6 },
  input: {
    borderWidth: 2, borderColor: Colors.gray, backgroundColor: "#fff",
    borderRadius: 6, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: Typography.body, color: Colors.dark,
  },
  summaryBox: {
    borderWidth: 2, borderColor: Colors.gray, backgroundColor: "#fff",
    borderRadius: 6, paddingHorizontal: 12, paddingVertical: 12,
    flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12,
  },
  summaryLine: { fontSize: Typography.body, color: Colors.dark },
  button: {
    backgroundColor: Colors.primary, paddingVertical: 14, borderRadius: 6,
    alignItems: "center", marginTop: 16,
  },
  buttonDisabled: { backgroundColor: Colors.gray, opacity: 0.6 },
  buttonText: { color: Colors.white, fontSize: Typography.h2, fontWeight: "600" },
});
