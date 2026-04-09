import type { EntityId } from "../../../db/types";

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

/**
 * An expense paid by one participant and split among a set of participants.
 * If `splitAmong` is omitted the expense is split equally among *all* users.
 */
export type SettlementExpense = {
  id: EntityId;
  payerId: EntityId;
  amount: number;
  /** IDs of participants who share this expense. Defaults to all users. */
  splitAmong?: EntityId[];
};

export type SettlementUser = {
  id: EntityId;
  name: string;
};

// ---------------------------------------------------------------------------
// Output types
// ---------------------------------------------------------------------------

/** A single directional balance: `from` owes `to` the given `amount`. */
export type Balance = {
  from: EntityId;
  to: EntityId;
  amount: number;
};

export type SettlementResult = {
  /** Per-expense balances: who owes whom for each individual expense. */
  traditional: Balance[];
  /** Minimised set of transactions that settles all debts. */
  simplified: Balance[];
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Compute the net balance in cents (amount owed minus amount owed to) for every user.
 * Positive means the user is owed money. Negative means the user owes money.
 */
function computeNetBalances(
  expenses: SettlementExpense[],
  userIds: EntityId[],
): Map<EntityId, number> {
  const net = new Map<EntityId, number>(userIds.map((id) => [id, 0]));

  for (const expense of expenses) {
    const splitAmong = expense.splitAmong?.length
      ? expense.splitAmong
      : userIds;

    // Convert to cents to avoid floating-point drift
    const totalCents = Math.round(expense.amount * 100);
    const baseShareCents = Math.floor(totalCents / splitAmong.length);
    let remainderCents = totalCents % splitAmong.length;

    // Payer gets credit for the full amount they paid
    const prevPayer = net.get(expense.payerId) ?? 0;
    net.set(expense.payerId, prevPayer + totalCents);

    // Each person in the split owes their share (deducted from net)
    for (const participantId of splitAmong) {
      const prev = net.get(participantId) ?? 0;

      // Distribute remainder pennies one by one to balance the ledger exactly
      const shareCents = baseShareCents + (remainderCents > 0 ? 1 : 0);
      remainderCents--;

      net.set(participantId, prev - shareCents);
    }
  }

  return net;
}

/**
 * Greedy settlement algorithm. Repeatedly settles the largest creditor with
 * the largest debtor until all balances are zero. Operates strictly in cents.
 */
function greedySettle(netBalancesCents: Map<EntityId, number>): Balance[] {
  const balances: Balance[] = [];

  const creditors = new Map<EntityId, number>();
  const debtors = new Map<EntityId, number>();

  // Separate the balances into debtors and creditors
  for (const [id, balance] of netBalancesCents) {
    if (balance > 0) creditors.set(id, balance);
    else if (balance < 0) debtors.set(id, -balance);
  }

  while (creditors.size > 0 && debtors.size > 0) {
    // Find the largest creditor
    let maxCreditorId: EntityId | null = null;
    let maxCredit = 0;
    for (const [id, amount] of creditors) {
      if (amount > maxCredit) {
        maxCredit = amount;
        maxCreditorId = id;
      }
    }

    // Find the largest debtor
    let maxDebtorId: EntityId | null = null;
    let maxDebit = 0;
    for (const [id, amount] of debtors) {
      if (amount > maxDebit) {
        maxDebit = amount;
        maxDebtorId = id;
      }
    }

    if (maxCreditorId === null || maxDebtorId === null) break;

    // Match and settle
    const settledCents = Math.min(maxCredit, maxDebit);
    balances.push({
      from: maxDebtorId,
      to: maxCreditorId,
      amount: settledCents / 100, // Convert back to dollars
    });

    // Update remaining amounts
    const newCredit = maxCredit - settledCents;
    const newDebit = maxDebit - settledCents;

    if (newCredit === 0) creditors.delete(maxCreditorId);
    else creditors.set(maxCreditorId, newCredit);

    if (newDebit === 0) debtors.delete(maxDebtorId);
    else debtors.set(maxDebtorId, newDebit);
  }

  return balances;
}

// ---------------------------------------------------------------------------
// Main function
// ---------------------------------------------------------------------------

/**
 * Calculate settlement balances for a set of expenses shared among users.
 *
 * @param expenses  List of expenses with payer and (optional) split info.
 * @param users     List of participants involved.
 * @returns An object containing traditional and simplified balances.
 */
export function calculateSettlement(
  expenses: SettlementExpense[],
  users: SettlementUser[],
): SettlementResult {
  const userIds = users.map((u) => u.id);

  // Traditional balances
  const traditional: Balance[] = [];

  for (const expense of expenses) {
    const splitAmong = expense.splitAmong?.length
      ? expense.splitAmong
      : userIds;

    // Compute exact share per user in cents for this expense
    const totalCents = Math.round(expense.amount * 100);
    const baseShareCents = Math.floor(totalCents / splitAmong.length);
    let remainderCents = totalCents % splitAmong.length;

    for (const participantId of splitAmong) {
      const shareCents = baseShareCents + (remainderCents > 0 ? 1 : 0);
      remainderCents--;

      if (participantId === expense.payerId) continue;

      if (shareCents > 0) {
        traditional.push({
          from: participantId,
          to: expense.payerId,
          amount: shareCents / 100, // Convert back to dollars
        });
      }
    }
  }

  // Simplified balances
  const netBalancesCents = computeNetBalances(expenses, userIds);
  const simplified = greedySettle(netBalancesCents);

  return { traditional, simplified };
}
