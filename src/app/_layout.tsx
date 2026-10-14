import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { useColors, useResolvedScheme } from '@/hooks/use-colors';

const queryClient = new QueryClient();

export default function RootLayout() {
  const scheme = useResolvedScheme();
  const colors = useColors();
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    colors: {
      ...base.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.card,
      text: colors.text,
      border: colors.border,
    },
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={navTheme}>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="add" options={{ title: 'Add expense', presentation: 'modal' }} />
          <Stack.Screen name="expense/[id]" options={{ title: 'Edit expense' }} />
        </Stack>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
