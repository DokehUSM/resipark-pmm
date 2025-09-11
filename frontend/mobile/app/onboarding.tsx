import { View, Text, Button } from "react-native";
import { router } from "expo-router";

export default function Onboarding() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontSize: 20, marginBottom: 20 }}>Pantalla Onboarding</Text>
      <Button title="Ir a Disponibilidad" onPress={() => router.push("/availability")} />
      <Button title="Ir a Cuenta" onPress={() => router.push("/account")} />
    </View>
  );
}
