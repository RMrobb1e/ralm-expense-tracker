export type EventExpenseListItem = {
  id: string;
  description: string;
  amount: number;
  currency: string;
  payerName: string | null;
  incurredAt: string;
};

export type AddExpenseFormInput = {
  payerName: string;
  amount: number;
  description: string;
};
