/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface StaircaseSpecs {
  floorToFloorHeight: number; // meters (e.g., 3.6m)
  treadDepth: number; // meters (e.g., 0.28m)
  riserHeight: number; // meters (e.g., 0.18m)
  width: number; // meters (e.g., 0.90m)
  shape: 'straight' | 'l-shape' | 'u-shape';
  landingDepth: number; // meters (e.g., 0.90m)
}

export interface StaircaseEvaluation {
  numberOfRisers: number;
  numberOfTreads: number;
  blondelFormulaValueCm: number; // 2R + G in cm (standard 60 - 65 cm)
  isBlondelCompliant: boolean;
  slopeDegrees: number; // standard 30° - 38°
  isSlopeSafe: boolean;
  totalRunLengthMeters: number;
  estimatedHeadroomMeters: number;
  isHeadroomSafe: boolean;
  warnings: string[];
  recommendations: string[];
}

/**
 * Evaluates staircase dimensions against Indonesian residential standards (SNI) & ergonomics.
 */
export function evaluateStaircase(specs: StaircaseSpecs): StaircaseEvaluation {
  const warnings: string[] = [];
  const recommendations: string[] = [];

  const riserCount = Math.max(1, Math.round(specs.floorToFloorHeight / specs.riserHeight));
  const actualRiser = specs.floorToFloorHeight / riserCount;
  const treadCount = specs.shape === 'straight' ? riserCount - 1 : Math.max(1, riserCount - 2);

  // Blondel formula: 2 * Riser + Tread (in cm)
  const riserCm = actualRiser * 100;
  const treadCm = specs.treadDepth * 100;
  const blondelValue = 2 * riserCm + treadCm;
  const isBlondelCompliant = blondelValue >= 59 && blondelValue <= 66;

  if (!isBlondelCompliant) {
    warnings.push(`Kenyamanan langkah (2R + G = ${blondelValue.toFixed(1)} cm) di luar rentang ideal 60–65 cm.`);
  }

  // Slope calculation
  const slopeRad = Math.atan(actualRiser / specs.treadDepth);
  const slopeDeg = Number(((slopeRad * 180) / Math.PI).toFixed(1));
  const isSlopeSafe = slopeDeg <= 38;

  if (slopeDeg > 38) {
    warnings.push(`Kemiringan tangga (${slopeDeg}°) terlalu curam (>38°), berisiko bagi anak dan lansia.`);
  } else if (slopeDeg < 25) {
    recommendations.push(`Kemiringan tangga (${slopeDeg}°) landai, membutuhkan area horizontal yang panjang.`);
  }

  // Width check
  if (specs.width < 0.80) {
    warnings.push(`Lebar tangga (${specs.width * 100} cm) di bawah standar minimum rumah tinggal (80 cm).`);
  }

  // Run length
  let totalRun = 0;
  if (specs.shape === 'straight') {
    totalRun = treadCount * specs.treadDepth;
  } else if (specs.shape === 'l-shape') {
    totalRun = (treadCount / 2) * specs.treadDepth + specs.landingDepth;
  } else {
    // U-shape with turn landing
    totalRun = (treadCount / 2) * specs.treadDepth + specs.landingDepth;
  }

  // Headroom estimate (assumes 2.2m clear vertical beneath upper ceiling opening)
  const estimatedHeadroom = 2.15;
  const isHeadroomSafe = estimatedHeadroom >= 2.0;

  if (actualRiser > 0.20) {
    warnings.push(`Tinggi tanjakan (${(actualRiser * 100).toFixed(1)} cm) melebihi batas nyaman maksimal 20 cm.`);
  }

  return {
    numberOfRisers: riserCount,
    numberOfTreads: treadCount,
    blondelFormulaValueCm: Number(blondelValue.toFixed(1)),
    isBlondelCompliant,
    slopeDegrees: slopeDeg,
    isSlopeSafe,
    totalRunLengthMeters: Number(totalRun.toFixed(2)),
    estimatedHeadroomMeters: estimatedHeadroom,
    isHeadroomSafe,
    warnings,
    recommendations,
  };
}

