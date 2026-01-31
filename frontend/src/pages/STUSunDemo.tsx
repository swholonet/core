import { Star, Binary, Image, Download, Save, Check } from 'lucide-react';
import { useState } from 'react';

const ASSET_BASE_URL = import.meta.env.VITE_ASSET_BASE_URL || 'https://swuniverse.github.io/assets/';

// TypeScript interfaces for star asset ranges
interface StarAssetRange {
  startId: number;
  endId: number;
  name: string;
  galaxyImageId: number | null;
  fileExtension: string;
  canUseBinary?: boolean;
}

// Main star assets data - verifizierte Asset-Ranges basierend auf tatsächlichen Dateien
const STAR_ASSET_RANGES: StarAssetRange[] = [
  // Sortiert nach Systemtype-ID (1041-1075)
  {
    startId: 104101,
    endId: 104200,
    name: "Systemtype 1041",
    galaxyImageId: 1041,
    fileExtension: "png",
    canUseBinary: false
  },
  {
    startId: 104201,
    endId: 104300,
    name: "Systemtype 1042",
    galaxyImageId: 1042,
    fileExtension: "png",
    canUseBinary: false
  },
  {
    startId: 104301,
    endId: 104400,
    name: "Systemtype 1043",
    galaxyImageId: 1043,
    fileExtension: "png",
    canUseBinary: false
  },
  {
    startId: 104401,
    endId: 104500,
    name: "Systemtype 1044",
    galaxyImageId: 1044,
    fileExtension: "png",
    canUseBinary: false
  },
  {
    startId: 104501,
    endId: 104600,
    name: "Systemtype 1045",
    galaxyImageId: 1045,
    fileExtension: "png",
    canUseBinary: false
  },
  {
    startId: 104601,
    endId: 104700,
    name: "Systemtype 1046",
    galaxyImageId: 1046,
    fileExtension: "png",
    canUseBinary: false
  },
  {
    startId: 104701,
    endId: 104800,
    name: "Systemtype 1047",
    galaxyImageId: 1047,
    fileExtension: "png",
    canUseBinary: false
  },
  {
    startId: 104801,
    endId: 104900,
    name: "Systemtype 1048",
    galaxyImageId: 1048,
    fileExtension: "png",
    canUseBinary: false
  },
  {
    startId: 104901,
    endId: 104925,
    name: "Systemtype 1049",
    galaxyImageId: 1049,
    fileExtension: "png",
    canUseBinary: false
  },
  {
    startId: 105001,
    endId: 105025,
    name: "Systemtype 1050",
    galaxyImageId: 1050,
    fileExtension: "png",
    canUseBinary: false
  },
  {
    startId: 105101,
    endId: 105125,
    name: "Systemtype 1051",
    galaxyImageId: 1051,
    fileExtension: "png",
    canUseBinary: false
  },
  {
    startId: 105201,
    endId: 105225,
    name: "Systemtype 1052",
    galaxyImageId: 1052,
    fileExtension: "png",
    canUseBinary: false
  },
  {
    startId: 105301,
    endId: 105336,
    name: "Systemtype 1053",
    galaxyImageId: 1053,
    fileExtension: "png",
    canUseBinary: false
  },
  {
    startId: 105401,
    endId: 105436,
    name: "Systemtype 1054",
    galaxyImageId: 1054,
    fileExtension: "png",
    canUseBinary: false
  },
  {
    startId: 105501,
    endId: 105536,
    name: "Systemtype 1055",
    galaxyImageId: 1055,
    fileExtension: "png",
    canUseBinary: false
  },
  {
    startId: 105601,
    endId: 105636,
    name: "Systemtype 1056",
    galaxyImageId: 1056,
    fileExtension: "png",
    canUseBinary: false
  },
  {
    startId: 105701,
    endId: 105716,
    name: "Systemtype 1057",
    galaxyImageId: 1057,
    fileExtension: "png",
    canUseBinary: false
  },
  {
    startId: 105801,
    endId: 105816,
    name: "Systemtype 1058",
    galaxyImageId: 1058,
    fileExtension: "png",
    canUseBinary: false
  },
  {
    startId: 105901,
    endId: 105916,
    name: "Systemtype 1059",
    galaxyImageId: 1059,
    fileExtension: "png",
    canUseBinary: false
  },
  {
    startId: 106001,
    endId: 106016,
    name: "Systemtype 1060",
    galaxyImageId: 1060,
    fileExtension: "png",
    canUseBinary: false
  },
  {
    startId: 106101,
    endId: 106116,
    name: "Systemtype 1061",
    galaxyImageId: 1061,
    fileExtension: "png",
    canUseBinary: false
  },
  {
    startId: 106201,
    endId: 106216,
    name: "Systemtype 1062",
    galaxyImageId: 1062,
    fileExtension: "png",
    canUseBinary: false
  },
  {
    startId: 106301,
    endId: 106316,
    name: "Systemtype 1063",
    galaxyImageId: 1063,
    fileExtension: "png",
    canUseBinary: false
  },
  {
    startId: 106401,
    endId: 106436,
    name: "Systemtype 1064",
    galaxyImageId: 1064,
    fileExtension: "png",
    canUseBinary: false
  },
  {
    startId: 106501,
    endId: 106536,
    name: "Systemtype 1065",
    galaxyImageId: 1065,
    fileExtension: "png",
    canUseBinary: false
  },
  {
    startId: 106601,
    endId: 106636,
    name: "Systemtype 1066",
    galaxyImageId: 1066,
    fileExtension: "png",
    canUseBinary: false
  },
  {
    startId: 106701,
    endId: 106704,
    name: "Systemtype 1067",
    galaxyImageId: 1067,
    fileExtension: "png",
    canUseBinary: false
  },
  {
    startId: 106801,
    endId: 106804,
    name: "Systemtype 1068",
    galaxyImageId: 1068,
    fileExtension: "png",
    canUseBinary: false
  },
  {
    startId: 106901,
    endId: 106916,
    name: "Systemtype 1069",
    galaxyImageId: 1069,
    fileExtension: "png",
    canUseBinary: false
  },
  {
    startId: 107001,
    endId: 107016,
    name: "Systemtype 1070",
    galaxyImageId: 1070,
    fileExtension: "png",
    canUseBinary: false
  },
  {
    startId: 107101,
    endId: 107200,
    name: "Systemtype 1071",
    galaxyImageId: 1071,
    fileExtension: "png",
    canUseBinary: false
  },
  {
    startId: 107201,
    endId: 107300,
    name: "Systemtype 1072",
    galaxyImageId: 1072,
    fileExtension: "png",
    canUseBinary: false
  },
  {
    startId: 107301,
    endId: 107400,
    name: "Systemtype 1073",
    galaxyImageId: 1073,
    fileExtension: "png",
    canUseBinary: false
  },
  {
    startId: 107401,
    endId: 107500,
    name: "Systemtype 1074",
    galaxyImageId: 1074,
    fileExtension: "png",
    canUseBinary: false
  },
  {
    startId: 107501,
    endId: 107600,
    name: "Systemtype 1075",
    galaxyImageId: 1075,
    fileExtension: "png",
    canUseBinary: false
  }
];

