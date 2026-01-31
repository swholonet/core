import prisma from '../src/lib/prisma';
import { defaultBlueprintsService } from '../src/services/defaultBlueprintsService';
import { blueprintStatsService } from '../src/services/blueprintStatsService';

// Node.js types
declare const process: any;
declare const require: any;
declare const module: any;

/**
 * STU-Style Ship Migration Script
 * Migrates all ships from legacy ShipType system to modular Blueprint system
 */

interface MigrationResult {
  success: boolean;
  migratedShips: number;
  createdBlueprints: number;
  errors: string[];
  warnings: string[];
}

interface MigrationOptions {
  dryRun?: boolean;
  verbose?: boolean;
  forceRebuild?: boolean;
}

class ShipToBlueprintMigration {
  private options: MigrationOptions;
  private result: MigrationResult = {
    success: false,
    migratedShips: 0,
    createdBlueprints: 0,
    errors: [],
    warnings: []
  };

  constructor(options: MigrationOptions = {}) {
    this.options = {
      dryRun: false,
      verbose: false,
      forceRebuild: false,
      ...options
    };
  }

  /**
   * Main migration execution
   */
  async migrate(): Promise<MigrationResult> {
    this.log('🚀 Starting Ship->Blueprint Migration');
    this.log(`Mode: ${this.options.dryRun ? 'DRY RUN' : 'LIVE MIGRATION'}`);

    try {
      // Step 1: Check migration prerequisites
      await this.checkPrerequisites();

      // Step 2: Create default blueprints for existing ShipTypes
      await this.createDefaultBlueprints();

      // Step 3: Migrate ships to use blueprints
      await this.migrateShips();

      // Step 4: Validate migration results
      await this.validateMigration();

      this.result.success = true;
      this.log('✅ Migration completed successfully!');

    } catch (error) {
      this.result.errors.push(`Migration failed: ${error}`);
      this.log(`❌ Migration failed: ${error}`, 'error');
    }

    return this.result;
  }

  /**
   * Check if migration can be safely executed
   */
  private async checkPrerequisites(): Promise<void> {
    this.log('🔍 Checking migration prerequisites...');

    // Check if module types are seeded
    const moduleTypeCount = await prisma.moduleType.count();
    if (moduleTypeCount === 0) {
      throw new Error('No module types found. Run module types seed script first.');
    }
    this.log(`✓ Found ${moduleTypeCount} module types`);

    // Check for ships without ShipTypes
    const orphanedShips = await prisma.ship.count({
      where: {
        shipTypeId: null,
        blueprintId: null
      }
    });

    if (orphanedShips > 0) {
      this.result.warnings.push(`Found ${orphanedShips} ships without ShipType or Blueprint`);
      this.log(`⚠️ Warning: ${orphanedShips} ships have neither ShipType nor Blueprint`);
    }

    // Check if some ships are already migrated
    const migratedShips = await prisma.ship.count({
      where: {
        blueprintId: { not: null }
      }
    });

    const totalShips = await prisma.ship.count();
    this.log(`📊 Ships status: ${migratedShips}/${totalShips} already use blueprints`);

    if (migratedShips === totalShips && !this.options.forceRebuild) {
      this.log('ℹ️ All ships already migrated. Use --force-rebuild to recreate blueprints');
    }
  }

  /**
   * Create default blueprints for all existing ShipTypes
   */
  private async createDefaultBlueprints(): Promise<void> {
    this.log('🏗️ Creating default blueprints for ShipTypes...');

    try {
      const shipTypes = await prisma.shipType.findMany({
        orderBy: { name: 'asc' }
      });

      if (shipTypes.length === 0) {
        this.log('⚠️ No ShipTypes found - skipping blueprint creation');
        return;
      }

      this.log(`Found ${shipTypes.length} ShipTypes to convert`);

      if (!this.options.dryRun) {
        // Create default blueprints using the service
        const blueprintResult = await defaultBlueprintsService.createAllDefaultBlueprints();
        this.result.createdBlueprints = blueprintResult.created;

        this.log(`✅ Blueprint creation result:`);
        this.log(`  - Created: ${blueprintResult.created} new blueprints`);
        this.log(`  - Skipped: ${blueprintResult.skipped} existing blueprints`);
        this.log(`  - Errors: ${blueprintResult.errors.length}`);

        if (blueprintResult.errors.length > 0) {
          for (const error of blueprintResult.errors) {
            this.log(`  ❌ ${error}`, 'error');
          }
        }

        // Get all blueprints for stats refresh
        this.log('🔄 Refreshing blueprint stats cache...');
        const allBlueprints = await prisma.shipBlueprint.findMany({
          select: { id: true, name: true }
        });

        for (const blueprint of allBlueprints) {
          await blueprintStatsService.refreshBlueprintStats(blueprint.id);
        }

      } else {
        this.log('🔍 DRY RUN: Would create blueprints for:');
        for (const shipType of shipTypes) {
          this.log(`  - ${shipType.name}`);
        }
        this.result.createdBlueprints = shipTypes.length;
      }

    } catch (error) {
      throw new Error(`Failed to create default blueprints: ${error}`);
    }
  }

