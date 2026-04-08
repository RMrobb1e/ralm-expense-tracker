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
      contentContainerClassName="gap-3"
      renderItem={({ item }) => (
        <View className="rounded-xl border border-zinc-200 bg-white p-4">
          <Text className="text-base font-semibold text-zinc-900">{item.title}</Text>
          <Text className="mt-1 text-zinc-600">{item.category}</Text>
          <Text className="mt-2 text-right text-lg font-bold text-zinc-900">
            ${item.amount.toFixed(2)}
          </Text>
        </View>
      )}
    />
  );
}
