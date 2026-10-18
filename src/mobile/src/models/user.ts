export default class User {
    id!: string;
    userName?: string;
    displayName?: string;
    email?: string;
    address?: string;
    city?: string;
    profilePictureUrl?: string;
    token?: string;
    rowVersion?: string;
    roleId?: string;
}

export interface UserListPayload {
    items?: User[];
    page?: number;
    pageSize?: number;
    totalCount?: number;
    totalPages?: number;
}

export interface CreateUserRequest {
    userName: string;
    displayName?: string;
    email: string;
    password: string;
    address?: string;
    city?: string;
    roleId?: string;
}

export interface UpdateUserRequest {
    displayName: string;
    email: string;
    address?: string;
    city?: string;
    rowVersion: string;
    roleId?: string;
}