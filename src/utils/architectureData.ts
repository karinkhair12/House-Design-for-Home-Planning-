/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type WallOpeningType = 'solid' | 'open' | 'railing' | 'open-half-start' | 'open-half-end';

export interface OpenWallConfig {
  north?: WallOpeningType; // Atas / depan di tapak
  south?: WallOpeningType; // Bawah / belakang di tapak
  east?: WallOpeningType;  // Kanan
  west?: WallOpeningType;  // Kiri
}

/**
 * Resolves the open interval [start, end] in local wall coordinates [0, wallLength]
 * for full-open ('open') or half-open ('open-half-start' / 'open-half-end') walls.
 */
export function resolveOpenWallInterval(
  openType: WallOpeningType | undefined,
  wallLength: number
): { start: number; end: number } | null {
  if (!openType || openType === 'solid' || openType === 'railing') return null;
  if (openType === 'open') {
    return { start: 0, end: wallLength };
  }
  const half = Number((wallLength / 2).toFixed(2));
  if (openType === 'open-half-start') {
    return { start: 0, end: half };
  }
  if (openType === 'open-half-end') {
    return { start: half, end: wallLength };
  }
  return null;
}

export interface GlassWallConfig {
  hasGlassWall?: boolean;
  wallSide?: 'north' | 'south' | 'east' | 'west';
  glassWidth?: number; // Custom glass width in meters (e.g. 2.4m)
  glassHeight?: number; // Custom glass height from floor in meters (e.g. 2.6m)
  alignment?: 'left' | 'center' | 'right'; // Placement along the wall (Kiri, Tengah, Kanan)
  glassWidthRatio?: number; // Fallback ratio e.g. 0.8 for 80% width
  panelCount?: 2 | 3 | 4;
  hasCurtain?: boolean;
  curtainType?: 'sheer' | 'blackout';
}

export interface ResolvedGlassWallDimensions {
  wallSide: 'north' | 'south' | 'east' | 'west';
  isHorizontal: boolean;
  totalWallSpan: number;
  maxWallHeight: number;
  glassWidth: number;
  glassHeight: number;
  alignment: 'left' | 'center' | 'right';
  offsetStart: number;
  leftWallSpan: number;
  rightWallSpan: number;
  topWallHeight: number;
  panelCount: 2 | 3 | 4;
  hasCurtain: boolean;
  curtainType: 'sheer' | 'blackout';
}

export function resolveGlassWallDimensions(room: RoomData): ResolvedGlassWallDimensions {
  const gw = room.glassWall || {};
  const wallSide = gw.wallSide || 'north';
  const isHorizontal = wallSide === 'north' || wallSide === 'south';
  const totalWallSpan = Number((isHorizontal ? room.width : room.depth).toFixed(2));
  const maxWallHeight = Number((room.wallHeight || (room.floor === '2F' ? 3.0 : 3.2)).toFixed(2));

  const fallbackRatio = gw.glassWidthRatio !== undefined ? gw.glassWidthRatio : 0.8;
  const defaultWidth = Number((totalWallSpan * fallbackRatio).toFixed(2));
  const rawWidth = gw.glassWidth !== undefined ? gw.glassWidth : defaultWidth;
  const glassWidth = Number(Math.max(0.6, Math.min(totalWallSpan, rawWidth)).toFixed(2));

  const defaultHeight = Number(Math.min(2.6, maxWallHeight - 0.2).toFixed(2));
  const rawHeight = gw.glassHeight !== undefined ? gw.glassHeight : defaultHeight;
  const glassHeight = Number(Math.max(1.0, Math.min(maxWallHeight, rawHeight)).toFixed(2));

  const alignment = gw.alignment || 'center';
  const remainingSpan = Math.max(0, Number((totalWallSpan - glassWidth).toFixed(2)));

  let offsetStart = 0;
  let leftWallSpan = 0;
  let rightWallSpan = 0;

  if (alignment === 'left') {
    offsetStart = 0;
    leftWallSpan = 0;
    rightWallSpan = remainingSpan;
  } else if (alignment === 'right') {
    offsetStart = remainingSpan;
    leftWallSpan = remainingSpan;
    rightWallSpan = 0;
  } else {
    offsetStart = Number((remainingSpan / 2).toFixed(2));
    leftWallSpan = offsetStart;
    rightWallSpan = Math.max(0, Number((remainingSpan - offsetStart).toFixed(2)));
  }

  const topWallHeight = Math.max(0, Number((maxWallHeight - glassHeight).toFixed(2)));
  const panelCount = gw.panelCount || 3;
  const hasCurtain = gw.hasCurtain !== false;
  const curtainType = gw.curtainType || 'sheer';

  return {
    wallSide,
    isHorizontal,
    totalWallSpan,
    maxWallHeight,
    glassWidth,
    glassHeight,
    alignment,
    offsetStart,
    leftWallSpan,
    rightWallSpan,
    topWallHeight,
    panelCount,
    hasCurtain,
    curtainType,
  };
}

export interface SkylightConfig {
  hasSkylight?: boolean;
  gridSpacing?: number; // e.g. 0.5m
  glassTint?: 'clear' | 'frosted' | 'solar';
}

export type FloorFinishType =
  | 'ceramic'
  | 'parquet'
  | 'marble'
  | 'concrete'
  | 'grass'
  | 'wood-deck';

export type WallFinishType =
  | 'white'
  | 'cream'
  | 'sage'
  | 'brick'
  | 'concrete'
  | 'wood';

export type RoofStyleType =
  | 'gable'        // Atap Pelana Memanjang (2 Sisi + Sopi-sopi Segitiga)
  | 'shed'         // Atap Miring 1 Sisi / Skillion Modern
  | 'hip'          // Atap Limas / Perisai Memanjang (4 Sisi)
  | 'flat-parapet'; // Atap Dak Beton Datar + Dinding Parapet Keliling

