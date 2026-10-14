import * as ImagePicker from 'expo-image-picker';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { ReceiptImage } from '@/components/ReceiptImage';
import { Radius, Spacing } from '@/constants/theme';
import { useColors } from '@/hooks/use-colors';

type Props = {
  uri?: string;
  path?: string;
  onChange: (uri: string | undefined) => void;
};

type Source = 'camera' | 'library';

const LABELS: Record<Source, string> = { camera: 'camera', library: 'photo library' };

async function ensurePermission(source: Source): Promise<boolean> {
  const permission =
    source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (permission.granted) return true;

  const message = `Allow access to your ${LABELS[source]} to attach a receipt. You can still save the expense without one.`;
  Alert.alert(
    'Permission needed',
    message,
    permission.canAskAgain
      ? [{ text: 'OK' }]
      : [
          { text: 'Not now', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ],
  );
  return false;
}

export function ReceiptPicker({ uri, path, onChange }: Props) {
  const colors = useColors();
  const hasReceipt = Boolean(uri || path);

  const pick = async (source: Source) => {
    if (!(await ensurePermission(source))) return;
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.6 };
    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);
    if (!result.canceled) onChange(result.assets[0].uri);
  };

  const buttonStyle = [styles.button, { borderColor: colors.border, backgroundColor: colors.card }];

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>Receipt (optional)</Text>
      {hasReceipt && <ReceiptImage uri={uri} path={path} style={styles.preview} />}
      <View style={styles.row}>
        <Pressable style={buttonStyle} onPress={() => pick('camera')}>
          <Text style={{ color: colors.text }}>{hasReceipt ? 'Retake' : 'Take photo'}</Text>
        </Pressable>
        <Pressable style={buttonStyle} onPress={() => pick('library')}>
          <Text style={{ color: colors.text }}>Choose photo</Text>
        </Pressable>
        {hasReceipt && (
          <Pressable style={buttonStyle} onPress={() => onChange(undefined)}>
            <Text style={{ color: colors.danger }}>Remove</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.xs,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  preview: {
    width: '100%',
    height: 200,
    borderRadius: Radius,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  button: {
    borderWidth: 1,
    borderRadius: Radius,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
});
