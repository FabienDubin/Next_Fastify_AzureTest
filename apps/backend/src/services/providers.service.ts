import { PrismaClient, Prisma } from '@prisma/client';
import {
  CreateProviderRequest,
  UpdateProviderRequest,
  Provider,
  ProviderFiltersSchema,
  PaginatedResponse,
} from '@repo/shared';

export class ProvidersService {
  constructor(private prisma: PrismaClient) {}

  async getAll(filters: ProviderFiltersSchema): Promise<PaginatedResponse<Provider>> {
    const { providerTypeId, status, search, specificities, page = 1, limit = 10 } = filters;

    // Build where clause
    const where: Prisma.ProviderWhereInput = {
      ...(providerTypeId && { providerTypeId }),
      ...(status && { status }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
          { email: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
        ],
      }),
    };

    // Get total count
    const total = await this.prisma.provider.count({ where });

    // Get paginated data
    const providers = await this.prisma.provider.findMany({
      where,
      include: {
        providerType: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
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
            if ('min' in value && providerValue < value.min) return false;
            if ('max' in value && providerValue > value.max) return false;
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

    return {
      data: filteredData,
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
    };
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
    };
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
    };
  }

  async delete(id: number): Promise<boolean> {
    await this.prisma.provider.delete({
      where: { id },
    });

    return true;
  }
}