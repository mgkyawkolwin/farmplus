/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { THEME } from '@/lib/theme';
import { useColorScheme } from 'react-native';

export function useThemeColors() {
  const scheme = useColorScheme();
  const theme = scheme === 'unspecified' ? 'light' : scheme;

  return THEME[theme];
}
