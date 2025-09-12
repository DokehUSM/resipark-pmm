import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Colors, Typography } from "@/theme";
import ParkingSlot from "@/components/ParkingSlot";
import { fetchAvailability, AvailabilitySlot as ApiSlot } from "@/services/availability";

const numColumns = 3;

// 1) Tipos claros
type UISlot = {
  id: number;
  name: string;
  status: "disponible" | "reservado" | "ocupado";
};

type PlaceholderItem = {
  __placeholder: true;     // discriminante
  key: string;             // clave única para FlatList
};

// Unión que verá la FlatList
type ListItem = UISlot | PlaceholderItem;

// 2) Mapear backend → UI
function statusToUI(s: "libre" | "reservado" | "ocupado"): UISlot["status"] {
  return s === "libre" ? "disponible" : s;
}

export default function Availability() {
  const [slots, setSlots] = useState<ApiSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    const res = await fetchAvailability();
    if (res.ok) setSlots(res.data);
    else Alert.alert("Error", res.error);
    if (!opts?.silent) setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // 3) Adaptar datos para tu ParkingSlot
  const uiData: UISlot[] = useMemo(
    () =>
      slots.map((s) => ({
        id: s.id,
        name: s.label,                // p.ej. "E-3"
        status: statusToUI(s.status), // "disponible" | "reservado" | "ocupado"
      })),
    [slots]
  );

  // 4) Agregar placeholders tipados con discriminante
  const listData: ListItem[] = useMemo(() => {
    const fullRows = Math.floor(uiData.length / numColumns);
    const missing = uiData.length - fullRows * numColumns;
    if (missing === 0) return uiData;
    const placeholders: PlaceholderItem[] = Array.from({ length: numColumns - missing }, (_, i) => ({
      __placeholder: true,
      key: `ph-${i}`,
    }));
    return [...uiData, ...placeholders];
  }, [uiData]);

  // 5) Cálculos de cabecera
  const totalSlots = uiData.length;
  const availableSlots = uiData.filter((s) => s.status === "disponible").length;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load({ silent: true });
    setRefreshing(false);
  }, [load]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push("/with-header/onboarding")}>
          <Ionicons name="arrow-back-circle-outline" size={Typography.h1} color={Colors.gray} />
        </TouchableOpacity>
        <Text style={styles.title}>Disponibilidad ({availableSlots}/{totalSlots})</Text>
      </View>

      {/* Grid */}
      <View style={styles.gridWrapper}>
        <FlatList<ListItem>
          data={listData}
          numColumns={numColumns}
          keyExtractor={(item, index) =>
            "__placeholder" in item ? item.key ?? `placeholder-${index}` : String(item.id)
          }
          renderItem={({ item }) => {
            if ("__placeholder" in item) {
              // celda invisible para completar la fila
              return <View style={{ flex: 1, opacity: 0 }} />;
            }
            // item es UISlot aquí gracias al type guard
            return (
              <ParkingSlot
                name={item.name}
                status={item.status}
                // time: si luego expones reservado_hasta en el backend, pásalo aquí
                isPlaceholder={false}
              />
            );
          }}
          showsVerticalScrollIndicator
          persistentScrollbar
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          refreshing={loading && uiData.length === 0}
        />
      </View>

      {/* Botón Reservar */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.button} onPress={() => router.push("/with-header/booking")}>
          <Text style={styles.buttonText}>Reservar →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.lightGray },
  header: { flex: 1.5, flexDirection: "row", alignItems: "center" },
  title: { fontSize: Typography.h1, fontWeight: "bold", color: Colors.dark, marginLeft: 10 },
  gridWrapper: { flex: 7 },
  footer: { flex: 1.5, justifyContent: "center" },
  button: { backgroundColor: Colors.primary, paddingVertical: 14, borderRadius: 6, alignItems: "center" },
  buttonText: { color: Colors.white, fontSize: Typography.h2, fontWeight: "600" },
});
