/*
  Warnings:

  - You are about to drop the column `claimCodeEncrypted` on the `Plan` table. All the data in the column will be lost.
  - You are about to drop the column `claimCodeHash` on the `Plan` table. All the data in the column will be lost.
  - Added the required column `claimCodeEncrypted` to the `Beneficiary` table without a default value. This is not possible if the table is not empty.
  - Added the required column `claimCodeHash` to the `Beneficiary` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Beneficiary" ADD COLUMN     "claimCodeEncrypted" TEXT NOT NULL,
ADD COLUMN     "claimCodeHash" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Plan" DROP COLUMN "claimCodeEncrypted",
DROP COLUMN "claimCodeHash";