// Spezielle Systemtypes ohne Detail-Assets (nur Galaxiekarten-Icons)
// Diese haben keine zugehörigen map/*01-XX.png Assets
const SPECIAL_SYSTEMTYPES: { id: number; name: string }[] = [
  // Riese + Riese (1001-1010)
  { id: 1001, name: "Binärsystem Blauer Riese - Blauer Riese" },
  { id: 1002, name: "Binärsystem Blauer Riese - Gelber Riese" },
  { id: 1003, name: "Binärsystem Gelber Riese - Gelber Riese" },
  { id: 1004, name: "Binärsystem Oranger Riese - Gelber Riese" },
  { id: 1005, name: "Binärsystem Gelber Riese - Roter Riese" },
  { id: 1006, name: "Binärsystem Blauer Riese - Orangener Riese" },
  { id: 1007, name: "Binärsystem Orangener Riese - Orangener Riese" },
  { id: 1008, name: "Binärsystem Orangener Riese - Roter Riese" },
  { id: 1009, name: "Binärsystem Roter Riese - Blauer Riese" },
  { id: 1010, name: "Binärsystem Roter Riese - Roter Riese" },
  // Riese + Überriese (1011-1020)
  { id: 1011, name: "Binärsystem Blauer Riese - Blauer Überriese" },
  { id: 1012, name: "Binärsystem Gelber Riese - Blauer Überriese" },
  { id: 1013, name: "Binärsystem Gelber Riese - Gelber Überriese" },
  { id: 1014, name: "Binärsystem Gelber Riese - Orangener Überriese" },
  { id: 1015, name: "Binärsystem Gelber Riese - Roter Überriese" },
  { id: 1016, name: "Binärsystem Orangener Riese - Blauer Überriese" },
  { id: 1017, name: "Binärsystem Orangener Riese - Orangener Überriese" },
  { id: 1018, name: "Binärsystem Orangener Riese - Roter Überriese" },
  { id: 1019, name: "Binärsystem Roter Riese - Blauer Überriese" },
  { id: 1020, name: "Binärsystem Roter Riese - Roter Überriese" },
  // Riese + Zwerg (1021-1030)
  { id: 1021, name: "Binärsystem Blauer Riese - Blauer Zwerg" },
  { id: 1022, name: "Binärsystem Blauer Riese - Gelber Zwerg" },
  { id: 1023, name: "Binärsystem Gelber Riese - Gelber Zwerg" },
  { id: 1024, name: "Binärsystem Orangener Riese - Gelber Zwerg" },
  { id: 1025, name: "Binärsystem Roter Riese - Gelber Zwerg" },
  { id: 1026, name: "Binärsystem Blauer Riese - Orangener Zwerg" },
  { id: 1027, name: "Binärsystem Orangener Riese - Orangener Zwerg" },
  { id: 1028, name: "Binärsystem Roter Riese - Orangener Zwerg" },
  { id: 1029, name: "Binärsystem Blauer Riese - Roter Zwerg" },
  { id: 1030, name: "Binärsystem Roter Riese - Roter Zwerg" },
  // Zwerg + Zwerg (1031-1040)
  { id: 1031, name: "Binärsystem Blauer Zwerg - Blauer Zwerg" },
  { id: 1032, name: "Binärsystem Gelber Zwerg - Blauer Zwerg" },
  { id: 1033, name: "Binärsystem Gelber Zwerg - Gelber Zwerg" },
  { id: 1034, name: "Binärsystem Gelber Zwerg - Orangener Zwerg" },
  { id: 1035, name: "Binärsystem Gelber Zwerg - Roter Zwerg" },
  { id: 1036, name: "Binärsystem Orangener Zwerg - Blauer Zwerg" },
  { id: 1037, name: "Binärsystem Orangener Zwerg - Orangener Zwerg" },
  { id: 1038, name: "Binärsystem Orangener Zwerg - Roter Zwerg" },
  { id: 1039, name: "Binärsystem Roter Zwerg - Blauer Zwerg" },
  { id: 1040, name: "Binärsystem Roter Zwerg - Roter Zwerg" },
  // Neutronenstern + Riese (1041-1044)
  { id: 1041, name: "Binärsystem Neutronenstern - Blauer Riese" },
  { id: 1042, name: "Binärsystem Neutronenstern - Gelber Riese" },
  { id: 1043, name: "Binärsystem Neutronenstern - Orangener Riese" },
  { id: 1044, name: "Binärsystem Neutronenstern - Roter Riese" },
  // Schwarzes Loch + Riese (1045-1048)
  { id: 1045, name: "Binärsystem Schwarzes Loch ZL - Blauer Riese" },
  { id: 1046, name: "Binärsystem Schwarzes Loch ZO - Gelber Riese" },
  { id: 1047, name: "Binärsystem Schwarzes Loch ZO - Orangener Riese" },
  { id: 1048, name: "Binärsystem Schwarzes Loch ZR - Roter Riese" }
];

