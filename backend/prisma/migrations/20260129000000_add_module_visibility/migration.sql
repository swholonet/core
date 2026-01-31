-- Add visibility control fields to ModuleType
-- These support the secret game data system

-- Add visibilityLevel column (PUBLIC, UNLOCKABLE, SECRET)
ALTER TABLE "ModuleType" ADD COLUMN "visibilityLevel" TEXT NOT NULL DEFAULT 'PUBLIC';

-- Add requiredPlayerLevel column for combined unlock requirements
ALTER TABLE "ModuleType" ADD COLUMN "requiredPlayerLevel" INTEGER NOT NULL DEFAULT 1;
