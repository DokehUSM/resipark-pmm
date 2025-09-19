import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, router } from "expo-router";
import { Colors, Typography } from "@/theme";
import { crearReserva } from "@/services/reservas";
import { useAuth } from "@/context/AuthContext";

const RESERVATION_DURATION_HOURS = 5;
const MS_PER_HOUR = 60 * 60 * 1000;
const hasIntl = typeof Intl !== "undefined" && typeof Intl.DateTimeFormat === "function";

function pad(value: number) {
  return value.toString().padStart(2, "0");
}

function formatTime(date: Date) {
  if (!hasIntl) {
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    return `${hours}:${minutes}`;
  }
  return new Intl.DateTimeFormat("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function Booking() {
  const { token } = useAuth();
  const params = useLocalSearchParams<{ slotId?: string }>();
  const selectedSlot = params?.slotId;

  const [plate, setPlate] = useState("");
  const [rut, setRut] = useState("");
  const [sending, setSending] = useState(false);
  const [previewBase, setPreviewBase] = useState(() => new Date());

  const previewEnd = useMemo(
    () => new Date(previewBase.getTime() + RESERVATION_DURATION_HOURS * MS_PER_HOUR),
    [previewBase]
  );

  const previewRangeLabel = useMemo(
    () => `${formatTime(previewBase)} - ${formatTime(previewEnd)}`,
    [previewBase, previewEnd]
  );

  const canSubmit = plate.trim().length > 0 && rut.trim().length > 0 && !sending;

  const handleSubmit = async () => {
    const cleanedPlate = plate.trim().toUpperCase();
    const cleanedRut = rut.trim();

    if (!cleanedPlate || !cleanedRut || sending) return;

    setSending(true);

    const now = new Date();
    const endsAt = new Date(now.getTime() + RESERVATION_DURATION_HOURS * MS_PER_HOUR);

    const result = await crearReserva(
      {
        hora_inicio: now.toISOString(),
        hora_termino: endsAt.toISOString(),
        rut_visitante: cleanedRut,
        placa_patente_visitante: cleanedPlate,
      },
      token
    );

    setSending(false);

    if (!result.ok) {
      Alert.alert("No pudimos crear la reserva", result.error);
      return;
    }

    setPreviewBase(new Date());
    setPlate("");
    setRut("");

    const confirmationRange = `${formatTime(now)} - ${formatTime(endsAt)}`;

    Alert.alert(
      "Reserva creada",
      `Tu reserva estara activa ${confirmationRange}.`,
      [
        {
          text: "Ver reservas",
          onPress: () => router.replace("/with-header/cancelBookings"),
        },
        { text: "Aceptar" },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Crear reserva (5 horas)</Text>
        </View>

        {selectedSlot && (
          <View style={styles.slotBox}>
            <Text style={styles.slotTitle}>Estacionamiento seleccionado</Text>
            <Text style={styles.slotValue}>#{selectedSlot}</Text>
          </View>
        )}

        <View style={styles.noticeBox}>
          <Text style={styles.noticeText}>
            Las reservas comienzan al confirmar y finalizan {RESERVATION_DURATION_HOURS} horas despues ({previewRangeLabel}).
          </Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Numero de patente</Text>
          <TextInput
            style={styles.input}
            placeholder="RFDT69"
            placeholderTextColor={Colors.gray}
            autoCapitalize="characters"
            value={plate}
            onChangeText={setPlate}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Cedula de identidad</Text>
          <TextInput
            style={styles.input}
            placeholder="12.345.678-9"
            placeholderTextColor={Colors.gray}
            autoCapitalize="characters"
            value={rut}
            onChangeText={setRut}
          />
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, !canSubmit && styles.primaryButtonDisabled]}
          activeOpacity={0.85}
          onPress={handleSubmit}
          disabled={!canSubmit}
        >
          {sending ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.primaryButtonText}>Reservar</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: Colors.lightGray,
    justifyContent: "center",
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: Typography.h2,
    fontWeight: "700",
    color: Colors.dark,
  },
  helpIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.lightGray,
  },
  slotBox: {
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  slotTitle: {
    fontSize: Typography.small,
    color: Colors.gray,
    marginBottom: 4,
  },
  slotValue: {
    fontSize: Typography.h2,
    fontWeight: "700",
    color: Colors.dark,
  },
  noticeBox: {
    backgroundColor: Colors.lightGray,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  noticeText: {
    fontSize: Typography.small,
    color: Colors.dark,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: Typography.body,
    color: Colors.dark,
    marginBottom: 8,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: Typography.body,
    color: Colors.dark,
    backgroundColor: Colors.white,
  },
  primaryButton: {
    marginTop: 12,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: Colors.accent,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: Typography.h2,
    fontWeight: "700",
  },
});
