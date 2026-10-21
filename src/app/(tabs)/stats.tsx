import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { CurrencyStatus } from '@/components/CurrencyStatus';
import { MonthlyChart } from '@/components/MonthlyChart';
import { Radius, Spacing } from '@/constants/theme';
import { useColors } from '@/hooks/use-colors';
import { useMoney } from '@/hooks/use-money';
import { categoryTotals, incomeInMonth, monthKey, monthlyTotals } from '@/lib/stats';
import { useExpenseStore } from '@/store/expenses';

export default function StatsScreen() {
  const colors = useColors();
  const { format } = useMoney();
  const expenses = useExpenseStore((s) => s.expenses);
  const [selected, setSelected] = useState(() => monthKey(new Date()));

  const months = useMemo(() => monthlyTotals(expenses), [expenses]);
  const categories = useMemo(() => categoryTotals(expenses, selected), [expenses, selected]);
  const selectedTotal = months.find((m) => m.key === selected)?.total ?? 0;
  const incomeTotal = useMemo(() => incomeInMonth(expenses, selected), [expenses, selected]);
  const average = months.reduce((sum, m) => sum + m.total, 0) / months.length;

  const [year, month] = selected.split('-').map(Number);
  const selectedName = new Date(year, month - 1, 1).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}>
      <CurrencyStatus />

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.caption, { color: colors.textSecondary }]}>{selectedName}</Text>
        <Text style={[styles.total, { color: colors.text }]}>{format(selectedTotal)}</Text>
        <Text style={[styles.caption, { color: colors.textSecondary }]}>
          Spent · 6-month average: {format(average)}
        </Text>
        {incomeTotal > 0 && (
          <Text style={[styles.caption, { color: colors.success }]}>
            Income this month: {format(incomeTotal)}
          </Text>
        )}
        <View style={{ marginTop: Spacing.md }}>
          <MonthlyChart
            data={months}
            selected={selected}
            onSelect={setSelected}
            formatValue={format}
          />
        </View>
      </View>

      <Text style={[styles.heading, { color: colors.text }]}>By category</Text>
      {categories.length === 0 ? (
        <Text style={{ color: colors.textSecondary }}>No spending in {selectedName}.</Text>
      ) : (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {categories.map(({ category, total }) => (
            <View key={category} style={styles.categoryRow}>
              <View style={styles.categoryHeader}>
                <Text style={{ color: colors.text, fontWeight: '600' }}>{category}</Text>
                <Text style={{ color: colors.textSecondary }}>{format(total)}</Text>
              </View>
              <View style={[styles.track, { backgroundColor: colors.border }]}>
                <View
                  style={[
                    styles.fill,
                    {
                      backgroundColor: colors.primary,
                      width: `${selectedTotal > 0 ? (total / selectedTotal) * 100 : 0}%`,
                    },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.md,
    gap: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  card: {
    borderRadius: Radius,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  caption: {
    fontSize: 13,
  },
  total: {
    fontSize: 28,
    fontWeight: '700',
  },
  heading: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: Spacing.sm,
  },
  categoryRow: {
    gap: 6,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
});
