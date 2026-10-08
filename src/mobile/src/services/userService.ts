import { authenticatedFetchApi } from '@/lib/apiClient';
import User, { CreateUserRequest, UpdateUserRequest, UserListPayload } from '@/models/user';

export interface IUserService {
  getUsers(page?: number, pageSize?: number): Promise<User[]>;
  getUserById(id: string): Promise<User>;
  createUser(request: CreateUserRequest): Promise<User>;
  updateUser(id: string, request: UpdateUserRequest): Promise<User>;
  uploadProfilePicture(id: string, file: { uri: string; name: string; type: string }): Promise<User>;
  deleteUser(id: string): Promise<void>;
}

export class UserServiceClient implements IUserService {
  async getUsers(page = 1, pageSize = 20): Promise<User[]> {
    const response = await authenticatedFetchApi(`/users?page=${page}&pageSize=${pageSize}`, {
      method: 'GET',
    });

    const payload = response.data as UserListPayload | undefined;
    return Array.isArray(payload?.items) ? payload.items : [];
  }

  async getUserById(id: string): Promise<User> {
    const response = await authenticatedFetchApi(`/users/${id}`, { method: 'GET' });
    return response.data as User;
  }

  async createUser(request: CreateUserRequest): Promise<User> {
    const response = await authenticatedFetchApi('/users', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    return response.data as User;
  }

  async updateUser(id: string, request: UpdateUserRequest): Promise<User> {
    const response = await authenticatedFetchApi(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(request),
    });
    return response.data as User;
  }

  async uploadProfilePicture(id: string, file: { uri: string; name: string; type: string }): Promise<User> {
    const formData = new FormData();
    formData.append('file', { uri: file.uri, name: file.name, type: file.type } as any);

    const response = await authenticatedFetchApi(`/users/${id}/profilePicture`, {
      method: 'PATCH',
      body: formData,
    });

    return response.data as User;
  }

  async deleteUser(id: string): Promise<void> {
    await authenticatedFetchApi(`/users/${id}`, { method: 'DELETE' });
  }
}