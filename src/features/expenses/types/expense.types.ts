export type ExpenseCategory = "food" | "transport" | "utilities" | "health" | "other";

export type Expense = {
  id: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  createdAt: string;
};