// Binärsystem-Kombinationen: Welche zwei Systemtypes bilden ein Binärsystem
interface BinarySystemCombo {
  binaryId: number;
  name: string;
  primarySystemId: number;   // Systemtype links oben (größerer Stern)
  secondarySystemId: number; // Systemtype rechts unten (kleinerer Stern)
}

const BINARY_SYSTEMS: BinarySystemCombo[] = [
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

// Asset Range Display Component
interface AssetRangeCardProps {
  range: StarAssetRange;
  showBinaryBadge?: boolean;
}

// Grid Display Component for complete composed star images
interface StarGridDisplayProps {
  range: StarAssetRange;
  cellSize?: number;
}

function StarGridDisplay({ range, cellSize = 24 }: StarGridDisplayProps) {
  const assetCount = range.endId - range.startId + 1;

  // Calculate grid dimensions based on asset count
  const getGridDimensions = (count: number) => {
    // Exact matches for known grid patterns
    if (count === 4) return { rows: 2, cols: 2 };
    if (count === 16) return { rows: 4, cols: 4 };
    if (count === 25) return { rows: 5, cols: 5 };
    if (count === 26) return { rows: 5, cols: 6 }; // 5 rows × 6 cols (1 empty)
    if (count === 36) return { rows: 6, cols: 6 };
    if (count === 100) return { rows: 10, cols: 10 };
    if (count === 101) return { rows: 10, cols: 11 }; // 10 rows × 11 cols (1 empty)
    
    // Perfect squares
    const sqrt = Math.sqrt(count);
    if (Number.isInteger(sqrt)) {
      return { rows: sqrt, cols: sqrt };
    }
    
    // Fallback to rectangular grid (try to keep it square-ish)
    const cols = Math.ceil(sqrt);
    const rows = Math.ceil(count / cols);
    return { rows, cols };
  };

  const { rows, cols } = getGridDimensions(assetCount);

  // Generate all asset URLs in grid order
  const generateGridAssets = () => {
    const assets = [];
    for (let row = 0; row < rows; row++) {
      const rowAssets = [];
      for (let col = 0; col < cols; col++) {
        const index = row * cols + col;
        if (index < assetCount) {
          const assetId = range.startId + index;
          rowAssets.push({
            id: assetId,
            url: `${ASSET_BASE_URL}map/${assetId}.${range.fileExtension}`,
            row,
            col
          });
        } else {
          rowAssets.push(null); // Empty cell
        }
      }
      assets.push(rowAssets);
    }
    return assets;
  };

  const gridAssets = generateGridAssets();

  return (
    <div className="flex flex-col items-center">
      <div className="text-xs font-mono text-purple-400 mb-2">
        System-Grid ({rows}×{cols})
      </div>
      <div
        className="inline-grid border border-slate-600/40 rounded overflow-hidden bg-black"
        style={{
          gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
        }}
      >
        {gridAssets.flat().map((asset, index) => (
          <div
            key={index}
            className="flex items-center justify-center bg-slate-900/20"
            style={{ width: cellSize, height: cellSize }}
          >
            {asset ? (
              <img
                src={asset.url}
                alt={`Asset ${asset.id}`}
                className="w-full h-full object-cover"
                style={{ imageRendering: 'pixelated' }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.opacity = '0.3';
                  target.style.background = '#374151';
                }}
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-slate-800/40" />
            )}
          </div>
        ))}
      </div>
      <div className="text-xs font-mono text-slate-400 mt-2">
        {assetCount} Detail-Assets • {range.startId}-{range.endId}
      </div>
    </div>
  );
}

// Binary System Display Component - shows two overlaid systemtype grids
interface BinarySystemDisplayProps {
  binary: BinarySystemCombo;
  cellSize?: number;
}

