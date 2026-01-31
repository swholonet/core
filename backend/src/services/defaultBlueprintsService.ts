import prisma from '../lib/prisma';
import { ShipClass, ModuleCategory } from '@prisma/client';
import { blueprintService } from './blueprintService';

/**
 * Service for creating default blueprints from existing ShipTypes
 * This enables migration from legacy ShipType system to Blueprint system
 */
export class DefaultBlueprintsService {
  /**
   * Creates default blueprints from all existing ShipTypes (DEPRECATED - ShipType system removed)
   */
  async createAllDefaultBlueprints(): Promise<{ created: number; skipped: number; errors: string[] }> {
    console.log('🔄 Creating default blueprints from ShipTypes... (DEPRECATED - ShipType system removed)');

    const shipTypes: any[] = []; // ShipType table no longer exists
    console.log(`Found ${shipTypes.length} ShipTypes to convert`);

    let created = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const shipType of shipTypes) {
      try {
        const result = await this.createDefaultBlueprint(shipType.id);
        if (result.created) {
          created++;
          console.log(`  ✓ Created blueprint: ${result.blueprint?.name}`);
        } else {
          skipped++;
          console.log(`  ⏭️  Skipped: ${result.reason}`);
        }
      } catch (error) {
        const errorMsg = `Failed to create blueprint for ${shipType.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMsg);
        console.error(`  ❌ ${errorMsg}`);
      }
    }

    console.log(`\n✅ Default blueprint creation complete:`);
    console.log(`   Created: ${created}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Errors: ${errors.length}`);

    return { created, skipped, errors };
  }

  /**
   * Creates a default blueprint from a specific ShipType (DEPRECATED - ShipType system removed)
   */
  async createDefaultBlueprint(shipTypeId: number): Promise<{
    created: boolean;
    blueprint?: any;
    reason?: string;
  }> {
    // ShipType system has been removed
    return {
      created: false,
      reason: 'ShipType system has been removed and migrated to Blueprint system'
    };
  }

  /**
   * Selects appropriate modules to match a ShipType's stats
   */
  private async selectModulesForShipType(
    shipType: any,
    shipClass: ShipClass,
    availableModules: any[]
  ): Promise<Array<{ moduleTypeId: number; level: number; slotPosition: number }>> {
    const modules: Array<{ moduleTypeId: number; level: number; slotPosition: number }> = [];
    let slotPosition = 1;

    // Get max slots for this ship class
    const SHIP_CLASS_SLOTS: Record<ShipClass, number> = {
      'FIGHTER': 4,
      'BOMBER': 5,
      'CORVETTE': 6,
      'FRIGATE': 7,
      'CRUISER': 8,
      'CAPITAL': 10,
      'TRANSPORT': 5,
    };

    const maxSlots = SHIP_CLASS_SLOTS[shipClass];

    // Helper function to find best module for a category
    const findModuleByCategory = (category: ModuleCategory, preferredNames?: string[]) => {
      const categoryModules = availableModules.filter(m => m.category === category);

      if (preferredNames) {
        for (const name of preferredNames) {
          const preferred = categoryModules.find(m => m.name.includes(name));
          if (preferred) return preferred;
        }
      }

      // Return first module in category (usually the basic one)
      return categoryModules[0];
    };

    // Helper to add module if slot available
    const addModule = (module: any, level: number) => {
      if (module && slotPosition <= maxSlots) {
        modules.push({ moduleTypeId: module.id, level, slotPosition: slotPosition++ });
        return true;
      }
      return false;
    };

    // PRIORITY 1: Essential combat modules
    // 1. WEAPONS MODULE (essential for combat ships)
    if (shipType.attack > 5) {
      let weaponModule;
      if (shipType.attack >= 100) {
        weaponModule = findModuleByCategory('WEAPONS', ['Schwerer Turbolaser', 'Protonenraketen']);
      } else if (shipType.attack >= 30) {
        weaponModule = findModuleByCategory('WEAPONS', ['Schwerer', 'Ionenkanone']);
      } else {
        weaponModule = findModuleByCategory('WEAPONS', ['Leichter', 'Standard']);
      }

      if (weaponModule) {
        const level = Math.min(Math.max(Math.ceil(shipType.attack / 25), 1), weaponModule.maxLevel);
        addModule(weaponModule, level);
      }
    }

    // 2. HULL MODULE (essential for survivability)
    const hullModule = findModuleByCategory('HULL', ['Standard', 'Durastahl']);
    if (hullModule) {
      const level = Math.min(Math.max(Math.ceil(shipType.defense / 20), 1), hullModule.maxLevel);
      addModule(hullModule, level);
    }

    // PRIORITY 2: Movement modules
    // 3. HYPERDRIVE (essential for hyperspace travel)
    const hyperdriveModule = findModuleByCategory('HYPERDRIVE', ['Standard']);
    if (hyperdriveModule) {
      const level = shipType.fuelCapacity >= 5000 ? 3 : 1;
      addModule(hyperdriveModule, level);
    }

    // 4. SUBLIGHT ENGINE (important for system navigation)
    if (shipType.speed > 0 && slotPosition <= maxSlots) {
      let engineModule;
      if (shipType.speed >= 100) {
        engineModule = findModuleByCategory('SUBLIGHT_ENGINE', ['Turbo']);
      } else {
        engineModule = findModuleByCategory('SUBLIGHT_ENGINE', ['Ion']);
      }

      if (engineModule) {
        const level = Math.min(Math.max(Math.ceil(shipType.speed / 40), 1), engineModule.maxLevel);
        addModule(engineModule, level);
      }
    }

    // PRIORITY 3: Defensive modules (if slots available)
    // 5. SHIELDS MODULE (add only if defense is significant and slots remain)
    if (shipType.defense >= 10 && slotPosition <= maxSlots) {
      let shieldModule;
      if (shipType.defense >= 100) {
        shieldModule = findModuleByCategory('SHIELDS', ['Militär', 'Verstärkter']);
      } else if (shipType.defense >= 30) {
        shieldModule = findModuleByCategory('SHIELDS', ['Verstärkter']);
      } else {
        shieldModule = findModuleByCategory('SHIELDS', ['Standard']);
      }

      if (shieldModule) {
        const level = Math.min(Math.max(Math.ceil(shipType.defense / 30), 1), shieldModule.maxLevel);
        addModule(shieldModule, level);
      }
    }

    // PRIORITY 4: Utility modules (if slots available)
    // 6. SENSORS (add basic sensors if slots remain)
    if (slotPosition <= maxSlots) {
      const sensorModule = findModuleByCategory('SENSORS', ['Standard']);
      if (sensorModule) {
        const level = shipType.shipClass === 'CAPITAL' ? 3 : 1;
        addModule(sensorModule, level);
      }
    }

    // PRIORITY 5: Specialized modules (only if slots remain)
    // 7. CARGO (only for ships with significant cargo)
    if (shipType.cargoCapacity > 500 && slotPosition <= maxSlots) {
      let cargoModule;
      if (shipType.cargoCapacity >= 2000) {
        cargoModule = findModuleByCategory('CARGO', ['Verstärkter']);
      } else {
        cargoModule = findModuleByCategory('CARGO', ['Standard']);
      }

      if (cargoModule) {
        const level = Math.min(Math.max(Math.ceil(shipType.cargoCapacity / 1000), 1), cargoModule.maxLevel);
        addModule(cargoModule, level);
      }
    }

    // 8. LIFE SUPPORT (only for ships with large crews)
    if (shipType.crewRequired > 10 && slotPosition <= maxSlots) {
      let lifeSupportModule;
      if (shipType.crewRequired >= 100) {
        lifeSupportModule = findModuleByCategory('LIFE_SUPPORT', ['Erweiterte']);
      } else {
        lifeSupportModule = findModuleByCategory('LIFE_SUPPORT', ['Standard']);
      }

      if (lifeSupportModule) {
        const level = Math.min(Math.max(Math.ceil(shipType.crewRequired / 100), 1), lifeSupportModule.maxLevel);
        addModule(lifeSupportModule, level);
      }
    }

    return modules;
  }

  /**
   * Maps string ship class to enum
   */
  private mapShipClassString(shipClassString: string): ShipClass | null {
    const mapping: Record<string, ShipClass> = {
      'FIGHTER': 'FIGHTER',
      'BOMBER': 'BOMBER',
      'CORVETTE': 'CORVETTE',
      'FRIGATE': 'FRIGATE',
      'CRUISER': 'CRUISER',
      'CAPITAL': 'CAPITAL',
      'TRANSPORT': 'TRANSPORT',
    };

    return mapping[shipClassString] || null;
  }

  /**
   * Creates a blueprint that matches an existing ship's current setup
   */
  async createBlueprintForShip(
    shipId: number,
    playerId: number,
    blueprintName?: string
  ): Promise<{
    blueprint?: any;
    error?: string;
  }> {
    const ship = await prisma.ship.findFirst({
      where: { id: shipId, playerId },
    });

    if (!ship) {
      return { error: 'Ship not found' };
    }

    // ShipType system has been removed
    return { error: 'ShipType system has been removed. Ships now use Blueprints.' };
  }

  /**
   * Gets or creates a default blueprint for a ShipType (DEPRECATED - ShipType system removed)
   */
  async getOrCreateDefaultBlueprint(shipTypeId: number): Promise<{
    blueprint?: any;
    error?: string;
  }> {
    return { error: 'ShipType system has been removed and migrated to Blueprint system' };
  }
}

export const defaultBlueprintsService = new DefaultBlueprintsService();