import { useState, useEffect } from 'react';

interface SunImageProps {
  systemType: 'SINGLE_STAR' | 'BINARY_STAR' | 'NEUTRON_STAR' | 'BLACK_HOLE';
  visualSeed?: number;
  alt?: string;
  className?: string;
  size?: number;
}

const ASSET_BASE_URL = import.meta.env.VITE_ASSET_BASE_URL || 'https://swholonet.github.io/assets';

/**
 * Generate fallback sun image (yellow/orange circle SVG)
 */
const getFallbackImage = (systemType: string): string => {
  const colors = {
    'SINGLE_STAR': { inner: '#FFD700', outer: '#FFA500' },
    'BINARY_STAR': { inner: '#FFA500', outer: '#FF6600' },
    'NEUTRON_STAR': { inner: '#00FFFF', outer: '#0088AA' },
    'BLACK_HOLE': { inner: '#4B0082', outer: '#1A0033' },
  };

  const color = colors[systemType as keyof typeof colors] || colors['SINGLE_STAR'];

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
 * Get sun image URL from asset repository
 * @param systemType - Type of the star system
 * @param visualSeed - Visual variation seed (default: 1)
 */
const getSunImageUrl = (systemType: string, visualSeed: number = 1): string => {
  // Map system type to asset name
  const typeMapping: Record<string, string> = {
    'SINGLE_STAR': 'sun',
    'BINARY_STAR': 'sun',
    'NEUTRON_STAR': 'neutron',
    'BLACK_HOLE': 'blackhole',
  };

  const mappedType = typeMapping[systemType] || 'sun';

  return `${ASSET_BASE_URL}/planets/${mappedType}_${visualSeed}.png`;
};

/**
 * SunImage component with automatic fallback handling
 * Loads sun/star images from the asset repository dynamically
 */
export default function SunImage({
  systemType,
  visualSeed = 1,
  alt = 'Stern',
  className = '',
  size = 24
}: SunImageProps) {
  const [imageSrc, setImageSrc] = useState<string>(getSunImageUrl(systemType, visualSeed));
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    // Reset error state when props change
    setImageError(false);
    setImageSrc(getSunImageUrl(systemType, visualSeed));
  }, [systemType, visualSeed]);

  const handleImageError = () => {
    console.warn(`Failed to load sun image: ${imageSrc}, using fallback`);
    setImageError(true);
    setImageSrc(getFallbackImage(systemType));
  };

  const handleImageLoad = () => {
    if (!imageError) {
      console.debug(`Successfully loaded sun image: ${imageSrc}`);
    }
  };

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={`${className} ${imageError ? 'opacity-70' : ''}`}
      style={{ width: size, height: size }}
      onError={handleImageError}
      onLoad={handleImageLoad}
      loading="lazy"
    />
  );
}

/**
 * Get system type display name (German)
 */
export const getSystemTypeLabel = (systemType: string): string => {
  const labels: Record<string, string> = {
    SINGLE_STAR: 'Einzelstern',
    BINARY_STAR: 'Doppelstern',
    NEUTRON_STAR: 'Neutronenstern',
    BLACK_HOLE: 'Schwarzes Loch',
  };

  return labels[systemType] || systemType;
};
