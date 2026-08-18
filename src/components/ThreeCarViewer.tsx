import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { PanelId, PanelDamage, DentSize, VehicleInfo } from '../types';
import { PANEL_CONFIGS } from '../data/matrix';
import { getHexColor, POPULAR_VEHICLE_PRESETS } from '../data/vehicleSpecs';
import { 
  Camera, 
  RotateCw, 
  Layers, 
  Eye, 
  Maximize2, 
  Palette, 
  Sparkles, 
  Info,
  CheckCircle2,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  Car,
  ScanLine,
  Sliders,
  Zap,
  ShieldCheck,
  Send,
  FileCheck
} from 'lucide-react';

interface ThreeCarViewerProps {
  panels: Record<PanelId, PanelDamage>;
  selectedPanelId: PanelId | null;
  onSelectPanel: (panelId: PanelId) => void;
  vehicle?: VehicleInfo;
  bodyClass?: string;
  vehicleColor?: string;
  isPinDropMode?: boolean;
  onAddPin?: (panelId: PanelId, x: number, y: number, z: number) => void;
  onOpenArScanner?: () => void;
  onOpenVehicleEditor?: () => void;
  onOpenReportModal?: () => void;
  isDay?: boolean;
}

const CAR_COLORS = [
  { name: 'Pearl White Multi-Coat', hex: 0xf2f2f2, roughness: 0.15, metalness: 0.35, clearcoat: 0.95 },
  { name: 'Solid Black', hex: 0x0d0d0e, roughness: 0.1, metalness: 0.2, clearcoat: 1.0 },
  { name: 'Midnight Silver Metallic', hex: 0x3b3f46, roughness: 0.18, metalness: 0.85, clearcoat: 0.9 },
  { name: 'Deep Blue Metallic', hex: 0x163166, roughness: 0.2, metalness: 0.8, clearcoat: 0.9 },
  { name: 'Ultra Red Metallic', hex: 0xa81427, roughness: 0.22, metalness: 0.75, clearcoat: 0.95 },
  { name: 'Quicksilver Metallic', hex: 0x959ca8, roughness: 0.18, metalness: 0.85, clearcoat: 0.9 },
];

