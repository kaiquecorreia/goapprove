-- AlterTable
ALTER TABLE "users" ADD COLUMN     "password_hash" VARCHAR(255),
ALTER COLUMN "external_integration_user" DROP NOT NULL;
