import 'dotenv/config';
import { PrismaClient, UserRole } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

import { isDatabaseSslEnabled } from '../src/shared/prisma/database-ssl';

const SALT_ROUNDS = 12; // must match src/shared/password/password.service.ts

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: isDatabaseSslEnabled() ? { rejectUnauthorized: false } : undefined,
  });

  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const email = process.env.SEED_ADMIN_EMAIL ?? 'kaique.rc.tl@gmail.com';
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!';
  const name = process.env.SEED_ADMIN_NAME ?? 'Administrator';

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      name,
      email,
      passwordHash,
      role: UserRole.ADMINISTRATOR,
      active: true,
    },
  });

  console.log(`Seed concluído. Usuário admin: ${email}`);

  await prisma.$disconnect();
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
