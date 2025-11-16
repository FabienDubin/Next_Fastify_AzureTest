#!/bin/sh
echo "=== Starting deployment script ==="
echo "Generating Prisma Client..."

# Use node directly to avoid permission issues with npx
node ./node_modules/prisma/build/index.js generate --schema=./prisma/schema.prisma

echo "Prisma Client generated successfully!"
echo "Starting Fastify server..."
node dist/server.js
