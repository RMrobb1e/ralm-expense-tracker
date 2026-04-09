import { useRef } from "react";
import { Pressable, Text, View } from "react-native";
import { FlatList } from "react-native";
import { Swipeable } from "react-native-gesture-handler";

import type { EventItem } from "@/features/events/types/event.types";

type EventListProps = {
  events: EventItem[];
  onEdit: (event: EventItem) => void;
  onDelete: (event: EventItem) => void;
};

export function EventList({ events, onEdit, onDelete }: EventListProps) {
  const swipeableRefs = useRef<Record<string, Swipeable | null>>({});

  const closeRow = (eventId: string) => {
    swipeableRefs.current[eventId]?.close();
  };

  if (!events.length) {
    return (
      <View className="mt-4 rounded-xl border border-dashed border-zinc-300 bg-white p-4">
        <Text className="text-zinc-600">No events yet. Tap + to create your first event.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={events}
      keyExtractor={(item) => item.id}
      contentContainerClassName="gap-3 pb-24"
      renderItem={({ item }) => (
        <Swipeable
          ref={(ref) => {
            swipeableRefs.current[item.id] = ref;
          }}
          overshootRight={false}
          renderRightActions={() => (
            <View className="ml-3 flex-row items-center gap-2">
              <Pressable
                onPress={() => {
                  closeRow(item.id);
                  onEdit(item);
                }}
                className="h-16 w-20 items-center justify-center rounded-xl bg-blue-600"
              >
                <Text className="font-semibold text-white">Edit</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  closeRow(item.id);
                  onDelete(item);
                }}
                className="h-16 w-20 items-center justify-center rounded-xl bg-red-600"
              >
                <Text className="font-semibold text-white">Delete</Text>
              </Pressable>
            </View>
          )}
        >
          <View className="rounded-xl border border-zinc-200 bg-white p-4">
            <Text className="text-lg font-semibold text-zinc-900">{item.name}</Text>
            {item.description ? <Text className="mt-1 text-zinc-600">{item.description}</Text> : null}
            <Text className="mt-2 text-xs text-zinc-500">
              Start: {new Date(item.startDate).toLocaleDateString()}
            </Text>
          </View>
        </Swipeable>
      )}
    />
  );
}
