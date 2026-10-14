import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { ReceiptPicker } from '@/components/ReceiptPicker';
import { Radius, Spacing } from '@/constants/theme';
import { useColors } from '@/hooks/use-colors';
import { useMoney } from '@/hooks/use-money';
import { CATEGORIES, type Category, type ExpenseInput } from '@/types/expense';

type Props = {
  initial?: Partial<ExpenseInput>;
  submitLabel?: string;
  onSubmit: (input: ExpenseInput) => void;
};

type Errors = { title?: string; amount?: string };

export function validateExpense(title: string, amountText: string): Errors {
  const errors: Errors = {};
  if (!title.trim()) {
    errors.title = 'Title is required';
  } else if (title.trim().length > 60) {
    errors.title = 'Keep the title under 60 characters';
  }

  const amount = Number(amountText.replace(',', '.'));
  if (!amountText.trim()) {
    errors.amount = 'Amount is required';
  } else if (Number.isNaN(amount)) {
    errors.amount = 'Amount must be a number';
  } else if (amount <= 0) {
    errors.amount = 'Amount must be greater than 0';
  }
  return errors;
}

export function ExpenseForm({ initial, submitLabel = 'Add expense', onSubmit }: Props) {
  const colors = useColors();
  const { currency, toDisplay, fromDisplay } = useMoney();
  const [title, setTitle] = useState(initial?.title ?? '');
  const [amountText, setAmountText] = useState(
    initial?.amount ? String(Math.round(toDisplay(initial.amount) * 100) / 100) : '',
  );
  const [category, setCategory] = useState<Category>(initial?.category ?? 'Food');
  const [receiptUri, setReceiptUri] = useState(initial?.receiptUri);
  const [receiptPath, setReceiptPath] = useState(initial?.receiptPath);
  const [errors, setErrors] = useState<Errors>({});

  const changeReceipt = (uri: string | undefined) => {
    setReceiptUri(uri);
    // A new or removed photo means the uploaded copy no longer applies.
    setReceiptPath(undefined);
  };

  const handleSubmit = () => {
    const nextErrors = validateExpense(title, amountText);
    setErrors(nextErrors);
    if (nextErrors.title || nextErrors.amount) return;

    onSubmit({
      title: title.trim(),
      amount: Math.round(fromDisplay(Number(amountText.replace(',', '.'))) * 1e6) / 1e6,
      category,
      receiptUri,
      receiptPath,
    });

    if (!initial) {
      setTitle('');
      setAmountText('');
      setCategory('Food');
      changeReceipt(undefined);
    }
  };

  const inputStyle = [
    styles.input,
    { color: colors.text, backgroundColor: colors.card, borderColor: colors.border },
  ];

  return (
    <View style={styles.form}>
      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Title</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Lunch"
          placeholderTextColor={colors.textSecondary}
          style={[inputStyle, errors.title && { borderColor: colors.danger }]}
          returnKeyType="next"
        />
        {errors.title && <Text style={[styles.error, { color: colors.danger }]}>{errors.title}</Text>}
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Amount ({currency})</Text>
        <TextInput
          value={amountText}
          onChangeText={setAmountText}
          placeholder="0.00"
          placeholderTextColor={colors.textSecondary}
          keyboardType="decimal-pad"
          style={[inputStyle, errors.amount && { borderColor: colors.danger }]}
        />
        {errors.amount && (
          <Text style={[styles.error, { color: colors.danger }]}>{errors.amount}</Text>
        )}
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Category</Text>
        <View style={styles.chips}>
          {CATEGORIES.map((c) => {
            const selected = c === category;
            return (
              <Pressable
                key={c}
                onPress={() => setCategory(c)}
                style={[
                  styles.chip,
                  {
                    borderColor: selected ? colors.primary : colors.border,
                    backgroundColor: selected ? colors.primary : colors.card,
                  },
                ]}>
                <Text style={{ color: selected ? colors.onPrimary : colors.text }}>{c}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <ReceiptPicker uri={receiptUri} path={receiptPath} onChange={changeReceipt} />

      <Pressable
        onPress={handleSubmit}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 },
        ]}>
        <Text style={[styles.buttonText, { color: colors.onPrimary }]}>{submitLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: Spacing.md,
  },
  field: {
    gap: Spacing.xs,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: Radius,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontSize: 16,
  },
  error: {
    fontSize: 13,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  button: {
    borderRadius: Radius,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
