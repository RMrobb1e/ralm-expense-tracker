import { useMemo } from "react";

import { mockExpenses } from "../data/mock-expenses";
import type { Expense } from "../types/expense.types";

type UseExpensesResult = {
  expenses: Expense[];
  total: number;
};

export function useExpenses(): UseExpensesResult {
  const total = useMemo(() => {
    return mockExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  }, []);

  return {
    expenses: mockExpenses,
    total,
  };
}
