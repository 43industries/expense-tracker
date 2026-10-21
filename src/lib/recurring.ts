import { useExpenseStore } from '@/store/expenses';
import { useRecurringStore } from '@/store/recurring';
import type { RecurringInterval } from '@/types/recurring';

function advanceDate(from: Date, interval: RecurringInterval): Date {
  if (interval === 'weekly') {
    return new Date(from.getTime() + 7 * 24 * 60 * 60 * 1000);
  }
  return new Date(
    from.getFullYear(),
    from.getMonth() + 1,
    from.getDate(),
    from.getHours(),
    from.getMinutes(),
    from.getSeconds(),
    from.getMilliseconds(),
  );
}

/** Creates expense entries for any recurring rules that are due. Local-only rules. */
export function materializeRecurring(now = new Date()) {
  const { rules, setNextRunAt } = useRecurringStore.getState();
  if (rules.length === 0) return;

  const { addExpense } = useExpenseStore.getState();

  for (const rule of rules) {
    let next = new Date(rule.nextRunAt);
    let guard = 0;
    while (next.getTime() <= now.getTime() && guard < 100) {
      addExpense({
        title: rule.title,
        amount: rule.amount,
        category: rule.category,
        kind: rule.kind,
        notes: rule.notes,
        date: next.toISOString(),
      });
      next = advanceDate(next, rule.interval);
      setNextRunAt(rule.id, next.toISOString());
      guard += 1;
    }
  }
}
