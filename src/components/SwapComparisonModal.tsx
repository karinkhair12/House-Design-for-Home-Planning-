/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ArrowLeftRight, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Wind, 
  Droplet, 
  DollarSign, 
  Building2, 
  Ruler, 
  Sparkles,
  ShieldCheck,
  Check
} from 'lucide-react';
import { evaluateBathroomStaircaseSwap, SwapComparisonReport } from '../utils/doorsAndStairs';
import { HouseDesignState, ALTERNATIVE_SWAPPED_STAIR_BATH, cloneDesign } from '../utils/houseDesignStore';
import { formatRupiah } from '../utils/costSimulator';

interface SwapComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyOptionBToWorking: (newDesign: HouseDesignState) => void;
}

export const SwapComparisonModal: React.FC<SwapComparisonModalProps> = ({
  isOpen,
  onClose,
  onApplyOptionBToWorking,
}) => {
  const [showConfirmStep, setShowConfirmStep] = useState<boolean>(false);
  const report: SwapComparisonReport = evaluateBathroomStaircaseSwap();

  if (!isOpen) return null;

  const handleApply = () => {
    onApplyOptionBToWorking(cloneDesign(ALTERNATIVE_SWAPPED_STAIR_BATH));
    setShowConfirmStep(false);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="swap-modal-title"
        className="bg-white rounded-2xl max-w-5xl w-full max-h-[92vh] border border-slate-200 shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/80 flex items-center justify-center text-indigo-200">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="swap-modal-title" className="text-lg font-bold tracking-tight">
                  Evaluasi Penukaran Posisi Tangga &amp; Kamar Mandi Tamu
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold uppercase">
                  Part 4 Evaluasi Alternatif
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Analisis komparatif menyeluruh: Geometri tangga, ventilasi alami KM, jalur plumbing pipa, ergonomi sirkulasi, dan selisih anggaran biaya.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup dialog perbandingan"
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Comparison Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-700">
          {/* Side by Side Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* OPTION A: CURRENT LAYOUT */}
            <div className="bg-slate-50/80 rounded-2xl border-2 border-slate-300 p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800 font-bold text-[10px] uppercase">
                    Baseline Terkunci
                  </span>
                  <h4 className="text-base font-bold text-slate-900 mt-1">{report.optionA.title}</h4>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-medium">Selisih RAB</span>
                  <strong className="text-emerald-600 font-mono text-sm">Rp 0 (Baseline)</strong>
                </div>
              </div>

              <p className="text-slate-600 text-xs leading-relaxed">{report.optionA.description}</p>

              {/* Staircase Specs */}
              <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs text-indigo-700">
                  <Ruler className="w-3.5 h-3.5" />
                  Karakteristik Tangga Utama:
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div>• Lokasi: <span className="font-semibold text-slate-800">Sisi Luar Kanan (X: 7.5m)</span></div>
                  <div>• Tapak: <span className="font-semibold text-slate-800">1.50m × 2.45m</span></div>
                  <div>• Jumlah Trap: <span className="font-semibold text-slate-800">{report.optionA.staircase.stepCount} Trap (2R+G = 64cm)</span></div>
                  <div>• Kemiringan: <span className="font-semibold text-slate-800">{report.optionA.staircase.slopeDeg}° (Aman/Nyaman)</span></div>
                </div>
                <p className="text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                  {report.optionA.staircase.structuralBeam}
                </p>
              </div>

              {/* Bathroom Specs */}
              <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs text-cyan-700">
                  <Droplet className="w-3.5 h-3.5" />
                  Kamar Mandi Tamu:
                </span>
                <div className="space-y-1 text-[11px]">
                  <div>• Luas: <strong>{report.optionA.guestBath.areaM2} m² (1.5m × 2.45m)</strong></div>
                  <div>• Ventilasi: <strong>{report.optionA.guestBath.ventilation}</strong></div>
                  <div>• Plumbing: <strong>{report.optionA.guestBath.plumbingShaft}</strong></div>
                  <div>• Privasi: <strong>{report.optionA.guestBath.guestPrivacy}</strong></div>
                </div>
              </div>

              {/* Pros & Cons */}
              <div className="space-y-2 text-[11px]">
                <span className="font-bold text-slate-800 block">Kelebihan Opsi A:</span>
                {report.optionA.pros.map((pro, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{pro}</span>
                  </div>
                ))}
                <span className="font-bold text-slate-800 block pt-1">Kelemahan Opsi A:</span>
                {report.optionA.cons.map((con, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-amber-800">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <span>{con}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* OPTION B: SWAPPED LAYOUT */}
            <div className="bg-indigo-50/40 rounded-2xl border-2 border-indigo-400 p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-indigo-100">
                <div>
                  <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-bold text-[10px] uppercase">
                    Alternatif Baru (Ventilasi Alami)
                  </span>
                  <h4 className="text-base font-bold text-slate-900 mt-1">{report.optionB.title}</h4>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-medium">Estimasi Selisih</span>
                  <strong className="text-indigo-600 font-mono text-sm">+ {formatRupiah(report.optionB.costDeltaIdr)}</strong>
                </div>
              </div>

              <p className="text-slate-600 text-xs leading-relaxed">{report.optionB.description}</p>

              {/* Staircase Specs */}
              <div className="p-3.5 bg-white rounded-xl border border-indigo-100 space-y-2">
                <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs text-indigo-700">
                  <Ruler className="w-3.5 h-3.5" />
                  Karakteristik Tangga Utama:
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div>• Lokasi: <span className="font-semibold text-slate-800">Sisi Tengah/Dalam (X: 6.0m)</span></div>
                  <div>• Tapak: <span className="font-semibold text-slate-800">1.50m × 2.45m</span></div>
                  <div>• Jumlah Trap: <span className="font-semibold text-slate-800">{report.optionB.staircase.stepCount} Trap (2R+G = 64cm)</span></div>
                  <div>• Kemiringan: <span className="font-semibold text-slate-800">{report.optionB.staircase.slopeDeg}° (Aman/Nyaman)</span></div>
                </div>
                <p className="text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                  {report.optionB.staircase.structuralBeam}
                </p>
              </div>

              {/* Bathroom Specs */}
              <div className="p-3.5 bg-white rounded-xl border border-indigo-100 space-y-2">
                <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs text-cyan-700">
                  <Wind className="w-3.5 h-3.5 text-emerald-600" />
                  Kamar Mandi Tamu (Ventilasi Luar):
                </span>
                <div className="space-y-1 text-[11px]">
                  <div>• Luas: <strong>{report.optionB.guestBath.areaM2} m² (1.5m × 2.45m)</strong></div>
                  <div>• Ventilasi: <strong className="text-emerald-700">{report.optionB.guestBath.ventilation}</strong></div>
                  <div>• Plumbing: <strong className="text-emerald-700">{report.optionB.guestBath.plumbingShaft}</strong></div>
                  <div>• Privasi: <strong>{report.optionB.guestBath.guestPrivacy}</strong></div>
                </div>
              </div>

              {/* Pros & Cons */}
              <div className="space-y-2 text-[11px]">
                <span className="font-bold text-slate-800 block">Kelebihan Opsi B:</span>
                {report.optionB.pros.map((pro, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{pro}</span>
                  </div>
                ))}
                <span className="font-bold text-slate-800 block pt-1">Kelemahan Opsi B:</span>
                {report.optionB.cons.map((con, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-amber-800">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <span>{con}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Expert Architectural Recommendation */}
          <div className="p-4 bg-slate-900 text-white rounded-xl space-y-1.5">
            <span className="font-bold flex items-center gap-1.5 text-amber-400 text-xs">
              <Sparkles className="w-4 h-4" />
              Rekomendasi Arsitektur &amp; Tim Struktur:
            </span>
            <p className="text-xs text-slate-300 leading-relaxed">
              {report.recommendation}
            </p>
          </div>
        </div>

        {/* Footer with Apply button */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          <span className="text-[11px] text-slate-500">
            * Desain Asli (Baseline) tetap tersimpan aman di sistem dan tidak akan terhapus.
          </span>
          {!showConfirmStep ? (
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs cursor-pointer transition-colors"
              >
                Tutup
              </button>
              <button
                onClick={() => setShowConfirmStep(true)}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs cursor-pointer shadow-sm transition-colors flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Terapkan Opsi B ke Denah Kerja</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 p-2 rounded-xl">
              <span className="text-xs font-medium text-indigo-900 pr-2">
                Yakin ingin menukar posisi Tangga &amp; KM Tamu pada Denah Kerja?
              </span>
              <button
                onClick={() => setShowConfirmStep(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-semibold text-xs cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleApply}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs cursor-pointer flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Ya, Terapkan Sekarang</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
