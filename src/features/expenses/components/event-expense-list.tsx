import { FlatList, Text, View } from "react-native";

import type { EventExpenseListItem } from "@/features/expenses/types/event-expense.types";

type EventExpenseListProps = {
  expenses: EventExpenseListItem[];
};

export function EventExpenseList({ expenses }: EventExpenseListProps) {
  if (!expenses.length) {
    return (
      <View className="mt-2 rounded-xl border border-dashed border-zinc-300 bg-white p-4">
        <Text className="text-center text-zinc-500">No expenses yet. Add one below.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={expenses}
      scrollEnabled={false}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ gap: 8 }}
      renderItem={({ item }) => (
        <View className="rounded-xl border border-zinc-200 bg-white p-4">
          <Text className="text-base font-semibold text-zinc-900">{item.description}</Text>
          <Text className="mt-1 text-sm text-zinc-600">
            Paid by {item.payerName ?? "Unknown"}
          </Text>
          <Text className="mt-2 text-right text-lg font-bold text-zinc-900">
            {item.currency} {item.amount.toFixed(2)}
          </Text>
        </View>
      )}
    />
  );
}
