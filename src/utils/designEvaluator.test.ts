/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ORIGINAL_DESIGN, ALTERNATIVE_A_DESIGN, cloneDesign } from './houseDesignStore';
import { evaluateDesign } from './designEvaluator';
import { calculateBudgetImpact } from './costSimulator';

test('Original Design achieves high score (>90) and zero structural violations', () => {
  const result = evaluateDesign(ORIGINAL_DESIGN);
  assert.ok(result.overallScore >= 90, `Expected score >= 90, got ${result.overallScore}`);
  assert.equal(result.criticalWarnings.length, 0, 'Original design should have 0 critical warnings');
  assert.equal(result.structuralFeasibilityScore, 25, 'Structural score should be 25/25');
});

test('Overlapping 2nd-floor room over existing footprint triggers CRITICAL hazard', () => {
  const invalidDesign = cloneDesign(ORIGINAL_DESIGN);
  // Put a room at X: 1.0, Y: 3.0 on 2F (directly over existing KT 1)
  invalidDesign.secondFloorRooms.push({
    id: 'illegal_bedroom',
    name: 'Illegal Bedroom over KT 1',
    indonesianName: 'Kamar Ilegal di Atas KT 1',
    floor: '2F',
    x: 1.0,
    y: 3.0,
    width: 2.0,
    depth: 2.0,
    clearWidth: 1.75,
    clearDepth: 1.75,
    area: 4.0,
    status: 'new-2f',
    ventilation: '',
    daylight: '',
    structuralZone: 'new-structural-frame',
    description: '',
  });

  const result = evaluateDesign(invalidDesign);
  assert.ok(result.criticalWarnings.length > 0, 'Should trigger critical warning');
  assert.ok(result.structuralFeasibilityScore < 25, 'Structural score must be penalized');
  assert.ok(result.evaluations.some(e => e.id.includes('structural-prohibited')), 'Should identify structural violation');
});

test('Boundary violation is flagged when room exceeds 9m width or 11m depth', () => {
  const boundaryViolatedDesign = cloneDesign(ORIGINAL_DESIGN);
  boundaryViolatedDesign.groundFloorRooms.push({
    id: 'out_of_bounds_room',
    name: 'Out of bounds room',
    indonesianName: 'Ruang Melebihi Batas',
    floor: 'GF',
    x: 8.5,
    y: 10.0,
    width: 2.0, // 8.5 + 2.0 = 10.5 > 9.0!
    depth: 2.0, // 10.0 + 2.0 = 12.0 > 11.0!
    clearWidth: 1.75,
    clearDepth: 1.75,
    area: 4.0,
    status: 'new-gf',
    ventilation: '',
    daylight: '',
    structuralZone: 'new-structural-frame',
    description: '',
  });

  const result = evaluateDesign(boundaryViolatedDesign);
  assert.ok(result.criticalWarnings.some(w => w.includes('melewati batas lahan')), 'Should warn about boundary violation');
});

test('Budget impact correctly computes zero delta on baseline and positive delta on expansion', () => {
  const baselineCost = calculateBudgetImpact(ORIGINAL_DESIGN);
  assert.equal(baselineCost.costDeltaIdr, 0, 'Baseline cost delta must be 0');
  assert.equal(baselineCost.areaDeltaM2, 0, 'Baseline area delta must be 0');

  const expandedDesign = cloneDesign(ORIGINAL_DESIGN);
  expandedDesign.secondFloorRooms.push({
    id: 'extra_room',
    name: 'Extra Room',
    indonesianName: 'Ruang Tambahan',
    floor: '2F',
    x: 6.0,
    y: 0.0,
    width: 2.0,
    depth: 2.0,
    clearWidth: 1.75,
    clearDepth: 1.75,
    area: 4.0,
    status: 'new-2f',
    ventilation: '',
    daylight: '',
    structuralZone: 'new-structural-frame',
    description: '',
  });

  const expandedCost = calculateBudgetImpact(expandedDesign);
  assert.ok(expandedCost.costDeltaIdr > 0, 'Additional room must increase estimated cost');
  assert.equal(expandedCost.areaDeltaM2, 4.0, 'Area delta should be 4.0 m2');
});
