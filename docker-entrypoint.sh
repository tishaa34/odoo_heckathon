#!/bin/sh
set -e

echo "⏳ Applying database schema..."
# Sync the schema to the database. `migrate deploy` is used when migration
# files exist; otherwise we push the schema directly so a fresh volume is
# provisioned without manual steps.
if [ -d "prisma/migrations" ] && [ -n "$(ls -A prisma/migrations 2>/dev/null)" ]; then
  npx prisma migrate deploy
else
  npx prisma db push --skip-generate --accept-data-loss
fi

echo "🌱 Seeding database (idempotent)..."
node dist/prisma/seed.js || echo "⚠️  Seed skipped or already applied."

echo "🚚 Starting TransitOps API..."
exec node dist/src/server.js
