import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { router, Href } from "expo-router";
import { Colors, Typography } from "@/theme";

const AVAILABILITY = [
  { label: "disponibles", value: 7, color: Colors.success },
  { label: "reservados", value: 2, color: Colors.warning },
  { label: "ocupados", value: 3, color: Colors.danger },
];

const MOCK_RESERVATIONS = [
  { plate: "LMNN77", time: "19:42 - 21:42", rut: "20.109.691-K" },
  { plate: "UHGT73", time: "19:43 - 21:43", rut: "12.345.678-9" },
];

function goTo(path: Href) {
  return () => router.push(path);
}

export default function Home() {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Reserva de estacionamientos</Text>

        <View style={styles.cardBody}>
          <View>
            {AVAILABILITY.map((item, index) => (
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

          <View style={styles.chartPlaceholder}>
            <View style={styles.chartSlice} />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.actionButton, styles.reserveButton]}
          onPress={() => router.push("/with-header/booking")}
          accessibilityRole="button"
          accessibilityLabel="Ir a reservar estacionamientos"
        >
          <Text style={styles.actionButtonText}>Reservar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Anular reservas</Text>

        <View style={styles.reservationsBox}>
          {MOCK_RESERVATIONS.map((item, index) => (
            <View key={item.plate} style={[styles.reservationRow, index > 0 && styles.separator]}>
              <View style={styles.reservationLeft}>
                <Text style={styles.reservationPlate}>{item.plate}</Text>
                <Text style={styles.reservationRut}>{item.rut}</Text>
              </View>
              <Text style={styles.reservationTime}>{item.time}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.actionButton, styles.cancelButton]}
          onPress={() => router.push("/with-header/cancelBookings")}
          accessibilityRole="button"
          accessibilityLabel="Ir a anular reservas"
        >
          <Text style={styles.actionButtonText}>Anular reservas</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.lightGray,
    padding: 24,
    paddingBottom: 40,
    justifyContent: 'center'
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
  chartPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: Colors.lightGray,
    alignItems: "center",
    justifyContent: "center",
  },
  chartSlice: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: Colors.gray,
    borderRightColor: "transparent",
    borderBottomColor: "transparent",
    transform: [{ rotate: "-45deg" }],
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
