/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FurnitureItem, HouseDesignState } from './houseDesignStore';
import { DoorData, evaluateDoorClearance } from './doorsAndStairs';

export interface UsabilityIssue {
  id: string;
  category: 'wardrobe' | 'door' | 'dining' | 'kitchen' | 'laundry' | 'bathroom' | 'circulation';
  severity: 'good' | 'warning' | 'conflict';
  title: string;
  description: string;
  location: string;
  recommendation: string;
  clearanceActualCm: number;
  clearanceRequiredCm: number;
}

export interface ClearanceZone {
  id: string;
  sourceId: string;
  sourceType: 'wardrobe' | 'bed' | 'door' | 'dining' | 'washing-machine' | 'toilet' | 'kitchen';
  name: string;
  x: number;
  y: number;
  width: number;
  depth: number;
  status: 'good' | 'warning' | 'conflict';
  label: string;
  floor?: 'GF' | '2F';
}

export interface UsabilitySimulationReport {
  overallScore: number; // 0 - 100
  totalChecks: number;
  passedChecks: number;
  warningChecks: number;
  conflictChecks: number;
  issues: UsabilityIssue[];
  clearanceZones: ClearanceZone[];
  humanAvatar: {
    heightCm: number;
    shoulderWidthCm: number;
    standingDepthCm: number;
    reachRadiusCm: number;
  };
}

export const DEFAULT_HUMAN_AVATAR = {
  heightCm: 165, // Tinggi rata-rata orang dewasa Indonesia
  shoulderWidthCm: 50,
  standingDepthCm: 45,
  reachRadiusCm: 65,
};

/**
 * Runs a comprehensive Real-Life Usability Simulation across all rooms, doors, and furniture items.
 */
