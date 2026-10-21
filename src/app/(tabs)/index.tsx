import { router } from 'expo-router';
import { useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { BalanceCard } from '@/components/BalanceCard';
import { CurrencyStatus } from '@/components/CurrencyStatus';
import { ExpenseRow } from '@/components/ExpenseRow';
import { Radius, Spacing } from '@/constants/theme';
import { useColors } from '@/hooks/use-colors';
import { monthKey, spentInMonth } from '@/lib/stats';
import { syncExpenses } from '@/lib/sync';
import { useExpenseStore } from '@/store/expenses';
import { useSettingsStore } from '@/store/settings';

const RECENT_COUNT = 5;

export default function HomeScreen() {
  const colors = useColors();
  const expenses = useExpenseStore((s) => s.expenses);
  const hydrated = useExpenseStore((s) => s.hydrated);
  const syncing = useExpenseStore((s) => s.syncing);
  const budget = useSettingsStore((s) => s.budget);

  const spent = useMemo(() => spentInMonth(expenses, monthKey(new Date())), [expenses]);
  const recent = expenses.slice(0, RECENT_COUNT);

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={syncing}
          onRefresh={() => syncExpenses()}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }>
      <CurrencyStatus />
      <BalanceCard budget={budget} spent={spent} />

      <Pressable
        onPress={() => router.push('/add')}
        style={({ pressed }) => [
          styles.addButton,
          { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 },
        ]}>
        <Text style={[styles.addText, { color: colors.onPrimary }]}>+ Add expense</Text>
      </Pressable>

      <View style={styles.headerRow}>
        <Text style={[styles.heading, { color: colors.text }]}>Recent</Text>
        {expenses.length > RECENT_COUNT && (
          <Pressable onPress={() => router.push('/expenses')}>
            <Text style={{ color: colors.primary, fontWeight: '600' }}>See all</Text>
          </Pressable>
        )}
      </View>

      {!hydrated ? (
        <ActivityIndicator color={colors.primary} />
      ) : recent.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Nothing logged yet</Text>
          <Text style={[styles.emptyBody, { color: colors.textSecondary }]}>
            Track spending and income to see your balance and monthly stats.
          </Text>
          <Pressable
            onPress={() => router.push('/add')}
            style={[styles.emptyCta, { backgroundColor: colors.primary }]}>
            <Text style={{ color: colors.onPrimary, fontWeight: '700' }}>Add your first entry</Text>
          </Pressable>
        </View>
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
  emptyCard: {
    borderRadius: Radius,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.lg,
    gap: Spacing.sm,
    alignItems: 'flex-start',
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  emptyBody: {
    fontSize: 14,
    lineHeight: 20,
  },
  emptyCta: {
    marginTop: Spacing.xs,
    borderRadius: Radius,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
  },
});