function BinarySystemDisplay({ binary, cellSize = 30 }: BinarySystemDisplayProps) {
  // Find the two systemtypes that make up this binary system
  const primarySystem = STAR_ASSET_RANGES.find(r => r.galaxyImageId === binary.primarySystemId);
  const secondarySystem = STAR_ASSET_RANGES.find(r => r.galaxyImageId === binary.secondarySystemId);

  if (!primarySystem || !secondarySystem) {
    return (
      <div className="text-red-400 text-sm font-mono">
        Binary system configuration error: Missing systemtype {!primarySystem ? binary.primarySystemId : binary.secondarySystemId}
      </div>
    );
  }

  const primaryCount = primarySystem.endId - primarySystem.startId + 1;
  const secondaryCount = secondarySystem.endId - secondarySystem.startId + 1;

  // Calculate grid dimensions for each system
  const getPrimaryDims = () => {
    if (primaryCount === 36) return { rows: 6, cols: 6 };
    if (primaryCount === 25) return { rows: 5, cols: 5 };
    if (primaryCount === 16) return { rows: 4, cols: 4 };
    const sqrt = Math.ceil(Math.sqrt(primaryCount));
    return { rows: sqrt, cols: sqrt };
  };

  const getSecondaryDims = () => {
    if (secondaryCount === 36) return { rows: 6, cols: 6 };
    if (secondaryCount === 25) return { rows: 5, cols: 5 };
    if (secondaryCount === 16) return { rows: 4, cols: 4 };
    const sqrt = Math.ceil(Math.sqrt(secondaryCount));
    return { rows: sqrt, cols: sqrt };
  };

  const primaryDims = getPrimaryDims();
  const secondaryDims = getSecondaryDims();

  // Calculate combined grid size with 2 columns gap between systems
  const gapColumns = 2;
  const gridCols = primaryDims.cols + gapColumns + secondaryDims.cols;
  const gridRows = Math.max(primaryDims.rows, secondaryDims.rows);

  // Generate combined grid with two systems side by side
  const generateBinaryGrid = () => {
    const grid: (string | null)[] = Array(gridRows * gridCols).fill(null);
    
    // Place primary system (top-left)
    for (let i = 0; i < primaryCount; i++) {
      const row = Math.floor(i / primaryDims.cols);
      const col = i % primaryDims.cols;
      const gridIndex = row * gridCols + col;
      if (gridIndex < grid.length) {
        grid[gridIndex] = `${ASSET_BASE_URL}map/${primarySystem.startId + i}.${primarySystem.fileExtension}`;
      }
    }

    // Place secondary system (bottom-right with gap)
    const offsetRow = gridRows - secondaryDims.rows; // Align to bottom
    const offsetCol = primaryDims.cols + gapColumns;
    for (let i = 0; i < secondaryCount; i++) {
      const row = Math.floor(i / secondaryDims.cols);
      const col = i % secondaryDims.cols;
      const gridIndex = (offsetRow + row) * gridCols + (offsetCol + col);
      if (gridIndex < grid.length) {
        grid[gridIndex] = `${ASSET_BASE_URL}map/${secondarySystem.startId + i}.${secondarySystem.fileExtension}`;
      }
    }

    return grid;
  };

  const binaryGrid = generateBinaryGrid();

  return (
    <div className="flex flex-col items-center">
      <div className="text-xs font-mono text-purple-400 mb-2">
        {binary.name}: System {binary.primarySystemId} ({primaryDims.rows}×{primaryDims.cols}) + System {binary.secondarySystemId} ({secondaryDims.rows}×{secondaryDims.cols})
      </div>
      <div
        className="inline-grid border border-slate-600/40 rounded overflow-hidden bg-black"
        style={{
          gridTemplateColumns: `repeat(${gridCols}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${gridRows}, ${cellSize}px)`,
        }}
      >
        {binaryGrid.map((assetUrl, index) => (
          <div
            key={index}
            className="flex items-center justify-center bg-slate-900/20"
            style={{ width: cellSize, height: cellSize }}
          >
            {assetUrl ? (
              <img
                src={assetUrl}
                alt={`Binary asset ${index}`}
                className="w-full h-full object-cover"
                style={{ imageRendering: 'pixelated' }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.opacity = '0.3';
                  target.style.background = '#374151';
                }}
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-transparent" />
            )}
          </div>
        ))}
      </div>
      <div className="text-xs font-mono text-slate-400 mt-2">
        {gridRows}×{gridCols} Combined Grid (2 column gap)
      </div>
    </div>
  );
}

