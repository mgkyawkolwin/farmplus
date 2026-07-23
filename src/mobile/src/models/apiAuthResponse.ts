import User from '@/models/user';

export default interface ApiAuthResponse {
  success: boolean;
  data?: {
    token?: string;
    user?: User;
  };
  message?: string;
}