import { router, useLocalSearchParams } from 'expo-router';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
} from 'react-native';

import { ExpenseForm } from '@/components/ExpenseForm';
import { Spacing } from '@/constants/theme';
import { useColors } from '@/hooks/use-colors';
import { formatDate } from '@/lib/format';
import { useExpenseStore } from '@/store/expenses';

export default function EditExpenseScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const expense = useExpenseStore((s) => s.expenses.find((e) => e.id === id));
  const updateExpense = useExpenseStore((s) => s.updateExpense);
  const removeExpense = useExpenseStore((s) => s.removeExpense);

  if (!expense) {
    return (
      <Text style={[styles.missing, { color: colors.textSecondary }]}>
        This expense no longer exists.
      </Text>
    );
  }

  const confirmDelete = () => {
    Alert.alert('Delete expense', `Delete "${expense.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          removeExpense(expense.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={{ color: colors.textSecondary }}>Added {formatDate(expense.date)}</Text>
        <ExpenseForm
          initial={expense}
          submitLabel="Save changes"
          onSubmit={(input) => {
            updateExpense(expense.id, input);
            router.back();
          }}
        />
        <Pressable onPress={confirmDelete} style={styles.delete}>
          <Text style={{ color: colors.danger, fontWeight: '700', fontSize: 16 }}>
            Delete expense
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  delete: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  missing: {
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
});