  /**
   * Migrate all ships to use blueprints instead of ShipTypes
   */
  private async migrateShips(): Promise<void> {
    this.log('🚢 Migrating ships to Blueprint system...');

    // Get all ships that still use ShipTypes
    const shipsToMigrate = await prisma.ship.findMany({
      where: {
        shipTypeId: { not: null },
        OR: [
          { blueprintId: null },
          ...(this.options.forceRebuild ? [{ blueprintId: { not: null } }] : [])
        ]
      },
      include: {
        shipType: true,
        player: { select: { id: true, user: { select: { username: true } } } }
      },
      orderBy: { id: 'asc' }
    });

    if (shipsToMigrate.length === 0) {
      this.log('✅ No ships need migration');
      return;
    }

    this.log(`🔄 Migrating ${shipsToMigrate.length} ships...`);

    let migrated = 0;
    const batchSize = 50;

    for (let i = 0; i < shipsToMigrate.length; i += batchSize) {
      const batch = shipsToMigrate.slice(i, i + batchSize);

      this.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1} (${batch.length} ships)`);

      for (const ship of batch) {
        try {
          if (!ship.shipType) {
            this.result.warnings.push(`Ship ${ship.id} has no ShipType - skipping`);
            continue;
          }

          // Find the corresponding default blueprint
          const blueprintName = `[Legacy] ${ship.shipType.name}`;
          const blueprint = await prisma.shipBlueprint.findFirst({
            where: { name: blueprintName }
          });

          if (!blueprint) {
            this.result.errors.push(`No blueprint found for ShipType: ${ship.shipType.name}`);
            continue;
          }

          if (!this.options.dryRun) {
            // Update ship to use blueprint
            await prisma.ship.update({
              where: { id: ship.id },
              data: {
                blueprintId: blueprint.id,
                // Keep shipTypeId for now during transition
              }
            });
          }

          migrated++;

          if (this.options.verbose) {
            const owner = ship.player?.user?.username || 'System';
            this.log(`  ✓ Ship ${ship.id} (${ship.name || 'Unnamed'}) -> ${blueprint.name} [${owner}]`);
          }

        } catch (error) {
          const errorMsg = `Failed to migrate ship ${ship.id}: ${error}`;
          this.result.errors.push(errorMsg);
          this.log(`  ❌ ${errorMsg}`);
        }
      }

      // Progress update
      if (!this.options.verbose && batch.length > 0) {
        this.log(`  ✅ Migrated batch: ${migrated} ships total`);
      }
    }

    this.result.migratedShips = migrated;
    this.log(`🎉 Migration completed: ${migrated}/${shipsToMigrate.length} ships migrated`);
  }

  /**
   * Validate migration results and data integrity
   */
  private async validateMigration(): Promise<void> {
    this.log('🔍 Validating migration results...');

    // Count ships by migration status
    const [totalShips, withBlueprints, withShipTypes, withBoth, withNeither] = await Promise.all([
      prisma.ship.count(),
      prisma.ship.count({ where: { blueprintId: { not: null } } }),
      prisma.ship.count({ where: { shipTypeId: { not: null } } }),
      prisma.ship.count({
        where: {
          AND: [
            { blueprintId: { not: null } },
            { shipTypeId: { not: null } }
          ]
        }
      }),
      prisma.ship.count({
        where: {
          AND: [
            { blueprintId: null },
            { shipTypeId: null }
          ]
        }
      })
    ]);

    // Validation report
    this.log('📊 Migration Validation Report:');
    this.log(`  Total ships: ${totalShips}`);
    this.log(`  With blueprints: ${withBlueprints} (${Math.round(withBlueprints/totalShips*100)}%)`);
    this.log(`  With ShipTypes: ${withShipTypes} (${Math.round(withShipTypes/totalShips*100)}%)`);
    this.log(`  With both: ${withBoth}`);
    this.log(`  With neither: ${withNeither}`);

    // Check for orphaned ships
    if (withNeither > 0) {
      this.result.errors.push(`${withNeither} ships have neither Blueprint nor ShipType`);
    }

    // Validate blueprint references
    const invalidBlueprintRefs = await prisma.ship.count({
      where: {
        blueprintId: { not: null },
        blueprint: null
      }
    });

    if (invalidBlueprintRefs > 0) {
      this.result.errors.push(`${invalidBlueprintRefs} ships reference non-existent blueprints`);
    }

    // Check blueprint stats cache
    const blueprintsWithoutStats = await prisma.shipBlueprint.count({
      where: {
        OR: [
          { totalHullPoints: 0 },
          { totalDamage: 0 },
          { totalShieldStrength: 0 }
        ]
      }
    });

    if (blueprintsWithoutStats > 0) {
      this.result.warnings.push(`${blueprintsWithoutStats} blueprints may have incomplete stats cache`);
    }

    this.log(`✅ Validation completed with ${this.result.errors.length} errors and ${this.result.warnings.length} warnings`);
  }

  /**
   * Rollback migration (emergency use only)
   */
  async rollback(): Promise<void> {
    this.log('⚠️ ROLLBACK: Removing blueprint references from ships...');

    if (this.options.dryRun) {
      this.log('🔍 DRY RUN: Would clear blueprintId from all ships');
      return;
    }

    const updated = await prisma.ship.updateMany({
      where: { blueprintId: { not: null } },
      data: { blueprintId: null }
    });

    this.log(`✅ Rollback completed: cleared ${updated.count} ship blueprint references`);
  }

  /**
   * Logging utility
   */
  private log(message: string, level: 'info' | 'error' | 'warn' = 'info'): void {
    const timestamp = new Date().toISOString();
    const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : 'ℹ️';
    console.log(`[${timestamp}] ${prefix} ${message}`);
  }
}

/**
 * Command line interface
 */
async function main() {
  const args = process.argv.slice(2);

  const options: MigrationOptions = {
    dryRun: args.includes('--dry-run'),
    verbose: args.includes('--verbose'),
    forceRebuild: args.includes('--force-rebuild')
  };

  if (args.includes('--help')) {
    console.log(`
🚀 Ship->Blueprint Migration Script

Usage: tsx scripts/migrate-ships-to-blueprints.ts [options]

Options:
  --dry-run        Show what would be done without making changes
  --verbose        Show detailed migration progress
  --force-rebuild  Recreate blueprints and re-migrate all ships
  --rollback       Emergency rollback (removes all blueprint references)
  --help          Show this help message

Examples:
  tsx scripts/migrate-ships-to-blueprints.ts --dry-run
  tsx scripts/migrate-ships-to-blueprints.ts --verbose
  tsx scripts/migrate-ships-to-blueprints.ts --force-rebuild
    `);
    return;
  }

  const migration = new ShipToBlueprintMigration(options);

  try {
    if (args.includes('--rollback')) {
      await migration.rollback();
    } else {
      const result = await migration.migrate();

      // Summary
      console.log('\n📊 Migration Summary:');
      console.log(`Status: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`);
      console.log(`Ships migrated: ${result.migratedShips}`);
      console.log(`Blueprints created: ${result.createdBlueprints}`);
      console.log(`Errors: ${result.errors.length}`);
      console.log(`Warnings: ${result.warnings.length}`);

      if (result.errors.length > 0) {
        console.log('\n❌ Errors:');
        result.errors.forEach(error => console.log(`  - ${error}`));
      }

      if (result.warnings.length > 0) {
        console.log('\n⚠️ Warnings:');
        result.warnings.forEach(warning => console.log(`  - ${warning}`));
      }

      if (!result.success) {
        process.exit(1);
      }
    }
  } catch (error) {
    console.error('💥 Migration script failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

export { ShipToBlueprintMigration };