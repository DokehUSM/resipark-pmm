import React, { useMemo } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";
import { Colors, Typography } from "@/theme";

const TITLES: Record<string, string> = {
  "/with-header/home": "Inicio",
  "/with-header/availability": "Disponibilidad",
  "/with-header/booking": "Reservar",
  "/with-header/account": "Cuenta",
};

export default function Header() {
  const pathname = usePathname();
  const canGoBack = router.canGoBack();

  const title = useMemo(() => {
    if (pathname && TITLES[pathname]) return TITLES[pathname];
    const segments = pathname?.split("/").filter(Boolean) ?? [];
    const last = segments[segments.length - 1] ?? "";
    if (!last) return "Inicio";
    return last.charAt(0).toUpperCase() + last.slice(1);
  }, [pathname]);

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.side}>
          {canGoBack ? (
            <Pressable
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Volver"
            >
              <Ionicons name="chevron-back" size={26} color={Colors.dark} />
            </Pressable>
          ) : null}
        </View>

        <View style={styles.titleWrapper}>
          <Text style={styles.title}>{title}</Text>
        </View>

        <View style={[styles.side, styles.sideRight]}>
          <Pressable
            onPress={() => router.push("/with-header/account")}
            accessibilityRole="button"
            accessibilityLabel="Ir a mi cuenta"
            style={styles.profileButton}
          >
            <Ionicons name="person-outline" size={22} color={Colors.dark} />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: Colors.white,
  },
  container: {
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  side: {
    width: 48,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  sideRight: {
    alignItems: "flex-end",
  },
  titleWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: Typography.h2,
    fontWeight: "700",
    color: Colors.dark,
  },
  profileButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.lightGray,
    alignItems: "center",
    justifyContent: "center",
  },
});
