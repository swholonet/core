import { useState, useEffect } from 'react';
import { isBinarySystem } from '../config/systemAssets';
import { AssetErrorBoundary, AssetFallback } from './AssetErrorBoundary';

interface SunImageProps {
  systemType: string; // SystemType enum value (e.g., "SYS_1049" or "BIN_1001")
  visualSeed?: number;
  alt?: string;
  className?: string;
  size?: number;
}

const ASSET_BASE_URL = import.meta.env.VITE_ASSET_BASE_URL || 'https://swuniverse.github.io/assets/';

/**
 * Generate fallback sun image (neutral gray circle SVG)
 */
const getFallbackImage = (isBinary: boolean): string => {
  const color = isBinary 
    ? { inner: '#8B5CF6', outer: '#6D28D9' } // Purple for binary
    : { inner: '#6B7280', outer: '#4B5563' }; // Gray for single stars

  return 'data:image/svg+xml,' + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <defs>
        <radialGradient id="sunGradient" cx="35%" cy="35%">
          <stop offset="0%" style="stop-color:${color.inner};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${color.outer};stop-opacity:1" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="45" fill="url(#sunGradient)"/>
    </svg>
  `);
};

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

/**
 * Get sun image URL from STU asset repository
 * Uses systemAssets config for accurate mapping
 */
const getSunImageUrl = (systemType: string): string => {
  const systemTypeId = getSystemTypeId(systemType);
  
  // All systemtypes (1001-1075) use their ID as galaxy icon
  return `${ASSET_BASE_URL}map/systemtypes/${systemTypeId}.png`;
};

/**
 * SunImage component with automatic fallback handling
 * Loads sun/star images from the asset repository dynamically
 * Supports all systemtypes (1049-1075 single stars + 1001-1048 binary systems)
 */
export default function SunImage({
  systemType,
  visualSeed = 1,
  alt = 'Stern',
  className = '',
  size = 24
}: SunImageProps) {
  const [imageSrc, setImageSrc] = useState<string>(getSunImageUrl(systemType));
  const [imageError, setImageError] = useState(false);
  const systemTypeId = getSystemTypeId(systemType);
  const binary = isBinarySystem(systemTypeId);

  useEffect(() => {
    // Reset error state when props change
    setImageError(false);
    setImageSrc(getSunImageUrl(systemType));
  }, [systemType, visualSeed]);

  const handleImageError = () => {
    if (!imageError) {
      console.warn(`Failed to load sun image: ${imageSrc}, using fallback`);
      setImageError(true);
      setImageSrc(getFallbackImage(binary));
    }
  };

  const handleImageLoad = () => {
    if (!imageError) {
      console.debug(`Successfully loaded sun image: ${imageSrc}`);
    }
  };

  return (
    <AssetErrorBoundary
      errorMessage="Star asset failed to load"
      showDetails={import.meta.env.DEV}
      fallback={<AssetFallback width={size} height={size} text="⭐" />}
    >
      <img
        src={imageSrc}
        alt={alt}
        className={`${className} ${imageError ? 'opacity-70' : ''}`}
        style={{ width: size, height: size }}
        onError={handleImageError}
        onLoad={handleImageLoad}
        loading="lazy"
      />
    </AssetErrorBoundary>
  );
}

/**
 * Get STU system type display name (German)
 */
export const getSystemTypeLabel = (systemType: string): string => {
  const labels: Record<string, string> = {
    SMALL_BLUE: 'Blauer Zwerg',               // (1057) - small blue dwarf star
    SMALL_YELLOW: 'Gelber Zwerg',             // (1058) - yellow dwarf like our Sun
    MEDIUM_BLUE: 'Mittlerer Blauer Stern',   // (1041) - bright main sequence
    BLUE_GIANT: 'Orange Riese',              // (1004) - orange giant star
    RED_DWARF: 'Roter Riese',                // (1052) - red giant star
    NEUTRON_STAR: 'Neutronenstern',          // (1070) - ultra-dense stellar remnant
    BLACK_HOLE: 'Schwarzes Loch',            // (1062) - gravitational anomaly
    BINARY_SYSTEM: 'Gelber Überriese',       // (1054) - yellow supergiant system
  };

  return labels[systemType] || systemType;
};
