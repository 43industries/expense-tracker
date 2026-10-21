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
  const ratio = budget > 0 ? spent / budget : 0;
  const over = spent > budget && budget > 0;
  const nearLimit = !over && ratio >= 0.9 && budget > 0;
  const progress = Math.min(ratio, 1);
  const barColor = over ? colors.danger : nearLimit ? colors.warning : colors.onPrimary;

  return (
    <View style={[styles.card, { backgroundColor: colors.primary }]}>
      <Text style={[styles.label, { color: colors.onPrimary }]}>Balance this month</Text>
      <Text style={[styles.balance, { color: colors.onPrimary }]}>{format(balance)}</Text>

      {budget > 0 && (
        <View style={styles.progressBlock}>
          <View style={[styles.track, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
            <View style={[styles.fill, { width: `${progress * 100}%`, backgroundColor: barColor }]} />
          </View>
          {over ? (
            <Text style={[styles.alert, { color: colors.onPrimary }]}>
              Over budget by {format(spent - budget)}
            </Text>
          ) : nearLimit ? (
            <Text style={[styles.alert, { color: colors.onPrimary }]}>
              {Math.round(ratio * 100)}% of budget used
            </Text>
          ) : null}
        </View>
      )}

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
    marginBottom: Spacing.sm,
  },
  progressBlock: {
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  track: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
  alert: {
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.95,
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
