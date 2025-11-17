import { apiClient } from './client';
import type {
  ProviderType,
  CreateProviderTypeRequest,
  UpdateProviderTypeRequest,
} from '@mcigroupfrance/testazure-shared';

export const providerTypesApi = {
  /**
   * Get all provider types
   */
  getAll: async (): Promise<ProviderType[]> => {
    const { data } = await apiClient.get<ProviderType[]>('/api/provider-types');
    return data;
  },

  /**
   * Get provider type by ID
   */
  getById: async (id: number): Promise<ProviderType> => {
    const { data } = await apiClient.get<ProviderType>(
      `/api/provider-types/${id}`
    );
    return data;
  },

  /**
   * Create new provider type
   */
  create: async (
    providerType: CreateProviderTypeRequest
  ): Promise<ProviderType> => {
    const { data } = await apiClient.post<ProviderType>(
      '/api/provider-types',
      providerType
    );
    return data;
  },

  /**
   * Update provider type
   */
  update: async (
    id: number,
    providerType: UpdateProviderTypeRequest
  ): Promise<ProviderType> => {
    const { data } = await apiClient.put<ProviderType>(
      `/api/provider-types/${id}`,
      providerType
    );
    return data;
  },

  /**
   * Delete provider type
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/provider-types/${id}`);
  },
};
