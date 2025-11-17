import { apiClient } from './client';
import type {
  Provider,
  CreateProviderRequest,
  UpdateProviderRequest,
  ProviderFiltersSchema,
  PaginatedResponse,
} from '@mcigroupfrance/testazure-shared';

export const providersApi = {
  /**
   * Get all providers with optional filters
   */
  getAll: async (
    filters?: ProviderFiltersSchema
  ): Promise<PaginatedResponse<Provider>> => {
    const { data } = await apiClient.get<PaginatedResponse<Provider>>(
      '/api/providers',
      { params: filters }
    );
    return data;
  },

  /**
   * Get provider by ID
   */
  getById: async (id: number): Promise<Provider> => {
    const { data } = await apiClient.get<Provider>(`/api/providers/${id}`);
    return data;
  },

  /**
   * Create new provider
   */
  create: async (provider: CreateProviderRequest): Promise<Provider> => {
    const { data } = await apiClient.post<Provider>('/api/providers', provider);
    return data;
  },

  /**
   * Update provider
   */
  update: async (
    id: number,
    provider: UpdateProviderRequest
  ): Promise<Provider> => {
    const { data } = await apiClient.put<Provider>(
      `/api/providers/${id}`,
      provider
    );
    return data;
  },

  /**
   * Delete provider
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/providers/${id}`);
  },
};
