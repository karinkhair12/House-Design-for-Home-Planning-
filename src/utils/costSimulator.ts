/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { HouseDesignState, ORIGINAL_DESIGN } from './houseDesignStore';
import {
  overlapsExistingFootprint,
  FLOOR_FINISH_OPTIONS,
  WALL_FINISH_OPTIONS,
  ROOF_STYLE_OPTIONS,
  ROOF_MATERIAL_OPTIONS,
  ROOF_WALL_FINISH_OPTIONS,
  DEFAULT_ROOF_CONFIG,
  RoomData,
} from './architectureData';

export interface BudgetImpactResult {
  baselineCostIdr: number;
  currentCostIdr: number;
  costDeltaIdr: number;
  percentChange: number;
  baselineAreaM2: number;
  currentAreaM2: number;
  areaDeltaM2: number;
  breakdown: {
    label: string;
    deltaM2OrUnits: number;
    unitPriceIdr: number;
    subtotalDeltaIdr: number;
  }[];
  economyEstimateIdr: number;
  midRangeEstimateIdr: number;
}

export function calculateMaterialCustomizationDelta(
  design: HouseDesignState,
  tier: 'economy' | 'mid-range' = 'economy'
): {
  floorDeltaIdr: number;
  wallDeltaIdr: number;
  roofDeltaIdr: number;
  gardenCostIdr: number;
  items: {
    label: string;
    deltaM2OrUnits: number;
    unitPriceIdr: number;
    subtotalDeltaIdr: number;
  }[];
} {
  const isEcon = tier === 'economy';
  const allRooms: RoomData[] = [...(design.groundFloorRooms || []), ...(design.secondFloorRooms || [])];
  const items: {
    label: string;
    deltaM2OrUnits: number;
    unitPriceIdr: number;
    subtotalDeltaIdr: number;
  }[] = [];

  // 1. Floor Finish & Rear Garden Flooring Delta
  const baseCeramicMeta = FLOOR_FINISH_OPTIONS.find(f => f.id === 'ceramic')!;
  const baseCeramicRate = isEcon ? baseCeramicMeta.rateEconomyIdr : baseCeramicMeta.rateMidRangeIdr;
  let floorDeltaIdr = 0;
  let gardenCostIdr = 0;
  let customFloorArea = 0;

  for (const r of allRooms) {
    const area = Number((r.width * r.depth).toFixed(2));
    const defaultFinish = r.id === 'rear_service_yard' ? 'grass' : 'ceramic';
    const currentFinish = r.floorFinish || defaultFinish;
    const finishMeta = FLOOR_FINISH_OPTIONS.find(f => f.id === currentFinish) || baseCeramicMeta;
    const finishRate = isEcon ? finishMeta.rateEconomyIdr : finishMeta.rateMidRangeIdr;

    if (r.id === 'rear_service_yard' || currentFinish === 'grass' || currentFinish === 'wood-deck') {
      gardenCostIdr += Math.round(area * finishRate);
    }

    if (currentFinish !== defaultFinish) {
      const defaultMeta = FLOOR_FINISH_OPTIONS.find(f => f.id === defaultFinish) || baseCeramicMeta;
      const defaultRate = isEcon ? defaultMeta.rateEconomyIdr : defaultMeta.rateMidRangeIdr;
      const diff = Math.round(area * (finishRate - defaultRate));
      floorDeltaIdr += diff;
      customFloorArea += area;
    }
  }

  if (floorDeltaIdr !== 0) {
    items.push({
      label: 'Penyesuaian Material Lantai & Rumput Taman Belakang',
      deltaM2OrUnits: Number(customFloorArea.toFixed(1)),
      unitPriceIdr: Math.round(Math.abs(floorDeltaIdr) / Math.max(1, customFloorArea)),
      subtotalDeltaIdr: floorDeltaIdr,
    });
  }

  // 2. Wall Finish & Custom Paint Color Delta
  const baseWallMeta = WALL_FINISH_OPTIONS.find(w => w.id === 'white')!;
  const baseWallRate = isEcon ? baseWallMeta.rateEconomyIdr : baseWallMeta.rateMidRangeIdr;
  let wallDeltaIdr = 0;
  let customWallArea = 0;

  for (const r of allRooms) {
    const wallH = r.wallHeight || (r.floor === '2F' ? 3.0 : 3.2);
    const estWallM2 = Number((2 * (r.width + r.depth) * wallH * 0.75).toFixed(1));
    const finish = r.wallFinish || 'white';
    const hasCustomHex = Boolean(r.wallColor && r.wallColor.toLowerCase() !== '#f8fafc');

    if (finish !== 'white' || hasCustomHex) {
      const meta = WALL_FINISH_OPTIONS.find(w => w.id === finish) || baseWallMeta;
      let rate = isEcon ? meta.rateEconomyIdr : meta.rateMidRangeIdr;
      if (finish === 'white' && hasCustomHex) {
        // Custom tinted paint premium (+Rp 8.000/m2)
        rate += 8000;
      }
      const diff = Math.round(estWallM2 * (rate - baseWallRate));
      wallDeltaIdr += diff;
      customWallArea += estWallM2;
    }
  }

  if (wallDeltaIdr !== 0) {
    items.push({
      label: 'Kustomisasi Warna Cat & Material Dinding Ruangan',
      deltaM2OrUnits: Number(customWallArea.toFixed(1)),
      unitPriceIdr: Math.round(Math.abs(wallDeltaIdr) / Math.max(1, customWallArea)),
      subtotalDeltaIdr: wallDeltaIdr,
    });
  }

  // 3. Roof Model & Roof Wall (Sopi-sopi / Parapet) Delta
  const roof = design.roofConfig || DEFAULT_ROOF_CONFIG;
  const roofAreaM2 = 48; // Base new roof area
  const baseRoofMat = ROOF_MATERIAL_OPTIONS.find(m => m.id === 'spandek-charcoal')!;
  const curRoofMat = ROOF_MATERIAL_OPTIONS.find(m => m.id === roof.material) || baseRoofMat;
  const curStyle = ROOF_STYLE_OPTIONS.find(s => s.id === roof.style) || ROOF_STYLE_OPTIONS[0];
  const curRoofWall = ROOF_WALL_FINISH_OPTIONS.find(w => w.id === roof.wallFinish) || ROOF_WALL_FINISH_OPTIONS[0];

  const baseRoofCost = roofAreaM2 * (isEcon ? baseRoofMat.rateEconomyIdr : baseRoofMat.rateMidRangeIdr);
  const newRoofMatRate = isEcon ? curRoofMat.rateEconomyIdr : curRoofMat.rateMidRangeIdr;
  const pitchFactor = 1 + Math.max(-0.08, Math.min(0.2, (roof.pitchDegrees - 24) * 0.008));
  const parapetExtra = Math.round(Math.max(0, roof.parapetHeight - 0.65) * 28 * 165000);

  const newRoofCost = Math.round(
    roofAreaM2 * newRoofMatRate * curStyle.rateMultiplier * pitchFactor +
      curRoofWall.extraCostIdr +
      parapetExtra
  );
  const roofDeltaIdr = newRoofCost - baseRoofCost;

  if (roofDeltaIdr !== 0) {
    items.push({
      label: `Model ${curStyle.name} & Dinding Atap (${curRoofWall.name})`,
      deltaM2OrUnits: roofAreaM2,
      unitPriceIdr: Math.round(newRoofCost / roofAreaM2),
      subtotalDeltaIdr: roofDeltaIdr,
    });
  }

  return {
    floorDeltaIdr,
    wallDeltaIdr,
    roofDeltaIdr,
    gardenCostIdr,
    items,
  };
}

