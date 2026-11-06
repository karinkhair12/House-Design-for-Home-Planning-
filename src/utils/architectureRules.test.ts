/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { 
  calculatePolygonArea, 
  boxToPolygon, 
  calculateBidirectionalResize,
  isPointInPolygon 
} from './geometryMath';
import { 
  evaluateStaircase, 
  evaluateBalcony, 
  analyzeSiteFeasibility, 
  REGIONAL_PROFILES 
} from './architecturalStandards';
import { calculateBuiltInCost, FurnitureItem } from './houseDesignStore';

test('Shoelace formula calculates accurate polygon areas for rectangle and L-shape', () => {
  // 1. Rectangle 3m x 4m = 12m2
  const rect = boxToPolygon(0, 0, 3, 4);
  assert.equal(calculatePolygonArea(rect), 12.0);

  // 2. L-shape polygon: (0,0) -> (4,0) -> (4,2) -> (2,2) -> (2,5) -> (0,5)
  // Area = (2 * 5) + (2 * 2) = 10 + 4 = 14 m2
  const lShape = [
    { x: 0, y: 0 },
    { x: 4, y: 0 },
    { x: 4, y: 2 },
    { x: 2, y: 2 },
    { x: 2, y: 5 },
    { x: 0, y: 5 },
  ];
  assert.equal(calculatePolygonArea(lShape), 14.0);
});

test('Bidirectional resizing: Mode A (Fixed Opposite Edge) properly pins opposite boundary', () => {
  const initial = { x: 2.0, y: 2.0, width: 3.0, depth: 3.0 }; // Right is at 5.0, Bottom is at 5.0

  // 1. Drag West handle by -1.0m (expand to the left)
  const resizedWest = calculateBidirectionalResize(initial, 'w', -1.0, 0, 'fixed-opposite');
  assert.equal(resizedWest.x, 1.0, 'X should move left to 1.0');
  assert.equal(resizedWest.width, 4.0, 'Width should expand to 4.0');
  assert.equal(resizedWest.x + resizedWest.width, 5.0, 'Right boundary remains fixed at 5.0');

  // 2. Drag North handle by +0.5m (shrink from top)
  const resizedNorth = calculateBidirectionalResize(initial, 'n', 0, 0.5, 'fixed-opposite');
  assert.equal(resizedNorth.y, 2.5, 'Y should move down to 2.5');
  assert.equal(resizedNorth.depth, 2.5, 'Depth should decrease to 2.5');
  assert.equal(resizedNorth.y + resizedNorth.depth, 5.0, 'Bottom boundary remains fixed at 5.0');
});

test('Bidirectional resizing: Mode B (Center-Based) resizes symmetrically around center', () => {
  const initial = { x: 2.0, y: 2.0, width: 2.0, depth: 2.0 }; // Center is at (3.0, 3.0)

  // Drag East handle by +0.5m -> width becomes 3.0, x moves to 1.5, center stays at 3.0
  const resizedCenter = calculateBidirectionalResize(initial, 'e', 0.5, 0, 'center-based');
  assert.equal(resizedCenter.width, 3.0);
  assert.equal(resizedCenter.x, 1.5);
  assert.equal(resizedCenter.x + resizedCenter.width / 2, 3.0, 'Center remains at 3.0');
});

test('Staircase assistant computes 2R+G Blondel formula and warns on steep slope', () => {
  // Comfortable residential staircase: Floor-to-floor 3.6m, 20 risers of 18cm, 28cm tread
  const safeStairs = evaluateStaircase({
    floorToFloorHeight: 3.6,
    treadDepth: 0.28,
    riserHeight: 0.18,
    width: 0.90,
    shape: 'l-shape',
    landingDepth: 0.90,
  });

  assert.equal(safeStairs.numberOfRisers, 20);
  // 2 * 18 + 28 = 64cm (in ideal range 60-65cm)
  assert.equal(safeStairs.blondelFormulaValueCm, 64.0);
  assert.equal(safeStairs.isBlondelCompliant, true);
  assert.equal(safeStairs.isSlopeSafe, true);

  // Dangerous steep staircase: Riser 25cm, Tread 20cm -> slope ~51°
  const steepStairs = evaluateStaircase({
    floorToFloorHeight: 3.6,
    treadDepth: 0.20,
    riserHeight: 0.25,
    width: 0.70,
    shape: 'straight',
    landingDepth: 0.80,
  });

  assert.equal(steepStairs.isSlopeSafe, false);
  assert.ok(steepStairs.warnings.some(w => w.includes('terlalu curam')));
  assert.ok(steepStairs.warnings.some(w => w.includes('di bawah standar minimum')));
});

