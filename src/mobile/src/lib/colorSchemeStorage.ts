import * as SecureStore from 'expo-secure-store';

const COLOR_SCHEME_KEY = 'color_scheme';

export type StoredColorScheme = 'light' | 'dark';

export async function getStoredColorScheme(): Promise<StoredColorScheme | null> {
  const value = await SecureStore.getItemAsync(COLOR_SCHEME_KEY);
  return value === 'light' || value === 'dark' ? value : null;
}

export async function storeColorScheme(scheme: StoredColorScheme): Promise<void> {
  await SecureStore.setItemAsync(COLOR_SCHEME_KEY, scheme);
}