export const ThreeCarViewer: React.FC<ThreeCarViewerProps> = ({
  panels,
  selectedPanelId,
  onSelectPanel,
  vehicle,
  bodyClass = 'Sedan',
  vehicleColor = 'Pearl White Multi-Coat',
  isPinDropMode = false,
  onAddPin,
  onOpenArScanner,
  onOpenVehicleEditor,
  onOpenReportModal,
  isDay = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const carGroupRef = useRef<THREE.Group | null>(null);
  const panelMeshesRef = useRef<Map<PanelId, THREE.Mesh[]>>(new Map());
  const dentMarkersGroupRef = useRef<THREE.Group | null>(null);
  const reqIdRef = useRef<number | null>(null);

  // Derive archetype from vehicle info
  const vehicleArchetype = vehicle?.archetype || 
    (vehicle?.make?.toLowerCase().includes('tesla') ? 'tesla_model3' : 
     bodyClass.toLowerCase().includes('truck') ? 'truck' :
     bodyClass.toLowerCase().includes('suv') ? 'suv' : 'sedan');

  // Derive active hex color safely as number
  const rawHexStr = vehicle?.colorHex || getHexColor(vehicleColor);
  const parsedHex = parseInt(rawHexStr.replace('#', ''), 16);
  const safeHexNumber = isNaN(parsedHex) ? 0xf2f2f2 : parsedHex;

  const [activeColor, setActiveColor] = useState(() => {
    const matched = CAR_COLORS.find(c => c.name.toLowerCase() === vehicleColor.toLowerCase());
    return matched || {
      name: vehicleColor,
      hex: safeHexNumber,
      roughness: vehicle?.paintFinish === 'matte' ? 0.65 : vehicle?.paintFinish === 'metallic' ? 0.2 : 0.15,
      metalness: vehicle?.paintFinish === 'metallic' ? 0.8 : 0.35,
      clearcoat: vehicle?.paintFinish === 'matte' ? 0.1 : 0.95,
    };
  });

  const [isAutoRotating, setIsAutoRotating] = useState(false);
  const [hoveredPanel, setHoveredPanel] = useState<PanelId | null>(null);
  const [viewPreset, setViewPreset] = useState<'iso' | 'front' | 'left' | 'right' | 'rear' | 'top'>('iso');
  const [showDentBadges, setShowDentBadges] = useState(true);

  // Camera Control Refs
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const targetRotationRef = useRef({ x: 0.35, y: -0.75 });
  const currentRotationRef = useRef({ x: 0.35, y: -0.75 });
  const targetDistanceRef = useRef(7.5);
  const currentDistanceRef = useRef(7.5);
  const activePointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const initialPinchDistRef = useRef<number | null>(null);

  // Sync color with vehicle prop changes
  useEffect(() => {
    if (vehicle?.colorHex) {
      const hexNum = parseInt(vehicle.colorHex.replace('#', ''), 16);
      if (!isNaN(hexNum)) {
        setActiveColor({
          name: vehicle.color || 'Custom Paint',
          hex: hexNum,
          roughness: vehicle.paintFinish === 'matte' ? 0.65 : vehicle.paintFinish === 'metallic' ? 0.2 : 0.15,
          metalness: vehicle.paintFinish === 'metallic' ? 0.8 : 0.35,
          clearcoat: vehicle.paintFinish === 'matte' ? 0.1 : 0.95,
        });
      }
    }
  }, [vehicle?.colorHex, vehicle?.paintFinish, vehicle?.color]);

  // Build Procedural 3D Car Model with Panel Segmentation
  const buildCarModel = useCallback((scene: THREE.Scene) => {
    if (carGroupRef.current) {
      scene.remove(carGroupRef.current);
    }

    panelMeshesRef.current.clear();

    const car = new THREE.Group();
    carGroupRef.current = car;

    const isTeslaModel3 = vehicleArchetype === 'tesla_model3' || (vehicle?.make?.toLowerCase().includes('tesla') && (vehicle?.model?.toLowerCase().includes('3') || !vehicle?.model));
    const isTeslaModelY = vehicleArchetype === 'tesla_modely' || (vehicle?.make?.toLowerCase().includes('tesla') && vehicle?.model?.toLowerCase().includes('y'));
    const isCybertruck = vehicleArchetype === 'tesla_cybertruck' || (vehicle?.make?.toLowerCase().includes('tesla') && vehicle?.model?.toLowerCase().includes('cyber'));
    const isTruck = vehicleArchetype === 'truck' || bodyClass.toLowerCase().includes('truck') || bodyClass.toLowerCase().includes('pickup');
    const isSUV = !isTruck && (vehicleArchetype === 'suv' || isTeslaModelY || bodyClass.toLowerCase().includes('suv') || bodyClass.toLowerCase().includes('crossover'));

    // Base Automotive Clearcoat Paint Material
    const basePaintMaterial = new THREE.MeshPhysicalMaterial({
      color: activeColor.hex,
      roughness: activeColor.roughness || 0.15,
      metalness: activeColor.metalness || 0.4,
      clearcoat: activeColor.clearcoat || 0.95,
      clearcoatRoughness: 0.05,
      reflectivity: 0.9,
    });

    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x18202c,
      roughness: 0.05,
      metalness: 0.1,
      transmission: 0.85,
      thickness: 0.5,
      transparent: true,
      opacity: 0.9,
    });

    const teslaRoofGlassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x0f141c, // Tinted UV panoramic roof
      roughness: 0.04,
      metalness: 0.15,
      transmission: 0.75,
      transparent: true,
      opacity: 0.92,
      reflectivity: 0.95,
    });

    const darkTrimMaterial = new THREE.MeshStandardMaterial({
      color: 0x121417,
      roughness: 0.7,
      metalness: 0.2,
    });

    const chromeMaterial = new THREE.MeshStandardMaterial({
      color: 0xe0e6ed,
      roughness: 0.1,
      metalness: 0.95,
    });

    const lightMaterial = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      emissive: 0xe2e8f0,
      emissiveIntensity: 0.95,
      roughness: 0.1,
    });

    const tailLightMaterial = new THREE.MeshStandardMaterial({
      color: 0xdc2626,
      emissive: 0xb91c1c,
      emissiveIntensity: 0.8,
      roughness: 0.2,
    });

    const tireMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1c20,
      roughness: 0.85,
      metalness: 0.1,
    });

    const rimMaterial = new THREE.MeshStandardMaterial({
      color: isTeslaModel3 ? 0x2d3139 : 0xc0c6cc, // Aero wheel dark graphite or silver alloy
      roughness: 0.2,
      metalness: 0.85,
    });

    const heightFactor = isSUV ? 1.25 : isTruck ? 1.35 : 1.0;
    const roofHeight = isSUV ? 1.45 : isTruck ? 1.55 : 1.22;

    const registerMeshToPanel = (panelId: PanelId, mesh: THREE.Mesh) => {
      mesh.userData = { panelId, isCarPanel: true };
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      car.add(mesh);

      const existing = panelMeshesRef.current.get(panelId) || [];
      existing.push(mesh);
      panelMeshesRef.current.set(panelId, existing);
    };

    // -------------------------------------------------------------
    // ARCHETYPE GEOMETRIES:
    // -------------------------------------------------------------
    if (isTeslaModel3) {
      // ============================================================
      // 1. TESLA MODEL 3 / EV AERO SEDAN ARCHITECTURE
      // ============================================================
      // (a) Hood: Sleek, low-slung, sculpted aerodynamically
      const hoodGeo = new THREE.BoxGeometry(1.56, 0.07, 1.35);
      const hoodMesh = new THREE.Mesh(hoodGeo, basePaintMaterial.clone());
      hoodMesh.position.set(0, 0.70, 1.22);
      hoodMesh.rotation.x = 0.07;
      registerMeshToPanel('hood', hoodMesh);

      // (b) Roof: Full-Length Panoramic Glass Canopy extending seamlessly
      const roofGeo = new THREE.BoxGeometry(1.42, 0.06, 1.6);
      const roofMesh = new THREE.Mesh(roofGeo, basePaintMaterial.clone());
      roofMesh.position.set(0, 1.24, -0.05);
      registerMeshToPanel('roof', roofMesh);

      // Glass Roof Panel Overlay
      const glassDomeGeo = new THREE.BoxGeometry(1.36, 0.08, 1.55);
      const glassDomeMesh = new THREE.Mesh(glassDomeGeo, teslaRoofGlassMaterial);
      glassDomeMesh.position.set(0, 1.25, -0.05);
      car.add(glassDomeMesh);

      // (c) Decklid / Trunk: Sleek aerodynamic ducktail spoiler curve
      const decklidGeo = new THREE.BoxGeometry(1.48, 0.08, 0.82);
      const decklidMesh = new THREE.Mesh(decklidGeo, basePaintMaterial.clone());
      decklidMesh.position.set(0, 0.78, -1.55);
      decklidMesh.rotation.x = -0.08;
      registerMeshToPanel('decklid', decklidMesh);

      // (d) Front Fenders (Left & Right)
      const lFenderGeo = new THREE.BoxGeometry(0.18, 0.54, 1.32);
      const lFenderMesh = new THREE.Mesh(lFenderGeo, basePaintMaterial.clone());
      lFenderMesh.position.set(-0.82, 0.52, 1.22);
      registerMeshToPanel('leftFender', lFenderMesh);

      const rFenderGeo = new THREE.BoxGeometry(0.18, 0.54, 1.32);
      const rFenderMesh = new THREE.Mesh(rFenderGeo, basePaintMaterial.clone());
      rFenderMesh.position.set(0.82, 0.52, 1.22);
      registerMeshToPanel('rightFender', rFenderMesh);

      // (e) Doors (Flush Aero Door Panels)
      const lfDoorGeo = new THREE.BoxGeometry(0.14, 0.62, 0.94);
      const lfDoorMesh = new THREE.Mesh(lfDoorGeo, basePaintMaterial.clone());
      lfDoorMesh.position.set(-0.83, 0.54, 0.28);
      registerMeshToPanel('leftFrontDoor', lfDoorMesh);

      const rfDoorGeo = new THREE.BoxGeometry(0.14, 0.62, 0.94);
      const rfDoorMesh = new THREE.Mesh(rfDoorGeo, basePaintMaterial.clone());
      rfDoorMesh.position.set(0.83, 0.54, 0.28);
      registerMeshToPanel('rightFrontDoor', rfDoorMesh);

      const lrDoorGeo = new THREE.BoxGeometry(0.14, 0.62, 0.88);
      const lrDoorMesh = new THREE.Mesh(lrDoorGeo, basePaintMaterial.clone());
      lrDoorMesh.position.set(-0.83, 0.54, -0.62);
      registerMeshToPanel('leftRearDoor', lrDoorMesh);

      const rrDoorGeo = new THREE.BoxGeometry(0.14, 0.62, 0.88);
      const rrDoorMesh = new THREE.Mesh(rrDoorGeo, basePaintMaterial.clone());
      rrDoorMesh.position.set(0.83, 0.54, -0.62);
      registerMeshToPanel('rightRearDoor', rrDoorMesh);

      // (f) Quarter Panels (Muscular rear haunches)
      const lQuarterGeo = new THREE.BoxGeometry(0.18, 0.60, 1.12);
      const lQuarterMesh = new THREE.Mesh(lQuarterGeo, basePaintMaterial.clone());
      lQuarterMesh.position.set(-0.82, 0.55, -1.52);
      registerMeshToPanel('leftQuarter', lQuarterMesh);

      const rQuarterGeo = new THREE.BoxGeometry(0.18, 0.60, 1.12);
      const rQuarterMesh = new THREE.Mesh(rQuarterGeo, basePaintMaterial.clone());
      rQuarterMesh.position.set(0.82, 0.55, -1.52);
      registerMeshToPanel('rightQuarter', rQuarterMesh);

      // (g) Roof Rails / Arch
      const lRailGeo = new THREE.BoxGeometry(0.08, 0.10, 2.15);
      const lRailMesh = new THREE.Mesh(lRailGeo, basePaintMaterial.clone());
      lRailMesh.position.set(-0.74, 1.22, -0.12);
      registerMeshToPanel('leftRoofRail', lRailMesh);

      const rRailGeo = new THREE.BoxGeometry(0.08, 0.10, 2.15);
      const rRailMesh = new THREE.Mesh(rRailGeo, basePaintMaterial.clone());
      rRailMesh.position.set(0.74, 1.22, -0.12);
      registerMeshToPanel('rightRoofRail', rRailMesh);

      // (h) Front Bumper (Tesla Smooth Flush Aerodynamic Fascia - No Grill!)
      const fBumperGeo = new THREE.BoxGeometry(1.72, 0.40, 0.38);
      const fBumperMesh = new THREE.Mesh(fBumperGeo, basePaintMaterial.clone());
      fBumperMesh.position.set(0, 0.34, 1.95);
      registerMeshToPanel('frontBumper', fBumperMesh);

      // Lower Cooling Aperture
      const lowerAirIntakeGeo = new THREE.BoxGeometry(0.9, 0.12, 0.05);
      const lowerAirIntakeMesh = new THREE.Mesh(lowerAirIntakeGeo, darkTrimMaterial);
      lowerAirIntakeMesh.position.set(0, 0.22, 2.14);
      car.add(lowerAirIntakeMesh);

      // (i) Rear Bumper & Aero Diffuser
      const rBumperGeo = new THREE.BoxGeometry(1.72, 0.42, 0.35);
      const rBumperMesh = new THREE.Mesh(rBumperGeo, basePaintMaterial.clone());
      rBumperMesh.position.set(0, 0.35, -2.00);
      registerMeshToPanel('rearBumper', rBumperMesh);

      const rDiffuserGeo = new THREE.BoxGeometry(1.4, 0.15, 0.08);
      const rDiffuserMesh = new THREE.Mesh(rDiffuserGeo, darkTrimMaterial);
      rDiffuserMesh.position.set(0, 0.20, -2.16);
      car.add(rDiffuserMesh);

      // Windshield & Rear Glass (Aero Rake)
      const windshieldGeo = new THREE.BoxGeometry(1.42, 0.72, 0.05);
      const windshieldMesh = new THREE.Mesh(windshieldGeo, teslaRoofGlassMaterial);
      windshieldMesh.position.set(0, 1.05, 0.65);
      windshieldMesh.rotation.x = -0.66;
      car.add(windshieldMesh);

      const rearWindowGeo = new THREE.BoxGeometry(1.40, 0.76, 0.05);
      const rearWindowMesh = new THREE.Mesh(rearWindowGeo, teslaRoofGlassMaterial);
      rearWindowMesh.position.set(0, 1.06, -1.05);
      rearWindowMesh.rotation.x = 0.68;
      car.add(rearWindowMesh);

      // Headlight Blades
      const lLightGeo = new THREE.BoxGeometry(0.38, 0.10, 0.12);
      const lLightMesh = new THREE.Mesh(lLightGeo, lightMaterial);
      lLightMesh.position.set(-0.64, 0.58, 1.94);
      lLightMesh.rotation.y = 0.15;
      car.add(lLightMesh);

      const rLightGeo = new THREE.BoxGeometry(0.38, 0.10, 0.12);
      const rLightMesh = new THREE.Mesh(rLightGeo, lightMaterial);
      rLightMesh.position.set(0.64, 0.58, 1.94);
      rLightMesh.rotation.y = -0.15;
      car.add(rLightMesh);

      // Taillight Lightbar Blades
      const lTailGeo = new THREE.BoxGeometry(0.40, 0.12, 0.08);
      const lTailMesh = new THREE.Mesh(lTailGeo, tailLightMaterial);
      lTailMesh.position.set(-0.65, 0.65, -2.02);
      car.add(lTailMesh);

      const rTailGeo = new THREE.BoxGeometry(0.40, 0.12, 0.08);
      const rTailMesh = new THREE.Mesh(rTailGeo, tailLightMaterial);
      rTailMesh.position.set(0.65, 0.65, -2.02);
      car.add(rTailMesh);

      // Tesla Chrome 'T' Emblem
      const emblemGeo = new THREE.BoxGeometry(0.12, 0.06, 0.04);
      const emblemMesh = new THREE.Mesh(emblemGeo, chromeMaterial);
      emblemMesh.position.set(0, 0.58, 2.05);
      car.add(emblemMesh);

    } else if (isTruck) {
      // ============================================================
      // 2. PICKUP TRUCK ARCHITECTURE (Ford F-150, Silverado, RAM)
      // ============================================================
      const hoodGeo = new THREE.BoxGeometry(1.7, 0.1, 1.5);
      const hoodMesh = new THREE.Mesh(hoodGeo, basePaintMaterial.clone());
      hoodMesh.position.set(0, 0.92, 1.25);
      hoodMesh.rotation.x = 0.04;
      registerMeshToPanel('hood', hoodMesh);

      const roofGeo = new THREE.BoxGeometry(1.58, 0.08, 1.35);
      const roofMesh = new THREE.Mesh(roofGeo, basePaintMaterial.clone());
      roofMesh.position.set(0, 1.58, -0.1);
      registerMeshToPanel('roof', roofMesh);

      const tailgateGeo = new THREE.BoxGeometry(1.65, 0.65, 0.1);
      const tailgateMesh = new THREE.Mesh(tailgateGeo, basePaintMaterial.clone());
      tailgateMesh.position.set(0, 0.72, -2.2);
      registerMeshToPanel('decklid', tailgateMesh);

      const lFenderGeo = new THREE.BoxGeometry(0.2, 0.75, 1.45);
      const lFenderMesh = new THREE.Mesh(lFenderGeo, basePaintMaterial.clone());
      lFenderMesh.position.set(-0.9, 0.65, 1.25);
      registerMeshToPanel('leftFender', lFenderMesh);

      const rFenderGeo = new THREE.BoxGeometry(0.2, 0.75, 1.45);
      const rFenderMesh = new THREE.Mesh(rFenderGeo, basePaintMaterial.clone());
      rFenderMesh.position.set(0.9, 0.65, 1.25);
      registerMeshToPanel('rightFender', rFenderMesh);

      const lfDoorGeo = new THREE.BoxGeometry(0.18, 0.85, 0.95);
      const lfDoorMesh = new THREE.Mesh(lfDoorGeo, basePaintMaterial.clone());
      lfDoorMesh.position.set(-0.9, 0.68, 0.28);
      registerMeshToPanel('leftFrontDoor', lfDoorMesh);

      const rfDoorGeo = new THREE.BoxGeometry(0.18, 0.85, 0.95);
      const rfDoorMesh = new THREE.Mesh(rfDoorGeo, basePaintMaterial.clone());
      rfDoorMesh.position.set(0.9, 0.68, 0.28);
      registerMeshToPanel('rightFrontDoor', rfDoorMesh);

      const lrDoorGeo = new THREE.BoxGeometry(0.18, 0.85, 0.85);
      const lrDoorMesh = new THREE.Mesh(lrDoorGeo, basePaintMaterial.clone());
      lrDoorMesh.position.set(-0.9, 0.68, -0.6);
      registerMeshToPanel('leftRearDoor', lrDoorMesh);

      const rrDoorGeo = new THREE.BoxGeometry(0.18, 0.85, 0.85);
      const rrDoorMesh = new THREE.Mesh(rrDoorGeo, basePaintMaterial.clone());
      rrDoorMesh.position.set(0.9, 0.68, -0.6);
      registerMeshToPanel('rightRearDoor', rrDoorMesh);

      const lBedSideGeo = new THREE.BoxGeometry(0.18, 0.65, 1.35);
      const lBedSideMesh = new THREE.Mesh(lBedSideGeo, basePaintMaterial.clone());
      lBedSideMesh.position.set(-0.9, 0.72, -1.55);
      registerMeshToPanel('leftQuarter', lBedSideMesh);

      const rBedSideGeo = new THREE.BoxGeometry(0.18, 0.65, 1.35);
      const rBedSideMesh = new THREE.Mesh(rBedSideGeo, basePaintMaterial.clone());
      rBedSideMesh.position.set(0.9, 0.72, -1.55);
      registerMeshToPanel('rightQuarter', rBedSideMesh);

      const lRailGeo = new THREE.BoxGeometry(0.08, 0.12, 1.4);
      const lRailMesh = new THREE.Mesh(lRailGeo, basePaintMaterial.clone());
      lRailMesh.position.set(-0.8, 1.58, -0.1);
      registerMeshToPanel('leftRoofRail', lRailMesh);

      const rRailGeo = new THREE.BoxGeometry(0.08, 0.12, 1.4);
      const rRailMesh = new THREE.Mesh(rRailGeo, basePaintMaterial.clone());
      rRailMesh.position.set(0.8, 1.58, -0.1);
      registerMeshToPanel('rightRoofRail', rRailMesh);

      // Bed Liner
      const bedFloorGeo = new THREE.BoxGeometry(1.6, 0.08, 1.35);
      const bedFloorMesh = new THREE.Mesh(bedFloorGeo, darkTrimMaterial);
      bedFloorMesh.position.set(0, 0.42, -1.55);
      car.add(bedFloorMesh);

      // Chrome Bumpers
      const fBumperGeo = new THREE.BoxGeometry(1.85, 0.5, 0.35);
      const fBumperMesh = new THREE.Mesh(fBumperGeo, chromeMaterial);
      fBumperMesh.position.set(0, 0.45, 2.15);
      registerMeshToPanel('frontBumper', fBumperMesh);

      const rBumperGeo = new THREE.BoxGeometry(1.85, 0.45, 0.3);
      const rBumperMesh = new THREE.Mesh(rBumperGeo, chromeMaterial);
      rBumperMesh.position.set(0, 0.48, -2.25);
      registerMeshToPanel('rearBumper', rBumperMesh);

      // Chrome Big Grille
      const grilleGeo = new THREE.BoxGeometry(1.1, 0.55, 0.08);
      const grilleMesh = new THREE.Mesh(grilleGeo, chromeMaterial);
      grilleMesh.position.set(0, 0.75, 2.05);
      car.add(grilleMesh);

      // Windshield & Vertical Rear Window
      const windshieldGeo = new THREE.BoxGeometry(1.48, 0.68, 0.05);
      const windshieldMesh = new THREE.Mesh(windshieldGeo, glassMaterial);
      windshieldMesh.position.set(0, 1.4, 0.72);
      windshieldMesh.rotation.x = -0.52;
      car.add(windshieldMesh);

      const rearCabWinGeo = new THREE.BoxGeometry(1.44, 0.52, 0.05);
      const rearCabWinMesh = new THREE.Mesh(rearCabWinGeo, glassMaterial);
      rearCabWinMesh.position.set(0, 1.42, -0.82);
      car.add(rearCabWinMesh);

    } else {
      // ============================================================
      // 3. SEDAN / SUV ARCHITECTURE (Mercedes GLC, BMW 3, Audi, Porsche)
      // ============================================================
      const hoodGeo = new THREE.BoxGeometry(1.6, 0.08, 1.4);
      const hoodMesh = new THREE.Mesh(hoodGeo, basePaintMaterial.clone());
      hoodMesh.position.set(0, 0.72 * heightFactor, 1.25);
      hoodMesh.rotation.x = 0.08;
      registerMeshToPanel('hood', hoodMesh);

      const roofGeo = new THREE.BoxGeometry(1.48, 0.08, isSUV ? 1.85 : 1.55);
      const roofMesh = new THREE.Mesh(roofGeo, basePaintMaterial.clone());
      roofMesh.position.set(0, roofHeight + 0.04, isSUV ? -0.2 : -0.1);
      roofMesh.rotation.x = -0.02;
      registerMeshToPanel('roof', roofMesh);

      const decklidGeo = isSUV 
        ? new THREE.BoxGeometry(1.5, 0.9, 0.1)
        : new THREE.BoxGeometry(1.5, 0.08, 0.85);
      const decklidMesh = new THREE.Mesh(decklidGeo, basePaintMaterial.clone());
      if (isSUV) {
        decklidMesh.position.set(0, 0.8 * heightFactor, -1.95);
        decklidMesh.rotation.x = -0.15;
      } else {
        decklidMesh.position.set(0, 0.75, -1.6);
        decklidMesh.rotation.x = -0.05;
      }
      registerMeshToPanel('decklid', decklidMesh);

      const lFenderGeo = new THREE.BoxGeometry(0.18, 0.55 * heightFactor, 1.35);
      const lFenderMesh = new THREE.Mesh(lFenderGeo, basePaintMaterial.clone());
      lFenderMesh.position.set(-0.84, 0.52 * heightFactor, 1.25);
      registerMeshToPanel('leftFender', lFenderMesh);

      const rFenderGeo = new THREE.BoxGeometry(0.18, 0.55 * heightFactor, 1.35);
      const rFenderMesh = new THREE.Mesh(rFenderGeo, basePaintMaterial.clone());
      rFenderMesh.position.set(0.84, 0.52 * heightFactor, 1.25);
      registerMeshToPanel('rightFender', rFenderMesh);

      const lfDoorGeo = new THREE.BoxGeometry(0.15, 0.65 * heightFactor, 0.95);
      const lfDoorMesh = new THREE.Mesh(lfDoorGeo, basePaintMaterial.clone());
      lfDoorMesh.position.set(-0.85, 0.54 * heightFactor, 0.25);
      registerMeshToPanel('leftFrontDoor', lfDoorMesh);

      const rfDoorGeo = new THREE.BoxGeometry(0.15, 0.65 * heightFactor, 0.95);
      const rfDoorMesh = new THREE.Mesh(rfDoorGeo, basePaintMaterial.clone());
      rfDoorMesh.position.set(0.85, 0.54 * heightFactor, 0.25);
      registerMeshToPanel('rightFrontDoor', rfDoorMesh);

      const lrDoorGeo = new THREE.BoxGeometry(0.15, 0.65 * heightFactor, 0.9);
      const lrDoorMesh = new THREE.Mesh(lrDoorGeo, basePaintMaterial.clone());
      lrDoorMesh.position.set(-0.85, 0.54 * heightFactor, -0.65);
      registerMeshToPanel('leftRearDoor', lrDoorMesh);

      const rrDoorGeo = new THREE.BoxGeometry(0.15, 0.65 * heightFactor, 0.9);
      const rrDoorMesh = new THREE.Mesh(rrDoorGeo, basePaintMaterial.clone());
      rrDoorMesh.position.set(0.85, 0.54 * heightFactor, -0.65);
      registerMeshToPanel('rightRearDoor', rrDoorMesh);

      const lQuarterGeo = new THREE.BoxGeometry(0.18, 0.62 * heightFactor, 1.15);
      const lQuarterMesh = new THREE.Mesh(lQuarterGeo, basePaintMaterial.clone());
      lQuarterMesh.position.set(-0.84, 0.55 * heightFactor, -1.55);
      registerMeshToPanel('leftQuarter', lQuarterMesh);

      const rQuarterGeo = new THREE.BoxGeometry(0.18, 0.62 * heightFactor, 1.15);
      const rQuarterMesh = new THREE.Mesh(rQuarterGeo, basePaintMaterial.clone());
      rQuarterMesh.position.set(0.84, 0.55 * heightFactor, -1.55);
      registerMeshToPanel('rightQuarter', rQuarterMesh);

      const lRailGeo = new THREE.BoxGeometry(0.08, 0.12, 2.1);
      const lRailMesh = new THREE.Mesh(lRailGeo, basePaintMaterial.clone());
      lRailMesh.position.set(-0.76, roofHeight, -0.15);
      registerMeshToPanel('leftRoofRail', lRailMesh);

      const rRailGeo = new THREE.BoxGeometry(0.08, 0.12, 2.1);
      const rRailMesh = new THREE.Mesh(rRailGeo, basePaintMaterial.clone());
      rRailMesh.position.set(0.76, roofHeight, -0.15);
      registerMeshToPanel('rightRoofRail', rRailMesh);

      const fBumperGeo = new THREE.BoxGeometry(1.75, 0.42 * heightFactor, 0.35);
      const fBumperMesh = new THREE.Mesh(fBumperGeo, basePaintMaterial.clone());
      fBumperMesh.position.set(0, 0.35 * heightFactor, 2.0);
      registerMeshToPanel('frontBumper', fBumperMesh);

      const rBumperGeo = new THREE.BoxGeometry(1.75, 0.42 * heightFactor, 0.35);
      const rBumperMesh = new THREE.Mesh(rBumperGeo, basePaintMaterial.clone());
      rBumperMesh.position.set(0, 0.35 * heightFactor, -2.05);
      registerMeshToPanel('rearBumper', rBumperMesh);

      // Grille
      const grilleGeo = new THREE.BoxGeometry(0.85, 0.35, 0.08);
      const grilleMesh = new THREE.Mesh(grilleGeo, chromeMaterial);
      grilleMesh.position.set(0, 0.55 * heightFactor, 2.08);
      car.add(grilleMesh);

      // Windshield & Rear Glass
      const windshieldGeo = new THREE.BoxGeometry(1.44, 0.65, 0.05);
      const windshieldMesh = new THREE.Mesh(windshieldGeo, glassMaterial);
      windshieldMesh.position.set(0, 1.05 * heightFactor, 0.68);
      windshieldMesh.rotation.x = -0.62;
      car.add(windshieldMesh);

      const rearWindowGeo = new THREE.BoxGeometry(1.42, isSUV ? 0.6 : 0.7, 0.05);
      const rearWindowMesh = new THREE.Mesh(rearWindowGeo, glassMaterial);
      rearWindowMesh.position.set(0, 1.05 * heightFactor, isSUV ? -1.55 : -1.15);
      rearWindowMesh.rotation.x = isSUV ? 0.45 : 0.65;
      car.add(rearWindowMesh);
    }

    // Windows & Side Glass (Non-Tesla / Default)
    if (!isTeslaModel3) {
      const lSideWinGeo = new THREE.BoxGeometry(0.04, 0.38 * heightFactor, isTruck ? 1.4 : 1.8);
      const lSideWinMesh = new THREE.Mesh(lSideWinGeo, glassMaterial);
      lSideWinMesh.position.set(-0.76, 1.05 * heightFactor, isTruck ? 0.0 : -0.2);
      car.add(lSideWinMesh);

      const rSideWinGeo = new THREE.BoxGeometry(0.04, 0.38 * heightFactor, isTruck ? 1.4 : 1.8);
      const rSideWinMesh = new THREE.Mesh(rSideWinGeo, glassMaterial);
      rSideWinMesh.position.set(0.76, 1.05 * heightFactor, isTruck ? 0.0 : -0.2);
      car.add(rSideWinMesh);

      // Headlights & Taillights
      const lLightGeo = new THREE.BoxGeometry(0.35, 0.15, 0.1);
      const lLightMesh = new THREE.Mesh(lLightGeo, lightMaterial);
      lLightMesh.position.set(-0.65, 0.62 * heightFactor, 1.95);
      car.add(lLightMesh);

      const rLightGeo = new THREE.BoxGeometry(0.35, 0.15, 0.1);
      const rLightMesh = new THREE.Mesh(rLightGeo, lightMaterial);
      rLightMesh.position.set(0.65, 0.62 * heightFactor, 1.95);
      car.add(rLightMesh);

      const lTailGeo = new THREE.BoxGeometry(0.35, 0.15, 0.1);
      const lTailMesh = new THREE.Mesh(lTailGeo, tailLightMaterial);
      lTailMesh.position.set(-0.68, 0.65 * heightFactor, isTruck ? -2.18 : -2.05);
      car.add(lTailMesh);

      const rTailGeo = new THREE.BoxGeometry(0.35, 0.15, 0.1);
      const rTailMesh = new THREE.Mesh(rTailGeo, tailLightMaterial);
      rTailMesh.position.set(0.68, 0.65 * heightFactor, isTruck ? -2.18 : -2.05);
      car.add(rTailMesh);
    }

    // Wheels (4) with Archetype Aero Rims
    const wheelRadius = isTruck ? 0.42 : isSUV ? 0.38 : 0.35;
    const wheelPositions = [
      { x: -0.88, y: wheelRadius, z: 1.35 }, // Front Left
      { x: 0.88, y: wheelRadius, z: 1.35 },  // Front Right
      { x: -0.88, y: wheelRadius, z: isTruck ? -1.5 : -1.35 }, // Rear Left
      { x: 0.88, y: wheelRadius, z: isTruck ? -1.5 : -1.35 },  // Rear Right
    ];

    wheelPositions.forEach(pos => {
      const wheelGroup = new THREE.Group();
      wheelGroup.position.set(pos.x, pos.y, pos.z);

      const tireGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, 0.24, 24);
      tireGeo.rotateZ(Math.PI / 2);
      const tireMesh = new THREE.Mesh(tireGeo, tireMaterial);
      tireMesh.castShadow = true;
      wheelGroup.add(tireMesh);

      const rimGeo = new THREE.CylinderGeometry(wheelRadius * 0.65, wheelRadius * 0.65, 0.25, 16);
      rimGeo.rotateZ(Math.PI / 2);
      const rimMesh = new THREE.Mesh(rimGeo, rimMaterial);
      wheelGroup.add(rimMesh);

      // If Tesla Aero wheel, add dark inner turbine cap
      if (isTeslaModel3) {
        const aeroCapGeo = new THREE.CylinderGeometry(wheelRadius * 0.45, wheelRadius * 0.45, 0.26, 8);
        aeroCapGeo.rotateZ(Math.PI / 2);
        const aeroCapMesh = new THREE.Mesh(aeroCapGeo, darkTrimMaterial);
        wheelGroup.add(aeroCapMesh);
      }

      car.add(wheelGroup);
    });

    // Floor shadow disk
    const shadowGeo = new THREE.CircleGeometry(3.0, 32);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x080c14,
      transparent: true,
      opacity: 0.45,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.position.set(0, 0.01, 0);
    car.add(shadowMesh);

    // Dent markers group
    const dentGroup = new THREE.Group();
    dentMarkersGroupRef.current = dentGroup;
    car.add(dentGroup);

    scene.add(car);
  }, [vehicleArchetype, activeColor, bodyClass, vehicle?.make, vehicle?.model]);

  // Update panel colors based on damage and selection
  useEffect(() => {
    panelMeshesRef.current.forEach((meshes, panelId) => {
      const damage = panels[panelId];
      const hasDamage = damage && damage.dentCount > 0;
      const isSelected = selectedPanelId === panelId;
      const isHovered = hoveredPanel === panelId;

      meshes.forEach(mesh => {
        const mat = mesh.material as THREE.MeshPhysicalMaterial;
        if (!mat) return;

        if (isSelected) {
          mat.color.setHex(0xf59e0b); // PDR Gold selected
          mat.emissive.setHex(0xb45309);
          mat.emissiveIntensity = 0.45;
        } else if (isHovered) {
          mat.color.setHex(0x38bdf8); // Sky blue hover
          mat.emissive.setHex(0x0369a1);
          mat.emissiveIntensity = 0.35;
        } else if (hasDamage) {
          if (damage.requiresTraditionalRepair) {
            mat.color.setHex(0xef4444); // Red: Traditional Repair
            mat.emissive.setHex(0x7f1d1d);
            mat.emissiveIntensity = 0.3;
          } else if (damage.dentCount > 30) {
            mat.color.setHex(0xf97316); // Amber: Medium-Heavy Hail
            mat.emissive.setHex(0x7c2d12);
            mat.emissiveIntensity = 0.25;
          } else {
            mat.color.setHex(0xeab308); // Yellow: Light Hail
            mat.emissive.setHex(0x713f12);
            mat.emissiveIntensity = 0.2;
          }
        } else {
          // Standard pristine car paint
          mat.color.setHex(activeColor.hex);
          mat.emissive.setHex(0x000000);
          mat.emissiveIntensity = 0.0;
        }
      });
    });
  }, [panels, selectedPanelId, hoveredPanel, activeColor]);

  // Render 3D dent indicators & pins
  useEffect(() => {
    if (!dentMarkersGroupRef.current) return;
    const group = dentMarkersGroupRef.current;
    
    // Clear existing markers
    while (group.children.length > 0) {
      const obj = group.children[0];
      group.remove(obj);
    }

    if (!showDentBadges) return;

    // Panel center pins / 3D markers
    (Object.keys(panels) as PanelId[]).forEach(panelId => {
      const damage = panels[panelId];
      if (!damage || damage.dentCount === 0) return;

      const meshes = panelMeshesRef.current.get(panelId);
      if (!meshes || meshes.length === 0) return;

      const primaryMesh = meshes[0];
      const box = new THREE.Box3().setFromObject(primaryMesh);
      const center = box.getCenter(new THREE.Vector3());

      // Create glowing 3D beacon sphere above damaged panel
      const beaconGeo = new THREE.SphereGeometry(0.08, 16, 16);
      const beaconColor = damage.requiresTraditionalRepair ? 0xef4444 : 0xf59e0b;
      const beaconMat = new THREE.MeshStandardMaterial({
        color: beaconColor,
        emissive: beaconColor,
        emissiveIntensity: 0.9,
        roughness: 0.2,
      });

      const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
      beaconMesh.position.set(center.x, box.max.y + 0.12, center.z);
      beaconMesh.userData = { panelId, isBeacon: true };
      group.add(beaconMesh);

      // Add pulsing ring
      const ringGeo = new THREE.RingGeometry(0.1, 0.16, 24);
      ringGeo.rotateX(-Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({
        color: beaconColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.75,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.set(center.x, box.max.y + 0.02, center.z);
      group.add(ringMesh);
    });
  }, [panels, showDentBadges]);

  // Initialize Three.js Scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 480;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(isDay ? 0xf1f5f9 : 0x0f0f0f);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 50);
    camera.position.set(4.5, 3.5, 5.5);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Studio Lighting Rig
    const ambientLight = new THREE.AmbientLight(0xdde6ed, 1.3);
    scene.add(ambientLight);

    const mainKeyLight = new THREE.DirectionalLight(0xfff5e6, 2.5);
    mainKeyLight.position.set(5, 8, 5);
    mainKeyLight.castShadow = true;
    mainKeyLight.shadow.mapSize.width = 1024;
    mainKeyLight.shadow.mapSize.height = 1024;
    scene.add(mainKeyLight);

    const fillLight = new THREE.DirectionalLight(0x8bc34a, 0.45);
    fillLight.position.set(-6, 4, -4);
    scene.add(fillLight);

    const topInspectionLight = new THREE.PointLight(0xffffff, 2.0, 15);
    topInspectionLight.position.set(0, 5, 0);
    scene.add(topInspectionLight);

    // Build initial car
    buildCarModel(scene);

    // 5. Animation Loop
    const animate = () => {
      reqIdRef.current = requestAnimationFrame(animate);

      if (isAutoRotating && !isDraggingRef.current) {
        targetRotationRef.current.y += 0.006;
      }

      currentRotationRef.current.x += (targetRotationRef.current.x - currentRotationRef.current.x) * 0.1;
      currentRotationRef.current.y += (targetRotationRef.current.y - currentRotationRef.current.y) * 0.1;
      currentDistanceRef.current += (targetDistanceRef.current - currentDistanceRef.current) * 0.1;

      const rx = currentRotationRef.current.x;
      const ry = currentRotationRef.current.y;
      const dist = currentDistanceRef.current;

      camera.position.x = dist * Math.sin(ry) * Math.cos(rx);
      camera.position.y = dist * Math.sin(rx) + 0.6;
      camera.position.z = dist * Math.cos(ry) * Math.cos(rx);
      camera.lookAt(0, 0.5, 0);

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      if (reqIdRef.current) cancelAnimationFrame(reqIdRef.current);
      resizeObserver.disconnect();
      renderer.dispose();
    };
  }, [buildCarModel]);

  // Dynamically update scene background on theme toggle
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.background = new THREE.Color(isDay ? 0xf1f5f9 : 0x0f0f0f);
    }
  }, [isDay]);

  // Pointer and Drag Handlers (Supports 1-finger orbit & 2-finger pinch-to-zoom)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Register active pointer
    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (activePointersRef.current.size === 1) {
      isDraggingRef.current = true;
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
      initialPinchDistRef.current = null;
    } else if (activePointersRef.current.size === 2) {
      // Pinch started
      isDraggingRef.current = false;
      const pts: { x: number; y: number }[] = Array.from(activePointersRef.current.values());
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      initialPinchDistRef.current = dist;
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current || !cameraRef.current || !sceneRef.current) return;

    if (activePointersRef.current.has(e.pointerId)) {
      activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }

    // 2-Finger Pinch to Zoom
    if (activePointersRef.current.size >= 2) {
      const pts: { x: number; y: number }[] = Array.from(activePointersRef.current.values());
      const currentDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      if (initialPinchDistRef.current !== null && initialPinchDistRef.current > 0) {
        const factor = (initialPinchDistRef.current - currentDist) * 0.02;
        targetDistanceRef.current = Math.max(3.5, Math.min(12.5, targetDistanceRef.current + factor));
      }
      initialPinchDistRef.current = currentDist;
      return;
    }

    // 1-Finger Orbit Drag
    if (isDraggingRef.current) {
      const deltaX = e.clientX - previousMousePositionRef.current.x;
      const deltaY = e.clientY - previousMousePositionRef.current.y;

      targetRotationRef.current.y -= deltaX * 0.008;
      targetRotationRef.current.x = Math.max(-0.2, Math.min(1.4, targetRotationRef.current.x + deltaY * 0.008));

      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);

    const meshes: THREE.Mesh[] = [];
    panelMeshesRef.current.forEach(list => meshes.push(...list));

    const intersects = raycaster.intersectObjects(meshes, true);
    if (intersects.length > 0) {
      const hit = intersects[0];
      const panelId = hit.object.userData.panelId as PanelId;
      if (panelId && hoveredPanel !== panelId) {
        setHoveredPanel(panelId);
      }
    } else if (hoveredPanel !== null) {
      setHoveredPanel(null);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    activePointersRef.current.delete(e.pointerId);
    if (activePointersRef.current.size === 0) {
      initialPinchDistRef.current = null;
    }

    const wasDragging = Math.abs(e.clientX - previousMousePositionRef.current.x) > 5 ||
                        Math.abs(e.clientY - previousMousePositionRef.current.y) > 5;
    isDraggingRef.current = false;

    if (wasDragging) return;

    if (!containerRef.current || !cameraRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);

    const meshes: THREE.Mesh[] = [];
    panelMeshesRef.current.forEach(list => meshes.push(...list));

    const intersects = raycaster.intersectObjects(meshes, true);
    if (intersects.length > 0) {
      const hit = intersects[0];
      const panelId = hit.object.userData.panelId as PanelId;
      if (panelId) {
        if (isPinDropMode && onAddPin) {
          onAddPin(panelId, hit.point.x, hit.point.y, hit.point.z);
        } else {
          onSelectPanel(panelId);
        }
      }
    }
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    activePointersRef.current.delete(e.pointerId);
    isDraggingRef.current = false;
    initialPinchDistRef.current = null;
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    targetDistanceRef.current = Math.max(3.8, Math.min(12.0, targetDistanceRef.current + e.deltaY * 0.005));
  };

  const setCameraView = (view: 'iso' | 'front' | 'left' | 'right' | 'rear' | 'top') => {
    setViewPreset(view);
    setIsAutoRotating(false);
    switch (view) {
      case 'iso':
        targetRotationRef.current = { x: 0.35, y: -0.75 };
        targetDistanceRef.current = 7.5;
        break;
      case 'front':
        targetRotationRef.current = { x: 0.1, y: 0 };
        targetDistanceRef.current = 6.5;
        break;
      case 'left':
        targetRotationRef.current = { x: 0.15, y: -Math.PI / 2 };
        targetDistanceRef.current = 6.5;
        break;
      case 'right':
        targetRotationRef.current = { x: 0.15, y: Math.PI / 2 };
        targetDistanceRef.current = 6.5;
        break;
      case 'rear':
        targetRotationRef.current = { x: 0.15, y: Math.PI };
        targetDistanceRef.current = 6.5;
        break;
      case 'top':
        targetRotationRef.current = { x: 1.35, y: 0 };
        targetDistanceRef.current = 6.8;
        break;
    }
  };

  return (
    <div className={`relative w-full h-[400px] sm:h-[480px] md:h-[540px] rounded-2xl overflow-hidden border select-none touch-none transition-colors ${
      isDay 
        ? 'bg-gradient-to-b from-slate-100 via-slate-100 to-slate-200/90 border-slate-300 shadow-lg' 
        : 'bg-[#0F0F0F] border-[#2D2D2D] shadow-2xl'
    }`}>
      {/* 3D Canvas Container */}
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onWheel={handleWheel}
      />

      {/* Top Left: 3D Inspector Header, Active Vehicle Tag & Specs */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <div className={`flex items-center gap-2.5 backdrop-blur-md px-3.5 py-1.5 rounded-full border shadow-lg ${
          isDay ? 'bg-white/95 border-slate-300 text-slate-800' : 'bg-[#141414]/90 border-[#3D3D3D] text-[#E0DED7]'
        }`}>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C5A059] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C5A059]"></span>
          </span>
          <span className={`text-[10px] uppercase tracking-widest font-semibold ${isDay ? 'text-slate-800' : 'text-[#E0DED7]'}`}>
            3D Render: {vehicle?.year || '2024'} {vehicle?.make || 'Tesla'} {vehicle?.model || 'Model 3'}
          </span>
          {vehicle?.fuelType === 'Electric' && (
            <span className={`text-[9px] px-2 py-0.5 rounded-full border font-mono flex items-center gap-1 ${
              isDay ? 'bg-amber-50 text-[#8c6d2c] border-amber-200' : 'bg-[#1F1F1F] text-[#C5A059] border-[#3D3D3D]'
            }`}>
              <Zap className="w-2.5 h-2.5" />
              EV
            </span>
          )}
        </div>

        {hoveredPanel && (
          <div className={`backdrop-blur-md border px-3 py-1.5 rounded-full text-xs font-medium shadow-md animate-fade-in pointer-events-none ${
            isDay ? 'bg-white/95 text-slate-900 border-[#C5A059]' : 'bg-[#141414]/90 text-[#E0DED7] border-[#C5A059]/60'
          }`}>
            Hovering: <span className="font-bold text-[#C5A059]">{PANEL_CONFIGS[hoveredPanel]?.name}</span>
            <span className={`ml-2 text-[10px] font-mono ${isDay ? 'text-slate-500' : 'text-[#8E8E8E]'}`}>
              (Click to edit)
            </span>
          </div>
        )}

        {selectedPanelId && !hoveredPanel && (
          <div className={`backdrop-blur-md border px-3 py-1.5 rounded-full text-xs font-medium shadow-md pointer-events-none ${
            isDay ? 'bg-white/95 text-slate-900 border-[#C5A059]' : 'bg-[#141414]/90 text-[#E0DED7] border-[#C5A059]'
          }`}>
            Active: <span className="font-bold text-[#C5A059]">{PANEL_CONFIGS[selectedPanelId]?.name}</span>
            {panels[selectedPanelId]?.dentCount > 0 && (
              <span className={`ml-2 text-[10px] px-2 py-0.5 rounded-full border ${
                isDay ? 'bg-amber-50 text-amber-900 border-amber-200' : 'bg-[#1F1F1F] text-[#C5A059] border-[#3D3D3D]'
              }`}>
                {panels[selectedPanelId].dentCount} dents
              </span>
            )}
          </div>
        )}
      </div>

      {/* Top Right: AR Scanner Launch Button, Vehicle/Paint Studio & Controls */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2 flex-wrap justify-end">
        {/* Quick Ready to Submit Button */}
        {onOpenReportModal && (
          <button
            id="car-hud-submit-report-btn"
            onClick={onOpenReportModal}
            className="flex items-center gap-1.5 bg-gradient-to-r from-[#C5A059] to-[#DFBA73] hover:from-[#DFBA73] hover:to-[#C5A059] text-[#0F0F0F] px-3.5 py-1.5 rounded-full text-xs font-bold shadow-lg shadow-[#C5A059]/20 transition-all active:scale-95 tracking-wide"
            title="Open 1-Page PDF & Direct Email Submission"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Submit Report</span>
          </button>
        )}

        {/* AR Live Walkaround Scanner Trigger Button */}
        {onOpenArScanner && (
          <button
            id="launch-ar-scanner-btn"
            onClick={onOpenArScanner}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold shadow-lg transition-transform active:scale-95 tracking-wide border ${
              isDay 
                ? 'bg-white/95 hover:bg-slate-100 text-slate-800 border-slate-300' 
                : 'bg-[#1F1F1F] hover:bg-[#252525] text-[#E0DED7] border-[#3D3D3D] hover:border-[#C5A059]'
            }`}
          >
            <Camera className="w-3.5 h-3.5 text-[#C5A059]" />
            <span className="hidden sm:inline">AR Scan</span>
          </button>
        )}

        {/* Vehicle Specs & Paint Studio Trigger */}
        {onOpenVehicleEditor && (
          <button
            id="open-vehicle-paint-studio-btn"
            onClick={onOpenVehicleEditor}
            title="Configure Make, Model, EV Specs & Paint Finish"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md shadow-lg transition-colors border ${
              isDay 
                ? 'bg-white/95 hover:bg-slate-100 text-slate-800 border-slate-300' 
                : 'bg-[#141414]/90 hover:bg-[#1F1F1F] text-[#E0DED7] border-[#3D3D3D] hover:border-[#C5A059]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-[#C5A059]" />
            <span className="hidden sm:inline">Vehicle &amp; Paint</span>
          </button>
        )}

        {/* Color Swatches and Toggles */}
        <div className={`flex items-center gap-1.5 backdrop-blur-md p-1.5 rounded-full border shadow-lg ${
          isDay ? 'bg-white/95 border-slate-300' : 'bg-[#141414]/90 border-[#3D3D3D]'
        }`}>
          {CAR_COLORS.slice(0, 4).map(c => (
            <button
              key={c.name}
              id={`car-color-${c.name.toLowerCase().replace(/\s+/g, '-')}`}
              title={`Finish: ${c.name}`}
              onClick={() => setActiveColor(c)}
              className={`w-5 h-5 rounded-full border transition-transform ${
                activeColor.name === c.name
                  ? 'scale-125 border-[#C5A059] shadow-md ring-2 ring-[#C5A059]/40'
                  : isDay ? 'border-slate-300 hover:scale-110' : 'border-[#3D3D3D] hover:scale-110'
              }`}
              style={{ backgroundColor: `#${c.hex.toString(16).padStart(6, '0')}` }}
            />
          ))}

          <div className={`w-[1px] h-4 mx-0.5 ${isDay ? 'bg-slate-300' : 'bg-[#2D2D2D]'}`} />

          <button
            id="toggle-auto-rotate-btn"
            title="Toggle Auto Rotation"
            onClick={() => setIsAutoRotating(!isAutoRotating)}
            className={`p-1.5 rounded-full text-xs transition-colors ${
              isAutoRotating
                ? 'bg-[#C5A059] text-[#0F0F0F]'
                : isDay 
                  ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100' 
                  : 'text-[#8E8E8E] hover:text-[#E0DED7] hover:bg-[#1F1F1F]'
            }`}
          >
            <RotateCw className={`w-3.5 h-3.5 ${isAutoRotating ? 'animate-spin' : ''}`} />
          </button>

          <button
            id="toggle-dent-badges-btn"
            title="Toggle 3D Damage Beacons"
            onClick={() => setShowDentBadges(!showDentBadges)}
            className={`p-1.5 rounded-full text-xs transition-colors ${
              showDentBadges
                ? 'bg-[#C5A059] text-[#0F0F0F]'
                : isDay 
                  ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100' 
                  : 'text-[#8E8E8E] hover:text-[#E0DED7] hover:bg-[#1F1F1F]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Bottom Center: Camera View Angles */}
      <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 backdrop-blur-md px-2.5 py-1.5 rounded-full border shadow-xl max-w-[94vw] overflow-x-auto ${
        isDay ? 'bg-white/95 border-slate-300' : 'bg-[#141414]/90 border-[#3D3D3D]'
      }`}>
        {(
          [
            { id: 'iso', label: '3/4 Iso' },
            { id: 'front', label: 'Front (Hood)' },
            { id: 'left', label: 'Left Side' },
            { id: 'right', label: 'Right Side' },
            { id: 'rear', label: 'Rear (Decklid)' },
            { id: 'top', label: 'Top (Roof)' },
          ] as const
        ).map(v => (
          <button
            key={v.id}
            id={`camera-view-${v.id}`}
            onClick={() => setCameraView(v.id)}
            className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
              viewPreset === v.id
                ? 'bg-[#C5A059] text-[#0F0F0F] shadow-sm'
                : isDay 
                  ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900' 
                  : 'text-[#8E8E8E] hover:bg-[#1F1F1F] hover:text-[#E0DED7]'
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* Bottom Right: Zoom Controls */}
      <div className={`absolute bottom-4 right-4 z-10 hidden sm:flex items-center gap-1 backdrop-blur-md p-1 rounded-full border text-xs ${
        isDay ? 'bg-white/95 border-slate-300 text-slate-700 shadow-md' : 'bg-[#141414]/90 border-[#3D3D3D] text-[#8E8E8E]'
      }`}>
        <button
          id="zoom-in-btn"
          title="Zoom In"
          onClick={() => {
            targetDistanceRef.current = Math.max(3.8, targetDistanceRef.current - 0.8);
          }}
          className={`p-1.5 rounded-full ${isDay ? 'hover:text-slate-900 hover:bg-slate-100' : 'hover:text-[#E0DED7] hover:bg-[#1F1F1F]'}`}
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          id="zoom-out-btn"
          title="Zoom Out"
          onClick={() => {
            targetDistanceRef.current = Math.min(12.0, targetDistanceRef.current + 0.8);
          }}
          className={`p-1.5 rounded-full ${isDay ? 'hover:text-slate-900 hover:bg-slate-100' : 'hover:text-[#E0DED7] hover:bg-[#1F1F1F]'}`}
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Bottom Left: Touch & Drag interaction instructions */}
      <div className={`absolute bottom-4 left-4 z-10 hidden md:flex items-center gap-2 text-[10px] uppercase tracking-widest backdrop-blur-sm px-3 py-1.5 rounded-full border ${
        isDay ? 'bg-white/95 border-slate-300 text-slate-600 shadow-md' : 'bg-[#141414]/90 border-[#3D3D3D] text-[#8E8E8E]'
      }`}>
        <span>Drag to rotate</span>
        <span>&bull;</span>
        <span>Scroll to zoom</span>
        <span>&bull;</span>
        <span className="text-[#C5A059] font-semibold">Click panel to inspect</span>
      </div>
    </div>
  );
};
