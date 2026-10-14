import { router } from 'expo-router';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';

import { ExpenseForm } from '@/components/ExpenseForm';
import { Spacing } from '@/constants/theme';
import { useColors } from '@/hooks/use-colors';
import { useExpenseStore } from '@/store/expenses';

export default function AddExpenseScreen() {
  const colors = useColors();
  const addExpense = useExpenseStore((s) => s.addExpense);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <ExpenseForm
          onSubmit={(input) => {
            addExpense(input);
            router.back();
          }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.md,
  },
});
