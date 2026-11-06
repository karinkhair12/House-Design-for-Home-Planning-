/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Header, ActiveTab } from './components/Header';
import { InteractiveFloorPlanEditor } from './components/InteractiveFloorPlanEditor';
import { ThreeDView } from './components/ThreeDView';
import { ArchitecturalRulesView } from './components/ArchitecturalRulesView';
import { DesignComparisonView } from './components/DesignComparisonView';
import { ConstructionCostView } from './components/ConstructionCostView';
import { TechnicalDiagramsView } from './components/TechnicalDiagramsView';
import { SiteAnalysisView } from './components/SiteAnalysisView';
import { ReportPrintModal } from './components/ReportPrintModal';
import { ORIGINAL_DESIGN, ALTERNATIVE_A_DESIGN, ALTERNATIVE_SWAPPED_STAIR_BATH, cloneDesign, HouseDesignState } from './utils/houseDesignStore';
import { 
  Building2, 
  ShieldCheck, 
  CheckCircle2, 
  Heart, 
  HelpCircle,
  FileText
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('editor-2d');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);

  // PERSISTENCE (Anti-Hilang Data) & CLOUD SHARE HYDRATION
  const [workingDesign, setWorkingDesign] = useState<HouseDesignState>(() => {
    // 1. Check URL share parameter first
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const sharedData = urlParams.get('familyShare') || urlParams.get('share');
      if (sharedData) {
        const decoded = JSON.parse(decodeURIComponent(escape(atob(sharedData))));
        if (decoded && decoded.groundFloorRooms) {
          return decoded as HouseDesignState;
        }
      }
    } catch (e) {
      console.warn('Could not parse share link payload:', e);
    }

    // 2. Hydrate from localStorage with coordinate verification
    try {
      const cached = localStorage.getItem('griya9x11_working_design_v3') || localStorage.getItem('griya9x11_working_design');
      if (cached) {
        const parsed = JSON.parse(cached);
        const kt2 = parsed?.groundFloorRooms?.find((r: any) => r.id === 'kt2');
        const kt1 = parsed?.groundFloorRooms?.find((r: any) => r.id === 'kt1');
        const rk = parsed?.groundFloorRooms?.find((r: any) => r.id === 'rk');
        // Validate against verified coordinates: KT2 (y: 2.5), KT1 (y: 6.0), RK (y: 3.0)
        if (parsed && parsed.groundFloorRooms && kt2?.y === 2.5 && kt1?.y === 6.0 && rk?.y === 3.0) {
          parsed.groundFloorRooms = parsed.groundFloorRooms.map((r: any) => {
            if (r.id === 'rk' && !r.openWalls) {
              return { ...r, openWalls: { north: 'solid', south: 'open', east: 'solid', west: 'solid' } };
            }
            if (r.id === 'dining_area' && !r.openWalls) {
              return { ...r, openWalls: { north: 'open', south: 'solid', east: 'solid', west: 'solid' } };
            }
            if (r.id === 'guest_room' && !r.openWalls) {
              return { ...r, openWalls: { north: 'solid', south: 'open-half-end', east: 'solid', west: 'solid' } };
            }
            if (r.id === 'stair_hall_gf' && !r.openWalls) {
              return { ...r, openWalls: { north: 'open', south: 'solid', east: 'solid', west: 'solid' } };
            }
            if (r.id === 'rear_service_yard') {
              return {
                ...r,
                floorFinish: r.floorFinish || 'grass',
                openWalls: r.openWalls || { north: 'solid', south: 'solid', west: 'solid', east: 'open' },
              };
            }
            return r;
          });
          if (Array.isArray(parsed.windows)) {
            parsed.windows = parsed.windows.filter((w: any) => w.id !== 'w-kt2-front' && w.id !== 'w-kt1-rear');
          }
          // Ensure every furniture item stays inside its relational parent room if it drifted outside
          if (Array.isArray(parsed.furniture)) {
            const allRooms = [...(parsed.groundFloorRooms || []), ...(parsed.secondFloorRooms || [])];
            parsed.furniture = parsed.furniture.map((f: any) => {
              const parent = allRooms.find((rm: any) => rm.id === f.roomId);
              if (!parent) return f;
              const isOutsideX = f.x + f.width < parent.x || f.x > parent.x + parent.width;
              const isOutsideY = f.y + f.depth < parent.y || f.y > parent.y + parent.depth;
              if (isOutsideX || isOutsideY) {
                return {
                  ...f,
                  x: Number(Math.max(parent.x + 0.1, Math.min(parent.x + parent.width - f.width - 0.1, f.x)).toFixed(2)),
                  y: Number(Math.max(parent.y + 0.1, Math.min(parent.y + parent.depth - f.depth - 0.1, f.y)).toFixed(2)),
                };
              }
              return f;
            });
          }
          return parsed as HouseDesignState;
        }
      }
    } catch (e) {
      console.warn('Could not load cached working design:', e);
    }
    return cloneDesign(ORIGINAL_DESIGN);
  });

  const [savedAlternatives, setSavedAlternatives] = useState<HouseDesignState[]>(() => {
    try {
      const cached = localStorage.getItem('griya9x11_saved_alternatives_v3') || localStorage.getItem('griya9x11_saved_alternatives');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const firstKt2 = parsed[0]?.groundFloorRooms?.find((r: any) => r.id === 'kt2');
          if (firstKt2?.y === 2.5) {
            return parsed.map((alt: any) => ({
              ...alt,
              windows: Array.isArray(alt.windows)
                ? alt.windows.filter((w: any) => w.id !== 'w-kt2-front' && w.id !== 'w-kt1-rear')
                : alt.windows,
            })) as HouseDesignState[];
          }
        }
      }
    } catch (e) {
      console.warn('Could not load cached alternatives:', e);
    }
    return [cloneDesign(ALTERNATIVE_A_DESIGN), cloneDesign(ALTERNATIVE_SWAPPED_STAIR_BATH)];
  });

  // Automatically save to localStorage on every change
  React.useEffect(() => {
    try {
      localStorage.setItem('griya9x11_working_design_v3', JSON.stringify(workingDesign));
      localStorage.setItem('griya9x11_working_design', JSON.stringify(workingDesign));
    } catch (e) {
      console.error('Failed to save working design to localStorage:', e);
    }
  }, [workingDesign]);

  React.useEffect(() => {
    try {
      localStorage.setItem('griya9x11_saved_alternatives_v3', JSON.stringify(savedAlternatives));
      localStorage.setItem('griya9x11_saved_alternatives', JSON.stringify(savedAlternatives));
    } catch (e) {
      console.error('Failed to save alternatives to localStorage:', e);
    }
  }, [savedAlternatives]);

  const [activeDesignMode, setActiveDesignMode] = useState<'original' | 'working' | 'alternative'>('working');
  const [selectedAltId, setSelectedAltId] = useState<string | null>(null);
  const [isFamilyShareLoaded, setIsFamilyShareLoaded] = useState<boolean>(() => {
    try {
      return Boolean(new URLSearchParams(window.location.search).get('familyShare') || new URLSearchParams(window.location.search).get('share'));
    } catch {
      return false;
    }
  });

  const activeDisplayDesign = activeDesignMode === 'original'
    ? ORIGINAL_DESIGN
    : (activeDesignMode === 'alternative' && selectedAltId
        ? (savedAlternatives.find(a => a.id === selectedAltId) || workingDesign)
        : workingDesign);

  const handleUpdateActiveDesign = (updater: (prev: HouseDesignState) => HouseDesignState) => {
    if (activeDesignMode === 'alternative' && selectedAltId) {
      setSavedAlternatives(prev => prev.map(alt => alt.id === selectedAltId ? updater(alt) : alt));
    } else {
      if (activeDesignMode === 'original') {
        setActiveDesignMode('working');
      }
      setWorkingDesign(updater);
    }
  };

  const handleLoadAlternativeToWorking = (altDesign: HouseDesignState) => {
    setWorkingDesign(cloneDesign(altDesign));
    setActiveDesignMode('working');
    setActiveTab('editor-2d');
  };

  const handleEditAlternative = (altId: string) => {
    if (!savedAlternatives.some(a => a.id === altId)) {
      if (altId === ALTERNATIVE_A_DESIGN.id) {
        setSavedAlternatives(prev => [...prev, cloneDesign(ALTERNATIVE_A_DESIGN)]);
      } else if (altId === ALTERNATIVE_SWAPPED_STAIR_BATH.id) {
        setSavedAlternatives(prev => [...prev, cloneDesign(ALTERNATIVE_SWAPPED_STAIR_BATH)]);
      }
    }
    setActiveDesignMode('alternative');
    setSelectedAltId(altId);
    setActiveTab('editor-2d');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation & App Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenPrintModal={() => setIsPrintModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {isFamilyShareLoaded && (
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white px-4 py-2.5 text-xs sm:text-sm font-semibold flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2 max-w-4xl">
              <span className="text-base">👨‍👩‍👧</span>
              <span>
                <strong>Mode Tautan Keluarga Aktif:</strong> Anda sedang membuka rancangan rumah bersama versi terupdate. Perubahan yang Anda simpan langsung tersimpan di browser ini!
              </span>
            </div>
            <button
              onClick={() => setIsFamilyShareLoaded(false)}
              className="ml-4 px-2.5 py-1 bg-white/20 hover:bg-white/30 rounded text-xs font-bold transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>
        )}
        {activeTab === 'editor-2d' && (
          <InteractiveFloorPlanEditor
            workingDesign={workingDesign}
            setWorkingDesign={setWorkingDesign}
            savedAlternatives={savedAlternatives}
            setSavedAlternatives={setSavedAlternatives}
            activeDesignMode={activeDesignMode}
            setActiveDesignMode={setActiveDesignMode}
            selectedAltId={selectedAltId}
            setSelectedAltId={setSelectedAltId}
          />
        )}
        {activeTab === '3d-axonometric' && (
          <ThreeDView
            design={activeDisplayDesign}
            onUpdateDesign={handleUpdateActiveDesign}
          />
        )}
        {activeTab === 'architectural-rules' && (
          <ArchitecturalRulesView design={activeDisplayDesign} />
        )}
        {activeTab === 'comparisons' && (
          <DesignComparisonView
            workingDesign={workingDesign}
            setWorkingDesign={setWorkingDesign}
            savedAlternatives={savedAlternatives}
            onLoadAlternativeToWorking={handleLoadAlternativeToWorking}
            onEditAlternative={handleEditAlternative}
          />
        )}
        {activeTab === 'cost-rab' && <ConstructionCostView design={activeDisplayDesign} />}
        {activeTab === 'technical-diagrams' && <TechnicalDiagramsView />}
        {activeTab === 'site-analysis' && <SiteAnalysisView />}
      </main>

      {/* Printable Report Modal */}
      <ReportPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        design={activeDisplayDesign}
      />

      {/* Footer */}
      <footer className="bg-slate-900 text-white border-t border-slate-800 py-8 px-4 sm:px-6 lg:px-8 no-print">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-400" />
            <span>
              <strong>GRIYA 9×11</strong> • Studio Arsitektur Interaktif &amp; Ekstensi 2 Lantai Mandiri
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Sesuai Batasan Struktural &amp; SNI Indonesia
            </span>
            <span>•</span>
            <span>Kapasitas 7 Penghuni (6 Kamar Tidur)</span>
            <span>•</span>
            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer underline"
            >
              Lihat Laporan Cetak
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
