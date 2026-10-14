import { router } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BalanceCard } from '@/components/BalanceCard';
import { ExpenseRow } from '@/components/ExpenseRow';
import { MONTHLY_BUDGET_USD, Radius, Spacing } from '@/constants/theme';
import { useExpenses } from '@/context/ExpensesContext';
import { useColors } from '@/hooks/use-colors';

const RECENT_COUNT = 5;

export default function HomeScreen() {
  const colors = useColors();
  const { expenses, loaded } = useExpenses();

  const spent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const recent = expenses.slice(0, RECENT_COUNT);

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}>
      <BalanceCard budget={MONTHLY_BUDGET_USD} spent={spent} />

      <Pressable
        onPress={() => router.push('/add')}
        style={({ pressed }) => [
          styles.addButton,
          { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 },
        ]}>
        <Text style={[styles.addText, { color: colors.onPrimary }]}>+ Add expense</Text>
      </Pressable>

      <View style={styles.headerRow}>
        <Text style={[styles.heading, { color: colors.text }]}>Recent expenses</Text>
        {expenses.length > RECENT_COUNT && (
          <Pressable onPress={() => router.push('/expenses')}>
            <Text style={{ color: colors.primary, fontWeight: '600' }}>See all</Text>
          </Pressable>
        )}
      </View>

      {!loaded ? (
        <ActivityIndicator color={colors.primary} />
      ) : recent.length === 0 ? (
        <Text style={{ color: colors.textSecondary }}>No expenses yet. Tap "Add expense" to start.</Text>
      ) : (
        <View style={styles.list}>
          {recent.map((e) => (
            <ExpenseRow
              key={e.id}
              expense={e}
              onPress={() => router.push({ pathname: '/expense/[id]', params: { id: e.id } })}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.md,
    gap: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  addButton: {
    borderRadius: Radius,
    paddingVertical: 14,
    alignItems: 'center',
  },
  addText: {
    fontSize: 16,
    fontWeight: '700',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  heading: {
    fontSize: 20,
    fontWeight: '700',
  },
  list: {
    gap: Spacing.sm,
  },
});
