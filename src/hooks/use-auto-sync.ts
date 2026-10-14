import { useEffect } from 'react';
import { AppState } from 'react-native';

import { syncExpenses } from '@/lib/sync';
import { useAuthStore } from '@/store/auth';
import { useExpenseStore } from '@/store/expenses';

const DEBOUNCE_MS = 1500;

/** Syncs on login, shortly after local changes, and whenever the app returns to the foreground. */
export function useAutoSync() {
  const userId = useAuthStore((s) => s.session?.user.id);
  const hydrated = useExpenseStore((s) => s.hydrated);

  useEffect(() => {
    if (!userId || !hydrated) return;

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
  }, [userId, hydrated]);
}
