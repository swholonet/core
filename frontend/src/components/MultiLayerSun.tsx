import { useState, useEffect, useMemo } from 'react';
import {
  MultiLayerAssetSet,
  AssetGridMapping,
  generateGridMappings,
  getAssetUrlForPosition,
  checkAssetExists,
  getMultiLayerAssetForSystemType
} from '../utils/assetDiscovery';
import { getBinarySystemCombo, isBinarySystem } from '../config/systemAssets';

/**
 * Extract systemtype numeric ID from SystemType enum value
 * e.g., "SYS_1049" => 1049, "BIN_1001" => 1001
 */
const getSystemTypeId = (systemType: string): number => {
  if (systemType.startsWith('SYS_')) {
    return parseInt(systemType.replace('SYS_', ''));
  } else if (systemType.startsWith('BIN_')) {
    return parseInt(systemType.replace('BIN_', ''));
  }
  return 1050; // fallback to yellow sun
};

interface MultiLayerSunProps {
  /** Base asset ID for the multi-layer sun (e.g., 105000) */
  baseAssetId?: number;

  /** Grid size for the sun (e.g., 5 for 5x5) */
  gridSize?: number;

  /** Size of each grid cell in pixels */
  cellSize?: number;

  /** System type enum value (e.g., "SYS_1049" or "BIN_1001") */
  systemType: string;

  /** Alt text for accessibility */
  alt?: string;

  /** Additional CSS classes */
  className?: string;

  /** Debug mode to show grid lines and asset IDs */
  debug?: boolean;

  /** Show loading state */
  showLoading?: boolean;
}

interface BinaryMultiLayerSunProps {
  /** Binary system type enum value (e.g., "BIN_1001") */
  systemType: string;

  /** Size of each grid cell in pixels */
  cellSize?: number;

  /** Alt text for accessibility */
  alt?: string;

  /** Additional CSS classes */
  className?: string;

  /** Debug mode */
  debug?: boolean;
}

interface AssetState {
  url: string;
  loaded: boolean;
  error: boolean;
  assetId: number;
}

/**
 * Renders a binary star system with two multi-layer suns side-by-side
 */
function BinaryMultiLayerSun({
  systemType,
  cellSize = 30,
  alt = 'Binary Star System',
  className = '',
  debug = false,
}: BinaryMultiLayerSunProps) {
  const binaryCombo = useMemo(() => {
    const systemTypeId = getSystemTypeId(systemType);
    return getBinarySystemCombo(systemTypeId);
  }, [systemType]);

  if (!binaryCombo) {
    console.error(`No binary combo found for system type: ${systemType}`);
    return <div className="text-red-500 text-xs">Binary system not found</div>;
  }

  // Get asset sets for both stars
  const primaryAssetSet = useMemo(
    () => getMultiLayerAssetForSystemType(`SYS_${binaryCombo.primarySystemId}`),
    [binaryCombo.primarySystemId]
  );

  const secondaryAssetSet = useMemo(
    () => getMultiLayerAssetForSystemType(`SYS_${binaryCombo.secondarySystemId}`),
    [binaryCombo.secondarySystemId]
  );

  if (!primaryAssetSet || !secondaryAssetSet) {
    return <div className="text-yellow-500 text-xs">Loading binary system...</div>;
  }

  const primaryGridSize = primaryAssetSet.gridSize;
  const secondaryGridSize = secondaryAssetSet.gridSize;
  
  // Calculate total container size with 3-column gap and vertical offset for diagonal positioning
  const gapColumns = 3; // Horizontal gap between binary stars
  const verticalOffset = Math.floor(Math.max(primaryGridSize, secondaryGridSize) / 3) * cellSize; // STU-style diagonal offset
  const totalWidth = (primaryGridSize + secondaryGridSize + gapColumns) * cellSize;
  const totalHeight = Math.max(primaryGridSize, secondaryGridSize) * cellSize + verticalOffset;

  return (
    <div
      className={`relative ${className}`}
      style={{
        width: totalWidth,
        height: totalHeight,
      }}
      role="img"
      aria-label={alt}
    >
      {/* Primary star (left-top) */}
      <div
        className="absolute filter drop-shadow-lg"
        style={{
          left: 0,
          top: 0,
        }}
      >
        <MultiLayerSun
          systemType={`SYS_${binaryCombo.primarySystemId}`}
          cellSize={cellSize}
          debug={debug}
          showLoading={false}
        />
      </div>

      {/* Secondary star (right-bottom with offset) */}
      <div
        className="absolute filter drop-shadow-lg"
        style={{
          left: (primaryGridSize + gapColumns) * cellSize,
          top: verticalOffset,
        }}
      >
        <MultiLayerSun
          systemType={`SYS_${binaryCombo.secondarySystemId}`}
          cellSize={cellSize}
          debug={debug}
          showLoading={false}
        />
      </div>

      {debug && (
        <div className="absolute top-0 left-0 text-xs text-white bg-black bg-opacity-50 p-1 rounded">
          Binary: {binaryCombo.primarySystemId} + {binaryCombo.secondarySystemId}
        </div>
      )}
    </div>
  );
}

