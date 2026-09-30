/*
  Warnings:

  - Made the column `external_integration_user` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "users" ALTER COLUMN "external_integration_user" SET NOT NULL;
