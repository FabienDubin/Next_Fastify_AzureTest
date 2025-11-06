import { z } from 'zod';

// JSON Schema field definition
const jsonSchemaFieldSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    type: z.enum(['string', 'number', 'boolean', 'array', 'object']),
    required: z.boolean().optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    items: z.string().optional(),
    properties: z.record(jsonSchemaFieldSchema).optional(),
  })
);

// JSON Schema (collection of fields)
export const jsonSchemaSchema = z.record(jsonSchemaFieldSchema);

// Create Provider Type schema
export const createProviderTypeSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must not exceed 50 characters')
    .regex(/^[a-z0-9-]+$/, 'Name must contain only lowercase letters, numbers, and hyphens'),
  label: z
    .string()
    .min(2, 'Label must be at least 2 characters')
    .max(100, 'Label must not exceed 100 characters'),
  jsonSchema: jsonSchemaSchema,
});

// Update Provider Type schema
export const updateProviderTypeSchema = createProviderTypeSchema.partial();

export type CreateProviderTypeSchema = z.infer<typeof createProviderTypeSchema>;
export type UpdateProviderTypeSchema = z.infer<typeof updateProviderTypeSchema>;
