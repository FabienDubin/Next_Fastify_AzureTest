import { PrismaClient, Prisma } from '@prisma/client';
import {
  CreateProviderRequest,
  UpdateProviderRequest,
  Provider,
  ProviderFiltersSchema,
  PaginatedResponse,
} from '@mcigroupfrance/testazure-shared';

export class ProvidersService {
  constructor(private prisma: PrismaClient) {}

  async getAll(filters: ProviderFiltersSchema): Promise<PaginatedResponse<Provider>> {
    const { providerTypeId, status, search, specificities, page = 1, limit = 10 } = filters;

    // Build where clause
    // IMPORTANT: Si on a une recherche textuelle (search), on ne filtre PAS par search dans SQL
    // car on doit AUSSI chercher dans les spécificités (JSON) qui ne sont pas queryables en SQL
    // On charge donc TOUS les providers (avec les autres filtres) puis on filtre en mémoire
    const where: Prisma.ProviderWhereInput = {
      ...(providerTypeId && { providerTypeId }),
      ...(status && { status }),
      // Pas de filtre search ici - on le fera en mémoire pour inclure les spécificités
    };

    // Get all matching providers (will filter by search in memory if needed)
    const shouldSearchInMemory = search && search.length > 0;
    const providers = await this.prisma.provider.findMany({
      where,
      include: {
        providerType: true,
      },
      orderBy: { createdAt: 'desc' },
      // Only apply pagination if not searching (we'll filter in memory then paginate)
      ...(!shouldSearchInMemory && {
        skip: (page - 1) * limit,
        take: limit,
      }),
    });

    // Parse JSON specificities
    const data = providers.map((provider) => ({
      ...provider,
      specificities: JSON.parse(provider.specificities),
      providerType: {
        ...provider.providerType,
        jsonSchema: JSON.parse(provider.providerType.jsonSchema),
      },
    }));

    // Filter by specificities if provided (search in JSON)
    let filteredData = data;
    if (specificities && Object.keys(specificities).length > 0) {
      filteredData = data.filter((provider) => {
        return Object.entries(specificities).every(([key, value]) => {
          const providerValue = provider.specificities[key];

          // Handle different comparison types
          if (typeof value === 'object' && value !== null) {
            // Support for range queries: { min: 3, max: 5 }
            if ('min' in value && typeof value.min === 'number' && providerValue < value.min) return false;
            if ('max' in value && typeof value.max === 'number' && providerValue > value.max) return false;
            return true;
          }

          // Handle array contains
          if (Array.isArray(providerValue)) {
            return providerValue.includes(value);
          }

          // Exact match
          return providerValue === value;
        });
      });
    }

    // Search filtering: search in ALL fields (basic + specificities)
    if (search && search.length > 0) {
      const searchLower = search.toLowerCase();

      filteredData = filteredData.filter((provider) => {
        // 1. Check basic fields (name, email, address, phone)
        const matchesBasicFields =
          provider.name?.toLowerCase().includes(searchLower) ||
          provider.email?.toLowerCase().includes(searchLower) ||
          provider.address?.toLowerCase().includes(searchLower) ||
          provider.phone?.toLowerCase().includes(searchLower);

        if (matchesBasicFields) return true;

        // 2. Check specificities values (all types)
        const matchesInSpecificities = Object.values(provider.specificities).some((value) => {
          if (value === null || value === undefined) return false;

          // Handle strings
          if (typeof value === 'string') {
            return value.toLowerCase().includes(searchLower);
          }

          // Handle numbers
          if (typeof value === 'number') {
            return value.toString().includes(searchLower);
          }

          // Handle arrays
          if (Array.isArray(value)) {
            return value.some((item) =>
              item?.toString().toLowerCase().includes(searchLower)
            );
          }

          // Handle booleans
          if (typeof value === 'boolean') {
            return value.toString().toLowerCase().includes(searchLower);
          }

          return false;
        });

        return matchesInSpecificities;
      });
    }

    // Apply pagination after all filtering
    const paginatedData = shouldSearchInMemory
      ? filteredData.slice((page - 1) * limit, page * limit)
      : filteredData;

    return {
      data: paginatedData as Provider[],
      total: filteredData.length,
      page,
      limit,
    };
  }

  async getById(id: number): Promise<Provider | null> {
    const provider = await this.prisma.provider.findUnique({
      where: { id },
      include: {
        providerType: true,
      },
    });

    if (!provider) {
      return null;
    }

    return {
      ...provider,
      specificities: JSON.parse(provider.specificities),
      providerType: {
        ...provider.providerType,
        jsonSchema: JSON.parse(provider.providerType.jsonSchema),
      },
    } as Provider;
  }

  async create(data: CreateProviderRequest): Promise<Provider> {
    const provider = await this.prisma.provider.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        address: data.address || null,
        providerTypeId: data.providerTypeId,
        specificities: JSON.stringify(data.specificities),
        status: data.status || 'active',
      },
      include: {
        providerType: true,
      },
    });

    return {
      ...provider,
      specificities: JSON.parse(provider.specificities),
      providerType: {
        ...provider.providerType,
        jsonSchema: JSON.parse(provider.providerType.jsonSchema),
      },
    } as Provider;
  }

  async update(id: number, data: UpdateProviderRequest): Promise<Provider | null> {
    const existing = await this.prisma.provider.findUnique({
      where: { id },
    });

    if (!existing) {
      return null;
    }

    const updated = await this.prisma.provider.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.email && { email: data.email }),
        ...(data.phone !== undefined && { phone: data.phone || null }),
        ...(data.address !== undefined && { address: data.address || null }),
        ...(data.providerTypeId && { providerTypeId: data.providerTypeId }),
        ...(data.specificities && { specificities: JSON.stringify(data.specificities) }),
        ...(data.status && { status: data.status }),
      },
      include: {
        providerType: true,
      },
    });

    return {
      ...updated,
      specificities: JSON.parse(updated.specificities),
      providerType: {
        ...updated.providerType,
        jsonSchema: JSON.parse(updated.providerType.jsonSchema),
      },
    } as Provider;
  }

  async delete(id: number): Promise<boolean> {
    await this.prisma.provider.delete({
      where: { id },
    });

    return true;
  }
}