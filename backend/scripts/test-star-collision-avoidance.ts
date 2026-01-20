#!/usr/bin/env tsx

/**
 * Test script for star collision avoidance system
 *
 * Validates that the new star area calculation system correctly prevents
 * planets from being seeded inside star areas or too close to stars.
 */

import { PrismaClient, SystemType } from '@prisma/client';
import {
  calculateStarAreaSize,
  getStarExclusionZone,
  isPositionSafeForPlanet,
  calculateBinaryStarAreas,
  extractSystemTypeId
} from '../src/utils/starAreaCalculation';

const prisma = new PrismaClient();

/**
 * Test star area calculations for various system types
 */
function testStarAreaCalculations() {
  console.log('🧪 Testing Star Area Calculations\n');

  const testSystems = [
    { type: SystemType.SYS_1067, gridSize: 20, expectedSize: 2 }, // Very small
    { type: SystemType.SYS_1049, gridSize: 30, expectedSize: 5 }, // Medium
    { type: SystemType.SYS_1053, gridSize: 35, expectedSize: 6 }, // Large
    { type: SystemType.SYS_1041, gridSize: 40, expectedSize: 10 }, // Very large
  ];

  testSystems.forEach(({ type, gridSize, expectedSize }) => {
    const starAreaSize = calculateStarAreaSize(type, gridSize);
    const exclusionZone = getStarExclusionZone(type, gridSize);
    const typeId = extractSystemTypeId(type);

    console.log(`⭐ System ${typeId} (grid: ${gridSize}x${gridSize}):`);
    console.log(`   Star area: ${starAreaSize}x${starAreaSize} (expected ~${expectedSize})`);
    console.log(`   Exclusion radius: ${exclusionZone.totalRadius} (star: ${exclusionZone.radius} + buffer: ${exclusionZone.bufferZone})`);
    console.log(`   Reserved positions: ${Math.PI * Math.pow(exclusionZone.totalRadius, 2)}`);
    console.log('');
  });
}

/**
 * Test binary star positioning
 */
function testBinaryStarPositioning() {
  console.log('🌟 Testing Binary Star Positioning\n');

  const binaryTests = [
    { type: SystemType.BIN_1001, gridSize: 30, primary: 1049, secondary: 1049 },
    { type: SystemType.BIN_1011, gridSize: 35, primary: 1049, secondary: 1053 },
  ];

  binaryTests.forEach(({ type, gridSize, primary, secondary }) => {
    const typeId = extractSystemTypeId(type);
    const binaryAreas = calculateBinaryStarAreas(type, gridSize, primary, secondary);

    console.log(`🌟 Binary System ${typeId} (grid: ${gridSize}x${gridSize}):`);
    console.log(`   Primary (${primary}): Center (${binaryAreas.primary.centerX}, ${binaryAreas.primary.centerY}), Size: ${binaryAreas.primary.gridSize}x${binaryAreas.primary.gridSize}`);
    console.log(`   Secondary (${secondary}): Center (${binaryAreas.secondary.centerX}, ${binaryAreas.secondary.centerY}), Size: ${binaryAreas.secondary.gridSize}x${binaryAreas.secondary.gridSize}`);

    // Check separation distance
    const separation = Math.sqrt(
      Math.pow(binaryAreas.primary.centerX - binaryAreas.secondary.centerX, 2) +
      Math.pow(binaryAreas.primary.centerY - binaryAreas.secondary.centerY, 2)
    );
    const minSeparation = binaryAreas.primary.radius + binaryAreas.secondary.radius + 2;

    console.log(`   Separation: ${separation.toFixed(1)} (minimum: ${minSeparation}) ${separation >= minSeparation ? '✅' : '❌'}`);
    console.log('');
  });
}

/**
 * Test actual system data from database for collision violations
 */
