/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  X, 
  Heart, 
  MessageSquare, 
  CheckCircle2, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  Edit3, 
  Sparkles, 
  ShieldCheck, 
  MapPin, 
  Smile, 
  Coffee, 
  Sun, 
  Compass, 
  Clock, 
  HelpCircle,
  Check
} from 'lucide-react';
import { 
  HouseDesignState, 
  FamilyNoteItem, 
  MomChecklistItem, 
  DEFAULT_FAMILY_NOTES, 
  DEFAULT_MOM_CHECKLIST 
} from '../utils/houseDesignStore';
import { RoomData } from '../utils/architectureData';
import { EvaluationItem } from '../utils/designEvaluator';

interface FamilyFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  workingDesign: HouseDesignState;
  setWorkingDesign: React.Dispatch<React.SetStateAction<HouseDesignState>>;
  allRooms: RoomData[];
  lintEvaluations?: EvaluationItem[];
  onStartPinningMode?: () => void;
  defaultTab?: 'notes' | 'checklist' | 'linting';
}

const QUICK_NOTE_PRESETS = [
  {
    category: 'dapur' as const,
    label: 'Tinggi Kompor Nyaman',
    text: 'Tinggi meja kompor dibuat 80 cm agar tangan tidak pegal saat memasak, kabinet atas tidak terlalu tinggi agar mudah diraih.',
    priority: 'harus-ada' as const,
  },
  {
    category: 'ventilasi' as const,
    label: 'Jemuran Sinar Pagi',
    text: 'Area jemur pakaian dan mesin cuci wajib dapat sinar matahari pagi dan ventilasi silang agar pakaian cepat kering tanpa apek.',
    priority: 'harus-ada' as const,
  },
  {
    category: 'ibadah' as const,
    label: 'Area Sholat & Mukena',
    text: 'Sediakan sudut tenang selebar minimal 1 meter yang bersih untuk menggelar sajadah dan lemari mukena/Al-Qur\'an tertutup.',
    priority: 'diinginkan' as const,
  },
  {
    category: 'keamanan' as const,
    label: 'Lantai Kamar Mandi Kasar',
    text: 'Gunakan keramik bertekstur kasar anti-licin dan sediakan pegangan aman (handgrip) dekat kloset dan area shower.',
    priority: 'harus-ada' as const,
  },
  {
    category: 'penyimpanan' as const,
    label: 'Gudang Bawah Tangga',
    text: 'Manfaatkan rongga bawah tangga untuk lemari sepatu keluarga, koper, dan sapu/alat kebersihan.',
    priority: 'diinginkan' as const,
  },
];

