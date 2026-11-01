import * as SecureStore from 'expo-secure-store';
import User from '@/models/user';

const TOKEN_KEY = 'auth_bearer_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';
const USERNAME_KEY = 'auth_username';
const PERMISSIONS_KEY = 'auth_permissions';
const AUTH_USER_STORAGE_KEY = 'auth_user';
const SELECTED_SHOP_ID_KEY = 'selected_shop_id';

export async function storeToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function getAuthUser(): Promise<User | null> {
  const raw = await SecureStore.getItemAsync(AUTH_USER_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export async function hasStoredSession(): Promise<boolean> {
  const [token, user] = await Promise.all([getToken(), getAuthUser()]);
  return Boolean(token && user);
}

export async function storeRefreshToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
}

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export async function clearTokens(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
    SecureStore.deleteItemAsync(USERNAME_KEY),
    SecureStore.deleteItemAsync(PERMISSIONS_KEY),
    SecureStore.deleteItemAsync(AUTH_USER_STORAGE_KEY),
    SecureStore.deleteItemAsync(SELECTED_SHOP_ID_KEY),
  ]);
}

export async function storeSelectedShopId(shopId: string): Promise<void> {
  await SecureStore.setItemAsync(SELECTED_SHOP_ID_KEY, shopId);
}

export async function getSelectedShopId(): Promise<string | null> {
  return SecureStore.getItemAsync(SELECTED_SHOP_ID_KEY);
}

export async function clearSelectedShopId(): Promise<void> {
  await SecureStore.deleteItemAsync(SELECTED_SHOP_ID_KEY);
}

export async function storeUsername(username: string): Promise<void> {
  await SecureStore.setItemAsync(USERNAME_KEY, username);
}

export async function getUsername(): Promise<string | null> {
  return SecureStore.getItemAsync(USERNAME_KEY);
}

export async function storePermissions(permissions: string[]): Promise<void> {
  await SecureStore.setItemAsync(PERMISSIONS_KEY, JSON.stringify(permissions));
}

export async function getPermissions(): Promise<string[]> {
  const raw = await SecureStore.getItemAsync(PERMISSIONS_KEY);
  return raw ? JSON.parse(raw) : [];
}
