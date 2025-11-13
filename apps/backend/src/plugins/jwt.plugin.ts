import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import jwt from '@fastify/jwt';

const jwtPlugin: FastifyPluginAsync = async (server) => {
  await server.register(jwt, {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
  });

  // Decorator for authenticating requests
  server.decorate('authenticate', async function (request: FastifyRequest, reply: FastifyReply) {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.status(401).send({ error: 'Unauthorized' });
    }
  });
};

// Type declaration for authenticate decorator
declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export default fp(jwtPlugin, {
  name: 'jwt',
});
