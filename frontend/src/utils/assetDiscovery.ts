/**
 * Asset Discovery System for STU Multi-Layer Suns
 *
 * Discovers and maps available multi-layer sun assets from the STU asset repository.
 * Handles pattern detection, grid size calculation, and asset availability checking.
 * Unified with systemAssets config for all 75 systemtypes.
 */

import { STAR_ASSET_RANGES } from '../config/systemAssets';

export interface MultiLayerAssetSet {
  baseId: number;           // Base asset ID (e.g., 105000)
  gridSize: number;         // Grid dimensions (5 for 5x5)
  totalAssets: number;      // Total number of assets in the set
  pattern: string;          // Description of the pattern
  systemType: string;       // Associated system type (e.g., "SYS_1050")
  systemTypeId: number;     // Numeric systemtype ID (e.g., 1050)
}

export interface AssetGridMapping {
  row: number;              // Grid row (0-based)
  col: number;              // Grid column (0-based)
  assetId: number;          // Actual asset ID
  position: string;         // Human readable position (e.g., 'center', 'top-left')
}

const ASSET_BASE_URL = import.meta.env.VITE_ASSET_BASE_URL || 'https://swuniverse.github.io/assets/';

/**
 * Generate multi-layer asset sets from STAR_ASSET_RANGES config
 * Creates asset sets for all 35 systemtypes (1041-1075)
 */
export const WORKING_ASSET_SETS: MultiLayerAssetSet[] = STAR_ASSET_RANGES.map(range => ({
  baseId: range.startId - 1,
  gridSize: range.gridSize,
  totalAssets: range.assetCount,
  pattern: `${range.startId}-${range.endId} (${range.name})`,
  systemType: `SYS_${range.galaxyImageId}`,
  systemTypeId: range.galaxyImageId
}));

/**
 * Generate asset ID for specific grid position
 * Based on STU pattern: left-to-right, top-to-bottom
 *
 * @param baseId - Base asset ID (e.g., 105000)
 * @param row - Grid row (0-based)
 * @param col - Grid column (0-based)
 * @param gridSize - Grid dimensions
 * @returns Asset ID for the position
 */
export const getAssetIdForPosition = (
  baseId: number,
  row: number,
  col: number,
  gridSize: number
): number => {
  // STU Pattern: 105001 (top-left) to 105025 (bottom-right)
  // Row-wise: row * gridSize + col + 1
  const offset = row * gridSize + col + 1;
  return baseId + offset;
};

/**
 * Generate full asset URL for specific grid position
 */
export const getAssetUrlForPosition = (
  baseId: number,
  row: number,
  col: number,
  gridSize: number
): string => {
  const assetId = getAssetIdForPosition(baseId, row, col, gridSize);
  return `${ASSET_BASE_URL}map/${assetId}.png`;
};

/**
 * Generate all asset mappings for a grid
 */
export const generateGridMappings = (
  baseId: number,
  gridSize: number
): AssetGridMapping[] => {
  const mappings: AssetGridMapping[] = [];

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const assetId = getAssetIdForPosition(baseId, row, col, gridSize);
      const position = getPositionName(row, col, gridSize);

      mappings.push({
        row,
        col,
        assetId,
        position
      });
    }
  }

  return mappings;
};

/**
 * Get human-readable position name for grid coordinates
 */
export const getPositionName = (row: number, col: number, gridSize: number): string => {
  const center = Math.floor(gridSize / 2);

  // For 5x5 grid, center is (2,2)
  if (row === center && col === center) {
    return 'center';
  }

  // Determine vertical position
  let vertical = '';
  if (row < center) vertical = 'north';
  else if (row > center) vertical = 'south';

  // Determine horizontal position
  let horizontal = '';
  if (col < center) horizontal = 'west';
  else if (col > center) horizontal = 'east';

  // Combine or use single direction
  if (vertical && horizontal) {
    return `${vertical}${horizontal}`;
  } else if (vertical) {
    return vertical;
  } else if (horizontal) {
    return horizontal;
  }

  return `${row}-${col}`; // Fallback to coordinates
};

