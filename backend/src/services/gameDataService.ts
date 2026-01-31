import redis from '../lib/redis';
import prisma from '../lib/prisma';
import { ModuleCategory } from '@prisma/client';
import {
  CombatRating,
  calculateCombatRating,
  ModuleBaseStats,
  ModuleBaseStatsPublic,
  VisibilityLevel,
} from '../types/blueprint.types';

// =====================================================
// Game Data Service - Secret Data Management
// =====================================================
// This service manages the separation of public and secret game data.
// Combat values (damage, shield strength) are NEVER exposed to clients.
// All combat calculations happen server-side only.
// =====================================================

// Types for module data stored in cache/database
interface SecretModuleData {
  id: number;
  baseDamage: number;
  baseShieldStrength: number;
  tibannaConsumption: number;
}

interface PublicModuleData {
  id: number;
  name: string;
  description: string;
  category: ModuleCategory;
  maxLevel: number;
  visibilityLevel: VisibilityLevel;
  requiredPlayerLevel: number;
  requiredResearchId: number | null;
  requiredResearchLevel: number;
  baseHullPoints: number;
  baseSensorRange: number;
  baseCargoCapacity: number;
  baseCrewCapacity: number;
  baseSpeed: number;
  hyperdriveRating: number | null;
  baseCostCredits: number;
  baseCostDurastahl: number;
  baseCostKyberKristalle: number;
  baseCostTibannaGas: number;
  baseCostBeskar: number;
  baseCostKristallinesSilizium: number;
  baseCostEnergiemodule: number;
  baseBuildTime: number;
  combatRating: CombatRating;
}

// Cache keys
const CACHE_KEYS = {
  PUBLIC_MODULES: 'gamedata:modules:public',
  SECRET_MODULES: 'gamedata:modules:secret',
  VERSION: 'gamedata:version',
  COMBAT_FORMULAS: 'gamedata:combat:formulas',
};

// Cache TTL in seconds (1 hour default, can be invalidated manually)
const CACHE_TTL = 3600;

class GameDataService {
  private secretModuleCache: Map<number, SecretModuleData> = new Map();
  private publicModuleCache: Map<number, PublicModuleData> = new Map();
  private isLoaded: boolean = false;

  /**
   * Load all game data from database into memory cache
   * Call this at server startup
   */
  async loadGameData(): Promise<void> {
    console.log('Loading game data...');

    try {
      // Load all modules from database
      const modules = await prisma.moduleType.findMany();

      this.secretModuleCache.clear();
      this.publicModuleCache.clear();

      for (const module of modules) {
        // Store secret data (server-side only)
        this.secretModuleCache.set(module.id, {
          id: module.id,
          baseDamage: module.baseDamage,
          baseShieldStrength: module.baseShieldStrength,
          tibannaConsumption: module.tibannaConsumption,
        });

        // Calculate combat rating from secret values
        const combatRating = calculateCombatRating(
          module.baseDamage,
          module.baseShieldStrength
        );

        // Store public data (safe to send to clients)
        this.publicModuleCache.set(module.id, {
          id: module.id,
          name: module.name,
          description: module.description,
          category: module.category,
          maxLevel: module.maxLevel,
          visibilityLevel: (module.visibilityLevel || 'PUBLIC') as VisibilityLevel,
          requiredPlayerLevel: module.requiredPlayerLevel || 1,
          requiredResearchId: module.requiredResearchId,
          requiredResearchLevel: module.requiredResearchLevel,
          baseHullPoints: module.baseHullPoints,
          baseSensorRange: module.baseSensorRange,
          baseCargoCapacity: module.baseCargoCapacity,
          baseCrewCapacity: module.baseCrewCapacity,
          baseSpeed: module.baseSpeed,
          hyperdriveRating: module.hyperdriveRating,
          baseCostCredits: module.baseCostCredits,
          baseCostDurastahl: module.baseCostDurastahl,
          baseCostKyberKristalle: module.baseCostKyberKristalle,
          baseCostTibannaGas: module.baseCostTibannaGas,
          baseCostBeskar: module.baseCostBeskar,
          baseCostKristallinesSilizium: module.baseCostKristallinesSilizium,
          baseCostEnergiemodule: module.baseCostEnergiemodule,
          baseBuildTime: module.baseBuildTime,
          combatRating,
        });
      }

      // Also store in Redis for distributed access
      await this.cacheToRedis();

      this.isLoaded = true;
      console.log(`Game data loaded: ${modules.length} modules`);
    } catch (error) {
      console.error('Failed to load game data:', error);
      throw error;
    }
  }

  /**
   * Cache public module data to Redis (never cache secret data to Redis)
   */
  private async cacheToRedis(): Promise<void> {
    const publicData = Array.from(this.publicModuleCache.values());
    await redis.setex(
      CACHE_KEYS.PUBLIC_MODULES,
      CACHE_TTL,
      JSON.stringify(publicData)
    );
    await redis.set(CACHE_KEYS.VERSION, Date.now().toString());
  }

  /**
   * Get public module data (safe to send to client)
   */
  getPublicModuleData(moduleId: number): PublicModuleData | null {
    return this.publicModuleCache.get(moduleId) || null;
  }

  /**
   * Get all public modules (safe to send to client)
   */
  getAllPublicModules(): PublicModuleData[] {
    return Array.from(this.publicModuleCache.values());
  }

