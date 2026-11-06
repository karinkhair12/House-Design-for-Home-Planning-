/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Layers, 
  Eye, 
  Maximize2, 
  Grid, 
  ShieldAlert, 
  Route, 
  Ruler, 
  Sliders, 
  Check, 
  Info,
  Wind,
  Sun,
  User,
  Sparkles,
  Download
} from 'lucide-react';
import { 
  GROUND_FLOOR_ALT_A,
  GROUND_FLOOR_ALT_B,
  RECOMMENDED_GROUND_FLOOR_ROOMS, 
  RECOMMENDED_SECOND_FLOOR_ROOMS, 
  RoomData,
  PROHIBITED_UPPER_ZONE,
  SITE_BOUNDARY
} from '../utils/architectureData';

export const CadFloorPlanViewer: React.FC = () => {
  const [selectedFloor, setSelectedFloor] = useState<'GF' | '2F'>('GF');
  const [gfVariant, setGfVariant] = useState<'B' | 'A'>('B');
  const [overlayMode, setOverlayMode] = useState<boolean>(false);
  const [showFurniture, setShowFurniture] = useState<boolean>(true);
  const [showDimensions, setShowDimensions] = useState<boolean>(true);
  const [showCirculation, setShowCirculation] = useState<boolean>(false);
  const [showStructuralZone, setShowStructuralZone] = useState<boolean>(true);
  const [selectedRoom, setSelectedRoom] = useState<RoomData | null>(null);

  const roomsToRender = selectedFloor === 'GF' 
    ? (gfVariant === 'B' ? GROUND_FLOOR_ALT_B : GROUND_FLOOR_ALT_A) 
    : RECOMMENDED_SECOND_FLOOR_ROOMS;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* View Header & Toolbar */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-semibold text-xs tracking-wider uppercase mb-1">
            <Layers className="w-4 h-4" />
            <span>Section 10.C &amp; 10.D • Gambar Kerja Arsitektur Top-Down &amp; Tabel Koordinat</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Denah Arsitektur Interaktif 9m × 11m
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Klik pada setiap ruangan untuk melihat ukuran bersih (internal clear), bukaan jendela, penghawaan alami, dan detail struktural.
          </p>
        </div>

        {/* Floor Switcher & Toggles */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Floor selector */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
            <button
              onClick={() => setSelectedFloor('GF')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedFloor === 'GF'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Lantai 1 (Ground Floor)
            </button>
            <button
              onClick={() => setSelectedFloor('2F')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedFloor === '2F'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Lantai 2 (Ekstensi Atas)
            </button>
          </div>

          {/* GF Variant Toggle */}
          {selectedFloor === 'GF' && (
            <div className="inline-flex rounded-xl bg-amber-50 p-1 border border-amber-200">
              <button
                onClick={() => { setGfVariant('B'); setSelectedRoom(null); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  gfVariant === 'B'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-amber-900 hover:text-amber-950'
                }`}
                title="Dapur Luas Idaman Ibu di Ujung Kanan & KM Minimalis 1.25x1.5m"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Alternatif B (Idaman Ibu)</span>
              </button>
              <button
                onClick={() => { setGfVariant('A'); setSelectedRoom(null); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  gfVariant === 'A'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-amber-900 hover:text-amber-950'
                }`}
                title="Sentralisasi Plumbing & Tangga"
              >
                <span>Alternatif A (Sentralisasi)</span>
              </button>
            </div>
          )}

          {selectedFloor === '2F' && (
            <button
              onClick={() => setOverlayMode(!overlayMode)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                overlayMode 
                  ? 'bg-amber-500 text-white border-amber-600 shadow-xs' 
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
              title="Tampilkan jejak garis putus-putus bangunan lama di bawah lantai 2"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Garis Jejak Lantai 1</span>
            </button>
          )}
        </div>
      </div>

      {/* Layer Toggles Filter Bar */}
      <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <span className="font-semibold text-slate-700 flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-indigo-600" />
          <span>Layer Tampilan:</span>
        </span>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowFurniture(!showFurniture)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-medium transition-colors cursor-pointer ${
              showFurniture 
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                : 'bg-white text-slate-500 border-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Tata Perabot</span>
          </button>

          <button
            onClick={() => setShowDimensions(!showDimensions)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-medium transition-colors cursor-pointer ${
              showDimensions 
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                : 'bg-white text-slate-500 border-slate-200'
            }`}
          >
            <Ruler className="w-3.5 h-3.5" />
            <span>Dimensi &amp; Notasi</span>
          </button>

          <button
            onClick={() => setShowCirculation(!showCirculation)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-medium transition-colors cursor-pointer ${
              showCirculation 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
                : 'bg-white text-slate-500 border-slate-200'
            }`}
          >
            <Route className="w-3.5 h-3.5" />
            <span>Garis Sirkulasi (Tamu vs Keluarga)</span>
          </button>

          <button
            onClick={() => setShowStructuralZone(!showStructuralZone)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-medium transition-colors cursor-pointer ${
              showStructuralZone 
                ? 'bg-red-50 text-red-700 border-red-200' 
                : 'bg-white text-slate-500 border-slate-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Zona Terlarang Beban</span>
          </button>
        </div>
      </div>

      {/* Main Grid: CAD Canvas + Room Inspector Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* CAD Canvas (8 cols on lg) */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-sm relative overflow-hidden">
          {/* Orientation compass header */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded">
                SKALA 1:100 (1m = 100px)
              </span>
              <span className="text-slate-500">
                {selectedFloor === 'GF' ? 'Lantai Dasar (+0.00)' : 'Lantai Dua (+3.60)'}
              </span>
            </div>

            <div className="flex items-center gap-2 text-slate-500">
              <span className="font-semibold text-indigo-600">▲ UTARA / JALAN DEPAN</span>
              <span className="font-mono text-slate-400">9.0m × 11.0m</span>
            </div>
          </div>

          {/* SVG CAD Drafting Surface */}
          <div className="w-full aspect-[9/11] max-w-[620px] mx-auto bg-slate-950 rounded-xl p-3 sm:p-5 relative shadow-xl overflow-hidden border border-slate-800">
            <svg 
              viewBox="0 0 900 1100" 
              className="w-full h-full select-none"
              style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))' }}
            >
              <defs>
                {/* 1m Grid Pattern */}
                <pattern id="cadGrid1m" width="100" height="100" patternUnits="userSpaceOnUse">
                  <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#1e293b" strokeWidth="1" />
                  <path d="M 50 0 L 50 100 M 0 50 L 100 50" fill="none" stroke="#0f172a" strokeWidth="0.5" strokeDasharray="2 2" />
                </pattern>

                {/* Prohibited Zone Red Hatching */}
                <pattern id="hatchProhibited" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                  <line x1="0" y1="0" x2="0" y2="20" stroke="#ef4444" strokeWidth="2.5" opacity="0.35" />
                </pattern>

                {/* Arrow markers for dimensions */}
                <marker id="cadArrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                  <path d="M 0 0 L 6 3 L 0 6 z" fill="#f43f5e" />
                </marker>
                <marker id="guestArrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                  <path d="M 0 0 L 6 3 L 0 6 z" fill="#38bdf8" />
                </marker>
                <marker id="familyArrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                  <path d="M 0 0 L 6 3 L 0 6 z" fill="#10b981" />
                </marker>
              </defs>

              {/* Background 1m Cad Grid */}
              <rect width="900" height="1100" fill="url(#cadGrid1m)" />

              {/* Property Boundary Line */}
              <rect 
                x="0" 
                y="0" 
                width="900" 
                height="1100" 
                fill="none" 
                stroke="#64748b" 
                strokeWidth="4" 
                strokeDasharray="16 6"
              />

              {/* ===============================================================
                  GROUND FLOOR RENDERING
                  =============================================================== */}
              {selectedFloor === 'GF' && (
                <g id="groundFloorRooms">
                  {/* Front Carport & Terrace */}
                  <g 
                    onClick={() => setSelectedRoom(RECOMMENDED_GROUND_FLOOR_ROOMS.find(r => r.id === 'carport' || r.id === 'carport_terrace') || null)}
                    className="cursor-pointer group"
                  >
                    <rect 
                      x="5" y="5" width="590" height="205" 
                      fill="#1e293b" fillOpacity="0.4" 
                      stroke="#475569" strokeWidth="2" strokeDasharray="8 4"
                    />
                    <text x="300" y="70" fill="#94a3b8" fontSize="22" fontWeight="bold" textAnchor="middle">CARPORT 1 MOBIL &amp; 2 MOTOR</text>
                    <text x="300" y="105" fill="#64748b" fontSize="16" textAnchor="middle">Rabat Beton / Paving Grass Block</text>
                    
                    {/* Car Silhouette proxy */}
                    {showFurniture && (
                      <g transform="translate(180, 40) scale(0.6)">
                        <rect x="0" y="0" width="200" height="340" rx="20" fill="none" stroke="#64748b" strokeWidth="3" opacity="0.4" />
                        <line x1="20" y1="70" x2="180" y2="70" stroke="#64748b" strokeWidth="2" opacity="0.4" />
                        <line x1="20" y1="260" x2="180" y2="260" stroke="#64748b" strokeWidth="2" opacity="0.4" />
                      </g>
                    )}
                  </g>

                  {/* KT 1: Existing (X: 0 to 300, Y: 215 to 565) */}
                  <g 
                    onClick={() => setSelectedRoom(RECOMMENDED_GROUND_FLOOR_ROOMS.find(r => r.id === 'kt1') || null)}
                    className="cursor-pointer group"
                  >
                    <rect 
                      x="10" y="225" width="280" height="330" 
                      fill={selectedRoom?.id === 'kt1' ? '#312e81' : '#1e1b4b'} 
                      stroke="#818cf8" strokeWidth="3"
                    />
                    {/* Status badge */}
                    <rect x="25" y="240" width="120" height="24" rx="4" fill="#f59e0b" fillOpacity="0.3" stroke="#f59e0b" strokeWidth="1" />
                    <text x="85" y="256" fill="#fde68a" fontSize="12" fontWeight="bold" textAnchor="middle">EKSISTING</text>
                    <text x="150" y="310" fill="#ffffff" fontSize="22" fontWeight="bold" textAnchor="middle">KT 1 (Utama)</text>
                    <text x="150" y="340" fill="#c7d2fe" fontSize="16" textAnchor="middle">3.00 × 3.50 m</text>
                    
                    {/* Furniture: King Bed & Wardrobe */}
                    {showFurniture && (
                      <g>
                        {/* Bed */}
                        <rect x="30" y="380" width="160" height="150" rx="6" fill="#334155" stroke="#94a3b8" strokeWidth="2" />
                        <rect x="50" y="390" width="50" height="30" rx="3" fill="#64748b" />
                        <rect x="120" y="390" width="50" height="30" rx="3" fill="#64748b" />
                        {/* Wardrobe */}
                        <rect x="210" y="380" width="60" height="150" fill="#334155" stroke="#64748b" strokeWidth="1.5" />
                        <text x="240" y="460" fill="#94a3b8" fontSize="11" textAnchor="middle">Lemari</text>
                      </g>
                    )}
                  </g>

                  {/* KT 2: Existing (X: 0 to 300, Y: 565 to 865) */}
                  <g 
                    onClick={() => setSelectedRoom(RECOMMENDED_GROUND_FLOOR_ROOMS.find(r => r.id === 'kt2') || null)}
                    className="cursor-pointer group"
                  >
                    <rect 
                      x="10" y="575" width="280" height="280" 
                      fill={selectedRoom?.id === 'kt2' ? '#312e81' : '#1e1b4b'} 
                      stroke="#818cf8" strokeWidth="3"
                    />
                    <rect x="25" y="590" width="120" height="24" rx="4" fill="#f59e0b" fillOpacity="0.3" stroke="#f59e0b" strokeWidth="1" />
                    <text x="85" y="606" fill="#fde68a" fontSize="12" fontWeight="bold" textAnchor="middle">EKSISTING</text>
                    <text x="150" y="650" fill="#ffffff" fontSize="22" fontWeight="bold" textAnchor="middle">KT 2</text>
                    <text x="150" y="680" fill="#c7d2fe" fontSize="16" textAnchor="middle">3.00 × 3.00 m</text>

                    {showFurniture && (
                      <g>
                        <rect x="30" y="720" width="140" height="120" rx="4" fill="#334155" stroke="#94a3b8" strokeWidth="2" />
                        <rect x="190" y="720" width="80" height="60" fill="#334155" stroke="#64748b" strokeWidth="1.5" />
                        <text x="230" y="755" fill="#94a3b8" fontSize="11" textAnchor="middle">Meja Belajar</text>
                      </g>
                    )}
                  </g>

                  {/* RK: Ruang Keluarga (X: 300 to 600, Y: 265 to 865 - Bottom aligned with KT2) */}
                  <g 
                    onClick={() => setSelectedRoom(RECOMMENDED_GROUND_FLOOR_ROOMS.find(r => r.id === 'rk') || null)}
                    className="cursor-pointer group"
                  >
                    <rect 
                      x="310" y="275" width="280" height="580" 
                      fill={selectedRoom?.id === 'rk' ? '#1e3a5f' : '#0f2744'} 
                      stroke="#60a5fa" strokeWidth="3"
                    />
                    <rect x="325" y="290" width="120" height="24" rx="4" fill="#f59e0b" fillOpacity="0.3" stroke="#f59e0b" strokeWidth="1" />
                    <text x="385" y="306" fill="#fde68a" fontSize="12" fontWeight="bold" textAnchor="middle">EKSISTING</text>
                    <text x="450" y="380" fill="#ffffff" fontSize="24" fontWeight="bold" textAnchor="middle">RUANG KELUARGA (RK)</text>
                    <text x="450" y="410" fill="#93c5fd" fontSize="16" textAnchor="middle">3.00 × 6.00 m • Sejajar KT 2</text>
                    <text x="450" y="435" fill="#cbd5e1" fontSize="12" textAnchor="middle">Bawah RK pas di samping kanan bawah KT 2</text>

                    {/* Furniture: Big L-Sofa & TV Console */}
                    {showFurniture && (
                      <g>
                        {/* L-Sofa */}
                        <path d="M 340 500 L 460 500 L 460 580 L 410 580 L 410 640 L 340 640 Z" fill="#334155" stroke="#94a3b8" strokeWidth="2" />
                        <rect x="370" y="520" width="60" height="40" rx="3" fill="#475569" />
                        {/* TV Console */}
                        <rect x="540" y="480" width="30" height="180" fill="#1e293b" stroke="#64748b" strokeWidth="2" />
                        <text x="555" y="570" fill="#94a3b8" fontSize="10" transform="rotate(90 555 570)" textAnchor="middle">TV KELUARGA</text>
                      </g>
                    )}

                    {/* Opened Portal Openings on Right & Rear Walls */}
                    <line x1="590" y1="360" x2="590" y2="480" stroke="#a855f7" strokeWidth="8" strokeDasharray="10 5" />
                    <text x="575" y="425" fill="#d8b4fe" fontSize="11" textAnchor="end" fontWeight="bold">Bukaan Balok Lintel 1.8m ➔</text>
                  </g>

                  {/* Ruang Tamu (Guest Room): X: 600 to 900, Y: 50 to 320 */}
                  <g 
                    onClick={() => setSelectedRoom(RECOMMENDED_GROUND_FLOOR_ROOMS.find(r => r.id === 'guest_room') || null)}
                    className="cursor-pointer group"
                  >
                    <rect 
                      x="610" y="60" width="280" height="255" 
                      fill={selectedRoom?.id === 'guest_room' ? '#064e3b' : '#06392b'} 
                      stroke="#10b981" strokeWidth="3"
                    />
                    <rect x="625" y="75" width="100" height="24" rx="4" fill="#10b981" fillOpacity="0.3" stroke="#34d399" strokeWidth="1" />
                    <text x="675" y="91" fill="#a7f3d0" fontSize="12" fontWeight="bold" textAnchor="middle">BARU (EKSTENSI)</text>
                    <text x="750" y="140" fill="#ffffff" fontSize="22" fontWeight="bold" textAnchor="middle">RUANG TAMU</text>
                    <text x="750" y="165" fill="#6ee7b7" fontSize="15" textAnchor="middle">3.00 × 2.70 m</text>

                    {showFurniture && (
                      <g>
                        {/* Guest Sofa & Coffee Table */}
                        <rect x="640" y="200" width="140" height="45" rx="4" fill="#334155" stroke="#94a3b8" strokeWidth="1.5" />
                        <rect x="640" y="255" width="140" height="35" rx="4" fill="#1e293b" stroke="#64748b" strokeWidth="1" />
                        <rect x="800" y="200" width="45" height="45" rx="4" fill="#334155" stroke="#94a3b8" strokeWidth="1.5" />
                      </g>
                    )}
                  </g>

                  {/* MIDDLE ZONE (Y: 325 to 560) */}
                  {gfVariant === 'A' ? (
                    <>
                      {/* Alt A: WC Tamu Under Stairs: X: 610 to 745, Y: 325 to 560 */}
                      <g 
                        onClick={() => setSelectedRoom(GROUND_FLOOR_ALT_A.find(r => r.id === 'guest_bath') || null)}
                        className="cursor-pointer group"
                      >
                        <rect 
                          x="610" y="325" width="135" height="235" 
                          fill={selectedRoom?.id === 'guest_bath' ? '#0e7490' : '#155e75'} 
                          stroke="#22d3ee" strokeWidth="2.5"
                        />
                        <text x="677" y="405" fill="#ffffff" fontSize="15" fontWeight="bold" textAnchor="middle">WC TAMU (Bwh Tgg)</text>
                        <text x="677" y="425" fill="#a5f3fc" fontSize="12" textAnchor="middle">1.5 × 2.45 m</text>
                        <text x="677" y="445" fill="#67e8f9" fontSize="10" textAnchor="middle">Pintu dr R. Tamu</text>
                        {showFurniture && (
                          <g>
                            <circle cx="650" cy="495" r="13" fill="#e2e8f0" stroke="#0891b2" strokeWidth="1.5" />
                            <rect x="685" y="485" width="40" height="40" fill="none" stroke="#67e8f9" strokeDasharray="3 3" />
                          </g>
                        )}
                      </g>

                      {/* Alt A: Family Bath Beside: X: 755 to 890, Y: 325 to 560 */}
                      <g 
                        onClick={() => setSelectedRoom(GROUND_FLOOR_ALT_A.find(r => r.id === 'family_bath') || null)}
                        className="cursor-pointer group"
                      >
                        <rect 
                          x="755" y="325" width="135" height="235" 
                          fill={selectedRoom?.id === 'family_bath' ? '#0e7490' : '#155e75'} 
                          stroke="#22d3ee" strokeWidth="2.5"
                        />
                        <text x="822" y="395" fill="#ffffff" fontSize="14" fontWeight="bold" textAnchor="middle">KM KELUARGA</text>
                        <text x="822" y="415" fill="#a5f3fc" fontSize="12" textAnchor="middle">1.5 × 2.45 m</text>
                        <text x="822" y="435" fill="#fca5a5" fontSize="10" textAnchor="middle">Akses dr R. Keluarga</text>
                        <text x="822" y="452" fill="#f87171" fontSize="9.5" textAnchor="middle">(Rawan Privasi Bau/Suara)</text>
                        {showFurniture && (
                          <g>
                            <circle cx="795" cy="495" r="13" fill="#e2e8f0" stroke="#0891b2" strokeWidth="1.5" />
                            <rect x="830" y="485" width="40" height="40" fill="none" stroke="#67e8f9" strokeDasharray="3 3" />
                          </g>
                        )}
                      </g>
                    </>
                  ) : (
                    <>
                      {/* Alt B: WC Tamu (Guest Bath): X: 610 to 745, Y: 325 to 560 */}
                      <g 
                        onClick={() => setSelectedRoom(GROUND_FLOOR_ALT_B.find(r => r.id === 'guest_bath') || null)}
                        className="cursor-pointer group"
                      >
                        <rect 
                          x="610" y="325" width="135" height="235" 
                          fill={selectedRoom?.id === 'guest_bath' ? '#0e7490' : '#155e75'} 
                          stroke="#22d3ee" strokeWidth="2.5"
                        />
                        <text x="677" y="410" fill="#ffffff" fontSize="16" fontWeight="bold" textAnchor="middle">WC TAMU</text>
                        <text x="677" y="435" fill="#a5f3fc" fontSize="13" textAnchor="middle">1.5 × 2.45 m</text>
                        {showFurniture && (
                          <g>
                            <circle cx="650" cy="490" r="14" fill="#e2e8f0" stroke="#0891b2" strokeWidth="1.5" />
                            <rect x="685" y="480" width="45" height="45" fill="none" stroke="#67e8f9" strokeDasharray="3 3" />
                          </g>
                        )}
                      </g>

                      {/* Alt B: Staircase Hall: X: 755 to 890, Y: 325 to 560 */}
                      <g 
                        onClick={() => setSelectedRoom(GROUND_FLOOR_ALT_B.find(r => r.id === 'stair_hall_gf') || null)}
                        className="cursor-pointer group"
                      >
                        <rect 
                          x="755" y="325" width="135" height="235" 
                          fill="#3730a3" fillOpacity="0.4" 
                          stroke="#818cf8" strokeWidth="2.5"
                        />
                        <text x="822" y="370" fill="#c7d2fe" fontSize="15" fontWeight="bold" textAnchor="middle">TANGGA KE 2F</text>
                        <text x="822" y="390" fill="#a5b4fc" fontSize="11" textAnchor="middle">(Option A Mandiri)</text>

                        {/* Stair Treads Graphic */}
                        {Array.from({ length: 8 }).map((_, i) => (
                          <line 
                            key={i} 
                            x1="765" 
                            y1={415 + i * 16} 
                            x2="880" 
                            y2={415 + i * 16} 
                            stroke="#c7d2fe" 
                            strokeWidth="1.5" 
                          />
                        ))}
                        <line x1="822" y1="420" x2="822" y2="535" stroke="#f43f5e" strokeWidth="2" markerEnd="url(#cadArrow)" />
                        <text x="822" y="550" fill="#fca5a5" fontSize="11" textAnchor="middle">NAIK (UP)</text>
                      </g>
                    </>
                  )}

                  {/* KT 3: Ground Floor Extension (X: 600 to 900, Y: 565 to 865 - Aligned with KT2 and RK) */}
                  <g 
                    onClick={() => setSelectedRoom(roomsToRender.find(r => r.id === 'kt3') || null)}
                    className="cursor-pointer group"
                  >
                    <rect 
                      x="610" y="575" width="280" height="280" 
                      fill={selectedRoom?.id === 'kt3' ? '#312e81' : '#1e1b4b'} 
                      stroke="#818cf8" strokeWidth="3"
                    />
                    <rect x="625" y="590" width="100" height="24" rx="4" fill="#10b981" fillOpacity="0.3" stroke="#34d399" strokeWidth="1" />
                    <text x="675" y="606" fill="#a7f3d0" fontSize="12" fontWeight="bold" textAnchor="middle">BARU (EKSTENSI)</text>
                    <text x="750" y="650" fill="#ffffff" fontSize="22" fontWeight="bold" textAnchor="middle">KT 3 (Lantai 1)</text>
                    <text x="750" y="680" fill="#c7d2fe" fontSize="16" textAnchor="middle">3.00 × 3.00 m</text>
                    <text x="750" y="705" fill="#a5b4fc" fontSize="12" textAnchor="middle">Sejajar Garis Bawah KT 2 &amp; RK</text>

                    {showFurniture && (
                      <g>
                        <rect x="630" y="730" width="140" height="110" rx="4" fill="#334155" stroke="#94a3b8" strokeWidth="2" />
                        <rect x="790" y="730" width="70" height="60" fill="#334155" stroke="#64748b" strokeWidth="1.5" />
                        <text x="825" y="765" fill="#94a3b8" fontSize="11" textAnchor="middle">Wardrobe</text>
                      </g>
                    )}
                  </g>

                  {/* Rear Courtyard / Lightwell: X: 0 to 300, Y: 865 to 1100 (Taman Belakang) */}
                  <g 
                    onClick={() => setSelectedRoom(roomsToRender.find(r => r.id === 'rear_service_yard') || null)}
                    className="cursor-pointer group"
                  >
                    <rect 
                      x="10" y="875" width="280" height="215" 
                      fill="#064e3b" fillOpacity="0.4" 
                      stroke="#059669" strokeWidth="2" strokeDasharray="6 4"
                    />
                    <text x="150" y="955" fill="#34d399" fontSize="18" fontWeight="bold" textAnchor="middle">TAMAN / VOID BELAKANG</text>
                    <text x="150" y="980" fill="#6ee7b7" fontSize="13" textAnchor="middle">Pojok Kanan Atas (X:3.0, Y:8.65)</text>
                    <text x="150" y="1005" fill="#a7f3d0" fontSize="11" textAnchor="middle">Bukaan Cahaya &amp; Udara Tropis</text>
                  </g>

                  {/* REAR ZONE (Y: 865 to 1100) */}
                  {gfVariant === 'B' ? (
                    <>
                      {/* Alt B: Ruang Makan Kaca Terbuka ke Taman Belakang: X: 300 to 595, Y: 875 to 1090 */}
                      <g 
                        onClick={() => setSelectedRoom(GROUND_FLOOR_ALT_B.find(r => r.id === 'dining_area') || null)}
                        className="cursor-pointer group"
                      >
                        <rect 
                          x="305" y="875" width="290" height="215" 
                          fill={selectedRoom?.id === 'dining_area' ? '#1e293b' : '#0f172a'} 
                          stroke="#38bdf8" strokeWidth="2.5"
                        />
                        {/* Sliding Glass Wall Icon to Rear Yard */}
                        <line x1="305" y1="875" x2="305" y2="1090" stroke="#38bdf8" strokeWidth="4" strokeDasharray="10 4" />
                        <text x="315" y="900" fill="#38bdf8" fontSize="10" fontWeight="bold" transform="rotate(90 315,900)">PINTU KACA GESER KE TAMAN</text>

                        <text x="450" y="935" fill="#ffffff" fontSize="17" fontWeight="bold" textAnchor="middle">RUANG MAKAN KACA</text>
                        <text x="450" y="958" fill="#7dd3fc" fontSize="12" textAnchor="middle">3.00 × 2.35 m (Belakang RK)</text>
                        <text x="450" y="978" fill="#38bdf8" fontSize="11" textAnchor="middle">Cahaya &amp; Angin Taman Masuk Bebas!</text>

                        {showFurniture && (
                          <g>
                            <rect x="400" y="1000" width="100" height="55" rx="4" fill="#334155" stroke="#94a3b8" strokeWidth="1.5" />
                            <circle cx="420" cy="985" r="6" fill="#94a3b8" />
                            <circle cx="450" cy="985" r="6" fill="#94a3b8" />
                            <circle cx="480" cy="985" r="6" fill="#94a3b8" />
                            <circle cx="420" cy="1070" r="6" fill="#94a3b8" />
                            <circle cx="450" cy="1070" r="6" fill="#94a3b8" />
                            <circle cx="480" cy="1070" r="6" fill="#94a3b8" />
                          </g>
                        )}
                      </g>

                      {/* Alt B: KM Keluarga: 1.5m Kanan-Kiri x 1.25m Atas-Bawah (X: 750 to 900, Y: 865 to 990) */}
                      <g 
                        onClick={() => setSelectedRoom(GROUND_FLOOR_ALT_B.find(r => r.id === 'family_bath') || null)}
                        className="cursor-pointer group"
                      >
                        <rect 
                          x="755" y="875" width="135" height="115" 
                          fill={selectedRoom?.id === 'family_bath' ? '#0e7490' : '#155e75'} 
                          stroke="#22d3ee" strokeWidth="2.5"
                        />
                        <text x="822" y="915" fill="#ffffff" fontSize="13" fontWeight="bold" textAnchor="middle">KM KELUARGA</text>
                        <text x="822" y="933" fill="#a5f3fc" fontSize="11" textAnchor="middle">1.50 × 1.25 m</text>
                        <text x="822" y="950" fill="#67e8f9" fontSize="9" textAnchor="middle">Kanan-Kiri 1.5m • Atas-Bawah 1.25m</text>

                        {/* Door entering from LEFT */}
                        <path d="M 755 930 A 25 25 0 0 1 780 955" fill="none" stroke="#22d3ee" strokeWidth="2" strokeDasharray="2 2" />
                        <line x1="755" y1="905" x2="755" y2="930" stroke="#22d3ee" strokeWidth="3" />
                        <text x="750" y="920" fill="#a5f3fc" fontSize="8.5" textAnchor="end" fontWeight="bold">Masuk ➔</text>

                        {/* Bouvenlight window on right exterior wall */}
                        <line x1="890" y1="895" x2="890" y2="965" stroke="#38bdf8" strokeWidth="4" />
                        <text x="885" y="935" fill="#38bdf8" fontSize="8.5" textAnchor="end">Bouvenlight</text>

                        {showFurniture && (
                          <g>
                            {/* Shower and closet */}
                            <circle cx="860" cy="910" r="9" fill="#e2e8f0" stroke="#0891b2" strokeWidth="1" />
                            <rect x="795" y="890" width="30" height="30" fill="none" stroke="#67e8f9" strokeDasharray="2 2" />
                          </g>
                        )}
                      </g>

                      {/* Alt B: Dapur / Area Persiapan di Sisi Kiri KM: X: 605 to 750, Y: 875 to 990 (1.50m x 1.25m) */}
                      <g 
                        onClick={() => setSelectedRoom(GROUND_FLOOR_ALT_B.find(r => r.id === 'kitchen') || null)}
                        className="cursor-pointer group"
                      >
                        <rect 
                          x="605" y="875" width="145" height="115" 
                          fill={selectedRoom?.id === 'kitchen' ? '#78350f' : '#451a03'} 
                          stroke="#f59e0b" strokeWidth="2"
                        />
                        <text x="677" y="915" fill="#ffffff" fontSize="12" fontWeight="bold" textAnchor="middle">DAPUR MASAK</text>
                        <text x="677" y="933" fill="#fde68a" fontSize="10" textAnchor="middle">1.50 × 1.25 m</text>
                        <text x="677" y="950" fill="#fef08a" fontSize="8.5" textAnchor="middle">Kompor + Lemari Gantung</text>

                        {showFurniture && (
                          <g>
                            <rect x="615" y="885" width="45" height="22" rx="2" fill="#334155" stroke="#f59e0b" strokeWidth="1" />
                            <circle cx="628" cy="896" r="4" fill="#ef4444" />
                            <circle cx="648" cy="896" r="4" fill="#ef4444" />
                          </g>
                        )}
                      </g>

                      {/* Alt B: SERVICE ZONE DI BAGIAN BAWAH KM (Y: 9.90m to 11.00m) */}
                      <g 
                        onClick={() => setSelectedRoom(GROUND_FLOOR_ALT_B.find(r => r.id === 'laundry_exit') || null)}
                        className="cursor-pointer group"
                      >
                        {/* Overall service zone container */}
                        <rect 
                          x="605" y="995" width="285" height="95" 
                          fill={selectedRoom?.id === 'laundry_exit' ? '#1e293b' : '#0f172a'} 
                          stroke="#a855f7" strokeWidth="2"
                        />

                        {/* 1. MESIN CUCI: di bagian kiri bawah KM (X: 680 to 740, Y: 1005 to 1065) - Front faces LEFT */}
                        <rect x="680" y="1005" width="60" height="60" rx="3" fill="#334155" stroke="#cbd5e1" strokeWidth="1.5" />
                        <circle cx="710" cy="1035" r="16" fill="#475569" stroke="#94a3b8" strokeWidth="1" />
                        <path d="M 680 1020 L 670 1035 L 680 1050" fill="none" stroke="#38bdf8" strokeWidth="2" />
                        <text x="710" y="1080" fill="#cbd5e1" fontSize="9" fontWeight="bold" textAnchor="middle">MESIN CUCI</text>
                        <text x="660" y="1038" fill="#38bdf8" fontSize="8" fontWeight="bold" textAnchor="end">Depan ➔</text>

                        {/* Working clearance box in front of washing machine (facing right into machine) */}
                        <rect x="610" y="1005" width="65" height="60" fill="#38bdf8" fillOpacity="0.1" stroke="#38bdf8" strokeWidth="1" strokeDasharray="3 3" />
                        <text x="642" y="1038" fill="#7dd3fc" fontSize="8" textAnchor="middle">Posisi Cuci</text>

                        {/* 2. PINTU KELUAR RUMAH: pas di sebelah kanan bawah KM (X: 755 to 830, Y: 1085) - Buka Mengarah Keluar */}
                        <rect x="755" y="1080" width="75" height="10" fill="#475569" stroke="#a855f7" strokeWidth="1.5" />
                        {/* Outward door swing arc */}
                        <path d="M 755 1090 A 70 70 0 0 1 825 1130" fill="none" stroke="#ec4899" strokeWidth="2" strokeDasharray="3 3" />
                        <line x1="755" y1="1090" x2="755" y2="1135" stroke="#ec4899" strokeWidth="2" />
                        <text x="792" y="1065" fill="#f472b6" fontSize="9.5" fontWeight="bold" textAnchor="middle">PINTU BELAKANG</text>
                        <text x="792" y="1078" fill="#fbcfe8" fontSize="8" textAnchor="middle">Buka Mengarah Keluar ➔</text>

                        {/* 3. SINK CUCI-CUCI: Mepet Kanan Bawah Rumah (X: 835 to 890, Y: 1005 to 1085) */}
                        <rect x="835" y="1005" width="55" height="80" rx="3" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
                        <rect x="840" y="1015" width="45" height="60" rx="2" fill="#0284c7" fillOpacity="0.3" stroke="#0284c7" strokeWidth="1" />
                        <circle cx="862" cy="1045" r="5" fill="#38bdf8" />
                        <text x="862" y="1000" fill="#38bdf8" fontSize="9" fontWeight="bold" textAnchor="middle">SINK</text>
                        <text x="862" y="1098" fill="#7dd3fc" fontSize="7.5" textAnchor="middle">Mepet Kanan</text>

                        {/* CLEAR MOBILIZATION VECTOR TO EXIT DOOR */}
                        <path 
                          d="M 640 985 L 640 1000 L 760 1050 L 790 1090" 
                          fill="none" 
                          stroke="#10b981" 
                          strokeWidth="2.5" 
                          strokeDasharray="4 3" 
                          markerEnd="url(#cadArrow)" 
                        />
                        <text x="615" y="990" fill="#34d399" fontSize="8" fontWeight="bold">Jalur Bebas Lewat (Aman)</text>
                      </g>
                    </>
                  ) : (
                    <>
                      {/* Alt A: Ruang Makan (X: 305 to 595, Y: 875 to 1090) */}
                      <g 
                        onClick={() => setSelectedRoom(GROUND_FLOOR_ALT_A.find(r => r.id === 'dining_area') || null)}
                        className="cursor-pointer group"
                      >
                        <rect 
                          x="305" y="875" width="290" height="215" 
                          fill="#1e293b" fillOpacity="0.7" 
                          stroke="#94a3b8" strokeWidth="2"
                        />
                        <text x="450" y="955" fill="#ffffff" fontSize="18" fontWeight="bold" textAnchor="middle">RUANG MAKAN</text>
                        <text x="450" y="980" fill="#cbd5e1" fontSize="13" textAnchor="middle">3.00 × 2.35 m (Meja 6 Kursi)</text>
                        {showFurniture && (
                          <g>
                            <rect x="400" y="1010" width="100" height="55" rx="4" fill="#334155" stroke="#94a3b8" strokeWidth="1.5" />
                            <circle cx="420" cy="995" r="6" fill="#64748b" />
                            <circle cx="450" cy="995" r="6" fill="#64748b" />
                            <circle cx="480" cy="995" r="6" fill="#64748b" />
                            <circle cx="420" cy="1080" r="6" fill="#64748b" />
                            <circle cx="450" cy="1080" r="6" fill="#64748b" />
                            <circle cx="480" cy="1080" r="6" fill="#64748b" />
                          </g>
                        )}
                      </g>

                      {/* Alt A: Kitchen (X: 605 to 890, Y: 875 to 1090) */}
                      <g 
                        onClick={() => setSelectedRoom(GROUND_FLOOR_ALT_A.find(r => r.id === 'kitchen') || null)}
                        className="cursor-pointer group"
                      >
                        <rect 
                          x="605" y="875" width="285" height="215" 
                          fill={selectedRoom?.id === 'kitchen' ? '#78350f' : '#451a03'} 
                          stroke="#f59e0b" strokeWidth="2.5"
                        />
                        <text x="747" y="955" fill="#ffffff" fontSize="18" fontWeight="bold" textAnchor="middle">DAPUR (BELAKANG KANAN)</text>
                        <text x="747" y="980" fill="#fde68a" fontSize="13" textAnchor="middle">3.00 × 2.35 m (Modul Penuh)</text>
                        {showFurniture && (
                          <g>
                            <path d="M 615 1035 L 875 1035 L 875 1075 L 615 1075 Z" fill="#334155" stroke="#f59e0b" strokeWidth="1.5" />
                            <circle cx="820" cy="1055" r="10" fill="#f59e0b" />
                            <rect x="650" y="1045" width="30" height="20" fill="#94a3b8" />
                          </g>
                        )}
                      </g>
                    </>
                  )}

                  {/* Circulation Vectors */}
                  {showCirculation && (
                    <g id="circulationGF">
                      {/* Guest Path: Entrance -> Ruang Tamu -> WC Tamu / Staircase */}
                      <path 
                        d="M 750 0 L 750 160 L 677 375 M 750 160 L 822 375" 
                        fill="none" 
                        stroke="#38bdf8" 
                        strokeWidth="5" 
                        strokeDasharray="8 6" 
                        markerEnd="url(#guestArrow)" 
                      />
                      <rect x="630" y="25" width="130" height="22" rx="4" fill="#0284c7" />
                      <text x="695" y="40" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">ALUR TAMU (CYAN)</text>

                      {/* Family Path: RK -> KT1, KT2, KT3, Kitchen, Dining */}
                      <path 
                        d="M 450 600 L 150 450 M 450 600 L 150 680 M 450 600 L 590 750 L 750 750 M 450 600 L 450 950 L 587 950 L 750 990" 
                        fill="none" 
                        stroke="#10b981" 
                        strokeWidth="5" 
                        strokeDasharray="8 6" 
                        markerEnd="url(#familyArrow)" 
                      />
                      <rect x="360" y="650" width="160" height="22" rx="4" fill="#059669" />
                      <text x="440" y="665" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">ALUR KELUARGA (HIJAU)</text>
                    </g>
                  )}
                </g>
              )}

              {/* ===============================================================
                  SECOND FLOOR RENDERING
                  =============================================================== */}
              {selectedFloor === '2F' && (
                <g id="secondFloorRooms">
                  {/* Prohibited Zone Overlay / Existing Footprint Hatching beneath */}
                  {(showStructuralZone || overlayMode) && (
                    <g id="prohibitedZoneVisual">
                      <rect 
                        x="0" 
                        y="215" 
                        width="600" 
                        height="700" 
                        fill="url(#hatchProhibited)" 
                        stroke="#ef4444" 
                        strokeWidth="3" 
                        strokeDasharray="10 6"
                      />
                      <rect x="100" y="500" width="400" height="90" rx="8" fill="#450a0a" fillOpacity="0.85" stroke="#ef4444" strokeWidth="2" />
                      <text x="300" y="535" fill="#fca5a5" fontSize="20" fontWeight="bold" textAnchor="middle">ZONA ATAP BANGUNAN EKSISTING</text>
                      <text x="300" y="565" fill="#ffffff" fontSize="14" textAnchor="middle">DILARANG MEMBEBANI LANTAI 2 (KT1, KT2, RK)</text>
                      <text x="300" y="583" fill="#f87171" fontSize="12" textAnchor="middle">Struktur Atap Ringan Eksisting Tetap Dipertahankan</text>
                    </g>
                  )}

                  {/* Smoking Balcony: Front Right (X: 600 to 900, Y: 0 to 200) */}
                  <g 
                    onClick={() => setSelectedRoom(RECOMMENDED_SECOND_FLOOR_ROOMS.find(r => r.id === 'smoking_balcony') || null)}
                    className="cursor-pointer group"
                  >
                    <rect 
                      x="610" y="10" width="280" height="180" 
                      fill={selectedRoom?.id === 'smoking_balcony' ? '#065f46' : '#064e3b'} 
                      stroke="#34d399" strokeWidth="3"
                    />
                    <rect x="625" y="20" width="150" height="24" rx="4" fill="#10b981" fillOpacity="0.3" stroke="#34d399" strokeWidth="1" />
                    <text x="700" y="36" fill="#a7f3d0" fontSize="12" fontWeight="bold" textAnchor="middle">TAMPAK DEPAN</text>
                    <text x="750" y="85" fill="#ffffff" fontSize="20" fontWeight="bold" textAnchor="middle">BALKON MEROKOK</text>
                    <text x="750" y="110" fill="#6ee7b7" fontSize="14" textAnchor="middle">3.00 × 2.00 m • Bebas Asap KT1</text>
                    
                    {/* Balcony Railing & Plants */}
                    {showFurniture && (
                      <g>
                        <line x1="615" y1="15" x2="885" y2="15" stroke="#34d399" strokeWidth="4" />
                        <circle cx="650" cy="150" r="15" fill="#047857" stroke="#10b981" strokeWidth="2" />
                        <circle cx="850" cy="150" r="15" fill="#047857" stroke="#10b981" strokeWidth="2" />
                        <rect x="710" y="130" width="80" height="40" rx="4" fill="#334155" stroke="#64748b" strokeWidth="1.5" />
                        <text x="750" y="155" fill="#cbd5e1" fontSize="11" textAnchor="middle">Meja Kopi</text>
                      </g>
                    )}

                    {/* Sliding glass door from corridor */}
                    <line x1="615" y1="190" x2="695" y2="190" stroke="#38bdf8" strokeWidth="6" />
                    <text x="655" y="180" fill="#7dd3fc" fontSize="10" textAnchor="middle" fontWeight="bold">PINTU KACA GESER</text>
                  </g>

                  {/* KT 6: Upper Front-Left Bay on Independent Beams (X: 300 to 600, Y: 0 to 300) */}
                  <g 
                    onClick={() => setSelectedRoom(RECOMMENDED_SECOND_FLOOR_ROOMS.find(r => r.id === 'kt6') || null)}
                    className="cursor-pointer group"
                  >
                    <rect 
                      x="310" y="10" width="280" height="280" 
                      fill={selectedRoom?.id === 'kt6' ? '#312e81' : '#1e1b4b'} 
                      stroke="#818cf8" strokeWidth="3"
                    />
                    <rect x="325" y="20" width="140" height="24" rx="4" fill="#10b981" fillOpacity="0.3" stroke="#34d399" strokeWidth="1" />
                    <text x="395" y="36" fill="#a7f3d0" fontSize="12" fontWeight="bold" textAnchor="middle">KOLOM BARU CARPORT</text>
                    <text x="450" y="90" fill="#ffffff" fontSize="22" fontWeight="bold" textAnchor="middle">KT 6 (Kamar Depan)</text>
                    <text x="450" y="115" fill="#c7d2fe" fontSize="15" textAnchor="middle">3.00 × 3.00 m (SNI 9 m²)</text>
                    <text x="450" y="140" fill="#93c5fd" fontSize="12" textAnchor="middle">Akses Langsung dari Koridor!</text>

                    {showFurniture && (
                      <g>
                        <rect x="330" y="160" width="140" height="110" rx="4" fill="#334155" stroke="#94a3b8" strokeWidth="2" />
                        <rect x="490" y="160" width="80" height="50" fill="#334155" stroke="#64748b" strokeWidth="1.5" />
                        <text x="530" y="190" fill="#94a3b8" fontSize="10" textAnchor="middle">Meja Belajar</text>
                      </g>
                    )}

                    {/* Door swing from corridor into KT 6 */}
                    <path d="M 590 220 A 40 40 0 0 0 550 260" fill="none" stroke="#38bdf8" strokeWidth="2" strokeDasharray="3 3" />
                    <line x1="590" y1="220" x2="550" y2="220" stroke="#38bdf8" strokeWidth="3" />
                    <text x="575" y="210" fill="#7dd3fc" fontSize="10" textAnchor="end">Pintu KT 6</text>
                  </g>

                  {/* Upper Gallery Corridor: X: 600 to 700, Y: 200 to 600 (Dedicated Passage Bypassing KT4) */}
                  <g 
                    onClick={() => setSelectedRoom(RECOMMENDED_SECOND_FLOOR_ROOMS.find(r => r.id === 'corridor_2f') || null)}
                    className="cursor-pointer group"
                  >
                    <rect 
                      x="605" y="200" width="90" height="400" 
                      fill={selectedRoom?.id === 'corridor_2f' ? '#1e3a5f' : '#0f2744'} 
                      stroke="#38bdf8" strokeWidth="2.5"
                    />
                    <text x="650" y="380" fill="#38bdf8" fontSize="13" fontWeight="bold" transform="rotate(-90 650 380)" textAnchor="middle">
                      KORIDOR AKSES BALKON &amp; KT 6 (LEBAR 1.0 M)
                    </text>
                  </g>

                  {/* KT 4: Bedroom 4 Upper Linear Bay (X: 700 to 900, Y: 200 to 600) */}
                  <g 
                    onClick={() => setSelectedRoom(RECOMMENDED_SECOND_FLOOR_ROOMS.find(r => r.id === 'kt4') || null)}
                    className="cursor-pointer group"
                  >
                    <rect 
                      x="700" y="205" width="190" height="390" 
                      fill={selectedRoom?.id === 'kt4' ? '#312e81' : '#1e1b4b'} 
                      stroke="#818cf8" strokeWidth="3"
                    />
                    <text x="795" y="260" fill="#ffffff" fontSize="19" fontWeight="bold" textAnchor="middle">KT 4</text>
                    <text x="795" y="285" fill="#c7d2fe" fontSize="13" textAnchor="middle">2.00 × 4.00 m (8.0 m²)</text>
                    <text x="795" y="310" fill="#a5b4fc" fontSize="11" textAnchor="middle">Standar 2m × 4m</text>

                    {showFurniture && (
                      <g>
                        {/* Bed 120x200 along wall */}
                        <rect x="715" y="420" width="160" height="90" rx="4" fill="#334155" stroke="#94a3b8" strokeWidth="1.5" />
                        <rect x="725" y="335" width="60" height="70" fill="#334155" stroke="#64748b" strokeWidth="1.5" />
                        <text x="755" y="375" fill="#94a3b8" fontSize="10" textAnchor="middle">Wardrobe</text>
                        <rect x="800" y="335" width="75" height="40" fill="#1e293b" stroke="#64748b" strokeWidth="1" />
                        <text x="837" y="360" fill="#94a3b8" fontSize="9" textAnchor="middle">Meja Belajar</text>
                      </g>
                    )}

                    {/* Door swing from corridor into KT 4 */}
                    <path d="M 700 230 A 35 35 0 0 1 735 265" fill="none" stroke="#818cf8" strokeWidth="2" strokeDasharray="3 3" />
                    <line x1="700" y1="230" x2="735" y2="230" stroke="#818cf8" strokeWidth="3" />
                    <text x="740" y="225" fill="#c7d2fe" fontSize="10">Pintu KT 4</text>
                  </g>

                  {/* Upper Stair Landing (X: 600 to 720, Y: 600 to 800) */}
                  <g 
                    onClick={() => setSelectedRoom(RECOMMENDED_SECOND_FLOOR_ROOMS.find(r => r.id === 'stair_hall_2f') || null)}
                    className="cursor-pointer group"
                  >
                    <rect 
                      x="605" y="605" width="110" height="190" 
                      fill="#3730a3" fillOpacity="0.5" 
                      stroke="#818cf8" strokeWidth="2"
                    />
                    <text x="660" y="660" fill="#ffffff" fontSize="15" fontWeight="bold" textAnchor="middle">BORDES</text>
                    <text x="660" y="680" fill="#a5b4fc" fontSize="11" textAnchor="middle">TANGGA 2F</text>

                    {/* Stairs downward notation */}
                    <line x1="660" y1="770" x2="660" y2="710" stroke="#f43f5e" strokeWidth="2" markerEnd="url(#cadArrow)" />
                    <text x="660" y="785" fill="#fca5a5" fontSize="10" textAnchor="middle">TURUN (DN)</text>
                  </g>

                  {/* Shared Bathroom 2F (X: 720 to 900, Y: 600 to 800) */}
                  <g 
                    onClick={() => setSelectedRoom(RECOMMENDED_SECOND_FLOOR_ROOMS.find(r => r.id === 'upper_bath') || null)}
                    className="cursor-pointer group"
                  >
                    <rect 
                      x="720" y="605" width="170" height="190" 
                      fill={selectedRoom?.id === 'upper_bath' ? '#0e7490' : '#155e75'} 
                      stroke="#22d3ee" strokeWidth="2.5"
                    />
                    <text x="805" y="650" fill="#ffffff" fontSize="16" fontWeight="bold" textAnchor="middle">KM LANTAI 2</text>
                    <text x="805" y="675" fill="#a5f3fc" fontSize="12" textAnchor="middle">1.8 × 2.0 m</text>
                    <text x="805" y="695" fill="#67e8f9" fontSize="11" textAnchor="middle">Akses Langsung</text>

                    {showFurniture && (
                      <g>
                        <circle cx="765" cy="745" r="14" fill="#e2e8f0" stroke="#0891b2" strokeWidth="1.5" />
                        <rect x="815" y="725" width="55" height="50" fill="none" stroke="#67e8f9" strokeDasharray="3 3" />
                      </g>
                    )}

                    {/* Door swing from landing into KM 2F */}
                    <path d="M 720 620 A 30 30 0 0 1 750 650" fill="none" stroke="#22d3ee" strokeWidth="2" strokeDasharray="3 3" />
                    <line x1="720" y1="620" x2="750" y2="620" stroke="#22d3ee" strokeWidth="3" />
                  </g>

                  {/* KT 5: Bedroom 5 Upper Rear (X: 600 to 900, Y: 800 to 1100) */}
                  <g 
                    onClick={() => setSelectedRoom(RECOMMENDED_SECOND_FLOOR_ROOMS.find(r => r.id === 'kt5') || null)}
                    className="cursor-pointer group"
                  >
                    <rect 
                      x="610" y="805" width="280" height="285" 
                      fill={selectedRoom?.id === 'kt5' ? '#312e81' : '#1e1b4b'} 
                      stroke="#818cf8" strokeWidth="3"
                    />
                    <text x="750" y="865" fill="#ffffff" fontSize="22" fontWeight="bold" textAnchor="middle">KT 5 (Belakang Atas)</text>
                    <text x="750" y="895" fill="#c7d2fe" fontSize="16" textAnchor="middle">3.00 × 3.00 m (9.0 m²)</text>

                    {showFurniture && (
                      <g>
                        <rect x="630" y="950" width="140" height="120" rx="4" fill="#334155" stroke="#94a3b8" strokeWidth="2" />
                        <rect x="790" y="950" width="80" height="60" fill="#334155" stroke="#64748b" strokeWidth="1.5" />
                        <text x="830" y="985" fill="#94a3b8" fontSize="11" textAnchor="middle">Wardrobe</text>
                      </g>
                    )}

                    {/* Door swing into KT 5 */}
                    <path d="M 660 805 A 35 35 0 0 0 625 840" fill="none" stroke="#818cf8" strokeWidth="2" strokeDasharray="3 3" />
                    <line x1="660" y1="805" x2="660" y2="840" stroke="#818cf8" strokeWidth="3" />
                  </g>

                  {/* Circulation Vectors for 2F - Showing direct unblocked route to Balcony & KT6 */}
                  <g id="circulation2FAlwaysVisible">
                    {/* Guest & Family Path straight from Staircase through Gallery Corridor to Balcony and KT6 */}
                    <path 
                      d="M 660 700 L 650 600 L 650 200 L 750 150 M 650 240 L 580 240" 
                      fill="none" 
                      stroke="#38bdf8" 
                      strokeWidth="6" 
                      strokeDasharray="8 6" 
                      markerEnd="url(#guestArrow)" 
                    />
                    <rect x="615" y="490" width="220" height="26" rx="4" fill="#0284c7" stroke="#38bdf8" strokeWidth="1" />
                    <text x="725" y="507" fill="#ffffff" fontSize="10.5" fontWeight="bold" textAnchor="middle">
                      KORIDOR LELAS: TANGGA ➔ BALKON &amp; KT 6
                    </text>
                  </g>
                </g>
              )}

              {/* Exterior Dimensions Overlay */}
              {showDimensions && (
                <g id="exteriorDimensions">
                  {/* Top Dimension: 9.00m */}
                  <line x1="10" y1="10" x2="890" y2="10" stroke="#f43f5e" strokeWidth="1.5" />
                  <circle cx="10" cy="10" r="3" fill="#f43f5e" />
                  <circle cx="890" cy="10" r="3" fill="#f43f5e" />

                  {/* Left Dimension: 11.00m */}
                  <line x1="5" y1="10" x2="5" y2="1090" stroke="#f43f5e" strokeWidth="1.5" />
                  <circle cx="5" cy="10" r="3" fill="#f43f5e" />
                  <circle cx="5" cy="1090" r="3" fill="#f43f5e" />
                </g>
              )}
            </svg>
          </div>
        </div>

        {/* Room Inspector / Specification Card (4 cols on lg) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 flex items-center justify-between pb-4 border-b border-slate-100">
              <span className="flex items-center gap-2">
                <Info className="w-4 h-4 text-indigo-600" />
                Inspeksi Ruang &amp; Spesifikasi
              </span>
              {selectedRoom && (
                <span className="text-xs px-2 py-0.5 rounded font-mono font-bold bg-indigo-50 text-indigo-700">
                  {selectedRoom.id.toUpperCase()}
                </span>
              )}
            </h3>

            {selectedRoom ? (
              <div className="mt-4 space-y-4">
                <div>
                  <h4 className="text-lg font-bold text-slate-900">{selectedRoom.name}</h4>
                  <p className="text-xs text-indigo-600 font-medium">{selectedRoom.indonesianName}</p>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">{selectedRoom.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block">Ukuran Bersih (Clear)</span>
                    <strong className="text-slate-900 text-sm font-mono">
                      {selectedRoom.clearWidth.toFixed(2)}m × {selectedRoom.clearDepth.toFixed(2)}m
                    </strong>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block">Luas Ruangan</span>
                    <strong className="text-indigo-600 text-sm font-mono">
                      {selectedRoom.area.toFixed(2)} m²
                    </strong>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block">Koordinat Tapak (X, Y)</span>
                    <strong className="text-slate-900 font-mono">
                      ({selectedRoom.x.toFixed(1)}m, {selectedRoom.y.toFixed(1)}m)
                    </strong>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block">Status Konstruksi</span>
                    <strong className={`font-semibold capitalize ${
                      selectedRoom.status === 'existing' ? 'text-amber-600' : 'text-emerald-600'
                    }`}>
                      {selectedRoom.status === 'existing' ? 'Bangunan Lama' : 'Ekstensi Baru'}
                    </strong>
                  </div>
                </div>

                <div className="space-y-2 pt-2 text-xs">
                  <div className="flex items-start gap-2 bg-emerald-50 text-emerald-800 p-2.5 rounded-lg border border-emerald-200">
                    <Wind className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                    <div>
                      <span className="font-bold">Ventilasi Alami:</span> {selectedRoom.ventilation}
                    </div>
                  </div>

                  <div className="flex items-start gap-2 bg-amber-50 text-amber-800 p-2.5 rounded-lg border border-amber-200">
                    <Sun className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                    <div>
                      <span className="font-bold">Pencahayaan Alami:</span> {selectedRoom.daylight}
                    </div>
                  </div>

                  {selectedRoom.occupants && (
                    <div className="flex items-start gap-2 bg-indigo-50 text-indigo-800 p-2.5 rounded-lg border border-indigo-200">
                      <User className="w-4 h-4 shrink-0 mt-0.5 text-indigo-600" />
                      <div>
                        <span className="font-bold">Peruntukan:</span> {selectedRoom.occupants}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400">
                <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs">Klik salah satu ruangan pada denah untuk menampilkan rincian teknis lengkap.</p>
              </div>
            )}
          </div>

          {/* Quick Schedule summary */}
          <div className="bg-indigo-900 text-white rounded-2xl p-6 shadow-md">
            <h4 className="text-sm font-bold tracking-wide uppercase text-indigo-200 mb-3">
              Ringkasan Kapasitas Ruang
            </h4>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between pb-1.5 border-b border-indigo-800/80">
                <span className="text-indigo-200">Total Kamar Tidur:</span>
                <span className="font-bold text-white">6 Kamar (3 di Lt 1 + 3 di Lt 2)</span>
              </div>
              <div className="flex justify-between pb-1.5 border-b border-indigo-800/80">
                <span className="text-indigo-200">Total Kamar Mandi:</span>
                <span className="font-bold text-white">3 Unit (WC Tamu, KM Keluarga, KM 2F)</span>
              </div>
              <div className="flex justify-between pb-1.5 border-b border-indigo-800/80">
                <span className="text-indigo-200">Kapasitas Penghuni:</span>
                <span className="font-bold text-emerald-400">7 Orang (2 Dewasa + 5 Anak)</span>
              </div>
              <div className="flex justify-between pb-1.5 border-b border-indigo-800/80">
                <span className="text-indigo-200">Area Merokok:</span>
                <span className="font-bold text-amber-300">Balkon Depan Terpisah (Aman dari KT 1)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule & Coordinate Table (Section 10.D Deliverable) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Tabel Koordinat &amp; Luas Ruangan Lengkap (Section 10.D)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Semua ukuran berbasis sistem koordinat (0,0) di pojok kiri atas batas tapak.
            </p>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-xs divide-y divide-slate-200">
            <thead className="bg-slate-50 font-semibold text-slate-700">
              <tr>
                <th className="px-3 py-2.5">Nama Ruangan</th>
                <th className="px-3 py-2.5">Lantai</th>
                <th className="px-3 py-2.5 font-mono">X (m)</th>
                <th className="px-3 py-2.5 font-mono">Y (m)</th>
                <th className="px-3 py-2.5 font-mono">As-ke-As (m)</th>
                <th className="px-3 py-2.5 font-mono">Ukuran Bersih (Clear)</th>
                <th className="px-3 py-2.5 font-mono">Luas (m²)</th>
                <th className="px-3 py-2.5">Status</th>
                <th className="px-3 py-2.5">Zona Struktur</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {[...RECOMMENDED_GROUND_FLOOR_ROOMS, ...RECOMMENDED_SECOND_FLOOR_ROOMS].map((room) => (
                <tr 
                  key={room.id}
                  onClick={() => setSelectedRoom(room)}
                  className={`hover:bg-indigo-50/60 cursor-pointer transition-colors ${
                    selectedRoom?.id === room.id ? 'bg-indigo-50 font-bold' : ''
                  }`}
                >
                  <td className="px-3 py-2.5 text-slate-900">
                    <span className="font-semibold">{room.name}</span>
                    <span className="block text-slate-400 font-normal">{room.indonesianName}</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      room.floor === 'GF' ? 'bg-slate-100 text-slate-700' : 'bg-indigo-100 text-indigo-700'
                    }`}>
                      {room.floor}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 font-mono text-slate-600">{room.x.toFixed(2)}</td>
                  <td className="px-3 py-2.5 font-mono text-slate-600">{room.y.toFixed(2)}</td>
                  <td className="px-3 py-2.5 font-mono text-slate-900">{room.width.toFixed(2)} × {room.depth.toFixed(2)}</td>
                  <td className="px-3 py-2.5 font-mono text-emerald-700">{room.clearWidth.toFixed(2)} × {room.clearDepth.toFixed(2)}</td>
                  <td className="px-3 py-2.5 font-mono font-bold text-indigo-600">{room.area.toFixed(2)}</td>
                  <td className="px-3 py-2.5">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                      room.status === 'existing' 
                        ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {room.status === 'existing' ? 'Eksisting' : 'Baru'}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`text-[11px] ${
                      room.structuralZone === 'prohibited-above' 
                        ? 'text-red-600 font-bold' 
                        : 'text-slate-600'
                    }`}>
                      {room.structuralZone === 'prohibited-above' ? 'Atap Lama (1 Lt)' : 'Struktur Baru'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
