import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeOutLeft, LinearTransition } from 'react-native-reanimated';

import { ExpenseRow } from '@/components/ExpenseRow';
import { SwipeableRow } from '@/components/SwipeableRow';
import { Radius, Spacing } from '@/constants/theme';
import { useColors } from '@/hooks/use-colors';
import { monthKey, monthLabel, shiftMonth } from '@/lib/stats';
import { syncExpenses } from '@/lib/sync';
import { useExpenseStore } from '@/store/expenses';
import { useSettingsStore } from '@/store/settings';
import { DEFAULT_CATEGORIES } from '@/types/expense';

export default function ExpensesScreen() {
  const colors = useColors();
  const expenses = useExpenseStore((s) => s.expenses);
  const syncing = useExpenseStore((s) => s.syncing);
  const removeExpense = useExpenseStore((s) => s.removeExpense);
  const customCategories = useSettingsStore((s) => s.customCategories);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('All');
  const [month, setMonth] = useState(() => monthKey(new Date()));

  const categoryOptions = useMemo(() => {
    const defaults = new Set<string>(DEFAULT_CATEGORIES);
    return ['All', ...DEFAULT_CATEGORIES, ...customCategories.filter((c) => !defaults.has(c))];
  }, [customCategories]);

  const q = query.trim().toLowerCase();
  const filtered = expenses.filter((e) => {
    if (monthKey(new Date(e.date)) !== month) return false;
    if (category !== 'All' && e.category !== category) return false;
    if (!q) return true;
    return (
      e.title.toLowerCase().includes(q) ||
      e.category.toLowerCase().includes(q) ||
      (e.notes?.toLowerCase().includes(q) ?? false)
    );
  });

  const [year, mo] = month.split('-').map(Number);
  const monthName = new Date(year, mo - 1, 1).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  });

  const emptyMessage =
    expenses.length === 0
      ? 'No expenses yet.'
      : filtered.length === 0
        ? 'No matches for these filters.'
        : null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search by title, category, or notes"
        placeholderTextColor={colors.textSecondary}
        style={[
          styles.search,
          { color: colors.text, backgroundColor: colors.card, borderColor: colors.border },
        ]}
        clearButtonMode="while-editing"
      />

      <View style={styles.monthRow}>
        <Pressable
          onPress={() => setMonth((m) => shiftMonth(m, -1))}
          hitSlop={8}
          style={[styles.monthBtn, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <Text style={{ color: colors.primary, fontWeight: '700' }}>‹</Text>
        </Pressable>
        <Text style={[styles.monthLabel, { color: colors.text }]}>{monthName}</Text>
        <Pressable
          onPress={() => setMonth((m) => shiftMonth(m, 1))}
          hitSlop={8}
          style={[styles.monthBtn, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <Text style={{ color: colors.primary, fontWeight: '700' }}>›</Text>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
        style={styles.chipsScroll}>
        {categoryOptions.map((c) => {
          const selected = c === category;
          return (
            <Pressable
              key={c}
              onPress={() => setCategory(c)}
              style={[
                styles.chip,
                {
                  borderColor: selected ? colors.primary : colors.border,
                  backgroundColor: selected ? colors.primary : colors.card,
                },
              ]}>
              <Text style={{ color: selected ? colors.onPrimary : colors.text, fontWeight: '600' }}>
                {c}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {expenses.length > 0 && (
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          Swipe left on a row to delete it · {monthLabel(month)}
        </Text>
      )}

      <Animated.FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        itemLayoutAnimation={LinearTransition}
        refreshControl={
          <RefreshControl
            refreshing={syncing}
            onRefresh={() => syncExpenses()}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={[styles.empty, { color: colors.textSecondary }]}>{emptyMessage}</Text>
            {expenses.length === 0 && (
              <Pressable
                onPress={() => router.push('/add')}
                style={[styles.emptyCta, { backgroundColor: colors.primary }]}>
                <Text style={{ color: colors.onPrimary, fontWeight: '700' }}>Add expense</Text>
              </Pressable>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <Animated.View entering={FadeIn} exiting={FadeOutLeft}>
            <SwipeableRow onDelete={() => removeExpense(item.id)}>
              <ExpenseRow
                expense={item}
                onPress={() => router.push({ pathname: '/expense/[id]', params: { id: item.id } })}
              />
            </SwipeableRow>
          </Animated.View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  search: {
    margin: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderRadius: Radius,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontSize: 16,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  monthBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  chipsScroll: {
    flexGrow: 0,
    marginBottom: Spacing.sm,
  },
  chips: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  hint: {
    fontSize: 12,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.xs,
  },
  list: {
    padding: Spacing.md,
    gap: Spacing.sm,
    paddingTop: Spacing.sm,
    flexGrow: 1,
  },
  emptyWrap: {
    alignItems: 'center',
    marginTop: Spacing.xl,
    gap: Spacing.md,
  },
  empty: {
    textAlign: 'center',
  },
  emptyCta: {
    borderRadius: Radius,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
  },
});
