import { useEffect, useState } from "react";
import { SafeAreaView, Text, View } from "react-native";

import { initializeDatabase } from "@/db/client";
import { ExpenseList } from "@/features/expenses/components/expense-list";
import { useExpenses } from "@/features/expenses/hooks/use-expenses";

export function HomeScreen() {
  const { expenses, total } = useExpenses();
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    void initializeDatabase().catch((error: unknown) => {
      const message = error instanceof Error ? error.message : "Failed to initialize database";
      setDbError(message);
    });
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fafafa" }} className="flex-1 bg-zinc-50">
      <View style={{ flex: 1, padding: 20 }} className="flex-1 p-5">
        <Text className="text-2xl font-bold text-zinc-900">Expense Tracker</Text>
        <Text className="mt-1 text-zinc-600">Feature-first Expo setup with SQLite + NativeWind</Text>

        {dbError ? (
          <View className="mt-3 rounded-lg bg-red-100 p-3">
            <Text className="text-red-700">SQLite init issue: {dbError}</Text>
          </View>
        ) : null}

        <View className="my-5 rounded-2xl bg-zinc-900 p-4">
          <Text className="text-zinc-300">Total (mock)</Text>
          <Text className="mt-1 text-3xl font-bold text-white">${total.toFixed(2)}</Text>
        </View>

        <ExpenseList expenses={expenses} />
      </View>
    </SafeAreaView>
  );
}