export type RoofMaterialType =
  | 'spandek-charcoal'
  | 'terracotta-tile'
  | 'bitumen-grey'
  | 'concrete-flat';

export type RoofWallFinishType =
  | 'match-wall'
  | 'cream'
  | 'brick'
  | 'concrete'
  | 'wood-louver';

export interface RoofConfig {
  style: RoofStyleType;
  material: RoofMaterialType;
  wallFinish: RoofWallFinishType;
  customWallColor?: string;
  pitchDegrees: number; // 12 - 35 deg
  parapetHeight: number; // 0.4 - 1.2 m
  showIn3D?: boolean;
}

export const DEFAULT_ROOF_CONFIG: RoofConfig = {
  style: 'gable',
  material: 'spandek-charcoal',
  wallFinish: 'match-wall',
  pitchDegrees: 24,
  parapetHeight: 0.65,
  showIn3D: true,
};

export interface FloorFinishOptionMeta {
  id: FloorFinishType;
  name: string;
  shortDesc: string;
  hexColor: string;
  isOutdoorGarden?: boolean;
  rateEconomyIdr: number;
  rateMidRangeIdr: number;
}

export const FLOOR_FINISH_OPTIONS: FloorFinishOptionMeta[] = [
  {
    id: 'ceramic',
    name: 'Granit / Keramik 60×60',
    shortDesc: 'Putih gading bersih, awet & mudah dipel',
    hexColor: '#f1f5f9',
    rateEconomyIdr: 230000,
    rateMidRangeIdr: 360000,
  },
  {
    id: 'parquet',
    name: 'Parket Kayu / Vinyl Jati',
    shortDesc: 'Serat kayu hangat untuk kamar & keluarga',
    hexColor: '#b45309',
    rateEconomyIdr: 310000,
    rateMidRangeIdr: 480000,
  },
  {
    id: 'marble',
    name: 'Marmer / Granit Slab Mewah',
    shortDesc: 'Putih urat abu mengkilap & elegan',
    hexColor: '#f8fafc',
    rateEconomyIdr: 520000,
    rateMidRangeIdr: 850000,
  },
  {
    id: 'concrete',
    name: 'Semen Poles Industrial',
    shortDesc: 'Abu matte modern & tidak licin',
    hexColor: '#64748b',
    rateEconomyIdr: 195000,
    rateMidRangeIdr: 290000,
  },
  {
    id: 'grass',
    name: 'Rumput Taman + Batu Pijakan',
    shortDesc: 'Rumput hijau hidup, stepping stone & koral putih',
    hexColor: '#15803d',
    isOutdoorGarden: true,
    rateEconomyIdr: 185000,
    rateMidRangeIdr: 285000,
  },
  {
    id: 'wood-deck',
    name: 'Decking Kayu WPC & Koral Taman',
    shortDesc: 'Kayu taman tahan air hujan + batu koral hias',
    hexColor: '#78350f',
    isOutdoorGarden: true,
    rateEconomyIdr: 420000,
    rateMidRangeIdr: 640000,
  },
];

export interface WallFinishOptionMeta {
  id: WallFinishType;
  name: string;
  shortDesc: string;
  hexColor: string;
  rateEconomyIdr: number; // per m2 wall area
  rateMidRangeIdr: number;
}

export const WALL_FINISH_OPTIONS: WallFinishOptionMeta[] = [
  {
    id: 'white',
    name: 'Cat Putih Tropis',
    shortDesc: 'Terang, bersih & memantulkan cahaya',
    hexColor: '#f8fafc',
    rateEconomyIdr: 38000,
    rateMidRangeIdr: 58000,
  },
  {
    id: 'cream',
    name: 'Krem Hangat (Warm Beige)',
    shortDesc: 'Suasana hangat & nyaman di mata',
    hexColor: '#fef3c7',
    rateEconomyIdr: 40000,
    rateMidRangeIdr: 62000,
  },
  {
    id: 'sage',
    name: 'Hijau Sage Sejuk',
    shortDesc: 'Nuansa tropis segar & menenangkan',
    hexColor: '#a7f3d0',
    rateEconomyIdr: 42000,
    rateMidRangeIdr: 65000,
  },
  {
    id: 'brick',
    name: 'Bata Ekspos Terracotta',
    shortDesc: 'Dinding aksen bata merah natural',
    hexColor: '#c2410c',
    rateEconomyIdr: 135000,
    rateMidRangeIdr: 210000,
  },
  {
    id: 'concrete',
    name: 'Beton Ekspos Industrial',
    shortDesc: 'Tekstur acian semen ekspos modern',
    hexColor: '#94a3b8',
    rateEconomyIdr: 65000,
    rateMidRangeIdr: 110000,
  },
  {
    id: 'wood',
    name: 'Panel Kisi Kayu (WPC)',
    shortDesc: 'Aksen dinding kayu fluted mewah',
    hexColor: '#78350f',
    rateEconomyIdr: 240000,
    rateMidRangeIdr: 380000,
  },
];

export const ROOF_STYLE_OPTIONS: {
  id: RoofStyleType;
  name: string;
  shortDesc: string;
  rateMultiplier: number;
}[] = [
  {
    id: 'gable',
    name: 'Atap Pelana Memanjang (Gable)',
    shortDesc: 'Miring 2 sisi klasik dengan dinding sopi-sopi segitiga, paling sejuk & bebas bocor',
    rateMultiplier: 1.0,
  },
  {
    id: 'shed',
    name: 'Atap Miring 1 Sisi (Skillion)',
    shortDesc: 'Miring 1 arah minimalis modern dengan dinding sopi-sopi miring tinggi',
    rateMultiplier: 0.95,
  },
  {
    id: 'hip',
    name: 'Atap Limas / Perisai Memanjang',
    shortDesc: 'Miring 4 sisi elegan menutup seluruh keliling bangunan, kokoh terhadap angin',
    rateMultiplier: 1.15,
  },
  {
    id: 'flat-parapet',
    name: 'Atap Dak Datar + Dinding Parapet',
    shortDesc: 'Gaya kubis modern dengan dinding parapet keliling tinggi menutup tepi atap',
    rateMultiplier: 1.22,
  },
];

