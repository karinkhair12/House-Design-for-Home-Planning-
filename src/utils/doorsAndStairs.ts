/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FurnitureItem } from './houseDesignStore';

export type DoorType = 'single-swing' | 'double-swing' | 'sliding' | 'folding' | 'pocket';
export type WallSide = 'north' | 'south' | 'east' | 'west';

export type WindowType = 'casement' | 'sliding' | 'fixed-glass' | 'fixed' | 'louver-vent' | 'roster-vent' | 'roster' | 'bovenlicht';

export interface WindowData {
  id: string;
  name: string;
  roomId: string;
  floor: 'GF' | '2F';
  wallSide: WallSide;
  x: number; // meters from top-left (0,0)
  y: number; // meters from top-left (0,0)
  width: number; // meters (e.g. 1.2m, 0.6m)
  height: number; // meters (e.g. 1.4m, 0.45m)
  sillHeight: number; // elevation from floor slab in meters (e.g. 0.9m for window, 2.2m for bovenlicht)
  windowType: WindowType;
  type?: WindowType;
  isOpen?: boolean;
}

export interface DoorData {
  id: string;
  name: string;
  roomId: string;
  floor: 'GF' | '2F';
  wallSide: WallSide;
  x: number; // meters from top-left (0,0)
  y: number; // meters from top-left (0,0)
  width: number; // meters (e.g. 0.85m)
  height: number; // meters (e.g. 2.1m)
  doorType: DoorType;
  swingDirection: 'inward' | 'outward';
  hingeSide: 'left' | 'right';
  isOpen: boolean;
  swingAngle: number; // degrees (0 when closed, 90 when open)
  material?: string;
}

export interface StairStep {
  index: number;
  x: number;
  y: number; // horizontal depth on plan
  z: number; // elevation from floor
  width: number;
  treadDepth: number;
  riserHeight: number;
  isLanding?: boolean;
}

export interface StaircaseConfig {
  id: string;
  name: string;
  type: 'straight' | 'l-shape' | 'u-shape';
  shape?: 'straight' | 'l-shape' | 'u-shape';
  floor: 'GF';
  x: number;
  y: number;
  width: number; // total width in meters
  depth: number; // total depth in meters
  totalRun?: number;
  floorToFloorHeight: number; // 3.6m
  riserHeight: number; // 0.18m
  treadDepth: number; // 0.28m
  numberOfSteps: number; // 20 steps
  stepsCount?: number;
  hasHandrail: boolean;
  handrailHeight: number; // 0.9m
  landingSize: number; // 0.9m
  orientation: 'north-to-south' | 'south-to-north' | 'west-to-east' | 'east-to-west';
  rotation?: number;
}

export const DEFAULT_STAIRCASE_CONFIG: StaircaseConfig = {
  id: 'stair-main',
  name: 'Tangga Utama GRIYA 9×11 (Format L / U Bordes)',
  type: 'l-shape',
  shape: 'l-shape',
  floor: 'GF',
  x: 7.5,
  y: 3.0,
  width: 1.5,
  depth: 2.65,
  totalRun: 2.65,
  floorToFloorHeight: 3.6,
  riserHeight: 0.18,
  treadDepth: 0.28,
  numberOfSteps: 20,
  stepsCount: 20,
  hasHandrail: true,
  handrailHeight: 0.9,
  landingSize: 0.9,
  orientation: 'south-to-north',
  rotation: 0,
};

/**
 * Generates exact individual 3D and 2D step geometric data for the staircase
 * supporting Straight, L-Shape, and U-Shape configurations.
 */
