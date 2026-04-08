import type { Expense } from "../types/expense.types";

export const mockExpenses: Expense[] = [
  {
    id: "1",
    title: "Coffee beans",
    amount: 14.99,
    category: "food",
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    title: "Bus card reload",
    amount: 25.0,
    category: "transport",
    createdAt: new Date().toISOString(),
  },
];
