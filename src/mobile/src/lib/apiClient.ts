import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import CustomError from './customError';
import ApiResponse from '@/models/apiResponse'
import { getToken } from '@/lib/authStorage';

const DEFAULT_API_BASE_URL = 'http://192.168.50.101:5555/api';
// const DEFAULT_API_BASE_URL = 'https://farmplus.preview.software/api';
// const DEFAULT_API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;
export const API_BASE_URL = DEFAULT_API_BASE_URL;
const AUTH_USER_STORAGE_KEY = 'auth_user';

export async function fetchJson(path: string, options: RequestInit = {}): Promise<ApiResponse<any>> {
  console.log('API Request:', { API_BASE_URL, path, options });
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers,
    ...options,
  });

  console.log({statusText: response.statusText, status: response.status });

  // Handle 401 Unauthorized response - token is invalid/expired
  if (response.status === 401) {
    // Clear stored auth user
    await SecureStore.deleteItemAsync(AUTH_USER_STORAGE_KEY);
    // Redirect to sign in page
    router.replace('/auth/signin');
  }

  if (!response.ok) {
        throw new CustomError(`Invalid response ${response.status} - ${response.statusText}. Please try again.`);
  }

  const responseJson = await response.json() as unknown as ApiResponse<any>;
  console.log(responseJson);

  if (!responseJson.success){
    throw new CustomError(responseJson.message);
  }

  return responseJson;
}

export async function authenticatedFetchJson(path: string, options: RequestInit = {}): Promise<ApiResponse<any>> {
  const token = await getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetchJson(path, { ...options, headers });

  return response;
}

export async function fetchApi(path: string, options: RequestInit = {}): Promise<ApiResponse<any>> {
  return fetchJson(path, options);
}

export async function authenticatedFetchApi(path: string, options: RequestInit = {}): Promise<ApiResponse<any>> {
  console.log('Authenticated API Request:', { path, options });
  return authenticatedFetchJson(path, options);
}
