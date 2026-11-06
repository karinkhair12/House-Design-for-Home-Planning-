/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Building2, 
  Layers, 
  Box, 
  GitCompare, 
  Compass, 
  Calculator, 
  Printer, 
  Info, 
  ShieldAlert,
  Users,
  Maximize2
} from 'lucide-react';

export type ActiveTab = 'editor-2d' | '3d-axonometric' | 'architectural-rules' | 'comparisons' | 'cost-rab' | 'technical-diagrams' | 'site-analysis';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenPrintModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenPrintModal,
}) => {
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-lg no-print">
      {/* Top Banner / Project Identifier */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                GRIYA 9×11
                <span className="text-xs px-2 py-0.5 rounded-full font-mono font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  STUDIO INTERAKTIF
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400">
              Aplikasi Desain Arsitektur Interaktif • Lahan 99 m² (9m × 11m) • 6 Kamar Tidur • Standar SNI Tropis
            </p>
          </div>
        </div>

        {/* Quick KPI badges and Print / Action buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="hidden lg:flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-300">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>Bangunan Lama: <strong className="text-white">1 Lantai (Bebas Beban)</strong></span>
          </div>

          <div className="hidden sm:flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-300">
            <Users className="w-4 h-4 text-indigo-400" />
            <span>Kapasitas: <strong className="text-white">7 Orang (6 KT)</strong></span>
          </div>

          <button
            onClick={onOpenPrintModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition-colors cursor-pointer"
            title="Cetak Laporan Arsitektur Lengkap"
          >
            <Printer className="w-4 h-4" />
            <span>Laporan Lengkap</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-slate-950/70 border-t border-slate-800/80 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center overflow-x-auto scrollbar-none py-1 gap-1 sm:gap-2">
          <button
            onClick={() => setActiveTab('editor-2d')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'editor-2d'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>1. Studio Denah Interaktif (2D)</span>
          </button>

          <button
            onClick={() => setActiveTab('3d-axonometric')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
              activeTab === '3d-axonometric'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Box className="w-4 h-4" />
            <span>2. Model 3D Real-Time</span>
          </button>

          <button
            onClick={() => setActiveTab('architectural-rules')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'architectural-rules'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>3. Aturan Arsitektur &amp; SNI</span>
          </button>

          <button
            onClick={() => setActiveTab('comparisons')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'comparisons'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <GitCompare className="w-4 h-4" />
            <span>4. Komparasi Desain &amp; Alternatif</span>
          </button>

          <button
            onClick={() => setActiveTab('cost-rab')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'cost-rab'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>5. Simulasi Anggaran &amp; Biaya</span>
          </button>

          <button
            onClick={() => setActiveTab('technical-diagrams')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'technical-diagrams'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>6. Diagram Teknis &amp; Struktur</span>
          </button>

          <button
            onClick={() => setActiveTab('site-analysis')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'site-analysis'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Info className="w-4 h-4" />
            <span>7. Analisis Sketsa &amp; Tapak</span>
          </button>
        </div>
      </div>
    </header>
  );
};
