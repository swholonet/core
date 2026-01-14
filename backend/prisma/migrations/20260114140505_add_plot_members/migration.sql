-- CreateTable
CREATE TABLE "HoloNetPlotMember" (
    "id" SERIAL NOT NULL,
    "plotId" INTEGER NOT NULL,
    "playerId" INTEGER NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "addedBy" INTEGER NOT NULL,

    CONSTRAINT "HoloNetPlotMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HoloNetPlotMember_plotId_idx" ON "HoloNetPlotMember"("plotId");

-- CreateIndex
CREATE INDEX "HoloNetPlotMember_playerId_idx" ON "HoloNetPlotMember"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "HoloNetPlotMember_plotId_playerId_key" ON "HoloNetPlotMember"("plotId", "playerId");

-- AddForeignKey
ALTER TABLE "HoloNetPlotMember" ADD CONSTRAINT "HoloNetPlotMember_plotId_fkey" FOREIGN KEY ("plotId") REFERENCES "HoloNetPlot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HoloNetPlotMember" ADD CONSTRAINT "HoloNetPlotMember_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HoloNetPlotMember" ADD CONSTRAINT "HoloNetPlotMember_addedBy_fkey" FOREIGN KEY ("addedBy") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
