import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { MONTHLY_BUDGET_USD } from '@/constants/theme';

export type ThemePreference = 'system' | 'light' | 'dark';
export type DisplayCurrency = 'USD' | 'KES';

type SettingsState = {
  theme: ThemePreference;
  currency: DisplayCurrency;
  /** Monthly budget, stored in USD like every other amount. */
  budget: number;
  setTheme: (theme: ThemePreference) => void;
  setCurrency: (currency: DisplayCurrency) => void;
  setBudget: (budget: number) => void;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'system',
      currency: 'USD',
      budget: MONTHLY_BUDGET_USD,
      setTheme: (theme) => set({ theme }),
      setCurrency: (currency) => set({ currency }),
      setBudget: (budget) => set({ budget }),
    }),
    {
      name: 'settings-store',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
