#!/usr/bin/env tsx

/**
 * Comprehensive validation script for orthogonal hyperlane pathfinding
 * Verifies that all routes use only 4-directional movement and maintain flight compatibility
 */

import prisma from '../src/lib/prisma';

interface HyperlaneField {
  sectorX: number;
  sectorY: number;
  fieldX: number;
  fieldY: number;
  laneName: string;
  laneColor: string;
  laneType: string;
}

interface PathSegment {
  from: { x: number; y: number };
  to: { x: number; y: number };
  direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'DIAGONAL';
}

/**
 * Convert sector field to galaxy coordinates
 */
function toGalaxyCoords(sectorField: HyperlaneField): { x: number; y: number } {
  const FIELDS_PER_SECTOR = 20;
  return {
    x: (sectorField.sectorX - 1) * FIELDS_PER_SECTOR + sectorField.fieldX,
    y: (sectorField.sectorY - 1) * FIELDS_PER_SECTOR + sectorField.fieldY
  };
}

/**
 * Determine movement direction between two adjacent points
 */
function getMovementDirection(from: { x: number; y: number }, to: { x: number; y: number }): string {
  const dx = to.x - from.x;
  const dy = to.y - from.y;

  // Check for diagonal movement (invalid)
  if (Math.abs(dx) > 0 && Math.abs(dy) > 0) {
    return 'DIAGONAL';
  }

  // Check for orthogonal movement (valid)
  if (dx === 1 && dy === 0) return 'RIGHT';
  if (dx === -1 && dy === 0) return 'LEFT';
  if (dx === 0 && dy === 1) return 'DOWN';
  if (dx === 0 && dy === -1) return 'UP';

  // Check for gaps (should not happen in continuous paths)
  if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
    return `GAP_${Math.abs(dx)}_${Math.abs(dy)}`;
  }

  return 'UNKNOWN';
}

/**
 * Analyze path segments for a hyperlane route
 */
function analyzeHyperlanePath(fields: HyperlaneField[]): {
  totalSegments: number;
  orthogonalSegments: number;
  diagonalSegments: number;
  gapSegments: number;
  segments: PathSegment[];
  isFullyOrthogonal: boolean;
} {
  if (fields.length < 2) {
    return {
      totalSegments: 0,
      orthogonalSegments: 0,
      diagonalSegments: 0,
      gapSegments: 0,
      segments: [],
      isFullyOrthogonal: true
    };
  }

  // Convert to galaxy coordinates and sort by position for proper path analysis
  const galaxyCoords = fields.map(field => ({
    ...toGalaxyCoords(field),
    field
  }));

  // Sort by position to create a continuous path
  galaxyCoords.sort((a, b) => {
    if (a.x !== b.x) return a.x - b.x;
    return a.y - b.y;
  });

  const segments: PathSegment[] = [];
  let orthogonalCount = 0;
  let diagonalCount = 0;
  let gapCount = 0;

  for (let i = 0; i < galaxyCoords.length - 1; i++) {
    const from = { x: galaxyCoords[i].x, y: galaxyCoords[i].y };
    const to = { x: galaxyCoords[i + 1].x, y: galaxyCoords[i + 1].y };
    const direction = getMovementDirection(from, to);

    const segment: PathSegment = {
      from,
      to,
      direction: direction as any
    };

    segments.push(segment);

    if (['UP', 'DOWN', 'LEFT', 'RIGHT'].includes(direction)) {
      orthogonalCount++;
    } else if (direction === 'DIAGONAL') {
      diagonalCount++;
    } else if (direction.startsWith('GAP_')) {
      gapCount++;
    }
  }

  return {
    totalSegments: segments.length,
    orthogonalSegments: orthogonalCount,
    diagonalSegments: diagonalCount,
    gapSegments: gapCount,
    segments,
    isFullyOrthogonal: diagonalCount === 0 && gapCount === 0
  };
}

/**
 * Simulate flight path traversal using only orthogonal movement
 */