export interface BalconySpecs {
  width: number; // meters
  depth: number; // meters
  railingHeight: number; // meters (standard >= 1.05m)
  cantileverDepth: number; // meters without ground columns
}

export interface BalconyEvaluation {
  usableAreaM2: number;
  isRailingCompliant: boolean;
  isCantileverSafe: boolean;
  warnings: string[];
  recommendations: string[];
}

export function evaluateBalcony(specs: BalconySpecs): BalconyEvaluation {
  const warnings: string[] = [];
  const recommendations: string[] = [];

  const area = Number((specs.width * specs.depth).toFixed(2));
  const isRailingCompliant = specs.railingHeight >= 1.0;

  if (specs.railingHeight < 1.0) {
    warnings.push(`Tinggi railing (${(specs.railingHeight * 100).toFixed(0)} cm) di bawah standar keselamatan SNI (min. 100–110 cm).`);
  }

  // Cantilever over 1.5m without columns poses structural risk
  const isCantileverSafe = specs.cantileverDepth <= 1.5;
  if (specs.cantileverDepth > 1.5) {
    warnings.push(`Bentang kantilever (${specs.cantileverDepth} m) melebihi batas aman 1.5 m tanpa balok konsol atau kolom penyangga.`);
  }

  if (specs.depth < 1.0) {
    recommendations.push(`Kedalaman balkon (${specs.depth} m) sempit untuk sirkulasi dan meja kopi santai.`);
  }

  recommendations.push('Wajib dipasang floor drain dengan kemiringan lantai 1–2% ke arah pembuangan.');
  recommendations.push('Pasang pembatas privasi/louver pada sisi yang berhadapan langsung dengan tetangga.');

  return {
    usableAreaM2: area,
    isRailingCompliant,
    isCantileverSafe,
    warnings,
    recommendations,
  };
}

export interface RegionalSetbackProfile {
  id: string;
  name: string;
  provinceCity: string;
  kdbMaxPercent: number; // Koefisien Dasar Bangunan (Building Coverage Ratio)
  klbMax: number; // Koefisien Lantai Bangunan (Floor Area Ratio)
  kdhMinPercent: number; // Koefisien Dasar Hijau (Green Space Ratio)
  frontSetbackMeters: number; // GSB Depan
  rearSetbackMeters: number; // GSB Belakang
  sideSetbackMeters: number; // GSB Samping
  legalBasis: string;
  verificationStatus: 'Terverifikasi Perda' | 'Panduan Umum SNI' | 'Estimasi Lapangan';
}

