-- CreateEnum
CREATE TYPE "Provider" AS ENUM ('INFOR');

-- CreateEnum
CREATE TYPE "AuthType" AS ENUM ('oauth2');

-- CreateTable
CREATE TABLE "company_integrations" (
    "integration_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "provider" "Provider" NOT NULL,
    "auth_type" "AuthType" NOT NULL DEFAULT 'oauth2',
    "base_url" TEXT NOT NULL,
    "client_id" VARCHAR(255),
    "client_secret" TEXT,
    "custom_data" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_integrations_pkey" PRIMARY KEY ("integration_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "company_integrations_company_id_provider_key" ON "company_integrations"("company_id", "provider");

-- AddForeignKey
ALTER TABLE "company_integrations" ADD CONSTRAINT "company_integrations_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("company_id") ON DELETE CASCADE ON UPDATE CASCADE;
