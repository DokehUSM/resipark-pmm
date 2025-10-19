import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  RefreshControl,
} from "react-native";
import { router, Href } from "expo-router";
import { Colors, Typography } from "@/theme";
import Svg, { Path, Text as SvgText, Circle } from "react-native-svg";
import { fetchAvailabilityTotals } from "@/services/availability";
import { listarReservas, Reserva } from "@/services/reservas";
import { useAuth } from "@/context/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

function goTo(path: Href) {
  return () => router.push(path);
}

type StatusKey = "libre" | "reservado" | "ocupado";
type AvailabilitySlice = { label: string; value: number; color: string };

type PieSegment = {
  path?: string;
  color: string;
  percent: number;
  labelX: number;
  labelY: number;
  isFullCircle?: boolean;
};

type ActiveReserva = {
  id: number;
  placa: string;
  rut: string;
  horario: string;
};

const INITIAL_COUNTS: Record<StatusKey, number> = {
  libre: 0,
  reservado: 0,
  ocupado: 0,
};

const STATUS_LABELS: Record<StatusKey, string> = {
  libre: "disponibles",
  reservado: "reservados",
  ocupado: "ocupados",
};

const STATUS_COLORS: Record<StatusKey, string> = {
  libre: Colors.success,
  reservado: Colors.warning,
  ocupado: Colors.danger,
};

const AVAILABILITY_CACHE_KEY = "home:availability";
const RESERVAS_CACHE_KEY = "home:reservas";

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

function createPiePaths(
  data: AvailabilitySlice[],
  radius: number,
  startAngleOffset = -Math.PI / 2
): PieSegment[] {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total <= 0) return [];

  let startAngle = startAngleOffset;
  const segments: PieSegment[] = [];

  data.forEach((slice) => {
    const angle = (slice.value / total) * Math.PI * 2;
    const endAngle = startAngle + angle;

    if (slice.value > 0) {
      const percent = Math.round((slice.value / total) * 100);
      const isFullCircle = angle >= Math.PI * 2 - 1e-6;

      if (isFullCircle) {
        segments.push({
          color: slice.color,
          percent,
          labelX: radius,
          labelY: radius,
          isFullCircle: true,
        });
      } else {
        const x1 = radius + radius * Math.cos(startAngle);
        const y1 = radius + radius * Math.sin(startAngle);
        const x2 = radius + radius * Math.cos(endAngle);
        const y2 = radius + radius * Math.sin(endAngle);

        const largeArcFlag = angle > Math.PI ? 1 : 0;

        const pathData = [
          `M${radius},${radius}`,
          `L${x1},${y1}`,
          `A${radius},${radius} 0 ${largeArcFlag} 1 ${x2},${y2}`,
          "Z",
        ].join(" ");

        const midAngle = (startAngle + endAngle) / 2;
        const labelRadius = radius * 0.6;
        const labelX = radius + labelRadius * Math.cos(midAngle);
        const labelY = radius + labelRadius * Math.sin(midAngle);

        segments.push({ path: pathData, color: slice.color, percent, labelX, labelY });
      }
    }

    startAngle = endAngle;
  });

  return segments;
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

