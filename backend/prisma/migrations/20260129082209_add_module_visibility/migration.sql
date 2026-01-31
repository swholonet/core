-- CreateTable
CREATE TABLE "SectorField" (
    "id" SERIAL NOT NULL,
    "sectorId" INTEGER NOT NULL,
    "fieldX" INTEGER NOT NULL,
    "fieldY" INTEGER NOT NULL,
    "isHyperlane" BOOLEAN NOT NULL DEFAULT false,
    "laneName" TEXT,
    "laneColor" TEXT,
    "laneType" TEXT,

    CONSTRAINT "SectorField_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SectorField_sectorId_fieldX_fieldY_key" ON "SectorField"("sectorId", "fieldX", "fieldY");

-- AddForeignKey
ALTER TABLE "SectorField" ADD CONSTRAINT "SectorField_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "Sector"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
