import type { Expense } from '@/types/expense';

/** e.g. "2026-10" */
export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function monthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-GB', { month: 'short' });
}

export function shiftMonth(key: string, delta: number): string {
  const [y, m] = key.split('-').map(Number);
  return monthKey(new Date(y, m - 1 + delta, 1));
}

function isExpense(e: Expense): boolean {
  return (e.kind ?? 'expense') !== 'income';
}

export function spentInMonth(expenses: Expense[], key: string): number {
  return expenses
    .filter((e) => isExpense(e) && monthKey(new Date(e.date)) === key)
    .reduce((sum, e) => sum + e.amount, 0);
}

export function incomeInMonth(expenses: Expense[], key: string): number {
  return expenses
    .filter((e) => (e.kind ?? 'expense') === 'income' && monthKey(new Date(e.date)) === key)
    .reduce((sum, e) => sum + e.amount, 0);
}

/** Totals for the last `count` months, oldest first, including months with no spending. */
export function monthlyTotals(
  expenses: Expense[],
  count = 6,
  now = new Date(),
): { key: string; total: number }[] {
  const totals = new Map<string, number>();
  for (let i = count - 1; i >= 0; i--) {
    totals.set(monthKey(new Date(now.getFullYear(), now.getMonth() - i, 1)), 0);
  }
  for (const e of expenses) {
    if (!isExpense(e)) continue;
    const key = monthKey(new Date(e.date));
    if (totals.has(key)) totals.set(key, totals.get(key)! + e.amount);
  }
  return [...totals].map(([key, total]) => ({ key, total }));
}

export function categoryTotals(
  expenses: Expense[],
  key: string,
): { category: string; total: number }[] {
  const totals = new Map<string, number>();
  for (const e of expenses) {
    if (!isExpense(e) || monthKey(new Date(e.date)) !== key) continue;
    totals.set(e.category, (totals.get(e.category) ?? 0) + e.amount);
  }
  return [...totals]
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);
}
