import { useState } from "react";
import { Modal, Pressable, Text, TextInput, View } from "react-native";

import type { CreateEventInput } from "@/features/events/types/event.types";

type CreateEventModalProps = {
  visible: boolean;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (input: CreateEventInput) => Promise<void>;
};

export function CreateEventModal({ visible, isSaving, onClose, onSubmit }: CreateEventModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Event name is required");
      return;
    }

    setError(null);
    await onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
    });
    setName("");
    setDescription("");
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/40 p-4">
        <View className="rounded-2xl bg-white p-5">
          <Text className="text-xl font-semibold text-zinc-900">Create Event</Text>

          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Event name"
            className="mt-4 rounded-xl border border-zinc-300 px-3 py-3 text-zinc-900"
          />

          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Description (optional)"
            className="mt-3 rounded-xl border border-zinc-300 px-3 py-3 text-zinc-900"
          />

          {error ? <Text className="mt-2 text-red-600">{error}</Text> : null}

          <View className="mt-5 flex-row justify-end gap-3">
            <Pressable onPress={onClose} className="rounded-lg px-3 py-2">
              <Text className="text-zinc-600">Cancel</Text>
            </Pressable>
            <Pressable
              onPress={() => void handleSubmit()}
              disabled={isSaving}
              className="rounded-lg bg-zinc-900 px-4 py-2"
            >
              <Text className="font-semibold text-white">{isSaving ? "Saving..." : "Create"}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
