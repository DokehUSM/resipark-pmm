// app/with-header/_layout.tsx
import { Stack, router } from "expo-router";
import { useEffect } from "react";
import { View, Dimensions, StyleSheet, ActivityIndicator } from "react-native";
import Header from "../../components/Header";
import { Colors } from "@/theme";
import { useAuth } from "@/context/AuthContext";

const { width } = Dimensions.get("window");

export default function WithHeaderLayout() {
  const { departamento, loading } = useAuth();

  useEffect(() => {
    if (!loading && !departamento) {
      router.replace("/");
    }
  }, [loading, departamento]);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header />
      <View style={styles.pageContent}>
        <Stack screenOptions={{ headerShown: false }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: Colors.lightGray,
    alignItems: "center",
    justifyContent: "center",
  },
  container: {
    flex: 1,
    backgroundColor: Colors.lightGray,
  },
  pageContent: {
    flex: 1,
    paddingHorizontal: width * 0.05,
  },
});
