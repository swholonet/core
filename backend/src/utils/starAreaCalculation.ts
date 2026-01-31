/**
 * Shared Star Area Calculation Utility
 *
 * Provides unified star area size calculations for both backend seeding and frontend display.
 * Ensures planets are never seeded inside star areas by using realistic astronomical distances.
 *
 * This utility is the single source of truth for star area calculations across the entire application.
 */

import { SystemType } from '@prisma/client';

export interface StarArea {
  centerX: number;
  centerY: number;
  radius: number;
  gridSize: number;
  bufferZone: number;
}

export interface StarExclusionZone {
  radius: number;
  bufferZone: number;
  totalRadius: number; // radius + bufferZone
}

/**
 * Star Asset Ranges Configuration - ported from frontend
 * Maps system types to their actual star asset grid sizes
 */
export interface StarAssetRange {
  startId: number;
  endId: number;
  name: string;
  galaxyImageId: number;
  fileExtension: string;
  gridSize: number;
  assetCount: number;
}

const STAR_ASSET_RANGES: StarAssetRange[] = [
  { startId: 104101, endId: 104200, name: "Systemtype 1041", galaxyImageId: 1041, fileExtension: "png", gridSize: 10, assetCount: 100 },
  { startId: 104201, endId: 104300, name: "Systemtype 1042", galaxyImageId: 1042, fileExtension: "png", gridSize: 10, assetCount: 100 },
  { startId: 104301, endId: 104400, name: "Systemtype 1043", galaxyImageId: 1043, fileExtension: "png", gridSize: 10, assetCount: 100 },
  { startId: 104401, endId: 104500, name: "Systemtype 1044", galaxyImageId: 1044, fileExtension: "png", gridSize: 10, assetCount: 100 },
  { startId: 104501, endId: 104600, name: "Systemtype 1045", galaxyImageId: 1045, fileExtension: "png", gridSize: 10, assetCount: 100 },
  { startId: 104601, endId: 104700, name: "Systemtype 1046", galaxyImageId: 1046, fileExtension: "png", gridSize: 10, assetCount: 100 },
  { startId: 104701, endId: 104800, name: "Systemtype 1047", galaxyImageId: 1047, fileExtension: "png", gridSize: 10, assetCount: 100 },
  { startId: 104801, endId: 104900, name: "Systemtype 1048", galaxyImageId: 1048, fileExtension: "png", gridSize: 10, assetCount: 100 },
  { startId: 104901, endId: 104925, name: "Systemtype 1049", galaxyImageId: 1049, fileExtension: "png", gridSize: 5, assetCount: 25 },
  { startId: 105001, endId: 105025, name: "Systemtype 1050", galaxyImageId: 1050, fileExtension: "png", gridSize: 5, assetCount: 25 },
  { startId: 105101, endId: 105125, name: "Systemtype 1051", galaxyImageId: 1051, fileExtension: "png", gridSize: 5, assetCount: 25 },
  { startId: 105201, endId: 105225, name: "Systemtype 1052", galaxyImageId: 1052, fileExtension: "png", gridSize: 5, assetCount: 25 },
  { startId: 105301, endId: 105336, name: "Systemtype 1053", galaxyImageId: 1053, fileExtension: "png", gridSize: 6, assetCount: 36 },
  { startId: 105401, endId: 105436, name: "Systemtype 1054", galaxyImageId: 1054, fileExtension: "png", gridSize: 6, assetCount: 36 },
  { startId: 105501, endId: 105536, name: "Systemtype 1055", galaxyImageId: 1055, fileExtension: "png", gridSize: 6, assetCount: 36 },
  { startId: 105601, endId: 105636, name: "Systemtype 1056", galaxyImageId: 1056, fileExtension: "png", gridSize: 6, assetCount: 36 },
  { startId: 105701, endId: 105716, name: "Systemtype 1057", galaxyImageId: 1057, fileExtension: "png", gridSize: 4, assetCount: 16 },
  { startId: 105801, endId: 105816, name: "Systemtype 1058", galaxyImageId: 1058, fileExtension: "png", gridSize: 4, assetCount: 16 },
  { startId: 105901, endId: 105916, name: "Systemtype 1059", galaxyImageId: 1059, fileExtension: "png", gridSize: 4, assetCount: 16 },
  { startId: 106001, endId: 106016, name: "Systemtype 1060", galaxyImageId: 1060, fileExtension: "png", gridSize: 4, assetCount: 16 },
  { startId: 106101, endId: 106116, name: "Systemtype 1061", galaxyImageId: 1061, fileExtension: "png", gridSize: 4, assetCount: 16 },
  { startId: 106201, endId: 106216, name: "Systemtype 1062", galaxyImageId: 1062, fileExtension: "png", gridSize: 4, assetCount: 16 },
  { startId: 106301, endId: 106316, name: "Systemtype 1063", galaxyImageId: 1063, fileExtension: "png", gridSize: 4, assetCount: 16 },
  { startId: 106401, endId: 106436, name: "Systemtype 1064", galaxyImageId: 1064, fileExtension: "png", gridSize: 6, assetCount: 36 },
  { startId: 106501, endId: 106536, name: "Systemtype 1065", galaxyImageId: 1065, fileExtension: "png", gridSize: 6, assetCount: 36 },
  { startId: 106601, endId: 106636, name: "Systemtype 1066", galaxyImageId: 1066, fileExtension: "png", gridSize: 6, assetCount: 36 },
  { startId: 106701, endId: 106704, name: "Systemtype 1067", galaxyImageId: 1067, fileExtension: "png", gridSize: 2, assetCount: 4 },
  { startId: 106801, endId: 106804, name: "Systemtype 1068", galaxyImageId: 1068, fileExtension: "png", gridSize: 2, assetCount: 4 },
  { startId: 106901, endId: 106916, name: "Systemtype 1069", galaxyImageId: 1069, fileExtension: "png", gridSize: 4, assetCount: 16 },
  { startId: 107001, endId: 107016, name: "Systemtype 1070", galaxyImageId: 1070, fileExtension: "png", gridSize: 4, assetCount: 16 },
  { startId: 107101, endId: 107200, name: "Systemtype 1071", galaxyImageId: 1071, fileExtension: "png", gridSize: 10, assetCount: 100 },
  { startId: 107201, endId: 107300, name: "Systemtype 1072", galaxyImageId: 1072, fileExtension: "png", gridSize: 10, assetCount: 100 },
  { startId: 107301, endId: 107400, name: "Systemtype 1073", galaxyImageId: 1073, fileExtension: "png", gridSize: 10, assetCount: 100 },
  { startId: 107401, endId: 107500, name: "Systemtype 1074", galaxyImageId: 1074, fileExtension: "png", gridSize: 10, assetCount: 100 },
  { startId: 107501, endId: 107600, name: "Systemtype 1075", galaxyImageId: 1075, fileExtension: "png", gridSize: 10, assetCount: 100 }
];

