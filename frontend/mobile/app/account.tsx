import { View, Text, Button } from "react-native";
import { router } from "expo-router";

export default function Account() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontSize: 20, marginBottom: 20 }}>Pantalla Cuenta</Text>
      <Button title="Cerrar sesión" onPress={() => router.replace("/")} />
    </View>
  );
}
