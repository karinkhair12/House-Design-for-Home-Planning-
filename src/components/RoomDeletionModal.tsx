/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Trash2, AlertTriangle, ShieldAlert, X, Armchair, DoorClosed, Check } from 'lucide-react';
import { RoomData } from '../utils/architectureData';
import { FurnitureItem } from '../utils/houseDesignStore';
import { DoorData } from '../utils/doorsAndStairs';

interface RoomDeletionModalProps {
  isOpen: boolean;
  room: RoomData | null;
  furnitureInRoom: FurnitureItem[];
  doorsInRoom: DoorData[];
  onClose: () => void;
  onConfirmDelete: (deleteAssociatedFurniture: boolean) => void;
}

export const RoomDeletionModal: React.FC<RoomDeletionModalProps> = ({
  isOpen,
  room,
  furnitureInRoom,
  doorsInRoom,
  onClose,
  onConfirmDelete,
}) => {
  if (!isOpen || !room) return null;

  const isExisting = room.status === 'existing';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-room-title"
        className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden space-y-0"
      >
        {/* Header */}
        <div className={`p-5 flex items-start justify-between border-b ${
          isExisting ? 'bg-amber-50/70 border-amber-200' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isExisting ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
            }`}>
              {isExisting ? <ShieldAlert className="w-5 h-5" /> : <Trash2 className="w-5 h-5" />}
            </div>
            <div>
              <h3 id="delete-room-title" className="text-base font-bold text-slate-900">
                Konfirmasi Hapus Ruangan
              </h3>
              <p className="text-xs text-slate-500">
                {room.indonesianName || room.name} ({room.floor === '2F' ? 'Lantai 2' : 'Lantai 1'})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup dialog"
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body content */}
        <div className="p-6 space-y-4 text-xs text-slate-600">
          {/* Room Specs badge */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <span className="font-semibold text-slate-900 block">{room.name}</span>
              <span className="text-[11px] text-slate-500 font-mono">
                Dimensi: {room.width.toFixed(2)}m × {room.depth.toFixed(2)}m • Luas: {room.area.toFixed(2)} m²
              </span>
            </div>
            <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase ${
              isExisting ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'
            }`}>
              {isExisting ? 'Bangunan Lama' : 'Ekstensi Baru'}
            </span>
          </div>

          {/* Warning for Existing Building */}
          {isExisting && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold block">Peringatan Bangunan Eksisting:</span>
                <p className="text-[11px] leading-relaxed text-amber-800">
                  Ruangan ini merupakan bagian dari denah bangunan eksisting (1 lantai). Menghapus ruangan ini berarti Anda berencana membongkar dinding bata eksisting, yang memerlukan perkuatan struktur tambahan.
                </p>
              </div>
            </div>
          )}

          {/* Dependencies: Furniture & Doors */}
          <div className="space-y-2">
            <span className="font-bold text-slate-800 block">Objek yang Terkait dengan Ruangan Ini:</span>
            
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center gap-2">
                <Armchair className="w-4 h-4 text-indigo-500 shrink-0" />
                <div>
                  <span className="font-semibold text-slate-900 block">{furnitureInRoom.length} Perabot</span>
                  <span className="text-slate-400 text-[10px]">
                    {furnitureInRoom.length > 0 ? furnitureInRoom.slice(0, 2).map(f => f.name).join(', ') + (furnitureInRoom.length > 2 ? '...' : '') : 'Tidak ada perabot'}
                  </span>
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center gap-2">
                <DoorClosed className="w-4 h-4 text-emerald-500 shrink-0" />
                <div>
                  <span className="font-semibold text-slate-900 block">{doorsInRoom.length} Pintu Akses</span>
                  <span className="text-slate-400 text-[10px]">
                    {doorsInRoom.length > 0 ? doorsInRoom.map(d => d.name).join(', ') : 'Tidak ada pintu khusus'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 italic">
            * Operasi penghapusan ini dapat dibatalkan kapan saja menggunakan tombol <strong>Undo (Ctrl+Z)</strong>.
          </p>
        </div>

        {/* Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs cursor-pointer transition-colors"
          >
            Batal
          </button>

          {furnitureInRoom.length > 0 && (
            <button
              onClick={() => onConfirmDelete(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs cursor-pointer transition-colors"
              title="Hapus ruangan namun pertahankan perabot sebagai objek bebas"
            >
              Hapus Ruang Saja (Pertahankan Perabot)
            </button>
          )}

          <button
            onClick={() => onConfirmDelete(true)}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs cursor-pointer shadow-sm transition-colors flex items-center justify-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Hapus Ruang &amp; Perabot</span>
          </button>
        </div>
      </div>
    </div>
  );
};
