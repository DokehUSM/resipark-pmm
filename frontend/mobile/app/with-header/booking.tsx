import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Colors, Typography } from "@/theme";
import { crearReserva } from "@/services/reservas";
import { useAuth } from "@/context/AuthContext";

const RESERVATION_DURATION_HOURS = 5;
const MS_PER_HOUR = 60 * 60 * 1000;
const hasIntl = typeof Intl !== "undefined" && typeof Intl.DateTimeFormat === "function";

const PLATE_MIN_LENGTH = 5;
const PLATE_MAX_LENGTH = 8;
const DOCUMENT_MIN_LENGTH = 5;
const DOCUMENT_MAX_LENGTH = 15;

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

function sanitizePlateInput(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, PLATE_MAX_LENGTH);
}

function validatePlateValue(value: string): string | null {
  const sanitized = value.trim().toUpperCase();
  if (sanitized.length === 0) {
    return "Ingresa la patente del vehiculo";
  }
  if (sanitized.length < PLATE_MIN_LENGTH || sanitized.length > PLATE_MAX_LENGTH) {
    return `La patente debe tener entre ${PLATE_MIN_LENGTH} y ${PLATE_MAX_LENGTH} caracteres`;
  }
  if (!/^[A-Z0-9]+$/.test(sanitized)) {
    return "La patente solo puede incluir letras y numeros";
  }
  return null;
}

function sanitizeDocumentInput(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9.\-]/g, "").slice(0, DOCUMENT_MAX_LENGTH + 4);
}

function stripDocumentFormatting(value: string) {
  return value.replace(/[.\-]/g, "");
}

function looksLikeRut(cleaned: string) {
  if (cleaned.length < 8 || cleaned.length > 9) return false;
  return /^\d+[0-9K]$/.test(cleaned);
}

function computeRutDV(body: string) {
  let sum = 0;
  let multiplier = 2;

  for (let i = body.length - 1; i >= 0; i -= 1) {
    sum += Number(body[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const remainder = 11 - (sum % 11);
  if (remainder === 11) return "0";
  if (remainder === 10) return "K";
  return String(remainder);
}

function validateDocumentValue(value: string) {
  const sanitized = sanitizeDocumentInput(value);
  const cleaned = stripDocumentFormatting(sanitized);

  if (cleaned.length === 0) {
    return { sanitized, cleaned, error: "Ingresa el documento de identidad" };
  }

  if (cleaned.length < DOCUMENT_MIN_LENGTH || cleaned.length > DOCUMENT_MAX_LENGTH) {
    return {
      sanitized,
      cleaned,
      error: `El documento debe tener entre ${DOCUMENT_MIN_LENGTH} y ${DOCUMENT_MAX_LENGTH} caracteres`,
    };
  }

  if (!/^[A-Z0-9]+$/.test(cleaned)) {
    return {
      sanitized,
      cleaned,
      error: "El documento solo puede incluir letras y numeros",
    };
  }

  if (looksLikeRut(cleaned)) {
    const body = cleaned.slice(0, -1);
    const dv = cleaned.slice(-1);
    if (!/^\d+$/.test(body) || computeRutDV(body) !== dv) {
      return { sanitized, cleaned, error: "El RUT ingresado no es valido" };
    }
  }

  return { sanitized, cleaned, error: null };
}

export default function Booking() {
  const { token } = useAuth();
  const params = useLocalSearchParams<{ slotId?: string }>();
  const selectedSlot = params?.slotId;

  const [plate, setPlate] = useState("");
  const [document, setDocument] = useState("");
  const [plateTouched, setPlateTouched] = useState(false);
  const [documentTouched, setDocumentTouched] = useState(false);
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

  const plateValidation = useMemo(() => validatePlateValue(plate), [plate]);
  const documentValidation = useMemo(() => validateDocumentValue(document), [document]);
  const plateError = plateTouched ? plateValidation : null;
  const documentError = documentTouched ? documentValidation.error : null;
  const canSubmit = !sending && !plateValidation && !documentValidation.error;

  const handlePlateChange = (value: string) => {
    setPlateTouched(true);
    setPlate(sanitizePlateInput(value));
  };

  const handleDocumentChange = (value: string) => {
    setDocumentTouched(true);
    setDocument(sanitizeDocumentInput(value));
  };

  const handleSubmit = async () => {
    setPlateTouched(true);
    setDocumentTouched(true);

    const latestPlateValidation = validatePlateValue(plate);
    const latestDocumentValidation = validateDocumentValue(document);

    if (latestPlateValidation || latestDocumentValidation.error || sending) {
      return;
    }

    const cleanedPlate = sanitizePlateInput(plate);
    const cleanedDocument = latestDocumentValidation.cleaned;

    setSending(true);

    const now = new Date();
    const endsAt = new Date(now.getTime() + RESERVATION_DURATION_HOURS * MS_PER_HOUR);

    try {
      const result = await crearReserva(
        {
          hora_inicio: now.toISOString(),
          hora_termino: endsAt.toISOString(),
          rut_visitante: cleanedDocument,
          placa_patente_visitante: cleanedPlate,
        },
        token
      );

      if (!result.ok) {
        Alert.alert("No pudimos crear la reserva", result.error);
        return;
      }

      setPreviewBase(new Date());
      setPlate("");
      setDocument("");
      setPlateTouched(false);
      setDocumentTouched(false);

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
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.select({ ios: "padding", android: "height" })}
      keyboardVerticalOffset={Platform.select({ ios: 0, android: 24 })}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
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
              placeholder="ABC123"
              placeholderTextColor={Colors.gray}
              autoCapitalize="characters"
              value={plate}
              onChangeText={handlePlateChange}
              returnKeyType="next"
            />
            {plateError ? <Text style={styles.errorText}>{plateError}</Text> : null}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Documento de identidad</Text>
            <TextInput
              style={styles.input}
              placeholder="12.345.678-9"
              placeholderTextColor={Colors.gray}
              autoCapitalize="characters"
              value={document}
              onChangeText={handleDocumentChange}
              returnKeyType="done"
            />
            {documentError ? <Text style={styles.errorText}>{documentError}</Text> : null}
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.lightGray,
  },
  container: {
    flexGrow: 1,
    padding: 24,
    paddingBottom: 36,
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
  errorText: {
    marginTop: 6,
    fontSize: Typography.small,
    color: Colors.danger,
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
