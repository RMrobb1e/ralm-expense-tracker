import { calculateSettlement } from "../calculate-settlement";
import type {
  SettlementExpense,
  SettlementUser,
} from "../calculate-settlement";
describe("calculateSettlement", () => {
  const users: SettlementUser[] = [
    { id: "A", name: "Alice" },
    { id: "B", name: "Bob" },
    { id: "C", name: "Charlie" },
    { id: "D", name: "David" },
  ];

  it("should return empty arrays when there are no expenses", () => {
    const result = calculateSettlement([], users);
    expect(result.traditional).toEqual([]);
    expect(result.simplified).toEqual([]);
  });

  it("should handle a simple equal split among all users", () => {
    const expenses: SettlementExpense[] = [
      { id: "1", payerId: "A", amount: 120 }, // Default splits among A, B, C, D (₱30 each)
    ];

    const result = calculateSettlement(expenses, users);

    expect(result.traditional).toEqual(
      expect.arrayContaining([
        { from: "B", to: "A", amount: 30 },
        { from: "C", to: "A", amount: 30 },
        { from: "D", to: "A", amount: 30 },
      ]),
    );
    expect(result.simplified).toEqual(
      expect.arrayContaining([
        { from: "B", to: "A", amount: 30 },
        { from: "C", to: "A", amount: 30 },
        { from: "D", to: "A", amount: 30 },
      ]),
    );
  });

  it("should handle indivisible decimals (e.g., ₱10 split 3 ways)", () => {
    // ₱10 / 3 = 3.3333...
    // To avoid creating or destroying money, 1 cent must be given to someone.
    // The algorithm distributes the remainder to the first participant in the array.
    const expenses: SettlementExpense[] = [
      { id: "1", payerId: "A", amount: 10, splitAmong: ["A", "B", "C"] },
    ];

    const result = calculateSettlement(expenses, users);

    // Total pool is 1000 cents. Base share is 333 cents. Remainder is 1 cent.
    // Participant A gets 334 cents. Participant B gets 333 cents. Participant C gets 333 cents.
    expect(result.traditional).toEqual(
      expect.arrayContaining([
        { from: "B", to: "A", amount: 3.33 },
        { from: "C", to: "A", amount: 3.33 },
      ]),
    );

    // Since A paid ₱10 and their share is ₱3.34, they are owed ₱6.66 exactly.
    const totalOwedToA = result.simplified
      .filter((t) => t.to === "A")
      .reduce((sum, t) => sum + t.amount, 0);

    expect(totalOwedToA).toBe(6.66);
  });

  it("should handle complex overlapping decimals and minimize transactions", () => {
    const expenses: SettlementExpense[] = [
      { id: "1", payerId: "A", amount: 33.33, splitAmong: ["A", "B", "C"] }, // ₱11.11 each
      { id: "2", payerId: "B", amount: 10.0, splitAmong: ["A", "B"] }, // ₱5.00 each
    ];

    const result = calculateSettlement(expenses, users);

    /*
     Net Balances:
     A: Paid 33.33. Share is 11.11 + 5.00 = 16.11. Net: +17.22
     B: Paid 10.00. Share is 11.11 + 5.00 = 16.11. Net: -6.11
     C: Paid 0.00. Share is 11.11. Net: -11.11
     Check: 17.22 - 6.11 - 11.11 = 0.
    */

    expect(result.simplified).toEqual(
      expect.arrayContaining([
        { from: "C", to: "A", amount: 11.11 },
        { from: "B", to: "A", amount: 6.11 },
      ]),
    );
  });

  it("should handle a payer paying for someone else entirely (payer not in split)", () => {
    const expenses: SettlementExpense[] = [
      { id: "1", payerId: "A", amount: 50, splitAmong: ["B", "C"] }, // ₱25 each for B and C
    ];

    const result = calculateSettlement(expenses, users);

    expect(result.traditional).toEqual(
      expect.arrayContaining([
        { from: "B", to: "A", amount: 25 },
        { from: "C", to: "A", amount: 25 },
      ]),
    );
    expect(result.simplified).toEqual(result.traditional);
  });

  it("should handle someone paying entirely for themselves", () => {
    const expenses: SettlementExpense[] = [
      { id: "1", payerId: "A", amount: 100, splitAmong: ["A"] },
    ];

    const result = calculateSettlement(expenses, users);

    // No one owes anyone anything
    expect(result.traditional).toEqual([]);
    expect(result.simplified).toEqual([]);
  });

  it("should round amounts with more than 2 decimal places to the nearest cent", () => {
    // Real world scenario where a frontend might send an unrounded JS float
    const expenses: SettlementExpense[] = [
      { id: "1", payerId: "A", amount: 10.006, splitAmong: ["A", "B"] }, // Should round to 10.01
    ];

    const result = calculateSettlement(expenses, users);

    // 1001 cents. Base: 500 cents. Remainder: 1 cent.
    // A gets 501 cents. B gets 500 cents.
    expect(result.traditional).toEqual([{ from: "B", to: "A", amount: 5.0 }]);
  });

  it("should handle circular debts correctly (Greedy resolution)", () => {
    const expenses: SettlementExpense[] = [
      { id: "1", payerId: "A", amount: 10, splitAmong: ["B"] }, // B owes A 10
      { id: "2", payerId: "B", amount: 10, splitAmong: ["C"] }, // C owes B 10
      { id: "3", payerId: "C", amount: 10, splitAmong: ["A"] }, // A owes C 10
    ];

    const result = calculateSettlement(expenses, users);

    // Traditional shows the explicit debts
    expect(result.traditional).toEqual(
      expect.arrayContaining([
        { from: "B", to: "A", amount: 10 },
        { from: "C", to: "B", amount: 10 },
        { from: "A", to: "C", amount: 10 },
      ]),
    );

    // Simplified should recognize that net balances are all 0, so no transactions are needed
    expect(result.simplified).toEqual([]);
  });
});
