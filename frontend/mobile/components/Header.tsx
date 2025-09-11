import { View, Image, Pressable, StyleSheet, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

const { width } = Dimensions.get("window");

export default function Header() {
  return (
    <SafeAreaView edges={["top"]} style={{ backgroundColor: "#f8f8f8" }}>
        <View style={styles.container}>
        <Pressable onPress={() => router.push("/with-header/onboarding")}>
            <Image
            source={require("../assets/resipark-logo.png")}
            style={styles.logo}
            resizeMode="contain"
            />
        </Pressable>
        <Pressable onPress={() => router.push("/with-header/account")}>
          <Ionicons name="person-circle-outline" size={32} color="black" />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 80,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: width * 0.05,
  },
  logo: {
    height: 40,
    width: 100,
  },
});
