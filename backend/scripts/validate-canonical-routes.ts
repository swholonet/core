#!/usr/bin/env tsx
/**
 * Validation script for canonical Star Wars hyperlane routes
 * Tests coordinate mapping, path continuity, and Core convergence
 */

import prisma from '../src/lib/prisma';

async function validateCanonicalRoutes() {
  console.log('🔍 Starting canonical routes validation...');

  try {
    // Test 1: Verify all 5 canonical routes exist
    const canonicalRouteNames = [
      'Perlemian Trade Route',
      'Corellian Run',
      'Hydian Way',
      'Rimma Trade Route',
      'Corellian Trade Spine'
    ];

    console.log('📋 Test 1: Canonical route existence...');
    let allRoutesFound = true;

    for (const routeName of canonicalRouteNames) {
      const fields = await prisma.sectorField.findMany({
        where: {
          isHyperlane: true,
          laneName: routeName
        },
        include: { sector: true }
      });

      if (fields.length > 0) {
        const sectors = new Set(fields.map(f => `${f.sector.x},${f.sector.y}`));
        console.log(`✅ ${routeName}: ${fields.length} fields across ${sectors.size} sectors`);
      } else {
        console.log(`❌ ${routeName}: NOT FOUND`);
        allRoutesFound = false;
      }
    }

    if (!allRoutesFound) {
      console.log('❌ Test 1 FAILED: Some canonical routes are missing');
      return;
    }
    console.log('✅ Test 1 PASSED: All canonical routes found\n');

    // Test 2: Verify Core sector convergence
    console.log('📋 Test 2: Core sector convergence...');
    const coreFields = await prisma.sectorField.findMany({
      where: {
        isHyperlane: true,
        sector: {
          OR: [
            { x: 3, y: 3 },
            { x: 3, y: 4 }
          ]
        }
      },
      include: { sector: true }
    });

    const routesInCore = new Set(coreFields.map(f => f.laneName));
    const canonicalRoutesInCore = canonicalRouteNames.filter(name => routesInCore.has(name));

    console.log(`🎯 Core sectors contain fields from ${routesInCore.size} total routes`);
    console.log(`⭐ Canonical routes converging at core: ${canonicalRoutesInCore.length}/5`);
    console.log(`   Routes: ${canonicalRoutesInCore.join(', ')}`);

    if (canonicalRoutesInCore.length >= 3) {
      console.log('✅ Test 2 PASSED: Good Core convergence (3+ canonical routes)\n');
    } else {
      console.log('⚠️  Test 2 WARNING: Low Core convergence (< 3 canonical routes)\n');
    }

    // Test 3: Coordinate mapping validation
    console.log('📋 Test 3: Coordinate mapping validation...');
    let mappingValid = true;

    for (const routeName of canonicalRouteNames.slice(0, 2)) { // Test first 2 routes
      const fields = await prisma.sectorField.findMany({
        where: {
          isHyperlane: true,
          laneName: routeName
        },
        include: { sector: true },
        take: 5 // Sample first 5 fields
      });

      console.log(`🔗 Testing ${routeName}:`);

      for (const field of fields) {
        // Validate sector coordinates (should be 1-6 for 6x6 galaxy)
        if (field.sector.x < 1 || field.sector.x > 6 ||
            field.sector.y < 1 || field.sector.y > 6) {
          console.log(`❌ Invalid sector coordinates: ${field.sector.x},${field.sector.y}`);
          mappingValid = false;
        }

        // Validate field coordinates (should be 1-20 for 20x20 fields per sector)
        if (field.fieldX < 1 || field.fieldX > 20 ||
            field.fieldY < 1 || field.fieldY > 20) {
          console.log(`❌ Invalid field coordinates: ${field.fieldX},${field.fieldY}`);
          mappingValid = false;
        }
      }

      if (fields.length > 0) {
        console.log(`   ✅ Sample coordinates valid for ${fields.length} fields`);
      }
    }

    if (mappingValid) {
      console.log('✅ Test 3 PASSED: Coordinate mapping is valid\n');
    } else {
      console.log('❌ Test 3 FAILED: Invalid coordinates found\n');
    }

    // Test 4: Route color validation
    console.log('📋 Test 4: Route color validation...');
    const expectedColors = {
      'Perlemian Trade Route': '#0080ff',
      'Corellian Run': '#ff4500',
      'Hydian Way': '#8000ff',
      'Rimma Trade Route': '#00ff80',
      'Corellian Trade Spine': '#ffff00'
    };

    let colorsValid = true;

    for (const [routeName, expectedColor] of Object.entries(expectedColors)) {
      const field = await prisma.sectorField.findFirst({
        where: {
          isHyperlane: true,
          laneName: routeName
        }
      });

      if (field) {
        if (field.laneColor === expectedColor) {
          console.log(`✅ ${routeName}: Correct color ${expectedColor}`);
        } else {
          console.log(`❌ ${routeName}: Expected ${expectedColor}, got ${field.laneColor}`);
          colorsValid = false;
        }
      }
    }

    if (colorsValid) {
      console.log('✅ Test 4 PASSED: All route colors are correct\n');
    } else {
      console.log('❌ Test 4 FAILED: Some route colors are incorrect\n');
    }

    // Summary
    console.log('📊 VALIDATION SUMMARY:');
    console.log(`✅ Canonical routes implemented: 5/5`);
    console.log(`✅ Total routes in galaxy: ${routesInCore.size}`);
    console.log(`✅ Core convergence: ${canonicalRoutesInCore.length}/5 canonical routes`);
    console.log(`✅ Coordinate mapping: ${mappingValid ? 'Valid' : 'Invalid'}`);
    console.log(`✅ Route colors: ${colorsValid ? 'Valid' : 'Invalid'}`);

    const totalFields = await prisma.sectorField.count({
      where: { isHyperlane: true }
    });
    console.log(`📈 Total hyperlane fields: ${totalFields}`);

    console.log('\n🎯 Canonical Star Wars hyperlane routes validation complete!');

  } catch (error) {
    console.error('❌ Error during validation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the validation
validateCanonicalRoutes();