/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FurnitureItem, FurnitureTemplate } from '../utils/houseDesignStore';
import { WindowData, StaircaseConfig, generateStairSteps } from '../utils/doorsAndStairs';

interface FurnitureSymbolProps {
  item: FurnitureItem;
  isSelected?: boolean;
}

/**
 * High-fidelity 2D architectural CAD symbols for realistic house visualization.
 * Visually represents real architectural function:
 * - Wardrobe: outer frame, chrome hanging rail with real hangers/garments, shelving stack with folded clothes, sliding tracks
 * - Beds: Single, Queen, King with distinct wooden headboards ("▲ KEPALA RANJANG ▲"), pillows, mattress welt, and folded duvets
 * - Kitchen: Straight, L-shape, U-shape, Island, Stove, Sink, and Fridge with detailed burners, trivets, drainboards, and barstools
 * - Plus Living, Bathroom, Laundry, Office, Outdoor, and Built-In furniture.
 */
export const ArchitecturalFurnitureSymbol: React.FC<FurnitureSymbolProps> = ({ item, isSelected }) => {
  const fW = item.width * 100;
  const fD = item.depth * 100;
  const isBuiltIn = item.mountType && item.mountType !== 'freestanding';

  const strokeColor = isSelected ? '#38bdf8' : (isBuiltIn ? '#10b981' : '#64748b');
  const strokeW = isSelected ? 2.5 : 1.5;

  // =========================================================================
  // 1. TRUE L-SHAPE SOFA
  // =========================================================================
  if (item.type === 'sofa-l') {
    const mainDepth = fD * 0.55;
    const chaiseWidth = fW * 0.42;

    const lPoints = `
      0,0 
      ${fW},0 
      ${fW},${fD} 
      ${fW - chaiseWidth},${fD} 
      ${fW - chaiseWidth},${mainDepth} 
      0,${mainDepth}
    `.trim().replace(/\s+/g, ' ');

    return (
      <g>
        <polygon
          points={lPoints}
          fill={isSelected ? '#1e3a8a' : '#1e293b'}
          stroke={strokeColor}
          strokeWidth={strokeW}
        />
        {/* Backrest along top */}
        <rect x="4" y="4" width={fW - 8} height="16" rx="3" fill="#334155" stroke={strokeColor} strokeWidth="1" />
        {/* Chaise backrest */}
        <rect x={fW - 20} y="20" width="16" height={fD - 24} rx="3" fill="#334155" stroke={strokeColor} strokeWidth="1" />
        {/* Left Armrest */}
        <rect x="4" y="20" width="16" height={mainDepth - 24} rx="3" fill="#334155" stroke={strokeColor} strokeWidth="1" />
        {/* Seat Cushions Seams */}
        <line x1={fW * 0.3} y1="20" x2={fW * 0.3} y2={mainDepth - 4} stroke="#475569" strokeWidth="1" strokeDasharray="3 2" />
        <line x1={fW - chaiseWidth} y1="20" x2={fW - chaiseWidth} y2={mainDepth - 4} stroke="#475569" strokeWidth="1" strokeDasharray="3 2" />
        <line x1={fW - chaiseWidth + 4} y1={mainDepth} x2={fW - 20} y2={mainDepth} stroke="#475569" strokeWidth="1" strokeDasharray="3 2" />
        {/* Decorative Throw Pillows */}
        <rect x="22" y="22" width="14" height="14" rx="2" fill="#6366f1" />
        <rect x={fW - 36} y={fD - 26} width="14" height="14" rx="2" fill="#6366f1" />
        <text x={fW * 0.35} y={mainDepth / 2 + 3} fill={isSelected ? '#38bdf8' : '#94a3b8'} fontSize="9" fontWeight="bold" textAnchor="middle" pointerEvents="none">
          Sofa Sudut L (5-6 Org)
        </text>
      </g>
    );
  }

  // =========================================================================
  // 1.2. U-SHAPE SECTIONAL SOFA
  // =========================================================================
  if (item.type === 'sofa-u') {
    const armW = 20;
    const backH = 16;
    const sideDepth = fD * 0.85;

    return (
      <g>
        {/* U-Shape Polygon: Left chaise, center back, right chaise */}
        <path
          d={`
            M 0,0 
            L ${fW},0 
            L ${fW},${sideDepth} 
            L ${fW - fW * 0.3},${sideDepth} 
            L ${fW - fW * 0.3},${fD * 0.45} 
            L ${fW * 0.3},${fD * 0.45} 
            L ${fW * 0.3},${sideDepth} 
            L 0,${sideDepth} 
            Z
          `}
          fill={isSelected ? '#1e3a8a' : '#1e293b'}
          stroke={strokeColor}
          strokeWidth={strokeW}
        />
        {/* Backrest along top */}
        <rect x={armW} y="4" width={fW - armW * 2} height={backH} rx="3" fill="#334155" stroke={strokeColor} strokeWidth="1" />
        {/* Left wing backrest */}
        <rect x="4" y="4" width={armW - 4} height={sideDepth - 8} rx="3" fill="#334155" stroke={strokeColor} strokeWidth="1" />
        {/* Right wing backrest */}
        <rect x={fW - armW} y="4" width={armW - 4} height={sideDepth - 8} rx="3" fill="#334155" stroke={strokeColor} strokeWidth="1" />
        {/* Throw Pillows in Corners */}
        <rect x={armW + 4} y="22" width="14" height="14" rx="2" fill="#6366f1" />
        <rect x={fW - armW - 18} y="22" width="14" height="14" rx="2" fill="#6366f1" />
        <text x={fW / 2} y={fD * 0.28} fill={isSelected ? '#38bdf8' : '#94a3b8'} fontSize="9" fontWeight="bold" textAnchor="middle" pointerEvents="none">
          Sofa Format U Besar
        </text>
      </g>
    );
  }

  // =========================================================================
  // 1.3. STRAIGHT 2-SEATER SOFA
  // =========================================================================
  if (item.type === 'sofa' || (item.category === 'living' && item.type.includes('sofa'))) {
    const cushionW = (fW - 32) / 2;
    return (
      <g>
        {/* Sofa Base */}
        <rect x="0" y="0" width={fW} height={fD} rx="4" fill={isSelected ? '#1e3a8a' : '#1e293b'} stroke={strokeColor} strokeWidth={strokeW} />
        {/* Backrest */}
        <rect x="4" y="4" width={fW - 8} height={fD * 0.28} rx="3" fill="#334155" stroke={strokeColor} strokeWidth="1" />
        {/* Left Armrest */}
        <rect x="4" y={fD * 0.28 + 6} width="12" height={fD - fD * 0.28 - 10} rx="3" fill="#334155" stroke={strokeColor} strokeWidth="1" />
        {/* Right Armrest */}
        <rect x={fW - 16} y={fD * 0.28 + 6} width="12" height={fD - fD * 0.28 - 10} rx="3" fill="#334155" stroke={strokeColor} strokeWidth="1" />
        {/* 2 Seat Cushions with piping */}
        <rect x="18" y={fD * 0.28 + 6} width={cushionW} height={fD - fD * 0.28 - 10} rx="3" fill="#1e293b" stroke="#475569" strokeWidth="1" />
        <rect x={18 + cushionW + 4} y={fD * 0.28 + 6} width={cushionW} height={fD - fD * 0.28 - 10} rx="3" fill="#1e293b" stroke="#475569" strokeWidth="1" />
        {/* 2 Accent throw pillows */}
        <rect x="20" y={fD * 0.32} width="13" height="13" rx="2" fill="#6366f1" />
        <rect x={fW - 33} y={fD * 0.32} width="13" height="13" rx="2" fill="#6366f1" />
        <text x={fW / 2} y={fD * 0.68} fill={isSelected ? '#38bdf8' : '#94a3b8'} fontSize="8" fontWeight="bold" textAnchor="middle" pointerEvents="none">
          Sofa 2-Seater
        </text>
      </g>
    );
  }

  // =========================================================================
  // 2. REALISTIC ARCHITECTURAL WARDROBE / LEMARI PAKAIAN (Standard Arsitektur Neufert & CAD)
  // =========================================================================
  if (
    item.type.includes('wardrobe') ||
    item.type === 'recessed-niche' ||
    item.name.toLowerCase().includes('wardrobe') ||
    item.name.toLowerCase().includes('lemari pakaian')
  ) {
    const isSmall = fW <= 130;
    const shelfWidth = isSmall ? fW * 0.32 : fW * 0.28;
    const hangerWidth = fW - shelfWidth;
    const hangerCount = Math.max(3, Math.floor(hangerWidth / 16));

    return (
      <g>
        {/* Main Cabinet Outer Casing (Deep Wood / Walnut Frame) */}
        <rect
          x="0"
          y="0"
          width={fW}
          height={fD}
          rx="2"
          fill={isSelected ? '#312e81' : (isBuiltIn ? '#064e3b' : '#1e293b')}
          stroke={strokeColor}
          strokeWidth={strokeW}
        />
        {/* Back Wall Panel */}
        <rect x="2" y="2" width={fW - 4} height="4" fill="#334155" />

        {/* SECTION 1: HANGING SECTION (Gantungan Baju Kemeja & Celana) */}
        <rect x="4" y="6" width={hangerWidth - 6} height={fD - 14} fill={isSelected ? '#1e1b4b' : '#0f172a'} stroke="#475569" strokeWidth="0.8" />
        {/* Longitudinal Chrome Clothes Hanger Rail Line (Pipa Gantungan Baju) */}
        <line x1="8" y1={fD * 0.44} x2={hangerWidth - 8} y2={fD * 0.44} stroke="#94a3b8" strokeWidth="2.5" />
        <circle cx="8" cy={fD * 0.44} r="2.5" fill="#cbd5e1" />
        <circle cx={hangerWidth - 8} cy={fD * 0.44} r="2.5" fill="#cbd5e1" />

        {/* Repeated CAD Triangular Coat-Hangers with Clothes Silhouette */}
        {Array.from({ length: hangerCount }).map((_, i) => {
          const hX = 14 + i * ((hangerWidth - 28) / Math.max(1, hangerCount - 1));
          const hY = fD * 0.44;
          return (
            <g key={i} opacity="0.95">
              <path d={`M ${hX} ${hY - 4} Q ${hX - 2} ${hY - 7} ${hX} ${hY - 9} Q ${hX + 3} ${hY - 8} ${hX} ${hY - 4}`} fill="none" stroke="#cbd5e1" strokeWidth="1" />
              <polygon points={`${hX},${hY - 4} ${hX - 7},${hY + 6} ${hX + 7},${hY + 6}`} fill={i % 2 === 0 ? '#38bdf8' : '#a855f7'} fillOpacity="0.45" stroke="#e2e8f0" strokeWidth="1" />
              <line x1={hX - 6} y1={hY + 6} x2={hX + 6} y2={hY + 6} stroke="#f1f5f9" strokeWidth="1.2" />
              <line x1={hX} y1={hY + 6} x2={hX} y2={hY + 13} stroke={i % 2 === 0 ? '#7dd3fc' : '#d8b4fe'} strokeWidth="2" />
            </g>
          );
        })}

        {/* SECTION 2: FOLDED CLOTHES & SHELVING (Rak Pakaian Lipat) */}
        <g transform={`translate(${hangerWidth}, 6)`}>
          <rect x="0" y="0" width={shelfWidth - 4} height={fD - 14} fill="#1e293b" stroke="#475569" strokeWidth="0.8" />
          {[0.25, 0.5, 0.75].map((ratio, sIdx) => {
            const sY = (fD - 14) * ratio;
            return (
              <React.Fragment key={sIdx}>
                <line x1="2" y1={sY} x2={shelfWidth - 6} y2={sY} stroke="#64748b" strokeWidth="1" strokeDasharray="2 2" />
                <rect x={(shelfWidth - 4) / 2 - 8} y={sY - 6} width="16" height="4" rx="1" fill="#94a3b8" fillOpacity="0.6" />
              </React.Fragment>
            );
          })}
          <text x={(shelfWidth - 4) / 2} y={(fD - 14) * 0.9} fill="#94a3b8" fontSize="6.5" fontWeight="bold" textAnchor="middle" pointerEvents="none">
            RAK
          </text>
        </g>

        {/* FRONT SLIDING DOOR DOUBLE TRACK (Rel Pintu Geser 2 Jalur) */}
        <rect x="2" y={fD - 7} width={fW - 4} height="5" fill="#0f172a" stroke="#64748b" strokeWidth="0.8" />
        <rect x="3" y={fD - 6} width={fW * 0.52} height="2" fill="#38bdf8" stroke="#0284c7" strokeWidth="0.5" />
        <rect x={fW * 0.46} y={fD - 4} width={fW * 0.52} height="2" fill="#818cf8" stroke="#4f46e5" strokeWidth="0.5" />

        {/* Dimension & Title CAD Badge */}
        <rect x={fW / 2 - 38} y="8" width="76" height="12" rx="2" fill="#0f172a" fillOpacity="0.85" stroke="#64748b" strokeWidth="0.6" />
        <text x={fW / 2} y={17} fill={isSelected ? '#38bdf8' : '#e2e8f0'} fontSize="7" fontWeight="bold" textAnchor="middle" pointerEvents="none" letterSpacing="0.3">
          WARDROBE ({item.width}m × {item.depth}m)
        </text>
      </g>
    );
  }

  // =========================================================================
  // 3. REALISTIC BEDS WITH VISIBLE HEADBOARD & ERGONOMIC PILLOWS (Kasur)
  // =========================================================================
  if (item.category === 'bedroom' || item.type.startsWith('bed-')) {
    const isSingle = item.type === 'bed-single' || fW < 140;
    const isKing = item.type === 'bed-king' || fW >= 180;
    const headboardH = 16;
    const pillowH = 26;
    const duvetTop = fD * 0.42;

    return (
      <g>
        {/* Bed Platform Frame */}
        <rect x="0" y="0" width={fW} height={fD} rx="4" fill={isSelected ? '#1e1b4b' : '#0f172a'} stroke={strokeColor} strokeWidth={strokeW} />

        {/* HEADBOARD AT TOP (Kepala Ranjang Teak Wood Bar) */}
        <rect x="-2" y="-3" width={fW + 4} height={headboardH} rx="3" fill="#78350f" stroke="#b45309" strokeWidth="1.5" />
        {/* Headboard Wood Grain / Slat Accent */}
        <line x1="2" y1={headboardH / 2} x2={fW - 2} y2={headboardH / 2} stroke="#b45309" strokeWidth="1" strokeDasharray="6 3" />
        <text x={fW / 2} y="9" fill="#fef3c7" fontSize="7" fontWeight="800" letterSpacing="0.5" textAnchor="middle" pointerEvents="none">
          ▲ KEPALA RANJANG ▲
        </text>

        {/* PILLOWS */}
        {isSingle ? (
          /* Single Bed: 1 Large Ergonomic Pillow */
          <g>
            <rect x={(fW - 56) / 2} y={headboardH + 5} width="56" height={pillowH} rx="5" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.2" />
            <line x1={fW / 2} y1={headboardH + 8} x2={fW / 2} y2={headboardH + pillowH + 2} stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2 2" />
          </g>
        ) : (
          /* Double / Queen / King Bed: 2 Large Pillows + Accent Cushion */
          <g>
            <rect x="8" y={headboardH + 5} width={fW * 0.38} height={pillowH} rx="5" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.2" />
            <rect x={fW - fW * 0.38 - 8} y={headboardH + 5} width={fW * 0.38} height={pillowH} rx="5" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.2" />
            {/* Center Decorative Accent Cushion */}
            <rect x={fW / 2 - 12} y={headboardH + 10} width="24" height="15" rx="3" fill="#6366f1" stroke="#4f46e5" strokeWidth="1" />
            {isKing && (
              <>
                {/* Nightstand floating ledges */}
                <rect x="-6" y="-1" width="5" height="24" rx="2" fill="#78350f" stroke="#b45309" strokeWidth="1" />
                <rect x={fW + 1} y="-1" width="5" height="24" rx="2" fill="#78350f" stroke="#b45309" strokeWidth="1" />
              </>
            )}
          </g>
        )}

        {/* Mattress Sheet Area */}
        <rect x="4" y={headboardH + 34} width={fW - 8} height={fD - headboardH - 38} rx="3" fill="#1e293b" stroke="#334155" strokeWidth="1" />

        {/* Folded Duvet / Blanket (Selimut) covering lower half */}
        <rect x="4" y={duvetTop} width={fW - 8} height={fD - duvetTop - 4} rx="3" fill={isSelected ? '#312e81' : '#1e3a8a'} stroke="#6366f1" strokeWidth="1" />
        {/* Duvet folded top rim */}
        <line x1="4" y1={duvetTop} x2={fW - 4} y2={duvetTop} stroke="#818cf8" strokeWidth="3" />
        {/* Quilted Runner at the bottom */}
        <rect x="4" y={fD - 28} width={fW - 8} height="18" fill="#3b82f6" fillOpacity="0.4" stroke="#60a5fa" strokeWidth="0.8" strokeDasharray="4 2" />

        {/* Label */}
        <text x={fW / 2} y={fD - 8} fill={isSelected ? '#38bdf8' : '#cbd5e1'} fontSize="8" fontWeight="bold" textAnchor="middle" pointerEvents="none">
          {item.name}
        </text>
      </g>
    );
  }

  // =========================================================================
  // 4. KITCHEN SETS (L-Shape, U-Shape, Island, Counter, Stove, Sink, Refrigerator)
  // =========================================================================

  // 4.1. TRUE L-SHAPE KITCHEN
  if (item.type === 'kitchen-l') {
    const depthW = 60; // 0.6m counter depth
    const lPath = `
      M 0,0 
      L ${fW},0 
      L ${fW},${depthW} 
      L ${depthW},${depthW} 
      L ${depthW},${fD} 
      L 0,${fD} 
      Z
    `.trim().replace(/\s+/g, ' ');

    return (
      <g>
        {/* Counter Top Base */}
        <path d={lPath} fill="#0f172a" stroke={strokeColor} strokeWidth={strokeW} />
        {/* Granite Countertop Inset */}
        <path
          d={`M 3,3 L ${fW - 3},3 L ${fW - 3},${depthW - 3} L ${depthW + 3},${depthW - 3} L ${depthW - 3},${depthW + 3} L ${depthW - 3},${fD - 3} L 3,${fD - 3} Z`}
          fill="#1e293b"
          stroke="#475569"
          strokeWidth="1"
        />

        {/* Left Wing (Cooking Hob): 2 Gas Burners */}
        <g transform={`translate(12, ${fD * 0.45})`}>
          <rect x="0" y="0" width="36" height="50" rx="3" fill="#020617" stroke="#f59e0b" strokeWidth="1" />
          <circle cx="18" cy="14" r="8" fill="#0f172a" stroke="#f59e0b" strokeWidth="1.2" />
          <circle cx="18" cy="14" r="3" fill="#f59e0b" />
          <circle cx="18" cy="36" r="8" fill="#0f172a" stroke="#f59e0b" strokeWidth="1.2" />
          <circle cx="18" cy="36" r="3" fill="#f59e0b" />
        </g>

        {/* Right Wing: Stainless Double-Bowl Sink */}
        <g transform={`translate(${fW - 110}, 8)`}>
          <rect x="0" y="0" width="85" height="44" rx="3" fill="#020617" stroke="#94a3b8" strokeWidth="1" />
          {/* Bowl 1 */}
          <rect x="5" y="5" width="34" height="34" rx="2" fill="#1e293b" stroke="#64748b" strokeWidth="0.8" />
          <circle cx="22" cy="22" r="3" fill="#38bdf8" />
          {/* Bowl 2 with drain grooves */}
          <rect x="44" y="5" width="36" height="34" rx="2" fill="#1e293b" stroke="#64748b" strokeWidth="0.8" />
          <line x1="50" y1="12" x2="72" y2="12" stroke="#64748b" strokeWidth="1" />
          <line x1="50" y1="22" x2="72" y2="22" stroke="#64748b" strokeWidth="1" />
          <line x1="50" y1="32" x2="72" y2="32" stroke="#64748b" strokeWidth="1" />
          {/* Swivel Mixer Tap */}
          <circle cx="41" cy="22" r="4" fill="#cbd5e1" stroke="#475569" strokeWidth="1" />
          <path d="M 41 22 Q 41 12 37 9" fill="none" stroke="#e2e8f0" strokeWidth="2" />
        </g>

        {/* Corner Prep Zone */}
        <rect x="10" y="10" width="36" height="36" rx="3" fill="#78350f" fillOpacity="0.5" stroke="#b45309" strokeWidth="1" />
        <line x1="14" y1="14" x2="42" y2="14" stroke="#d97706" strokeWidth="0.8" />
        <line x1="14" y1="22" x2="42" y2="22" stroke="#d97706" strokeWidth="0.8" />

        <text x={fW * 0.45} y={35} fill="#cbd5e1" fontSize="8" fontWeight="bold" textAnchor="middle" pointerEvents="none">
          Kitchen Set Sudut L
        </text>
      </g>
    );
  }

  // 4.2. TRUE U-SHAPE KITCHEN
  if (item.type === 'kitchen-u') {
    const depthW = 60;
    const uPath = `
      M 0,0 
      L ${fW},0 
      L ${fW},${fD} 
      L ${fW - depthW},${fD} 
      L ${fW - depthW},${depthW} 
      L ${depthW},${depthW} 
      L ${depthW},${fD} 
      L 0,${fD} 
      Z
    `.trim().replace(/\s+/g, ' ');

    return (
      <g>
        <path d={uPath} fill="#0f172a" stroke={strokeColor} strokeWidth={strokeW} />
        {/* Sink on back center */}
        <rect x={fW / 2 - 40} y="8" width="80" height="44" rx="3" fill="#1e293b" stroke="#94a3b8" strokeWidth="1" />
        <circle cx={fW / 2} cy="30" r="4" fill="#38bdf8" />
        {/* Cooktop on left wing */}
        <circle cx="30" cy={fD * 0.5} r="10" fill="#0f172a" stroke="#f59e0b" strokeWidth="1.5" />
        <circle cx="30" cy={fD * 0.5} r="4" fill="#f59e0b" />
        {/* Island prep on right wing */}
        <rect x={fW - 50} y={fD * 0.3} width="40" height="60" rx="3" fill="#78350f" fillOpacity="0.4" stroke="#b45309" strokeWidth="1" />
        <text x={fW / 2} y={depthW + 25} fill="#cbd5e1" fontSize="8.5" fontWeight="bold" textAnchor="middle" pointerEvents="none">
          Kitchen Set U-Shape Koki
        </text>
      </g>
    );
  }

  // 4.3. KITCHEN ISLAND & BREAKFAST BAR
  if (item.type === 'kitchen-island') {
    return (
      <g>
        {/* Main Island Counter */}
        <rect x="0" y="0" width={fW} height={fD} rx="4" fill="#1e293b" stroke={strokeColor} strokeWidth={strokeW} />
        {/* Countertop Surface Inset */}
        <rect x="4" y="4" width={fW - 8} height={fD - 8} rx="3" fill="#334155" stroke="#475569" strokeWidth="1" />
        {/* Center Platter / Fruit Bowl */}
        <ellipse cx={fW / 2} cy={fD / 2} rx="22" ry="12" fill="#0f172a" stroke="#cbd5e1" strokeWidth="1.2" />
        {/* 3 Bar Stools along bottom edge */}
        {[0.25, 0.5, 0.75].map((pos, i) => (
          <g key={i} transform={`translate(${fW * pos}, ${fD + 6})`}>
            <circle cx="0" cy="0" r="10" fill="#78350f" stroke="#b45309" strokeWidth="1.2" />
            <path d="M -8 -4 Q 0 -10 8 -4" fill="none" stroke="#fef3c7" strokeWidth="1" />
          </g>
        ))}
        <text x={fW / 2} y={fD / 2 + 3} fill="#fef3c7" fontSize="8" fontWeight="bold" textAnchor="middle" pointerEvents="none">
          Island &amp; Breakfast Bar
        </text>
      </g>
    );
  }

  // 4.4. DEDICATED STOVE / KOMPOR TANAM
  if (item.type === 'stove') {
    return (
      <g>
        <rect x="0" y="0" width={fW} height={fD} rx="4" fill="#020617" stroke={strokeColor} strokeWidth={strokeW} />
        {/* Burner 1 (Left) */}
        <circle cx={fW * 0.3} cy={fD / 2} r="14" fill="#0f172a" stroke="#f59e0b" strokeWidth="1.8" />
        <circle cx={fW * 0.3} cy={fD / 2} r="5" fill="#f59e0b" />
        <line x1={fW * 0.3 - 16} y1={fD / 2} x2={fW * 0.3 + 16} y2={fD / 2} stroke="#f59e0b" strokeWidth="1" />
        <line x1={fW * 0.3} y1={fD / 2 - 16} x2={fW * 0.3} y2={fD / 2 + 16} stroke="#f59e0b" strokeWidth="1" />
        {/* Burner 2 (Right) */}
        <circle cx={fW * 0.7} cy={fD / 2} r="14" fill="#0f172a" stroke="#f59e0b" strokeWidth="1.8" />
        <circle cx={fW * 0.7} cy={fD / 2} r="5" fill="#f59e0b" />
        <line x1={fW * 0.7 - 16} y1={fD / 2} x2={fW * 0.7 + 16} y2={fD / 2} stroke="#f59e0b" strokeWidth="1" />
        <line x1={fW * 0.7} y1={fD / 2 - 16} x2={fW * 0.7} y2={fD / 2 + 16} stroke="#f59e0b" strokeWidth="1" />
        {/* Control Knobs */}
        <circle cx={fW / 2 - 8} cy={fD - 8} r="3" fill="#cbd5e1" stroke="#475569" strokeWidth="0.8" />
        <circle cx={fW / 2 + 8} cy={fD - 8} r="3" fill="#cbd5e1" stroke="#475569" strokeWidth="0.8" />
        <text x={fW / 2} y="11" fill="#f59e0b" fontSize="6.5" fontWeight="bold" textAnchor="middle" pointerEvents="none">
          KOMPOR TANAM
        </text>
      </g>
    );
  }

  // 4.5. DEDICATED SINK / BAK CUCI PIRING
  if (item.type === 'sink') {
    return (
      <g>
        <rect x="0" y="0" width={fW} height={fD} rx="3" fill="#0f172a" stroke={strokeColor} strokeWidth={strokeW} />
        {/* Double bowl */}
        <rect x="6" y="6" width={fW * 0.44} height={fD - 12} rx="2" fill="#1e293b" stroke="#94a3b8" strokeWidth="1" />
        <circle cx={6 + fW * 0.22} cy={fD / 2} r="3.5" fill="#38bdf8" />
        <rect x={fW * 0.52} y="6" width={fW * 0.42} height={fD - 12} rx="2" fill="#1e293b" stroke="#94a3b8" strokeWidth="1" />
        {/* Drain grooves */}
        <line x1={fW * 0.56} y1={fD * 0.3} x2={fW * 0.88} y2={fD * 0.3} stroke="#64748b" strokeWidth="1" />
        <line x1={fW * 0.56} y1={fD * 0.5} x2={fW * 0.88} y2={fD * 0.5} stroke="#64748b" strokeWidth="1" />
        <line x1={fW * 0.56} y1={fD * 0.7} x2={fW * 0.88} y2={fD * 0.7} stroke="#64748b" strokeWidth="1" />
        {/* Faucet */}
        <circle cx={fW / 2} cy={fD / 2} r="4" fill="#cbd5e1" stroke="#475569" strokeWidth="1" />
        <path d={`M ${fW / 2} ${fD / 2} Q ${fW / 2} ${fD * 0.25} ${fW * 0.42} ${fD * 0.25}`} fill="none" stroke="#e2e8f0" strokeWidth="2.5" />
      </g>
    );
  }

  // 4.6. REFRIGERATOR / KULKAS
  if (item.type === 'refrigerator') {
    return (
      <g>
        <rect x="0" y="0" width={fW} height={fD} rx="4" fill="#0f172a" stroke={strokeColor} strokeWidth={strokeW} />
        {/* Fridge Doors Split (Left & Right or Freezer Top) */}
        <rect x="3" y="3" width={fW * 0.46} height={fD - 6} rx="2" fill="#1e293b" stroke="#475569" strokeWidth="1" />
        <rect x={fW * 0.51} y="3" width={fW * 0.46} height={fD - 6} rx="2" fill="#1e293b" stroke="#475569" strokeWidth="1" />
        {/* Chrome Handles */}
        <rect x={fW * 0.43} y={fD * 0.3} width="3" height={fD * 0.4} rx="1" fill="#cbd5e1" />
        <rect x={fW * 0.53} y={fD * 0.3} width="3" height={fD * 0.4} rx="1" fill="#cbd5e1" />
        <text x={fW / 2} y={fD * 0.88} fill="#94a3b8" fontSize="7" fontWeight="bold" textAnchor="middle" pointerEvents="none">
          Kulkas 2-Pintu
        </text>
      </g>
    );
  }

  // 4.7. STRAIGHT KITCHEN SET (Default kitchen)
  if (item.type.includes('kitchen')) {
    return (
      <g>
        {/* Main Base Counter */}
        <rect x="0" y="0" width={fW} height={fD} rx="3" fill="#1e293b" stroke={strokeColor} strokeWidth={strokeW} />
        {/* Stainless Steel Double Bowl Sink with Drainer */}
        <g transform="translate(10, 8)">
          <rect x="0" y="0" width={fW * 0.38} height={fD - 16} rx="2" fill="#0f172a" stroke="#94a3b8" strokeWidth="1" />
          <rect x="4" y="4" width={fW * 0.17} height={fD - 24} rx="2" fill="#1e293b" stroke="#64748b" strokeWidth="0.8" />
          <circle cx={4 + fW * 0.085} cy={(fD - 16) / 2} r="3" fill="#38bdf8" />
          <rect x={fW * 0.19} y="4" width={fW * 0.17} height={fD - 24} rx="2" fill="#1e293b" stroke="#64748b" strokeWidth="0.8" />
          <line x1={fW * 0.22} y1="12" x2={fW * 0.33} y2="12" stroke="#64748b" strokeWidth="1" />
          <line x1={fW * 0.22} y1={(fD - 16) / 2} x2={fW * 0.33} y2={(fD - 16) / 2} stroke="#64748b" strokeWidth="1" />
          <line x1={fW * 0.22} y1={fD - 28} x2={fW * 0.33} y2={fD - 28} stroke="#64748b" strokeWidth="1" />
        </g>
        {/* 2 Gas Burners with Cast Iron Trivets */}
        <g transform={`translate(${fW - 85}, 8)`}>
          <rect x="0" y="0" width="75" height={fD - 16} rx="2" fill="#020617" stroke="#f59e0b" strokeWidth="1" />
          <circle cx="20" cy={(fD - 16) / 2} r="11" fill="#0f172a" stroke="#f59e0b" strokeWidth="1.5" />
          <circle cx="20" cy={(fD - 16) / 2} r="4" fill="#f59e0b" />
          <circle cx="55" cy={(fD - 16) / 2} r="11" fill="#0f172a" stroke="#f59e0b" strokeWidth="1.5" />
          <circle cx="55" cy={(fD - 16) / 2} r="4" fill="#f59e0b" />
        </g>
        {/* Center Prep Cutting Board */}
        <rect x={fW * 0.44} y="12" width={fW * 0.16} height={fD - 24} rx="2" fill="#78350f" fillOpacity="0.4" stroke="#b45309" strokeWidth="1" />
        <text x={fW * 0.52} y={(fD - 16) / 2 + 10} fill="#fef3c7" fontSize="7" fontWeight="bold" textAnchor="middle" pointerEvents="none">
          Kitchen Set
        </text>
      </g>
    );
  }

  // =========================================================================
  // 5. DINING TABLE WITH 6 CHAIRS
  // =========================================================================
  if (item.type === 'dining-table') {
    return (
      <g>
        {/* Table Top (Polished Wood) */}
        <rect x="0" y="0" width={fW} height={fD} rx="4" fill={isSelected ? '#451a03' : '#291404'} stroke={strokeColor} strokeWidth={strokeW} />
        {/* Center Table Runner */}
        <rect x="8" y={fD * 0.25} width={fW - 16} height={fD * 0.5} rx="2" fill="#78350f" stroke="#b45309" strokeWidth="0.8" strokeDasharray="3 2" />
        {/* Center Fruit Bowl */}
        <circle cx={fW / 2} cy={fD / 2} r="8" fill="#f59e0b" fillOpacity="0.8" stroke="#d97706" strokeWidth="1" />

        {/* 6 Dining Chairs around table */}
        {[-fW * 0.3, 0, fW * 0.3].map((cx, i) => (
          <React.Fragment key={i}>
            {/* Top Chair */}
            <g transform={`translate(${fW / 2 + cx - 18}, -14)`}>
              <rect x="0" y="0" width="36" height="12" rx="3" fill="#334155" stroke="#64748b" strokeWidth="1" />
              <path d="M 4 2 Q 18 -3 32 2" fill="none" stroke="#94a3b8" strokeWidth="1.2" />
            </g>
            {/* Bottom Chair */}
            <g transform={`translate(${fW / 2 + cx - 18}, ${fD + 2})`}>
              <rect x="0" y="0" width="36" height="12" rx="3" fill="#334155" stroke="#64748b" strokeWidth="1" />
              <path d="M 4 10 Q 18 15 32 10" fill="none" stroke="#94a3b8" strokeWidth="1.2" />
            </g>
          </React.Fragment>
        ))}

        <text x={fW / 2} y={fD / 2 + 18} fill="#fef3c7" fontSize="8" fontWeight="bold" textAnchor="middle" pointerEvents="none">
          Meja Makan 6 Kursi
        </text>
      </g>
    );
  }

  // =========================================================================
  // 6. STUDY DESK & OFFICE WORKSTATION
  // =========================================================================
  if (item.type === 'desk' || item.type === 'wall-desk') {
    return (
      <g>
        {/* Desktop Surface */}
        <rect x="0" y="0" width={fW} height={fD} rx="3" fill="#1e293b" stroke={strokeColor} strokeWidth={strokeW} />
        {/* Open Laptop Screen & Keyboard */}
        <g transform={`translate(${fW / 2 - 18}, 8)`}>
          <rect x="0" y="0" width="36" height="14" rx="2" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
          <rect x="4" y="16" width="28" height="16" rx="1" fill="#334155" stroke="#64748b" strokeWidth="0.8" />
        </g>
        {/* Mouse & Pad */}
        <rect x={fW / 2 + 24} y="22" width="12" height="16" rx="2" fill="#0f172a" />
        <ellipse cx={fW / 2 + 30} cy="30" rx="4" ry="6" fill="#64748b" />
        {/* Ergonomic Office Swivel Chair with 5-Star Casters */}
        <g transform={`translate(${fW / 2}, ${fD + 16})`}>
          {/* 5 Casters Star */}
          {[0, 72, 144, 216, 288].map((deg, ci) => (
            <line
              key={ci}
              x1="0"
              y1="0"
              x2={Math.cos((deg * Math.PI) / 180) * 14}
              y2={Math.sin((deg * Math.PI) / 180) * 14}
              stroke="#64748b"
              strokeWidth="2"
            />
          ))}
          {/* Seat Cushion */}
          <rect x="-14" y="-12" width="28" height="20" rx="4" fill="#334155" stroke="#64748b" strokeWidth="1" />
          {/* Curved Backrest */}
          <path d="M -16 -12 Q 0 -18 16 -12" fill="none" stroke="#94a3b8" strokeWidth="3" />
        </g>
        <text x={fW / 2} y={fD - 6} fill="#cbd5e1" fontSize="7" fontWeight="bold" textAnchor="middle" pointerEvents="none">
          {item.name}
        </text>
      </g>
    );
  }

  // =========================================================================
  // 7. BATHROOM: TOILET, SHOWER, WASHBASIN
  // =========================================================================
  if (item.type === 'toilet') {
    return (
      <g>
        {/* Cistern Tank */}
        <rect x="4" y="2" width={fW - 8} height={fD * 0.32} rx="3" fill="#f8fafc" stroke={strokeColor} strokeWidth={strokeW} />
        {/* Dual Flush Chrome Button */}
        <circle cx={fW / 2 - 3} cy={fD * 0.16} r="2.5" fill="#cbd5e1" stroke="#475569" strokeWidth="0.8" />
        <circle cx={fW / 2 + 3} cy={fD * 0.16} r="2.5" fill="#cbd5e1" stroke="#475569" strokeWidth="0.8" />
        {/* Toilet Oval Bowl */}
        <ellipse cx={fW / 2} cy={fD * 0.64} rx={fW * 0.36} ry={fD * 0.32} fill="#ffffff" stroke={strokeColor} strokeWidth={strokeW} />
        <ellipse cx={fW / 2} cy={fD * 0.64} rx={fW * 0.22} ry={fD * 0.2} fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
        <text x={fW / 2} y={fD - 4} fill="#0f172a" fontSize="7.5" fontWeight="bold" textAnchor="middle" pointerEvents="none">
          Kloset
        </text>
      </g>
    );
  }

  if (item.type === 'shower') {
    return (
      <g>
        {/* Shower Floor Pan */}
        <rect x="0" y="0" width={fW} height={fD} rx="3" fill="#0f172a" stroke={strokeColor} strokeWidth={strokeW} />
        {/* Anti-slip tile diagonal hatch */}
        <line x1="0" y1="0" x2={fW} y2={fD} stroke="#334155" strokeWidth="1" strokeDasharray="3 3" />
        <line x1={fW} y1="0" x2="0" y2={fD} stroke="#334155" strokeWidth="1" strokeDasharray="3 3" />
        {/* Corner / Center Chrome Floor Drain Grate */}
        <circle cx={fW * 0.75} cy={fD * 0.25} r="6" fill="#475569" stroke="#cbd5e1" strokeWidth="1" />
        {/* Rain Shower Head with Water Spray Trajectory */}
        <g transform={`translate(${fW * 0.25}, ${fD * 0.25})`}>
          <circle cx="0" cy="0" r="10" fill="#38bdf8" fillOpacity="0.4" stroke="#0284c7" strokeWidth="1.5" />
          <circle cx="0" cy="0" r="3" fill="#0284c7" />
          {/* Water droplets */}
          <circle cx="-5" cy="5" r="1" fill="#38bdf8" />
          <circle cx="5" cy="5" r="1" fill="#38bdf8" />
          <circle cx="0" cy="7" r="1" fill="#38bdf8" />
        </g>
        {/* Glass Screen Line */}
        <line x1="0" y1={fD} x2={fW * 0.65} y2={fD} stroke="#38bdf8" strokeWidth="3" />
        <text x={fW / 2} y={fD - 6} fill="#38bdf8" fontSize="7.5" fontWeight="bold" textAnchor="middle" pointerEvents="none">
          Area Shower
        </text>
      </g>
    );
  }

  if (item.type === 'washbasin') {
    return (
      <g>
        <rect x="0" y="0" width={fW} height={fD} rx="3" fill="#1e293b" stroke={strokeColor} strokeWidth={strokeW} />
        {/* Ceramic Basin Oval */}
        <ellipse cx={fW / 2} cy={fD / 2} rx={fW * 0.36} ry={fD * 0.32} fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.2" />
        {/* Chrome Tap */}
        <circle cx={fW / 2} cy={8} r="3" fill="#cbd5e1" stroke="#475569" strokeWidth="1" />
        <line x1={fW / 2} y1="8" x2={fW / 2} y2={fD * 0.35} stroke="#94a3b8" strokeWidth="2.5" />
        {/* Drain hole */}
        <circle cx={fW / 2} cy={fD / 2} r="2.5" fill="#475569" />
        <text x={fW / 2} y={fD - 3} fill="#94a3b8" fontSize="6.5" fontWeight="bold" textAnchor="middle" pointerEvents="none">
          Wastafel
        </text>
      </g>
    );
  }

  // =========================================================================
  // 8. LAUNDRY: WASHING MACHINE, DRYER, LAUNDRY SINK
  // =========================================================================
  if (item.type === 'washing-machine') {
    return (
      <g>
        <rect x="0" y="0" width={fW} height={fD} rx="4" fill="#f8fafc" stroke={strokeColor} strokeWidth={strokeW} />
        {/* Control Dial Bar */}
        <rect x="4" y="4" width={fW - 8} height="12" rx="2" fill="#0f172a" />
        <circle cx="16" cy="10" r="3" fill="#38bdf8" />
        {/* Front Portal Round Glass with drum baffles */}
        <circle cx={fW / 2} cy={fD / 2 + 6} r={fW * 0.34} fill="#0f172a" stroke="#cbd5e1" strokeWidth="2" />
        <circle cx={fW / 2} cy={fD / 2 + 6} r={fW * 0.22} fill="#1e293b" />
        <line x1={fW / 2 - 8} y1={fD / 2 + 6} x2={fW / 2 + 8} y2={fD / 2 + 6} stroke="#64748b" strokeWidth="1.5" />
        <text x={fW / 2} y={fD - 4} fill="#0f172a" fontSize="7" fontWeight="bold" textAnchor="middle" pointerEvents="none">
          Mesin Cuci
        </text>
      </g>
    );
  }

  if (item.type === 'dryer') {
    return (
      <g>
        <rect x="0" y="0" width={fW} height={fD} rx="4" fill="#f8fafc" stroke={strokeColor} strokeWidth={strokeW} />
        <rect x="4" y="4" width={fW - 8} height="12" rx="2" fill="#0f172a" />
        <circle cx="16" cy="10" r="3" fill="#f59e0b" />
        <circle cx={fW / 2} cy={fD / 2 + 6} r={fW * 0.34} fill="#0f172a" stroke="#f59e0b" strokeWidth="1.5" />
        <text x={fW / 2} y={fD - 4} fill="#0f172a" fontSize="7" fontWeight="bold" textAnchor="middle" pointerEvents="none">
          Pengering
        </text>
      </g>
    );
  }

  if (item.type === 'laundry-sink') {
    return (
      <g>
        <rect x="0" y="0" width={fW} height={fD} rx="3" fill="#0f172a" stroke={strokeColor} strokeWidth={strokeW} />
        {/* Deep wash basin */}
        <rect x="4" y="4" width={fW - 8} height={fD - 8} rx="2" fill="#1e293b" stroke="#94a3b8" strokeWidth="1" />
        {/* Slanted washboard ribs for manual clothes scrubbing */}
        <line x1="8" y1="12" x2={fW - 8} y2="12" stroke="#64748b" strokeWidth="1.5" />
        <line x1="8" y1="18" x2={fW - 8} y2="18" stroke="#64748b" strokeWidth="1.5" />
        <line x1="8" y1="24" x2={fW - 8} y2="24" stroke="#64748b" strokeWidth="1.5" />
        <circle cx={fW / 2} cy={fD - 12} r="3" fill="#38bdf8" />
        <text x={fW / 2} y={fD - 4} fill="#94a3b8" fontSize="6.5" fontWeight="bold" textAnchor="middle" pointerEvents="none">
          Bak Cuci Manual
        </text>
      </g>
    );
  }

  // =========================================================================
  // 9. LIVING: TV CABINET, COFFEE TABLES, BOOKSHELF
  // =========================================================================
  if (item.type === 'tv-cabinet' || item.type === 'tv-wall-backdrop') {
    return (
      <g>
        {/* Credenza Base */}
        <rect x="0" y="0" width={fW} height={fD} rx="3" fill="#1e293b" stroke={strokeColor} strokeWidth={strokeW} />
        {/* Slatted Wood Panels or Drawer Bays */}
        <line x1={fW * 0.33} y1="0" x2={fW * 0.33} y2={fD} stroke="#475569" strokeWidth="1" />
        <line x1={fW * 0.66} y1="0" x2={fW * 0.66} y2={fD} stroke="#475569" strokeWidth="1" />
        {/* Ultra-thin TV Screen Outline on Stand */}
        <rect x={fW * 0.15} y={fD * 0.3} width={fW * 0.7} height="5" rx="1" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
        <circle cx={fW / 2} cy={fD * 0.55} r="4" fill="#38bdf8" />
        <text x={fW / 2} y={fD - 5} fill="#cbd5e1" fontSize="7" fontWeight="bold" textAnchor="middle" pointerEvents="none">
          TV Stand LED ({item.width}m)
        </text>
      </g>
    );
  }

  if (item.type === 'coffee-table') {
    return (
      <g>
        <rect x="0" y="0" width={fW} height={fD} rx="4" fill="#291404" stroke={strokeColor} strokeWidth={strokeW} />
        <rect x="4" y="4" width={fW - 8} height={fD - 8} rx="3" fill="#451a03" stroke="#b45309" strokeWidth="1" />
        <line x1="8" y1={fD / 2} x2={fW - 8} y2={fD / 2} stroke="#78350f" strokeWidth="1" strokeDasharray="3 2" />
        <text x={fW / 2} y={fD / 2 + 3} fill="#fef3c7" fontSize="7.5" fontWeight="bold" textAnchor="middle" pointerEvents="none">
          Coffee Table
        </text>
      </g>
    );
  }

  if (item.type === 'round-table') {
    return (
      <g>
        <circle cx={fW / 2} cy={fD / 2} r={fW / 2} fill="#291404" stroke={strokeColor} strokeWidth={strokeW} />
        <circle cx={fW / 2} cy={fD / 2} r={fW * 0.38} fill="#451a03" stroke="#b45309" strokeWidth="1" />
        <circle cx={fW / 2} cy={fD / 2} r={fW * 0.18} fill="#78350f" />
        <text x={fW / 2} y={fD / 2 + 3} fill="#fef3c7" fontSize="7.5" fontWeight="bold" textAnchor="middle" pointerEvents="none">
          Meja Bundar
        </text>
      </g>
    );
  }

  if (item.type === 'bookshelf') {
    return (
      <g>
        <rect x="0" y="0" width={fW} height={fD} rx="2" fill="#1e293b" stroke={strokeColor} strokeWidth={strokeW} />
        {/* Books lined up */}
        {Array.from({ length: Math.floor(fW / 8) }).map((_, bi) => (
          <rect
            key={bi}
            x={bi * 8 + 2}
            y="3"
            width="6"
            height={fD - 6}
            rx="1"
            fill={bi % 3 === 0 ? '#38bdf8' : (bi % 3 === 1 ? '#a855f7' : '#10b981')}
            fillOpacity="0.75"
          />
        ))}
        <text x={fW / 2} y={fD / 2 + 3} fill="#ffffff" fontSize="7" fontWeight="bold" textAnchor="middle" pointerEvents="none">
          Rak Buku
        </text>
      </g>
    );
  }

  // =========================================================================
  // 10. OUTDOOR: BENCH & PLANTER
  // =========================================================================
  if (item.type === 'outdoor-bench') {
    return (
      <g>
        <rect x="0" y="0" width={fW} height={fD} rx="3" fill="#334155" stroke={strokeColor} strokeWidth={strokeW} />
        {/* Slats of wood */}
        {[0.2, 0.4, 0.6, 0.8].map((ratio, i) => (
          <line key={i} x1="4" y1={fD * ratio} x2={fW - 4} y2={fD * ratio} stroke="#78350f" strokeWidth="2.5" />
        ))}
        <text x={fW / 2} y={fD / 2 + 3} fill="#fef3c7" fontSize="7.5" fontWeight="bold" textAnchor="middle" pointerEvents="none">
          Bangku Teras
        </text>
      </g>
    );
  }

  if (item.type === 'planter') {
    return (
      <g>
        {/* Planter Pot Base */}
        <rect x="0" y="0" width={fW} height={fD} rx="4" fill="#1c1917" stroke={strokeColor} strokeWidth={strokeW} />
        {/* Lush Green Foliage Shapes */}
        <ellipse cx={fW * 0.25} cy={fD / 2} rx="10" ry="8" fill="#10b981" />
        <ellipse cx={fW * 0.5} cy={fD / 2} rx="12" ry="9" fill="#059669" />
        <ellipse cx={fW * 0.75} cy={fD / 2} rx="10" ry="8" fill="#10b981" />
        <circle cx={fW * 0.38} cy={fD * 0.3} r="5" fill="#34d399" />
        <circle cx={fW * 0.62} cy={fD * 0.3} r="5" fill="#34d399" />
        <text x={fW / 2} y={fD - 3} fill="#a7f3d0" fontSize="6.5" fontWeight="bold" textAnchor="middle" pointerEvents="none">
          Tanaman Hijau
        </text>
      </g>
    );
  }

  // =========================================================================
  // 11. DEDICATED BUILT-IN SPECIALTIES
  // =========================================================================
  if (item.type === 'wall-cabinet') {
    return (
      <g>
        <rect x="0" y="0" width={fW} height={fD} rx="2" fill="#064e3b" stroke={strokeColor} strokeWidth={strokeW} />
        {/* 3 Glazed cabinet doors */}
        <line x1={fW * 0.33} y1="0" x2={fW * 0.33} y2={fD} stroke="#10b981" strokeWidth="1" />
        <line x1={fW * 0.66} y1="0" x2={fW * 0.66} y2={fD} stroke="#10b981" strokeWidth="1" />
        {/* Under-cabinet puck lights */}
        <circle cx={fW * 0.16} cy={fD / 2} r="3" fill="#fef08a" />
        <circle cx={fW * 0.5} cy={fD / 2} r="3" fill="#fef08a" />
        <circle cx={fW * 0.83} cy={fD / 2} r="3" fill="#fef08a" />
        <text x={fW / 2} y={fD - 3} fill="#a7f3d0" fontSize="6.5" fontWeight="bold" textAnchor="middle" pointerEvents="none">
          Kabinet Atas Dapur
        </text>
      </g>
    );
  }

  if (item.type === 'under-stair-storage') {
    return (
      <g>
        <rect x="0" y="0" width={fW} height={fD} rx="2" fill="#1e293b" stroke={strokeColor} strokeWidth={strokeW} strokeDasharray="3 2" />
        {/* Stepped pull-out drawer compartments */}
        <line x1={fW * 0.25} y1="0" x2={fW * 0.25} y2={fD} stroke="#64748b" strokeWidth="1" />
        <line x1={fW * 0.5} y1="0" x2={fW * 0.5} y2={fD} stroke="#64748b" strokeWidth="1" />
        <line x1={fW * 0.75} y1="0" x2={fW * 0.75} y2={fD} stroke="#64748b" strokeWidth="1" />
        <text x={fW / 2} y={fD / 2 + 3} fill="#cbd5e1" fontSize="7.5" fontWeight="bold" textAnchor="middle" pointerEvents="none">
          Gudang Bawah Tangga
        </text>
      </g>
    );
  }

  // =========================================================================
  // FALLBACK CLEAN CAD BOX
  // =========================================================================
  return (
    <g>
      <rect
        x="0"
        y="0"
        width={fW}
        height={fD}
        rx="4"
        fill={isSelected ? '#4338ca' : (isBuiltIn ? '#064e3b' : '#1e293b')}
        fillOpacity="0.88"
        stroke={strokeColor}
        strokeWidth={strokeW}
        strokeDasharray={item.mountType === 'recessed' ? '3 2' : 'none'}
      />
      <text
        x={fW / 2}
        y={fD / 2 + 3}
        fill={isSelected ? '#ffffff' : '#cbd5e1'}
        fontSize="8"
        fontWeight="600"
        textAnchor="middle"
        pointerEvents="none"
      >
        {item.name.length > 18 ? `${item.name.slice(0, 18)}..` : item.name}
      </text>
    </g>
  );
};

