/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Compass, 
  AlertTriangle, 
  CheckCircle2, 
  MapPin, 
  Home, 
  Grid, 
  Users, 
  ShieldCheck, 
  ArrowRight,
  Maximize2,
  FileText
} from 'lucide-react';
import { EXISTING_ROOMS, SITE_BOUNDARY, PROHIBITED_UPPER_ZONE } from '../utils/architectureData';

export const SiteAnalysisView: React.FC = () => {
  const [activeSketch, setActiveSketch] = useState<'both' | 'sketch1' | 'sketch2'>('both');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title & Introduction */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 font-semibold text-xs tracking-wider uppercase mb-1">
              <MapPin className="w-4 h-4" />
              <span>Section 10.A • Laporan Analisis Tapak & Interpretasi Sketsa</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Karakteristik Lahan 9m × 11m & Batasan Struktural
            </h2>
            <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-3xl leading-relaxed">
              Analisis komprehensif dari 2 sketsa gambar tangan (PENUP). Interpretasi geometris presisi grid 1m × 1m, 
              evaluasi kapasitas pondasi eksisting, dan penetapan zona konstruksi 2 lantai yang aman secara struktural.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Luas Lahan: 99 m² (9.0m × 11.0m)
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 text-xs font-semibold border border-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Pondasi Lama: SNI 1 Lantai
            </span>
          </div>
        </div>

        {/* 2-Column: Original Sketches vs Architectural Coordinate Interpretation */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Original Uploaded Sketches */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                Sketsa Asli Pemilik Rumah (PENUP References)
              </h3>
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-medium text-slate-600">
                <button
                  onClick={() => setActiveSketch('both')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${activeSketch === 'both' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'}`}
                >
                  Keduanya
                </button>
                <button
                  onClick={() => setActiveSketch('sketch1')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${activeSketch === 'sketch1' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'}`}
                >
                  Batas Lahan
                </button>
                <button
                  onClick={() => setActiveSketch('sketch2')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${activeSketch === 'sketch2' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'}`}
                >
                  Bangunan Lama
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(activeSketch === 'both' || activeSketch === 'sketch1') && (
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex flex-col">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2">
                    <span>Gambar 1: Batas Lahan 9m × 11m</span>
                    <span className="text-indigo-600">99 m²</span>
                  </div>
                  <div className="aspect-square rounded-lg overflow-hidden border border-slate-200 bg-white flex items-center justify-center">
                    <img 
                      src="/public/assets/aistudio/SmartSelect_20261028_151142_PENUP_848d66b1.jpg" 
                      alt="Gambar 1 - Batas Lahan Tampak Depan 9 meter x 11 meter"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <p className="mt-2 text-xs text-slate-500 leading-snug">
                    Grid kotak 1m × 1m. Sempadan depan 2.15m, sempadan belakang 2.0m, lebar 9m, panjang 11m.
                  </p>
                </div>
              )}

              {(activeSketch === 'both' || activeSketch === 'sketch2') && (
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex flex-col">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2">
                    <span>Gambar 2: Bangunan Eksisting</span>
                    <span className="text-emerald-700">KT1, KT2, RK</span>
                  </div>
                  <div className="aspect-square rounded-lg overflow-hidden border border-slate-200 bg-white flex items-center justify-center">
                    <img 
                      src="/public/assets/aistudio/SmartSelect_20261028_151217_PENUP_9a20c88e.jpg" 
                      alt="Gambar 2 - Denah Eksisting KT1, KT2, RK"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <p className="mt-2 text-xs text-slate-500 leading-snug">
                    KT 1 (3m × 3.5m), KT 2 (3m × 3.0m), RK (3m × 6.0m). Seluruh sisi kanan selebar 3.0m masih berupa lahan kosong.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Technical Coordinate Diagram */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Grid className="w-4 h-4 text-indigo-600" />
              Diagram Zona Struktural & Batasan Beban
            </h3>

            {/* SVG Visual Model of Site */}
            <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 text-white relative">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                <span className="font-mono text-emerald-400">TAMPAK DEPAN (JALAN UTAMA) - 9 METER</span>
                <span className="text-slate-400">Y = 0.0m</span>
              </div>

              {/* Interactive SVG Diagram */}
              <div className="relative aspect-[9/11] max-w-sm mx-auto bg-slate-900 rounded-lg border border-slate-700 p-2 overflow-hidden shadow-inner">
                <svg viewBox="0 0 90 110" className="w-full h-full">
                  {/* Grid Lines (1m x 1m = 10 units each) */}
                  <defs>
                    <pattern id="gridPattern" width="10" height="10" patternUnits="userSpaceOnUse">
                      <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#334155" strokeWidth="0.5" />
                    </pattern>
                    <pattern id="prohibitedHatch" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                      <rect width="2" height="4" fill="#ef4444" opacity="0.3" />
                    </pattern>
                  </defs>
                  
                  <rect width="90" height="110" fill="url(#gridPattern)" />

                  {/* Open front yard / carport */}
                  <rect x="0" y="0" width="60" height="21.5" fill="#3b82f6" fillOpacity="0.15" stroke="#3b82f6" strokeWidth="0.8" strokeDasharray="2 2" />
                  <text x="30" y="12" fill="#60a5fa" fontSize="3" textAnchor="middle" fontWeight="bold">CARPORT / TERAS DEPAN</text>

                  {/* KT 1: X: 0-30, Y: 21.5-56.5 */}
                  <rect x="0" y="21.5" width="30" height="35" fill="#f59e0b" fillOpacity="0.25" stroke="#f59e0b" strokeWidth="1" />
                  <text x="15" y="38" fill="#fbbf24" fontSize="3.5" textAnchor="middle" fontWeight="bold">KT 1 (Eksisting)</text>
                  <text x="15" y="44" fill="#cbd5e1" fontSize="2.8" textAnchor="middle">3.0m × 3.5m</text>

                  {/* KT 2: X: 0-30, Y: 56.5-86.5 */}
                  <rect x="0" y="56.5" width="30" height="30" fill="#f59e0b" fillOpacity="0.25" stroke="#f59e0b" strokeWidth="1" />
                  <text x="15" y="70" fill="#fbbf24" fontSize="3.5" textAnchor="middle" fontWeight="bold">KT 2 (Eksisting)</text>
                  <text x="15" y="76" fill="#cbd5e1" fontSize="2.8" textAnchor="middle">3.0m × 3.0m</text>

                  {/* RK: X: 30-60, Y: 26.5-86.5 (Bottom aligns with KT 2 at Y: 86.5!) */}
                  <rect x="30" y="26.5" width="30" height="60" fill="#f59e0b" fillOpacity="0.25" stroke="#f59e0b" strokeWidth="1" />
                  <text x="45" y="54" fill="#fbbf24" fontSize="3.5" textAnchor="middle" fontWeight="bold">RK (Keluarga)</text>
                  <text x="45" y="60" fill="#cbd5e1" fontSize="2.6" textAnchor="middle">3.0m × 6.0m</text>
                  <text x="45" y="65" fill="#fde68a" fontSize="2.2" textAnchor="middle">Bawah Sejajar KT 2</text>

                  {/* Front before RK: X: 30-60, Y: 0-26.5 */}
                  <rect x="30" y="0" width="30" height="26.5" fill="#10b981" fillOpacity="0.2" stroke="#10b981" strokeWidth="0.8" strokeDasharray="1 1" />
                  <text x="45" y="13" fill="#34d399" fontSize="2.8" textAnchor="middle" fontWeight="bold">KOLOM BARU 2F</text>
                  <text x="45" y="18" fill="#94a3b8" fontSize="2.3" textAnchor="middle">(KT 6 Atas / Carport)</text>

                  {/* Right Zone: X: 60-90, Y: 0-110 (Entire 3m Strip) */}
                  <rect x="60" y="0" width="30" height="110" fill="#6366f1" fillOpacity="0.25" stroke="#818cf8" strokeWidth="1.2" />
                  <text x="75" y="18" fill="#c7d2fe" fontSize="3.2" textAnchor="middle" fontWeight="bold">EKSTENSI 2 LANTAI</text>
                  <text x="75" y="24" fill="#a5b4fc" fontSize="2.4" textAnchor="middle">Struktur Mandiri</text>
                  <text x="75" y="42" fill="#ffffff" fontSize="2.6" textAnchor="middle">Ruang Tamu &amp; Tangga</text>
                  <text x="75" y="70" fill="#ffffff" fontSize="2.6" textAnchor="middle">KT 3 (Lantai 1)</text>
                  <text x="75" y="96" fill="#ffffff" fontSize="2.6" textAnchor="middle">Dapur &amp; Area Cuci</text>

                  {/* Rear yard: X: 0-30, Y: 86.5-110 (Taman Belakang) */}
                  <rect x="0" y="86.5" width="30" height="23.5" fill="#047857" fillOpacity="0.2" stroke="#059669" strokeWidth="0.8" strokeDasharray="2 2" />
                  <text x="15" y="98" fill="#34d399" fontSize="2.8" textAnchor="middle">Taman Belakang</text>
                  <text x="15" y="103" fill="#6ee7b7" fontSize="2.0" textAnchor="middle">Kanan Atas Pas Sebelah KM</text>

                  {/* KM Keluarga & Ruang Makan: X: 30-60, Y: 86.5-110 (Directly adjacent to top-right of Taman Belakang!) */}
                  <rect x="30" y="86.5" width="18" height="23.5" fill="#0e7490" fillOpacity="0.3" stroke="#22d3ee" strokeWidth="0.8" />
                  <text x="39" y="99" fill="#22d3ee" fontSize="2.5" textAnchor="middle" fontWeight="bold">KM KLG</text>

                  <rect x="48" y="86.5" width="42" height="23.5" fill="#14b8a6" fillOpacity="0.2" stroke="#0d9488" strokeWidth="0.8" />
                  <text x="69" y="100" fill="#5eead4" fontSize="2.6" textAnchor="middle">R. Makan &amp; Dapur</text>

                  {/* Dimension Annotations */}
                  <line x1="0" y1="108" x2="90" y2="108" stroke="#f43f5e" strokeWidth="1" markerEnd="url(#arrow)" />
                  <text x="45" y="106" fill="#f43f5e" fontSize="3" textAnchor="middle" fontWeight="bold">LEBAR LAHAN: 9.00 M</text>
                </svg>
              </div>

              {/* Legend bar */}
              <div className="mt-4 pt-3 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-amber-500/40 border border-amber-400"></div>
                  <span className="text-slate-300">Bangunan Eksisting (1 Lantai)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-indigo-500/40 border border-indigo-400"></div>
                  <span className="text-slate-300">Ekstensi 2 Lantai Baru</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-emerald-500/40 border border-emerald-400"></div>
                  <span className="text-slate-300">Kolom Baru Mandiri</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-teal-500/40 border border-teal-400"></div>
                  <span className="text-slate-300">Taman / Void Terbuka</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Structural Constraints & Engineering Analysis Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-600 mb-4">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <h4 className="text-base font-bold text-red-950">Aturan Mutlak No-Load Lantai 2</h4>
          <p className="mt-2 text-xs sm:text-sm text-red-800 leading-relaxed">
            Pondasi lama pada KT 1 (3×3.5m), KT 2 (3×3m), dan RK (3×6m) <strong>TIDAK DIRANCANG</strong> untuk menahan beban lantai 2. 
            Dilarang keras meletakkan kamar tidur, kamar mandi, atau cor plat beton di atas atap lama. Zona ini dipertahankan beratap ringan tunggal.
          </p>
        </div>

        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 mb-4">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h4 className="text-base font-bold text-indigo-950">Pondasi Baru Cakar Ayam (8 Titik)</h4>
          <p className="mt-2 text-xs sm:text-sm text-indigo-800 leading-relaxed">
            Seluruh struktur lantai 2 ditopang sepenuhnya oleh pondasi telapak cakar ayam baru (footplate 80×80 cm mutu K-250) di lajur kanan selebar 3 meter 
            dan lajur depan carport. Penyaluran beban independen tanpa membebani dinding lama.
          </p>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 mb-4">
            <Users className="w-5 h-5" />
          </div>
          <h4 className="text-base font-bold text-emerald-950">Kebutuhan 7 Orang & 6 Kamar</h4>
          <p className="mt-2 text-xs sm:text-sm text-emerald-800 leading-relaxed">
            Menampung 2 orang tua + 5 anak (3 perempuan, 2 laki-laki). 
            Lantai 1 memiliki 3 kamar tidur (KT 1, KT 2, KT 3). Lantai 2 memiliki 3 kamar tidur anak (KT 4, KT 5, KT 6), 
            masing-masing memiliki bukaan cahaya dan ventilasi alami yang optimal.
          </p>
        </div>
      </div>
    </div>
  );
};
