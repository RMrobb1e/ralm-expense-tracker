import { FlatList, Text, View } from "react-native";

import type { Expense } from "../types/expense.types";

type ExpenseListProps = {
  expenses: Expense[];
};

export function ExpenseList({ expenses }: ExpenseListProps) {
  return (
    <FlatList
      data={expenses}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ gap: 12 }}
      renderItem={({ item }) => (
        <View className="p-4 bg-white border rounded-xl border-zinc-200">
          <Text className="text-base font-semibold text-zinc-900">
            {item.title}
          </Text>
          <Text className="mt-1 text-zinc-600">{item.category}</Text>
          <Text className="mt-2 text-lg font-bold text-right text-zinc-900">
            ₱{item.amount.toFixed(2)}
          </Text>
        </View>
      )}
    />
  );
}