/**
 * High-fidelity 2D CAD Thumbnail Icon Component for the Furniture Library / Catalog.
 * Renders an exact SVG scaled architectural preview of any furniture item or template.
 */
export const FurnitureCadThumbnail: React.FC<{
  template: FurnitureTemplate | FurnitureItem;
  className?: string;
  size?: number;
}> = ({ template, className = 'w-14 h-14', size }) => {
  const fW = template.width * 100;
  const fD = template.depth * 100;
  const pad = 12;

  // Convert template to FurnitureItem shape for ArchitecturalFurnitureSymbol
  const mockItem: FurnitureItem = {
    id: 'thumb-' + template.type,
    roomId: 'preview',
    category: template.category,
    type: template.type,
    name: template.name,
    x: 0,
    y: 0,
    width: template.width,
    depth: template.depth,
    height: template.height,
    rotation: 0,
    mountType: template.mountType,
  };

  return (
    <div
      className={`bg-slate-900 rounded-xl flex items-center justify-center p-1 border border-slate-700/80 shadow-inner overflow-hidden shrink-0 select-none ${className}`}
      style={size ? { width: size, height: size } : undefined}
    >
      <svg
        viewBox={`${-pad} ${-pad} ${fW + pad * 2} ${fD + pad * 2}`}
        className="w-full h-full object-contain pointer-events-none"
        preserveAspectRatio="xMidYMid meet"
      >
        <ArchitecturalFurnitureSymbol item={mockItem} isSelected={false} />
      </svg>
    </div>
  );
};