/**
 * Helper: Extract numeric systemtype ID from SystemType enum
 */
export function extractSystemTypeId(systemType: SystemType): number {
  const enumName = systemType.toString();
  if (enumName.startsWith('SYS_')) {
    return parseInt(enumName.replace('SYS_', ''));
  } else if (enumName.startsWith('BIN_')) {
    return parseInt(enumName.replace('BIN_', ''));
  }
  return 1050; // fallback
}

/**
 * Get asset range configuration for a system type
 */
function getAssetRangeBySystemType(systemTypeId: number): StarAssetRange | undefined {
  return STAR_ASSET_RANGES.find(range => range.galaxyImageId === systemTypeId);
}

/**
 * Calculate the actual star area size based on system type and grid size
 * Uses the same logic as frontend but caps at 50% of system grid size to ensure planetary space
 *
 * @param systemType - The SystemType enum value
 * @param systemGridSize - The total system grid size (e.g., 30x30)
 * @returns Star area size in grid units (e.g., 8 for 8x8 star area)
 */
export function calculateStarAreaSize(systemType: SystemType, systemGridSize: number): number {
  const systemTypeId = extractSystemTypeId(systemType);
  const assetSet = getAssetRangeBySystemType(systemTypeId);

  if (assetSet) {
    // Allow stars to take up to 50% of system grid size
    const maxStarArea = Math.floor(systemGridSize / 2);
    return Math.min(Math.max(assetSet.gridSize, 8), maxStarArea);
  }

  // Default 8x8 for unknown system types
  return Math.min(8, Math.floor(systemGridSize / 2));
}

