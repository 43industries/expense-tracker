import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BalanceCard } from '@/components/BalanceCard';
import { ExpenseForm } from '@/components/ExpenseForm';
import { ExpenseRow } from '@/components/ExpenseRow';
import { MONTHLY_BUDGET_USD, Spacing } from '@/constants/theme';
import { useColors } from '@/hooks/use-colors';
import { createId } from '@/lib/format';
import type { Expense, ExpenseInput } from '@/types/expense';

const RECENT_COUNT = 5;

export default function HomeScreen() {
  const colors = useColors();
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const spent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const recent = expenses.slice(0, RECENT_COUNT);

  const addExpense = (input: ExpenseInput) => {
    const expense: Expense = { ...input, id: createId(), date: new Date().toISOString() };
    setExpenses((prev) => [expense, ...prev]);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <BalanceCard budget={MONTHLY_BUDGET_USD} spent={spent} />

        <Text style={[styles.heading, { color: colors.text }]}>Recent expenses</Text>
        {recent.length === 0 ? (
          <Text style={{ color: colors.textSecondary }}>No expenses yet. Add your first one below.</Text>
        ) : (
          <View style={styles.list}>
            {recent.map((e) => (
              <ExpenseRow key={e.id} expense={e} />
            ))}
          </View>
        )}

        <Text style={[styles.heading, { color: colors.text }]}>Add expense</Text>
        <ExpenseForm onSubmit={addExpense} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.md,
    gap: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  heading: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: Spacing.sm,
  },
  list: {
    gap: Spacing.sm,
  },
});
