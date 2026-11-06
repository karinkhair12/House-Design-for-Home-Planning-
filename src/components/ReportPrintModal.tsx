/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Printer, 
  X, 
  Building2, 
  ShieldCheck, 
  FileText, 
  CheckCircle2, 
  MapPin, 
  Calendar,
  Layers,
  Calculator
} from 'lucide-react';
import { 
  EXISTING_ROOMS, 
  RECOMMENDED_GROUND_FLOOR_ROOMS, 
  RECOMMENDED_SECOND_FLOOR_ROOMS, 
  SITE_BOUNDARY 
} from '../utils/architectureData';
import { calculateRabTotals, CONSTRUCTION_PHASES } from '../utils/costEstimator';
import { HouseDesignState } from '../utils/houseDesignStore';

interface ReportPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  design?: HouseDesignState;
}

export const ReportPrintModal: React.FC<ReportPrintModalProps> = ({
  isOpen,
  onClose,
  design,
}) => {
  if (!isOpen) return null;

  const rab = calculateRabTotals(8, design);
  const formatIdr = (val: number) => 'Rp ' + Math.round(val).toLocaleString('id-ID');

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
        {/* Modal Controls Bar */}
        <div className="no-print sticky top-0 bg-slate-900 text-white px-6 py-4 flex items-center justify-between z-20 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-400" />
            <span className="font-bold text-sm">Dokumen Desain Arsitektur &amp; Laporan Lengkap</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer shadow transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Simpan PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-8 sm:p-12 space-y-8 text-slate-800">
          {/* Header Title Sheet */}
          <div className="border-b-2 border-slate-900 pb-6 flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <span className="text-xs font-mono font-bold tracking-widest text-indigo-600 uppercase">
                LAPORAN KONSEPTUAL ARSITEKTUR &amp; STRUKTUR INDONESIA
              </span>
              <h1 className="text-3xl font-extrabold text-slate-900 mt-1">
                Griya 9×11: Renovasi &amp; Ekstensi 2 Lantai
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Lokasi: Indonesia • Luas Lahan: 99 m² (9.00m × 11.00m) • Kapasitas: 7 Jiwa (6 Kamar Tidur)
              </p>
            </div>

            <div className="text-right text-xs text-slate-600 shrink-0">
              <span className="block font-bold text-slate-900">Status Dokumen: FINAL CONCEPT</span>
              <span className="block text-slate-500">Tanggal: November 2026</span>
              <span className="inline-block mt-1 px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                SNI TROPIS APPROVED
              </span>
            </div>
          </div>

          {/* Section A & Summary */}
          <div className="space-y-3">
            <h2 className="text-base font-bold text-slate-900 border-l-4 border-indigo-600 pl-3">
              1. Ringkasan Eksekutif &amp; Batasan Kritis Struktur
            </h2>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2 leading-relaxed">
              <p>
                <strong>Batasan Pondasi Eksisting:</strong> Pondasi bangunan lama (KT 1, KT 2, dan RK) tidak dirancang untuk menahan beban lantai dua. 
                Oleh karena itu, area ini <em>tetap dipertahankan 1 lantai</em> dengan atap mandiri. 
                Dilarang meletakkan kamar tidur atau beban plat cor beton baru di atas atap lama.
              </p>
              <p>
                <strong>Zona Ekstensi 2 Lantai:</strong> Seluruh lantai 2 dibangun mandiri di atas lajur kanan selebar 3 meter dan lajur carport depan 
                menggunakan sistem 8 titik pondasi cakar ayam (footplate 80×80 cm), kolom K1 20×20 cm, dan balok B1 20×35 cm.
              </p>
              <p>
                <strong>Bebas Asap Rokok di KT 1:</strong> Balkon merokok tamu diletakkan di lantai 2 sisi kanan depan, berjarak lebih dari 6.0 meter 
                dari bukaan jendela KT 1 di sisi kiri bawah, sehingga asap terbuang ke jalan depan tanpa mengkontaminasi kamar tidur.
              </p>
            </div>
          </div>

          {/* Section D: Room Schedule Table */}
          <div className="space-y-3">
            <h2 className="text-base font-bold text-slate-900 border-l-4 border-indigo-600 pl-3">
              2. Daftar Ruangan &amp; Ukuran Bersih (Clear Dimensions)
            </h2>
            <table className="min-w-full text-xs text-left divide-y divide-slate-200 border border-slate-200">
              <thead className="bg-slate-100 font-semibold text-slate-700">
                <tr>
                  <th className="p-2">Ruang</th>
                  <th className="p-2">Lantai</th>
                  <th className="p-2">Ukuran Bersih</th>
                  <th className="p-2">Luas</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Bukaan &amp; Ventilasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[...RECOMMENDED_GROUND_FLOOR_ROOMS, ...RECOMMENDED_SECOND_FLOOR_ROOMS].map((r) => (
                  <tr key={r.id}>
                    <td className="p-2 font-semibold text-slate-900">{r.name}</td>
                    <td className="p-2 font-bold">{r.floor}</td>
                    <td className="p-2 font-mono">{r.clearWidth.toFixed(2)}m × {r.clearDepth.toFixed(2)}m</td>
                    <td className="p-2 font-mono font-bold text-indigo-700">{r.area.toFixed(2)} m²</td>
                    <td className="p-2 capitalize">{r.status === 'existing' ? 'Lama' : 'Baru'}</td>
                    <td className="p-2 text-slate-500">{r.ventilation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Section G: Financial Summary */}
          <div className="space-y-3 print-page-break">
            <h2 className="text-base font-bold text-slate-900 border-l-4 border-indigo-600 pl-3">
              3. Estimasi Anggaran Biaya (RAB) &amp; 4 Fase Kerja
            </h2>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block">Total RAB Paket Menengah (Standard SNI):</span>
                <span className="text-lg font-bold font-mono text-indigo-700 mt-1 block">
                  {formatIdr(rab.totalMidRange)}
                </span>
                <span className="text-slate-500 block mt-1">Biaya per m²: {formatIdr(rab.ratePerM2MidRange)} / m²</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block">Total RAB Paket Ekonomis:</span>
                <span className="text-lg font-bold font-mono text-slate-800 mt-1 block">
                  {formatIdr(rab.totalEconomy)}
                </span>
                <span className="text-slate-500 block mt-1">Biaya per m²: {formatIdr(rab.ratePerM2Economy)} / m²</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-4 text-xs">
              {CONSTRUCTION_PHASES.map((p) => (
                <div key={p.phase} className="p-3 rounded-lg border border-slate-200 bg-white">
                  <span className="font-bold text-indigo-600 block">Fase {p.phase} ({p.durationWeeks} Mgg)</span>
                  <span className="font-semibold text-slate-900 block mt-1">{p.titleIndonesian}</span>
                  <span className="font-mono text-slate-600 block mt-1">{formatIdr(p.costMidRangeIdr)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Family Notes & Mom's Requirements */}
          {design?.familyNotes && design.familyNotes.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-base font-bold text-slate-900 border-l-4 border-rose-500 pl-3">
                4. Aspirasi &amp; Catatan Khusus Keluarga (Ibu)
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {design.familyNotes.map((note) => (
                  <div key={note.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                    <div className="flex items-center justify-between font-semibold text-slate-900">
                      <span>{note.roomName || 'Ruangan'}</span>
                      <span className="text-[10px] text-rose-600 uppercase font-bold">{note.author}</span>
                    </div>
                    <p className="text-slate-600 mt-1 leading-relaxed text-[11px]">{note.note}</p>
                    <div className="mt-1 text-[10px] text-slate-400">
                      Prioritas: {note.priority === 'harus-ada' ? 'Wajib' : 'Diinginkan'} • Status: {note.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Signoff & Notes */}
          <div className="pt-8 border-t border-slate-200 flex justify-between items-end text-xs text-slate-500">
            <div>
              <p>Perencana Arsitektur &amp; Struktur: Tim Konsultan Desain Residensial</p>
              <p className="mt-1">Diverifikasi untuk: Bapak/Ibu Pemilik Rumah (Homeowner &amp; Decision Maker)</p>
            </div>
            <div className="text-right">
              <p className="font-mono">GRIYA-9X11-REV-FINAL</p>
              <p className="mt-1">Halaman 1 dari 1 (Ringkasan Komprehensif)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
