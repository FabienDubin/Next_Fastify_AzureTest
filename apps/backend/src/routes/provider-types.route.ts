import { FastifyPluginAsync } from 'fastify';
import { createProviderTypeSchema, updateProviderTypeSchema } from '@mcigroupfrance/testazure-shared';
import { ProviderTypesService } from '../services/provider-types.service';

const providerTypesRoutes: FastifyPluginAsync = async (server) => {
  const service = new ProviderTypesService(server.prisma);

  // GET /api/provider-types
  server.get(
    '/',
    {
      onRequest: [server.authenticate],
    },
    async (request, reply) => {
      try {
        const types = await service.getAll();
        return types;
      } catch (error) {
        server.log.error(error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );

  // GET /api/provider-types/:id
  server.get(
    '/:id',
    {
      onRequest: [server.authenticate],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const type = await service.getById(parseInt(id, 10));

        if (!type) {
          return reply.status(404).send({ error: 'Provider type not found' });
        }

        return type;
      } catch (error) {
        server.log.error(error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );

  // POST /api/provider-types
  server.post(
    '/',
    {
      onRequest: [server.authenticate],
    },
    async (request, reply) => {
      try {
        const body = createProviderTypeSchema.parse(request.body);
        const type = await service.create(body);

        return reply.status(201).send(type);
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

  // PUT /api/provider-types/:id
  server.put(
    '/:id',
    {
      onRequest: [server.authenticate],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const body = updateProviderTypeSchema.parse(request.body);

        const type = await service.update(parseInt(id, 10), body);

        if (!type) {
          return reply.status(404).send({ error: 'Provider type not found' });
        }

        return type;
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

  // DELETE /api/provider-types/:id
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
        if (error instanceof Error && error.message.includes('Cannot delete')) {
          return reply.status(400).send({ error: error.message });
        }

        server.log.error(error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );
};

export default providerTypesRoutes;
