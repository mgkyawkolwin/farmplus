import User from './user';

export default class SignInResponse {
    token!: string;
    user!: User;
}