export const ROOF_MATERIAL_OPTIONS: {
  id: RoofMaterialType;
  name: string;
  hexColor: string;
  rateEconomyIdr: number;
  rateMidRangeIdr: number;
}[] = [
  {
    id: 'spandek-charcoal',
    name: 'Spandek Pasir Peredam (Hitam Charcoal)',
    hexColor: '#1e293b',
    rateEconomyIdr: 275000,
    rateMidRangeIdr: 390000,
  },
  {
    id: 'terracotta-tile',
    name: 'Genteng Keramik / Tanah Liat (Terracotta)',
    hexColor: '#c2410c',
    rateEconomyIdr: 340000,
    rateMidRangeIdr: 490000,
  },
  {
    id: 'bitumen-grey',
    name: 'Genteng Aspal Bitumen (Abu Tua)',
    hexColor: '#334155',
    rateEconomyIdr: 380000,
    rateMidRangeIdr: 540000,
  },
  {
    id: 'concrete-flat',
    name: 'Dak Beton Waterproof (Abu Terang)',
    hexColor: '#cbd5e1',
    rateEconomyIdr: 450000,
    rateMidRangeIdr: 650000,
  },
];

export const ROOF_WALL_FINISH_OPTIONS: {
  id: RoofWallFinishType;
  name: string;
  hexColor: string;
  extraCostIdr: number;
}[] = [
  {
    id: 'match-wall',
    name: 'Senada Dinding Rumah (Putih Bersih)',
    hexColor: '#f8fafc',
    extraCostIdr: 0,
  },
  {
    id: 'cream',
    name: 'Cat Krem Hangat Tropis',
    hexColor: '#fef3c7',
    extraCostIdr: 450000,
  },
  {
    id: 'brick',
    name: 'Dinding Sopi-Sopi Bata Ekspos',
    hexColor: '#c2410c',
    extraCostIdr: 2400000,
  },
  {
    id: 'concrete',
    name: 'Dinding Parapet Beton Industrial',
    hexColor: '#64748b',
    extraCostIdr: 1500000,
  },
  {
    id: 'wood-louver',
    name: 'Aksen Kisi Kayu & Roster Angin Atap',
    hexColor: '#78350f',
    extraCostIdr: 3200000,
  },
];

export interface RoomData {
  id: string;
  name: string;
  indonesianName: string;
  customLabel?: string; // Optional user customized room label (e.g. 'Home Office', 'Studio')
  floor: 'GF' | '2F';
  x: number; // meters from top-left (0,0)
  y: number; // meters from top-left (0,0)
  width: number; // meters
  depth: number; // meters
  clearWidth: number; // internal clear meters
  clearDepth: number; // internal clear meters
  area: number; // square meters
  status: 'existing' | 'new-gf' | 'new-2f';
  occupants?: string;
  ventilation: string;
  daylight: string;
  structuralZone: 'prohibited-above' | 'new-structural-frame' | 'open-ground';
  description: string;
  polygonPoints?: { x: number; y: number }[]; // Arbitrary polygon vertices
  wallThickness?: number; // meters (default 0.15m)
  wallHeight?: number; // meters (default 3.2m GF, 3.0m 2F)
  floorFinish?: FloorFinishType;
  wallFinish?: WallFinishType;
  wallColor?: string; // Custom hex color override for room walls (e.g. '#e0f2fe')
  openWalls?: OpenWallConfig; // Dinding custom terbuka / railing / solid per sisi
  glassWall?: GlassWallConfig; // Dinding kaca geser kustom dengan tirai/horden
  skylight?: SkylightConfig; // Atap kaca transparan skylight (void/taman)
  isLocked?: boolean;
  isLinkedToGround?: boolean; // Linked component to Ground Floor
  groundParentId?: string; // ID of ground floor room it is linked to
}

export interface ProhibitedZoneData {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  depth: number;
  isLocked?: boolean;
  isVisible?: boolean;
  polygonPoints?: { x: number; y: number }[];
}

export interface SiteBoundary {
  width: number; // 9 meters
  depth: number; // 11 meters
  totalArea: number; // 99 m2
}

export const SITE_BOUNDARY: SiteBoundary = {
  width: 9.0,
  depth: 11.0,
  totalArea: 99.0,
};

