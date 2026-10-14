import type { Session } from '@supabase/supabase-js';
import { create } from 'zustand';

import { isSupabaseConfigured, supabase } from '@/lib/supabase';

type AuthState = {
  session: Session | null;
  initialized: boolean;
};

export const useAuthStore = create<AuthState>()(() => ({
  session: null,
  initialized: !isSupabaseConfigured,
}));

let started = false;

/** Restores the saved session (from SecureStore) and keeps the store in sync with Supabase. */
export function initAuth() {
  if (started || !isSupabaseConfigured) return;
  started = true;

  supabase.auth
    .getSession()
    .then(({ data }) => useAuthStore.setState({ session: data.session }))
    .finally(() => useAuthStore.setState({ initialized: true }));

  supabase.auth.onAuthStateChange((_event, session) => {
    useAuthStore.setState({ session });
  });
}
