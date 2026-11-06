/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { HouseDesignState } from './houseDesignStore';
import {
  FLOOR_FINISH_OPTIONS,
  WALL_FINISH_OPTIONS,
  ROOF_STYLE_OPTIONS,
  ROOF_MATERIAL_OPTIONS,
  ROOF_WALL_FINISH_OPTIONS,
  DEFAULT_ROOF_CONFIG,
} from './architectureData';

export interface CostItem {
  id: string;
  category: string;
  categoryIndonesian: string;
  description: string;
  unit: string;
  quantity: number;
  rateEconomyIdr: number;
  rateMidRangeIdr: number;
  phase: 1 | 2 | 3 | 4;
}

export interface PhaseBreakdown {
  phase: number;
  title: string;
  titleIndonesian: string;
  durationWeeks: number;
  description: string;
  keyDeliverables: string[];
  costEconomyIdr: number;
  costMidRangeIdr: number;
  occupancyFeasibility: string;
}

export const RAB_ITEMS: CostItem[] = [
  {
    id: 'prep-demolition',
    category: 'Site Prep & Demolition',
    categoryIndonesian: 'Pekerjaan Persiapan & Bongkaran',
    description: 'Bongkaran dinding bata parsial RK (kanan & belakang), proteksi debu, terpal pelindung, perapihan puing & buang sampah proyek.',
    unit: 'ls',
    quantity: 1,
    rateEconomyIdr: 4500000,
    rateMidRangeIdr: 7000000,
    phase: 1,
  },
  {
    id: 'foundations',
    category: 'Substructure & Footings',
    categoryIndonesian: 'Pekerjaan Tanah & Pondasi Cakar Ayam',
    description: 'Galian tanah, pondasi telapak cakar ayam 80x80x25cm (8 titik baru), sloof beton bertulang 15/25 & 20/30 mutu K-250 besi D13 SNI.',
    unit: 'titik/m3',
    quantity: 8,
    rateEconomyIdr: 2800000,
    rateMidRangeIdr: 3900000,
    phase: 1,
  },
  {
    id: 'structure-gf',
    category: 'Ground Floor Structure',
    categoryIndonesian: 'Struktur Beton Bertulang Lantai 1',
    description: 'Kolom utama K1 20x20cm, kolom praktis KP 15x15cm, balok lintel opening RK portal baja/beton penahan dinding eksisting.',
    unit: 'm3',
    quantity: 6.5,
    rateEconomyIdr: 4200000,
    rateMidRangeIdr: 5500000,
    phase: 1,
  },
  {
    id: 'slab-upper',
    category: 'Upper Floor Slab & Beams',
    categoryIndonesian: 'Plat Lantai 2 & Balok Struktur (Phase 2)',
    description: 'Bekisting, perancah scaffolding, balok induk B1 20x35cm, balok anak B2 15x25cm, plat lantai tebal 12cm wiremesh/besi ulir D10-150 mutu beton K-250.',
    unit: 'm2',
    quantity: 42,
    rateEconomyIdr: 750000,
    rateMidRangeIdr: 1050000,
    phase: 2,
  },
  {
    id: 'staircase-structure',
    category: 'Staircase Structure',
    categoryIndonesian: 'Struktur Tangga Beton Bertulang (Option A)',
    description: 'Tangga beton cor bertulang mandiri pada struktur baru, lebar 90cm, optrede 18cm, antrede 28cm, bordes 90x100cm, tanpa membebani atap lama.',
    unit: 'unit',
    quantity: 1,
    rateEconomyIdr: 8500000,
    rateMidRangeIdr: 12500000,
    phase: 2,
  },
  {
    id: 'masonry-gf',
    category: 'Ground Floor Walls',
    categoryIndonesian: 'Dinding Bata Ringan Lantai 1',
    description: 'Pasangan dinding bata ringan AAC Hebel t=10cm, mortar instan perekat, plester aci dua sisi untuk KT 3, WC Tamu, Dapur, KM.',
    unit: 'm2',
    quantity: 65,
    rateEconomyIdr: 145000,
    rateMidRangeIdr: 195000,
    phase: 1,
  },
  {
    id: 'masonry-2f',
    category: 'Upper Floor Walls',
    categoryIndonesian: 'Dinding Bata Ringan Lantai 2',
    description: 'Pasangan bata ringan AAC Hebel t=10cm untuk 3 KT atas (KT 4, KT 5, KT 6), KM lantai 2, dan dinding pengaman bordes.',
    unit: 'm2',
    quantity: 98,
    rateEconomyIdr: 145000,
    rateMidRangeIdr: 195000,
    phase: 3,
  },
  {
    id: 'roof-framing',
    category: 'Roof & Ceiling',
    categoryIndonesian: 'Rangka Atap Baja Ringan & Penutup Atap',
    description: 'Kuda-kuda baja ringan Zincalume C75.75 & reng U.45, atap spandek pasir berinsulasi peredam panas/suara, talang jurai galvalum, flashing waterproof.',
    unit: 'm2',
    quantity: 48,
    rateEconomyIdr: 275000,
    rateMidRangeIdr: 390000,
    phase: 2,
  },
  {
    id: 'ceiling-plasterboard',
    category: 'Ceiling Works',
    categoryIndonesian: 'Plafon Gypsum & GRC Tahan Lembab',
    description: 'Rangka hollow galvalum 2x4 & 4x4, papan gypsum Jayaboard 9mm (kamar/ruang tamu), papan GRC 6mm tahan air untuk toilet dan teras luar.',
    unit: 'm2',
    quantity: 82,
    rateEconomyIdr: 110000,
    rateMidRangeIdr: 155000,
    phase: 3,
  },
  {
    id: 'plumbing-sanitary',
    category: 'Plumbing & Sanitary Fixtures',
    categoryIndonesian: 'Plumbing, Sanitair & Bio Septic Tank',
    description: 'Pipa Wavin AW (air bersih & kotor), 3 kloset duduk (WC Tamu, KM Keluarga, KM 2F), 3 shower spray, kran mixer, floor drain stainless, bio septic tank 1.5m3.',
    unit: 'ls',
    quantity: 1,
    rateEconomyIdr: 14500000,
    rateMidRangeIdr: 23500000,
    phase: 1,
  },
  {
    id: 'waterproofing',
    category: 'Waterproofing System',
    categoryIndonesian: 'Waterproofing Dak, Kamar Mandi & Balkon',
    description: 'Waterproofing semen fleksibel 2 komponen (SikaTop 107 Seal / Aquaproof Pro) dengan serat fiberglass untuk balkon, plat KM 2F, talang dak.',
    unit: 'm2',
    quantity: 36,
    rateEconomyIdr: 85000,
    rateMidRangeIdr: 135000,
    phase: 2,
  },
  {
    id: 'electrical',
    category: 'Electrical Installations',
    categoryIndonesian: 'Instalasi Listrik & Titik Lampu',
    description: 'Kabel NYM Supreme/Eterna, pipa conduit clipsal, panel box MCB terpisah 2 lantai, 24 titik lampu downlight LED, 18 stop kontak, saklar Panasonic.',
    unit: 'titik',
    quantity: 42,
    rateEconomyIdr: 220000,
    rateMidRangeIdr: 310000,
    phase: 3,
  },
  {
    id: 'floor-tiles',
    category: 'Floor & Wall Tiles',
    categoryIndonesian: 'Lantai Granit Tile & Keramik Anti-Slip',
    description: 'Lantai utama Homogeneous Tile 60x60cm Garuda/Indogress, lantai kamar mandi & balkon keramik anti-slip tekstur matte 30x30cm, dinding KM keramik 30x60cm.',
    unit: 'm2',
    quantity: 92,
    rateEconomyIdr: 230000,
    rateMidRangeIdr: 360000,
    phase: 3,
  },
  {
    id: 'doors-windows',
    category: 'Doors & Windows',
    categoryIndonesian: 'Kusen Aluminium & Pintu Solid Engineering',
    description: 'Kusen jendela aluminium 3-4" Alexindo/Inkalum coklat/hitam, kaca clear 5mm, pintu utama solid panel engineered, pintu kamar honeycomb tebal finishing melamik.',
    unit: 'unit',
    quantity: 11,
    rateEconomyIdr: 1250000,
    rateMidRangeIdr: 2100000,
    phase: 3,
  },
  {
    id: 'balcony-railing-screen',
    category: 'Balcony & Safety Railing',
    categoryIndonesian: 'Railing Tangga & Partisi Balkon Merokok',
    description: 'Railing tangga besi hollow galvanis + handrail kayu kamper, railing balkon merokok tinggi 110cm dengan kisi-kisi louver privasi & penahan hembusan angin.',
    unit: 'm1',
    quantity: 12,
    rateEconomyIdr: 650000,
    rateMidRangeIdr: 950000,
    phase: 3,
  },
  {
    id: 'painting-coatings',
    category: 'Painting & Finishing',
    categoryIndonesian: 'Pengecatan Eksterior & Interior',
    description: 'Cat dinding luar tahan cuaca tropical Jotun Jotashield / Dulux Weathershield, cat dinding dalam Catylac / Vinilex, cat plafon putih anti jamur.',
    unit: 'm2',
    quantity: 320,
    rateEconomyIdr: 38000,
    rateMidRangeIdr: 58000,
    phase: 4,
  },
  {
    id: 'front-carport-facade',
    category: 'Carport & Exterior Facade',
    categoryIndonesian: 'Pekerjaan Carport & Fasad Depan (Phase 4)',
    description: 'Paving block / rabat beton carport, kanopi tempered glass / alderon depan, taman tropis minimalis, roster ventilasi aksen depan.',
    unit: 'ls',
    quantity: 1,
    rateEconomyIdr: 7500000,
    rateMidRangeIdr: 14000000,
    phase: 4,
  },
];

