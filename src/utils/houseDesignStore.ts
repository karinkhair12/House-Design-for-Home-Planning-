/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RoomData, EXISTING_ROOMS, GROUND_FLOOR_ALT_B, GROUND_FLOOR_ALT_A, RECOMMENDED_SECOND_FLOOR_ROOMS, SITE_BOUNDARY, ProhibitedZoneData, DEFAULT_PROHIBITED_ZONE, RoofConfig, DEFAULT_ROOF_CONFIG } from './architectureData';
import { calculatePolygonArea } from './geometryMath';
import { DoorData, APPROVED_DESIGN_DOORS, StaircaseConfig, DEFAULT_STAIRCASE_CONFIG, WindowData, APPROVED_DESIGN_WINDOWS } from './doorsAndStairs';
export { formatRupiah } from './costSimulator';

export type FurnitureCategory = 'bedroom' | 'living' | 'kitchen-dining' | 'bathroom' | 'laundry' | 'outdoor' | 'built-in';
export type MountType = 'freestanding' | 'wall-mounted' | 'recessed' | 'integrated';

export interface InternalStorageConfig {
  shelves: number;
  drawers: number;
  hangingSections: number;
  doors: 'swing' | 'sliding' | 'open';
}

export interface MaterialCostSpecs {
  panelType: 'plywood' | 'mdf' | 'solid-wood' | 'hpl';
  hardwareCost: number; // IDR
  laborCost: number; // IDR
}

export interface FurnitureItem {
  id: string;
  roomId: string;
  category?: FurnitureCategory;
  type: string;
  name: string;
  x: number; // meters relative to site origin (0,0)
  y: number;
  width: number; // meters
  depth: number; // meters
  height?: number; // meters
  rotation: number; // degrees 0 - 360
  isLocked?: boolean;
  material?: string;
  // Built-in furniture & wall attachment fields
  mountType?: MountType;
  hostWallId?: string; // 'north' | 'south' | 'east' | 'west' or wall ID
  distanceFromFloor?: number; // meters (elevation from ground / floor slab)
  recessDepth?: number; // meters recessed into wall
  internalConfig?: InternalStorageConfig;
  materialSpecs?: MaterialCostSpecs;
}

export interface FurnitureTemplate {
  type: string;
  name: string;
  category: FurnitureCategory;
  width: number; // meters
  depth: number; // meters
  height: number; // meters
  defaultRotation: number;
  description: string;
  mountType?: MountType;
  isBuiltIn?: boolean;
  defaultDistanceFromFloor?: number;
  defaultRecessDepth?: number;
  defaultInternalConfig?: InternalStorageConfig;
  isUserCustom?: boolean;
}

