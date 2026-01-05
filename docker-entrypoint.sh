#!/bin/sh
set -e

echo "🚀 Starting SprintCopilot..."

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
until nc -z -v -w30 db 5432; do
  echo "⏳ Waiting for database connection..."
  sleep 2
done

echo "✅ PostgreSQL is ready!"

# Run database migrations
echo "🔄 Running database migrations..."
PRISMA_CLI_VERSION="${PRISMA_CLI_VERSION:-6.17.1}"
npx "prisma@${PRISMA_CLI_VERSION}" migrate deploy

echo "✅ Migrations completed!"

# Generate Prisma Client (in case it's not already generated)
echo "🔧 Generating Prisma Client..."
npx "prisma@${PRISMA_CLI_VERSION}" generate

echo "✅ Prisma Client generated!"

# Start the application
echo "🎉 Starting application..."
exec "$@"
