#!/usr/bin/env tsx
import { PrismaClient } from '@prisma/client';
import { defaultBlueprintsService } from '../src/services/defaultBlueprintsService';

const prisma = new PrismaClient();

async function createDefaultBlueprints() {
  try {
    console.log('🚀 Creating default blueprints from existing ShipTypes...\n');

    // Ensure we have an admin player (ID 1) for default blueprints
    let adminPlayer = await prisma.player.findUnique({
      where: { id: 1 },
      include: { user: true },
    });

    if (!adminPlayer) {
      console.log('⚠️  Admin player (ID 1) not found. Default blueprints need an owner.');
      console.log('   Please ensure an admin player exists before running this script.');
      process.exit(1);
    }

    console.log(`📋 Using admin player: ${adminPlayer.user.username} (ID: ${adminPlayer.id})\n`);

    // Create all default blueprints
    const result = await defaultBlueprintsService.createAllDefaultBlueprints();

    // Print summary
    console.log(`\n🎯 Summary:`);
    console.log(`   ✅ Created: ${result.created} blueprints`);
    console.log(`   ⏭️  Skipped: ${result.skipped} blueprints`);
    console.log(`   ❌ Errors: ${result.errors.length}`);

    if (result.errors.length > 0) {
      console.log(`\n🚨 Errors encountered:`);
      result.errors.forEach(error => console.log(`   - ${error}`));
    }

    // Show created blueprints
    if (result.created > 0) {
      console.log(`\n📦 Default blueprints created:`);
      const defaultBlueprints = await prisma.shipBlueprint.findMany({
        where: {
          playerId: adminPlayer.id,
          isPublic: true,
          name: { endsWith: '(Standard)' },
        },
        select: {
          id: true,
          name: true,
          shipClass: true,
          totalHullPoints: true,
          totalDamage: true,
          totalShieldStrength: true,
          totalCostCredits: true,
          modules: {
            include: {
              moduleType: {
                select: {
                  name: true,
                  category: true,
                },
              },
            },
          },
        },
      });

      for (const blueprint of defaultBlueprints) {
        console.log(`   📋 ${blueprint.name}`);
        console.log(`      Class: ${blueprint.shipClass} | Hull: ${blueprint.totalHullPoints} | Damage: ${blueprint.totalDamage} | Shields: ${blueprint.totalShieldStrength}`);
        console.log(`      Cost: ${blueprint.totalCostCredits.toLocaleString()} Credits`);
        console.log(`      Modules: ${blueprint.modules.length}/10`);

        const modulesByCategory = blueprint.modules.reduce((acc, m) => {
          const category = m.moduleType.category;
          if (!acc[category]) acc[category] = [];
          acc[category].push(m.moduleType.name);
          return acc;
        }, {} as Record<string, string[]>);

        Object.entries(modulesByCategory).forEach(([category, modules]) => {
          console.log(`        ${category}: ${modules.join(', ')}`);
        });
        console.log('');
      }
    }

    console.log('✨ Default blueprint creation complete!\n');

  } catch (error) {
    console.error('❌ Error creating default blueprints:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createDefaultBlueprints();