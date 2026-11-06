/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { 
  Trash2, 
  Copy, 
  RotateCw, 
  Sliders, 
  Plus, 
  DoorClosed, 
  Split, 
  Lock, 
  Unlock, 
  Maximize2, 
  Edit3,
  Move,
  ArrowDownToLine,
  ArrowUpToLine,
  ArrowDown,
  ArrowUp
} from 'lucide-react';

export type ContextMenuTarget =
  | { type: 'room'; roomId: string; roomName: string; isLocked?: boolean; hasPolygon?: boolean }
  | { type: 'vertex'; roomId: string; vertexIndex: number; x: number; y: number }
  | { type: 'furniture'; furnitureId: string; furnitureName: string }
  | { type: 'canvas'; x: number; y: number };

interface ContextMenuProps {
  isOpen: boolean;
  x: number;
  y: number;
  target: ContextMenuTarget | null;
  onClose: () => void;
  onAction: (actionId: string, target: ContextMenuTarget) => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  isOpen,
  x,
  y,
  target,
  onClose,
  onAction,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleGlobalClick);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleGlobalClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !target) return null;

  // Clamp menu inside viewport
  const menuWidth = 230;
  const menuHeight = 360;
  const clampedX = Math.min(window.innerWidth - menuWidth - 10, Math.max(10, x));
  const clampedY = Math.min(window.innerHeight - menuHeight - 10, Math.max(10, y));

  const handleItemClick = (actionId: string) => {
    onAction(actionId, target);
    onClose();
  };

  return (
    <div
      ref={menuRef}
      style={{ left: `${clampedX}px`, top: `${clampedY}px` }}
      className="fixed z-50 w-60 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl shadow-2xl py-1.5 text-xs text-slate-200 animate-in fade-in zoom-in-95 duration-100 select-none"
    >
      {/* ROOM TARGET */}
      {target.type === 'room' && (
        <>
          <div className="px-3 py-1.5 border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider text-indigo-400">
            Ruangan: {target.roomName}
          </div>
          <button
            onClick={() => handleItemClick('inspect-room')}
            className="w-full text-left px-3 py-1.5 hover:bg-slate-800 flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Sliders className="w-3.5 h-3.5 text-indigo-400" />
            <span>Inspeksi Ruang &amp; Dimensi</span>
          </button>
          <button
            onClick={() => handleItemClick('edit-room-label')}
            className="w-full text-left px-3 py-1.5 hover:bg-slate-800 flex items-center gap-2 cursor-pointer transition-colors text-sky-300 hover:text-white"
          >
            <Edit3 className="w-3.5 h-3.5 text-sky-400" />
            <span>Edit Label Ruangan...</span>
          </button>
          {!target.hasPolygon && (
            <button
              onClick={() => handleItemClick('convert-to-polygon')}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-800 flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Split className="w-3.5 h-3.5 text-indigo-400" />
              <span>Ubah ke Poligon Bebas</span>
            </button>
          )}
          <button
            onClick={() => handleItemClick('add-vertex')}
            className="w-full text-left px-3 py-1.5 hover:bg-slate-800 flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>Tambah Titik Sudut</span>
          </button>
          <button
            onClick={() => handleItemClick('add-door-here')}
            className="w-full text-left px-3 py-1.5 hover:bg-slate-800 flex items-center gap-2 cursor-pointer transition-colors"
          >
            <DoorClosed className="w-3.5 h-3.5 text-teal-400" />
            <span>Pasang Pintu di Ruang Ini</span>
          </button>
          <button
            onClick={() => handleItemClick('toggle-lock-room')}
            className="w-full text-left px-3 py-1.5 hover:bg-slate-800 flex items-center gap-2 cursor-pointer transition-colors"
          >
            {target.isLocked ? <Unlock className="w-3.5 h-3.5 text-amber-400" /> : <Lock className="w-3.5 h-3.5 text-amber-400" />}
            <span>{target.isLocked ? 'Buka Kunci Geometri' : 'Kunci Geometri'}</span>
          </button>

          {/* Canva-Style Layer Ordering */}
          <div className="my-1 border-t border-slate-800" />
          <div className="px-3 py-1 text-[10px] font-bold text-slate-400">
            Urutan Layer (Canva Style)
          </div>
          <button
            onClick={() => handleItemClick('room-send-to-back')}
            className="w-full text-left px-3 py-1.5 hover:bg-slate-800 flex items-center justify-between gap-2 cursor-pointer transition-colors"
          >
            <span className="flex items-center gap-2">
              <ArrowDownToLine className="w-3.5 h-3.5 text-sky-400" />
              <span>Send to Back (Paling Belakang)</span>
            </span>
            <span className="text-[10px] font-mono text-slate-500">Ctrl+[</span>
          </button>
          <button
            onClick={() => handleItemClick('room-send-backward')}
            className="w-full text-left px-3 py-1.5 hover:bg-slate-800 flex items-center justify-between gap-2 cursor-pointer transition-colors"
          >
            <span className="flex items-center gap-2">
              <ArrowDown className="w-3.5 h-3.5 text-sky-400" />
              <span>Send Backward (Mundur 1)</span>
            </span>
            <span className="text-[10px] font-mono text-slate-500">[</span>
          </button>
          <button
            onClick={() => handleItemClick('room-bring-forward')}
            className="w-full text-left px-3 py-1.5 hover:bg-slate-800 flex items-center justify-between gap-2 cursor-pointer transition-colors"
          >
            <span className="flex items-center gap-2">
              <ArrowUp className="w-3.5 h-3.5 text-indigo-400" />
              <span>Bring Forward (Maju 1)</span>
            </span>
            <span className="text-[10px] font-mono text-slate-500">]</span>
          </button>
          <button
            onClick={() => handleItemClick('room-bring-to-front')}
            className="w-full text-left px-3 py-1.5 hover:bg-slate-800 flex items-center justify-between gap-2 cursor-pointer transition-colors"
          >
            <span className="flex items-center gap-2">
              <ArrowUpToLine className="w-3.5 h-3.5 text-indigo-400" />
              <span>Bring to Front (Paling Depan)</span>
            </span>
            <span className="text-[10px] font-mono text-slate-500">Ctrl+]</span>
          </button>

          <div className="my-1 border-t border-slate-800" />
          <button
            onClick={() => handleItemClick('delete-room')}
            className="w-full text-left px-3 py-1.5 hover:bg-rose-950/80 text-rose-400 flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
            <span>Hapus Ruangan...</span>
          </button>
        </>
      )}

      {/* VERTEX TARGET */}
      {target.type === 'vertex' && (
        <>
          <div className="px-3 py-1.5 border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider text-indigo-400">
            Titik Sudut #{target.vertexIndex + 1} ({target.x.toFixed(2)}m, {target.y.toFixed(2)}m)
          </div>
          <button
            onClick={() => handleItemClick('inspect-vertex')}
            className="w-full text-left px-3 py-1.5 hover:bg-slate-800 flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Edit Koordinat Angka</span>
          </button>
          <button
            onClick={() => handleItemClick('insert-vertex-after')}
            className="w-full text-left px-3 py-1.5 hover:bg-slate-800 flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sisipkan Titik Baru Setelah Ini</span>
          </button>
          <div className="my-1 border-t border-slate-800" />
          <button
            onClick={() => handleItemClick('delete-vertex')}
            className="w-full text-left px-3 py-1.5 hover:bg-rose-950/80 text-rose-400 flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
            <span>Hapus Titik Sudut Ini</span>
          </button>
        </>
      )}

      {/* FURNITURE TARGET */}
      {target.type === 'furniture' && (
        <>
          <div className="px-3 py-1.5 border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider text-indigo-400">
            Perabot: {target.furnitureName}
          </div>
          <button
            onClick={() => handleItemClick('rotate-furniture-90')}
            className="w-full text-left px-3 py-1.5 hover:bg-slate-800 flex items-center gap-2 cursor-pointer transition-colors"
          >
            <RotateCw className="w-3.5 h-3.5 text-indigo-400" />
            <span>Putar 90 Derajat</span>
          </button>
          <button
            onClick={() => handleItemClick('duplicate-furniture')}
            className="w-full text-left px-3 py-1.5 hover:bg-slate-800 flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Copy className="w-3.5 h-3.5 text-teal-400" />
            <span>Gandakan (Duplikat)</span>
          </button>
          <button
            onClick={() => handleItemClick('inspect-furniture')}
            className="w-full text-left px-3 py-1.5 hover:bg-slate-800 flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-300" />
            <span>Pengaturan Dimensi</span>
          </button>

          {/* Canva-Style Layer Ordering */}
          <div className="my-1 border-t border-slate-800" />
          <div className="px-3 py-1 text-[10px] font-bold text-slate-400">
            Urutan Layer (Canva Style)
          </div>
          <button
            onClick={() => handleItemClick('furn-send-to-back')}
            className="w-full text-left px-3 py-1.5 hover:bg-slate-800 flex items-center justify-between gap-2 cursor-pointer transition-colors"
          >
            <span className="flex items-center gap-2">
              <ArrowDownToLine className="w-3.5 h-3.5 text-sky-400" />
              <span>Send to Back (Paling Belakang)</span>
            </span>
            <span className="text-[10px] font-mono text-slate-500">Ctrl+[</span>
          </button>
          <button
            onClick={() => handleItemClick('furn-send-backward')}
            className="w-full text-left px-3 py-1.5 hover:bg-slate-800 flex items-center justify-between gap-2 cursor-pointer transition-colors"
          >
            <span className="flex items-center gap-2">
              <ArrowDown className="w-3.5 h-3.5 text-sky-400" />
              <span>Send Backward (Mundur 1)</span>
            </span>
            <span className="text-[10px] font-mono text-slate-500">[</span>
          </button>
          <button
            onClick={() => handleItemClick('furn-bring-forward')}
            className="w-full text-left px-3 py-1.5 hover:bg-slate-800 flex items-center justify-between gap-2 cursor-pointer transition-colors"
          >
            <span className="flex items-center gap-2">
              <ArrowUp className="w-3.5 h-3.5 text-indigo-400" />
              <span>Bring Forward (Maju 1)</span>
            </span>
            <span className="text-[10px] font-mono text-slate-500">]</span>
          </button>
          <button
            onClick={() => handleItemClick('furn-bring-to-front')}
            className="w-full text-left px-3 py-1.5 hover:bg-slate-800 flex items-center justify-between gap-2 cursor-pointer transition-colors"
          >
            <span className="flex items-center gap-2">
              <ArrowUpToLine className="w-3.5 h-3.5 text-indigo-400" />
              <span>Bring to Front (Paling Depan)</span>
            </span>
            <span className="text-[10px] font-mono text-slate-500">Ctrl+]</span>
          </button>

          <div className="my-1 border-t border-slate-800" />
          <button
            onClick={() => handleItemClick('delete-furniture')}
            className="w-full text-left px-3 py-1.5 hover:bg-rose-950/80 text-rose-400 flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
            <span>Hapus Perabot</span>
          </button>
        </>
      )}

      {/* CANVAS TARGET */}
      {target.type === 'canvas' && (
        <>
          <div className="px-3 py-1.5 border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Kanvas Denah ({target.x.toFixed(2)}m, {target.y.toFixed(2)}m)
          </div>
          <button
            onClick={() => handleItemClick('add-new-room')}
            className="w-full text-left px-3 py-1.5 hover:bg-slate-800 flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-400" />
            <span>Tambah Ruang Baru</span>
          </button>
          <button
            onClick={() => handleItemClick('activate-add-door')}
            className="w-full text-left px-3 py-1.5 hover:bg-slate-800 flex items-center gap-2 cursor-pointer transition-colors"
          >
            <DoorClosed className="w-3.5 h-3.5 text-emerald-400" />
            <span>Pasang Pintu Baru</span>
          </button>
          <button
            onClick={() => handleItemClick('reset-zoom-fit')}
            className="w-full text-left px-3 py-1.5 hover:bg-slate-800 flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset Tampilan (Fit to Screen)</span>
          </button>
        </>
      )}
    </div>
  );
};
