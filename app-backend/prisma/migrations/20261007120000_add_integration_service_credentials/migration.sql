-- AlterTable
ALTER TABLE "company_integrations" ADD COLUMN     "ion_api_url" TEXT,
ADD COLUMN     "service_account_key" TEXT,
ADD COLUMN     "service_account_secret" TEXT,
ADD COLUMN     "service_client_id" VARCHAR(255),
ADD COLUMN     "service_client_secret" TEXT;
