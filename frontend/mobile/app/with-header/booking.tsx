import React from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography } from "@/theme";

const AVAILABILITY = { libres: 7, total: 12 };

export default function Booking() {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>
            Disponibilidad ({AVAILABILITY.libres}/{AVAILABILITY.total})
          </Text>
          <View style={styles.helpIcon}>
            <Ionicons name="help-circle-outline" size={22} color={Colors.gray} />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Número de patente</Text>
          <TextInput
            style={styles.input}
            placeholder="RFDT69"
            placeholderTextColor={Colors.gray}
            autoCapitalize="characters"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Cédula de identidad</Text>
          <TextInput
            style={styles.input}
            placeholder="12.345.678-9"
            placeholderTextColor={Colors.gray}
            autoCapitalize="characters"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Hora de ingreso</Text>
          <TextInput
            style={styles.input}
            placeholder="3:15 PM"
            placeholderTextColor={Colors.gray}
          />
        </View>

        <TouchableOpacity style={styles.primaryButton} activeOpacity={0.85}>
          <Text style={styles.primaryButtonText}>Reservar</Text>
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
    justifyContent: 'center'
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
  primaryButtonText: {
    color: Colors.white,
    fontSize: Typography.h2,
    fontWeight: "700",
  },
});