/**
 * Calculate star exclusion zone with realistic buffer distances
 * Prevents planets from spawning too close to stars
 *
 * @param systemType - The SystemType enum value
 * @param systemGridSize - The total system grid size
 * @returns StarExclusionZone with radius and buffer zone
 */
export function getStarExclusionZone(systemType: SystemType, systemGridSize: number): StarExclusionZone {
  const starAreaSize = calculateStarAreaSize(systemType, systemGridSize);
  const starRadius = Math.floor(starAreaSize / 2);

  // Realistic buffer zone based on star size and astronomy
  // Larger stars need larger buffer zones (like real solar systems)
  let bufferZone: number;

  if (starAreaSize >= 10) {
    // Massive stars (1041-1048, 1071-1075): Very large buffer
    bufferZone = 4;
  } else if (starAreaSize >= 6) {
    // Large stars (1053-1056, 1064-1066): Large buffer
    bufferZone = 3;
  } else if (starAreaSize >= 5) {
    // Medium stars (1049-1052): Medium buffer
    bufferZone = 3;
  } else {
    // Small stars (1057-1063, 1067-1070): Minimum buffer
    bufferZone = 2;
  }

  return {
    radius: starRadius,
    bufferZone,
    totalRadius: starRadius + bufferZone
  };
}

/**
 * Check if a position is within the star area (including display area)
 *
 * @param x - Grid X position
 * @param y - Grid Y position
 * @param centerX - Star center X position
 * @param centerY - Star center Y position
 * @param starAreaSize - Star area size (e.g., 8 for 8x8)
 * @returns true if position is inside star area
 */
export function isPositionInStarArea(
  x: number,
  y: number,
  centerX: number,
  centerY: number,
  starAreaSize: number
): boolean {
  const starRadius = Math.floor(starAreaSize / 2);
  return (
    x >= centerX - starRadius && x <= centerX + starRadius &&
    y >= centerY - starRadius && y <= centerY + starRadius
  );
}

/**
 * Check if a position is within the star exclusion zone (star area + buffer)
 * This is the zone where planets should NOT be seeded
 *
 * @param x - Grid X position
 * @param y - Grid Y position
 * @param centerX - Star center X position
 * @param centerY - Star center Y position
 * @param exclusionZone - StarExclusionZone object
 * @returns true if position is inside exclusion zone
 */
export function isPositionInStarExclusionZone(
  x: number,
  y: number,
  centerX: number,
  centerY: number,
  exclusionZone: StarExclusionZone
): boolean {
  const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
  return distance <= exclusionZone.totalRadius;
}

/**
 * Calculate binary star areas for binary systems
 * Places primary star (top-left) and secondary star (bottom-right) with proper separation
 *
 * @param systemType - The binary SystemType enum value (BIN_1001 - BIN_1048)
 * @param systemGridSize - The total system grid size
 * @param primarySystemTypeId - Primary star system type ID
 * @param secondarySystemTypeId - Secondary star system type ID
 * @returns Array of two StarArea objects [primary, secondary]
 */
