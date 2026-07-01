#!/bin/sh
set -e

echo "→ Aplicando migrações Prisma..."
cd /app && pnpm --filter goapprove-backend exec prisma migrate deploy

echo "→ Iniciando NestJS em modo watch..."
exec pnpm --filter goapprove-backend start:dev