export function generateStairSteps(config: StaircaseConfig): StairStep[] {
  const steps: StairStep[] = [];
  const totalRisers = Math.max(12, Math.round(config.floorToFloorHeight / (config.riserHeight || 0.18)));
  const riserH = config.floorToFloorHeight / totalRisers;

  if (config.type === 'straight') {
    // STRAIGHT SINGLE FLIGHT
    const treadD = config.depth / (totalRisers - 1);
    for (let i = 0; i < totalRisers; i++) {
      steps.push({
        index: i + 1,
        x: config.x + config.width / 2,
        y: config.orientation === 'north-to-south'
          ? config.y + i * treadD
          : config.y + config.depth - (i + 1) * treadD,
        z: (i + 1) * riserH,
        width: config.width,
        treadDepth: treadD,
        riserHeight: riserH,
        isLanding: i === totalRisers - 1,
      });
    }
  } else if (config.type === 'u-shape') {
    // U-SHAPE (DOG-LEG 180 DEGREE WITH INTERMEDIATE BORDES)
    const flightWidth = config.width / 2;
    const halfSteps = Math.floor((totalRisers - 1) / 2);
    const treadD = (config.depth - config.landingSize) / (halfSteps || 1);

    // Flight 1: Naik sisi kiri (selatan ke utara)
    for (let i = 0; i < halfSteps; i++) {
      steps.push({
        index: i + 1,
        x: config.x + flightWidth / 2,
        y: config.y + config.depth - (i + 1) * treadD,
        z: (i + 1) * riserH,
        width: flightWidth - 0.05,
        treadDepth: treadD,
        riserHeight: riserH,
        isLanding: false,
      });
    }

    // Bordes Landing (180 degree full-width turn at midpoint)
    const midElevation = (halfSteps + 1) * riserH;
    steps.push({
      index: halfSteps + 1,
      x: config.x + config.width / 2,
      y: config.y + config.landingSize / 2,
      z: midElevation,
      width: config.width,
      treadDepth: config.landingSize,
      riserHeight: riserH,
      isLanding: true,
    });

    // Flight 2: Balik arah naik di sisi kanan (utara ke selatan)
    const remaining = totalRisers - (halfSteps + 1);
    for (let j = 0; j < remaining; j++) {
      steps.push({
        index: halfSteps + 2 + j,
        x: config.x + flightWidth + flightWidth / 2,
        y: config.y + config.landingSize + j * treadD,
        z: midElevation + (j + 1) * riserH,
        width: flightWidth - 0.05,
        treadDepth: treadD,
        riserHeight: riserH,
        isLanding: false,
      });
    }
  } else {
    // L-SHAPE (90 DEGREE TURN WITH CORNER BORDES)
    const flightWidth = config.width / 2;
    const halfSteps = Math.floor(totalRisers / 2);
    const flight1Count = halfSteps - 1;

    // Flight 1: Naik dari selatan ke utara
    for (let i = 0; i < flight1Count; i++) {
      steps.push({
        index: i + 1,
        x: config.x + flightWidth / 2,
        y: config.y + config.depth - (i + 1) * config.treadDepth * 0.75,
        z: (i + 1) * riserH,
        width: flightWidth,
        treadDepth: config.treadDepth,
        riserHeight: riserH,
        isLanding: false,
      });
    }

    // Corner Landing Bordes 90-degree
    steps.push({
      index: flight1Count + 1,
      x: config.x + config.width / 2,
      y: config.y + 0.45,
      z: halfSteps * riserH,
      width: config.width,
      treadDepth: config.landingSize,
      riserHeight: riserH,
      isLanding: true,
    });

    // Flight 2: Melanjutkan naik ke lantai 2
    for (let i = halfSteps + 1; i <= totalRisers; i++) {
      const stepInFlight = i - (halfSteps + 1);
      steps.push({
        index: i + 1,
        x: config.x + flightWidth + flightWidth / 2,
        y: config.y + 0.9 + stepInFlight * config.treadDepth * 0.75,
        z: i * riserH,
        width: flightWidth,
        treadDepth: config.treadDepth,
        riserHeight: riserH,
        isLanding: false,
      });
    }
  }

  return steps;
}

/**
 * Approved design windows and ventilation roster according to Indonesian tropical architecture.
 */