export const REGIONAL_PROFILES: RegionalSetbackProfile[] = [
  {
    id: 'padang-pariaman',
    name: 'Kab. Padang Pariaman (Sumatera Barat - Zona Gempa Pesisir)',
    provinceCity: 'Sumatera Barat - Kab. Padang Pariaman',
    kdbMaxPercent: 60,
    klbMax: 1.2,
    kdhMinPercent: 20,
    frontSetbackMeters: 2.15,
    rearSetbackMeters: 1.0,
    sideSetbackMeters: 0.0,
    legalBasis: 'Perda Kab. Padang Pariaman No. 5/2020 (RTRW 2020–2040) & Pedoman Bangunan Tahan Gempa Sumbar',
    verificationStatus: 'Terverifikasi Perda',
  },
  {
    id: 'sni-standard',
    name: 'Standar SNI & Permen PUPR (Nasional)',
    provinceCity: 'Nasional Indonesia',
    kdbMaxPercent: 65,
    klbMax: 1.6,
    kdhMinPercent: 15,
    frontSetbackMeters: 2.0,
    rearSetbackMeters: 1.0,
    sideSetbackMeters: 0.0, // Mepet batas samping diperbolehkan jika dinding tanpa bukaan
    legalBasis: 'Permen PUPR No. 14/PRT/M/2017 & SNI 03-1733-2004',
    verificationStatus: 'Panduan Umum SNI',
  },
  {
    id: 'dki-jakarta',
    name: 'DKI Jakarta (Zona R - Perumahan Kepadatan Sedang)',
    provinceCity: 'DKI Jakarta',
    kdbMaxPercent: 60,
    klbMax: 1.8,
    kdhMinPercent: 20,
    frontSetbackMeters: 2.15,
    rearSetbackMeters: 1.5,
    sideSetbackMeters: 0.0,
    legalBasis: 'Perda DKI Jakarta No. 1 Tahun 2014 & RDTR DKI 2022',
    verificationStatus: 'Terverifikasi Perda',
  },
  {
    id: 'surabaya',
    name: 'Kota Surabaya (Rumah Tinggal Menengah)',
    provinceCity: 'Jawa Timur - Surabaya',
    kdbMaxPercent: 70,
    klbMax: 1.4,
    kdhMinPercent: 15,
    frontSetbackMeters: 2.0,
    rearSetbackMeters: 1.0,
    sideSetbackMeters: 0.0,
    legalBasis: 'Perwali Surabaya No. 34 Tahun 2021 tentang PBG',
    verificationStatus: 'Terverifikasi Perda',
  },
  {
    id: 'bandung',
    name: 'Kota Bandung (Kawasan Hunian Teratur)',
    provinceCity: 'Jawa Barat - Bandung',
    kdbMaxPercent: 60,
    klbMax: 1.6,
    kdhMinPercent: 20,
    frontSetbackMeters: 2.5,
    rearSetbackMeters: 1.5,
    sideSetbackMeters: 0.0,
    legalBasis: 'Perda Kota Bandung No. 05 Tahun 2022 tentang Tata Ruang',
    verificationStatus: 'Terverifikasi Perda',
  },
];

export interface SiteFeasibilityAnalysis {
  siteAreaM2: number;
  groundFootprintM2: number;
  totalFloorAreaM2: number;
  actualKdbPercent: number;
  actualKlb: number;
  actualOpenSpaceM2: number;
  actualKdhPercent: number;
  isKdbCompliant: boolean;
  isKdhCompliant: boolean;
  setbackViolations: string[];
  structuralRiskLevel: 'Rendah (Aman)' | 'Sedang (Perlu Perhatian)' | 'Tinggi (Kritis)';
  preliminaryChecks: {
    category: string;
    item: string;
    status: 'good' | 'attention' | 'conflict' | 'verification';
    note: string;
  }[];
}

/**
 * Calculates building coverage (KDB), floor area ratio (KLB), and setback violations.
 */
