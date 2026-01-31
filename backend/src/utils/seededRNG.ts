/**
 * Seeded Random Number Generator (SRNG) Utility
 *
 * Provides deterministic pseudo-random number generation using Linear Congruential Generator (LCG).
 * The same seed will always produce the exact same sequence of random numbers,
 * which is essential for reproducible galaxy generation.
 *
 * Based on the Park and Miller LCG algorithm with Schrage's method for overflow prevention.
 */

/**
 * Seeded Random Number Generator class
 * Uses Linear Congruential Generator (LCG) for deterministic random generation
 */
export class SeededRNG {
  private seed: number;
  private currentState: number;

  // LCG parameters (Park and Miller implementation)
  private static readonly MULTIPLIER = 16807;      // 7^5
  private static readonly MODULUS = 2147483647;    // 2^31 - 1 (Mersenne prime)
  private static readonly QUOTIENT = 127773;       // m div a
  private static readonly REMAINDER = 2836;        // m mod a

  /**
   * Create a new seeded random number generator
   * @param seedString - String to use as seed (will be converted to number)
   */
  constructor(seedString: string) {
    this.seed = this.hashString(seedString);
    this.currentState = this.seed;
  }

  /**
   * Convert string to seed number using simple hash function
   * @param str - Input string
   * @returns Hashed number suitable for seeding
   */
  private hashString(str: string): number {
    let hash = 0;

    if (str.length === 0) {
      return hash;
    }

    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    // Ensure positive number within LCG modulus range
    hash = Math.abs(hash) % (SeededRNG.MODULUS - 1);
    return Math.max(1, hash); // Ensure seed is never 0
  }

  /**
   * Generate next random number in sequence (0.0 to 1.0 exclusive)
   * Uses Schrage's method to avoid integer overflow
   * @returns Random float between 0.0 and 1.0
   */
  public next(): number {
    const hi = Math.floor(this.currentState / SeededRNG.QUOTIENT);
    const lo = this.currentState % SeededRNG.QUOTIENT;

    this.currentState = SeededRNG.MULTIPLIER * lo - SeededRNG.REMAINDER * hi;

    if (this.currentState <= 0) {
      this.currentState += SeededRNG.MODULUS;
    }

    return this.currentState / SeededRNG.MODULUS;
  }

  /**
   * Generate random integer between min (inclusive) and max (inclusive)
   * @param min - Minimum value (inclusive)
   * @param max - Maximum value (inclusive)
   * @returns Random integer in range [min, max]
   */
  public nextInt(min: number, max: number): number {
    if (min > max) {
      throw new Error(`Invalid range: min (${min}) cannot be greater than max (${max})`);
    }

    if (min === max) {
      return min;
    }

    const range = max - min + 1;
    return Math.floor(this.next() * range) + min;
  }

  /**
   * Generate random float between min (inclusive) and max (exclusive)
   * @param min - Minimum value (inclusive)
   * @param max - Maximum value (exclusive)
   * @returns Random float in range [min, max)
   */
  public nextFloat(min: number = 0, max: number = 1): number {
    if (min >= max) {
      throw new Error(`Invalid range: min (${min}) must be less than max (${max})`);
    }

    return this.next() * (max - min) + min;
  }

  /**
   * Choose random element from array
   * @param array - Array to choose from
   * @returns Random element from array, or undefined if array is empty
   */
  public choice<T>(array: T[]): T | undefined {
    if (array.length === 0) {
      return undefined;
    }

    const index = this.nextInt(0, array.length - 1);
    return array[index];
  }

