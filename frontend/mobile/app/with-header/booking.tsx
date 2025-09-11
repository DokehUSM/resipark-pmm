import { View, Text, Button } from "react-native";
import { router } from "expo-router";

export default function Booking() {
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontSize: 20, marginBottom: 20 }}>Pantalla Booking</Text>
      </View>
    </View>
  );
}