// Existing rooms defined in the uploaded PENUP sketches and verified by user:
// Total length KT1 + KT2 = 6.5m (KT2: 3.5m, KT1: 3.0m). RK length = 6.0m (Y: 3.0m - 9.0m).
export const EXISTING_ROOMS: RoomData[] = [
  {
    id: 'kt2',
    name: 'Bedroom 2 (Front Children)',
    indonesianName: 'Kamar Tidur 2 (KT 2 - Depan)',
    floor: 'GF',
    x: 0.0,
    y: 2.5,
    width: 3.0,
    depth: 3.5,
    clearWidth: 2.7,
    clearDepth: 3.2,
    area: 10.5,
    status: 'existing',
    occupants: '1-2 Children',
    ventilation: 'Dinding masif tanpa jendela; sirkulasi udara melalui pintu kamar ke Ruang Keluarga',
    daylight: 'Pencahayaan interior & tidak langsung dari Ruang Keluarga',
    structuralZone: 'prohibited-above',
    description: 'Kamar tidur 2 anak bagian depan (Y: 2.5m - 6.0m, kedalaman 3.5m). Dinding masif tanpa jendela, dipertahankan 1 lantai tanpa beban dak di atasnya.',
  },
  {
    id: 'kt1',
    name: 'Bedroom 1 (Master / Parents)',
    indonesianName: 'Kamar Tidur 1 (KT 1 - Utama)',
    floor: 'GF',
    x: 0.0,
    y: 6.0,
    width: 3.0,
    depth: 3.0,
    clearWidth: 2.7,
    clearDepth: 2.7,
    area: 9.0,
    status: 'existing',
    occupants: '2 Parents',
    ventilation: 'Dinding masif tanpa jendela; sirkulasi udara melalui pintu kamar ke Ruang Keluarga',
    daylight: 'Pencahayaan interior & tidak langsung dari Ruang Keluarga',
    structuralZone: 'prohibited-above',
    description: 'Kamar tidur 1 utama orang tua (Y: 6.0m - 9.0m, kedalaman 3.0m). Dinding masif tanpa jendela, posisi tenang di bagian dalam.',
  },
  {
    id: 'rk',
    name: 'Family Room',
    indonesianName: 'Ruang Keluarga (RK)',
    floor: 'GF',
    x: 3.0,
    y: 3.0,
    width: 3.0,
    depth: 6.0,
    clearWidth: 2.7,
    clearDepth: 5.7,
    area: 18.0,
    status: 'existing',
    occupants: 'All 7 family members',
    ventilation: 'Sirkulasi silang ke teras santai depan dan ruang makan belakang',
    daylight: 'Terang alami tembus dari ruang tamu dan void belakang',
    structuralZone: 'prohibited-above',
    description: 'Ruang keluarga luas (3m x 6.0m, Y: 3.0m - 9.0m) menjadi pusat kebersamaan keluarga.',
    openWalls: {
      north: 'solid',
      south: 'open',
      east: 'solid',
      west: 'solid',
    },
  },
];

// Alternatif A: Sentralisasi Plumbing (KM Bawah Tangga & KM Keluarga di Sampingnya)
export const GROUND_FLOOR_ALT_A: RoomData[] = [
  ...EXISTING_ROOMS,
  {
    id: 'carport',
    name: 'Carport Mobil',
    indonesianName: 'Carport Mobil Depan KT 2',
    floor: 'GF',
    x: 0.0,
    y: 0.0,
    width: 3.0,
    depth: 2.5,
    clearWidth: 2.8,
    clearDepth: 2.35,
    area: 7.5,
    status: 'new-gf',
    ventilation: 'Terbuka luar',
    daylight: 'Cahaya penuh',
    structuralZone: 'open-ground',
    description: 'Carport mobil (3.0m x 2.5m, Y: 0.0m - 2.5m) tepat di atas KT 2.',
    openWalls: {
      north: 'open',
      east: 'solid',
      south: 'solid',
      west: 'solid',
    },
  },
  {
    id: 'front_terrace',
    name: 'Front Relax Terrace',
    indonesianName: 'Teras Santai Kanopi Depan RK',
    floor: 'GF',
    x: 3.0,
    y: 0.0,
    width: 3.0,
    depth: 3.0,
    clearWidth: 2.8,
    clearDepth: 2.85,
    area: 9.0,
    status: 'new-gf',
    ventilation: 'Terbuka segar dengan kanopi peneduh',
    daylight: 'Cahaya pagi melimpah',
    structuralZone: 'open-ground',
    description: 'Teras santai keluarga berkanopi (3.0m x 3.0m, Y: 0.0m - 3.0m) tepat di depan Ruang Keluarga.',
    openWalls: {
      north: 'open',
      east: 'solid',
      south: 'solid',
      west: 'solid',
    },
  },
  {
    id: 'guest_room',
    name: 'Guest Living Room',
    indonesianName: 'Ruang Tamu',
    floor: 'GF',
    x: 6.0,
    y: 0.0,
    width: 3.0,
    depth: 3.0,
    clearWidth: 2.7,
    clearDepth: 2.8,
    area: 9.0,
    status: 'new-gf',
    ventilation: 'Dedicated louvered windows and direct outdoor door',
    daylight: 'Front street orientation daylight',
    structuralZone: 'new-structural-frame',
    description: 'Ruang tamu privat (3.0m x 3.0m, Y: 0.0m - 3.0m) dengan pintu masuk dari teras.',
    glassWall: {
      hasGlassWall: true,
      wallSide: 'north',
      glassWidth: 2.4,
      glassHeight: 2.6,
      alignment: 'center',
      glassWidthRatio: 0.8,
      panelCount: 3,
      hasCurtain: true,
      curtainType: 'sheer',
    },
  },
  {
    id: 'guest_bath',
    name: 'Guest Bathroom (Under Stairs)',
    indonesianName: 'KM Tamu (Di Bawah Tangga)',
    floor: 'GF',
    x: 6.0,
    y: 3.0,
    width: 1.5,
    depth: 2.65,
    clearWidth: 1.3,
    clearDepth: 2.45,
    area: 3.98,
    status: 'new-gf',
    ventilation: 'Ventilasi buatan (exhaust fan)',
    daylight: 'Lampu penerangan buatan',
    structuralZone: 'new-structural-frame',
    description: 'KM Tamu diposisikan di bawah tangga (Y: 3.0m - 5.65m), pintu diakses langsung dari ruang tamu.',
  },
  {
    id: 'family_bath',
    name: 'Family Bathroom (Beside Under-Stairs Bath)',
    indonesianName: 'KM Keluarga (Samping KM Tamu)',
    floor: 'GF',
    x: 7.5,
    y: 3.0,
    width: 1.5,
    depth: 2.65,
    clearWidth: 1.3,
    clearDepth: 2.45,
    area: 3.98,
    status: 'new-gf',
    ventilation: 'Ventilasi mekanis exhaust ducting',
    daylight: 'Lampu penerangan plafon',
    structuralZone: 'new-structural-frame',
    description: 'KM Keluarga di samping KM Tamu, pintu diakses dari Ruang Keluarga.',
  },
  {
    id: 'kt3',
    name: 'Bedroom 3 (Ground Floor)',
    indonesianName: 'Kamar Tidur 3 (KT 3)',
    floor: 'GF',
    x: 6.0,
    y: 5.65,
    width: 3.0,
    depth: 2.85,
    clearWidth: 2.7,
    clearDepth: 2.55,
    area: 8.55,
    status: 'new-gf',
    occupants: '1-2 Children',
    ventilation: 'Window opening to side lightwell',
    daylight: 'Side lightwell natural daylight',
    structuralZone: 'new-structural-frame',
    description: 'Kamar tidur ketiga lantai dasar (3m x 2.85m, Y: 5.65m - 8.5m).',
  },
  {
    id: 'dining_area',
    name: 'Dining Area (Behind RK)',
    indonesianName: 'Ruang Makan Kaca (Belakang RK)',
    floor: 'GF',
    x: 3.0,
    y: 9.0,
    width: 3.0,
    depth: 2.0,
    clearWidth: 2.8,
    clearDepth: 1.85,
    area: 6.0,
    status: 'new-gf',
    ventilation: 'Pintu kaca geser ke taman void belakang',
    daylight: 'Cahaya langsung membanjiri ruang keluarga',
    structuralZone: 'new-structural-frame',
    description: 'Ruang makan terang (3.0m x 2.0m, Y: 9.0m - 11.0m) di belakang RK dengan dinding kaca geser ke void.',
    openWalls: {
      north: 'open',
      south: 'solid',
      east: 'solid',
      west: 'solid',
    },
    glassWall: {
      hasGlassWall: true,
      wallSide: 'west',
      glassWidth: 1.7,
      glassHeight: 2.6,
      alignment: 'center',
      glassWidthRatio: 0.85,
      panelCount: 3,
      hasCurtain: true,
      curtainType: 'sheer',
    },
  },
  {
    id: 'kitchen',
    name: 'Kitchen (Rear Right)',
    indonesianName: 'Dapur (Belakang Kanan)',
    floor: 'GF',
    x: 6.0,
    y: 8.5,
    width: 3.0,
    depth: 2.5,
    clearWidth: 2.8,
    clearDepth: 2.3,
    area: 7.5,
    status: 'new-gf',
    ventilation: 'Jendela servis ke luar',
    daylight: 'Terang alami',
    structuralZone: 'new-structural-frame',
    description: 'Dapur belakang kanan (Y: 8.5m - 11.0m).',
  },
  {
    id: 'rear_service_yard',
    name: 'Rear Open Void & Yard',
    indonesianName: 'Taman Void Terbuka Belakang KT 1',
    floor: 'GF',
    x: 0.0,
    y: 9.0,
    width: 3.0,
    depth: 2.0,
    clearWidth: 2.8,
    clearDepth: 1.85,
    area: 6.0,
    status: 'new-gf',
    ventilation: 'Open courtyard void',
    daylight: 'Abundant rear daylight',
    structuralZone: 'open-ground',
    description: 'Taman void terbuka hijau (3.0m x 2.0m, Y: 9.0m - 11.0m) di belakang KT 1 dengan opsi atap kaca skylight transparan.',
    floorFinish: 'grass',
    openWalls: {
      north: 'solid',
      south: 'solid',
      west: 'solid',
      east: 'open',
    },
    skylight: {
      hasSkylight: true,
      gridSpacing: 0.6,
      glassTint: 'clear',
    },
  },
];

