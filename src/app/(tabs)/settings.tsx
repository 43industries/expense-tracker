import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { CurrencyStatus } from '@/components/CurrencyStatus';
import { SegmentedControl } from '@/components/SegmentedControl';
import { Radius, Spacing } from '@/constants/theme';
import { useColors } from '@/hooks/use-colors';
import { useMoney } from '@/hooks/use-money';
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
