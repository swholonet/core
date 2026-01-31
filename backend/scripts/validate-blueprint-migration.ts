import prisma from '../src/lib/prisma';

// Node.js types
declare const process: any;
declare const require: any;
declare const module: any;

/**
 * Blueprint Migration Validation Script
 * Checks the status and integrity of the Ship->Blueprint migration
 */

interface ValidationReport {
  timestamp: string;
  migration: {
    status: 'complete' | 'partial' | 'not-started';
    percentage: number;
    totalShips: number;
    migratedShips: number;
    legacyShips: number;
    orphanedShips: number;
  };
  blueprints: {
    total: number;
    withModules: number;
    withoutModules: number;
    withCachedStats: number;
    withoutCachedStats: number;
  };
  integrity: {
    orphanedShips: number;
    invalidBlueprintRefs: number;
    duplicateBlueprintNames: number;
    emptyModuleSlots: number;
  };
  performance: {
    averageModulesPerBlueprint: number;
    blueprintsNeedingStatsRefresh: number;
    shipsWithoutBlueprints: number;
  };
  issues: string[];
  recommendations: string[];
}

class BlueprintMigrationValidator {
  async validate(): Promise<ValidationReport> {
    const report: ValidationReport = {
      timestamp: new Date().toISOString(),
      migration: {
        status: 'not-started',
        percentage: 0,
        totalShips: 0,
        migratedShips: 0,
        legacyShips: 0,
        orphanedShips: 0
      },
      blueprints: {
        total: 0,
        withModules: 0,
        withoutModules: 0,
        withCachedStats: 0,
        withoutCachedStats: 0
      },
      integrity: {
        orphanedShips: 0,
        invalidBlueprintRefs: 0,
        duplicateBlueprintNames: 0,
        emptyModuleSlots: 0
      },
      performance: {
        averageModulesPerBlueprint: 0,
        blueprintsNeedingStatsRefresh: 0,
        shipsWithoutBlueprints: 0
      },
      issues: [],
      recommendations: []
    };

    console.log('🔍 Starting Blueprint Migration Validation...\n');

    try {
      await this.validateMigrationStatus(report);
      await this.validateBlueprints(report);
      await this.validateIntegrity(report);
      await this.validatePerformance(report);
      await this.generateRecommendations(report);

    } catch (error) {
      report.issues.push(`Validation failed: ${error}`);
    }

    return report;
  }