// Alternatif B: Dapur Luas Idaman Ibu di Ujung Kanan & KM Minimalis 1.25x1.5m
export const GROUND_FLOOR_ALT_B: RoomData[] = [
  ...EXISTING_ROOMS,
  {
    id: 'carport',
    name: 'Carport Mobil',
    indonesianName: 'Carport Mobil Depan KT 2',
    floor: 'GF',
    x: 0.0,
    y: 0.0,
    width: 3.0,
    depth: 2.5,
    clearWidth: 2.8,
    clearDepth: 2.35,
    area: 7.5,
    status: 'new-gf',
    ventilation: 'Terbuka luar',
    daylight: 'Cahaya penuh',
    structuralZone: 'open-ground',
    description: 'Carport mobil (3.0m x 2.5m, Y: 0.0m - 2.5m) tepat di atas KT 2.',
    openWalls: {
      north: 'open',
      east: 'solid',
      south: 'solid',
      west: 'solid',
    },
  },
  {
    id: 'front_terrace',
    name: 'Front Relax Terrace',
    indonesianName: 'Teras Santai Kanopi Depan RK',
    floor: 'GF',
    x: 3.0,
    y: 0.0,
    width: 3.0,
    depth: 3.0,
    clearWidth: 2.8,
    clearDepth: 2.85,
    area: 9.0,
    status: 'new-gf',
    ventilation: 'Terbuka segar dengan kanopi peneduh',
    daylight: 'Cahaya pagi melimpah',
    structuralZone: 'open-ground',
    description: 'Teras santai keluarga berkanopi (3.0m x 3.0m, Y: 0.0m - 3.0m) tepat di depan Ruang Keluarga.',
    openWalls: {
      north: 'open',
      east: 'solid',
      south: 'solid',
      west: 'solid',
    },
  },
  {
    id: 'guest_room',
    name: 'Guest Living Room',
    indonesianName: 'Ruang Tamu',
    floor: 'GF',
    x: 6.0,
    y: 0.0,
    width: 3.0,
    depth: 3.0,
    clearWidth: 2.7,
    clearDepth: 2.8,
    area: 9.0,
    status: 'new-gf',
    ventilation: 'Dedicated louvered windows and direct outdoor door',
    daylight: 'Front street orientation daylight',
    structuralZone: 'new-structural-frame',
    description: 'Ruang tamu privat (3.0m x 3.0m, Y: 0.0m - 3.0m) dengan pintu masuk dari teras depan.',
    openWalls: {
      north: 'solid',
      south: 'open-half-end',
      east: 'solid',
      west: 'solid',
    },
    glassWall: {
      hasGlassWall: true,
      wallSide: 'north',
      glassWidth: 2.4,
      glassHeight: 2.6,
      alignment: 'center',
      glassWidthRatio: 0.8,
      panelCount: 3,
      hasCurtain: true,
      curtainType: 'sheer',
    },
  },
  {
    id: 'guest_bath',
    name: 'Guest Bathroom (WC Tamu)',
    indonesianName: 'Kamar Mandi Tamu (WC Tamu)',
    floor: 'GF',
    x: 6.0,
    y: 3.0,
    width: 1.5,
    depth: 2.65,
    clearWidth: 1.3,
    clearDepth: 2.45,
    area: 3.98,
    status: 'new-gf',
    ventilation: 'Exhaust vent & bouvenlight',
    daylight: 'Translucent door/vent',
    structuralZone: 'new-structural-frame',
    description: 'WC Tamu di samping tangga (Y: 3.0m - 5.65m).',
    openWalls: {
      north: 'solid',
      south: 'solid',
      east: 'solid',
      west: 'solid',
    },
  },
  {
    id: 'stair_hall_gf',
    name: 'Staircase Hall & Storage',
    indonesianName: 'Tangga & Gudang Bawah Tangga',
    floor: 'GF',
    x: 7.5,
    y: 3.0,
    width: 1.5,
    depth: 2.65,
    clearWidth: 1.3,
    clearDepth: 2.45,
    area: 3.98,
    status: 'new-gf',
    ventilation: 'Natural chimney effect ventilation to 2F',
    daylight: 'Stairwell clerestory daylight',
    structuralZone: 'new-structural-frame',
    description: 'Tangga konstruksi baru (X: 7.5 - 9.0m, Y: 3.0m - 5.65m). Ruang bawah tangga dimanfaatkan untuk gudang mini/vacuum.',
    openWalls: {
      north: 'open',
      south: 'solid',
      east: 'solid',
      west: 'solid',
    },
  },
  {
    id: 'kt3',
    name: 'Bedroom 3 (Ground Floor)',
    indonesianName: 'Kamar Tidur 3 (KT 3)',
    floor: 'GF',
    x: 6.0,
    y: 5.65,
    width: 3.0,
    depth: 2.85,
    clearWidth: 2.7,
    clearDepth: 2.55,
    area: 8.55,
    status: 'new-gf',
    occupants: '1-2 Children',
    ventilation: 'Window opening to side garden / lightwell',
    daylight: 'Side lightwell natural daylight',
    structuralZone: 'new-structural-frame',
    description: 'Kamar tidur 3 lantai dasar (3m x 2.85m, Y: 5.65m - 8.5m).',
  },
  {
    id: 'dining_area',
    name: 'Dining Area (Wide View to Garden)',
    indonesianName: 'Ruang Makan Kaca (Belakang RK)',
    floor: 'GF',
    x: 3.0,
    y: 9.0,
    width: 3.0,
    depth: 2.0,
    clearWidth: 2.8,
    clearDepth: 1.85,
    area: 6.0,
    status: 'new-gf',
    ventilation: 'Pintu kaca geser lebar menghadap taman void belakang',
    daylight: 'Cahaya matahari melimpah masuk ke Ruang Keluarga',
    structuralZone: 'new-structural-frame',
    description: 'Ruang makan lapang langsung di belakang RK (3.0m x 2.0m, Y: 9.0m - 11.0m) dengan pintu kaca geser menghadap taman void belakang.',
    openWalls: {
      north: 'open',
      south: 'solid',
      east: 'solid',
      west: 'solid',
    },
    glassWall: {
      hasGlassWall: true,
      wallSide: 'west',
      glassWidth: 1.7,
      glassHeight: 2.6,
      alignment: 'center',
      glassWidthRatio: 0.85,
      panelCount: 3,
      hasCurtain: true,
      curtainType: 'sheer',
    },
  },
  {
    id: 'family_bath',
    name: 'Family Bathroom (KM Keluarga)',
    indonesianName: 'KM Keluarga (1.5m Kanan-Kiri × 1.25m Atas-Bawah)',
    floor: 'GF',
    x: 7.5,
    y: 8.5,
    width: 1.5,
    depth: 1.25,
    clearWidth: 1.35,
    clearDepth: 1.1,
    area: 1.88,
    status: 'new-gf',
    ventilation: 'Bouvenlight kaca ke dinding luar kanan',
    daylight: 'Jendela atas ventilasi alami dinding kanan',
    structuralZone: 'new-structural-frame',
    description: 'KM Keluarga kompak: lebar kanan-ke-kiri 1.5m, kedalaman atas-ke-bawah 1.25m, mepet dinding kanan tapak. Pintu masuk di sisi kiri dari lorong sirkulasi. Dilengkapi shower, kloset duduk, dan bouvenlight ventilasi alami ke dinding kanan.',
  },
  {
    id: 'kitchen',
    name: 'Spacious Kitchen & Prep Counter',
    indonesianName: 'Dapur Masak Idaman Ibu & Meja Persiapan',
    floor: 'GF',
    x: 6.0,
    y: 8.5,
    width: 1.5,
    depth: 1.25,
    clearWidth: 1.4,
    clearDepth: 1.1,
    area: 1.88,
    status: 'new-gf',
    ventilation: 'Exhaust hood & sirkulasi udara bebas',
    daylight: 'Terang alami terhubung ke Ruang Makan Kaca',
    structuralZone: 'new-structural-frame',
    description: 'Area dapur & lorong servis di sebelah kiri KM (X: 6.0m - 7.5m, Y: 8.5m - 9.75m) yang menghubungkan Ruang Makan, pintu KM, dan area servis belakang.',
  },
  {
    id: 'laundry_exit',
    name: 'Laundry, Exit Door & Utility Sink',
    indonesianName: 'Area Mesin Cuci, Pintu Belakang & Sink Sudut Kanan',
    floor: 'GF',
    x: 6.0,
    y: 9.75,
    width: 3.0,
    depth: 1.25,
    clearWidth: 2.85,
    clearDepth: 1.1,
    area: 3.75,
    status: 'new-gf',
    ventilation: 'Pintu belakang membuka ke luar & ventilasi terbuka',
    daylight: 'Cahaya alami langsung dari pintu belakang',
    structuralZone: 'new-structural-frame',
    description: 'Zona servis di bawah KM: Mesin cuci di kiri bawah KM (depan menghadap ke kiri), Pintu keluar belakang di samping sink (buka ke arah luar), dan Sink cuci mepet pojok kanan bawah rumah.',
  },
  {
    id: 'rear_service_yard',
    name: 'Rear Open Void & Yard',
    indonesianName: 'Taman Void Terbuka Belakang KT 1',
    floor: 'GF',
    x: 0.0,
    y: 9.0,
    width: 3.0,
    depth: 2.0,
    clearWidth: 2.8,
    clearDepth: 1.85,
    area: 6.0,
    status: 'new-gf',
    ventilation: 'Open courtyard void',
    daylight: 'Abundant rear daylight',
    structuralZone: 'open-ground',
    description: 'Taman void terbuka hijau (3.0m x 2.0m, Y: 9.0m - 11.0m) di belakang KT 1 dengan opsi atap kaca transparan skylight.',
    floorFinish: 'grass',
    openWalls: {
      north: 'solid',
      south: 'solid',
      west: 'solid',
      east: 'open',
    },
    skylight: {
      hasSkylight: true,
      gridSpacing: 0.6,
      glassTint: 'clear',
    },
  },
];

