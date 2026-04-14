import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import {
    CheckCircle2,
    Circle,
    FileText,
    Plus,
    Search,
    Trash2,
    X,
    XCircle,
} from "lucide-react-native";
import { useCallback, useState } from "react";
import {
    Alert,
    FlatList,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { v4 as uuidv4 } from "uuid";
import NoteCard from "../components/NoteCard";

type Note = {
  id: string;
  title: string;
  content: string;
  date: string;
};

export default function HomeScreen() {
  const [notes, setNotes] = useState<Note[]>([]);
  const router = useRouter();
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // 1. Toggle Selection Mode
  const handleLongPress = (id: string) => {
    setIsSelectionMode(true);
    setSelectedIds([id]); // Select the long-pressed note by default
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      const next = selectedIds.filter((item) => item !== id);
      setSelectedIds(next);
      if (next.length === 0) setIsSelectionMode(false); // Exit mode if none selected
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const cancelSelection = () => {
    setIsSelectionMode(false);
    setSelectedIds([]);
  };

  // 2. The Delete Logic
  const deleteSelected = async () => {
    Alert.alert(
      "Delete Notes",
      `Are you sure you want to delete ${selectedIds.length} note(s)?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const remaining = notes.filter((n) => !selectedIds.includes(n.id));
            await AsyncStorage.setItem("notes", JSON.stringify(remaining));
            setNotes(remaining);
            cancelSelection();
          },
        },
      ],
    );
  };

  // Inside your HomeScreen component

  const isAllSelected = notes.length > 0 && selectedIds.length === notes.length;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      // If everything is already selected, clear the selection
      setSelectedIds([]);
    } else {
      // Otherwise, grab every single ID from the notes array
      const allIds = notes.map((n: any) => n.id);
      setSelectedIds(allIds);
    }
  };
  // Fetch notes every time the user navigates back to this screen

  useFocusEffect(
    useCallback(() => {
      const loadNotes = async () => {
        try {
          const saved = await AsyncStorage.getItem("notes");
          if (saved) {
            // Sort by newest date first
            const parsed = JSON.parse(saved) as Note[];
            parsed.sort(
              (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
            );
            setNotes(parsed);
          }
        } catch (e) {
          console.error(e);
        }
      };
      loadNotes();
    }, []),
  );

  const createNewNote = () => {
    const id = uuidv4();
    router.push(`/note/${id}`);
  };

  // This is the "Magic" line: Filter the notes in real-time
  const filteredNotes = notes.filter(
    (note: any) =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <View className="flex-1 px-6 pt-4">
        {/* Dynamic Header */}
        {/* Update your Header Section in index.tsx */}
        <View className="flex-row justify-between items-center mb-8">
          <View>
            <Text className="text-4xl font-black text-white">
              {isSelectionMode ? `${selectedIds.length} Selected` : "My Notes"}
            </Text>
          </View>

          <View className="flex-row items-center gap-x-4">
            {isSelectionMode ? (
              <>
                {/* Select All Toggle */}
                <TouchableOpacity onPress={toggleSelectAll}>
                  <Text className="text-sky-400 font-bold">
                    {isAllSelected ? "Deselect All" : "Select All"}
                  </Text>
                </TouchableOpacity>

                {/* Cancel Icon */}
                <TouchableOpacity onPress={cancelSelection}>
                  <X color="white" size={28} />
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                onPress={createNewNote}
                className="bg-sky-500 w-12 h-12 rounded-full items-center justify-center shadow-lg shadow-sky-500/40"
              >
                <Plus color="white" size={28} />
              </TouchableOpacity>
            )}
          </View>
        </View>
        {!isSelectionMode && (
          <View className="mb-6 px-1">
            <View className="flex-row items-center bg-slate-900/50 border border-slate-800 rounded-2xl px-4 py-3">
              <Search color="#64748b" size={20} />
              <TextInput
                placeholder="Search your thoughts..."
                placeholderTextColor="#64748b"
                className="flex-1 ml-3 text-white text-base"
                value={searchQuery}
                onChangeText={setSearchQuery}
                keyboardAppearance="dark"
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <XCircle color="#64748b" size={20} fill="#1e293b" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        <FlatList
          data={filteredNotes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            // <--- Destructuring 'item' out of the render object
            const isSelected = selectedIds.includes(item.id);

            return (
              <View className="flex-row items-center mb-4">
                {/* Checkbox only in Selection Mode */}
                {isSelectionMode && (
                  <TouchableOpacity
                    onPress={() => toggleSelect(item.id)}
                    className="mr-3"
                  >
                    {isSelected ? (
                      <CheckCircle2
                        color="#38bdf8"
                        size={26}
                        fill="#0ea5e933"
                      />
                    ) : (
                      <Circle color="#475569" size={26} />
                    )}
                  </TouchableOpacity>
                )}

                <View className="flex-1">
                  <NoteCard
                    note={item}
                    // Passing the ID directly from the destructured item
                    onLongPress={() => handleLongPress(item.id)}
                    onPress={() =>
                      isSelectionMode
                        ? toggleSelect(item.id)
                        : router.push(`/note/${item.id}`)
                    }
                    // Add a visual border if selected
                    containerStyle={
                      isSelected ? "border-sky-500 bg-slate-800" : ""
                    }
                  />
                </View>
              </View>
            );
          }}
          contentContainerStyle={{ paddingBottom: 120 }}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center mt-20 opacity-40">
              <FileText color="#94a3b8" size={64} strokeWidth={1} />
              <Text className="text-slate-400 mt-4 text-center">
                {searchQuery.length > 0
                  ? `No results for "${searchQuery}"`
                  : "Your thoughts are waiting.\nTap the plus to start writing."}
              </Text>
            </View>
          }
        />
      </View>

      {/* Floating Delete Bar */}
      {isSelectionMode && (
        <View className="absolute bottom-10 left-6 right-6 bg-slate-900 border border-slate-800 p-4 rounded-3xl flex-row justify-between items-center shadow-2xl">
          <Text className="text-white font-semibold">
            {selectedIds.length} items ready to go
          </Text>
          <TouchableOpacity
            onPress={deleteSelected}
            className="bg-red-500/20 p-3 rounded-2xl"
          >
            <Trash2 color="#ef4444" size={24} />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}
