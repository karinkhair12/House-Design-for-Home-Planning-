/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Compass, 
  Wind, 
  Sun, 
  ShieldAlert, 
  Droplets, 
  Layers, 
  CheckCircle2, 
  ArrowRight,
  TrendingUp,
  Maximize2,
  GitBranch,
  Building
} from 'lucide-react';

export const TechnicalDiagramsView: React.FC = () => {
  const [activeDiagram, setActiveDiagram] = useState<'ventilation-smoke' | 'structural-grid' | 'plumbing-mep' | 'circulation-paths' | 'staircase-ergonomics'>('ventilation-smoke');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title & Introduction */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 font-semibold text-xs tracking-wider uppercase mb-1">
              <Compass className="w-4 h-4" />
              <span>Section 10.F • Diagram Teknis &amp; Rekayasa Lingkungan Tropis</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Diagram Teknis, Rekayasa Asap &amp; Struktur SNI
            </h2>
            <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-3xl leading-relaxed">
              Diagram terukur untuk strategi isolasi asap rokok, ventilasi silang alami iklim tropis Indonesia, 
              denah titik pondasi cakar ayam, shaft plumbing, dan sirkulasi ergonomis tangga.
            </p>
          </div>

          {/* Diagram Selector Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setActiveDiagram('ventilation-smoke')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeDiagram === 'ventilation-smoke' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Asap &amp; Penghawaan
            </button>
            <button
              onClick={() => setActiveDiagram('structural-grid')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeDiagram === 'structural-grid' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Grid Struktur &amp; Kolom
            </button>
            <button
              onClick={() => setActiveDiagram('plumbing-mep')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeDiagram === 'plumbing-mep' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Plumbing &amp; Sanitair
            </button>
            <button
              onClick={() => setActiveDiagram('circulation-paths')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeDiagram === 'circulation-paths' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pemisahan Sirkulasi
            </button>
            <button
              onClick={() => setActiveDiagram('staircase-ergonomics')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeDiagram === 'staircase-ergonomics' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Ergonomi Tangga
            </button>
          </div>
        </div>

        {/* ==============================================================
            DIAGRAM 1: SMOKE DISPERSAL & TROPICAL VENTILATION
            ============================================================== */}
        {activeDiagram === 'ventilation-smoke' && (
          <div className="mt-8 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* SVG Graphic (7 cols) */}
              <div className="lg:col-span-7 bg-slate-950 rounded-2xl p-6 border border-slate-800 text-white relative">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-4">
                  <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <Wind className="w-4 h-4" />
                    SIMULASI AERODINAMIKA ASAP ROKOK &amp; ANGIN
                  </span>
                  <span className="font-mono text-slate-400">Jarak Aman &gt; 6.0m</span>
                </div>

                <div className="relative aspect-[9/10] max-w-md mx-auto bg-slate-900 rounded-xl p-4 border border-slate-700">
                  <svg viewBox="0 0 900 1000" className="w-full h-full">
                    {/* Background boundary */}
                    <rect x="0" y="0" width="900" height="1000" fill="#0f172a" rx="10" />

                    {/* Wind Vector Arrows (North breeze from street) */}
                    <g opacity="0.4">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <path 
                          key={i} 
                          d={`M ${150 + i * 120} 30 L ${150 + i * 120} 90`} 
                          stroke="#38bdf8" 
                          strokeWidth="3" 
                          strokeDasharray="6 4" 
                        />
                      ))}
                    </g>
                    <text x="450" y="25" fill="#38bdf8" fontSize="16" textAnchor="middle" fontWeight="bold">HEMBUSAN ANGIN JALAN UTARA (DEPAN)</text>

                    {/* Ground KT 1 Window Location (Left side, Y: 215 to 565) */}
                    <rect x="50" y="215" width="250" height="300" fill="#1e1b4b" stroke="#818cf8" strokeWidth="2" />
                    <text x="175" y="340" fill="#ffffff" fontSize="20" fontWeight="bold" textAnchor="middle">KT 1 (Lantai 1)</text>
                    <text x="175" y="370" fill="#cbd5e1" fontSize="15" textAnchor="middle">Kamar Utama / Orang Tua</text>

                    {/* KT1 Window marker */}
                    <rect x="50" y="215" width="250" height="20" fill="#38bdf8" fillOpacity="0.3" stroke="#38bdf8" strokeWidth="3" />
                    <text x="175" y="200" fill="#38bdf8" fontSize="14" textAnchor="middle" fontWeight="bold">Jendela KT 1 (Kiri)</text>

                    {/* Smoking Balcony Location (Right side, Y: 0 to 200) */}
                    <rect x="600" y="50" width="250" height="180" fill="#064e3b" stroke="#34d399" strokeWidth="3" />
                    <text x="725" y="120" fill="#ffffff" fontSize="20" fontWeight="bold" textAnchor="middle">BALKON MEROKOK</text>
                    <text x="725" y="145" fill="#a7f3d0" fontSize="15" textAnchor="middle">Lantai 2 Sisi Kanan Depan</text>
                    <text x="725" y="170" fill="#6ee7b7" fontSize="13" textAnchor="middle">Kisi-Kisi Louver + Tanaman</text>

                    {/* Smoke Plume Vectors Drifting Forward/Right Away From KT1 */}
                    <g>
                      <path d="M 725 80 Q 750 20 850 -20" fill="none" stroke="#94a3b8" strokeWidth="12" strokeLinecap="round" opacity="0.7" />
                      <path d="M 700 70 Q 680 10 750 -40" fill="none" stroke="#94a3b8" strokeWidth="8" strokeLinecap="round" opacity="0.6" />
                      <path d="M 760 90 Q 820 40 920 10" fill="none" stroke="#cbd5e1" strokeWidth="10" strokeLinecap="round" opacity="0.5" />
                      <text x="770" y="35" fill="#e2e8f0" fontSize="14" fontWeight="bold">ASAP TERBUANG KE UDARA JALAN</text>
                    </g>

                    {/* Safe Separation Distance Arc */}
                    <path d="M 600 150 Q 380 200 300 230" fill="none" stroke="#10b981" strokeWidth="3" strokeDasharray="10 6" />
                    <circle cx="300" cy="230" r="6" fill="#10b981" />
                    <circle cx="600" cy="150" r="6" fill="#10b981" />
                    <rect x="360" y="170" width="180" height="34" rx="6" fill="#065f46" stroke="#34d399" strokeWidth="1.5" />
                    <text x="450" y="192" fill="#ffffff" fontSize="14" fontWeight="bold" textAnchor="middle">JARAK AMAN: 6.2 METER</text>

                    {/* Cross Ventilation Thruway */}
                    <path d="M 450 950 L 450 500" fill="none" stroke="#34d399" strokeWidth="4" strokeDasharray="8 6" />
                    <rect x="350" y="700" width="200" height="30" rx="4" fill="#047857" />
                    <text x="450" y="720" fill="#ffffff" fontSize="13" textAnchor="middle" fontWeight="bold">VENTILASI SILANG VOID BELAKANG</text>
                  </svg>
                </div>
              </div>

              {/* Explanatory Technical Notes (5 cols) */}
              <div className="lg:col-span-5 space-y-4 text-xs">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
                  <h4 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Strategi Perlindungan Kamar Tidur 1 (KT 1)
                  </h4>
                  <ul className="mt-3 space-y-2.5 text-emerald-900 leading-relaxed">
                    <li>
                      <strong>Orientasi Asimetris Kanan-Kiri:</strong> Jendela KT 1 berada di sisi paling kiri (X: 0.0–3.0m), sedangkan balkon merokok berada di lantai 2 sisi paling kanan (X: 6.0–9.0m).
                    </li>
                    <li>
                      <strong>Elevasi &amp; Termal Udara Panas:</strong> Asap rokok hangat secara alami naik ke atas (+3.8m dpl) dan langsung terbawa aliran angin terbuka di depan jalan, tidak turun ke lantai dasar.
                    </li>
                    <li>
                      <strong>Buffer Kisi-Kisi &amp; Tanaman Biophilic:</strong> Balkon dipasangi kisi-kisi kayu/aluminium louver dan tanaman penyerap racun udara (Sansevieria / Sirih Gading) sebagai filter alami.
                    </li>
                  </ul>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Sun className="w-4 h-4 text-amber-500" />
                    Pencahayaan &amp; Efek Cerobong Tangga
                  </h4>
                  <p className="mt-2 text-slate-600 leading-relaxed">
                    Void tangga Option A berfungsi ganda sebagai cerobong termal (thermal stack chimney effect), 
                    menghisap udara hangat dari lantai 1 ke luar melalui kisi-kisi ventilasi atas di bordes lantai 2, 
                    menjaga rumah tetap sejuk tanpa AC menyala 24 jam.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==============================================================
            DIAGRAM 2: STRUCTURAL GRID & CAKAR AYAM FOOTINGS
            ============================================================== */}
        {activeDiagram === 'structural-grid' && (
          <div className="mt-8 space-y-6">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
              <h3 className="text-base font-bold text-slate-900 mb-2">
                Denah Kolom Struktur SNI &amp; 8 Titik Pondasi Cakar Ayam Baru
              </h3>
              <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
                Struktur mandiri menggunakan mutu beton K-250 (fc’ 21.7 MPa) dan besi tulangan ulir D13 SNI. 
                Penyaluran beban lantai 2 seluruhnya berdiri di atas 8 titik pondasi telapak cakar ayam 80×80 cm di zona ekstensi kanan dan kolom mandiri carport depan.
              </p>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                  <span className="font-bold text-indigo-600 text-sm block">Kolom Utama (K1)</span>
                  <span className="font-mono text-slate-900 text-base font-bold">20 cm × 20 cm</span>
                  <p className="text-slate-500 mt-1">4D13 ulir SNI, sengkang Ø8-100/150. Berada di 8 titik tumpuan lantai 2.</p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200">
                  <span className="font-bold text-indigo-600 text-sm block">Balok Induk (B1)</span>
                  <span className="font-mono text-slate-900 text-base font-bold">20 cm × 35 cm</span>
                  <p className="text-slate-500 mt-1">Bentang 3.0m &amp; 3.2m, menopang plat lantai tebal 12 cm tanpa lendutan.</p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200">
                  <span className="font-bold text-indigo-600 text-sm block">Pondasi Telapak (Cakar Ayam)</span>
                  <span className="font-mono text-slate-900 text-base font-bold">80 cm × 80 cm × 25 cm</span>
                  <p className="text-slate-500 mt-1">Kedalaman galian 1.5–1.8m hingga lapisan tanah keras, terikat sloof 20/30.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==============================================================
            DIAGRAM 3: PLUMBING & MEP
            ============================================================== */}
        {activeDiagram === 'plumbing-mep' && (
          <div className="mt-8 space-y-6">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
              <h3 className="text-base font-bold text-slate-900 mb-2">
                Sistem MEP, Plumbing Air Bersih, Kotor &amp; Bio-Septic Tank
              </h3>
              <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
                Toren air kapasitas 1.000 liter diletakkan di atas dak beton lantai 2 dengan pompa pendorong booster otomatis. 
                Air buangan dialirkan dengan kemiringan pipa minimal 2% untuk mencegah penyumbatan.
              </p>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                  <span className="font-bold text-blue-600 block">Air Bersih (Tekanan)</span>
                  <span className="text-slate-700 mt-1 block">Pipa PVC AW Ø 1/2" &amp; 3/4" dari Toren 1000L dengan radar otomatis.</span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-700 block">Air Bekas (Greywater)</span>
                  <span className="text-slate-700 mt-1 block">Pipa PVC AW Ø 3" dilengkapi floor drain anti bau &amp; perangkap lemak di dapur.</span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                  <span className="font-bold text-amber-700 block">Air Kotor (Blackwater)</span>
                  <span className="text-slate-700 mt-1 block">Pipa PVC AW Ø 4" langsung menuju Bio-Septic Tank 1.5 m³ ramah lingkungan.</span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                  <span className="font-bold text-indigo-700 block">Instalasi Listrik</span>
                  <span className="text-slate-700 mt-1 block">MCB Box terpisah Lantai 1 (2200 VA) dan Lantai 2 (1300 VA) untuk keamanan.</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==============================================================
            DIAGRAM 4: CIRCULATION PATHS
            ============================================================== */}
        {activeDiagram === 'circulation-paths' && (
          <div className="mt-8 space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <h3 className="text-base font-bold text-slate-900 mb-2">
                Zonasi Sirkulasi Tiga Lapis (Tamu, Keluarga, Servis)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4 text-xs">
                <div className="p-4 rounded-xl bg-cyan-50 border border-cyan-200">
                  <span className="font-bold text-cyan-900 text-sm block">1. Alur Tamu (Cyan)</span>
                  <p className="text-cyan-800 mt-1">
                    Pintu Utama ➔ Ruang Tamu ➔ WC Tamu ➔ Tangga ➔ Balkon Merokok Lantai 2 &amp; KM 2F.
                    <strong> Nol kontak pandangan</strong> ke ruang keluarga dan dapur.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="font-bold text-emerald-900 text-sm block">2. Alur Keluarga (Hijau)</span>
                  <p className="text-emerald-800 mt-1">
                    Ruang Keluarga ➔ Meja Makan ➔ Dapur ➔ Kamar Mandi Keluarga ➔ 3 Kamar Tidur Lantai Dasar.
                    Bebas gangguan lalu lintas tamu.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200">
                  <span className="font-bold text-indigo-900 text-sm block">3. Alur Privat Tidur (Ungu)</span>
                  <p className="text-indigo-800 mt-1">
                    Tangga ➔ Koridor Tengah 2F ➔ KT 4, KT 5, KT 6. Setiap kamar tidur memiliki pintu tersendiri dengan kunci independen.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==============================================================
            DIAGRAM 5: STAIRCASE ERGONOMICS
            ============================================================== */}
        {activeDiagram === 'staircase-ergonomics' && (
          <div className="mt-8 space-y-6">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
              <h3 className="text-base font-bold text-slate-900 mb-2">
                Dimensi Ergonomi Tangga Standar Arsitektur Indonesia
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 text-xs">
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block">Tinggi Tanjakan (Optrede)</span>
                  <strong className="text-slate-900 text-sm font-mono">18.0 cm</strong>
                  <span className="text-emerald-600 block text-[11px]">Sangat nyaman untuk anak &amp; lansia</span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block">Lebar Injakan (Antrede)</span>
                  <strong className="text-slate-900 text-sm font-mono">28.0 cm</strong>
                  <span className="text-emerald-600 block text-[11px]">Tapak kaki dewasa pas sempurna</span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block">Lebar Bersih Tangga</span>
                  <strong className="text-slate-900 text-sm font-mono">90.0 cm</strong>
                  <span className="text-slate-600 block text-[11px]">Mudah untuk angkut perabot kasur/lemari</span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block">Headroom Clearance</span>
                  <strong className="text-slate-900 text-sm font-mono">&gt; 220 cm</strong>
                  <span className="text-emerald-600 block text-[11px]">Bebas resiko kepala terbentur</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
