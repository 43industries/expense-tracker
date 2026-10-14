import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { ExpenseRow } from '@/components/ExpenseRow';
import { Radius, Spacing } from '@/constants/theme';
import { useColors } from '@/hooks/use-colors';
import { useExpenseStore } from '@/store/expenses';
import type { Expense } from '@/types/expense';

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

  const confirmDelete = (expense: Expense) => {
    Alert.alert('Delete expense', `Delete "${expense.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeExpense(expense.id) },
    ]);
  };

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

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <Text style={[styles.empty, { color: colors.textSecondary }]}>
            {q ? 'No expenses match your search.' : 'No expenses yet.'}
          </Text>
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <ExpenseRow
                expense={item}
                onPress={() => router.push({ pathname: '/expense/[id]', params: { id: item.id } })}
              />
            </View>
            <Pressable
              onPress={() => confirmDelete(item)}
              hitSlop={8}
              accessibilityLabel={`Delete ${item.title}`}
              style={styles.delete}>
              <Ionicons name="trash-outline" size={22} color={colors.danger} />
            </Pressable>
          </View>
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
  list: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  delete: {
    padding: Spacing.xs,
  },
  empty: {
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
});