export const APPROVED_DESIGN_WINDOWS: WindowData[] = [
  // Ground Floor Windows (KT 1 and KT 2 on the left side have no windows - solid walls)
  {
    id: 'w-rt-front',
    name: 'Jendela Ruang Tamu Depan',
    roomId: 'guest_room',
    floor: 'GF',
    wallSide: 'north',
    x: 7.2,
    y: 0.0,
    width: 1.6,
    height: 1.5,
    sillHeight: 0.6,
    windowType: 'casement',
    isOpen: false,
  },
  {
    id: 'w-kt3-side',
    name: 'Jendela Kamar Tidur 3 Samping',
    roomId: 'kt3',
    floor: 'GF',
    wallSide: 'east',
    x: 9.0,
    y: 7.0,
    width: 1.2,
    height: 1.4,
    sillHeight: 0.9,
    windowType: 'sliding',
    isOpen: false,
  },
  {
    id: 'v-guest-bath',
    name: 'Ventilasi Bovenlicht KM Tamu',
    roomId: 'guest_bath',
    floor: 'GF',
    wallSide: 'east',
    x: 9.0,
    y: 3.5,
    width: 0.6,
    height: 0.45,
    sillHeight: 2.2,
    windowType: 'bovenlicht',
    isOpen: true,
  },
  {
    id: 'v-fam-bath',
    name: 'Ventilasi Bovenlicht KM Keluarga',
    roomId: 'family_bath',
    floor: 'GF',
    wallSide: 'east',
    x: 9.0,
    y: 9.0,
    width: 0.6,
    height: 0.45,
    sillHeight: 2.2,
    windowType: 'bovenlicht',
    isOpen: true,
  },
  {
    id: 'v-kitchen-roster',
    name: 'Roster Bata Ventilasi Tropis Dapur',
    roomId: 'laundry_exit',
    floor: 'GF',
    wallSide: 'south',
    x: 6.3,
    y: 11.0,
    width: 1.2,
    height: 0.5,
    sillHeight: 1.8,
    windowType: 'roster-vent',
    isOpen: true,
  },

  // Second Floor Windows
  {
    id: 'w-kt4-side',
    name: 'Jendela KT 4 (2F Samping)',
    roomId: 'kt4',
    floor: '2F',
    wallSide: 'east',
    x: 9.0,
    y: 3.5,
    width: 1.4,
    height: 1.4,
    sillHeight: 0.9,
    windowType: 'casement',
    isOpen: false,
  },
  {
    id: 'w-kt5-rear',
    name: 'Jendela KT 5 (2F Belakang)',
    roomId: 'kt5',
    floor: '2F',
    wallSide: 'south',
    x: 6.8,
    y: 11.0,
    width: 1.4,
    height: 1.4,
    sillHeight: 0.9,
    windowType: 'sliding',
    isOpen: false,
  },
  {
    id: 'w-kt6-front',
    name: 'Jendela KT 6 (2F Depan Atas Teras Kanopi)',
    roomId: 'kt6',
    floor: '2F',
    wallSide: 'north',
    x: 3.8,
    y: 0.0,
    width: 1.4,
    height: 1.4,
    sillHeight: 0.9,
    windowType: 'casement',
    isOpen: false,
  },
];

/**
 * Approved design doors according to original architectural concept.
 */