/**
 * Check if an asset exists by attempting to load it
 * Returns a Promise that resolves to true/false
 */
export const checkAssetExists = async (assetUrl: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = assetUrl;

    // Timeout after 5 seconds
    setTimeout(() => resolve(false), 5000);
  });
};

/**
 * Discover available assets for a given base ID and maximum grid size
 * Tests asset availability to determine actual grid dimensions
 */
export const discoverAssetGrid = async (
  baseId: number,
  maxGridSize: number = 10
): Promise<MultiLayerAssetSet | null> => {

  console.log(`Discovering assets for base ID ${baseId}...`);

  // Test different grid sizes from 3x3 to maxGridSize x maxGridSize
  for (let gridSize = 3; gridSize <= maxGridSize; gridSize++) {
    const testPositions = [
      [0, 0], // top-left
      [0, gridSize - 1], // top-right
      [gridSize - 1, 0], // bottom-left
      [gridSize - 1, gridSize - 1], // bottom-right
      [Math.floor(gridSize / 2), Math.floor(gridSize / 2)] // center
    ];

    let allExist = true;

    for (const [row, col] of testPositions) {
      const assetUrl = getAssetUrlForPosition(baseId, row, col, gridSize);
      const exists = await checkAssetExists(assetUrl);

      if (!exists) {
        allExist = false;
        break;
      }
    }

    if (allExist) {
      // Found a valid grid size, continue testing for larger sizes
      continue;
    } else {
      // This grid size failed, previous size was the maximum
      const validGridSize = gridSize - 1;

      if (validGridSize >= 3) {
        return {
          baseId,
          gridSize: validGridSize,
          totalAssets: validGridSize * validGridSize,
          pattern: `${baseId + 1}-${baseId + validGridSize * validGridSize} (${validGridSize}x${validGridSize} Grid)`,
          systemType: 'UNKNOWN',
          systemTypeId: 0
        };
      } else {
        break;
      }
    }
  }

  return null; // No valid grid found
};

/**
 * Map system types to appropriate multi-layer asset sets
 * Uses systemAssets config for accurate systemtype → asset mapping
 * Supports all systemtypes (1049-1075 single stars + 1001-1048 binary systems)
 */
export const getMultiLayerAssetForSystemType = (
  systemType: string
): MultiLayerAssetSet | null => {
  // Extract numeric ID from SystemType enum (e.g., "SYS_1049" => 1049)
  const systemTypeId = extractSystemTypeId(systemType);
  
  // Find matching asset set by systemTypeId
  return WORKING_ASSET_SETS.find(set => set.systemTypeId === systemTypeId) || null;
};

/**
 * Helper: Extract numeric systemtype ID from enum value
 * e.g., "SYS_1049" => 1049, "BIN_1001" => 1001
 */
const extractSystemTypeId = (systemType: string): number => {
  if (systemType.startsWith('SYS_')) {
    return parseInt(systemType.replace('SYS_', ''));
  } else if (systemType.startsWith('BIN_')) {
    return parseInt(systemType.replace('BIN_', ''));
  }
  return 1050; // fallback
};

/**
 * Development helper: Log all asset URLs for a grid (for debugging)
 */
export const debugLogAssetUrls = (baseId: number, gridSize: number): void => {
  console.group(`Asset URLs for base ${baseId} (${gridSize}x${gridSize})`);

  for (let row = 0; row < gridSize; row++) {
    const rowUrls = [];
    for (let col = 0; col < gridSize; col++) {
      const url = getAssetUrlForPosition(baseId, row, col, gridSize);
      rowUrls.push(url);
    }
    console.log(`Row ${row}:`, rowUrls);
  }

  console.groupEnd();
};