/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { 
  Box, 
  RotateCw, 
  Sun, 
  Moon, 
  ChevronDown, 
  ChevronUp, 
  Footprints, 
  Compass,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Maximize2,
  X,
  Layers,
  Sparkles,
  Info,
  ShieldCheck,
  DoorOpen,
  DoorClosed,
  Ruler,
  Crosshair,
  MousePointer,
  Flame,
  Eye,
  Navigation,
  Move
} from 'lucide-react';
import { HouseDesignState, FurnitureItem, calculateBuiltInCost, formatRupiah } from '../utils/houseDesignStore';
import {
  RoomData,
  resolveGlassWallDimensions,
  ResolvedGlassWallDimensions,
  resolveOpenWallInterval,
  WallOpeningType,
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
  RoofConfig,
} from '../utils/architectureData';
import { generateStairSteps, DEFAULT_STAIRCASE_CONFIG, DoorData, WindowData, StaircaseConfig } from '../utils/doorsAndStairs';

export interface ThreeDViewProps {
  design?: HouseDesignState;
  onUpdateDesign?: (updater: (prev: HouseDesignState) => HouseDesignState) => void;
}

export type ViewMode3D = 'dollhouse' | 'exterior' | 'interior-room' | 'walkthrough' | 'top-down' | 'isometric';

export interface SpawnPoint {
  id: string;
  name: string;
  floor: 'GF' | '2F';
  x: number;
  y: number;
  z: number;
  yaw: number;
}

export const SPAWN_POINTS: SpawnPoint[] = [
  { id: 'pintu-masuk', name: 'Pintu Masuk Depan', floor: 'GF', x: 6.5, y: 1.6, z: 0.8, yaw: 0 },
  { id: 'ruang-tamu', name: 'Ruang Tamu', floor: 'GF', x: 6.5, y: 1.6, z: 2.0, yaw: Math.PI / 2 },
  { id: 'ruang-keluarga', name: 'Ruang Keluarga (RK)', floor: 'GF', x: 4.5, y: 1.6, z: 4.5, yaw: 0 },
  { id: 'kt1', name: 'KT 1 (Kamar Utama)', floor: 'GF', x: 1.5, y: 1.6, z: 3.5, yaw: -Math.PI / 2 },
  { id: 'kt2', name: 'KT 2 (Kamar Belakang Kiri)', floor: 'GF', x: 1.5, y: 1.6, z: 7.0, yaw: -Math.PI / 2 },
  { id: 'kt3', name: 'KT 3 (Kamar Belakang Kanan)', floor: 'GF', x: 7.2, y: 1.6, z: 7.0, yaw: 0 },
  { id: 'dapur', name: 'Dapur & Ruang Makan', floor: 'GF', x: 4.5, y: 1.6, z: 9.8, yaw: 0 },
  { id: 'pintu-belakang', name: 'Pintu Servis Belakang', floor: 'GF', x: 7.8, y: 1.6, z: 10.4, yaw: Math.PI },
  { id: 'tangga-gf', name: 'Kaki Tangga Lantai 1', floor: 'GF', x: 7.5, y: 1.6, z: 5.4, yaw: Math.PI },
  { id: 'tangga-2f', name: 'Bordes Tangga Lantai 2', floor: '2F', x: 7.5, y: 5.2, z: 3.4, yaw: 0 },
  { id: 'koridor-2f', name: 'Koridor Galeri 2F', floor: '2F', x: 6.5, y: 5.2, z: 3.0, yaw: 0 },
  { id: 'kt4', name: 'KT 4 (Lantai 2 Kanan)', floor: '2F', x: 7.8, y: 5.2, z: 3.5, yaw: -Math.PI / 2 },
  { id: 'kt5', name: 'KT 5 (Lantai 2 Belakang)', floor: '2F', x: 7.5, y: 5.2, z: 9.0, yaw: -Math.PI / 2 },
  { id: 'kt6', name: 'KT 6 (2F Atas Carport)', floor: '2F', x: 1.5, y: 5.2, z: 1.2, yaw: 0 },
  { id: 'balkon', name: 'Balkon Merokok Depan', floor: '2F', x: 7.5, y: 5.2, z: 1.0, yaw: 0 },
];

