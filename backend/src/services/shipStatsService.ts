import prisma from '../lib/prisma';
import { blueprintStatsService } from './blueprintStatsService';

/**
 * Service for managing ship stats integration with blueprints
 */
export class ShipStatsService {
  /**
   * Gets a ship's effective stats (from blueprint if available, fallback to hardcoded)
   */
  async getShipStats(shipId: number): Promise<{
    hullPoints: number;
    deflectorShieldStrength: number;
    weaponDamage: number;
    subLightSpeed: number;
    hyperdriveRating: number;
    sensorRange: number;
    cargoCapacity: number;
    crewCapacity: number;
    maxEnergyWeapons: number;
    maxEnergyDrive: number;
  }> {
    const ship = await prisma.ship.findUnique({
      where: { id: shipId },
      include: {
        blueprint: true,
      },
    });

    if (!ship) {
      throw new Error(`Ship ${shipId} not found`);
    }

    // Priority 1: Use Blueprint stats if available
    if (ship.blueprintId && ship.blueprint) {
      const blueprintStats = await blueprintStatsService.getBlueprintStatsInternal(ship.blueprintId);

      return {
        hullPoints: blueprintStats.hullPoints,
        deflectorShieldStrength: blueprintStats.shieldStrength,
        weaponDamage: blueprintStats.damage,
        subLightSpeed: blueprintStats.speed,
        hyperdriveRating: blueprintStats.hyperdriveRating,
        sensorRange: blueprintStats.sensorRange,
        cargoCapacity: blueprintStats.cargoCapacity,
        crewCapacity: blueprintStats.crewRequired,
        // Energy limits - for now use blueprint stats, later from specific modules
        maxEnergyWeapons: Math.max(50, blueprintStats.damage * 2), // Scale with weapon power
        maxEnergyDrive: Math.max(50, blueprintStats.sensorRange * 10), // Scale with sensor range
      };
    }

    // Priority 2: Use hardcoded Ship stats as fallback (legacy ships without blueprints)
    return {
      hullPoints: ship.hullPoints,
      deflectorShieldStrength: ship.deflectorShieldStrength,
      weaponDamage: ship.weaponDamage,
      subLightSpeed: ship.subLightSpeed,
      hyperdriveRating: ship.hyperdriveRating,
      sensorRange: ship.sensorRange,
      cargoCapacity: ship.cargoCapacity,
      crewCapacity: ship.crewCapacity,
      maxEnergyWeapons: 50, // Default energy limits
      maxEnergyDrive: 50,
    };
  }

  /**
   * Gets multiple ships' stats efficiently
   */
  async getMultipleShipStats(shipIds: number[]): Promise<Map<number, any>> {
    const ships = await prisma.ship.findMany({
      where: { id: { in: shipIds } },
      include: {
        blueprint: true,
      },
    });

    const statsMap = new Map();

    for (const ship of ships) {
      try {
        const stats = await this.getShipStatsFromShip(ship);
        statsMap.set(ship.id, stats);
      } catch (error) {
        console.error(`Failed to get stats for ship ${ship.id}:`, error);
        // Provide basic fallback stats
        statsMap.set(ship.id, {
          hullPoints: 100,
          deflectorShieldStrength: 10,
          weaponDamage: 10,
          subLightSpeed: 5,
          hyperdriveRating: 1.0,
          sensorRange: 3,
          cargoCapacity: 100,
          crewCapacity: 10,
          maxEnergyWeapons: 50,
          maxEnergyDrive: 50,
        });
      }
    }

    return statsMap;
  }

  /**
   * Gets ship stats from a ship object (avoiding additional DB queries)
   */
  private async getShipStatsFromShip(ship: any): Promise<any> {
    // Priority 1: Use Blueprint stats if available
    if (ship.blueprintId && ship.blueprint) {
      const blueprintStats = await blueprintStatsService.getBlueprintStatsInternal(ship.blueprintId);

      return {
        hullPoints: blueprintStats.hullPoints,
        deflectorShieldStrength: blueprintStats.shieldStrength,
        weaponDamage: blueprintStats.damage,
        subLightSpeed: blueprintStats.speed,
        hyperdriveRating: blueprintStats.hyperdriveRating,
        sensorRange: blueprintStats.sensorRange,
        cargoCapacity: blueprintStats.cargoCapacity,
        crewCapacity: blueprintStats.crewRequired,
        maxEnergyWeapons: Math.max(50, blueprintStats.damage * 2),
        maxEnergyDrive: Math.max(50, blueprintStats.sensorRange * 10),
      };
    }

    // Priority 2: Use hardcoded Ship stats as fallback (legacy ships without blueprints)
    return {
      hullPoints: ship.hullPoints,
      deflectorShieldStrength: ship.deflectorShieldStrength,
      weaponDamage: ship.weaponDamage,
      subLightSpeed: ship.subLightSpeed,
      hyperdriveRating: ship.hyperdriveRating,
      sensorRange: ship.sensorRange,
      cargoCapacity: ship.cargoCapacity,
      crewCapacity: ship.crewCapacity,
      maxEnergyWeapons: 50, // Default energy limits
      maxEnergyDrive: 50,
    };
  }

