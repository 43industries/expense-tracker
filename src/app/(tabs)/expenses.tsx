import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeOutLeft, LinearTransition } from 'react-native-reanimated';

import { ExpenseRow } from '@/components/ExpenseRow';
import { SwipeableRow } from '@/components/SwipeableRow';
import { Radius, Spacing } from '@/constants/theme';
import { useColors } from '@/hooks/use-colors';
import { useExpenseStore } from '@/store/expenses';

export default function ExpensesScreen() {
  const colors = useColors();
  const expenses = useExpenseStore((s) => s.expenses);
  const removeExpense = useExpenseStore((s) => s.removeExpense);
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();
  const filtered = q
    ? expenses.filter(
        (e) => e.title.toLowerCase().includes(q) || e.category.toLowerCase().includes(q),
      )
    : expenses;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search by title or category"
        placeholderTextColor={colors.textSecondary}
        style={[
          styles.search,
          { color: colors.text, backgroundColor: colors.card, borderColor: colors.border },
        ]}
        clearButtonMode="while-editing"
      />
      {expenses.length > 0 && (
        <Text style={[styles.hint, { color: colors.textSecondary }]}>Swipe left on an expense to delete it.</Text>
      )}

      <Animated.FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        itemLayoutAnimation={LinearTransition}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: colors.textSecondary }]}>
            {q ? 'No expenses match your search.' : 'No expenses yet.'}
          </Text>
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
    marginBottom: 0,
    borderWidth: 1,
    borderRadius: Radius,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontSize: 16,
  },
  hint: {
    fontSize: 12,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
  },
  list: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  empty: {
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
});