export function calculateBudgetImpact(
  currentDesign: HouseDesignState,
  tier: 'economy' | 'mid-range' = 'economy'
): BudgetImpactResult {
  const ratePerM2 = tier === 'economy' ? 3850000 : 4650000;
  const bathFixtureRate = tier === 'economy' ? 12500000 : 18000000;

  // Calculate area helper
  const calculateTotalArea = (rooms: { id: string; width: number; depth: number }[]) =>
    rooms
      .filter(r => r.id !== 'carport' && r.id !== 'front_terrace' && r.id !== 'carport_terrace' && r.id !== 'rear_service_yard')
      .reduce((sum, r) => sum + Number((r.width * r.depth).toFixed(2)), 0);

  const baselineAreaM2 = Number(calculateTotalArea([...ORIGINAL_DESIGN.groundFloorRooms, ...ORIGINAL_DESIGN.secondFloorRooms]).toFixed(2));
  const currentAreaM2 = Number(calculateTotalArea([...currentDesign.groundFloorRooms, ...currentDesign.secondFloorRooms]).toFixed(2));
  const areaDeltaM2 = Number((currentAreaM2 - baselineAreaM2).toFixed(2));

  // Check bathroom count
  const baselineBathCount = [...ORIGINAL_DESIGN.groundFloorRooms, ...ORIGINAL_DESIGN.secondFloorRooms]
    .filter(r => r.id.includes('bath')).length;
  const currentBathCount = [...currentDesign.groundFloorRooms, ...currentDesign.secondFloorRooms]
    .filter(r => r.id.includes('bath')).length;
  const bathDelta = currentBathCount - baselineBathCount;

  // Check structural violations
  const structuralViolations = currentDesign.secondFloorRooms.filter(r => overlapsExistingFootprint(r)).length;
  const underpinningPenalty = structuralViolations > 0 ? structuralViolations * 28000000 : 0;

  // Baseline cost
  const baselineCostIdr = Math.round(baselineAreaM2 * ratePerM2 + 45000000); // 45m for foundation & site prep

  // Breakdown of deltas
  const areaDeltaCost = Math.round(areaDeltaM2 * ratePerM2);
  const bathDeltaCost = Math.round(bathDelta * bathFixtureRate);

  const breakdown = [
    {
      label: 'Penyesuaian Luas Bangunan Baru (m²)',
      deltaM2OrUnits: Number(areaDeltaM2.toFixed(2)),
      unitPriceIdr: ratePerM2,
      subtotalDeltaIdr: areaDeltaCost,
    },
    {
      label: 'Instalasi Sanitair & Plumbing Kamar Mandi',
      deltaM2OrUnits: bathDelta,
      unitPriceIdr: bathFixtureRate,
      subtotalDeltaIdr: bathDeltaCost,
    },
  ];

  if (underpinningPenalty > 0) {
    breakdown.push({
      label: 'Estimasi Biaya Perkuatan Struktur Atap Lama (Underpinning)',
      deltaM2OrUnits: structuralViolations,
      unitPriceIdr: 28000000,
      subtotalDeltaIdr: underpinningPenalty,
    });
  }

  // Material customizations (Roof model & wall, floor finishes, wall paint/materials)
  const matCustom = calculateMaterialCustomizationDelta(currentDesign, tier);
  for (const item of matCustom.items) {
    breakdown.push(item);
  }

  const costDeltaIdr =
    areaDeltaCost +
    bathDeltaCost +
    underpinningPenalty +
    matCustom.floorDeltaIdr +
    matCustom.wallDeltaIdr +
    matCustom.roofDeltaIdr;
  const currentCostIdr = baselineCostIdr + costDeltaIdr;
  const percentChange = baselineCostIdr > 0 ? (costDeltaIdr / baselineCostIdr) * 100 : 0;

  return {
    baselineCostIdr,
    currentCostIdr,
    costDeltaIdr,
    percentChange: Number(percentChange.toFixed(1)),
    baselineAreaM2: Number(baselineAreaM2.toFixed(1)),
    currentAreaM2: Number(currentAreaM2.toFixed(1)),
    areaDeltaM2: Number(areaDeltaM2.toFixed(1)),
    breakdown,
    economyEstimateIdr: tier === 'economy' ? currentCostIdr : Math.round(currentCostIdr * 0.82),
    midRangeEstimateIdr: tier === 'mid-range' ? currentCostIdr : Math.round(currentCostIdr * 1.21),
  };
}

export function formatRupiah(value: number): string {
  const isNegative = value < 0;
  const absValue = Math.abs(value);
  const formatted = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(absValue);

  return isNegative ? `-${formatted}` : formatted;
}