// Default recommended is Alternative B because it solves daylight and matches Ibu's preference!
export const RECOMMENDED_GROUND_FLOOR_ROOMS: RoomData[] = GROUND_FLOOR_ALT_B;

// Recommended Layout - Second Floor (Upper Extension)
// Strictly built on the right extension and independent front columns!
// Strictly NO structural load over KT1, KT2, and RK!
export const RECOMMENDED_SECOND_FLOOR_ROOMS: RoomData[] = [
  {
    id: 'smoking_balcony',
    name: 'Smoking Balcony (Front)',
    indonesianName: 'Balkon Merokok Depan',
    floor: '2F',
    x: 6.0,
    y: 0.0,
    width: 3.0,
    depth: 2.0,
    clearWidth: 2.7,
    clearDepth: 1.8,
    area: 6.0,
    status: 'new-2f',
    ventilation: 'Open outdoor breeze facing front street',
    daylight: 'Full daylight',
    structuralZone: 'new-structural-frame',
    description: 'Front-facing outdoor balcony designed for smoking visitors. Positioned at front-right, far from KT1 windows (at left side) to prevent smoke entry. Accessible directly from the corridor without passing through any bedroom.',
    openWalls: {
      north: 'railing', // Pagar balkon depan 0.9m
      east: 'railing',  // Pagar balkon kanan 0.9m
      south: 'solid',
      west: 'solid',
    },
  },
  {
    id: 'corridor_2f',
    name: 'Upper Gallery Corridor (Direct Balcony Access)',
    indonesianName: 'Koridor Galeri Akses Bebas ke Balkon & KT 6',
    floor: '2F',
    x: 6.0,
    y: 2.0,
    width: 1.0,
    depth: 4.0,
    clearWidth: 1.0,
    clearDepth: 4.0,
    area: 4.0,
    status: 'new-2f',
    ventilation: 'Cross-ventilation from front balcony to stairwell',
    daylight: 'Direct sunlight from balcony glass door and skylight',
    structuralZone: 'new-structural-frame',
    description: 'Dedicated 1.0-meter wide circulation hallway running alongside KT 4. Provides direct, unobstructed access from the stairs to the smoking balcony and KT 6 without crossing KT 4.',
  },
  {
    id: 'kt4',
    name: 'Bedroom 4 (Upper Linear Room 2m x 4m)',
    indonesianName: 'Kamar Tidur 4 (KT 4)',
    floor: '2F',
    x: 7.0,
    y: 2.0,
    width: 2.0,
    depth: 4.0,
    clearWidth: 1.85,
    clearDepth: 3.85,
    area: 8.0,
    status: 'new-2f',
    occupants: '1 Child',
    ventilation: 'East-facing exterior window with sun louvers',
    daylight: 'Morning sunlight',
    structuralZone: 'new-structural-frame',
    description: 'Upper bedroom planned per Section 3 (2m x 4m standard). Fitted with a 120x200cm bed, wardrobe, study station, and private door opening to the corridor. Does NOT block balcony circulation.',
  },
  {
    id: 'stair_hall_2f',
    name: 'Upper Stair Landing',
    indonesianName: 'Bordes Tangga 2F',
    floor: '2F',
    x: 6.0,
    y: 6.0,
    width: 1.2,
    depth: 2.0,
    clearWidth: 1.1,
    clearDepth: 1.85,
    area: 2.4,
    status: 'new-2f',
    ventilation: 'Upper clerestory ventilation louvers (stack effect)',
    daylight: 'Skylight illumination',
    structuralZone: 'new-structural-frame',
    description: 'Central stair landing connecting Option A staircase directly to the gallery corridor leading north to balcony/KT6 and south to bathroom/KT5.',
  },
  {
    id: 'upper_bath',
    name: 'Shared Bathroom 2F',
    indonesianName: 'Kamar Mandi Bersih 2F',
    floor: '2F',
    x: 7.2,
    y: 6.0,
    width: 1.8,
    depth: 2.0,
    clearWidth: 1.6,
    clearDepth: 1.8,
    area: 3.6,
    status: 'new-2f',
    ventilation: 'Direct side ventilation shaft / louvers',
    daylight: 'Frosted high-window daylight',
    structuralZone: 'new-structural-frame',
    description: 'Full bathroom with shower, toilet, and vanity. Directly accessible from stair landing and corridor. Vertically aligned above ground floor plumbing chase.',
  },
  {
    id: 'kt5',
    name: 'Bedroom 5 (Upper Rear Master / Children)',
    indonesianName: 'Kamar Tidur 5 (KT 5)',
    floor: '2F',
    x: 6.0,
    y: 8.0,
    width: 3.0,
    depth: 3.0,
    clearWidth: 2.7,
    clearDepth: 2.7,
    area: 9.0,
    status: 'new-2f',
    occupants: '1-2 Children',
    ventilation: 'Rear and side windows to open lightwell',
    daylight: 'Abundant rear daylight',
    structuralZone: 'new-structural-frame',
    description: 'Spacious upper rear bedroom (3.0m x 3.0m) with study desk, built-in wardrobe, and quiet acoustic privacy facing the rear yard.',
  },
  {
    id: 'kt6',
    name: 'Bedroom 6 (Upper Front Bay on Independent Beams)',
    indonesianName: 'Kamar Tidur 6 (KT 6 - Atas Teras Kanopi)',
    floor: '2F',
    x: 3.0,
    y: 0.0,
    width: 3.0,
    depth: 3.0,
    clearWidth: 2.7,
    clearDepth: 2.85,
    area: 9.0,
    status: 'new-2f',
    occupants: '1-2 Children',
    ventilation: 'Jendela depan menghadap jalan utama',
    daylight: 'Cahaya pagi depan melimpah',
    structuralZone: 'new-structural-frame',
    description: 'Kamar tidur 6 (3.0m x 3.0m, Y: 0.0m - 3.0m) di atas teras kanopi dengan balok & kolom mandiri. Berhenti tepat di Y: 3.0m sebelum RK eksisting dimulai. Nol beban di atas RK!',
  },
];

