import { View, Text, StyleSheet, Pressable } from "react-native";
import { Colors, Typography } from "@/theme";

type ParkingSlotProps = {
  name?: string;
  status?: "disponible" | "reservado" | "ocupado";
  time?: string;
  isPlaceholder?: boolean;
  onPress?: () => void;
  selected?: boolean; // ✅ nuevo
};

export default function ParkingSlot({
  name = "—",
  status = "disponible",
  time,
  isPlaceholder,
  onPress,
  selected = false,
}: ParkingSlotProps) {
  if (isPlaceholder) {
    // ✅ placeholder del mismo TAMAÑO que una tarjeta normal
    return (
      <View
        style={[
          styles.card,
          { backgroundColor: "transparent", borderWidth: 0 },
        ]}
        accessible={false}
      />
    );
  }

  // Paleta por estado
  const warning = (Colors as any).warning ?? "#F59E0B";
  const palette = {
    disponible: { border: Colors.primary, bg: Colors.light, text: Colors.dark },
    reservado:  { border: warning,        bg: Colors.lightGray, text: Colors.dark },
    ocupado:    { border: Colors.danger,  bg: Colors.lightGray, text: Colors.danger },
  } as const;

  const isAvailable = status === "disponible";
  const { border, bg, text } = palette[status];
  const accent = (Colors as any).success ?? Colors.primary; // para seleccionado

  // Subtítulo
  const subtitle =
    status === "disponible"
      ? time ? `Desde: ${time}` : "Libre"
      : status === "reservado"
      ? time ? `Reservado hasta: ${time}` : "Reservado"
      : time ? `Ocupado hasta: ${time}` : "Ocupado";

  return (
    <Pressable
      onPress={onPress}
      disabled={!isAvailable}
      style={[
        styles.card,
        { borderColor: border, backgroundColor: bg },
        !isAvailable && { opacity: 0.8 },
        isAvailable && selected && {
          borderColor: accent,
          borderWidth: 3,
          backgroundColor: Colors.white,
          shadowColor: "#000",
          shadowOpacity: 0.15,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 3 },
          elevation: 3,
        },
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: !isAvailable, selected: isAvailable ? selected : undefined }}
      accessibilityLabel={`${name} ${status}${selected ? " seleccionado" : ""}`}
    >
      <Text style={[styles.name, { color: text }]}>{name}</Text>
      {!!subtitle && <Text style={[styles.time, { color: text }]}>{subtitle}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    aspectRatio: 1.2,
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