  /**
   * Updates a ship's hardcoded stats to match its blueprint
   * This is useful for migration or ensuring consistency
   */
  async syncShipStatsFromBlueprint(shipId: number): Promise<void> {
    const ship = await prisma.ship.findUnique({
      where: { id: shipId },
      include: { blueprint: true },
    });

    if (!ship) {
      throw new Error(`Ship ${shipId} not found`);
    }

    if (!ship.blueprintId) {
      throw new Error(`Ship ${shipId} has no blueprint assigned`);
    }

    const blueprintStats = await blueprintStatsService.getBlueprintStatsInternal(ship.blueprintId);

    // Update ship's hardcoded stats to match blueprint
    await prisma.ship.update({
      where: { id: shipId },
      data: {
        hullPoints: blueprintStats.hullPoints,
        deflectorShieldStrength: blueprintStats.shieldStrength,
        weaponDamage: blueprintStats.damage,
        subLightSpeed: blueprintStats.speed,
        hyperdriveRating: blueprintStats.hyperdriveRating,
        sensorRange: blueprintStats.sensorRange,
        cargoCapacity: blueprintStats.cargoCapacity,
        crewCapacity: blueprintStats.crewRequired,
      },
    });
  }

  /**
   * Creates a new ship with stats from a blueprint
   */
  async createShipFromBlueprint(data: {
    playerId: number;
    blueprintId: number;
    name?: string;
    planetId?: number;
    currentSystemId?: number;
    currentGalaxyX?: number;
    currentGalaxyY?: number;
  }): Promise<any> {
    const blueprint = await prisma.shipBlueprint.findUnique({
      where: { id: data.blueprintId },
    });

    if (!blueprint) {
      throw new Error(`Blueprint ${data.blueprintId} not found`);
    }

    const blueprintStats = await blueprintStatsService.getBlueprintStatsInternal(data.blueprintId);

    // Create ship with blueprint stats
    const ship = await prisma.ship.create({
      data: {
        playerId: data.playerId,
        blueprintId: data.blueprintId,
        name: data.name || blueprint.name,
        planetId: data.planetId,
        currentSystemId: data.currentSystemId,
        currentGalaxyX: data.currentGalaxyX,
        currentGalaxyY: data.currentGalaxyY,

        // Set stats from blueprint
        hullPoints: blueprintStats.hullPoints,
        deflectorShieldStrength: blueprintStats.shieldStrength,
        weaponDamage: blueprintStats.damage,
        subLightSpeed: blueprintStats.speed,
        hyperdriveRating: blueprintStats.hyperdriveRating,
        sensorRange: blueprintStats.sensorRange,
        cargoCapacity: blueprintStats.cargoCapacity,
        crewCapacity: blueprintStats.crewRequired,

        // Set crew to capacity and energy to zero initially
        crew: blueprintStats.crewRequired,
        energyWeapons: 0,
        energyDrive: 0,
        status: 'DOCKED',
      },
      include: {
        blueprint: true,
        player: {
          include: { user: true },
        },
      },
    });

    return ship;
  }

  /**
   * Migrates a ship from ShipType to Blueprint
   */
  async migrateShipToBlueprint(shipId: number, blueprintId: number): Promise<void> {
    const ship = await prisma.ship.findUnique({
      where: { id: shipId },
    });

    if (!ship) {
      throw new Error(`Ship ${shipId} not found`);
    }

    const blueprintStats = await blueprintStatsService.getBlueprintStatsInternal(blueprintId);

    // Update ship to use blueprint
    await prisma.ship.update({
      where: { id: shipId },
      data: {
        blueprintId,
        // shipTypeId field no longer exists after migration

        // Update stats to match blueprint
        hullPoints: blueprintStats.hullPoints,
        deflectorShieldStrength: blueprintStats.shieldStrength,
        weaponDamage: blueprintStats.damage,
        subLightSpeed: blueprintStats.speed,
        hyperdriveRating: blueprintStats.hyperdriveRating,
        sensorRange: blueprintStats.sensorRange,
        cargoCapacity: blueprintStats.cargoCapacity,
        crewCapacity: blueprintStats.crewRequired,
      },
    });
  }

  /**
   * Validates that a ship's hardcoded stats match its blueprint
   */
  async validateShipBlueprintConsistency(shipId: number): Promise<{
    isConsistent: boolean;
    differences: string[];
  }> {
    const ship = await prisma.ship.findUnique({
      where: { id: shipId },
      include: { blueprint: true },
    });

    if (!ship) {
      throw new Error(`Ship ${shipId} not found`);
    }

    if (!ship.blueprintId) {
      return { isConsistent: true, differences: ['Ship has no blueprint - using hardcoded stats'] };
    }

    const blueprintStats = await blueprintStatsService.getBlueprintStatsInternal(ship.blueprintId);
    const differences: string[] = [];

    if (ship.hullPoints !== blueprintStats.hullPoints) {
      differences.push(`Hull points: ship=${ship.hullPoints}, blueprint=${blueprintStats.hullPoints}`);
    }
    if (ship.weaponDamage !== blueprintStats.damage) {
      differences.push(`Weapon damage: ship=${ship.weaponDamage}, blueprint=${blueprintStats.damage}`);
    }
    if (ship.deflectorShieldStrength !== blueprintStats.shieldStrength) {
      differences.push(`Shield strength: ship=${ship.deflectorShieldStrength}, blueprint=${blueprintStats.shieldStrength}`);
    }
    if (ship.sensorRange !== blueprintStats.sensorRange) {
      differences.push(`Sensor range: ship=${ship.sensorRange}, blueprint=${blueprintStats.sensorRange}`);
    }

    return {
      isConsistent: differences.length === 0,
      differences,
    };
  }
}

export const shipStatsService = new ShipStatsService();