interface GlassWallSymbolProps {
  x: number;
  y: number;
  width: number;
  depth: number;
  wallSide: 'north' | 'south' | 'east' | 'west';
  glassWidth?: number;
  glassHeight?: number;
  alignment?: 'left' | 'center' | 'right';
  panelCount?: number;
  hasCurtain?: boolean;
  curtainType?: 'sheer' | 'blackout';
}

/**
 * Architectural CAD Symbol for Sliding Glass Wall / Doors with Curtains
 * Supports custom Width x Height (meters) and Left / Center / Right alignment along the wall,
 * rendering the remaining span as solid masonry wall jambs.
 */
export const ArchitecturalGlassWallSymbol: React.FC<GlassWallSymbolProps> = ({
  x,
  y,
  width,
  depth,
  wallSide,
  glassWidth,
  glassHeight = 2.6,
  alignment = 'center',
  panelCount = 3,
  hasCurtain = true,
  curtainType = 'sheer',
}) => {
  const isHorizontal = wallSide === 'north' || wallSide === 'south';
  const totalSpanM = isHorizontal ? width : depth;
  const totalSpanPx = totalSpanM * 100;

  const effGlassW = Math.max(
    0.6,
    Math.min(totalSpanM, glassWidth !== undefined ? glassWidth : Number((totalSpanM * 0.8).toFixed(2)))
  );
  const effGlassH = Number((glassHeight || 2.6).toFixed(2));
  const spanPx = effGlassW * 100;
  const remainingPx = Math.max(0, totalSpanPx - spanPx);

  let offsetStartPx = 0;
  if (alignment === 'left') {
    offsetStartPx = 0;
  } else if (alignment === 'right') {
    offsetStartPx = remainingPx;
  } else {
    offsetStartPx = remainingPx / 2;
  }

  const leftWallPx = offsetStartPx;
  const rightWallPx = Math.max(0, totalSpanPx - (offsetStartPx + spanPx));
  const panelW = spanPx / panelCount;

  // Generate wavy curve path for curtain / vitrase (horizontal or vertical)
  let wavePath = '';
  const waveCount = Math.max(4, Math.floor(spanPx / 12));
  const step = spanPx / waveCount;
  for (let i = 0; i < waveCount; i++) {
    const startP = i * step;
    const midP = startP + step / 2;
    const endP = startP + step;
    const amp = i % 2 === 0 ? 4.5 : -4.5;
    if (isHorizontal) {
      if (i === 0) {
        wavePath += `M ${startP} 0 Q ${midP} ${amp} ${endP} 0`;
      } else {
        wavePath += ` Q ${midP} ${amp} ${endP} 0`;
      }
    } else {
      if (i === 0) {
        wavePath += `M 0 ${startP} Q ${amp} ${midP} 0 ${endP}`;
      } else {
        wavePath += ` Q ${amp} ${midP} 0 ${endP}`;
      }
    }
  }

  return (
    <g transform={`translate(${x * 100}, ${y * 100})`} className="pointer-events-none select-none">
      {isHorizontal ? (
        <g transform={wallSide === 'south' ? `translate(0, ${depth * 100 - 4})` : 'translate(0, 4)'}>
          {/* Solid Regular Wall Segments on Left & Right of Glass Wall */}
          {leftWallPx > 2 && (
            <rect
              x="0"
              y="-4"
              width={leftWallPx}
              height="8"
              fill="#64748b"
              stroke="#cbd5e1"
              strokeWidth="0.8"
            />
          )}
          {rightWallPx > 2 && (
            <rect
              x={offsetStartPx + spanPx}
              y="-4"
              width={rightWallPx}
              height="8"
              fill="#64748b"
              stroke="#cbd5e1"
              strokeWidth="0.8"
            />
          )}

          {/* Sliding Glass Wall Span */}
          <g transform={`translate(${offsetStartPx}, 0)`}>
            {/* Matte Black Aluminum Outer Framing Track */}
            <rect x="0" y="-3.5" width={spanPx} height="7" fill="#090d16" stroke="#38bdf8" strokeWidth="1" />
            {/* Left & Right Black Mullion Jambs */}
            <rect x="0" y="-5" width="5" height="10" fill="#0f172a" stroke="#38bdf8" strokeWidth="0.9" />
            <rect x={spanPx - 5} y="-5" width="5" height="10" fill="#0f172a" stroke="#38bdf8" strokeWidth="0.9" />

            {/* Sliding Glass Panels with Overlapping Tracks */}
            {Array.from({ length: panelCount }).map((_, idx) => {
              const pX = idx * (panelW - 4);
              const pY = idx % 2 === 0 ? -2.2 : 0.8;
              return (
                <g key={idx}>
                  <rect
                    x={pX}
                    y={pY}
                    width={Math.max(8, panelW + 3)}
                    height="2.5"
                    rx="1"
                    fill="#38bdf8"
                    stroke="#0284c7"
                    strokeWidth="0.7"
                  />
                  {/* Mullion Divider Post */}
                  <rect x={pX} y="-3.5" width="2.2" height="7" fill="#0f172a" />
                  {/* Handle mark */}
                  <rect x={pX + panelW - 4} y={pY - 0.8} width="2.5" height="4" fill="#f8fafc" />
                </g>
              );
            })}

            {/* Curtain / Vitrase Wave Drape Line inside room */}
            {hasCurtain && (
              <g transform={wallSide === 'south' ? 'translate(0, -11)' : 'translate(0, 12)'}>
                <path
                  d={wavePath}
                  fill="none"
                  stroke={curtainType === 'blackout' ? '#c084fc' : '#e0e7ff'}
                  strokeWidth="2.4"
                  opacity="0.9"
                />
              </g>
            )}

            {/* Dimension & Spec Label */}
            <text
              x={spanPx / 2}
              y={wallSide === 'south' ? (hasCurtain ? -18 : -9) : (hasCurtain ? 23 : 15)}
              fill={curtainType === 'blackout' ? '#e9d5ff' : '#7dd3fc'}
              fontSize="7"
              fontWeight="bold"
              textAnchor="middle"
            >
              KACA {effGlassW.toFixed(1)}×{effGlassH.toFixed(1)}m ({panelCount} DAUN){hasCurtain ? ` + GORDEN` : ''}
            </text>
          </g>
        </g>
      ) : (
        <g transform={wallSide === 'east' ? `translate(${width * 100 - 4}, 0)` : 'translate(4, 0)'}>
          {/* Solid Regular Wall Segments on Top & Bottom of Vertical Glass Wall */}
          {leftWallPx > 2 && (
            <rect
              x="-4"
              y="0"
              width="8"
              height={leftWallPx}
              fill="#64748b"
              stroke="#cbd5e1"
              strokeWidth="0.8"
            />
          )}
          {rightWallPx > 2 && (
            <rect
              x="-4"
              y={offsetStartPx + spanPx}
              width="8"
              height={rightWallPx}
              fill="#64748b"
              stroke="#cbd5e1"
              strokeWidth="0.8"
            />
          )}

          {/* Vertical Sliding Glass Wall Span */}
          <g transform={`translate(0, ${offsetStartPx})`}>
            {/* Vertical Framing Track */}
            <rect x="-3.5" y="0" width="7" height={spanPx} fill="#090d16" stroke="#38bdf8" strokeWidth="1" />
            <rect x="-5" y="0" width="10" height="5" fill="#0f172a" stroke="#38bdf8" strokeWidth="0.9" />
            <rect x="-5" y={spanPx - 5} width="10" height="5" fill="#0f172a" stroke="#38bdf8" strokeWidth="0.9" />

            {Array.from({ length: panelCount }).map((_, idx) => {
              const pY = idx * (panelW - 4);
              const pX = idx % 2 === 0 ? -2.2 : 0.8;
              return (
                <g key={idx}>
                  <rect
                    x={pX}
                    y={pY}
                    width="2.5"
                    height={Math.max(8, panelW + 3)}
                    rx="1"
                    fill="#38bdf8"
                    stroke="#0284c7"
                    strokeWidth="0.7"
                  />
                  {/* Mullion Divider Post */}
                  <rect x="-3.5" y={pY} width="7" height="2.2" fill="#0f172a" />
                  <rect x={pX - 0.8} y={pY + panelW - 4} width="4" height="2.5" fill="#f8fafc" />
                </g>
              );
            })}

            {/* Curtain / Vitrase Wave Drape Line inside room (Vertical) */}
            {hasCurtain && (
              <g transform={wallSide === 'east' ? 'translate(-11, 0)' : 'translate(11, 0)'}>
                <path
                  d={wavePath}
                  fill="none"
                  stroke={curtainType === 'blackout' ? '#c084fc' : '#e0e7ff'}
                  strokeWidth="2.4"
                  opacity="0.9"
                />
              </g>
            )}

            {/* Vertical Label */}
            <text
              transform={`translate(${wallSide === 'east' ? (hasCurtain ? -19 : -11) : (hasCurtain ? 20 : 12)}, ${spanPx / 2}) rotate(-90)`}
              fill={curtainType === 'blackout' ? '#e9d5ff' : '#7dd3fc'}
              fontSize="6.8"
              fontWeight="bold"
              textAnchor="middle"
            >
              KACA {effGlassW.toFixed(1)}×{effGlassH.toFixed(1)}m ({panelCount}D)
            </text>
          </g>
        </g>
      )}
    </g>
  );
};

