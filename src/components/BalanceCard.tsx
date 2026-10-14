import { StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useColors } from '@/hooks/use-colors';
import { useMoney } from '@/hooks/use-money';

type Props = {
  budget: number;
  spent: number;
};

export function BalanceCard({ budget, spent }: Props) {
  const colors = useColors();
  const { format } = useMoney();
  const balance = budget - spent;

  return (
    <View style={[styles.card, { backgroundColor: colors.primary }]}>
      <Text style={[styles.label, { color: colors.onPrimary }]}>Balance this month</Text>
      <Text style={[styles.balance, { color: colors.onPrimary }]}>{format(balance)}</Text>
      <View style={styles.row}>
        <View>
          <Text style={[styles.label, { color: colors.onPrimary }]}>Budget</Text>
          <Text style={[styles.value, { color: colors.onPrimary }]}>{format(budget)}</Text>
        </View>
        <View style={styles.right}>
          <Text style={[styles.label, { color: colors.onPrimary }]}>Spent</Text>
          <Text style={[styles.value, { color: colors.onPrimary }]}>{format(spent)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius,
    padding: Spacing.lg,
    gap: Spacing.xs,
  },
  label: {
    fontSize: 13,
    opacity: 0.85,
  },
  balance: {
    fontSize: 34,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  right: {
    alignItems: 'flex-end',
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
  },
});
