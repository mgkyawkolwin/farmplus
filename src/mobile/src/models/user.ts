export default class User {
    id!: string;
    userName?: string;
    displayName?: string;
    email?: string;
    address?: string;
    city?: string;
    phone?: string;
    nationalId?: string;
    passportNumber?: string;
    isActive?: boolean;
    profilePictureUrl?: string;
    token?: string;
    rowVersion?: string;
    roleId?: string;
    roleName?: string;
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
    phone?: string;
    nationalId?: string;
    passportNumber?: string;
    roleId?: string;
}

export interface UpdateUserRequest {
    displayName: string;
    email: string;
    address?: string;
    city?: string;
    phone?: string;
    nationalId?: string;
    passportNumber?: string;
    isActive?: boolean;
    rowVersion: string;
    roleId?: string;
}

export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
}

export interface UpdateProfileRequest {
    email: string;
    phone?: string;
    nationalId?: string;
    passportNumber?: string;
    address?: string;
    city?: string;
}