import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Colors, Typography } from "@/theme";
import ParkingSlot from "@/components/ParkingSlot";

const numColumns = 3;

const data = [
  { name: "A03", status: "disponible", time: "3:15 PM" },
  { name: "A04", status: "reservado", time: "5:30 PM" },
  { name: "A05", status: "disponible", time: "3:15 PM" },
  { name: "A06", status: "disponible", time: "3:15 PM" },
  { name: "A07", status: "disponible", time: "3:15 PM" },
  { name: "A08", status: "reservado", time: "6:00 PM" },
  { name: "B01", status: "reservado", time: "5:00 PM" },
  { name: "B02", status: "reservado", time: "4:30 PM" },
  { name: "B03", status: "reservado", time: "3:45 PM" },
  { name: "B04", status: "disponible", time: "4:00 PM" },
  { name: "B05", status: "reservado", time: "6:15 PM" },
  { name: "B06", status: "disponible", time: "3:15 PM" },
  { name: "C01", status: "disponible", time: "2:45 PM" },
  { name: "C02", status: "reservado", time: "5:20 PM" },
  { name: "C03", status: "disponible", time: "4:10 PM" },
  { name: "C04", status: "reservado", time: "6:30 PM" },
  { name: "C05", status: "disponible", time: "3:50 PM" },
  { name: "C06", status: "reservado", time: "4:45 PM" },
  { name: "D01", status: "disponible", time: "2:30 PM" },
  { name: "D02", status: "reservado", time: "5:10 PM" },
  { name: "D03", status: "disponible", time: "3:25 PM" },
  { name: "D04", status: "reservado", time: "6:45 PM" },
  { name: "D05", status: "disponible", time: "4:05 PM" },
  { name: "D06", status: "reservado", time: "5:40 PM" },
];


// función para rellenar última fila
function formatData(data: any[], numColumns: number) {
  const numberOfFullRows = Math.floor(data.length / numColumns);
  let numberOfElementsLastRow = data.length - numberOfFullRows * numColumns;
  while (numberOfElementsLastRow !== 0 && numberOfElementsLastRow !== numColumns) {
    data.push({ isPlaceholder: true, id: `blank-${numberOfElementsLastRow}` });
    numberOfElementsLastRow++;
  }
  return data;
}

// variables para contar número de estacionamientos
const totalSlots = data.length;
const availableSlots = data.filter((s) => s.status === "disponible").length;


export default function Availability() {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push("/with-header/onboarding")}>
          <Ionicons
            name="arrow-back-circle-outline"
            size={Typography.h1}
            color={Colors.gray}
          />
        </TouchableOpacity>
        <Text style={styles.title}>
          Disponibilidad ({availableSlots}/{totalSlots})
        </Text>
      </View>

      {/* Grid */}
      <View style={styles.gridWrapper}>
        <FlatList
          data={formatData([...data], numColumns)}
          numColumns={numColumns}
          keyExtractor={(item, index) => item.name ?? `placeholder-${index}`}
          renderItem={({ item }) => (
            <ParkingSlot
              name={item.name}
              status={item.status}
              time={item.time}
              isPlaceholder={item.isPlaceholder}
            />
          )}
          showsVerticalScrollIndicator={true}
          persistentScrollbar={true}
        />
      </View>

      {/* Botón Reservar */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("/with-header/booking")}
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
    backgroundColor: Colors.lightGray,
  },
  header: {
    flex: 1.5, // 15%
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    fontSize: Typography.h1,
    fontWeight: "bold",
    color: Colors.dark,
    marginLeft: 10,
  },
  gridWrapper: {
    flex: 7, // 70%
  },
  footer: {
    flex: 1.5, // 15%
    justifyContent: "center",
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: "center",
  },
  buttonText: {
    color: Colors.white,
    fontSize: Typography.h2,
    fontWeight: "600",
  },
});
