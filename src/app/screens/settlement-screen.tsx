import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";

import type { RootStackParamList } from "@/app/navigation/types";
import { useDatabase } from "@/db/hooks/use-database";
import { useSettlement } from "@/features/expenses/hooks/use-settlement";
import type { Balance } from "@/features/expenses/utils/calculate-settlement";

type SettlementView = "simplified" | "traditional";

export function SettlementScreen() {
  const navigation =
    useNavigation<
      NativeStackNavigationProp<RootStackParamList, "Settlement">
    >();
  const route = useRoute<RouteProp<RootStackParamList, "Settlement">>();
  const { eventId } = route.params;

  const { error: dbError, isReady } = useDatabase();
  const { settlement, participants, isLoading, error } = useSettlement(
    eventId,
    isReady && !dbError,
  );

  const [view, setView] = useState<SettlementView>("simplified");

  const balances =
    view === "simplified" ? settlement?.simplified : settlement?.traditional;

  // Build a name lookup map
  const nameById = new Map(participants.map((p) => [p.id, p.name]));

  const getName = (id: string): string => nameById.get(id) ?? id;

  const emptyStateMessage =
    settlement === null
      ? "Add participants and expenses to see settlements."
      : "All settled up! No balances to display.";

  const infoBannerText =
    view === "simplified"
      ? "Minimized transactions to settle all debts using a greedy algorithm."
      : "Per-expense breakdown showing who owes whom for each individual expense.";

  const summaryLabel = view === "simplified" ? "Transactions" : "Balances";

  let balanceContent = null;
  if (!isLoading && balances) {
    if (balances.length === 0) {
      balanceContent = (
        <View className="p-6 mt-2 bg-white border border-dashed rounded-xl border-zinc-300">
          <Text className="text-center text-zinc-500">{emptyStateMessage}</Text>
        </View>
      );
    } else {
      balanceContent = (
        <View style={{ gap: 10 }}>
          {balances.map((balance: Balance, index: number) => (
            <View
              key={`${balance.from}-${balance.to}-${index}`}
              className="p-4 bg-white border rounded-xl border-zinc-200"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <View className="flex-row items-center gap-2">
                    <View className="items-center justify-center w-8 h-8 rounded-full bg-amber-100">
                      <Text className="text-sm font-bold text-amber-700">
                        {getName(balance.from).charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-zinc-900">
                        {getName(balance.from)}
                      </Text>
                      <Text className="text-xs text-zinc-500">pays</Text>
                    </View>
                  </View>
                </View>

                <View className="items-center px-3">
                  <Text className="text-lg font-bold text-zinc-900">
                    ${balance.amount.toFixed(2)}
                  </Text>
                  <View className="mt-0.5 h-0.5 w-8 bg-zinc-300" />
                </View>

                <View className="items-end flex-1">
                  <View className="flex-row items-center gap-2">
                    <View className="items-end flex-1">
                      <Text className="text-sm font-semibold text-zinc-900">
                        {getName(balance.to)}
                      </Text>
                      <Text className="text-xs text-zinc-500">receives</Text>
                    </View>
                    <View className="items-center justify-center w-8 h-8 rounded-full bg-emerald-100">
                      <Text className="text-sm font-bold text-emerald-700">
                        {getName(balance.to).charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          ))}

          {/* Summary */}
          <View className="p-4 mt-2 rounded-xl bg-zinc-900">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-zinc-400">{summaryLabel}</Text>
              <Text className="text-2xl font-bold text-white">
                {balances.length}
              </Text>
            </View>
            <View className="flex-row items-center justify-between mt-2">
              <Text className="text-sm text-zinc-400">Total owed</Text>
              <Text className="text-lg font-semibold text-emerald-400">
                ${balances.reduce((sum, b) => sum + b.amount, 0).toFixed(2)}
              </Text>
            </View>
          </View>
        </View>
      );
    }
  }

  return (
    <SafeAreaView
      edges={["bottom", "left", "right"]}
      style={{ flex: 1, backgroundColor: "#fafafa" }}
    >
      <ScrollView
        style={{ flex: 1, paddingHorizontal: 20, paddingTop: 16 }}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* Toggle */}
        <View className="flex-row p-1 mb-4 rounded-xl bg-zinc-200">
          <Pressable
            onPress={() => setView("simplified")}
            className={`flex-1 items-center rounded-lg py-2.5 ${
              view === "simplified" ? "bg-white shadow-sm" : ""
            }`}
          >
            <Text
              className={`text-sm font-semibold ${
                view === "simplified" ? "text-zinc-900" : "text-zinc-500"
              }`}
            >
              Simplified
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setView("traditional")}
            className={`flex-1 items-center rounded-lg py-2.5 ${
              view === "traditional" ? "bg-white shadow-sm" : ""
            }`}
          >
            <Text
              className={`text-sm font-semibold ${
                view === "traditional" ? "text-zinc-900" : "text-zinc-500"
              }`}
            >
              Traditional
            </Text>
          </Pressable>
        </View>

        {/* Info banner */}
        <View className="p-3 mb-4 rounded-xl bg-zinc-100">
          <Text className="text-xs text-zinc-600">{infoBannerText}</Text>
        </View>

        {/* Loading */}
        {isLoading ? (
          <View className="items-center py-8">
            <ActivityIndicator />
            <Text className="mt-2 text-zinc-500">
              Calculating settlements...
            </Text>
          </View>
        ) : null}

        {/* Error */}
        {error || dbError ? (
          <View className="p-3 bg-red-100 rounded-xl">
            <Text className="text-red-700">{error ?? dbError}</Text>
          </View>
        ) : null}

        {/* Balance cards */}
        {balanceContent}
      </ScrollView>
    </SafeAreaView>
  );
}
