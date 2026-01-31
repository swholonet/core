import prisma from '../lib/prisma';
import { blueprintService } from './blueprintService';

/**
 * Service for managing blueprint stats calculation and cache refresh
 * Note: This service handles INTERNAL stats (including secret combat values)
 * for database caching. These values should NEVER be sent to clients.
 */
export class BlueprintStatsService {
  /**
   * Recalculates and updates cached stats for a single blueprint
   * Uses internal stats method to include combat values for DB storage
   */
  async refreshBlueprintStats(blueprintId: number): Promise<void> {
    const blueprint = await prisma.shipBlueprint.findUnique({
      where: { id: blueprintId },
      include: {
        modules: {
          include: {
            moduleType: true,
          },
        },
      },
    });

    if (!blueprint) {
      throw new Error(`Blueprint ${blueprintId} not found`);
    }

    const modulesWithTypes = blueprint.modules.map((m) => ({
      level: m.level,
      moduleType: m.moduleType,
    }));

    // Recalculate INTERNAL stats (inkl. geheime Kampfwerte) und Kosten
    const statsInternal = blueprintService.calculateBlueprintStatsInternal(modulesWithTypes, blueprint.shipClass);
    const costs = blueprintService.calculateConstructionCosts(modulesWithTypes, blueprint.shipClass);

    // Update cached values in database (inkl. geheime Werte)
    await prisma.shipBlueprint.update({
      where: { id: blueprintId },
      data: {
        // Update cached stats (inkl. SECRET values)
        totalHullPoints: statsInternal.hullPoints,
        totalShieldStrength: statsInternal.shieldStrength,
        totalDamage: statsInternal.damage,
        totalSpeed: statsInternal.speed,
        totalSensorRange: statsInternal.sensorRange,
        totalCargoCapacity: statsInternal.cargoCapacity,
        totalCrewRequired: statsInternal.crewRequired,
        hyperdriveRating: statsInternal.hyperdriveRating,
        // Update cached costs
        totalCostCredits: costs.credits,
        totalCostDurastahl: costs.durastahl,
        totalCostKyberKristalle: costs.kyberKristalle,
        totalCostTibannaGas: costs.tibannaGas,
        totalCostBeskar: costs.beskar,
        totalCostKristallinesSilizium: costs.kristallinesSilizium,
        totalCostEnergiemodule: costs.energiemodule,
        totalBuildTime: costs.buildTimeMinutes,
      },
    });
  }

  /**
   * Recalculates and updates cached stats for all blueprints
   */
  async refreshAllBlueprintStats(): Promise<{ updated: number; errors: string[] }> {
    const blueprints = await prisma.shipBlueprint.findMany({
      select: { id: true, name: true },
    });

    let updated = 0;
    const errors: string[] = [];

    for (const blueprint of blueprints) {
      try {
        await this.refreshBlueprintStats(blueprint.id);
        updated++;
        console.log(`✓ Refreshed stats for blueprint: ${blueprint.name}`);
      } catch (error) {
        const errorMsg = `Failed to refresh ${blueprint.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    }

    return { updated, errors };
  }

  /**
   * Gets INTERNAL blueprint stats from cache (SERVER-SIDE ONLY)
   * WARNING: This returns secret combat values - NEVER expose to client!
   */
  async getBlueprintStatsInternal(blueprintId: number): Promise<{
    hullPoints: number;
    shieldStrength: number;
    damage: number;
    speed: number;
    sensorRange: number;
    cargoCapacity: number;
    crewRequired: number;
    hyperdriveRating: number;
  }> {
    const blueprint = await prisma.shipBlueprint.findUnique({
      where: { id: blueprintId },
      select: {
        totalHullPoints: true,
        totalShieldStrength: true,
        totalDamage: true,
        totalSpeed: true,
        totalSensorRange: true,
        totalCargoCapacity: true,
        totalCrewRequired: true,
        hyperdriveRating: true,
      },
    });

    if (!blueprint) {
      throw new Error(`Blueprint ${blueprintId} not found`);
    }

    return {
      hullPoints: blueprint.totalHullPoints,
      shieldStrength: blueprint.totalShieldStrength,
      damage: blueprint.totalDamage,
      speed: blueprint.totalSpeed,
      sensorRange: blueprint.totalSensorRange,
      cargoCapacity: blueprint.totalCargoCapacity,
      crewRequired: blueprint.totalCrewRequired,
      hyperdriveRating: blueprint.hyperdriveRating,
    };
  }

  /**
   * Gets construction costs from cache
   */
  async getBlueprintCosts(blueprintId: number): Promise<{
    credits: number;
    durastahl: number;
    kyberKristalle: number;
    tibannaGas: number;
    beskar: number;
    kristallinesSilizium: number;
    energiemodule: number;
    buildTimeMinutes: number;
  }> {
    const blueprint = await prisma.shipBlueprint.findUnique({
      where: { id: blueprintId },
      select: {
        totalCostCredits: true,
        totalCostDurastahl: true,
        totalCostKyberKristalle: true,
        totalCostTibannaGas: true,
        totalCostBeskar: true,
        totalCostKristallinesSilizium: true,
        totalCostEnergiemodule: true,
        totalBuildTime: true,
      },
    });

    if (!blueprint) {
      throw new Error(`Blueprint ${blueprintId} not found`);
    }

    return {
      credits: blueprint.totalCostCredits,
      durastahl: blueprint.totalCostDurastahl,
      kyberKristalle: blueprint.totalCostKyberKristalle,
      tibannaGas: blueprint.totalCostTibannaGas,
      beskar: blueprint.totalCostBeskar,
      kristallinesSilizium: blueprint.totalCostKristallinesSilizium,
      energiemodule: blueprint.totalCostEnergiemodule,
      buildTimeMinutes: blueprint.totalBuildTime,
    };
  }

  /**
   * Validates that a blueprint has valid cached stats (SERVER-SIDE ONLY)
   */
  async validateBlueprintCache(blueprintId: number): Promise<{
    isValid: boolean;
    issues: string[];
  }> {
    const blueprint = await prisma.shipBlueprint.findUnique({
      where: { id: blueprintId },
      include: {
        modules: {
          include: {
            moduleType: true,
          },
        },
      },
    });

    if (!blueprint) {
      throw new Error(`Blueprint ${blueprintId} not found`);
    }

    const issues: string[] = [];

    // Calculate fresh INTERNAL stats
    const modulesWithTypes = blueprint.modules.map((m) => ({
      level: m.level,
      moduleType: m.moduleType,
    }));

    const freshStats = blueprintService.calculateBlueprintStatsInternal(modulesWithTypes, blueprint.shipClass);
    const freshCosts = blueprintService.calculateConstructionCosts(modulesWithTypes, blueprint.shipClass);

    // Compare with cached values
    if (blueprint.totalHullPoints !== freshStats.hullPoints) {
      issues.push(`Hull points: cached=${blueprint.totalHullPoints}, calculated=${freshStats.hullPoints}`);
    }
    if (blueprint.totalShieldStrength !== freshStats.shieldStrength) {
      issues.push(`Shield strength: cached=${blueprint.totalShieldStrength}, calculated=${freshStats.shieldStrength}`);
    }
    if (blueprint.totalDamage !== freshStats.damage) {
      issues.push(`Damage: cached=${blueprint.totalDamage}, calculated=${freshStats.damage}`);
    }
    if (blueprint.totalCostCredits !== freshCosts.credits) {
      issues.push(`Cost credits: cached=${blueprint.totalCostCredits}, calculated=${freshCosts.credits}`);
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }
}

export const blueprintStatsService = new BlueprintStatsService();
