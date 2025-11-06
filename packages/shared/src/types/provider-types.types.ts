// Provider Types
export interface ProviderType {
  id: number;
  name: string; // "hotel", "audiovisuel", "traiteur", "lieu"
  label: string; // "Hôtel", "Prestataire audiovisuel", etc.
  jsonSchema: JsonSchema; // Schema definition for specificities
  createdAt: Date;
  updatedAt: Date;
}

// JSON Schema definition for dynamic fields
export interface JsonSchemaField {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required?: boolean;
  min?: number;
  max?: number;
  items?: string; // For arrays
  properties?: Record<string, JsonSchemaField>; // For objects
}

export type JsonSchema = Record<string, JsonSchemaField>;

// Create/Update types
export interface CreateProviderTypeRequest {
  name: string;
  label: string;
  jsonSchema: JsonSchema;
}

export type UpdateProviderTypeRequest = Partial<CreateProviderTypeRequest>;
