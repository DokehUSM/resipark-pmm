import React, { useMemo, useState } from "react";
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Colors, Typography } from "@/theme";
import { crearReserva } from "@/services/reservas";
import { crearVisitante } from "@/services/visitantes"; // 👈 nuevo
import { useAuth } from "@/context/AuthContext";

const DURATION_MIN = 120; // fijo e inmutable

// --- Helpers RUT ---
function normalizeRut(raw: string) {
  return raw.replace(/\./g, "").replace(/-/g, "").toUpperCase();
}
function rutDv(num: string): string {
  // num: solo dígitos sin DV
  let suma = 0, mul = 2;
  for (let i = num.length - 1; i >= 0; i--) {
    suma += mul * parseInt(num[i], 10);
    mul = mul === 7 ? 2 : mul + 1;
  }
  const res = 11 - (suma % 11);
  if (res === 11) return "0";
  if (res === 10) return "K";
  return String(res);
}
function isValidRut(rutRaw: string): boolean {
  const clean = normalizeRut(rutRaw);
  const m = clean.match(/^(\d{6,8})([0-9K])$/); // 6-8 dígitos + DV
  if (!m) return false;
  const [, cuerpo, dv] = m;
  return rutDv(cuerpo) === dv;
}

export default function Booking() {
  const { departamento } = useAuth();
  const params = useLocalSearchParams<{ slotId?: string }>();
  const slotId = useMemo(() => {
    const n = Number(params.slotId);
    return Number.isFinite(n) ? n : null;
  }, [params.slotId]);

  const [patente, setPatente] = useState("");
  const [rut, setRut] = useState("");
  const [visitanteOk, setVisitanteOk] = useState(false);
  const [loading, setLoading] = useState(false);
  const [savingVisitante, setSavingVisitante] = useState(false);

  const canRegisterVisitor =
    patente.trim().length > 0 &&
    isValidRut(rut.trim()) &&
    !savingVisitante;

  const canSubmit =
    !!slotId &&
    typeof departamento === "number" &&
    Number.isFinite(departamento) &&
    patente.trim().length > 0 &&
    isValidRut(rut.trim()) && // 👈 exige RUT válido
    !loading;

  async function onRegistrarVisitante() {
    if (!canRegisterVisitor) return;
    setSavingVisitante(true);
    const resp = await crearVisitante({
      placa_patente: patente.trim().toUpperCase(),
      rut: normalizeRut(rut.trim()),
    });
    setSavingVisitante(false);
    if (!resp.ok) {
      Alert.alert("No se pudo registrar", resp.error);
      setVisitanteOk(false);
      return;
    }
    setVisitanteOk(true);
    Alert.alert("Listo", "Visitante registrado correctamente.");
  }

  async function onReservar() {
    if (!canSubmit || slotId == null || typeof departamento !== "number") return;

    // Hora de inicio = AHORA
    const now = new Date();
    const startISO = now.toISOString();
    const endISO = new Date(now.getTime() + DURATION_MIN * 60_000).toISOString();

    setLoading(true);

    // (Opcional) garantiza existencia del visitante antes de reservar
    if (!visitanteOk) {
      const pre = await crearVisitante({
        placa_patente: patente.trim().toUpperCase(),
        rut: normalizeRut(rut.trim()),
      });
      if (!pre.ok) {
        setLoading(false);
        Alert.alert("No se pudo registrar", pre.error);
        return;
      }
      setVisitanteOk(true);
    }

    const resp = await crearReserva({
      hora_inicio: startISO,
      hora_termino: endISO,
      placa_patente_visitante: patente.trim().toUpperCase(),
      numero_estacionamiento: slotId,
      numero_departamento: departamento,
    });
    setLoading(false);

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
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <TouchableOpacity onPress={() => router.push("/with-header/availability")}>
          <Ionicons name="arrow-back-circle-outline" size={Typography.h1} color={Colors.gray} />
        </TouchableOpacity>
        <Text style={styles.title}>Reserva</Text>
      </View>

      <Ionicons name="car-outline" size={120} color={Colors.dark} style={styles.icon} />

      <Text style={{ textAlign: "center", marginBottom: 12, color: Colors.dark }}>
        Estacionamiento seleccionado: <Text style={{ fontWeight: "700" }}>{slotId ?? "—"}</Text>
      </Text>

      {/* Resumen fijo */}
      <View style={styles.summaryBox}>
        <Ionicons name="time-outline" size={20} color={Colors.gray} />
        <View style={{ flex: 1 }}>
          <Text style={styles.summaryLine}>Comienza: <Text style={{ fontWeight: "600" }}>ahora</Text></Text>
          <Text style={styles.summaryLine}>Duración: <Text style={{ fontWeight: "600" }}>120 min</Text></Text>
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
          onChangeText={(t) => { setPatente(t.toUpperCase()); setVisitanteOk(false); }}
        />
      </View>

      {/* RUT */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>RUT visitante</Text>
        <TextInput
          style={[styles.input, !rut || isValidRut(rut) ? null : { borderColor: Colors.danger }]}
          placeholder="12.345.678-5"
          placeholderTextColor={Colors.gray}
          autoCapitalize="characters"
          autoCorrect={false}
          value={rut}
          onChangeText={(t) => { setRut(t); setVisitanteOk(false); }}
        />
        {!isValidRut(rut) && !!rut && (
          <Text style={{ color: Colors.danger, marginTop: 6 }}>RUT inválido</Text>
        )}
      </View>

      {/* Botón Registrar visitante */}
      <TouchableOpacity
        style={[styles.secondaryBtn, (!canRegisterVisitor ? styles.buttonDisabled : undefined)]}
        onPress={onRegistrarVisitante}
        disabled={!canRegisterVisitor}
      >
        {savingVisitante ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <Text style={styles.buttonText}>Registrar visitante</Text>
        )}
      </TouchableOpacity>

      {/* Botón Reservar */}
      <TouchableOpacity
        style={[styles.button, (!canSubmit ? styles.buttonDisabled : undefined)]}
        onPress={onReservar}
        disabled={!canSubmit}
      >
        {loading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.buttonText}>Reservar</Text>}
      </TouchableOpacity>

      {!(typeof departamento === "number") && (
        <Text style={{ marginTop: 10, textAlign: "center", color: Colors.danger }}>
          Inicia sesión para asociar tu número de departamento.
        </Text>
      )}

      {visitanteOk && (
        <Text style={{ marginTop: 10, textAlign: "center", color: Colors.success ?? "#16A34A" }}>
          Visitante registrado ✔
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.lightGray,
    padding: 24
  },
  title: {
    fontSize: Typography.h1,
    fontWeight: "bold",
    color: Colors.dark
  },
  icon: {
    alignSelf: "center",
    marginBottom: 16
  },
  inputGroup: {
    marginBottom: 12
  },
  label: {
    fontSize: Typography.h2,
    color: Colors.dark,
    marginBottom: 6
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
  summaryBox: {
    borderWidth: 2,
    borderColor: Colors.gray,
    backgroundColor: "#fff",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  summaryLine: {
    fontSize: Typography.body,
    color: Colors.dark
  },
  secondaryBtn: {
    backgroundColor: Colors.dark,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 4,
    marginBottom: 8,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 4,
  },
  buttonDisabled: {
    backgroundColor: Colors.gray,
    opacity: 0.6
  },
  buttonText: {
    color: Colors.white,
    fontSize: Typography.h2,
    fontWeight: "600"
  },
});
