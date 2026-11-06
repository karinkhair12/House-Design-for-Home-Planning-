/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { 
  deletePolygonVertex, 
  setPolygonEdgeLength, 
  setPolygonVertexCoordinates,
  validatePolygon,
  calculatePolygonArea,
  getVertexAlignmentGuides,
  boxToPolygon
} from './geometryMath';
import { 
  evaluateBathroomStaircaseSwap, 
  calculateWallOpening, 
  getStairwellSlabOpening,
  DEFAULT_STAIRCASE_CONFIG,
  generateStairSteps,
  evaluateDoorClearance,
  DoorData
} from './doorsAndStairs';
import { runUsabilitySimulation, DEFAULT_HUMAN_AVATAR } from './usabilitySimulator';
import { ORIGINAL_DESIGN, cloneDesign } from './houseDesignStore';

test('PART 1.1: Delete polygon vertex reconnects adjacent vertices and updates area', () => {
  // Start with a 5-sided polygon (pentagon)
  // (0,0) -> (4,0) -> (4,2) -> (2,4) -> (0,4)
  const initialPoints = [
    { x: 0, y: 0 },
    { x: 4, y: 0 },
    { x: 4, y: 2 },
    { x: 2, y: 4 },
    { x: 0, y: 4 },
  ];
  const initialArea = calculatePolygonArea(initialPoints);
  assert.equal(initialPoints.length, 5);

  // Delete vertex index 2 (4,2)
  const result = deletePolygonVertex(initialPoints, 2);
  assert.equal(result.success, true);
  assert.equal(result.points.length, 4);
  // Point 1 (4,0) now directly connects to Point 3 (2,4)
  assert.deepEqual(result.points[1], { x: 4, y: 0 });
  assert.deepEqual(result.points[2], { x: 2, y: 4 });

  // Area is recalculated correctly
  const newArea = calculatePolygonArea(result.points);
  assert.ok(newArea > 0 && newArea < initialArea);

  // Attempting to delete when only 3 points remain must be safely blocked
  const triPoints = [
    { x: 0, y: 0 },
    { x: 3, y: 0 },
    { x: 0, y: 3 },
  ];
  const blockedResult = deletePolygonVertex(triPoints, 1);
  assert.equal(blockedResult.success, false);
  assert.ok(blockedResult.message?.includes('minimal harus memiliki 3 titik'));
});

test('PART 1.2: Alignment guides detect horizontal, vertical, and midpoint snapping', () => {
  const refVertices = [
    { x: 1.0, y: 1.0 },
    { x: 5.0, y: 1.0 },
    { x: 5.0, y: 4.0 },
    { x: 1.0, y: 4.0 },
  ];

  // Moving a point near Y=1.0 within tolerance (e.g. Y=1.08) snaps horizontally
  const hSnap = getVertexAlignmentGuides({ x: 3.2, y: 1.08 }, refVertices, {
    tolerance: 0.15,
    snapAxis: true,
    snapEndpoints: true,
    snapMidpoints: true,
  });
  assert.equal(hSnap.snappedPoint.y, 1.0, 'Y snaps to 1.0m');
  assert.ok(hSnap.guides.some(g => g.type === 'horizontal'));

  // Moving near X=5.0 snaps vertically
  const vSnap = getVertexAlignmentGuides({ x: 4.95, y: 2.5 }, refVertices, {
    tolerance: 0.15,
    snapAxis: true,
    snapEndpoints: true,
    snapMidpoints: true,
  });
  assert.equal(vSnap.snappedPoint.x, 5.0, 'X snaps to 5.0m');
  assert.ok(vSnap.guides.some(g => g.type === 'vertical'));

  // Moving near midpoint of (1,1) and (5,1) which is (3,1)
  const midSnap = getVertexAlignmentGuides({ x: 3.05, y: 1.05 }, refVertices, {
    tolerance: 0.15,
    snapAxis: false,
    snapEndpoints: false,
    snapMidpoints: true,
  });
  assert.equal(midSnap.snappedPoint.x, 3.0);
  assert.equal(midSnap.snappedPoint.y, 1.0);
  assert.ok(midSnap.guides.some(g => g.type === 'midpoint'));
});

test('PART 1.3: Numeric edge length and coordinate editing maintains exact dimensions', () => {
  const rect = boxToPolygon(0, 0, 2, 2); // (0,0), (2,0), (2,2), (0,2)

  // Set edge between vertex 0 and 1 to exactly 3.50m
  const modified = setPolygonEdgeLength(rect, 1, 3.50, 'previous');
  assert.equal(modified[1].x, 3.50);
  assert.equal(modified[1].y, 0.0);

  // Set exact vertex coordinates
  const coordUpdated = setPolygonVertexCoordinates(modified, 2, 3.50, 4.00);
  assert.equal(coordUpdated[2].x, 3.50);
  assert.equal(coordUpdated[2].y, 4.00);

  // Validate resulting polygon
  const val = validatePolygon(coordUpdated);
  assert.equal(val.isValid, true);
  assert.equal(val.errors.length, 0);
});