interface SkylightSymbolProps {
  x: number;
  y: number;
  width: number;
  depth: number;
  glassTint?: string;
}

/**
 * Architectural CAD Skylight Canopy Symbol (Atap Kaca Void Belakang)
 */
export const ArchitecturalSkylightSymbol: React.FC<SkylightSymbolProps> = ({
  x,
  y,
  width,
  depth,
  glassTint = 'clear',
}) => {
  const wPx = width * 100;
  const dPx = depth * 100;
  const rafterCols = Math.max(2, Math.floor(wPx / 50));
  const rafterRows = Math.max(2, Math.floor(dPx / 50));

  return (
    <g transform={`translate(${x * 100}, ${y * 100})`} className="pointer-events-none select-none">
      {/* Translucent Tempered Glass Plane */}
      <rect
        x="6"
        y="6"
        width={wPx - 12}
        height={dPx - 12}
        rx="4"
        fill={glassTint === 'solar' ? '#0369a1' : '#0284c7'}
        fillOpacity="0.18"
        stroke="#38bdf8"
        strokeWidth="1.5"
        strokeDasharray="6 3"
      />

      {/* Structural Steel Hollow Rafters (Rangka Kisi-kisi Kaca) */}
      {Array.from({ length: rafterCols - 1 }).map((_, i) => {
        const lineX = ((i + 1) * wPx) / rafterCols;
        return (
          <line
            key={`col-${i}`}
            x1={lineX}
            y1="6"
            x2={lineX}
            y2={dPx - 6}
            stroke="#38bdf8"
            strokeWidth="1.5"
            strokeOpacity="0.6"
          />
        );
      })}

      {Array.from({ length: rafterRows - 1 }).map((_, j) => {
        const lineY = ((j + 1) * dPx) / rafterRows;
        return (
          <line
            key={`row-${j}`}
            x1="6"
            y1={lineY}
            x2={wPx - 6}
            y2={lineY}
            stroke="#38bdf8"
            strokeWidth="1.5"
            strokeOpacity="0.6"
          />
        );
      })}

      {/* Center Architectural Badge */}
      <rect
        x={wPx / 2 - 75}
        y={dPx / 2 - 11}
        width="150"
        height="22"
        rx="4"
        fill="#082f49"
        fillOpacity="0.9"
        stroke="#38bdf8"
        strokeWidth="1"
      />
      <text
        x={wPx / 2}
        y={dPx / 2 + 4}
        fill="#bae6fd"
        fontSize="8"
        fontWeight="bold"
        textAnchor="middle"
      >
        ☀️ KANOPI KACA SKYLIGHT (VOID)
      </text>
    </g>
  );
};

