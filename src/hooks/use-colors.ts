import { useColorScheme } from 'react-native';

import { Colors, type Palette } from '@/constants/theme';
import { useSettingsStore } from '@/store/settings';

export function useResolvedScheme(): 'light' | 'dark' {
  const system = useColorScheme();
  const preference = useSettingsStore((s) => s.theme);
  if (preference !== 'system') return preference;
  return system === 'dark' ? 'dark' : 'light';
}

export function useColors(): Palette {
  return Colors[useResolvedScheme()];
}