export function calculateRabTotals(contingencyPercent: number = 8, design?: HouseDesignState) {
  let subtotalEconomy = 0;
  let subtotalMidRange = 0;

  const phaseTotals = {
    1: { economy: 0, mid: 0 },
    2: { economy: 0, mid: 0 },
    3: { economy: 0, mid: 0 },
    4: { economy: 0, mid: 0 },
  };

  const activeItems: CostItem[] = RAB_ITEMS.map(item => ({ ...item }));

  if (design) {
    const allRooms = [...(design.groundFloorRooms || []), ...(design.secondFloorRooms || [])];
    const roof = design.roofConfig || DEFAULT_ROOF_CONFIG;
    const roofStyle = ROOF_STYLE_OPTIONS.find(s => s.id === roof.style) || ROOF_STYLE_OPTIONS[0];
    const roofMat = ROOF_MATERIAL_OPTIONS.find(m => m.id === roof.material) || ROOF_MATERIAL_OPTIONS[0];
    const roofWall = ROOF_WALL_FINISH_OPTIONS.find(w => w.id === roof.wallFinish) || ROOF_WALL_FINISH_OPTIONS[0];

    // 1. Adjust Roof & Roof Wall (Sopi-sopi / Parapet) item
    const roofIdx = activeItems.findIndex(i => i.id === 'roof-framing');
    if (roofIdx >= 0) {
      const pitchFactor = 1 + Math.max(-0.08, Math.min(0.2, (roof.pitchDegrees - 24) * 0.008));
      const parapetExtraPerM2 = Math.round((Math.max(0, roof.parapetHeight - 0.65) * 28 * 165000 + roofWall.extraCostIdr) / 48);
      activeItems[roofIdx] = {
        ...activeItems[roofIdx],
        categoryIndonesian: `Atap: ${roofStyle.name} & Dinding Atap`,
        description: `Penutup ${roofMat.name} (kemiringan ${roof.pitchDegrees}°), dinding atap/parapet ${roofWall.name} (tinggi ${roof.parapetHeight.toFixed(2)}m), rangka baja ringan C75 & talang.`,
        rateEconomyIdr: Math.round(roofMat.rateEconomyIdr * roofStyle.rateMultiplier * pitchFactor + parapetExtraPerM2),
        rateMidRangeIdr: Math.round(roofMat.rateMidRangeIdr * roofStyle.rateMultiplier * pitchFactor + parapetExtraPerM2 * 1.25),
      };
    }

    // 2. Adjust Floor Tiles & Add Rear Garden / Outdoor Flooring
    const floorIdx = activeItems.findIndex(i => i.id === 'floor-tiles');
    if (floorIdx >= 0 && allRooms.length > 0) {
      let totalFloorEcon = 0;
      let totalFloorMid = 0;
      let totalFloorM2 = 0;
      const finishCounts: Record<string, number> = {};

      for (const r of allRooms) {
        if (r.id === 'rear_service_yard') continue; // Handled in dedicated garden item below
        const area = Number((r.width * r.depth).toFixed(2));
        const finishId = r.floorFinish || 'ceramic';
        const meta = FLOOR_FINISH_OPTIONS.find(f => f.id === finishId) || FLOOR_FINISH_OPTIONS[0];
        totalFloorM2 += area;
        totalFloorEcon += area * meta.rateEconomyIdr;
        totalFloorMid += area * meta.rateMidRangeIdr;
        finishCounts[meta.name] = (finishCounts[meta.name] || 0) + area;
      }

      if (totalFloorM2 > 0) {
        const summaryText = Object.entries(finishCounts)
          .map(([name, m2]) => `${name} (${m2.toFixed(1)}m²)`)
          .join(', ');
        activeItems[floorIdx] = {
          ...activeItems[floorIdx],
          quantity: Number(totalFloorM2.toFixed(1)),
          description: `Kombinasi lantai pilihan: ${summaryText}, termasuk keramik kamar mandi anti-slip.`,
          rateEconomyIdr: Math.round(totalFloorEcon / totalFloorM2),
          rateMidRangeIdr: Math.round(totalFloorMid / totalFloorM2),
        };
      }
    }

    // 3. Adjust Wall Finish & Custom Color item
    const paintIdx = activeItems.findIndex(i => i.id === 'painting-coatings');
    if (paintIdx >= 0 && allRooms.length > 0) {
      let totalWallEcon = 0;
      let totalWallMid = 0;
      let totalWallM2 = 0;
      const wallSummary: Record<string, number> = {};

      for (const r of allRooms) {
        const wallH = r.wallHeight || (r.floor === '2F' ? 3.0 : 3.2);
        const area = Number((2 * (r.width + r.depth) * wallH * 0.78).toFixed(1));
        const finishId = r.wallFinish || 'white';
        const meta = WALL_FINISH_OPTIONS.find(w => w.id === finishId) || WALL_FINISH_OPTIONS[0];
        const hasCustomColor = Boolean(r.wallColor && r.wallColor.toLowerCase() !== '#f8fafc');
        const customExtra = finishId === 'white' && hasCustomColor ? 8000 : 0;

        totalWallM2 += area;
        totalWallEcon += area * (meta.rateEconomyIdr + customExtra);
        totalWallMid += area * (meta.rateMidRangeIdr + customExtra * 1.25);
        const label = hasCustomColor ? `${meta.name} (${r.wallColor})` : meta.name;
        wallSummary[label] = (wallSummary[label] || 0) + area;
      }

      if (totalWallM2 > 0) {
        const summaryText = Object.entries(wallSummary)
          .map(([name, m2]) => `${name} (${m2.toFixed(0)}m²)`)
          .join(', ');
        activeItems[paintIdx] = {
          ...activeItems[paintIdx],
          categoryIndonesian: 'Finishing & Warna Dinding Kustom',
          quantity: Math.round(totalWallM2),
          description: `Pekerjaan finishing dinding: ${summaryText}, termasuk cat plafon anti-jamur.`,
          rateEconomyIdr: Math.round(totalWallEcon / totalWallM2),
          rateMidRangeIdr: Math.round(totalWallMid / totalWallM2),
        };
      }
    }

    // 4. Add Dedicated Rear Garden (Taman Belakang: Lantai Rumput / Decking & Skylight) item
    const rearYard = allRooms.find(r => r.id === 'rear_service_yard');
    const grassRooms = allRooms.filter(r => r.id === 'rear_service_yard' || r.floorFinish === 'grass' || r.floorFinish === 'wood-deck');
    if (rearYard || grassRooms.length > 0) {
      const gardenArea = Number(
        grassRooms.reduce((s, r) => s + r.width * r.depth, 0).toFixed(1)
      ) || 6.0;
      const primaryFinish = rearYard?.floorFinish || 'grass';
      const finishMeta = FLOOR_FINISH_OPTIONS.find(f => f.id === primaryFinish) || FLOOR_FINISH_OPTIONS.find(f => f.id === 'grass')!;
      const hasSkylight = Boolean(rearYard?.skylight?.hasSkylight);
      const skylightExtraPerM2 = hasSkylight ? 420000 : 0;

      activeItems.push({
        id: 'rear-garden-landscape',
        category: 'Rear Garden & Courtyard Landscape',
        categoryIndonesian: `Taman Void Belakang (${finishMeta.name}${hasSkylight ? ' + Atap Skylight' : ''})`,
        description: `Penataan taman belakang (${gardenArea}m²) dengan ${finishMeta.name.toLowerCase()}, batu koral putih, tanaman tropis, drainase resapan${hasSkylight ? ', serta kanopi kaca skylight' : ''}.`,
        unit: 'm2',
        quantity: gardenArea,
        rateEconomyIdr: finishMeta.rateEconomyIdr + skylightExtraPerM2,
        rateMidRangeIdr: finishMeta.rateMidRangeIdr + Math.round(skylightExtraPerM2 * 1.3),
        phase: 4,
      });
    }
  }

  for (const item of activeItems) {
    const itemEcon = item.quantity * item.rateEconomyIdr;
    const itemMid = item.quantity * item.rateMidRangeIdr;
    subtotalEconomy += itemEcon;
    subtotalMidRange += itemMid;
    phaseTotals[item.phase].economy += itemEcon;
    phaseTotals[item.phase].mid += itemMid;
  }

  const contingencyEcon = subtotalEconomy * (contingencyPercent / 100);
  const contingencyMid = subtotalMidRange * (contingencyPercent / 100);

  const totalEconomy = subtotalEconomy + contingencyEcon;
  const totalMidRange = subtotalMidRange + contingencyMid;

  // New built floor area: ~42m2 ground new + ~42m2 upper new = ~84 m2
  const newFloorAreaM2 = 84.0;

  return {
    items: activeItems,
    subtotalEconomy,
    subtotalMidRange,
    contingencyEcon,
    contingencyMid,
    totalEconomy,
    totalMidRange,
    ratePerM2Economy: Math.round(totalEconomy / newFloorAreaM2),
    ratePerM2MidRange: Math.round(totalMidRange / newFloorAreaM2),
    phaseTotals,
    newFloorAreaM2,
  };
}

