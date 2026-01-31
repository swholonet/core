import { useState, useEffect, memo } from 'react';

interface GridCellStarmapProps {
  gridX: number;      // Grid cell X coordinate (1-30)
  gridY: number;      // Grid cell Y coordinate (1-30)
  sectorX: number;    // System sector X
  sectorY: number;    // System sector Y
  fieldX: number;     // System field X
  fieldY: number;     // System field Y
  className?: string;
}

const ASSET_BASE_URL = import.meta.env.VITE_ASSET_BASE_URL || 'https://swuniverse.github.io/assets/';

/**
 * Generate deterministic starmap asset ID based on grid coordinates + system coordinates
 * Uses prime number multipliers for good distribution across all 900 available assets
 */
const getGridCellStarmapId = (
  gridX: number,
  gridY: number,
  sectorX: number,
  sectorY: number,
  fieldX: number,
  fieldY: number
): string => {
  // Use different prime multipliers to ensure each grid cell gets unique backgrounds
  const seed = (gridX * 7) + (gridY * 11) + (sectorX * 13) + (sectorY * 17) + (fieldX * 19) + (fieldY * 23);

  // Map to 1-30 range for both row and column
  const row = (Math.abs(seed) % 30) + 1;
  const col = (Math.abs(seed * 31) % 30) + 1;  // Use different multiplier for column

  const assetId = `${row.toString().padStart(2, '0')}${col.toString().padStart(2, '0')}`;
  return assetId;
};

/**
 * Get starmap image URL for specific grid cell
 */
const getGridCellStarmapUrl = (
  gridX: number,
  gridY: number,
  sectorX: number,
  sectorY: number,
  fieldX: number,
  fieldY: number
): string => {
  const assetId = getGridCellStarmapId(gridX, gridY, sectorX, sectorY, fieldX, fieldY);
  return `${ASSET_BASE_URL}map/starmap/${assetId}.png`;
};

/**
 * Individual grid cell starmap background component
 * Displays unique starmap backgrounds for each cell position within a system grid
 * Optimized with React.memo for performance with large grids (up to 900 cells)
 */
function GridCellStarmap({
  gridX,
  gridY,
  sectorX,
  sectorY,
  fieldX,
  fieldY,
  className = ''
}: GridCellStarmapProps) {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Reset states and set image URL
    setImageError(false);
    setIsLoading(true);
    const imageUrl = getGridCellStarmapUrl(gridX, gridY, sectorX, sectorY, fieldX, fieldY);
    setImageSrc(imageUrl);
  }, [gridX, gridY, sectorX, sectorY, fieldX, fieldY]);

  const handleImageError = () => {
    // Fallback silently - no console spam for 900 potential cells
    setImageError(true);
    setIsLoading(false);
  };

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  // Show subtle CSS starfield fallback if image failed to load
  if (imageError || !imageSrc) {
    return (
      <div
        className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
        style={{
          backgroundImage: `
            radial-gradient(0.5px 0.5px at 20% 30%, rgba(255,255,255,0.2) 0%, transparent 100%),
            radial-gradient(0.5px 0.5px at 60% 20%, rgba(255,255,255,0.15) 0%, transparent 100%),
            radial-gradient(0.5px 0.5px at 80% 70%, rgba(255,255,255,0.2) 0%, transparent 100%),
            radial-gradient(0.5px 0.5px at 40% 80%, rgba(255,255,255,0.1) 0%, transparent 100%)
          `,
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat'
        }}
      />
    );
  }

  return (
    <>
      {/* Loading placeholder - minimal for performance with many cells */}
      {isLoading && (
        <div className={`absolute inset-0 w-full h-full pointer-events-none ${className} bg-slate-900/10`} />
      )}

      {/* Starmap image */}
      <img
        src={imageSrc}
        alt=""
        className={`absolute inset-0 w-full h-full object-cover pointer-events-none transition-opacity duration-200 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        } ${className}`}
        onError={handleImageError}
        onLoad={handleImageLoad}
        loading="lazy"
      />
    </>
  );
}

/**
 * Memoized GridCellStarmap component for optimal performance with large grids
 * Only re-renders if grid coordinates or system coordinates change
 */
export default memo(GridCellStarmap);