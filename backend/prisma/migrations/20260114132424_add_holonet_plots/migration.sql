-- AlterTable
ALTER TABLE "HoloNetMessage" ADD COLUMN     "plotId" INTEGER;

-- CreateTable
CREATE TABLE "HoloNetPlot" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "creatorId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HoloNetPlot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HoloNetPlot_isActive_createdAt_idx" ON "HoloNetPlot"("isActive", "createdAt");

-- CreateIndex
CREATE INDEX "HoloNetMessage_plotId_idx" ON "HoloNetMessage"("plotId");

-- AddForeignKey
ALTER TABLE "HoloNetMessage" ADD CONSTRAINT "HoloNetMessage_plotId_fkey" FOREIGN KEY ("plotId") REFERENCES "HoloNetPlot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HoloNetPlot" ADD CONSTRAINT "HoloNetPlot_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
