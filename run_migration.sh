#!/bin/bash
# Make sure your database is running first!
# For Docker: docker-compose up -d db

echo "Step 1: Creating migration file (without applying)..."
pnpm prisma migrate dev --create-only --name add_hdd_document_table

echo "Step 2: Applying migration..."
pnpm prisma migrate deploy

echo "✅ Migration complete!"
