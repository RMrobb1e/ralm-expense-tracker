import { useCallback, useEffect, useMemo, useState } from "react";

import { listExpensesForEvent, listParticipantsForEvent } from "@/db/client";
import type {
  SettlementExpense,
  SettlementUser,
  SettlementResult,
} from "@/features/expenses/utils/calculate-settlement";
import { calculateSettlement } from "@/features/expenses/utils/calculate-settlement";

type UseSettlementResult = {
  settlement: SettlementResult | null;
  participants: SettlementUser[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

export function useSettlement(
  eventId: string,
  enabled: boolean,
): UseSettlementResult {
  const [participants, setParticipants] = useState<SettlementUser[]>([]);
  const [expenses, setExpenses] = useState<SettlementExpense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const [participantRows, expenseRows] = await Promise.all([
        listParticipantsForEvent(eventId),
        listExpensesForEvent(eventId),
      ]);

      const users: SettlementUser[] = participantRows.map((p) => ({
        id: p.id,
        name: p.name,
      }));

      const settlementExpenses: SettlementExpense[] = expenseRows
        .filter((e) => e.payerName !== null)
        .map((e) => {
          const payer = participantRows.find(
            (p) => p.name.toLowerCase() === e.payerName!.toLowerCase(),
          );
          return {
            id: e.id,
            payerId: payer?.id ?? "",
            amount: e.amount,
            // Split among all participants in the event by default
            splitAmong: users.map((u) => u.id),
          };
        })
        .filter((e) => e.payerId !== "");

      setParticipants(users);
      setExpenses(settlementExpenses);
    } catch (loadError: unknown) {
      const message =
        loadError instanceof Error
          ? loadError.message
          : "Failed to load settlement data";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    if (!enabled || !eventId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    void refresh();
  }, [enabled, eventId, refresh]);

  const settlement = useMemo(
    () =>
      participants.length > 0
        ? calculateSettlement(expenses, participants)
        : null,
    [expenses, participants],
  );

  return { settlement, participants, isLoading, error, refresh };
}
