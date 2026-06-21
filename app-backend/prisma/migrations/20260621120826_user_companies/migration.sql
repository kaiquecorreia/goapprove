-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMINISTRATOR', 'APPROVER', 'VIEWER', 'RULES_MANAGER', 'EXTERNAL_INTEGRATION');

-- CreateEnum
CREATE TYPE "Environment" AS ENUM ('DEVELOPMENT', 'HOMOLOGATION', 'PRODUCTION');

-- CreateTable
CREATE TABLE "companies" (
    "company_id" UUID NOT NULL,
    "external_integration_code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "cnpj" VARCHAR(14),
    "status" BOOLEAN NOT NULL DEFAULT true,
    "external_integration_url_base" TEXT,
    "environment" "Environment" NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("company_id")
);

-- CreateTable
CREATE TABLE "users" (
    "user_id" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "external_integration_user" VARCHAR(50) NOT NULL,
    "role" "UserRole" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "approval_limit" DECIMAL(15,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "companies_users" (
    "company_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "companies_users_pkey" PRIMARY KEY ("company_id","user_id")
);

-- CreateTable
CREATE TABLE "users_substitutes" (
    "user_id" UUID NOT NULL,
    "substitute_id" UUID NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_substitutes_pkey" PRIMARY KEY ("user_id","substitute_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "companies_external_integration_code_key" ON "companies"("external_integration_code");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_external_integration_user_key" ON "users"("external_integration_user");

-- AddForeignKey
ALTER TABLE "companies_users" ADD CONSTRAINT "companies_users_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("company_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companies_users" ADD CONSTRAINT "companies_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users_substitutes" ADD CONSTRAINT "users_substitutes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users_substitutes" ADD CONSTRAINT "users_substitutes_substitute_id_fkey" FOREIGN KEY ("substitute_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
