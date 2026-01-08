-- RenameForeignKey
ALTER TABLE "HoloNetMessage" RENAME CONSTRAINT "ComnetMessage_playerId_fkey" TO "HoloNetMessage_playerId_fkey";

-- RenameIndex
ALTER INDEX "ComnetMessage_createdAt_idx" RENAME TO "HoloNetMessage_createdAt_idx";
