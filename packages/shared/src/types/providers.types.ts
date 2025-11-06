import { ProviderType } from './provider-types.types';

// Provider status
export type ProviderStatus = 'active' | 'inactive';

// Base Provider interface
export interface Provider {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  providerTypeId: number;
  providerType?: ProviderType;
  specificities: Record<string, any>; // Dynamic JSON field
  status: ProviderStatus;
  createdAt: Date;
  updatedAt: Date;
}

// Create/Update types
export interface CreateProviderRequest {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  providerTypeId: number;
  specificities: Record<string, any>;
  status?: ProviderStatus;
}

export type UpdateProviderRequest = Partial<CreateProviderRequest>;

// Search and filter types
export interface ProviderFilters {
  providerTypeId?: number;
  status?: ProviderStatus;
  search?: string; // Search in name, email
  specificities?: Record<string, any>; // Search in JSON fields
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
