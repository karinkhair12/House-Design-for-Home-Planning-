/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SITE_BOUNDARY,
  EXISTING_ROOMS,
  RECOMMENDED_GROUND_FLOOR_ROOMS,
  RECOMMENDED_SECOND_FLOOR_ROOMS,
  PROHIBITED_UPPER_ZONE,
  calculateFloorMetrics,
  overlapsExistingFootprint,
} from './architectureData';
import { calculateRabTotals } from './costEstimator';

test('Site boundaries conform to 9m x 11m (99 m2)', () => {
  assert.equal(SITE_BOUNDARY.width, 9.0);
  assert.equal(SITE_BOUNDARY.depth, 11.0);
  assert.equal(SITE_BOUNDARY.totalArea, 99.0);
});

test('Existing building rooms match sketch dimensions exactly', () => {
  const kt1 = EXISTING_ROOMS.find(r => r.id === 'kt1');
  const kt2 = EXISTING_ROOMS.find(r => r.id === 'kt2');
  const rk = EXISTING_ROOMS.find(r => r.id === 'rk');

  assert.ok(kt1, 'KT1 exists');
  assert.equal(kt1.width, 3.0);
  assert.equal(kt1.depth, 3.0);
  assert.equal(kt1.y, 6.0);

  assert.ok(kt2, 'KT2 exists');
  assert.equal(kt2.width, 3.0);
  assert.equal(kt2.depth, 3.5);
  assert.equal(kt2.y, 2.5);

  assert.ok(rk, 'RK exists');
  assert.equal(rk.width, 3.0);
  assert.equal(rk.depth, 6.0);
  assert.equal(rk.y, 3.0);
});

test('Ground floor accommodates exactly 3 bedrooms (KT1, KT2, KT3)', () => {
  const gfBedrooms = RECOMMENDED_GROUND_FLOOR_ROOMS.filter(r => r.id.startsWith('kt'));
  assert.equal(gfBedrooms.length, 3, 'Ground floor must contain 3 bedrooms');
});

test('Second floor accommodates exactly 3 bedrooms (KT4, KT5, KT6) totaling 6 bedrooms', () => {
  const upperBedrooms = RECOMMENDED_SECOND_FLOOR_ROOMS.filter(r => r.id.startsWith('kt'));
  assert.equal(upperBedrooms.length, 3, 'Second floor must contain 3 bedrooms');

  const metrics = calculateFloorMetrics();
  assert.equal(metrics.totalBedrooms, 6, 'Total house bedrooms must equal 6 for the 7 residents');
});

test('Upper floor rooms do not overlap the prohibited existing building footprint (KT1, KT2, RK)', () => {
  for (const room of RECOMMENDED_SECOND_FLOOR_ROOMS) {
    const overlaps = overlapsExistingFootprint(room);
    assert.equal(
      overlaps,
      false,
      `Room ${room.name} (${room.id}) at [X:${room.x}-${room.x + room.width}, Y:${room.y}-${room.y + room.depth}] overlaps existing building footprint!`
    );
  }
});

test('All rooms fit strictly within site boundary (9m x 11m)', () => {
  const allRooms = [...RECOMMENDED_GROUND_FLOOR_ROOMS, ...RECOMMENDED_SECOND_FLOOR_ROOMS];
  for (const r of allRooms) {
    assert.ok(r.x >= 0, `Room ${r.id} x >= 0`);
    assert.ok(r.y >= 0, `Room ${r.id} y >= 0`);
    assert.ok(r.x + r.width <= 9.001, `Room ${r.id} right edge <= 9m`);
    assert.ok(r.y + r.depth <= 11.001, `Room ${r.id} bottom edge <= 11m`);
  }
});

test('RAB calculation yields realistic Indonesian rates and phase totals', () => {
  const rab = calculateRabTotals(8);
  assert.ok(rab.totalEconomy > 150000000, 'Economy total is realistic (> 150 jt IDR)');
  assert.ok(rab.totalMidRange > 220000000, 'Mid-range total is realistic (> 220 jt IDR)');
  assert.ok(rab.totalMidRange > rab.totalEconomy, 'Mid-range is higher than economy');
  assert.ok(rab.phaseTotals[1].economy > 0, 'Phase 1 cost > 0');
  assert.ok(rab.phaseTotals[2].economy > 0, 'Phase 2 cost > 0');
  assert.ok(rab.phaseTotals[3].economy > 0, 'Phase 3 cost > 0');
  assert.ok(rab.phaseTotals[4].economy > 0, 'Phase 4 cost > 0');
});