interface WindowSymbolProps {
  window: WindowData;
  isSelected?: boolean;
}

/**
 * Architectural CAD Window and Louver/Roster Symbol
 */
export const ArchitecturalWindowSymbol: React.FC<WindowSymbolProps> = ({ window: win, isSelected }) => {
  const wPx = win.width * 100;
  const isHorizontal = win.wallSide === 'north' || win.wallSide === 'south';
  const xPx = win.x * 100;
  const yPx = win.y * 100;

  const isRoster = win.windowType === 'roster-vent' || win.windowType === 'louver-vent';
  const isBovenlicht = win.windowType === 'bovenlicht';

  return (
    <g transform={`translate(${xPx}, ${yPx})`} className="cursor-pointer select-none">
      {isHorizontal ? (
        <>
          {/* Wall Cutout Jambs */}
          <rect x="-3" y="-5" width="6" height="10" fill="#e2e8f0" stroke="#0f172a" strokeWidth="1" />
          <rect x={wPx - 3} y="-5" width="6" height="10" fill="#e2e8f0" stroke="#0f172a" strokeWidth="1" />

          {/* Sill Line */}
          <line x1="0" y1="4" x2={wPx} y2="4" stroke="#94a3b8" strokeWidth="1" />

          {isRoster ? (
            /* Louver / Roster Hatching */
            Array.from({ length: Math.floor(wPx / 12) }).map((_, i) => (
              <line key={i} x1={i * 12 + 4} y1="-4" x2={i * 12 + 10} y2="4" stroke="#ea580c" strokeWidth="1.5" />
            ))
          ) : (
            /* Glass Dual Lines */
            <>
              <line x1="0" y1="-1.5" x2={wPx} y2="-1.5" stroke={isSelected ? '#38bdf8' : '#38bdf8'} strokeWidth="2" />
              <line x1="0" y1="1.5" x2={wPx} y2="1.5" stroke={isSelected ? '#38bdf8' : '#38bdf8'} strokeWidth="2" />
            </>
          )}

          {/* Window Tag Label */}
          <rect x={wPx / 2 - 25} y="-16" width="50" height="13" rx="2" fill="#0f172a" stroke={isSelected ? '#38bdf8' : '#64748b'} strokeWidth="1" />
          <text x={wPx / 2} y="-7" fill={isRoster ? '#fdba74' : '#bae6fd'} fontSize="7" fontWeight="bold" textAnchor="middle">
            {isRoster ? 'ROSTER' : (isBovenlicht ? 'BOVEN' : 'JENDELA')} {win.width}m
          </text>
        </>
      ) : (
        <>
          {/* Vertical Wall Cutout Jambs */}
          <rect x="-5" y="-3" width="10" height="6" fill="#e2e8f0" stroke="#0f172a" strokeWidth="1" />
          <rect x="-5" y={wPx - 3} width="10" height="6" fill="#e2e8f0" stroke="#0f172a" strokeWidth="1" />

          {/* Sill Line */}
          <line x1="4" y1="0" x2="4" y2={wPx} stroke="#94a3b8" strokeWidth="1" />

          {isRoster ? (
            Array.from({ length: Math.floor(wPx / 12) }).map((_, i) => (
              <line key={i} x1="-4" y1={i * 12 + 4} x2="4" y2={i * 12 + 10} stroke="#ea580c" strokeWidth="1.5" />
            ))
          ) : (
            <>
              <line x1="-1.5" y1="0" x2="-1.5" y2={wPx} stroke={isSelected ? '#38bdf8' : '#38bdf8'} strokeWidth="2" />
              <line x1="1.5" y1="0" x2="1.5" y2={wPx} stroke={isSelected ? '#38bdf8' : '#38bdf8'} strokeWidth="2" />
            </>
          )}

          <rect x="8" y={wPx / 2 - 6} width="44" height="13" rx="2" fill="#0f172a" stroke={isSelected ? '#38bdf8' : '#64748b'} strokeWidth="1" />
          <text x="30" y={wPx / 2 + 3} fill={isRoster ? '#fdba74' : '#bae6fd'} fontSize="7" fontWeight="bold" textAnchor="middle">
            {isRoster ? 'ROSTER' : (isBovenlicht ? 'BOVEN' : 'JENDELA')}
          </text>
        </>
      )}
    </g>
  );
};

