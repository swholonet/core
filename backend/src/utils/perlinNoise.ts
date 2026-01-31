/**
 * Perlin Noise Generator for Nebula Field Generation
 *
 * Provides deterministic 2D Perlin noise generation using a seeded pseudo-random
 * number generator. Supports multi-octave noise for complex, natural patterns
 * suitable for nebula field visualization in the strategic galaxy map.
 */

export class PerlinNoise {
  private seed: number;
  private permutation: number[];
  private gradients: [number, number][];

  // Standard Perlin noise gradient vectors for 2D
  private static readonly GRADIENT_VECTORS: [number, number][] = [
    [1, 1], [-1, 1], [1, -1], [-1, -1],
    [1, 0], [-1, 0], [0, 1], [0, -1]
  ];

  constructor(seed: string) {
    this.seed = this.hashString(seed);
    this.permutation = this.generatePermutation();
    this.gradients = this.generateGradients();
  }

  /**
   * Hash a string into a numeric seed
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Generate permutation table based on seed
   */
  private generatePermutation(): number[] {
    // Create array 0-255
    const p = Array.from({ length: 256 }, (_, i) => i);

    // Seed-based random number generator
    let seedState = this.seed;
    const seededRandom = () => {
      seedState = (seedState * 9301 + 49297) % 233280;
      return seedState / 233280;
    };

    // Fisher-Yates shuffle with seeded random
    for (let i = p.length - 1; i > 0; i--) {
      const j = Math.floor(seededRandom() * (i + 1));
      [p[i], p[j]] = [p[j], p[i]];
    }

    // Duplicate the permutation table for easy lookup
    return [...p, ...p];
  }

  /**
   * Generate gradient vectors based on permutation
   */
  private generateGradients(): [number, number][] {
    const gradients: [number, number][] = [];
    for (let i = 0; i < 512; i++) {
      const index = this.permutation[i % 256] % PerlinNoise.GRADIENT_VECTORS.length;
      gradients[i] = PerlinNoise.GRADIENT_VECTORS[index];
    }
    return gradients;
  }

  /**
   * Smooth interpolation function (6t^5 - 15t^4 + 10t^3)
   */
  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  /**
   * Linear interpolation
   */
  private lerp(a: number, b: number, t: number): number {
    return a + t * (b - a);
  }

  /**
   * Calculate dot product of gradient and distance vectors
   */
  private dotProduct(gradient: [number, number], x: number, y: number): number {
    return gradient[0] * x + gradient[1] * y;
  }

  /**
   * Generate 2D Perlin noise value at given coordinates
   * Returns value in range [-1, 1]
   */
  public noise2D(x: number, y: number): number {
    // Find unit square containing point
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;

    // Find relative x,y of point in square
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);

    // Compute fade curves for x,y
    const u = this.fade(xf);
    const v = this.fade(yf);

    // Get gradient indices for square corners
    const aa = this.permutation[X + this.permutation[Y]];
    const ab = this.permutation[X + this.permutation[Y + 1]];
    const ba = this.permutation[X + 1 + this.permutation[Y]];
    const bb = this.permutation[X + 1 + this.permutation[Y + 1]];

    // Calculate dot products for each corner
    const gradAA = this.gradients[aa];
    const gradAB = this.gradients[ab];
    const gradBA = this.gradients[ba];
    const gradBB = this.gradients[bb];

    const dotAA = this.dotProduct(gradAA, xf, yf);
    const dotAB = this.dotProduct(gradAB, xf, yf - 1);
    const dotBA = this.dotProduct(gradBA, xf - 1, yf);
    const dotBB = this.dotProduct(gradBB, xf - 1, yf - 1);

    // Interpolate results
    const x1 = this.lerp(dotAA, dotBA, u);
    const x2 = this.lerp(dotAB, dotBB, u);
    const result = this.lerp(x1, x2, v);

    return result;
  }

  /**
   * Generate multi-octave Perlin noise for more complex patterns
   *
   * @param x X coordinate
   * @param y Y coordinate
   * @param octaves Number of octaves (detail levels)
   * @param persistence How much each octave contributes (0.0-1.0)
   * @returns Noise value in range [-1, 1]
   */
  public octaveNoise2D(
    x: number,
    y: number,
    octaves: number = 4,
    persistence: number = 0.5
  ): number {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0; // Used for normalizing result

    for (let i = 0; i < octaves; i++) {
      total += this.noise2D(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= 2;
    }

    return total / maxValue;
  }

  /**
   * Generate fractal noise with custom lacunarity (frequency multiplier)
   */
  public fractalNoise2D(
    x: number,
    y: number,
    octaves: number = 4,
    persistence: number = 0.5,
    lacunarity: number = 2.0
  ): number {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      total += this.noise2D(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }

    return total / maxValue;
  }

  /**
   * Generate turbulence (absolute value noise) for different effects
   */
  public turbulence2D(
    x: number,
    y: number,
    octaves: number = 4,
    persistence: number = 0.5
  ): number {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      total += Math.abs(this.noise2D(x * frequency, y * frequency)) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= 2;
    }

    return total / maxValue;
  }

  /**
   * Get the seed used for this noise generator
   */
  public getSeed(): number {
    return this.seed;
  }

  /**
   * Static method to generate a quick noise value without creating an instance
   */
  public static quickNoise(seed: string, x: number, y: number): number {
    const noise = new PerlinNoise(seed);
    return noise.noise2D(x, y);
  }
}