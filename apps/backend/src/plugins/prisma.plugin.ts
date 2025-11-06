import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { PrismaClient } from '@prisma/client';

// Extend FastifyInstance type to include prisma
declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

const prismaPlugin: FastifyPluginAsync = async (server) => {
  const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

  // Add prisma to Fastify instance
  server.decorate('prisma', prisma);

  // Close connection on server shutdown
  server.addHook('onClose', async (server) => {
    await server.prisma.$disconnect();
  });
};

export default fp(prismaPlugin, {
  name: 'prisma',
});
