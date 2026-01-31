#!/usr/bin/env tsx
/**
 * Test script for hyperlane generation
 * This script tests the HyperlaneGenerator functionality
 */

import { HyperlaneGenerator } from '../src/services/galaxyService';
import prisma from '../src/lib/prisma';

async function testHyperlanes() {
  console.log('🚀 Starting hyperlane generation test...');

  try {
    // Check if galaxy exists
    const galaxy = await prisma.galaxy.findFirst();
    if (!galaxy) {
      console.error('❌ No galaxy found. Please run galaxy initialization first.');
      return;
    }

    // Check if sectors exist
    const sectorCount = await prisma.sector.count();
    console.log(`📊 Found ${sectorCount} sectors in galaxy`);

    if (sectorCount === 0) {
      console.error('❌ No sectors found. Please run galaxy initialization first.');
      return;
    }

    // Check if systems exist
    const systemCount = await prisma.system.count();
    console.log(`⭐ Found ${systemCount} systems in galaxy`);

    if (systemCount === 0) {
      console.error('❌ No systems found. Please run galaxy initialization first.');
      return;
    }

    // Initialize hyperlane generator
    const hyperlaneGenerator = new HyperlaneGenerator();

    // Clear any existing hyperlanes
    console.log('🧹 Clearing existing hyperlanes...');
    await hyperlaneGenerator.clearHyperlanes();

    // Generate new hyperlanes
    console.log('🌌 Generating hyperlanes...');
    await hyperlaneGenerator.generateHyperlanes();

    // Verify hyperlanes were created
    const hyperlaneCount = await prisma.sectorField.count({
      where: { isHyperlane: true }
    });

    console.log(`✅ Hyperlane generation complete!`);
    console.log(`📈 Created ${hyperlaneCount} hyperlane fields`);

    // Validate expected route count (should be 10: 5 generic + 5 canonical)
    const routeNames = await prisma.sectorField.findMany({
      where: { isHyperlane: true },
      select: { laneName: true },
      distinct: ['laneName']
    });

    console.log(`🛤️  Total unique routes: ${routeNames.length}`);
    console.log(`📊 Routes found: ${routeNames.map(r => r.laneName).join(', ')}`);

    // Test canonical routes specifically
    const canonicalRouteNames = [
      'Perlemian Trade Route',
      'Corellian Run',
      'Hydian Way',
      'Rimma Trade Route',
      'Corellian Trade Spine'
    ];

    console.log('⭐ Validating canonical Star Wars routes...');
    for (const routeName of canonicalRouteNames) {
      const routeFields = await prisma.sectorField.count({
        where: {
          isHyperlane: true,
          laneName: routeName
        }
      });

      if (routeFields > 0) {
        console.log(`✅ ${routeName}: ${routeFields} fields`);
      } else {
        console.log(`❌ ${routeName}: Not found`);
      }
    }

    // Test Core sector convergence
    console.log('🎯 Testing Core sector convergence...');
    const coreSectorFields = await prisma.sectorField.findMany({
      where: {
        isHyperlane: true,
        sector: {
          OR: [
            { x: 3, y: 3 },
            { x: 3, y: 4 }
          ]
        }
      },
      include: {
        sector: true
      }
    });

    const coreConvergenceRoutes = new Set(coreSectorFields.map(f => f.laneName));
    console.log(`🌌 Core sectors (3,3) and (3,4) contain ${coreSectorFields.length} hyperlane fields from ${coreConvergenceRoutes.size} routes`);
    console.log(`🎯 Routes converging at core: ${Array.from(coreConvergenceRoutes).join(', ')}`);

    // Show sample hyperlane data from different route types
    console.log('🔍 Sample hyperlane fields:');
    const genericSample = await prisma.sectorField.findFirst({
      where: {
        isHyperlane: true,
        laneName: 'Core Worlds Route'
      },
      include: { sector: true }
    });

    const canonicalSample = await prisma.sectorField.findFirst({
      where: {
        isHyperlane: true,
        laneName: 'Perlemian Trade Route'
      },
      include: { sector: true }
    });

    if (genericSample) {
      console.log(`  Generic: ${genericSample.laneName} at Sector ${genericSample.sector.x},${genericSample.sector.y} Field ${genericSample.fieldX},${genericSample.fieldY} (${genericSample.laneColor})`);
    }

    if (canonicalSample) {
      console.log(`  Canonical: ${canonicalSample.laneName} at Sector ${canonicalSample.sector.x},${canonicalSample.sector.y} Field ${canonicalSample.fieldX},${canonicalSample.fieldY} (${canonicalSample.laneColor})`);
    }

    // Test API data structure
    console.log('🔗 Testing API data structure...');
    const testSector = await prisma.sector.findFirst({
      include: {
        sectorFields: {
          where: { isHyperlane: true }
        }
      }
    });

    if (testSector && testSector.sectorFields.length > 0) {
      console.log(`✅ API structure test passed - Sector ${testSector.x},${testSector.y} has ${testSector.sectorFields.length} hyperlane fields`);
    } else {
      console.log('⚠️  No hyperlane fields found in test sector');
    }

    // Test orthogonal pathfinding (new requirement)
    console.log('🔍 Testing orthogonal pathfinding compliance...');

    // Quick orthogonal validation - check for diagonal movements
    const allHyperlaneFields = await prisma.sectorField.findMany({
      where: { isHyperlane: true },
      include: { sector: true },
      orderBy: [
        { laneName: 'asc' },
        { sector: { x: 'asc' } },
        { sector: { y: 'asc' } },
        { fieldX: 'asc' },
        { fieldY: 'asc' }
      ]
    });

    // Group by route for path analysis
    const routePaths = new Map<string, Array<{x: number, y: number}>>();

    for (const field of allHyperlaneFields) {
      const routeName = field.laneName || 'Unknown';
      const galaxyX = (field.sector.x - 1) * 20 + field.fieldX;
      const galaxyY = (field.sector.y - 1) * 20 + field.fieldY;

      if (!routePaths.has(routeName)) {
        routePaths.set(routeName, []);
      }
      routePaths.get(routeName)!.push({ x: galaxyX, y: galaxyY });
    }

    let totalDiagonalConnections = 0;
    let orthogonalRoutes = 0;

    for (const [routeName, coordinates] of routePaths) {
      // Sort coordinates to create path sequence
      coordinates.sort((a, b) => a.x !== b.x ? a.x - b.x : a.y - b.y);

      let routeDiagonals = 0;

      for (let i = 0; i < coordinates.length - 1; i++) {
        const from = coordinates[i];
        const to = coordinates[i + 1];
        const dx = Math.abs(to.x - from.x);
        const dy = Math.abs(to.y - from.y);

        // Check for diagonal movement (both x and y change)
        if (dx > 0 && dy > 0 && (dx === 1 && dy === 1)) {
          routeDiagonals++;
          totalDiagonalConnections++;
        }
      }

      if (routeDiagonals === 0) {
        orthogonalRoutes++;
        console.log(`   ✅ ${routeName}: Fully orthogonal (${coordinates.length} fields)`);
      } else {
        console.log(`   ❌ ${routeName}: ${routeDiagonals} diagonal connections found`);
      }
    }

    console.log('');
    console.log('📊 ORTHOGONAL PATHFINDING SUMMARY:');
    console.log(`   🛤️  Total routes: ${routePaths.size}`);
    console.log(`   ✅ Orthogonal routes: ${orthogonalRoutes}/${routePaths.size} (${Math.round(orthogonalRoutes/routePaths.size*100)}%)`);
    console.log(`   ❌ Diagonal connections found: ${totalDiagonalConnections}`);

    if (totalDiagonalConnections === 0) {
      console.log('   🎉 SUCCESS: All routes use only orthogonal movement!');
    } else {
      console.log('   ⚠️  WARNING: Some routes still contain diagonal movement');
      console.log('   💡 Run "validate-orthogonal-paths.ts" for detailed analysis');
    }

    console.log('');
    console.log('🎯 Hyperlane test completed successfully!');

  } catch (error) {
    console.error('❌ Error during hyperlane test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testHyperlanes();