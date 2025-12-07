-- AlterEnum: Add PENDING value to PlanStatus enum
-- Note: This must be in a separate transaction
ALTER TYPE "PlanStatus" ADD VALUE IF NOT EXISTS 'PENDING';