export const FamilyFeedbackModal: React.FC<FamilyFeedbackModalProps> = ({
  isOpen,
  onClose,
  workingDesign,
  setWorkingDesign,
  allRooms,
  lintEvaluations = [],
  onStartPinningMode,
  defaultTab = 'notes',
}) => {
  const [activeTab, setActiveTab] = useState<'notes' | 'checklist' | 'linting'>(defaultTab);

  // Form state for adding a new note
  const [isAddingNote, setIsAddingNote] = useState<boolean>(false);
  const [newAuthor, setNewAuthor] = useState<string>('Ibu');
  const [newRoomId, setNewRoomId] = useState<string>(allRooms[0]?.id || 'kitchen_main');
  const [newCategory, setNewCategory] = useState<FamilyNoteItem['category']>('dapur');
  const [newPriority, setNewPriority] = useState<FamilyNoteItem['priority']>('harus-ada');
  const [newNoteText, setNewNoteText] = useState<string>('');
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  // Active filter
  const [authorFilter, setAuthorFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  if (!isOpen) return null;

  const notes = workingDesign.familyNotes || DEFAULT_FAMILY_NOTES;
  const checklist = workingDesign.momChecklist || DEFAULT_MOM_CHECKLIST;

  const filteredNotes = notes.filter(n => {
    if (authorFilter !== 'all' && n.author !== authorFilter) return false;
    if (categoryFilter !== 'all' && n.category !== categoryFilter) return false;
    return true;
  });

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    const targetRoom = allRooms.find(r => r.id === newRoomId);
    const roomCenterX = targetRoom ? targetRoom.x + targetRoom.width / 2 : 4.5;
    const roomCenterY = targetRoom ? targetRoom.y + targetRoom.depth / 2 : 5.5;

    const newNote: FamilyNoteItem = {
      id: `note-${Date.now()}`,
      roomId: newRoomId,
      roomName: targetRoom ? (targetRoom.indonesianName || targetRoom.name) : 'Ruangan Rumah',
      floor: targetRoom?.floor || 'GF',
      author: newAuthor,
      category: newCategory,
      priority: newPriority,
      note: newNoteText.trim(),
      x: roomCenterX,
      y: roomCenterY,
      status: 'pending',
      createdAt: new Date().toISOString().slice(0, 10),
    };

    setWorkingDesign(prev => ({
      ...prev,
      lastModified: new Date().toISOString().slice(0, 10),
      familyNotes: [newNote, ...(prev.familyNotes || [])],
    }));

    setNewNoteText('');
    setIsAddingNote(false);
    triggerNotice('Catatan berhasil ditambahkan dan disematkan ke ruangan!');
  };

  const handleDeleteNote = (noteId: string) => {
    setWorkingDesign(prev => ({
      ...prev,
      lastModified: new Date().toISOString().slice(0, 10),
      familyNotes: (prev.familyNotes || []).filter(n => n.id !== noteId),
    }));
    triggerNotice('Catatan telah dihapus.');
  };

  const handleToggleStatus = (noteId: string) => {
    setWorkingDesign(prev => ({
      ...prev,
      lastModified: new Date().toISOString().slice(0, 10),
      familyNotes: (prev.familyNotes || []).map(n => {
        if (n.id !== noteId) return n;
        const nextStatus = n.status === 'pending' ? 'didiskusikan' : n.status === 'didiskusikan' ? 'diterapkan' : 'pending';
        return { ...n, status: nextStatus };
      }),
    }));
  };

  const handleUpdateChecklistOption = (itemId: string, selectedOption: string) => {
    setWorkingDesign(prev => ({
      ...prev,
      lastModified: new Date().toISOString().slice(0, 10),
      momChecklist: (prev.momChecklist || DEFAULT_MOM_CHECKLIST).map(item => {
        if (item.id !== itemId) return item;
        return { ...item, selectedOption, isCompleted: true };
      }),
    }));
  };

  const handleUpdateChecklistNote = (itemId: string, note: string) => {
    setWorkingDesign(prev => ({
      ...prev,
      lastModified: new Date().toISOString().slice(0, 10),
      momChecklist: (prev.momChecklist || DEFAULT_MOM_CHECKLIST).map(item => {
        if (item.id !== itemId) return item;
        return { ...item, note };
      }),
    }));
  };

  const triggerNotice = (msg: string) => {
    setSaveNotice(msg);
    setTimeout(() => setSaveNotice(null), 3000);
  };

  // Critical and high lint issues
  const criticalLintIssues = lintEvaluations.filter(e => e.severity === 'critical');
  const warningLintIssues = lintEvaluations.filter(e => e.severity === 'high' || e.severity === 'medium');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">Catatan &amp; Masukan Ibu (Keluarga)</h2>
                <span className="text-xs text-rose-600 font-semibold px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200">
                  {notes.length} Catatan Aktif
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Aspirasi kebiasaan harian keluarga, checklist dapur &amp; sanitasi, serta penjelasan kaidah denah dalam bahasa sehari-hari.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
            aria-label="Tutup dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-slate-200 bg-white flex items-center gap-4">
          <button
            onClick={() => setActiveTab('notes')}
            className={`py-3.5 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'notes'
                ? 'border-rose-600 text-rose-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Catatan Ruangan Ibu ({notes.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('checklist')}
            className={`py-3.5 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'checklist'
                ? 'border-rose-600 text-rose-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Checklist Kebutuhan Ibu ({checklist.filter(c => c.isCompleted).length}/{checklist.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('linting')}
            className={`py-3.5 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'linting'
                ? 'border-rose-600 text-rose-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Penjelasan Kaidah Arsitektur ({criticalLintIssues.length + warningLintIssues.length} Isu)</span>
          </button>
        </div>

        {/* Action Notice Toast */}
        {saveNotice && (
          <div className="bg-emerald-50 border-b border-emerald-200 text-emerald-800 px-6 py-2 text-xs flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{saveNotice}</span>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: NOTES LIST & CREATION */}
          {activeTab === 'notes' && (
            <div className="space-y-6">
              {/* Top Banner & Quick Actions */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-rose-50/60 border border-rose-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <Smile className="w-4 h-4 text-rose-500" />
                    Beri Tahu Arsitek Apa yang Paling Nyaman untuk Ibu
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Catatan ini akan otomatis menempel di denah ruangan 2D sebagai pin yang bisa diklik.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {onStartPinningMode && (
                    <button
                      onClick={() => {
                        onClose();
                        onStartPinningMode();
                      }}
                      className="px-3.5 py-2 text-xs font-semibold text-rose-700 bg-white border border-rose-200 rounded-lg hover:bg-rose-50 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      <span>Klik Ruangan di Denah</span>
                    </button>
                  )}
                  <button
                    onClick={() => setIsAddingNote(!isAddingNote)}
                    className="px-3.5 py-2 text-xs font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-500 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isAddingNote ? 'Tutup Formulir' : 'Tulis Catatan Baru'}</span>
                  </button>
                </div>
              </div>

              {/* Add Note Form */}
              {isAddingNote && (
                <form onSubmit={handleAddNote} className="p-5 rounded-xl border border-slate-200 bg-slate-50 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <span className="text-xs font-bold text-slate-800">Formulir Masukan Baru</span>
                    <span className="text-[11px] text-slate-500">Pilih inspirasi cepat atau ketik sendiri</span>
                  </div>

                  {/* Preset Quick Chips */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">
                      Pilihan Cepat Masukan Ibu (Klik untuk otomatis isi):
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {QUICK_NOTE_PRESETS.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setNewCategory(preset.category);
                            setNewPriority(preset.priority);
                            setNewNoteText(preset.text);
                          }}
                          className="px-2.5 py-1 text-xs bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-300 rounded-md transition-colors cursor-pointer"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Pemberi Masukan
                      </label>
                      <select
                        value={newAuthor}
                        onChange={(e) => setNewAuthor(e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-rose-500"
                      >
                        <option value="Ibu">Ibu (Prioritas Kenyamanan Rumah)</option>
                        <option value="Ayah">Ayah</option>
                        <option value="Anak">Anak</option>
                        <option value="Keluarga">Diskusi Bersama</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Target Ruangan
                      </label>
                      <select
                        value={newRoomId}
                        onChange={(e) => setNewRoomId(e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-rose-500"
                      >
                        {allRooms.map(room => (
                          <option key={room.id} value={room.id}>
                            {room.indonesianName || room.name} ({room.floor === '2F' ? 'Lantai 2' : 'Lantai 1'})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Tingkat Kebutuhan
                      </label>
                      <select
                        value={newPriority}
                        onChange={(e) => setNewPriority(e.target.value as FamilyNoteItem['priority'])}
                        className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-rose-500"
                      >
                        <option value="harus-ada">Harus Ada (Wajib untuk Kenyamanan)</option>
                        <option value="diinginkan">Sangat Diinginkan</option>
                        <option value="opsional">Opsional (Jika Anggaran Cukup)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Isi Catatan / Harapan Ibu
                    </label>
                    <textarea
                      rows={3}
                      value={newNoteText}
                      onChange={(e) => setNewNoteText(e.target.value)}
                      placeholder="Contoh: Meja kompor jangan mepet tembok kiri, sediakan colokan listrik di meja makan untuk rice cooker..."
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-rose-500 placeholder:text-slate-400"
                      required
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingNote(false)}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-500 cursor-pointer shadow-xs"
                    >
                      Simpan &amp; Tempel di Ruangan
                    </button>
                  </div>
                </form>
              )}

              {/* Filters */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700">Filter Penulis:</span>
                  {['all', 'Ibu', 'Ayah', 'Keluarga'].map(a => (
                    <button
                      key={a}
                      onClick={() => setAuthorFilter(a)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                        authorFilter === a
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {a === 'all' ? 'Semua' : a}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span>Menampilkan {filteredNotes.length} dari {notes.length} catatan</span>
                </div>
              </div>

              {/* Notes List */}
              <div className="space-y-3">
                {filteredNotes.length === 0 ? (
                  <div className="text-center py-12 px-4 rounded-xl border border-dashed border-slate-200">
                    <Heart className="w-8 h-8 text-rose-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-700">Belum Ada Catatan Keluarga</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Keluarga dan Ibu dapat menuliskan catatan tentang tinggi meja, sirkulasi jemuran, atau tempat sajadah.
                    </p>
                    <button
                      onClick={() => setIsAddingNote(true)}
                      className="mt-4 px-4 py-2 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                    >
                      Tulis Catatan Pertama
                    </button>
                  </div>
                ) : (
                  filteredNotes.map(note => {
                    const statusColor = note.status === 'diterapkan' 
                      ? 'text-emerald-700 bg-emerald-50 border-emerald-200' 
                      : note.status === 'didiskusikan'
                        ? 'text-blue-700 bg-blue-50 border-blue-200'
                        : 'text-amber-700 bg-amber-50 border-amber-200';

                    const priorityLabel = note.priority === 'harus-ada'
                      ? 'Prioritas Wajib'
                      : note.priority === 'diinginkan'
                        ? 'Sangat Diinginkan'
                        : 'Opsional';

                    return (
                      <div
                        key={note.id}
                        className="p-4 rounded-xl border border-slate-200 bg-white hover:border-rose-200 transition-colors shadow-xs space-y-2.5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900 flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-rose-500" />
                              {note.roomName || 'Ruangan'}
                            </span>
                            <span className="text-slate-300" aria-hidden="true">·</span>
                            <span className="text-xs text-slate-600">Dari: <strong>{note.author}</strong></span>
                            <span className="text-slate-300" aria-hidden="true">·</span>
                            <span className="text-xs text-slate-500">{priorityLabel}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggleStatus(note.id)}
                              className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border cursor-pointer ${statusColor}`}
                              title="Klik untuk ubah status implementasi"
                            >
                              {note.status === 'diterapkan' ? '✓ Sudah Diterapkan' : note.status === 'didiskusikan' ? 'Sedang Didiskusikan' : 'Belum Ditindaklanjuti'}
                            </button>
                            <button
                              onClick={() => handleDeleteNote(note.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                              title="Hapus catatan"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                          {note.note}
                        </p>

                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                          <span>Kategori: {note.category}</span>
                          <span>Dicatat: {note.createdAt}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 2: MOM'S STRUCTURED CHECKLIST */}
          {activeTab === 'checklist' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-3">
                <Sun className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-xs font-bold text-slate-900">
                    Kuesioner Kenyamanan Rumah Tinggal untuk Ibu
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Pilih opsi yang paling cocok dengan kebiasaan sehari-hari Ibu di rumah. Jawaban otomatis tersimpan dan menjadi panduan arsitek dalam menyempurnakan denah.
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                {checklist.map((item, index) => (
                  <div
                    key={item.id}
                    className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center">
                          {index + 1}
                        </span>
                        <div>
                          <span className="text-[11px] font-semibold text-rose-600 uppercase tracking-wide">
                            {item.category}
                          </span>
                          <h4 className="text-xs font-bold text-slate-900">
                            {item.question}
                          </h4>
                        </div>
                      </div>
                      {item.isCompleted && (
                        <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Terisi
                        </span>
                      )}
                    </div>

                    {/* Options */}
                    <div className="grid grid-cols-1 gap-2 pt-1">
                      {item.options.map((opt, optIdx) => {
                        const isSelected = item.selectedOption === opt;
                        return (
                          <button
                            key={optIdx}
                            type="button"
                            onClick={() => handleUpdateChecklistOption(item.id, opt)}
                            className={`p-3 text-left rounded-lg border text-xs font-medium transition-all cursor-pointer flex items-center justify-between ${
                              isSelected
                                ? 'bg-rose-50 border-rose-300 text-rose-900 shadow-xs'
                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                            }`}
                          >
                            <span>{opt}</span>
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                              isSelected ? 'border-rose-600 bg-rose-600 text-white' : 'border-slate-300'
                            }`}>
                              {isSelected && <Check className="w-2.5 h-2.5" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Additional Note */}
                    <div className="pt-2">
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                        Catatan Khusus Tambahan Ibu (Opsional):
                      </label>
                      <input
                        type="text"
                        value={item.note || ''}
                        onChange={(e) => handleUpdateChecklistNote(item.id, e.target.value)}
                        placeholder="Contoh: Sediakan stop kontak di dekat meja saji..."
                        className="w-full text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-rose-500 placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: PLAIN LANGUAGE ARCHITECTURAL LINTING GUIDE */}
          {activeTab === 'linting' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-slate-900 text-white flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-xs font-bold text-white">
                    Apa yang Sedang Diperiksa oleh Architectural Linting?
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                    Sistem ini bekerja seperti <em>pemeriksa otomatis</em> yang memastikan rumah 9×11 meter Anda tidak hanya indah di gambar, tetapi aman tidak retak saat dibangun dan nyaman ditinggali 7 anggota keluarga.
                  </p>
                </div>
              </div>

              {/* Current Status Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className={`p-4 rounded-xl border ${
                  criticalLintIssues.length > 0 ? 'bg-red-50 border-red-200 text-red-900' : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}>
                  <div className="flex items-center gap-2">
                    {criticalLintIssues.length > 0 ? (
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    )}
                    <span className="text-xs font-bold">Isu Kritis Struktur: {criticalLintIssues.length}</span>
                  </div>
                  <p className="text-[11px] mt-1 text-slate-600">
                    {criticalLintIssues.length > 0
                      ? 'Ada ruangan lantai 2 yang menindih atap lama atau melewati batas kavling 9×11m.'
                      : 'Bagus! Struktur lantai 2 mandiri dan tidak menindih bangunan lama.'}
                  </p>
                </div>

                <div className={`p-4 rounded-xl border ${
                  warningLintIssues.length > 0 ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}>
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-bold">Catatan Efisiensi &amp; Sirkulasi: {warningLintIssues.length}</span>
                  </div>
                  <p className="text-[11px] mt-1 text-slate-600">
                    {warningLintIssues.length > 0
                      ? 'Terdapat ruangan sempit (< 1.2m) atau sirkulasi pintu yang perlu dicek.'
                      : 'Seluruh ruangan memenuhi ukuran ergonomis minimal rumah tinggal.'}
                  </p>
                </div>
              </div>

              {/* Explanations List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-900">Penjelasan Masalah yang Terdeteksi di Denah Saat Ini:</h4>
                {lintEvaluations.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">Tidak ada masalah yang terdeteksi.</p>
                ) : (
                  lintEvaluations.map((item, idx) => {
                    const isCrit = item.severity === 'critical';
                    const isWarn = item.severity === 'high' || item.severity === 'medium';

                    return (
                      <div
                        key={item.id || idx}
                        className={`p-4 rounded-xl border text-xs space-y-1.5 ${
                          isCrit 
                            ? 'bg-red-50/50 border-red-200' 
                            : isWarn 
                              ? 'bg-amber-50/50 border-amber-200' 
                              : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`font-bold ${isCrit ? 'text-red-700' : isWarn ? 'text-amber-800' : 'text-slate-700'}`}>
                            {item.title}
                          </span>
                          <span className="text-[10px] uppercase font-semibold text-slate-500">
                            {item.category}
                          </span>
                        </div>
                        <p className="text-slate-600 leading-relaxed">{item.explanation}</p>
                        <div className="text-indigo-900 font-medium bg-white/70 p-2 rounded-md border border-slate-200/50 mt-1">
                          <strong>Saran Perbaikan:</strong> {item.suggestedSolution}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Griya 9×11 • Modul Aspirasi &amp; Catatan Keluarga</span>
          <button
            onClick={onClose}
            className="px-4 py-2 font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Selesai &amp; Kembali ke Denah
          </button>
        </div>
      </div>
    </div>
  );
};
