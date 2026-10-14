import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useColors } from '@/hooks/use-colors';
import { useMoney } from '@/hooks/use-money';
import { formatDate } from '@/lib/format';
import type { Expense } from '@/types/expense';

type Props = {
  expense: Expense;
  onPress?: () => void;
};

export function ExpenseRow({ expense, onPress }: Props) {
  const colors = useColors();
  const { format } = useMoney();

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
      ]}>
      <View style={styles.info}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {expense.title}
        </Text>
        <Text style={[styles.meta, { color: colors.textSecondary }]}>
          {expense.category} · {formatDate(expense.date)}
        </Text>
      </View>
      <Text style={[styles.amount, { color: colors.danger }]}>-{format(expense.amount)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.md,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  meta: {
    fontSize: 13,
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
  },
});
