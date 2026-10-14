import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { createId } from '@/lib/format';
import type { Expense, ExpenseInput } from '@/types/expense';

const STORAGE_KEY = 'expenses';

type ExpensesContextValue = {
  expenses: Expense[];
  loaded: boolean;
  addExpense: (input: ExpenseInput) => void;
  updateExpense: (id: string, input: ExpenseInput) => void;
  removeExpense: (id: string) => void;
};

const ExpensesContext = createContext<ExpensesContextValue | null>(null);

export function ExpensesProvider({ children }: { children: ReactNode }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setExpenses(JSON.parse(raw) as Expense[]);
      } catch (e) {
        console.warn('Failed to load expenses', e);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    // Skip until the initial load finishes, otherwise the empty [] would overwrite saved data.
    if (!loaded) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(expenses)).catch((e) =>
      console.warn('Failed to save expenses', e),
    );
  }, [expenses, loaded]);

  const value: ExpensesContextValue = {
    expenses,
    loaded,
    addExpense: (input) =>
      setExpenses((prev) => [
        { ...input, id: createId(), date: new Date().toISOString() },
        ...prev,
      ]),
    updateExpense: (id, input) =>
      setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, ...input } : e))),
    removeExpense: (id) => setExpenses((prev) => prev.filter((e) => e.id !== id)),
  };

  return <ExpensesContext.Provider value={value}>{children}</ExpensesContext.Provider>;
}

export function useExpenses(): ExpensesContextValue {
  const ctx = useContext(ExpensesContext);
  if (!ctx) throw new Error('useExpenses must be used inside ExpensesProvider');
  return ctx;
}
