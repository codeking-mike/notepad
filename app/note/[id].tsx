import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Bold, ChevronLeft, Italic, List } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
    AppState,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import "react-native-get-random-values";
import Markdown from "react-native-markdown-display";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NoteEditor() {
  const [isEditing, setIsEditing] = useState(false);
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPreview, setIsPreview] = useState(false);

  // Helper to insert markdown symbols
  const insertSymbol = (symbol: string) => {
    setContent((prev) => prev + symbol);
  };

  // Refs to hold the latest values for the storage logic
  const titleRef = useRef(title);
  const contentRef = useRef(content);

  useEffect(() => {
    titleRef.current = title;
    contentRef.current = content;
  }, [title, content]);

  // The Core Saving Function
  const saveNote = async () => {
    // Don't save if both title and content are empty strings
    if (!titleRef.current.trim() && !contentRef.current.trim()) return;

    const noteToSave = {
      id,
      title: titleRef.current,
      content: contentRef.current,
      date: new Date().toISOString(),
    };

    try {
      const existingNotes = await AsyncStorage.getItem("notes");
      const notes = existingNotes ? JSON.parse(existingNotes) : [];

      const updatedNotes = [
        ...notes.filter((n: any) => n.id !== id),
        noteToSave,
      ];

      await AsyncStorage.setItem("notes", JSON.stringify(updatedNotes));
      console.log("Note autosaved successfully");
    } catch (e) {
      console.error("Autosave failed", e);
    }
  };

  // Inside NoteEditor component
  useEffect(() => {
    const loadNoteData = async () => {
      try {
        const saved = await AsyncStorage.getItem("notes");
        if (saved) {
          const notes = JSON.parse(saved);
          // Find the specific note that matches the ID in the URL
          const existingNote = notes.find((n: any) => n.id === id);

          if (existingNote) {
            setTitle(existingNote.title);
            setContent(existingNote.content);
          }
        }
      } catch (e) {
        console.error("Failed to load existing note", e);
      }
    };

    loadNoteData();
  }, [id]); // Runs once on mount, or if the ID changes

  // 1. Save when Navigating Away (Unmounting)
  // 2. Save when App goes to Background (Minimizing)
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "inactive" || nextAppState === "background") {
        saveNote();
      }
    });

    return () => {
      subscription.remove(); // Clean up the listener
      saveNote(); // Save when user clicks "Back"
    };
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      {/* Header */}
      <View className="flex-row justify-between px-4 py-2 items-center">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <ChevronLeft color="white" size={28} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-sky-500 px-6 py-2 rounded-full"
        >
          <Text className="text-white font-bold">Done</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1 px-6 mt-4"
        keyboardShouldPersistTaps="handled"
      >
        {/* Title Input (Always editable or rendered as text) */}
        <TextInput
          placeholder="Title"
          placeholderTextColor="#475569"
          className="text-4xl font-bold text-white mb-6"
          value={title}
          onChangeText={setTitle}
          onFocus={() => setIsEditing(true)}
        />

        {/* The Body: Toggles between Markdown and Input */}
        {isEditing ? (
          <TextInput
            multiline
            autoFocus
            value={content}
            onChangeText={setContent}
            placeholder="Start typing..."
            placeholderTextColor="#475569"
            className="text-xl text-slate-300 min-h-[300px]"
            style={{ textAlignVertical: "top" }}
            onBlur={() => setIsEditing(false)} // Snap back to preview when focus is lost
          />
        ) : (
          <Pressable
            onPress={() => setIsEditing(true)}
            className="min-h-[300px]"
          >
            {content.length > 0 ? (
              <Markdown style={markdownStyles}>{content}</Markdown>
            ) : (
              <Text className="text-xl text-slate-600 italic">
                Tap to start writing...
              </Text>
            )}
          </Pressable>
        )}
      </ScrollView>

      {/* Toolbar: Only show when keyboard is up (editing) */}
      {isEditing && (
        <View className="flex-row bg-slate-900 border-t border-slate-800 px-6 py-3 justify-between items-center">
          <TouchableOpacity
            onPress={() => setContent((prev) => prev + "**")}
            className="p-2"
          >
            <Bold color="white" size={22} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setContent((prev) => prev + "*")}
            className="p-2"
          >
            <Italic color="white" size={22} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setContent((prev) => prev + "\n- ")}
            className="p-2"
          >
            <List color="white" size={22} />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const markdownStyles = StyleSheet.create({
  /* ... */
  // Main Body Text
  body: {
    color: "#cbd5e1", // slate-300
    fontSize: 18,
    lineHeight: 28,
  },
  // Bold Text
  strong: {
    color: "#ffffff",
    fontWeight: "900" as const,
  },
  // Italic Text
  em: {
    color: "#38bdf8", // sky-400
    fontStyle: "italic",
  },
  // Bullet Points
  bullet_list: {
    marginTop: 10,
  },
  bullet_list_icon: {
    color: "#38bdf8", // sky-400
    marginRight: 10,
    fontSize: 20,
  },
  listItemContent: {
    color: "#cbd5e1",
    fontSize: 18,
  },
  // Horizontal Rule (---)
  hr: {
    backgroundColor: "#1e293b", // slate-800
    height: 1,
    marginVertical: 20,
  },
  // Links (if you add them later)
  link: {
    color: "#38bdf8",
    textDecorationLine: "underline",
  },
} as any);
