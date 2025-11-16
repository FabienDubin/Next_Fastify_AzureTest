#!/bin/sh
echo "=== Starting deployment script ==="
echo "Generating Prisma Client..."
npx prisma generate --schema=./prisma/schema.prisma

echo "Prisma Client generated successfully!"
echo "Starting Fastify server..."
node dist/server.js
