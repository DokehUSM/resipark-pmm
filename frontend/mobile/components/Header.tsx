import { View, Image, Pressable, StyleSheet, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Colors, Typography } from "@/theme";

const { width } = Dimensions.get("window");

export default function Header() {
  return (
    <SafeAreaView edges={["top"]} style={{ backgroundColor: Colors.secondary }}>
        <View style={styles.container}>
        <Pressable onPress={() => router.push("/with-header/onboarding")}>
            <Image
            source={require("../assets/resipark-logo.png")}
            style={styles.logo}
            resizeMode="contain"
            />
        </Pressable>
        <Pressable onPress={() => router.push("/with-header/account")}>
          <Ionicons name="person-circle-outline" size={60} color={Colors.light} />
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
    height: 60,
    width: undefined,
    aspectRatio: 1024/432,     // relación ancho/alto de la imagen
    resizeMode: "contain",
  },
});
