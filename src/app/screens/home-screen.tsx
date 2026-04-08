import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useDatabase } from "@/db/hooks/use-database";
import { CreateEventModal } from "@/features/events/components/create-event-modal";
import { EventList } from "@/features/events/components/event-list";
import { useEvents } from "@/features/events/hooks/use-events";

export function HomeScreen() {
  const { error, isInitializing, isReady } = useDatabase();
  const { events, error: eventsError, isLoading, addEvent } = useEvents(isReady && !error);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSavingEvent, setIsSavingEvent] = useState(false);

  const handleCreateEvent = async (input: { name: string; description?: string }) => {
    setIsSavingEvent(true);
    try {
      await addEvent(input);
    } finally {
      setIsSavingEvent(false);
    }
  };

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={{ flex: 1, backgroundColor: "#fafafa" }}
      className="flex-1 bg-zinc-50"
    >
      <View style={{ flex: 1, padding: 20 }} className="flex-1 p-5">
        <Text className="text-2xl font-bold text-zinc-900">Expense Tracker</Text>
        <Text className="mt-1 text-zinc-600">Your events are stored in SQLite</Text>

        {isInitializing ? (
          <View className="mt-3 rounded-lg bg-amber-100 p-3">
            <Text className="text-amber-800">Initializing database...</Text>
          </View>
        ) : null}

        {error ? (
          <View className="mt-3 rounded-lg bg-red-100 p-3">
            <Text className="text-red-700">SQLite init issue: {error}</Text>
          </View>
        ) : null}

        {isReady && !error ? (
          <View className="mt-3 rounded-lg bg-emerald-100 p-3">
            <Text className="text-emerald-800">Database ready</Text>
          </View>
        ) : null}

        {eventsError ? <Text className="mt-3 text-red-700">Events error: {eventsError}</Text> : null}

        <View className="mt-4 flex-1">
          {isLoading ? <Text className="text-zinc-500">Loading events...</Text> : <EventList events={events} />}
        </View>

        <Pressable
          onPress={() => setIsModalVisible(true)}
          className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-zinc-900"
        >
          <Text className="text-3xl leading-none text-white">+</Text>
        </Pressable>
      </View>

      <CreateEventModal
        visible={isModalVisible}
        isSaving={isSavingEvent}
        onClose={() => setIsModalVisible(false)}
        onSubmit={handleCreateEvent}
      />
    </SafeAreaView>
  );
}
