import { useCallback, useEffect, useState } from "react";

import {
  addExpenseToEvent,
  getEventById,
  listExpensesForEvent,
} from "@/db/client";
import type { AddExpenseFormInput, EventExpenseListItem } from "@/features/expenses/types/event-expense.types";
import type { EventItem } from "@/features/events/types/event.types";

type UseEventDetailResult = {
  event: EventItem | null;
  expenses: EventExpenseListItem[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addExpense: (input: AddExpenseFormInput) => Promise<void>;
};

export function useEventDetail(eventId: string, enabled: boolean): UseEventDetailResult {
  const [event, setEvent] = useState<EventItem | null>(null);
  const [expenses, setExpenses] = useState<EventExpenseListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const [eventRow, expenseRows] = await Promise.all([
        getEventById(eventId),
        listExpensesForEvent(eventId),
      ]);
      setEvent(eventRow);
      setExpenses(expenseRows);
    } catch (loadError: unknown) {
      const message = loadError instanceof Error ? loadError.message : "Failed to load event";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  const addExpense = useCallback(
    async (input: AddExpenseFormInput) => {
      await addExpenseToEvent({
        eventId,
        payerName: input.payerName,
        amount: input.amount,
        description: input.description,
      });
      await refresh();
    },
    [eventId, refresh]
  );

  useEffect(() => {
    if (!enabled || !eventId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    void refresh();
  }, [enabled, eventId, refresh]);

  return {
    event,
    expenses,
    isLoading,
    error,
    refresh,
    addExpense,
  };
}
