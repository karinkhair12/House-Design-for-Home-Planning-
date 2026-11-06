/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RoomData, SITE_BOUNDARY, EXISTING_ROOMS, overlapsExistingFootprint } from './architectureData';
import { HouseDesignState } from './houseDesignStore';

export type FeasibilityStatus = 'feasible' | 'conditional' | 'not-feasible';
export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface EvaluationItem {
  id: string;
  category: 'geometry' | 'structural' | 'architecture' | 'plumbing' | 'ventilation';
  title: string;
  status: FeasibilityStatus;
  severity: SeverityLevel;
  explanation: string;
  suggestedSolution: string;
  affectedRoomIds: string[];
}

export interface DesignScoreBreakdown {
  overallScore: number; // 0 - 100
  functionalityScore: number; // 0 - 20
  harmonyScore: number; // 0 - 20
  privacyCirculationScore: number; // 0 - 20
  structuralFeasibilityScore: number; // 0 - 25
  costEfficiencyScore: number; // 0 - 15
  strengths: string[];
  weaknesses: string[];
  criticalWarnings: string[];
  suggestions: string[];
  evaluations: EvaluationItem[];
}

// Check if two rectangles overlap
function doRoomsOverlap(r1: RoomData, r2: RoomData, tolerance = 0.05): boolean {
  if (r1.id === r2.id) return false;
  return !(
    r1.x + r1.width - tolerance <= r2.x ||
    r2.x + r2.width - tolerance <= r1.x ||
    r1.y + r1.depth - tolerance <= r2.y ||
    r2.y + r2.depth - tolerance <= r1.y
  );
}

