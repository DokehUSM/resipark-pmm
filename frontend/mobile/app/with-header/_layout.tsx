import { Stack } from "expo-router";
import { View, Dimensions, StyleSheet } from "react-native";
import Header from "../../components/Header";

const { width } = Dimensions.get("window");

export default function WithHeaderLayout() {
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
  container: {
    flex: 1,
  },
  pageContent: {
    flex: 1,
    paddingHorizontal: width * 0.05, // 5% padding horizontal
  },
});