interface StaircaseSymbolProps {
  config: StaircaseConfig;
  isSelected?: boolean;
}

/**
 * Architectural CAD Staircase Symbol with Real Steps, Landing Bordes & UP Arrow
 */
export const ArchitecturalStaircaseSymbol: React.FC<StaircaseSymbolProps> = ({ config, isSelected }) => {
  const steps = generateStairSteps(config);
  const xPx = config.x * 100;
  const yPx = config.y * 100;
  const wPx = config.width * 100;
  const dPx = config.depth * 100;

  return (
    <g transform={`translate(${xPx}, ${yPx})`} className="cursor-pointer select-none">
      {/* Outer bounding envelope */}
      <rect
        x="0"
        y="0"
        width={wPx}
        height={dPx}
        fill="#1e293b"
        fillOpacity="0.4"
        stroke={isSelected ? '#38bdf8' : '#f59e0b'}
        strokeWidth={isSelected ? 2.5 : 1.8}
        strokeDasharray="4 2"
      />

      {/* Render Steps */}
      {steps.map((st) => {
        const localX = (st.x - config.x - st.width / 2) * 100;
        const localY = (st.y - config.y - st.treadDepth / 2) * 100;
        const stW = st.width * 100;
        const stD = st.treadDepth * 100;

        return (
          <rect
            key={st.index}
            x={localX}
            y={localY}
            width={stW}
            height={stD}
            fill={st.isLanding ? '#78350f' : (st.index % 2 === 0 ? '#1e293b' : '#334155')}
            stroke="#94a3b8"
            strokeWidth="0.8"
          />
        );
      })}

      {/* Directional NAIK / UP Arrow */}
      <g transform={`translate(${wPx * 0.28}, ${dPx * 0.7})`}>
        <line x1="0" y1="0" x2="0" y2="-45" stroke="#f59e0b" strokeWidth="2.5" />
        <polyline points="-5,-38 0,-48 5,-38" fill="none" stroke="#f59e0b" strokeWidth="2.5" />
        <circle cx="0" cy="0" r="3" fill="#f59e0b" />
        <text x="10" y="-20" fill="#fef3c7" fontSize="9" fontWeight="800">
          NAIK
        </text>
      </g>

      {/* Type badge */}
      <rect x="4" y="4" width={wPx - 8} height="16" rx="3" fill="#0f172a" fillOpacity="0.9" stroke="#f59e0b" strokeWidth="1" />
      <text x={wPx / 2} y="15" fill="#fef3c7" fontSize="8" fontWeight="bold" textAnchor="middle">
        TANGGA ({config.type.toUpperCase()}) • {config.numberOfSteps} STEPS
      </text>
    </g>
  );
};
