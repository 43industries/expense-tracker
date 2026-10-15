import Ionicons from '@expo/vector-icons/Ionicons';
import * as Clipboard from 'expo-clipboard';
import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useColors } from '@/hooks/use-colors';

type Props = {
  value: string;
  onChange: (text: string) => void;
  initiallyOpen?: boolean;
  /** Parse result, error or loading state rendered under the input. */
  children?: ReactNode;
};

export function MpesaSmsCard({ value, onChange, initiallyOpen = false, children }: Props) {
  const colors = useColors();
  const [open, setOpen] = useState(initiallyOpen || value.length > 0);

  const paste = async () => {
    const text = await Clipboard.getStringAsync();
    if (text) onChange(text);
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Pressable style={styles.header} onPress={() => setOpen(!open)}>
        <Ionicons name="phone-portrait-outline" size={18} color={colors.success} />
        <Text style={[styles.title, { color: colors.text }]}>From M-Pesa SMS</Text>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={colors.textSecondary}
        />
      </Pressable>

      {open && (
        <View style={styles.body}>
          <TextInput
            value={value}
            onChangeText={onChange}
            placeholder="Paste the M-Pesa confirmation message here"
            placeholderTextColor={colors.textSecondary}
            multiline
            style={[
              styles.input,
              { color: colors.text, borderColor: colors.border, backgroundColor: colors.background },
            ]}
          />
          <View style={styles.row}>
            <Pressable onPress={paste} style={[styles.button, { borderColor: colors.border }]}>
              <Text style={{ color: colors.primary, fontWeight: '700' }}>Paste</Text>
            </Pressable>
            {value.length > 0 && (
              <Pressable
                onPress={() => onChange('')}
                style={[styles.button, { borderColor: colors.border }]}>
                <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>Clear</Text>
              </Pressable>
            )}
          </View>
          {children}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
  },
  body: {
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  input: {
    minHeight: 90,
    borderWidth: 1,
    borderRadius: Radius,
    padding: Spacing.md,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  button: {
    borderWidth: 1,
    borderRadius: Radius,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
  },
});
