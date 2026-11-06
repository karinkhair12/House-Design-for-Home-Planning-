/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Compass, 
  Ruler, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  HelpCircle, 
  ShieldCheck, 
  Building2, 
  ChevronRight, 
  Sliders, 
  Layers, 
  FileCheck, 
  ExternalLink,
  BookOpen,
  ArrowUpDown
} from 'lucide-react';
import { HouseDesignState } from '../utils/houseDesignStore';
import { 
  evaluateStaircase, 
  evaluateBalcony, 
  analyzeSiteFeasibility, 
  REGIONAL_PROFILES, 
  RegionalSetbackProfile,
  StaircaseSpecs,
  BalconySpecs
} from '../utils/architecturalStandards';

interface ArchitecturalRulesViewProps {
  design: HouseDesignState;
}

export const ArchitecturalRulesView: React.FC<ArchitecturalRulesViewProps> = ({ design }) => {
  const [activeSection, setActiveSection] = useState<'dashboard' | 'staircase' | 'balcony' | 'setback' | 'standards'>('dashboard');

  // Setback Profile State
  const [selectedProfileId, setSelectedProfileId] = useState<string>('sni-standard');
  const activeProfile = REGIONAL_PROFILES.find(p => p.id === selectedProfileId) || REGIONAL_PROFILES[0];

  // Staircase Assistant State
  const [staircaseSpecs, setStaircaseSpecs] = useState<StaircaseSpecs>({
    floorToFloorHeight: 3.6,
    treadDepth: 0.28,
    riserHeight: 0.18,
    width: 0.90,
    shape: 'l-shape',
    landingDepth: 0.90,
  });

  // Balcony Assistant State
  const [balconySpecs, setBalconySpecs] = useState<BalconySpecs>({
    width: 3.0,
    depth: 2.0,
    railingHeight: 1.10,
    cantileverDepth: 0.0, // On new structural frame
  });

  const staircaseEval = evaluateStaircase(staircaseSpecs);
  const balconyEval = evaluateBalcony(balconySpecs);
  const siteFeasibility = analyzeSiteFeasibility(
    9.0,
    11.0,
    design.groundFloorRooms,
    design.secondFloorRooms,
    activeProfile
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Title & Overview Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-2">
            <Compass className="w-3.5 h-3.5 text-indigo-400" />
            <span>Aturan Arsitektur &amp; Analisis Kelayakan SNI</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            Pusat Standar Spasial, Tangga, Balkon &amp; Garis Sempadan (GSB/KDB)
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-3xl">
            Mesin evaluasi kelayakan arsitektur berbasis regulasi rumah tinggal Indonesia, standar ergonomis manusia, serta SNI 03-1733 dan Permen PUPR.
          </p>
        </div>

        {/* Profile Selector */}
        <div className="bg-slate-800/90 border border-slate-700 p-3.5 rounded-xl shrink-0">
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Profil Regulasi Wilayah:
          </label>
          <select
            value={selectedProfileId}
            onChange={(e) => setSelectedProfileId(e.target.value)}
            className="w-full text-xs bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {REGIONAL_PROFILES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <div className="text-[11px] text-slate-400 mt-1.5 flex items-center justify-between">
            <span>Status: <strong className="text-emerald-400">{activeProfile.verificationStatus}</strong></span>
          </div>
        </div>
      </div>

      {/* Sub Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveSection('dashboard')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeSection === 'dashboard'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Dashboard Kelayakan</span>
        </button>

        <button
          onClick={() => setActiveSection('staircase')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeSection === 'staircase'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
          }`}
        >
          <ArrowUpDown className="w-4 h-4" />
          <span>Asisten Tangga (2R + G)</span>
        </button>

        <button
          onClick={() => setActiveSection('balcony')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeSection === 'balcony'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Asisten Balkon</span>
        </button>

        <button
          onClick={() => setActiveSection('setback')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeSection === 'setback'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
          }`}
        >
          <Ruler className="w-4 h-4" />
          <span>GSB &amp; KDB Lahan</span>
        </button>

        <button
          onClick={() => setActiveSection('standards')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeSection === 'standards'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Pustaka Standar SNI</span>
        </button>
      </div>

      {/* SECTION 1: DASHBOARD */}
      {activeSection === 'dashboard' && (
        <div className="space-y-6">
          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <span className="text-xs text-slate-500 font-medium">Koefisien Dasar Bangunan (KDB)</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-slate-900">{siteFeasibility.actualKdbPercent}%</span>
                <span className="text-xs text-slate-500">maks. {activeProfile.kdbMaxPercent}%</span>
              </div>
              <div className="mt-2 text-xs flex items-center gap-1.5">
                {siteFeasibility.isKdbCompliant ? (
                  <span className="text-emerald-600 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Memenuhi Syarat
                  </span>
                ) : (
                  <span className="text-amber-600 flex items-center gap-1 font-medium">
                    <AlertTriangle className="w-3.5 h-3.5" /> Melebihi KDB
                  </span>
                )}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <span className="text-xs text-slate-500 font-medium">Ruang Terbuka Hijau (KDH)</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-slate-900">{siteFeasibility.actualKdhPercent}%</span>
                <span className="text-xs text-slate-500">min. {activeProfile.kdhMinPercent}%</span>
              </div>
              <div className="mt-2 text-xs flex items-center gap-1.5">
                {siteFeasibility.isKdhCompliant ? (
                  <span className="text-emerald-600 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Resapan Alami Aman
                  </span>
                ) : (
                  <span className="text-amber-600 flex items-center gap-1 font-medium">
                    <AlertTriangle className="w-3.5 h-3.5" /> Di Bawah Target
                  </span>
                )}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <span className="text-xs text-slate-500 font-medium">Total Luas Lantai (KLB)</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-slate-900">{siteFeasibility.totalFloorAreaM2} m²</span>
                <span className="text-xs text-slate-500">KLB: {siteFeasibility.actualKlb}</span>
              </div>
              <div className="mt-2 text-xs text-slate-500">
                L1 + L2 (Lahan 99 m²)
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <span className="text-xs text-slate-500 font-medium">Tingkat Risiko Struktural</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className={`text-lg font-bold ${
                  siteFeasibility.structuralRiskLevel === 'Rendah (Aman)' ? 'text-emerald-600' : 'text-amber-600'
                }`}>
                  {siteFeasibility.structuralRiskLevel}
                </span>
              </div>
              <div className="mt-2 text-xs text-slate-500">
                Pondasi terpisah dari bata eksisting
              </div>
            </div>
          </div>

          {/* Checklist Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-indigo-600" />
                Matriks Audit Kelayakan Arsitektur &amp; Perizinan
              </h3>
              <span className="text-xs text-slate-500 font-mono">Berdasarkan {activeProfile.legalBasis}</span>
            </div>

            <div className="divide-y divide-slate-100">
              {siteFeasibility.preliminaryChecks.map((item, idx) => (
                <div key={idx} className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{item.category}</span>
                    </div>
                    <div className="text-sm font-medium text-slate-900">{item.item}</div>
                    <div className="text-xs text-slate-500">{item.note}</div>
                  </div>

                  <div className="shrink-0">
                    {item.status === 'good' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Baik (Memenuhi Standar)
                      </span>
                    )}
                    {item.status === 'attention' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        Perlu Perhatian
                      </span>
                    )}
                    {item.status === 'conflict' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                        Potensi Konflik
                      </span>
                    )}
                    {item.status === 'verification' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">
                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                        Perlu Verifikasi Ahli
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: STAIRCASE ASSISTANT */}
      {activeSection === 'staircase' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Form */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-semibold text-slate-900 text-base flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4 text-indigo-600" />
              Parameter Geometri Tangga
            </h3>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Tinggi Antar Lantai (m): {staircaseSpecs.floorToFloorHeight} m
              </label>
              <input
                type="range"
                min="2.8"
                max="4.2"
                step="0.05"
                value={staircaseSpecs.floorToFloorHeight}
                onChange={(e) => setStaircaseSpecs({ ...staircaseSpecs, floorToFloorHeight: parseFloat(e.target.value) })}
                className="w-full accent-indigo-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Target Tinggi Tanjakan (m)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.15"
                  max="0.22"
                  value={staircaseSpecs.riserHeight}
                  onChange={(e) => setStaircaseSpecs({ ...staircaseSpecs, riserHeight: parseFloat(e.target.value) || 0.18 })}
                  className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-1.5"
                />
                <span className="text-[11px] text-slate-400">Standar: 0.16–0.19 m</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Lebar Injakan / Tread (m)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.22"
                  max="0.35"
                  value={staircaseSpecs.treadDepth}
                  onChange={(e) => setStaircaseSpecs({ ...staircaseSpecs, treadDepth: parseFloat(e.target.value) || 0.28 })}
                  className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-1.5"
                />
                <span className="text-[11px] text-slate-400">Standar: 0.27–0.30 m</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Lebar Tangga (m)
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="0.75"
                  max="1.50"
                  value={staircaseSpecs.width}
                  onChange={(e) => setStaircaseSpecs({ ...staircaseSpecs, width: parseFloat(e.target.value) || 0.90 })}
                  className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-1.5"
                />
                <span className="text-[11px] text-slate-400">Min. 0.80–0.90 m</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Bentuk Tangga
                </label>
                <select
                  value={staircaseSpecs.shape}
                  onChange={(e) => setStaircaseSpecs({ ...staircaseSpecs, shape: e.target.value as any })}
                  className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-1.5"
                >
                  <option value="l-shape">Bentuk L (Siku)</option>
                  <option value="u-shape">Bentuk U (Putar Balik)</option>
                  <option value="straight">Lurus (Straight)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results Display */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
            <h3 className="font-semibold text-slate-900 text-base">Hasil Kalkulasi Ergonomi Tangga</h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <span className="text-xs text-slate-500">Jumlah Tanjakan (Riser)</span>
                <div className="text-lg font-bold text-slate-900 mt-0.5">{staircaseEval.numberOfRisers} trap</div>
                <span className="text-[11px] text-slate-400">{(staircaseSpecs.floorToFloorHeight / staircaseEval.numberOfRisers * 100).toFixed(1)} cm / trap</span>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <span className="text-xs text-slate-500">Rumus Blondel (2R + G)</span>
                <div className="text-lg font-bold text-slate-900 mt-0.5">{staircaseEval.blondelFormulaValueCm} cm</div>
                <span className={`text-[11px] font-medium ${staircaseEval.isBlondelCompliant ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {staircaseEval.isBlondelCompliant ? 'Ideal (60–65 cm)' : 'Di luar rentang ideal'}
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <span className="text-xs text-slate-500">Sudut Kemiringan</span>
                <div className="text-lg font-bold text-slate-900 mt-0.5">{staircaseEval.slopeDegrees}°</div>
                <span className={`text-[11px] font-medium ${staircaseEval.isSlopeSafe ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {staircaseEval.isSlopeSafe ? 'Aman (≤ 38°)' : 'Terlalu Curam!'}
                </span>
              </div>
            </div>

            {/* Warnings and Recommendations */}
            {staircaseEval.warnings.length > 0 && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                <div className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  Peringatan Kenyamanan &amp; Keselamatan:
                </div>
                {staircaseEval.warnings.map((w, idx) => (
                  <div key={idx} className="text-xs text-amber-700 pl-5 list-disc">• {w}</div>
                ))}
              </div>
            )}

            <div className="text-xs text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <strong>Rekomendasi Penerapan Desain Griya 9×11:</strong> Pada denah lantai dasar eksisting, bordes tangga diletakkan di sisi kanan (X: 6m - 9m, Y: 6m - 8m). Desain ini menggunakan bentuk L/U dengan 19-20 tanjakan berukuran 18cm tinggi dan 28cm injakan, menyisakan ruang bebas di bawah tangga untuk kamar mandi atau gudang.
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: BALCONY ASSISTANT */}
      {activeSection === 'balcony' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-semibold text-slate-900 text-base flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-600" />
              Parameter Balkon
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Lebar Balkon (m)</label>
                <input
                  type="number"
                  step="0.1"
                  min="1.0"
                  max="6.0"
                  value={balconySpecs.width}
                  onChange={(e) => setBalconySpecs({ ...balconySpecs, width: parseFloat(e.target.value) || 3.0 })}
                  className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-1.5"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Kedalaman (m)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.8"
                  max="3.0"
                  value={balconySpecs.depth}
                  onChange={(e) => setBalconySpecs({ ...balconySpecs, depth: parseFloat(e.target.value) || 2.0 })}
                  className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-1.5"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Tinggi Railing Pengaman (m): {balconySpecs.railingHeight} m
              </label>
              <input
                type="range"
                min="0.7"
                max="1.4"
                step="0.05"
                value={balconySpecs.railingHeight}
                onChange={(e) => setBalconySpecs({ ...balconySpecs, railingHeight: parseFloat(e.target.value) })}
                className="w-full accent-indigo-600"
              />
              <span className="text-[11px] text-slate-400">Batas minimum SNI: 1.05 - 1.10 meter</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Kedalaman Kantilever Bebas (m)
              </label>
              <input
                type="number"
                step="0.1"
                min="0.0"
                max="2.5"
                value={balconySpecs.cantileverDepth}
                onChange={(e) => setBalconySpecs({ ...balconySpecs, cantileverDepth: parseFloat(e.target.value) || 0 })}
                className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-1.5"
              />
              <span className="text-[11px] text-slate-400">0 m jika disangga kolom; maks 1.5m jika menggantung bebas</span>
            </div>
          </div>

          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-semibold text-slate-900 text-base">Evaluasi Keamanan &amp; Fungsi Balkon</h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <span className="text-xs text-slate-500">Luas Bersih Balkon</span>
                <div className="text-lg font-bold text-slate-900 mt-0.5">{balconyEval.usableAreaM2} m²</div>
                <span className="text-[11px] text-slate-400">Cukup untuk meja santai 2 kursi</span>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <span className="text-xs text-slate-500">Status Railing SNI</span>
                <div className={`text-lg font-bold mt-0.5 ${balconyEval.isRailingCompliant ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {balconyEval.isRailingCompliant ? 'Memenuhi SNI' : 'Terlalu Rendah'}
                </div>
                <span className="text-[11px] text-slate-400">Tinggi {(balconySpecs.railingHeight * 100).toFixed(0)} cm</span>
              </div>
            </div>

            {balconyEval.warnings.length > 0 && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
                <div className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  Peringatan Struktural / Keselamatan:
                </div>
                {balconyEval.warnings.map((w, idx) => (
                  <div key={idx} className="text-xs text-rose-700 pl-5 list-disc">• {w}</div>
                ))}
              </div>
            )}

            <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="font-semibold text-slate-900 mb-1">Rekomendasi Arsitek:</div>
              {balconyEval.recommendations.map((r, idx) => (
                <div key={idx} className="flex items-start gap-1.5">
                  <span className="text-indigo-500">•</span>
                  <span>{r}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: SETBACK & KDB */}
      {activeSection === 'setback' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200 pb-4">
            <div>
              <h3 className="font-semibold text-slate-900 text-base">
                Parameter Garis Sempadan Bangunan (GSB) &amp; Koefisien Dasar Bangunan (KDB)
              </h3>
              <p className="text-xs text-slate-500">
                Profil aktif: <strong>{activeProfile.name}</strong> ({activeProfile.provinceCity})
              </p>
            </div>
            <div className="text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg border border-slate-200">
              Dasar Hukum: {activeProfile.legalBasis}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
              <span className="text-xs text-slate-500 font-medium">Garis Sempadan Depan (GSB Depan)</span>
              <div className="text-xl font-bold text-slate-900 mt-1">{activeProfile.frontSetbackMeters} meter</div>
              <p className="text-xs text-slate-500 mt-1.5">
                Jarak minimum dinding terdepan bangunan tertutup dari as/garis batas jalan.
              </p>
            </div>

            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
              <span className="text-xs text-slate-500 font-medium">Batas Koefisien Dasar Bangunan (KDB)</span>
              <div className="text-xl font-bold text-slate-900 mt-1">{activeProfile.kdbMaxPercent}%</div>
              <p className="text-xs text-slate-500 mt-1.5">
                Maksimal tutupan lantai dasar 59.4 m² dari total luas lahan 99 m².
              </p>
            </div>

            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
              <span className="text-xs text-slate-500 font-medium">Koefisien Dasar Hijau (KDH)</span>
              <div className="text-xl font-bold text-slate-900 mt-1">{activeProfile.kdhMinPercent}%</div>
              <p className="text-xs text-slate-500 mt-1.5">
                Area resapan tanah alami minimum {((activeProfile.kdhMinPercent / 100) * 99).toFixed(1)} m².
              </p>
            </div>
          </div>

          <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-950 space-y-2">
            <div className="font-semibold text-indigo-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              Catatan Kepatuhan Regulasi Indonesia:
            </div>
            <p>
              Pada sketsa eksisting pemilik rumah, Kamar Tidur 1 (KT 1) berada pada jarak Y = 2.15 meter dari jalan depan, yang pas memenuhi batas GSB 2.0–2.15m. Area depan (0–2.15m) diperuntukkan bagi carport terbuka dan teras, yang diperkenankan oleh dinas tata kota setempat selama tidak berdinding permanen tertutup penuh.
            </p>
          </div>
        </div>
      )}

      {/* SECTION 5: STANDARDS LIBRARY */}
      {activeSection === 'standards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-2">
            <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider">SNI 03-6572-2001</div>
            <h4 className="font-bold text-slate-900 text-sm">Standar Ventilasi &amp; Penghawaan Alami</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Bukaan jendela/ventilasi alami untuk ruang hunian rumah tinggal minimum adalah <strong>5% dari luas lantai ruang tersebut</strong>. Pada desain ini, KT 1 menghadap taman depan, KT 2 menghadap lightwell belakang, dan seluruh kamar lantai 2 memiliki bukaan langsung ke udara luar.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-2">
            <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider">SNI 03-6197-2000</div>
            <h4 className="font-bold text-slate-900 text-sm">Standar Pencahayaan Alami Siang Hari</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Luas bukaan kaca untuk pencahayaan alami minimum <strong>10% dari luas lantai</strong> untuk ruang tidur dan ruang keluarga. Pintu geser kaca Ruang Makan yang berhadapan langsung dengan taman belakang memasok cahaya merata hingga ke Ruang Keluarga (RK).
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-2">
            <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Ergonomi Servis &amp; Dapur</div>
            <h4 className="font-bold text-slate-900 text-sm">Segitiga Kerja Dapur &amp; Jalur Evakuasi Belakang</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Jarak antara kompor, sink, dan kulkas idealnya antara 1.2m hingga 2.7m. Jalur sirkulasi keluar pintu belakang disyaratkan bersih minimum <strong>85 cm</strong>. Pintu belakang didesain membuka ke luar sehingga saat mesin cuci beroperasi, jalur mobilitas tetap bebas hambatan.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-2">
            <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider">SNI 2847:2019</div>
            <h4 className="font-bold text-slate-900 text-sm">Persyaratan Beton Struktural &amp; Balok Kolom Mandiri</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Struktur lantai 2 menggunakan modul kolom K1 (20x20 cm dengan 6D12) dan balok B1 (20x35 cm) dengan pondasi footplat mandiri 100x100 cm pada kedalaman tanah keras (1.5-2m), menjamin atap dan dinding bata lama tidak menanggung beban vertikal.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
