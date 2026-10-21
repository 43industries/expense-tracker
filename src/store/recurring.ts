import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { createId } from '@/lib/format';
import type { RecurringInput, RecurringRule } from '@/types/recurring';

type RecurringState = {
  rules: RecurringRule[];
  hydrated: boolean;
  addRule: (input: RecurringInput) => void;
  removeRule: (id: string) => void;
  setNextRunAt: (id: string, nextRunAt: string) => void;
};

export const useRecurringStore = create<RecurringState>()(
  persist(
    (set) => ({
      rules: [],
      hydrated: false,
      addRule: (input) => {
        const rule: RecurringRule = {
          ...input,
          id: createId(),
          notes: input.notes?.trim() || undefined,
          nextRunAt: input.nextRunAt ?? new Date().toISOString(),
        };
        set((s) => ({ rules: [rule, ...s.rules] }));
      },
      removeRule: (id) => set((s) => ({ rules: s.rules.filter((r) => r.id !== id) })),
      setNextRunAt: (id, nextRunAt) =>
        set((s) => ({
          rules: s.rules.map((r) => (r.id === id ? { ...r, nextRunAt } : r)),
        })),
    }),
    {
      name: 'recurring-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ rules: s.rules }),
      onRehydrateStorage: () => () => useRecurringStore.setState({ hydrated: true }),
    },
  ),
);
