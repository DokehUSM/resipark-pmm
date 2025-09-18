import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Colors, Typography } from "@/theme";

const MOCK_RESERVAS = [
  { id: 1, placa: "LMNN77", horario: "19:42 - 21:42", rut: "20.109.691-K" },
  { id: 2, placa: "UHGT73", horario: "19:43 - 21:43", rut: "12.345.678-9" },
];

export default function CancelBookings() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Reservas activas ({MOCK_RESERVAS.length})</Text>

      {MOCK_RESERVAS.map((reserva) => (
        <View key={reserva.id} style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.plate}>{reserva.placa}</Text>
              <Text style={styles.rut}>{reserva.rut}</Text>
            </View>
            <Text style={styles.schedule}>{reserva.horario}</Text>
          </View>

          <TouchableOpacity style={styles.cancelButton} activeOpacity={0.85}>
            <Text style={styles.cancelText}>Anular reserva</Text>
          </TouchableOpacity>
        </View>
      ))}
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
  cancelText: {
    color: Colors.white,
    fontSize: Typography.h2,
    fontWeight: "700",
  },
});
