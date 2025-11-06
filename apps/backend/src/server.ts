import Fastify from 'fastify';
import cors from '@fastify/cors';
import prismaPlugin from './plugins/prisma.plugin';
import jwtPlugin from './plugins/jwt.plugin';

// Import routes
import authRoutes from './routes/auth.route';
import providerTypesRoutes from './routes/provider-types.route';
import providersRoutes from './routes/providers.route';

const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || '0.0.0.0';

async function buildServer() {
  const server = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
      transport:
        process.env.NODE_ENV === 'development'
          ? {
              target: 'pino-pretty',
              options: {
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
              },
            }
          : undefined,
    },
  });

  // Register plugins
  await server.register(cors, {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  await server.register(prismaPlugin);
  await server.register(jwtPlugin);

  // Health check
  server.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Register routes
  await server.register(authRoutes, { prefix: '/api/auth' });
  await server.register(providerTypesRoutes, { prefix: '/api/provider-types' });
  await server.register(providersRoutes, { prefix: '/api/providers' });

  return server;
}

async function start() {
  try {
    const server = await buildServer();

    await server.listen({ port: PORT, host: HOST });

    server.log.info(`Server listening on ${HOST}:${PORT}`);
    server.log.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

// Handle graceful shutdown
const signals = ['SIGINT', 'SIGTERM'];
signals.forEach((signal) => {
  process.on(signal, async () => {
    console.log(`Received ${signal}, closing server...`);
    process.exit(0);
  });
});

start();
