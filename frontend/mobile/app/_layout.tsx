import { Slot } from "expo-router";

import { ApiConfigProvider } from "@/context/ApiConfigContext";
import { AuthProvider } from "@/context/AuthContext";

export default function RootLayout() {
  return (
    <ApiConfigProvider>
      <AuthProvider>
        <Slot />
      </AuthProvider>
    </ApiConfigProvider>
  );
}
