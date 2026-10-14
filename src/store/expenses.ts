import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { createId } from '@/lib/format';
import type { Expense, ExpenseInput } from '@/types/expense';

type ExpenseState = {
  expenses: Expense[];
  hydrated: boolean;
  addExpense: (input: ExpenseInput) => void;
  updateExpense: (id: string, input: ExpenseInput) => void;
  removeExpense: (id: string) => void;
};

export const useExpenseStore = create<ExpenseState>()(
  persist(
    (set) => ({
      expenses: [],
      hydrated: false,
      addExpense: (input) =>
        set((s) => ({
          expenses: [{ ...input, id: createId(), date: new Date().toISOString() }, ...s.expenses],
        })),
      updateExpense: (id, input) =>
        set((s) => ({
          expenses: s.expenses.map((e) => (e.id === id ? { ...e, ...input } : e)),
        })),
      removeExpense: (id) => set((s) => ({ expenses: s.expenses.filter((e) => e.id !== id) })),
    }),
    {
      name: 'expense-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ expenses: s.expenses }),
      onRehydrateStorage: () => () => useExpenseStore.setState({ hydrated: true }),
    },
  ),
);