function simulateFlightPath(fields: HyperlaneField[]): {
  canTraverse: boolean;
  stuckAt?: { x: number; y: number };
  invalidMoves: number;
} {
  if (fields.length === 0) {
    return { canTraverse: true, invalidMoves: 0 };
  }

  const galaxyCoords = fields.map(field => toGalaxyCoords(field));
  const path = new Set(galaxyCoords.map(coord => `${coord.x},${coord.y}`));

  let invalidMoves = 0;
  let currentPos = galaxyCoords[0];
  const target = galaxyCoords[galaxyCoords.length - 1];
  const visited = new Set<string>();
  const maxSteps = galaxyCoords.length * 3; // Prevent infinite loops

  let steps = 0;
  while (steps < maxSteps && (currentPos.x !== target.x || currentPos.y !== target.y)) {
    const currentKey = `${currentPos.x},${currentPos.y}`;

    if (visited.has(currentKey)) {
      return {
        canTraverse: false,
        stuckAt: currentPos,
        invalidMoves
      };
    }
    visited.add(currentKey);

    // Try orthogonal moves in order: RIGHT, DOWN, LEFT, UP
    const moves = [
      { x: currentPos.x + 1, y: currentPos.y, dir: 'RIGHT' },
      { x: currentPos.x, y: currentPos.y + 1, dir: 'DOWN' },
      { x: currentPos.x - 1, y: currentPos.y, dir: 'LEFT' },
      { x: currentPos.x, y: currentPos.y - 1, dir: 'UP' }
    ];

    let moved = false;
    for (const move of moves) {
      const moveKey = `${move.x},${move.y}`;
      if (path.has(moveKey)) {
        currentPos = { x: move.x, y: move.y };
        moved = true;
        break;
      }
    }

    if (!moved) {
      invalidMoves++;
      return {
        canTraverse: false,
        stuckAt: currentPos,
        invalidMoves
      };
    }

    steps++;
  }

  return {
    canTraverse: currentPos.x === target.x && currentPos.y === target.y,
    invalidMoves
  };
}

/**
 * Main validation function
 */
