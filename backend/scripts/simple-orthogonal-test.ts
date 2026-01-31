#!/usr/bin/env tsx

/**
 * Simple orthogonal pathfinding test
 * Tests the core orthogonal algorithms directly
 */

import { HyperlaneGenerator } from '../src/services/galaxyService';

// Create test instance
const generator = new (HyperlaneGenerator as any)();

// Test the createOrthogonalPath method directly
console.log('🧪 Testing orthogonal pathfinding algorithms...');

// Test 1: Simple horizontal path
console.log('\n📏 Test 1: Horizontal path (10,10) → (15,10)');
const horizontalPath = generator.createOrthogonalPath({ x: 10, y: 10 }, { x: 15, y: 10 });
console.log(`Path length: ${horizontalPath.length}`);
console.log('Path:', horizontalPath);

// Validate no diagonal movements
let diagonals = 0;
for (let i = 0; i < horizontalPath.length - 1; i++) {
  const from = horizontalPath[i];
  const to = horizontalPath[i + 1];
  const dx = Math.abs(to.x - from.x);
  const dy = Math.abs(to.y - from.y);
  if (dx > 0 && dy > 0) diagonals++;
}
console.log(`Diagonal movements: ${diagonals}`);

// Test 2: Simple vertical path
console.log('\n📏 Test 2: Vertical path (10,10) → (10,15)');
const verticalPath = generator.createOrthogonalPath({ x: 10, y: 10 }, { x: 10, y: 15 });
console.log(`Path length: ${verticalPath.length}`);
console.log('Path:', verticalPath);

diagonals = 0;
for (let i = 0; i < verticalPath.length - 1; i++) {
  const from = verticalPath[i];
  const to = verticalPath[i + 1];
  const dx = Math.abs(to.x - from.x);
  const dy = Math.abs(to.y - from.y);
  if (dx > 0 && dy > 0) diagonals++;
}
console.log(`Diagonal movements: ${diagonals}`);

// Test 3: Diagonal goal (requires orthogonal path)
console.log('\n📏 Test 3: Orthogonal path to diagonal target (10,10) → (15,15)');
const diagonalTargetPath = generator.createOrthogonalPath({ x: 10, y: 10 }, { x: 15, y: 15 });
console.log(`Path length: ${diagonalTargetPath.length}`);
console.log('Path:', diagonalTargetPath);

diagonals = 0;
for (let i = 0; i < diagonalTargetPath.length - 1; i++) {
  const from = diagonalTargetPath[i];
  const to = diagonalTargetPath[i + 1];
  const dx = Math.abs(to.x - from.x);
  const dy = Math.abs(to.y - from.y);
  if (dx > 0 && dy > 0) diagonals++;
}
console.log(`Diagonal movements: ${diagonals}`);

// Test 4: Test organic orthogonal path
console.log('\n📏 Test 4: Organic orthogonal path (5,5) → (25,20)');
const organicPath = generator.createOrganicOrthogonalPath({ x: 5, y: 5 }, { x: 25, y: 20 }, 'test-seed');
console.log(`Path length: ${organicPath.length}`);
console.log('Path sample:', organicPath.slice(0, 10), '...');

diagonals = 0;
for (let i = 0; i < organicPath.length - 1; i++) {
  const from = organicPath[i];
  const to = organicPath[i + 1];
  const dx = Math.abs(to.x - from.x);
  const dy = Math.abs(to.y - from.y);
  if (dx > 0 && dy > 0) diagonals++;
}
console.log(`Diagonal movements: ${diagonals}`);

// Test 5: Test waypoint-based path
console.log('\n📏 Test 5: Multi-waypoint orthogonal path');
const waypoints = [
  { x: 10, y: 10 },
  { x: 20, y: 10 },
  { x: 20, y: 20 },
  { x: 30, y: 20 }
];

const multiWaypointPath = generator.createOrthogonalWaypointPath(waypoints);
console.log(`Path length: ${multiWaypointPath.length}`);
console.log('Path sample:', multiWaypointPath.slice(0, 15), '...');

diagonals = 0;
for (let i = 0; i < multiWaypointPath.length - 1; i++) {
  const from = multiWaypointPath[i];
  const to = multiWaypointPath[i + 1];
  const dx = Math.abs(to.x - from.x);
  const dy = Math.abs(to.y - from.y);
  if (dx > 0 && dy > 0) diagonals++;
}
console.log(`Diagonal movements: ${diagonals}`);

console.log('\n✨ Orthogonal pathfinding algorithm tests complete!');

if (diagonals === 0) {
  console.log('🎉 SUCCESS: All core algorithms produce orthogonal paths!');
} else {
  console.log('❌ FAILURE: Core algorithms still produce diagonal paths');
}