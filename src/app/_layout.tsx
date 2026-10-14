import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { ExpensesProvider } from '@/context/ExpensesContext';

export default function RootLayout() {
  return (
    <ExpensesProvider>
      <StatusBar style="auto" />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="add" options={{ title: 'Add expense', presentation: 'modal' }} />
        <Stack.Screen name="expense/[id]" options={{ title: 'Edit expense' }} />
      </Stack>
    </ExpensesProvider>
  );
}