  /**
   * Shuffle array in place using Fisher-Yates algorithm
   * @param array - Array to shuffle (modified in place)
   * @returns The same array reference (for chaining)
   */
  public shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i);
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  /**
   * Generate random boolean with specified probability
   * @param probability - Probability of true (0.0 to 1.0)
   * @returns Random boolean
   */
  public nextBoolean(probability: number = 0.5): boolean {
    if (probability < 0 || probability > 1) {
      throw new Error(`Probability must be between 0 and 1, got ${probability}`);
    }

    return this.next() < probability;
  }

  /**
   * Generate random element from weighted array
   * Each element has a weight that affects its selection probability
   * @param items - Array of items with weights
   * @returns Random weighted element, or undefined if array is empty
   */
  public weightedChoice<T>(items: Array<{ item: T; weight: number }>): T | undefined {
    if (items.length === 0) {
      return undefined;
    }

    // Calculate total weight
    const totalWeight = items.reduce((sum, item) => sum + Math.max(0, item.weight), 0);

    if (totalWeight === 0) {
      // If all weights are 0, choose uniformly
      return this.choice(items.map(item => item.item));
    }

    // Generate random number in [0, totalWeight)
    const randomWeight = this.nextFloat(0, totalWeight);

    // Find the item corresponding to this weight
    let currentWeight = 0;
    for (const item of items) {
      currentWeight += Math.max(0, item.weight);
      if (randomWeight < currentWeight) {
        return item.item;
      }
    }

    // Fallback (should not happen with proper implementation)
    return items[items.length - 1].item;
  }

  /**
   * Generate random point in 2D circle (uniform distribution)
   * @param centerX - Circle center X coordinate
   * @param centerY - Circle center Y coordinate
   * @param radius - Circle radius
   * @returns Random point within circle
   */
  public randomPointInCircle(centerX: number, centerY: number, radius: number): { x: number; y: number } {
    // Use rejection sampling for uniform distribution in circle
    let x: number, y: number;
    do {
      x = this.nextFloat(-radius, radius);
      y = this.nextFloat(-radius, radius);
    } while (x * x + y * y > radius * radius);

    return {
      x: centerX + x,
      y: centerY + y
    };
  }

  /**
   * Generate random point on 2D circle circumference
   * @param centerX - Circle center X coordinate
   * @param centerY - Circle center Y coordinate
   * @param radius - Circle radius
   * @returns Random point on circle edge
   */
  public randomPointOnCircle(centerX: number, centerY: number, radius: number): { x: number; y: number } {
    const angle = this.nextFloat(0, 2 * Math.PI);
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle)
    };
  }

  /**
   * Reset RNG to initial seed state
   * Useful for reproducing the same sequence from the beginning
   */
  public reset(): void {
    this.currentState = this.seed;
  }

  /**
   * Get current seed value
   * @returns The seed used to initialize this RNG
   */
  public getSeed(): number {
    return this.seed;
  }

  /**
   * Get current state (for debugging/testing purposes)
   * @returns Current internal state
   */
  public getCurrentState(): number {
    return this.currentState;
  }

  /**
   * Create a copy of this RNG with the same current state
   * Useful for branching random sequences
   * @returns New SeededRNG instance with same state
   */
  public clone(): SeededRNG {
    const clone = new SeededRNG('temp'); // Temporary seed, will be overwritten
    clone.seed = this.seed;
    clone.currentState = this.currentState;
    return clone;
  }
}

/**
 * Utility function to create SeededRNG from string seed
 * @param seed - String seed
 * @returns New SeededRNG instance
 */
export function createSeededRNG(seed: string): SeededRNG {
  return new SeededRNG(seed);
}

/**
 * Generate deterministic UUID-like string from seed
 * Useful for generating consistent IDs in deterministic systems
 * @param rng - SeededRNG instance
 * @returns UUID-like string (not cryptographically secure)
 */
export function generateDeterministicId(rng: SeededRNG): string {
  const chars = '0123456789abcdef';
  let result = '';

  for (let i = 0; i < 32; i++) {
    result += chars[rng.nextInt(0, 15)];
    if (i === 7 || i === 11 || i === 15 || i === 19) {
      result += '-';
    }
  }

  return result;
}

/**
 * Test function to verify RNG determinism
 * Generates the same sequence twice and compares results
 * @param seed - Test seed string
 * @param sampleSize - Number of samples to test
 * @returns True if both sequences are identical
 */
export function testRNGDeterminism(seed: string, sampleSize: number = 100): boolean {
  const rng1 = new SeededRNG(seed);
  const rng2 = new SeededRNG(seed);

  for (let i = 0; i < sampleSize; i++) {
    const val1 = rng1.next();
    const val2 = rng2.next();

    if (Math.abs(val1 - val2) > 1e-15) { // Account for floating point precision
      return false;
    }
  }

  return true;
}