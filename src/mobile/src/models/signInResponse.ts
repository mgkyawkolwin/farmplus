export default class SignInResponse {
    id!: string;
    userName?: string;
    displayName?: string;
    email?: string;
    address?: string;
    city?: string;
    profilePictureUrl?: string;
    token!: string;
}