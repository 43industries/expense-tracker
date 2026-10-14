import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { createId } from '@/lib/format';
import type { Expense, ExpenseInput } from '@/types/expense';

type Deleted = { id: string; receiptPath?: string };

type ExpenseState = {
  expenses: Expense[];
  hydrated: boolean;
  /** Ids changed locally that still need to be uploaded. */
  dirty: string[];
  /** Expenses deleted locally that still need to be deleted in the cloud. */
  deleted: Deleted[];
  lastSyncedAt: string | null;
  syncing: boolean;
  syncError: string | null;

  addExpense: (input: ExpenseInput) => void;
  updateExpense: (id: string, input: ExpenseInput) => void;
  removeExpense: (id: string) => void;
  clear: () => void;
};

const addUnique = (list: string[], id: string) => (list.includes(id) ? list : [...list, id]);

export const useExpenseStore = create<ExpenseState>()(
  persist(
    (set) => ({
      expenses: [],
      hydrated: false,
      dirty: [],
      deleted: [],
      lastSyncedAt: null,
      syncing: false,
      syncError: null,

      addExpense: (input) => {
        const expense: Expense = { ...input, id: createId(), date: new Date().toISOString() };
        set((s) => ({
          expenses: [expense, ...s.expenses],
          dirty: addUnique(s.dirty, expense.id),
        }));
      },
      updateExpense: (id, input) =>
        set((s) => ({
          expenses: s.expenses.map((e) => (e.id === id ? { ...e, ...input } : e)),
          dirty: addUnique(s.dirty, id),
        })),
      removeExpense: (id) =>
        set((s) => {
          const expense = s.expenses.find((e) => e.id === id);
          return {
            expenses: s.expenses.filter((e) => e.id !== id),
            dirty: s.dirty.filter((d) => d !== id),
            deleted: expense
              ? [...s.deleted, { id, receiptPath: expense.receiptPath }]
              : s.deleted,
          };
        }),
      clear: () =>
        set({ expenses: [], dirty: [], deleted: [], lastSyncedAt: null, syncError: null }),
    }),
    {
      name: 'expense-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        expenses: s.expenses,
        dirty: s.dirty,
        deleted: s.deleted,
        lastSyncedAt: s.lastSyncedAt,
      }),
      onRehydrateStorage: () => () => useExpenseStore.setState({ hydrated: true }),
    },
  ),
);
