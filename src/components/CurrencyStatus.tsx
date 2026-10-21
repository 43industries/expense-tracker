import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useColors } from '@/hooks/use-colors';
import { useMoney } from '@/hooks/use-money';

/** Explains why amounts are shown in USD when the user asked for KES. Renders nothing otherwise. */
export function CurrencyStatus() {
  const colors = useColors();
  const { requested, currency, rates } = useMoney();

  if (requested === currency) return null;

  if (rates.isPending) {
    return (
      <View style={[styles.banner, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={[styles.text, { color: colors.textSecondary }]}>Loading exchange rates...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.banner, { backgroundColor: colors.card, borderColor: colors.danger }]}>
      <Text style={[styles.text, { color: colors.text }]}>
        Couldn&apos;t load KES rates, so amounts are shown in USD.
      </Text>
      <Pressable onPress={() => rates.refetch()} disabled={rates.isFetching} hitSlop={8}>
        {rates.isFetching ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Text style={{ color: colors.primary, fontWeight: '700' }}>Retry</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius,
    borderWidth: 1,
  },
  text: {
    flex: 1,
    fontSize: 14,
  },
});
