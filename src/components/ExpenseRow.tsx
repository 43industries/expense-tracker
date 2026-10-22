import Ionicons from '@expo/vector-icons/Ionicons';
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
  const isIncome = (expense.kind ?? 'expense') === 'income';

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
      ]}>
      <View style={styles.info}>
        <Text
          style={[styles.title, { color: colors.text }]}
          numberOfLines={1}
          ellipsizeMode="tail">
          {expense.title}
        </Text>
        <View style={styles.metaRow}>
          <Text
            style={[styles.meta, { color: colors.textSecondary }]}
            numberOfLines={1}
            ellipsizeMode="tail">
            {expense.category} · {formatDate(expense.date)}
            {isIncome ? ' · Income' : ''}
          </Text>
          {(expense.receiptUri || expense.receiptPath) && (
            <Ionicons
              name="receipt-outline"
              size={13}
              color={colors.textSecondary}
              style={styles.receiptIcon}
            />
          )}
        </View>
      </View>
      <Text
        style={[styles.amount, { color: isIncome ? colors.success : colors.danger }]}
        numberOfLines={1}>
        {isIncome ? '+' : '-'}
        {format(expense.amount)}
      </Text>
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
    minWidth: 0,
    gap: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
    gap: Spacing.xs,
  },
  meta: {
    flexShrink: 1,
    fontSize: 13,
  },
  receiptIcon: {
    flexShrink: 0,
  },
  amount: {
    flexShrink: 0,
    maxWidth: '45%',
    textAlign: 'right',
    fontSize: 16,
    fontWeight: '700',
  },
});