async function testExistingSystemsForCollisions() {
  console.log('🔍 Testing Existing Systems for Star-Planet Collisions\n');

  try {
    // Get a sample of different system types
    const systems = await prisma.system.findMany({
      take: 10,
      include: {
        planets: {
          where: {
            celestialType: 'PLANET' // Only planets, not moons or asteroids
          }
        }
      }
    });

    let totalSystems = 0;
    let systemsWithCollisions = 0;
    let totalPlanets = 0;
    let planetsInCollision = 0;

    for (const system of systems) {
      totalSystems++;
      let systemHasCollisions = false;

      console.log(`🌌 System: ${system.name} (${system.systemType}, ${system.gridSize}x${system.gridSize})`);

      for (const planet of system.planets) {
        totalPlanets++;

        // Check if planet position is safe
        const isSafe = isPositionSafeForPlanet(
          planet.gridX ?? 0,
          planet.gridY ?? 0,
          system.systemType,
          system.gridSize,
          system.primarySystemTypeId ?? undefined,
          system.secondarySystemTypeId ?? undefined
        );

        if (!isSafe) {
          planetsInCollision++;
          systemHasCollisions = true;
          console.log(`   ❌ ${planet.name} at (${planet.gridX}, ${planet.gridY}) - COLLISION WITH STAR!`);
        } else {
          console.log(`   ✅ ${planet.name} at (${planet.gridX}, ${planet.gridY}) - Safe`);
        }
      }

      if (systemHasCollisions) {
        systemsWithCollisions++;
      }

      console.log('');
    }

    console.log('📊 Collision Detection Summary:');
    console.log(`   Systems tested: ${totalSystems}`);
    console.log(`   Systems with collisions: ${systemsWithCollisions}`);
    console.log(`   Total planets tested: ${totalPlanets}`);
    console.log(`   Planets in collision: ${planetsInCollision}`);
    console.log(`   Collision rate: ${totalPlanets > 0 ? ((planetsInCollision / totalPlanets) * 100).toFixed(1) : 0}%`);

    if (planetsInCollision === 0) {
      console.log('   🎉 Perfect! No star-planet collisions detected!');
    } else {
      console.log(`   ⚠️  Found ${planetsInCollision} collision(s) that need to be fixed`);
    }

  } catch (error) {
    console.error('❌ Error testing existing systems:', error);
  }
}

/**
 * Simulate new system generation to verify collision avoidance
 */
async function testNewSystemGeneration() {
  console.log('🏭 Testing New System Generation (Simulation)\n');

  const testCases = [
    { type: SystemType.SYS_1049, gridSize: 30, description: 'Medium Single Star' },
    { type: SystemType.SYS_1041, gridSize: 40, description: 'Large Single Star' },
    { type: SystemType.BIN_1001, gridSize: 30, description: 'Binary System', primary: 1049, secondary: 1049 },
  ];

  testCases.forEach(({ type, gridSize, description, primary, secondary }) => {
    console.log(`🔬 Simulating: ${description} (${type})`);

    // Simulate planet placement attempts
    const occupiedPositions = new Set<string>();
    const gridCenter = Math.floor(gridSize / 2);

    // Reserve star exclusion zones (as implemented in galaxyService)
    const isBinary = primary && secondary;

    if (isBinary) {
      // Binary system simulation
      for (let x = 1; x <= gridSize; x++) {
        for (let y = 1; y <= gridSize; y++) {
          const isSafe = isPositionSafeForPlanet(x, y, type, gridSize, primary, secondary);
          if (!isSafe) {
            occupiedPositions.add(`${x},${y}`);
          }
        }
      }
    } else {
      // Single star simulation
      const exclusionZone = getStarExclusionZone(type, gridSize);
      for (let x = 1; x <= gridSize; x++) {
        for (let y = 1; y <= gridSize; y++) {
          const distance = Math.sqrt(Math.pow(x - gridCenter, 2) + Math.pow(y - gridCenter, 2));
          if (distance <= exclusionZone.totalRadius) {
            occupiedPositions.add(`${x},${y}`);
          }
        }
      }
    }

    const totalPositions = gridSize * gridSize;
    const reservedPositions = occupiedPositions.size;
    const availablePositions = totalPositions - reservedPositions;
    const reservedPercentage = (reservedPositions / totalPositions) * 100;

    console.log(`   Reserved positions: ${reservedPositions}/${totalPositions} (${reservedPercentage.toFixed(1)}%)`);
    console.log(`   Available for planets: ${availablePositions} (${(100 - reservedPercentage).toFixed(1)}%)`);

    // Test if we have enough space for planets
    const expectedPlanets = gridSize <= 20 ? 8 : gridSize <= 30 ? 12 : 15;
    const spaceForPlanets = availablePositions >= expectedPlanets * 2; // 2x safety margin

    console.log(`   Expected planets: ~${expectedPlanets}`);
    console.log(`   Sufficient space: ${spaceForPlanets ? '✅' : '❌'}`);
    console.log('');
  });
}

async function main() {
  console.log('🚀 Star Collision Avoidance Test Suite\n');

  try {
    // Run all tests
    testStarAreaCalculations();
    testBinaryStarPositioning();
    await testExistingSystemsForCollisions();
    await testNewSystemGeneration();

    console.log('✅ All collision avoidance tests completed!');
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();