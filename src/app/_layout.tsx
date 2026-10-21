import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, router, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useAutoSync } from '@/hooks/use-auto-sync';
import { useColors, useResolvedScheme } from '@/hooks/use-colors';
import { isSupabaseConfigured } from '@/lib/supabase';
import { initAuth, useAuthStore } from '@/store/auth';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

export default function RootLayout() {
  const scheme = useResolvedScheme();
  const colors = useColors();
  const initialized = useAuthStore((s) => s.initialized);
  const session = useAuthStore((s) => s.session);
  const recoveryPending = useAuthStore((s) => s.recoveryPending);

  useEffect(() => {
    initAuth();
  }, []);

  // A recovery link takes over the whole app until the password is changed,
  // even though the recovery session makes the user look "signed in".
  useEffect(() => {
    if (initialized && recoveryPending) router.replace('/reset-password');
  }, [initialized, recoveryPending]);

  useEffect(() => {
    if (initialized) SplashScreen.hideAsync();
  }, [initialized]);

  useAutoSync();

  if (!initialized) return null;

  const signedIn = !isSupabaseConfigured || !!session;
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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider value={navTheme}>
          <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
          <Stack>
            <Stack.Protected guard={recoveryPending}>
              <Stack.Screen name="reset-password" options={{ headerShown: false }} />
            </Stack.Protected>
            <Stack.Protected guard={signedIn && !recoveryPending}>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="add" options={{ title: 'Add expense', presentation: 'modal' }} />
              <Stack.Screen name="expense/[id]" options={{ title: 'Edit expense' }} />
            </Stack.Protected>
            <Stack.Protected guard={!signedIn && !recoveryPending}>
              <Stack.Screen name="login" options={{ headerShown: false }} />
            </Stack.Protected>
          </Stack>
        </ThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