// Helper to check if any upper room overlaps existing single-storey footprint (KT1, KT2, RK)
export function overlapsExistingFootprint(upperRoom: { x: number; y: number; width: number; depth: number }): boolean {
  for (const ex of EXISTING_ROOMS) {
    const overlapsX = Math.max(upperRoom.x, ex.x) < Math.min(upperRoom.x + upperRoom.width, ex.x + ex.width);
    const overlapsY = Math.max(upperRoom.y, ex.y) < Math.min(upperRoom.y + upperRoom.depth, ex.y + ex.depth);
    if (overlapsX && overlapsY) {
      return true;
    }
  }
  return false;
}

// Structural prohibited boundary definition
export const PROHIBITED_UPPER_ZONE = {
  description: 'Existing 1-Storey Building Roof (KT1, KT2, RK) - STRICTLY PROHIBITED FOR 2ND FLOOR LOADS',
  x: 0.0,
  y: 2.5,
  width: 6.0,
  depth: 6.5, // spans Y: 2.5 to 9.0
  area: 37.5, // (3x3.5 KT2) + (3x3.0 KT1) + (3x6.0 RK) = 10.5 + 9.0 + 18.0 = 37.5 m2
  polygonPoints: [
    { x: 0.0, y: 2.5 },
    { x: 3.0, y: 2.5 },
    { x: 3.0, y: 3.0 },
    { x: 6.0, y: 3.0 },
    { x: 6.0, y: 9.0 },
    { x: 0.0, y: 9.0 },
  ],
};