export function calculateBinaryStarAreas(
  _systemType: SystemType,
  systemGridSize: number,
  primarySystemTypeId: number,
  secondarySystemTypeId: number
): { primary: StarArea, secondary: StarArea } {

  const gridCenter = Math.floor(systemGridSize / 2);

  // Create temporary SystemType enums for calculations
  const primarySystemType = SystemType[`SYS_${primarySystemTypeId}` as keyof typeof SystemType] as SystemType;
  const secondarySystemType = SystemType[`SYS_${secondarySystemTypeId}` as keyof typeof SystemType] as SystemType;

  // Calculate star sizes
  const primaryStarSize = calculateStarAreaSize(primarySystemType, systemGridSize);
  const secondaryStarSize = calculateStarAreaSize(secondarySystemType, systemGridSize);

  // Calculate separation distance to avoid overlap
  const primaryRadius = Math.floor(primaryStarSize / 2);
  const secondaryRadius = Math.floor(secondaryStarSize / 2);
  const minSeparation = primaryRadius + secondaryRadius + 2; // 2 units minimum gap

  // Position primary star (top-left quadrant)
  const primaryOffsetDistance = Math.max(3, Math.floor(minSeparation / 2));
  const primaryX = Math.max(primaryRadius + 1, gridCenter - primaryOffsetDistance);
  const primaryY = Math.max(primaryRadius + 1, gridCenter - primaryOffsetDistance);

  // Position secondary star (bottom-right quadrant)
  const secondaryOffsetDistance = Math.max(3, Math.floor(minSeparation / 2));
  const secondaryX = Math.min(systemGridSize - secondaryRadius, gridCenter + secondaryOffsetDistance);
  const secondaryY = Math.min(systemGridSize - secondaryRadius, gridCenter + secondaryOffsetDistance);

  // Calculate exclusion zones
  const primaryExclusion = getStarExclusionZone(primarySystemType, systemGridSize);
  const secondaryExclusion = getStarExclusionZone(secondarySystemType, systemGridSize);

  return {
    primary: {
      centerX: primaryX,
      centerY: primaryY,
      radius: primaryRadius,
      gridSize: primaryStarSize,
      bufferZone: primaryExclusion.bufferZone
    },
    secondary: {
      centerX: secondaryX,
      centerY: secondaryY,
      radius: secondaryRadius,
      gridSize: secondaryStarSize,
      bufferZone: secondaryExclusion.bufferZone
    }
  };
}

/**
 * Check if a position is safe for planet placement in any star system
 * Handles both single and binary star systems
 *
 * @param x - Grid X position
 * @param y - Grid Y position
 * @param systemType - SystemType enum
 * @param systemGridSize - System grid size
 * @param primarySystemTypeId - Primary system type ID (for binary systems)
 * @param secondarySystemTypeId - Secondary system type ID (for binary systems)
 * @returns true if position is safe for planet placement
 */
export function isPositionSafeForPlanet(
  x: number,
  y: number,
  systemType: SystemType,
  systemGridSize: number,
  primarySystemTypeId?: number,
  secondarySystemTypeId?: number
): boolean {
  const systemTypeId = extractSystemTypeId(systemType);
  const isBinary = systemTypeId >= 1001 && systemTypeId <= 1048;

  if (isBinary && primarySystemTypeId && secondarySystemTypeId) {
    // Binary system - check both stars
    const binaryAreas = calculateBinaryStarAreas(systemType, systemGridSize, primarySystemTypeId, secondarySystemTypeId);

    // Create temporary SystemType enums for exclusion zone calculations
    const primarySystemType = SystemType[`SYS_${primarySystemTypeId}` as keyof typeof SystemType] as SystemType;
    const secondarySystemType = SystemType[`SYS_${secondarySystemTypeId}` as keyof typeof SystemType] as SystemType;

    const primaryExclusion = getStarExclusionZone(primarySystemType, systemGridSize);
    const secondaryExclusion = getStarExclusionZone(secondarySystemType, systemGridSize);

    // Check if position is safe from both stars
    const safeFromPrimary = !isPositionInStarExclusionZone(
      x, y, binaryAreas.primary.centerX, binaryAreas.primary.centerY, primaryExclusion
    );
    const safeFromSecondary = !isPositionInStarExclusionZone(
      x, y, binaryAreas.secondary.centerX, binaryAreas.secondary.centerY, secondaryExclusion
    );

    return safeFromPrimary && safeFromSecondary;
  } else {
    // Single star system
    const gridCenter = Math.floor(systemGridSize / 2);
    const exclusionZone = getStarExclusionZone(systemType, systemGridSize);

    return !isPositionInStarExclusionZone(x, y, gridCenter, gridCenter, exclusionZone);
  }
}