export default function Home() {
  const size = 120;
  const radius = size / 2;
  const { token } = useAuth();
  const isMountedRef = useRef(true);

  const [availabilityCounts, setAvailabilityCounts] = useState<Record<StatusKey, number>>(INITIAL_COUNTS);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [reservasLoading, setReservasLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [[, availabilityRaw], [, reservasRaw]] = await AsyncStorage.multiGet([
          AVAILABILITY_CACHE_KEY,
          RESERVAS_CACHE_KEY,
        ]);

        if (cancelled) return;

        if (availabilityRaw) {
          try {
            const parsed = JSON.parse(availabilityRaw) as Partial<Record<StatusKey, unknown>>;
            const nextCounts: Record<StatusKey, number> = { ...INITIAL_COUNTS };
            (Object.keys(nextCounts) as StatusKey[]).forEach((key) => {
              const maybeNumber = parsed?.[key];
              if (typeof maybeNumber === "number" && Number.isFinite(maybeNumber)) {
                nextCounts[key] = maybeNumber;
              }
            });
            setAvailabilityCounts(nextCounts);
          } catch (error) {
            console.error("No se pudo parsear cache de disponibilidad", error);
          }
        }

        if (reservasRaw) {
          try {
            const parsed = JSON.parse(reservasRaw);
            if (Array.isArray(parsed)) {
              setReservas(parsed as Reserva[]);
            }
          } catch (error) {
            console.error("No se pudo parsear cache de reservas", error);
          }
        }
      } catch (error) {
        console.error("Error cargando cache de Home", error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const loadAvailability = useCallback(async (options: { silent?: boolean } = {}) => {
    const { silent = false } = options;

    if (!token) {
      if (isMountedRef.current) {
        setAvailabilityCounts({ ...INITIAL_COUNTS });
      }
      try {
        await AsyncStorage.removeItem(AVAILABILITY_CACHE_KEY);
      } catch (error) {
        console.error("No se pudo limpiar cache de disponibilidad", error);
      }
      return;
    }

    if (isMountedRef.current) {
      setAvailabilityLoading(true);
    }

    try {
      const res = await fetchAvailabilityTotals(token);
      if (res.ok) {
        const counts: Record<StatusKey, number> = { ...INITIAL_COUNTS };
        counts.libre = Math.max(res.data.disponibles, 0);
        counts.reservado = Math.max(res.data.reservados, 0);
        counts.ocupado = Math.max(res.data.ocupados, 0);

        if (isMountedRef.current) {
          setAvailabilityCounts(counts);
        }

        try {
          await AsyncStorage.setItem(AVAILABILITY_CACHE_KEY, JSON.stringify(counts));
        } catch (error) {
          console.error("No se pudo guardar cache de disponibilidad", error);
        }
      } else if (!silent && isMountedRef.current) {
        Alert.alert("No pudimos obtener la disponibilidad", res.error);
      }
    } finally {
      if (isMountedRef.current) {
        setAvailabilityLoading(false);
      }
    }
  }, [token]);

  const loadReservas = useCallback(async (options: { silent?: boolean } = {}) => {
    const { silent = false } = options;

    if (!token) {
      if (isMountedRef.current) {
        setReservas([]);
      }
      try {
        await AsyncStorage.removeItem(RESERVAS_CACHE_KEY);
      } catch (error) {
        console.error("No se pudo limpiar cache de reservas", error);
      }
      return;
    }

    if (isMountedRef.current) {
      setReservasLoading(true);
    }

    try {
      const res = await listarReservas(token);
      if (res.ok) {
        if (isMountedRef.current) {
          setReservas(res.data);
        }
        try {
          await AsyncStorage.setItem(RESERVAS_CACHE_KEY, JSON.stringify(res.data));
        } catch (error) {
          console.error("No se pudo guardar cache de reservas", error);
        }
      } else if (!silent && isMountedRef.current) {
        Alert.alert("No pudimos obtener tus reservas", res.error);
      }
    } finally {
      if (isMountedRef.current) {
        setReservasLoading(false);
      }
    }
  }, [token]);

  useEffect(() => {
    loadAvailability().catch((error) =>
      console.error("Carga inicial de disponibilidad fallo", error)
    );
  }, [loadAvailability]);

  useEffect(() => {
    loadReservas().catch((error) =>
      console.error("Carga inicial de reservas fallo", error)
    );
  }, [loadReservas]);

  useEffect(() => {
    if (!token) return;
    const interval = setInterval(() => {
      loadAvailability({ silent: true }).catch((error) =>
        console.error("Auto refresh disponibilidad fallo", error)
      );
      loadReservas({ silent: true }).catch((error) =>
        console.error("Auto refresh reservas fallo", error)
      );
    }, 60_000);
    return () => clearInterval(interval);
  }, [token, loadAvailability, loadReservas]);

  const handleRefresh = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await Promise.all([loadAvailability(), loadReservas()]);
    } finally {
      if (isMountedRef.current) {
        setRefreshing(false);
      }
    }
  }, [refreshing, loadAvailability, loadReservas]);

  const availabilityData = useMemo<AvailabilitySlice[]>(
    () => [
      {
        label: STATUS_LABELS.libre,
        value: availabilityCounts.libre,
        color: STATUS_COLORS.libre,
      },
      {
        label: STATUS_LABELS.reservado,
        value: availabilityCounts.reservado,
        color: STATUS_COLORS.reservado,
      },
      {
        label: STATUS_LABELS.ocupado,
        value: availabilityCounts.ocupado,
        color: STATUS_COLORS.ocupado,
      },
    ],
    [availabilityCounts]
  );

  const totalSlots = useMemo(
    () => availabilityData.reduce((sum, slice) => sum + slice.value, 0),
    [availabilityData]
  );

  const paths = useMemo(
    () => (totalSlots > 0 ? createPiePaths(availabilityData, radius) : []),
    [availabilityData, radius, totalSlots]
  );

  const activeReservas = useMemo(() => toActiveReservas(reservas), [reservas]);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            void handleRefresh();
          }}
          colors={[Colors.primary]}
          tintColor={Colors.primary}
        />
      }
    >
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Reserva de estacionamientos</Text>

        <View style={styles.cardBody}>
          <View>
            {availabilityData.map((item, index) => (
              <View
                key={item.label}
                style={[styles.statusRow, index > 0 && styles.statusRowSpacing]}
              >
                <View style={[styles.statusBadge, { borderColor: item.color }]}>
                  <Text style={[styles.statusValue, { color: item.color }]}>{item.value}</Text>
                </View>
                <Text style={styles.statusLabel}>{item.label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.chartWrapper}>
            {totalSlots === 0 ? (
              availabilityLoading ? (
                <ActivityIndicator color={Colors.gray} />
              ) : (
                <Text style={styles.chartEmptyText}>Sin datos</Text>
              )
            ) : (
              <>
                <Svg width={size} height={size}>
                  {paths.map((slice, i) => (
                    <React.Fragment key={`slice-${i}`}>
                      {slice.isFullCircle ? (
                        <Circle cx={radius} cy={radius} r={radius} fill={slice.color} />
                      ) : (
                        slice.path && <Path d={slice.path} fill={slice.color} />
                      )}
                      <SvgText
                        x={slice.labelX}
                        y={slice.labelY}
                        fill="#fff"
                        fontSize="12"
                        fontWeight="bold"
                        textAnchor="middle"
                        alignmentBaseline="middle"
                      >
                        {slice.percent}%
                      </SvgText>
                    </React.Fragment>
                  ))}
                </Svg>
                {availabilityLoading && (
                  <View style={styles.chartOverlay} pointerEvents="none">
                    <ActivityIndicator color={Colors.white} />
                  </View>
                )}
              </>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.actionButton, styles.reserveButton]}
          onPress={goTo("/with-header/booking")}
        >
          <Text style={styles.actionButtonText}>Reservar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Mis reservas</Text>

        <View style={styles.reservationsBox}>
          {reservasLoading && activeReservas.length === 0 ? (
            <View style={styles.reservationsPlaceholder}>
              <ActivityIndicator color={Colors.gray} />
            </View>
          ) : activeReservas.length === 0 ? (
            <View style={styles.reservationsPlaceholder}>
              <Text style={styles.reservationsEmpty}>No tienes reservas activas.</Text>
              <Text style={styles.reservationsHelper}>
                Crea una nueva reserva o refresca más tarde para ver actualizaciones.
              </Text>
            </View>
          ) : (
            activeReservas.map((item, index) => (
              <View key={item.id} style={[styles.reservationRow, index > 0 && styles.separator]}>
                <View style={styles.reservationLeft}>
                  <Text style={styles.reservationPlate}>{item.placa}</Text>
                  <Text style={styles.reservationRut}>{item.rut}</Text>
                </View>
                <Text style={styles.reservationTime}>{item.horario}</Text>
              </View>
            ))
          )}
        </View>

        <TouchableOpacity
          style={[styles.actionButton, styles.cancelButton]}
          onPress={goTo("/with-header/cancelBookings")}
          accessibilityRole="button"
          accessibilityLabel="Ir a anular reservas"
        >
          <Text style={styles.actionButtonText}>Ver reservas activas</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
    paddingBottom: 40,
    backgroundColor: Colors.lightGray,
    justifyContent: "center",
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "#dfe4ea",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 2,
  },
  cardTitle: {
    fontSize: Typography.h2,
    fontWeight: "700",
    color: Colors.dark,
    marginBottom: 16,
  },
  cardBody: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  chartWrapper: {
    width: "50%",
    height: 160,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  chartOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
    borderRadius: 8,
  },
  chartEmptyText: {
    fontSize: Typography.body,
    color: Colors.gray,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusRowSpacing: {
    marginTop: 12,
  },
  statusBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    backgroundColor: Colors.white,
  },
  statusValue: {
    fontSize: Typography.h2,
    fontWeight: "700",
  },
  statusLabel: {
    fontSize: Typography.body,
    color: Colors.gray,
  },
  actionButton: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  reserveButton: {
    backgroundColor: Colors.accent,
  },
  cancelButton: {
    backgroundColor: Colors.danger,
  },
  actionButtonText: {
    color: Colors.white,
    fontSize: Typography.h2,
    fontWeight: "700",
  },
  reservationsBox: {
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 8,
    marginBottom: 16,
    overflow: "hidden",
  },
  reservationsPlaceholder: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  reservationsEmpty: {
    fontSize: Typography.body,
    color: Colors.dark,
    fontWeight: "600",
    textAlign: "center",
  },
  reservationsHelper: {
    fontSize: Typography.small,
    color: Colors.gray,
    textAlign: "center",
  },
  reservationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  separator: {
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
  },
  reservationLeft: {
    flexShrink: 1,
  },
  reservationPlate: {
    fontSize: Typography.body,
    fontWeight: "700",
    color: Colors.dark,
  },
  reservationRut: {
    fontSize: Typography.small,
    color: Colors.gray,
    marginTop: 2,
  },
  reservationTime: {
    fontSize: Typography.body,
    color: Colors.dark,
    marginLeft: 16,
    textAlign: "right",
  },
});
