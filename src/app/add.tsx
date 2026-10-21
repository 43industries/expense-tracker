import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ExpenseForm } from '@/components/ExpenseForm';
import { MpesaSmsCard } from '@/components/MpesaSmsCard';
import { Spacing } from '@/constants/theme';
import { useColors } from '@/hooks/use-colors';
import { useRates } from '@/hooks/use-money';
import { formatDate, formatMoney } from '@/lib/format';
import { parseMpesaSms } from '@/lib/mpesa';
import { useExpenseStore } from '@/store/expenses';

export default function AddExpenseScreen() {
  const colors = useColors();
  const addExpense = useExpenseStore((s) => s.addExpense);
  const { sms } = useLocalSearchParams<{ sms?: string }>();
  const smsParam = typeof sms === 'string' ? sms : '';
  const [smsText, setSmsText] = useState(smsParam);
  const [seenSmsParam, setSeenSmsParam] = useState(smsParam);
  const rates = useRates();

  // A deep link can arrive while this screen is already open.
  if (smsParam !== seenSmsParam) {
    setSeenSmsParam(smsParam);
    if (smsParam) setSmsText(smsParam);
  }

  const parsed = useMemo(() => (smsText.trim() ? parseMpesaSms(smsText) : null), [smsText]);
  const duplicate = useExpenseStore((s) =>
    parsed ? s.expenses.find((e) => e.mpesaCode === parsed.code) : undefined,
  );
  const kesRate = rates.data?.KES;
  const waitingForRates = !!parsed && !kesRate;

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const status = (() => {
    if (!smsText.trim()) return null;
    if (!parsed) {
      return (
        <Text style={{ color: colors.danger }}>
          This doesn&apos;t look like an M-Pesa payment. Paste the full &quot;Confirmed&quot; message
          for money you sent, paid or withdrew.
        </Text>
      );
    }

    const summary = (
      <Text style={{ color: colors.text }}>
        {formatMoney(parsed.amountKes, 'KES')} to {parsed.counterparty} on {formatDate(parsed.date)}
        {' · '}
        <Text style={{ color: colors.textSecondary }}>{parsed.code}</Text>
        {parsed.feeKes ? (
          <Text style={{ color: colors.textSecondary }}>
            {' '}
            (fee {formatMoney(parsed.feeKes, 'KES')})
          </Text>
        ) : null}
      </Text>
    );

    if (duplicate) {
      return (
        <View style={styles.status}>
          {summary}
          <Text style={{ color: colors.danger }}>Already added on {formatDate(duplicate.date)}.</Text>
          <Pressable
            onPress={() =>
              router.replace({ pathname: '/expense/[id]', params: { id: duplicate.id } })
            }>
            <Text style={{ color: colors.primary, fontWeight: '700' }}>View it</Text>
          </Pressable>
        </View>
      );
    }

    if (waitingForRates) {
      return (
        <View style={styles.status}>
          {summary}
          {rates.isPending || rates.isFetching ? (
            <View style={styles.inline}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={{ color: colors.textSecondary }}>Loading KES exchange rate...</Text>
            </View>
          ) : (
            <View style={styles.inline}>
              <Text style={{ color: colors.danger, flex: 1 }}>
                Couldn&apos;t load the KES exchange rate needed to convert this amount.
              </Text>
              <Pressable onPress={() => rates.refetch()} hitSlop={8}>
                <Text style={{ color: colors.primary, fontWeight: '700' }}>Retry</Text>
              </Pressable>
            </View>
          )}
        </View>
      );
    }

    return <View style={styles.status}>{summary}</View>;
  })();

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <MpesaSmsCard value={smsText} onChange={setSmsText} initiallyOpen={!!sms}>
          {status}
        </MpesaSmsCard>

        {!waitingForRates && (
          <ExpenseForm
            key={parsed?.code ?? 'manual'}
            initial={
              parsed && kesRate
                ? {
                    title: parsed.counterparty,
                    amount: parsed.amountKes / kesRate,
                    category: parsed.category,
                    kind: 'expense',
                  }
                : undefined
            }
            disabled={!!duplicate}
            onSubmit={(input) => {
              addExpense(
                parsed
                  ? { ...input, kind: 'expense', date: parsed.date, mpesaCode: parsed.code }
                  : input,
              );
              close();
            }}
          />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  status: {
    gap: Spacing.xs,
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
});