export const FURNITURE_CATALOG: FurnitureTemplate[] = [
  // Bedroom
  { type: 'bed-single', name: 'Single Bed (120×200)', category: 'bedroom', width: 1.2, depth: 2.0, height: 0.5, defaultRotation: 0, description: 'Tempat tidur anak/remaja standar 120x200 cm' },
  { type: 'bed-queen', name: 'Queen Bed (160×200)', category: 'bedroom', width: 1.6, depth: 2.0, height: 0.55, defaultRotation: 0, description: 'Tempat tidur utama 160x200 cm' },
  { type: 'bed-king', name: 'King Bed (180×200)', category: 'bedroom', width: 1.8, depth: 2.0, height: 0.55, defaultRotation: 0, description: 'Tempat tidur luas 180x200 cm' },
  { type: 'wardrobe', name: 'Lemari Pakaian 3-Pintu', category: 'bedroom', width: 1.8, depth: 0.6, height: 2.1, defaultRotation: 0, description: 'Lemari pakaian standar depth 60 cm' },
  { type: 'wardrobe-2door', name: 'Lemari Pakaian 2-Pintu', category: 'bedroom', width: 1.2, depth: 0.6, height: 2.0, defaultRotation: 0, description: 'Lemari kompak 2 pintu' },
  { type: 'desk', name: 'Meja Kerja / Belajar', category: 'bedroom', width: 1.1, depth: 0.6, height: 0.75, defaultRotation: 0, description: 'Meja laptop dan belajar anak' },
  { type: 'chair', name: 'Kursi Kerja Ergonomis', category: 'bedroom', width: 0.55, depth: 0.55, height: 0.9, defaultRotation: 0, description: 'Kursi putar kerja' },
  { type: 'bookshelf', name: 'Rak Buku Dinding', category: 'bedroom', width: 0.9, depth: 0.35, height: 1.8, defaultRotation: 0, description: 'Rak vertikal minimalis' },

  // Living Room
  { type: 'sofa', name: 'Sofa Tamu 2-Seater', category: 'living', width: 1.8, depth: 0.85, height: 0.8, defaultRotation: 0, description: 'Sofa empuk santai' },
  { type: 'sofa-l', name: 'Sofa Sudut L-Shape', category: 'living', width: 2.4, depth: 1.6, height: 0.8, defaultRotation: 0, description: 'Sofa keluarga kapasitas 5-6 orang' },
  { type: 'sofa-u', name: 'Sofa U-Shape Besar', category: 'living', width: 3.0, depth: 2.2, height: 0.85, defaultRotation: 0, description: 'Sofa format U untuk ruang keluarga luas' },
  { type: 'coffee-table', name: 'Coffee Table', category: 'living', width: 1.2, depth: 0.6, height: 0.45, defaultRotation: 0, description: 'Meja kopi kayu jati' },
  { type: 'round-table', name: 'Meja Kopi Bundar (Dia 80cm)', category: 'living', width: 0.8, depth: 0.8, height: 0.45, defaultRotation: 0, description: 'Meja bulat elegan' },
  { type: 'tv-cabinet', name: 'Credenza & TV Stand', category: 'living', width: 1.8, depth: 0.45, height: 0.5, defaultRotation: 0, description: 'Meja rak TV LED 55-65 inch' },

  // Kitchen & Dining
  { type: 'kitchen-counter', name: 'Kitchen Set Lurus', category: 'kitchen-dining', width: 2.4, depth: 0.6, height: 0.85, defaultRotation: 0, description: 'Meja dapur cor + lemari atas' },
  { type: 'kitchen-l', name: 'Kitchen Set L-Shape Sudut', category: 'kitchen-dining', width: 2.8, depth: 1.8, height: 0.85, defaultRotation: 0, description: 'Kitchen set sudut ergonomis' },
  { type: 'kitchen-u', name: 'Kitchen Set U-Shape Koki', category: 'kitchen-dining', width: 3.0, depth: 2.4, height: 0.85, defaultRotation: 0, description: 'Kitchen set lengkap 3 sisi' },
  { type: 'kitchen-island', name: 'Island Table & Breakfast Bar', category: 'kitchen-dining', width: 1.6, depth: 0.8, height: 0.9, defaultRotation: 0, description: 'Meja saji island multifungsi' },
  { type: 'refrigerator', name: 'Kulkas 2-Pintu', category: 'kitchen-dining', width: 0.7, depth: 0.7, height: 1.75, defaultRotation: 0, description: 'Kulkas inverter hemat energi' },
  { type: 'stove', name: 'Kompor Tanam & Cooker Hood', category: 'kitchen-dining', width: 0.75, depth: 0.5, height: 0.85, defaultRotation: 0, description: 'Kompor 2 tungku gas' },
  { type: 'sink', name: 'Kitchen Sink Cuci Piring', category: 'kitchen-dining', width: 0.8, depth: 0.5, height: 0.85, defaultRotation: 0, description: 'Bak cuci piring stainless steel' },
  { type: 'dining-table', name: 'Meja Makan 6 Kursi', category: 'kitchen-dining', width: 1.6, depth: 0.9, height: 0.75, defaultRotation: 0, description: 'Meja makan keluarga 6 orang' },

  // Bathroom
  { type: 'toilet', name: 'Kloset Duduk Monoblok', category: 'bathroom', width: 0.45, depth: 0.7, height: 0.75, defaultRotation: 0, description: 'Kloset dengan jet washer' },
  { type: 'shower', name: 'Area Shower & Pembatas', category: 'bathroom', width: 0.9, depth: 0.9, height: 2.0, defaultRotation: 0, description: 'Shower head + partisi kaca tempered' },
  { type: 'washbasin', name: 'Wastafel Gantung & Cermin', category: 'bathroom', width: 0.6, depth: 0.45, height: 0.85, defaultRotation: 0, description: 'Wastafel keramik putih' },

  // Laundry
  { type: 'washing-machine', name: 'Mesin Cuci Front Loading', category: 'laundry', width: 0.6, depth: 0.6, height: 0.85, defaultRotation: 270, description: 'Mesin cuci otomatis 8-10 kg' },
  { type: 'dryer', name: 'Mesin Pengering Pakaian', category: 'laundry', width: 0.6, depth: 0.6, height: 0.85, defaultRotation: 0, description: 'Dryer gas/listrik vertikal' },
  { type: 'laundry-sink', name: 'Bak Cuci Manual & Keran', category: 'laundry', width: 0.6, depth: 0.5, height: 0.8, defaultRotation: 0, description: 'Sink cuci baju tangan' },

  // Outdoor
  { type: 'outdoor-bench', name: 'Bangku Teras Santai', category: 'outdoor', width: 1.4, depth: 0.55, height: 0.8, defaultRotation: 0, description: 'Bangku kayu besi tahan cuaca' },
  { type: 'planter', name: 'Pot Tanaman Hias Hijau', category: 'outdoor', width: 0.8, depth: 0.35, height: 0.5, defaultRotation: 0, description: 'Pot tanaman tropis pembersih udara' },

  // Part 4 — Dedicated Built-in Furniture Catalog
  {
    type: 'builtin-wardrobe',
    name: 'Lemari Tanam Dinding (Built-in Wardrobe)',
    category: 'built-in',
    width: 2.0,
    depth: 0.6,
    height: 2.6,
    defaultRotation: 0,
    mountType: 'integrated',
    isBuiltIn: true,
    defaultInternalConfig: { shelves: 4, drawers: 3, hangingSections: 2, doors: 'sliding' },
    description: 'Lemari pakaian terintegrasi plafon hingga lantai, menghemat ruang kamar tidur.',
  },
  {
    type: 'recessed-niche',
    name: 'Lemari Ceruk Dinding (Recessed Wardrobe)',
    category: 'built-in',
    width: 1.5,
    depth: 0.45,
    height: 2.2,
    defaultRotation: 0,
    mountType: 'recessed',
    isBuiltIn: true,
    defaultRecessDepth: 0.15,
    defaultInternalConfig: { shelves: 5, drawers: 2, hangingSections: 1, doors: 'swing' },
    description: 'Lemari tanam di dalam ketebalan/ceruk dinding tanpa mengurangi luas jalan.',
  },
  {
    type: 'wall-desk',
    name: 'Meja Belajar Gantung (Wall-Mounted Desk)',
    category: 'built-in',
    width: 1.2,
    depth: 0.5,
    height: 0.75,
    defaultRotation: 0,
    mountType: 'wall-mounted',
    isBuiltIn: true,
    defaultDistanceFromFloor: 0.75,
    defaultInternalConfig: { shelves: 2, drawers: 2, hangingSections: 0, doors: 'open' },
    description: 'Meja belajar cantilever menempel dinding, lantai bawah tetap bersih dan mudah disapu.',
  },
  {
    type: 'wall-cabinet',
    name: 'Kabinet Dapur Gantung (Upper Kitchen Cabinet)',
    category: 'built-in',
    width: 1.8,
    depth: 0.35,
    height: 0.8,
    defaultRotation: 0,
    mountType: 'wall-mounted',
    isBuiltIn: true,
    defaultDistanceFromFloor: 1.45,
    defaultInternalConfig: { shelves: 3, drawers: 0, hangingSections: 0, doors: 'swing' },
    description: 'Lemari kabinet atas dapur dipasang di atas meja kitchen counter.',
  },
  {
    type: 'under-stair-storage',
    name: 'Lemari Bawah Tangga (Under-Stair Storage)',
    category: 'built-in',
    width: 2.2,
    depth: 0.8,
    height: 1.8,
    defaultRotation: 0,
    mountType: 'integrated',
    isBuiltIn: true,
    defaultInternalConfig: { shelves: 3, drawers: 4, hangingSections: 1, doors: 'swing' },
    description: 'Memanfaatkan rongga miring di bawah tangga untuk sepatu, koper, dan gudang mini.',
  },
  {
    type: 'tv-wall-backdrop',
    name: 'Backdrop TV & Credenza Gantung',
    category: 'built-in',
    width: 2.4,
    depth: 0.4,
    height: 2.4,
    defaultRotation: 0,
    mountType: 'wall-mounted',
    isBuiltIn: true,
    defaultInternalConfig: { shelves: 2, drawers: 3, hangingSections: 0, doors: 'open' },
    description: 'Panel dinding aksen kisi-kisi kayu/HPL dengan meja gantung TV dan hidden LED strip.',
  },
];

