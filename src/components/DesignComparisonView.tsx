/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  GitCompare, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight,
  TrendingUp,
  Layers,
  Ruler,
  Building2,
  DollarSign,
  Copy,
  Lock,
  Unlock
} from 'lucide-react';
import { HouseDesignState, ORIGINAL_DESIGN, ALTERNATIVE_A_DESIGN, ALTERNATIVE_SWAPPED_STAIR_BATH, cloneDesign } from '../utils/houseDesignStore';
import { evaluateDesign } from '../utils/designEvaluator';
import { calculateBudgetImpact, formatRupiah } from '../utils/costSimulator';
import { SwapComparisonModal } from './SwapComparisonModal';

interface DesignComparisonViewProps {
  workingDesign: HouseDesignState;
  setWorkingDesign: (design: HouseDesignState) => void;
  savedAlternatives: HouseDesignState[];
  onLoadAlternativeToWorking: (design: HouseDesignState) => void;
  onEditAlternative?: (altId: string) => void;
}

export const DesignComparisonView: React.FC<DesignComparisonViewProps> = ({
  workingDesign,
  setWorkingDesign,
  savedAlternatives,
  onLoadAlternativeToWorking,
  onEditAlternative,
}) => {
  const [compareTargetId, setCompareTargetId] = useState<string>('working');
  const [isSwapModalOpen, setIsSwapModalOpen] = useState<boolean>(false);

  // Available comparison candidates deduplicated
  const candidateItems: { id: string; label: string; design: HouseDesignState; isBaseline?: boolean }[] = [
    { id: 'working', label: 'Denah Kerja Saat Ini (Active Working Design)', design: workingDesign },
  ];
  const seenIds = new Set<string>(['working']);

  savedAlternatives.forEach(alt => {
    if (!seenIds.has(alt.id)) {
      seenIds.add(alt.id);
      candidateItems.push({ id: alt.id, label: alt.name, design: alt });
    }
  });

  if (!seenIds.has(ALTERNATIVE_A_DESIGN.id)) {
    candidateItems.push({
      id: ALTERNATIVE_A_DESIGN.id,
      label: 'Alternatif A: Sentralisasi Tangga & KM Bawah Tangga',
      design: ALTERNATIVE_A_DESIGN,
    });
    seenIds.add(ALTERNATIVE_A_DESIGN.id);
  }

  if (!seenIds.has(ALTERNATIVE_SWAPPED_STAIR_BATH.id)) {
    candidateItems.push({
      id: ALTERNATIVE_SWAPPED_STAIR_BATH.id,
      label: 'Opsi B: Tukar Posisi Tangga & KM Tamu (Part 4)',
      design: ALTERNATIVE_SWAPPED_STAIR_BATH,
    });
    seenIds.add(ALTERNATIVE_SWAPPED_STAIR_BATH.id);
  }

  const allCandidates = candidateItems;

  const selectedCandidate = allCandidates.find(c => c.id === compareTargetId) || allCandidates[0];

  // Baseline evaluation (Original Design)
  const baselineEval = evaluateDesign(ORIGINAL_DESIGN);
  const baselineBudget = calculateBudgetImpact(ORIGINAL_DESIGN, 'economy');

  // Candidate evaluation
  const candidateEval = evaluateDesign(selectedCandidate.design);
  const candidateBudget = calculateBudgetImpact(selectedCandidate.design, 'economy');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 select-none">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-semibold text-xs tracking-wider uppercase mb-1">
            <GitCompare className="w-4 h-4" />
            <span>Fitur Komparasi Desain • Original vs Working vs Alternatif</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Komparasi Berdampingan Desain Rumah
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Bandingkan denah, skor kelayakan, resiko struktural, dan dampak anggaran antara Desain Asli yang telah disetujui dengan alternatif lainnya.
          </p>
        </div>

        {/* Alternative Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-600 shrink-0">Bandingkan dengan:</label>
          <select
            value={compareTargetId}
            onChange={(e) => setCompareTargetId(e.target.value)}
            className="bg-white border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-2 font-medium cursor-pointer focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            {allCandidates.map(c => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Banner Evaluasi Teknis Part 4: Tukar Tangga & KM Tamu */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-5 border border-slate-700 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold tracking-wider uppercase">
            <Sparkles className="w-4 h-4" />
            <span>Kajian Arsitektur Mendalam: Opsi A vs Opsi B</span>
          </div>
          <h3 className="text-base font-bold text-white">
            Evaluasi Penukaran Posisi Tangga Utama &amp; Kamar Mandi Tamu
          </h3>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Analisis komparatif 20 anak tangga (2R + G = 64 cm, kemiringan 32.7°), ventilasi alami bouvenlight vs exhaust mekanis, efisiensi jalur pipa plumbing, dan estimasi biaya delta +Rp 4.500.000.
          </p>
        </div>
        <button
          onClick={() => setIsSwapModalOpen(true)}
          className="shrink-0 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-sm transition-all flex items-center gap-2 self-start md:self-center"
        >
          <span>Buka Modal Evaluasi Opsi A vs B</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Side-by-side Score & Metric Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CARD A: ORIGINAL DESIGN (BASELINE) */}
        <div className="bg-white rounded-2xl border-2 border-slate-900 p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 uppercase flex items-center gap-1 w-fit mb-1">
                <Lock className="w-3 h-3 text-amber-500" />
                Desain Asli (Baseline Tetap)
              </span>
              <h3 className="text-lg font-bold text-slate-900">{ORIGINAL_DESIGN.name}</h3>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 font-medium block">Skor Kelayakan</span>
              <span className="text-2xl font-black text-emerald-600">{baselineEval.overallScore}</span>
              <span className="text-xs text-slate-400 font-bold"> / 100</span>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-2.5 text-xs text-center">
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[11px]">Luas Bangunan</span>
              <strong className="text-slate-900 font-mono text-sm">{baselineBudget.baselineAreaM2} m²</strong>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[11px]">Kamar Tidur</span>
              <strong className="text-slate-900 font-mono text-sm">6 Kamar</strong>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[11px]">Struktur 2F</span>
              <strong className="text-emerald-600 font-semibold text-xs">100% Aman</strong>
            </div>
          </div>

          {/* Detailed Scores */}
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-slate-100">
              <span className="text-slate-600">Fungsionalitas &amp; Ergonomi (20%):</span>
              <span className="font-bold text-slate-900 font-mono">{baselineEval.functionalityScore} / 20</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-100">
              <span className="text-slate-600">Harmoni Arsitektur (20%):</span>
              <span className="font-bold text-slate-900 font-mono">{baselineEval.harmonyScore} / 20</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-100">
              <span className="text-slate-600">Privasi &amp; Sirkulasi (20%):</span>
              <span className="font-bold text-slate-900 font-mono">{baselineEval.privacyCirculationScore} / 20</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-100">
              <span className="text-slate-600">Integritas Struktur Eksisting (25%):</span>
              <span className="font-bold text-emerald-600 font-mono">{baselineEval.structuralFeasibilityScore} / 25</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-100">
              <span className="text-slate-600">Efisiensi Biaya (15%):</span>
              <span className="font-bold text-slate-900 font-mono">{baselineEval.costEfficiencyScore} / 15</span>
            </div>
          </div>

          {/* Key Advantages */}
          <div className="space-y-1.5 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-800 block mb-1">Keunggulan Desain Awal:</span>
            {baselineEval.strengths.slice(0, 3).map((s, idx) => (
              <div key={idx} className="flex items-start gap-1.5 text-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>{s}</span>
              </div>
            ))}
          </div>

          <div className="pt-2 text-xs text-slate-500 text-center">
            Estimasi Biaya Dasar: <strong>{formatRupiah(baselineBudget.baselineCostIdr)}</strong>
          </div>
        </div>

        {/* CARD B: SELECTED COMPARISON CANDIDATE */}
        <div className={`bg-white rounded-2xl border-2 p-6 shadow-sm space-y-5 ${
          candidateEval.overallScore >= baselineEval.overallScore ? 'border-emerald-500' : 'border-indigo-400'
        }`}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-800 uppercase flex items-center gap-1 w-fit mb-1">
                <Unlock className="w-3 h-3 text-indigo-500" />
                Alternatif Pembanding
              </span>
              <h3 className="text-lg font-bold text-slate-900">{selectedCandidate.label}</h3>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 font-medium block">Skor Kelayakan</span>
              <span className={`text-2xl font-black ${
                candidateEval.overallScore >= baselineEval.overallScore ? 'text-emerald-600' : 'text-amber-600'
              }`}>
                {candidateEval.overallScore}
              </span>
              <span className="text-xs text-slate-400 font-bold"> / 100</span>
            </div>
          </div>

          {/* Quick Metrics & Deltas */}
          <div className="grid grid-cols-3 gap-2.5 text-xs text-center">
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[11px]">Luas Bangunan</span>
              <strong className="text-slate-900 font-mono text-sm">{candidateBudget.currentAreaM2} m²</strong>
              {candidateBudget.areaDeltaM2 !== 0 && (
                <span className={`block text-[10px] font-semibold ${candidateBudget.areaDeltaM2 > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  ({candidateBudget.areaDeltaM2 > 0 ? `+${candidateBudget.areaDeltaM2}` : candidateBudget.areaDeltaM2} m²)
                </span>
              )}
            </div>
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[11px]">Kamar Tidur</span>
              <strong className="text-slate-900 font-mono text-sm">
                {[...selectedCandidate.design.groundFloorRooms, ...selectedCandidate.design.secondFloorRooms].filter(r => r.id.startsWith('kt')).length} Kamar
              </strong>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[11px]">Selisih Biaya</span>
              <strong className={`font-mono text-xs block ${
                candidateBudget.costDeltaIdr === 0 ? 'text-slate-700' : (candidateBudget.costDeltaIdr > 0 ? 'text-rose-600' : 'text-emerald-600')
              }`}>
                {candidateBudget.costDeltaIdr === 0 ? 'Rp 0' : formatRupiah(candidateBudget.costDeltaIdr)}
              </strong>
            </div>
          </div>

          {/* Detailed Scores */}
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-slate-100">
              <span className="text-slate-600">Fungsionalitas &amp; Ergonomi (20%):</span>
              <span className="font-bold text-slate-900 font-mono">{candidateEval.functionalityScore} / 20</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-100">
              <span className="text-slate-600">Harmoni Arsitektur (20%):</span>
              <span className="font-bold text-slate-900 font-mono">{candidateEval.harmonyScore} / 20</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-100">
              <span className="text-slate-600">Privasi &amp; Sirkulasi (20%):</span>
              <span className="font-bold text-slate-900 font-mono">{candidateEval.privacyCirculationScore} / 20</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-100">
              <span className="text-slate-600">Integritas Struktur Eksisting (25%):</span>
              <span className={`font-bold font-mono ${candidateEval.criticalWarnings.length > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {candidateEval.structuralFeasibilityScore} / 25
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-100">
              <span className="text-slate-600">Efisiensi Biaya (15%):</span>
              <span className="font-bold text-slate-900 font-mono">{candidateEval.costEfficiencyScore} / 15</span>
            </div>
          </div>

          {/* Warnings or Highlights */}
          {candidateEval.criticalWarnings.length > 0 ? (
            <div className="space-y-1.5 text-xs bg-rose-50 p-3 rounded-xl border border-rose-200 text-rose-900">
              <span className="font-bold flex items-center gap-1.5 text-rose-700">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                Peringatan Struktural / Pelanggaran:
              </span>
              {candidateEval.criticalWarnings.map((w, idx) => (
                <p key={idx} className="text-[11px] leading-relaxed">{w}</p>
              ))}
            </div>
          ) : (
            <div className="space-y-1.5 text-xs bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-emerald-900">
              <span className="font-bold flex items-center gap-1.5 text-emerald-700">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                Status Kelayakan Aman:
              </span>
              <p className="text-[11px]">Desain memenuhi seluruh batasan struktur bebas beban dan batas sempadan tanah.</p>
            </div>
          )}

          {/* Action buttons for alternative */}
          {selectedCandidate.id !== 'working' && (
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              {onEditAlternative && (
                <button
                  onClick={() => onEditAlternative(selectedCandidate.id)}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
                  title="Lanjutkan pengeditan langsung pada snapshot alternatif ini di Studio 2D"
                >
                  <Unlock className="w-4 h-4" />
                  <span>Lanjut Edit Alternatif Ini ✏️</span>
                </button>
              )}
              <button
                onClick={() => {
                  if (window.confirm(`Muat ${selectedCandidate.label} ke dalam Studio Denah Kerja untuk diedit?`)) {
                    onLoadAlternativeToWorking(cloneDesign(selectedCandidate.design));
                  }
                }}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
              >
                <Copy className="w-4 h-4" />
                <span>Salin ke Denah Utama</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Itemized Room-by-Room Dimension & Area Comparison Table */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-600" />
          <span>Matriks Perbandingan Dimensi &amp; Luas Ruangan Lengkap</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="min-w-full text-xs text-left divide-y divide-slate-200">
            <thead className="bg-slate-50 text-slate-700 font-semibold">
              <tr>
                <th className="px-4 py-3">Nama Ruangan</th>
                <th className="px-4 py-3">Lantai</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-slate-900">Dimensi Desain Awal</th>
                <th className="px-4 py-3 text-slate-900">Luas Desain Awal</th>
                <th className="px-4 py-3 text-indigo-700">Dimensi Alternatif</th>
                <th className="px-4 py-3 text-indigo-700">Luas Alternatif</th>
                <th className="px-4 py-3">Selisih Luas (Δ m²)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {[...ORIGINAL_DESIGN.groundFloorRooms, ...ORIGINAL_DESIGN.secondFloorRooms].map(origRoom => {
                const altRoom = [...selectedCandidate.design.groundFloorRooms, ...selectedCandidate.design.secondFloorRooms].find(r => r.id === origRoom.id);
                const altWidth = altRoom ? altRoom.width : 0;
                const altDepth = altRoom ? altRoom.depth : 0;
                const altArea = altRoom ? Number((altWidth * altDepth).toFixed(2)) : 0;
                const delta = Number((altArea - origRoom.area).toFixed(2));

                return (
                  <tr key={origRoom.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-2.5 font-semibold text-slate-900">{origRoom.indonesianName.split('(')[0]}</td>
                    <td className="px-4 py-2.5">{origRoom.floor === 'GF' ? 'Lt 1' : 'Lt 2'}</td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        origRoom.status === 'existing' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {origRoom.status === 'existing' ? 'Lama' : 'Baru'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-slate-600">{origRoom.width.toFixed(2)} × {origRoom.depth.toFixed(2)}m</td>
                    <td className="px-4 py-2.5 font-mono font-semibold text-slate-900">{origRoom.area.toFixed(2)} m²</td>
                    <td className="px-4 py-2.5 font-mono text-indigo-600">
                      {altRoom ? `${altWidth.toFixed(2)} × ${altDepth.toFixed(2)}m` : 'Dihapus'}
                    </td>
                    <td className="px-4 py-2.5 font-mono font-semibold text-indigo-900">
                      {altRoom ? `${altArea.toFixed(2)} m²` : '0.00 m²'}
                    </td>
                    <td className="px-4 py-2.5 font-mono">
                      {delta === 0 ? (
                        <span className="text-slate-400">Sama</span>
                      ) : (
                        <span className={delta > 0 ? 'text-rose-600 font-bold' : 'text-emerald-600 font-bold'}>
                          {delta > 0 ? `+${delta}` : delta} m²
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Swap Staircase & Bathroom Option A vs B Modal */}
      <SwapComparisonModal
        isOpen={isSwapModalOpen}
        onClose={() => setIsSwapModalOpen(false)}
        onApplyOptionBToWorking={(newDesign) => {
          setWorkingDesign(newDesign);
          setCompareTargetId('working');
        }}
      />
    </div>
  );
};