export const DEFAULT_PROHIBITED_ZONE: ProhibitedZoneData = {
  id: 'prohibited-zone',
  name: 'Zona Struktur Terlarang (Atap Bangunan Lama)',
  x: 0.0,
  y: 2.5,
  width: 6.0,
  depth: 6.5,
  isLocked: false,
  isVisible: true,
  polygonPoints: [
    { x: 0.0, y: 2.5 },
    { x: 3.0, y: 2.5 },
    { x: 3.0, y: 3.0 },
    { x: 6.0, y: 3.0 },
    { x: 6.0, y: 9.0 },
    { x: 0.0, y: 9.0 },
  ],
};

// Summary metrics validation
export function calculateFloorMetrics() {
  const gfArea = RECOMMENDED_GROUND_FLOOR_ROOMS.reduce((sum, r) => sum + r.area, 0);
  const upperArea = RECOMMENDED_SECOND_FLOOR_ROOMS.reduce((sum, r) => sum + r.area, 0);
  const totalBedrooms = [
    ...RECOMMENDED_GROUND_FLOOR_ROOMS.filter(r => r.id.startsWith('kt')),
    ...RECOMMENDED_SECOND_FLOOR_ROOMS.filter(r => r.id.startsWith('kt')),
  ].length;

  return {
    siteArea: SITE_BOUNDARY.totalArea,
    gfArea,
    upperArea,
    totalBedrooms,
    gfBedrooms: RECOMMENDED_GROUND_FLOOR_ROOMS.filter(r => r.id.startsWith('kt')).length,
    upperBedrooms: RECOMMENDED_SECOND_FLOOR_ROOMS.filter(r => r.id.startsWith('kt')).length,
  };
}
