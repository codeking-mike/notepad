// app/_layout.tsx
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Platform } from "react-native";

import "./global.css"; // Ensure the path points to your global.css

if (Platform.OS !== "web") {
  const Notifications = require("expo-notifications");

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export default function RootLayout() {
  return (
    <>
      {/* This ensures your status bar icons (time/battery) are visible on dark bg */}
      <StatusBar style="light" />

      <Stack>
        {/* We hide the header here because the (tabs) _layout handles its own UI */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="note/[id]"
          options={{
            headerShown: false,
            presentation: "modal", // This makes it slide up on iOS/Android
          }}
        />
      </Stack>
    </>
  );
}
