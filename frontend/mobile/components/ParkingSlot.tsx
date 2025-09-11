import { View, Text, StyleSheet } from "react-native";
import { Colors, Typography } from "@/theme";

type ParkingSlotProps = {
  name?: string;
  status?: "disponible" | "reservado";
  time?: string;
  isPlaceholder?: boolean;
};

export default function ParkingSlot({ name, status, time, isPlaceholder }: ParkingSlotProps) {
  if (isPlaceholder) {
    // Relleno invisible para que no se deforme la grilla
    return <View style={[styles.card, { backgroundColor: "transparent", borderWidth: 0 }]} />;
  }

  const isAvailable = status === "disponible";

  return (
    <View
      style={[
        styles.card,
        {
          borderColor: isAvailable ? Colors.primary : Colors.danger,
          backgroundColor: isAvailable ? Colors.light : Colors.lightGray,
        },
      ]}
    >
      <Text style={styles.name}>{name}</Text>
      <Text style={[styles.time, { color: isAvailable ? Colors.dark : Colors.danger }]}>
        {isAvailable ? `Desde: ${time}` : `Hasta: ${time}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    aspectRatio: 1.2, // mantiene proporción
    borderWidth: 2,
    borderRadius: 8,
    padding: 12,
    margin: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  name: {
    fontSize: Typography.h2,
    fontWeight: "bold",
    marginBottom: 8,
  },
  time: {
    fontSize: Typography.small,
    textAlign: "center",
  },
});
