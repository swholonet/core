/**
 * STU Systemtype Asset Configuration
 *
 * Central source of truth for all systemtype assets (1049-1075) and binary systems (1001-1048).
 * Defines asset ranges, grid sizes, and binary system combinations.
 */

// TypeScript interfaces for star asset ranges
export interface StarAssetRange {
  startId: number;
  endId: number;
  name: string;
  galaxyImageId: number;
  fileExtension: string;
  gridSize: number;
  assetCount: number;
}

// Binary system combination interface
export interface BinarySystemCombo {
  binaryId: number;
  name: string;
  primarySystemId: number;   // Systemtype links oben (größerer Stern)
  secondarySystemId: number; // Systemtype rechts unten (kleinerer Stern)
}

/**
 * Main star assets data - verifizierte Asset-Ranges basierend auf tatsächlichen Dateien
 * Sortiert nach Systemtype-ID (1041-1075)
 */
export const STAR_ASSET_RANGES: StarAssetRange[] = [
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
 * Binärsystem-Kombinationen (1001-1048)
 * Jedes Binärsystem besteht aus zwei kombinierten Systemtypes
 */
export const BINARY_SYSTEMS: BinarySystemCombo[] = [
  // Riese + Riese (1001-1010)
  { binaryId: 1001, name: "Binärsystem Blauer Riese - Blauer Riese", primarySystemId: 1049, secondarySystemId: 1049 },
  { binaryId: 1002, name: "Binärsystem Blauer Riese - Gelber Riese", primarySystemId: 1049, secondarySystemId: 1050 },
  { binaryId: 1003, name: "Binärsystem Gelber Riese - Gelber Riese", primarySystemId: 1050, secondarySystemId: 1050 },
  { binaryId: 1004, name: "Binärsystem Oranger Riese - Gelber Riese", primarySystemId: 1051, secondarySystemId: 1050 },
  { binaryId: 1005, name: "Binärsystem Gelber Riese - Roter Riese", primarySystemId: 1050, secondarySystemId: 1052 },
  { binaryId: 1006, name: "Binärsystem Blauer Riese - Orangener Riese", primarySystemId: 1049, secondarySystemId: 1051 },
  { binaryId: 1007, name: "Binärsystem Orangener Riese - Orangener Riese", primarySystemId: 1051, secondarySystemId: 1051 },
  { binaryId: 1008, name: "Binärsystem Orangener Riese - Roter Riese", primarySystemId: 1051, secondarySystemId: 1052 },
  { binaryId: 1009, name: "Binärsystem Roter Riese - Blauer Riese", primarySystemId: 1052, secondarySystemId: 1049 },
  { binaryId: 1010, name: "Binärsystem Roter Riese - Roter Riese", primarySystemId: 1052, secondarySystemId: 1052 },

  // Riese + Überriese (1011-1020)
  { binaryId: 1011, name: "Binärsystem Blauer Riese - Blauer Überriese", primarySystemId: 1049, secondarySystemId: 1053 },
  { binaryId: 1012, name: "Binärsystem Gelber Riese - Blauer Überriese", primarySystemId: 1050, secondarySystemId: 1053 },
  { binaryId: 1013, name: "Binärsystem Gelber Riese - Gelber Überriese", primarySystemId: 1050, secondarySystemId: 1054 },
  { binaryId: 1014, name: "Binärsystem Gelber Riese - Orangener Überriese", primarySystemId: 1050, secondarySystemId: 1055 },
  { binaryId: 1015, name: "Binärsystem Gelber Riese - Roter Überriese", primarySystemId: 1050, secondarySystemId: 1056 },
  { binaryId: 1016, name: "Binärsystem Orangener Riese - Blauer Überriese", primarySystemId: 1051, secondarySystemId: 1053 },
  { binaryId: 1017, name: "Binärsystem Orangener Riese - Orangener Überriese", primarySystemId: 1051, secondarySystemId: 1055 },
  { binaryId: 1018, name: "Binärsystem Orangener Riese - Roter Überriese", primarySystemId: 1051, secondarySystemId: 1056 },
  { binaryId: 1019, name: "Binärsystem Roter Riese - Blauer Überriese", primarySystemId: 1052, secondarySystemId: 1053 },
  { binaryId: 1020, name: "Binärsystem Roter Riese - Roter Überriese", primarySystemId: 1052, secondarySystemId: 1056 },

  // Riese + Zwerg (1021-1030) - KORRIGIERT
  { binaryId: 1021, name: "Binärsystem Blauer Riese - Blauer Zwerg", primarySystemId: 1049, secondarySystemId: 1057 },
  { binaryId: 1022, name: "Binärsystem Blauer Riese - Gelber Zwerg", primarySystemId: 1049, secondarySystemId: 1058 },
  { binaryId: 1023, name: "Binärsystem Gelber Riese - Gelber Zwerg", primarySystemId: 1050, secondarySystemId: 1058 },
  { binaryId: 1024, name: "Binärsystem Orangener Riese - Gelber Zwerg", primarySystemId: 1051, secondarySystemId: 1058 },
  { binaryId: 1025, name: "Binärsystem Roter Riese - Gelber Zwerg", primarySystemId: 1052, secondarySystemId: 1058 },
  { binaryId: 1026, name: "Binärsystem Blauer Riese - Orangener Zwerg", primarySystemId: 1049, secondarySystemId: 1059 },
  { binaryId: 1027, name: "Binärsystem Orangener Riese - Orangener Zwerg", primarySystemId: 1051, secondarySystemId: 1059 },
  { binaryId: 1028, name: "Binärsystem Roter Riese - Orangener Zwerg", primarySystemId: 1052, secondarySystemId: 1059 },
  { binaryId: 1029, name: "Binärsystem Blauer Riese - Roter Zwerg", primarySystemId: 1049, secondarySystemId: 1060 },
  { binaryId: 1030, name: "Binärsystem Roter Riese - Roter Zwerg", primarySystemId: 1052, secondarySystemId: 1060 },

  // Zwerg + Zwerg (1031-1040)
  { binaryId: 1031, name: "Binärsystem Blauer Zwerg - Blauer Zwerg", primarySystemId: 1057, secondarySystemId: 1057 },
  { binaryId: 1032, name: "Binärsystem Gelber Zwerg - Blauer Zwerg", primarySystemId: 1058, secondarySystemId: 1057 },
  { binaryId: 1033, name: "Binärsystem Gelber Zwerg - Gelber Zwerg", primarySystemId: 1058, secondarySystemId: 1058 },
  { binaryId: 1034, name: "Binärsystem Gelber Zwerg - Orangener Zwerg", primarySystemId: 1058, secondarySystemId: 1059 },
  { binaryId: 1035, name: "Binärsystem Gelber Zwerg - Roter Zwerg", primarySystemId: 1058, secondarySystemId: 1060 },
  { binaryId: 1036, name: "Binärsystem Orangener Zwerg - Blauer Zwerg", primarySystemId: 1059, secondarySystemId: 1057 },
  { binaryId: 1037, name: "Binärsystem Orangener Zwerg - Orangener Zwerg", primarySystemId: 1059, secondarySystemId: 1059 },
  { binaryId: 1038, name: "Binärsystem Orangener Zwerg - Roter Zwerg", primarySystemId: 1059, secondarySystemId: 1060 },
  { binaryId: 1039, name: "Binärsystem Roter Zwerg - Blauer Zwerg", primarySystemId: 1060, secondarySystemId: 1057 },
  { binaryId: 1040, name: "Binärsystem Roter Zwerg - Roter Zwerg", primarySystemId: 1060, secondarySystemId: 1060 },

  // Neutronenstern + Riese (1041-1044) - NEU
  { binaryId: 1041, name: "Binärsystem Neutronenstern - Blauer Riese", primarySystemId: 1067, secondarySystemId: 1049 },
  { binaryId: 1042, name: "Binärsystem Neutronenstern - Gelber Riese", primarySystemId: 1067, secondarySystemId: 1050 },
  { binaryId: 1043, name: "Binärsystem Neutronenstern - Orangener Riese", primarySystemId: 1067, secondarySystemId: 1051 },
  { binaryId: 1044, name: "Binärsystem Neutronenstern - Roter Riese", primarySystemId: 1067, secondarySystemId: 1052 },

  // Schwarzes Loch + Riese (1045-1048) - NEU
  { binaryId: 1045, name: "Binärsystem Schwarzes Loch ZL - Blauer Riese", primarySystemId: 1063, secondarySystemId: 1049 },
  { binaryId: 1046, name: "Binärsystem Schwarzes Loch ZO - Gelber Riese", primarySystemId: 1061, secondarySystemId: 1050 },
  { binaryId: 1047, name: "Binärsystem Schwarzes Loch ZO - Orangener Riese", primarySystemId: 1061, secondarySystemId: 1051 },
  { binaryId: 1048, name: "Binärsystem Schwarzes Loch ZR - Roter Riese", primarySystemId: 1062, secondarySystemId: 1052 }
];

/**
 * Helper: Get asset range by galaxyImageId
 */
export function getAssetRangeBySystemType(systemTypeId: number): StarAssetRange | undefined {
  return STAR_ASSET_RANGES.find(range => range.galaxyImageId === systemTypeId);
}

/**
 * Helper: Get binary system combo by binaryId
 */
export function getBinarySystemCombo(binaryId: number): BinarySystemCombo | undefined {
  return BINARY_SYSTEMS.find(binary => binary.binaryId === binaryId);
}

/**
 * Helper: Check if a systemtype ID is a binary system
 */
export function isBinarySystem(systemTypeId: number): boolean {
  return systemTypeId >= 1001 && systemTypeId <= 1048;
}

/**
 * Helper: Get all systemtype IDs (1041-1075)
 */
export function getAllSystemTypeIds(): number[] {
  return STAR_ASSET_RANGES.map(range => range.galaxyImageId);
}

/**
 * Helper: Get all binary system IDs (1001-1048)
 */
export function getAllBinarySystemIds(): number[] {
  return BINARY_SYSTEMS.map(binary => binary.binaryId);
}

/**
 * Helper: Get recommended grid size for system based on systemtype
 * Returns the system interior grid size (20-40)
 */
export function getSystemGridSize(systemTypeId: number): number {
  // 1071-1075: Sehr klein (keine Planeten)
  if (systemTypeId >= 1071 && systemTypeId <= 1075) {
    return 15;
  }
  
  // 1067-1070: Klein
  if (systemTypeId >= 1067 && systemTypeId <= 1070) {
    return 20;
  }
  
  // 1041-1048: Groß
  if (systemTypeId >= 1041 && systemTypeId <= 1048) {
    return Math.floor(Math.random() * 11) + 30; // 30-40
  }
  
  // 1049-1066: Mittel bis groß (häufigste Systeme)
  if (systemTypeId >= 1049 && systemTypeId <= 1066) {
    return Math.floor(Math.random() * 11) + 25; // 25-35
  }
  
  // Binärsysteme 1001-1048: Mittel bis groß
  if (systemTypeId >= 1001 && systemTypeId <= 1048) {
    return Math.floor(Math.random() * 11) + 25; // 25-35
  }
  
  // Fallback
  return 30;
}

/**
 * Helper: Get planet count range for systemtype
 * Returns {min, max} planet counts
 */
export function getPlanetCountRange(systemTypeId: number, gridSize: number): { min: number; max: number } {
  // 1071-1075: Keine Planeten
  if (systemTypeId >= 1071 && systemTypeId <= 1075) {
    return { min: 0, max: 0 };
  }
  
  // Basierend auf Grid-Größe
  if (gridSize <= 20) {
    return { min: 3, max: 8 };
  } else if (gridSize <= 30) {
    return { min: 6, max: 12 };
  } else {
    return { min: 8, max: 15 };
  }
}

/**
 * Helper: Get asteroid field count range for systemtype
 * Returns {min, max} asteroid field counts
 */
export function getAsteroidCountRange(systemTypeId: number, gridSize: number): { min: number; max: number } {
  // 1071-1075: Keine Asteroiden
  if (systemTypeId >= 1071 && systemTypeId <= 1075) {
    return { min: 0, max: 0 };
  }
  
  // Basierend auf Grid-Größe
  if (gridSize <= 20) {
    return { min: 1, max: 3 };
  } else if (gridSize <= 30) {
    return { min: 2, max: 5 };
  } else {
    return { min: 3, max: 8 };
  }
}

