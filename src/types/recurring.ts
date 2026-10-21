import type { ExpenseKind } from '@/types/expense';

export type RecurringInterval = 'weekly' | 'monthly';

export type RecurringRule = {
  id: string;
  title: string;
  /** Always stored in USD. */
  amount: number;
  category: string;
  kind: ExpenseKind;
  interval: RecurringInterval;
  /** ISO 8601 — next occurrence to materialize. */
  nextRunAt: string;
  notes?: string;
};

export type RecurringInput = Omit<RecurringRule, 'id' | 'nextRunAt'> & {
  nextRunAt?: string;
};
