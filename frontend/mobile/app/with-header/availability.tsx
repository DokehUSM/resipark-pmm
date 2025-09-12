import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Colors, Typography } from "@/theme";
import ParkingSlot from "@/components/ParkingSlot";
import { fetchAvailability, AvailabilitySlot as ApiSlot } from "@/services/availability";

const numColumns = 3;

type UISlot = {
  id: number;
  name: string;
  status: "disponible" | "reservado" | "ocupado";
};

type PlaceholderItem = { __placeholder: true; key: string };
type ListItem = UISlot | PlaceholderItem;

function statusToUI(s: "libre" | "reservado" | "ocupado"): UISlot["status"] {
  return s === "libre" ? "disponible" : s;
}

export default function Availability() {
  const [slots, setSlots] = useState<ApiSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // slot seleccionado (id o null)
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    const res = await fetchAvailability();
    if (res.ok) setSlots(res.data);
    else Alert.alert("Error", res.error);
    if (!opts?.silent) setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const uiData: UISlot[] = useMemo(
    () =>
      slots.map((s) => ({
        id: s.id,
        name: s.label,
        status: statusToUI(s.status),
      })),
    [slots]
  );

  // si el seleccionado dejó de estar disponible, limpiar selección
  useEffect(() => {
    if (selectedId == null) return;
    const stillAvailable = uiData.some(
      (s) => s.id === selectedId && s.status === "disponible"
    );
    if (!stillAvailable) setSelectedId(null);
  }, [uiData, selectedId]);

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

  const totalSlots = uiData.length;
  const availableSlots = uiData.filter((s) => s.status === "disponible").length;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load({ silent: true });
    setRefreshing(false);
  }, [load]);

  const canReserve = selectedId != null;

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
              return <ParkingSlot isPlaceholder />;
            }
            const isSelected = item.id === selectedId;
            const isAvailable = item.status === "disponible";
            return (
              <ParkingSlot
                name={item.name}
                status={item.status}
                selected={isSelected}
                onPress={() => {
                  if (!isAvailable) return;
                  setSelectedId((prev) => (prev === item.id ? null : item.id));
                }}
              />
            );
          }}
          showsVerticalScrollIndicator
          persistentScrollbar
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          refreshing={loading && uiData.length === 0}
          extraData={selectedId}
        />
      </View>

      {/* Botón Reservar */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, !canReserve && styles.buttonDisabled]} 
          disabled={!canReserve}
          onPress={() => {
            router.push({ pathname: "/with-header/booking", params: { slotId: String(selectedId) } });
          }}
        >
          <Text style={styles.buttonText}>Reservar →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.lightGray
  },
  header: {
    flex: 1.5, flexDirection: "row",
    alignItems: "center"
  },
  title: {
    fontSize: Typography.h1,
    fontWeight: "bold",
    color: Colors.dark,
    marginLeft: 10
  },
  gridWrapper: {
    flex: 7
  },
  footer: {
    flex: 1.5,
    justifyContent: "center"
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: "center"
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
