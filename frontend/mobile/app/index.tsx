import { View, Text, Button } from "react-native";
import { Link } from "expo-router";

export default function Index() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text>Pantalla Login</Text>
      <Link href="/onboarding">Ir a Onboarding</Link>
    </View>
  );
}
