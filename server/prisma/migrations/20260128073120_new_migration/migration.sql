/*
  Warnings:

  - A unique constraint covering the columns `[beneficiaryId]` on the table `BeneficiaryKYC` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ActivityType" ADD VALUE 'DISTRIBUTION_CANCELLED';
ALTER TYPE "ActivityType" ADD VALUE 'BENEFICIARY_KYC_SUBMITTED';
ALTER TYPE "ActivityType" ADD VALUE 'BENEFICIARY_KYC_APPROVED';
ALTER TYPE "ActivityType" ADD VALUE 'BENEFICIARY_KYC_REJECTED';

-- DropIndex
DROP INDEX "BeneficiaryKYC_email_key";

-- AlterTable
ALTER TABLE "BeneficiaryKYC" ADD COLUMN     "beneficiaryId" TEXT,
ADD COLUMN     "kycDataHash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "BeneficiaryKYC_beneficiaryId_key" ON "BeneficiaryKYC"("beneficiaryId");

-- CreateIndex
CREATE INDEX "BeneficiaryKYC_beneficiaryId_idx" ON "BeneficiaryKYC"("beneficiaryId");

-- AddForeignKey
ALTER TABLE "BeneficiaryKYC" ADD CONSTRAINT "BeneficiaryKYC_beneficiaryId_fkey" FOREIGN KEY ("beneficiaryId") REFERENCES "Beneficiary"("id") ON DELETE CASCADE ON UPDATE CASCADE;