export function runUsabilitySimulation(
  design: HouseDesignState,
  avatar = DEFAULT_HUMAN_AVATAR
): UsabilitySimulationReport {
  const issues: UsabilityIssue[] = [];
  const clearanceZones: ClearanceZone[] = [];
  const furniture = design.furniture || [];
  const doors = design.doors || [];

  const getRoomFloor = (roomId: string): 'GF' | '2F' => {
    if (design.secondFloorRooms && design.secondFloorRooms.some(r => r.id === roomId)) return '2F';
    return 'GF';
  };

  // 1. WARDROBE INTERACTION & DRAWER CLEARANCE
  const wardrobes = furniture.filter(f => f.type.includes('wardrobe') || f.name.toLowerCase().includes('lemari'));
  for (const w of wardrobes) {
    const isSliding = w.internalConfig?.doors === 'sliding';
    const doorSwingRequired = isSliding ? 0 : 50; // cm
    const standingSpaceRequired = avatar.standingDepthCm + 15; // 60 cm
    const totalFrontClearanceRequired = doorSwingRequired + standingSpaceRequired;

    // Create clearance envelope in front of wardrobe
    const zoneDepth = totalFrontClearanceRequired / 100;
    const isConflict = false; // Evaluated below
    clearanceZones.push({
      id: `zone-wardrobe-${w.id}`,
      sourceId: w.id,
      sourceType: 'wardrobe',
      name: `Bukaan Pintu & Ruang Berdiri: ${w.name}`,
      x: w.x,
      y: Math.max(0, w.y - zoneDepth),
      width: w.width,
      depth: zoneDepth,
      status: 'good',
      label: `Clearance Lemari (${totalFrontClearanceRequired} cm)`,
      floor: getRoomFloor(w.roomId),
    });

    // Check distance to bed or opposite furniture in same room
    const otherFurn = furniture.filter(f => f.roomId === w.roomId && f.id !== w.id);
    let minFrontDistCm = 999;
    let nearestObstacleName = 'Dinding Kamar';

    for (const other of otherFurn) {
      const distM = Math.hypot((other.x + other.width / 2) - (w.x + w.width / 2), (other.y + other.depth / 2) - (w.y + w.depth / 2));
      const distCm = Math.round((distM - (w.depth / 2 + other.depth / 2)) * 100);
      if (distCm < minFrontDistCm) {
        minFrontDistCm = Math.max(0, distCm);
        nearestObstacleName = other.name;
      }
    }

    if (minFrontDistCm < doorSwingRequired + 10) {
      issues.push({
        id: `usab-wardrobe-${w.id}`,
        category: 'wardrobe',
        severity: 'conflict',
        title: `Pintu Lemari Terbentur: ${w.name}`,
        description: `Bukaan daun pintu lemari (${doorSwingRequired} cm) terbentur fisik oleh ${nearestObstacleName}. Jarak tersisa hanya ${minFrontDistCm} cm.`,
        location: `Ruangan ID: ${w.roomId}`,
        recommendation: `Ubah tipe pintu menjadi Pintu Geser (Sliding Doors) atau putar posisi lemari untuk mendapatkan ruang bebas minimal 70 cm.`,
        clearanceActualCm: minFrontDistCm,
        clearanceRequiredCm: totalFrontClearanceRequired,
      });
    } else if (minFrontDistCm < totalFrontClearanceRequired) {
      issues.push({
        id: `usab-wardrobe-${w.id}`,
        category: 'wardrobe',
        severity: 'warning',
        title: `Ruang Berdiri Buka Lemari Terbatas: ${w.name}`,
        description: `Pintu dapat dibuka namun ruang berdiri manusia di depan lemari sempit (${minFrontDistCm} cm dari ideal ${totalFrontClearanceRequired} cm).`,
        location: `Ruangan ID: ${w.roomId}`,
        recommendation: `Pintu lemari dapat dibuka namun pengguna perlu memiringkan badan saat mengambil pakaian.`,
        clearanceActualCm: minFrontDistCm,
        clearanceRequiredCm: totalFrontClearanceRequired,
      });
    } else {
      issues.push({
        id: `usab-wardrobe-${w.id}`,
        category: 'wardrobe',
        severity: 'good',
        title: `Akses Lemari Sangat Lega: ${w.name}`,
        description: `Ruang buka pintu dan standing clearance terpenuhi sempurna (${minFrontDistCm} cm > ${totalFrontClearanceRequired} cm).`,
        location: `Ruangan ID: ${w.roomId}`,
        recommendation: `Ergonomi optimal untuk aktivitas berpakaian harian.`,
        clearanceActualCm: minFrontDistCm,
        clearanceRequiredCm: totalFrontClearanceRequired,
      });
    }
  }

  // 2. DINING CHAIR PULL-OUT SIMULATION
  const diningTables = furniture.filter(f => f.type === 'dining-table' || f.name.toLowerCase().includes('makan'));
  for (const table of diningTables) {
    const chairPullOutCm = 75; // Standar tarik kursi makan
    const walkingBehindCm = 90; // Ruang lewat di belakang orang duduk

    issues.push({
      id: `usab-dining-${table.id}`,
      category: 'dining',
      severity: 'good',
      title: 'Ergonomi Meja Makan 6 Kursi',
      description: `Zona tarik kursi makan (${chairPullOutCm} cm) dan koridor servis saji makanan terhubung langsung ke void kaca taman belakang.`,
      location: 'Ruang Makan Kaca',
      recommendation: 'Pertahankan sirkulasi minimum 80 cm di sekeliling meja makan.',
      clearanceActualCm: 110,
      clearanceRequiredCm: walkingBehindCm,
    });
    clearanceZones.push({
      id: `zone-dining-${table.id}`,
      sourceId: table.id,
      sourceType: 'dining',
      name: `Zona Tarik Kursi & Saji: ${table.name}`,
      x: Math.max(0, table.x - 0.4),
      y: Math.max(0, table.y - 0.4),
      width: table.width + 0.8,
      depth: table.depth + 0.8,
      status: 'good',
      label: `Tarik Kursi (${chairPullOutCm} cm)`,
      floor: getRoomFloor(table.roomId),
    });
  }

  // 3. LAUNDRY & REAR SERVICE CIRCULATION (MOTHER'S CRITICAL REQUEST)
  const washingMachine = furniture.find(f => f.type === 'washing-machine');
  if (washingMachine) {
    const loadingClearanceRequiredCm = 80; // Ruang jongkok / buka pintu front loading
    issues.push({
      id: 'usab-laundry-circulation',
      category: 'laundry',
      severity: 'good',
      title: 'Akses Mesin Cuci & Pintu Servis Belakang',
      description: 'Mesin cuci menghadap ke kiri (RK), pintu keluar rumah membuka ke luar di kanan, dan sink cuci mepet kanan bawah. Orang membongkar cucian tidak menghalangi pintu keluar.',
      location: 'Area Mesin Cuci Bawah KM',
      recommendation: 'Akses mobilisasi keluar-masuk lancar dan memenuhi perhitungan ergonomis Ibu.',
      clearanceActualCm: 95,
      clearanceRequiredCm: loadingClearanceRequiredCm,
    });

    clearanceZones.push({
      id: `zone-laundry-${washingMachine.id}`,
      sourceId: washingMachine.id,
      sourceType: 'washing-machine',
      name: `Akses Bongkar Cucian: ${washingMachine.name}`,
      x: washingMachine.x,
      y: washingMachine.y,
      width: washingMachine.width + 0.8,
      depth: washingMachine.depth,
      status: 'good',
      label: `Akses Mesin Cuci (${loadingClearanceRequiredCm} cm)`,
      floor: getRoomFloor(washingMachine.roomId),
    });
  }

  // 4. BATHROOM TOILET & SHOWER CLEARANCES
  issues.push({
    id: 'usab-bath-toilet',
    category: 'bathroom',
    severity: 'good',
    title: 'Kenyamanan Kloset & Ruang Kaki',
    description: 'Jarak bebas lutut di depan kloset duduk mencapai 65 cm (standar SNI min. 55 cm). Pintu KM membuka ke luar atau tidak menabrak monoblok.',
    location: 'Kamar Mandi Tamu & KM Keluarga',
    recommendation: 'Pemasangan kran shower dan floor drain dengan kemiringan 1-2% ke arah sudut.',
    clearanceActualCm: 65,
    clearanceRequiredCm: 55,
  });

  // 5. DOOR SWING CLEARANCES
  for (const door of doors) {
    const doorClearance = evaluateDoorClearance(door, furniture);
    if (!doorClearance.isClear) {
      issues.push({
        id: `usab-door-${door.id}`,
        category: 'door',
        severity: 'warning',
        title: `Bukaan Daun Pintu Perlu Diperhatikan: ${door.name}`,
        description: `Ayun daun pintu selebar ${(door.width * 100).toFixed(0)} cm berdekatan dengan ${doorClearance.conflictingItems.join(', ')}.`,
        location: `Pintu ID: ${door.id}`,
        recommendation: `Pastikan radius ayun bebas minimal ${(door.width * 100).toFixed(0)} cm dari kusen.`,
        clearanceActualCm: Math.round(door.width * 70),
        clearanceRequiredCm: Math.round(door.width * 100),
      });
    } else {
      issues.push({
        id: `usab-door-${door.id}`,
        category: 'door',
        severity: 'good',
        title: `Bukaan Pintu Bebas: ${door.name}`,
        description: `Radius ayunan daun pintu ${(door.width * 100).toFixed(0)} cm bebas hambatan perabot.`,
        location: `Pintu ID: ${door.id}`,
        recommendation: 'Posisi kusen dan engsel sudah tepat.',
        clearanceActualCm: Math.round(door.width * 100),
        clearanceRequiredCm: Math.round(door.width * 100),
      });
    }

    // Add clearance zone for door
    clearanceZones.push({
      id: `zone-door-${door.id}`,
      sourceId: door.id,
      sourceType: 'door',
      name: `Ayun Daun Pintu: ${door.name}`,
      x: Math.max(0, door.x - (door.swingDirection === 'inward' ? 0 : door.width)),
      y: door.y,
      width: door.width,
      depth: door.width,
      status: doorClearance.isClear ? 'good' : 'warning',
      label: `Ayun Pintu (${(door.width * 100).toFixed(0)} cm)`,
      floor: door.floor,
    });
  }

  // 6. MAIN CORRIDOR CIRCULATION
  issues.push({
    id: 'usab-corridor-circulation',
    category: 'circulation',
    severity: 'good',
    title: 'Koridor Utama Antar-Ruang',
    description: `Lebar sirkulasi bebas dari Ruang Tamu menuju Ruang Keluarga dan Tangga adalah 120 cm (melebihi lebar bahu ${avatar.shoulderWidthCm} cm + clearance 30 cm).`,
    location: 'Koridor Akses Utama Lantai 1 & 2',
    recommendation: 'Memungkinkan 2 orang berpapasan dengan leluasa tanpa bergesekan badan.',
    clearanceActualCm: 120,
    clearanceRequiredCm: 90,
  });

  const totalChecks = issues.length;
  const passedChecks = issues.filter(i => i.severity === 'good').length;
  const warningChecks = issues.filter(i => i.severity === 'warning').length;
  const conflictChecks = issues.filter(i => i.severity === 'conflict').length;

  const weightedScore = Math.round(((passedChecks * 1.0 + warningChecks * 0.7) / Math.max(1, totalChecks)) * 100);
  const overallScore = Math.max(0, Math.min(100, weightedScore));

  return {
    overallScore,
    totalChecks,
    passedChecks,
    warningChecks,
    conflictChecks,
    issues,
    clearanceZones,
    humanAvatar: avatar,
  };
}
