import { Tabs } from "expo-router";
import { Bell, Home, Settings, User } from "lucide-react-native";
import React from "react";

const _layout = () => {
  return (
    <Tabs
      screenOptions={{
        // 1. Header Styling (Top of screen)
        headerShown: false,
        headerStyle: {
          backgroundColor: "#0f172a", // slate-900
        },
        headerTintColor: "#f8fafc", // slate-50
        headerShadowVisible: false,

        // 2. Tab Bar Styling (Bottom of screen)
        tabBarActiveTintColor: "#38bdf8", // sky-400 (Light Blue)
        tabBarInactiveTintColor: "#94a3b8", // slate-400 (Muted Gray)
        tabBarStyle: {
          backgroundColor: "#0f172a", // slate-900 (Dark Background)
          borderTopWidth: 0, // Removes the ugly top border
          height: 75, // Extra height for comfort
          paddingBottom: 40,
          marginBottom: 30,
          paddingTop: 5,
        },

        // Optional: Hide labels for a "minimalist" icon-only look
        // tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Notes",
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="reminders"
        options={{
          title: "Reminders",
          tabBarIcon: ({ color, size }) => <Bell color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <Settings color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
};

export default _layout;