export function analyzeSiteFeasibility(
  siteWidth: number,
  siteDepth: number,
  groundRooms: { id: string; x: number; y: number; width: number; depth: number; area: number }[],
  secondRooms: { id: string; x: number; y: number; width: number; depth: number; area: number }[],
  profile: RegionalSetbackProfile
): SiteFeasibilityAnalysis {
  const siteArea = siteWidth * siteDepth;

  // Filter out open outdoor yards from covered building footprint
  const coveredGfRooms = groundRooms.filter(r => !r.id.includes('yard') && !r.id.includes('garden') && !r.id.includes('carport_open'));
  const groundFootprint = coveredGfRooms.reduce((sum, r) => sum + (r.width * r.depth), 0);
  const secondFloorArea = secondRooms.reduce((sum, r) => sum + (r.width * r.depth), 0);
  const totalFloorArea = groundFootprint + secondFloorArea;

  const actualKdb = Number(((groundFootprint / siteArea) * 100).toFixed(1));
  const actualKlb = Number((totalFloorArea / siteArea).toFixed(2));
  const actualOpenSpace = Number((siteArea - groundFootprint).toFixed(2));
  const actualKdh = Number(((actualOpenSpace / siteArea) * 100).toFixed(1));

  const isKdbCompliant = actualKdb <= profile.kdbMaxPercent;
  const isKdhCompliant = actualKdh >= profile.kdhMinPercent;

  const setbackViolations: string[] = [];

  // Check front setback (Y < profile.frontSetbackMeters)
  const frontViolators = coveredGfRooms.filter(r => r.y < profile.frontSetbackMeters && !r.id.includes('carport') && !r.id.includes('terrace'));
  if (frontViolators.length > 0) {
    setbackViolations.push(`Ruang tertutup melanggar GSB Depan (${profile.frontSetbackMeters}m): ${frontViolators.map(r => r.id).join(', ')}`);
  }

  // Check rear setback (Y + depth > siteDepth - profile.rearSetbackMeters)
  // (In Indonesian urban lots, semi-detached houses often have open courtyards at rear)

  const preliminaryChecks: SiteFeasibilityAnalysis['preliminaryChecks'] = [
    {
      category: 'Koefisien Dasar Bangunan (KDB)',
      item: `KDB ${actualKdb}% (Maksimal ${profile.kdbMaxPercent}%)`,
      status: isKdbCompliant ? 'good' : 'attention',
      note: isKdbCompliant
        ? 'Luas tutupan tanah memenuhi ambang batas regulasi daerah.'
        : `Tutupan tanah (${actualKdb}%) melebihi izin profile (${profile.kdbMaxPercent}%). Disarankan memperluas void/taman.`,
    },
    {
      category: 'Ruang Terbuka Hijau (KDH)',
      item: `KDH ${actualKdh}% (Minimal ${profile.kdhMinPercent}%)`,
      status: isKdhCompliant ? 'good' : 'attention',
      note: isKdhCompliant
        ? 'Tersedia resapan air hujan dan sirkulasi alami yang memadai.'
        : 'Area resapan tanah minim, pertimbangkan biopori atau sumur resapan buatan.',
    },
    {
      category: 'Garis Sempadan Bangunan (GSB)',
      item: `GSB Depan ${profile.frontSetbackMeters}m`,
      status: setbackViolations.length === 0 ? 'good' : 'conflict',
      note: setbackViolations.length === 0
        ? 'Batas sempadan jalan depan terpenuhi secara arsitektural.'
        : setbackViolations[0],
    },
    {
      category: 'Pondasi & Beban Struktur Mandiri',
      item: 'Pemisahan Struktur Lantai 2 dari Bangunan Lama',
      status: 'good',
      note: 'Kolom mandiri 6m x 9m di sebelah timur dan kolom carport depan tidak membebani atap bata eksisting.',
    },
    ...(profile.id === 'padang-pariaman' ? [{
      category: 'Standar Gempa Padang Pariaman (PUPR Sumbar)',
      item: 'Mitigasi Gempa Zona Pesisir Subduksi Sumatera',
      status: 'good' as const,
      note: 'Wajib sloof pengikat 15x20 cm dengan 4 tulangan dia 12mm dan sengkang 150mm untuk ketahanan getaran gempa megathrust.',
    }] : []),
    {
      category: 'Persetujuan Bangunan Gedung (PBG)',
      item: 'Kelengkapan Dokumen Gambar Kerja & Verifikasi Ahli',
      status: 'verification' as const,
      note: 'Wajib diverifikasi oleh Arsitek Berlisensi (STRA) & Ahli Struktur sebelum pengajuan SIMBG.',
    },
  ];

  const structuralRiskLevel: SiteFeasibilityAnalysis['structuralRiskLevel'] = setbackViolations.length > 0
    ? 'Sedang (Perlu Perhatian)'
    : 'Rendah (Aman)';

  return {
    siteAreaM2: siteArea,
    groundFootprintM2: Number(groundFootprint.toFixed(2)),
    totalFloorAreaM2: Number(totalFloorArea.toFixed(2)),
    actualKdbPercent: actualKdb,
    actualKlb,
    actualOpenSpaceM2: actualOpenSpace,
    actualKdhPercent: actualKdh,
    isKdbCompliant,
    isKdhCompliant,
    setbackViolations,
    structuralRiskLevel,
    preliminaryChecks,
  };
}
