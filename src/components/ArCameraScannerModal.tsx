import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { PanelId, PanelDamage, DentSize, DamagePin, PanelPhoto, VehicleInfo } from '../types';
import { PANEL_CONFIGS } from '../data/matrix';
import { getHexColor } from '../data/vehicleSpecs';
import { 
  Camera, 
  X, 
  Zap, 
  RotateCcw, 
  Check, 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  Plus, 
  Trash2, 
  Image, 
  Eye, 
  ShieldCheck, 
  Car, 
  Layers,
  Crosshair,
  Maximize2,
  ScanLine,
  Sliders,
  DollarSign,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Box,
  Compass,
  CheckCircle2,
  Info
} from 'lucide-react';

interface ArCameraScannerModalProps {
  vehicle: VehicleInfo;
  panels: Record<PanelId, PanelDamage>;
  selectedPanelId: PanelId;
  onUpdatePanelDamage: (panelId: PanelId, updater: (prev: PanelDamage) => PanelDamage) => void;
  onClose: () => void;
}

const WALKAROUND_SEQUENCE: PanelId[] = [
  'hood',
  'roof',
  'decklid',
  'leftFender',
  'leftFrontDoor',
  'leftRearDoor',
  'leftQuarter',
  'rightQuarter',
  'rightRearDoor',
  'rightFrontDoor',
  'rightFender',
  'leftRoofRail',
  'rightRoofRail',
];

const COIN_SIZES: { id: DentSize | 'oversize' | 'doubleOversize'; label: string; coin: string; dia: string; color: string; border: string }[] = [
  { id: 'dime', label: 'Dime', coin: '10¢', dia: '17.9 mm', color: '#38BDF8', border: '#0284C7' },
  { id: 'nickel', label: 'Nickel', coin: '5¢', dia: '21.2 mm', color: '#4ADE80', border: '#16A34A' },
  { id: 'quarter', label: 'Quarter', coin: '25¢', dia: '24.3 mm', color: '#FACC15', border: '#CA8A04' },
  { id: 'halfDollar', label: 'Half Dollar', coin: '50¢', dia: '30.6 mm', color: '#FB923C', border: '#EA580C' },
  { id: 'oversize', label: 'Oversize (+$50)', coin: 'O/S', dia: '> 32 mm', color: '#F87171', border: '#DC2626' },
  { id: 'doubleOversize', label: '2X O/S (+$100)', coin: '2X', dia: '> 45 mm', color: '#E11D48', border: '#9F1239' },
];

