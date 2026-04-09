import { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";

import type { RootStackParamList } from "@/app/navigation/types";

import { useDatabase } from "@/db/hooks/use-database";
import { CreateEventModal } from "@/features/events/components/create-event-modal";
import { EventList } from "@/features/events/components/event-list";
import { useEvents } from "@/features/events/hooks/use-events";
import type { CreateEventInput, EventItem } from "@/features/events/types/event.types";

export function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, "Home">>();
  const { error, isInitializing, isReady } = useDatabase();
  const { events, error: eventsError, isLoading, addEvent, editEvent, removeEvent } = useEvents(
    isReady && !error
  );
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSavingEvent, setIsSavingEvent] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);

  const openCreateModal = () => {
    setModalMode("create");
    setSelectedEvent(null);
    setIsModalVisible(true);
  };

  const openEditModal = (event: EventItem) => {
    setModalMode("edit");
    setSelectedEvent(event);
    setIsModalVisible(true);
  };

  const handleSubmitEvent = async (input: CreateEventInput) => {
    setIsSavingEvent(true);
    try {
      if (modalMode === "edit" && selectedEvent) {
        await editEvent({
          id: selectedEvent.id,
          ...input,
          name: input.name,
        });
        return;
      }
      await addEvent(input);
    } finally {
      setIsSavingEvent(false);
    }
  };

  const handleDeleteEvent = (event: EventItem) => {
    Alert.alert("Delete event", `Delete "${event.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          void removeEvent(event.id);
        },
      },
    ]);
  };

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={{ flex: 1, backgroundColor: "#fafafa" }}>
      <View style={{ flex: 1, padding: 20 }}>
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
          {isLoading ? (
            <Text className="text-zinc-500">Loading events...</Text>
          ) : (
            <EventList
              events={events}
              onOpenEvent={(event) => navigation.navigate("EventDetail", { eventId: event.id })}
              onEdit={openEditModal}
              onDelete={handleDeleteEvent}
            />
          )}
        </View>

        <Pressable
          onPress={openCreateModal}
          className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-zinc-900"
        >
          <Text className="text-3xl leading-none text-white">+</Text>
        </Pressable>
      </View>

      <CreateEventModal
        visible={isModalVisible}
        isSaving={isSavingEvent}
        mode={modalMode}
        initialEvent={selectedEvent}
        onClose={() => setIsModalVisible(false)}
        onSubmit={handleSubmitEvent}
      />
    </SafeAreaView>
  );
}