export const APPROVED_DESIGN_DOORS: DoorData[] = [
  // Ground Floor Doors
  {
    id: 'd-main-entrance',
    name: 'Pintu Masuk Utama Depan',
    roomId: 'guest_room',
    floor: 'GF',
    wallSide: 'north',
    x: 6.5,
    y: 0.0,
    width: 0.9,
    height: 2.15,
    doorType: 'single-swing',
    swingDirection: 'inward',
    hingeSide: 'left',
    isOpen: false,
    swingAngle: 90,
    material: 'Kayu Kamper Samarinda Solid',
  },
  {
    id: 'd-kt2',
    name: 'Pintu Kamar Tidur 2 (Depan)',
    roomId: 'kt2',
    floor: 'GF',
    wallSide: 'east',
    x: 3.0,
    y: 3.2,
    width: 0.85,
    height: 2.1,
    doorType: 'single-swing',
    swingDirection: 'inward',
    hingeSide: 'left',
    isOpen: false,
    swingAngle: 90,
  },
  {
    id: 'd-kt1',
    name: 'Pintu Kamar Tidur 1 (Utama)',
    roomId: 'kt1',
    floor: 'GF',
    wallSide: 'east',
    x: 3.0,
    y: 6.5,
    width: 0.85,
    height: 2.1,
    doorType: 'single-swing',
    swingDirection: 'inward',
    hingeSide: 'left',
    isOpen: false,
    swingAngle: 90,
  },
  {
    id: 'd-kt3',
    name: 'Pintu Kamar Tidur 3',
    roomId: 'kt3',
    floor: 'GF',
    wallSide: 'west',
    x: 6.0,
    y: 6.0,
    width: 0.85,
    height: 2.1,
    doorType: 'single-swing',
    swingDirection: 'inward',
    hingeSide: 'right',
    isOpen: false,
    swingAngle: 90,
  },
  {
    id: 'd-guest-bath',
    name: 'Pintu KM Tamu',
    roomId: 'guest_bath',
    floor: 'GF',
    wallSide: 'north',
    x: 6.5,
    y: 3.0,
    width: 0.7,
    height: 2.05,
    doorType: 'single-swing',
    swingDirection: 'inward',
    hingeSide: 'left',
    isOpen: false,
    swingAngle: 90,
  },
  {
    id: 'd-family-bath',
    name: 'Pintu KM Keluarga (Arah Kiri)',
    roomId: 'family_bath',
    floor: 'GF',
    wallSide: 'west',
    x: 7.5,
    y: 9.0,
    width: 0.7,
    height: 2.05,
    doorType: 'single-swing',
    swingDirection: 'inward',
    hingeSide: 'right',
    isOpen: false,
    swingAngle: 90,
  },
  {
    id: 'd-rear-exit',
    name: 'Pintu Keluar Servis Belakang',
    roomId: 'laundry_exit',
    floor: 'GF',
    wallSide: 'south',
    x: 8.0,
    y: 11.0,
    width: 0.8,
    height: 2.1,
    doorType: 'single-swing',
    swingDirection: 'outward',
    hingeSide: 'left',
    isOpen: false,
    swingAngle: 90,
  },
  // Second Floor Doors
  {
    id: 'd-kt4',
    name: 'Pintu Kamar Tidur 4 (2F Depan)',
    roomId: 'kt4',
    floor: '2F',
    wallSide: 'west',
    x: 7.0,
    y: 3.2,
    width: 0.85,
    height: 2.1,
    doorType: 'single-swing',
    swingDirection: 'inward',
    hingeSide: 'left',
    isOpen: false,
    swingAngle: 90,
  },
  {
    id: 'd-kt5',
    name: 'Pintu Kamar Tidur 5 (2F Belakang)',
    roomId: 'kt5',
    floor: '2F',
    wallSide: 'west',
    x: 6.0,
    y: 8.2,
    width: 0.85,
    height: 2.1,
    doorType: 'single-swing',
    swingDirection: 'inward',
    hingeSide: 'left',
    isOpen: false,
    swingAngle: 90,
  },
  {
    id: 'd-kt6',
    name: 'Pintu Kamar Tidur 6 (2F Atas Teras Kanopi)',
    roomId: 'kt6',
    floor: '2F',
    wallSide: 'east',
    x: 6.0,
    y: 1.5,
    width: 0.85,
    height: 2.1,
    doorType: 'single-swing',
    swingDirection: 'inward',
    hingeSide: 'right',
    isOpen: false,
    swingAngle: 90,
  },
  {
    id: 'd-balcony',
    name: 'Pintu Balkon Depan 2F',
    roomId: 'balcony',
    floor: '2F',
    wallSide: 'north',
    x: 7.5,
    y: 1.0,
    width: 0.85,
    height: 2.1,
    doorType: 'single-swing',
    swingDirection: 'outward',
    hingeSide: 'right',
    isOpen: false,
    swingAngle: 90,
  },
];

export interface DoorClearanceCheck {
  doorId: string;
  doorName: string;
  isClear: boolean;
  conflictingItems: string[];
  clearanceWidthCm: number;
  recommendation?: string;
}

/**
 * Checks door swing envelope against furniture objects.
 */
export function evaluateDoorClearance(
  door: DoorData,
  furnitureList: FurnitureItem[]
): DoorClearanceCheck {
  const swingRadius = door.width;
  const conflicts: string[] = [];

  // Determine swing bounding circle center
  const hingeX = door.hingeSide === 'left' ? door.x : door.x + door.width;
  const hingeY = door.y;

  for (const f of furnitureList) {
    if (f.roomId !== door.roomId) continue;

    // Check distance from hinge to furniture center
    const fCenterX = f.x + f.width / 2;
    const fCenterY = f.y + f.depth / 2;
    const dist = Math.hypot(fCenterX - hingeX, fCenterY - hingeY);

    if (dist < swingRadius + Math.min(f.width, f.depth) / 2) {
      conflicts.push(f.name);
    }
  }

  const isClear = conflicts.length === 0;
  return {
    doorId: door.id,
    doorName: door.name,
    isClear,
    conflictingItems: conflicts,
    clearanceWidthCm: Math.round(door.width * 100),
    recommendation: isClear
      ? 'Ayun bukaan pintu 100% bebas hambatan.'
      : `Bukaan daun pintu terbentur ${conflicts.join(', ')}. Geser perabot minimal ${(swingRadius * 100).toFixed(0)} cm dari kusen.`,
  };
}

