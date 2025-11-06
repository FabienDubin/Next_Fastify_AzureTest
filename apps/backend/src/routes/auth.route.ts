import { FastifyPluginAsync } from 'fastify';
import { loginSchema } from '@repo/shared';
import { AuthService } from '../services/auth.service';

const authRoutes: FastifyPluginAsync = async (server) => {
  const authService = new AuthService(server.prisma);

  // POST /api/auth/login
  server.post('/login', async (request, reply) => {
    try {
      // Validate request body
      const body = loginSchema.parse(request.body);

      // Attempt login
      const result = await authService.login(body);

      if (!result) {
        return reply.status(401).send({
          error: 'Invalid credentials',
        });
      }

      // Generate JWT token
      const token = server.jwt.sign({
        id: result.user.id,
        email: result.user.email,
      });

      return {
        token,
        user: result.user,
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return reply.status(400).send({
          error: 'Validation error',
          details: error,
        });
      }

      server.log.error(error);
      return reply.status(500).send({
        error: 'Internal server error',
      });
    }
  });

  // GET /api/auth/me (protected route)
  server.get(
    '/me',
    {
      onRequest: [server.authenticate],
    },
    async (request, reply) => {
      try {
        const userId = (request.user as any).id;

        const user = await authService.getUserById(userId);

        if (!user) {
          return reply.status(404).send({
            error: 'User not found',
          });
        }

        return user;
      } catch (error) {
        server.log.error(error);
        return reply.status(500).send({
          error: 'Internal server error',
        });
      }
    }
  );
};

export default authRoutes;