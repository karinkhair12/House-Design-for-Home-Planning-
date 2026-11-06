/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Undo2, 
  Redo2, 
  RotateCcw, 
  Save, 
  Copy, 
  Trash2, 
  Plus, 
  Search, 
  Move, 
  Ruler, 
  Eye, 
  Layers, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  Sliders, 
  Grid, 
  Lock, 
  Unlock, 
  Building2, 
  Compass, 
  Maximize2,
  X,
  Check,
  RotateCw,
  Armchair,
  Maximize,
  Minimize,
  Split,
  Tag,
  Hand,
  MousePointer,
  DoorClosed,
  DoorOpen,
  HeartHandshake,
  ArrowLeftRight,
  ZoomIn,
  ZoomOut,
  Target,
  Edit3,
  Heart,
  MessageSquare,
  Share2,
  Smartphone,
  Download,
  Upload,
  Sun,
  Minimize2
} from 'lucide-react';
import { FamilyFeedbackModal } from './FamilyFeedbackModal';
import {
  RoomData,
  SITE_BOUNDARY,
  overlapsExistingFootprint,
  ProhibitedZoneData,
  DEFAULT_PROHIBITED_ZONE,
  WallOpeningType,
  GlassWallConfig,
  SkylightConfig,
  resolveGlassWallDimensions,
  FLOOR_FINISH_OPTIONS,
  WALL_FINISH_OPTIONS,
  ROOF_STYLE_OPTIONS,
  ROOF_MATERIAL_OPTIONS,
  ROOF_WALL_FINISH_OPTIONS,
  DEFAULT_ROOF_CONFIG,
  FloorFinishType,
  WallFinishType,
  RoofStyleType,
  RoofMaterialType,
  RoofWallFinishType,
} from '../utils/architectureData';
import { 
  HouseDesignState, 
  FurnitureItem, 
  FurnitureCategory,
  FurnitureTemplate,
  MountType,
  FURNITURE_CATALOG, 
  ORIGINAL_DESIGN, 
  cloneDesign,
  calculateRoomArea,
  calculateBuiltInCost,
  getMyCustomCatalog,
  saveToCustomCatalog,
  deleteFromCustomCatalog,
  duplicateCustomTemplate,
  DEFAULT_ROOM_ID_LABELS,
  getDynamicRoomLabel
} from '../utils/houseDesignStore';
import { 
  calculatePolygonArea, 
  boxToPolygon, 
  calculateBidirectionalResize, 
  ResizeHandleType,
  Point2D,
  deletePolygonVertex,
  setPolygonEdgeLength,
  setPolygonVertexCoordinates,
  getVertexAlignmentGuides,
  AlignmentGuide,
  validatePolygon
} from '../utils/geometryMath';
import { 
  DoorData, 
  WallSide, 
  WindowData,
  WindowType,
  StaircaseConfig,
  DEFAULT_STAIRCASE_CONFIG,
  calculateWallOpening, 
  evaluateDoorClearance 
} from '../utils/doorsAndStairs';
import { 
  ArchitecturalFurnitureSymbol, 
  ArchitecturalWindowSymbol, 
  ArchitecturalStaircaseSymbol,
  ArchitecturalGlassWallSymbol,
  ArchitecturalSkylightSymbol,
  FurnitureCadThumbnail
} from './CadArchitecturalSymbols';
import { 
  runUsabilitySimulation, 
  DEFAULT_HUMAN_AVATAR, 
  ClearanceZone 
} from '../utils/usabilitySimulator';
import { evaluateDesign, DesignScoreBreakdown } from '../utils/designEvaluator';
import { calculateBudgetImpact, formatRupiah } from '../utils/costSimulator';
import { RoomDeletionModal } from './RoomDeletionModal';
import { ContextMenu, ContextMenuTarget } from './ContextMenu';
import { UsabilityModal } from './UsabilityModal';
import { SwapComparisonModal } from './SwapComparisonModal';

interface InteractiveFloorPlanEditorProps {
  workingDesign: HouseDesignState;
  setWorkingDesign: React.Dispatch<React.SetStateAction<HouseDesignState>>;
  savedAlternatives: HouseDesignState[];
  setSavedAlternatives: React.Dispatch<React.SetStateAction<HouseDesignState[]>>;
  activeDesignMode: 'original' | 'working' | 'alternative';
  setActiveDesignMode: (mode: 'original' | 'working' | 'alternative') => void;
  selectedAltId: string | null;
  setSelectedAltId: (id: string | null) => void;
}

export const ROOM_LABEL_PRESETS = [
  'Home Office',
  'Studio',
  'Ruang Kerja & Belajar',
  'Kamar Tamu',
  'Studio Musik & Podcast',
  'Playroom Anak',
  'Walk-in Closet',
  'Ruang Hobi / Gym',
  'Mushola',
  'Perpustakaan Mini',
  'Ruang Cuci & Jemur',
  'Balkon Santai',
];