export interface FamilyNoteItem {
  id: string;
  roomId?: string;
  roomName?: string;
  floor?: 'GF' | '2F' | 'ALL';
  author: 'Ibu' | 'Ayah' | 'Anak' | 'Keluarga' | string;
  category: 'dapur' | 'ventilasi' | 'ibadah' | 'penyimpanan' | 'keamanan' | 'sirkulasi' | 'lainnya';
  note: string;
  priority: 'harus-ada' | 'diinginkan' | 'opsional';
  x?: number; // relative meter coordinate for visual pin
  y?: number;
  status: 'pending' | 'diterapkan' | 'didiskusikan';
  createdAt: string;
}

export interface MomChecklistItem {
  id: string;
  category: string;
  topic: string;
  question: string;
  options: string[];
  selectedOption: string;
  note?: string;
  isCompleted?: boolean;
}

export const DEFAULT_FAMILY_NOTES: FamilyNoteItem[] = [
  {
    id: 'note-ibu-kitchen',
    roomId: 'kitchen_main',
    roomName: 'Dapur Utama',
    floor: 'GF',
    author: 'Ibu',
    category: 'dapur',
    note: 'Tinggi meja kompor dibuat 80 cm agar tidak cepat pegal saat memasak, dan kabinet gantung jangan terlalu tinggi agar toples bumbu mudah diraih.',
    priority: 'harus-ada',
    x: 4.8,
    y: 9.8,
    status: 'didiskusikan',
    createdAt: '2026-11-02',
  },
  {
    id: 'note-ibu-laundry',
    roomId: 'laundry_exit',
    roomName: 'Area Cuci & Pintu Belakang',
    floor: 'GF',
    author: 'Ibu',
    category: 'ventilasi',
    note: 'Area jemur pakaian dan mesin cuci wajib dapat sinar matahari & angin segar, lantai sedikit miring ke floor drain agar tidak menggenang.',
    priority: 'harus-ada',
    x: 7.8,
    y: 10.3,
    status: 'diterapkan',
    createdAt: '2026-11-02',
  },
  {
    id: 'note-ibu-kt1',
    roomId: 'kt1',
    roomName: 'Kamar Tidur 1 (Utama)',
    floor: 'GF',
    author: 'Ibu',
    category: 'ibadah',
    note: 'Di samping ranjang sisakan area bersih lebar 1 meter untuk tempat sholat gelar sajadah dan lemari mukena tertutup.',
    priority: 'diinginkan',
    x: 1.5,
    y: 4.2,
    status: 'didiskusikan',
    createdAt: '2026-11-03',
  },
];

