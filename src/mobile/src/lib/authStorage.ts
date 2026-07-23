import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'auth_bearer_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';
const USERNAME_KEY = 'auth_username';
const PERMISSIONS_KEY = 'auth_permissions';

export async function storeToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function storeRefreshToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
}

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export async function clearTokens(): Promise<void> {
  //await SecureStore.removeItemsAsync([TOKEN_KEY, REFRESH_TOKEN_KEY, USERNAME_KEY, PERMISSIONS_KEY]);
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
