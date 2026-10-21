import { router } from 'expo-router';
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
import { SafeAreaView } from 'react-native-safe-area-context';

import { Radius, Spacing } from '@/constants/theme';
import { useColors } from '@/hooks/use-colors';
import { supabase } from '@/lib/supabase';
import { endPasswordRecovery, useAuthStore } from '@/store/auth';

export default function ResetPasswordScreen() {
  const colors = useColors();
  const session = useAuthStore((s) => s.session);
  const recoveryError = useAuthStore((s) => s.recoveryError);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const backToSignIn = async () => {
    endPasswordRecovery();
    // A recovery session is already authenticated; abandoning the reset
    // signs it out so the app returns to the login screen cleanly.
    if (session) await supabase.auth.signOut();
    router.replace('/login');
  };

  const submit = async () => {
    setError(null);
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }
    endPasswordRecovery();
    router.replace('/');
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
          <Text style={[styles.title, { color: colors.text }]}>Reset password</Text>
          <Text style={{ color: colors.textSecondary }}>
            {recoveryError
              ? 'That reset link could not be used'
              : 'Choose a new password for your account'}
          </Text>
        </View>

        {recoveryError ? (
          <>
            <Text style={{ color: colors.danger }}>{recoveryError}</Text>
            <Pressable
              onPress={backToSignIn}
              style={({ pressed }) => [
                styles.button,
                { backgroundColor: colors.primary, opacity: pressed ? 0.7 : 1 },
              ]}>
              <Text style={[styles.buttonText, { color: colors.onPrimary }]}>
                Back to sign in
              </Text>
            </Pressable>
          </>
        ) : !session ? (
          <>
            <ActivityIndicator color={colors.primary} />
            <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>
              Verifying your reset link...
            </Text>
            <Pressable onPress={backToSignIn} style={styles.switch}>
              <Text style={{ color: colors.primary, fontWeight: '600' }}>
                Back to sign in
              </Text>
            </Pressable>
          </>
        ) : (
          <>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="New password"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry
              autoComplete="new-password"
              style={inputStyle}
            />
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm new password"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry
              autoComplete="new-password"
              style={inputStyle}
              onSubmitEditing={submit}
            />

            {error && <Text style={{ color: colors.danger }}>{error}</Text>}

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
                  Set new password
                </Text>
              )}
            </Pressable>

            <Pressable onPress={backToSignIn} style={styles.switch}>
              <Text style={{ color: colors.primary, fontWeight: '600' }}>
                Back to sign in
              </Text>
            </Pressable>
          </>
        )}
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
});
