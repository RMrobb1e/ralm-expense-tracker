import { useLayoutEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { RootStackParamList } from "@/app/navigation/types";
import { useDatabase } from "@/db/hooks/use-database";
import { AddExpenseForm } from "@/features/expenses/components/add-expense-form";
import { EventExpenseList } from "@/features/expenses/components/event-expense-list";
import { useEventDetail } from "@/features/events/hooks/use-event-detail";
import { addParticipantToEvent, removeParticipantFromEvent } from "@/db/client";

export function EventDetailScreen() {
  const navigation =
    useNavigation<
      NativeStackNavigationProp<RootStackParamList, "EventDetail">
    >();
  const route = useRoute<RouteProp<RootStackParamList, "EventDetail">>();
  const { eventId } = route.params;

  const { error: dbError, isInitializing, isReady } = useDatabase();
  const {
    event,
    expenses,
    participants,
    error,
    isLoading,
    addExpense,
    refresh,
  } = useEventDetail(eventId, isReady && !dbError);
  const [isSavingExpense, setIsSavingExpense] = useState(false);
  const [newParticipantName, setNewParticipantName] = useState("");

  useLayoutEffect(() => {
    navigation.setOptions({
      title: event?.name ?? "Event",
    });
  }, [event?.name, navigation]);

  const handleAddExpense = async (input: {
    payerName: string;
    amount: number;
    description: string;
  }) => {
    setIsSavingExpense(true);
    try {
      await addExpense(input);
    } finally {
      setIsSavingExpense(false);
    }
  };

  const handleAddParticipant = async () => {
    if (!newParticipantName.trim()) {
      Alert.alert("Error", "Please enter a participant name");
      return;
    }

    try {
      await addParticipantToEvent(eventId, newParticipantName);
      setNewParticipantName("");
      await refresh(); // Refresh the event data to include the new participant
    } catch (err) {
      Alert.alert("Error", "Failed to add participant");
      console.error("Failed to add participant:", err);
    }
  };

  const handleRemoveParticipant = async (
    participantId: string,
    participantName: string,
  ) => {
    Alert.alert(
      "Remove Participant",
      `Are you sure you want to remove ${participantName} from this event?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await removeParticipantFromEvent(participantId);
              await refresh(); // Refresh the event data to reflect the removal
            } catch (err) {
              Alert.alert("Error", "Failed to remove participant");
              console.error("Failed to remove participant:", err);
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView
      edges={["bottom", "left", "right"]}
      style={{ flex: 1, backgroundColor: "#fafafa" }}
    >
      <ScrollView
        style={{ flex: 1, paddingHorizontal: 20, paddingTop: 16 }}
        contentContainerStyle={{ paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        {isInitializing ? (
          <View className="items-center py-8">
            <ActivityIndicator />
            <Text className="mt-2 text-zinc-500">Initializing database...</Text>
          </View>
        ) : null}

        {dbError ? <Text className="text-red-700">{dbError}</Text> : null}

        {isLoading && isReady ? (
          <View className="items-center py-8">
            <ActivityIndicator />
          </View>
        ) : null}

        {error ? <Text className="text-red-700">{error}</Text> : null}

        {!isLoading && event ? (
          <>
            {event.description ? (
              <Text className="mb-4 text-zinc-600">{event.description}</Text>
            ) : null}

            {/* Participants Section */}
            <Text className="mb-2 text-lg font-semibold text-zinc-900">
              Participants
            </Text>
            <View className="mb-6 rounded-xl bg-white p-4 shadow-sm">
              {participants.length > 0 ? (
                <View className="mb-4">
                  {participants.map((participant) => (
                    <View
                      key={participant.id}
                      className="flex-row items-center justify-between py-2"
                    >
                      <Text className="text-zinc-900">{participant.name}</Text>
                      <Pressable
                        onPress={() =>
                          handleRemoveParticipant(
                            participant.id,
                            participant.name,
                          )
                        }
                        className="rounded-full bg-red-100 px-3 py-1"
                      >
                        <Text className="text-sm font-medium text-red-700">
                          Remove
                        </Text>
                      </Pressable>
                    </View>
                  ))}
                </View>
              ) : (
                <Text className="py-2 text-zinc-500">No participants yet</Text>
              )}

              <View className="flex-row items-center">
                <TextInput
                  className="flex-1 rounded-lg border border-zinc-300 p-3"
                  placeholder="Add participant..."
                  value={newParticipantName}
                  onChangeText={setNewParticipantName}
                />
                <Pressable
                  onPress={handleAddParticipant}
                  className="ml-2 rounded-lg bg-zinc-900 px-4 py-3"
                >
                  <Text className="font-medium text-white">Add</Text>
                </Pressable>
              </View>
            </View>

            <Text className="mb-2 text-lg font-semibold text-zinc-900">
              Expenses
            </Text>
            <EventExpenseList expenses={expenses} />

            <Pressable
              onPress={() => navigation.navigate("Settlement", { eventId })}
              className="mt-4 items-center rounded-xl bg-zinc-900 py-3"
            >
              <Text className="font-semibold text-white">View Settlement</Text>
            </Pressable>

            <View className="mt-6">
              <AddExpenseForm
                isSaving={isSavingExpense}
                onSubmit={handleAddExpense}
              />
            </View>
          </>
        ) : null}

        {!isLoading && !event && isReady && !error ? (
          <Text className="text-zinc-500">Event not found.</Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