async function validateOrthogonalHyperlanes(): Promise<void> {
  console.log('🔍 Starting orthogonal hyperlane validation...');
  console.log('');

  // Fetch all hyperlane fields grouped by route
  const hyperlaneFields = await prisma.sectorField.findMany({
    where: {
      isHyperlane: true
    },
    orderBy: [
      { laneName: 'asc' },
      { sectorId: 'asc' },
      { fieldX: 'asc' },
      { fieldY: 'asc' }
    ]
  });

  if (hyperlaneFields.length === 0) {
    console.log('❌ No hyperlane fields found in database');
    console.log('💡 Run the hyperlane generation script first');
    return;
  }

  console.log(`📊 Found ${hyperlaneFields.length} hyperlane fields total`);
  console.log('');

  // Group by route name
  const routeGroups = new Map<string, HyperlaneField[]>();

  for (const field of hyperlaneFields) {
    const routeName = field.laneName || 'Unknown Route';
    if (!routeGroups.has(routeName)) {
      routeGroups.set(routeName, []);
    }

    // Find sector coordinates
    const sector = await prisma.sector.findUnique({
      where: { id: field.sectorId }
    });

    if (sector) {
      routeGroups.get(routeName)!.push({
        sectorX: sector.x,
        sectorY: sector.y,
        fieldX: field.fieldX,
        fieldY: field.fieldY,
        laneName: field.laneName || 'Unknown',
        laneColor: field.laneColor || '#ffffff',
        laneType: field.laneType || 'UNKNOWN'
      });
    }
  }

  console.log(`🛤️  Found ${routeGroups.size} unique routes:`);
  Array.from(routeGroups.keys()).forEach(name => {
    console.log(`   • ${name} (${routeGroups.get(name)!.length} fields)`);
  });
  console.log('');

  // Validate each route
  let totalRoutes = 0;
  let fullyOrthogonalRoutes = 0;
  let totalDiagonals = 0;
  let totalGaps = 0;
  let flightCompatibleRoutes = 0;

  const detailedResults: Array<{
    name: string;
    analysis: ReturnType<typeof analyzeHyperlanePath>;
    flight: ReturnType<typeof simulateFlightPath>;
    fields: number;
  }> = [];

  for (const [routeName, fields] of routeGroups) {
    totalRoutes++;

    console.log(`🔎 Analyzing route: ${routeName}`);

    const pathAnalysis = analyzeHyperlanePath(fields);
    const flightSimulation = simulateFlightPath(fields);

    console.log(`   📏 Path segments: ${pathAnalysis.totalSegments}`);
    console.log(`   ✅ Orthogonal moves: ${pathAnalysis.orthogonalSegments}`);
    console.log(`   ❌ Diagonal moves: ${pathAnalysis.diagonalSegments}`);
    console.log(`   ⚠️  Gap segments: ${pathAnalysis.gapSegments}`);
    console.log(`   🛫 Flight compatible: ${flightSimulation.canTraverse ? 'YES' : 'NO'}`);

    if (pathAnalysis.isFullyOrthogonal) {
      fullyOrthogonalRoutes++;
      console.log(`   ✨ Route is fully orthogonal!`);
    } else {
      console.log(`   🚨 Route contains non-orthogonal movement!`);
    }

    if (flightSimulation.canTraverse) {
      flightCompatibleRoutes++;
    } else {
      console.log(`   🚫 Flight simulation failed at (${flightSimulation.stuckAt?.x || '?'},${flightSimulation.stuckAt?.y || '?'})`);
    }

    totalDiagonals += pathAnalysis.diagonalSegments;
    totalGaps += pathAnalysis.gapSegments;

    detailedResults.push({
      name: routeName,
      analysis: pathAnalysis,
      flight: flightSimulation,
      fields: fields.length
    });

    console.log('');
  }

  // Summary Report
  console.log('📋 VALIDATION SUMMARY');
  console.log('====================');
  console.log(`📊 Total routes analyzed: ${totalRoutes}`);
  console.log(`✅ Fully orthogonal routes: ${fullyOrthogonalRoutes}/${totalRoutes} (${Math.round(fullyOrthogonalRoutes/totalRoutes*100)}%)`);
  console.log(`🛫 Flight compatible routes: ${flightCompatibleRoutes}/${totalRoutes} (${Math.round(flightCompatibleRoutes/totalRoutes*100)}%)`);
  console.log(`❌ Total diagonal segments found: ${totalDiagonals}`);
  console.log(`⚠️  Total gap segments found: ${totalGaps}`);
  console.log('');

  // Success Metrics
  const isFullyOrthogonal = totalDiagonals === 0 && totalGaps === 0;
  const isFlightCompatible = flightCompatibleRoutes === totalRoutes;

  if (isFullyOrthogonal && isFlightCompatible) {
    console.log('🎉 SUCCESS: All hyperlane routes use orthogonal movement and are flight compatible!');
    console.log('✅ Implementation meets all requirements from the plan');
  } else {
    console.log('❌ VALIDATION FAILED:');
    if (!isFullyOrthogonal) {
      console.log(`   • Found ${totalDiagonals} diagonal connections and ${totalGaps} gaps`);
      console.log(`   • Routes with issues: ${totalRoutes - fullyOrthogonalRoutes}`);
    }
    if (!isFlightCompatible) {
      console.log(`   • ${totalRoutes - flightCompatibleRoutes} routes are not flight compatible`);
    }
  }

  console.log('');

  // Detailed route breakdown for failed routes
  const failedRoutes = detailedResults.filter(r => !r.analysis.isFullyOrthogonal || !r.flight.canTraverse);
  if (failedRoutes.length > 0) {
    console.log('🔍 FAILED ROUTES DETAILS:');
    failedRoutes.forEach(route => {
      console.log(`   ${route.name}:`);
      if (!route.analysis.isFullyOrthogonal) {
        console.log(`     - ${route.analysis.diagonalSegments} diagonal segments`);
        console.log(`     - ${route.analysis.gapSegments} gap segments`);
      }
      if (!route.flight.canTraverse) {
        console.log(`     - Flight stuck at (${route.flight.stuckAt?.x || '?'},${route.flight.stuckAt?.y || '?'})`);
      }
    });
    console.log('');
  }

  console.log('✨ Orthogonal hyperlane validation complete!');
}

// Execute validation
validateOrthogonalHyperlanes()
  .catch((error) => {
    console.error('❌ Validation failed with error:', error);
  })
  .finally(() => {
    prisma.$disconnect();
  });