export interface WallOpeningSegment {
  left: { x1: number; y1: number; x2: number; y2: number };
  opening: { x1: number; y1: number; x2: number; y2: number };
  right: { x1: number; y1: number; x2: number; y2: number };
  lintel: { bottomElevation: number; topElevation: number };
}

/**
 * Calculates geometric wall segments with a physical opening for a placed door.
 */
export function calculateWallOpening(
  wallStart: { x: number; y: number },
  wallEnd: { x: number; y: number },
  doorOffset: number,
  doorWidth: number,
  doorHeight = 2.1,
  wallHeight = 3.2
): WallOpeningSegment {
  const wallLen = Math.hypot(wallEnd.x - wallStart.x, wallEnd.y - wallStart.y);
  const clampedOffset = Math.max(0.1, Math.min(wallLen - doorWidth - 0.1, doorOffset));
  const dirX = (wallEnd.x - wallStart.x) / (wallLen || 1);
  const dirY = (wallEnd.y - wallStart.y) / (wallLen || 1);

  const openStartX = wallStart.x + dirX * clampedOffset;
  const openStartY = wallStart.y + dirY * clampedOffset;
  const openEndX = wallStart.x + dirX * (clampedOffset + doorWidth);
  const openEndY = wallStart.y + dirY * (clampedOffset + doorWidth);

  return {
    left: {
      x1: Number(wallStart.x.toFixed(2)),
      y1: Number(wallStart.y.toFixed(2)),
      x2: Number(openStartX.toFixed(2)),
      y2: Number(openStartY.toFixed(2)),
    },
    opening: {
      x1: Number(openStartX.toFixed(2)),
      y1: Number(openStartY.toFixed(2)),
      x2: Number(openEndX.toFixed(2)),
      y2: Number(openEndY.toFixed(2)),
    },
    right: {
      x1: Number(openEndX.toFixed(2)),
      y1: Number(openEndY.toFixed(2)),
      x2: Number(wallEnd.x.toFixed(2)),
      y2: Number(wallEnd.y.toFixed(2)),
    },
    lintel: {
      bottomElevation: doorHeight,
      topElevation: wallHeight,
    },
  };
}

/**
 * Calculates the bounding box opening required in the 2nd floor slab for the staircase.
 */
export function getStairwellSlabOpening(config: StaircaseConfig): {
  x: number;
  y: number;
  width: number;
  depth: number;
} {
  return {
    x: config.x,
    y: config.y,
    width: config.width,
    depth: config.depth,
  };
}

export interface SwapComparisonReport {
  optionA: {
    title: string;
    description: string;
    staircase: {
      location: string;
      footprint: string;
      widthM: number;
      treadCm: number;
      riserCm: number;
      stepCount: number;
      blondelVal: number;
      slopeDeg: number;
      headroomM: number;
      structuralBeam: string;
    };
    guestBath: {
      location: string;
      areaM2: number;
      ventilation: string;
      plumbingShaft: string;
      drainageSlope: string;
      guestPrivacy: string;
    };
    costDeltaIdr: number;
    pros: string[];
    cons: string[];
  };
  optionB: {
    title: string;
    description: string;
    staircase: {
      location: string;
      footprint: string;
      widthM: number;
      treadCm: number;
      riserCm: number;
      stepCount: number;
      blondelVal: number;
      slopeDeg: number;
      headroomM: number;
      structuralBeam: string;
    };
    guestBath: {
      location: string;
      areaM2: number;
      ventilation: string;
      plumbingShaft: string;
      drainageSlope: string;
      guestPrivacy: string;
    };
    costDeltaIdr: number;
    pros: string[];
    cons: string[];
  };
  recommendation: string;
}

/**
 * Comprehensive comparative evaluation of Option A (Current) vs Option B (Swapped)
 * for Part 4 of the architectural requirements.
 */