export const CONSTRUCTION_PHASES: PhaseBreakdown[] = [
  {
    phase: 1,
    title: 'Phase 1: Substructure & Ground Extension',
    titleIndonesian: 'Fase 1: Struktur Bawah & Perluasan Lantai Dasar',
    durationWeeks: 6,
    description: 'Pondasi Cakar Ayam baru di sisi kanan, sloof beton, dinding bata ringan KT 3, Dapur belakang, KM keluarga, instalasi bio-septic tank & pipa air kotor.',
    keyDeliverables: [
      'Galian & 8 Titik Pondasi Cakar Ayam mandiri',
      'Pengecoran Sloof 20/30 dan Kolom Lantai 1',
      'Dapur, KM Keluarga, dan KT 3 lantai dasar berfungsi',
      'Keluarga tetap dapat tinggal di KT 1 & KT 2 dengan partisi debu',
    ],
    costEconomyIdr: 45000000,
    costMidRangeIdr: 68000000,
    occupancyFeasibility: 'High (Keluarga aman menempati KT1, KT2 & RK karena renovasi berada di zona kanan)',
  },
  {
    phase: 2,
    title: 'Phase 2: Upper Structural Frame & Roof',
    titleIndonesian: 'Fase 2: Plat Lantai 2, Tangga & Atap Baru',
    durationWeeks: 5,
    description: 'Pengecoran plat lantai 2 (tebal 12cm), tangga beton Option A, pemasangan kuda-kuda baja ringan dan atap spandek berinsulasi, waterproofing dak & balkon.',
    keyDeliverables: [
      'Pengecoran plat beton lantai 2 & balok induk',
      'Pengecoran struktur tangga mandiri (Option A)',
      'Penutupan atap baja ringan & proteksi hujan tropis',
      'Waterproofing menyeluruh dak, balkon, dan area basah 2F',
    ],
    costEconomyIdr: 49000000,
    costMidRangeIdr: 71000000,
    occupancyFeasibility: 'Moderate (Zona bawah aman karena atap lantai 2 menutup area sebelum hujan musim barat)',
  },
  {
    phase: 3,
    title: 'Phase 3: Upper 3 Bedrooms, Bath & Balcony Completion',
    titleIndonesian: 'Fase 3: Penyelesaian 3 Kamar Atas, KM 2F & Balkon',
    durationWeeks: 6,
    description: 'Dinding bata ringan 3 kamar tidur atas (KT 4, KT 5, KT 6), plafon gypsum/GRC, instalasi listrik, sanitary KM 2F, keramik granit tile, railing balkon.',
    keyDeliverables: [
      '3 Kamar tidur anak selesai dengan kusen aluminium & pintu',
      'Kamar mandi lantai 2 beroperasi penuh',
      'Balkon merokok depan dengan kisi-kisi pelindung siap pakai',
      'Semua 7 anggota keluarga memiliki kamar pribadi',
    ],
    costEconomyIdr: 58000000,
    costMidRangeIdr: 89000000,
    occupancyFeasibility: 'High (Lantai 2 siap huni, anak-anak mulai menempati kamar atas)',
  },
  {
    phase: 4,
    title: 'Phase 4: Guest Living Room, Carport & Final Facade',
    titleIndonesian: 'Fase 4: Ruang Tamu, Carport, Fasad & Perapihan Akhir',
    durationWeeks: 4,
    description: 'Penyelesaian ruang tamu depan, WC tamu, bukaan portal dinding RK eksisting dengan balok lintel finishing, pengecatan Jotashield exterior, kanopi carport & taman depan.',
    keyDeliverables: [
      'Bukaan harmonis dinding RK ke ruang makan & tangga',
      'Ruang tamu terpisah siap menerima tamu perokok & non-perokok',
      'Carport 1 mobil + 2 motor dan taman tropis depan',
      'Pengecatan akhir eksterior dan interior rumah',
    ],
    costEconomyIdr: 22000000,
    costMidRangeIdr: 36000000,
    occupancyFeasibility: 'High (Finishing akhir tanpa gangguan struktural utama)',
  },
];