function AssetRangeCard({ range, showBinaryBadge = false }: AssetRangeCardProps) {
  const getAssetCount = (range: StarAssetRange) => {
    return range.endId - range.startId + 1;
  };

  return (
    <div className="bg-slate-950/60 border border-purple-500/30 rounded-lg p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-bold text-purple-100 font-mono">
              {range.name}
            </h3>
            {(range.canUseBinary || showBinaryBadge) && (
              <span className="flex items-center gap-1 px-2 py-1 bg-blue-600/30 border border-blue-400/40 rounded text-xs font-mono text-blue-200">
                <Binary size={12} />
                BINARY
              </span>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono text-purple-300">Galaxiekarte Icon:</span>
              <code className="bg-slate-800/60 px-2 py-1 rounded text-blue-200 font-mono text-sm">
                systemtypes/{range.galaxyImageId}.png
              </code>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-mono text-purple-300">Detail Assets:</span>
              <code className="bg-slate-800/60 px-2 py-1 rounded text-orange-200 font-mono text-sm">
                map/{range.startId} - {range.endId}.{range.fileExtension}
              </code>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-mono text-purple-300">Anzahl Detail-Assets:</span>
              <span className="text-purple-100 font-mono">{getAssetCount(range)} Stück</span>
            </div>
          </div>
        </div>

        {/* Galaxy Image Preview */}
        <div className="flex-shrink-0">
          {range.galaxyImageId ? (
            <div className="text-center">
              <div className="text-xs font-mono text-purple-400 mb-2">Galaxiekarte Icon</div>
              <div className="p-2 bg-slate-900/60 border border-slate-600/40 rounded">
                <img
                  src={`${ASSET_BASE_URL}map/systemtypes/${range.galaxyImageId}.png`}
                  alt={`Systemtype ${range.galaxyImageId}`}
                  className="w-12 h-12 border border-slate-600/40 rounded"
                  style={{ imageRendering: 'pixelated' }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement!.innerHTML = '<div class="w-12 h-12 bg-slate-700/40 rounded flex items-center justify-center"><span class="text-slate-500 text-xs">404</span></div>';
                  }}
                />
              </div>
              <div className="text-xs font-mono text-slate-400 mt-1">
                44×44px
              </div>
              <div className="text-xs font-mono text-orange-400 mt-1">
                ID: {range.galaxyImageId}
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="text-xs font-mono text-purple-400 mb-2">Galaxiekarte Icon</div>
              <div className="p-2 bg-slate-900/60 border border-slate-600/40 rounded">
                <div className="w-12 h-12 bg-slate-700/40 rounded flex items-center justify-center">
                  <span className="text-slate-500 text-xs">N/A</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Complete Star Grid Display */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Image size={16} className="text-purple-400" />
          <span className="text-sm font-mono text-purple-300">System-Detail-View (zusammengesetzte Assets)</span>
        </div>
        <div className="p-4 bg-slate-900/40 border border-slate-700/40 rounded">
          <div className="flex flex-wrap gap-6 justify-center">
            {/* Different sizes for better visualization */}
            {[24, 30, 40].map(size => (
              <div key={size} className="text-center">
                <div className="text-xs font-mono text-orange-400 mb-2">
                  {size}×{size}px Tiles
                </div>
                <StarGridDisplay range={range} cellSize={size} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function STUSunDemo() {
  const totalMainAssets = STAR_ASSET_RANGES.reduce((sum, range) => sum + (range.endId - range.startId + 1), 0);
  const totalAssets = totalMainAssets;

  // State for binary system configuration
  const [binaryConfigs, setBinaryConfigs] = useState<{[key: number]: {primary: number, secondary: number}}>(() => {
    // Initialize with existing BINARY_SYSTEMS and default values for unconfigured ones
    const initial: {[key: number]: {primary: number, secondary: number}} = {};
    
    // Add configured binaries
    BINARY_SYSTEMS.forEach(binary => {
      initial[binary.binaryId] = {
        primary: binary.primarySystemId,
        secondary: binary.secondarySystemId
      };
    });
    
    // Add unconfigured binaries with default values
    SPECIAL_SYSTEMTYPES.forEach(special => {
      if (!initial[special.id]) {
        initial[special.id] = {
          primary: 1049, // Default to first mid-size star (blue)
          secondary: 1050 // Default to second mid-size star (yellow)
        };
      }
    });
    
    return initial;
  });

  // Get all binary systems for configuration (including already configured ones)
  const allBinariesForConfig = SPECIAL_SYSTEMTYPES;

  // Get all available systemtype IDs for dropdowns
  const availableSystemTypes = STAR_ASSET_RANGES
    .map(r => r.galaxyImageId!)
    .filter(id => id !== null)
    .sort((a, b) => a - b);

  // Update binary configuration
  const updateBinaryConfig = (binaryId: number, type: 'primary' | 'secondary', value: number) => {
    setBinaryConfigs(prev => ({
      ...prev,
      [binaryId]: {
        ...prev[binaryId],
        [type]: value
      }
    }));
  };

  // Export configuration as JSON
  const exportConfiguration = () => {
    const exportData = Object.entries(binaryConfigs).map(([binaryId, config]) => ({
      binaryId: parseInt(binaryId),
      primarySystemId: config.primary,
      secondarySystemId: config.secondary
    }));

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'binary_systems_config.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import configuration from JSON
  const importConfiguration = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        const newConfigs: {[key: number]: {primary: number, secondary: number}} = {};
        imported.forEach((item: any) => {
          newConfigs[item.binaryId] = {
            primary: item.primarySystemId,
            secondary: item.secondarySystemId
          };
        });
        setBinaryConfigs(newConfigs);
      } catch (error) {
        alert('Fehler beim Importieren der Konfiguration');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8 p-6 bg-gradient-to-br from-slate-950 to-purple-950/20 min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-950/40 to-violet-950/20 border border-purple-500/30 rounded-lg p-6 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-yellow-900/40 border border-yellow-500/40 rounded-lg">
            <Star className="text-yellow-300" size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-purple-100 font-mono tracking-wider">
              STU SYSTEMTYPE ASSETS
            </h1>
            <p className="text-purple-400/70 font-mono text-sm">
              Galaxiekarten-Icons → System-Detail-Assets • {totalAssets} Detail-Assets in {STAR_ASSET_RANGES.length} Systemtypes (1041-1075)
            </p>
          </div>
        </div>
      </div>

      {/* Main Star Assets Section */}
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-slate-950/60 to-orange-950/40 border border-orange-500/30 rounded-lg p-6 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-6">
            <Star className="text-orange-400" size={20} />
            <h2 className="text-2xl font-semibold text-orange-100 font-mono tracking-wider">
              ALLE SYSTEMTYPE ASSETS
            </h2>
            <div className="text-sm font-mono text-orange-400/70 ml-auto">
              {STAR_ASSET_RANGES.length} Systemtypes • {totalMainAssets} Detail-Assets
            </div>
          </div>

          <div className="mb-6 p-4 bg-slate-900/60 border border-blue-500/30 rounded">
            <div className="text-sm font-mono text-blue-200 mb-2">
              📖 Asset-Namensschema:
            </div>
            <div className="space-y-1 text-xs font-mono text-slate-300">
              <div>• <span className="text-purple-300">Galaxiekarte:</span> <code className="text-orange-300">/assets/map/systemtypes/{"{"}{"{galaxyImageId}"}{"}"}.png</code> (44×44px)</div>
              <div>• <span className="text-purple-300">System-Detail:</span> <code className="text-orange-300">/assets/map/{"{"}{"{galaxyImageId}"}{"}"}{"{"}{"{01-XX}"}{"}"}.png</code> (30×30px)</div>
              <div className="pt-2 text-blue-200">Beispiel: Systemtype 1059 → <span className="text-orange-300">systemtypes/1059.png</span> + <span className="text-orange-300">map/105901.png - map/105916.png</span></div>
            </div>
          </div>

          {/* Grid size categories */}
          <div className="mb-6 p-4 bg-slate-900/60 border border-green-500/30 rounded">
            <div className="text-sm font-mono text-green-200 mb-3">
              🔢 System-Größen (Grid-Layouts):
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
              <div className="bg-slate-800/60 p-3 rounded border border-slate-600/40">
                <div className="text-yellow-300 font-bold mb-1">10×10 Grid</div>
                <div className="text-slate-300">100-101 Assets</div>
                <div className="text-slate-400 text-[10px] mt-1">1041-1048, 1071-1075</div>
              </div>
              <div className="bg-slate-800/60 p-3 rounded border border-slate-600/40">
                <div className="text-yellow-300 font-bold mb-1">6×6 Grid</div>
                <div className="text-slate-300">36 Assets</div>
                <div className="text-slate-400 text-[10px] mt-1">1053-1056, 1064-1066, 1070</div>
              </div>
              <div className="bg-slate-800/60 p-3 rounded border border-slate-600/40">
                <div className="text-yellow-300 font-bold mb-1">5×5 Grid</div>
                <div className="text-slate-300">25-26 Assets</div>
                <div className="text-slate-400 text-[10px] mt-1">1049-1052</div>
              </div>
              <div className="bg-slate-800/60 p-3 rounded border border-slate-600/40">
                <div className="text-yellow-300 font-bold mb-1">4×4 Grid</div>
                <div className="text-slate-300">16 Assets</div>
                <div className="text-slate-400 text-[10px] mt-1">1057-1063, 1069</div>
              </div>
              <div className="bg-slate-800/60 p-3 rounded border border-slate-600/40">
                <div className="text-yellow-300 font-bold mb-1">2×2 Grid</div>
                <div className="text-slate-300">4 Assets</div>
                <div className="text-slate-400 text-[10px] mt-1">1067-1068</div>
              </div>
            </div>
          </div>

          <div className="grid gap-6">
            {STAR_ASSET_RANGES.map((range, index) => (
              <AssetRangeCard key={index} range={range} />
            ))}
          </div>
        </div>
      </div>

      {/* Binary System Assets Section */}
      {BINARY_SYSTEMS.length > 0 && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-slate-950/60 to-violet-950/40 border border-violet-500/30 rounded-lg p-6 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-6">
              <Binary className="text-violet-400" size={20} />
              <h2 className="text-2xl font-semibold text-violet-100 font-mono tracking-wider">
                BINÄRSYSTEME
              </h2>
              <div className="text-sm font-mono text-violet-400/70 ml-auto">
                {BINARY_SYSTEMS.length} Binärsysteme
              </div>
            </div>

            <div className="mb-6 p-4 bg-slate-900/60 border border-violet-500/30 rounded">
              <div className="text-sm font-mono text-violet-200 mb-2">
                ⭐⭐ Besonderheit:
              </div>
              <div className="text-xs font-mono text-slate-300">
                Binärsysteme bestehen aus zwei kombinierten Systemtypes. Das Galaxiekarten-Icon (z.B. 1017) 
                repräsentiert die Kombination, während die Detail-Ansicht aus zwei überlagerten Sonnensystemen besteht.
              </div>
            </div>

            <div className="grid gap-6">
              {BINARY_SYSTEMS.map((binary, index) => (
                <div key={index} className="bg-slate-900/40 border border-slate-700/40 rounded-lg p-6">
                  <div className="flex items-start gap-6 mb-6">
                    {/* Binary System Icon */}
                    <div className="text-center flex-shrink-0">
                      <div className="text-xs font-mono text-violet-400 mb-2">Galaxiekarte Icon</div>
                      <div className="p-2 bg-slate-900/60 border border-slate-600/40 rounded">
                        <img
                          src={`${ASSET_BASE_URL}map/systemtypes/${binary.binaryId}.png`}
                          alt={`Binary ${binary.binaryId}`}
                          className="w-16 h-16 border border-slate-600/40 rounded"
                          style={{ imageRendering: 'pixelated' }}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      </div>
                      <div className="text-xs font-mono text-slate-400 mt-1">
                        ID: {binary.binaryId}
                      </div>
                    </div>

                    {/* System Information */}
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-violet-200 font-mono mb-3">{binary.name}</h3>
                      <div className="space-y-2 text-sm font-mono">
                        <div className="flex items-center gap-2">
                          <span className="text-orange-400">Primary Star:</span>
                          <span className="text-slate-300">Systemtype {binary.primarySystemId}</span>
                          <span className="text-slate-500">
                            ({STAR_ASSET_RANGES.find(r => r.galaxyImageId === binary.primarySystemId)?.endId! - 
                             STAR_ASSET_RANGES.find(r => r.galaxyImageId === binary.primarySystemId)?.startId! + 1} Assets)
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-blue-400">Secondary Star:</span>
                          <span className="text-slate-300">Systemtype {binary.secondarySystemId}</span>
                          <span className="text-slate-500">
                            ({STAR_ASSET_RANGES.find(r => r.galaxyImageId === binary.secondarySystemId)?.endId! - 
                             STAR_ASSET_RANGES.find(r => r.galaxyImageId === binary.secondarySystemId)?.startId! + 1} Assets)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Combined Binary System View */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Image size={16} className="text-violet-400" />
                      <span className="text-sm font-mono text-violet-300">Kombinierte Binärsystem-Ansicht (2 Spalten Abstand)</span>
                    </div>
                    <div className="p-4 bg-slate-900/40 border border-slate-700/40 rounded">
                      <BinarySystemDisplay binary={binary} cellSize={20} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-slate-900/60 border border-yellow-500/30 rounded">
              <div className="text-sm font-mono text-yellow-200 mb-2">
                ℹ️ Weitere Binärsysteme:
              </div>
              <div className="text-xs font-mono text-slate-300">
                Die Systemtypes 1001-1048 sind alle Binärsysteme (48 gesamt). Alle Binärsysteme sind mit den
                korrekten Systemtype-Kombinationen konfiguriert. Das Array enthält Riese+Riese, Riese+Überriese,
                Riese+Zwerg, Zwerg+Zwerg sowie Neutronenstern/Schwarzes Loch+Riese Kombinationen.
              </div>
              <div className="text-xs font-mono text-slate-400 mt-2">
                Icons verfügbar: {SPECIAL_SYSTEMTYPES.map(s => s.id).join(', ')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Weitere Binärsystem-Icons (noch nicht konfiguriert) */}
      {allBinariesForConfig.length > 0 && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-slate-950/60 to-indigo-950/40 border border-indigo-500/30 rounded-lg p-6 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-6">
              <Binary className="text-indigo-400" size={20} />
              <h2 className="text-2xl font-semibold text-indigo-100 font-mono tracking-wider">
                BINÄRSYSTEM-KONFIGURATION
              </h2>
              <div className="text-sm font-mono text-indigo-400/70 ml-auto">
                {allBinariesForConfig.length} Binärsysteme • {BINARY_SYSTEMS.length} vorkonfiguriert
              </div>
            </div>

            <div className="mb-6 p-4 bg-slate-900/60 border border-indigo-500/30 rounded">
              <div className="text-sm font-mono text-indigo-200 mb-2">
                🛠️ Interaktive Konfiguration:
              </div>
              <div className="text-xs font-mono text-slate-300 mb-3">
                Wähle für jedes Binärsystem die richtigen Systemtype-Kombinationen aus den Dropdowns aus. 
                Die Konfiguration kann als JSON exportiert und später wieder importiert werden.
              </div>
              <div className="flex gap-4">
                <button
                  onClick={exportConfiguration}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600/30 hover:bg-green-600/50 border border-green-400/40 rounded text-sm font-mono text-green-200 transition-colors"
                >
                  <Download size={16} />
                  Export JSON
                </button>
                <label className="flex items-center gap-2 px-4 py-2 bg-blue-600/30 hover:bg-blue-600/50 border border-blue-400/40 rounded text-sm font-mono text-blue-200 transition-colors cursor-pointer">
                  <Save size={16} />
                  Import JSON
                  <input
                    type="file"
                    accept=".json"
                    onChange={importConfiguration}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div className="grid gap-4">
              {allBinariesForConfig.map((binary) => {
                const config = binaryConfigs[binary.id];
                const primaryRange = STAR_ASSET_RANGES.find(r => r.galaxyImageId === config.primary);
                const secondaryRange = STAR_ASSET_RANGES.find(r => r.galaxyImageId === config.secondary);
                const isConfigured = BINARY_SYSTEMS.find(b => b.binaryId === binary.id);

                return (
                  <div key={binary.id} className={`bg-slate-900/40 border rounded-lg p-4 ${isConfigured ? 'border-green-500/40' : 'border-slate-700/40'}`}>
                    <div className="flex items-start gap-4">
                      {/* Binary Icon */}
                      <div className="flex-shrink-0 text-center">
                        <div className="text-xs font-mono text-indigo-400 mb-1">Binary {binary.id}</div>
                        {isConfigured && (
                          <div className="text-[10px] font-mono text-green-400 mb-1 flex items-center gap-1 justify-center">
                            <Check size={10} />
                            Konfiguriert
                          </div>
                        )}
                        <div className="p-2 bg-slate-900/60 border border-slate-600/40 rounded">
                          <img
                            src={`${ASSET_BASE_URL}map/systemtypes/${binary.id}.png`}
                            alt={`Binary ${binary.id}`}
                            className="w-12 h-12 border border-slate-600/40 rounded"
                            style={{ imageRendering: 'pixelated' }}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        </div>
                      </div>

                      {/* Configuration Dropdowns */}
                      <div className="flex-1 space-y-3">
                        {/* Primary System */}
                        <div className="flex items-center gap-3">
                          <label className="text-sm font-mono text-orange-400 w-24">Primary:</label>
                          <select
                            value={config.primary}
                            onChange={(e) => updateBinaryConfig(binary.id, 'primary', parseInt(e.target.value))}
                            className="flex-1 px-3 py-2 bg-slate-800/60 border border-slate-600/40 rounded text-sm font-mono text-slate-200 focus:outline-none focus:border-orange-400/60"
                          >
                            {availableSystemTypes.map(id => (
                              <option key={id} value={id}>
                                {id} ({STAR_ASSET_RANGES.find(r => r.galaxyImageId === id)?.endId! - 
                                      STAR_ASSET_RANGES.find(r => r.galaxyImageId === id)?.startId! + 1} Assets)
                              </option>
                            ))}
                          </select>
                          {primaryRange && (
                            <div className="w-8 h-8 flex-shrink-0">
                              <img
                                src={`${ASSET_BASE_URL}map/systemtypes/${config.primary}.png`}
                                alt={`System ${config.primary}`}
                                className="w-8 h-8 border border-slate-600/40 rounded"
                                style={{ imageRendering: 'pixelated' }}
                              />
                            </div>
                          )}
                        </div>

                        {/* Secondary System */}
                        <div className="flex items-center gap-3">
                          <label className="text-sm font-mono text-blue-400 w-24">Secondary:</label>
                          <select
                            value={config.secondary}
                            onChange={(e) => updateBinaryConfig(binary.id, 'secondary', parseInt(e.target.value))}
                            className="flex-1 px-3 py-2 bg-slate-800/60 border border-slate-600/40 rounded text-sm font-mono text-slate-200 focus:outline-none focus:border-blue-400/60"
                          >
                            {availableSystemTypes.map(id => (
                              <option key={id} value={id}>
                                {id} ({STAR_ASSET_RANGES.find(r => r.galaxyImageId === id)?.endId! - 
                                      STAR_ASSET_RANGES.find(r => r.galaxyImageId === id)?.startId! + 1} Assets)
                              </option>
                            ))}
                          </select>
                          {secondaryRange && (
                            <div className="w-8 h-8 flex-shrink-0">
                              <img
                                src={`${ASSET_BASE_URL}map/systemtypes/${config.secondary}.png`}
                                alt={`System ${config.secondary}`}
                                className="w-8 h-8 border border-slate-600/40 rounded"
                                style={{ imageRendering: 'pixelated' }}
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Live Preview */}
                      {primaryRange && secondaryRange && (
                        <div className="flex-shrink-0">
                          <div className="text-xs font-mono text-slate-400 mb-1">Preview:</div>
                          <div className="p-2 bg-slate-900/60 border border-slate-600/40 rounded">
                            <BinarySystemDisplay 
                              binary={{
                                binaryId: binary.id,
                                name: binary.name,
                                primarySystemId: config.primary,
                                secondarySystemId: config.secondary
                              }} 
                              cellSize={12} 
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 p-4 bg-green-900/20 border border-green-500/30 rounded">
              <div className="flex items-start gap-2">
                <Check className="text-green-400 flex-shrink-0 mt-0.5" size={16} />
                <div className="text-xs font-mono text-green-200">
                  Nach der Konfiguration: "Export JSON" klicken, um die Datei herunterzuladen. 
                  Die JSON-Datei kann dann verwendet werden, um den Code zu aktualisieren.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Weitere Binärsystem-Icons (noch nicht konfiguriert) */}
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-slate-950/60 to-blue-950/40 border border-blue-500/30 rounded-lg p-6 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-6">
            <Binary className="text-blue-400" size={20} />
            <h2 className="text-2xl font-semibold text-blue-100 font-mono tracking-wider">
              WEITERE BINÄRSYSTEM-ICONS
            </h2>
            <div className="text-sm font-mono text-blue-400/70 ml-auto">
              {SPECIAL_SYSTEMTYPES.length} Icons • {BINARY_SYSTEMS.length} konfiguriert
            </div>
          </div>

          <div className="mb-6 p-4 bg-slate-900/60 border border-yellow-500/30 rounded">
            <div className="text-sm font-mono text-yellow-200 mb-2">
              ⚠️ Noch nicht vollständig konfiguriert:
            </div>
            <div className="text-xs font-mono text-slate-300">
              Diese Binärsystem-Icons (1001-1048) existieren und sind vollständig konfiguriert.
              Alle Kombinationen sind im BINARY_SYSTEMS Array definiert.
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {SPECIAL_SYSTEMTYPES.map((special) => (
              <div key={special.id} className="bg-slate-900/60 border border-slate-600/40 rounded p-3 text-center">
                <div className="mb-2">
                  <img
                    src={`${ASSET_BASE_URL}map/systemtypes/${special.id}.png`}
                    alt={`Systemtype ${special.id}`}
                    className="w-16 h-16 mx-auto border border-slate-600/40 rounded"
                    style={{ imageRendering: 'pixelated' }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
                <div className="text-xs font-mono text-slate-400">
                  ID: {special.id}
                </div>
                <div className="text-xs font-mono text-orange-300 mt-1">
                  {special.id === 1017 ? "Binärsystem" : "Spezial"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Footer */}
      <div className="bg-gradient-to-br from-slate-950/60 to-green-950/40 border border-green-500/30 rounded-lg p-4 backdrop-blur-sm">
        <div className="flex flex-col gap-2">
          <div className="text-sm font-mono text-green-200">
            Gesamt: {totalAssets} Detail-Assets für {STAR_ASSET_RANGES.length} Systemtypes (ID-Range: 1041-1075)
          </div>
          <div className="text-sm font-mono text-blue-200">
            + {SPECIAL_SYSTEMTYPES.length} Binärsysteme (1001-1048) ohne Detail-Assets
          </div>
          <div className="text-xs font-mono text-green-400/70">
            Jedes Galaxiekarten-Icon (systemtypes/*.png) hat zugehörige Detail-Assets (map/{"{systemtypeId}{01-XX}"}.png)
          </div>
          <div className="text-xs font-mono text-green-400/70">
            Die Detail-Assets bilden zusammen das vollständige Sonnensystem im Grid-Layout (2×2, 4×4, 5×5, 6×6 oder 10×10)
          </div>
        </div>
      </div>
    </div>
  );
}