  /**
   * Get secret module data (SERVER-SIDE ONLY - never expose to client)
   */
  getSecretModuleData(moduleId: number): SecretModuleData | null {
    return this.secretModuleCache.get(moduleId) || null;
  }

  /**
   * Get full module stats including secret data (SERVER-SIDE ONLY)
   * Use this for combat calculations
   */
  getFullModuleStats(moduleId: number): ModuleBaseStats | null {
    const publicData = this.publicModuleCache.get(moduleId);
    const secretData = this.secretModuleCache.get(moduleId);

    if (!publicData || !secretData) return null;

    return {
      hullPoints: publicData.baseHullPoints,
      damage: secretData.baseDamage,
      shieldStrength: secretData.baseShieldStrength,
      sensorRange: publicData.baseSensorRange,
      cargoCapacity: publicData.baseCargoCapacity,
      crewCapacity: publicData.baseCrewCapacity,
      speed: publicData.baseSpeed,
      hyperdriveRating: publicData.hyperdriveRating,
      tibannaConsumption: secretData.tibannaConsumption,
    };
  }

  /**
   * Get public-only module stats (safe to send to client)
   */
  getPublicModuleStats(moduleId: number): ModuleBaseStatsPublic | null {
    const publicData = this.publicModuleCache.get(moduleId);
    if (!publicData) return null;

    return {
      hullPoints: publicData.baseHullPoints,
      sensorRange: publicData.baseSensorRange,
      cargoCapacity: publicData.baseCargoCapacity,
      crewCapacity: publicData.baseCrewCapacity,
      speed: publicData.baseSpeed,
      hyperdriveRating: publicData.hyperdriveRating,
    };
  }

  /**
   * Get combat rating for a module (vague indicator, safe to send to client)
   */
  getModuleCombatRating(moduleId: number): CombatRating {
    const publicData = this.publicModuleCache.get(moduleId);
    return publicData?.combatRating || 'NIEDRIG';
  }

  /**
   * Check if player can access a module based on research and level
   */
  async canPlayerAccessModule(playerId: number, moduleId: number): Promise<boolean> {
    const publicData = this.publicModuleCache.get(moduleId);
    if (!publicData) return false;

    // If module is SECRET visibility, never accessible via API
    if (publicData.visibilityLevel === 'SECRET') return false;

    // Check research requirement
    if (publicData.requiredResearchId) {
      const playerResearch = await prisma.playerResearch.findFirst({
        where: {
          playerId,
          researchTypeId: publicData.requiredResearchId,
          completedAt: { not: null },
        },
        include: {
          researchType: true,
        },
      });

      if (!playerResearch) return false;
      if (playerResearch.researchType.researchLevel < publicData.requiredResearchLevel) {
        return false;
      }
    }

    // TODO: Add player level check when player level system is implemented
    // For now, just check research

    return true;
  }

  /**
   * Refresh game data from database
   * Call this when module data is updated via admin
   */
  async refreshGameData(): Promise<void> {
    console.log('Refreshing game data...');
    await this.loadGameData();
  }

  /**
   * Check if game data is loaded
   */
  isDataLoaded(): boolean {
    return this.isLoaded;
  }

  // =====================================================
  // COMBAT CALCULATION METHODS (SERVER-SIDE ONLY)
  // =====================================================

  /**
   * Calculate damage dealt by a module at a specific level
   * SERVER-SIDE ONLY - never expose to client
   */
  calculateModuleDamage(moduleId: number, level: number, multiplier: number = 1.0): number {
    const secretData = this.secretModuleCache.get(moduleId);
    if (!secretData) return 0;

    const levelMultiplier = 1 + (level - 1) * 0.2; // 20% per level
    return Math.floor(secretData.baseDamage * levelMultiplier * multiplier);
  }

  /**
   * Calculate shield strength of a module at a specific level
   * SERVER-SIDE ONLY - never expose to client
   */
  calculateModuleShieldStrength(moduleId: number, level: number, multiplier: number = 1.0): number {
    const secretData = this.secretModuleCache.get(moduleId);
    if (!secretData) return 0;

    const levelMultiplier = 1 + (level - 1) * 0.2; // 20% per level
    return Math.floor(secretData.baseShieldStrength * levelMultiplier * multiplier);
  }

  /**
   * Calculate total ship combat stats from blueprint modules
   * SERVER-SIDE ONLY - for combat system
   */
  calculateShipCombatStats(
    modules: Array<{ moduleTypeId: number; level: number }>,
    shipClassMultiplier: number = 1.0
  ): { totalDamage: number; totalShieldStrength: number } {
    let totalDamage = 0;
    let totalShieldStrength = 0;

    for (const module of modules) {
      totalDamage += this.calculateModuleDamage(module.moduleTypeId, module.level);
      totalShieldStrength += this.calculateModuleShieldStrength(module.moduleTypeId, module.level);
    }

    return {
      totalDamage: Math.floor(totalDamage * shipClassMultiplier),
      totalShieldStrength: Math.floor(totalShieldStrength * shipClassMultiplier),
    };
  }

  /**
   * Calculate combat rating for a full ship/blueprint
   */
  calculateShipCombatRating(
    modules: Array<{ moduleTypeId: number; level: number }>
  ): CombatRating {
    const { totalDamage, totalShieldStrength } = this.calculateShipCombatStats(modules);
    return calculateCombatRating(totalDamage, totalShieldStrength);
  }
}

// Singleton instance
export const gameDataService = new GameDataService();