test('PART 4: Option A vs Option B bathroom and staircase swapping evaluation', () => {
  const swapReport = evaluateBathroomStaircaseSwap();

  // Option A (Current baseline)
  assert.ok(swapReport.optionA.staircase.location.includes('Sisi Luar Kanan'));
  assert.ok(swapReport.optionA.guestBath.location.includes('Antara Ruang Tamu'));
  assert.equal(swapReport.optionA.costDeltaIdr, 0);

  // Option B (Swapped)
  assert.ok(swapReport.optionB.staircase.location.includes('Sisi Dalam / Tengah'));
  assert.ok(swapReport.optionB.guestBath.location.includes('Sisi Dinding Luar Kanan'));
  assert.ok(swapReport.optionB.guestBath.ventilation.includes('Jendela bouvenlight alami'));
  assert.equal(swapReport.optionB.costDeltaIdr, 4500000); // + Rp 4.5M plumbing rerouting & beam

  // Both have same staircase geometry (20 steps, Blondel 64cm, slope 32.7 deg)
  assert.equal(swapReport.optionA.staircase.stepCount, 20);
  assert.equal(swapReport.optionB.staircase.stepCount, 20);
  assert.equal(swapReport.optionA.staircase.blondelVal, 64);
  assert.equal(swapReport.optionB.staircase.blondelVal, 64);
});

test('PART 5: Real staircase steps and upper-floor slab opening', () => {
  const steps = generateStairSteps(DEFAULT_STAIRCASE_CONFIG);
  assert.ok(steps.length >= 18, 'Staircase has all calculated treads and landing');

  const landing = steps.find(s => s.isLanding);
  assert.ok(landing !== undefined, 'Intermediate landing exists');
  assert.ok(landing!.z > 1.0 && landing!.z < 2.5, 'Landing is at midpoint elevation');

  const slabOpening = getStairwellSlabOpening(DEFAULT_STAIRCASE_CONFIG);
  assert.equal(slabOpening.x, DEFAULT_STAIRCASE_CONFIG.x);
  assert.equal(slabOpening.y, DEFAULT_STAIRCASE_CONFIG.y);
  assert.equal(slabOpening.width, DEFAULT_STAIRCASE_CONFIG.width);
  assert.equal(slabOpening.depth, DEFAULT_STAIRCASE_CONFIG.depth);
});

test('PART 6: Door placement creates real wall opening and clearance checks', () => {
  const wallStart = { x: 0, y: 0 };
  const wallEnd = { x: 4.0, y: 0 };
  const opening = calculateWallOpening(wallStart, wallEnd, 1.2, 0.9, 2.1, 3.2);

  // Left segment spans from 0 to 1.2
  assert.equal(opening.left.x1, 0);
  assert.equal(opening.left.x2, 1.2);

  // Door opening aperture spans from 1.2 to 2.1
  assert.equal(opening.opening.x1, 1.2);
  assert.equal(opening.opening.x2, 2.1);

  // Right segment spans from 2.1 to 4.0
  assert.equal(opening.right.x1, 2.1);
  assert.equal(opening.right.x2, 4.0);

  // Lintel spans above door height
  assert.equal(opening.lintel.bottomElevation, 2.1);
  assert.equal(opening.lintel.topElevation, 3.2);

  // Test door swing clearance
  const testDoor: DoorData = {
    id: 'test-d',
    name: 'Pintu Uji',
    roomId: 'kt1',
    floor: 'GF',
    wallSide: 'east',
    x: 3.0,
    y: 3.0,
    width: 0.85,
    height: 2.1,
    doorType: 'single-swing',
    swingDirection: 'inward',
    hingeSide: 'left',
    isOpen: false,
    swingAngle: 90,
  };
  const clearCheck = evaluateDoorClearance(testDoor, []);
  assert.equal(clearCheck.isClear, true);
});

test('PART 7: Real-Life Usability simulation evaluates physical clearances', () => {
  const testDesign = cloneDesign(ORIGINAL_DESIGN);
  const report = runUsabilitySimulation(testDesign, DEFAULT_HUMAN_AVATAR);

  assert.ok(report.totalChecks > 0);
  assert.ok(report.overallScore >= 80);
  assert.ok(report.clearanceZones.length > 0, 'Clearance envelopes are generated');

  // Verify wardrobe, dining, and corridor checks exist
  assert.ok(report.issues.some(i => i.category === 'wardrobe'));
  assert.ok(report.issues.some(i => i.category === 'dining'));
  assert.ok(report.issues.some(i => i.category === 'laundry'));
  assert.ok(report.issues.some(i => i.category === 'circulation'));
});
