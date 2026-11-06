/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Calculator, 
  Calendar, 
  TrendingUp, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Coins, 
  Sliders, 
  Clock, 
  Home,
  Hammer,
  FileSpreadsheet
} from 'lucide-react';
import { 
  RAB_ITEMS, 
  CONSTRUCTION_PHASES, 
  calculateRabTotals 
} from '../utils/costEstimator';
import { HouseDesignState } from '../utils/houseDesignStore';
import {
  FLOOR_FINISH_OPTIONS,
  WALL_FINISH_OPTIONS,
  ROOF_STYLE_OPTIONS,
  ROOF_MATERIAL_OPTIONS,
  ROOF_WALL_FINISH_OPTIONS,
  DEFAULT_ROOF_CONFIG,
} from '../utils/architectureData';

interface ConstructionCostViewProps {
  design?: HouseDesignState;
}

export const ConstructionCostView: React.FC<ConstructionCostViewProps> = ({ design }) => {
  const [standardTier, setStandardTier] = useState<'economy' | 'midRange'>('midRange');
  const [contingencyPercent, setContingencyPercent] = useState<number>(8);
  const [filterPhase, setFilterPhase] = useState<number | 'all'>('all');

  const rab = calculateRabTotals(contingencyPercent, design);

  const formatIdr = (val: number) => {
    return 'Rp ' + Math.round(val).toLocaleString('id-ID');
  };

  const allItems = rab.items || RAB_ITEMS;
  const filteredItems = filterPhase === 'all' 
    ? allItems 
    : allItems.filter(item => item.phase === filterPhase);

  const roofCfg = design?.roofConfig || DEFAULT_ROOF_CONFIG;
  const activeRoofStyle = ROOF_STYLE_OPTIONS.find(s => s.id === roofCfg.style) || ROOF_STYLE_OPTIONS[0];
  const activeRoofMat = ROOF_MATERIAL_OPTIONS.find(m => m.id === roofCfg.material) || ROOF_MATERIAL_OPTIONS[0];
  const activeRoofWall = ROOF_WALL_FINISH_OPTIONS.find(w => w.id === roofCfg.wallFinish) || ROOF_WALL_FINISH_OPTIONS[0];

  const rearYard = design?.groundFloorRooms?.find(r => r.id === 'rear_service_yard');
  const rearGardenFinish = FLOOR_FINISH_OPTIONS.find(f => f.id === (rearYard?.floorFinish || 'grass')) || FLOOR_FINISH_OPTIONS[4];

  const roofItem = allItems.find(i => i.id === 'roof-framing');
  const floorItem = allItems.find(i => i.id === 'floor-tiles');
  const paintItem = allItems.find(i => i.id === 'painting-coatings');
  const gardenItem = allItems.find(i => i.id === 'rear-garden-landscape');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* View Header */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 font-semibold text-xs tracking-wider uppercase mb-1">
              <Calculator className="w-4 h-4" />
              <span>Section 10.G &amp; Section 9 • Estimasi Biaya Konstruksi (RAB) &amp; Rencana Bertahap</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Estimasi Biaya Renovasi (RAB) &amp; 4 Fase Pelaksanaan
            </h2>
            <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-3xl leading-relaxed">
              Kalkulator anggaran biaya berbasis standar konstruksi perumahan di Indonesia. 
              Otomatis menyesuaikan biaya <strong>Model Atap &amp; Dinding Atap</strong>, <strong>Material Lantai</strong>, <strong>Warna Dinding</strong>, serta <strong>Lantai Rumput Taman Belakang</strong>.
            </p>
          </div>

          {/* Tier Switcher (Ekonomis vs Standar Menengah) */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-bold">
              <button
                onClick={() => setStandardTier('economy')}
                className={`px-3.5 py-2 rounded-lg transition-all cursor-pointer ${
                  standardTier === 'economy'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Paket Ekonomis
              </button>
              <button
                onClick={() => setStandardTier('midRange')}
                className={`px-3.5 py-2 rounded-lg transition-all cursor-pointer ${
                  standardTier === 'midRange'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Paket Standar Menengah (Direkomendasikan)
              </button>
            </div>
          </div>
        </div>

        {/* Financial Highlights Cards */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <span className="text-xs text-slate-500 font-medium block">Total Estimasi RAB</span>
            <div className="text-xl sm:text-2xl font-extrabold text-indigo-700 font-mono mt-1">
              {formatIdr(standardTier === 'economy' ? rab.totalEconomy : rab.totalMidRange)}
            </div>
            <span className="text-[11px] text-slate-500 block mt-1">
              Termasuk Kontingensi {contingencyPercent}%
            </span>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <span className="text-xs text-slate-500 font-medium block">Biaya Rata-Rata per m²</span>
            <div className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono mt-1">
              {formatIdr(standardTier === 'economy' ? rab.ratePerM2Economy : rab.ratePerM2MidRange)}
              <span className="text-xs text-slate-500 font-normal"> / m²</span>
            </div>
            <span className="text-[11px] text-emerald-600 font-medium block mt-1">
              Standar Wajar Jabodetabek / Jawa
            </span>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <span className="text-xs text-slate-500 font-medium block">Luas Tambahan Bangunan</span>
            <div className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono mt-1">
              {rab.newFloorAreaM2.toFixed(1)} m²
            </div>
            <span className="text-[11px] text-slate-500 block mt-1">
              Lantai 1 (+42m²) &amp; Lantai 2 (+42m²)
            </span>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <span className="text-xs text-slate-500 font-medium block">Estimasi Waktu Pengerjaan</span>
            <div className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono mt-1">
              19 - 21 Minggu
            </div>
            <span className="text-[11px] text-indigo-600 font-medium block mt-1">
              Terbagi dalam 4 Fase Terkontrol
            </span>
          </div>
        </div>

        {/* Live Custom Material & Rear Garden Cost Summary */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50/80 p-4 rounded-xl border border-slate-200">
          <div className="bg-white p-3 rounded-lg border border-slate-200/90">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block">Model Atap &amp; Dinding Atap</span>
            <strong className="text-xs text-slate-900 block mt-0.5">{activeRoofStyle.name}</strong>
            <span className="text-[11px] text-slate-500 block">{activeRoofMat.name} • {activeRoofWall.name}</span>
            {roofItem && (
              <span className="font-mono font-bold text-xs text-indigo-700 block mt-1.5">
                {formatIdr(roofItem.quantity * (standardTier === 'economy' ? roofItem.rateEconomyIdr : roofItem.rateMidRangeIdr))}
              </span>
            )}
          </div>

          <div className="bg-white p-3 rounded-lg border border-slate-200/90">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 block">Material Lantai Rumah</span>
            <strong className="text-xs text-slate-900 block mt-0.5">Total {floorItem?.quantity || 92} m² Lantai</strong>
            <span className="text-[11px] text-slate-500 line-clamp-1 block">{floorItem?.description}</span>
            {floorItem && (
              <span className="font-mono font-bold text-xs text-amber-700 block mt-1.5">
                {formatIdr(floorItem.quantity * (standardTier === 'economy' ? floorItem.rateEconomyIdr : floorItem.rateMidRangeIdr))}
              </span>
            )}
          </div>

          <div className="bg-white p-3 rounded-lg border border-slate-200/90">
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 block">Finishing &amp; Warna Dinding</span>
            <strong className="text-xs text-slate-900 block mt-0.5">Luas Dinding ~{paintItem?.quantity || 320} m²</strong>
            <span className="text-[11px] text-slate-500 line-clamp-1 block">{paintItem?.description}</span>
            {paintItem && (
              <span className="font-mono font-bold text-xs text-sky-700 block mt-1.5">
                {formatIdr(paintItem.quantity * (standardTier === 'economy' ? paintItem.rateEconomyIdr : paintItem.rateMidRangeIdr))}
              </span>
            )}
          </div>

          <div className="bg-emerald-50/70 p-3 rounded-lg border border-emerald-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">Taman Void Belakang</span>
            <strong className="text-xs text-emerald-950 block mt-0.5">{rearGardenFinish.name}</strong>
            <span className="text-[11px] text-emerald-700 block">
              Luas {gardenItem?.quantity || 6.0} m² {rearYard?.skylight?.hasSkylight ? '+ Kanopi Skylight' : '(Terbuka)'}
            </span>
            {gardenItem && (
              <span className="font-mono font-bold text-xs text-emerald-800 block mt-1.5">
                {formatIdr(gardenItem.quantity * (standardTier === 'economy' ? gardenItem.rateEconomyIdr : gardenItem.rateMidRangeIdr))}
              </span>
            )}
          </div>
        </div>

        {/* Contingency Slider */}
        <div className="mt-6 p-4 rounded-xl bg-indigo-50/60 border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-600" />
            <span className="font-semibold text-indigo-950">
              Penyesuaian Dana Cadangan / Tak Terduga (Contingency):
            </span>
            <span className="font-mono font-bold text-indigo-700 text-sm bg-white px-2 py-0.5 rounded border border-indigo-200">
              {contingencyPercent}%
            </span>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-64">
            <span className="text-slate-500 text-[11px]">5%</span>
            <input
              type="range"
              min="5"
              max="15"
              step="1"
              value={contingencyPercent}
              onChange={(e) => setContingencyPercent(parseInt(e.target.value))}
              className="w-full h-1.5 bg-indigo-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <span className="text-slate-500 text-[11px]">15%</span>
          </div>
        </div>
      </div>

      {/* 4-PHASE CONSTRUCTION ROADMAP (SECTION 9) */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            Rencana Bertahap (4-Phasing Plan) &amp; Strategi Huni Aman
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Dirancang agar keluarga (7 orang) tetap dapat tinggal di rumah selama proses renovasi dengan memusatkan pekerjaan kotor pada zona ekstensi kanan.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {CONSTRUCTION_PHASES.map((p) => {
            const dynamicPhaseCost = rab.phaseTotals[p.phase as 1 | 2 | 3 | 4];
            const displayCost = dynamicPhaseCost
              ? (standardTier === 'economy' ? dynamicPhaseCost.economy : dynamicPhaseCost.mid)
              : (standardTier === 'economy' ? p.costEconomyIdr : p.costMidRangeIdr);

            return (
              <div 
                key={p.phase} 
                className="bg-slate-50 rounded-xl p-5 border border-slate-200 flex flex-col justify-between hover:border-indigo-300 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-xs">
                    <span className="font-bold text-indigo-600 uppercase">Fase {p.phase}</span>
                    <span className="text-slate-500 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {p.durationWeeks} Minggu
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm mt-3">{p.titleIndonesian}</h4>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">{p.description}</p>

                  <div className="mt-4 space-y-1.5 text-xs text-slate-700">
                    <span className="font-semibold text-slate-800 block text-[11px] uppercase tracking-wider">Output Kunci:</span>
                    {p.keyDeliverables.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-200 text-xs">
                  <span className="text-slate-500 block text-[11px]">Anggaran Fase Ini:</span>
                  <span className="font-mono font-bold text-indigo-700 text-sm">
                    {formatIdr(displayCost)}
                  </span>
                  <div className="mt-2 text-[11px] text-emerald-800 bg-emerald-50 p-1.5 rounded border border-emerald-200 font-medium">
                    {p.occupancyFeasibility}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ITEMIZED RAB TABLE */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
              Rincian Anggaran Biaya Terperinci (Bill of Quantities)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Daftar pekerjaan struktural, arsitektural, plumbing, listrik, dan finishing beserta harga satuan.
            </p>
          </div>

          {/* Phase Filter Button Group */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setFilterPhase('all')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                filterPhase === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setFilterPhase(1)}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                filterPhase === 1 ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Fase 1
            </button>
            <button
              onClick={() => setFilterPhase(2)}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                filterPhase === 2 ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Fase 2
            </button>
            <button
              onClick={() => setFilterPhase(3)}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                filterPhase === 3 ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Fase 3
            </button>
            <button
              onClick={() => setFilterPhase(4)}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                filterPhase === 4 ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Fase 4
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-xs text-left divide-y divide-slate-200">
            <thead className="bg-slate-50 text-slate-700 font-semibold">
              <tr>
                <th className="px-3 py-3">Uraian Pekerjaan &amp; Material</th>
                <th className="px-3 py-3">Fase</th>
                <th className="px-3 py-3 font-mono">Vol</th>
                <th className="px-3 py-3">Satuan</th>
                <th className="px-3 py-3 font-mono text-right">Harga Satuan (Rp)</th>
                <th className="px-3 py-3 font-mono text-right font-bold text-slate-900">Total Harga (Rp)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredItems.map((item) => {
                const unitPrice = standardTier === 'economy' ? item.rateEconomyIdr : item.rateMidRangeIdr;
                const totalPrice = item.quantity * unitPrice;

                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-3 py-3 text-slate-900 max-w-sm">
                      <span className="font-semibold block">{item.categoryIndonesian}</span>
                      <span className="text-slate-500 text-[11px] leading-relaxed block">{item.description}</span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-slate-100 text-slate-700">
                        Fase {item.phase}
                      </span>
                    </td>
                    <td className="px-3 py-3 font-mono text-slate-800">{item.quantity}</td>
                    <td className="px-3 py-3 text-slate-500">{item.unit}</td>
                    <td className="px-3 py-3 font-mono text-right text-slate-700">
                      {formatIdr(unitPrice)}
                    </td>
                    <td className="px-3 py-3 font-mono text-right font-bold text-indigo-700">
                      {formatIdr(totalPrice)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-100/80 font-bold text-xs divide-y divide-slate-200">
              <tr>
                <td colSpan={5} className="px-3 py-3 text-right text-slate-800">
                  Subtotal Rincian Pekerjaan:
                </td>
                <td className="px-3 py-3 font-mono text-right text-slate-900 font-extrabold">
                  {formatIdr(standardTier === 'economy' ? rab.subtotalEconomy : rab.subtotalMidRange)}
                </td>
              </tr>
              <tr>
                <td colSpan={5} className="px-3 py-3 text-right text-slate-700">
                  Kontingensi / Biaya Tak Terduga ({contingencyPercent}%):
                </td>
                <td className="px-3 py-3 font-mono text-right text-slate-700">
                  {formatIdr(standardTier === 'economy' ? rab.contingencyEcon : rab.contingencyMid)}
                </td>
              </tr>
              <tr className="bg-indigo-50/80 text-sm">
                <td colSpan={5} className="px-3 py-3.5 text-right text-indigo-950 font-extrabold uppercase">
                  TOTAL BIAYA RENOVASI (RAB):
                </td>
                <td className="px-3 py-3.5 font-mono text-right text-indigo-700 font-extrabold">
                  {formatIdr(standardTier === 'economy' ? rab.totalEconomy : rab.totalMidRange)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Disclaimer Note (Section 10.G Requirement) */}
        <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 flex items-start gap-3 text-xs text-amber-900">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>Catatan &amp; Batasan Konsultan:</strong> Estimasi ini adalah Rencana Anggaran Biaya (RAB) konseptual 
            berdasarkan indeks harga satuan pekerjaan dan material terbaru di Indonesia (Jabodetabek). 
            Angka ini disajikan sebagai acuan anggaran perencanaan pemilik rumah dan <strong>bukan penawaran kontrak resmi (quotation pemborong)</strong>. 
            Harga riil dapat bervariasi bergantung pada fluktuasi harga material semen/besi SNI dan negosiasi tukang di lokasi proyek.
          </div>
        </div>
      </div>
    </div>
  );
};
