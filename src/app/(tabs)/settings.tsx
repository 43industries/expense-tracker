import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { CurrencyStatus } from '@/components/CurrencyStatus';
import { SegmentedControl } from '@/components/SegmentedControl';
import { Radius, Spacing } from '@/constants/theme';
import { useColors } from '@/hooks/use-colors';
import { useMoney } from '@/hooks/use-money';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { syncExpenses } from '@/lib/sync';
import { useAuthStore } from '@/store/auth';
import { useExpenseStore } from '@/store/expenses';
import { useSettingsStore, type DisplayCurrency, type ThemePreference } from '@/store/settings';

const THEME_OPTIONS = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
] as const satisfies readonly { value: ThemePreference; label: string }[];

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD' },
  { value: 'KES', label: 'KES' },
] as const satisfies readonly { value: DisplayCurrency; label: string }[];

export default function SettingsScreen() {
  const colors = useColors();
  const { theme, setTheme, currency, setCurrency, budget, setBudget } = useSettingsStore();
  const money = useMoney();

  const [budgetText, setBudgetText] = useState('');
  const [budgetError, setBudgetError] = useState<string | null>(null);

  const saveBudget = () => {
    const value = Number(budgetText.replace(',', '.'));
    if (!budgetText.trim() || Number.isNaN(value) || value <= 0) {
      setBudgetError('Enter a number greater than 0');
      return;
    }
    setBudget(money.fromDisplay(value));
    setBudgetText('');
    setBudgetError(null);
  };

  const cardStyle = [styles.card, { backgroundColor: colors.card, borderColor: colors.border }];

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled">
      <View style={cardStyle}>
        <Text style={[styles.title, { color: colors.text }]}>Appearance</Text>
        <SegmentedControl options={THEME_OPTIONS} value={theme} onChange={setTheme} />
      </View>

      <View style={cardStyle}>
        <Text style={[styles.title, { color: colors.text }]}>Display currency</Text>
        <SegmentedControl options={CURRENCY_OPTIONS} value={currency} onChange={setCurrency} />
        {money.rates.data && (
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            1 USD = {money.rates.data.KES.toFixed(2)} KES · updated{' '}
            {new Date(money.rates.data.updatedAt).toLocaleDateString('en-GB')}
          </Text>
        )}
        <CurrencyStatus />
      </View>

      <View style={cardStyle}>
        <Text style={[styles.title, { color: colors.text }]}>Monthly budget</Text>
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          Current: {money.format(budget)}
        </Text>
        <View style={styles.budgetRow}>
          <TextInput
            value={budgetText}
            onChangeText={setBudgetText}
            placeholder={`New budget (${money.currency})`}
            placeholderTextColor={colors.textSecondary}
            keyboardType="decimal-pad"
            style={[
              styles.input,
              {
                color: colors.text,
                borderColor: budgetError ? colors.danger : colors.border,
                backgroundColor: colors.background,
              },
            ]}
          />
          <Pressable
            onPress={saveBudget}
            style={[styles.saveButton, { backgroundColor: colors.primary }]}>
            <Text style={{ color: colors.onPrimary, fontWeight: '700' }}>Save</Text>
          </Pressable>
        </View>
        {budgetError && <Text style={{ color: colors.danger }}>{budgetError}</Text>}
      </View>

      <AccountSection />
    </ScrollView>
  );
}

function AccountSection() {
  const colors = useColors();
  const session = useAuthStore((s) => s.session);
  const { syncing, syncError, lastSyncedAt, dirty, deleted, clear } = useExpenseStore();
  const pending = dirty.length + deleted.length;

  const cardStyle = [styles.card, { backgroundColor: colors.card, borderColor: colors.border }];

  if (!isSupabaseConfigured) {
    return (
      <View style={cardStyle}>
        <Text style={[styles.title, { color: colors.text }]}>Cloud sync</Text>
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          Off. Expenses are saved on this phone only. Add your Supabase keys to .env.local and
          restart Expo to enable login and sync.
        </Text>
      </View>
    );
  }

  const signOut = () => {
    const doSignOut = async () => {
      await supabase.auth.signOut();
      clear();
    };
    if (pending === 0) {
      doSignOut();
      return;
    }
    Alert.alert(
      'Unsynced changes',
      `${pending} change(s) haven't been uploaded yet and will be lost if you sign out.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign out anyway', style: 'destructive', onPress: doSignOut },
      ],
    );
  };

  return (
    <View style={cardStyle}>
      <Text style={[styles.title, { color: colors.text }]}>Account</Text>
      <Text style={{ color: colors.text }}>{session?.user.email}</Text>
      <Text style={[styles.hint, { color: syncError ? colors.danger : colors.textSecondary }]}>
        {syncing
          ? 'Syncing...'
          : syncError
            ? `Sync failed: ${syncError}`
            : lastSyncedAt
              ? `Last synced ${new Date(lastSyncedAt).toLocaleString('en-GB')}`
              : 'Not synced yet'}
        {pending > 0 && !syncing ? ` · ${pending} pending` : ''}
      </Text>
      <View style={styles.budgetRow}>
        <Pressable
          onPress={() => syncExpenses()}
          disabled={syncing}
          style={[styles.outlineButton, { borderColor: colors.border }]}>
          {syncing ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Text style={{ color: colors.primary, fontWeight: '700' }}>Sync now</Text>
          )}
        </Pressable>
        <Pressable onPress={signOut} style={[styles.outlineButton, { borderColor: colors.border }]}>
          <Text style={{ color: colors.danger, fontWeight: '700' }}>Sign out</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outlineButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Radius,
    paddingVertical: 12,
    alignItems: 'center',
  },
  content: {
    padding: Spacing.md,
    gap: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  card: {
    borderRadius: Radius,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
  },
  hint: {
    fontSize: 13,
  },
  budgetRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Radius,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontSize: 16,
  },
  saveButton: {
    borderRadius: Radius,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'center',
  },
});
