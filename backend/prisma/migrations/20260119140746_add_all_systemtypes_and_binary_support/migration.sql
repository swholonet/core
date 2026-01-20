/*
  Warnings:

  - You are about to drop the column `planetType` on the `Planet` table. All the data in the column will be lost.
  - Changed the type of `systemType` on the `System` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "PlanetClass" AS ENUM ('CLASS_M', 'CLASS_O', 'CLASS_L', 'CLASS_K', 'CLASS_H', 'CLASS_P', 'CLASS_P_T', 'CLASS_G', 'CLASS_D', 'CLASS_Q', 'CLASS_X', 'CLASS_S', 'CLASS_T', 'CLASS_I_1', 'CLASS_I_2', 'CLASS_I_3', 'CLASS_N', 'DESERT', 'ICE', 'FOREST', 'CITY', 'VOLCANO', 'JUNGLE', 'VOLCANIC', 'TERRAN');

-- CreateEnum
CREATE TYPE "SystemType" AS ENUM ('SYS_1041', 'SYS_1042', 'SYS_1043', 'SYS_1044', 'SYS_1045', 'SYS_1046', 'SYS_1047', 'SYS_1048', 'SYS_1049', 'SYS_1050', 'SYS_1051', 'SYS_1052', 'SYS_1053', 'SYS_1054', 'SYS_1055', 'SYS_1056', 'SYS_1057', 'SYS_1058', 'SYS_1059', 'SYS_1060', 'SYS_1061', 'SYS_1062', 'SYS_1063', 'SYS_1064', 'SYS_1065', 'SYS_1066', 'SYS_1067', 'SYS_1068', 'SYS_1069', 'SYS_1070', 'SYS_1071', 'SYS_1072', 'SYS_1073', 'SYS_1074', 'SYS_1075', 'BIN_1001', 'BIN_1002', 'BIN_1003', 'BIN_1004', 'BIN_1005', 'BIN_1006', 'BIN_1007', 'BIN_1008', 'BIN_1009', 'BIN_1010', 'BIN_1011', 'BIN_1012', 'BIN_1013', 'BIN_1014', 'BIN_1015', 'BIN_1016', 'BIN_1017', 'BIN_1018', 'BIN_1019', 'BIN_1020', 'BIN_1021', 'BIN_1022', 'BIN_1023', 'BIN_1024', 'BIN_1025', 'BIN_1026', 'BIN_1027', 'BIN_1028', 'BIN_1029', 'BIN_1030', 'BIN_1031', 'BIN_1032', 'BIN_1033', 'BIN_1034', 'BIN_1035', 'BIN_1036', 'BIN_1037', 'BIN_1038', 'BIN_1039', 'BIN_1040');

-- CreateEnum
CREATE TYPE "CelestialType" AS ENUM ('PLANET', 'MOON', 'ASTEROID_FIELD');

-- AlterTable
ALTER TABLE "Planet" DROP COLUMN "planetType",
ADD COLUMN     "asteroidVariant" TEXT,
ADD COLUMN     "celestialType" "CelestialType" NOT NULL DEFAULT 'PLANET',
ADD COLUMN     "gridX" INTEGER,
ADD COLUMN     "gridY" INTEGER,
ADD COLUMN     "parentPlanetId" INTEGER,
ADD COLUMN     "planetClass" "PlanetClass" NOT NULL DEFAULT 'CLASS_M';

-- AlterTable
ALTER TABLE "System" ADD COLUMN     "isBinary" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "primarySystemTypeId" INTEGER,
ADD COLUMN     "secondarySystemTypeId" INTEGER,
DROP COLUMN "systemType",
ADD COLUMN     "systemType" "SystemType" NOT NULL;

-- DropEnum
DROP TYPE "PlanetType";

-- AddForeignKey
ALTER TABLE "Planet" ADD CONSTRAINT "Planet_parentPlanetId_fkey" FOREIGN KEY ("parentPlanetId") REFERENCES "Planet"("id") ON DELETE SET NULL ON UPDATE CASCADE;