/**
 * MultiLayerSun Component
 *
 * Renders multi-layer suns using STU's grid-based asset system.
 * Each sun is composed of multiple image tiles arranged in a grid pattern.
 */
export default function MultiLayerSun({
  baseAssetId,
  gridSize,
  cellSize = 24,
  systemType,
  alt = 'Multi-Layer Sun',
  className = '',
  debug = false,
  showLoading = false
}: MultiLayerSunProps) {
  // Check if this is a binary system
  const systemTypeId = getSystemTypeId(systemType);
  if (isBinarySystem(systemTypeId)) {
    return (
      <BinaryMultiLayerSun
        systemType={systemType}
        cellSize={cellSize}
        alt={alt}
        className={className}
        debug={debug}
      />
    );
  }

  // Determine asset set to use
  const assetSet = useMemo((): MultiLayerAssetSet | null => {
    if (baseAssetId && gridSize) {
      return {
        baseId: baseAssetId,
        gridSize,
        totalAssets: gridSize * gridSize,
        pattern: `${baseAssetId + 1}-${baseAssetId + gridSize * gridSize}`,
        systemType,
        systemTypeId
      };
    }

    // Fallback to system type mapping
    return getMultiLayerAssetForSystemType(systemType);
  }, [baseAssetId, gridSize, systemType]);

  // Generate grid mappings
  const gridMappings = useMemo((): AssetGridMapping[] => {
    if (!assetSet) return [];
    return generateGridMappings(assetSet.baseId, assetSet.gridSize);
  }, [assetSet]);

  // Asset loading states
  const [assetStates, setAssetStates] = useState<Record<string, AssetState>>({});
  const [isInitializing, setIsInitializing] = useState(true);

  // Initialize asset states
  useEffect(() => {
    if (!assetSet || gridMappings.length === 0) {
      setIsInitializing(false);
      return;
    }

    setIsInitializing(true);

    const initialStates: Record<string, AssetState> = {};

    gridMappings.forEach((mapping) => {
      const key = `${mapping.row}-${mapping.col}`;
      const url = getAssetUrlForPosition(
        assetSet.baseId,
        mapping.row,
        mapping.col,
        assetSet.gridSize
      );

      initialStates[key] = {
        url,
        loaded: false,
        error: false,
        assetId: mapping.assetId
      };
    });

    setAssetStates(initialStates);
    setIsInitializing(false);
  }, [assetSet, gridMappings]);

  // Load assets and check availability
  useEffect(() => {
    if (isInitializing || !assetSet) return;

    const loadAssets = async () => {
      const updates: Record<string, Partial<AssetState>> = {};

      for (const mapping of gridMappings) {
        const key = `${mapping.row}-${mapping.col}`;
        const state = assetStates[key];

        if (state && !state.loaded && !state.error) {
          try {
            const exists = await checkAssetExists(state.url);
            updates[key] = {
              loaded: exists,
              error: !exists
            };
          } catch (error) {
            updates[key] = {
              loaded: false,
              error: true
            };
          }
        }
      }

      if (Object.keys(updates).length > 0) {
        setAssetStates(prev => {
          const newStates = { ...prev };
          Object.entries(updates).forEach(([key, update]) => {
            if (newStates[key]) {
              newStates[key] = { ...newStates[key], ...update };
            }
          });
          return newStates;
        });
      }
    };

    loadAssets();
  }, [assetStates, gridMappings, assetSet, isInitializing]);

  // Calculate total size
  const totalSize = useMemo(() => {
    if (!assetSet) return { width: cellSize, height: cellSize };
    return {
      width: assetSet.gridSize * cellSize,
      height: assetSet.gridSize * cellSize
    };
  }, [assetSet, cellSize]);

  // Loading states
  const loadingStats = useMemo(() => {
    const total = Object.keys(assetStates).length;
    const loaded = Object.values(assetStates).filter(state => state.loaded).length;
    const errors = Object.values(assetStates).filter(state => state.error).length;

    return {
      total,
      loaded,
      errors,
      isComplete: loaded + errors === total,
      hasErrors: errors > 0
    };
  }, [assetStates]);

  // Render fallback if no asset set available
  if (!assetSet) {
    return (
      <div
        className={`inline-flex items-center justify-center bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border border-yellow-500/30 rounded ${className}`}
        style={{ width: cellSize, height: cellSize }}
      >
        <div className="text-xs text-yellow-400 font-mono">
          {systemType.replace('_', ' ')}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative inline-block ${className}`}
      style={totalSize}
      title={`${systemType} Multi-Layer Sun (${assetSet.gridSize}x${assetSet.gridSize})`}
    >
      {/* ADDITION: Primary glow effect background */}
      <div
        className="absolute inset-0 bg-gradient-radial from-yellow-400/25 via-orange-400/15 to-transparent blur-lg scale-125 -z-10"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(251, 191, 36, 0.25) 0%, rgba(251, 146, 60, 0.15) 40%, transparent 70%)'
        }}
      />

      {/* ADDITION: Secondary glow layer for more depth */}
      <div
        className="absolute inset-0 bg-gradient-radial from-white/10 via-yellow-300/20 to-transparent blur-sm scale-110 -z-10"
      />
      {/* Loading overlay */}
      {showLoading && !loadingStats.isComplete && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10 rounded">
          <div className="text-xs text-white font-mono text-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto mb-1"></div>
            <div>Loading {loadingStats.loaded}/{loadingStats.total}</div>
          </div>
        </div>
      )}

      {/* Debug info */}
      {debug && (
        <div className="absolute -top-8 left-0 text-xs font-mono text-gray-400 z-20">
          {assetSet.pattern} | {loadingStats.loaded}✓ {loadingStats.errors}✗
        </div>
      )}

      {/* Grid container */}
      <div
        className={`grid gap-0 ${debug ? 'border border-red-500/50' : ''}`}
        style={{
          gridTemplateColumns: `repeat(${assetSet.gridSize}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${assetSet.gridSize}, ${cellSize}px)`
        }}
      >
        {gridMappings.map((mapping) => {
          const key = `${mapping.row}-${mapping.col}`;
          const state = assetStates[key];

          return (
            <div
              key={key}
              className={`relative ${debug ? 'border border-blue-500/30' : ''} transition-all duration-200 hover:brightness-110`}
              style={{ width: cellSize, height: cellSize }}
            >
              {/* Asset image */}
              {state?.loaded && (
                <img
                  src={state.url}
                  alt={`${alt} - ${mapping.position}`}
                  className="w-full h-full object-cover"
                  style={{ imageRendering: 'pixelated' }}
                  loading="lazy"
                />
              )}

              {/* Error state */}
              {state?.error && debug && (
                <div className="absolute inset-0 bg-red-900/30 flex items-center justify-center">
                  <div className="text-xs text-red-400 font-mono transform rotate-45">
                    ✗
                  </div>
                </div>
              )}

              {/* Debug overlay */}
              {debug && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-xs font-mono text-white bg-black/50 px-1 rounded">
                    {mapping.row},{mapping.col}
                  </div>
                </div>
              )}

              {/* Asset ID tooltip for debug */}
              {debug && (
                <div className="absolute -bottom-4 left-0 text-xs font-mono text-gray-500">
                  {state?.assetId}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Statistics for debug */}
      {debug && (
        <div className="absolute -bottom-12 left-0 text-xs font-mono text-gray-400">
          Grid: {assetSet.gridSize}x{assetSet.gridSize} |
          Cell: {cellSize}px |
          Base: {assetSet.baseId}
        </div>
      )}
    </div>
  );
}

/**
 * Helper component for common sun sizes
 */
export const SmallMultiLayerSun = (props: Omit<MultiLayerSunProps, 'cellSize'>) => (
  <MultiLayerSun {...props} cellSize={16} />
);

export const MediumMultiLayerSun = (props: Omit<MultiLayerSunProps, 'cellSize'>) => (
  <MultiLayerSun {...props} cellSize={24} />
);

export const LargeMultiLayerSun = (props: Omit<MultiLayerSunProps, 'cellSize'>) => (
  <MultiLayerSun {...props} cellSize={32} />
);

export const DebugMultiLayerSun = (props: Omit<MultiLayerSunProps, 'debug'>) => (
  <MultiLayerSun {...props} debug={true} />
);

// Also export binary variants
export const SmallBinaryMultiLayerSun = (props: Omit<BinaryMultiLayerSunProps, 'cellSize'>) => (
  <BinaryMultiLayerSun {...props} cellSize={16} />
);

export const MediumBinaryMultiLayerSun = (props: Omit<BinaryMultiLayerSunProps, 'cellSize'>) => (
  <BinaryMultiLayerSun {...props} cellSize={24} />
);

export const LargeBinaryMultiLayerSun = (props: Omit<BinaryMultiLayerSunProps, 'cellSize'>) => (
  <BinaryMultiLayerSun {...props} cellSize={32} />
);

// Export binary component for external use
export { BinaryMultiLayerSun };