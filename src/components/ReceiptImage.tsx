import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  View,
  type ImageStyle,
  type StyleProp,
} from 'react-native';

import { useColors } from '@/hooks/use-colors';
import { RECEIPTS_BUCKET, isSupabaseConfigured, supabase } from '@/lib/supabase';

type Props = {
  uri?: string;
  path?: string;
  style?: StyleProp<ImageStyle>;
};

/** Shows the on-device photo if it still exists, otherwise a signed URL for the uploaded copy. */
export function ReceiptImage({ uri, path, style }: Props) {
  const colors = useColors();
  const [localFailed, setLocalFailed] = useState(false);
  const useRemote = (!uri || localFailed) && !!path && isSupabaseConfigured;

  const signed = useQuery({
    queryKey: ['receipt', path],
    enabled: useRemote,
    staleTime: 50 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.storage
        .from(RECEIPTS_BUCKET)
        .createSignedUrl(path!, 60 * 60);
      if (error) throw error;
      return data.signedUrl;
    },
  });

  const source = useRemote ? signed.data : localFailed ? undefined : uri;

  if (!source) {
    return (
      <View style={[styles.placeholder, style, { backgroundColor: colors.border }]}>
        {useRemote && signed.isPending ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <Text style={{ color: colors.textSecondary }}>Receipt unavailable</Text>
        )}
      </View>
    );
  }

  return (
    <Image
      source={{ uri: source }}
      style={style}
      resizeMode="cover"
      onError={() => !useRemote && setLocalFailed(true)}
    />
  );
}

const styles = StyleSheet.create({
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
