/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  HeartHandshake, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  X, 
  User, 
  Sliders, 
  Layers, 
  DoorClosed, 
  Armchair, 
  Bath, 
  Sparkles,
  Info
} from 'lucide-react';
import { UsabilitySimulationReport, UsabilityIssue } from '../utils/usabilitySimulator';

interface UsabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: UsabilitySimulationReport;
  avatar: { heightCm: number; shoulderWidthCm: number; standingDepthCm: number; reachRadiusCm: number };
  onUpdateAvatar: (updates: Partial<{ heightCm: number; shoulderWidthCm: number; standingDepthCm: number; reachRadiusCm: number }>) => void;
}

export const UsabilityModal: React.FC<UsabilityModalProps> = ({
  isOpen,
  onClose,
  report,
  avatar,
  onUpdateAvatar,
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  if (!isOpen) return null;

  const filteredIssues = report.issues.filter(issue => {
    if (filterCategory !== 'all' && issue.category !== filterCategory) return false;
    if (filterSeverity !== 'all' && issue.severity !== filterSeverity) return false;
    return true;
  });

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="usability-modal-title"
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] border border-slate-200 shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/80 flex items-center justify-center text-indigo-200">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="usability-modal-title" className="text-lg font-bold tracking-tight">
                  Simulasi Usabilitas &amp; Ergonomi Kehidupan Nyata
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase">
                  SNI Ergonomi
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Evaluasi ruang gerak manusia, ayun pintu lemari, tarik kursi makan, bukaan mesin cuci, dan kenyamanan sirkulasi harian.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup dialog usabilitas"
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-700">
          {/* Top Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
              <span className="text-slate-500 text-[11px] font-medium block">Skor Usabilitas Fisik</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-3xl font-black text-indigo-600">{report.overallScore}</span>
                <span className="text-xs text-slate-400 font-bold">/ 100</span>
              </div>
              <span className="text-[10px] text-emerald-600 font-semibold mt-1">
                {report.overallScore >= 85 ? 'Sangat Ergonomis' : 'Cukup Nyaman'}
              </span>
            </div>

            <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200 flex flex-col justify-between">
              <span className="text-emerald-800 text-[11px] font-medium block">Akses Leluasa (Optimal)</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-3xl font-black text-emerald-600">{report.passedChecks}</span>
                <span className="text-xs text-emerald-700 font-bold">titik</span>
              </div>
              <span className="text-[10px] text-emerald-700">Bukaan 100% bebas hambatan</span>
            </div>

            <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200 flex flex-col justify-between">
              <span className="text-amber-800 text-[11px] font-medium block">Perhatian (Cukup)</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-3xl font-black text-amber-600">{report.warningChecks}</span>
                <span className="text-xs text-amber-700 font-bold">titik</span>
              </div>
              <span className="text-[10px] text-amber-700">Bisa lewat dengan memiringkan badan</span>
            </div>

            <div className="bg-rose-50/60 p-4 rounded-xl border border-rose-200 flex flex-col justify-between">
              <span className="text-rose-800 text-[11px] font-medium block">Benturan Fisik (Konflik)</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-3xl font-black text-rose-600">{report.conflictChecks}</span>
                <span className="text-xs text-rose-700 font-bold">titik</span>
              </div>
              <span className="text-[10px] text-rose-700">
                {report.conflictChecks === 0 ? 'Nol Benturan Fisik' : 'Perlu digeser/dirotasi'}
              </span>
            </div>
          </div>

          {/* Configurable Human Scale Reference */}
          <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-600" />
                <span className="font-bold text-slate-900 text-xs">
                  Model Dimensi Tubuh Manusia (Standar Antropometri Indonesia)
                </span>
              </div>
              <span className="text-[10px] text-slate-500 italic">
                *Dapat diatur untuk pengujian clearance lansia / kursi roda
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
              <div>
                <label className="text-slate-500 block mb-1">Tinggi Badan</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    value={avatar.heightCm}
                    onChange={(e) => onUpdateAvatar({ heightCm: parseInt(e.target.value) || 165 })}
                    className="w-full px-2.5 py-1 rounded-lg border border-slate-300 bg-white font-mono font-bold"
                  />
                  <span className="text-slate-400">cm</span>
                </div>
              </div>

              <div>
                <label className="text-slate-500 block mb-1">Lebar Bahu</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    value={avatar.shoulderWidthCm}
                    onChange={(e) => onUpdateAvatar({ shoulderWidthCm: parseInt(e.target.value) || 50 })}
                    className="w-full px-2.5 py-1 rounded-lg border border-slate-300 bg-white font-mono font-bold"
                  />
                  <span className="text-slate-400">cm</span>
                </div>
              </div>

              <div>
                <label className="text-slate-500 block mb-1">Kedalaman Berdiri</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    value={avatar.standingDepthCm}
                    onChange={(e) => onUpdateAvatar({ standingDepthCm: parseInt(e.target.value) || 45 })}
                    className="w-full px-2.5 py-1 rounded-lg border border-slate-300 bg-white font-mono font-bold"
                  />
                  <span className="text-slate-400">cm</span>
                </div>
              </div>

              <div>
                <label className="text-slate-500 block mb-1">Jangkauan Tangan</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    value={avatar.reachRadiusCm}
                    onChange={(e) => onUpdateAvatar({ reachRadiusCm: parseInt(e.target.value) || 65 })}
                    className="w-full px-2.5 py-1 rounded-lg border border-slate-300 bg-white font-mono font-bold"
                  />
                  <span className="text-slate-400">cm</span>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700 text-xs">Kategori:</span>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium cursor-pointer"
              >
                <option value="all">Semua Kategori ({report.issues.length})</option>
                <option value="wardrobe">Lemari &amp; Laci Pakaian</option>
                <option value="door">Daun Pintu &amp; Ayunan</option>
                <option value="dining">Meja Makan &amp; Kursi</option>
                <option value="laundry">Area Cuci &amp; Servis</option>
                <option value="bathroom">Kamar Mandi &amp; Kloset</option>
                <option value="circulation">Sirkulasi Koridor</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-700 text-xs mr-1">Status:</span>
              <button
                onClick={() => setFilterSeverity('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                  filterSeverity === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setFilterSeverity('good')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                  filterSeverity === 'good' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                Leluasa
              </button>
              <button
                onClick={() => setFilterSeverity('warning')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                  filterSeverity === 'warning' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                Perhatian
              </button>
              <button
                onClick={() => setFilterSeverity('conflict')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                  filterSeverity === 'conflict' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                Benturan
              </button>
            </div>
          </div>

          {/* Issues List */}
          <div className="space-y-3">
            {filteredIssues.map((issue) => (
              <div
                key={issue.id}
                className={`p-4 rounded-xl border transition-all ${
                  issue.severity === 'good'
                    ? 'bg-white border-slate-200 hover:border-emerald-300'
                    : issue.severity === 'warning'
                    ? 'bg-amber-50/50 border-amber-200'
                    : 'bg-rose-50/60 border-rose-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {issue.severity === 'good' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                      {issue.severity === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-600" />}
                      {issue.severity === 'conflict' && <XCircle className="w-4 h-4 text-rose-600" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">{issue.title}</h4>
                      <p className="text-slate-600 text-[11px] mt-0.5 leading-relaxed">{issue.description}</p>
                      
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-[10px] text-slate-500">
                        <span>Lokasi: <strong>{issue.location}</strong></span>
                        <span>•</span>
                        <span>Clearance Terukur: <strong>{issue.clearanceActualCm} cm</strong></span>
                        <span>•</span>
                        <span>Standar Ideal: <strong>{issue.clearanceRequiredCm} cm</strong></span>
                      </div>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${
                    issue.severity === 'good'
                      ? 'bg-emerald-100 text-emerald-800'
                      : issue.severity === 'warning'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}>
                    {issue.severity === 'good' ? 'Optimal' : (issue.severity === 'warning' ? 'Perhatian' : 'Benturan')}
                  </span>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-indigo-700 flex items-center gap-1.5 font-medium">
                  <Info className="w-3.5 h-3.5 shrink-0" />
                  <span>Saran: {issue.recommendation}</span>
                </div>
              </div>
            ))}

            {filteredIssues.length === 0 && (
              <div className="text-center py-8 text-slate-400">
                Tidak ada temuan usabilitas untuk filter yang dipilih.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs cursor-pointer shadow-sm transition-colors"
          >
            Tutup Simulasi
          </button>
        </div>
      </div>
    </div>
  );
};
