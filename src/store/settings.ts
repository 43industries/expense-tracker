import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { MONTHLY_BUDGET_USD } from '@/constants/theme';
import { DEFAULT_CATEGORIES } from '@/types/expense';

export type ThemePreference = 'system' | 'light' | 'dark';
export type DisplayCurrency = 'USD' | 'KES';

type SettingsState = {
  theme: ThemePreference;
  currency: DisplayCurrency;
  /** Monthly budget, stored in USD like every other amount. */
  budget: number;
  /** Extra categories beyond DEFAULT_CATEGORIES (local only). */
  customCategories: string[];
  setTheme: (theme: ThemePreference) => void;
  setCurrency: (currency: DisplayCurrency) => void;
  setBudget: (budget: number) => void;
  addCategory: (name: string) => boolean;
  removeCategory: (name: string) => void;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      currency: 'USD',
      budget: MONTHLY_BUDGET_USD,
      customCategories: [],
      setTheme: (theme) => set({ theme }),
      setCurrency: (currency) => set({ currency }),
      setBudget: (budget) => set({ budget }),
      addCategory: (name) => {
        const trimmed = name.trim();
        if (!trimmed) return false;
        const defaults = new Set<string>(DEFAULT_CATEGORIES);
        const existing = get().customCategories;
        if (defaults.has(trimmed) || existing.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
          return false;
        }
        set({ customCategories: [...existing, trimmed] });
        return true;
      },
      removeCategory: (name) =>
        set((s) => ({
          customCategories: s.customCategories.filter((c) => c !== name),
        })),
    }),
    {
      name: 'settings-store',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
