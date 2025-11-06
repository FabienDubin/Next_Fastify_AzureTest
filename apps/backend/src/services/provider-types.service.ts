import { PrismaClient } from '@prisma/client';
import { CreateProviderTypeRequest, UpdateProviderTypeRequest, ProviderType } from '@repo/shared';

export class ProviderTypesService {
  constructor(private prisma: PrismaClient) {}

  async getAll(): Promise<ProviderType[]> {
    const types = await this.prisma.providerType.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Parse JSON schema from string to object
    return types.map((type) => ({
      ...type,
      jsonSchema: JSON.parse(type.jsonSchema),
    }));
  }

  async getById(id: number): Promise<ProviderType | null> {
    const type = await this.prisma.providerType.findUnique({
      where: { id },
    });

    if (!type) {
      return null;
    }

    return {
      ...type,
      jsonSchema: JSON.parse(type.jsonSchema),
    };
  }

  async create(data: CreateProviderTypeRequest): Promise<ProviderType> {
    const type = await this.prisma.providerType.create({
      data: {
        name: data.name,
        label: data.label,
        jsonSchema: JSON.stringify(data.jsonSchema),
      },
    });

    return {
      ...type,
      jsonSchema: JSON.parse(type.jsonSchema),
    };
  }

  async update(id: number, data: UpdateProviderTypeRequest): Promise<ProviderType | null> {
    const existing = await this.prisma.providerType.findUnique({
      where: { id },
    });

    if (!existing) {
      return null;
    }

    const updated = await this.prisma.providerType.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.label && { label: data.label }),
        ...(data.jsonSchema && { jsonSchema: JSON.stringify(data.jsonSchema) }),
      },
    });

    return {
      ...updated,
      jsonSchema: JSON.parse(updated.jsonSchema),
    };
  }

  async delete(id: number): Promise<boolean> {
    // Check if any providers are using this type
    const providersCount = await this.prisma.provider.count({
      where: { providerTypeId: id },
    });

    if (providersCount > 0) {
      throw new Error(`Cannot delete provider type with ${providersCount} associated providers`);
    }

    await this.prisma.providerType.delete({
      where: { id },
    });

    return true;
  }
}
