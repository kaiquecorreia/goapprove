#!/bin/sh
set -e

# prisma/ é montado como volume: o client gerado no build da imagem fica
# desatualizado sempre que o schema muda, então regenera a cada start.
echo "→ Gerando Prisma Client..."
cd /app && pnpm --filter goapprove-backend prisma:generate

echo "→ Aplicando migrações Prisma..."
cd /app && pnpm --filter goapprove-backend exec prisma migrate deploy

echo "→ Iniciando NestJS em modo watch..."
exec pnpm --filter goapprove-backend start:dev
