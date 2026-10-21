import type { Session } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import { create } from 'zustand';

import { isSupabaseConfigured, supabase } from '@/lib/supabase';

type AuthState = {
  session: Session | null;
  initialized: boolean;
  /** True from the moment a password-recovery link opens the app until the password is changed or recovery is abandoned. */
  recoveryPending: boolean;
  /** Human-readable reason a recovery link failed (expired, already used, malformed). */
  recoveryError: string | null;
};

export const useAuthStore = create<AuthState>()(() => ({
  session: null,
  initialized: !isSupabaseConfigured,
  recoveryPending: false,
  recoveryError: null,
}));

let started = false;
const handledUrls = new Set<string>();
let currentRecoveryUrl: string | null = null;

/** Ends recovery mode (after a successful password change, or when the user bails back to sign-in). */
export function endPasswordRecovery() {
  if (currentRecoveryUrl) handledUrls.delete(currentRecoveryUrl);
  currentRecoveryUrl = null;
  useAuthStore.setState({ recoveryPending: false, recoveryError: null });
}

function parseUrlParams(url: string): Record<string, string> {
  const params: Record<string, string> = {};
  // Supabase implicit flow returns tokens in the fragment (#access_token=...),
  // errors and PKCE codes come back in the query string (?code=... / ?error=...).
  const parts = [url.split('#')[1], url.split('?')[1]?.split('#')[0]];
  for (const part of parts) {
    if (!part) continue;
    for (const pair of part.split('&')) {
      const eq = pair.indexOf('=');
      if (eq < 0) continue;
      const key = decodeURIComponent(pair.slice(0, eq));
      params[key] = decodeURIComponent(pair.slice(eq + 1).replace(/\+/g, ' '));
    }
  }
  return params;
}

/**
 * Turns a `expensetracker://reset-password...` link into a recovery session.
 * Handles the default implicit flow (access/refresh tokens in the fragment)
 * and, defensively, a PKCE `code` in the query string.
 * Returns true if the URL was a recovery link (valid or not).
 */
export async function handleRecoveryUrl(url: string | null): Promise<boolean> {
  if (!url || !url.includes('reset-password') || handledUrls.has(url)) return false;
  handledUrls.add(url);
  currentRecoveryUrl = url;

  // Set synchronously so the root layout routes to the reset screen
  // before the (async) session exchange below completes.
  useAuthStore.setState({ recoveryPending: true, recoveryError: null });

  const params = parseUrlParams(url);

  if (params.error || params.error_code) {
    useAuthStore.setState({
      recoveryError:
        params.error_code === 'otp_expired' || params.error === 'access_denied'
          ? 'This password reset link has expired or was already used. Go back to sign in and request a new one.'
          : (params.error_description ??
            'This password reset link is invalid. Go back to sign in and request a new one.'),
    });
    return true;
  }

  try {
    if (params.code) {
      const { error } = await supabase.auth.exchangeCodeForSession(params.code);
      if (error) throw error;
    } else if (params.access_token && params.refresh_token) {
      const { data, error } = await supabase.auth.setSession({
        access_token: params.access_token,
        refresh_token: params.refresh_token,
      });
      if (error) throw error;
      useAuthStore.setState({ session: data.session, recoveryPending: true });
    } else {
      useAuthStore.setState({
        recoveryError:
          'This password reset link is invalid. Go back to sign in and request a new one.',
      });
    }
  } catch {
    useAuthStore.setState({
      recoveryError:
        'This password reset link has expired or was already used. Go back to sign in and request a new one.',
    });
  }
  return true;
}

/** Restores the saved session (from SecureStore) and keeps the store in sync with Supabase. */
export function initAuth() {
  if (started || !isSupabaseConfigured) return;
  started = true;

  supabase.auth.onAuthStateChange((event, session) => {
    useAuthStore.setState({
      session,
      ...(event === 'PASSWORD_RECOVERY' ? { recoveryPending: true, recoveryError: null } : {}),
      ...(event === 'SIGNED_OUT' ? { recoveryPending: false, recoveryError: null } : {}),
    });
  });

  Linking.addEventListener('url', ({ url }) => {
    void handleRecoveryUrl(url);
  });

  void (async () => {
    try {
      // Handle a cold-start recovery link before lifting the splash gate,
      // so the first rendered navigator already knows recovery is pending.
      await handleRecoveryUrl(await Linking.getInitialURL());
      const { data } = await supabase.auth.getSession();
      // Don't clobber a recovery session established just above.
      useAuthStore.setState((state) => ({ session: state.session ?? data.session }));
    } finally {
      useAuthStore.setState({ initialized: true });
    }
  })();
}
