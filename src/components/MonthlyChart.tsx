import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useColors } from '@/hooks/use-colors';
import { monthLabel } from '@/lib/stats';

const CHART_HEIGHT = 160;

type Props = {
  data: { key: string; total: number }[];
  selected: string;
  onSelect: (key: string) => void;
  formatValue: (value: number) => string;
};

export function MonthlyChart({ data, selected, onSelect, formatValue }: Props) {
  const colors = useColors();
  const max = Math.max(...data.map((d) => d.total), 0);

  return (
    <View style={styles.chart}>
      {data.map(({ key, total }) => {
        const isSelected = key === selected;
        const height = max > 0 ? Math.max((total / max) * CHART_HEIGHT, total > 0 ? 4 : 0) : 0;
        return (
          <Pressable
            key={key}
            onPress={() => onSelect(key)}
            style={styles.column}
            accessibilityLabel={`${monthLabel(key)}: ${formatValue(total)}`}>
            <View style={styles.barArea}>
              <View
                style={[
                  styles.bar,
                  {
                    height,
                    backgroundColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
              />
            </View>
            <Text
              style={[
                styles.label,
                { color: isSelected ? colors.text : colors.textSecondary },
                isSelected && styles.labelSelected,
              ]}>
              {monthLabel(key)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
  },
  column: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  barArea: {
    height: CHART_HEIGHT,
    width: '100%',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  label: {
    fontSize: 12,
  },
  labelSelected: {
    fontWeight: '700',
  },
});
