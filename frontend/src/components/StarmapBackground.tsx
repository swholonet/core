import { useState, useEffect } from 'react';

interface StarmapBackgroundProps {
  sectorX: number;
  sectorY: number;
  fieldX: number;
  fieldY: number;
  className?: string;
}

const ASSET_BASE_URL = import.meta.env.VITE_ASSET_BASE_URL || 'https://swuniverse.github.io/assets/';

/**
 * Generate all available starmap asset IDs
 * Pattern: 0101-3030 (RRCC where RR=01-30, CC=01-30, total 900 assets)
 */
const generateStarmapAssets = (): string[] => {
  const assets: string[] = [];
  for (let row = 1; row <= 30; row++) {
    for (let col = 1; col <= 30; col++) {
      const assetId = `${row.toString().padStart(2, '0')}${col.toString().padStart(2, '0')}`;
      assets.push(assetId);
    }
  }
  return assets;
};

const STARMAP_ASSETS = generateStarmapAssets();

/**
 * Generate deterministic random starmap asset ID based on coordinates
 * Uses prime number multipliers to ensure good distribution
 */
const getStarmapId = (sectorX: number, sectorY: number, fieldX: number, fieldY: number): string => {
  const seed = (sectorX * 13) + (sectorY * 17) + (fieldX * 19) + (fieldY * 23);
  const assetIndex = Math.abs(seed) % STARMAP_ASSETS.length;
  const starmapId = STARMAP_ASSETS[assetIndex];
  return starmapId;
};

/**
 * Get starmap image URL from STU asset repository
 */
const getStarmapImageUrl = (sectorX: number, sectorY: number, fieldX: number, fieldY: number): string => {
  const assetId = getStarmapId(sectorX, sectorY, fieldX, fieldY);
  return `${ASSET_BASE_URL}map/starmap/${assetId}.png`;
};

/**
 * StarmapBackground component for Galaxy Map empty fields
 * Displays random starmap backgrounds from STU assets with full opacity
 */
export default function StarmapBackground({
  sectorX,
  sectorY,
  fieldX,
  fieldY,
  className = ''
}: StarmapBackgroundProps) {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Reset states and set image URL
    setImageError(false);
    setIsLoading(true);
    const imageUrl = getStarmapImageUrl(sectorX, sectorY, fieldX, fieldY);
    setImageSrc(imageUrl);
  }, [sectorX, sectorY, fieldX, fieldY]);

  const handleImageError = () => {
    console.warn(`Failed to load starmap image: ${imageSrc}, falling back to CSS starfield`);
    setImageError(true);
    setIsLoading(false);
  };

  const handleImageLoad = () => {
    setIsLoading(false);
    if (!imageError) {
      console.debug(`Successfully loaded starmap image: ${imageSrc}`);
    }
  };

  // Show CSS starfield fallback if image failed to load
  if (imageError || !imageSrc) {
    return (
      <div
        className={`absolute inset-0 w-full h-full pointer-events-none z-0 ${className}`}
        style={{
          backgroundImage: `
            radial-gradient(1px 1px at 15% 25%, rgba(255,255,255,0.4) 0%, transparent 100%),
            radial-gradient(1px 1px at 35% 15%, rgba(255,255,255,0.3) 0%, transparent 100%),
            radial-gradient(1px 1px at 55% 65%, rgba(255,255,255,0.4) 0%, transparent 100%),
            radial-gradient(1px 1px at 75% 35%, rgba(255,255,255,0.5) 0%, transparent 100%),
            radial-gradient(1px 1px at 85% 75%, rgba(255,255,255,0.3) 0%, transparent 100%),
            radial-gradient(1px 1px at 25% 85%, rgba(255,255,255,0.4) 0%, transparent 100%),
            radial-gradient(1px 1px at 65% 15%, rgba(255,255,255,0.5) 0%, transparent 100%),
            radial-gradient(1px 1px at 95% 55%, rgba(255,255,255,0.3) 0%, transparent 100%)
          `,
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat'
        }}
      />
    );
  }

  return (
    <>
      {/* Loading placeholder - subtle animated background */}
      {isLoading && (
        <div className={`absolute inset-0 w-full h-full pointer-events-none z-0 ${className} bg-gradient-to-br from-slate-900/20 to-cyan-900/10 animate-pulse`} />
      )}

      {/* Starmap image */}
      <img
        src={imageSrc}
        alt=""
        className={`absolute inset-0 w-full h-full object-cover pointer-events-none z-0 transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'} ${className}`}
        onError={handleImageError}
        onLoad={handleImageLoad}
        loading="lazy"
      />
    </>
  );
}