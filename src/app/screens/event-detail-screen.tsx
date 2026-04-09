import { useLayoutEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { RootStackParamList } from "@/app/navigation/types";
import { useDatabase } from "@/db/hooks/use-database";
import { AddExpenseForm } from "@/features/expenses/components/add-expense-form";
import { EventExpenseList } from "@/features/expenses/components/event-expense-list";
import { useEventDetail } from "@/features/events/hooks/use-event-detail";

export function EventDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, "EventDetail">>();
  const route = useRoute<RouteProp<RootStackParamList, "EventDetail">>();
  const { eventId } = route.params;

  const { error: dbError, isInitializing, isReady } = useDatabase();
  const { event, expenses, error, isLoading, addExpense } = useEventDetail(
    eventId,
    isReady && !dbError
  );
  const [isSavingExpense, setIsSavingExpense] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: event?.name ?? "Event",
    });
  }, [event?.name, navigation]);

  const handleAddExpense = async (input: { payerName: string; amount: number; description: string }) => {
    setIsSavingExpense(true);
    try {
      await addExpense(input);
    } finally {
      setIsSavingExpense(false);
    }
  };

  return (
    <SafeAreaView edges={["bottom", "left", "right"]} style={{ flex: 1, backgroundColor: "#fafafa" }}>
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

            <Text className="mb-2 text-lg font-semibold text-zinc-900">Expenses</Text>
            <EventExpenseList expenses={expenses} />

            <View className="mt-6">
              <AddExpenseForm isSaving={isSavingExpense} onSubmit={handleAddExpense} />
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