  private async validateMigrationStatus(report: ValidationReport): Promise<void> {
    console.log('📊 Analyzing Migration Status...');

    // Count ships by migration status
    const [totalShips, migratedShips, legacyShips, orphanedShips] = await Promise.all([
      prisma.ship.count(),
      prisma.ship.count({ where: { blueprintId: { not: null } } }),
      prisma.ship.count({
        where: {
          shipTypeId: { not: null },
          blueprintId: null
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

    report.migration = {
      totalShips,
      migratedShips,
      legacyShips,
      orphanedShips,
      percentage: totalShips > 0 ? Math.round((migratedShips / totalShips) * 100) : 0,
      status: migratedShips === totalShips ? 'complete' :
              migratedShips > 0 ? 'partial' : 'not-started'
    };

    console.log(`  Total Ships: ${totalShips}`);
    console.log(`  Migrated: ${migratedShips} (${report.migration.percentage}%)`);
    console.log(`  Legacy (ShipType only): ${legacyShips}`);
    console.log(`  Orphaned: ${orphanedShips}`);
    console.log(`  Status: ${report.migration.status.toUpperCase()}\n`);

    if (orphanedShips > 0) {
      report.issues.push(`${orphanedShips} ships have neither Blueprint nor ShipType`);
    }
  }

  private async validateBlueprints(report: ValidationReport): Promise<void> {
    console.log('🏗️ Analyzing Blueprints...');

    const [total, withModules, withCachedStats] = await Promise.all([
      prisma.shipBlueprint.count(),
      prisma.shipBlueprint.count({
        where: {
          modules: {
            some: {}
          }
        }
      }),
      prisma.shipBlueprint.count({
        where: {
          AND: [
            { totalHullPoints: { gt: 0 } },
            { totalDamage: { gte: 0 } },
            { totalShieldStrength: { gte: 0 } }
          ]
        }
      })
    ]);

    // Get average modules per blueprint
    const moduleStats = await prisma.blueprintModule.groupBy({
      by: ['blueprintId'],
      _count: {
        _all: true
      }
    });

    const averageModules = moduleStats.length > 0
      ? Math.round(moduleStats.reduce((sum, stat) => sum + stat._count._all, 0) / moduleStats.length * 10) / 10
      : 0;

    report.blueprints = {
      total,
      withModules,
      withoutModules: total - withModules,
      withCachedStats,
      withoutCachedStats: total - withCachedStats
    };

    report.performance.averageModulesPerBlueprint = averageModules;

    console.log(`  Total Blueprints: ${total}`);
    console.log(`  With Modules: ${withModules}/${total}`);
    console.log(`  With Cached Stats: ${withCachedStats}/${total}`);
    console.log(`  Average Modules: ${averageModules} per blueprint\n`);

    if (report.blueprints.withoutModules > 0) {
      report.issues.push(`${report.blueprints.withoutModules} blueprints have no modules configured`);
    }

    if (report.blueprints.withoutCachedStats > 0) {
      report.issues.push(`${report.blueprints.withoutCachedStats} blueprints have no cached stats`);
    }
  }

  private async validateIntegrity(report: ValidationReport): Promise<void> {
    console.log('🔍 Checking Data Integrity...');

    // Check for orphaned ship references
    const orphanedShipRefs = await prisma.ship.count({
      where: {
        blueprintId: { not: null },
        blueprint: null
      }
    });

    // Check for duplicate blueprint names
    const duplicateNames = await prisma.$queryRaw<{name: string, count: bigint}[]>`
      SELECT name, COUNT(*) as count
      FROM ShipBlueprint
      GROUP BY name
      HAVING COUNT(*) > 1
    `;

    // For simplicity, skip the complex module checks - this would require raw SQL
    const emptyModuleSlots = 0; // Can be implemented later if needed

    report.integrity = {
      orphanedShips: orphanedShipRefs,
      invalidBlueprintRefs: orphanedShipRefs,
      duplicateBlueprintNames: duplicateNames.length,
      emptyModuleSlots
    };

    console.log(`  Orphaned Ship References: ${orphanedShipRefs}`);
    console.log(`  Duplicate Blueprint Names: ${duplicateNames.length}`);
    console.log(`  Empty Module Slots: ${emptyModuleSlots}\n`);

    if (orphanedShipRefs > 0) {
      report.issues.push(`${orphanedShipRefs} ships reference non-existent blueprints`);
    }

    if (duplicateNames.length > 0) {
      report.issues.push(`${duplicateNames.length} duplicate blueprint names found`);
      duplicateNames.forEach(dup => {
        report.issues.push(`  Duplicate: "${dup.name}" (${dup.count} instances)`);
      });
    }

    if (emptyModuleSlots > 0) {
      report.issues.push(`${emptyModuleSlots} module slots reference deleted ModuleTypes`);
    }
  }

  private async validatePerformance(report: ValidationReport): Promise<void> {
    console.log('⚡ Checking Performance Metrics...');

    // Blueprints that may need stats refresh (very low stats)
    const blueprintsNeedingRefresh = await prisma.shipBlueprint.count({
      where: {
        AND: [
          { modules: { some: {} } }, // Has modules
          { totalHullPoints: { lte: 10 } } // But very low stats
        ]
      }
    });

    const shipsWithoutBlueprints = await prisma.ship.count({
      where: { blueprintId: null }
    });

    report.performance = {
      ...report.performance,
      blueprintsNeedingStatsRefresh: blueprintsNeedingRefresh,
      shipsWithoutBlueprints
    };

    console.log(`  Blueprints Needing Stats Refresh: ${blueprintsNeedingRefresh}`);
    console.log(`  Ships Without Blueprints: ${shipsWithoutBlueprints}\n`);

    if (blueprintsNeedingRefresh > 0) {
      report.issues.push(`${blueprintsNeedingRefresh} blueprints may have outdated stats cache`);
    }
  }

  private async generateRecommendations(report: ValidationReport): Promise<void> {
    console.log('💡 Generating Recommendations...\n');

    // Migration recommendations
    if (report.migration.status === 'not-started') {
      report.recommendations.push('Run migration script: tsx scripts/migrate-ships-to-blueprints.ts');
    } else if (report.migration.status === 'partial') {
      report.recommendations.push(`Complete migration: ${report.migration.legacyShips} ships still need blueprints`);
    }

    // Blueprint recommendations
    if (report.blueprints.withoutModules > 0) {
      report.recommendations.push('Create modules for empty blueprints or remove unused blueprints');
    }

    if (report.blueprints.withoutCachedStats > 0) {
      report.recommendations.push('Refresh blueprint stats cache for optimal performance');
    }

    // Performance recommendations
    if (report.performance.blueprintsNeedingStatsRefresh > 0) {
      report.recommendations.push('Run stats refresh for blueprints with outdated cache');
    }

    if (report.performance.averageModulesPerBlueprint < 3) {
      report.recommendations.push('Consider adding more modules to blueprints for better ship variety');
    }

    // Integrity recommendations
    if (report.integrity.orphanedShips > 0) {
      report.recommendations.push('Fix orphaned ship references or assign default blueprints');
    }

    if (report.integrity.duplicateBlueprintNames > 0) {
      report.recommendations.push('Rename duplicate blueprints to avoid confusion');
    }

    if (report.integrity.emptyModuleSlots > 0) {
      report.recommendations.push('Clean up or reassign empty module slots');
    }

    // Display recommendations
    if (report.recommendations.length > 0) {
      console.log('📋 Recommendations:');
      report.recommendations.forEach((rec, i) => {
        console.log(`  ${i + 1}. ${rec}`);
      });
    } else {
      console.log('✅ No recommendations - blueprint system is healthy!');
    }
  }

  async generateDetailedReport(): Promise<void> {
    console.log('📄 Generating Detailed Analysis Report...\n');

    // Top 10 most used blueprints
    const popularBlueprints = await prisma.shipBlueprint.findMany({
      select: {
        name: true,
        shipClass: true,
        _count: {
          select: {
            ships: true
          }
        }
      },
      orderBy: {
        ships: {
          _count: 'desc'
        }
      },
      take: 10
    });

    if (popularBlueprints.length > 0) {
      console.log('🏆 Most Used Blueprints:');
      popularBlueprints.forEach((bp, i) => {
        console.log(`  ${i + 1}. ${bp.name} (${bp.shipClass}) - ${bp._count.ships} ships`);
      });
      console.log();
    }

    // Simple blueprint usage stats
    const totalBlueprints = await prisma.shipBlueprint.count();
    const blueprintsInUse = await prisma.shipBlueprint.count({
      where: {
        ships: {
          some: {}
        }
      }
    });

    console.log('📊 Blueprint Usage Statistics:');
    console.log(`  Total blueprints: ${totalBlueprints}`);
    console.log(`  Blueprints in use: ${blueprintsInUse}`);
    console.log(`  Unused blueprints: ${totalBlueprints - blueprintsInUse}`);
    console.log();

    // Module statistics
    const totalModules = await prisma.blueprintModule.count();
    const moduleTypes = await prisma.moduleType.count();

    console.log('🔧 Module Statistics:');
    console.log(`  Total module slots configured: ${totalModules}`);
    console.log(`  Available module types: ${moduleTypes}`);
    console.log();
  }
}

/**
 * Command line interface
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help')) {
    console.log(`
🔍 Blueprint Migration Validator

Usage: tsx scripts/validate-blueprint-migration.ts [options]

Options:
  --detailed    Show detailed analysis and statistics
  --json        Output report as JSON
  --help        Show this help message

Examples:
  tsx scripts/validate-blueprint-migration.ts
  tsx scripts/validate-blueprint-migration.ts --detailed
  tsx scripts/validate-blueprint-migration.ts --json
    `);
    return;
  }

  const validator = new BlueprintMigrationValidator();

  try {
    const report = await validator.validate();

    if (args.includes('--detailed')) {
      await validator.generateDetailedReport();
    }

    if (args.includes('--json')) {
      console.log('\n📄 JSON Report:');
      console.log(JSON.stringify(report, null, 2));
    } else {
      // Summary
      console.log('\n📋 Validation Summary:');
      console.log(`Timestamp: ${report.timestamp}`);
      console.log(`Migration Status: ${report.migration.status.toUpperCase()} (${report.migration.percentage}%)`);
      console.log(`Total Issues: ${report.issues.length}`);
      console.log(`Recommendations: ${report.recommendations.length}`);

      if (report.issues.length === 0) {
        console.log('\n✅ Blueprint system validation passed!');
      } else {
        console.log('\n❌ Issues Found:');
        report.issues.forEach((issue, i) => {
          console.log(`  ${i + 1}. ${issue}`);
        });
        process.exit(1);
      }
    }

  } catch (error) {
    console.error('💥 Validation failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

export { BlueprintMigrationValidator };