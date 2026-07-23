import User from '@/models/user';
import { fetchJson } from '@/lib/apiClient';
import ApiAuthResponse from '@/models/apiAuthResponse';
import ApiResponse from '@/models/apiResponse';
import { RegisterResponse, SignInResponse } from '@/models';
import { storeToken } from '@/lib/authStorage';

export const AuthServiceToken = Symbol('AuthService');

export interface IAuthService {
  signIn(userName: string, password: string): Promise<ApiResponse<SignInResponse>>;
  register(userName: string, displayName: string, password: string, email?: string, phone?: string): Promise<ApiResponse<RegisterResponse>>;
}

export class AuthServiceClient implements IAuthService {


  async signIn(username: string, password: string): Promise<ApiResponse<SignInResponse>> {
    console.log({username, password});
    const response = await fetchJson('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });


    await storeToken(response.data?.token ?? '');

    return { ...response };
  }

  async register(userName: string, displayName: string, password: string, email?: string, phone?: string): Promise<ApiResponse<RegisterResponse>> {
    const response = await fetchJson('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ userName, displayName, email, password, phone }),
    });

    return response;
  }
}