export function evaluateBathroomStaircaseSwap(): SwapComparisonReport {
  return {
    optionA: {
      title: 'Opsi A — Layout Saat Ini (Disetujui Baseline)',
      description: 'KM Tamu berada di sisi dalam dekat ruang keluarga (X: 6.5–8.0m), Tangga di sisi luar kanan mepet batas tapak (X: 7.5–9.0m).',
      staircase: {
        location: 'Sisi Luar Kanan Tapak (X: 7.50m - 9.00m, Y: 3.20m - 5.65m)',
        footprint: '1.50m × 2.45m (3.68 m²)',
        widthM: 1.5,
        treadCm: 28,
        riserCm: 18,
        stepCount: 20,
        blondelVal: 64, // 2*18 + 28 = 64cm (Ideal 60-65cm)
        slopeDeg: 32.7,
        headroomM: 2.25,
        structuralBeam: 'Bertumpu pada kolom struktur baru K1 di dinding pembatas kanan',
      },
      guestBath: {
        location: 'Antara Ruang Tamu & Tangga (X: 6.50m - 8.00m, Y: 3.20m - 5.65m)',
        areaM2: 3.68,
        ventilation: 'Exhaust fan plafon mekanikal dengan ducting horizontal ke void/taman belakang',
        plumbingShaft: 'Shaft pipa vertikal terintegrasi di dinding partisi dalam',
        drainageSlope: 'Kemiringan 2% dialirkan di bawah plat lantai menuju bak kontrol belakang',
        guestPrivacy: 'Akses tamu sangat privat, tersembunyi dari pintu masuk depan dan pandangan luar',
      },
      costDeltaIdr: 0,
      pros: [
        'Desain asli yang telah disetujui tanpa perubahan anggaran konstruksi (Rp 0 selisih)',
        'Sirkulasi tangga tidak memotong lalu lintas koridor ruang keluarga',
        'Bordes lantai 2 tepat mendarat di galeri sirkulasi KT 4 & KT 5 tanpa deviasi',
        'KM Tamu terlindung secara akustik dan visual dari jalan depan',
      ],
      cons: [
        'Ventilasi KM Tamu bergantung pada exhaust fan mekanis karena tidak bersentuhan langsung dengan dinding luar',
        'Pipa air kotor melintasi lantai interior sebelum menuju saluran pembuangan luar',
      ],
    },
    optionB: {
      title: 'Opsi B — Posisi Tertukar (Swapped Layout)',
      description: 'Tangga dipindahkan ke tengah/sisi dalam (X: 6.0–7.5m), KM Tamu dipindahkan ke sisi luar kanan (X: 7.5–9.0m).',
      staircase: {
        location: 'Sisi Dalam / Tengah (X: 6.00m - 7.50m, Y: 3.20m - 5.65m)',
        footprint: '1.50m × 2.45m (3.68 m²)',
        widthM: 1.5,
        treadCm: 28,
        riserCm: 18,
        stepCount: 20,
        blondelVal: 64,
        slopeDeg: 32.7,
        headroomM: 2.25,
        structuralBeam: 'Memerlukan balok penguat transfer beban B2 pada grid kolom X: 6.0m',
      },
      guestBath: {
        location: 'Sisi Dinding Luar Kanan (X: 7.50m - 9.00m, Y: 3.20m - 5.65m)',
        areaM2: 3.68,
        ventilation: 'Jendela bouvenlight alami langsung ke udara terbuka luar (sangat higienis & bebas lembab)',
        plumbingShaft: 'Pipa air kotor dan greywater langsung turun di luar dinding samping ke saluran drainase kota',
        drainageSlope: 'Kemiringan gravitasi langsung tanpa belokan pipa di dalam rumah',
        guestPrivacy: 'Tamu harus melewati area tangga untuk menuju ke kamar mandi',
      },
      costDeltaIdr: 4500000, // + Rp 4.500.000 untuk relokasi instalasi plumbing & balok penguat
      pros: [
        'Ventilasi udara alami optimal: KM Tamu memiliki jendela kaca jungkit ke dinding luar',
        'Instalasi pipa pembuangan (plumbing) lebih ringkas karena langsung turun di dinding luar',
        'Akses tangga lebih dekat dari Ruang Keluarga dan kamar tidur lantai 1',
        'Bebas bau tanpa keharusan menyalakan exhaust fan terus-menerus',
      ],
      cons: [
        'Tambahan estimasi biaya konstruksi sebesar Rp 4.500.000 untuk relokasi jalur pipa air kotor dan balok penguat tangga',
        'Pendaratan tangga lantai 2 bergeser 1.5 meter ke arah tengah, mempersempit sedikit ruang sirkulasi depan pintu KT 4',
        'Tamu yang ingin ke toilet harus berjalan lebih jauh melintasi kaki tangga',
      ],
    },
    recommendation: 'Kedua opsi 100% layak secara struktur. Opsi A direkomendasikan jika memprioritaskan efisiensi biaya dan kepraktisan sirkulasi koridor 2F. Opsi B direkomendasikan jika memprioritaskan ventilasi udara alami & pencahayaan matahari langsung untuk KM Tamu.',
  };
}

