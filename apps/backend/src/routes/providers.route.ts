import { FastifyPluginAsync } from 'fastify';
import { createProviderSchema, updateProviderSchema, providerFiltersSchema } from '@repo/shared';
import { ProvidersService } from '../services/providers.service';

const providersRoutes: FastifyPluginAsync = async (server) => {
  const service = new ProvidersService(server.prisma);

  // GET /api/providers (with filters and search)
  server.get(
    '/',
    {
      onRequest: [server.authenticate],
    },
    async (request, reply) => {
      try {
        const filters = providerFiltersSchema.parse(request.query);
        const result = await service.getAll(filters);

        return result;
      } catch (error) {
        if (error instanceof Error && error.name === 'ZodError') {
          return reply.status(400).send({
            error: 'Validation error',
            details: error,
          });
        }

        server.log.error(error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );

  // GET /api/providers/:id
  server.get(
    '/:id',
    {
      onRequest: [server.authenticate],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const provider = await service.getById(parseInt(id, 10));

        if (!provider) {
          return reply.status(404).send({ error: 'Provider not found' });
        }

        return provider;
      } catch (error) {
        server.log.error(error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );

  // POST /api/providers
  server.post(
    '/',
    {
      onRequest: [server.authenticate],
    },
    async (request, reply) => {
      try {
        const body = createProviderSchema.parse(request.body);
        const provider = await service.create(body);

        return reply.status(201).send(provider);
      } catch (error) {
        if (error instanceof Error && error.name === 'ZodError') {
          return reply.status(400).send({
            error: 'Validation error',
            details: error,
          });
        }

        server.log.error(error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );

  // PUT /api/providers/:id
  server.put(
    '/:id',
    {
      onRequest: [server.authenticate],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const body = updateProviderSchema.parse(request.body);

        const provider = await service.update(parseInt(id, 10), body);

        if (!provider) {
          return reply.status(404).send({ error: 'Provider not found' });
        }

        return provider;
      } catch (error) {
        if (error instanceof Error && error.name === 'ZodError') {
          return reply.status(400).send({
            error: 'Validation error',
            details: error,
          });
        }

        server.log.error(error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );

  // DELETE /api/providers/:id
  server.delete(
    '/:id',
    {
      onRequest: [server.authenticate],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        await service.delete(parseInt(id, 10));

        return reply.status(204).send();
      } catch (error) {
        server.log.error(error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );
};

export default providersRoutes;
