import { View, Text, Button } from "react-native";
import { router } from "expo-router";
import { Typography, Colors } from "@/theme";

export default function Login() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Colors.light }}>
      <Text style={{ fontSize: 20, marginBottom: 20 }}>Pantalla Login</Text>
      <Button title="Ingresar" onPress={() => router.push("/with-header/onboarding")} />
    </View>
  );
}
