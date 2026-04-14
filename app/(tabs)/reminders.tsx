import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Notifications from "expo-notifications";
import {
  Bell,
  Calendar as CalendarIcon,
  Clock,
  Trash2,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RemindersScreen() {
  const [text, setText] = useState("");
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<"date" | "time">("date");
  const [reminders, setReminders] = useState<any[]>([]);

  // 1. Setup & Permissions
  useEffect(() => {
    if (Platform.OS === "android") {
      Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#38bdf8", // Your Sky Blue theme!
      });
    }

    (async () => {
      // Request standard notification permissions
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      // Specifically for Android 12+ Exact Alarms
      if (Platform.OS === "android") {
        const { status: exactStatus } =
          await Notifications.getPermissionsAsync();
        if (exactStatus !== "granted") {
          // This will guide the user to the system settings if needed
          console.log("Exact alarm permission is required for Android 12+");
        }
      }

      if (finalStatus !== "granted") {
        Alert.alert(
          "Permission Required",
          "Notifications must be enabled to set reminders.",
        );
      }
      loadReminders();
    })();
  }, []);

  const loadReminders = async () => {
    try {
      const saved = await AsyncStorage.getItem("reminders");
      if (saved) setReminders(JSON.parse(saved));
    } catch (e) {
      console.error(e);
    }
  };

  // 2. The Multi-Step Picker Logic
  const onPickerChange = (event: any, selectedDate?: Date) => {
    // Hide picker first
    setShowPicker(false);

    if (event.type === "dismissed") {
      setPickerMode("date");
      return;
    }

    if (selectedDate) {
      const current = selectedDate;

      if (pickerMode === "date") {
        // Step 1: Date picked, now trigger Time
        setDate(current);
        setPickerMode("time");
        // Small timeout so Android can close the first dialog before opening the second
        setTimeout(() => setShowPicker(true), 150);
      } else {
        // Step 2: Time picked, final date is set
        setDate(current);
        setPickerMode("date");
      }
    }
  };

  // 3. Scheduling Logic
  const scheduleReminder = async () => {
    // 1. Basic Validation
    if (!text.trim()) {
      Alert.alert(
        "Input Required",
        "What would you like to be reminded about?",
      );
      return;
    }

    // 2. Calculate the difference in seconds
    const now = Date.now();
    const target = date.getTime();
    const triggerInSeconds = Math.floor((target - now) / 1000);

    // 3. Ensure the time is in the future
    if (triggerInSeconds <= 0) {
      Alert.alert("Invalid Time", "Please select a time in the future.");
      return;
    }

    try {
      // 4. Create the Android Channel (Safe to call multiple times)
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("reminders", {
          name: "Reminders",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#38bdf8",
        });
      }

      // 5. Schedule using a Time Interval (more stable than Date object)
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: "📌 Reminder",
          body: text,
          sound: true,
          color: "#38bdf8",
          priority: Notifications.AndroidNotificationPriority.MAX,
          vibrate: [0, 250, 250, 250],
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: triggerInSeconds,
          repeats: false,
          channelId: "reminders",
        },
      });

      // 6. Save to Local Storage and Update State
      const newReminder = {
        id: identifier,
        text: text.trim(),
        displayTime: date.toLocaleString("en-GB", {
          dateStyle: "medium",
          timeStyle: "short",
        }),
      };

      const updated = [newReminder, ...reminders];
      await AsyncStorage.setItem("reminders", JSON.stringify(updated));
      setReminders(updated);

      // 7. Reset UI
      setText("");
      Alert.alert("Success", `Reminder set for ${newReminder.displayTime}`);
    } catch (error) {
      console.error("Notification Error Details:", error);
      Alert.alert(
        "Error",
        "Could not schedule notification. Ensure notification permissions are granted in your phone settings.",
      );
    }
  };

  const deleteReminder = async (id: string) => {
    await Notifications.cancelScheduledNotificationAsync(id);
    const filtered = reminders.filter((r) => r.id !== id);
    setReminders(filtered);
    await AsyncStorage.setItem("reminders", JSON.stringify(filtered));
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-1 px-6 pt-4">
          <Text className="text-4xl font-black text-white mb-8">Reminders</Text>

          {/* Form Card */}
          <View className="bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-sm mb-8">
            <TextInput
              placeholder="Remind me to..."
              placeholderTextColor="#475569"
              className="text-white text-xl font-semibold mb-5 px-2"
              value={text}
              onChangeText={setText}
            />

            <TouchableOpacity
              onPress={() => {
                setPickerMode("date");
                setShowPicker(true);
              }}
              className="flex-row items-center bg-slate-800/50 p-4 rounded-2xl mb-5 border border-slate-700/50"
            >
              <CalendarIcon color="#38bdf8" size={22} />
              <View className="ml-4">
                <Text className="text-slate-500 text-xs uppercase font-bold tracking-wider">
                  When
                </Text>
                <Text className="text-white text-base">
                  {date.toLocaleString("en-GB", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={scheduleReminder}
              activeOpacity={0.8}
              className="bg-sky-500 py-4 rounded-2xl flex-row justify-center items-center shadow-lg shadow-sky-500/20"
            >
              <Bell color="white" size={22} />
              <Text className="text-white font-bold text-lg ml-2">
                Set Reminder
              </Text>
            </TouchableOpacity>
          </View>

          {/* List Section */}
          <Text className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-4 ml-2">
            Upcoming
          </Text>
          <FlatList
            data={reminders}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View className="bg-slate-900/40 p-5 rounded-2xl border border-slate-900 mb-3 flex-row justify-between items-center">
                <View className="flex-1 mr-4">
                  <Text className="text-white text-lg font-medium">
                    {item.text}
                  </Text>
                  <View className="flex-row items-center mt-1">
                    <Clock color="#64748b" size={14} />
                    <Text className="text-slate-500 text-xs ml-1">
                      {item.displayTime}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => deleteReminder(item.id)}
                  className="bg-red-500/10 p-3 rounded-xl"
                >
                  <Trash2 color="#ef4444" size={20} />
                </TouchableOpacity>
              </View>
            )}
            ListEmptyComponent={
              <View className="items-center mt-10 opacity-30">
                <Bell color="#94a3b8" size={48} strokeWidth={1} />
                <Text className="text-slate-400 mt-2">No active reminders</Text>
              </View>
            }
          />
        </View>
      </KeyboardAvoidingView>

      {showPicker && (
        <DateTimePicker
          value={date}
          mode={pickerMode}
          is24Hour={true}
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={onPickerChange}
          minimumDate={new Date()} // Prevents picking dates in the past
        />
      )}
    </SafeAreaView>
  );
}
