/*
  Warnings:

  - You are about to drop the `ShipBuildQueue` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ShipType` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `shipTypeId` on the `Ship` table. All the data in the column will be lost.

*/

-- DropForeignKey
ALTER TABLE "Ship" DROP CONSTRAINT IF EXISTS "Ship_shipTypeId_fkey";

-- DropForeignKey
ALTER TABLE "ShipBuildQueue" DROP CONSTRAINT IF EXISTS "ShipBuildQueue_planetId_fkey";

-- DropForeignKey
ALTER TABLE "ShipBuildQueue" DROP CONSTRAINT IF EXISTS "ShipBuildQueue_shipTypeId_fkey";

-- AlterTable
ALTER TABLE "Ship" DROP COLUMN IF EXISTS "shipTypeId";

-- DropTable
DROP TABLE IF EXISTS "ShipBuildQueue";

-- DropTable
DROP TABLE IF EXISTS "ShipType";