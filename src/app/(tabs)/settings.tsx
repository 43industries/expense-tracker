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
import { shareExpensesCsv } from '@/lib/csv';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { syncExpenses } from '@/lib/sync';
import { useAuthStore } from '@/store/auth';
import { useExpenseStore } from '@/store/expenses';
import { useRecurringStore } from '@/store/recurring';
import { useSettingsStore, type DisplayCurrency, type ThemePreference } from '@/store/settings';
import { DEFAULT_CATEGORIES, type ExpenseKind } from '@/types/expense';
import type { RecurringInterval } from '@/types/recurring';

const THEME_OPTIONS = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
] as const satisfies readonly { value: ThemePreference; label: string }[];

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD' },
  { value: 'KES', label: 'KES' },
] as const satisfies readonly { value: DisplayCurrency; label: string }[];

const KIND_OPTIONS = [
  { value: 'expense', label: 'Expense' },
  { value: 'income', label: 'Income' },
] as const satisfies readonly { value: ExpenseKind; label: string }[];

const INTERVAL_OPTIONS = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'weekly', label: 'Weekly' },
] as const satisfies readonly { value: RecurringInterval; label: string }[];

export default function SettingsScreen() {
  const colors = useColors();
  const {
    theme,
    setTheme,
    currency,
    setCurrency,
    budget,
    setBudget,
    customCategories,
    addCategory,
    removeCategory,
  } = useSettingsStore();
  const money = useMoney();
  const expenses = useExpenseStore((s) => s.expenses);

  const [budgetText, setBudgetText] = useState('');
  const [budgetError, setBudgetError] = useState<string | null>(null);
  const [categoryText, setCategoryText] = useState('');
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

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

  const saveCategory = () => {
    const ok = addCategory(categoryText);
    if (!ok) {
      setCategoryError('Enter a new category name');
      return;
    }
    setCategoryText('');
    setCategoryError(null);
  };

  const exportCsv = async () => {
    if (expenses.length === 0) {
      Alert.alert('Nothing to export', 'Add some expenses first.');
      return;
    }
    setExporting(true);
    try {
      await shareExpensesCsv(expenses);
    } catch (e) {
      Alert.alert('Export failed', e instanceof Error ? e.message : String(e));
    } finally {
      setExporting(false);
    }
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

      <View style={cardStyle}>
        <Text style={[styles.title, { color: colors.text }]}>Custom categories</Text>
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          Defaults: {DEFAULT_CATEGORIES.join(', ')}. Custom categories stay on this device.
        </Text>
        <View style={styles.budgetRow}>
          <TextInput
            value={categoryText}
            onChangeText={setCategoryText}
            placeholder="New category"
            placeholderTextColor={colors.textSecondary}
            style={[
              styles.input,
              {
                color: colors.text,
                borderColor: categoryError ? colors.danger : colors.border,
                backgroundColor: colors.background,
              },
            ]}
          />
          <Pressable
            onPress={saveCategory}
            style={[styles.saveButton, { backgroundColor: colors.primary }]}>
            <Text style={{ color: colors.onPrimary, fontWeight: '700' }}>Add</Text>
          </Pressable>
        </View>
        {categoryError && <Text style={{ color: colors.danger }}>{categoryError}</Text>}
        {customCategories.length > 0 && (
          <View style={styles.chipList}>
            {customCategories.map((c) => (
              <View
                key={c}
                style={[styles.chip, { borderColor: colors.border, backgroundColor: colors.background }]}>
                <Text style={{ color: colors.text }}>{c}</Text>
                <Pressable onPress={() => removeCategory(c)} hitSlop={8}>
                  <Text style={{ color: colors.danger, fontWeight: '700' }}>×</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </View>

      <RecurringSection />

      <View style={cardStyle}>
        <Text style={[styles.title, { color: colors.text }]}>Export</Text>
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          Share a CSV of all entries ({expenses.length} row{expenses.length === 1 ? '' : 's'}).
        </Text>
        <Pressable
          onPress={exportCsv}
          disabled={exporting}
          style={[styles.outlineButton, { borderColor: colors.border }]}>
          {exporting ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Text style={{ color: colors.primary, fontWeight: '700' }}>Export CSV</Text>
          )}
        </Pressable>
      </View>

      <AccountSection />
    </ScrollView>
  );
}

function RecurringSection() {
  const colors = useColors();
  const money = useMoney();
  const rules = useRecurringStore((s) => s.rules);
  const addRule = useRecurringStore((s) => s.addRule);
  const removeRule = useRecurringStore((s) => s.removeRule);
  const customCategories = useSettingsStore((s) => s.customCategories);

  const [title, setTitle] = useState('');
  const [amountText, setAmountText] = useState('');
  const [kind, setKind] = useState<ExpenseKind>('expense');
  const [interval, setInterval] = useState<RecurringInterval>('monthly');
  const [category, setCategory] = useState<string>('Bills');
  const [error, setError] = useState<string | null>(null);

  const categories = [...DEFAULT_CATEGORIES, ...customCategories.filter((c) => !(DEFAULT_CATEGORIES as readonly string[]).includes(c))];

  const save = () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    const amount = Number(amountText.replace(',', '.'));
    if (!amountText.trim() || Number.isNaN(amount) || amount <= 0) {
      setError('Enter an amount greater than 0');
      return;
    }
    addRule({
      title: title.trim(),
      amount: money.fromDisplay(amount),
      category,
      kind,
      interval,
    });
    setTitle('');
    setAmountText('');
    setError(null);
  };

  const cardStyle = [styles.card, { backgroundColor: colors.card, borderColor: colors.border }];

  return (
    <View style={cardStyle}>
      <Text style={[styles.title, { color: colors.text }]}>Recurring</Text>
      <Text style={[styles.hint, { color: colors.textSecondary }]}>
        Rules stay on this device. Due entries are added automatically when you open the app.
      </Text>

      {rules.map((rule) => (
        <View
          key={rule.id}
          style={[styles.ruleRow, { borderColor: colors.border, backgroundColor: colors.background }]}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ color: colors.text, fontWeight: '600' }}>{rule.title}</Text>
            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              {money.format(rule.amount)} · {rule.interval} · {rule.category} · next{' '}
              {new Date(rule.nextRunAt).toLocaleDateString('en-GB')}
            </Text>
          </View>
          <Pressable onPress={() => removeRule(rule.id)} hitSlop={8}>
            <Text style={{ color: colors.danger, fontWeight: '700' }}>Delete</Text>
          </Pressable>
        </View>
      ))}

      <Text style={[styles.subtitle, { color: colors.text }]}>Add rule</Text>
      <SegmentedControl options={KIND_OPTIONS} value={kind} onChange={setKind} />
      <SegmentedControl options={INTERVAL_OPTIONS} value={interval} onChange={setInterval} />
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="Title"
        placeholderTextColor={colors.textSecondary}
        style={[
          styles.input,
          { color: colors.text, borderColor: colors.border, backgroundColor: colors.background },
        ]}
      />
      <TextInput
        value={amountText}
        onChangeText={setAmountText}
        placeholder={`Amount (${money.currency})`}
        placeholderTextColor={colors.textSecondary}
        keyboardType="decimal-pad"
        style={[
          styles.input,
          { color: colors.text, borderColor: colors.border, backgroundColor: colors.background },
        ]}
      />
      <View style={styles.chipList}>
        {categories.map((c) => {
          const selected = c === category;
          return (
            <Pressable
              key={c}
              onPress={() => setCategory(c)}
              style={[
                styles.chip,
                {
                  borderColor: selected ? colors.primary : colors.border,
                  backgroundColor: selected ? colors.primary : colors.background,
                },
              ]}>
              <Text style={{ color: selected ? colors.onPrimary : colors.text }}>{c}</Text>
            </Pressable>
          );
        })}
      </View>
      {error && <Text style={{ color: colors.danger }}>{error}</Text>}
      <Pressable onPress={save} style={[styles.saveButtonWide, { backgroundColor: colors.primary }]}>
        <Text style={{ color: colors.onPrimary, fontWeight: '700' }}>Add recurring rule</Text>
      </Pressable>
    </View>
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
  subtitle: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: Spacing.sm,
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
  saveButtonWide: {
    borderRadius: Radius,
    paddingVertical: 12,
    alignItems: 'center',
  },
  chipList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderRadius: Radius,
    padding: Spacing.sm,
  },
});
