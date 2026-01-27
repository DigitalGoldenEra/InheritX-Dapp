/*
  Warnings:

  - A unique constraint covering the columns `[verificationToken]` on the table `Plan` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Plan" ADD COLUMN     "earlyClaimEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastVerificationAt" TIMESTAMP(3),
ADD COLUMN     "lastVerificationSent" TIMESTAMP(3),
ADD COLUMN     "notifyBeneficiaries" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "proofOfLifeEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "verificationFailCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "verificationToken" TEXT;

-- CreateTable
CREATE TABLE "BeneficiaryKYC" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "nationality" TEXT,
    "idType" "IDType" NOT NULL,
    "idNumber" TEXT NOT NULL,
    "idDocumentUrl" TEXT,
    "idExpiryDate" TIMESTAMP(3),
    "address" TEXT,
    "city" TEXT,
    "country" TEXT,
    "postalCode" TEXT,
    "status" "KYCStatus" NOT NULL DEFAULT 'PENDING',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BeneficiaryKYC_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BeneficiaryKYC_email_key" ON "BeneficiaryKYC"("email");

-- CreateIndex
CREATE INDEX "BeneficiaryKYC_email_idx" ON "BeneficiaryKYC"("email");

-- CreateIndex
CREATE INDEX "BeneficiaryKYC_status_idx" ON "BeneficiaryKYC"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Plan_verificationToken_key" ON "Plan"("verificationToken");

-- CreateIndex
CREATE INDEX "Plan_proofOfLifeEnabled_idx" ON "Plan"("proofOfLifeEnabled");
