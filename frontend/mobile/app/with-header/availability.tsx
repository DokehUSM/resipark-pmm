import { View, Text, Button } from "react-native";
import { router } from "expo-router";

export default function Availability() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontSize: 20, marginBottom: 20 }}>Pantalla Availability</Text>
      <Button title="Reservar" onPress={() => router.push("/with-header/booking")} />
    </View>
  );
}
