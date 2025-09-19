import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Colors, Typography } from "@/theme";
import { listarReservas, cancelarReserva, Reserva } from "@/services/reservas";
import { useAuth } from "@/context/AuthContext";

type ActiveReserva = {
  id: number;
  placa: string;
  rut: string;
  horario: string;
};

const hasIntl = typeof Intl !== "undefined" && typeof Intl.DateTimeFormat === "function";

function pad(value: number) {
  return value.toString().padStart(2, "0");
}

function formatHorario(horaInicio: string, horaTermino: string) {
  const start = new Date(horaInicio);
  const end = new Date(horaTermino);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return `${horaInicio} - ${horaTermino}`;
  }

  if (!hasIntl) {
    const startText = `${pad(start.getHours())}:${pad(start.getMinutes())}`;
    const endText = `${pad(end.getHours())}:${pad(end.getMinutes())}`;
    return `${startText} - ${endText}`;
  }

  const formatter = new Intl.DateTimeFormat("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${formatter.format(start)} - ${formatter.format(end)}`;
}

function toActiveReservas(reservas: Reserva[]): ActiveReserva[] {
  return reservas
    .filter((item) => item.estado_reserva?.toLowerCase() === "activa")
    .map((item) => ({
      id: item.id,
      placa: item.placa_patente_visitante,
      rut: item.rut_visitante,
      horario: formatHorario(item.hora_inicio, item.hora_termino),
    }));
}

export default function CancelBookings() {
  const { token } = useAuth();
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const load = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!options?.silent) {
        setLoading(true);
      }

      const result = await listarReservas(token);
      if (result.ok) {
        setReservas(result.data);
      } else {
        Alert.alert("No pudimos obtener las reservas", result.error);
      }

      if (!options?.silent) {
        setLoading(false);
      }

      return result.ok;
    },
    [token]
  );

  useEffect(() => {
    load();
  }, [load]);

  const activeReservas = useMemo(() => toActiveReservas(reservas), [reservas]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await load({ silent: true });
    setRefreshing(false);
  }, [load]);

  const executeCancel = useCallback(
    async (id: number) => {
      setCancellingId(id);
      const result = await cancelarReserva(id, token);
      if (!result.ok) {
        Alert.alert("No pudimos cancelar", result.error);
      } else {
        await load({ silent: true });
      }
      setCancellingId(null);
    },
    [load, token]
  );

  const confirmCancel = useCallback(
    (reserva: ActiveReserva) => {
      Alert.alert(
        "Anular reserva",
        `Vas a anular la reserva de la patente ${reserva.placa}. Confirmas?`,
        [
          { text: "No", style: "cancel" },
          {
            text: "Si, anular",
            style: "destructive",
            onPress: () => executeCancel(reserva.id),
          },
        ]
      );
    },
    [executeCancel]
  );

  const showLoadingState = loading && activeReservas.length === 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      <Text style={styles.sectionTitle}>
        Reservas activas ({activeReservas.length})
      </Text>

      {showLoadingState && (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      )}

      {!showLoadingState && activeReservas.length === 0 && (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>No tienes reservas activas por ahora.</Text>
        </View>
      )}

      {activeReservas.map((reserva) => {
        const isCancelling = cancellingId === reserva.id;
        return (
          <View key={reserva.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.plate}>{reserva.placa}</Text>
                <Text style={styles.rut}>{reserva.rut}</Text>
              </View>
              <Text style={styles.schedule}>{reserva.horario}</Text>
            </View>

            <TouchableOpacity
              style={[styles.cancelButton, isCancelling && styles.cancelButtonDisabled]}
              activeOpacity={0.85}
              onPress={() => confirmCancel(reserva)}
              disabled={isCancelling}
            >
              {isCancelling ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.cancelText}>Anular reserva</Text>
              )}
            </TouchableOpacity>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.lightGray,
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    gap: 16,
  },
  sectionTitle: {
    fontSize: Typography.h2,
    fontWeight: "700",
    color: Colors.dark,
  },
  loadingBox: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyBox: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingVertical: 32,
    alignItems: "center",
    paddingHorizontal: 16,
  },
  emptyText: {
    fontSize: Typography.body,
    color: Colors.gray,
    textAlign: "center",
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  plate: {
    fontSize: Typography.body,
    fontWeight: "700",
    color: Colors.dark,
  },
  rut: {
    fontSize: Typography.small,
    color: Colors.gray,
    marginTop: 4,
  },
  schedule: {
    fontSize: Typography.body,
    color: Colors.dark,
  },
  cancelButton: {
    backgroundColor: Colors.danger,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  cancelButtonDisabled: {
    opacity: 0.7,
  },
  cancelText: {
    color: Colors.white,
    fontSize: Typography.h2,
    fontWeight: "700",
  },
});