export const DEFAULT_MOM_CHECKLIST: MomChecklistItem[] = [
  {
    id: 'chk-dapur-konsep',
    category: 'Dapur & Ruang Makan',
    topic: 'Konsep Sirkulasi Dapur',
    question: 'Bagaimana preferensi Ibu terhadap bukaan ruang dapur?',
    options: ['Dapur semi-terbuka menghadap taman belakang (segar & terang)', 'Dapur tertutup dengan pintu pembatas aroma masakan', 'Dapur terhubung langsung tanpa sekat ke ruang makan'],
    selectedOption: 'Dapur semi-terbuka menghadap taman belakang (segar & terang)',
    note: 'Agar asap masakan langsung keluar ke taman belakang.',
    isCompleted: true,
  },
  {
    id: 'chk-jemuran',
    category: 'Area Servis & Cuci',
    topic: 'Area Jemuran & Mesin Cuci',
    question: 'Bagaimana keamanan jemuran saat ditinggal atau saat hujan mendadak?',
    options: ['Atap transparan polikarbonat (bebas hujan tapi panas matahari masuk)', 'Jemuran terbuka penuh dengan kawat pelindung', 'Jemuran portable di balkon lantai 2'],
    selectedOption: 'Atap transparan polikarbonat (bebas hujan tapi panas matahari masuk)',
    note: 'Paling aman saat hujan tiba-tiba ketika Ibu sedang di luar rumah.',
    isCompleted: true,
  },
  {
    id: 'chk-tangga',
    category: 'Keselamatan & Tangga',
    topic: 'Kenyamanan Lutut Saat Naik Tangga',
    question: 'Bagaimana spesifikasi tangga agar tidak melelahkan lutut Ibu?',
    options: ['Tinggi anak tangga landai (maksimal 18 cm) & ada bordes istirahat', 'Tangga standar 20 cm hemat ruang', 'Dilengkapi pegangan tangan ganda kiri dan kanan'],
    selectedOption: 'Tinggi anak tangga landai (maksimal 18 cm) & ada bordes istirahat',
    note: 'Sangat membantu lutut terutama saat membawa pakaian ke lantai 2.',
    isCompleted: true,
  },
  {
    id: 'chk-ibadah',
    category: 'Kenyamanan Spiritual & Keluarga',
    topic: 'Area Sholat Berjamaah',
    question: 'Di mana tempat sholat yang paling tenang untuk keluarga?',
    options: ['Sudut tenang di Ruang Keluarga lantai 1 menghadap kiblat', 'Area sholat khusus di ruang santai lantai 2', 'Cukup di dalam kamar tidur masing-masing'],
    selectedOption: 'Sudut tenang di Ruang Keluarga lantai 1 menghadap kiblat',
    note: 'Bisa sholat maghrib berjamaah dengan anak-anak.',
    isCompleted: true,
  },
  {
    id: 'chk-km-safety',
    category: 'Kamar Mandi',
    topic: 'Keamanan Lantai Kamar Mandi',
    question: 'Kebutuhan fitur keselamatan di kamar mandi:',
    options: ['Keramik kasar anti-licin (R10) & kloset duduk dengan pegangan aman', 'Kloset jongkok tradisional', 'Pembatas kaca kering dan basah agar tidak becek'],
    selectedOption: 'Keramik kasar anti-licin (R10) & kloset duduk dengan pegangan aman',
    note: 'Menghindari resiko terpeleset bagi orang tua dan anak-anak.',
    isCompleted: true,
  },
];

export interface HouseDesignState {
  id: string;
  name: string;
  description: string;
  version: number;
  lastModified: string;
  isReadOnly?: boolean;
  groundFloorRooms: RoomData[];
  secondFloorRooms: RoomData[];
  furniture: FurnitureItem[];
  doors?: DoorData[];
  windows?: WindowData[];
  staircaseConfig?: StaircaseConfig;
  prohibitedZone?: ProhibitedZoneData;
  roofConfig?: RoofConfig;
  familyNotes?: FamilyNoteItem[];
  momChecklist?: MomChecklistItem[];
  customRoomLabels?: Record<string, string>;
}

