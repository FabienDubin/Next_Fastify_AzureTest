import { apiClient } from './client';
import type { LoginRequest, LoginResponse } from '@mcigroupfrance/testazure-shared';

export const authApi = {
  /**
   * Login user
   */
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const { data } = await apiClient.post<LoginResponse>(
      '/api/auth/login',
      credentials
    );
    return data;
  },

  /**
   * Get current user info
   */
  me: async () => {
    const { data } = await apiClient.get('/api/auth/me');
    return data;
  },
};