export const ThreeDView: React.FC<ThreeDViewProps> = ({ design, onUpdateDesign }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const viewportContainerRef = useRef<HTMLDivElement>(null);

  // Viewing Modes
  const [viewMode, setViewMode] = useState<ViewMode3D>('dollhouse');
  const [selectedFloor, setSelectedFloor] = useState<'all' | 'GF' | '2F'>('all');
  const [lightingMode, setLightingMode] = useState<'day' | 'night'>('day');
  const [isTransparentWalls, setIsTransparentWalls] = useState<boolean>(false);
  const [isHudCollapsed, setIsHudCollapsed] = useState<boolean>(false);
  const [showRoof3D, setShowRoof3D] = useState<boolean>(false);
  const [isMaterialDrawerOpen, setIsMaterialDrawerOpen] = useState<boolean>(false);
  const [targetRoomId3D, setTargetRoomId3D] = useState<string>('all');

  // Inspector & selection states
  const [inspectedFurniture, setInspectedFurniture] = useState<FurnitureItem | null>(null);
  const [doorNotice, setDoorNotice] = useState<string | null>(null);
  const [localDoors, setLocalDoors] = useState<DoorData[]>([]);

  // Keep localDoors synchronized with design.doors
  useEffect(() => {
    if (design?.doors) {
      setLocalDoors(JSON.parse(JSON.stringify(design.doors)));
    }
  }, [design?.doors]);

  // Visibility Toggles
  const [visibilities, setVisibilities] = useState({
    exteriorWalls: true,
    interiorWalls: true,
    slabs: true,
    furniture: true,
    staircase: true,
    prohibitedZone: true,
    windows: true,
    doors: true,
  });

  // First-Person Walkthrough state & Game Controls
  const playerPosRef = useRef<THREE.Vector3>(new THREE.Vector3(6.5, 1.6, 0.8));
  const playerYawRef = useRef<number>(0);
  const playerPitchRef = useRef<number>(0);
  const velocityRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const bobTimerRef = useRef<number>(0);
  const keysPressedRef = useRef<{ [key: string]: boolean }>({});
  const localDoorsRef = useRef<DoorData[]>([]);
  localDoorsRef.current = localDoors;

  const [walkFloorState, setWalkFloorState] = useState<'GF' | '2F'>('GF');
  const [miniMapPos, setMiniMapPos] = useState<{ x: number; z: number; yaw: number }>({ x: 6.5, z: 0.8, yaw: 0 });
  const [isPointerLocked, setIsPointerLocked] = useState<boolean>(false);
  const [isSprinting, setIsSprinting] = useState<boolean>(false);
  const [isCrouching, setIsCrouching] = useState<boolean>(false);
  const isSprintingRef = useRef<boolean>(false);
  const isCrouchingRef = useRef<boolean>(false);
  isSprintingRef.current = isSprinting;
  isCrouchingRef.current = isCrouching;

  const [crosshairTarget, setCrosshairTarget] = useState<{
    type: 'door' | 'furniture';
    id: string;
    name: string;
    isOpen?: boolean;
    item?: FurnitureItem;
    distance: number;
  } | null>(null);
  const crosshairTargetRef = useRef<typeof crosshairTarget>(null);
  crosshairTargetRef.current = crosshairTarget;

  // Three.js internal references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const groundGroupRef = useRef<THREE.Group | null>(null);
  const upperGroupRef = useRef<THREE.Group | null>(null);
  const staircaseGroupRef = useRef<THREE.Group | null>(null);
  const furnitureGroupRef = useRef<THREE.Group | null>(null);
  const interactableGroupRef = useRef<THREE.Group | null>(null);

  // Orbit controls state
  const isMouseDownRef = useRef<boolean>(false);
  const isMiddlePanningRef = useRef<boolean>(false);
  const mousePrevRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const orbitAnglesRef = useRef<{ theta: number; phi: number; radius: number }>({
    theta: Math.PI / 4,
    phi: Math.PI / 3.2,
    radius: 22,
  });
  const orbitTargetRef = useRef<THREE.Vector3>(new THREE.Vector3(4.5, 2.5, 5.5));

  // Initialize Three.js Scene
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight || 620;

    // Detect software WebGL
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 1. Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0f172a); // Deep architect slate

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    cameraRef.current = camera;
    camera.position.set(16, 18, 22);
    camera.lookAt(orbitTargetRef.current);

    // 3. WebGLRenderer
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Lighting Rig
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    ambientLight.name = 'ambientLight';
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffaed, 1.4);
    sunLight.name = 'sunLight';
    sunLight.position.set(22, 32, 18);
    sunLight.castShadow = !isSoftwareGl;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0x93c5fd, 0.5);
    fillLight.name = 'fillLight';
    fillLight.position.set(-18, 14, -12);
    scene.add(fillLight);

    // Warm Interior Point Lights
    const interiorWarmLight1 = new THREE.PointLight(0xffb74d, 0, 10);
    interiorWarmLight1.name = 'interiorLight1';
    interiorWarmLight1.position.set(4.5, 2.5, 5.0);
    scene.add(interiorWarmLight1);

    const interiorWarmLight2 = new THREE.PointLight(0xffb74d, 0, 10);
    interiorWarmLight2.name = 'interiorLight2';
    interiorWarmLight2.position.set(6.5, 5.0, 4.0);
    scene.add(interiorWarmLight2);

    // 5. Site Ground Plane (9m x 11m site marked on landscape)
    const siteGroundGeo = new THREE.PlaneGeometry(9.0, 11.0);
    const siteGroundMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.85 });
    const siteGround = new THREE.Mesh(siteGroundGeo, siteGroundMat);
    siteGround.rotation.x = -Math.PI / 2;
    siteGround.position.set(4.5, 0.01, 5.5);
    siteGround.receiveShadow = true;
    scene.add(siteGround);

    // Site border lines
    const borderGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(9.0, 0.02, 11.0));
    const borderMat = new THREE.LineBasicMaterial({ color: 0x6366f1, linewidth: 2 });
    const borderLines = new THREE.LineSegments(borderGeo, borderMat);
    borderLines.position.set(4.5, 0.02, 5.5);
    scene.add(borderLines);

    // Road (Y = 0 is Front / Street)
    const roadGeo = new THREE.PlaneGeometry(24, 6);
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.95 });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.set(4.5, 0.005, -3.0);
    scene.add(road);

    // 6. Architectural Groups
    const groundGroup = new THREE.Group();
    const upperGroup = new THREE.Group();
    const staircaseGroup = new THREE.Group();
    const furnitureGroup = new THREE.Group();
    const interactableGroup = new THREE.Group();

    groundGroupRef.current = groundGroup;
    upperGroupRef.current = upperGroup;
    staircaseGroupRef.current = staircaseGroup;
    furnitureGroupRef.current = furnitureGroup;
    interactableGroupRef.current = interactableGroup;

    scene.add(groundGroup);
    scene.add(upperGroup);
    scene.add(staircaseGroup);
    scene.add(furnitureGroup);
    scene.add(interactableGroup);

    // 7. Animation & Event Loop
    let animationFrameId: number;
    let lastMiniMapUpdate = 0;

    const tick = (time: number) => {
      // First-person walkthrough camera updates
      if (viewMode === 'walkthrough') {
        const speed = 0.11;
        const yaw = playerYawRef.current;
        const pitch = playerPitchRef.current;
        const cosPitch = Math.cos(pitch);
        const sinPitch = Math.sin(pitch);

        const forward = new THREE.Vector3(
          -Math.sin(yaw) * cosPitch,
          sinPitch,
          -Math.cos(yaw) * cosPitch
        );
        const horizontalForward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
        const horizontalRight = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
        const moveDelta = new THREE.Vector3(0, 0, 0);

        if (keysPressedRef.current['w'] || keysPressedRef.current['W'] || keysPressedRef.current['ArrowUp']) {
          moveDelta.addScaledVector(horizontalForward, speed);
        }
        if (keysPressedRef.current['s'] || keysPressedRef.current['S'] || keysPressedRef.current['ArrowDown']) {
          moveDelta.addScaledVector(horizontalForward, -speed);
        }
        if (keysPressedRef.current['a'] || keysPressedRef.current['A'] || keysPressedRef.current['ArrowLeft']) {
          moveDelta.addScaledVector(horizontalRight, -speed);
        }
        if (keysPressedRef.current['d'] || keysPressedRef.current['D'] || keysPressedRef.current['ArrowRight']) {
          moveDelta.addScaledVector(horizontalRight, speed);
        }

        // Q / E to rotate head smoothly
        if (keysPressedRef.current['q'] || keysPressedRef.current['Q']) {
          playerYawRef.current += 0.04;
        }
        if (keysPressedRef.current['e'] || keysPressedRef.current['E']) {
          playerYawRef.current -= 0.04;
        }

        if (moveDelta.lengthSq() > 0) {
          const candidateX = Math.max(0.4, Math.min(8.6, playerPosRef.current.x + moveDelta.x));
          const candidateZ = Math.max(0.4, Math.min(10.6, playerPosRef.current.z + moveDelta.z));

          playerPosRef.current.x = candidateX;
          playerPosRef.current.z = candidateZ;

          // Staircase smooth ascension check
          const sCfg = design?.staircaseConfig || DEFAULT_STAIRCASE_CONFIG;
          if (candidateX >= sCfg.x - 0.3 && candidateX <= sCfg.x + sCfg.width + 0.3 &&
              candidateZ >= sCfg.y - 0.3 && candidateZ <= sCfg.y + sCfg.depth + 0.3) {
            const progress = Math.max(0, Math.min(1, (sCfg.y + sCfg.depth - candidateZ) / (sCfg.depth || 1)));
            playerPosRef.current.y = 1.6 + progress * 3.6;
            setWalkFloorState(playerPosRef.current.y > 3.2 ? '2F' : 'GF');
          }
        }

        camera.position.copy(playerPosRef.current);
        const lookTarget = playerPosRef.current.clone().add(forward);
        camera.lookAt(lookTarget);

        // Throttle mini-map update
        if (time - lastMiniMapUpdate > 60) {
          lastMiniMapUpdate = time;
          setMiniMapPos({
            x: playerPosRef.current.x,
            z: playerPosRef.current.z,
            yaw: playerYawRef.current,
          });
        }
      } else {
        // Orbit camera positioning
        const { theta, phi, radius } = orbitAnglesRef.current;
        const target = orbitTargetRef.current;
        camera.position.x = target.x + radius * Math.sin(phi) * Math.sin(theta);
        camera.position.y = target.y + radius * Math.cos(phi);
        camera.position.z = target.z + radius * Math.sin(phi) * Math.cos(theta);
        camera.lookAt(target);
      }

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);

    // Resize Handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight || 620;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // NATIVE NON-PASSIVE WHEEL LISTENER (Feedback 1: Completely stops page from scrolling when zooming 3D viewport)
    const handleNative3DWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (viewMode === 'walkthrough') return;
      orbitAnglesRef.current.radius = Math.max(5, Math.min(45, orbitAnglesRef.current.radius + e.deltaY * 0.02));
    };

    const containerEl = viewportContainerRef.current || container;
    containerEl.addEventListener('wheel', handleNative3DWheel, { passive: false });

    // Keyboard handlers for walkthrough
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setViewMode('dollhouse');
        return;
      }
      keysPressedRef.current[e.key] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressedRef.current[e.key] = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      containerEl.removeEventListener('wheel', handleNative3DWheel);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      renderer.dispose();
    };
  }, [design?.staircaseConfig, viewMode]);

  const handleTeleport = (spawnId: string) => {
    const pt = SPAWN_POINTS.find(p => p.id === spawnId);
    if (!pt) return;
    playerPosRef.current.set(pt.x, pt.y, pt.z);
    playerYawRef.current = pt.yaw;
    playerPitchRef.current = 0;
    setWalkFloorState(pt.floor);
    if (cameraRef.current) {
      cameraRef.current.position.copy(playerPosRef.current);
      const forward = new THREE.Vector3(-Math.sin(pt.yaw), 0, -Math.cos(pt.yaw));
      cameraRef.current.lookAt(playerPosRef.current.clone().add(forward));
    }
    setMiniMapPos({ x: pt.x, z: pt.z, yaw: pt.yaw });
  };

  // Switch walkthrough floor directly
  const handleToggleWalkFloor = (floor: 'GF' | '2F') => {
    setWalkFloorState(floor);
    if (floor === '2F') {
      playerPosRef.current.set(6.5, 5.2, 3.0);
      playerYawRef.current = 0;
    } else {
      playerPosRef.current.set(4.5, 1.6, 4.5);
      playerYawRef.current = 0;
    }
  };

  // Interactive toggle door open/close
  const handleToggleDoor = useCallback((doorId: string) => {
    setLocalDoors(prev => prev.map(d => {
      if (d.id === doorId) {
        const nextState = !d.isOpen;
        setDoorNotice(`Pintu ${d.name} sekarang: ${nextState ? 'Terbuka (Open 90°)' : 'Tertutup'}`);
        setTimeout(() => setDoorNotice(null), 3000);
        return { ...d, isOpen: nextState, swingAngle: nextState ? 90 : 0 };
      }
      return d;
    }));
  }, []);

  // BUILD 3D ARCHITECTURAL MODELS (Walls with actual openings, custom railing, doors, windows, stairs, furniture)
  useEffect(() => {
    if (!sceneRef.current || !groundGroupRef.current || !upperGroupRef.current || !furnitureGroupRef.current || !interactableGroupRef.current) return;

    const groundGroup = groundGroupRef.current;
    const upperGroup = upperGroupRef.current;
    const furnitureGroup = furnitureGroupRef.current;
    const interactableGroup = interactableGroupRef.current;

    groundGroup.clear();
    upperGroup.clear();
    furnitureGroup.clear();
    interactableGroup.clear();

    const gfRooms = design?.groundFloorRooms || [];
    const upperRooms = design?.secondFloorRooms || [];
    const furnitureList = design?.furniture || [];
    const windowsList = design?.windows || [];
    const doorsList = localDoors;

    // Materials Palette
    const opacity = isTransparentWalls ? 0.35 : 0.95;
    const transparent = isTransparentWalls;

    const existingWallMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.7, transparent, opacity });
    const newWallMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5, transparent, opacity });
    const bathroomWallMat = new THREE.MeshStandardMaterial({ color: 0x0891b2, roughness: 0.4, transparent, opacity });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.35, roughness: 0.1 });
    const slidingGlassMat = new THREE.MeshStandardMaterial({
      color: 0xbae6fd,
      transparent: true,
      opacity: 0.28,
      roughness: 0.08,
      metalness: 0.15,
      depthWrite: false,
    });
    const blackMullionMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.25,
      metalness: 0.75,
    });
    const sheerCurtainMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      transparent: true,
      opacity: 0.65,
      roughness: 0.85,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const blackoutCurtainMat = new THREE.MeshStandardMaterial({
      color: 0x581c87,
      roughness: 0.88,
      side: THREE.DoubleSide,
    });
    const floorSlabMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 });
    const gardenFloorMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.9 });
    const woodDoorMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.4 });
    const metalRailingMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.3 });
    const rosterMat = new THREE.MeshStandardMaterial({ color: 0xc2410c, roughness: 0.9 });

    // Helper: Build a safety railing (0.9m high balustrade)
    const createRailing = (x1: number, z1: number, x2: number, z2: number, baseY: number): THREE.Group => {
      const g = new THREE.Group();
      const length = Math.hypot(x2 - x1, z2 - z1);
      const angle = Math.atan2(z2 - z1, x2 - x1);

      // Top handrail
      const topRailGeo = new THREE.BoxGeometry(length, 0.05, 0.05);
      const topRail = new THREE.Mesh(topRailGeo, metalRailingMat);
      topRail.position.set(length / 2, 0.9, 0);
      g.add(topRail);

      // Bottom bar
      const botRailGeo = new THREE.BoxGeometry(length, 0.03, 0.03);
      const botRail = new THREE.Mesh(botRailGeo, metalRailingMat);
      botRail.position.set(length / 2, 0.1, 0);
      g.add(botRail);

      // Glass partition or baluster posts
      const panelGeo = new THREE.BoxGeometry(length - 0.05, 0.75, 0.015);
      const panel = new THREE.Mesh(panelGeo, glassMat);
      panel.position.set(length / 2, 0.5, 0);
      g.add(panel);

      // Vertical posts every ~0.8m
      const postCount = Math.max(2, Math.ceil(length / 0.8));
      for (let i = 0; i <= postCount; i++) {
        const postGeo = new THREE.BoxGeometry(0.04, 0.9, 0.04);
        const post = new THREE.Mesh(postGeo, metalRailingMat);
        post.position.set((i / postCount) * length, 0.45, 0);
        g.add(post);
      }

      g.position.set(x1, baseY, z1);
      g.rotation.y = -angle;
      return g;
    };

    // Helper: Build a 3D Skylight Canopy (Atap Kaca Void & Taman Belakang)
    const createSkylightCanopy = (room: RoomData, wallH: number, baseY: number): THREE.Group => {
      const g = new THREE.Group();
      const w = room.width;
      const d = room.depth;
      const spacing = room.skylight?.gridSpacing || 0.6;
      const tint = room.skylight?.glassTint || 'clear';

      const canopyGlassMat = new THREE.MeshStandardMaterial({
        color: tint === 'solar' ? 0x0284c7 : tint === 'frosted' ? 0xe2e8f0 : 0xbae6fd,
        transparent: true,
        opacity: tint === 'frosted' ? 0.52 : 0.32,
        roughness: tint === 'frosted' ? 0.45 : 0.08,
        metalness: 0.15,
        depthWrite: false,
      });

      // Perimeter black structural hollow steel frame
      const frameH = 0.06;
      const frameT = 0.05;
      const northBeam = new THREE.Mesh(new THREE.BoxGeometry(w, frameH, frameT), blackMullionMat);
      northBeam.position.set(w / 2, 0, frameT / 2);
      g.add(northBeam);

      const southBeam = new THREE.Mesh(new THREE.BoxGeometry(w, frameH, frameT), blackMullionMat);
      southBeam.position.set(w / 2, 0, d - frameT / 2);
      g.add(southBeam);

      const westBeam = new THREE.Mesh(new THREE.BoxGeometry(frameT, frameH, d), blackMullionMat);
      westBeam.position.set(frameT / 2, 0, d / 2);
      g.add(westBeam);

      const eastBeam = new THREE.Mesh(new THREE.BoxGeometry(frameT, frameH, d), blackMullionMat);
      eastBeam.position.set(w - frameT / 2, 0, d / 2);
      g.add(eastBeam);

      // Rafters along X
      const cols = Math.max(2, Math.round(w / spacing));
      for (let i = 1; i < cols; i++) {
        const rx = (i / cols) * w;
        const rafter = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.045, d - 0.04), blackMullionMat);
        rafter.position.set(rx, 0, d / 2);
        g.add(rafter);
      }

      // Rafters along Z
      const rows = Math.max(2, Math.round(d / spacing));
      for (let j = 1; j < rows; j++) {
        const rz = (j / rows) * d;
        const purlin = new THREE.Mesh(new THREE.BoxGeometry(w - 0.04, 0.04, 0.035), blackMullionMat);
        purlin.position.set(w / 2, 0, rz);
        g.add(purlin);
      }

      // Tempered glass sheet on top
      const glassSheet = new THREE.Mesh(new THREE.BoxGeometry(w - 0.04, 0.018, d - 0.04), canopyGlassMat);
      glassSheet.position.set(w / 2, 0.025, d / 2);
      g.add(glassSheet);

      g.position.set(room.x, baseY + wallH, room.y);
      return g;
    };

    // Helper: Build a Wall side with real cutouts for Sliding Glass Walls, Doors, Windows, and Neighbor Shared Openings
    const createWallWithOpenings = (
      room: RoomData,
      wallSide: 'north' | 'south' | 'east' | 'west',
      x1: number,
      z1: number,
      x2: number,
      z2: number,
      wallH: number,
      wallT: number,
      baseY: number,
      wallMat: THREE.Material,
      roomId: string,
      floor: 'GF' | '2F'
    ): THREE.Group => {
      const g = new THREE.Group();
      const length = Math.hypot(x2 - x1, z2 - z1);
      const angle = Math.atan2(z2 - z1, x2 - x1);
      const isHoriz = wallSide === 'north' || wallSide === 'south';
      const wallMin = isHoriz ? Math.min(x1, x2) : Math.min(z1, z2);
      const wallCoord = isHoriz ? z1 : x1;
      const allFloorRooms = floor === 'GF' ? gfRooms : upperRooms;
      const interiorSign = (wallSide === 'north' || wallSide === 'east') ? 1 : -1;
      // Offset each room's wall slightly toward its own interior so adjacent rooms' walls are physically independent and never Z-fight
      const wallZOffset = interiorSign * 0.022;
      const effWallT = Math.max(0.08, wallT - 0.035);

      interface Cutout {
        start: number;
        end: number;
        type: 'glass-wall' | 'door' | 'window' | 'open-span';
        isOwner: boolean;
        glassDim?: ResolvedGlassWallDimensions;
        doorData?: DoorData;
        windowData?: WindowData;
      }

      const cutouts: Cutout[] = [];

      const overlapsExistingCutout = (s: number, e: number) =>
        cutouts.some(c => Math.max(c.start, s) < Math.min(c.end, e) - 0.02);

      const oppositeSide: 'north' | 'south' | 'east' | 'west' =
        wallSide === 'north' ? 'south' :
        wallSide === 'south' ? 'north' :
        wallSide === 'west' ? 'east' : 'west';

      // 0. Own Open or Half-Open Wall Span (100% Mandiri / Putus Relasi dari Dinding Ruangan Tetangga — Berlaku untuk Semua Ruangan)
      const ownOpenType: WallOpeningType = room.openWalls?.[wallSide] || 'solid';
      const activeGlassOnThisWall = Boolean(room.glassWall?.hasGlassWall && (room.glassWall.wallSide || 'north') === wallSide);
      if (!activeGlassOnThisWall && (ownOpenType === 'open' || ownOpenType === 'open-half-start' || ownOpenType === 'open-half-end')) {
        const reqOpen = resolveOpenWallInterval(ownOpenType, length);
        if (reqOpen && reqOpen.end > reqOpen.start + 0.08 && !overlapsExistingCutout(reqOpen.start, reqOpen.end)) {
          cutouts.push({
            start: reqOpen.start,
            end: reqOpen.end,
            type: 'open-span',
            isOwner: true,
          });
        }
      }

      // 1. Own Sliding Glass Wall on this wallSide (Mandiri milik ruangan ini sendiri)
      if (activeGlassOnThisWall) {
        const gwDim = resolveGlassWallDimensions(room);
        const s = Math.max(0, Math.min(length - 0.2, gwDim.offsetStart));
        const e = Math.max(s + 0.2, Math.min(length, s + gwDim.glassWidth));
        if (!overlapsExistingCutout(s, e)) {
          cutouts.push({
            start: s,
            end: e,
            type: 'glass-wall',
            isOwner: true,
            glassDim: gwDim,
          });
        }
      }

      // 2. Doors (Own Door & Shared Connecting Doorway on Opposite Partition Wall)
      doorsList.forEach(d => {
        if (d.floor !== floor) return;
        const isOwnDoor = d.roomId === roomId && d.wallSide === wallSide;
        const isSharedOppositeDoor =
          !isOwnDoor &&
          d.wallSide === oppositeSide &&
          Math.abs((isHoriz ? d.y : d.x) - wallCoord) < 0.18;
        if (!isOwnDoor && !isSharedOppositeDoor) return;

        const worldDoorStart = isHoriz ? d.x : d.y;
        const worldDoorEnd = worldDoorStart + d.width;
        const rawStart = worldDoorStart - wallMin;
        const rawEnd = worldDoorEnd - wallMin;

        // Ensure door genuinely overlaps this room's wall span [0, length]
        if (!isOwnDoor && (rawEnd <= 0.08 || rawStart >= length - 0.08)) return;

        const localStart = isOwnDoor
          ? Math.max(0.08, Math.min(length - d.width - 0.08, rawStart))
          : Math.max(0, rawStart);
        const localEnd = isOwnDoor
          ? Math.min(length, localStart + d.width)
          : Math.min(length, rawEnd);

        if (localEnd > localStart + 0.1 && !overlapsExistingCutout(localStart, localEnd)) {
          cutouts.push({
            start: localStart,
            end: localEnd,
            type: 'door',
            isOwner: isOwnDoor,
            doorData: d,
          });
        }
      });

      // 3. Windows & Roster (100% Mandiri milik ruangan ini sendiri — Tidak Pernah Melubangi Dinding Ruangan Tetangga)
      windowsList.forEach(w => {
        if (w.floor !== floor) return;
        const isOwnWin = w.roomId === roomId && w.wallSide === wallSide;
        if (!isOwnWin) return;

        const worldWinStart = isHoriz ? w.x : w.y;
        const rawStart = worldWinStart - wallMin;

        const localStart = Math.max(0.08, Math.min(length - w.width - 0.08, rawStart));
        const localEnd = Math.min(length, localStart + w.width);

        if (localEnd > localStart + 0.1 && !overlapsExistingCutout(localStart, localEnd)) {
          cutouts.push({
            start: localStart,
            end: localEnd,
            type: 'window',
            isOwner: true,
            windowData: w,
          });
        }
      });

      // If no cutouts at all, build solid continuous wall box
      if (cutouts.length === 0) {
        const wallGeo = new THREE.BoxGeometry(length, wallH, effWallT);
        const wallMesh = new THREE.Mesh(wallGeo, wallMat);
        wallMesh.position.set(length / 2, wallH / 2, wallZOffset);
        g.add(wallMesh);
      } else {
        // Sort cutouts along wall
        cutouts.sort((a, b) => a.start - b.start);

        // Build solid segments between cutouts
        let currentPos = 0;
        cutouts.forEach((cut) => {
          // Solid regular wall before cutout (Sisa Dinding Biasa Kiri)
          if (cut.start > currentPos + 0.03) {
            const segLen = cut.start - currentPos;
            const segGeo = new THREE.BoxGeometry(segLen, wallH, effWallT);
            const segMesh = new THREE.Mesh(segGeo, wallMat);
            segMesh.position.set(currentPos + segLen / 2, wallH / 2, wallZOffset);
            g.add(segMesh);
          }

          if (cut.type === 'open-span') {
            // Completely open span on this room's wall
          } else if (cut.type === 'glass-wall' && cut.glassDim) {
            const gw = cut.glassDim;
            const glassW = cut.end - cut.start;
            const glassH = Math.min(wallH, gw.glassHeight || 2.6);

            // Top Lintel Solid Wall above Glass Wall (Sisa Dinding Biasa Atas)
            if (wallH > glassH + 0.03) {
              const lintelH = wallH - glassH;
              const lintelGeo = new THREE.BoxGeometry(glassW, lintelH, effWallT);
              const lintelMesh = new THREE.Mesh(lintelGeo, wallMat);
              lintelMesh.position.set(cut.start + glassW / 2, glassH + lintelH / 2, wallZOffset);
              g.add(lintelMesh);
            }

            // Build 3D Black Aluminum Frame, Sliding Glass Panels & 3D Curtains
            if (cut.isOwner) {
              const gwGroup = new THREE.Group();
              gwGroup.position.set(cut.start, 0, wallZOffset);

              const frameDepth = effWallT + 0.035;
              const borderThick = 0.05;

              // 1. Perimeter Matte Black Aluminum Frame
              const topFrame = new THREE.Mesh(
                new THREE.BoxGeometry(glassW, borderThick, frameDepth),
                blackMullionMat
              );
              topFrame.position.set(glassW / 2, glassH - borderThick / 2, 0);
              gwGroup.add(topFrame);

              const bottomTrack = new THREE.Mesh(
                new THREE.BoxGeometry(glassW, 0.04, frameDepth),
                blackMullionMat
              );
              bottomTrack.position.set(glassW / 2, 0.02, 0);
              gwGroup.add(bottomTrack);

              const leftJamb = new THREE.Mesh(
                new THREE.BoxGeometry(borderThick, glassH, frameDepth),
                blackMullionMat
              );
              leftJamb.position.set(borderThick / 2, glassH / 2, 0);
              gwGroup.add(leftJamb);

              const rightJamb = new THREE.Mesh(
                new THREE.BoxGeometry(borderThick, glassH, frameDepth),
                blackMullionMat
              );
              rightJamb.position.set(glassW - borderThick / 2, glassH / 2, 0);
              gwGroup.add(rightJamb);

              // 2. Sliding Glass Leaves (2, 3, or 4 panels) with Slim Black Mullions
              const leafCount = gw.panelCount || 3;
              const innerSpan = Math.max(0.3, glassW - borderThick * 2);
              const innerH = Math.max(0.5, glassH - borderThick - 0.04);
              const leafStep = innerSpan / leafCount;
              const leafWidth = leafStep + 0.025; // Realistic overlap on sliding track
              const stileW = 0.038;

              for (let idx = 0; idx < leafCount; idx++) {
                const leafCenterX = borderThick + (idx + 0.5) * leafStep;
                const trackZ = (idx % 2 === 0 ? -1 : 1) * 0.016;
                const centerY = 0.04 + innerH / 2;

                // Tempered Glass Pane
                const paneGeo = new THREE.BoxGeometry(
                  Math.max(0.1, leafWidth - stileW * 2),
                  Math.max(0.2, innerH - stileW * 2),
                  0.012
                );
                const paneMesh = new THREE.Mesh(paneGeo, slidingGlassMat);
                paneMesh.position.set(leafCenterX, centerY, trackZ);
                gwGroup.add(paneMesh);

                // Left & Right Vertical Black Stile Mullions
                const stileGeo = new THREE.BoxGeometry(stileW, innerH, 0.03);
                const leftStile = new THREE.Mesh(stileGeo, blackMullionMat);
                leftStile.position.set(leafCenterX - leafWidth / 2 + stileW / 2, centerY, trackZ);
                gwGroup.add(leftStile);

                const rightStile = new THREE.Mesh(stileGeo, blackMullionMat);
                rightStile.position.set(leafCenterX + leafWidth / 2 - stileW / 2, centerY, trackZ);
                gwGroup.add(rightStile);

                // Top & Bottom Leaf Rails
                const railGeo = new THREE.BoxGeometry(leafWidth, stileW, 0.03);
                const topRail = new THREE.Mesh(railGeo, blackMullionMat);
                topRail.position.set(leafCenterX, 0.04 + innerH - stileW / 2, trackZ);
                gwGroup.add(topRail);

                const botRail = new THREE.Mesh(railGeo, blackMullionMat);
                botRail.position.set(leafCenterX, 0.04 + stileW / 2, trackZ);
                gwGroup.add(botRail);

                // Vertical Pull Handle on End Panels
                if (idx === 0 || idx === leafCount - 1) {
                  const handleGeo = new THREE.BoxGeometry(0.016, 0.24, 0.055);
                  const handleMesh = new THREE.Mesh(handleGeo, blackMullionMat);
                  const handleX = idx === 0
                    ? leafCenterX - leafWidth / 2 + stileW + 0.03
                    : leafCenterX + leafWidth / 2 - stileW - 0.03;
                  handleMesh.position.set(handleX, Math.min(1.05, glassH * 0.45), trackZ);
                  gwGroup.add(handleMesh);
                }
              }

              // 3. 3D Curtain Track & Pleated Drapes on Room Interior Side
              if (gw.hasCurtain) {
                const curtainZ = interiorSign * (effWallT / 2 + 0.055);
                const activeCurtainMat = gw.curtainType === 'blackout' ? blackoutCurtainMat : sheerCurtainMat;

                // Curtain Rod / Track
                const rodGeo = new THREE.BoxGeometry(Math.min(length, glassW + 0.14), 0.026, 0.026);
                const rodMesh = new THREE.Mesh(rodGeo, blackMullionMat);
                rodMesh.position.set(glassW / 2, glassH - 0.02, curtainZ);
                gwGroup.add(rodMesh);

                // Left & Right Gathered 3D Pleated Curtain Drapes
                const bundleW = Math.min(0.45, Math.max(0.22, glassW * 0.2));
                const pleatCount = 6;
                const drapeH = Math.max(0.5, glassH - 0.06);

                for (const side of ['left', 'right'] as const) {
                  const startX = side === 'left' ? 0.03 : glassW - 0.03 - bundleW;
                  for (let p = 0; p < pleatCount; p++) {
                    const px = startX + ((p + 0.5) / pleatCount) * bundleW;
                    const pzOffset = (p % 2 === 0 ? 1 : -1) * 0.014;
                    const pleatGeo = new THREE.CylinderGeometry(0.026, 0.034, drapeH, 10);
                    const pleatMesh = new THREE.Mesh(pleatGeo, activeCurtainMat);
                    pleatMesh.position.set(px, 0.03 + drapeH / 2, curtainZ + pzOffset);
                    gwGroup.add(pleatMesh);
                  }
                }

                // Subtle sheer inner veil if Vitrase Tipis is selected
                if (gw.curtainType === 'sheer' && glassW > bundleW * 2 + 0.2) {
                  const veilSpan = (glassW - bundleW * 2) * 0.35;
                  for (const side of ['left', 'right'] as const) {
                    const vx = side === 'left'
                      ? 0.03 + bundleW + veilSpan / 2
                      : glassW - 0.03 - bundleW - veilSpan / 2;
                    const veilGeo = new THREE.BoxGeometry(veilSpan, drapeH - 0.02, 0.008);
                    const veilMesh = new THREE.Mesh(veilGeo, sheerCurtainMat);
                    veilMesh.position.set(vx, 0.03 + drapeH / 2, curtainZ);
                    gwGroup.add(veilMesh);
                  }
                }
              }

              g.add(gwGroup);
            }
          } else if (cut.type === 'door' && cut.doorData) {
            const d = cut.doorData;
            const doorW = cut.end - cut.start;
            const doorH = d.height || 2.1;

            // Lintel above door
            if (wallH > doorH) {
              const lintelH = wallH - doorH;
              const lintelGeo = new THREE.BoxGeometry(doorW, lintelH, effWallT);
              const lintelMesh = new THREE.Mesh(lintelGeo, wallMat);
              lintelMesh.position.set(cut.start + doorW / 2, doorH + lintelH / 2, wallZOffset);
              g.add(lintelMesh);
            }

            if (cut.isOwner) {
              // Door Frame Jambs
              const frameGeo = new THREE.BoxGeometry(0.04, doorH, effWallT + 0.01);
              const leftFrame = new THREE.Mesh(frameGeo, woodDoorMat);
              leftFrame.position.set(cut.start + 0.02, doorH / 2, wallZOffset);
              g.add(leftFrame);

              const rightFrame = new THREE.Mesh(frameGeo, woodDoorMat);
              rightFrame.position.set(cut.end - 0.02, doorH / 2, wallZOffset);
              g.add(rightFrame);

              // Door Leaf with interactive Hinge Pivot
              const doorLeafW = doorW - 0.04;
              const doorLeafGeo = new THREE.BoxGeometry(doorLeafW, doorH - 0.04, 0.04);
              const doorLeafMesh = new THREE.Mesh(doorLeafGeo, woodDoorMat);
              doorLeafMesh.userData = { isDoor: true, doorId: d.id, doorName: d.name };

              // Handle
              const handleGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.12, 8);
              const handleMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.2 });
              const handleMesh = new THREE.Mesh(handleGeo, handleMat);
              handleMesh.position.set(doorLeafW * 0.4, 0, 0.035);
              doorLeafMesh.add(handleMesh);

              const hingePivot = new THREE.Group();
              const isLeftHinge = d.hingeSide === 'left';
              hingePivot.position.set(isLeftHinge ? cut.start + 0.02 : cut.end - 0.02, doorH / 2, wallZOffset);

              doorLeafMesh.position.set(isLeftHinge ? doorLeafW / 2 : -doorLeafW / 2, 0, 0);
              hingePivot.add(doorLeafMesh);

              // If door is open, swing open 90 degrees!
              if (d.isOpen) {
                hingePivot.rotation.y = isLeftHinge ? -Math.PI / 2 : Math.PI / 2;
              }

              g.add(hingePivot);
            }
          } else if (cut.type === 'window' && cut.windowData) {
            const w = cut.windowData;
            const winW = cut.end - cut.start;
            const sillH = w.sillHeight || 0.9;
            const winH = w.height || 1.4;

            // Sill wall below window
            if (sillH > 0) {
              const sillGeo = new THREE.BoxGeometry(winW, sillH, effWallT);
              const sillMesh = new THREE.Mesh(sillGeo, wallMat);
              sillMesh.position.set(cut.start + winW / 2, sillH / 2, wallZOffset);
              g.add(sillMesh);
            }

            // Lintel wall above window
            const topSill = sillH + winH;
            if (wallH > topSill) {
              const lintelH = wallH - topSill;
              const lintelGeo = new THREE.BoxGeometry(winW, lintelH, effWallT);
              const lintelMesh = new THREE.Mesh(lintelGeo, wallMat);
              lintelMesh.position.set(cut.start + winW / 2, topSill + lintelH / 2, wallZOffset);
              g.add(lintelMesh);
            }

            if (cut.isOwner) {
              // Glass pane & frame or Perforated 3D Roster Grid
              const wType = w.windowType || w.type || 'casement';
              if (wType === 'roster' || wType === 'roster-vent' || wType === 'louver-vent') {
                // 3D Hollow Terracotta / Concrete Ventilation Roster Grid
                const rosterGroup = new THREE.Group();
                rosterGroup.position.set(cut.start, sillH, wallZOffset);
                const cols = Math.max(3, Math.round(winW / 0.2));
                const rows = Math.max(2, Math.round(winH / 0.2));
                const barThick = 0.028;

                // Horizontal roster bars
                for (let rIdx = 0; rIdx <= rows; rIdx++) {
                  const ry = (rIdx / rows) * (winH - barThick) + barThick / 2;
                  const hBar = new THREE.Mesh(new THREE.BoxGeometry(winW, barThick, effWallT), rosterMat);
                  hBar.position.set(winW / 2, ry, 0);
                  rosterGroup.add(hBar);
                }
                // Vertical roster bars
                for (let cIdx = 0; cIdx <= cols; cIdx++) {
                  const cx = (cIdx / cols) * (winW - barThick) + barThick / 2;
                  const vBar = new THREE.Mesh(new THREE.BoxGeometry(barThick, winH, effWallT), rosterMat);
                  vBar.position.set(cx, winH / 2, 0);
                  rosterGroup.add(vBar);
                }
                g.add(rosterGroup);
              } else {
                // Glass Window Pane
                const winGlassGeo = new THREE.BoxGeometry(winW - 0.04, winH - 0.04, 0.02);
                const winGlassMesh = new THREE.Mesh(winGlassGeo, glassMat);
                winGlassMesh.position.set(cut.start + winW / 2, sillH + winH / 2, wallZOffset);
                g.add(winGlassMesh);

                // Window Frame Border
                const frameGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(winW, winH, effWallT + 0.02));
                const frameMat = new THREE.LineBasicMaterial({ color: 0x334155, linewidth: 2 });
                const frameLines = new THREE.LineSegments(frameGeo, frameMat);
                frameLines.position.set(cut.start + winW / 2, sillH + winH / 2, wallZOffset);
                g.add(frameLines);
              }
            }
          }

          currentPos = cut.end;
        });

        // Remaining solid regular wall after last cutout (Sisa Dinding Biasa Kanan)
        if (currentPos < length - 0.03) {
          const segLen = length - currentPos;
          const segGeo = new THREE.BoxGeometry(segLen, wallH, effWallT);
          const segMesh = new THREE.Mesh(segGeo, wallMat);
          segMesh.position.set(currentPos + segLen / 2, wallH / 2, wallZOffset);
          g.add(segMesh);
        }
      }

      g.position.set(x1, baseY, z1);
      g.rotation.y = -angle;
      return g;
    };

    // Helper: Resolve per-room Wall Material from wallColor or wallFinish
    const getRoomWallMaterial = (room: RoomData): THREE.MeshStandardMaterial => {
      if (room.wallColor) {
        return new THREE.MeshStandardMaterial({
          color: new THREE.Color(room.wallColor),
          roughness: 0.55,
          transparent,
          opacity,
        });
      }
      if (room.wallFinish) {
        const wf = WALL_FINISH_OPTIONS.find(w => w.id === room.wallFinish);
        if (wf) {
          const isWood = room.wallFinish === 'wood';
          const isBrick = room.wallFinish === 'brick';
          const isConcrete = room.wallFinish === 'concrete';
          return new THREE.MeshStandardMaterial({
            color: new THREE.Color(wf.hexColor),
            roughness: isBrick ? 0.88 : isConcrete ? 0.78 : isWood ? 0.45 : 0.52,
            metalness: isWood ? 0.1 : 0.02,
            transparent,
            opacity,
          });
        }
      }
      if (room.status === 'existing') return existingWallMat;
      if (room.id.includes('bath')) return bathroomWallMat;
      return newWallMat;
    };

    // Helper: Build 3D Room Floor with Custom Material & Rear Garden Landscaping (Grass, Stepping Stones, Decking)
    const createRoomFloorMesh = (room: RoomData, baseY: number): THREE.Group => {
      const fg = new THREE.Group();
      const w = room.width;
      const d = room.depth;
      const rx = room.x;
      const rz = room.y;
      const posX = rx + w / 2;
      const posZ = rz + d / 2;

      const finish: FloorFinishType =
        room.floorFinish || (room.id === 'rear_service_yard' ? 'grass' : 'ceramic');

      if (finish === 'grass') {
        // 1. Lush Green Turf Base
        const turfGeo = new THREE.BoxGeometry(w, 0.1, d);
        const turfMesh = new THREE.Mesh(turfGeo, gardenFloorMat);
        turfMesh.position.set(posX, baseY + 0.05, posZ);
        turfMesh.receiveShadow = true;
        fg.add(turfMesh);

        // 2. White Pebble Border Strip (Batu Koral Putih)
        const pebbleMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.92 });
        const stripW = Math.min(0.24, w * 0.12);
        const northPebble = new THREE.Mesh(new THREE.BoxGeometry(w - 0.08, 0.015, stripW), pebbleMat);
        northPebble.position.set(posX, baseY + 0.105, rz + stripW / 2 + 0.04);
        fg.add(northPebble);

        const southPebble = new THREE.Mesh(new THREE.BoxGeometry(w - 0.08, 0.015, stripW), pebbleMat);
        southPebble.position.set(posX, baseY + 0.105, rz + d - stripW / 2 - 0.04);
        fg.add(southPebble);

        // 3. Natural Andesite Stepping Stones (Batu Pijakan Taman)
        const stoneMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.8 });
        const cols = Math.max(2, Math.floor(w / 0.75));
        const rows = Math.max(2, Math.floor(d / 0.75));
        for (let rIdx = 0; rIdx < rows; rIdx++) {
          for (let cIdx = 0; cIdx < cols; cIdx++) {
            if ((rIdx + cIdx) % 2 === 0 || rows === 2) {
              const sx = rx + ((cIdx + 0.5) / cols) * w;
              const sz = rz + ((rIdx + 0.5) / rows) * d;
              const stoneMesh = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.028, 0.34), stoneMat);
              stoneMesh.position.set(sx, baseY + 0.112, sz);
              fg.add(stoneMesh);
            }
          }
        }

        // 4. Corner Tropical Garden Shrubs / Planters
        const potMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 });
        const foliageMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.85 });
        for (const [cx, cz] of [
          [rx + 0.32, rz + d - 0.32],
          [rx + w - 0.32, rz + d - 0.32],
        ]) {
          const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.15, 0.28, 10), potMat);
          pot.position.set(cx, baseY + 0.24, cz);
          fg.add(pot);

          const bush = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 10), foliageMat);
          bush.position.set(cx, baseY + 0.5, cz);
          fg.add(bush);
        }
      } else if (finish === 'wood-deck') {
        // Outdoor WPC Wood Decking + Pebble Border
        const deckBaseMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.55 });
        const grooveMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.8 });
        const pebbleMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.92 });

        const deckGeo = new THREE.BoxGeometry(w, 0.1, d);
        const deckMesh = new THREE.Mesh(deckGeo, deckBaseMat);
        deckMesh.position.set(posX, baseY + 0.05, posZ);
        deckMesh.receiveShadow = true;
        fg.add(deckMesh);

        const plankCount = Math.max(4, Math.floor(d / 0.22));
        for (let i = 1; i < plankCount; i++) {
          const pz = rz + (i / plankCount) * d;
          const seam = new THREE.Mesh(new THREE.BoxGeometry(w - 0.16, 0.008, 0.015), grooveMat);
          seam.position.set(posX, baseY + 0.104, pz);
          fg.add(seam);
        }

        // Side pebble accent strip
        const sideStrip = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.015, d - 0.08), pebbleMat);
        sideStrip.position.set(rx + 0.14, baseY + 0.105, posZ);
        fg.add(sideStrip);
      } else {
        // Interior Floor Finishes: ceramic, parquet, marble, concrete
        const floorColor =
          finish === 'parquet'
            ? 0xb45309
            : finish === 'marble'
            ? 0xf8fafc
            : finish === 'concrete'
            ? 0x64748b
            : 0xe2e8f0; // ceramic
        const floorRoughness =
          finish === 'marble' ? 0.14 : finish === 'parquet' ? 0.42 : finish === 'concrete' ? 0.75 : 0.32;

        const mat = new THREE.MeshStandardMaterial({
          color: floorColor,
          roughness: floorRoughness,
          metalness: finish === 'marble' ? 0.08 : 0.02,
        });

        const floorGeo = new THREE.BoxGeometry(w, 0.1, d);
        const floorMesh = new THREE.Mesh(floorGeo, mat);
        floorMesh.position.set(posX, baseY + 0.05, posZ);
        floorMesh.receiveShadow = true;
        fg.add(floorMesh);

        // Subtle Tile / Parquet Seam Grid Lines
        if (finish === 'ceramic' || finish === 'marble') {
          const step = finish === 'marble' ? 0.8 : 0.6;
          const seamMat = new THREE.LineBasicMaterial({
            color: finish === 'marble' ? 0xcbd5e1 : 0x94a3b8,
            transparent: true,
            opacity: 0.45,
          });
          const pts: THREE.Vector3[] = [];
          for (let gx = rx + step; gx < rx + w - 0.05; gx += step) {
            pts.push(new THREE.Vector3(gx, baseY + 0.102, rz + 0.05));
            pts.push(new THREE.Vector3(gx, baseY + 0.102, rz + d - 0.05));
          }
          for (let gz = rz + step; gz < rz + d - 0.05; gz += step) {
            pts.push(new THREE.Vector3(rx + 0.05, baseY + 0.102, gz));
            pts.push(new THREE.Vector3(rx + w - 0.05, baseY + 0.102, gz));
          }
          if (pts.length > 0) {
            const gridGeo = new THREE.BufferGeometry().setFromPoints(pts);
            fg.add(new THREE.LineSegments(gridGeo, seamMat));
          }
        } else if (finish === 'parquet') {
          const seamMat = new THREE.LineBasicMaterial({
            color: 0x78350f,
            transparent: true,
            opacity: 0.55,
          });
          const pts: THREE.Vector3[] = [];
          for (let gz = rz + 0.25; gz < rz + d - 0.05; gz += 0.25) {
            pts.push(new THREE.Vector3(rx + 0.05, baseY + 0.102, gz));
            pts.push(new THREE.Vector3(rx + w - 0.05, baseY + 0.102, gz));
          }
          if (pts.length > 0) {
            const gridGeo = new THREE.BufferGeometry().setFromPoints(pts);
            fg.add(new THREE.LineSegments(gridGeo, seamMat));
          }
        }
      }

      return fg;
    };

    // Helper: Build Full Room with customizable openWalls, glassWall, skylight, floorFinish, and wallFinish/wallColor
    const createRoomMesh = (room: RoomData, wallHeight: number, baseY: number): THREE.Group => {
      const group = new THREE.Group();

      const wallMat = getRoomWallMaterial(room);

      const w = room.width;
      const d = room.depth;
      const h = room.wallHeight || wallHeight;
      const t = room.wallThickness || 0.15;

      const rx = room.x;
      const rz = room.y;

      // Custom Floor Slab & Rear Garden Landscaping
      if (visibilities.slabs) {
        group.add(createRoomFloorMesh(room, baseY));
      }

      // 3D Skylight Canopy if enabled on room
      if (room.skylight?.hasSkylight) {
        group.add(createSkylightCanopy(room, h, baseY));
      }

      // Walls perimeter check with room.openWalls (Note: if glassWall is active on a wallSide, always render the glassWall!)
      const openConfig = room.openWalls || {};
      const activeGlassSide = room.glassWall?.hasGlassWall ? (room.glassWall.wallSide || 'north') : null;

      // 1. North Wall (Top / Front: from (rx, rz) to (rx + w, rz))
      if (activeGlassSide !== 'north' && openConfig.north === 'railing') {
        group.add(createRailing(rx, rz, rx + w, rz, baseY));
      } else {
        group.add(createWallWithOpenings(room, 'north', rx, rz, rx + w, rz, h, t, baseY, wallMat, room.id, room.floor));
      }

      // 2. South Wall (Bottom / Rear: from (rx, rz + d) to (rx + w, rz + d))
      if (activeGlassSide !== 'south' && openConfig.south === 'railing') {
        group.add(createRailing(rx, rz + d, rx + w, rz + d, baseY));
      } else {
        group.add(createWallWithOpenings(room, 'south', rx, rz + d, rx + w, rz + d, h, t, baseY, wallMat, room.id, room.floor));
      }

      // 3. West Wall (Left: from (rx, rz) to (rx, rz + d))
      if (activeGlassSide !== 'west' && openConfig.west === 'railing') {
        group.add(createRailing(rx, rz, rx, rz + d, baseY));
      } else {
        group.add(createWallWithOpenings(room, 'west', rx, rz, rx, rz + d, h, t, baseY, wallMat, room.id, room.floor));
      }

      // 4. East Wall (Right: from (rx + w, rz) to (rx + w, rz + d))
      if (activeGlassSide !== 'east' && openConfig.east === 'railing') {
        group.add(createRailing(rx + w, rz, rx + w, rz + d, baseY));
      } else {
        group.add(createWallWithOpenings(room, 'east', rx + w, rz, rx + w, rz + d, h, t, baseY, wallMat, room.id, room.floor));
      }

      return group;
    };

    // Helper: Build 3D Elongated Roof & Roof Walls (Sopi-Sopi / Parapet) for a Building Zone
    const createElongatedRoofZone = (
      rx: number,
      rz: number,
      rw: number,
      rd: number,
      baseY: number,
      roofCfg: RoofConfig
    ): THREE.Group => {
      const rg = new THREE.Group();
      const matMeta = ROOF_MATERIAL_OPTIONS.find(m => m.id === roofCfg.material) || ROOF_MATERIAL_OPTIONS[0];
      const wallMeta = ROOF_WALL_FINISH_OPTIONS.find(w => w.id === roofCfg.wallFinish) || ROOF_WALL_FINISH_OPTIONS[0];

      const roofCoverMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(matMeta.hexColor),
        roughness: roofCfg.material === 'spandek-charcoal' ? 0.45 : 0.72,
        metalness: roofCfg.material === 'spandek-charcoal' ? 0.35 : 0.08,
        side: THREE.DoubleSide,
        transparent,
        opacity,
      });

      const roofWallColorHex = roofCfg.customWallColor || wallMeta.hexColor;
      const roofWallMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(roofWallColorHex),
        roughness: roofCfg.wallFinish === 'brick' ? 0.88 : 0.6,
        side: THREE.DoubleSide,
        transparent,
        opacity,
      });

      const wallT = 0.15;
      const parapetH = Math.max(0.35, Math.min(1.3, roofCfg.parapetHeight || 0.65));
      const pitchRad = ((roofCfg.pitchDegrees || 24) * Math.PI) / 180;
      const overhang = 0.25;

      // 1. Perimeter Parapet / Fascia Wall around Roof Zone (Dinding Tepi Atap)
      const northParapet = new THREE.Mesh(new THREE.BoxGeometry(rw, parapetH, wallT), roofWallMat);
      northParapet.position.set(rx + rw / 2, baseY + parapetH / 2, rz + wallT / 2);
      rg.add(northParapet);

      const southParapet = new THREE.Mesh(new THREE.BoxGeometry(rw, parapetH, wallT), roofWallMat);
      southParapet.position.set(rx + rw / 2, baseY + parapetH / 2, rz + rd - wallT / 2);
      rg.add(southParapet);

      const westParapet = new THREE.Mesh(new THREE.BoxGeometry(wallT, parapetH, rd), roofWallMat);
      westParapet.position.set(rx + wallT / 2, baseY + parapetH / 2, rz + rd / 2);
      rg.add(westParapet);

      const eastParapet = new THREE.Mesh(new THREE.BoxGeometry(wallT, parapetH, rd), roofWallMat);
      eastParapet.position.set(rx + rw - wallT / 2, baseY + parapetH / 2, rz + rd / 2);
      rg.add(eastParapet);

      const eaveY = baseY + parapetH * 0.65;

      if (roofCfg.style === 'flat-parapet') {
        // Flat Concrete Roof Deck + Parapet Coping Trim
        const deckSlab = new THREE.Mesh(
          new THREE.BoxGeometry(rw - wallT * 2, 0.14, rd - wallT * 2),
          roofCoverMat
        );
        deckSlab.position.set(rx + rw / 2, baseY + 0.12, rz + rd / 2);
        rg.add(deckSlab);

        // Top Dark Coping on Parapet Walls
        const copingNorth = new THREE.Mesh(new THREE.BoxGeometry(rw + 0.04, 0.04, wallT + 0.04), blackMullionMat);
        copingNorth.position.set(rx + rw / 2, baseY + parapetH + 0.02, rz + wallT / 2);
        rg.add(copingNorth);

        const copingSouth = new THREE.Mesh(new THREE.BoxGeometry(rw + 0.04, 0.04, wallT + 0.04), blackMullionMat);
        copingSouth.position.set(rx + rw / 2, baseY + parapetH + 0.02, rz + rd - wallT / 2);
        rg.add(copingSouth);
      } else if (roofCfg.style === 'gable') {
        // Atap Pelana Memanjang (2 Sisi Miring + Dinding Sopi-Sopi Segitiga Depan & Belakang)
        const halfSpan = rw / 2;
        const ridgeRise = Math.min(2.2, Math.max(0.7, halfSpan * Math.tan(pitchRad)));
        const slopeLen = Math.hypot(halfSpan + overhang, ridgeRise);
        const slopeAngle = Math.atan2(ridgeRise, halfSpan);

        // Triangular Gable Walls (Dinding Sopi-Sopi Segitiga) at North & South ends
        for (const zPos of [rz + wallT / 2, rz + rd - wallT / 2]) {
          const triShape = new THREE.Shape();
          triShape.moveTo(-halfSpan, 0);
          triShape.lineTo(halfSpan, 0);
          triShape.lineTo(0, ridgeRise);
          triShape.closePath();

          const extrudeGeo = new THREE.ExtrudeGeometry(triShape, {
            depth: wallT,
            bevelEnabled: false,
          });
          const gableWall = new THREE.Mesh(extrudeGeo, roofWallMat);
          gableWall.position.set(rx + halfSpan, eaveY, zPos - wallT / 2);
          rg.add(gableWall);

          // Optional Wood Louver Accent on Gable Wall
          if (roofCfg.wallFinish === 'wood-louver') {
            const louverVent = new THREE.Mesh(
              new THREE.BoxGeometry(rw * 0.35, ridgeRise * 0.35, wallT + 0.03),
              woodDoorMat
            );
            louverVent.position.set(rx + halfSpan, eaveY + ridgeRise * 0.35, zPos);
            rg.add(louverVent);
          }
        }

        // Left & Right Pitched Roof Slopes
        const leftSlope = new THREE.Mesh(
          new THREE.BoxGeometry(slopeLen, 0.08, rd + overhang * 2),
          roofCoverMat
        );
        leftSlope.position.set(
          rx + halfSpan / 2 - overhang * 0.3,
          eaveY + ridgeRise / 2 + 0.04,
          rz + rd / 2
        );
        leftSlope.rotation.z = slopeAngle;
        rg.add(leftSlope);

        const rightSlope = new THREE.Mesh(
          new THREE.BoxGeometry(slopeLen, 0.08, rd + overhang * 2),
          roofCoverMat
        );
        rightSlope.position.set(
          rx + halfSpan + halfSpan / 2 + overhang * 0.3,
          eaveY + ridgeRise / 2 + 0.04,
          rz + rd / 2
        );
        rightSlope.rotation.z = -slopeAngle;
        rg.add(rightSlope);

        // Ridge Cap (Nok Atap Memanjang)
        const ridgeCap = new THREE.Mesh(
          new THREE.BoxGeometry(0.18, 0.1, rd + overhang * 2),
          blackMullionMat
        );
        ridgeCap.position.set(rx + halfSpan, eaveY + ridgeRise + 0.06, rz + rd / 2);
        rg.add(ridgeCap);
      } else if (roofCfg.style === 'shed') {
        // Atap Miring Satu Sisi / Skillion Modern + Dinding Sopi-Sopi Miring
        const rise = Math.min(2.1, Math.max(0.8, rw * Math.tan(pitchRad * 0.72)));
        const slopeLen = Math.hypot(rw + overhang * 2, rise);
        const slopeAngle = Math.atan2(rise, rw);

        // Front & Back Right-Triangle Sopi-Sopi Walls
        for (const zPos of [rz + wallT / 2, rz + rd - wallT / 2]) {
          const shedShape = new THREE.Shape();
          shedShape.moveTo(0, 0);
          shedShape.lineTo(rw, 0);
          shedShape.lineTo(rw, rise);
          shedShape.closePath();

          const extrudeGeo = new THREE.ExtrudeGeometry(shedShape, {
            depth: wallT,
            bevelEnabled: false,
          });
          const shedWall = new THREE.Mesh(extrudeGeo, roofWallMat);
          shedWall.position.set(rx, eaveY, zPos - wallT / 2);
          rg.add(shedWall);
        }

        // High Side Wall along East Edge
        const highSideWall = new THREE.Mesh(
          new THREE.BoxGeometry(wallT, rise, rd),
          roofWallMat
        );
        highSideWall.position.set(rx + rw - wallT / 2, eaveY + rise / 2, rz + rd / 2);
        rg.add(highSideWall);

        // Single-Slope Roof Plane
        const shedPlane = new THREE.Mesh(
          new THREE.BoxGeometry(slopeLen, 0.09, rd + overhang * 2),
          roofCoverMat
        );
        shedPlane.position.set(rx + rw / 2, eaveY + rise / 2 + 0.05, rz + rd / 2);
        shedPlane.rotation.z = slopeAngle;
        rg.add(shedPlane);
      } else if (roofCfg.style === 'hip') {
        // Atap Limas / Perisai Memanjang (4 Sisi Miring)
        const halfW = rw / 2 + overhang * 0.6;
        const halfD = rd / 2 + overhang * 0.6;
        const cx = rx + rw / 2;
        const cz = rz + rd / 2;
        const ridgeRise = Math.min(2.0, Math.max(0.8, (rw / 2) * Math.tan(pitchRad)));
        const ridgeHalfLen = Math.max(0.4, halfD - halfW);
        const topY = eaveY + ridgeRise;

        const hipGeo = new THREE.BufferGeometry();
        const v = new Float32Array([
          // 0: NW eave, 1: NE eave, 2: SE eave, 3: SW eave, 4: N ridge, 5: S ridge
          cx - halfW, eaveY, cz - halfD,
          cx + halfW, eaveY, cz - halfD,
          cx + halfW, eaveY, cz + halfD,
          cx - halfW, eaveY, cz + halfD,
          cx, topY, cz - ridgeHalfLen,
          cx, topY, cz + ridgeHalfLen,
        ]);
        const indices = [
          // North hip triangle
          0, 4, 1,
          // South hip triangle
          3, 2, 5,
          // West trapezoid (2 tris)
          0, 3, 5,
          0, 5, 4,
          // East trapezoid (2 tris)
          1, 4, 5,
          1, 5, 2,
        ];
        hipGeo.setAttribute('position', new THREE.BufferAttribute(v, 3));
        hipGeo.setIndex(indices);
        hipGeo.computeVertexNormals();

        const hipMesh = new THREE.Mesh(hipGeo, roofCoverMat);
        rg.add(hipMesh);

        // Ridge Cap
        const ridgeCap = new THREE.Mesh(
          new THREE.BoxGeometry(0.16, 0.09, ridgeHalfLen * 2 + 0.1),
          blackMullionMat
        );
        ridgeCap.position.set(cx, topY + 0.03, cz);
        rg.add(ridgeCap);
      }

      return rg;
    };

    // 1. Build Ground Floor Rooms
    gfRooms.forEach(room => {
      groundGroup.add(createRoomMesh(room, 3.2, 0));
    });

    // 2. Build Second Floor Rooms (Height 3.0m, Base Y = 3.6m)
    upperRooms.forEach(room => {
      upperGroup.add(createRoomMesh(room, 3.0, 3.6));
    });

    // 2.5 Build 3D Elongated Roof & Roof Walls when showRoof3D is active or in exterior viewMode
    const activeRoofCfg: RoofConfig = design?.roofConfig || DEFAULT_ROOF_CONFIG;
    if (showRoof3D || viewMode === 'exterior') {
      // Roof over 1-Storey Existing Zone (KT1, KT2, RK: X: 0..6.0m, Z: 2.5..9.0m)
      groundGroup.add(createElongatedRoofZone(0.0, 2.5, 6.0, 6.5, 3.2, activeRoofCfg));

      // Roof over 2-Storey Elongated Right Wing (X: 6.0..9.0m, Z: 2.0..11.0m)
      upperGroup.add(createElongatedRoofZone(6.0, 2.0, 3.0, 9.0, 6.6, activeRoofCfg));

      // Roof over 2-Storey Front Bedroom KT 6 (X: 3.0..6.0m, Z: 0.0..3.0m)
      upperGroup.add(createElongatedRoofZone(3.0, 0.0, 3.0, 3.0, 6.6, activeRoofCfg));
    }

    // 3. Prohibited Structural Zone Holographic Box
    if (visibilities.prohibitedZone && !showRoof3D && viewMode !== 'exterior') {
      const hazardGeo = new THREE.BoxGeometry(6.0, 3.0, 6.5);
      const hazardMat = new THREE.MeshBasicMaterial({
        color: 0xf43f5e,
        wireframe: true,
        transparent: true,
        opacity: 0.45,
      });
      const hazardMesh = new THREE.Mesh(hazardGeo, hazardMat);
      hazardMesh.position.set(3.0, 5.1, 5.75);
      upperGroup.add(hazardMesh);
    }

    // 4. Build Realistic 3D Furniture Models
    if (visibilities.furniture) {
      furnitureList.forEach(f => {
        const furnGroup = new THREE.Group();
        const fW = f.width || 1.2;
        const fD = f.depth || 0.8;
        const fH = f.height || 0.8;
        const fX = f.x + fW / 2;
        const fZ = f.y + fD / 2;

        const isUpper = upperRooms.some(r => r.id === f.roomId);
        const baseY = isUpper ? 3.6 : 0;
        const elevY = (f.distanceFromFloor || 0);
        const posY = baseY + (f.mountType === 'wall-mounted' ? elevY : 0);

        // Store metadata on furnGroup for 3D click raycasting
        furnGroup.userData = {
          isFurniture: true,
          item: f,
        };

        // Realistic composite models based on item.type
        if (f.type === 'sofa-l') {
          // TRUE L-SHAPE SOFA
          const sofaColor = 0x2563eb; // Royal blue upholstery
          const sofaMat = new THREE.MeshStandardMaterial({ color: sofaColor, roughness: 0.8 });
          const cushionMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.7 });
          const legMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.5 });

          // 1. Main seat section
          const mainSeatGeo = new THREE.BoxGeometry(fW, 0.4, fD * 0.55);
          const mainSeat = new THREE.Mesh(mainSeatGeo, sofaMat);
          mainSeat.position.set(0, 0.2, -fD * 0.22);
          furnGroup.add(mainSeat);

          // 2. Chaise lounge return section (L-shape extension)
          const chaiseGeo = new THREE.BoxGeometry(fW * 0.42, 0.4, fD * 0.45);
          const chaise = new THREE.Mesh(chaiseGeo, cushionMat);
          chaise.position.set(fW * 0.29, 0.2, fD * 0.27);
          furnGroup.add(chaise);

          // 3. Backrest along back
          const backGeo = new THREE.BoxGeometry(fW, 0.45, 0.2);
          const back = new THREE.Mesh(backGeo, sofaMat);
          back.position.set(0, 0.55, -fD * 0.45);
          furnGroup.add(back);

          // 4. Side armrests
          const armGeo = new THREE.BoxGeometry(0.18, 0.35, fD * 0.55);
          const leftArm = new THREE.Mesh(armGeo, sofaMat);
          leftArm.position.set(-fW / 2 + 0.09, 0.45, -fD * 0.22);
          furnGroup.add(leftArm);

          // 5. Wooden tapered legs
          for (let lx of [-fW / 2 + 0.1, fW / 2 - 0.1]) {
            for (let lz of [-fD / 2 + 0.1, fD / 2 - 0.1]) {
              const legGeo = new THREE.CylinderGeometry(0.025, 0.015, 0.15, 8);
              const leg = new THREE.Mesh(legGeo, legMat);
              leg.position.set(lx, 0.075, lz);
              furnGroup.add(leg);
            }
          }
        } else if (f.category === 'bedroom' || f.type.startsWith('bed-')) {
          // REALISTIC BED WITH CLEAR HEADBOARD & PILLOWS
          const woodHeadboardMat = new THREE.MeshStandardMaterial({ color: 0x5c2b09, roughness: 0.5 });
          const mattressMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.9 });
          const pillowMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95 });
          const duvetMat = new THREE.MeshStandardMaterial({ color: 0x4338ca, roughness: 0.7 });

          // Bed Divan Base
          const baseGeo = new THREE.BoxGeometry(fW, 0.25, fD);
          const baseMesh = new THREE.Mesh(baseGeo, woodHeadboardMat);
          baseMesh.position.set(0, 0.125, 0);
          furnGroup.add(baseMesh);

          // HEADBOARD (High vertical panel at top/north of the bed so head is 100% obvious)
          const headGeo = new THREE.BoxGeometry(fW + 0.06, 0.85, 0.12);
          const headMesh = new THREE.Mesh(headGeo, woodHeadboardMat);
          headMesh.position.set(0, 0.55, -fD / 2 + 0.06);
          furnGroup.add(headMesh);

          // Mattress
          const matGeo = new THREE.BoxGeometry(fW * 0.94, 0.28, fD * 0.9);
          const matMesh = new THREE.Mesh(matGeo, mattressMat);
          matMesh.position.set(0, 0.39, 0.04);
          furnGroup.add(matMesh);

          // 2 Fluffy White Pillows right against headboard
          const pillowW = fW * 0.4;
          const pillowGeo = new THREE.BoxGeometry(pillowW, 0.12, 0.35);
          const p1 = new THREE.Mesh(pillowGeo, pillowMat);
          p1.position.set(-fW * 0.22, 0.58, -fD / 2 + 0.3);
          furnGroup.add(p1);

          const p2 = new THREE.Mesh(pillowGeo, pillowMat);
          p2.position.set(fW * 0.22, 0.58, -fD / 2 + 0.3);
          furnGroup.add(p2);

          // Duvet / Quilt Blanket covering lower 60%
          const duvetGeo = new THREE.BoxGeometry(fW * 0.95, 0.08, fD * 0.55);
          const duvetMesh = new THREE.Mesh(duvetGeo, duvetMat);
          duvetMesh.position.set(0, 0.55, fD * 0.2);
          furnGroup.add(duvetMesh);
        } else if (f.type === 'dining-table') {
          // DINING TABLE + 6 CHAIRS
          const tableMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.4 });
          const chairMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6 });

          // Table Top
          const topGeo = new THREE.BoxGeometry(fW, 0.06, fD);
          const top = new THREE.Mesh(topGeo, tableMat);
          top.position.set(0, 0.72, 0);
          furnGroup.add(top);

          // Table Legs
          for (let lx of [-fW / 2 + 0.08, fW / 2 - 0.08]) {
            for (let lz of [-fD / 2 + 0.08, fD / 2 - 0.08]) {
              const legGeo = new THREE.BoxGeometry(0.07, 0.72, 0.07);
              const leg = new THREE.Mesh(legGeo, tableMat);
              leg.position.set(lx, 0.36, lz);
              furnGroup.add(leg);
            }
          }

          // 6 Chairs
          for (let i = 0; i < 3; i++) {
            const chairX = -fW * 0.3 + i * (fW * 0.3);
            for (let side of [-1, 1]) {
              const chairSeatGeo = new THREE.BoxGeometry(0.38, 0.04, 0.38);
              const chairSeat = new THREE.Mesh(chairSeatGeo, chairMat);
              chairSeat.position.set(chairX, 0.45, side * (fD / 2 + 0.2));
              furnGroup.add(chairSeat);

              const chairBackGeo = new THREE.BoxGeometry(0.38, 0.45, 0.03);
              const chairBack = new THREE.Mesh(chairBackGeo, chairMat);
              chairBack.position.set(chairX, 0.7, side * (fD / 2 + 0.36));
              furnGroup.add(chairBack);
            }
          }
        } else if (f.type === 'toilet') {
          // TOILET WITH CISTERN TANK
          const porcelainMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.2 });
          const bowlGeo = new THREE.CylinderGeometry(0.2, 0.15, 0.4, 16);
          const bowl = new THREE.Mesh(bowlGeo, porcelainMat);
          bowl.position.set(0, 0.2, 0.05);
          furnGroup.add(bowl);

          const tankGeo = new THREE.BoxGeometry(fW * 0.9, 0.45, 0.22);
          const tank = new THREE.Mesh(tankGeo, porcelainMat);
          tank.position.set(0, 0.5, -fD / 2 + 0.12);
          furnGroup.add(tank);
        } else if (f.type === 'washing-machine') {
          // WASHING MACHINE WITH GLASS DRUM
          const wmMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.3, metalness: 0.2 });
          const bodyGeo = new THREE.BoxGeometry(fW, fH, fD);
          const body = new THREE.Mesh(bodyGeo, wmMat);
          body.position.set(0, fH / 2, 0);
          furnGroup.add(body);

          const doorGeo = new THREE.CylinderGeometry(fW * 0.35, fW * 0.35, 0.05, 16);
          const doorMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1 });
          const door = new THREE.Mesh(doorGeo, doorMat);
          door.rotation.z = Math.PI / 2;
          door.position.set(-fW / 2 - 0.02, fH * 0.55, 0);
          furnGroup.add(door);
        } else {
          // Standard modern furniture box
          const boxMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 });
          const boxGeo = new THREE.BoxGeometry(fW, fH, fD);
          const box = new THREE.Mesh(boxGeo, boxMat);
          box.position.set(0, fH / 2, 0);
          furnGroup.add(box);
        }

        furnGroup.position.set(fX, posY, fZ);
        furnGroup.rotation.y = ((f.rotation || 0) * Math.PI) / 180;
        furnitureGroup.add(furnGroup);
      });
    }

    // 5. Build Staircase (Customizable Straight, L-Shape, U-Shape)
    const staircaseGroup = staircaseGroupRef.current;
    if (staircaseGroup) {
      staircaseGroup.clear();
      const sCfg = design?.staircaseConfig || DEFAULT_STAIRCASE_CONFIG;
      if (visibilities.staircase) {
        const steps = generateStairSteps(sCfg);
        const treadMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.4 });
        const riserMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.6 });
        const landingMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.4 });
        const railMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.3 });

        steps.forEach((step) => {
          if (step.isLanding) {
            const landingGeo = new THREE.BoxGeometry(step.width, 0.08, step.treadDepth);
            const landingMesh = new THREE.Mesh(landingGeo, landingMat);
            landingMesh.position.set(step.x, step.z, step.y);
            staircaseGroup.add(landingMesh);
          } else {
            // Tread Plank
            const treadGeo = new THREE.BoxGeometry(step.width, 0.035, step.treadDepth);
            const treadMesh = new THREE.Mesh(treadGeo, treadMat);
            treadMesh.position.set(step.x, step.z, step.y);
            staircaseGroup.add(treadMesh);

            // Riser Panel
            const riserGeo = new THREE.BoxGeometry(step.width, step.riserHeight, 0.02);
            const riserMesh = new THREE.Mesh(riserGeo, riserMat);
            riserMesh.position.set(step.x, step.z - step.riserHeight / 2, step.y + step.treadDepth / 2);
            staircaseGroup.add(riserMesh);

            // Baluster
            if (step.index % 2 === 0) {
              const balusterGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.9, 8);
              const baluster = new THREE.Mesh(balusterGeo, railMat);
              baluster.position.set(step.x + step.width / 2 - 0.04, step.z + 0.45, step.y);
              staircaseGroup.add(baluster);
            }
          }
        });

        // Continuous Handrail
        const handrailGeo = new THREE.BoxGeometry(0.05, 0.05, sCfg.depth);
        const handrail = new THREE.Mesh(handrailGeo, railMat);
        handrail.position.set(sCfg.x + sCfg.width - 0.04, 1.8, sCfg.y + sCfg.depth / 2);
        staircaseGroup.add(handrail);
      }
      staircaseGroup.visible = selectedFloor === 'all' || selectedFloor === 'GF';
    }

    // 6. Visibility toggles
    groundGroup.visible = selectedFloor === 'all' || selectedFloor === 'GF';
    upperGroup.visible = selectedFloor === 'all' || selectedFloor === '2F';

  }, [design, localDoors, selectedFloor, isTransparentWalls, visibilities, showRoof3D, viewMode]);

  // Lighting Mode (Day / Night)
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;
    const ambient = scene.getObjectByName('ambientLight') as THREE.AmbientLight | null;
    const sun = scene.getObjectByName('sunLight') as THREE.DirectionalLight | null;
    const int1 = scene.getObjectByName('interiorLight1') as THREE.PointLight | null;
    const int2 = scene.getObjectByName('interiorLight2') as THREE.PointLight | null;

    if (lightingMode === 'night') {
      scene.background = new THREE.Color(0x050814);
      if (ambient) ambient.intensity = 0.25;
      if (sun) sun.intensity = 0.15;
      if (int1) int1.intensity = 2.2;
      if (int2) int2.intensity = 2.2;
    } else {
      scene.background = new THREE.Color(0x0f172a);
      if (ambient) ambient.intensity = 0.9;
      if (sun) sun.intensity = 1.4;
      if (int1) int1.intensity = 0;
      if (int2) int2.intensity = 0;
    }
  }, [lightingMode]);

  // Camera presets by ViewMode
  useEffect(() => {
    if (!cameraRef.current) return;
    if (viewMode === 'top-down') {
      orbitAnglesRef.current = { theta: 0, phi: 0.01, radius: 24 };
      orbitTargetRef.current = new THREE.Vector3(4.5, 0, 5.5);
    } else if (viewMode === 'isometric') {
      orbitAnglesRef.current = { theta: Math.PI / 4, phi: Math.PI / 3.2, radius: 22 };
      orbitTargetRef.current = new THREE.Vector3(4.5, 2.5, 5.5);
    } else if (viewMode === 'dollhouse') {
      orbitAnglesRef.current = { theta: Math.PI / 5, phi: Math.PI / 3.5, radius: 18 };
      orbitTargetRef.current = new THREE.Vector3(4.5, 2.0, 5.5);
    } else if (viewMode === 'exterior') {
      orbitAnglesRef.current = { theta: Math.PI / 6, phi: Math.PI / 2.3, radius: 25 };
      orbitTargetRef.current = new THREE.Vector3(4.5, 3.0, 5.5);
    }
  }, [viewMode]);

  // Pointer drag for orbit OR walkthrough head-turning
  const handleMouseDown = (e: React.MouseEvent) => {
    isMouseDownRef.current = true;
    // Allow Middle Click (button 1) OR Right Click (button 2) to pan the 3D camera
    isMiddlePanningRef.current = e.button === 1 || e.button === 2 || (e.buttons & 4) !== 0 || (e.buttons & 2) !== 0;
    mousePrevRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDownRef.current) return;
    const deltaX = e.clientX - mousePrevRef.current.x;
    const deltaY = e.clientY - mousePrevRef.current.y;
    mousePrevRef.current = { x: e.clientX, y: e.clientY };

    if (viewMode === 'walkthrough') {
      // First Person: Drag mouse to turn head (Yaw & Pitch)
      playerYawRef.current -= deltaX * 0.005;
      playerPitchRef.current = Math.max(-1.2, Math.min(1.2, playerPitchRef.current - deltaY * 0.005));
    } else {
      if (isMiddlePanningRef.current || (e.buttons & 4) !== 0) {
        if (cameraRef.current) {
          const cam = cameraRef.current;
          const forward = new THREE.Vector3();
          cam.getWorldDirection(forward);
          const right = new THREE.Vector3().crossVectors(forward, cam.up).normalize();
          orbitTargetRef.current.addScaledVector(right, -deltaX * 0.02);
          orbitTargetRef.current.addScaledVector(cam.up, deltaY * 0.02);
        }
      } else {
        orbitAnglesRef.current.theta -= deltaX * 0.008;
        orbitAnglesRef.current.phi = Math.max(0.05, Math.min(Math.PI / 2 - 0.05, orbitAnglesRef.current.phi - deltaY * 0.008));
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    // Check if it was a quick click to raycast select doors or furniture
    if (isMouseDownRef.current && Math.abs(e.clientX - mousePrevRef.current.x) < 4 && Math.abs(e.clientY - mousePrevRef.current.y) < 4) {
      if (mountRef.current && cameraRef.current && sceneRef.current) {
        const rect = mountRef.current.getBoundingClientRect();
        const mouseNorm = new THREE.Vector2(
          ((e.clientX - rect.left) / rect.width) * 2 - 1,
          -((e.clientY - rect.top) / rect.height) * 2 + 1
        );
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouseNorm, cameraRef.current);
        const intersects = raycaster.intersectObjects(sceneRef.current.children, true);

        for (let hit of intersects) {
          let curr: THREE.Object3D | null = hit.object;
          while (curr && curr !== sceneRef.current) {
            if (curr.userData?.isDoor) {
              handleToggleDoor(curr.userData.doorId);
              break;
            }
            if (curr.userData?.isFurniture) {
              setInspectedFurniture(curr.userData.item);
              break;
            }
            curr = curr.parent;
          }
        }
      }
    }

    isMouseDownRef.current = false;
    isMiddlePanningRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    // Native non-passive listener handles wheel zoom and preventDefault; keeping fallback
    e.preventDefault();
    if (viewMode === 'walkthrough') return;
    orbitAnglesRef.current.radius = Math.max(5, Math.min(45, orbitAnglesRef.current.radius + e.deltaY * 0.02));
  };

  // Virtual On-Screen Walkthrough Navigation Handlers
  const handleWalkStep = (dir: 'forward' | 'backward' | 'left' | 'right') => {
    const step = 0.4;
    const yaw = playerYawRef.current;
    const fwd = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
    const rgt = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
    const delta = new THREE.Vector3(0, 0, 0);

    if (dir === 'forward') delta.addScaledVector(fwd, step);
    if (dir === 'backward') delta.addScaledVector(fwd, -step);
    if (dir === 'left') delta.addScaledVector(rgt, -step);
    if (dir === 'right') delta.addScaledVector(rgt, step);

    playerPosRef.current.x = Math.max(0.4, Math.min(8.6, playerPosRef.current.x + delta.x));
    playerPosRef.current.z = Math.max(0.4, Math.min(10.6, playerPosRef.current.z + delta.z));
    setMiniMapPos({ x: playerPosRef.current.x, z: playerPosRef.current.z, yaw: playerYawRef.current });
  };

  const handleWalkTurn = (dir: 'left' | 'right') => {
    playerYawRef.current += dir === 'left' ? 0.35 : -0.35;
    setMiniMapPos({ x: playerPosRef.current.x, z: playerPosRef.current.z, yaw: playerYawRef.current });
  };

  const handleWalkLook = (dir: 'up' | 'down') => {
    playerPitchRef.current = Math.max(-1.2, Math.min(1.2, playerPitchRef.current + (dir === 'up' ? 0.25 : -0.25)));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4 select-none">
      {/* 3D VIEWPORT CONTAINER */}
      <div 
        ref={viewportContainerRef}
        className="relative w-full h-[620px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* Three.js Canvas Mount */}
        <div ref={mountRef} className="w-full h-full" />

        {/* Minimal Spec Badge (Top-Left) */}
        <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-700/80 text-white shadow-lg pointer-events-none z-10 flex items-center gap-2.5">
          <Box className="w-4 h-4 text-indigo-400" />
          <div className="text-xs">
            <span className="font-bold text-slate-100 block">Eksplorasi 3D &amp; SketchUp Live</span>
            <span className="text-[11px] text-slate-400 block">
              Mode: <strong className="text-indigo-300 capitalize">{viewMode}</strong> • {selectedFloor === 'all' ? 'Kedua Lantai' : (selectedFloor === 'GF' ? 'Lantai 1' : 'Lantai 2')}
            </span>
            <span className="text-[10px] text-indigo-300/90 block mt-0.5">
              Scroll: Zoom • Klik Kiri Drag: Orbit 360° • Klik Kanan / Scroll Klik: Pan Geser
            </span>
          </div>
        </div>

        {/* 3D Material & Roof Customizer Quick Button & Floating Drawer (Top-Right when not in walkthrough) */}
        {viewMode !== 'walkthrough' && onUpdateDesign && design && (
          <div
            className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsMaterialDrawerOpen(!isMaterialDrawerOpen)}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-xl border border-indigo-400/50 flex items-center gap-2 cursor-pointer transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isMaterialDrawerOpen ? 'Tutup Kustom 3D' : '🎨 Kustom Atap, Dinding & Lantai'}</span>
            </button>

            {isMaterialDrawerOpen && (() => {
              const roofCfg = design.roofConfig || DEFAULT_ROOF_CONFIG;
              const allRooms = [...(design.groundFloorRooms || []), ...(design.secondFloorRooms || [])];
              const targetRoom = allRooms.find(r => r.id === targetRoomId3D) || allRooms[0];

              const handleUpdateRoof = (patch: Partial<RoofConfig>) => {
                setShowRoof3D(true);
                onUpdateDesign(prev => ({
                  ...prev,
                  roofConfig: {
                    ...(prev.roofConfig || DEFAULT_ROOF_CONFIG),
                    ...patch,
                  },
                }));
              };

              const handleUpdateFloorOrWall = (patch: Partial<RoomData>) => {
                onUpdateDesign(prev => ({
                  ...prev,
                  groundFloorRooms: prev.groundFloorRooms.map(r =>
                    targetRoomId3D === 'all' || r.id === targetRoomId3D ? { ...r, ...patch } : r
                  ),
                  secondFloorRooms: prev.secondFloorRooms.map(r =>
                    targetRoomId3D === 'all' || r.id === targetRoomId3D ? { ...r, ...patch } : r
                  ),
                }));
              };

              return (
                <div className="w-80 sm:w-96 max-h-[430px] overflow-y-auto bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-2xl p-4 text-white shadow-2xl space-y-3.5 text-xs">
                  {/* 1. Model Atap & Dinding Atap */}
                  <div className="space-y-2 pb-3 border-b border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-indigo-300 uppercase tracking-wider text-[10px]">
                        1. Model Atap Memanjang &amp; Dinding Atap
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowRoof3D(!showRoof3D)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border cursor-pointer ${
                          showRoof3D
                            ? 'bg-emerald-600 text-white border-emerald-500'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {showRoof3D ? 'Atap 3D: Tampil' : 'Atap 3D: Sembunyi'}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      {ROOF_STYLE_OPTIONS.map(st => (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => handleUpdateRoof({ style: st.id })}
                          className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                            roofCfg.style === st.id
                              ? 'bg-indigo-600 text-white border-indigo-400'
                              : 'bg-slate-800/90 text-slate-300 border-slate-700 hover:bg-slate-800'
                          }`}
                        >
                          <span className="font-bold text-[10px] block leading-tight">{st.name}</span>
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">Penutup Atap:</label>
                        <select
                          value={roofCfg.material}
                          onChange={(e) => handleUpdateRoof({ material: e.target.value as RoofMaterialType })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-slate-200"
                        >
                          {ROOF_MATERIAL_OPTIONS.map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">Dinding Atap/Parapet:</label>
                        <select
                          value={roofCfg.wallFinish}
                          onChange={(e) => handleUpdateRoof({ wallFinish: e.target.value as RoofWallFinishType })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-slate-200"
                        >
                          {ROOF_WALL_FINISH_OPTIONS.map(w => (
                            <option key={w.id} value={w.id}>{w.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Target Room Selector for Wall & Floor */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-amber-300 uppercase tracking-wider text-[10px] block">
                      2. Pilih Ruangan untuk Kustom Dinding &amp; Lantai:
                    </label>
                    <select
                      value={targetRoomId3D}
                      onChange={(e) => setTargetRoomId3D(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-semibold"
                    >
                      <option value="all">🌟 Semua Ruangan Sekaligus</option>
                      <optgroup label="Lantai 1 (Termasuk Taman Belakang)">
                        {design.groundFloorRooms.map(r => (
                          <option key={r.id} value={r.id}>{r.indonesianName}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Lantai 2">
                        {design.secondFloorRooms.map(r => (
                          <option key={r.id} value={r.id}>{r.indonesianName}</option>
                        ))}
                      </optgroup>
                    </select>
                  </div>

                  {/* 3. Material Lantai & Rumput Taman Belakang */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-slate-300 font-semibold block">
                      Material Lantai / Taman (6 Pilihan):
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {FLOOR_FINISH_OPTIONS.map(opt => {
                        const isSelected = (targetRoom?.floorFinish || 'ceramic') === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => handleUpdateFloorOrWall({ floorFinish: opt.id })}
                            className={`p-1.5 rounded-lg border text-left flex items-center gap-1.5 cursor-pointer ${
                              isSelected
                                ? 'bg-amber-600 text-white border-amber-400'
                                : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
                            }`}
                          >
                            <span
                              className="w-3.5 h-3.5 rounded border border-white/30 shrink-0"
                              style={{ backgroundColor: opt.hexColor }}
                            />
                            <span className="text-[10px] font-bold truncate">{opt.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 4. Warna & Finishing Dinding */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-300 font-semibold">
                        Warna &amp; Material Dinding:
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-400">Cat Bebas:</span>
                        <input
                          type="color"
                          value={targetRoom?.wallColor || '#f8fafc'}
                          onChange={(e) => handleUpdateFloorOrWall({ wallFinish: 'white', wallColor: e.target.value })}
                          className="w-6 h-5 rounded border border-slate-600 cursor-pointer p-0 bg-transparent"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {WALL_FINISH_OPTIONS.map(opt => {
                        const isSelected = (targetRoom?.wallFinish || 'white') === opt.id && !targetRoom?.wallColor;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => handleUpdateFloorOrWall({ wallFinish: opt.id, wallColor: undefined })}
                            className={`p-1.5 rounded-lg border text-left flex items-center gap-1.5 cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-600 text-white border-indigo-400'
                                : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
                            }`}
                          >
                            <span
                              className="w-3 h-3 rounded-full border border-white/30 shrink-0"
                              style={{ backgroundColor: opt.hexColor }}
                            />
                            <span className="text-[9.5px] font-bold truncate">{opt.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Door notice banner */}
        {doorNotice && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-950 font-bold px-4 py-1.5 rounded-full text-xs shadow-xl z-30 flex items-center gap-2">
            <DoorOpen className="w-4 h-4" />
            <span>{doorNotice}</span>
          </div>
        )}

        {/* WALKTHROUGH HUD & ON-SCREEN CONTROLS (Ala Street View / FPS) */}
        {viewMode === 'walkthrough' && (
          <>
            {/* Top Right Walkthrough Navigator */}
            <div className="absolute top-4 right-4 bg-slate-900/95 backdrop-blur-md p-3.5 rounded-xl border border-slate-700/80 text-white shadow-xl text-xs z-20 max-w-xs space-y-2.5">
              <div className="font-bold text-amber-400 flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5">
                  <Footprints className="w-4 h-4" />
                  <span>Jelajah Orang Pertama (Walkthrough)</span>
                </div>
                <button 
                  onClick={() => setViewMode('dollhouse')}
                  className="text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2 py-0.5 rounded cursor-pointer border border-slate-700"
                >
                  Keluar
                </button>
              </div>

              {/* Floor Switcher for Walkthrough */}
              <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px] font-semibold">
                <span className="text-slate-400 px-1">Lantai:</span>
                <button
                  onClick={() => handleToggleWalkFloor('GF')}
                  className={`flex-1 py-1 rounded cursor-pointer ${
                    walkFloorState === 'GF' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Lantai 1 (1.6m)
                </button>
                <button
                  onClick={() => handleToggleWalkFloor('2F')}
                  className={`flex-1 py-1 rounded cursor-pointer ${
                    walkFloorState === '2F' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Lantai 2 (5.2m)
                </button>
              </div>

              {/* Teleport Selector */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block">
                  Teleport ke Ruangan:
                </label>
                <select
                  aria-label="Pilih Titik Masuk Walkthrough"
                  onChange={(e) => handleTeleport(e.target.value)}
                  defaultValue="pintu-masuk"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <optgroup label="Lantai 1">
                    {SPAWN_POINTS.filter(p => p.floor === 'GF').map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Lantai 2">
                    {SPAWN_POINTS.filter(p => p.floor === '2F').map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div className="text-slate-300 text-[11px] space-y-0.5 pt-1 border-t border-slate-800">
                <div>• Drag mouse: <strong>Lihat Sekeliling (Pan/Tilt)</strong></div>
                <div>• Keyboard: <strong>W/A/S/D</strong> atau tombol D-Pad bawah</div>
                <div>• Klik pintu: <strong>Buka / Tutup Pintu</strong></div>
                <div>• Klik perabot: <strong>Lihat Detail Ukuran</strong></div>
              </div>
            </div>

            {/* Virtual On-Screen D-Pad / Nav Buttons (Bottom-Left) */}
            <div className="absolute bottom-24 left-6 z-20 bg-slate-900/90 backdrop-blur-md p-3 rounded-2xl border border-slate-700/80 shadow-2xl flex flex-col items-center gap-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Kemudi Jalan</span>
              <button
                onClick={() => handleWalkStep('forward')}
                className="w-10 h-10 bg-slate-800 hover:bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-sm cursor-pointer active:scale-95 transition-all"
                title="Maju (W)"
              >
                <ArrowUp className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleWalkStep('left')}
                  className="w-10 h-10 bg-slate-800 hover:bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-sm cursor-pointer active:scale-95 transition-all"
                  title="Geser Kiri (A)"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleWalkStep('backward')}
                  className="w-10 h-10 bg-slate-800 hover:bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-sm cursor-pointer active:scale-95 transition-all"
                  title="Mundur (S)"
                >
                  <ArrowDown className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleWalkStep('right')}
                  className="w-10 h-10 bg-slate-800 hover:bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-sm cursor-pointer active:scale-95 transition-all"
                  title="Geser Kanan (D)"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>

              {/* Turn & Look buttons */}
              <div className="grid grid-cols-4 gap-1 mt-1 pt-1 border-t border-slate-800 w-full text-[10px]">
                <button
                  onClick={() => handleWalkTurn('left')}
                  className="bg-slate-800 hover:bg-slate-700 py-1 text-slate-200 rounded font-bold cursor-pointer"
                  title="Putar Kiri"
                >
                  ↺
                </button>
                <button
                  onClick={() => handleWalkLook('up')}
                  className="bg-slate-800 hover:bg-slate-700 py-1 text-slate-200 rounded font-bold cursor-pointer"
                  title="Lihat Atas"
                >
                  ▲
                </button>
                <button
                  onClick={() => handleWalkLook('down')}
                  className="bg-slate-800 hover:bg-slate-700 py-1 text-slate-200 rounded font-bold cursor-pointer"
                  title="Lihat Bawah"
                >
                  ▼
                </button>
                <button
                  onClick={() => handleWalkTurn('right')}
                  className="bg-slate-800 hover:bg-slate-700 py-1 text-slate-200 rounded font-bold cursor-pointer"
                  title="Putar Kanan"
                >
                  ↻
                </button>
              </div>
            </div>

            {/* Compact Mini-Map (Bottom-Right) */}
            <div className="absolute bottom-24 right-6 z-20 bg-slate-900/90 backdrop-blur-md p-2 rounded-2xl border border-slate-700 shadow-xl hidden sm:block">
              <div className="text-[10px] text-slate-400 font-bold mb-1 flex items-center justify-between">
                <span>Peta Posisi (9×11m)</span>
                <span className="text-amber-400">{walkFloorState}</span>
              </div>
              <svg width="120" height="146" viewBox="0 0 9 11" className="bg-slate-950 rounded-lg border border-slate-800">
                {/* Rooms outline */}
                {(walkFloorState === 'GF' ? (design?.groundFloorRooms || []) : (design?.secondFloorRooms || [])).map(r => (
                  <rect
                    key={r.id}
                    x={r.x}
                    y={r.y}
                    width={r.width}
                    height={r.depth}
                    fill={r.status === 'existing' ? '#d97706' : '#4f46e5'}
                    fillOpacity="0.25"
                    stroke="#475569"
                    strokeWidth="0.1"
                  />
                ))}

                {/* Player dot & vision cone */}
                <g transform={`translate(${miniMapPos.x}, ${miniMapPos.z}) rotate(${(-miniMapPos.yaw * 180) / Math.PI})`}>
                  <path d="M 0 0 L -1.5 -3.5 L 1.5 -3.5 Z" fill="#38bdf8" fillOpacity="0.45" />
                  <circle cx="0" cy="0" r="0.4" fill="#38bdf8" stroke="#ffffff" strokeWidth="0.15" />
                </g>
              </svg>
            </div>
          </>
        )}

        {/* FURNITURE INSPECTOR POPUP (Shown when user clicks any furniture in 3D) */}
        {inspectedFurniture && (
          <div className="absolute top-16 right-4 z-30 bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-2xl p-4 shadow-2xl text-white max-w-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Box className="w-4 h-4 text-indigo-400" />
                <h4 className="font-bold text-sm text-slate-100">{inspectedFurniture.name}</h4>
              </div>
              <button 
                onClick={() => setInspectedFurniture(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950 p-2.5 rounded-xl border border-slate-800 font-mono">
              <div>
                <span className="text-slate-400 text-[10px] block">Panjang (P):</span>
                <strong className="text-indigo-300">{(inspectedFurniture.width * 100).toFixed(0)} cm ({inspectedFurniture.width} m)</strong>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Lebar / Depth (L):</span>
                <strong className="text-indigo-300">{(inspectedFurniture.depth * 100).toFixed(0)} cm ({inspectedFurniture.depth} m)</strong>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Tinggi (T):</span>
                <strong className="text-indigo-300">{((inspectedFurniture.height || 0.8) * 100).toFixed(0)} cm</strong>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Orientasi Hadap:</span>
                <strong className="text-indigo-300">{inspectedFurniture.rotation || 0}°</strong>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-slate-300 leading-relaxed bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
              <div className="font-semibold text-amber-400 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" />
                <span>Panduan Arsitektural &amp; Ergonomi:</span>
              </div>
              {inspectedFurniture.category === 'bedroom' && (
                <p className="text-[11px]">
                  Kepala kasur bersandar kokoh pada dinding. Clearance keliling ranjang minimal <strong>60-80 cm</strong> untuk akses sirkulasi sprei dan jalan.
                </p>
              )}
              {inspectedFurniture.type === 'sofa-l' && (
                <p className="text-[11px]">
                  Sofa sudut format L memberikan kapasitas duduk 5-6 orang tanpa memotong alur sirkulasi menuju pintu masuk utama dan koridor.
                </p>
              )}
              {inspectedFurniture.type === 'dining-table' && (
                <p className="text-[11px]">
                  Kapasitas 6 kursi. Ruang tarik kursi minimal <strong>75 cm</strong> dari bibir meja agar pengguna dapat duduk dengan nyaman.
                </p>
              )}
              {inspectedFurniture.type === 'toilet' && (
                <p className="text-[11px]">
                  Kloset duduk dengan clearance depan minimal <strong>60 cm</strong> dan samping <strong>20 cm</strong> sesuai SNI Sanitasi Rumah Tinggal.
                </p>
              )}
              {inspectedFurniture.type === 'washing-machine' && (
                <p className="text-[11px]">
                  Area mesin cuci bukaan depan menghadap kiri langsung dekat jalur kran air bersih dan floor drain pembuangan limbah greywater.
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => {
                  inspectedFurniture.rotation = ((inspectedFurniture.rotation || 0) + 90) % 360;
                  setInspectedFurniture({ ...inspectedFurniture });
                }}
                className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold text-xs cursor-pointer shadow-sm transition-all"
              >
                Putar 90°
              </button>
              <button
                onClick={() => setInspectedFurniture(null)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        )}

        {/* ERGONOMIC COLLAPSIBLE BOTTOM CONTROL DOCK (Zero Viewport Occlusion) */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-[94%] max-w-4xl z-20 transition-all duration-300">
          <div className="flex justify-center mb-1">
            <button
              onClick={() => setIsHudCollapsed(!isHudCollapsed)}
              className="bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white px-3 py-1 rounded-full text-xs font-semibold border border-slate-700 shadow-md backdrop-blur-md flex items-center gap-1.5 cursor-pointer"
            >
              {isHudCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              <span>{isHudCollapsed ? 'Tampilkan Kontrol 3D' : 'Sembunyikan Kontrol'}</span>
            </button>
          </div>

          {!isHudCollapsed && (
            <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-2xl p-3.5 shadow-2xl space-y-3">
              {/* Row 1: View Modes & Floor Nav */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5 text-xs">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-slate-400 font-medium mr-1 hidden sm:inline">Perspektif:</span>
                  {(['dollhouse', 'exterior', 'walkthrough', 'isometric', 'top-down'] as ViewMode3D[]).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                        viewMode === mode
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                      }`}
                    >
                      {mode === 'dollhouse' && 'Dollhouse Potongan'}
                      {mode === 'exterior' && 'Eksterior'}
                      {mode === 'walkthrough' && '🚶 Jelajah Berjalan'}
                      {mode === 'isometric' && 'Isometrik'}
                      {mode === 'top-down' && 'Tampak Atas'}
                    </button>
                  ))}
                </div>

                {/* Floor Navigator */}
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 font-bold">
                  <button
                    onClick={() => setSelectedFloor('all')}
                    className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                      selectedFloor === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Semua
                  </button>
                  <button
                    onClick={() => setSelectedFloor('GF')}
                    className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                      selectedFloor === 'GF' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Lantai 1
                  </button>
                  <button
                    onClick={() => setSelectedFloor('2F')}
                    className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                      selectedFloor === '2F' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Lantai 2
                  </button>
                </div>
              </div>

              {/* Row 2: Visibility Toggles & Lighting */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-slate-400 font-medium mr-1 hidden sm:inline">Visibilitas:</span>
                  <button
                    onClick={() => setVisibilities({ ...visibilities, furniture: !visibilities.furniture })}
                    className={`px-2 py-1 rounded-lg border font-medium cursor-pointer ${
                      visibilities.furniture ? 'bg-indigo-900/60 text-indigo-300 border-indigo-700' : 'bg-slate-800 text-slate-500 border-slate-700'
                    }`}
                  >
                    Perabot
                  </button>
                  <button
                    onClick={() => setVisibilities({ ...visibilities, prohibitedZone: !visibilities.prohibitedZone })}
                    className={`px-2 py-1 rounded-lg border font-medium cursor-pointer ${
                      visibilities.prohibitedZone ? 'bg-rose-950/70 text-rose-300 border-rose-800' : 'bg-slate-800 text-slate-500 border-slate-700'
                    }`}
                  >
                    Zona Bahaya 2F
                  </button>
                  <button
                    onClick={() => setShowRoof3D(!showRoof3D)}
                    className={`px-2.5 py-1 rounded-lg border font-bold cursor-pointer ${
                      showRoof3D || viewMode === 'exterior'
                        ? 'bg-amber-600 text-white border-amber-500'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    🏠 Atap 3D
                  </button>
                  <button
                    onClick={() => setIsTransparentWalls(!isTransparentWalls)}
                    className={`px-2 py-1 rounded-lg border font-medium cursor-pointer ${
                      isTransparentWalls ? 'bg-cyan-950 text-cyan-300 border-cyan-800' : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    Dinding Transparan
                  </button>
                </div>

                {/* Day / Night Toggle */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      orbitAnglesRef.current = { theta: Math.PI / 5, phi: Math.PI / 3.5, radius: 18 };
                      orbitTargetRef.current = new THREE.Vector3(4.5, 2.0, 5.5);
                      setViewMode('dollhouse');
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
                    title="Reset kamera ke sudut pandang awal"
                  >
                    <RotateCw className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Reset Kamera</span>
                  </button>
                  <button
                    onClick={() => setLightingMode(lightingMode === 'day' ? 'night' : 'day')}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
                  >
                    {lightingMode === 'day' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-400" />}
                    <span>{lightingMode === 'day' ? 'Siang Tropis' : 'Malam (Lampu Hangat)'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