test('Balcony assistant checks railing height and cantilever threshold', () => {
  const safeBalcony = evaluateBalcony({
    width: 3.0,
    depth: 2.0,
    railingHeight: 1.10,
    cantileverDepth: 1.20,
  });
  assert.equal(safeBalcony.isRailingCompliant, true);
  assert.equal(safeBalcony.isCantileverSafe, true);

  const dangerousBalcony = evaluateBalcony({
    width: 3.0,
    depth: 2.0,
    railingHeight: 0.75, // Below 1.0m
    cantileverDepth: 2.20, // Over 1.5m
  });
  assert.equal(dangerousBalcony.isRailingCompliant, false);
  assert.equal(dangerousBalcony.isCantileverSafe, false);
  assert.ok(dangerousBalcony.warnings.some(w => w.includes('railing')));
  assert.ok(dangerousBalcony.warnings.some(w => w.includes('kantilever')));
});

test('Site feasibility checks KDB, GSB setbacks, and city regulatory profiles', () => {
  const jakartaProfile = REGIONAL_PROFILES.find(p => p.id === 'dki-jakarta')!;

  const testGfRooms = [
    { id: 'kt1', x: 0, y: 2.15, width: 3, depth: 3.5, area: 10.5 },
    { id: 'kt2', x: 0, y: 5.65, width: 3, depth: 3.0, area: 9.0 },
    { id: 'rk', x: 3, y: 2.65, width: 3, depth: 6.0, area: 18.0 },
  ];

  const analysis = analyzeSiteFeasibility(9.0, 11.0, testGfRooms, [], jakartaProfile);
  assert.equal(analysis.siteAreaM2, 99.0);
  assert.ok(analysis.actualKdbPercent < jakartaProfile.kdbMaxPercent);
  assert.equal(analysis.isKdbCompliant, true);
  assert.equal(analysis.setbackViolations.length, 0);
});

test('Padang Pariaman regional profile applies Sumbar earthquake guidelines and 2.15m setback', () => {
  const padangProfile = REGIONAL_PROFILES.find(p => p.id === 'padang-pariaman');
  assert.ok(padangProfile, 'Padang Pariaman profile must exist');
  assert.equal(padangProfile.provinceCity, 'Sumatera Barat - Kab. Padang Pariaman');
  assert.equal(padangProfile.kdbMaxPercent, 60);
  assert.equal(padangProfile.klbMax, 1.2);
  assert.equal(padangProfile.frontSetbackMeters, 2.15);

  const testGfRooms = [
    { id: 'kt1', x: 0, y: 2.15, width: 3, depth: 3.5, area: 10.5 },
    { id: 'kt2', x: 0, y: 5.65, width: 3, depth: 3.0, area: 9.0 },
    { id: 'rk', x: 3, y: 2.65, width: 3, depth: 6.0, area: 18.0 },
  ];

  const analysis = analyzeSiteFeasibility(9.0, 11.0, testGfRooms, [], padangProfile);
  assert.equal(analysis.isKdbCompliant, true);
  // Check that seismic mitigation note is included
  const seismicCheck = analysis.preliminaryChecks.find(c => c.category.includes('Gempa Padang Pariaman'));
  assert.ok(seismicCheck, 'Should include Padang Pariaman seismic mitigation check');
  assert.equal(seismicCheck.status, 'good');
});

test('Built-in furniture cost calculator estimates realistic Indonesian materials and labor', () => {
  // Built-in Wardrobe 2.0m width x 0.6m depth x 2.6m height
  const wardrobe: FurnitureItem = {
    id: 'f-test-wardrobe',
    roomId: 'kt1',
    category: 'built-in',
    type: 'builtin-wardrobe',
    name: 'Lemari Tanam Dinding KT 1',
    x: 0.5,
    y: 2.5,
    width: 2.0,
    depth: 0.6,
    height: 2.6,
    rotation: 0,
    mountType: 'integrated',
    internalConfig: { shelves: 4, drawers: 3, hangingSections: 2, doors: 'sliding' },
  };

  const estimate = calculateBuiltInCost(wardrobe);
  assert.ok(estimate.panelAreaM2 > 10, 'Wardrobe should have >10 m2 panel area');
  assert.ok(estimate.plywoodSheets18mm >= 4, 'Should require at least 4 sheets of 18mm plywood');
  assert.ok(estimate.totalEstimatedCost > 4000000, 'Total cost should be realistic (> Rp 4.000.000)');
  assert.ok(estimate.laborCost > 0);
  assert.ok(estimate.hardwareCost > 0);
});