export const InteractiveFloorPlanEditor: React.FC<InteractiveFloorPlanEditorProps> = ({
  workingDesign,
  setWorkingDesign,
  savedAlternatives,
  setSavedAlternatives,
  activeDesignMode,
  setActiveDesignMode,
  selectedAltId,
  setSelectedAltId,
}) => {
  // Part 2: Floor view & layer management
  const [selectedFloor, setSelectedFloor] = useState<'GF' | '2F' | 'ALL'>('GF');
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [selectedFurnitureId, setSelectedFurnitureId] = useState<string | null>(null);
  const [selectedVertexIndex, setSelectedVertexIndex] = useState<number | null>(null);

  // Part 2.2: Category visibility toggles
  const [visibleCategories, setVisibleCategories] = useState<Set<FurnitureCategory>>(
    new Set(['bedroom', 'living', 'kitchen-dining', 'bathroom', 'laundry', 'outdoor', 'built-in'])
  );
  // Part 2.3: Room-based filtering
  const [selectedRoomFilter, setSelectedRoomFilter] = useState<string>('all');

  // Resize & Geometry mode: 'fixed-opposite' (Mode A) or 'center-based' (Mode B)
  const [resizeMode, setResizeMode] = useState<'fixed-opposite' | 'center-based'>('fixed-opposite');
  const [snapToGrid, setSnapToGrid] = useState<boolean>(true);
  const [gridSize, setGridSize] = useState<number>(0.25); // 0.25m snap
  const [showFurniture, setShowFurniture] = useState<boolean>(true);
  const [showDimensions, setShowDimensions] = useState<boolean>(true);
  const [showProhibitedZone, setShowProhibitedZone] = useState<boolean>(true);
  const [activeInspectorTab, setActiveInspectorTab] = useState<'room' | 'staircase' | 'furniture' | 'catalog' | 'custom-catalog'>('room');
  const [furnitureSearchQuery, setFurnitureSearchQuery] = useState<string>('');
  const [furnitureCategoryFilter, setFurnitureCategoryFilter] = useState<string>('all');

  // Part 5.3: Prohibited Zone selection & interactive editing
  const [isProhibitedZoneSelected, setIsProhibitedZoneSelected] = useState<boolean>(false);
  const [isDraggingProhibitedZone, setIsDraggingProhibitedZone] = useState<boolean>(false);
  const [prohibitedZoneInitialState, setProhibitedZoneInitialState] = useState<{ x: number; y: number; width: number; depth: number } | null>(null);

  // Part 4.8: My Custom Catalog state (persisted in localStorage)
  const [myCustomCatalog, setMyCustomCatalog] = useState<FurnitureTemplate[]>(() => getMyCustomCatalog());

  // Window & Staircase Selection States
  const [selectedWindowId, setSelectedWindowId] = useState<string | null>(null);
  const [selectedStaircase, setSelectedStaircase] = useState<boolean>(false);
  const [isDraggingStaircase, setIsDraggingStaircase] = useState<boolean>(false);
  const [staircaseInitialPos, setStaircaseInitialPos] = useState<{ x: number; y: number } | null>(null);

  // Undo/Redo Stacks
  const [undoStack, setUndoStack] = useState<HouseDesignState[]>([]);
  const [redoStack, setRedoStack] = useState<HouseDesignState[]>([]);

  // Dragging & Resizing States
  const [isDraggingRoom, setIsDraggingRoom] = useState<boolean>(false);
  const [isDraggingFurniture, setIsDraggingFurniture] = useState<boolean>(false);
  const [isDraggingVertex, setIsDraggingVertex] = useState<boolean>(false);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [resizeHandle, setResizeHandle] = useState<ResizeHandleType | null>(null);

  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [roomInitialState, setRoomInitialState] = useState<{ x: number; y: number; width: number; depth: number } | null>(null);
  const [furnitureInitialState, setFurnitureInitialState] = useState<{ x: number; y: number } | null>(null);
  const [vertexInitialPos, setVertexInitialPos] = useState<Point2D | null>(null);

  // Master Extension UX: Pointer Tools & Viewport Navigation
  const [editorTool, setEditorTool] = useState<'select' | 'pan'>('select');
  const [viewPan, setViewPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [viewZoom, setViewZoom] = useState<number>(1.0);
  const [isPanningViewport, setIsPanningViewport] = useState<boolean>(false);
  const isPanningViewportRef = useRef<boolean>(false);
  const panStartMouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const panStartOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isSpacePressedRef = useRef<boolean>(false);
  const isMiddlePanningRef = useRef<boolean>(false);
  const isRightDraggingRef = useRef<boolean>(false);
  const rightDragDistanceRef = useRef<number>(0);
  const suppressNextContextMenuRef = useRef<boolean>(false);

  const startViewportPan = (clientX: number, clientY: number, button: number) => {
    setIsPanningViewport(true);
    isPanningViewportRef.current = true;
    panStartMouseRef.current = { x: clientX, y: clientY };
    panStartOffsetRef.current = { ...viewPanRef.current };

    if (button === 1) {
      isMiddlePanningRef.current = true;
    }
    if (button === 2) {
      isRightDraggingRef.current = true;
      rightDragDistanceRef.current = 0;
      suppressNextContextMenuRef.current = false;
    }
  };

  // Dynamic Alignment & Inference Guides
  const [activeAlignmentGuides, setActiveAlignmentGuides] = useState<AlignmentGuide[]>([]);
  const [snapOptions, setSnapOptions] = useState({
    grid: true,
    axis: true,
    endpoints: true,
    midpoints: true,
    angle: true,
  });

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    target: ContextMenuTarget | null;
  }>({
    isOpen: false,
    x: 0,
    y: 0,
    target: null,
  });

  // Room Deletion Modal State
  const [roomToDelete, setRoomToDelete] = useState<RoomData | null>(null);

  // Door Placement & Editing States
  const [isPlacingDoor, setIsPlacingDoor] = useState<boolean>(false);
  const [selectedDoorId, setSelectedDoorId] = useState<string | null>(null);
  const [doorGhost, setDoorGhost] = useState<{ x: number; y: number; roomId: string; wallSide: WallSide } | null>(null);

  // Real-Life Usability Simulation States
  const [showUsabilityZones, setShowUsabilityZones] = useState<boolean>(false);
  const [isUsabilityModalOpen, setIsUsabilityModalOpen] = useState<boolean>(false);
  const [humanAvatar, setHumanAvatar] = useState(DEFAULT_HUMAN_AVATAR);
  const [humanAvatarPos, setHumanAvatarPos] = useState<Point2D>({ x: 4.8, y: 4.5 });
  const [isDraggingAvatar, setIsDraggingAvatar] = useState<boolean>(false);

  // Swap Comparison Modal State
  const [isSwapModalOpen, setIsSwapModalOpen] = useState<boolean>(false);

  // Add Modals
  const [isAddRoomModalOpen, setIsAddRoomModalOpen] = useState<boolean>(false);
  const [newRoomName, setNewRoomName] = useState<string>('Ruang Baru');
  const [newRoomWidth, setNewRoomWidth] = useState<number>(3.0);
  const [newRoomDepth, setNewRoomDepth] = useState<number>(3.0);
  const [saveAltModalOpen, setSaveAltModalOpen] = useState<boolean>(false);
  const [newAltName, setNewAltName] = useState<string>('Alternatif Kustom');

  // Architectural Linting & Family Feedback Hub (Hidden by default so they never block design work)
  const [isArchitecturalLintingEnabled, setIsArchitecturalLintingEnabled] = useState<boolean>(false);
  const [showFamilyNotePins, setShowFamilyNotePins] = useState<boolean>(false);
  const [showBottomReviewBar, setShowBottomReviewBar] = useState<boolean>(false);
  const [isFamilyFeedbackModalOpen, setIsFamilyFeedbackModalOpen] = useState<boolean>(false);
  const [familyFeedbackTab, setFamilyFeedbackTab] = useState<'notes' | 'checklist' | 'linting'>('notes');
  const [selectedLintPopoverRoomId, setSelectedLintPopoverRoomId] = useState<string | null>(null);
  const [selectedNotePopoverRoomId, setSelectedNotePopoverRoomId] = useState<string | null>(null);
  const [isPinningFamilyNoteMode, setIsPinningFamilyNoteMode] = useState<boolean>(false);

  // CANVA-STYLE BLOCK SELECTION & GROUP DRAG (Feedback Item 4)
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);
  const [selectedFurnitureIds, setSelectedFurnitureIds] = useState<string[]>([]);
  const [selectionMarquee, setSelectionMarquee] = useState<{
    isActive: boolean;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);
  const [isDraggingGroup, setIsDraggingGroup] = useState<boolean>(false);
  const [groupInitialPositions, setGroupInitialPositions] = useState<{
    rooms: { [id: string]: { x: number; y: number } };
    furniture: { [id: string]: { x: number; y: number } };
  } | null>(null);

  // MOBILE FULLSCREEN & TOUCH NAVIGATION (Feedback Item 5)
  const [isCanvasFullscreen, setIsCanvasFullscreen] = useState<boolean>(false);
  const touchStartRef = useRef<{
    dist: number | null;
    startPan: { x: number; y: number } | null;
    startMouse: { x: number; y: number } | null;
  }>({ dist: null, startPan: null, startMouse: null });

  // FAMILY SHARE LINK WITH MOM & BACKUP DIALOGS (Feedback Items 3 & 6)
  const [isFamilyShareModalOpen, setIsFamilyShareModalOpen] = useState<boolean>(false);
  const [shareCopyFeedback, setShareCopyFeedback] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ZOOM CONTAINMENT REFS (Feedback Item 1)
  const viewZoomRef = useRef<number>(viewZoom);
  const viewPanRef = useRef<{ x: number; y: number }>(viewPan);
  useEffect(() => {
    viewZoomRef.current = viewZoom;
  }, [viewZoom]);
  useEffect(() => {
    viewPanRef.current = viewPan;
  }, [viewPan]);

  const svgRef = useRef<SVGSVGElement | null>(null);

  // Current display design: if original mode, use ORIGINAL_DESIGN; else workingDesign or active alternative
  const currentDesign = activeDesignMode === 'original' 
    ? ORIGINAL_DESIGN 
    : (activeDesignMode === 'alternative' && selectedAltId 
        ? (savedAlternatives.find(a => a.id === selectedAltId) || workingDesign)
        : workingDesign);

  const isReadOnly = activeDesignMode === 'original';

  const roomsOnCurrentFloor = selectedFloor === 'GF' 
    ? currentDesign.groundFloorRooms 
    : (selectedFloor === '2F' 
        ? currentDesign.secondFloorRooms 
        : [...currentDesign.groundFloorRooms, ...currentDesign.secondFloorRooms]);

  const currentProhibitedZone: ProhibitedZoneData = currentDesign.prohibitedZone || DEFAULT_PROHIBITED_ZONE;
  const currentWindows: WindowData[] = currentDesign.windows || [];
  const currentStaircase: StaircaseConfig = currentDesign.staircaseConfig || DEFAULT_STAIRCASE_CONFIG;

  const selectedRoom = roomsOnCurrentFloor.find(r => r.id === selectedRoomId) || null;
  const selectedFurniture = currentDesign.furniture.find(f => f.id === selectedFurnitureId) || null;
  const selectedWindow = currentWindows.find(w => w.id === selectedWindowId) || null;

  // Dynamic Room Label input synchronization for Room Inspector
  const [roomLabelInputValue, setRoomLabelInputValue] = useState<string>('');

  useEffect(() => {
    if (selectedRoom) {
      const currentLabel = getDynamicRoomLabel(
        selectedRoom.id,
        selectedRoom,
        currentDesign.customRoomLabels
      );
      setRoomLabelInputValue(currentLabel);
    } else {
      setRoomLabelInputValue('');
    }
  }, [selectedRoomId, selectedRoom?.id, currentDesign.customRoomLabels]);

  // Real-time evaluation & budget delta
  const scoreBreakdown: DesignScoreBreakdown = evaluateDesign(currentDesign);
  const budgetImpact = calculateBudgetImpact(currentDesign, 'economy');

  // Push to Undo stack
  const pushUndoState = useCallback((prevDesign: HouseDesignState) => {
    setUndoStack(prev => [...prev.slice(-15), cloneDesign(prevDesign)]);
    setRedoStack([]);
  }, []);

  // Update active design helper: directly saves to active alternative or working design!
  const updateActiveDesign = useCallback((updater: (prev: HouseDesignState) => HouseDesignState) => {
    if (isReadOnly) return;
    pushUndoState(currentDesign);
    if (activeDesignMode === 'alternative' && selectedAltId) {
      setSavedAlternatives((prev: HouseDesignState[]) => prev.map((alt: HouseDesignState) => alt.id === selectedAltId ? updater(alt) : alt));
    } else {
      setWorkingDesign(updater);
    }
  }, [isReadOnly, currentDesign, activeDesignMode, selectedAltId, pushUndoState, setSavedAlternatives, setWorkingDesign]);

  const handleUndo = () => {
    if (undoStack.length === 0 || isReadOnly) return;
    const previous = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));
    setRedoStack(prev => [...prev, cloneDesign(currentDesign)]);
    if (activeDesignMode === 'alternative' && selectedAltId) {
      setSavedAlternatives((prev: HouseDesignState[]) => prev.map((alt: HouseDesignState) => alt.id === selectedAltId ? cloneDesign(previous) : alt));
    } else {
      setWorkingDesign(cloneDesign(previous));
    }
  };

  const handleRedo = () => {
    if (redoStack.length === 0 || isReadOnly) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack(prev => prev.slice(0, -1));
    setUndoStack(prev => [...prev, cloneDesign(currentDesign)]);
    if (activeDesignMode === 'alternative' && selectedAltId) {
      setSavedAlternatives((prev: HouseDesignState[]) => prev.map((alt: HouseDesignState) => alt.id === selectedAltId ? cloneDesign(next) : alt));
    } else {
      setWorkingDesign(cloneDesign(next));
    }
  };

  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleResetToOriginal = () => {
    pushUndoState(workingDesign);
    setWorkingDesign(cloneDesign(ORIGINAL_DESIGN));
    setActiveDesignMode('working');
    setSelectedRoomId(null);
    setSelectedFurnitureId(null);
    setSelectedDoorId(null);
    setSelectedVertexIndex(null);
    showNotification('Denah kerja berhasil di-reset kembali ke Desain Awal.');
  };

  const handleSaveAsAlternative = () => {
    if (!newAltName.trim()) return;
    const newAlt: HouseDesignState = {
      ...cloneDesign(workingDesign),
      id: `alt-${Date.now()}`,
      name: newAltName.trim(),
      description: `Disimpan pada ${new Date().toLocaleDateString('id-ID')} dengan skor ${scoreBreakdown.overallScore}/100.`,
      lastModified: new Date().toISOString(),
      isReadOnly: false,
    };
    setSavedAlternatives([...savedAlternatives, newAlt]);
    setSaveAltModalOpen(false);
    setNewAltName('');
    showNotification(`Alternatif "${newAlt.name}" berhasil disimpan ke daftar komparasi!`);
  };

  // Convert client SVG coordinates to Metres with pan & zoom support (scale: 100px = 1m)
  const getMetreCoords = (clientX: number, clientY: number): { x: number; y: number } => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    const viewBoxWidth = 1040 * viewZoom;
    const viewBoxHeight = 1240 * viewZoom;
    const scaleX = viewBoxWidth / rect.width;
    const scaleY = viewBoxHeight / rect.height;

    const svgX = viewPan.x + (clientX - rect.left) * scaleX;
    const svgY = viewPan.y + (clientY - rect.top) * scaleY;

    // Canvas padding is 70px left, 70px top, scale is 100px per meter
    const rawX = (svgX - 70) / 100;
    const rawY = (svgY - 70) / 100;

    return {
      x: snapToGrid ? Math.round(rawX / gridSize) * gridSize : rawX,
      y: snapToGrid ? Math.round(rawY / gridSize) * gridSize : rawY,
    };
  };

  // Update room property safely across floors & keep attached furniture/doors/windows in sync
  const updateRoomProperty = (roomId: string, updates: Partial<RoomData>) => {
    if (isReadOnly) return;
    updateActiveDesign(prev => {
      let actualDx = 0;
      let actualDy = 0;

      const updateList = (rooms: RoomData[]) =>
        rooms.map(r => {
          if (r.id !== roomId) return r;
          const newWidth = updates.width !== undefined ? Math.max(0.8, updates.width) : r.width;
          const newDepth = updates.depth !== undefined ? Math.max(0.8, updates.depth) : r.depth;
          const newX = updates.x !== undefined ? Math.max(0, Math.min(SITE_BOUNDARY.width - newWidth, updates.x)) : r.x;
          const newY = updates.y !== undefined ? Math.max(0, Math.min(SITE_BOUNDARY.depth - newDepth, updates.y)) : r.y;

          const roundedX = Number(newX.toFixed(2));
          const roundedY = Number(newY.toFixed(2));
          actualDx = Number((roundedX - r.x).toFixed(2));
          actualDy = Number((roundedY - r.y).toFixed(2));

          const updatedRoom = {
            ...r,
            ...updates,
            x: roundedX,
            y: roundedY,
            width: Number(newWidth.toFixed(2)),
            depth: Number(newDepth.toFixed(2)),
            clearWidth: Number((newWidth - 0.25).toFixed(2)),
            clearDepth: Number((newDepth - 0.25).toFixed(2)),
          };

          // If polygon points exist, compute polygon area; else width * depth
          updatedRoom.area = calculateRoomArea(updatedRoom);
          return updatedRoom;
        });

      const inGround = prev.groundFloorRooms.some(r => r.id === roomId);
      const inSecond = prev.secondFloorRooms.some(r => r.id === roomId);

      const nextGround = (selectedFloor === 'GF' || inGround) ? updateList(prev.groundFloorRooms) : prev.groundFloorRooms;
      const nextSecond = (selectedFloor === '2F' || inSecond) ? updateList(prev.secondFloorRooms) : prev.secondFloorRooms;

      // Maintain strict room-furniture/door/window positional relation when room moves
      const hasMoved = actualDx !== 0 || actualDy !== 0;
      const nextFurniture = hasMoved
        ? prev.furniture.map(f => {
            if (f.roomId !== roomId) return f;
            return {
              ...f,
              x: Number(Math.max(0, Math.min(SITE_BOUNDARY.width - f.width, f.x + actualDx)).toFixed(2)),
              y: Number(Math.max(0, Math.min(SITE_BOUNDARY.depth - f.depth, f.y + actualDy)).toFixed(2)),
            };
          })
        : prev.furniture;

      const nextDoors = hasMoved
        ? (prev.doors || []).map(d => {
            if (d.roomId !== roomId) return d;
            return {
              ...d,
              x: Number((d.x + actualDx).toFixed(2)),
              y: Number((d.y + actualDy).toFixed(2)),
            };
          })
        : prev.doors;

      const nextWindows = hasMoved
        ? (prev.windows || []).map(w => {
            if (w.roomId !== roomId) return w;
            return {
              ...w,
              x: Number((w.x + actualDx).toFixed(2)),
              y: Number((w.y + actualDy).toFixed(2)),
            };
          })
        : prev.windows;

      return {
        ...prev,
        groundFloorRooms: nextGround,
        secondFloorRooms: nextSecond,
        furniture: nextFurniture,
        doors: nextDoors,
        windows: nextWindows,
      };
    });
  };

  // Custom Room Label Management (Edit Label Feature)
  const handleSaveRoomLabel = (roomId: string, newLabel: string) => {
    if (isReadOnly) return;
    const trimmed = newLabel.trim();
    if (!trimmed) {
      handleResetRoomLabel(roomId);
      return;
    }

    updateActiveDesign(prev => {
      const nextCustomLabels = {
        ...(prev.customRoomLabels || {}),
        [roomId]: trimmed,
      };

      const updateList = (rooms: RoomData[]) =>
        rooms.map(r => {
          if (r.id !== roomId) return r;
          return {
            ...r,
            customLabel: trimmed,
            indonesianName: trimmed,
            name: trimmed,
          };
        });

      return {
        ...prev,
        customRoomLabels: nextCustomLabels,
        groundFloorRooms: updateList(prev.groundFloorRooms),
        secondFloorRooms: updateList(prev.secondFloorRooms),
      };
    });

    showNotification(`Label ruangan [${roomId.toUpperCase()}] diubah menjadi "${trimmed}".`);
  };

  const handleResetRoomLabel = (roomId: string) => {
    if (isReadOnly) return;
    const defaultLabel = DEFAULT_ROOM_ID_LABELS[roomId] || roomId.toUpperCase();

    updateActiveDesign(prev => {
      const nextCustomLabels = { ...(prev.customRoomLabels || {}) };
      delete nextCustomLabels[roomId];

      const updateList = (rooms: RoomData[]) =>
        rooms.map(r => {
          if (r.id !== roomId) return r;
          const { customLabel, ...rest } = r;
          return {
            ...rest,
            indonesianName: defaultLabel,
            name: defaultLabel,
          };
        });

      return {
        ...prev,
        customRoomLabels: nextCustomLabels,
        groundFloorRooms: updateList(prev.groundFloorRooms),
        secondFloorRooms: updateList(prev.secondFloorRooms),
      };
    });

    showNotification(`Label ruangan [${roomId.toUpperCase()}] dikembalikan ke standar: "${defaultLabel}".`);
  };

  // Convert room to editable polygon
  const handleConvertToPolygon = (roomId: string) => {
    if (isReadOnly) return;
    const room = [...currentDesign.groundFloorRooms, ...currentDesign.secondFloorRooms].find(r => r.id === roomId);
    if (!room) return;
    const initialPolygon = boxToPolygon(room.x, room.y, room.width, room.depth);
    updateRoomProperty(roomId, { polygonPoints: initialPolygon });
  };

  // Add vertex to polygon edge
  const handleAddVertexToRoom = (roomId: string) => {
    if (isReadOnly) return;
    const room = [...currentDesign.groundFloorRooms, ...currentDesign.secondFloorRooms].find(r => r.id === roomId);
    if (!room) return;

    const points = room.polygonPoints ? [...room.polygonPoints] : boxToPolygon(room.x, room.y, room.width, room.depth);
    if (points.length >= 2) {
      const p1 = points[0];
      const p2 = points[1];
      const midPoint = {
        x: Number(((p1.x + p2.x) / 2).toFixed(2)),
        y: Number(((p1.y + p2.y) / 2).toFixed(2)),
      };
      points.splice(1, 0, midPoint);
      updateRoomProperty(roomId, { polygonPoints: points });
      setSelectedVertexIndex(1);
    }
  };

  // Delete selected vertex from polygon (Part 1.1)
  const handleDeleteVertex = (roomId: string, index: number) => {
    if (isReadOnly) return;
    const room = [...currentDesign.groundFloorRooms, ...currentDesign.secondFloorRooms].find(r => r.id === roomId);
    if (!room || !room.polygonPoints) {
      showNotification('Ruangan ini tidak memiliki titik poligon.');
      return;
    }

    const res = deletePolygonVertex(room.polygonPoints, index);
    if (!res.success) {
      showNotification(res.message || 'Poligon minimal harus memiliki 3 titik sudut.');
      return;
    }

    updateRoomProperty(roomId, { polygonPoints: res.points });
    setSelectedVertexIndex(null);
    showNotification(`Titik sudut #${index + 1} berhasil dihapus.`);
  };

  // Move vertex handler
  const handleMouseDownOnVertex = (e: React.MouseEvent, index: number, point: Point2D) => {
    e.stopPropagation();
    if (isReadOnly) return;
    setSelectedVertexIndex(index);
    setSelectedFurnitureId(null);
    setSelectedDoorId(null);
    setSelectedWindowId(null);
    setIsDraggingVertex(true);
    const coords = getMetreCoords(e.clientX, e.clientY);
    setDragStart({ x: coords.x, y: coords.y });
    setVertexInitialPos({ ...point });
  };

  // Door operations
  const currentDoors: DoorData[] = currentDesign.doors || [];

  const updateDoorProperty = (doorId: string, updates: Partial<DoorData>) => {
    if (isReadOnly) return;
    updateActiveDesign(prev => ({
      ...prev,
      doors: (prev.doors || []).map(d => {
        if (d.id !== doorId) return d;
        const updated = { ...d, ...updates };
        // If wallSide changed or host room exists, snap to host room boundaries
        const host = [...prev.groundFloorRooms, ...prev.secondFloorRooms].find(r => r.id === updated.roomId);
        if (host && updates.wallSide) {
          if (updated.wallSide === 'north') {
            updated.y = host.y;
            updated.x = Math.max(host.x, Math.min(host.x + host.width - updated.width, updated.x));
          } else if (updated.wallSide === 'south') {
            updated.y = host.y + host.depth;
            updated.x = Math.max(host.x, Math.min(host.x + host.width - updated.width, updated.x));
          } else if (updated.wallSide === 'west') {
            updated.x = host.x;
            updated.y = Math.max(host.y, Math.min(host.y + host.depth - updated.width, updated.y));
          } else if (updated.wallSide === 'east') {
            updated.x = host.x + host.width;
            updated.y = Math.max(host.y, Math.min(host.y + host.depth - updated.width, updated.y));
          }
        }
        return updated;
      }),
    }));
  };

  const handleDeleteDoor = (doorId: string) => {
    if (isReadOnly) return;
    updateActiveDesign(prev => ({
      ...prev,
      doors: (prev.doors || []).filter(d => d.id !== doorId),
    }));
    if (selectedDoorId === doorId) setSelectedDoorId(null);
    showNotification('Pintu berhasil dihapus.');
  };

  const handlePlaceDoor = (room: RoomData, wallSide: WallSide, clickPos: { x: number; y: number }) => {
    if (isReadOnly) return;
    let doorX = clickPos.x;
    let doorY = clickPos.y;
    const doorWidth = room.id.includes('bath') ? 0.7 : 0.85;

    if (wallSide === 'north') {
      doorY = room.y;
      doorX = Math.max(room.x + 0.1, Math.min(room.x + room.width - doorWidth - 0.1, doorX));
    } else if (wallSide === 'south') {
      doorY = room.y + room.depth;
      doorX = Math.max(room.x + 0.1, Math.min(room.x + room.width - doorWidth - 0.1, doorX));
    } else if (wallSide === 'west') {
      doorX = room.x;
      doorY = Math.max(room.y + 0.1, Math.min(room.y + room.depth - doorWidth - 0.1, doorY));
    } else if (wallSide === 'east') {
      doorX = room.x + room.width;
      doorY = Math.max(room.y + 0.1, Math.min(room.y + room.depth - doorWidth - 0.1, doorY));
    }

    const newDoor: DoorData = {
      id: `door-${Date.now().toString().slice(-5)}`,
      name: `Pintu ${getDynamicRoomLabel(room.id, room, currentDesign.customRoomLabels)}`,
      roomId: room.id,
      floor: room.floor,
      wallSide,
      x: Number(doorX.toFixed(2)),
      y: Number(doorY.toFixed(2)),
      width: doorWidth,
      height: 2.1,
      doorType: 'single-swing',
      hingeSide: 'left',
      swingDirection: 'inward',
      isOpen: false,
      swingAngle: 90,
    };

    updateActiveDesign(prev => ({
      ...prev,
      doors: [...(prev.doors || []), newDoor],
    }));
    setSelectedDoorId(newDoor.id);
    setIsPlacingDoor(false);
    showNotification(`Pintu baru dipasang pada dinding sisi ${wallSide.toUpperCase()}.`);
  };

  // Window operations
  const updateWindowProperty = (windowId: string, updates: Partial<WindowData>) => {
    if (isReadOnly) return;
    updateActiveDesign(prev => ({
      ...prev,
      windows: (prev.windows || []).map(w => {
        if (w.id !== windowId) return w;
        const updated = { ...w, ...updates };
        const host = [...prev.groundFloorRooms, ...prev.secondFloorRooms].find(r => r.id === updated.roomId);
        if (host && updates.wallSide) {
          if (updated.wallSide === 'north') {
            updated.y = host.y;
            updated.x = Math.max(host.x, Math.min(host.x + host.width - updated.width, updated.x));
          } else if (updated.wallSide === 'south') {
            updated.y = host.y + host.depth;
            updated.x = Math.max(host.x, Math.min(host.x + host.width - updated.width, updated.x));
          } else if (updated.wallSide === 'west') {
            updated.x = host.x;
            updated.y = Math.max(host.y, Math.min(host.y + host.depth - updated.width, updated.y));
          } else if (updated.wallSide === 'east') {
            updated.x = host.x + host.width;
            updated.y = Math.max(host.y, Math.min(host.y + host.depth - updated.width, updated.y));
          }
        }
        return updated;
      }),
    }));
  };

  const handleAddWindow = (room: RoomData, type: WindowType = 'casement', wallSide: WallSide = 'north') => {
    if (isReadOnly) return;
    const isRoster = type === 'roster' || type === 'roster-vent' || type === 'louver-vent';
    const isBoven = type === 'bovenlicht';
    const winWidth = isRoster ? 1.0 : (isBoven ? 0.8 : 1.2);
    let winX = room.x + Math.max(0.1, (room.width - winWidth) / 2);
    let winY = room.y;
    if (wallSide === 'south') winY = room.y + room.depth;
    else if (wallSide === 'west') { winX = room.x; winY = room.y + (room.depth - winWidth) / 2; }
    else if (wallSide === 'east') { winX = room.x + room.width; winY = room.y + (room.depth - winWidth) / 2; }

    const newWin: WindowData = {
      id: `win-${Date.now().toString().slice(-5)}`,
      name: isRoster ? 'Roster Bata Angin' : (isBoven ? 'Ventilasi Bovenlicht' : 'Jendela Kaca'),
      roomId: room.id,
      floor: room.floor,
      wallSide,
      x: Number(winX.toFixed(2)),
      y: Number(winY.toFixed(2)),
      width: winWidth,
      height: isRoster ? 0.6 : (isBoven ? 0.5 : 1.4),
      sillHeight: isRoster ? 2.0 : (isBoven ? 2.1 : 0.9),
      windowType: type,
      type,
      isOpen: false,
    };

    updateActiveDesign(prev => ({
      ...prev,
      windows: [...(prev.windows || []), newWin],
    }));
    setSelectedWindowId(newWin.id);
    setSelectedRoomId(null);
    setSelectedDoorId(null);
    setSelectedFurnitureId(null);
    showNotification(`Jendela / ventilasi baru dipasang pada dinding sisi ${wallSide.toUpperCase()}.`);
  };

  const handleDeleteWindow = (windowId: string) => {
    if (isReadOnly) return;
    updateActiveDesign(prev => ({
      ...prev,
      windows: (prev.windows || []).filter(w => w.id !== windowId),
    }));
    if (selectedWindowId === windowId) setSelectedWindowId(null);
    showNotification('Jendela berhasil dihapus.');
  };

  // Staircase operations
  const updateStaircaseProperty = (updates: Partial<StaircaseConfig>) => {
    if (isReadOnly) return;
    updateActiveDesign(prev => ({
      ...prev,
      staircaseConfig: {
        ...(prev.staircaseConfig || DEFAULT_STAIRCASE_CONFIG),
        ...updates,
      },
    }));
  };

  // Open wall customization (solid, railing, open, open-half-start, open-half-end)
  const updateRoomWallType = (roomId: string, wall: 'north' | 'south' | 'east' | 'west', wallType: WallOpeningType) => {
    if (isReadOnly) return;
    const room = [...currentDesign.groundFloorRooms, ...currentDesign.secondFloorRooms].find(r => r.id === roomId);
    if (!room) return;
    const currentOpen = room.openWalls || { north: 'solid', south: 'solid', east: 'solid', west: 'solid' };
    const updatedOpen = { ...currentOpen, [wall]: wallType };
    updateRoomProperty(roomId, { openWalls: updatedOpen });
    const labelMap: Record<WallOpeningType, string> = {
      solid: 'Dinding Masif Penuh',
      railing: 'Pagar Railing',
      open: 'Terbuka Penuh',
      'open-half-start': wall === 'north' || wall === 'south' ? 'Terbuka ½ Kiri' : 'Terbuka ½ Atas',
      'open-half-end': wall === 'north' || wall === 'south' ? 'Terbuka ½ Kanan' : 'Terbuka ½ Bawah',
    };
    showNotification(`Dinding ${wall.toUpperCase()} diatur ke: ${labelMap[wallType]}`);
  };

  // Canva-style Layer Ordering for Rooms (Send to Back, Send Backward, Bring Forward, Bring to Front)
  const handleReorderRoomLayer = (roomId: string, direction: 'to-back' | 'backward' | 'forward' | 'to-front') => {
    if (isReadOnly) return;
    updateActiveDesign(prev => {
      const reorderList = (list: RoomData[]) => {
        const idx = list.findIndex(r => r.id === roomId);
        if (idx === -1) return list;
        const copy = [...list];
        const [item] = copy.splice(idx, 1);
        if (direction === 'to-back') {
          copy.unshift(item);
        } else if (direction === 'backward') {
          copy.splice(Math.max(0, idx - 1), 0, item);
        } else if (direction === 'forward') {
          copy.splice(Math.min(copy.length, idx + 1), 0, item);
        } else if (direction === 'to-front') {
          copy.push(item);
        }
        return copy;
      };
      return {
        ...prev,
        groundFloorRooms: reorderList(prev.groundFloorRooms),
        secondFloorRooms: reorderList(prev.secondFloorRooms),
      };
    });
    const dirLabel = direction === 'to-back' ? 'Paling Belakang (Send to Back)' : direction === 'backward' ? 'Mundur 1 Layer' : direction === 'forward' ? 'Maju 1 Layer' : 'Paling Depan (Bring to Front)';
    showNotification(`Urutan layer ruangan dipindah ke: ${dirLabel}`);
  };

  // Canva-style Layer Ordering for Furniture (Send to Back, Send Backward, Bring Forward, Bring to Front)
  const handleReorderFurnitureLayer = (furnitureId: string, direction: 'to-back' | 'backward' | 'forward' | 'to-front') => {
    if (isReadOnly) return;
    updateActiveDesign(prev => {
      const idx = prev.furniture.findIndex(f => f.id === furnitureId);
      if (idx === -1) return prev;
      const copy = [...prev.furniture];
      const [item] = copy.splice(idx, 1);
      if (direction === 'to-back') {
        copy.unshift(item);
      } else if (direction === 'backward') {
        copy.splice(Math.max(0, idx - 1), 0, item);
      } else if (direction === 'forward') {
        copy.splice(Math.min(copy.length, idx + 1), 0, item);
      } else if (direction === 'to-front') {
        copy.push(item);
      }
      return {
        ...prev,
        furniture: copy,
      };
    });
    const dirLabel = direction === 'to-back' ? 'Paling Belakang (Send to Back)' : direction === 'backward' ? 'Mundur 1 Layer' : direction === 'forward' ? 'Maju 1 Layer' : 'Paling Depan (Bring to Front)';
    showNotification(`Urutan layer perabot dipindah ke: ${dirLabel}`);
  };

  // Furniture update helpers
  const updateFurnitureProperty = (furnitureId: string, updates: Partial<FurnitureItem>) => {
    if (isReadOnly) return;
    updateActiveDesign(prev => ({
      ...prev,
      furniture: prev.furniture.map(f => {
        if (f.id !== furnitureId) return f;
        return {
          ...f,
          ...updates,
          x: updates.x !== undefined ? Number(updates.x.toFixed(2)) : f.x,
          y: updates.y !== undefined ? Number(updates.y.toFixed(2)) : f.y,
          width: updates.width !== undefined ? Math.max(0.2, Number(updates.width.toFixed(2))) : f.width,
          depth: updates.depth !== undefined ? Math.max(0.2, Number(updates.depth.toFixed(2))) : f.depth,
        };
      }),
    }));
  };

  const handleAddFurnitureFromCatalog = (template: typeof FURNITURE_CATALOG[0]) => {
    if (isReadOnly) return;
    const newId = `f-${Date.now().toString().slice(-4)}`;
    const newFurniture: FurnitureItem = {
      id: newId,
      roomId: selectedRoomId || 'guest_room',
      category: template.category,
      type: template.type,
      name: template.name,
      x: selectedRoom ? selectedRoom.x + 0.3 : 4.0,
      y: selectedRoom ? selectedRoom.y + 0.3 : 4.0,
      width: template.width,
      depth: template.depth,
      height: template.height,
      rotation: template.defaultRotation,
    };

    updateActiveDesign(prev => ({
      ...prev,
      furniture: [...prev.furniture, newFurniture],
    }));
    setSelectedFurnitureId(newId);
    setActiveInspectorTab('furniture');
  };

  const handleDeleteFurniture = (furnitureId: string) => {
    if (isReadOnly) return;
    updateActiveDesign(prev => ({
      ...prev,
      furniture: prev.furniture.filter(f => f.id !== furnitureId),
    }));
    setSelectedFurnitureId(null);
  };

  const handleDuplicateFurniture = (furniture: FurnitureItem) => {
    if (isReadOnly) return;
    const newId = `f-copy-${Date.now().toString().slice(-4)}`;
    const copy: FurnitureItem = {
      ...furniture,
      id: newId,
      name: `${furniture.name} (Salinan)`,
      x: Math.min(SITE_BOUNDARY.width - furniture.width, furniture.x + 0.4),
      y: Math.min(SITE_BOUNDARY.depth - furniture.depth, furniture.y + 0.4),
    };
    updateActiveDesign(prev => ({
      ...prev,
      furniture: [...prev.furniture, copy],
    }));
    setSelectedFurnitureId(newId);
  };

  // Drag handlers for Room
  const handleMouseDownOnRoom = (e: React.MouseEvent, room: RoomData) => {
    // Middle click OR Right click OR Pan tool OR Spacebar held -> Pan canvas!
    if (e.button === 1 || e.button === 2 || editorTool === 'pan' || isSpacePressedRef.current) {
      startViewportPan(e.clientX, e.clientY, e.button);
      return;
    }

    e.stopPropagation();
    if (isPinningFamilyNoteMode) {
      setIsPinningFamilyNoteMode(false);
      setSelectedRoomId(room.id);
      setFamilyFeedbackTab('notes');
      setIsFamilyFeedbackModalOpen(true);
      return;
    }

    // Shift + Click toggles room selection in multi-select group
    if (e.shiftKey) {
      setSelectedRoomIds(prev => {
        if (prev.includes(room.id)) {
          return prev.filter(id => id !== room.id);
        } else {
          return [...prev, room.id];
        }
      });
      setSelectedRoomId(room.id);
      return;
    }

    // If clicking an item that is ALREADY part of a multi-item selection, initiate group drag
    if (selectedRoomIds.includes(room.id) && (selectedRoomIds.length > 1 || selectedFurnitureIds.length > 0)) {
      setIsDraggingGroup(true);
      const coords = getMetreCoords(e.clientX, e.clientY);
      setDragStart({ x: coords.x, y: coords.y });
      const roomPos: { [id: string]: { x: number; y: number } } = {};
      const furnPos: { [id: string]: { x: number; y: number } } = {};
      const allCurrentRooms = [...currentDesign.groundFloorRooms, ...currentDesign.secondFloorRooms];
      selectedRoomIds.forEach(id => {
        const rm = allCurrentRooms.find(r => r.id === id);
        if (rm) roomPos[id] = { x: rm.x, y: rm.y };
      });
      // Include both explicitly selected furniture AND any furniture attached to selected rooms
      currentDesign.furniture.forEach(fn => {
        if (selectedFurnitureIds.includes(fn.id) || selectedRoomIds.includes(fn.roomId)) {
          furnPos[fn.id] = { x: fn.x, y: fn.y };
        }
      });
      setGroupInitialPositions({ rooms: roomPos, furniture: furnPos });
      return;
    }

    setSelectedRoomId(room.id);
    setSelectedRoomIds([room.id]);
    setSelectedFurnitureId(null);
    setSelectedFurnitureIds([]);
    setSelectedDoorId(null);
    setSelectedWindowId(null);
    setSelectedStaircase(false);
    setActiveInspectorTab('room');
    if (isReadOnly || room.isLocked) return;

    setIsDraggingRoom(true);
    const coords = getMetreCoords(e.clientX, e.clientY);
    setDragStart({ x: coords.x, y: coords.y });
    setRoomInitialState({ x: room.x, y: room.y, width: room.width, depth: room.depth });
  };

  // Drag handlers for Furniture
  const handleMouseDownOnFurniture = (e: React.MouseEvent, furniture: FurnitureItem) => {
    // Middle click OR Right click OR Pan tool OR Spacebar held -> Pan canvas!
    if (e.button === 1 || e.button === 2 || editorTool === 'pan' || isSpacePressedRef.current) {
      startViewportPan(e.clientX, e.clientY, e.button);
      return;
    }

    e.stopPropagation();

    // Shift + Click toggles furniture selection in multi-select group
    if (e.shiftKey) {
      setSelectedFurnitureIds(prev => {
        if (prev.includes(furniture.id)) {
          return prev.filter(id => id !== furniture.id);
        } else {
          return [...prev, furniture.id];
        }
      });
      setSelectedFurnitureId(furniture.id);
      return;
    }

    // If clicking an item that is ALREADY part of a multi-item selection, initiate group drag
    if (selectedFurnitureIds.includes(furniture.id) && (selectedFurnitureIds.length > 1 || selectedRoomIds.length > 0)) {
      setIsDraggingGroup(true);
      const coords = getMetreCoords(e.clientX, e.clientY);
      setDragStart({ x: coords.x, y: coords.y });
      const roomPos: { [id: string]: { x: number; y: number } } = {};
      const furnPos: { [id: string]: { x: number; y: number } } = {};
      const allCurrentRooms = [...currentDesign.groundFloorRooms, ...currentDesign.secondFloorRooms];
      selectedRoomIds.forEach(id => {
        const rm = allCurrentRooms.find(r => r.id === id);
        if (rm) roomPos[id] = { x: rm.x, y: rm.y };
      });
      currentDesign.furniture.forEach(fn => {
        if (selectedFurnitureIds.includes(fn.id) || selectedRoomIds.includes(fn.roomId)) {
          furnPos[fn.id] = { x: fn.x, y: fn.y };
        }
      });
      setGroupInitialPositions({ rooms: roomPos, furniture: furnPos });
      return;
    }

    setSelectedFurnitureId(furniture.id);
    setSelectedFurnitureIds([furniture.id]);
    setSelectedRoomId(null);
    setSelectedRoomIds([]);
    setSelectedDoorId(null);
    setSelectedWindowId(null);
    setSelectedStaircase(false);
    setActiveInspectorTab('furniture');
    if (isReadOnly || furniture.isLocked) return;

    setIsDraggingFurniture(true);
    const coords = getMetreCoords(e.clientX, e.clientY);
    setDragStart({ x: coords.x, y: coords.y });
    setFurnitureInitialState({ x: furniture.x, y: furniture.y });
  };

  // Drag handlers for Staircase
  const handleMouseDownOnStaircase = (e: React.MouseEvent) => {
    // Middle click OR Right click OR Pan tool OR Spacebar held -> Pan canvas!
    if (e.button === 1 || e.button === 2 || editorTool === 'pan' || isSpacePressedRef.current) {
      startViewportPan(e.clientX, e.clientY, e.button);
      return;
    }

    e.stopPropagation();
    setSelectedStaircase(true);
    setSelectedRoomId(null);
    setSelectedFurnitureId(null);
    setSelectedDoorId(null);
    setSelectedWindowId(null);
    setActiveInspectorTab('staircase');
    if (isReadOnly) return;

    setIsDraggingStaircase(true);
    const coords = getMetreCoords(e.clientX, e.clientY);
    setDragStart({ x: coords.x, y: coords.y });
    setStaircaseInitialPos({ x: currentStaircase.x, y: currentStaircase.y });
  };

  // Update Prohibited Zone helper
  const updateProhibitedZoneProperty = (updates: Partial<ProhibitedZoneData>) => {
    if (isReadOnly) return;
    const updatedZone: ProhibitedZoneData = {
      ...currentProhibitedZone,
      ...updates,
    };
    updateActiveDesign(prev => ({
      ...prev,
      prohibitedZone: updatedZone,
    }));
  };

  const handleMouseDownOnProhibitedZone = (e: React.MouseEvent) => {
    // Middle click OR Right click OR Pan tool OR Spacebar held -> Pan canvas!
    if (e.button === 1 || e.button === 2 || editorTool === 'pan' || isSpacePressedRef.current) {
      startViewportPan(e.clientX, e.clientY, e.button);
      return;
    }

    e.stopPropagation();
    setIsProhibitedZoneSelected(true);
    setSelectedRoomId(null);
    setSelectedFurnitureId(null);
    setSelectedVertexIndex(null);
    if (isReadOnly || currentProhibitedZone.isLocked) return;

    setIsDraggingProhibitedZone(true);
    const coords = getMetreCoords(e.clientX, e.clientY);
    setDragStart({ x: coords.x, y: coords.y });
    setProhibitedZoneInitialState({
      x: currentProhibitedZone.x,
      y: currentProhibitedZone.y,
      width: currentProhibitedZone.width,
      depth: currentProhibitedZone.depth,
    });
  };

  const handleMouseDownOnProhibitedZoneHandle = (e: React.MouseEvent, handle: ResizeHandleType) => {
    e.stopPropagation();
    if (isReadOnly || currentProhibitedZone.isLocked) return;

    setIsResizing(true);
    setResizeHandle(handle);
    const coords = getMetreCoords(e.clientX, e.clientY);
    setDragStart({ x: coords.x, y: coords.y });
    setProhibitedZoneInitialState({
      x: currentProhibitedZone.x,
      y: currentProhibitedZone.y,
      width: currentProhibitedZone.width,
      depth: currentProhibitedZone.depth,
    });
  };

  const handleMouseDownOnHandle = (e: React.MouseEvent, handle: ResizeHandleType) => {
    e.stopPropagation();
    if (isReadOnly || !selectedRoom || selectedRoom.isLocked) return;

    setIsResizing(true);
    setResizeHandle(handle);
    const coords = getMetreCoords(e.clientX, e.clientY);
    setDragStart({ x: coords.x, y: coords.y });
    setRoomInitialState({
      x: selectedRoom.x,
      y: selectedRoom.y,
      width: selectedRoom.width,
      depth: selectedRoom.depth,
    });
  };

  // Global Mouse Move
  const handleMouseMove = (e: React.MouseEvent) => {
    // 0. VIEWPORT PAN (Middle-click drag, Right-click drag, Hand/Pan tool drag, Spacebar drag)
    if (isPanningViewportRef.current || isPanningViewport || isMiddlePanningRef.current || isRightDraggingRef.current) {
      const deltaScreenX = e.clientX - panStartMouseRef.current.x;
      const deltaScreenY = e.clientY - panStartMouseRef.current.y;
      const dist = Math.hypot(deltaScreenX, deltaScreenY);

      if (isRightDraggingRef.current) {
        rightDragDistanceRef.current = dist;
        if (dist > 4) {
          suppressNextContextMenuRef.current = true;
        }
      }

      if (svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect();
        const scaleX = (1040 * viewZoomRef.current) / rect.width;
        const scaleY = (1240 * viewZoomRef.current) / rect.height;
        const newPanX = panStartOffsetRef.current.x - deltaScreenX * scaleX;
        const newPanY = panStartOffsetRef.current.y - deltaScreenY * scaleY;
        setViewPan({ x: newPanX, y: newPanY });
      }
      return;
    }

    const coords = getMetreCoords(e.clientX, e.clientY);
    const deltaX = coords.x - dragStart.x;
    const deltaY = coords.y - dragStart.y;

    // 1. CANVA-STYLE MARQUEE BOX SELECTION DRAG
    if (selectionMarquee && selectionMarquee.isActive) {
      setSelectionMarquee(prev => prev ? { ...prev, currentX: coords.x, currentY: coords.y } : null);
      const minX = Math.min(selectionMarquee.startX, coords.x);
      const maxX = Math.max(selectionMarquee.startX, coords.x);
      const minY = Math.min(selectionMarquee.startY, coords.y);
      const maxY = Math.max(selectionMarquee.startY, coords.y);

      // Select rooms on active floor intersecting the marquee rectangle
      const matchedRooms = roomsOnCurrentFloor.filter(r => {
        const rMinX = r.x;
        const rMaxX = r.x + r.width;
        const rMinY = r.y;
        const rMaxY = r.y + r.depth;
        return !(rMinX > maxX || rMaxX < minX || rMinY > maxY || rMaxY < minY);
      }).map(r => r.id);

      // Select visible furniture intersecting the marquee rectangle
      const matchedFurn = currentDesign.furniture.filter(f => {
        const isGf = currentDesign.groundFloorRooms.some(r => r.id === f.roomId);
        const is2f = currentDesign.secondFloorRooms.some(r => r.id === f.roomId);
        if (selectedFloor === 'GF' && !isGf) return false;
        if (selectedFloor === '2F' && !is2f) return false;
        const fMinX = f.x;
        const fMaxX = f.x + f.width;
        const fMinY = f.y;
        const fMaxY = f.y + f.depth;
        return !(fMinX > maxX || fMaxX < minX || fMinY > maxY || fMaxY < minY);
      }).map(f => f.id);

      setSelectedRoomIds(matchedRooms);
      setSelectedFurnitureIds(matchedFurn);
      return;
    }

    // 2. CANVA-STYLE GROUP DRAG (ALL SELECTED ITEMS MOVE TOGETHER BY DELTA)
    if (isDraggingGroup && groupInitialPositions) {
      let gDeltaX = deltaX;
      let gDeltaY = deltaY;
      if (snapToGrid) {
        gDeltaX = Math.round(gDeltaX / gridSize) * gridSize;
        gDeltaY = Math.round(gDeltaY / gridSize) * gridSize;
      }

      updateActiveDesign(prev => {
        const updateRoomList = (roomList: RoomData[]) =>
          roomList.map(r => {
            if (!groupInitialPositions.rooms[r.id]) return r;
            const init = groupInitialPositions.rooms[r.id];
            return {
              ...r,
              x: Math.max(0, Math.min(SITE_BOUNDARY.width - r.width, Number((init.x + gDeltaX).toFixed(2)))),
              y: Math.max(0, Math.min(SITE_BOUNDARY.depth - r.depth, Number((init.y + gDeltaY).toFixed(2)))),
            };
          });

        const updatedFurniture = prev.furniture.map(f => {
          if (!groupInitialPositions.furniture[f.id]) return f;
          const init = groupInitialPositions.furniture[f.id];
          return {
            ...f,
            x: Math.max(0, Math.min(SITE_BOUNDARY.width - f.width, Number((init.x + gDeltaX).toFixed(2)))),
            y: Math.max(0, Math.min(SITE_BOUNDARY.depth - f.depth, Number((init.y + gDeltaY).toFixed(2)))),
          };
        });

        return {
          ...prev,
          groundFloorRooms: updateRoomList(prev.groundFloorRooms),
          secondFloorRooms: updateRoomList(prev.secondFloorRooms),
          furniture: updatedFurniture,
        };
      });
      return;
    }

    if (isDraggingRoom && selectedRoom && roomInitialState) {
      let targetX = roomInitialState.x + deltaX;
      let targetY = roomInitialState.y + deltaY;

      targetX = Math.max(0, Math.min(SITE_BOUNDARY.width - roomInitialState.width, targetX));
      targetY = Math.max(0, Math.min(SITE_BOUNDARY.depth - roomInitialState.depth, targetY));

      if (snapToGrid) {
        targetX = Math.round(targetX / gridSize) * gridSize;
        targetY = Math.round(targetY / gridSize) * gridSize;
      }

      const dx = targetX - selectedRoom.x;
      const dy = targetY - selectedRoom.y;

      updateRoomProperty(selectedRoom.id, { x: targetX, y: targetY });

      // PART 5.2 — Linked Components: If moving Ground Floor room, follow linked 2F rooms AND their attached furniture
      if (selectedFloor === 'GF' && (dx !== 0 || dy !== 0)) {
        const linkedRooms = workingDesign.secondFloorRooms.filter(
          r => r.isLinkedToGround && (r.groundParentId === selectedRoom.id || (!r.groundParentId && (selectedRoom.id === 'front_terrace' || selectedRoom.id === 'carport' || selectedRoom.id === 'carport_terrace') && r.id === 'kt6'))
        );
        if (linkedRooms.length > 0) {
          const linkedIds = new Set(linkedRooms.map(r => r.id));
          updateActiveDesign(prev => ({
            ...prev,
            secondFloorRooms: prev.secondFloorRooms.map(r => {
              if (!linkedIds.has(r.id)) return r;
              return {
                ...r,
                x: Number(Math.max(0, Math.min(SITE_BOUNDARY.width - r.width, r.x + dx)).toFixed(2)),
                y: Number(Math.max(0, Math.min(SITE_BOUNDARY.depth - r.depth, r.y + dy)).toFixed(2)),
              };
            }),
            furniture: prev.furniture.map(f => {
              if (!linkedIds.has(f.roomId)) return f;
              return {
                ...f,
                x: Number(Math.max(0, Math.min(SITE_BOUNDARY.width - f.width, f.x + dx)).toFixed(2)),
                y: Number(Math.max(0, Math.min(SITE_BOUNDARY.depth - f.depth, f.y + dy)).toFixed(2)),
              };
            }),
          }));
        }
      }
    } else if (isDraggingFurniture && selectedFurniture && furnitureInitialState) {
      let targetX = furnitureInitialState.x + deltaX;
      let targetY = furnitureInitialState.y + deltaY;

      targetX = Math.max(0, Math.min(SITE_BOUNDARY.width - selectedFurniture.width, targetX));
      targetY = Math.max(0, Math.min(SITE_BOUNDARY.depth - selectedFurniture.depth, targetY));

      if (snapToGrid) {
        targetX = Math.round(targetX / gridSize) * gridSize;
        targetY = Math.round(targetY / gridSize) * gridSize;
      }

      updateFurnitureProperty(selectedFurniture.id, { x: targetX, y: targetY });
    } else if (isDraggingVertex && selectedRoom && selectedRoom.polygonPoints && selectedVertexIndex !== null && vertexInitialPos) {
      let targetX = Math.max(0, Math.min(SITE_BOUNDARY.width, vertexInitialPos.x + deltaX));
      let targetY = Math.max(0, Math.min(SITE_BOUNDARY.depth, vertexInitialPos.y + deltaY));

      const otherPoints = selectedRoom.polygonPoints.filter((_, idx) => idx !== selectedVertexIndex);
      const snapRes = getVertexAlignmentGuides(
        { x: targetX, y: targetY },
        otherPoints,
        {
          tolerance: 0.18,
          snapAxis: snapOptions.axis,
          snapEndpoints: snapOptions.endpoints,
          snapMidpoints: snapOptions.midpoints,
        }
      );

      setActiveAlignmentGuides(snapRes.guides);
      if (snapRes.guides.length > 0) {
        targetX = snapRes.snappedPoint.x;
        targetY = snapRes.snappedPoint.y;
      } else if (snapToGrid) {
        targetX = Math.round(targetX / gridSize) * gridSize;
        targetY = Math.round(targetY / gridSize) * gridSize;
      }

      const updatedPoints = [...selectedRoom.polygonPoints];
      updatedPoints[selectedVertexIndex] = {
        x: Number(targetX.toFixed(2)),
        y: Number(targetY.toFixed(2)),
      };
      updateRoomProperty(selectedRoom.id, { polygonPoints: updatedPoints });
    } else if (isDraggingAvatar) {
      setHumanAvatarPos({
        x: Math.max(0.3, Math.min(8.7, Number(coords.x.toFixed(2)))),
        y: Math.max(0.3, Math.min(10.7, Number(coords.y.toFixed(2)))),
      });
    } else if (isResizing && selectedRoom && roomInitialState && resizeHandle) {
      const resized = calculateBidirectionalResize(
        roomInitialState,
        resizeHandle,
        deltaX,
        deltaY,
        resizeMode,
        0.8
      );

      // Clamp within site
      const clampedX = Math.max(0, Math.min(SITE_BOUNDARY.width - resized.width, resized.x));
      const clampedY = Math.max(0, Math.min(SITE_BOUNDARY.depth - resized.depth, resized.y));

      updateRoomProperty(selectedRoom.id, {
        x: clampedX,
        y: clampedY,
        width: resized.width,
        depth: resized.depth,
      });
    } else if (isDraggingProhibitedZone && prohibitedZoneInitialState) {
      let targetX = prohibitedZoneInitialState.x + deltaX;
      let targetY = prohibitedZoneInitialState.y + deltaY;

      targetX = Math.max(0, Math.min(SITE_BOUNDARY.width - prohibitedZoneInitialState.width, targetX));
      targetY = Math.max(0, Math.min(SITE_BOUNDARY.depth - prohibitedZoneInitialState.depth, targetY));

      if (snapToGrid) {
        targetX = Math.round(targetX / gridSize) * gridSize;
        targetY = Math.round(targetY / gridSize) * gridSize;
      }

      updateProhibitedZoneProperty({ x: targetX, y: targetY });
    } else if (isResizing && isProhibitedZoneSelected && prohibitedZoneInitialState && resizeHandle) {
      const resized = calculateBidirectionalResize(
        prohibitedZoneInitialState,
        resizeHandle,
        deltaX,
        deltaY,
        resizeMode,
        1.0
      );

      const clampedX = Math.max(0, Math.min(SITE_BOUNDARY.width - resized.width, resized.x));
      const clampedY = Math.max(0, Math.min(SITE_BOUNDARY.depth - resized.depth, resized.y));

      updateProhibitedZoneProperty({
        x: clampedX,
        y: clampedY,
        width: resized.width,
        depth: resized.depth,
      });
    } else if (isDraggingStaircase && staircaseInitialPos) {
      let targetX = staircaseInitialPos.x + deltaX;
      let targetY = staircaseInitialPos.y + deltaY;

      targetX = Math.max(0, Math.min(SITE_BOUNDARY.width - (currentStaircase.totalRun || currentStaircase.depth), targetX));
      targetY = Math.max(0, Math.min(SITE_BOUNDARY.depth - currentStaircase.width, targetY));

      if (snapToGrid) {
        targetX = Math.round(targetX / gridSize) * gridSize;
        targetY = Math.round(targetY / gridSize) * gridSize;
      }

      updateStaircaseProperty({ x: Number(targetX.toFixed(2)), y: Number(targetY.toFixed(2)) });
    }
  };

  const handleMouseUp = () => {
    if (isPanningViewportRef.current || isPanningViewport || isMiddlePanningRef.current || isRightDraggingRef.current) {
      setIsPanningViewport(false);
      isPanningViewportRef.current = false;
      isMiddlePanningRef.current = false;
      isRightDraggingRef.current = false;
    }
    if (selectionMarquee && selectionMarquee.isActive) {
      setSelectionMarquee(null);
    }
    setIsDraggingGroup(false);
    setGroupInitialPositions(null);
    setIsDraggingRoom(false);
    setIsDraggingFurniture(false);
    setIsDraggingVertex(false);
    setIsDraggingProhibitedZone(false);
    setIsDraggingAvatar(false);
    setIsDraggingStaircase(false);
    setIsResizing(false);
    setResizeHandle(null);
    setActiveAlignmentGuides([]);
  };

  // Canvas Viewport Pan & Zoom Handlers
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    // 1. Middle mouse button (button 1) -> ALWAYS PAN
    if (e.button === 1) {
      e.preventDefault();
      startViewportPan(e.clientX, e.clientY, 1);
      return;
    }

    // 2. Right mouse button (button 2) -> START POTENTIAL PAN DRAG (suppresses context menu if dragged > 4px)
    if (e.button === 2) {
      startViewportPan(e.clientX, e.clientY, 2);
      return;
    }

    // 3. Left mouse button with Pan Tool OR Spacebar pressed -> PAN
    if (e.button === 0 && (editorTool === 'pan' || isSpacePressedRef.current)) {
      e.preventDefault();
      startViewportPan(e.clientX, e.clientY, 0);
      return;
    }

    if (isPlacingDoor && selectedRoom) {
      const coords = getMetreCoords(e.clientX, e.clientY);
      const distN = Math.abs(coords.y - selectedRoom.y);
      const distS = Math.abs(coords.y - (selectedRoom.y + selectedRoom.depth));
      const distW = Math.abs(coords.x - selectedRoom.x);
      const distE = Math.abs(coords.x - (selectedRoom.x + selectedRoom.width));
      const minDist = Math.min(distN, distS, distW, distE);
      let side: WallSide = 'south';
      if (minDist === distN) side = 'north';
      else if (minDist === distW) side = 'west';
      else if (minDist === distE) side = 'east';

      handlePlaceDoor(selectedRoom, side, coords);
      return;
    }

    // Canva-style click on empty canvas to start marquee box ("buat blok")
    if (editorTool === 'select' && !isPlacingDoor && e.button === 0) {
      if (!e.shiftKey) {
        setSelectedRoomId(null);
        setSelectedFurnitureId(null);
        setSelectedVertexIndex(null);
        setSelectedDoorId(null);
        setIsProhibitedZoneSelected(false);
        setSelectedRoomIds([]);
        setSelectedFurnitureIds([]);
      }
      const coords = getMetreCoords(e.clientX, e.clientY);
      setSelectionMarquee({
        isActive: true,
        startX: coords.x,
        startY: coords.y,
        currentX: coords.x,
        currentY: coords.y,
      });
      setDragStart({ x: coords.x, y: coords.y });
    }
  };

  // TOUCH EVENT HANDLERS FOR MOBILE (PINCH-TO-ZOOM & 1-FINGER PAN) (Feedback Item 5)
  const handleTouchStart = (e: React.TouchEvent<SVGSVGElement>) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartRef.current = { dist, startPan: { ...viewPanRef.current }, startMouse: null };
    } else if (e.touches.length === 1) {
      touchStartRef.current = {
        dist: null,
        startPan: { ...viewPanRef.current },
        startMouse: { x: e.touches[0].clientX, y: e.touches[0].clientY },
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent<SVGSVGElement>) => {
    if (e.touches.length === 2 && touchStartRef.current.dist) {
      const newDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const scale = newDist / touchStartRef.current.dist;
      const newZoom = Math.max(0.4, Math.min(2.5, Number((viewZoomRef.current * scale).toFixed(2))));
      setViewZoom(newZoom);
      touchStartRef.current.dist = newDist;
    } else if (e.touches.length === 1 && touchStartRef.current.startMouse && touchStartRef.current.startPan) {
      const dx = e.touches[0].clientX - touchStartRef.current.startMouse.x;
      const dy = e.touches[0].clientY - touchStartRef.current.startMouse.y;
      setViewPan({
        x: touchStartRef.current.startPan.x - dx * viewZoomRef.current,
        y: touchStartRef.current.startPan.y - dy * viewZoomRef.current,
      });
    }
  };

  const handleTouchEnd = () => {
    touchStartRef.current = { dist: null, startPan: null, startMouse: null };
  };

  // NATIVE NON-PASSIVE WHEEL LISTENER (Feedback Item 1: Completely stops page from scrolling)
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;

    const onNativeWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 0.9 : 1.1;
      const currentZoom = viewZoomRef.current;
      const currentPan = viewPanRef.current;
      const newZoom = Math.max(0.4, Math.min(2.5, Number((currentZoom * zoomFactor).toFixed(2))));

      const rect = el.getBoundingClientRect();
      const mouseRatioX = (e.clientX - rect.left) / rect.width;
      const mouseRatioY = (e.clientY - rect.top) / rect.height;
      const currentW = 1040 * currentZoom;
      const currentH = 1240 * currentZoom;
      const newW = 1040 * newZoom;
      const newH = 1240 * newZoom;
      const newPanX = currentPan.x + (currentW - newW) * mouseRatioX;
      const newPanY = currentPan.y + (currentH - newH) * mouseRatioY;

      setViewZoom(newZoom);
      setViewPan({ x: newPanX, y: newPanY });
    };

    el.addEventListener('wheel', onNativeWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', onNativeWheel);
    };
  }, []);

  // Global MouseUp safety to release viewport pan anywhere
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isPanningViewportRef.current || isRightDraggingRef.current || isMiddlePanningRef.current) {
        setIsPanningViewport(false);
        isPanningViewportRef.current = false;
        isMiddlePanningRef.current = false;
        isRightDraggingRef.current = false;
      }
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, []);

  // Zoom In decreases viewBox multiplier (objects become bigger)
  const handleZoomIn = () => setViewZoom(prev => Math.max(0.35, Number((prev * 0.85).toFixed(2))));
  // Zoom Out increases viewBox multiplier (objects become smaller)
  const handleZoomOut = () => setViewZoom(prev => Math.min(3.0, Number((prev * 1.18).toFixed(2))));
  const handleZoomFit = () => {
    setViewZoom(1.0);
    setViewPan({ x: 0, y: 0 });
  };

  // SHARE LINK & BACKUP UTILITIES (Feedback items 3 & 6)
  const generateFamilyShareUrl = () => {
    try {
      const serialized = JSON.stringify(workingDesign);
      const encoded = btoa(unescape(encodeURIComponent(serialized)));
      const base = window.location.origin + window.location.pathname;
      return `${base}?familyShare=${encoded}`;
    } catch (e) {
      console.error('Failed to generate share URL:', e);
      return window.location.href;
    }
  };

  const handleCopyCleanShareLink = async () => {
    const url = generateFamilyShareUrl();
    try {
      await navigator.clipboard.writeText(url);
      setShareCopyFeedback('Tautan berhasil disalin ke clipboard!');
      setTimeout(() => setShareCopyFeedback(null), 3000);
    } catch {
      setShareCopyFeedback('Gagal menyalin otomatis, silakan salin tautan manual.');
    }
  };

  const handleCopyWhatsAppMessage = async () => {
    const url = generateFamilyShareUrl();
    const msg = `Halo Bu, ini rancangan denah rumah Griya 9x11 kita yang sudah disesuaikan!\n\nIbu bisa buka langsung di HP untuk cek denah, posisi kamar, pintu kaca taman, dan kasih catatan masukan ya:\n${url}`;
    try {
      await navigator.clipboard.writeText(msg);
      setShareCopyFeedback('Pesan WhatsApp untuk Ibu berhasil disalin!');
      setTimeout(() => setShareCopyFeedback(null), 3000);
    } catch {
      setShareCopyFeedback('Gagal menyalin pesan WhatsApp.');
    }
  };

  const handleExportBackup = () => {
    try {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({
        version: '1.0',
        exportedAt: new Date().toISOString(),
        workingDesign,
        savedAlternatives,
      }, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `griya9x11-desain-cadangan-${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showNotification('Berkas cadangan desain (JSON) berhasil diunduh!');
    } catch (e) {
      console.error('Export failed:', e);
      showNotification('Gagal mengekspor cadangan.');
    }
  };

  const handleImportBackupFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.workingDesign && parsed.workingDesign.groundFloorRooms) {
          pushUndoState(workingDesign);
          setWorkingDesign(parsed.workingDesign);
          if (Array.isArray(parsed.savedAlternatives)) {
            setSavedAlternatives(parsed.savedAlternatives);
          }
          showNotification('Cadangan desain berhasil dimuat ke aplikasi!');
          setIsFamilyShareModalOpen(false);
        } else if (parsed.groundFloorRooms) {
          pushUndoState(workingDesign);
          setWorkingDesign(parsed);
          showNotification('Desain berhasil dimuat ke aplikasi!');
          setIsFamilyShareModalOpen(false);
        } else {
          showNotification('Format berkas JSON tidak sesuai.');
        }
      } catch (err) {
        console.error('Error importing JSON:', err);
        showNotification('Gagal membaca berkas JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;

      if (e.code === 'Space' && !e.repeat) {
        isSpacePressedRef.current = true;
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedVertexIndex !== null && selectedRoomId) {
          e.preventDefault();
          handleDeleteVertex(selectedRoomId, selectedVertexIndex);
        } else if (selectedFurnitureId) {
          e.preventDefault();
          handleDeleteFurniture(selectedFurnitureId);
        } else if (selectedDoorId) {
          e.preventDefault();
          handleDeleteDoor(selectedDoorId);
        } else if (selectedRoomId) {
          e.preventDefault();
          const r = [...workingDesign.groundFloorRooms, ...workingDesign.secondFloorRooms].find(rm => rm.id === selectedRoomId);
          if (r) setRoomToDelete(r);
        }
      } else if (e.key === 'Escape') {
        setSelectedRoomId(null);
        setSelectedFurnitureId(null);
        setSelectedVertexIndex(null);
        setSelectedDoorId(null);
        setIsPlacingDoor(false);
        setContextMenu(prev => ({ ...prev, isOpen: false }));
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (e.key.toLowerCase() === 'h') {
        setEditorTool('pan');
      } else if (e.key.toLowerCase() === 'v') {
        setEditorTool('select');
      } else if (e.key === '[') {
        e.preventDefault();
        if (selectedFurnitureId) {
          handleReorderFurnitureLayer(selectedFurnitureId, (e.ctrlKey || e.metaKey) ? 'to-back' : 'backward');
        } else if (selectedRoomId) {
          handleReorderRoomLayer(selectedRoomId, (e.ctrlKey || e.metaKey) ? 'to-back' : 'backward');
        }
      } else if (e.key === ']') {
        e.preventDefault();
        if (selectedFurnitureId) {
          handleReorderFurnitureLayer(selectedFurnitureId, (e.ctrlKey || e.metaKey) ? 'to-front' : 'forward');
        } else if (selectedRoomId) {
          handleReorderRoomLayer(selectedRoomId, (e.ctrlKey || e.metaKey) ? 'to-front' : 'forward');
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        isSpacePressedRef.current = false;
        if (isPanningViewport && !isMiddlePanningRef.current && editorTool !== 'pan') {
          setIsPanningViewport(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedVertexIndex, selectedRoomId, selectedFurnitureId, selectedDoorId, undoStack, redoStack, workingDesign, editorTool, isPanningViewport]);

  // Context Menu Dispatcher
  const handleContextMenuAction = (actionId: string, target: ContextMenuTarget) => {
    if (actionId === 'inspect-room' && target.type === 'room') {
      setSelectedRoomId(target.roomId);
      setActiveInspectorTab('room');
    } else if (actionId === 'edit-room-label' && target.type === 'room') {
      setSelectedRoomId(target.roomId);
      setActiveInspectorTab('room');
    } else if (actionId === 'convert-to-polygon' && target.type === 'room') {
      handleConvertToPolygon(target.roomId);
    } else if (actionId === 'add-vertex' && target.type === 'room') {
      handleAddVertexToRoom(target.roomId);
    } else if (actionId === 'add-door-here' && target.type === 'room') {
      const room = [...workingDesign.groundFloorRooms, ...workingDesign.secondFloorRooms].find(r => r.id === target.roomId);
      if (room) {
        handlePlaceDoor(room, 'south', { x: room.x + room.width / 2, y: room.y + room.depth });
      }
    } else if (actionId === 'room-send-to-back' && target.type === 'room') {
      handleReorderRoomLayer(target.roomId, 'to-back');
    } else if (actionId === 'room-send-backward' && target.type === 'room') {
      handleReorderRoomLayer(target.roomId, 'backward');
    } else if (actionId === 'room-bring-forward' && target.type === 'room') {
      handleReorderRoomLayer(target.roomId, 'forward');
    } else if (actionId === 'room-bring-to-front' && target.type === 'room') {
      handleReorderRoomLayer(target.roomId, 'to-front');
    } else if (actionId === 'toggle-lock-room' && target.type === 'room') {
      const room = [...workingDesign.groundFloorRooms, ...workingDesign.secondFloorRooms].find(r => r.id === target.roomId);
      if (room) {
        updateRoomProperty(target.roomId, { isLocked: !room.isLocked });
      }
    } else if (actionId === 'delete-room' && target.type === 'room') {
      const room = [...workingDesign.groundFloorRooms, ...workingDesign.secondFloorRooms].find(r => r.id === target.roomId);
      if (room) setRoomToDelete(room);
    } else if (actionId === 'inspect-vertex' && target.type === 'vertex') {
      setSelectedRoomId(target.roomId);
      setSelectedVertexIndex(target.vertexIndex);
      setActiveInspectorTab('room');
    } else if (actionId === 'insert-vertex-after' && target.type === 'vertex') {
      const room = [...workingDesign.groundFloorRooms, ...workingDesign.secondFloorRooms].find(r => r.id === target.roomId);
      if (room && room.polygonPoints) {
        const nextIdx = (target.vertexIndex + 1) % room.polygonPoints.length;
        const p1 = room.polygonPoints[target.vertexIndex];
        const p2 = room.polygonPoints[nextIdx];
        const newPt = {
          x: Number(((p1.x + p2.x) / 2).toFixed(2)),
          y: Number(((p1.y + p2.y) / 2).toFixed(2)),
        };
        const updated = [...room.polygonPoints];
        updated.splice(target.vertexIndex + 1, 0, newPt);
        pushUndoState(workingDesign);
        updateRoomProperty(target.roomId, { polygonPoints: updated });
        setSelectedVertexIndex(target.vertexIndex + 1);
      }
    } else if (actionId === 'delete-vertex' && target.type === 'vertex') {
      handleDeleteVertex(target.roomId, target.vertexIndex);
    } else if (actionId === 'rotate-furniture-90' && target.type === 'furniture') {
      const furn = workingDesign.furniture.find(f => f.id === target.furnitureId);
      if (furn) {
        const newRot = ((furn.rotation || 0) + 90) % 360;
        updateFurnitureProperty(furn.id, { rotation: newRot });
      }
    } else if (actionId === 'duplicate-furniture' && target.type === 'furniture') {
      const furn = workingDesign.furniture.find(f => f.id === target.furnitureId);
      if (furn) handleDuplicateFurniture(furn);
    } else if (actionId === 'furn-send-to-back' && target.type === 'furniture') {
      handleReorderFurnitureLayer(target.furnitureId, 'to-back');
    } else if (actionId === 'furn-send-backward' && target.type === 'furniture') {
      handleReorderFurnitureLayer(target.furnitureId, 'backward');
    } else if (actionId === 'furn-bring-forward' && target.type === 'furniture') {
      handleReorderFurnitureLayer(target.furnitureId, 'forward');
    } else if (actionId === 'furn-bring-to-front' && target.type === 'furniture') {
      handleReorderFurnitureLayer(target.furnitureId, 'to-front');
    } else if (actionId === 'inspect-furniture' && target.type === 'furniture') {
      setSelectedFurnitureId(target.furnitureId);
      setActiveInspectorTab('furniture');
    } else if (actionId === 'delete-furniture' && target.type === 'furniture') {
      handleDeleteFurniture(target.furnitureId);
    } else if (actionId === 'add-new-room' && target.type === 'canvas') {
      setIsAddRoomModalOpen(true);
    } else if (actionId === 'activate-add-door' && target.type === 'canvas') {
      setIsPlacingDoor(true);
      showNotification('Klik pada dinding ruangan untuk menempatkan kusen pintu.');
    } else if (actionId === 'reset-zoom-fit' && target.type === 'canvas') {
      handleZoomFit();
    }
  };

  // Add new room
  const handleAddNewRoom = () => {
    if (isReadOnly) return;
    pushUndoState(workingDesign);

    const newId = `room-${Date.now().toString().slice(-4)}`;
    const newRoom: RoomData = {
      id: newId,
      name: newRoomName,
      indonesianName: newRoomName,
      floor: selectedFloor === '2F' ? '2F' : 'GF',
      x: 6.0,
      y: 0.5,
      width: newRoomWidth,
      depth: newRoomDepth,
      clearWidth: newRoomWidth - 0.25,
      clearDepth: newRoomDepth - 0.25,
      area: Number((newRoomWidth * newRoomDepth).toFixed(2)),
      status: selectedFloor === 'GF' ? 'new-gf' : 'new-2f',
      ventilation: 'Jendela luar',
      daylight: 'Alami',
      structuralZone: selectedFloor === '2F' ? 'new-structural-frame' : 'open-ground',
      description: 'Ruang baru ditambahkan oleh pengguna pada Studio Denah Interaktif.',
    };

    updateActiveDesign(prev => ({
      ...prev,
      groundFloorRooms: selectedFloor === 'GF' ? [...prev.groundFloorRooms, newRoom] : prev.groundFloorRooms,
      secondFloorRooms: selectedFloor !== 'GF' ? [...prev.secondFloorRooms, newRoom] : prev.secondFloorRooms,
    }));

    setSelectedRoomId(newId);
    setIsAddRoomModalOpen(false);
    showNotification(`Ruangan "${newRoomName}" berhasil ditambahkan.`);
  };

  // Remove room handler with RoomDeletionModal (Part 3)
  const handleDeleteRoom = (roomId: string) => {
    if (isReadOnly) return;
    const room = [...currentDesign.groundFloorRooms, ...currentDesign.secondFloorRooms].find(r => r.id === roomId);
    if (!room) return;
    setRoomToDelete(room);
  };

  const handleConfirmDeleteRoom = (deleteAssociatedFurniture: boolean) => {
    if (!roomToDelete || isReadOnly) return;
    const roomId = roomToDelete.id;

    updateActiveDesign(prev => {
      const newGf = prev.groundFloorRooms.filter(r => r.id !== roomId);
      const new2f = prev.secondFloorRooms.filter(r => r.id !== roomId);

      let updatedFurniture = [...prev.furniture];
      if (deleteAssociatedFurniture) {
        updatedFurniture = updatedFurniture.filter(f => f.roomId !== roomId);
      } else {
        updatedFurniture = updatedFurniture.map(f => f.roomId === roomId ? { ...f, roomId: 'unassigned' } : f);
      }

      const updatedDoors = (prev.doors || []).filter(d => d.roomId !== roomId);
      const updatedWindows = (prev.windows || []).filter(w => w.roomId !== roomId);

      return {
        ...prev,
        groundFloorRooms: newGf,
        secondFloorRooms: new2f,
        furniture: updatedFurniture,
        doors: updatedDoors,
        windows: updatedWindows,
      };
    });

    if (selectedRoomId === roomId) {
      setSelectedRoomId(null);
      setSelectedVertexIndex(null);
    }
    showNotification(`Ruangan "${roomToDelete.indonesianName || roomToDelete.name}" berhasil dihapus.`);
    setRoomToDelete(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 select-none" onMouseUp={handleMouseUp}>
      {/* 1. TOP CONTROL BAR */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        {/* Design State Switcher */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => { setActiveDesignMode('original'); setSelectedRoomId(null); setSelectedFurnitureId(null); }}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeDesignMode === 'original'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Desain Asli yang telah disetujui (Terkunci / Read-Only)"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Desain Awal (Terkunci)</span>
            </button>

            <button
              onClick={() => { setActiveDesignMode('working'); setSelectedRoomId(null); }}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeDesignMode === 'working'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Denah Kerja Aktif (Bebas Diedit, Poligon, dan Furnitur)"
            >
              <Unlock className="w-3.5 h-3.5 text-emerald-300" />
              <span>Denah Kerja (Editable)</span>
            </button>
          </div>

          {/* Alternative Snapshots */}
          <div className="flex items-center gap-2">
            <select
              value={activeDesignMode === 'alternative' ? (selectedAltId || '') : ''}
              onChange={(e) => {
                const val = e.target.value;
                if (!val) {
                  setActiveDesignMode('working');
                  setSelectedAltId(null);
                } else {
                  setActiveDesignMode('alternative');
                  setSelectedAltId(val);
                }
              }}
              className="bg-white border border-slate-200 text-slate-800 text-xs rounded-lg px-2.5 py-1.5 font-medium cursor-pointer focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="">-- Muat Alternatif Tersimpan --</option>
              {savedAlternatives.map(alt => (
                <option key={alt.id} value={alt.id}>{alt.name}</option>
              ))}
            </select>

            {!isReadOnly && (
              <button
                onClick={() => setSaveAltModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                title="Simpan denah kerja saat ini sebagai Alternatif baru"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Alternatif</span>
              </button>
            )}
          </div>
        </div>

        {/* History & Mode Selection */}
        <div className="flex flex-wrap items-center gap-2">
          {!isReadOnly && (
            <>
              {/* Resize Mode Selector */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-medium">
                <button
                  onClick={() => setResizeMode('fixed-opposite')}
                  className={`px-2 py-1 rounded transition-colors ${
                    resizeMode === 'fixed-opposite' ? 'bg-white text-indigo-700 font-bold shadow-xs' : 'text-slate-600'
                  }`}
                  title="Mode A: Sisi berlawanan tetap terkunci"
                >
                  Mode A (Fixed Edge)
                </button>
                <button
                  onClick={() => setResizeMode('center-based')}
                  className={`px-2 py-1 rounded transition-colors ${
                    resizeMode === 'center-based' ? 'bg-white text-indigo-700 font-bold shadow-xs' : 'text-slate-600'
                  }`}
                  title="Mode B: Resizing simetris dari titik pusat"
                >
                  Mode B (Center)
                </button>
              </div>

              <button
                onClick={handleUndo}
                disabled={undoStack.length === 0}
                className="p-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                title="Undo"
              >
                <Undo2 className="w-4 h-4" />
              </button>

              <button
                onClick={handleRedo}
                disabled={redoStack.length === 0}
                className="p-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                title="Redo"
              >
                <Redo2 className="w-4 h-4" />
              </button>

              <button
                onClick={handleResetToOriginal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>

              <button
                onClick={() => setIsAddRoomModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Ruang</span>
              </button>
            </>
          )}

          {isReadOnly && (
            <span className="text-xs font-medium px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-amber-600" />
              Mode Baca: Desain Awal Terkunci
            </span>
          )}
        </div>
      </div>

      {/* ACTIVE ALTERNATIVE EDITING BANNER */}
      {activeDesignMode === 'alternative' && (
        <div className="bg-indigo-50 border-2 border-indigo-300 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
              <Edit3 className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-indigo-950 text-sm">
                  Sedang Mengedit Alternatif: {currentDesign.name}
                </span>
                <span className="px-2 py-0.5 rounded bg-indigo-200 text-indigo-900 text-[10px] font-bold">
                  SNAPSHOT EDITABLE
                </span>
              </div>
              <p className="text-[11px] text-indigo-700 mt-0.5">
                Semua perubahan (pintu, dinding terbuka, jendela, tangga, tata letak) langsung tersimpan ke snapshot alternatif ini.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setWorkingDesign(cloneDesign(currentDesign));
                setActiveDesignMode('working');
                showNotification(`Desain dari alternatif "${currentDesign.name}" berhasil disalin menjadi Denah Kerja Utama!`);
              }}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              title="Terapkan seluruh konfigurasi alternatif ini ke Denah Kerja Utama"
            >
              <Check className="w-4 h-4" />
              <span>Terapkan ke Desain Utama</span>
            </button>
            <button
              onClick={() => {
                setActiveDesignMode('working');
                setSelectedAltId(null);
                showNotification('Kembali ke Denah Kerja Utama.');
              }}
              className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl font-semibold cursor-pointer transition-colors"
            >
              Kembali ke Denah Utama
            </button>
          </div>
        </div>
      )}

      {/* 2. REAL-TIME KPI STRIP */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-slate-500 block font-medium">Skor Kelayakan Desain</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className={`text-xl font-extrabold ${scoreBreakdown.overallScore >= 90 ? 'text-emerald-600' : 'text-indigo-600'}`}>
                {scoreBreakdown.overallScore}
              </span>
              <span className="text-slate-400 font-bold">/ 100</span>
            </div>
          </div>
          <Sparkles className="w-6 h-6 text-indigo-500 opacity-60" />
        </div>

        <div className={`p-3.5 rounded-xl border shadow-xs flex items-center justify-between ${
          scoreBreakdown.criticalWarnings.length > 0 ? 'bg-rose-50 border-rose-300 text-rose-900' : 'bg-emerald-50 border-emerald-300 text-emerald-900'
        }`}>
          <div>
            <span className="block font-medium">Integritas Struktur 2F</span>
            <strong className="text-sm font-bold block mt-0.5">
              {scoreBreakdown.criticalWarnings.length > 0 ? 'BAHAYA OVERLAP!' : '100% AMAN (Mandiri)'}
            </strong>
          </div>
          <ShieldAlert className={`w-6 h-6 ${scoreBreakdown.criticalWarnings.length > 0 ? 'text-rose-600 animate-pulse' : 'text-emerald-600'}`} />
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-slate-500 block font-medium">Luas Terbangun</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-base font-bold text-slate-900 font-mono">{budgetImpact.currentAreaM2} m²</span>
              {budgetImpact.areaDeltaM2 !== 0 && (
                <span className={`text-xs font-semibold ${budgetImpact.areaDeltaM2 > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  ({budgetImpact.areaDeltaM2 > 0 ? `+${budgetImpact.areaDeltaM2}` : budgetImpact.areaDeltaM2} m²)
                </span>
              )}
            </div>
          </div>
          <Building2 className="w-6 h-6 text-slate-400 opacity-60" />
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-slate-500 block font-medium">Selisih Anggaran RAB</span>
            <strong className={`text-sm font-bold block mt-0.5 font-mono ${
              budgetImpact.costDeltaIdr === 0 ? 'text-slate-700' : (budgetImpact.costDeltaIdr > 0 ? 'text-rose-600' : 'text-emerald-600')
            }`}>
              {budgetImpact.costDeltaIdr === 0 ? 'Rp 0 (Baseline)' : formatRupiah(budgetImpact.costDeltaIdr)}
            </strong>
          </div>
          <Ruler className="w-6 h-6 text-slate-400 opacity-60" />
        </div>
      </div>

      {/* 3. MAIN WORKSPACE: CANVAS + DRAWERS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* SVG CANVAS WORKSPACE (8 COLS) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 flex flex-col space-y-4">
          {/* Sub-toolbar */}
          <div className="flex flex-col gap-3 pb-3 border-b border-slate-100 text-xs">
            {/* Top row: Floor Filters, Tool Modes, and Advanced Modals */}
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              {/* Floor Filters (GF, 2F, ALL) */}
              <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 font-bold">
                <button
                  onClick={() => { setSelectedFloor('GF'); setSelectedRoomId(null); setSelectedFurnitureId(null); setSelectedDoorId(null); setIsProhibitedZoneSelected(false); }}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    selectedFloor === 'GF' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Lantai 1 (GF)
                </button>
                <button
                  onClick={() => { setSelectedFloor('2F'); setSelectedRoomId(null); setSelectedFurnitureId(null); setSelectedDoorId(null); setIsProhibitedZoneSelected(false); }}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    selectedFloor === '2F' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Lantai 2 (2F)
                </button>
                <button
                  onClick={() => { setSelectedFloor('ALL'); setSelectedRoomId(null); setSelectedFurnitureId(null); setSelectedDoorId(null); setIsProhibitedZoneSelected(false); }}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    selectedFloor === 'ALL' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Semua Lantai (ALL)
                </button>
              </div>

              {/* Mode A & B Pointer Tools (Part 2.1) */}
              <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-semibold">
                <button
                  onClick={() => setEditorTool('select')}
                  className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    editorTool === 'select' ? 'bg-white text-indigo-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Mode B: Pilih & Edit Objek / Titik Sudut (Shortcut: V)"
                >
                  <MousePointer className="w-3.5 h-3.5" />
                  <span>Pilih &amp; Edit (V)</span>
                </button>
                <button
                  onClick={() => setEditorTool('pan')}
                  className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    editorTool === 'pan' ? 'bg-white text-indigo-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Mode A: Geser & Navigasi Tampilan (Shortcut: H atau tahan Spasi / Klik Tengah)"
                >
                  <Hand className="w-3.5 h-3.5" />
                  <span>Geser / Pan (H)</span>
                </button>
              </div>

              {/* Advanced Feature Actions: Door, Usability, Swap */}
              <div className="flex flex-wrap items-center gap-1.5">
                {!isReadOnly && (
                  <>
                    <button
                      onClick={() => {
                        setIsPlacingDoor(!isPlacingDoor);
                        if (!isPlacingDoor) showNotification('Mode Pasang Pintu aktif: Klik dinding ruangan untuk menaruh kusen.');
                      }}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                        isPlacingDoor
                          ? 'bg-teal-600 text-white border-teal-700 shadow-xs ring-2 ring-teal-400'
                          : 'bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100'
                      }`}
                      title="Pasang kusen & daun pintu pada dinding ruangan"
                    >
                      <DoorClosed className="w-3.5 h-3.5" />
                      <span>{isPlacingDoor ? 'Batal Pasang' : '+ Pasang Pintu'}</span>
                    </button>

                    <button
                      onClick={() => {
                        const targetRoom = selectedRoom || roomsOnCurrentFloor[0];
                        if (targetRoom) {
                          handleAddWindow(targetRoom, 'casement', 'north');
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-sky-50 text-sky-800 hover:bg-sky-100 border border-sky-200 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                      title="Tambah jendela kaca atau roster ventilasi pada dinding"
                    >
                      <Maximize2 className="w-3.5 h-3.5 text-sky-600" />
                      <span>+ Jendela / Roster</span>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedStaircase(true);
                        setSelectedRoomId(null);
                        setSelectedFurnitureId(null);
                        setSelectedDoorId(null);
                        setSelectedWindowId(null);
                        setActiveInspectorTab('staircase');
                      }}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                        selectedStaircase
                          ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                          : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                      }`}
                      title="Buka pengaturan bentuk tangga (L-Shape, U-Shape, Lurus) & injakan"
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      <span>Atur Tangga</span>
                    </button>
                  </>
                )}

                <button
                  onClick={() => setShowUsabilityZones(!showUsabilityZones)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                    showUsabilityZones
                      ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                      : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                  }`}
                  title="Tampilkan amplop ruang bebas lemari, kursi makan, dan kloset"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Zona Bebas ({showUsabilityZones ? 'On' : 'Off'})</span>
                </button>

                <button
                  onClick={() => setIsUsabilityModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                  title="Buka simulasi uji usabilitas dan ergonomi ruang SNI"
                >
                  <HeartHandshake className="w-3.5 h-3.5" />
                  <span>Simulasi Usabilitas</span>
                </button>

                <button
                  onClick={() => setIsSwapModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                  title="Evaluasi Opsi A vs Opsi B penukaran posisi Tangga & KM Tamu"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5 text-amber-400" />
                  <span>Tukar Tangga &amp; KM</span>
                </button>

                {/* Bagikan ke Ibu & Cadangan (Feedback Items 3 & 6) */}
                <button
                  onClick={() => setIsFamilyShareModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs transition-colors"
                  title="Bagikan denah ke Ibu via link WhatsApp atau unduh cadangan JSON"
                >
                  <Share2 className="w-3.5 h-3.5 text-pink-200" />
                  <span>Bagikan ke Ibu / Cadangan</span>
                </button>

                <button
                  onClick={() => setIsCanvasFullscreen(!isCanvasFullscreen)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                  title="Tampilan layar penuh untuk HP atau tablet"
                >
                  <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{isCanvasFullscreen ? 'Keluar Layar Penuh' : 'Mode HP (Fullscreen)'}</span>
                </button>
              </div>
            </div>

            {/* Second row: Room Filter Dropdown & Category Toggles */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={selectedRoomFilter}
                  onChange={(e) => setSelectedRoomFilter(e.target.value)}
                  className="bg-white border border-slate-200 text-slate-800 text-[11px] rounded-lg px-2.5 py-1 font-medium cursor-pointer focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  title="Filter perabot berdasarkan ruangan"
                >
                  <option value="all">Semua Ruangan</option>
                  {roomsOnCurrentFloor.map(r => (
                    <option key={r.id} value={r.id}>
                      {getDynamicRoomLabel(r.id, r, currentDesign.customRoomLabels)} ({r.id})
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => setShowFurniture(!showFurniture)}
                  className={`px-2.5 py-1 rounded-lg border font-medium cursor-pointer transition-colors ${
                    showFurniture ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-white text-slate-500 border-slate-200'
                  }`}
                  title="Tampilkan / Sembunyikan Semua Perabot"
                >
                  Perabot ({showFurniture ? 'Aktif' : 'Sembunyi'})
                </button>
                <button
                  onClick={() => setShowDimensions(!showDimensions)}
                  className={`px-2.5 py-1 rounded-lg border font-medium cursor-pointer transition-colors ${
                    showDimensions ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-white text-slate-500 border-slate-200'
                  }`}
                >
                  Dimensi
                </button>
                <button
                  onClick={() => setSnapToGrid(!snapToGrid)}
                  className={`px-2.5 py-1 rounded-lg border font-medium cursor-pointer transition-colors ${
                    snapToGrid ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-slate-500 border-slate-200'
                  }`}
                >
                  <Grid className="w-3 h-3 inline mr-1" />
                  Snap ({gridSize}m)
                </button>
              </div>

              {/* Snapping inference guidance indicators */}
              <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                <span className="font-bold text-slate-700">Zoom: {Math.round(100 / viewZoom)}%</span>
                <span>•</span>
                <span>Pan: ({(-viewPan.x / 100).toFixed(1)}m, {(-viewPan.y / 100).toFixed(1)}m)</span>
                <span className="hidden sm:inline text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-[9.5px] font-sans font-medium">
                  Scroll: Zoom • Klik Kanan / Scroll Drag: Geser Kanvas
                </span>
              </div>
            </div>
          </div>

          {/* Category Visibility Filter Strip */}
          <div className="flex flex-wrap items-center gap-1.5 pb-2 text-[11px]">
            <span className="text-slate-400 font-semibold mr-1">Kategori:</span>
            {([
              { key: 'bedroom', label: 'Kamar Tidur' },
              { key: 'living', label: 'Ruang Tamu & RK' },
              { key: 'kitchen-dining', label: 'Dapur & Makan' },
              { key: 'bathroom', label: 'Kamar Mandi' },
              { key: 'laundry', label: 'Cuci / Laundry' },
              { key: 'built-in', label: 'Built-in / Tanam' },
              { key: 'outdoor', label: 'Teras & Taman' },
            ] as { key: FurnitureCategory; label: string }[]).map(cat => {
              const isActive = visibleCategories.has(cat.key);
              return (
                <button
                  key={cat.key}
                  onClick={() => {
                    const next = new Set(visibleCategories);
                    if (next.has(cat.key)) next.delete(cat.key);
                    else next.add(cat.key);
                    setVisibleCategories(next);
                  }}
                  className={`px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                    isActive
                      ? 'bg-slate-800 text-white border-slate-700 font-medium'
                      : 'bg-slate-100 text-slate-400 border-slate-200 line-through'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* SVG Canvas Container with floating zoom controls */}
          <div className={isCanvasFullscreen ? 'fixed inset-0 z-50 bg-slate-950 p-2 sm:p-4 flex flex-col justify-center items-center overflow-hidden' : 'relative overflow-hidden rounded-xl bg-slate-950 p-2 sm:p-4 border border-slate-800 flex justify-center'}>
            {/* Floating Navigation Controls */}
            <div className="absolute top-4 right-4 z-20 flex flex-col gap-1.5 bg-slate-900/90 backdrop-blur-xs p-1.5 rounded-xl border border-slate-700 shadow-xl">
              <button
                onClick={() => setIsCanvasFullscreen(!isCanvasFullscreen)}
                className="w-8 h-8 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center cursor-pointer transition-colors shadow-sm"
                title={isCanvasFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh (Mobile/Tablet)'}
              >
                {isCanvasFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={handleZoomIn}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center cursor-pointer transition-colors"
                title="Perbesar (Zoom In)"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={handleZoomOut}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center cursor-pointer transition-colors"
                title="Perkecil (Zoom Out)"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={handleZoomFit}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center cursor-pointer transition-colors"
                title="Paskan Layar (Fit to Canvas)"
              >
                <Target className="w-4 h-4" />
              </button>
              <button
                onClick={() => setEditorTool(prev => prev === 'pan' ? 'select' : 'pan')}
                className={`w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-colors ${
                  editorTool === 'pan' ? 'bg-amber-500 text-slate-950 font-bold shadow-xs' : 'bg-slate-800 hover:bg-slate-700 text-white'
                }`}
                title={editorTool === 'pan' ? 'Beralih ke Mode Pilih (V)' : 'Beralih ke Mode Geser Kanvas (H / Pan)'}
              >
                <Hand className="w-4 h-4" />
              </button>
            </div>

            {/* Notification Banner */}
            {actionNotice && (
              <div className="absolute top-4 left-4 z-20 px-3 py-1.5 bg-indigo-900/90 text-indigo-100 border border-indigo-500 rounded-lg text-xs shadow-lg backdrop-blur-xs animate-in fade-in">
                {actionNotice}
              </div>
            )}

            <svg
              ref={svgRef}
              viewBox={`${viewPan.x} ${viewPan.y} ${1040 * viewZoom} ${1240 * viewZoom}`}
              className={`w-full ${isCanvasFullscreen ? 'h-full max-h-[92vh]' : 'max-h-[720px]'} object-contain select-none ${
                isPanningViewport ? 'cursor-grabbing' : editorTool === 'pan' ? 'cursor-grab' : 'cursor-default'
              }`}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onContextMenu={(e) => {
                e.preventDefault();
                if (suppressNextContextMenuRef.current || rightDragDistanceRef.current > 4) {
                  suppressNextContextMenuRef.current = false;
                  rightDragDistanceRef.current = 0;
                  return;
                }
                const coords = getMetreCoords(e.clientX, e.clientY);
                setContextMenu({
                  isOpen: true,
                  x: e.clientX,
                  y: e.clientY,
                  target: { type: 'canvas', x: coords.x, y: coords.y },
                });
              }}
              onClick={() => {
                if (editorTool === 'select' && !isPlacingDoor && !selectionMarquee?.isActive && selectedRoomIds.length <= 1 && selectedFurnitureIds.length <= 1) {
                  setSelectedRoomId(null);
                  setSelectedFurnitureId(null);
                  setSelectedVertexIndex(null);
                  setSelectedDoorId(null);
                  setIsProhibitedZoneSelected(false);
                }
              }}
            >
              <defs>
                <pattern id="grid1m" width="100" height="100" patternUnits="userSpaceOnUse">
                  <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#1e293b" strokeWidth="1.2" />
                  <path d="M 50 0 L 50 100 M 0 50 L 100 50" fill="none" stroke="#0f172a" strokeWidth="0.8" strokeDasharray="2 2" />
                </pattern>
                <pattern id="diagonalHatchRed" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                  <line x1="0" y1="0" x2="0" y2="10" stroke="#f43f5e" strokeWidth="2" strokeOpacity="0.35" />
                </pattern>
              </defs>

              <rect x="0" y="0" width="1040" height="1240" fill="#090d16" />

              {/* Site Boundary: 9m x 11m (70, 70 to 970, 1170) */}
              <g transform="translate(70, 70)">
                <rect 
                  x="0" y="0" width="900" height="1100" 
                  fill="url(#grid1m)" 
                  stroke="#38bdf8" strokeWidth="2.5" 
                />

                {/* Meter labels */}
                {Array.from({ length: 10 }).map((_, i) => (
                  <text key={`top-${i}`} x={i * 100} y="-12" fill="#64748b" fontSize="12" fontFamily="monospace" textAnchor="middle">
                    {i}m
                  </text>
                ))}
                {Array.from({ length: 12 }).map((_, i) => (
                  <text key={`left-${i}`} x="-15" y={i * 100 + 4} fill="#64748b" fontSize="12" fontFamily="monospace" textAnchor="end">
                    {i}m
                  </text>
                ))}

                {/* PART 5.3: INTERACTIVE PROHIBITED ZONE OVERLAY (ON 2F & ALL) */}
                {(selectedFloor === '2F' || selectedFloor === 'ALL') && showProhibitedZone && currentProhibitedZone.isVisible !== false && (
                  <g 
                    id="prohibitedZoneOverlay" 
                    onMouseDown={handleMouseDownOnProhibitedZone}
                    className={`${isReadOnly || currentProhibitedZone.isLocked ? 'cursor-pointer' : 'cursor-move'} transition-all`}
                  >
                    <rect 
                      x={currentProhibitedZone.x * 100} 
                      y={currentProhibitedZone.y * 100} 
                      width={currentProhibitedZone.width * 100} 
                      height={currentProhibitedZone.depth * 100} 
                      fill="url(#diagonalHatchRed)" 
                      stroke={isProhibitedZoneSelected ? '#f43f5e' : '#fb7185'} 
                      strokeWidth={isProhibitedZoneSelected ? 3.5 : 2} 
                      strokeDasharray="6 4" 
                    />
                    <rect 
                      x={currentProhibitedZone.x * 100 + (currentProhibitedZone.width * 100) / 2 - 200} 
                      y={currentProhibitedZone.y * 100 + (currentProhibitedZone.depth * 100) / 2 - 24} 
                      width="400" 
                      height="48" 
                      rx="8" 
                      fill="#4c0519" 
                      fillOpacity="0.9" 
                      stroke="#f43f5e" 
                      strokeWidth="1.5" 
                    />
                    <text 
                      x={currentProhibitedZone.x * 100 + (currentProhibitedZone.width * 100) / 2} 
                      y={currentProhibitedZone.y * 100 + (currentProhibitedZone.depth * 100) / 2 - 3} 
                      fill="#fecdd3" 
                      fontSize="12" 
                      fontWeight="bold" 
                      textAnchor="middle"
                      pointerEvents="none"
                    >
                      {currentProhibitedZone.name}
                    </text>
                    <text 
                      x={currentProhibitedZone.x * 100 + (currentProhibitedZone.width * 100) / 2} 
                      y={currentProhibitedZone.y * 100 + (currentProhibitedZone.depth * 100) / 2 + 15} 
                      fill="#fda4af" 
                      fontSize="9.5" 
                      textAnchor="middle"
                      pointerEvents="none"
                    >
                      {currentProhibitedZone.isLocked ? 'Terkunci • Klik untuk Buka Gembok' : 'Batas Terlarang Interaktif (Bisa Digeser & Diubah)'}
                    </text>

                    {/* Resizing handles for Prohibited Zone */}
                    {isProhibitedZoneSelected && !isReadOnly && !currentProhibitedZone.isLocked && (
                      <g id="prohibited-zone-handles">
                        <rect x={currentProhibitedZone.x * 100 + currentProhibitedZone.width * 100 - 8} y={currentProhibitedZone.y * 100 + currentProhibitedZone.depth * 100 - 8} width="14" height="14" rx="2" fill="#f43f5e" stroke="#fff" strokeWidth="2" className="cursor-se-resize" onMouseDown={(e) => handleMouseDownOnProhibitedZoneHandle(e, 'se')} />
                        <rect x={currentProhibitedZone.x * 100 - 6} y={currentProhibitedZone.y * 100 + currentProhibitedZone.depth * 100 - 8} width="14" height="14" rx="2" fill="#f43f5e" stroke="#fff" strokeWidth="2" className="cursor-sw-resize" onMouseDown={(e) => handleMouseDownOnProhibitedZoneHandle(e, 'sw')} />
                        <rect x={currentProhibitedZone.x * 100 + currentProhibitedZone.width * 100 - 8} y={currentProhibitedZone.y * 100 - 6} width="14" height="14" rx="2" fill="#f43f5e" stroke="#fff" strokeWidth="2" className="cursor-ne-resize" onMouseDown={(e) => handleMouseDownOnProhibitedZoneHandle(e, 'ne')} />
                        <rect x={currentProhibitedZone.x * 100 - 6} y={currentProhibitedZone.y * 100 - 6} width="14" height="14" rx="2" fill="#f43f5e" stroke="#fff" strokeWidth="2" className="cursor-nw-resize" onMouseDown={(e) => handleMouseDownOnProhibitedZoneHandle(e, 'nw')} />
                      </g>
                    )}
                  </g>
                )}

                {/* USABILITY CLEARANCE OVERLAY (Part 7: Clearance Envelopes) */}
                {showUsabilityZones && runUsabilitySimulation(currentDesign, humanAvatar).clearanceZones
                  .filter(z => !z.floor || selectedFloor === 'ALL' || selectedFloor === z.floor)
                  .map(zone => {
                    let strokeCol = '#0ea5e9';
                    let fillCol = '#0284c7';
                    if (zone.sourceType === 'dining') {
                      strokeCol = '#f59e0b';
                      fillCol = '#d97706';
                    } else if (zone.sourceType === 'washing-machine') {
                      strokeCol = '#a855f7';
                      fillCol = '#7c3aed';
                    } else if (zone.sourceType === 'toilet') {
                      strokeCol = '#10b981';
                      fillCol = '#059669';
                    } else if (zone.sourceType === 'door') {
                      strokeCol = zone.status === 'warning' ? '#ef4444' : '#6366f1';
                      fillCol = zone.status === 'warning' ? '#dc2626' : '#4f46e5';
                    }

                    return (
                      <g key={zone.id} opacity={0.8}>
                        <rect
                          x={zone.x * 100}
                          y={zone.y * 100}
                          width={zone.width * 100}
                          height={zone.depth * 100}
                          fill={fillCol}
                          fillOpacity={0.16}
                          stroke={strokeCol}
                          strokeWidth="1.5"
                          strokeDasharray="4 3"
                          rx="3"
                        />
                        <text
                          x={(zone.x + zone.width / 2) * 100}
                          y={(zone.y + zone.depth / 2) * 100 + 3}
                          fill={strokeCol}
                          fontSize="8.5"
                          fontWeight="bold"
                          textAnchor="middle"
                          pointerEvents="none"
                        >
                          {zone.label || zone.name}
                        </text>
                      </g>
                    );
                  })
                }

                {/* ROOMS (RECTANGLES OR POLYGONS) */}
                {roomsOnCurrentFloor.map(room => {
                  const isSelected = selectedRoomId === room.id;
                  const isExisting = room.status === 'existing';
                  const isOverlapProhibited = selectedFloor === '2F' && overlapsExistingFootprint(room);

                  // Architectural Linting per room
                  const roomLintIssues = isArchitecturalLintingEnabled
                    ? scoreBreakdown.evaluations.filter(e => e.affectedRoomIds.includes(room.id))
                    : [];
                  const roomCriticalIssues = roomLintIssues.filter(e => e.severity === 'critical');
                  const roomWarningIssues = roomLintIssues.filter(e => e.severity === 'high' || e.severity === 'medium');
                  const hasCriticalLint = roomCriticalIssues.length > 0;
                  const hasWarningLint = roomWarningIssues.length > 0;
                  const roomFamilyNotes = (currentDesign.familyNotes || []).filter(n => n.roomId === room.id);

                  let fillColor = '#1e1b4b';
                  let strokeColor = '#818cf8';

                  if (isExisting) {
                    fillColor = '#451a03';
                    strokeColor = '#f59e0b';
                  } else if (room.id.includes('bath')) {
                    fillColor = '#155e75';
                    strokeColor = '#22d3ee';
                  } else if (room.id.includes('yard') || room.floorFinish === 'grass') {
                    fillColor = '#064e3b';
                    strokeColor = '#10b981';
                  } else if (room.floorFinish === 'wood-deck') {
                    fillColor = '#451a03';
                    strokeColor = '#d97706';
                  }

                  if (isOverlapProhibited) {
                    fillColor = '#7f1d1d';
                    strokeColor = '#f43f5e';
                  }

                  // Linting visual overrides
                  if (isArchitecturalLintingEnabled) {
                    if (hasCriticalLint) {
                      fillColor = '#581c1c';
                      strokeColor = '#ef4444';
                    } else if (hasWarningLint && !isOverlapProhibited) {
                      fillColor = '#451a03';
                      strokeColor = '#f59e0b';
                    }
                  }

                  if (isSelected) {
                    strokeColor = '#38bdf8';
                  }

                  const xPx = room.x * 100;
                  const yPx = room.y * 100;
                  const wPx = room.width * 100;
                  const dPx = room.depth * 100;

                  const hasPolygon = room.polygonPoints && room.polygonPoints.length >= 3;

                  return (
                    <g 
                      key={room.id}
                      onMouseDown={(e) => {
                        if (editorTool === 'select' && !isPlacingDoor) {
                          handleMouseDownOnRoom(e, room);
                        }
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (suppressNextContextMenuRef.current || rightDragDistanceRef.current > 4) {
                          suppressNextContextMenuRef.current = false;
                          rightDragDistanceRef.current = 0;
                          return;
                        }
                        setContextMenu({
                          isOpen: true,
                          x: e.clientX,
                          y: e.clientY,
                          target: {
                            type: 'room',
                            roomId: room.id,
                            roomName: getDynamicRoomLabel(room.id, room, currentDesign.customRoomLabels),
                            isLocked: Boolean(room.isLocked),
                            hasPolygon: Boolean(hasPolygon),
                          },
                        });
                      }}
                      className={`${isReadOnly || room.isLocked || editorTool === 'pan' ? 'cursor-pointer' : 'cursor-move'} transition-all`}
                    >
                      {/* Render polygon if available, else standard rect */}
                      {hasPolygon ? (
                        <polygon
                          points={room.polygonPoints!.map(p => `${p.x * 100},${p.y * 100}`).join(' ')}
                          fill={fillColor}
                          fillOpacity={isSelected ? 0.95 : 0.75}
                          stroke={strokeColor}
                          strokeWidth={isSelected ? 3.5 : 2}
                          strokeDasharray={isExisting ? '6 4' : 'none'}
                        />
                      ) : (
                        <g id={`room-walls-${room.id}`}>
                          {/* Room Interior Fill */}
                          <rect
                            x={xPx + 4}
                            y={yPx + 4}
                            width={wPx - 8}
                            height={dPx - 8}
                            rx="5"
                            fill={fillColor}
                            fillOpacity={isSelected ? 0.95 : 0.75}
                            stroke={isSelected ? strokeColor : '#334155'}
                            strokeWidth={isSelected ? 2.5 : 1}
                          />

                          {/* Individual Wall Outlines with Solid/Railing/Open/Half-Open Styling */}
                          {(() => {
                            const ow = room.openWalls || { north: 'solid', south: 'solid', east: 'solid', west: 'solid' };
                            const renderHorizontalWall = (wType: WallOpeningType, yCoord: number, labelY: number) => {
                              const midX = xPx + wPx / 2;
                              if (wType === 'open-half-start') {
                                return (
                                  <>
                                    <line x1={xPx + 4} y1={yCoord} x2={midX} y2={yCoord} stroke="#10b981" strokeWidth={1.8} strokeDasharray="5 4" />
                                    <line x1={midX} y1={yCoord} x2={xPx + wPx - 4} y2={yCoord} stroke={strokeColor} strokeWidth={isSelected ? 3.5 : 2} strokeDasharray={isExisting ? '6 4' : 'none'} />
                                    <text x={xPx + wPx * 0.25} y={labelY} fill="#10b981" fontSize="7" fontWeight="bold" textAnchor="middle">½ TERBUKA</text>
                                  </>
                                );
                              }
                              if (wType === 'open-half-end') {
                                return (
                                  <>
                                    <line x1={xPx + 4} y1={yCoord} x2={midX} y2={yCoord} stroke={strokeColor} strokeWidth={isSelected ? 3.5 : 2} strokeDasharray={isExisting ? '6 4' : 'none'} />
                                    <line x1={midX} y1={yCoord} x2={xPx + wPx - 4} y2={yCoord} stroke="#10b981" strokeWidth={1.8} strokeDasharray="5 4" />
                                    <text x={xPx + wPx * 0.75} y={labelY} fill="#10b981" fontSize="7" fontWeight="bold" textAnchor="middle">½ TERBUKA</text>
                                  </>
                                );
                              }
                              return (
                                <>
                                  <line
                                    x1={xPx + 4} y1={yCoord} x2={xPx + wPx - 4} y2={yCoord}
                                    stroke={wType === 'open' ? '#10b981' : (wType === 'railing' ? '#06b6d4' : strokeColor)}
                                    strokeWidth={wType === 'open' ? 1.5 : (wType === 'railing' ? 2.5 : (isSelected ? 3.5 : 2))}
                                    strokeDasharray={wType === 'open' ? '5 4' : (wType === 'railing' ? '3 2' : (isExisting ? '6 4' : 'none'))}
                                  />
                                  {wType === 'open' && (
                                    <text x={midX} y={labelY} fill="#10b981" fontSize="7.5" fontWeight="bold" textAnchor="middle">TERBUKA</text>
                                  )}
                                  {wType === 'railing' && (
                                    <text x={midX} y={labelY} fill="#06b6d4" fontSize="7.5" fontWeight="bold" textAnchor="middle">PAGAR RAILING</text>
                                  )}
                                </>
                              );
                            };

                            const renderVerticalWall = (wType: WallOpeningType, xCoord: number, isEast: boolean) => {
                              const midY = yPx + dPx / 2;
                              if (wType === 'open-half-start') {
                                return (
                                  <>
                                    <line x1={xCoord} y1={yPx + 4} x2={xCoord} y2={midY} stroke="#10b981" strokeWidth={1.8} strokeDasharray="5 4" />
                                    <line x1={xCoord} y1={midY} x2={xCoord} y2={yPx + dPx - 4} stroke={strokeColor} strokeWidth={isSelected ? 3.5 : 2} strokeDasharray={isExisting ? '6 4' : 'none'} />
                                  </>
                                );
                              }
                              if (wType === 'open-half-end') {
                                return (
                                  <>
                                    <line x1={xCoord} y1={yPx + 4} x2={xCoord} y2={midY} stroke={strokeColor} strokeWidth={isSelected ? 3.5 : 2} strokeDasharray={isExisting ? '6 4' : 'none'} />
                                    <line x1={xCoord} y1={midY} x2={xCoord} y2={yPx + dPx - 4} stroke="#10b981" strokeWidth={1.8} strokeDasharray="5 4" />
                                  </>
                                );
                              }
                              return (
                                <>
                                  <line
                                    x1={xCoord} y1={yPx + 4} x2={xCoord} y2={yPx + dPx - 4}
                                    stroke={wType === 'open' ? '#10b981' : (wType === 'railing' ? '#06b6d4' : strokeColor)}
                                    strokeWidth={wType === 'open' ? 1.5 : (wType === 'railing' ? 2.5 : (isSelected ? 3.5 : 2))}
                                    strokeDasharray={wType === 'open' ? '5 4' : (wType === 'railing' ? '3 2' : (isExisting ? '6 4' : 'none'))}
                                  />
                                  {isEast && wType === 'open' && (
                                    <text x={xPx + wPx + 6} y={midY} fill="#10b981" fontSize="7.5" fontWeight="bold" textAnchor="start">TERBUKA</text>
                                  )}
                                </>
                              );
                            };

                            return (
                              <>
                                {renderHorizontalWall(ow.north || 'solid', yPx + 4, yPx - 2)}
                                {renderHorizontalWall(ow.south || 'solid', yPx + dPx - 4, yPx + dPx + 8)}
                                {renderVerticalWall(ow.west || 'solid', xPx + 4, false)}
                                {renderVerticalWall(ow.east || 'solid', xPx + wPx - 4, true)}
                              </>
                            );
                          })()}
                        </g>
                      )}

                      {/* Dynamic Room Text Label based on Room ID */}
                      {(() => {
                        const dynamicLabel = getDynamicRoomLabel(room.id, room, currentDesign.customRoomLabels);
                        const isCustom = Boolean(
                          (currentDesign.customRoomLabels && currentDesign.customRoomLabels[room.id]) ||
                          room.customLabel
                        );
                        const labelY = yPx + Math.min(30, Math.max(18, dPx * 0.3));
                        const labelFontSize = wPx < 160 ? 10.5 : (dynamicLabel.length > 18 ? 12 : 13.5);
                        const idFontSize = wPx < 160 ? 8 : 9;

                        return (
                          <g className="room-dynamic-label-group pointer-events-none select-none">
                            {/* Room ID Tag / Custom Badge */}
                            <text
                              x={xPx + wPx / 2}
                              y={labelY - labelFontSize - 1}
                              fill={isCustom ? '#38bdf8' : '#94a3b8'}
                              fontSize={idFontSize}
                              fontWeight="700"
                              fontFamily="monospace"
                              textAnchor="middle"
                              letterSpacing="0.05em"
                            >
                              [{room.id.toUpperCase()}{isCustom ? ' • KUSTOM' : ''}]
                            </text>

                            {/* Dynamic Text Label */}
                            <text
                              x={xPx + wPx / 2}
                              y={labelY}
                              fill="#ffffff"
                              fontSize={labelFontSize}
                              fontWeight="bold"
                              textAnchor="middle"
                              filter="drop-shadow(0px 1px 2px rgba(0,0,0,0.85))"
                            >
                              {dynamicLabel}
                            </text>

                            {showDimensions && (
                              <text
                                x={xPx + wPx / 2}
                                y={labelY + labelFontSize + 3}
                                fill="#93c5fd"
                                fontSize={wPx < 160 ? 9 : 11}
                                fontFamily="monospace"
                                textAnchor="middle"
                                filter="drop-shadow(0px 1px 1px rgba(0,0,0,0.6))"
                              >
                                {room.width.toFixed(2)}m × {room.depth.toFixed(2)}m ({room.area.toFixed(1)}m²)
                              </text>
                            )}
                          </g>
                        );
                      })()}

                      {/* 2D Garden Stepping Stones & Finish Indicator */}
                      {(room.floorFinish === 'grass' || (room.id === 'rear_service_yard' && !room.floorFinish)) && (
                        <g pointerEvents="none" opacity="0.7">
                          <rect x={xPx + wPx * 0.18} y={yPx + dPx * 0.68} width={28} height={18} rx="4" fill="#cbd5e1" stroke="#64748b" strokeWidth="1" />
                          <rect x={xPx + wPx * 0.44} y={yPx + dPx * 0.68} width={28} height={18} rx="4" fill="#cbd5e1" stroke="#64748b" strokeWidth="1" />
                          <rect x={xPx + wPx * 0.70} y={yPx + dPx * 0.68} width={28} height={18} rx="4" fill="#cbd5e1" stroke="#64748b" strokeWidth="1" />
                          <circle cx={xPx + 22} cy={yPx + dPx - 22} r="10" fill="#16a34a" stroke="#bbf7d0" strokeWidth="1" />
                          <circle cx={xPx + wPx - 22} cy={yPx + dPx - 22} r="11" fill="#15803d" stroke="#bbf7d0" strokeWidth="1" />
                        </g>
                      )}

                      {/* ARCHITECTURAL LINTING INTERACTIVE WARNING PIN (Only shown when Linting is enabled) */}
                      {isArchitecturalLintingEnabled && (hasCriticalLint || hasWarningLint) && (
                        <g
                          transform={`translate(${xPx + 20}, ${yPx + 20})`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLintPopoverRoomId(room.id);
                            setSelectedNotePopoverRoomId(null);
                          }}
                          className="cursor-pointer"
                        >
                          <circle
                            r="11"
                            fill={hasCriticalLint ? '#dc2626' : '#d97706'}
                            stroke="#ffffff"
                            strokeWidth="2"
                            className={hasCriticalLint ? 'animate-pulse' : ''}
                          />
                          <text
                            y="4"
                            fill="#ffffff"
                            fontSize="11"
                            fontWeight="bold"
                            textAnchor="middle"
                            pointerEvents="none"
                          >
                            !
                          </text>
                        </g>
                      )}

                      {/* FAMILY & MOM FEEDBACK ROOM PIN (Only shown on demand so it never blocks design) */}
                      {(showFamilyNotePins || isPinningFamilyNoteMode) && roomFamilyNotes.length > 0 && (
                        <g
                          transform={`translate(${xPx + wPx - 20}, ${yPx + 20})`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedNotePopoverRoomId(room.id);
                            setSelectedLintPopoverRoomId(null);
                          }}
                          className="cursor-pointer"
                        >
                          <circle
                            r="11"
                            fill="#f43f5e"
                            stroke="#ffffff"
                            strokeWidth="2"
                          />
                          <path
                            d="M -4.5 -2.5 C -4.5 -4.5 -2 -5.5 0 -3.5 C 2 -5.5 4.5 -4.5 4.5 -2.5 C 4.5 1 0 4.5 0 4.5 C 0 4.5 -4.5 1 -4.5 -2.5 Z"
                            fill="#ffffff"
                            pointerEvents="none"
                          />
                          {roomFamilyNotes.length > 1 && (
                            <circle
                              cx="8"
                              cy="-8"
                              r="6"
                              fill="#9f1239"
                              stroke="#ffffff"
                              strokeWidth="1"
                            />
                          )}
                          {roomFamilyNotes.length > 1 && (
                            <text
                              x="8"
                              y="-5.5"
                              fill="#ffffff"
                              fontSize="7.5"
                              fontWeight="bold"
                              textAnchor="middle"
                              pointerEvents="none"
                            >
                              {roomFamilyNotes.length}
                            </text>
                          )}
                        </g>
                      )}

                      {/* BIDIRECTIONAL RESIZE HANDLES (8 handles for rectangular rooms) */}
                      {isSelected && !isReadOnly && !room.isLocked && !hasPolygon && editorTool === 'select' && (
                        <g id={`handles-${room.id}`}>
                          {/* Corners */}
                          <rect x={xPx + wPx - 9} y={yPx + dPx - 9} width="12" height="12" rx="2" fill="#38bdf8" stroke="#fff" strokeWidth="1.5" className="cursor-se-resize" onMouseDown={(e) => handleMouseDownOnHandle(e, 'se')} />
                          <rect x={xPx - 3} y={yPx + dPx - 9} width="12" height="12" rx="2" fill="#38bdf8" stroke="#fff" strokeWidth="1.5" className="cursor-sw-resize" onMouseDown={(e) => handleMouseDownOnHandle(e, 'sw')} />
                          <rect x={xPx + wPx - 9} y={yPx - 3} width="12" height="12" rx="2" fill="#38bdf8" stroke="#fff" strokeWidth="1.5" className="cursor-ne-resize" onMouseDown={(e) => handleMouseDownOnHandle(e, 'ne')} />
                          <rect x={xPx - 3} y={yPx - 3} width="12" height="12" rx="2" fill="#38bdf8" stroke="#fff" strokeWidth="1.5" className="cursor-nw-resize" onMouseDown={(e) => handleMouseDownOnHandle(e, 'nw')} />

                          {/* Edges */}
                          <rect x={xPx + wPx - 8} y={yPx + dPx / 2 - 6} width="11" height="11" rx="2" fill="#818cf8" stroke="#fff" strokeWidth="1.5" className="cursor-e-resize" onMouseDown={(e) => handleMouseDownOnHandle(e, 'e')} />
                          <rect x={xPx - 3} y={yPx + dPx / 2 - 6} width="11" height="11" rx="2" fill="#818cf8" stroke="#fff" strokeWidth="1.5" className="cursor-w-resize" onMouseDown={(e) => handleMouseDownOnHandle(e, 'w')} />
                          <rect x={xPx + wPx / 2 - 6} y={yPx + dPx - 8} width="11" height="11" rx="2" fill="#818cf8" stroke="#fff" strokeWidth="1.5" className="cursor-s-resize" onMouseDown={(e) => handleMouseDownOnHandle(e, 's')} />
                          <rect x={xPx + wPx / 2 - 6} y={yPx - 3} width="11" height="11" rx="2" fill="#818cf8" stroke="#fff" strokeWidth="1.5" className="cursor-n-resize" onMouseDown={(e) => handleMouseDownOnHandle(e, 'n')} />
                        </g>
                      )}

                      {/* POLYGON VERTEX HANDLES with Right-Click Context Menu */}
                      {isSelected && !isReadOnly && !room.isLocked && hasPolygon && editorTool === 'select' && (
                        <g id={`polygon-vertices-${room.id}`}>
                          {room.polygonPoints!.map((pt, pIdx) => (
                            <circle
                              key={pIdx}
                              cx={pt.x * 100}
                              cy={pt.y * 100}
                              r={selectedVertexIndex === pIdx ? 8 : 6}
                              fill={selectedVertexIndex === pIdx ? '#f59e0b' : '#38bdf8'}
                              stroke="#ffffff"
                              strokeWidth="2"
                              className="cursor-pointer"
                              onMouseDown={(e) => handleMouseDownOnVertex(e, pIdx, pt)}
                              onContextMenu={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setContextMenu({
                                  isOpen: true,
                                  x: e.clientX,
                                  y: e.clientY,
                                  target: {
                                    type: 'vertex',
                                    roomId: room.id,
                                    vertexIndex: pIdx,
                                    x: pt.x,
                                    y: pt.y,
                                  },
                                });
                              }}
                            />
                          ))}
                        </g>
                      )}
                    </g>
                  );
                })}

                {/* ARCHITECTURAL SLIDING GLASS WALLS & CURTAINS (Feedback Item 8) */}
                {roomsOnCurrentFloor
                  .filter(r => r.glassWall?.hasGlassWall)
                  .map(r => {
                    const resolvedGw = resolveGlassWallDimensions(r);
                    return (
                      <ArchitecturalGlassWallSymbol
                        key={`glass-wall-${r.id}`}
                        x={r.x}
                        y={r.y}
                        width={r.width}
                        depth={r.depth}
                        wallSide={resolvedGw.wallSide}
                        glassWidth={resolvedGw.glassWidth}
                        glassHeight={resolvedGw.glassHeight}
                        alignment={resolvedGw.alignment}
                        panelCount={resolvedGw.panelCount}
                        hasCurtain={resolvedGw.hasCurtain}
                        curtainType={resolvedGw.curtainType}
                      />
                    );
                  })}

                {/* ARCHITECTURAL SKYLIGHT ATAP KACA VOID BELAKANG (Feedback Item 8) */}
                {roomsOnCurrentFloor
                  .filter(r => r.skylight?.hasSkylight)
                  .map(r => (
                    <ArchitecturalSkylightSymbol
                      key={`skylight-${r.id}`}
                      x={r.x}
                      y={r.y}
                      width={r.width}
                      depth={r.depth}
                      glassTint={r.skylight?.glassTint || 'clear'}
                    />
                  ))}

                {/* DOORS & WALL OPENINGS (Part 6) */}
                {currentDoors
                  .filter(d => selectedFloor === 'ALL' || d.floor === selectedFloor)
                  .map(door => {
                    const isDoorSelected = selectedDoorId === door.id;
                    const doorXPx = door.x * 100;
                    const doorYPx = door.y * 100;
                    const doorWPx = door.width * 100;
                    const isHorizontal = door.wallSide === 'north' || door.wallSide === 'south';

                    const hingeXPx = door.hingeSide === 'left' ? doorXPx : doorXPx + (isHorizontal ? doorWPx : 0);
                    const hingeYPx = door.hingeSide === 'left' ? doorYPx : doorYPx + (isHorizontal ? 0 : doorWPx);
                    const rPx = doorWPx;

                    return (
                      <g
                        key={door.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDoorId(door.id);
                          setSelectedRoomId(null);
                          setSelectedFurnitureId(null);
                          setSelectedVertexIndex(null);
                          setActiveInspectorTab('room');
                        }}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          updateDoorProperty(door.id, { isOpen: !door.isOpen });
                        }}
                        className="cursor-pointer"
                      >
                        {/* Physical Wall Opening Gap / Frame Jambs */}
                        {isHorizontal ? (
                          <>
                            <rect x={doorXPx - 3} y={doorYPx - 4} width="6" height="8" fill="#e2e8f0" stroke="#0f172a" strokeWidth="1" />
                            <rect x={doorXPx + doorWPx - 3} y={doorYPx - 4} width="6" height="8" fill="#e2e8f0" stroke="#0f172a" strokeWidth="1" />
                          </>
                        ) : (
                          <>
                            <rect x={doorXPx - 4} y={doorYPx - 3} width="8" height="6" fill="#e2e8f0" stroke="#0f172a" strokeWidth="1" />
                            <rect x={doorXPx - 4} y={doorYPx + doorWPx - 3} width="8" height="6" fill="#e2e8f0" stroke="#0f172a" strokeWidth="1" />
                          </>
                        )}

                        {/* Swing Arc (90 degrees quarter-circle dashed) */}
                        <path
                          d={
                            isHorizontal
                              ? (door.swingDirection === 'inward'
                                  ? `M ${doorXPx} ${doorYPx} A ${rPx} ${rPx} 0 0 1 ${doorXPx + rPx} ${doorYPx + rPx}`
                                  : `M ${doorXPx} ${doorYPx} A ${rPx} ${rPx} 0 0 0 ${doorXPx + rPx} ${doorYPx - rPx}`)
                              : (door.swingDirection === 'inward'
                                  ? `M ${doorXPx} ${doorYPx} A ${rPx} ${rPx} 0 0 1 ${doorXPx + rPx} ${doorYPx + rPx}`
                                  : `M ${doorXPx} ${doorYPx} A ${rPx} ${rPx} 0 0 0 ${doorXPx - rPx} ${doorYPx + rPx}`)
                          }
                          fill="none"
                          stroke={isDoorSelected ? '#38bdf8' : '#94a3b8'}
                          strokeWidth="1.2"
                          strokeDasharray="3 3"
                        />

                        {/* Door Leaf Rectangle */}
                        {door.isOpen ? (
                          <rect
                            x={hingeXPx - 2}
                            y={hingeYPx}
                            width={isHorizontal ? 4 : rPx}
                            height={isHorizontal ? rPx : 4}
                            rx="1.5"
                            fill={isDoorSelected ? '#38bdf8' : '#cbd5e1'}
                            stroke="#0f172a"
                            strokeWidth="1"
                          />
                        ) : (
                          <rect
                            x={doorXPx}
                            y={doorYPx - 2}
                            width={isHorizontal ? doorWPx : 4}
                            height={isHorizontal ? 4 : doorWPx}
                            rx="1.5"
                            fill={isDoorSelected ? '#38bdf8' : '#e2e8f0'}
                            stroke="#0f172a"
                            strokeWidth="1"
                          />
                        )}

                        {/* Door Label */}
                        <text
                          x={doorXPx + (isHorizontal ? doorWPx / 2 : 12)}
                          y={doorYPx + (isHorizontal ? -8 : doorWPx / 2)}
                          fill={isDoorSelected ? '#38bdf8' : '#94a3b8'}
                          fontSize="8"
                          fontWeight="bold"
                          textAnchor="middle"
                          pointerEvents="none"
                        >
                          {door.name} ({(door.width * 100).toFixed(0)}cm)
                        </text>
                      </g>
                    );
                  })
                }

                {/* DYNAMIC ALIGNMENT GUIDES (Part 1.2: Inference Guides) */}
                {activeAlignmentGuides.map((guide, idx) => (
                  <g key={`guide-${idx}`} pointerEvents="none">
                    <line
                      x1={guide.line.x1 * 100}
                      y1={guide.line.y1 * 100}
                      x2={guide.line.x2 * 100}
                      y2={guide.line.y2 * 100}
                      stroke="#f59e0b"
                      strokeWidth="2"
                      strokeDasharray="5 3"
                    />
                    <circle cx={guide.snappedPoint.x * 100} cy={guide.snappedPoint.y * 100} r="5" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />
                    <rect
                      x={guide.snappedPoint.x * 100 + 8}
                      y={guide.snappedPoint.y * 100 - 12}
                      width={guide.label.length * 6.5 + 14}
                      height="20"
                      rx="4"
                      fill="#451a03"
                      fillOpacity="0.9"
                      stroke="#f59e0b"
                      strokeWidth="1"
                    />
                    <text
                      x={guide.snappedPoint.x * 100 + 15}
                      y={guide.snappedPoint.y * 100 + 2}
                      fill="#fef3c7"
                      fontSize="9.5"
                      fontWeight="bold"
                    >
                      {guide.label}
                    </text>
                  </g>
                ))}

                {/* DRAGGABLE INDONESIAN HUMAN SCALE AVATAR (Part 7) */}
                {showUsabilityZones && (
                  <g
                    transform={`translate(${humanAvatarPos.x * 100}, ${humanAvatarPos.y * 100})`}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setIsDraggingAvatar(true);
                      const coords = getMetreCoords(e.clientX, e.clientY);
                      setDragStart({ x: coords.x, y: coords.y });
                    }}
                    className="cursor-grab active:cursor-grabbing select-none"
                  >
                    <circle r="45" fill="#38bdf8" fillOpacity="0.12" stroke="#38bdf8" strokeWidth="1.2" strokeDasharray="3 2" />
                    <circle r="25" fill="#0284c7" fillOpacity="0.85" stroke="#ffffff" strokeWidth="2" />
                    <circle r="8" fill="#ffffff" />
                    <path d="M 0 -8 L 0 -22 M -4 -16 L 0 -22 L 4 -16" stroke="#ffffff" strokeWidth="2" fill="none" />
                    <text y="40" fill="#38bdf8" fontSize="9" fontWeight="bold" textAnchor="middle" className="pointer-events-none">
                      Avatar {humanAvatar.heightCm}cm / Bahu {humanAvatar.shoulderWidthCm}cm
                    </text>
                  </g>
                )}

                {/* STAIRCASE CAD RENDERING (Visible on GF & ALL) */}
                {(selectedFloor === 'GF' || selectedFloor === 'ALL') && (
                  <g
                    onClick={() => {
                      setSelectedStaircase(true);
                      setSelectedRoomId(null);
                      setSelectedFurnitureId(null);
                      setSelectedDoorId(null);
                      setSelectedWindowId(null);
                      setActiveInspectorTab('staircase');
                    }}
                    onMouseDown={handleMouseDownOnStaircase}
                  >
                    <ArchitecturalStaircaseSymbol
                      config={currentStaircase}
                      isSelected={selectedStaircase}
                    />
                  </g>
                )}

                {/* WINDOWS & VENTILATION ROSTER CAD RENDERING */}
                {currentWindows
                  .filter(w => selectedFloor === 'ALL' || w.floor === selectedFloor)
                  .map(win => (
                    <g
                      key={win.id}
                      onClick={() => {
                        setSelectedWindowId(win.id);
                        setSelectedRoomId(null);
                        setSelectedFurnitureId(null);
                        setSelectedDoorId(null);
                        setSelectedStaircase(false);
                        setActiveInspectorTab('room');
                      }}
                      onDoubleClick={() => {
                        updateWindowProperty(win.id, { isOpen: !win.isOpen });
                      }}
                    >
                      <ArchitecturalWindowSymbol
                        window={win}
                        isSelected={selectedWindowId === win.id}
                      />
                    </g>
                  ))}

                {/* FURNITURE OVERLAY (Interactive, Draggable & Filtered by Floor/Category/Room) */}
                {showFurniture && currentDesign.furniture
                  .filter(f => {
                    const isGf = currentDesign.groundFloorRooms.some(r => r.id === f.roomId);
                    const is2f = currentDesign.secondFloorRooms.some(r => r.id === f.roomId);
                    if (selectedFloor === 'GF' && !isGf) return false;
                    if (selectedFloor === '2F' && !is2f) return false;
                    if (f.category && !visibleCategories.has(f.category)) return false;
                    if (selectedRoomFilter !== 'all' && f.roomId !== selectedRoomFilter) return false;
                    return true;
                  })
                  .map(f => {
                    const isFurnSelected = selectedFurnitureId === f.id || selectedFurnitureIds.includes(f.id);
                    const fX = f.x * 100;
                    const fY = f.y * 100;
                    const fW = f.width * 100;
                    const fD = f.depth * 100;

                    return (
                      <g 
                        key={f.id} 
                        transform={`translate(${fX}, ${fY}) rotate(${f.rotation || 0}, ${fW / 2}, ${fD / 2})`}
                        onMouseDown={(e) => {
                          if (editorTool === 'select' && !isPlacingDoor) {
                            handleMouseDownOnFurniture(e, f);
                          }
                        }}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (suppressNextContextMenuRef.current || rightDragDistanceRef.current > 4) {
                            suppressNextContextMenuRef.current = false;
                            rightDragDistanceRef.current = 0;
                            return;
                          }
                          setContextMenu({
                            isOpen: true,
                            x: e.clientX,
                            y: e.clientY,
                            target: {
                              type: 'furniture',
                              furnitureId: f.id,
                              furnitureName: f.name,
                            },
                          });
                        }}
                        className={`${isReadOnly || editorTool === 'pan' ? 'cursor-pointer' : 'cursor-move'} transition-all`}
                      >
                        <ArchitecturalFurnitureSymbol item={f} isSelected={isFurnSelected} />
                        {selectedFurnitureIds.includes(f.id) && selectedFurnitureIds.length > 1 && (
                          <rect
                            x="-3"
                            y="-3"
                            width={fW + 6}
                            height={fD + 6}
                            rx="3"
                            fill="none"
                            stroke="#818cf8"
                            strokeWidth="2"
                            strokeDasharray="4 2"
                            pointerEvents="none"
                          />
                        )}
                      </g>
                    );
                  })}

                {/* CANVA-STYLE SELECTION MARQUEE RECTANGLE (Feedback Item 4) */}
                {selectionMarquee && selectionMarquee.isActive && (() => {
                  const minX = Math.min(selectionMarquee.startX, selectionMarquee.currentX);
                  const maxX = Math.max(selectionMarquee.startX, selectionMarquee.currentX);
                  const minY = Math.min(selectionMarquee.startY, selectionMarquee.currentY);
                  const maxY = Math.max(selectionMarquee.startY, selectionMarquee.currentY);
                  return (
                    <rect
                      x={minX * 100}
                      y={minY * 100}
                      width={Math.max(2, (maxX - minX) * 100)}
                      height={Math.max(2, (maxY - minY) * 100)}
                      fill="#818cf8"
                      fillOpacity="0.22"
                      stroke="#c7d2fe"
                      strokeWidth="2"
                      strokeDasharray="5 3"
                      rx="3"
                      pointerEvents="none"
                    />
                  );
                })()}
              </g>
            </svg>

            {/* FLOATING CANVA MULTI-SELECT GROUP PILL */}
            {(selectedRoomIds.length + selectedFurnitureIds.length) > 1 && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-4 py-2 bg-indigo-950/95 border border-indigo-400 text-white rounded-xl shadow-2xl flex items-center gap-3 text-xs font-semibold backdrop-blur-md animate-in fade-in">
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-pulse shrink-0" />
                <span>
                  <strong>{selectedRoomIds.length + selectedFurnitureIds.length} Objek Diblok (Canva Style)</strong> • Geser salah satu untuk memindahkan bersama!
                </span>
                <button
                  onClick={() => {
                    setSelectedRoomIds([]);
                    setSelectedFurnitureIds([]);
                  }}
                  className="px-2.5 py-1 bg-indigo-800 hover:bg-indigo-700 text-indigo-100 rounded text-[11px] cursor-pointer"
                >
                  Batal Blok
                </button>
              </div>
            )}

            {/* PINNING MODE BANNER */}
            {isPinningFamilyNoteMode && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-4 py-2 bg-rose-600 text-white rounded-xl shadow-xl flex items-center gap-3 text-xs font-semibold animate-in fade-in">
                <Heart className="w-4 h-4 fill-white shrink-0" />
                <span>Mode Tempel Catatan Ibu: Klik salah satu ruangan di denah untuk menuliskan catatan!</span>
                <button
                  onClick={() => setIsPinningFamilyNoteMode(false)}
                  className="px-2 py-0.5 bg-rose-700 hover:bg-rose-800 rounded text-[11px] cursor-pointer"
                >
                  Batal
                </button>
              </div>
            )}

            {/* LINTING POPOVER CARD */}
            {selectedLintPopoverRoomId && (() => {
              const targetRoom = [...currentDesign.groundFloorRooms, ...currentDesign.secondFloorRooms].find(r => r.id === selectedLintPopoverRoomId);
              const roomIssues = scoreBreakdown.evaluations.filter(e => e.affectedRoomIds.includes(selectedLintPopoverRoomId));
              return (
                <div className="absolute bottom-24 right-4 sm:right-6 z-40 w-80 sm:w-96 bg-slate-900/95 border border-rose-500/80 rounded-2xl p-4 shadow-2xl text-slate-100 backdrop-blur-md animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
                        <ShieldAlert className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">Hasil Pemeriksaan Denah</h4>
                        <p className="text-[10px] text-slate-400">{targetRoom ? (targetRoom.indonesianName || targetRoom.name) : 'Ruangan'}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedLintPopoverRoomId(null)}
                      className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                    {roomIssues.length === 0 ? (
                      <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                        <span>Ruangan ini optimal dan sesuai kaidah arsitektur SNI.</span>
                      </div>
                    ) : (
                      roomIssues.map((issue, idx) => (
                        <div
                          key={issue.id || idx}
                          className={`p-2.5 rounded-xl border text-xs space-y-1 ${
                            issue.severity === 'critical'
                              ? 'bg-rose-950/40 border-rose-800/80 text-rose-200'
                              : 'bg-amber-950/40 border-amber-800/80 text-amber-200'
                          }`}
                        >
                          <div className="flex items-center justify-between font-bold text-[11px]">
                            <span>{issue.title}</span>
                            <span className="uppercase text-[9px] px-1.5 py-0.5 rounded bg-black/40">
                              {issue.category}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 leading-snug">{issue.explanation}</p>
                          <p className="text-[11px] text-indigo-300 pt-0.5">
                            <strong>Saran Solusi:</strong> {issue.suggestedSolution}
                          </p>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-800 mt-3 text-[11px]">
                    <button
                      onClick={() => {
                        setSelectedLintPopoverRoomId(null);
                        setFamilyFeedbackTab('linting');
                        setIsFamilyFeedbackModalOpen(true);
                      }}
                      className="text-rose-400 hover:text-rose-300 font-semibold cursor-pointer underline"
                    >
                      Lihat Penjelasan Santun untuk Ibu
                    </button>
                    <button
                      onClick={() => setSelectedLintPopoverRoomId(null)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-md cursor-pointer font-medium"
                    >
                      Tutup
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* FAMILY NOTE POPOVER CARD */}
            {selectedNotePopoverRoomId && (() => {
              const targetRoom = [...currentDesign.groundFloorRooms, ...currentDesign.secondFloorRooms].find(r => r.id === selectedNotePopoverRoomId);
              const roomNotes = (currentDesign.familyNotes || []).filter(n => n.roomId === selectedNotePopoverRoomId);
              return (
                <div className="absolute bottom-24 right-4 sm:right-6 z-40 w-80 sm:w-96 bg-white border border-rose-300 rounded-2xl p-4 shadow-2xl text-slate-800 animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex items-center justify-between border-b border-rose-100 pb-2.5 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
                        <Heart className="w-4 h-4 fill-rose-500" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">Catatan &amp; Harapan Ibu</h4>
                        <p className="text-[10px] text-slate-500">{targetRoom ? (targetRoom.indonesianName || targetRoom.name) : 'Ruangan'}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedNotePopoverRoomId(null)}
                      className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {roomNotes.map(n => (
                      <div key={n.id} className="p-2.5 bg-rose-50/70 rounded-xl border border-rose-100 text-xs space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-bold text-rose-950">
                          <span>Dari: {n.author}</span>
                          <span className="text-[10px] font-semibold text-rose-600 uppercase bg-rose-100 px-1.5 py-0.5 rounded">
                            {n.priority === 'harus-ada' ? 'Wajib' : 'Diinginkan'}
                          </span>
                        </div>
                        <p className="text-slate-700 text-xs leading-relaxed">{n.note}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-3 text-xs">
                    <button
                      onClick={() => {
                        setSelectedNotePopoverRoomId(null);
                        setFamilyFeedbackTab('notes');
                        setIsFamilyFeedbackModalOpen(true);
                      }}
                      className="text-rose-600 hover:text-rose-700 font-semibold cursor-pointer underline text-[11px]"
                    >
                      Buka Semua Catatan Keluarga
                    </button>
                    <button
                      onClick={() => setSelectedNotePopoverRoomId(null)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md cursor-pointer font-medium text-[11px]"
                    >
                      Tutup
                    </button>
                  </div>
                </div>
              );
            })()}

          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 pt-2">
            <span>Orientasi: <strong>ATAS = JALAN DEPAN</strong> • <strong>BAWAH = BELAKANG</strong> • <strong>KANAN = EKSTENSI MANDIRI</strong></span>
            <div className="flex items-center gap-3">
              <span>Skala: 1m = 100px • Lahan: 9.0m × 11.0m (99 m²)</span>
              <button
                type="button"
                onClick={() => setShowBottomReviewBar(prev => !prev)}
                className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  showBottomReviewBar || isArchitecturalLintingEnabled || showFamilyNotePins
                    ? 'bg-slate-800 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                }`}
                title="Tampilkan atau sembunyikan alat Linting Arsitektur & Catatan Ibu di bawah kanvas"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>{showBottomReviewBar ? 'Sembunyikan Linting & Catatan Ibu' : 'Tampilkan Linting & Catatan Ibu'}</span>
              </button>
            </div>
          </div>

          {/* COLLAPSIBLE BOTTOM BAR FOR LINTING ARSITEKTUR & CATATAN IBU (Moved outside canvas so it never blocks design) */}
          {showBottomReviewBar && (
            <div className="p-3 rounded-xl bg-slate-900 text-slate-100 border border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-slate-200">Alat Pemeriksaan &amp; Masukan Keluarga:</span>
                <span className="text-[11px] text-slate-400">Ditaruh di bawah kanvas agar tidak menghalangi area gambar.</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Button 1: Toggle Architectural Linting */}
                <button
                  type="button"
                  onClick={() => {
                    const nextState = !isArchitecturalLintingEnabled;
                    setIsArchitecturalLintingEnabled(nextState);
                    if (!nextState) setSelectedLintPopoverRoomId(null);
                    showNotification(
                      nextState
                        ? 'Linting Arsitektur Aktif: Potensi masalah struktur dan ruang disorot di denah'
                        : 'Linting Arsitektur Dinonaktifkan'
                    );
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                    isArchitecturalLintingEnabled
                      ? 'bg-amber-500/20 text-amber-200 border-amber-500/60 hover:bg-amber-500/30'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${isArchitecturalLintingEnabled ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                  <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                  <span>Linting Arsitektur: {isArchitecturalLintingEnabled ? 'ON' : 'OFF'}</span>
                </button>

                {/* Button 2: Toggle Pin Catatan Ibu on Canvas */}
                <button
                  type="button"
                  onClick={() => {
                    const nextPins = !showFamilyNotePins;
                    setShowFamilyNotePins(nextPins);
                    if (!nextPins) setSelectedNotePopoverRoomId(null);
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                    showFamilyNotePins
                      ? 'bg-rose-500/20 text-rose-200 border-rose-500/60 hover:bg-rose-500/30'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  <Heart className="w-3.5 h-3.5 shrink-0" />
                  <span>Pin Catatan di Kanvas: {showFamilyNotePins ? 'ON' : 'OFF'}</span>
                </button>

                {/* Button 3: Open Catatan Ibu & Masukan Modal */}
                <button
                  type="button"
                  onClick={() => {
                    setFamilyFeedbackTab('notes');
                    setIsFamilyFeedbackModalOpen(true);
                  }}
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-rose-400/60 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-all cursor-pointer"
                >
                  <Heart className="w-3.5 h-3.5 fill-white shrink-0" />
                  <span>Buka Catatan Ibu &amp; Masukan</span>
                  {(currentDesign.familyNotes || []).length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-white text-rose-700">
                      {(currentDesign.familyNotes || []).length}
                    </span>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* INSPECTION, FURNITURE & EDIT DRAWER (4 COLS) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Drawer Tab Switcher (5 Tabs) */}
          <div className="flex rounded-xl bg-slate-200 p-1 border border-slate-300 text-[11px] font-bold">
            <button
              onClick={() => setActiveInspectorTab('room')}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                activeInspectorTab === 'room' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              Ruangan
            </button>
            <button
              onClick={() => { setActiveInspectorTab('staircase'); setSelectedStaircase(true); }}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                activeInspectorTab === 'staircase' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              Tangga
            </button>
            <button
              onClick={() => setActiveInspectorTab('furniture')}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                activeInspectorTab === 'furniture' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              Furnitur
            </button>
            <button
              onClick={() => setActiveInspectorTab('catalog')}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                activeInspectorTab === 'catalog' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              + Katalog
            </button>
            <button
              onClick={() => setActiveInspectorTab('custom-catalog')}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                activeInspectorTab === 'custom-catalog' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              Katalog Saya ({myCustomCatalog.length})
            </button>
          </div>

          {/* PART 5.3: FORBIDDEN ZONE INSPECTOR CARD (Shown when Forbidden Zone is selected) */}
          {isProhibitedZoneSelected && (
            <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-rose-900 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  Zona Terlarang Beban Atap Lama
                </span>
                <button
                  onClick={() => setIsProhibitedZoneSelected(false)}
                  className="text-rose-500 hover:text-rose-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[11px] text-rose-800 leading-relaxed">
                Batas zona acuan perlindungan atap bangunan lama (KT1, KT2, RK). Dapat digeser dan diubah ukurannya di kanvas.
              </p>
              <div className="grid grid-cols-2 gap-2 font-mono">
                <div>
                  <label className="text-slate-500 block text-[10px]">Posisi X (m)</label>
                  <input
                    type="number"
                    step="0.25"
                    value={currentProhibitedZone.x}
                    disabled={isReadOnly || currentProhibitedZone.isLocked}
                    onChange={(e) => updateProhibitedZoneProperty({ x: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2 py-1 bg-white border border-rose-200 rounded text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-slate-500 block text-[10px]">Posisi Y (m)</label>
                  <input
                    type="number"
                    step="0.25"
                    value={currentProhibitedZone.y}
                    disabled={isReadOnly || currentProhibitedZone.isLocked}
                    onChange={(e) => updateProhibitedZoneProperty({ y: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2 py-1 bg-white border border-rose-200 rounded text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-slate-500 block text-[10px]">Lebar (m)</label>
                  <input
                    type="number"
                    step="0.25"
                    value={currentProhibitedZone.width}
                    disabled={isReadOnly || currentProhibitedZone.isLocked}
                    onChange={(e) => updateProhibitedZoneProperty({ width: parseFloat(e.target.value) || 1.0 })}
                    className="w-full px-2 py-1 bg-white border border-rose-200 rounded text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-slate-500 block text-[10px]">Panjang (m)</label>
                  <input
                    type="number"
                    step="0.25"
                    value={currentProhibitedZone.depth}
                    disabled={isReadOnly || currentProhibitedZone.isLocked}
                    onChange={(e) => updateProhibitedZoneProperty({ depth: parseFloat(e.target.value) || 1.0 })}
                    className="w-full px-2 py-1 bg-white border border-rose-200 rounded text-slate-800"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => updateProhibitedZoneProperty({ isLocked: !currentProhibitedZone.isLocked })}
                  className={`flex-1 py-1 rounded border font-semibold cursor-pointer ${
                    currentProhibitedZone.isLocked ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-white text-slate-700 border-slate-300'
                  }`}
                >
                  {currentProhibitedZone.isLocked ? 'Buka Kunci' : 'Kunci Batas'}
                </button>
                <button
                  onClick={() => updateProhibitedZoneProperty({ isVisible: !currentProhibitedZone.isVisible })}
                  className="flex-1 py-1 rounded border bg-white text-slate-700 border-slate-300 font-semibold cursor-pointer"
                >
                  {currentProhibitedZone.isVisible !== false ? 'Sembunyikan' : 'Tampilkan'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 1: ROOM, DOOR & VERTEX INSPECTOR */}
          {activeInspectorTab === 'room' && (
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
              {/* 1. DOOR INSPECTOR CARD (Part 6) */}
              {selectedDoorId && (() => {
                const door = currentDoors.find(d => d.id === selectedDoorId);
                if (!door) return null;
                const hostRoom = roomsOnCurrentFloor.find(r => r.id === door.roomId);
                const clearanceCheck = evaluateDoorClearance(door, currentDesign.furniture);
                const isHorizontal = door.wallSide === 'north' || door.wallSide === 'south';
                const minPos = hostRoom ? (isHorizontal ? hostRoom.x + 0.05 : hostRoom.y + 0.05) : 0;
                const maxPos = hostRoom ? (isHorizontal ? hostRoom.x + hostRoom.width - door.width - 0.05 : hostRoom.y + hostRoom.depth - door.width - 0.05) : 10;
                const currentPos = isHorizontal ? door.x : door.y;

                return (
                  <div className="space-y-3.5 text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        <DoorClosed className="w-4 h-4 text-teal-600" />
                        <span>Inspeksi &amp; Kustomisasi Pintu</span>
                      </h3>
                      <div className="flex items-center gap-1.5">
                        {hostRoom && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDoorId(null);
                              setSelectedRoomId(hostRoom.id);
                            }}
                            className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[10px] cursor-pointer whitespace-nowrap shrink-0"
                          >
                            ← Kembali ke Ruang
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedDoorId(null)}
                          className="text-slate-400 hover:text-slate-600 cursor-pointer text-xs"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-slate-500 block mb-1">Nama Pintu</label>
                      <input
                        type="text"
                        disabled={isReadOnly}
                        value={door.name}
                        onChange={(e) => updateDoorProperty(door.id, { name: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 font-semibold text-slate-900"
                      />
                    </div>

                    {/* Wall Side Selector (Pindah Sisi Dinding) */}
                    <div>
                      <label className="text-slate-500 block mb-1 font-semibold">Pindah ke Sisi Dinding Mana:</label>
                      <div className="grid grid-cols-4 gap-1.5">
                        {(['north', 'south', 'west', 'east'] as WallSide[]).map(side => (
                          <button
                            key={side}
                            type="button"
                            disabled={isReadOnly}
                            onClick={() => updateDoorProperty(door.id, { wallSide: side })}
                            className={`py-1.5 rounded-lg text-center font-bold text-[11px] border transition-colors cursor-pointer ${
                              door.wallSide === side
                                ? 'bg-teal-600 text-white border-teal-700 shadow-xs'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {side === 'north' ? 'Utara (Depan)' : side === 'south' ? 'Selatan' : side === 'west' ? 'Barat (Kiri)' : 'Timur (Kanan)'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Wall Position Slider & Step Offset */}
                    <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-teal-950 text-[11px]">Geser Posisi Kusen di Dinding:</span>
                        <span className="font-mono font-bold text-teal-800 text-[11px]">{currentPos.toFixed(2)} m</span>
                      </div>
                      <input
                        type="range"
                        min={minPos}
                        max={Math.max(minPos + 0.2, maxPos)}
                        step="0.05"
                        disabled={isReadOnly}
                        value={currentPos}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (isHorizontal) updateDoorProperty(door.id, { x: val });
                          else updateDoorProperty(door.id, { y: val });
                        }}
                        className="w-full accent-teal-600 cursor-pointer"
                      />
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <button
                          type="button"
                          disabled={isReadOnly}
                          onClick={() => {
                            const nextVal = Math.max(minPos, currentPos - 0.1);
                            if (isHorizontal) updateDoorProperty(door.id, { x: Number(nextVal.toFixed(2)) });
                            else updateDoorProperty(door.id, { y: Number(nextVal.toFixed(2)) });
                          }}
                          className="px-2.5 py-1 bg-white hover:bg-teal-100 border border-teal-300 rounded text-teal-800 font-semibold cursor-pointer"
                        >
                          ◀ Geser -10cm
                        </button>
                        <button
                          type="button"
                          disabled={isReadOnly}
                          onClick={() => {
                            const nextVal = Math.min(maxPos, currentPos + 0.1);
                            if (isHorizontal) updateDoorProperty(door.id, { x: Number(nextVal.toFixed(2)) });
                            else updateDoorProperty(door.id, { y: Number(nextVal.toFixed(2)) });
                          }}
                          className="px-2.5 py-1 bg-white hover:bg-teal-100 border border-teal-300 rounded text-teal-800 font-semibold cursor-pointer"
                        >
                          Geser +10cm ▶
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <div>
                        <span className="text-slate-400 block">Ruangan Inang:</span>
                        <strong className="text-slate-800">{hostRoom ? getDynamicRoomLabel(hostRoom.id, hostRoom, currentDesign.customRoomLabels) : door.roomId}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Posisi Dinding:</span>
                        <strong className="text-slate-800 uppercase">Sisi {door.wallSide}</strong>
                      </div>
                    </div>

                    {/* Width & Height */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-slate-500 block mb-1">Lebar Kusen (m)</label>
                        <input
                          type="number"
                          step="0.05"
                          min="0.6"
                          max="2.0"
                          disabled={isReadOnly}
                          value={door.width}
                          onChange={(e) => updateDoorProperty(door.id, { width: parseFloat(e.target.value) || 0.8 })}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 font-mono font-semibold"
                        />
                      </div>
                      <div>
                        <label className="text-slate-500 block mb-1">Tinggi Kusen (m)</label>
                        <input
                          type="number"
                          step="0.05"
                          min="1.8"
                          max="2.6"
                          disabled={isReadOnly}
                          value={door.height}
                          onChange={(e) => updateDoorProperty(door.id, { height: parseFloat(e.target.value) || 2.1 })}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 font-mono font-semibold"
                        />
                      </div>
                    </div>

                    {/* Type, Hinge & Swing */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-slate-500 block mb-1">Posisi Engsel</label>
                        <select
                          disabled={isReadOnly}
                          value={door.hingeSide}
                          onChange={(e) => updateDoorProperty(door.id, { hingeSide: e.target.value as 'left' | 'right' })}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-800"
                        >
                          <option value="left">Engsel Kiri</option>
                          <option value="right">Engsel Kanan</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-slate-500 block mb-1">Arah Ayunan</label>
                        <select
                          disabled={isReadOnly}
                          value={door.swingDirection}
                          onChange={(e) => updateDoorProperty(door.id, { swingDirection: e.target.value as 'inward' | 'outward' })}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-800"
                        >
                          <option value="inward">Ke Dalam Ruang</option>
                          <option value="outward">Ke Luar Ruang</option>
                        </select>
                      </div>
                    </div>

                    {/* Door State Toggle */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateDoorProperty(door.id, { isOpen: !door.isOpen })}
                        className={`flex-1 py-2 rounded-xl border font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                          door.isOpen ? 'bg-teal-600 text-white border-teal-700 shadow-xs' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        <DoorClosed className="w-4 h-4" />
                        <span>{door.isOpen ? 'Status: Terbuka 90° (Dinding Buka)' : 'Status: Tertutup Rapat'}</span>
                      </button>
                    </div>

                    {/* Usability Clearance Banner */}
                    <div className={`p-3 rounded-xl border flex items-start gap-2 ${
                      clearanceCheck.isClear ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-amber-50 border-amber-200 text-amber-900'
                    }`}>
                      {clearanceCheck.isClear ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <span className="font-bold block text-[11px]">
                          {clearanceCheck.isClear ? 'Bukaan Pintu Bersih & Aman' : 'Peringatan Ruang Bebas (Clearance)'}
                        </span>
                        <p className="text-[10px] mt-0.5 leading-relaxed">{clearanceCheck.recommendation}</p>
                      </div>
                    </div>

                    {/* Delete door */}
                    {!isReadOnly && (
                      <div className="pt-2 border-t border-slate-100 flex justify-end">
                        <button
                          onClick={() => handleDeleteDoor(door.id)}
                          className="py-1.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus Pintu Ini</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* 1.5 WINDOW & VENTILATION INSPECTOR CARD */}
              {selectedWindowId && (() => {
                const win = currentWindows.find(w => w.id === selectedWindowId);
                if (!win) return null;
                const hostRoom = roomsOnCurrentFloor.find(r => r.id === win.roomId);
                const isHorizontal = win.wallSide === 'north' || win.wallSide === 'south';
                const minPos = hostRoom ? (isHorizontal ? hostRoom.x + 0.05 : hostRoom.y + 0.05) : 0;
                const maxPos = hostRoom ? (isHorizontal ? hostRoom.x + hostRoom.width - win.width - 0.05 : hostRoom.y + hostRoom.depth - win.width - 0.05) : 10;
                const currentPos = isHorizontal ? win.x : win.y;

                return (
                  <div className="space-y-3.5 text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        <Maximize2 className="w-4 h-4 text-sky-600" />
                        <span>Inspeksi Jendela &amp; Roster</span>
                      </h3>
                      <div className="flex items-center gap-1.5">
                        {hostRoom && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedWindowId(null);
                              setSelectedRoomId(hostRoom.id);
                            }}
                            className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[10px] cursor-pointer whitespace-nowrap shrink-0"
                          >
                            ← Kembali ke Ruang
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedWindowId(null)}
                          className="text-slate-400 hover:text-slate-600 cursor-pointer text-xs"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-slate-500 block mb-1">Nama Jendela / Bukaan</label>
                      <input
                        type="text"
                        disabled={isReadOnly}
                        value={win.name}
                        onChange={(e) => updateWindowProperty(win.id, { name: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 font-semibold text-slate-900"
                      />
                    </div>

                    {/* Window Type Selector */}
                    <div>
                      <label className="text-slate-500 block mb-1 font-semibold">Tipe Jendela &amp; Ventilasi</label>
                      <select
                        disabled={isReadOnly}
                        value={win.windowType || win.type || 'casement'}
                        onChange={(e) => {
                          const val = e.target.value as WindowType;
                          updateWindowProperty(win.id, { windowType: val, type: val });
                        }}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 font-medium text-slate-800 bg-white"
                      >
                        <option value="casement">Jendela Kaca Ayun (Casement Window)</option>
                        <option value="sliding">Jendela Kaca Geser (Sliding Window)</option>
                        <option value="fixed-glass">Kaca Mati Permanen (Fixed Glass)</option>
                        <option value="bovenlicht">Bouvenlight Ventilasi Atas</option>
                        <option value="roster-vent">Roster Bata Kerawang Angin Tropis</option>
                      </select>
                    </div>

                    {/* Wall Side Selector */}
                    <div>
                      <label className="text-slate-500 block mb-1 font-semibold">Sisi Dinding:</label>
                      <div className="grid grid-cols-4 gap-1.5">
                        {(['north', 'south', 'west', 'east'] as WallSide[]).map(side => (
                          <button
                            key={side}
                            type="button"
                            disabled={isReadOnly}
                            onClick={() => updateWindowProperty(win.id, { wallSide: side })}
                            className={`py-1.5 rounded-lg text-center font-bold text-[11px] border transition-colors cursor-pointer ${
                              win.wallSide === side
                                ? 'bg-sky-600 text-white border-sky-700 shadow-xs'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {side === 'north' ? 'Utara' : side === 'south' ? 'Selatan' : side === 'west' ? 'Barat' : 'Timur'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Position Slider */}
                    <div className="p-3 bg-sky-50/70 border border-sky-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sky-950 text-[11px]">Geser Posisi di Dinding:</span>
                        <span className="font-mono font-bold text-sky-800 text-[11px]">{currentPos.toFixed(2)} m</span>
                      </div>
                      <input
                        type="range"
                        min={minPos}
                        max={Math.max(minPos + 0.2, maxPos)}
                        step="0.05"
                        disabled={isReadOnly}
                        value={currentPos}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (isHorizontal) updateWindowProperty(win.id, { x: val });
                          else updateWindowProperty(win.id, { y: val });
                        }}
                        className="w-full accent-sky-600 cursor-pointer"
                      />
                    </div>

                    {/* Dimensions: Width, Height, Sill */}
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-slate-500 block mb-1 text-[10px]">Lebar (m)</label>
                        <input
                          type="number"
                          step="0.05"
                          min="0.4"
                          max="3.0"
                          disabled={isReadOnly}
                          value={win.width}
                          onChange={(e) => updateWindowProperty(win.id, { width: parseFloat(e.target.value) || 0.8 })}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-200 font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-slate-500 block mb-1 text-[10px]">Tinggi (m)</label>
                        <input
                          type="number"
                          step="0.05"
                          min="0.3"
                          max="2.5"
                          disabled={isReadOnly}
                          value={win.height}
                          onChange={(e) => updateWindowProperty(win.id, { height: parseFloat(e.target.value) || 1.2 })}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-200 font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-slate-500 block mb-1 text-[10px]">Tinggi Ambang (m)</label>
                        <input
                          type="number"
                          step="0.05"
                          min="0.0"
                          max="2.5"
                          disabled={isReadOnly}
                          value={win.sillHeight || 0.9}
                          onChange={(e) => updateWindowProperty(win.id, { sillHeight: parseFloat(e.target.value) || 0.9 })}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-200 font-mono"
                        />
                      </div>
                    </div>

                    {/* Window State Toggle */}
                    {win.windowType !== 'fixed-glass' && win.windowType !== 'fixed' && win.windowType !== 'roster' && win.windowType !== 'roster-vent' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateWindowProperty(win.id, { isOpen: !win.isOpen })}
                          className={`flex-1 py-1.5 rounded-lg border font-semibold flex items-center justify-center gap-1.5 cursor-pointer ${
                            win.isOpen ? 'bg-sky-50 text-sky-800 border-sky-300' : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                          <span>{win.isOpen ? 'Status: Daun Jendela Terbuka' : 'Status: Jendela Tertutup'}</span>
                        </button>
                      </div>
                    )}

                    {/* Delete window */}
                    {!isReadOnly && (
                      <div className="pt-2 border-t border-slate-100 flex justify-end">
                        <button
                          onClick={() => handleDeleteWindow(win.id)}
                          className="py-1.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus Bukaan Ini</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* 2. NUMERIC VERTEX INSPECTOR (Part 1.3: Numeric Vertex Editing & Snapping) */}
              {!selectedDoorId && selectedVertexIndex !== null && selectedRoom?.polygonPoints && (() => {
                const points = selectedRoom.polygonPoints;
                const pt = points[selectedVertexIndex];
                if (!pt) return null;

                const n = points.length;
                const nextIdx = (selectedVertexIndex + 1) % n;
                const prevIdx = (selectedVertexIndex - 1 + n) % n;
                const pNext = points[nextIdx];
                const pPrev = points[prevIdx];

                const edgeLenNext = Math.hypot(pNext.x - pt.x, pNext.y - pt.y);
                const edgeLenPrev = Math.hypot(pt.x - pPrev.x, pt.y - pPrev.y);

                return (
                  <div className="space-y-3.5 text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        <Target className="w-4 h-4 text-amber-500" />
                        <span>Inspeksi Titik Sudut #{selectedVertexIndex + 1}</span>
                      </h3>
                      <button
                        onClick={() => setSelectedVertexIndex(null)}
                        className="text-slate-400 hover:text-slate-600 cursor-pointer text-xs"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Numeric X and Y Coordinates */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-slate-500 block mb-1">Koordinat X (m)</label>
                        <input
                          type="number"
                          step={snapToGrid ? gridSize : 0.05}
                          disabled={isReadOnly || selectedRoom.isLocked}
                          value={pt.x}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            const updated = setPolygonVertexCoordinates(points, selectedVertexIndex, val, pt.y);
                            updateRoomProperty(selectedRoom.id, { polygonPoints: updated });
                          }}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 font-mono font-semibold"
                        />
                      </div>
                      <div>
                        <label className="text-slate-500 block mb-1">Koordinat Y (m)</label>
                        <input
                          type="number"
                          step={snapToGrid ? gridSize : 0.05}
                          disabled={isReadOnly || selectedRoom.isLocked}
                          value={pt.y}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            const updated = setPolygonVertexCoordinates(points, selectedVertexIndex, pt.x, val);
                            updateRoomProperty(selectedRoom.id, { polygonPoints: updated });
                          }}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 font-mono font-semibold"
                        />
                      </div>
                    </div>

                    {/* Numeric Edge Length Setting */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <span className="font-semibold text-slate-700 block text-[11px]">Panjang Dinding Berdampingan</span>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Sisi ke Titik #{nextIdx + 1}:</span>
                        <strong className="font-mono text-slate-800">{edgeLenNext.toFixed(2)} m ({(edgeLenNext * 100).toFixed(0)} cm)</strong>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Sisi dari Titik #{prevIdx + 1}:</span>
                        <strong className="font-mono text-slate-800">{edgeLenPrev.toFixed(2)} m ({(edgeLenPrev * 100).toFixed(0)} cm)</strong>
                      </div>

                      <div className="pt-2 flex items-center gap-2">
                        <input
                          type="number"
                          step="0.05"
                          min="0.5"
                          max="9.0"
                          placeholder="Ubah panjang (m)"
                          defaultValue={edgeLenNext.toFixed(2)}
                          id={`edge-len-input-${selectedVertexIndex}`}
                          className="flex-1 px-2.5 py-1 rounded border border-slate-300 font-mono text-xs bg-white"
                        />
                        <button
                          onClick={() => {
                            const input = document.getElementById(`edge-len-input-${selectedVertexIndex}`) as HTMLInputElement;
                            if (input) {
                              const targetM = parseFloat(input.value) || edgeLenNext;
                              const updated = setPolygonEdgeLength(points, selectedVertexIndex, targetM, 'next');
                              updateRoomProperty(selectedRoom.id, { polygonPoints: updated });
                              showNotification(`Panjang sisi diatur ke ${targetM.toFixed(2)} m.`);
                            }
                          }}
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-semibold text-xs cursor-pointer"
                        >
                          Terapkan
                        </button>
                      </div>
                    </div>

                    {/* Snapping Options Toggles (Part 1.3) */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-[11px]">
                      <span className="font-semibold text-slate-700 block">Opsi Snapping &amp; Inferensi SketchUp</span>
                      <div className="grid grid-cols-2 gap-2">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={snapOptions.axis}
                            onChange={(e) => setSnapOptions({ ...snapOptions, axis: e.target.checked })}
                            className="rounded text-indigo-600 w-3.5 h-3.5"
                          />
                          <span>Axis Snap (X/Y)</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={snapOptions.endpoints}
                            onChange={(e) => setSnapOptions({ ...snapOptions, endpoints: e.target.checked })}
                            className="rounded text-indigo-600 w-3.5 h-3.5"
                          />
                          <span>Titik Sudut (Endpoint)</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={snapOptions.midpoints}
                            onChange={(e) => setSnapOptions({ ...snapOptions, midpoints: e.target.checked })}
                            className="rounded text-indigo-600 w-3.5 h-3.5"
                          />
                          <span>Titik Tengah (Midpoint)</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={snapOptions.grid}
                            onChange={(e) => setSnapOptions({ ...snapOptions, grid: e.target.checked })}
                            className="rounded text-indigo-600 w-3.5 h-3.5"
                          />
                          <span>Grid Snap (0.25m)</span>
                        </label>
                      </div>
                    </div>

                    {/* Delete Vertex Action */}
                    {!isReadOnly && (
                      <div className="flex gap-2 pt-2 border-t border-slate-100">
                        <button
                          onClick={() => handleDeleteVertex(selectedRoom.id, selectedVertexIndex)}
                          className="flex-1 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-semibold flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus Titik Sudut Ini (Del)</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* 3. STANDARD ROOM INSPECTOR (When neither door nor vertex is selected) */}
              {!selectedDoorId && selectedVertexIndex === null && selectedRoom && (
                <div className="space-y-3.5 text-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="min-w-0 pr-2">
                      <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-indigo-600 shrink-0" />
                        <span className="truncate">
                          Inspeksi: <span className="text-indigo-600">{getDynamicRoomLabel(selectedRoom.id, selectedRoom, currentDesign.customRoomLabels)}</span>
                        </span>
                      </h3>
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        ID: <code className="font-mono font-bold text-indigo-600">{selectedRoom.id}</code> ({selectedRoom.floor === '2F' ? 'Lantai 2' : 'Lantai 1'})
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 shrink-0">
                      {selectedRoom.id.toUpperCase()}
                    </span>
                  </div>

                  {/* DEDICATED 'EDIT LABEL' FEATURE */}
                  {(() => {
                    const currentDynamicLabel = getDynamicRoomLabel(
                      selectedRoom.id,
                      selectedRoom,
                      currentDesign.customRoomLabels
                    );
                    const defaultIdLabel = DEFAULT_ROOM_ID_LABELS[selectedRoom.id] || selectedRoom.id.toUpperCase();
                    const isCustomized = Boolean(
                      (currentDesign.customRoomLabels && currentDesign.customRoomLabels[selectedRoom.id]) ||
                      selectedRoom.customLabel
                    );

                    return (
                      <div className="p-3.5 rounded-xl border border-indigo-200/90 bg-gradient-to-br from-indigo-50/70 via-white to-sky-50/50 space-y-3 shadow-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Tag className="w-4 h-4 text-indigo-600 shrink-0" />
                            <span className="font-bold text-slate-900 text-xs">Edit Label Ruangan</span>
                          </div>
                          {isCustomized ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <Sparkles className="w-3 h-3 text-emerald-600" />
                              Terkustomisasi
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                              Bawaan ID
                            </span>
                          )}
                        </div>

                        {/* Interactive dynamic preview on floor plan */}
                        <div className="p-2.5 bg-slate-900 rounded-lg text-white flex items-center justify-between border border-slate-800 shadow-inner">
                          <div className="min-w-0 pr-2">
                            <span className="text-[9.5px] uppercase tracking-wider text-slate-400 block font-mono">
                              Teks di Denah 2D [ID: {selectedRoom.id}]
                            </span>
                            <span className="font-bold text-sm text-sky-300 block truncate">
                              {currentDynamicLabel}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
                            {selectedRoom.width.toFixed(2)}×{selectedRoom.depth.toFixed(2)}m
                          </span>
                        </div>

                        {/* Direct input with Instant Apply */}
                        <div>
                          <label className="text-slate-600 block mb-1 font-semibold text-[11px] flex items-center justify-between">
                            <span>Ketik Nama / Label Kustom:</span>
                            <span className="text-[10px] text-slate-400 font-normal">Tekan Enter atau klik Simpan</span>
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              disabled={isReadOnly}
                              value={roomLabelInputValue}
                              placeholder="Misal: Home Office, Studio, dsb."
                              onChange={(e) => setRoomLabelInputValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleSaveRoomLabel(selectedRoom.id, roomLabelInputValue);
                                }
                              }}
                              className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-semibold text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            />
                            <button
                              type="button"
                              disabled={isReadOnly}
                              onClick={() => handleSaveRoomLabel(selectedRoom.id, roomLabelInputValue)}
                              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer shadow-xs transition-colors flex items-center gap-1 shrink-0"
                              title="Terapkan label baru ke ruangan ini"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Simpan</span>
                            </button>
                          </div>
                        </div>

                        {/* Quick preset suggestions like 'Home Office', 'Studio', etc. */}
                        <div>
                          <span className="text-slate-500 font-medium text-[10px] block mb-1.5">
                            Pilihan Cepat (1-Klik):
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {ROOM_LABEL_PRESETS.map((preset) => {
                              const isCurrent = currentDynamicLabel.toLowerCase() === preset.toLowerCase();
                              return (
                                <button
                                  key={preset}
                                  type="button"
                                  disabled={isReadOnly}
                                  onClick={() => {
                                    setRoomLabelInputValue(preset);
                                    handleSaveRoomLabel(selectedRoom.id, preset);
                                  }}
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                                    isCurrent
                                      ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                                      : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 hover:text-indigo-900'
                                  }`}
                                >
                                  {preset}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Reset to Default Button */}
                        {isCustomized && (
                          <div className="pt-2 border-t border-indigo-100 flex items-center justify-between">
                            <span className="text-[10px] text-slate-500">
                              Nama bawaan: <em>{defaultIdLabel}</em>
                            </span>
                            <button
                              type="button"
                              disabled={isReadOnly}
                              onClick={() => {
                                handleResetRoomLabel(selectedRoom.id);
                                setRoomLabelInputValue(defaultIdLabel);
                              }}
                              className="text-[10.5px] font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Kembalikan ke Standar</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  <div>
                    <label className="text-slate-500 block mb-1">Deskripsi Tambahan / Fungsi Ruang</label>
                    <input
                      type="text"
                      disabled={isReadOnly}
                      value={selectedRoom.description || ''}
                      onChange={(e) => updateRoomProperty(selectedRoom.id, { description: e.target.value })}
                      placeholder="Keterangan opsional fungsi ruang..."
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50"
                    />
                  </div>

                  {/* Coordinates & Dimensions */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-500 block mb-1">Posisi X (m)</label>
                      <input
                        type="number"
                        step={snapToGrid ? gridSize : 0.05}
                        disabled={isReadOnly || selectedRoom.isLocked}
                        value={selectedRoom.x}
                        onChange={(e) => updateRoomProperty(selectedRoom.id, { x: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 font-mono font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-slate-500 block mb-1">Posisi Y (m)</label>
                      <input
                        type="number"
                        step={snapToGrid ? gridSize : 0.05}
                        disabled={isReadOnly || selectedRoom.isLocked}
                        value={selectedRoom.y}
                        onChange={(e) => updateRoomProperty(selectedRoom.id, { y: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 font-mono font-semibold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-500 block mb-1">Lebar / Width (m)</label>
                      <input
                        type="number"
                        step={snapToGrid ? gridSize : 0.05}
                        min="0.8"
                        disabled={isReadOnly || selectedRoom.isLocked}
                        value={selectedRoom.width}
                        onChange={(e) => updateRoomProperty(selectedRoom.id, { width: parseFloat(e.target.value) || 1.0 })}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 font-mono font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-slate-500 block mb-1">Kedalaman / Depth (m)</label>
                      <input
                        type="number"
                        step={snapToGrid ? gridSize : 0.05}
                        min="0.8"
                        disabled={isReadOnly || selectedRoom.isLocked}
                        value={selectedRoom.depth}
                        onChange={(e) => updateRoomProperty(selectedRoom.id, { depth: parseFloat(e.target.value) || 1.0 })}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 font-mono font-semibold"
                      />
                    </div>
                  </div>

                  {/* CURATED FLOOR & REAR GARDEN FINISH CUSTOMIZER */}
                  <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/90 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-amber-950 text-[11px] block">
                          Material Lantai &amp; Taman (6 Pilihan Praktis)
                        </span>
                        <span className="text-[10px] text-amber-800">
                          Otomatis menghitung biaya RAB per m²
                        </span>
                      </div>
                      {!isReadOnly && (
                        <button
                          type="button"
                          onClick={() => {
                            const chosen = selectedRoom.floorFinish || 'ceramic';
                            updateActiveDesign(prev => ({
                              ...prev,
                              groundFloorRooms: prev.groundFloorRooms.map(r =>
                                r.id === 'rear_service_yard' && (chosen !== 'grass' && chosen !== 'wood-deck')
                                  ? r
                                  : { ...r, floorFinish: chosen }
                              ),
                              secondFloorRooms: prev.secondFloorRooms.map(r => ({
                                ...r,
                                floorFinish: chosen === 'grass' ? 'ceramic' : chosen,
                              })),
                            }));
                            showNotification('Material lantai diterapkan ke ruangan lainnya.');
                          }}
                          className="px-2 py-0.5 rounded bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-[9.5px] border border-amber-300 cursor-pointer transition-colors"
                          title="Terapkan material lantai ini ke seluruh ruangan dalam rumah"
                        >
                          Samakan Semua Ruang
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      {FLOOR_FINISH_OPTIONS.map(opt => {
                        const activeFloor = selectedRoom.floorFinish || (selectedRoom.id === 'rear_service_yard' ? 'grass' : 'ceramic');
                        const isChosen = activeFloor === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            disabled={isReadOnly}
                            onClick={() => updateRoomProperty(selectedRoom.id, { floorFinish: opt.id })}
                            className={`p-2 rounded-lg border text-left transition-all cursor-pointer flex items-start gap-2 ${
                              isChosen
                                ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                                : 'bg-white text-slate-800 border-amber-200/80 hover:bg-amber-50'
                            }`}
                          >
                            <span
                              className="w-4 h-4 rounded border border-black/20 shrink-0 mt-0.5"
                              style={{ backgroundColor: opt.hexColor }}
                            />
                            <div className="min-w-0 flex-1">
                              <span className="font-bold text-[10px] block leading-tight truncate">
                                {opt.name}
                              </span>
                              <span className={`text-[9px] font-mono block mt-0.5 ${isChosen ? 'text-amber-100' : 'text-slate-500'}`}>
                                Rp {(opt.rateEconomyIdr / 1000).toFixed(0)}rb/m²
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* CUSTOM WALL COLOR & MATERIAL FINISH CUSTOMIZER */}
                  <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-200/80 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-indigo-950 text-[11px] block">
                          Warna Cat &amp; Material Dinding
                        </span>
                        <span className="text-[10px] text-indigo-700">
                          Pilih preset atau warna cat kustom bebas
                        </span>
                      </div>
                      {!isReadOnly && (
                        <button
                          type="button"
                          onClick={() => {
                            const chosenFinish = selectedRoom.wallFinish || 'white';
                            const chosenColor = selectedRoom.wallColor;
                            updateActiveDesign(prev => ({
                              ...prev,
                              groundFloorRooms: prev.groundFloorRooms.map(r => ({
                                ...r,
                                wallFinish: chosenFinish,
                                wallColor: chosenColor,
                              })),
                              secondFloorRooms: prev.secondFloorRooms.map(r => ({
                                ...r,
                                wallFinish: chosenFinish,
                                wallColor: chosenColor,
                              })),
                            }));
                            showNotification('Warna & material dinding diterapkan ke seluruh rumah.');
                          }}
                          className="px-2 py-0.5 rounded bg-indigo-100 hover:bg-indigo-200 text-indigo-900 font-bold text-[9.5px] border border-indigo-300 cursor-pointer transition-colors"
                        >
                          Samakan Semua Dinding
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      {WALL_FINISH_OPTIONS.map(opt => {
                        const isChosen = (selectedRoom.wallFinish || 'white') === opt.id && !selectedRoom.wallColor;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            disabled={isReadOnly}
                            onClick={() =>
                              updateRoomProperty(selectedRoom.id, {
                                wallFinish: opt.id,
                                wallColor: undefined,
                              })
                            }
                            className={`p-2 rounded-lg border text-left transition-all cursor-pointer flex items-start gap-2 ${
                              isChosen
                                ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                                : 'bg-white text-slate-800 border-indigo-200/80 hover:bg-indigo-50'
                            }`}
                          >
                            <span
                              className="w-4 h-4 rounded-full border border-black/20 shrink-0 mt-0.5"
                              style={{ backgroundColor: opt.hexColor }}
                            />
                            <div className="min-w-0 flex-1">
                              <span className="font-bold text-[10px] block leading-tight truncate">
                                {opt.name}
                              </span>
                              <span className={`text-[9px] font-mono block mt-0.5 ${isChosen ? 'text-indigo-100' : 'text-slate-500'}`}>
                                Rp {(opt.rateEconomyIdr / 1000).toFixed(0)}rb/m²
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Custom Paint Color Picker */}
                    <div className="flex items-center justify-between gap-2 bg-white p-2 rounded-lg border border-indigo-200/80">
                      <span className="text-[10px] font-semibold text-slate-700">
                        Warna Cat Kustom (Bebas):
                      </span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          disabled={isReadOnly}
                          value={
                            selectedRoom.wallColor ||
                            WALL_FINISH_OPTIONS.find(w => w.id === (selectedRoom.wallFinish || 'white'))?.hexColor ||
                            '#f8fafc'
                          }
                          onChange={(e) =>
                            updateRoomProperty(selectedRoom.id, {
                              wallFinish: 'white',
                              wallColor: e.target.value,
                            })
                          }
                          className="w-7 h-6 rounded border border-slate-300 cursor-pointer p-0 bg-transparent"
                        />
                        {selectedRoom.wallColor && (
                          <button
                            type="button"
                            disabled={isReadOnly}
                            onClick={() => updateRoomProperty(selectedRoom.id, { wallColor: undefined })}
                            className="px-1.5 py-0.5 text-[9.5px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-600 rounded cursor-pointer"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ELONGATED HOUSE ROOF MODEL & ROOF WALL CUSTOMIZER (Mitra10 Reference) */}
                  {(() => {
                    const roofCfg = currentDesign.roofConfig || DEFAULT_ROOF_CONFIG;
                    const updateRoofCfg = (patch: Partial<typeof roofCfg>) => {
                      updateActiveDesign(prev => ({
                        ...prev,
                        roofConfig: {
                          ...(prev.roofConfig || DEFAULT_ROOF_CONFIG),
                          ...patch,
                        },
                      }));
                    };
                    return (
                      <div className="p-3 bg-slate-100/90 rounded-xl border border-slate-300 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-bold text-slate-900 text-[11px] block">
                              🏠 Model Atap Memanjang &amp; Dinding Atap
                            </span>
                            <span className="text-[10px] text-slate-600">
                              Kustom model atap, penutup &amp; dinding sopi-sopi/parapet
                            </span>
                          </div>
                        </div>

                        {/* 4 Curated Elongated Roof Styles */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-slate-700 block">
                            Pilih Model Atap Rumah Memanjang:
                          </label>
                          <div className="grid grid-cols-2 gap-1.5">
                            {ROOF_STYLE_OPTIONS.map(st => (
                              <button
                                key={st.id}
                                type="button"
                                disabled={isReadOnly}
                                onClick={() => updateRoofCfg({ style: st.id as RoofStyleType })}
                                className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                                  roofCfg.style === st.id
                                    ? 'bg-slate-900 text-white border-slate-950 shadow-xs'
                                    : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
                                }`}
                              >
                                <span className="font-bold text-[10px] block leading-tight">{st.name}</span>
                                <span className={`text-[9px] block mt-0.5 leading-snug ${roofCfg.style === st.id ? 'text-slate-300' : 'text-slate-500'}`}>
                                  {st.shortDesc}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Roof Covering Material */}
                        <div>
                          <label className="text-[10px] font-semibold text-slate-700 block mb-1">
                            Material &amp; Warna Penutup Atap:
                          </label>
                          <select
                            disabled={isReadOnly}
                            value={roofCfg.material}
                            onChange={(e) => updateRoofCfg({ material: e.target.value as RoofMaterialType })}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 text-[11px] font-semibold"
                          >
                            {ROOF_MATERIAL_OPTIONS.map(m => (
                              <option key={m.id} value={m.id}>
                                {m.name} (Rp {(m.rateEconomyIdr / 1000).toFixed(0)}rb/m²)
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Roof Wall / Sopi-Sopi & Parapet Finish */}
                        <div>
                          <label className="text-[10px] font-semibold text-slate-700 block mb-1">
                            Dinding Atap (Sopi-Sopi / Parapet):
                          </label>
                          <select
                            disabled={isReadOnly}
                            value={roofCfg.wallFinish}
                            onChange={(e) => updateRoofCfg({ wallFinish: e.target.value as RoofWallFinishType })}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 text-[11px] font-semibold"
                          >
                            {ROOF_WALL_FINISH_OPTIONS.map(w => (
                              <option key={w.id} value={w.id}>
                                {w.name} {w.extraCostIdr > 0 ? `(+Rp ${(w.extraCostIdr / 1000000).toFixed(1)} jt)` : '(Standar)'}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Pitch Angle & Parapet Height */}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <div className="bg-white p-2 rounded-lg border border-slate-200">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="text-slate-600">Kemiringan:</span>
                              <strong className="font-mono text-slate-900">{roofCfg.pitchDegrees}°</strong>
                            </div>
                            <input
                              type="range"
                              min={12}
                              max={35}
                              step={1}
                              disabled={isReadOnly || roofCfg.style === 'flat-parapet'}
                              value={roofCfg.pitchDegrees}
                              onChange={(e) => updateRoofCfg({ pitchDegrees: parseInt(e.target.value, 10) })}
                              className="w-full mt-1 accent-slate-800 cursor-pointer"
                            />
                          </div>

                          <div className="bg-white p-2 rounded-lg border border-slate-200">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="text-slate-600">Dinding Tepi:</span>
                              <strong className="font-mono text-slate-900">{roofCfg.parapetHeight.toFixed(2)}m</strong>
                            </div>
                            <input
                              type="range"
                              min={0.4}
                              max={1.2}
                              step={0.05}
                              disabled={isReadOnly}
                              value={roofCfg.parapetHeight}
                              onChange={(e) => updateRoofCfg({ parapetHeight: parseFloat(e.target.value) })}
                              className="w-full mt-1 accent-slate-800 cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Part 5.2: Linked Component Option */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-800 block text-[11px]">Tautkan ke Komponen Lantai 2</span>
                      <span className="text-[10px] text-slate-500">Jika ruangan ini bergeser, komponen 2F ikut tersinkronisasi</span>
                    </div>
                    <input
                      type="checkbox"
                      disabled={isReadOnly}
                      checked={Boolean(selectedRoom.isLinkedToGround)}
                      onChange={(e) => updateRoomProperty(selectedRoom.id, { isLinkedToGround: e.target.checked })}
                      className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                    />
                  </div>

                  {/* Polygon & Vertex Actions */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-700">Geometri Poligon Bebas</span>
                      <span className="text-[11px] text-indigo-600 font-semibold">
                        {selectedRoom.polygonPoints ? `${selectedRoom.polygonPoints.length} Titik Sudut` : 'Bentuk Kotak'}
                      </span>
                    </div>

                    {!isReadOnly && !selectedRoom.polygonPoints && (
                      <button
                        onClick={() => handleConvertToPolygon(selectedRoom.id)}
                        className="w-full py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Split className="w-3.5 h-3.5" />
                        <span>Ubah ke Poligon (Bisa Tambah Titik)</span>
                      </button>
                    )}

                    {!isReadOnly && selectedRoom.polygonPoints && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAddVertexToRoom(selectedRoom.id)}
                          className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Titik Sudut</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Canva-Style Layer Order Controls for Room */}
                  {!isReadOnly && (
                    <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-200/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-indigo-950 text-[11px] flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Urutan Layer Ruangan (Gaya Canva)</span>
                        </span>
                        <span className="text-[10px] text-indigo-700 font-mono">Shortcut: [ / ]</span>
                      </div>
                      <div className="grid grid-cols-4 gap-1">
                        <button
                          type="button"
                          onClick={() => handleReorderRoomLayer(selectedRoom.id, 'to-back')}
                          className="py-1 px-1.5 rounded bg-white hover:bg-indigo-100 text-indigo-900 border border-indigo-200 font-bold text-[10px] transition-colors cursor-pointer"
                          title="Kirim ke Paling Belakang (Send to Back)"
                        >
                          ⟪ Belakang
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReorderRoomLayer(selectedRoom.id, 'backward')}
                          className="py-1 px-1.5 rounded bg-white hover:bg-indigo-100 text-indigo-900 border border-indigo-200 font-bold text-[10px] transition-colors cursor-pointer"
                          title="Mundurkan 1 Layer (Send Backward)"
                        >
                          ⟨ Mundur
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReorderRoomLayer(selectedRoom.id, 'forward')}
                          className="py-1 px-1.5 rounded bg-white hover:bg-indigo-100 text-indigo-900 border border-indigo-200 font-bold text-[10px] transition-colors cursor-pointer"
                          title="Majukan 1 Layer (Bring Forward)"
                        >
                          Maju ⟩
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReorderRoomLayer(selectedRoom.id, 'to-front')}
                          className="py-1 px-1.5 rounded bg-white hover:bg-indigo-100 text-indigo-900 border border-indigo-200 font-bold text-[10px] transition-colors cursor-pointer"
                          title="Bawa ke Paling Depan (Bring to Front)"
                        >
                          Depan ⟫
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Open Walls Customizer (100% Mandiri / Putus Relasi Dinding Tetangga untuk Semua Ruangan) */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 text-[11px] flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Kustom Dinding Terbuka / Setengah / Railing</span>
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        Mandiri (Putus Relasi)
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      Setiap sisi dinding berdiri mandiri untuk ruangan ini saja (berlaku di semua ruangan). Membuka dinding ruangan ini tidak akan pernah membuka dinding ruangan di sebelahnya yang disetel <strong>Masif</strong>.
                    </p>

                    {(['north', 'south', 'west', 'east'] as const).map(wall => {
                      const curType: WallOpeningType = selectedRoom.openWalls?.[wall] || 'solid';
                      const wallLabels = {
                        north: 'Dinding Utara (Depan)',
                        south: 'Dinding Selatan (Belakang)',
                        west: 'Dinding Barat (Kiri)',
                        east: 'Dinding Timur (Kanan)',
                      };
                      const isHoriz = wall === 'north' || wall === 'south';

                      return (
                        <div key={wall} className="space-y-1.5 text-[11px] bg-white p-2 rounded-lg border border-slate-200">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-700 font-semibold text-[10px]">{wallLabels[wall]}</span>
                            <span className="text-[9px] font-mono text-slate-400">
                              {curType === 'solid' ? 'Masif' : curType === 'open' ? 'Terbuka Penuh' : curType === 'railing' ? 'Railing' : curType === 'open-half-start' ? (isHoriz ? '½ Kiri Terbuka' : '½ Atas Terbuka') : (isHoriz ? '½ Kanan Terbuka' : '½ Bawah Terbuka')}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-1">
                            <button
                              type="button"
                              disabled={isReadOnly}
                              onClick={() => updateRoomWallType(selectedRoom.id, wall, 'solid')}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                                curType === 'solid' ? 'bg-slate-800 text-white border-slate-900' : 'bg-slate-100 text-slate-600 border-slate-200'
                              }`}
                              title="Dinding bata penuh/masif"
                            >
                              🧱 Masif
                            </button>
                            <button
                              type="button"
                              disabled={isReadOnly}
                              onClick={() => updateRoomWallType(selectedRoom.id, wall, 'open-half-start')}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                                curType === 'open-half-start' ? 'bg-teal-600 text-white border-teal-700' : 'bg-slate-100 text-slate-600 border-slate-200'
                              }`}
                              title={isHoriz ? 'Setengah Kiri terbuka, Setengah Kanan dinding masif' : 'Setengah Atas terbuka, Setengah Bawah dinding masif'}
                            >
                              {isHoriz ? '◐ ½ Kiri' : '◐ ½ Atas'}
                            </button>
                            <button
                              type="button"
                              disabled={isReadOnly}
                              onClick={() => updateRoomWallType(selectedRoom.id, wall, 'open-half-end')}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                                curType === 'open-half-end' ? 'bg-teal-600 text-white border-teal-700' : 'bg-slate-100 text-slate-600 border-slate-200'
                              }`}
                              title={isHoriz ? 'Setengah Kanan terbuka (mis. ke Tangga), Setengah Kiri masif (mis. ke KM)' : 'Setengah Bawah terbuka, Setengah Atas dinding masif'}
                            >
                              {isHoriz ? '◑ ½ Kanan' : '◑ ½ Bawah'}
                            </button>
                            <button
                              type="button"
                              disabled={isReadOnly}
                              onClick={() => updateRoomWallType(selectedRoom.id, wall, 'railing')}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                                curType === 'railing' ? 'bg-cyan-600 text-white border-cyan-700' : 'bg-slate-100 text-slate-600 border-slate-200'
                              }`}
                              title="Pagar railing pengaman (0.9m) untuk balkon / teras"
                            >
                              🛡️ Railing
                            </button>
                            <button
                              type="button"
                              disabled={isReadOnly}
                              onClick={() => updateRoomWallType(selectedRoom.id, wall, 'open')}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                                curType === 'open' ? 'bg-emerald-600 text-white border-emerald-700' : 'bg-slate-100 text-slate-600 border-slate-200'
                              }`}
                              title="Dinding terbuka bebas tanpa sekat (otomatis tetap menutup bagian yang bersinggungan dengan Kamar Mandi tertutup)"
                            >
                              🪟 Terbuka Penuh
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* CUSTOMIZABLE SLIDING GLASS WALL & CURTAINS (Feedback Item 8) */}
                  <div className="p-3 bg-sky-50/70 rounded-xl border border-sky-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">🪟</span>
                        <div>
                          <span className="font-bold text-sky-950 text-[11px] block">Dinding Kaca Geser &amp; Gorden</span>
                          <span className="text-[10px] text-sky-700">Pintu/dinding kaca lebar dengan rel tirai</span>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        disabled={isReadOnly}
                        checked={Boolean(selectedRoom.glassWall?.hasGlassWall)}
                        onChange={(e) => {
                          const currentGw = selectedRoom.glassWall || {};
                          const side = currentGw.wallSide || 'north';
                          const maxSpan = side === 'north' || side === 'south' ? selectedRoom.width : selectedRoom.depth;
                          const maxH = selectedRoom.wallHeight || (selectedRoom.floor === '2F' ? 3.0 : 3.2);
                          updateRoomProperty(selectedRoom.id, {
                            glassWall: {
                              ...currentGw,
                              hasGlassWall: e.target.checked,
                              wallSide: side,
                              glassWidth: currentGw.glassWidth !== undefined ? Math.min(maxSpan, currentGw.glassWidth) : Number((maxSpan * 0.8).toFixed(2)),
                              glassHeight: currentGw.glassHeight !== undefined ? Math.min(maxH, currentGw.glassHeight) : Number(Math.min(2.6, maxH - 0.2).toFixed(2)),
                              alignment: currentGw.alignment || 'center',
                              panelCount: currentGw.panelCount || 3,
                              hasCurtain: currentGw.hasCurtain !== undefined ? currentGw.hasCurtain : true,
                              curtainType: currentGw.curtainType || 'sheer',
                            },
                          });
                        }}
                        className="w-4 h-4 text-sky-600 rounded cursor-pointer"
                      />
                    </div>

                    {selectedRoom.glassWall?.hasGlassWall && (() => {
                      const gwDim = resolveGlassWallDimensions(selectedRoom);
                      const remainingSideTotal = Number((gwDim.leftWallSpan + gwDim.rightWallSpan).toFixed(2));
                      return (
                        <div className="space-y-2.5 pt-2 border-t border-sky-200/80 text-[11px]">
                          {/* Wall Side for Glass Wall */}
                          <div>
                            <label className="text-sky-900 block mb-1 font-semibold text-[10px]">Posisi Sisi Dinding Kaca:</label>
                            <div className="grid grid-cols-4 gap-1">
                              {(['north', 'south', 'west', 'east'] as const).map(side => (
                                <button
                                  key={side}
                                  type="button"
                                  disabled={isReadOnly}
                                  onClick={() => {
                                    const newMaxSpan = side === 'north' || side === 'south' ? selectedRoom.width : selectedRoom.depth;
                                    const currentW = selectedRoom.glassWall?.glassWidth;
                                    const nextW = currentW !== undefined
                                      ? Number(Math.min(newMaxSpan, Math.max(0.6, currentW)).toFixed(2))
                                      : Number((newMaxSpan * 0.8).toFixed(2));
                                    updateRoomProperty(selectedRoom.id, {
                                      glassWall: {
                                        ...selectedRoom.glassWall,
                                        wallSide: side,
                                        glassWidth: nextW,
                                      },
                                    });
                                  }}
                                  className={`py-1 rounded text-center font-bold text-[10px] border transition-colors cursor-pointer ${
                                    gwDim.wallSide === side
                                      ? 'bg-sky-600 text-white border-sky-700 shadow-xs'
                                      : 'bg-white text-slate-700 border-sky-200 hover:bg-sky-100'
                                  }`}
                                >
                                  {side === 'north' ? 'Depan' : side === 'south' ? 'Belakang' : side === 'west' ? 'Kiri' : 'Kanan'}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Custom Glass Width x Height in Meters */}
                          <div className="bg-white/90 p-2.5 rounded-lg border border-sky-200/90 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-sky-950 text-[10px]">Ukuran Kaca (Lebar × Tinggi):</span>
                              <button
                                type="button"
                                disabled={isReadOnly}
                                onClick={() => {
                                  updateRoomProperty(selectedRoom.id, {
                                    glassWall: {
                                      ...selectedRoom.glassWall,
                                      glassWidth: gwDim.totalWallSpan,
                                      glassHeight: Number(Math.min(2.8, gwDim.maxWallHeight).toFixed(2)),
                                    },
                                  });
                                }}
                                className="px-1.5 py-0.5 rounded bg-sky-100 hover:bg-sky-200 text-sky-800 font-bold text-[9px] border border-sky-300 transition-colors cursor-pointer"
                                title="Samakan lebar kaca dengan lebar penuh sisi dinding ini"
                              >
                                Lebar Penuh ({gwDim.totalWallSpan}m)
                              </button>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[10px] text-slate-600 block mb-0.5">
                                  Lebar Kaca (maks {gwDim.totalWallSpan}m)
                                </label>
                                <div className="relative flex items-center">
                                  <input
                                    type="number"
                                    step="0.1"
                                    min={0.6}
                                    max={gwDim.totalWallSpan}
                                    disabled={isReadOnly}
                                    value={gwDim.glassWidth}
                                    onChange={(e) => {
                                      const val = parseFloat(e.target.value);
                                      if (Number.isNaN(val)) return;
                                      const clamped = Number(Math.max(0.6, Math.min(gwDim.totalWallSpan, val)).toFixed(2));
                                      updateRoomProperty(selectedRoom.id, {
                                        glassWall: {
                                          ...selectedRoom.glassWall,
                                          glassWidth: clamped,
                                          glassWidthRatio: Number((clamped / (gwDim.totalWallSpan || 1)).toFixed(2)),
                                        },
                                      });
                                    }}
                                    className="w-full px-2 py-1 pr-6 text-[11px] font-mono font-bold text-slate-900 bg-white border border-sky-300 rounded focus:outline-none focus:ring-1 focus:ring-sky-500 tabular-nums"
                                  />
                                  <span className="absolute right-2 text-[10px] font-mono text-slate-400">m</span>
                                </div>
                              </div>

                              <div>
                                <label className="text-[10px] text-slate-600 block mb-0.5">
                                  Tinggi Kaca (maks {gwDim.maxWallHeight}m)
                                </label>
                                <div className="relative flex items-center">
                                  <input
                                    type="number"
                                    step="0.1"
                                    min={1.0}
                                    max={gwDim.maxWallHeight}
                                    disabled={isReadOnly}
                                    value={gwDim.glassHeight}
                                    onChange={(e) => {
                                      const val = parseFloat(e.target.value);
                                      if (Number.isNaN(val)) return;
                                      const clamped = Number(Math.max(1.0, Math.min(gwDim.maxWallHeight, val)).toFixed(2));
                                      updateRoomProperty(selectedRoom.id, {
                                        glassWall: {
                                          ...selectedRoom.glassWall,
                                          glassHeight: clamped,
                                        },
                                      });
                                    }}
                                    className="w-full px-2 py-1 pr-6 text-[11px] font-mono font-bold text-slate-900 bg-white border border-sky-300 rounded focus:outline-none focus:ring-1 focus:ring-sky-500 tabular-nums"
                                  />
                                  <span className="absolute right-2 text-[10px] font-mono text-slate-400">m</span>
                                </div>
                              </div>
                            </div>

                            {/* Alignment Selector (Kiri / Tengah / Kanan) */}
                            <div>
                              <label className="text-[10px] text-slate-600 block mb-1">
                                Posisi Kaca (Sisa Bentang Menjadi Dinding Biasa):
                              </label>
                              <div className="grid grid-cols-3 gap-1">
                                {([
                                  { id: 'left', label: 'Rata Kiri' },
                                  { id: 'center', label: 'Tengah' },
                                  { id: 'right', label: 'Rata Kanan' },
                                ] as const).map(pos => (
                                  <button
                                    key={pos.id}
                                    type="button"
                                    disabled={isReadOnly}
                                    onClick={() => {
                                      updateRoomProperty(selectedRoom.id, {
                                        glassWall: {
                                          ...selectedRoom.glassWall,
                                          alignment: pos.id,
                                        },
                                      });
                                    }}
                                    className={`py-1 rounded text-center font-bold text-[10px] border transition-colors cursor-pointer ${
                                      gwDim.alignment === pos.id
                                        ? 'bg-sky-700 text-white border-sky-800'
                                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-sky-50'
                                    }`}
                                  >
                                    {pos.label}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Live Summary of Glass vs Remaining Solid Wall */}
                            <div className="p-2 rounded bg-slate-50 border border-slate-200/80 text-[10px] text-slate-700 font-mono tabular-nums space-y-0.5">
                              <div className="flex items-center justify-between">
                                <span className="text-slate-500">Bentang Kaca Geser:</span>
                                <span className="font-bold text-sky-800">{gwDim.glassWidth.toFixed(2)}m × {gwDim.glassHeight.toFixed(2)}m</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-slate-500">Sisa Dinding Biasa (Samping):</span>
                                <span className="font-bold text-slate-800">
                                  {remainingSideTotal > 0
                                    ? `${remainingSideTotal.toFixed(2)}m (${gwDim.leftWallSpan.toFixed(2)}m / ${gwDim.rightWallSpan.toFixed(2)}m)`
                                    : '0.00m (Lebar Penuh)'}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-slate-500">Sisa Dinding Atas (Lintel):</span>
                                <span className="font-bold text-slate-800">
                                  {gwDim.topWallHeight > 0 ? `${gwDim.topWallHeight.toFixed(2)}m` : '0.00m (Full Plafon)'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Panel Count (2, 3, or 4 Leaves) */}
                          <div className="flex items-center justify-between">
                            <span className="text-sky-900 font-semibold text-[10px]">Jumlah Daun Kaca Geser:</span>
                            <div className="flex items-center gap-1">
                              {([2, 3, 4] as const).map(cnt => (
                                <button
                                  key={cnt}
                                  type="button"
                                  disabled={isReadOnly}
                                  onClick={() => {
                                    updateRoomProperty(selectedRoom.id, {
                                      glassWall: {
                                        ...selectedRoom.glassWall,
                                        panelCount: cnt,
                                      },
                                    });
                                  }}
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                                    gwDim.panelCount === cnt
                                      ? 'bg-sky-700 text-white border-sky-800'
                                      : 'bg-white text-slate-700 border-sky-200 hover:bg-sky-100'
                                  }`}
                                >
                                  {cnt} Daun
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Curtain Option & Fabric Type */}
                          <div className="bg-white/80 p-2 rounded-lg border border-sky-200/80 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-800 text-[10px]">Pasang Tirai / Gorden Penutup</span>
                              <input
                                type="checkbox"
                                disabled={isReadOnly}
                                checked={gwDim.hasCurtain}
                                onChange={(e) => {
                                  updateRoomProperty(selectedRoom.id, {
                                    glassWall: {
                                      ...selectedRoom.glassWall,
                                      hasCurtain: e.target.checked,
                                    },
                                  });
                                }}
                                className="w-3.5 h-3.5 text-sky-600 rounded cursor-pointer"
                              />
                            </div>

                            {gwDim.hasCurtain && (
                              <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                                <span className="text-[10px] text-slate-600">Jenis Kain:</span>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    disabled={isReadOnly}
                                    onClick={() => {
                                      updateRoomProperty(selectedRoom.id, {
                                        glassWall: {
                                          ...selectedRoom.glassWall,
                                          curtainType: 'sheer',
                                        },
                                      });
                                    }}
                                    className={`px-2 py-0.5 rounded text-[10px] font-semibold border cursor-pointer ${
                                      gwDim.curtainType === 'sheer'
                                        ? 'bg-indigo-600 text-white border-indigo-700'
                                        : 'bg-slate-100 text-slate-700 border-slate-200'
                                    }`}
                                  >
                                    Vitrase Tipis
                                  </button>
                                  <button
                                    type="button"
                                    disabled={isReadOnly}
                                    onClick={() => {
                                      updateRoomProperty(selectedRoom.id, {
                                        glassWall: {
                                          ...selectedRoom.glassWall,
                                          curtainType: 'blackout',
                                        },
                                      });
                                    }}
                                    className={`px-2 py-0.5 rounded text-[10px] font-semibold border cursor-pointer ${
                                      gwDim.curtainType === 'blackout'
                                        ? 'bg-purple-600 text-white border-purple-700'
                                        : 'bg-slate-100 text-slate-700 border-slate-200'
                                    }`}
                                  >
                                    Blackout Tebal
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* CUSTOMIZABLE ATAP KACA SKYLIGHT (VOID & TAMAN) (Feedback Item 8) */}
                  <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Sun className="w-4 h-4 text-amber-500" />
                        <div>
                          <span className="font-bold text-emerald-950 text-[11px] block">Atap Kaca Skylight (Void)</span>
                          <span className="text-[10px] text-emerald-700">Kanopi kaca tempered transparan</span>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        disabled={isReadOnly}
                        checked={Boolean(selectedRoom.skylight?.hasSkylight)}
                        onChange={(e) => {
                          const curSky = selectedRoom.skylight || {};
                          updateRoomProperty(selectedRoom.id, {
                            skylight: {
                              ...curSky,
                              hasSkylight: e.target.checked,
                              glassTint: curSky.glassTint || 'clear',
                              gridSpacing: curSky.gridSpacing || 0.5,
                            },
                          });
                        }}
                        className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                      />
                    </div>

                    {selectedRoom.skylight?.hasSkylight && (
                      <div className="pt-2 border-t border-emerald-200/80 flex items-center justify-between text-[11px]">
                        <span className="text-emerald-900 font-semibold text-[10px]">Tipe Kaca Skylight:</span>
                        <div className="flex items-center gap-1">
                          {(['clear', 'solar', 'frosted'] as const).map(tint => (
                            <button
                              key={tint}
                              type="button"
                              disabled={isReadOnly}
                              onClick={() => {
                                updateRoomProperty(selectedRoom.id, {
                                  skylight: {
                                    ...selectedRoom.skylight,
                                    glassTint: tint,
                                  },
                                });
                              }}
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-colors cursor-pointer ${
                                (selectedRoom.skylight?.glassTint || 'clear') === tint
                                  ? 'bg-emerald-700 text-white border-emerald-800'
                                  : 'bg-white text-slate-700 border-emerald-200 hover:bg-emerald-100'
                              }`}
                            >
                              {tint === 'clear' ? 'Bening' : tint === 'solar' ? 'Solar Tint' : 'Buram'}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ROOM ATTACHED WINDOWS & DOORS LIST (Direct Inspection & 1-Click Delete) */}
                  {(() => {
                    const roomWindows = currentWindows.filter(w => w.roomId === selectedRoom.id);
                    const roomDoors = currentDoors.filter(d => d.roomId === selectedRoom.id);
                    const sideLabelMap: Record<WallSide, string> = {
                      north: 'Depan (Utara)',
                      south: 'Belakang (Selatan)',
                      west: 'Kiri (Barat)',
                      east: 'Kanan (Timur)',
                    };

                    return (
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800 text-[11px] flex items-center gap-1.5">
                            <Maximize2 className="w-3.5 h-3.5 text-sky-600" />
                            <span>Daftar Jendela &amp; Pintu di Ruang Ini</span>
                          </span>
                          <span className="text-[10px] font-mono tabular-nums text-slate-500">
                            {roomWindows.length} Jendela · {roomDoors.length} Pintu
                          </span>
                        </div>

                        {/* Windows List in this Room */}
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-semibold text-slate-500 block">
                            Jendela &amp; Ventilasi Terpasang ({roomWindows.length}):
                          </span>
                          {roomWindows.length === 0 ? (
                            <div className="px-2.5 py-2 rounded-lg bg-white border border-slate-200 text-[10px] text-slate-500">
                              Tidak ada jendela/ventilasi di ruangan ini (Dinding Masif).
                            </div>
                          ) : (
                            roomWindows.map(win => (
                              <div
                                key={win.id}
                                className="flex items-center justify-between gap-2 bg-white px-2.5 py-1.5 rounded-lg border border-sky-200/90"
                              >
                                <div className="min-w-0 flex-1">
                                  <span className="font-bold text-slate-800 text-[11px] block truncate">
                                    {win.name}
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-mono tabular-nums block">
                                    Sisi {sideLabelMap[win.wallSide]} · {win.width.toFixed(2)}m × {(win.height || 1.4).toFixed(2)}m
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedWindowId(win.id);
                                      setSelectedRoomId(null);
                                      setSelectedDoorId(null);
                                      setSelectedFurnitureId(null);
                                    }}
                                    className="px-2 py-1 rounded bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 font-semibold text-[10px] cursor-pointer whitespace-nowrap shrink-0"
                                    title="Atur ukuran & posisi jendela ini"
                                  >
                                    Edit
                                  </button>
                                  {!isReadOnly && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteWindow(win.id)}
                                      className="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-[10px] flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
                                      title="Hapus jendela ini dari dinding ruangan"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                      <span>Hapus</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Doors List in this Room */}
                        <div className="space-y-1.5 pt-1 border-t border-slate-200/70">
                          <span className="text-[10px] font-semibold text-slate-500 block">
                            Pintu Terpasang ({roomDoors.length}):
                          </span>
                          {roomDoors.length === 0 ? (
                            <div className="px-2.5 py-2 rounded-lg bg-white border border-slate-200 text-[10px] text-slate-500">
                              Tidak ada pintu khusus yang terdaftar pada ruangan ini.
                            </div>
                          ) : (
                            roomDoors.map(door => (
                              <div
                                key={door.id}
                                className="flex items-center justify-between gap-2 bg-white px-2.5 py-1.5 rounded-lg border border-teal-200/90"
                              >
                                <div className="min-w-0 flex-1">
                                  <span className="font-bold text-slate-800 text-[11px] block truncate">
                                    {door.name}
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-mono tabular-nums block">
                                    Sisi {sideLabelMap[door.wallSide]} · {door.width.toFixed(2)}m × {(door.height || 2.1).toFixed(2)}m
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedDoorId(door.id);
                                      setSelectedRoomId(null);
                                      setSelectedWindowId(null);
                                      setSelectedFurnitureId(null);
                                    }}
                                    className="px-2 py-1 rounded bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 font-semibold text-[10px] cursor-pointer whitespace-nowrap shrink-0"
                                    title="Atur posisi & arah bukaan pintu ini"
                                  >
                                    Edit
                                  </button>
                                  {!isReadOnly && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteDoor(door.id)}
                                      className="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-[10px] flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
                                      title="Hapus pintu ini dari dinding ruangan"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                      <span>Hapus</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Quick Door & Window Placement */}
                  {!isReadOnly && (
                    <div className="space-y-1.5">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handlePlaceDoor(selectedRoom, 'south', { x: selectedRoom.x + selectedRoom.width / 2, y: selectedRoom.y + selectedRoom.depth })}
                          className="py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg font-semibold flex items-center justify-center gap-1.5 cursor-pointer text-[11px]"
                        >
                          <DoorClosed className="w-3.5 h-3.5 text-teal-600" />
                          <span>+ Pasang Pintu</span>
                        </button>
                        <button
                          onClick={() => handleAddWindow(selectedRoom, 'casement', 'north')}
                          className="py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-lg font-semibold flex items-center justify-center gap-1.5 cursor-pointer text-[11px]"
                        >
                          <Maximize2 className="w-3.5 h-3.5 text-sky-600" />
                          <span>+ Jendela Kaca</span>
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleAddWindow(selectedRoom, 'roster-vent', 'north')}
                          className="py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg font-semibold flex items-center justify-center gap-1.5 cursor-pointer text-[11px]"
                        >
                          <span>🧱 + Roster Tropis</span>
                        </button>
                        <button
                          onClick={() => handleAddWindow(selectedRoom, 'bovenlicht', 'north')}
                          className="py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-lg font-semibold flex items-center justify-center gap-1.5 cursor-pointer text-[11px]"
                        >
                          <span>🪟 + Bouvenlight</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  {!isReadOnly && (
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => updateRoomProperty(selectedRoom.id, { isLocked: !selectedRoom.isLocked })}
                        className={`flex-1 py-1.5 rounded-lg border font-semibold flex items-center justify-center gap-1.5 cursor-pointer ${
                          selectedRoom.isLocked ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        {selectedRoom.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                        <span>{selectedRoom.isLocked ? 'Terkunci' : 'Kunci Geometri'}</span>
                      </button>

                      <button
                        onClick={() => handleDeleteRoom(selectedRoom.id)}
                        className="py-1.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus Ruang...</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Empty state */}
              {!selectedDoorId && selectedVertexIndex === null && !selectedRoom && !selectedWindowId && (
                <div className="text-center py-8 text-slate-400 space-y-2">
                  <Move className="w-8 h-8 mx-auto opacity-40 text-slate-500" />
                  <p className="text-xs">Klik salah satu ruangan, pintu, jendela, atau titik sudut di kanvas untuk menginspeksi dan mengedit.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 1.5: STAIRCASE INSPECTOR */}
          {activeInspectorTab === 'staircase' && (
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-amber-600" />
                  <span>Kustomisasi Bentuk &amp; Posisi Tangga</span>
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-mono">
                  {((currentStaircase.shape || currentStaircase.type || 'l-shape')).toUpperCase()}
                </span>
              </div>

              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
                <span className="font-bold text-amber-950 block text-[11px]">Pilih Bentuk Konstruksi Tangga:</span>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { shape: 'l-shape' as const, label: 'Bentuk L', desc: '90° Bordes' },
                    { shape: 'u-shape' as const, label: 'Bentuk U', desc: '180° Balik Arah' },
                    { shape: 'straight' as const, label: 'Lurus', desc: 'Straight Run' },
                  ].map(opt => (
                    <button
                      key={opt.shape}
                      type="button"
                      disabled={isReadOnly}
                      onClick={() => updateStaircaseProperty({ shape: opt.shape, type: opt.shape })}
                      className={`p-2 rounded-xl text-center border font-bold transition-all cursor-pointer ${
                        (currentStaircase.shape || currentStaircase.type) === opt.shape
                          ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-amber-100/50'
                      }`}
                    >
                      <span className="block text-xs">{opt.label}</span>
                      <span className={`block text-[9px] ${(currentStaircase.shape || currentStaircase.type) === opt.shape ? 'text-amber-100' : 'text-slate-400'}`}>
                        {opt.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Staircase Position & Drag Note */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-500 block mb-1">Posisi X (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    disabled={isReadOnly}
                    value={currentStaircase.x}
                    onChange={(e) => updateStaircaseProperty({ x: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 font-mono font-semibold"
                  />
                </div>
                <div>
                  <label className="text-slate-500 block mb-1">Posisi Y (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    disabled={isReadOnly}
                    value={currentStaircase.y}
                    onChange={(e) => updateStaircaseProperty({ y: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 font-mono font-semibold"
                  />
                </div>
              </div>

              {/* Dimensions */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-slate-500 block mb-1 text-[10px]">Lebar Tangga (m)</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.7"
                    max="1.5"
                    disabled={isReadOnly}
                    value={currentStaircase.width}
                    onChange={(e) => updateStaircaseProperty({ width: parseFloat(e.target.value) || 0.9 })}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-500 block mb-1 text-[10px]">Panjang Run (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1.5"
                    max="5.0"
                    disabled={isReadOnly}
                    value={currentStaircase.totalRun || currentStaircase.depth || 2.45}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 2.45;
                      updateStaircaseProperty({ totalRun: val, depth: val });
                    }}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-500 block mb-1 text-[10px]">Jumlah Trap</label>
                  <input
                    type="number"
                    min="12"
                    max="24"
                    disabled={isReadOnly}
                    value={currentStaircase.stepsCount || currentStaircase.numberOfSteps || 20}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 20;
                      updateStaircaseProperty({ stepsCount: val, numberOfSteps: val });
                    }}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200 font-mono"
                  />
                </div>
              </div>

              {/* Rotation & Direction */}
              <div>
                <label className="text-slate-500 block mb-1 font-semibold">Arah Hadap &amp; Rotasi Tangga:</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[0, 90, 180, 270].map(rot => (
                    <button
                      key={rot}
                      type="button"
                      disabled={isReadOnly}
                      onClick={() => updateStaircaseProperty({ rotation: rot })}
                      className={`py-1.5 rounded-lg text-center font-bold text-[11px] border transition-colors cursor-pointer ${
                        (currentStaircase.rotation ?? 0) === rot
                          ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {rot === 0 ? '0° (Timur)' : rot === 90 ? '90° (Utara)' : rot === 180 ? '180° (Barat)' : '270° (Selatan)'}
                    </button>
                  ))}
                </div>
              </div>

              {/* SNI Architectural Formula Verification Card */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Standar Ergonomi Tangga Hunian (SNI):</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    2T + L = 66cm (Lolos SNI)
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-600">
                  <div>
                    <span>Tinggi Tanjakan (Optrade):</span>
                    <strong className="block text-slate-800 font-mono">{(currentStaircase.riserHeight * 100).toFixed(1)} cm (Maks 20cm)</strong>
                  </div>
                  <div>
                    <span>Lebar Injakan (Antrade):</span>
                    <strong className="block text-slate-800 font-mono">{(currentStaircase.treadDepth * 100).toFixed(1)} cm (Min 25cm)</strong>
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 pt-1 leading-relaxed">
                  💡 Tips: Anda dapat langsung menggeser posisi tangga ini dengan klik dan drag pada kanvas denah Lantai 1 (GF).
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: FURNITURE INSPECTOR */}
          {activeInspectorTab === 'furniture' && (
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Armchair className="w-4 h-4 text-indigo-600" />
                  <span>Inspeksi &amp; Detail Furnitur</span>
                </h3>
                {selectedFurniture && (
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                    {selectedFurniture.type}
                  </span>
                )}
              </div>

              {selectedFurniture ? (
                <div className="space-y-3.5 text-xs">
                  <div>
                    <label className="text-slate-500 block mb-1">Nama Furnitur</label>
                    <input
                      type="text"
                      disabled={isReadOnly}
                      value={selectedFurniture.name}
                      onChange={(e) => updateFurnitureProperty(selectedFurniture.id, { name: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 font-semibold text-slate-900"
                    />
                  </div>

                  {/* Parent Room Relation & Canva-Style Layer Ordering */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                    <div>
                      <label className="text-slate-600 font-bold block mb-1 text-[11px]">Relasi Ruangan Induk (Ikut Bergeser Bersama Ruang)</label>
                      <select
                        disabled={isReadOnly}
                        value={selectedFurniture.roomId}
                        onChange={(e) => {
                          const targetRoom = [...currentDesign.groundFloorRooms, ...currentDesign.secondFloorRooms].find(r => r.id === e.target.value);
                          if (targetRoom) {
                            const clampedX = Number(Math.max(targetRoom.x + 0.1, Math.min(targetRoom.x + targetRoom.width - selectedFurniture.width - 0.1, selectedFurniture.x)).toFixed(2));
                            const clampedY = Number(Math.max(targetRoom.y + 0.1, Math.min(targetRoom.y + targetRoom.depth - selectedFurniture.depth - 0.1, selectedFurniture.y)).toFixed(2));
                            updateFurnitureProperty(selectedFurniture.id, {
                              roomId: targetRoom.id,
                              x: clampedX,
                              y: clampedY,
                            });
                          } else {
                            updateFurnitureProperty(selectedFurniture.id, { roomId: e.target.value });
                          }
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 font-semibold text-slate-800 text-[11px]"
                      >
                        <optgroup label="Lantai 1 (GF)">
                          {currentDesign.groundFloorRooms.map(r => (
                            <option key={r.id} value={r.id}>{getDynamicRoomLabel(r.id, r, currentDesign.customRoomLabels)} ({r.id})</option>
                          ))}
                        </optgroup>
                        <optgroup label="Lantai 2 (2F)">
                          {currentDesign.secondFloorRooms.map(r => (
                            <option key={r.id} value={r.id}>{getDynamicRoomLabel(r.id, r, currentDesign.customRoomLabels)} ({r.id})</option>
                          ))}
                        </optgroup>
                      </select>
                    </div>

                    {!isReadOnly && (
                      <div className="pt-2 border-t border-slate-200/80 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-indigo-950 text-[10px] flex items-center gap-1">
                            <Layers className="w-3 h-3 text-indigo-600" />
                            <span>Urutan Layer Perabot (Gaya Canva)</span>
                          </span>
                          <span className="text-[9px] text-slate-400 font-mono">[ / ]</span>
                        </div>
                        <div className="grid grid-cols-4 gap-1">
                          <button
                            type="button"
                            onClick={() => handleReorderFurnitureLayer(selectedFurniture.id, 'to-back')}
                            className="py-1 px-1 rounded bg-white hover:bg-indigo-50 text-indigo-900 border border-indigo-200 font-bold text-[10px] cursor-pointer"
                            title="Kirim ke Paling Belakang (Send to Back)"
                          >
                            ⟪ Belakang
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReorderFurnitureLayer(selectedFurniture.id, 'backward')}
                            className="py-1 px-1 rounded bg-white hover:bg-indigo-50 text-indigo-900 border border-indigo-200 font-bold text-[10px] cursor-pointer"
                            title="Mundurkan 1 Layer (Send Backward)"
                          >
                            ⟨ Mundur
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReorderFurnitureLayer(selectedFurniture.id, 'forward')}
                            className="py-1 px-1 rounded bg-white hover:bg-indigo-50 text-indigo-900 border border-indigo-200 font-bold text-[10px] cursor-pointer"
                            title="Majukan 1 Layer (Bring Forward)"
                          >
                            Maju ⟩
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReorderFurnitureLayer(selectedFurniture.id, 'to-front')}
                            className="py-1 px-1 rounded bg-white hover:bg-indigo-50 text-indigo-900 border border-indigo-200 font-bold text-[10px] cursor-pointer"
                            title="Bawa ke Paling Depan (Bring to Front)"
                          >
                            Depan ⟫
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Move independently */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-500 block mb-1">Posisi X (m)</label>
                      <input
                        type="number"
                        step={0.05}
                        disabled={isReadOnly}
                        value={selectedFurniture.x}
                        onChange={(e) => updateFurnitureProperty(selectedFurniture.id, { x: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 font-mono font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-slate-500 block mb-1">Posisi Y (m)</label>
                      <input
                        type="number"
                        step={0.05}
                        disabled={isReadOnly}
                        value={selectedFurniture.y}
                        onChange={(e) => updateFurnitureProperty(selectedFurniture.id, { y: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 font-mono font-semibold"
                      />
                    </div>
                  </div>

                  {/* Architectural Ergonomics & Specification Card */}
                  <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-indigo-950 text-[11px] flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Deskripsi Arsitektur &amp; Orientasi Ruang</span>
                      </span>
                      <span className="font-mono text-[10px] text-indigo-700 font-bold">
                        {(selectedFurniture.width * 100).toFixed(0)} × {(selectedFurniture.depth * 100).toFixed(0)} cm
                      </span>
                    </div>

                    {selectedFurniture.type.toLowerCase().includes('bed') && (
                      <div className="space-y-1.5 text-[11px] text-indigo-900">
                        <p className="font-semibold text-indigo-950">
                          🛏️ Ranjang Tidur Utama dengan Sandaran Kepala (Headboard)
                        </p>
                        <p className="text-[10px] text-indigo-800 leading-relaxed">
                          <strong>Orientasi Kepala Ranjang:</strong> Sisi bergaris solid bertanda <em>▲ KEPALA ▲</em> pada denah 2D dan sandaran kayu jati di 3D menunjukkan orientasi kepala. Disarankan merapat ke dinding utara/timur untuk sirkulasi tenang.
                        </p>
                        <p className="text-[10px] text-indigo-700 leading-relaxed">
                          <strong>Pedoman Sirkulasi SNI:</strong> Jarak lorong samping tempat tidur minimal 60cm agar pengguna nyaman berjalan dan mudah merapikan seprai.
                        </p>
                      </div>
                    )}

                    {selectedFurniture.type.toLowerCase().includes('sofa') && (
                      <div className="space-y-1.5 text-[11px] text-indigo-900">
                        <p className="font-semibold text-indigo-950">
                          🛋️ Sofa Modular Bentuk L (L-Shaped Sectional)
                        </p>
                        <p className="text-[10px] text-indigo-800 leading-relaxed">
                          <strong>Bentuk &amp; Orientasi:</strong> Memiliki sayap sudut L untuk bersantai santai sambil menghadap TV atau bukaan jendela luar.
                        </p>
                        <p className="text-[10px] text-indigo-700 leading-relaxed">
                          <strong>Pedoman Jarak:</strong> Jarak ideal dari dudukan sofa ke meja kopi (coffee table) adalah 45cm; sirkulasi lalu-lalang ruang utama minimal 90cm.
                        </p>
                      </div>
                    )}

                    {selectedFurniture.type.toLowerCase().includes('dining') && (
                      <div className="space-y-1.5 text-[11px] text-indigo-900">
                        <p className="font-semibold text-indigo-950">
                          🪑 Meja Makan Keluarga Formasi 6 Kursi
                        </p>
                        <p className="text-[10px] text-indigo-800 leading-relaxed">
                          <strong>Orientasi:</strong> Diletakkan di koridor ruang makan dekat bukaan taman belakang agar suasana santap siang tetap sejuk berangin.
                        </p>
                        <p className="text-[10px] text-indigo-700 leading-relaxed">
                          <strong>Pedoman Jarak:</strong> Jarak bebas mundur kursi makan ke dinding min. 80cm agar kursi dapat ditarik leluasa saat bangkit.
                        </p>
                      </div>
                    )}

                    {!selectedFurniture.type.toLowerCase().includes('bed') && 
                     !selectedFurniture.type.toLowerCase().includes('sofa') && 
                     !selectedFurniture.type.toLowerCase().includes('dining') && (
                      <div className="space-y-1.5 text-[11px] text-indigo-900">
                        <p className="font-semibold text-indigo-950">
                          📦 {selectedFurniture.name}
                        </p>
                        <p className="text-[10px] text-indigo-800 leading-relaxed">
                          Perabot berdimensi {(selectedFurniture.width * 100).toFixed(0)} × {(selectedFurniture.depth * 100).toFixed(0)} cm dengan tinggi {((selectedFurniture.height || 0.8) * 100).toFixed(0)} cm. Posisikan merapat ke dinding untuk mempertahankan efisiensi luas lantai bersih.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Physical Dimensions */}
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-slate-500 block mb-1">Lebar (m)</label>
                      <input
                        type="number"
                        step={0.05}
                        min="0.2"
                        disabled={isReadOnly}
                        value={selectedFurniture.width}
                        onChange={(e) => updateFurnitureProperty(selectedFurniture.id, { width: parseFloat(e.target.value) || 0.5 })}
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-200 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-slate-500 block mb-1">Depth (m)</label>
                      <input
                        type="number"
                        step={0.05}
                        min="0.2"
                        disabled={isReadOnly}
                        value={selectedFurniture.depth}
                        onChange={(e) => updateFurnitureProperty(selectedFurniture.id, { depth: parseFloat(e.target.value) || 0.5 })}
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-200 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-slate-500 block mb-1">Tinggi (m)</label>
                      <input
                        type="number"
                        step={0.05}
                        min="0.2"
                        disabled={isReadOnly}
                        value={selectedFurniture.height || 0.8}
                        onChange={(e) => updateFurnitureProperty(selectedFurniture.id, { height: parseFloat(e.target.value) || 0.8 })}
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-200 font-mono"
                      />
                    </div>
                  </div>

                  {/* Rotation */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-slate-500">Rotasi Furnitur: {selectedFurniture.rotation || 0}°</label>
                      <div className="flex gap-1">
                        <button
                          onClick={() => updateFurnitureProperty(selectedFurniture.id, { rotation: ((selectedFurniture.rotation || 0) + 90) % 360 })}
                          className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 cursor-pointer"
                        >
                          +90°
                        </button>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      step="15"
                      disabled={isReadOnly}
                      value={selectedFurniture.rotation || 0}
                      onChange={(e) => updateFurnitureProperty(selectedFurniture.id, { rotation: parseInt(e.target.value) })}
                      className="w-full accent-indigo-600"
                    />
                  </div>

                  {/* Part 4.6: Mount Type & Wall Attachment */}
                  <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-800 block text-[11px]">Integrasi Dinding &amp; Tipe Instalasi</span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-slate-500 block text-[10px]">Tipe Pemasangan</label>
                        <select
                          disabled={isReadOnly}
                          value={selectedFurniture.mountType || 'freestanding'}
                          onChange={(e) => updateFurnitureProperty(selectedFurniture.id, { mountType: e.target.value as MountType })}
                          className="w-full px-2 py-1 rounded bg-white border border-slate-200 font-medium"
                        >
                          <option value="freestanding">Mandiri (Freestanding)</option>
                          <option value="wall-mounted">Gantung Dinding (Wall-Mounted)</option>
                          <option value="recessed">Ceruk Dinding (Recessed / Niche)</option>
                          <option value="integrated">Tanam Plafon-Lantai (Integrated)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-slate-500 block text-[10px]">Dinding Induk</label>
                        <select
                          disabled={isReadOnly}
                          value={selectedFurniture.hostWallId || 'none'}
                          onChange={(e) => updateFurnitureProperty(selectedFurniture.id, { hostWallId: e.target.value })}
                          className="w-full px-2 py-1 rounded bg-white border border-slate-200 font-medium"
                        >
                          <option value="none">Tanpa Dinding</option>
                          <option value="north">Dinding Utara</option>
                          <option value="south">Dinding Selatan</option>
                          <option value="east">Dinding Timur</option>
                          <option value="west">Dinding Barat</option>
                        </select>
                      </div>
                    </div>

                    {selectedFurniture.mountType === 'wall-mounted' && (
                      <div>
                        <label className="text-slate-500 block text-[10px]">Tinggi dari Lantai (Mounting Height in Meters)</label>
                        <input
                          type="number"
                          step="0.05"
                          disabled={isReadOnly}
                          value={selectedFurniture.distanceFromFloor || 0.75}
                          onChange={(e) => updateFurnitureProperty(selectedFurniture.id, { distanceFromFloor: parseFloat(e.target.value) || 0 })}
                          className="w-full px-2 py-1 rounded bg-white border border-slate-200 font-mono"
                        />
                      </div>
                    )}

                    {selectedFurniture.mountType === 'recessed' && (
                      <div>
                        <label className="text-slate-500 block text-[10px]">Kedalaman Ceruk Dinding (Recess Depth in Meters)</label>
                        <input
                          type="number"
                          step="0.05"
                          disabled={isReadOnly}
                          value={selectedFurniture.recessDepth || 0.15}
                          onChange={(e) => updateFurnitureProperty(selectedFurniture.id, { recessDepth: parseFloat(e.target.value) || 0 })}
                          className="w-full px-2 py-1 rounded bg-white border border-slate-200 font-mono"
                        />
                      </div>
                    )}
                  </div>

                  {/* Part 4.5: Internal Storage Layout */}
                  <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-800 block text-[11px]">Kompartemen Internal &amp; Pintu</span>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-slate-500 block text-[10px]">Jumlah Rak</label>
                        <input
                          type="number"
                          min="0"
                          max="12"
                          disabled={isReadOnly}
                          value={selectedFurniture.internalConfig?.shelves ?? 3}
                          onChange={(e) => updateFurnitureProperty(selectedFurniture.id, {
                            internalConfig: {
                              shelves: parseInt(e.target.value) || 0,
                              drawers: selectedFurniture.internalConfig?.drawers ?? 2,
                              hangingSections: selectedFurniture.internalConfig?.hangingSections ?? 1,
                              doors: selectedFurniture.internalConfig?.doors ?? 'swing',
                            }
                          })}
                          className="w-full px-2 py-1 rounded bg-white border border-slate-200 font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-slate-500 block text-[10px]">Jumlah Laci</label>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          disabled={isReadOnly}
                          value={selectedFurniture.internalConfig?.drawers ?? 2}
                          onChange={(e) => updateFurnitureProperty(selectedFurniture.id, {
                            internalConfig: {
                              shelves: selectedFurniture.internalConfig?.shelves ?? 3,
                              drawers: parseInt(e.target.value) || 0,
                              hangingSections: selectedFurniture.internalConfig?.hangingSections ?? 1,
                              doors: selectedFurniture.internalConfig?.doors ?? 'swing',
                            }
                          })}
                          className="w-full px-2 py-1 rounded bg-white border border-slate-200 font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-slate-500 block text-[10px]">Tipe Pintu</label>
                        <select
                          disabled={isReadOnly}
                          value={selectedFurniture.internalConfig?.doors || 'swing'}
                          onChange={(e) => updateFurnitureProperty(selectedFurniture.id, {
                            internalConfig: {
                              shelves: selectedFurniture.internalConfig?.shelves ?? 3,
                              drawers: selectedFurniture.internalConfig?.drawers ?? 2,
                              hangingSections: selectedFurniture.internalConfig?.hangingSections ?? 1,
                              doors: e.target.value as any,
                            }
                          })}
                          className="w-full px-1.5 py-1 rounded bg-white border border-slate-200 font-medium"
                        >
                          <option value="swing">Swing</option>
                          <option value="sliding">Sliding</option>
                          <option value="open">Terbuka</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Part 4.9: Fabrication Cost Estimation Card */}
                  {(() => {
                    const costEst = calculateBuiltInCost(selectedFurniture);
                    return (
                      <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-1.5 text-xs text-indigo-950">
                        <div className="flex items-center justify-between font-bold text-indigo-900">
                          <span>Estimasi Biaya Fabrikasi Mebel</span>
                          <span className="font-mono text-sm text-indigo-700">{formatRupiah(costEst.totalEstimatedCost)}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[11px] text-slate-600">
                          <div>Luas Panel: <strong>{costEst.panelAreaM2} m²</strong></div>
                          <div>Multiplek 18mm: <strong>{costEst.plywoodSheets18mm} Lembar</strong></div>
                          <div>Finishing HPL: <strong>{costEst.hplAreaM2} m²</strong></div>
                          <div>Ongkos Tukang: <strong>{formatRupiah(costEst.laborCost)}</strong></div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Save to Custom Catalog Button */}
                  <button
                    onClick={() => {
                      const customName = window.prompt('Masukkan nama template untuk disimpan ke Katalog Saya:', selectedFurniture.name);
                      if (!customName) return;
                      const template: FurnitureTemplate = {
                        type: `custom-${Date.now()}`,
                        name: customName,
                        category: selectedFurniture.category || 'built-in',
                        width: selectedFurniture.width,
                        depth: selectedFurniture.depth,
                        height: selectedFurniture.height || 0.8,
                        defaultRotation: selectedFurniture.rotation || 0,
                        mountType: selectedFurniture.mountType,
                        isBuiltIn: selectedFurniture.mountType && selectedFurniture.mountType !== 'freestanding',
                        defaultDistanceFromFloor: selectedFurniture.distanceFromFloor,
                        defaultRecessDepth: selectedFurniture.recessDepth,
                        defaultInternalConfig: selectedFurniture.internalConfig,
                        description: `Kustom desain ${customName} (${selectedFurniture.width}x${selectedFurniture.depth}m)`,
                        isUserCustom: true,
                      };
                      const updated = saveToCustomCatalog(template);
                      setMyCustomCatalog(updated);
                      setActiveInspectorTab('custom-catalog');
                    }}
                    className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Simpan ke Katalog Saya</span>
                  </button>

                  {/* Actions */}
                  {!isReadOnly && (
                    <div className="flex gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => handleDuplicateFurniture(selectedFurniture)}
                        className="flex-1 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg font-semibold flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Duplikasi</span>
                      </button>
                      <button
                        onClick={() => handleDeleteFurniture(selectedFurniture.id)}
                        className="py-1.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400 space-y-2">
                  <Armchair className="w-8 h-8 mx-auto opacity-40 text-slate-500" />
                  <p className="text-xs">Klik salah satu perabot di denah untuk menggeser, memutar 360°, atau mengubah ukurannya.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: FURNITURE CATALOG */}
          {activeInspectorTab === 'catalog' && (
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4 max-h-[640px] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Plus className="w-4 h-4 text-indigo-600" />
                    <span>Katalog Perabot &amp; Simbol CAD 2D</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">Ikon arsitektural akurat untuk denah profesional &amp; built-in</p>
                </div>
                <span className="text-[11px] bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded-full">
                  {FURNITURE_CATALOG.length} Model
                </span>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari perabot (misal: lemari baju, kasur queen, dapur L, sofa)..."
                  value={furnitureSearchQuery}
                  onChange={e => setFurnitureSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
                {furnitureSearchQuery && (
                  <button
                    onClick={() => setFurnitureSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Category Filter Pills */}
              <div className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
                {[
                  { id: 'all', label: 'Semua' },
                  { id: 'bedroom', label: 'Kamar Tidur' },
                  { id: 'built-in', label: 'Lemari Tanam' },
                  { id: 'kitchen-dining', label: 'Dapur & Makan' },
                  { id: 'living', label: 'Ruang Tamu/TV' },
                  { id: 'bathroom', label: 'Kamar Mandi' },
                  { id: 'laundry', label: 'Area Cuci' },
                  { id: 'outdoor', label: 'Teras & Luar' },
                ].map(cat => {
                  const isActive = furnitureCategoryFilter === cat.id;
                  const count = cat.id === 'all' 
                    ? FURNITURE_CATALOG.length 
                    : FURNITURE_CATALOG.filter(f => f.category === cat.id).length;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setFurnitureCategoryFilter(cat.id as any)}
                      className={`px-2.5 py-1 text-[11px] font-medium rounded-lg whitespace-nowrap cursor-pointer transition-all flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200/70 text-slate-600'
                      }`}
                    >
                      <span>{cat.label}</span>
                      <span className={`text-[10px] px-1 py-0.2 rounded-full ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-500'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Furniture Items List */}
              <div className="space-y-4">
                {(['bedroom', 'built-in', 'kitchen-dining', 'living', 'bathroom', 'laundry', 'outdoor'] as FurnitureCategory[])
                  .filter(cat => furnitureCategoryFilter === 'all' || furnitureCategoryFilter === cat)
                  .map(cat => {
                    const items = FURNITURE_CATALOG.filter(f => {
                      if (f.category !== cat) return false;
                      if (!furnitureSearchQuery.trim()) return true;
                      const q = furnitureSearchQuery.toLowerCase();
                      return (
                        f.name.toLowerCase().includes(q) ||
                        f.type.toLowerCase().includes(q) ||
                        (f.description && f.description.toLowerCase().includes(q))
                      );
                    });

                    if (items.length === 0) return null;

                    const catLabels: Record<FurnitureCategory, string> = {
                      'bedroom': 'Kamar Tidur (Kasur, Wardrobe & Meja)',
                      'built-in': 'Built-In & Lemari Tanam Terintegrasi',
                      'kitchen-dining': 'Dapur & Meja Makan CAD',
                      'living': 'Ruang Tamu, Sofa & Backdrop TV',
                      'bathroom': 'Sanitair & Kamar Mandi',
                      'laundry': 'Area Servis & Mesin Cuci',
                      'outdoor': 'Teras, Kanopi & Taman Depan/Belakang',
                    };

                    return (
                      <div key={cat} className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-1">
                          <span>{catLabels[cat]}</span>
                          <span className="text-[10px] text-slate-400 font-normal">{items.length} item</span>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                          {items.map(item => (
                            <div
                              key={item.type}
                              onClick={() => !isReadOnly && handleAddFurnitureFromCatalog(item)}
                              className={`group p-2.5 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/30 transition-all flex items-center gap-3 text-xs ${
                                isReadOnly ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-xs'
                              }`}
                            >
                              {/* 2D CAD High-Fidelity Thumbnail */}
                              <FurnitureCadThumbnail 
                                template={item} 
                                className="w-16 h-16 shrink-0 bg-slate-50 border border-slate-200/90 rounded-lg p-1 group-hover:bg-white group-hover:border-indigo-300 transition-all shadow-2xs" 
                              />

                              {/* Details */}
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-slate-900 flex items-center gap-1.5 flex-wrap">
                                  <span>{item.name}</span>
                                  {item.isBuiltIn && (
                                    <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                                      Built-In Tanam
                                    </span>
                                  )}
                                  {item.mountType && item.mountType !== 'freestanding' && (
                                    <span className="text-[9px] bg-indigo-100 text-indigo-800 font-medium px-1.5 py-0.5 rounded">
                                      {item.mountType === 'wall-mounted' ? 'Gantung Dinding' : item.mountType === 'recessed' ? 'Ceruk Dinding' : 'Terintegrasi'}
                                    </span>
                                  )}
                                </div>
                                <div className="text-slate-500 text-[11px] font-mono mt-0.5">
                                  {(item.width * 100).toFixed(0)} × {(item.depth * 100).toFixed(0)} cm 
                                  <span className="text-slate-400 font-sans ml-1">
                                    • Tinggi {(item.height * 100).toFixed(0)} cm
                                  </span>
                                </div>
                                {item.description && (
                                  <p className="text-[10.5px] text-slate-500 line-clamp-1 mt-0.5">
                                    {item.description}
                                  </p>
                                )}
                              </div>

                              {/* Quick Add Button */}
                              <button
                                type="button"
                                disabled={isReadOnly}
                                className="shrink-0 px-2.5 py-1.5 bg-indigo-50 group-hover:bg-indigo-600 text-indigo-700 group-hover:text-white rounded-lg font-semibold text-xs transition-all flex items-center gap-1"
                                title="Tambahkan ke Denah"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Tambah</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}

                {/* Empty Search Result State */}
                {FURNITURE_CATALOG.filter(f => {
                  if (furnitureCategoryFilter !== 'all' && f.category !== furnitureCategoryFilter) return false;
                  if (!furnitureSearchQuery.trim()) return true;
                  const q = furnitureSearchQuery.toLowerCase();
                  return (
                    f.name.toLowerCase().includes(q) ||
                    f.type.toLowerCase().includes(q) ||
                    (f.description && f.description.toLowerCase().includes(q))
                  );
                }).length === 0 && (
                  <div className="text-center py-10 text-slate-400 space-y-2">
                    <Search className="w-8 h-8 mx-auto opacity-40 text-slate-400" />
                    <p className="text-xs font-medium text-slate-600">Tidak ada perabot yang cocok dengan pencarian "{furnitureSearchQuery}"</p>
                    <p className="text-[11px] text-slate-400">Coba kata kunci lain atau pilih kategori "Semua".</p>
                    <button
                      onClick={() => { setFurnitureSearchQuery(''); setFurnitureCategoryFilter('all'); }}
                      className="mt-2 text-xs text-indigo-600 hover:text-indigo-800 underline font-medium cursor-pointer"
                    >
                      Reset Filter &amp; Pencarian
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: MY CUSTOM CATALOG */}
          {activeInspectorTab === 'custom-catalog' && (
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4 max-h-[640px] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>Katalog Kustom Saya</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">Template furnitur kustom yang disimpan dengan simbol 2D</p>
                </div>
                <span className="text-xs text-slate-400">{myCustomCatalog.length} Tersimpan</span>
              </div>

              {myCustomCatalog.length === 0 ? (
                <div className="text-center py-8 text-slate-400 space-y-2">
                  <Sparkles className="w-8 h-8 mx-auto opacity-40 text-emerald-500" />
                  <p className="text-xs">Belum ada template kustom. Pilih furnitur apa saja lalu klik "Simpan ke Katalog Saya" untuk menyimpan template reusable!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myCustomCatalog.map(template => (
                    <div key={template.type} className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2.5 text-xs">
                      <div className="flex items-center gap-3">
                        <FurnitureCadThumbnail 
                          template={template} 
                          className="w-16 h-16 shrink-0 bg-white border border-slate-200 rounded-lg p-1 shadow-2xs" 
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1">
                            <strong className="text-slate-900 block font-bold truncate">{template.name}</strong>
                            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 shrink-0">
                              Kustom
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 font-mono block mt-0.5">
                            {(template.width * 100).toFixed(0)} × {(template.depth * 100).toFixed(0)} cm • {template.mountType || 'Freestanding'}
                          </span>
                          {template.description && (
                            <p className="text-[10.5px] text-slate-500 line-clamp-1 mt-0.5">
                              {template.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-1.5 pt-1">
                        <button
                          disabled={isReadOnly}
                          onClick={() => handleAddFurnitureFromCatalog(template)}
                          className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold cursor-pointer text-center flex items-center justify-center gap-1 shadow-xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Taruh di Ruang</span>
                        </button>
                        <button
                          onClick={() => {
                            const dup = duplicateCustomTemplate(template.type);
                            if (dup) setMyCustomCatalog(getMyCustomCatalog());
                          }}
                          className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg font-semibold cursor-pointer"
                          title="Duplikasi Template"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Hapus template ${template.name} dari katalog?`)) {
                              const filtered = deleteFromCustomCatalog(template.type);
                              setMyCustomCatalog(filtered);
                            }
                          }}
                          className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-lg font-semibold cursor-pointer"
                          title="Hapus Template"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ADD ROOM MODAL */}
      {isAddRoomModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Tambah Ruangan Baru</h3>
              <button onClick={() => setIsAddRoomModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-600 block mb-1 font-medium">Nama Ruangan</label>
                <input
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 block mb-1 font-medium">Lebar (Meter)</label>
                  <input
                    type="number"
                    step="0.25"
                    min="1.0"
                    max="6.0"
                    value={newRoomWidth}
                    onChange={(e) => setNewRoomWidth(parseFloat(e.target.value) || 2.0)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono font-medium"
                  />
                </div>
                <div>
                  <label className="text-slate-600 block mb-1 font-medium">Kedalaman (Meter)</label>
                  <input
                    type="number"
                    step="0.25"
                    min="1.0"
                    max="6.0"
                    value={newRoomDepth}
                    onChange={(e) => setNewRoomDepth(parseFloat(e.target.value) || 2.0)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono font-medium"
                  />
                </div>
              </div>

              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-900">
                Ruangan akan ditambahkan ke <strong>{selectedFloor === 'GF' ? 'Lantai 1' : 'Lantai 2'}</strong>.
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsAddRoomModalOpen(false)}
                className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleAddNewRoom}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Tambah ke Denah
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SAVE ALTERNATIVE MODAL */}
      {saveAltModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Simpan Sebagai Alternatif Baru</h3>
              <button onClick={() => setSaveAltModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-600 block mb-1 font-medium">Nama Alternatif</label>
                <input
                  type="text"
                  placeholder="Misal: Alternatif C - Ruang Kerja Tambahan"
                  value={newAltName}
                  onChange={(e) => setNewAltName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium"
                />
              </div>
              <p className="text-slate-500">
                Denah kerja saat ini akan disimpan sebagai snapshot independen dan dapat dibandingkan secara berdampingan pada tab "Komparasi Desain".
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setSaveAltModalOpen(false)}
                className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleSaveAsAlternative}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Simpan Alternatif
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ROOM DELETION MODAL (Part 3) */}
      <RoomDeletionModal
        isOpen={Boolean(roomToDelete)}
        room={roomToDelete}
        furnitureInRoom={workingDesign.furniture.filter(f => f.roomId === roomToDelete?.id)}
        doorsInRoom={(workingDesign.doors || []).filter(d => d.roomId === roomToDelete?.id)}
        onClose={() => setRoomToDelete(null)}
        onConfirmDelete={handleConfirmDeleteRoom}
      />

      {/* FLOATING CONTEXT MENU (Part 2.3) */}
      <ContextMenu
        isOpen={contextMenu.isOpen}
        x={contextMenu.x}
        y={contextMenu.y}
        target={contextMenu.target}
        onClose={() => setContextMenu(prev => ({ ...prev, isOpen: false }))}
        onAction={handleContextMenuAction}
      />

      {/* USABILITY & ERGONOMICS SIMULATION MODAL (Part 7) */}
      <UsabilityModal
        isOpen={isUsabilityModalOpen}
        onClose={() => setIsUsabilityModalOpen(false)}
        report={runUsabilitySimulation(currentDesign, humanAvatar)}
        avatar={humanAvatar}
        onUpdateAvatar={(updates) => setHumanAvatar(prev => ({ ...prev, ...updates }))}
      />

      {/* SWAP STAIRCASE & BATHROOM COMPARISON MODAL (Part 4) */}
      <SwapComparisonModal
        isOpen={isSwapModalOpen}
        onClose={() => setIsSwapModalOpen(false)}
        onApplyOptionBToWorking={(newDesign) => {
          pushUndoState(workingDesign);
          setWorkingDesign(newDesign);
          setActiveDesignMode('working');
          showNotification('Opsi B (Tukar Tangga & KM Tamu) berhasil diterapkan ke Denah Kerja.');
        }}
      />

      {/* FAMILY FEEDBACK & MOM'S NOTES MODAL */}
      <FamilyFeedbackModal
        isOpen={isFamilyFeedbackModalOpen}
        onClose={() => setIsFamilyFeedbackModalOpen(false)}
        workingDesign={currentDesign}
        setWorkingDesign={setWorkingDesign}
        allRooms={[...currentDesign.groundFloorRooms, ...currentDesign.secondFloorRooms]}
        lintEvaluations={scoreBreakdown.evaluations}
        defaultTab={familyFeedbackTab}
        onStartPinningMode={() => {
          setIsPinningFamilyNoteMode(true);
          showNotification('Mode Tempel Catatan Ibu Aktif: Silakan klik salah satu ruangan di denah.');
        }}
      />

      {/* FAMILY SHARE & BACKUP MODAL (Feedback Items 3 & 6) */}
      {isFamilyShareModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 text-slate-100 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Bagikan ke Ibu &amp; Cadangan Desain</h3>
                  <p className="text-xs text-slate-400">Sinkronisasi link keluarga dan pencegahan hilang data</p>
                </div>
              </div>
              <button
                onClick={() => setIsFamilyShareModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Notification alert */}
            {shareCopyFeedback && (
              <div className="p-3 bg-emerald-950/90 border border-emerald-500/80 text-emerald-200 text-xs rounded-xl flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{shareCopyFeedback}</span>
              </div>
            )}

            {/* Section 1: Link Sharing with Mom */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                  <span>Kirim Tautan Langsung ke HP Ibu</span>
                </span>
                <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800">
                  Sinkronisasi Otomatis
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Tautan ini memuat snapshot rancangan denah rumah terbaru (posisi kamar, bukaan kaca, perabot, dan catatan). Ibu bisa langsung membuka dan memberi masukan dari HP tanpa perlu install aplikasi apapun.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <button
                  onClick={handleCopyWhatsAppMessage}
                  className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Salin Pesan WhatsApp Ibu</span>
                </button>
                <button
                  onClick={handleCopyCleanShareLink}
                  className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Copy className="w-4 h-4 text-slate-400" />
                  <span>Salin URL Tautan Saja</span>
                </button>
              </div>
            </div>

            {/* Section 2: JSON Backup & Restore (Anti-Hilang Data) */}
            <div className="pt-3 border-t border-slate-800 space-y-3">
              <div>
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Download className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Cadangan Berkas Lokal (Anti-Hilang Data)</span>
                </span>
                <p className="text-[11px] text-slate-400 mt-1">
                  Desain Anda telah <strong>otomatis tersimpan di memori browser ini (localStorage)</strong>. Anda juga bisa mengunduh berkas fisik JSON sebagai arsip cadangan aman di komputer/HP Anda.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={handleExportBackup}
                  className="flex-1 py-2 px-3 bg-indigo-600/30 hover:bg-indigo-600/40 text-indigo-200 border border-indigo-500/50 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Ekspor Cadangan (JSON)</span>
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Upload className="w-3.5 h-3.5 text-slate-400" />
                  <span>Impor Cadangan (JSON)</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImportBackupFile}
                  accept=".json"
                  className="hidden"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setIsFamilyShareModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Selesai / Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
