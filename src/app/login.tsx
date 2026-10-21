import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Linking from 'expo-linking';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Radius, Spacing } from '@/constants/theme';
import { useColors } from '@/hooks/use-colors';
import { supabase } from '@/lib/supabase';

type Mode = 'signIn' | 'signUp';

export default function LoginScreen() {
  const colors = useColors();
  const [mode, setMode] = useState<Mode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    setInfo(null);
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError('Enter a valid email address');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    const credentials = { email: email.trim(), password };
    const { data, error: authError } =
      mode === 'signIn'
        ? await supabase.auth.signInWithPassword(credentials)
        : await supabase.auth.signUp(credentials);
    setLoading(false);

    if (authError) {
      setError(authError.message);
    } else if (mode === 'signUp' && !data.session) {
      setInfo('Account created. Check your email to confirm it, then sign in.');
      setMode('signIn');
    }
  };

  const forgotPassword = async () => {
    setError(null);
    setInfo(null);
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError('Enter your email address above, then tap Forgot password');
      return;
    }

    setForgotLoading(true);
    const redirectTo = Linking.createURL('reset-password');
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo,
    });
    setForgotLoading(false);

    if (resetError) {
      setError(resetError.message);
    } else {
      // Neutral wording: don't reveal whether this email has an account.
      setInfo('If an account exists for that email, a password reset link is on its way.');
    }
  };

  const inputStyle = [
    styles.input,
    { color: colors.text, backgroundColor: colors.card, borderColor: colors.border },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Expense Tracker</Text>
          <Text style={{ color: colors.textSecondary }}>
            {mode === 'signIn' ? 'Sign in to sync your expenses' : 'Create an account'}
          </Text>
        </View>

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor={colors.textSecondary}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          style={inputStyle}
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor={colors.textSecondary}
          secureTextEntry
          autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
          style={inputStyle}
          onSubmitEditing={submit}
        />

        {mode === 'signIn' && (
          <Pressable
            onPress={forgotPassword}
            disabled={forgotLoading}
            style={styles.forgot}
            hitSlop={8}>
            {forgotLoading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={{ color: colors.primary, fontWeight: '600' }}>Forgot password?</Text>
            )}
          </Pressable>
        )}

        {error && <Text style={{ color: colors.danger }}>{error}</Text>}
        {info && <Text style={{ color: colors.success }}>{info}</Text>}

        <Pressable
          onPress={submit}
          disabled={loading}
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: colors.primary, opacity: pressed || loading ? 0.7 : 1 },
          ]}>
          {loading ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={[styles.buttonText, { color: colors.onPrimary }]}>
              {mode === 'signIn' ? 'Sign in' : 'Create account'}
            </Text>
          )}
        </Pressable>

        <Pressable
          onPress={() => {
            setMode(mode === 'signIn' ? 'signUp' : 'signIn');
            setError(null);
          }}
          style={styles.switch}>
          <Text style={{ color: colors.primary, fontWeight: '600' }}>
            {mode === 'signIn' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </Text>
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  header: {
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
  },
  input: {
    borderWidth: 1,
    borderRadius: Radius,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontSize: 16,
  },
  button: {
    borderRadius: Radius,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  switch: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  forgot: {
    alignSelf: 'flex-end',
    paddingVertical: Spacing.xs,
    minHeight: 28,
    justifyContent: 'center',
  },
});