export const ArCameraScannerModal: React.FC<ArCameraScannerModalProps> = ({
  vehicle,
  panels,
  selectedPanelId: initialPanelId,
  onUpdatePanelDamage,
  onClose,
}) => {
  const [activePanelId, setActivePanelId] = useState<PanelId>(initialPanelId);
  const [selectedCoinSize, setSelectedCoinSize] = useState<DentSize | 'oversize' | 'doubleOversize'>('quarter');
  const [arMode, setArMode] = useState<'3d_hologram' | 'optical_lens' | 'depth_heatmap'>('optical_lens');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [showLaserScanner, setShowLaserScanner] = useState(true);
  const [showGridOverlay, setShowGridOverlay] = useState(true);
  const [overlayOpacity, setOverlayOpacity] = useState(0.85);
  const [hologramRotation, setHologramRotation] = useState(0);
  const [hologramScale, setHologramScale] = useState(1);
  const [capturedFlash, setCapturedFlash] = useState(false);
  const [recentPhotos, setRecentPhotos] = useState<PanelPhoto[]>([]);
  const [zoomLevel, setZoomLevel] = useState(1);

  // AR Pins on current live canvas view
  const [arPins, setArPins] = useState<{ id: string; x: number; y: number; size: DentSize | 'oversize' | 'doubleOversize'; label?: string }[]>([]);

  // 3D Canvas Refs
  const threeContainerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const carGroupRef = useRef<THREE.Group | null>(null);
  const panelMeshesMapRef = useRef<Map<PanelId, THREE.Mesh[]>>(new Map());
  const reqIdRef = useRef<number | null>(null);

  // Video and Camera Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeDamage = panels[activePanelId] || {
    panelId: activePanelId,
    dentCount: 0,
    primaryDentSize: 'nickel',
    oversizeCount: 0,
    doubleOversizeCount: 0,
    markups: [],
    riItems: [],
    photos: [],
    pins: [],
    notes: '',
    baseCost: 0,
    markupCost: 0,
    oversizeCost: 0,
    riCost: 0,
    totalCost: 0,
  };

  const activeConfig = PANEL_CONFIGS[activePanelId];

  // Start Camera Stream with optimal non-distorted constraints
  const startCamera = async () => {
    setCameraError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera access is not available in this browser. Try Chrome, Safari, or Edge over HTTPS.');
      setIsCameraActive(false);
      return;
    }

    // Try for a nice high-res feed first, using "ideal" only (no hard "min") so we
    // don't get rejected by devices/cameras that can't hit 1080p.
    const attempts: MediaStreamConstraints[] = [
      {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      },
      // Fallback: bare-bones constraints for maximum device compatibility
      { video: { facingMode: 'environment' }, audio: false },
      { video: true, audio: false },
    ];

    let lastErr: any = null;
    for (const constraints of attempts) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
          };
        }
        setIsCameraActive(true);
        return;
      } catch (err: any) {
        lastErr = err;
        // OverconstrainedError means try the next, looser set of constraints
        if (err?.name !== 'OverconstrainedError') break;
      }
    }

    console.warn('Camera initialization error:', lastErr);
    setIsCameraActive(false);
    if (lastErr?.name === 'NotAllowedError' || lastErr?.name === 'PermissionDeniedError') {
      setCameraError('Camera access was blocked. Allow camera permission for this site in your browser settings, then tap "Activate Camera Feed".');
    } else if (lastErr?.name === 'NotFoundError' || lastErr?.name === 'DevicesNotFoundError') {
      setCameraError('No camera was found on this device.');
    } else if (lastErr?.name === 'NotReadableError') {
      setCameraError('The camera is already in use by another app or browser tab. Close it and try again.');
    } else {
      setCameraError(lastErr?.message || 'Could not access the camera on this device.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  // Sync existing pins when panel changes
  useEffect(() => {
    const existing = activeDamage.pins || [];
    setArPins(
      existing.map(p => ({
        id: p.id,
        x: p.x,
        y: p.y,
        size: p.size as any,
      }))
    );
  }, [activePanelId, panels]);

  // Set up Three.js 3D Holographic Vehicle Overlay
  useEffect(() => {
    if (!threeContainerRef.current) return;

    const width = threeContainerRef.current.clientWidth || 800;
    const height = threeContainerRef.current.clientHeight || 500;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera with natural non-fisheye FOV (45 degrees)
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 1.8, 4.5);
    cameraRef.current = camera;

    // WebGL Renderer with alpha transparency so camera feed shows through
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    rendererRef.current = renderer;

    threeContainerRef.current.innerHTML = '';
    threeContainerRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    const goldRimLight = new THREE.DirectionalLight(0xc5a059, 1.8);
    goldRimLight.position.set(-5, 3, -5);
    scene.add(goldRimLight);

    const blueFill = new THREE.DirectionalLight(0x38bdf8, 1.0);
    blueFill.position.set(0, -5, 5);
    scene.add(blueFill);

    // Build 3D Car Model Group
    const carGroup = new THREE.Group();
    carGroupRef.current = carGroup;
    scene.add(carGroup);

    // Helper material generator
    const getPanelMaterial = (panelId: PanelId, isHighlighted: boolean) => {
      const damage = panels[panelId];
      const hasDents = (damage?.dentCount || 0) > 0 || (damage?.oversizeCount || 0) > 0;
      
      let baseColor = 0x222226;
      if (isHighlighted) {
        baseColor = 0xc5a059; // Active Gold
      } else if (hasDents) {
        baseColor = 0xb45309; // Amber Damaged
      }

      return new THREE.MeshPhysicalMaterial({
        color: baseColor,
        metalness: 0.8,
        roughness: 0.2,
        clearcoat: 1.0,
        transparent: true,
        opacity: isHighlighted ? 0.95 : overlayOpacity,
        wireframe: arMode === 'optical_lens',
        emissive: isHighlighted ? 0xc5a059 : hasDents ? 0x78350f : 0x000000,
        emissiveIntensity: isHighlighted ? 0.4 : 0.2,
      });
    };

    panelMeshesMapRef.current.clear();

    // Procedural Vehicle Body Panels corresponding to actual automotive panels
    const createPanel = (id: PanelId, geometry: THREE.BufferGeometry, pos: [number, number, number], rot: [number, number, number] = [0, 0, 0]) => {
      const isHighlighted = activePanelId === id;
      const mat = getPanelMaterial(id, isHighlighted);
      const mesh = new THREE.Mesh(geometry, mat);
      mesh.position.set(...pos);
      mesh.rotation.set(...rot);
      mesh.userData = { panelId: id };
      carGroup.add(mesh);

      const existing = panelMeshesMapRef.current.get(id) || [];
      existing.push(mesh);
      panelMeshesMapRef.current.set(id, existing);
      return mesh;
    };

    // 1. Hood
    createPanel('hood', new THREE.BoxGeometry(1.6, 0.08, 1.2), [0, 0.42, 1.25], [-0.08, 0, 0]);

    // 2. Roof
    createPanel('roof', new THREE.BoxGeometry(1.4, 0.06, 1.6), [0, 0.85, -0.15]);

    // 3. Decklid (Trunk)
    createPanel('decklid', new THREE.BoxGeometry(1.45, 0.08, 0.9), [0, 0.5, -1.45], [0.08, 0, 0]);

    // 4. Front Bumper
    createPanel('frontBumper', new THREE.BoxGeometry(1.65, 0.35, 0.4), [0, 0.15, 1.9]);

    // 5. Rear Bumper
    createPanel('rearBumper', new THREE.BoxGeometry(1.65, 0.35, 0.4), [0, 0.15, -1.95]);

    // 6. Left Fender (Driver Front)
    createPanel('leftFender', new THREE.BoxGeometry(0.2, 0.45, 0.9), [-0.85, 0.25, 1.25]);

    // 7. Right Fender (Passenger Front)
    createPanel('rightFender', new THREE.BoxGeometry(0.2, 0.45, 0.9), [0.85, 0.25, 1.25]);

    // 8. Left Front Door
    createPanel('leftFrontDoor', new THREE.BoxGeometry(0.12, 0.55, 0.85), [-0.82, 0.35, 0.35]);

    // 9. Left Rear Door
    createPanel('leftRearDoor', new THREE.BoxGeometry(0.12, 0.55, 0.85), [-0.82, 0.35, -0.5]);

    // 10. Right Front Door
    createPanel('rightFrontDoor', new THREE.BoxGeometry(0.12, 0.55, 0.85), [0.82, 0.35, 0.35]);

    // 11. Right Rear Door
    createPanel('rightRearDoor', new THREE.BoxGeometry(0.12, 0.55, 0.85), [0.82, 0.35, -0.5]);

    // 12. Left Quarter Panel
    createPanel('leftQuarter', new THREE.BoxGeometry(0.2, 0.5, 0.95), [-0.85, 0.35, -1.35]);

    // 13. Right Quarter Panel
    createPanel('rightQuarter', new THREE.BoxGeometry(0.2, 0.5, 0.95), [0.85, 0.35, -1.35]);

    // 14. Left Roof Rail (Cant Rail)
    createPanel('leftRoofRail', new THREE.BoxGeometry(0.08, 0.08, 2.1), [-0.74, 0.78, -0.1]);

    // 15. Right Roof Rail
    createPanel('rightRoofRail', new THREE.BoxGeometry(0.08, 0.08, 2.1), [0.74, 0.78, -0.1]);

    // Wheels / Tires (Aesthetics)
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 });
    const rimMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.9, roughness: 0.2 });
    const wheelGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.22, 24);
    wheelGeo.rotateZ(Math.PI / 2);

    const addWheel = (pos: [number, number, number]) => {
      const w = new THREE.Mesh(wheelGeo, wheelMat);
      w.position.set(...pos);
      carGroup.add(w);
    };

    addWheel([-0.82, 0, 1.25]);
    addWheel([0.82, 0, 1.25]);
    addWheel([-0.82, 0, -1.35]);
    addWheel([0.82, 0, -1.35]);

    // Glass Greenhouse
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x101520,
      metalness: 0.1,
      roughness: 0.05,
      transmission: 0.85,
      transparent: true,
      opacity: 0.4,
    });
    const glassGeo = new THREE.BoxGeometry(1.3, 0.42, 1.5);
    const glassMesh = new THREE.Mesh(glassGeo, glassMat);
    glassMesh.position.set(0, 0.65, -0.15);
    carGroup.add(glassMesh);

    // Initial position
    carGroup.rotation.y = hologramRotation;
    carGroup.scale.set(hologramScale, hologramScale, hologramScale);

    // Animation Loop
    let clock = new THREE.Clock();
    const animate = () => {
      reqIdRef.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      // Subtle ambient hover if desired
      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!threeContainerRef.current || !renderer || !camera) return;
      const w = threeContainerRef.current.clientWidth;
      const h = threeContainerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (reqIdRef.current) cancelAnimationFrame(reqIdRef.current);
      renderer.dispose();
    };
  }, [activePanelId, overlayOpacity, arMode]);

  // Update 3D Hologram Rotation and Scale dynamically
  useEffect(() => {
    if (carGroupRef.current) {
      carGroupRef.current.rotation.y = hologramRotation;
      carGroupRef.current.scale.set(hologramScale, hologramScale, hologramScale);
    }
  }, [hologramRotation, hologramScale]);

  // Handle Raycast or Direct Tap on 3D vehicle / screen to place hail dent marker
  const handleStageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const xPct = (clientX / rect.width) * 100;
    const yPct = (clientY / rect.height) * 100;

    // Check Three.js raycasting if clicking on a 3D panel
    if (sceneRef.current && cameraRef.current) {
      const mouse = new THREE.Vector2(
        (clientX / rect.width) * 2 - 1,
        -(clientY / rect.height) * 2 + 1
      );

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, cameraRef.current);
      const intersects = raycaster.intersectObjects(sceneRef.current.children, true);

      for (let hit of intersects) {
        if (hit.object.userData?.panelId) {
          const hitPanelId = hit.object.userData.panelId as PanelId;
          if (hitPanelId !== activePanelId) {
            setActivePanelId(hitPanelId);
          }
          break;
        }
      }
    }

    // Create new damage pin
    const isOversize = selectedCoinSize === 'oversize';
    const isDoubleOversize = selectedCoinSize === 'doubleOversize';

    const newPin = {
      id: `pin_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      x: Math.round(xPct * 10) / 10,
      y: Math.round(yPct * 10) / 10,
      size: selectedCoinSize,
    };

    setArPins(prev => [...prev, newPin]);

    // Update panel damage state
    onUpdatePanelDamage(activePanelId, prev => {
      const updatedPins = [
        ...(prev.pins || []),
        {
          id: newPin.id,
          x: newPin.x,
          y: newPin.y,
          size: selectedCoinSize as DentSize,
        },
      ];

      return {
        ...prev,
        dentCount: isOversize || isDoubleOversize ? prev.dentCount : prev.dentCount + 1,
        oversizeCount: isOversize ? prev.oversizeCount + 1 : prev.oversizeCount,
        doubleOversizeCount: isDoubleOversize ? (prev.doubleOversizeCount || 0) + 1 : (prev.doubleOversizeCount || 0),
        primaryDentSize: isOversize || isDoubleOversize ? prev.primaryDentSize : (selectedCoinSize as DentSize),
        pins: updatedPins,
      };
    });
  };

  // Remove single pin
  const handleRemovePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const pin = arPins.find(p => p.id === id);
    if (!pin) return;

    setArPins(prev => prev.filter(p => p.id !== id));

    onUpdatePanelDamage(activePanelId, prev => {
      const isOversize = pin.size === 'oversize';
      const isDoubleOversize = pin.size === 'doubleOversize';
      return {
        ...prev,
        dentCount: !isOversize && !isDoubleOversize && prev.dentCount > 0 ? prev.dentCount - 1 : prev.dentCount,
        oversizeCount: isOversize && prev.oversizeCount > 0 ? prev.oversizeCount - 1 : prev.oversizeCount,
        doubleOversizeCount: isDoubleOversize && (prev.doubleOversizeCount || 0) > 0 ? (prev.doubleOversizeCount || 0) - 1 : prev.doubleOversizeCount,
        pins: (prev.pins || []).filter(p => p.id !== id),
      };
    });
  };

  // Toggle Torch/Flashlight on device
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track && 'applyConstraints' in track) {
      try {
        const newTorch = !torchOn;
        await (track as any).applyConstraints({
          advanced: [{ torch: newTorch }],
        });
        setTorchOn(newTorch);
      } catch (e) {
        console.warn('Torch constraint error:', e);
      }
    }
  };

  // Capture High-Res AR Photo with Damage Reticles and HUD Watermark
  const handleCapturePhoto = () => {
    setCapturedFlash(true);
    setTimeout(() => setCapturedFlash(false), 220);

    const canvas = document.createElement('canvas');
    canvas.width = 1920;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Draw live camera video or backdrop
    if (isCameraActive && videoRef.current && videoRef.current.videoWidth > 0) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    } else {
      ctx.fillStyle = '#0F0F12';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // AR Spatial Grid
      ctx.strokeStyle = '#222228';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < canvas.width; i += 60) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
      }
      for (let j = 0; j < canvas.height; j += 60) {
        ctx.beginPath();
        ctx.moveTo(0, j);
        ctx.lineTo(canvas.width, j);
        ctx.stroke();
      }
    }

    // 2. Composite WebGL 3D Hologram
    if (rendererRef.current) {
      ctx.drawImage(rendererRef.current.domElement, 0, 0, canvas.width, canvas.height);
    }

    // 3. Draw AR Hail Pins
    arPins.forEach((pin, idx) => {
      const px = (pin.x / 100) * canvas.width;
      const py = (pin.y / 100) * canvas.height;

      const isOversize = pin.size === 'oversize' || pin.size === 'doubleOversize';
      ctx.save();
      ctx.fillStyle = isOversize ? 'rgba(239, 68, 68, 0.4)' : 'rgba(197, 160, 89, 0.4)';
      ctx.strokeStyle = isOversize ? '#EF4444' : '#C5A059';
      ctx.lineWidth = 4;

      ctx.beginPath();
      ctx.arc(px, py, 32, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Inner Reticle Dot
      ctx.fillStyle = isOversize ? '#EF4444' : '#C5A059';
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fill();

      // Pin Tag
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 18px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`#${idx + 1} ${pin.size.toUpperCase()}`, px, py - 40);
      ctx.restore();
    });

    // 4. AR Certificate HUD Overlay Banner
    ctx.fillStyle = 'rgba(12, 12, 14, 0.92)';
    ctx.fillRect(40, canvas.height - 130, canvas.width - 80, 95);
    ctx.strokeStyle = '#C5A059';
    ctx.lineWidth = 2;
    ctx.strokeRect(40, canvas.height - 130, canvas.width - 80, 95);

    ctx.fillStyle = '#C5A059';
    ctx.font = 'bold 22px monospace';
    ctx.fillText(
      `PDR LOGIC AR SPATIAL CERTIFICATION • ${activeConfig?.name.toUpperCase() || activePanelId.toUpperCase()}`,
      65,
      canvas.height - 88
    );

    ctx.fillStyle = '#E0DED7';
    ctx.font = '16px sans-serif';
    ctx.fillText(
      `${vehicle.year} ${vehicle.make} ${vehicle.model} (VIN: ${vehicle.vin || 'N/A'}) • ${arPins.length} Hail Dents Logged • G&G Paradigm 2025 Standard • ${new Date().toLocaleString()}`,
      65,
      canvas.height - 56
    );

    const photoDataUrl = canvas.toDataURL('image/jpeg', 0.95);
    const newPhoto: PanelPhoto = {
      id: `photo_${Date.now()}`,
      url: photoDataUrl,
      caption: `${activeConfig?.name} AR Live Scan (${arPins.length} hail pins logged)`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setRecentPhotos(prev => [newPhoto, ...prev]);

    // Save to panel photos
    onUpdatePanelDamage(activePanelId, prev => ({
      ...prev,
      photos: [...(prev.photos || []), newPhoto],
    }));
  };

  const nextPanel = () => {
    const currIdx = WALKAROUND_SEQUENCE.indexOf(activePanelId);
    const nextIdx = (currIdx + 1) % WALKAROUND_SEQUENCE.length;
    setActivePanelId(WALKAROUND_SEQUENCE[nextIdx]);
  };

  const prevPanel = () => {
    const currIdx = WALKAROUND_SEQUENCE.indexOf(activePanelId);
    const prevIdx = (currIdx - 1 + WALKAROUND_SEQUENCE.length) % WALKAROUND_SEQUENCE.length;
    setActivePanelId(WALKAROUND_SEQUENCE[prevIdx]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-[#0A0A0C]/95 backdrop-blur-2xl animate-fade-in font-sans overflow-hidden">
      <div className="relative w-full max-w-6xl h-[94vh] max-h-[960px] bg-[#121215] border border-[#2D2D2D] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Top AR Header HUD */}
        <div className="px-4 sm:px-6 py-3.5 bg-[#161619] border-b border-[#2D2D2D] flex items-center justify-between z-20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#1F1F24] border border-[#C5A059]/60 flex items-center justify-center text-[#C5A059] shadow-inner">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#E0DED7] font-serif tracking-wide">
                  AR Spatial Vehicle Walkaround
                </h2>
                <span className="text-[10px] bg-[#C5A059]/20 text-[#C5A059] border border-[#C5A059]/40 px-2 py-0.5 rounded-full font-mono uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059] animate-ping" />
                  Real-Time AR
                </span>
              </div>
              <p className="text-xs text-[#8E8E8E] truncate max-w-md">
                {vehicle.year} {vehicle.make} {vehicle.model} &bull; {vehicle.color || 'OEM Finish'} &bull; {activeConfig?.name}
              </p>
            </div>
          </div>

          {/* AR Lens Mode Controls */}
          <div className="flex items-center gap-2">
            {/* Mode Switcher */}
            <div className="hidden sm:flex items-center bg-[#1A1A1E] p-1 rounded-full border border-[#2D2D2D]">
              <button
                onClick={() => setArMode('3d_hologram')}
                className={`px-3 py-1 rounded-full text-xs font-mono font-bold transition-colors flex items-center gap-1 ${
                  arMode === '3d_hologram'
                    ? 'bg-[#C5A059] text-[#0F0F0F]'
                    : 'text-[#8E8E8E] hover:text-[#E0DED7]'
                }`}
              >
                <Box className="w-3.5 h-3.5" />
                <span>3D Spatial</span>
              </button>

              <button
                onClick={() => setArMode('optical_lens')}
                className={`px-3 py-1 rounded-full text-xs font-mono font-bold transition-colors flex items-center gap-1 ${
                  arMode === 'optical_lens'
                    ? 'bg-[#C5A059] text-[#0F0F0F]'
                    : 'text-[#8E8E8E] hover:text-[#E0DED7]'
                }`}
              >
                <Crosshair className="w-3.5 h-3.5" />
                <span>Direct Lens</span>
              </button>
            </div>

            {/* Torch Toggle */}
            {isCameraActive && (
              <button
                id="ar-torch-toggle-btn"
                onClick={toggleTorch}
                title="Toggle Camera Flashlight"
                className={`p-2.5 rounded-full border transition-colors ${
                  torchOn
                    ? 'bg-[#C5A059] text-[#0F0F0F] border-[#C5A059]'
                    : 'bg-[#1F1F24] text-[#8E8E8E] hover:text-[#E0DED7] border-[#3D3D3D]'
                }`}
              >
                <Zap className="w-4 h-4" />
              </button>
            )}

            {/* Laser Caliper Toggle */}
            <button
              id="ar-laser-toggle-btn"
              onClick={() => setShowLaserScanner(!showLaserScanner)}
              title="Toggle Laser Caliper Scan Line"
              className={`p-2.5 rounded-full border transition-colors ${
                showLaserScanner
                  ? 'bg-[#C5A059]/20 text-[#C5A059] border-[#C5A059]'
                  : 'bg-[#1F1F24] text-[#8E8E8E] border-[#3D3D3D]'
              }`}
            >
              <ScanLine className="w-4 h-4" />
            </button>

            <button
              id="close-ar-modal-btn"
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className="p-2.5 text-[#8E8E8E] hover:text-[#E0DED7] hover:bg-[#1F1F24] rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Panel Walkaround Guided Step Selector */}
        <div className="px-4 py-2 bg-[#121215] border-b border-[#2D2D2D] flex items-center justify-between gap-2 overflow-x-auto shrink-0 z-20">
          <button
            id="ar-prev-panel-btn"
            onClick={prevPanel}
            className="p-1.5 text-[#8E8E8E] hover:text-[#E0DED7] hover:bg-[#1F1F24] rounded-full transition-colors shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
            {WALKAROUND_SEQUENCE.map((pId, idx) => {
              const cfg = PANEL_CONFIGS[pId];
              const dmg = panels[pId];
              const count = (dmg?.dentCount || 0) + (dmg?.oversizeCount || 0) + (dmg?.doubleOversizeCount || 0);
              const isActive = activePanelId === pId;

              return (
                <button
                  key={pId}
                  id={`walkaround-panel-${pId}`}
                  onClick={() => setActivePanelId(pId)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-[#C5A059] text-[#0F0F0F] shadow-md font-bold scale-105 ring-2 ring-[#C5A059]/40'
                      : 'bg-[#18181C] text-[#8E8E8E] hover:text-[#E0DED7] border border-[#2D2D2D]'
                  }`}
                >
                  <span className="text-[10px] opacity-75 font-mono">#{idx + 1}</span>
                  <span>{cfg?.name || pId}</span>
                  {count > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-extrabold ${
                        isActive ? 'bg-[#0F0F0F] text-[#C5A059]' : 'bg-[#C5A059] text-black'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <button
            id="ar-next-panel-btn"
            onClick={nextPanel}
            className="p-1.5 text-[#8E8E8E] hover:text-[#E0DED7] hover:bg-[#1F1F24] rounded-full transition-colors shrink-0"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Main AR Live Viewport Stage */}
        <div 
          ref={containerRef}
          onClick={handleStageClick}
          className="relative flex-1 bg-black overflow-hidden flex flex-col justify-between cursor-crosshair select-none"
        >
          {/* 1. Live Camera Stream */}
          {isCameraActive ? (
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-contain pointer-events-none"
              playsInline
              muted
              autoPlay
            />
          ) : (
            <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-[#0F0F14] via-[#09090C] to-[#050507] flex flex-col items-center justify-center p-6 text-center pointer-events-none">
              <div className={`w-16 h-16 rounded-full bg-[#18181D] border flex items-center justify-center mb-4 shadow-xl ${cameraError ? 'border-[#FF4E4E]/50 text-[#FF4E4E]' : 'border-[#C5A059]/40 text-[#C5A059]'}`}>
                {cameraError ? <AlertTriangle className="w-8 h-8" /> : <Car className="w-8 h-8" />}
              </div>
              <h3 className="text-lg font-bold text-[#E0DED7] font-serif mb-1">
                {cameraError ? 'Camera Unavailable' : 'Live Camera Not Started'}
              </h3>
              <p className={`text-xs max-w-md mb-4 ${cameraError ? 'text-[#FF4E4E]' : 'text-[#8E8E8E]'}`}>
                {cameraError || 'Tap below to open your camera and tap directly on the vehicle to mark dents.'}
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  startCamera();
                }}
                className="pointer-events-auto bg-[#C5A059] hover:bg-[#B38F48] text-[#0F0F0F] font-bold text-xs px-5 py-2.5 rounded-full transition-transform active:scale-95 flex items-center gap-2 shadow-lg"
              >
                <Camera className="w-4 h-4" />
                <span>{cameraError ? 'Try Again' : 'Activate Camera Feed'}</span>
              </button>
            </div>
          )}

          {/* 2. Three.js Interactive 3D Holographic Superimposition */}
          <div 
            ref={threeContainerRef} 
            className="absolute inset-0 w-full h-full pointer-events-none"
          />

          {/* 3. Laser Caliper Scanning Line Animation */}
          {showLaserScanner && (
            <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#C5A059] to-transparent shadow-[0_0_15px_#C5A059] animate-pulse pointer-events-none top-1/3 transition-all duration-1000" />
          )}

          {/* 4. Optical Framing Overlay Grid */}
          {showGridOverlay && (
            <div className="absolute inset-0 pointer-events-none">
              {/* 3x3 Precision Framing */}
              <div className="w-full h-full grid grid-cols-3 grid-rows-3 border border-[#C5A059]/20">
                <div className="border-r border-b border-[#C5A059]/10" />
                <div className="border-r border-b border-[#C5A059]/10" />
                <div className="border-b border-[#C5A059]/10" />
                <div className="border-r border-b border-[#C5A059]/10" />
                <div className="border-r border-b border-[#C5A059]/10 flex items-center justify-center">
                  <div className="w-20 h-20 border border-[#C5A059]/60 rounded-full flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#C5A059]" />
                  </div>
                </div>
                <div className="border-b border-[#C5A059]/10" />
                <div className="border-r border-b border-[#C5A059]/10" />
                <div className="border-r border-b border-[#C5A059]/10" />
                <div />
              </div>

              {/* Corner Caliper Brackets */}
              <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-[#C5A059]" />
              <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-[#C5A059]" />
              <div className="absolute bottom-28 left-6 w-8 h-8 border-b-2 border-l-2 border-[#C5A059]" />
              <div className="absolute bottom-28 right-6 w-8 h-8 border-b-2 border-r-2 border-[#C5A059]" />
            </div>
          )}

          {/* 5. AR PDR Dent Markers on Screen */}
          {arPins.map((pin, idx) => {
            const isOversize = pin.size === 'oversize' || pin.size === 'doubleOversize';
            const matchedCoin = COIN_SIZES.find(c => c.id === pin.size);

            return (
              <div
                key={pin.id}
                style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer pointer-events-auto z-30"
                onClick={e => handleRemovePin(pin.id, e)}
                title="Click to remove dent marker"
              >
                <div
                  className="w-11 h-11 rounded-full border-2 flex items-center justify-center shadow-2xl transition-transform group-hover:scale-125 backdrop-blur-sm"
                  style={{
                    backgroundColor: isOversize ? 'rgba(239, 68, 68, 0.4)' : 'rgba(197, 160, 89, 0.4)',
                    borderColor: matchedCoin?.color || '#C5A059',
                  }}
                >
                  <span className="text-[11px] font-mono font-extrabold text-white">#{idx + 1}</span>
                </div>

                {/* Coin Badge Tag */}
                <div 
                  className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-[#0F0F0F]/95 border border-[#3D3D3D] text-[10px] font-mono px-2 py-0.5 rounded-full whitespace-nowrap shadow-lg flex items-center gap-1"
                  style={{ color: matchedCoin?.color || '#C5A059' }}
                >
                  <span>{matchedCoin?.coin}</span>
                  <span className="text-[8px] text-zinc-400">({matchedCoin?.dia})</span>
                </div>
              </div>
            );
          })}

          {/* Flash Shutter Indicator */}
          {capturedFlash && (
            <div className="absolute inset-0 bg-white opacity-85 pointer-events-none transition-opacity duration-200 z-40" />
          )}

          {/* Top HUD Telemetry Pill Bar */}
          <div className="relative z-20 p-4 flex items-center justify-between pointer-events-none">
            <div className="bg-[#121215]/95 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-[#3D3D3D] shadow-2xl pointer-events-auto flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-[#C5A059] animate-pulse" />
              <div>
                <div className="text-[10px] uppercase font-mono text-[#8E8E8E] tracking-widest">
                  Target Panel
                </div>
                <div className="text-xs font-bold text-[#E0DED7]">
                  {activeConfig?.name}
                </div>
              </div>

              <div className="h-6 w-[1px] bg-[#2D2D2D]" />

              <div>
                <div className="text-[10px] uppercase font-mono text-[#8E8E8E] tracking-widest">
                  Dents Counted
                </div>
                <div className="text-xs font-bold font-mono text-[#C5A059]">
                  {activeDamage.dentCount} standard {activeDamage.oversizeCount > 0 ? `+ ${activeDamage.oversizeCount} O/S` : ''}
                </div>
              </div>

              <div className="h-6 w-[1px] bg-[#2D2D2D]" />

              <div>
                <div className="text-[10px] uppercase font-mono text-[#8E8E8E] tracking-widest">
                  Repair Tally
                </div>
                <div className="text-xs font-bold font-mono text-[#4ADE80]">
                  ${activeDamage.totalCost.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Spatial Alignment Controls (Rotate 3D Car in AR) */}
            <div className="bg-[#121215]/95 backdrop-blur-md p-1.5 rounded-2xl border border-[#3D3D3D] shadow-2xl pointer-events-auto flex items-center gap-1.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setHologramRotation(prev => prev - 0.4);
                }}
                title="Rotate 3D Vehicle Left"
                className="p-2 hover:bg-[#1F1F24] rounded-xl text-[#8E8E8E] hover:text-[#E0DED7] transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="text-[10px] font-mono text-[#C5A059] px-1 font-bold">
                Rotate 3D
              </span>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setHologramRotation(prev => prev + 0.4);
                }}
                title="Rotate 3D Vehicle Right"
                className="p-2 hover:bg-[#1F1F24] rounded-xl text-[#8E8E8E] hover:text-[#E0DED7] transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Bottom HUD: Coin Size Selector & Actions */}
          <div className="relative z-20 p-4 bg-gradient-to-t from-[#0A0A0C] via-[#0A0A0C]/90 to-transparent flex flex-col gap-3 pointer-events-auto">
            
            {/* Coin Size Picker Ribbon */}
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono uppercase text-[#8E8E8E] tracking-wider mr-1 hidden sm:inline">
                Dent Gauge:
              </span>
              {COIN_SIZES.map(cs => {
                const isSelected = selectedCoinSize === cs.id;
                return (
                  <button
                    key={cs.id}
                    id={`ar-coin-size-${cs.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCoinSize(cs.id);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-[#C5A059] text-[#0F0F0F] shadow-lg scale-105 ring-2 ring-[#C5A059]/50'
                        : 'bg-[#18181C]/90 text-[#E0DED7] border border-[#3D3D3D] hover:border-[#C5A059]'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cs.color }} />
                    <span>{cs.label}</span>
                    <span className="text-[9px] opacity-75 font-mono">({cs.coin})</span>
                  </button>
                );
              })}
            </div>

            {/* Bottom Actions Bar */}
            <div className="flex items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2">
                <button
                  id="ar-clear-pins-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setArPins([]);
                    onUpdatePanelDamage(activePanelId, prev => ({
                      ...prev,
                      dentCount: 0,
                      oversizeCount: 0,
                      doubleOversizeCount: 0,
                      pins: [],
                    }));
                  }}
                  className="bg-[#18181C] hover:bg-[#25252A] border border-[#3D3D3D] text-[#8E8E8E] hover:text-[#E0DED7] px-3.5 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear Pins</span>
                </button>
              </div>

              {/* High-Res Photo Capture Shutter */}
              <button
                id="ar-shutter-capture-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCapturePhoto();
                }}
                className="bg-[#C5A059] hover:bg-[#B38F48] text-[#0F0F0F] px-6 py-3 rounded-full font-bold text-xs uppercase tracking-wider shadow-2xl flex items-center gap-2 transition-transform active:scale-95"
              >
                <Camera className="w-4 h-4" />
                <span>Capture AR Photo</span>
              </button>

              <button
                id="ar-save-and-proceed-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  nextPanel();
                }}
                className="bg-[#18181C] hover:bg-[#25252A] border border-[#3D3D3D] text-[#E0DED7] px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <span>Next Panel</span>
                <ChevronRight className="w-4 h-4 text-[#C5A059]" />
              </button>
            </div>
          </div>
        </div>

        {/* Captured AR Photo Thumbnails Tray */}
        {recentPhotos.length > 0 && (
          <div className="px-4 py-2.5 bg-[#121215] border-t border-[#2D2D2D] flex items-center gap-3 overflow-x-auto shrink-0 z-20">
            <span className="text-[10px] font-mono text-[#8E8E8E] uppercase tracking-wider shrink-0 flex items-center gap-1">
              <Image className="w-3.5 h-3.5 text-[#C5A059]" />
              Saved AR Inspection Snaps:
            </span>
            <div className="flex items-center gap-2">
              {recentPhotos.map(photo => (
                <div
                  key={photo.id}
                  className="relative group rounded-lg overflow-hidden border border-[#3D3D3D] w-16 h-10 shrink-0"
                >
                  <img src={photo.url} alt={photo.caption} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Eye className="w-3.5 h-3.5 text-[#C5A059]" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