export const DEFAULT_ROOM_ID_LABELS: Record<string, string> = {
  kt2: 'Kamar Tidur 2',
  kt1: 'Kamar Tidur Utama',
  rk: 'Ruang Keluarga',
  carport: 'Carport Mobil',
  front_terrace: 'Teras Depan',
  guest_room: 'Ruang Tamu',
  powder_room: 'KM Tamu',
  family_bath: 'KM Keluarga',
  kt3: 'Kamar Tidur 3',
  dining_area: 'Ruang Makan',
  kitchen: 'Dapur',
  rear_service_yard: 'Taman & Void',
  stair_hall_gf: 'Area Tangga',
  kt4: 'Kamar Tidur 4',
  kt5: 'Kamar Tidur 5',
  kt6: 'Kamar Tidur 6',
  balkon_front: 'Balkon Depan',
  corridor_2f: 'Koridor 2F',
  bath_2f: 'KM Lantai 2',
};

/**
 * Resolves dynamic text label for a room based on its ID and custom overrides.
 */
export function getDynamicRoomLabel(
  roomId: string,
  room?: RoomData | null,
  customRoomLabels?: Record<string, string>
): string {
  // 1. Direct match in customRoomLabels dictionary
  if (customRoomLabels && customRoomLabels[roomId] && customRoomLabels[roomId].trim().length > 0) {
    return customRoomLabels[roomId].trim();
  }
  // 2. Room object customLabel property
  if (room?.customLabel && room.customLabel.trim().length > 0) {
    return room.customLabel.trim();
  }
  // 3. Room customized indonesianName (strip parenthetical annotations if needed)
  if (room?.indonesianName) {
    const clean = room.indonesianName.split('(')[0].trim();
    if (clean && clean.length > 0) return clean;
  }
  if (room?.name && room.name.trim().length > 0) {
    return room.name.trim();
  }
  // 4. Fallback based on room ID
  if (DEFAULT_ROOM_ID_LABELS[roomId]) {
    return DEFAULT_ROOM_ID_LABELS[roomId];
  }
  // 5. Clean capitalized room ID fallback
  return roomId
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Calculates accurate room area: supports polygon coordinates or fallback to width * depth.
 */
export function calculateRoomArea(room: RoomData): number {
  if (room.polygonPoints && room.polygonPoints.length >= 3) {
    return calculatePolygonArea(room.polygonPoints);
  }
  return Number((room.width * room.depth).toFixed(2));
}

// 1. ORIGINAL DESIGN (APPROVED ARCHITECTURAL DESIGN - SOURCE OF TRUTH)
// This is read-only and preserved as the permanent baseline.
export const ORIGINAL_DESIGN: Readonly<HouseDesignState> = Object.freeze({
  id: 'original-baseline',
  name: 'Desain Awal (Original Baseline - Disetujui)',
  description: 'Hasil perencanaan arsitektur final: Dapur Idaman Ibu, KM 1.5x1.25m pintu kiri, area servis bawah KM (sink kanan, pintu buka luar, mesin cuci hadap kiri), 6 Kamar Tidur, dan struktur mandiri.',
  version: 1,
  lastModified: '2026-11-01',
  isReadOnly: true,
  groundFloorRooms: JSON.parse(JSON.stringify(GROUND_FLOOR_ALT_B)),
  secondFloorRooms: JSON.parse(JSON.stringify(RECOMMENDED_SECOND_FLOOR_ROOMS)),
  furniture: [
    // GF Existing Bedroom 2 (KT 2 Depan: X: 0-3, Y: 2.5-6.0)
    { id: 'f-kt2-bed', roomId: 'kt2', category: 'bedroom', type: 'bed-single', name: 'Single Bed (KT 2)', x: 0.3, y: 2.8, width: 1.2, depth: 2.0, height: 0.5, rotation: 0 },
    { id: 'f-kt2-wardrobe', roomId: 'kt2', category: 'bedroom', type: 'wardrobe', name: 'Wardrobe 2-Pintu', x: 1.6, y: 5.2, width: 1.2, depth: 0.6, height: 2.0, rotation: 0 },
    { id: 'f-kt2-desk', roomId: 'kt2', category: 'bedroom', type: 'desk', name: 'Meja Belajar Anak', x: 1.8, y: 2.8, width: 0.9, depth: 0.5, height: 0.75, rotation: 0 },
    // GF Existing Bedroom 1 (KT 1 Utama: X: 0-3, Y: 6.0-9.0)
    { id: 'f-kt1-bed', roomId: 'kt1', category: 'bedroom', type: 'bed-queen', name: 'Queen Bed (KT 1)', x: 0.3, y: 6.4, width: 1.6, depth: 2.0, height: 0.55, rotation: 0 },
    { id: 'f-kt1-wardrobe', roomId: 'kt1', category: 'bedroom', type: 'wardrobe', name: 'Wardrobe 3-Pintu', x: 1.2, y: 8.2, width: 1.6, depth: 0.6, height: 2.1, rotation: 0 },
    // GF Teras Santai Depan RK (X: 3-6, Y: 0.0-3.0)
    { id: 'f-terrace-bench', roomId: 'front_terrace', category: 'outdoor', type: 'outdoor-bench', name: 'Bangku Teras Santai', x: 3.5, y: 0.6, width: 1.4, depth: 0.55, height: 0.8, rotation: 0 },
    // GF RK (X: 3-6, Y: 3.0-9.0)
    { id: 'f-rk-sofa', roomId: 'rk', category: 'living', type: 'sofa-l', name: 'Sofa Sudut L-Shape Keluarga', x: 3.3, y: 4.5, width: 2.4, depth: 1.6, height: 0.8, rotation: 0 },
    // GF Ruang Tamu (X: 6-9, Y: 0.0-3.0)
    { id: 'f-rt-sofa', roomId: 'guest_room', category: 'living', type: 'sofa', name: 'Sofa Tamu 2-Seater', x: 6.3, y: 1.0, width: 1.8, depth: 0.8, height: 0.8, rotation: 0 },
    { id: 'f-rt-table', roomId: 'guest_room', category: 'living', type: 'coffee-table', name: 'Coffee Table Kayu', x: 6.4, y: 2.0, width: 1.2, depth: 0.5, height: 0.45, rotation: 0 },
    // GF KT 3 (X: 6-9, Y: 5.65-8.5)
    { id: 'f-kt3-bed', roomId: 'kt3', category: 'bedroom', type: 'bed-single', name: 'Single Bed (KT 3)', x: 6.3, y: 6.0, width: 1.2, depth: 2.0, height: 0.5, rotation: 0 },
    // GF Ruang Makan (X: 3-6, Y: 9.0-11.0)
    { id: 'f-dining-table', roomId: 'dining_area', category: 'kitchen-dining', type: 'dining-table', name: 'Meja Makan 6 Kursi', x: 3.7, y: 9.5, width: 1.6, depth: 0.9, height: 0.75, rotation: 0 },
    // GF Service Area di Bawah KM (X: 6-9, Y: 9.75-11.0)
    { id: 'f-washing-machine', roomId: 'laundry_exit', category: 'laundry', type: 'washing-machine', name: 'Mesin Cuci (Hadap Kiri)', x: 6.85, y: 10.05, width: 0.6, depth: 0.6, height: 0.85, rotation: 270 },
    { id: 'f-utility-sink', roomId: 'laundry_exit', category: 'laundry', type: 'sink', name: 'Sink Cuci (Mepet Kanan Bawah)', x: 8.35, y: 10.15, width: 0.55, depth: 0.75, height: 0.85, rotation: 0 },
    // 2F Bedroom 4 (KT 4: X: 7-9, Y: 2-6)
    { id: 'f-kt4-bed', roomId: 'kt4', category: 'bedroom', type: 'bed-single', name: 'Single Bed KT 4', x: 7.2, y: 2.8, width: 1.2, depth: 2.0, height: 0.5, rotation: 0 },
    // 2F Bedroom 5 (KT 5: X: 6-9, Y: 8-11)
    { id: 'f-kt5-bed', roomId: 'kt5', category: 'bedroom', type: 'bed-queen', name: 'Queen Bed KT 5', x: 6.3, y: 8.5, width: 1.6, depth: 2.0, height: 0.55, rotation: 0 },
    // 2F Bedroom 6 (KT 6: X: 3-6, Y: 0-3 di atas teras kanopi)
    { id: 'f-kt6-bed', roomId: 'kt6', category: 'bedroom', type: 'bed-single', name: 'Single Bed KT 6', x: 3.3, y: 0.5, width: 1.2, depth: 1.6, height: 0.5, rotation: 0 },
  ] as FurnitureItem[],
  doors: JSON.parse(JSON.stringify(APPROVED_DESIGN_DOORS)),
  windows: JSON.parse(JSON.stringify(APPROVED_DESIGN_WINDOWS)),
  staircaseConfig: JSON.parse(JSON.stringify(DEFAULT_STAIRCASE_CONFIG)),
  prohibitedZone: JSON.parse(JSON.stringify(DEFAULT_PROHIBITED_ZONE)),
  roofConfig: JSON.parse(JSON.stringify(DEFAULT_ROOF_CONFIG)),
  familyNotes: JSON.parse(JSON.stringify(DEFAULT_FAMILY_NOTES)),
  momChecklist: JSON.parse(JSON.stringify(DEFAULT_MOM_CHECKLIST)),
});

// 2. PRE-SAVED ALTERNATIVE A (Sentralisasi Tangga & KM Bawah Tangga)
export const ALTERNATIVE_A_DESIGN: Readonly<HouseDesignState> = Object.freeze({
  id: 'alternative-a',
  name: 'Alternatif A: Sentralisasi Plumbing Tangga',
  description: 'Konfigurasi sentralisasi pipa: KM Tamu di bawah tangga, KM Keluarga di samping KM Tamu, tangga 2F digeser di atas KM.',
  version: 1,
  lastModified: '2026-11-01',
  isReadOnly: false,
  groundFloorRooms: JSON.parse(JSON.stringify(GROUND_FLOOR_ALT_A)),
  secondFloorRooms: JSON.parse(JSON.stringify(RECOMMENDED_SECOND_FLOOR_ROOMS)),
  furniture: JSON.parse(JSON.stringify(ORIGINAL_DESIGN.furniture)),
  doors: JSON.parse(JSON.stringify(APPROVED_DESIGN_DOORS)),
  windows: JSON.parse(JSON.stringify(APPROVED_DESIGN_WINDOWS)),
  staircaseConfig: JSON.parse(JSON.stringify(DEFAULT_STAIRCASE_CONFIG)),
  prohibitedZone: JSON.parse(JSON.stringify(DEFAULT_PROHIBITED_ZONE)),
  roofConfig: JSON.parse(JSON.stringify(DEFAULT_ROOF_CONFIG)),
  familyNotes: JSON.parse(JSON.stringify(DEFAULT_FAMILY_NOTES)),
  momChecklist: JSON.parse(JSON.stringify(DEFAULT_MOM_CHECKLIST)),
});

// 3. PRE-SAVED OPTION B: SWAPPED STAIRCASE & GUEST BATHROOM (Part 4)
const SWAPPED_GROUND_FLOOR_ROOMS: RoomData[] = GROUND_FLOOR_ALT_B.map(r => {
  if (r.id === 'guest_bath') {
    return {
      ...r,
      name: 'Guest Bathroom (Mepet Dinding Luar Kanan)',
      indonesianName: 'KM Tamu (Dinding Luar Kanan)',
      x: 7.5,
      y: 3.0,
      description: 'KM Tamu ditukar ke sisi luar kanan (X: 7.5 - 9.0m, Y: 3.0 - 5.65m). Kelebihan: Ventilasi udara alami (bouvenlight langsung ke luar) dan pipa air kotor langsung ke dinding samping.',
    };
  }
  if (r.id === 'stair_hall_gf') {
    return {
      ...r,
      name: 'Staircase Hall (Posisi Tengah)',
      indonesianName: 'Tangga Utama (Posisi Tengah)',
      x: 6.0,
      y: 3.0,
      description: 'Tangga ditukar ke posisi tengah (X: 6.0 - 7.5m, Y: 3.0 - 5.65m). Akses lebih dekat ke Ruang Keluarga.',
    };
  }
  return r;
});

export const ALTERNATIVE_SWAPPED_STAIR_BATH: Readonly<HouseDesignState> = Object.freeze({
  id: 'alternative-swapped-stair-bath',
  name: 'Opsi B: Tukar Posisi Tangga & KM Tamu',
  description: 'Hasil evaluasi: Tangga digeser ke X: 6.0m (tengah) dan KM Tamu digeser ke X: 7.5m (dinding luar kanan dengan ventilasi alami).',
  version: 1,
  lastModified: '2026-11-01',
  isReadOnly: false,
  groundFloorRooms: JSON.parse(JSON.stringify(SWAPPED_GROUND_FLOOR_ROOMS)),
  secondFloorRooms: JSON.parse(JSON.stringify(RECOMMENDED_SECOND_FLOOR_ROOMS)),
  furniture: JSON.parse(JSON.stringify(ORIGINAL_DESIGN.furniture)),
  doors: JSON.parse(JSON.stringify(APPROVED_DESIGN_DOORS)).map((d: DoorData) => {
    if (d.id === 'd-guest-bath') {
      return { ...d, x: 7.5, y: 3.0 };
    }
    return d;
  }),
  windows: JSON.parse(JSON.stringify(APPROVED_DESIGN_WINDOWS)),
  staircaseConfig: {
    ...DEFAULT_STAIRCASE_CONFIG,
    x: 6.0,
    y: 3.0,
  },
  prohibitedZone: JSON.parse(JSON.stringify(DEFAULT_PROHIBITED_ZONE)),
  roofConfig: JSON.parse(JSON.stringify(DEFAULT_ROOF_CONFIG)),
  familyNotes: JSON.parse(JSON.stringify(DEFAULT_FAMILY_NOTES)),
  momChecklist: JSON.parse(JSON.stringify(DEFAULT_MOM_CHECKLIST)),
});

// Helper deep clone
export const cloneDesign = (design: HouseDesignState): HouseDesignState => {
  const cloned = JSON.parse(JSON.stringify(design));
  if (!cloned.prohibitedZone) {
    cloned.prohibitedZone = JSON.parse(JSON.stringify(DEFAULT_PROHIBITED_ZONE));
  }
  if (!cloned.roofConfig) {
    cloned.roofConfig = JSON.parse(JSON.stringify(DEFAULT_ROOF_CONFIG));
  }
  if (!cloned.doors) {
    cloned.doors = JSON.parse(JSON.stringify(APPROVED_DESIGN_DOORS));
  }
  if (!cloned.windows) {
    cloned.windows = JSON.parse(JSON.stringify(APPROVED_DESIGN_WINDOWS));
  }
  if (!cloned.staircaseConfig) {
    cloned.staircaseConfig = JSON.parse(JSON.stringify(DEFAULT_STAIRCASE_CONFIG));
  }
  if (!cloned.familyNotes) {
    cloned.familyNotes = JSON.parse(JSON.stringify(DEFAULT_FAMILY_NOTES));
  }
  if (!cloned.momChecklist) {
    cloned.momChecklist = JSON.parse(JSON.stringify(DEFAULT_MOM_CHECKLIST));
  }
  if (!cloned.customRoomLabels) {
    cloned.customRoomLabels = {};
  }
  return cloned;
};

export interface BuiltInCostEstimate {
  panelAreaM2: number;
  plywoodSheets18mm: number;
  hplAreaM2: number;
  materialCost: number; // IDR
  hardwareCost: number; // IDR
  laborCost: number; // IDR
  totalEstimatedCost: number; // IDR
}

/**
 * Calculates realistic custom/built-in furniture fabrication and installation cost in Indonesian Rupiah.
 */
export function calculateBuiltInCost(
  item: FurnitureItem,
  rates = {
    plywoodPerSheet: 285000, // Multiplek 18mm Meranti per sheet (1.22 x 2.44 m ~ 2.97 m2)
    hplPerM2: 180000,        // Taco HPL motif urat kayu / solid doff
    hardwarePerUnit: 350000, // Engsel soft-close slow motion, rel laci tandem, handle aluminium
    laborPerM2: 450000,      // Ongkos tukang finishing mebel / interior fit-out
  }
): BuiltInCostEstimate {
  const w = item.width || 1.2;
  const d = item.depth || 0.6;
  const h = item.height || 2.0;

  // Box calculation: 2 side panels + top + bottom + back panel + internal shelves/dividers
  const shelvesCount = item.internalConfig?.shelves || 3;
  const drawersCount = item.internalConfig?.drawers || 2;

  // Total surface area of panels in square meters
  const sidesArea = 2 * (d * h);
  const topBottomArea = 2 * (w * d);
  const backArea = w * h;
  const shelvesArea = shelvesCount * (w * d);
  const drawerPanels = drawersCount * (2 * (0.15 * d) + 2 * (0.15 * w) + (w * d));

  const totalPanelAreaM2 = Number((sidesArea + topBottomArea + backArea + shelvesArea + drawerPanels).toFixed(2));
  const sheetArea = 1.22 * 2.44; // 2.97 m2 per standard sheet
  const sheetsNeeded = Math.max(1, Math.ceil((totalPanelAreaM2 * 1.15) / sheetArea)); // 15% wastage allowance

  // Exterior facing and doors getting HPL
  const frontDoorsArea = w * h;
  const exteriorSides = 2 * (d * h);
  const totalHplM2 = Number(((frontDoorsArea + exteriorSides) * 1.1).toFixed(2));

  const materialCost = sheetsNeeded * rates.plywoodPerSheet + Math.round(totalHplM2 * rates.hplPerM2);
  const hardwareCost = (item.materialSpecs?.hardwareCost || rates.hardwarePerUnit) + (drawersCount * 90000);
  const laborCost = Math.round(totalPanelAreaM2 * (item.materialSpecs?.laborCost || rates.laborPerM2));
  const totalEstimatedCost = materialCost + hardwareCost + laborCost;

  return {
    panelAreaM2: totalPanelAreaM2,
    plywoodSheets18mm: sheetsNeeded,
    hplAreaM2: totalHplM2,
    materialCost,
    hardwareCost,
    laborCost,
    totalEstimatedCost,
  };
}

// "My Custom Catalog" LocalStorage persistence helper
const CUSTOM_CATALOG_STORAGE_KEY = 'griya9x11_my_custom_catalog_v1';

export function getMyCustomCatalog(): FurnitureTemplate[] {
  try {
    const raw = localStorage.getItem(CUSTOM_CATALOG_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveToCustomCatalog(template: FurnitureTemplate): FurnitureTemplate[] {
  try {
    const existing = getMyCustomCatalog();
    const index = existing.findIndex(t => t.type === template.type);
    let updated: FurnitureTemplate[];
    if (index >= 0) {
      updated = [...existing];
      updated[index] = { ...template, isUserCustom: true };
    } else {
      updated = [...existing, { ...template, isUserCustom: true }];
    }
    localStorage.setItem(CUSTOM_CATALOG_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function deleteFromCustomCatalog(type: string): FurnitureTemplate[] {
  try {
    const existing = getMyCustomCatalog();
    const filtered = existing.filter(t => t.type !== type);
    localStorage.setItem(CUSTOM_CATALOG_STORAGE_KEY, JSON.stringify(filtered));
    return filtered;
  } catch {
    return [];
  }
}

export function duplicateCustomTemplate(sourceType: string): FurnitureTemplate | null {
  try {
    const existing = getMyCustomCatalog();
    const source = existing.find(t => t.type === sourceType) || FURNITURE_CATALOG.find(t => t.type === sourceType);
    if (!source) return null;
    const newTemplate: FurnitureTemplate = {
      ...source,
      type: `custom-${Date.now()}`,
      name: `${source.name} (Copy)`,
      isUserCustom: true,
    };
    saveToCustomCatalog(newTemplate);
    return newTemplate;
  } catch {
    return null;
  }
}

