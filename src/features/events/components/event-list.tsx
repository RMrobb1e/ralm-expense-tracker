import { FlatList, Text, View } from "react-native";

import type { EventItem } from "@/features/events/types/event.types";

type EventListProps = {
  events: EventItem[];
};

export function EventList({ events }: EventListProps) {
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
        <View className="rounded-xl border border-zinc-200 bg-white p-4">
          <Text className="text-lg font-semibold text-zinc-900">{item.name}</Text>
          {item.description ? <Text className="mt-1 text-zinc-600">{item.description}</Text> : null}
          <Text className="mt-2 text-xs text-zinc-500">Start: {new Date(item.startDate).toLocaleDateString()}</Text>
        </View>
      )}
    />
  );
}
