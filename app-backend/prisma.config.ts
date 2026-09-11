import { config } from 'dotenv';
import { defineConfig } from 'prisma/config';

// .env.local (host-only, gitignored) takes precedence when present — dotenv
// never overrides a var that's already set, so loading it first lets it win
// over .env without touching the shared file Docker also reads.
config({ path: '.env.local' });
config();

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'ts-node prisma/seed.ts',
  },
  datasource: {
    url: process.env['DATABASE_URL'],
  },
});
