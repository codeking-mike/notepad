import { Text, TouchableOpacity } from "react-native";

export default function NoteCard({ note, onLongPress, onPress }: any) {
  return (
    <TouchableOpacity
      onLongPress={onLongPress}
      onPress={onPress}
      activeOpacity={0.7}
      className="bg-slate-900 p-4 rounded-2xl mb-4 border border-slate-800"
    >
      <Text className="text-white font-bold text-lg mb-1" numberOfLines={1}>
        {note.title || "Untitled"}
      </Text>
      <Text className="text-slate-400 text-sm" numberOfLines={2}>
        {note.content}
      </Text>
    </TouchableOpacity>
  );
}