export function evaluateDesign(design: HouseDesignState): DesignScoreBreakdown {
  const evaluations: EvaluationItem[] = [];
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const criticalWarnings: string[] = [];
  const suggestions: string[] = [];

  let structuralDeduction = 0;
  let geometryDeduction = 0;
  let circulationDeduction = 0;
  let harmonyDeduction = 0;
  let costDeduction = 0;

  const allRooms = [...design.groundFloorRooms, ...design.secondFloorRooms];
  const gfRooms = design.groundFloorRooms;
  const upperRooms = design.secondFloorRooms;

  // 1. GEOMETRY CHECKS
  // Check boundaries
  allRooms.forEach(room => {
    if (room.x < -0.01 || room.y < -0.01 || room.x + room.width > SITE_BOUNDARY.width + 0.05 || room.y + room.depth > SITE_BOUNDARY.depth + 0.05) {
      evaluations.push({
        id: `boundary-${room.id}`,
        category: 'geometry',
        title: `Pelanggaran Garis Sempadan: ${room.name}`,
        status: 'not-feasible',
        severity: 'critical',
        explanation: `Ruang ${room.name} melebihi batas kavling tanah 9m × 11m (Posisi: ${room.x.toFixed(1)}m - ${(room.x + room.width).toFixed(1)}m, ${room.y.toFixed(1)}m - ${(room.y + room.depth).toFixed(1)}m).`,
        suggestedSolution: 'Geser atau perkecil ruangan agar masuk kembali ke dalam batas tanah 9×11 meter.',
        affectedRoomIds: [room.id],
      });
      criticalWarnings.push(`Ruang ${room.name} melewati batas lahan 9m x 11m!`);
      geometryDeduction += 8;
    }

    if (room.width < 1.0 || room.depth < 1.0) {
      evaluations.push({
        id: `dim-${room.id}`,
        category: 'geometry',
        title: `Dimensi Terlalu Sempit: ${room.name}`,
        status: 'conditional',
        severity: 'high',
        explanation: `Dimensi ruang ${room.width.toFixed(2)}m × ${room.depth.toFixed(2)}m berada di bawah batas ergonomis minimum rumah tinggal.`,
        suggestedSolution: 'Perlebar dimensi ruangan minimal 1.20 meter untuk kenyamanan gerak.',
        affectedRoomIds: [room.id],
      });
      geometryDeduction += 3;
    }
  });

  // Check room overlaps on Ground Floor
  for (let i = 0; i < gfRooms.length; i++) {
    for (let j = i + 1; j < gfRooms.length; j++) {
      if (doRoomsOverlap(gfRooms[i], gfRooms[j])) {
        evaluations.push({
          id: `overlap-gf-${gfRooms[i].id}-${gfRooms[j].id}`,
          category: 'geometry',
          title: `Tumpang Tindih Ruang di Lantai 1: ${gfRooms[i].name} & ${gfRooms[j].name}`,
          status: 'not-feasible',
          severity: 'high',
          explanation: `Ruang ${gfRooms[i].name} dan ${gfRooms[j].name} saling bertabrakan di denah lantai dasar.`,
          suggestedSolution: 'Sesuaikan koordinat agar dinding pembatas bersentuhan tanpa overlap.',
          affectedRoomIds: [gfRooms[i].id, gfRooms[j].id],
        });
        weaknesses.push(`Tumpang tindih lantai 1: ${gfRooms[i].name} dan ${gfRooms[j].name}`);
        geometryDeduction += 5;
      }
    }
  }

  // Check room overlaps on Second Floor
  for (let i = 0; i < upperRooms.length; i++) {
    for (let j = i + 1; j < upperRooms.length; j++) {
      if (doRoomsOverlap(upperRooms[i], upperRooms[j])) {
        evaluations.push({
          id: `overlap-2f-${upperRooms[i].id}-${upperRooms[j].id}`,
          category: 'geometry',
          title: `Tumpang Tindih Ruang di Lantai 2: ${upperRooms[i].name} & ${upperRooms[j].name}`,
          status: 'not-feasible',
          severity: 'high',
          explanation: `Ruang ${upperRooms[i].name} dan ${upperRooms[j].name} saling bertabrakan di denah lantai 2.`,
          suggestedSolution: 'Atur kembali tata letak kamar di lantai atas agar tidak bersilangan.',
          affectedRoomIds: [upperRooms[i].id, upperRooms[j].id],
        });
        geometryDeduction += 5;
      }
    }
  }

  // 2. CRITICAL STRUCTURAL CHECKS (Prohibited Existing Building Footprint)
  let structuralViolationCount = 0;
  upperRooms.forEach(room => {
    if (overlapsExistingFootprint(room)) {
      structuralViolationCount++;
      evaluations.push({
        id: `structural-prohibited-${room.id}`,
        category: 'structural',
        title: `BAHAYA STRUKTURAL: ${room.name} di Atas Bangunan Lama`,
        status: 'not-feasible',
        severity: 'critical',
        explanation: `Ruang lantai 2 (${room.name}) berada di atas atap/pondasi bangunan lama (KT 1, KT 2, atau RK). Pondasi eksisting TIDAK DIRANCANG memikul beban lantai 2 dan rawan retak/roboh!`,
        suggestedSolution: 'Pindahkan ruang ini ke koridor ekstensi baru sisi kanan (X: 6m - 9m) atau di atas carport dengan kolom mandiri.',
        affectedRoomIds: [room.id],
      });
      criticalWarnings.push(`BAHAYA STRUKTUR: ${room.name} membebani atap bangunan lama tanpa perkuatan!`);
      structuralDeduction += 12;
    }
  });

  if (structuralViolationCount === 0) {
    strengths.push('Struktur 100% Aman: Tidak ada beban lantai 2 yang menindih atap bangunan lama.');
    evaluations.push({
      id: 'structural-ok',
      category: 'structural',
      title: 'Integritas Struktur Eksisting Terjaga',
      status: 'feasible',
      severity: 'info',
      explanation: 'Seluruh struktur lantai 2 bertumpu pada kolom-balok baru dan pondasi cakar ayam mandiri di sisi kanan dan carport.',
      suggestedSolution: 'Pertahankan batas bebas beban ini pada fase pelaksanaan pembangunan.',
      affectedRoomIds: [],
    });
  }

  // 3. ARCHITECTURE & CIRCULATION EVALUATIONS
  // Total bedroom count check (Target: 6 bedrooms)
  const bedroomCount = allRooms.filter(r => r.id.startsWith('kt')).length;
  if (bedroomCount >= 6) {
    strengths.push(`Kapasitas Penghuni Sempurna: Menampung 6 Kamar Tidur (${bedroomCount} kamar untuk 7 penghuni).`);
  } else {
    weaknesses.push(`Jumlah kamar tidur (${bedroomCount}) kurang dari target 6 kamar.`);
    circulationDeduction += 4;
  }

  // Guest vs Family Separation Check
  const guestRoom = gfRooms.find(r => r.id === 'guest_room');
  const guestBath = gfRooms.find(r => r.id === 'guest_bath');
  const familyBath = gfRooms.find(r => r.id === 'family_bath');
  const serviceArea = gfRooms.find(r => r.id === 'laundry_exit');

  if (guestRoom && guestBath) {
    strengths.push('Pemisahan Privasi Tamu: Ruang tamu memiliki WC tamu mandiri di area depan.');
  }

  // Exit Door & Laundry Circulation Clearance
  if (serviceArea) {
    strengths.push('Area Servis Ergonomis: Pintu belakang membuka ke luar dan sink cuci mepet sudut kanan bawah.');
    evaluations.push({
      id: 'service-circulation-ok',
      category: 'architecture',
      title: 'Sirkulasi Servis Bebas Hambatan (Clearance > 85cm)',
      status: 'feasible',
      severity: 'info',
      explanation: 'Posisi mesin cuci menghadap ke kiri dengan area kerja di koridor samping memastikan mobilisasi keluar-masuk pintu belakang tidak terhalang.',
      suggestedSolution: 'Gunakan daun pintu aluminium/UPVC tahan cuaca dengan bukaan ke luar.',
      affectedRoomIds: ['laundry_exit'],
    });
  }

  // 4. VENTILATION & DAYLIGHT CHECKS
  // Smoking balcony check
  const balcony = upperRooms.find(r => r.id === 'smoking_balcony');
  if (balcony) {
    strengths.push('Zonasi Bebas Asap Rokok: Balkon merokok terletak di depan kanan lantai 2, terisolasi dari KT 1.');
  }

  // Rear lightwell check
  const rearYard = gfRooms.find(r => r.id === 'rear_service_yard');
  const diningArea = gfRooms.find(r => r.id === 'dining_area');
  if (rearYard && diningArea) {
    strengths.push('Pencahayaan & Udara Alami: Ruang makan kaca terhubung langsung dengan taman belakang, memasok cahaya ke Ruang Keluarga.');
  }

  // Bathroom natural ventilation check (Bouvenlight)
  if (familyBath && familyBath.x + familyBath.width >= 8.9) {
    strengths.push('Ventilasi Alami KM Keluarga: KM keluarga menempel di dinding luar kanan dengan bouvenlight langsung.');
  } else if (familyBath) {
    weaknesses.push('KM Keluarga tidak memiliki dinding luar langsung, memerlukan exhaust fan ducting.');
    harmonyDeduction += 3;
  }

  // 4b. FURNITURE CLEARANCE & COLLISION CHECKS (Strictly Same-Floor & Same-Room Relation)
  if (design.furniture && design.furniture.length > 0) {
    const getRoomFloor = (roomId: string): 'GF' | '2F' | null => {
      if (gfRooms.some(r => r.id === roomId)) return 'GF';
      if (upperRooms.some(r => r.id === roomId)) return '2F';
      return null;
    };

    // Check furniture overlaps only on the exact same floor
    for (let i = 0; i < design.furniture.length; i++) {
      for (let j = i + 1; j < design.furniture.length; j++) {
        const f1 = design.furniture[i];
        const f2 = design.furniture[j];

        // 1. Must be on the same floor (never collide GF dining table with 2F KT6 bed!)
        const floor1 = getRoomFloor(f1.roomId);
        const floor2 = getRoomFloor(f2.roomId);
        if (!floor1 || !floor2 || floor1 !== floor2) continue;

        // 2. Skip if either item is wall-mounted high above the floor (e.g. upper cabinet / TV backdrop)
        if (
          (f1.mountType === 'wall-mounted' && (f1.distanceFromFloor || 0) >= 1.1) ||
          (f2.mountType === 'wall-mounted' && (f2.distanceFromFloor || 0) >= 1.1)
        ) {
          continue;
        }

        const overlap = !(
          f1.x + f1.width <= f2.x + 0.05 ||
          f2.x + f2.width <= f1.x + 0.05 ||
          f1.y + f1.depth <= f2.y + 0.05 ||
          f2.y + f2.depth <= f1.y + 0.05
        );
        if (overlap) {
          evaluations.push({
            id: `furn-collision-${f1.id}-${f2.id}`,
            category: 'architecture',
            title: `Tabrakan Furnitur (${floor1 === 'GF' ? 'Lantai 1' : 'Lantai 2'}): ${f1.name} & ${f2.name}`,
            status: 'conditional',
            severity: 'medium',
            explanation: `Furnitur ${f1.name} dan ${f2.name} pada lantai yang sama (${floor1 === 'GF' ? 'Lantai 1' : 'Lantai 2'}) saling bertumpukan di denah.`,
            suggestedSolution: 'Geser posisi salah satu furnitur di ruangan tersebut agar sirkulasi tetap leluasa.',
            affectedRoomIds: Array.from(new Set([f1.roomId, f2.roomId])),
          });
          circulationDeduction += 1;
        }
      }
    }

    // Check washing machine distance to rear exit door
    const wm = design.furniture.find(f => f.type === 'washing-machine');
    if (wm) {
      const exitDoorX = 7.85; // Rear door center
      const exitDoorY = 11.0;
      const dist = Math.hypot(wm.x + wm.width / 2 - exitDoorX, wm.y + wm.depth / 2 - exitDoorY);
      if (dist >= 0.85) {
        strengths.push(`Jarak Mesin Cuci ke Pintu Keluar Aman: ${dist.toFixed(2)}m (> 0.85m bebas hambatan).`);
      } else {
        weaknesses.push(`Mesin cuci terlalu dekat ke pintu keluar (${dist.toFixed(2)}m), berpotensi menghalangi evakuasi.`);
        circulationDeduction += 2;
      }
    }
  }

  // 5. SCORING CALCULATION (Weighted 100-Point Scale)
  const functionalityScore = Math.max(8, Math.min(20, Math.round(20 - geometryDeduction * 0.8)));
  const harmonyScore = Math.max(8, Math.min(20, Math.round(20 - harmonyDeduction)));
  const privacyCirculationScore = Math.max(8, Math.min(20, Math.round(20 - circulationDeduction)));
  const structuralFeasibilityScore = Math.max(4, Math.min(25, Math.round(25 - structuralDeduction)));
  const costEfficiencyScore = Math.max(8, Math.min(15, Math.round(15 - costDeduction)));

  const overallScore = functionalityScore + harmonyScore + privacyCirculationScore + structuralFeasibilityScore + costEfficiencyScore;

  if (suggestions.length === 0) {
    suggestions.push('Pertahankan pintu belakang membuka ke luar untuk memaksimalkan ruang sirkulasi mesin cuci.');
    suggestions.push('Gunakan material kedap suara pada partisi KM Lantai 2 agar tidak mengganggu ketenangan kamar tidur.');
  }

  return {
    overallScore,
    functionalityScore,
    harmonyScore,
    privacyCirculationScore,
    structuralFeasibilityScore,
    costEfficiencyScore,
    strengths,
    weaknesses,
    criticalWarnings,
    suggestions,
    evaluations,
  };
}
