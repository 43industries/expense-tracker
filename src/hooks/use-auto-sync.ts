import { useEffect } from 'react';
import { AppState } from 'react-native';

import { materializeRecurring } from '@/lib/recurring';
import { syncExpenses } from '@/lib/sync';
import { useAuthStore } from '@/store/auth';
import { useExpenseStore } from '@/store/expenses';
import { useRecurringStore } from '@/store/recurring';

const DEBOUNCE_MS = 1500;

/** Materializes due recurring rules, then syncs when signed in. */
export function useAutoSync() {
  const userId = useAuthStore((s) => s.session?.user.id);
  const expenseHydrated = useExpenseStore((s) => s.hydrated);
  const recurringHydrated = useRecurringStore((s) => s.hydrated);

  useEffect(() => {
    if (!expenseHydrated || !recurringHydrated) return;

    materializeRecurring();

    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') materializeRecurring();
    });

    return () => appState.remove();
  }, [expenseHydrated, recurringHydrated]);

  useEffect(() => {
    if (!userId || !expenseHydrated) return;

    syncExpenses();

    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = useExpenseStore.subscribe((s, prev) => {
      const changed = s.dirty !== prev.dirty || s.deleted !== prev.deleted;
      if (changed && (s.dirty.length > 0 || s.deleted.length > 0)) {
        clearTimeout(timer);
        timer = setTimeout(syncExpenses, DEBOUNCE_MS);
      }
    });
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') syncExpenses();
    });

    return () => {
      clearTimeout(timer);
      unsubscribe();
      appState.remove();
    };
  }, [userId, expenseHydrated]);
}
