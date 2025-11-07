import { z } from 'zod';

// Provider status enum
export const providerStatusSchema = z.enum(['active', 'inactive']);

// Create Provider schema
export const createProviderSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(200, 'Name must not exceed 200 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  address: z.string().optional(),
  providerTypeId: z.number().int().positive('Provider type is required'),
  specificities: z.record(z.any()), // Dynamic JSON object
  status: providerStatusSchema.default('active'),
});

// Update Provider schema
export const updateProviderSchema = createProviderSchema.partial();

// Provider filters schema (avec coercion pour les query params HTTP)
export const providerFiltersSchema = z.object({
  providerTypeId: z.coerce.number().int().positive().optional(),
  status: providerStatusSchema.optional(),
  search: z.string().optional(),
  specificities: z.record(z.any()).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export type CreateProviderSchema = z.infer<typeof createProviderSchema>;
export type UpdateProviderSchema = z.infer<typeof updateProviderSchema>;
export type ProviderFiltersSchema = z.infer<typeof providerFiltersSchema>;
