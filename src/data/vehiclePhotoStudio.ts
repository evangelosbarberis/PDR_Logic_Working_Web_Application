import { VehicleInfo } from '../types';

export interface VehiclePhotoAngle {
  id: string;
  name: string;
  azimuthDeg: number; // 0 to 360 deg
  elevation: 'eye-level' | 'high-angle' | 'detail';
  imageUrl: string;
  clickablePanels: {
    panelId: string;
    label: string;
    polygonPercent: [number, number][]; // SVG / Canvas polygon [x%, y%] coordinates on the photo
    badgeAnchorPercent: [number, number]; // [x%, y%] for dent badges & click anchors
  }[];
}

export interface VehiclePhotoModel {
  vehicleKey: string; // e.g., 'tesla_model3_white', 'tesla_model3_red', 'tesla_modely', 'mercedes_glc', etc.
  name: string;
  make: string;
  model: string;
  colorName: string;
  colorHex: string;
  angles: VehiclePhotoAngle[];
}

// Helper to generate a rich, ultra-realistic SVG photographic studio render for any vehicle angle
function generateVehicleStudioAngleSvg(
  make: string,
  model: string,
  year: string,
  colorHex: string,
  colorName: string,
  angleName: string,
  angleDeg: number,
  archetype: 'tesla_model3' | 'tesla_modely' | 'tesla_cybertruck' | 'truck' | 'suv' | 'sedan' | 'coupe_sports' = 'tesla_model3'
): string {
  const isTesla = make.toLowerCase().includes('tesla') || archetype.startsWith('tesla');
  const isWhite = colorHex.toLowerCase() === '#f2f2f2' || colorHex.toLowerCase() === '#ffffff' || colorName.toLowerCase().includes('white');
  const isRed = colorHex.toLowerCase() === '#a81427' || colorName.toLowerCase().includes('red');
  const isBlack = colorHex.toLowerCase() === '#0d0d0e' || colorName.toLowerCase().includes('black');
  const isBlue = colorHex.toLowerCase() === '#163166' || colorName.toLowerCase().includes('blue');
  const isSilver = colorHex.toLowerCase() === '#3b3f46' || colorHex.toLowerCase() === '#959ca8' || colorName.toLowerCase().includes('silver') || colorName.toLowerCase().includes('grey');

  const primaryFill = colorHex || (isRed ? '#A81427' : isBlack ? '#111215' : isBlue ? '#1E3A8A' : isSilver ? '#4B5563' : '#F1F3F5');
  const shadowFill = isWhite ? '#D1D5DB' : '#0A0A0C';
  const highlightFill = isWhite ? '#FFFFFF' : isBlack ? '#374151' : '#FCA5A5';
  
  // Angle-specific perspective projection and vehicle silhouette
  let vehicleBodyPath = '';
  let glassPath = '';
  let wheelsMarkup = '';
  let panelLines = '';
  let badgePositions: Record<string, [number, number]> = {};

  if (angleDeg === 0 || angleDeg === 360) {
    // 1. FRONT DIRECT VIEW (0°)
    vehicleBodyPath = `
      M 280,310 
      C 290,260 330,220 380,210 
      L 460,205 
      C 560,195 640,195 740,205 
      L 820,210 
      C 870,220 910,260 920,310 
      L 940,360 
      C 950,420 940,460 925,480 
      L 905,490 
      L 880,510 
      C 840,520 760,525 600,525 
      C 440,525 360,520 320,510 
      L 295,490 
      L 275,480 
      C 260,460 250,420 260,360 Z
    `;
    glassPath = `
      M 390,215 
      C 440,210 520,208 600,208 
      C 680,208 760,210 810,215 
      C 800,270 780,285 760,290 
      L 440,290 
      C 420,285 400,270 390,215 Z
    `;
    wheelsMarkup = `
      <!-- Front Tires -->
      <rect x="255" y="440" width="45" height="85" rx="10" fill="#18181B" stroke="#27272A" stroke-width="3" />
      <rect x="900" y="440" width="45" height="85" rx="10" fill="#18181B" stroke="#27272A" stroke-width="3" />
    `;
    panelLines = `
      <!-- Front Hood Lines & Headlights -->
      <path d="M 420,290 C 430,370 440,410 460,440 L 740,440 C 760,410 770,370 780,290" fill="none" stroke="${shadowFill}" stroke-width="2" opacity="0.6" />
      <path d="M 310,340 C 350,330 410,350 430,370 C 410,390 340,385 300,365 Z" fill="#E2E8F0" filter="url(#glow)" />
      <path d="M 890,340 C 850,330 790,350 770,370 C 790,390 860,385 900,365 Z" fill="#E2E8F0" filter="url(#glow)" />
      ${isTesla ? `
        <!-- Tesla Smooth Aerodynamic Flush Nose Cone & Logo -->
        <path d="M 480,450 C 540,440 660,440 720,450 C 710,470 660,480 600,480 C 540,480 490,470 480,450 Z" fill="${shadowFill}" opacity="0.4" />
        <path d="M 590,420 L 600,410 L 610,420 L 606,420 L 600,414 L 594,420 Z" fill="#CBD5E1" />
      ` : `
        <!-- Classic Grille -->
        <rect x="470" y="420" width="260" height="50" rx="8" fill="#1F2937" stroke="#9CA3AF" stroke-width="2" />
      `}
    `;
    badgePositions = {
      hood: [600, 360],
      leftFender: [330, 320],
      rightFender: [870, 320],
      frontBumper: [600, 480],
    };
  } else if (angleDeg === 45) {
    // 2. FRONT THREE-QUARTER DRIVER (45°)
    vehicleBodyPath = `
      M 160,420 
      L 190,360 
      C 220,320 280,260 380,220 
      C 480,180 600,170 710,180 
      L 860,220 
      C 930,245 990,290 1020,350 
      L 1040,410 
      C 1050,450 1030,480 980,495 
      L 860,505 
      C 720,515 540,520 380,515 
      L 240,500 
      C 180,480 150,455 160,420 Z
    `;
    glassPath = `
      M 390,225 
      C 480,190 590,180 700,190 
      L 840,225 
      C 800,270 760,285 710,290 
      L 440,290 
      C 410,270 395,245 390,225 Z
    `;
    wheelsMarkup = `
      <!-- Left Front & Left Rear Wheels -->
      <ellipse cx="320" cy="460" rx="55" ry="60" fill="#18181B" stroke="#3F3F46" stroke-width="4" />
      <circle cx="320" cy="460" r="32" fill="#27272A" stroke="#71717A" stroke-width="3" />
      <!-- Rear wheel visible -->
      <ellipse cx="880" cy="450" rx="48" ry="54" fill="#18181B" stroke="#3F3F46" stroke-width="3" />
      <circle cx="880" cy="450" r="28" fill="#27272A" stroke="#71717A" stroke-width="2" />
    `;
    panelLines = `
      <!-- Driver Side Doors & Fender Seams -->
      <path d="M 430,290 L 410,480" stroke="${shadowFill}" stroke-width="2.5" opacity="0.6" />
      <path d="M 620,285 L 610,485" stroke="${shadowFill}" stroke-width="2.5" opacity="0.6" />
      <path d="M 800,280 L 810,480" stroke="${shadowFill}" stroke-width="2.5" opacity="0.6" />
      <!-- Hood edge -->
      <path d="M 390,290 C 330,340 240,360 180,390" stroke="${shadowFill}" stroke-width="2" opacity="0.7" fill="none" />
      <!-- Headlight -->
      <polygon points="170,380 230,350 260,370 200,410" fill="#F8FAFC" filter="url(#glow)" />
    `;
    badgePositions = {
      hood: [340, 310],
      leftFender: [240, 370],
      leftFrontDoor: [520, 370],
      leftRearDoor: [710, 365],
      leftQuarter: [890, 350],
      roof: [580, 230],
      leftRoofRail: [540, 280],
    };
  } else if (angleDeg === 90) {
    // 3. DRIVER SIDE PROFILE (90°)
    vehicleBodyPath = `
      M 110,420 
      C 120,380 150,350 210,340 
      L 330,330 
      L 450,230 
      C 520,200 680,200 780,230 
      L 910,330 
      L 1040,340 
      C 1070,360 1090,390 1080,430 
      L 1060,465 
      L 980,480 
      C 880,490 320,490 220,480 
      L 140,465 Z
    `;
    glassPath = `
      M 460,240 
      L 770,240 
      C 840,290 880,325 890,330 
      L 360,330 
      C 400,285 430,255 460,240 Z
    `;
    wheelsMarkup = `
      <!-- Front Wheel Left -->
      <circle cx="270" cy="455" r="55" fill="#18181B" stroke="#3F3F46" stroke-width="4" />
      <circle cx="270" cy="455" r="32" fill="#27272A" stroke="#94A3B8" stroke-width="3" />
      <!-- Rear Wheel Left -->
      <circle cx="920" cy="455" r="55" fill="#18181B" stroke="#3F3F46" stroke-width="4" />
      <circle cx="920" cy="455" r="32" fill="#27272A" stroke="#94A3B8" stroke-width="3" />
    `;
    panelLines = `
      <!-- Door cutlines -->
      <line x1="390" y1="330" x2="390" y2="475" stroke="${shadowFill}" stroke-width="2.5" opacity="0.7" />
      <line x1="610" y1="330" x2="610" y2="475" stroke="${shadowFill}" stroke-width="2.5" opacity="0.7" />
      <line x1="810" y1="330" x2="810" y2="475" stroke="${shadowFill}" stroke-width="2.5" opacity="0.7" />
      <!-- Flush handles -->
      <rect x="540" y="355" width="28" height="6" rx="2" fill="#0F172A" />
      <rect x="740" y="355" width="28" height="6" rx="2" fill="#0F172A" />
    `;
    badgePositions = {
      leftFender: [270, 360],
      leftFrontDoor: [500, 390],
      leftRearDoor: [710, 390],
      leftQuarter: [930, 370],
      roof: [620, 220],
      leftRoofRail: [620, 300],
    };
  } else if (angleDeg === 135) {
    // 4. REAR THREE-QUARTER DRIVER (135°)
    vehicleBodyPath = `
      M 160,360 
      C 180,290 240,245 320,225 
      L 480,180 
      C 590,170 710,180 810,220 
      C 910,260 970,320 1000,360 
      L 1030,420 
      C 1040,460 1010,485 960,500 
      L 820,515 
      C 660,520 480,515 340,505 
      L 210,490 
      C 160,470 140,430 160,360 Z
    `;
    glassPath = `
      M 340,230 
      C 440,190 560,180 670,190 
      L 760,230 
      C 730,270 700,285 660,290 
      L 410,290 
      C 370,270 350,250 340,230 Z
    `;
    wheelsMarkup = `
      <ellipse cx="320" cy="455" rx="48" ry="54" fill="#18181B" stroke="#3F3F46" stroke-width="3" />
      <circle cx="320" cy="455" r="28" fill="#27272A" stroke="#71717A" stroke-width="2" />
      <ellipse cx="880" cy="460" rx="55" ry="60" fill="#18181B" stroke="#3F3F46" stroke-width="4" />
      <circle cx="880" cy="460" r="32" fill="#27272A" stroke="#71717A" stroke-width="3" />
    `;
    panelLines = `
      <!-- Rear decklid and taillight -->
      <path d="M 760,290 C 820,330 920,350 1000,370" stroke="${shadowFill}" stroke-width="2" opacity="0.7" fill="none" />
      <polygon points="980,380 920,355 890,375 960,410" fill="#DC2626" filter="url(#glowRed)" />
      <!-- Rear bumper cutline -->
      <path d="M 780,440 L 980,445" stroke="${shadowFill}" stroke-width="2" opacity="0.6" />
    `;
    badgePositions = {
      decklid: [820, 330],
      leftQuarter: [680, 370],
      leftRearDoor: [480, 380],
      roof: [540, 230],
      leftRoofRail: [540, 290],
      rearBumper: [880, 470],
    };
  } else if (angleDeg === 180) {
    // 5. REAR DIRECT VIEW (180°)
    vehicleBodyPath = `
      M 280,310 
      C 290,260 330,220 380,210 
      L 460,205 
      C 560,195 640,195 740,205 
      L 820,210 
      C 870,220 910,260 920,310 
      L 940,360 
      C 950,420 940,460 925,480 
      L 905,490 
      L 880,510 
      C 840,520 760,525 600,525 
      C 440,525 360,520 320,510 
      L 295,490 
      L 275,480 
      C 260,460 250,420 260,360 Z
    `;
    glassPath = `
      M 390,215 
      C 440,210 520,208 600,208 
      C 680,208 760,210 810,215 
      C 800,270 780,285 760,290 
      L 440,290 
      C 420,285 400,270 390,215 Z
    `;
    wheelsMarkup = `
      <rect x="255" y="440" width="45" height="85" rx="10" fill="#18181B" stroke="#27272A" stroke-width="3" />
      <rect x="900" y="440" width="45" height="85" rx="10" fill="#18181B" stroke="#27272A" stroke-width="3" />
    `;
    panelLines = `
      <!-- Decklid trunk cutouts and wrap-around LED tail lights -->
      <path d="M 430,290 L 430,440 L 770,440 L 770,290" fill="none" stroke="${shadowFill}" stroke-width="2.5" opacity="0.6" />
      <!-- Left taillight -->
      <polygon points="310,350 420,345 420,380 320,385" fill="#DC2626" filter="url(#glowRed)" />
      <!-- Right taillight -->
      <polygon points="890,350 780,345 780,380 880,385" fill="#DC2626" filter="url(#glowRed)" />
      <!-- License Plate Recess -->
      <rect x="520" y="380" width="160" height="40" rx="4" fill="#09090B" stroke="#27272A" stroke-width="2" />
      <text x="600" y="405" font-family="monospace" font-size="16" font-weight="bold" fill="#F8FAFC" text-anchor="middle">PDR-LOGIC</text>
    `;
    badgePositions = {
      decklid: [600, 335],
      leftQuarter: [330, 320],
      rightQuarter: [870, 320],
      rearBumper: [600, 480],
      roof: [600, 240],
    };
  } else if (angleDeg === 225) {
    // 6. REAR THREE-QUARTER PASSENGER (225°)
    vehicleBodyPath = `
      M 170,420 
      L 200,360 
      C 230,320 290,260 390,220 
      C 490,180 610,170 720,180 
      L 870,220 
      C 940,245 1000,290 1030,350 
      L 1050,410 
      C 1060,450 1040,480 990,495 
      L 870,505 
      C 730,515 550,520 390,515 
      L 250,500 
      C 190,480 160,455 170,420 Z
    `;
    glassPath = `
      M 400,225 
      C 490,190 600,180 710,190 
      L 850,225 
      C 810,270 770,285 720,290 
      L 450,290 
      C 420,270 405,245 400,225 Z
    `;
    wheelsMarkup = `
      <ellipse cx="320" cy="460" rx="55" ry="60" fill="#18181B" stroke="#3F3F46" stroke-width="4" />
      <circle cx="320" cy="460" r="32" fill="#27272A" stroke="#71717A" stroke-width="3" />
      <ellipse cx="880" cy="450" rx="48" ry="54" fill="#18181B" stroke="#3F3F46" stroke-width="3" />
      <circle cx="880" cy="450" r="28" fill="#27272A" stroke="#71717A" stroke-width="2" />
    `;
    panelLines = `
      <path d="M 370,290 C 310,330 210,350 130,370" stroke="${shadowFill}" stroke-width="2" opacity="0.7" fill="none" />
      <polygon points="150,380 210,355 240,375 170,410" fill="#DC2626" filter="url(#glowRed)" />
    `;
    badgePositions = {
      decklid: [380, 330],
      rightQuarter: [520, 370],
      rightRearDoor: [720, 380],
      roof: [660, 230],
      rightRoofRail: [660, 290],
      rearBumper: [320, 470],
    };
  } else if (angleDeg === 270) {
    // 7. PASSENGER SIDE PROFILE (270°)
    vehicleBodyPath = `
      M 110,420 
      C 120,380 150,350 210,340 
      L 330,330 
      L 450,230 
      C 520,200 680,200 780,230 
      L 910,330 
      L 1040,340 
      C 1070,360 1090,390 1080,430 
      L 1060,465 
      L 980,480 
      C 880,490 320,490 220,480 
      L 140,465 Z
    `;
    glassPath = `
      M 460,240 
      L 770,240 
      C 840,290 880,325 890,330 
      L 360,330 
      C 400,285 430,255 460,240 Z
    `;
    wheelsMarkup = `
      <circle cx="270" cy="455" r="55" fill="#18181B" stroke="#3F3F46" stroke-width="4" />
      <circle cx="270" cy="455" r="32" fill="#27272A" stroke="#94A3B8" stroke-width="3" />
      <circle cx="920" cy="455" r="55" fill="#18181B" stroke="#3F3F46" stroke-width="4" />
      <circle cx="920" cy="455" r="32" fill="#27272A" stroke="#94A3B8" stroke-width="3" />
    `;
    panelLines = `
      <line x1="390" y1="330" x2="390" y2="475" stroke="${shadowFill}" stroke-width="2.5" opacity="0.7" />
      <line x1="610" y1="330" x2="610" y2="475" stroke="${shadowFill}" stroke-width="2.5" opacity="0.7" />
      <line x1="810" y1="330" x2="810" y2="475" stroke="${shadowFill}" stroke-width="2.5" opacity="0.7" />
      <rect x="540" y="355" width="28" height="6" rx="2" fill="#0F172A" />
      <rect x="740" y="355" width="28" height="6" rx="2" fill="#0F172A" />
    `;
    badgePositions = {
      rightQuarter: [270, 370],
      rightRearDoor: [490, 390],
      rightFrontDoor: [700, 390],
      rightFender: [930, 360],
      roof: [580, 220],
      rightRoofRail: [580, 300],
    };
  } else if (angleDeg === 315) {
    // 8. FRONT THREE-QUARTER PASSENGER (315°)
    vehicleBodyPath = `
      M 160,360 
      C 190,300 250,250 320,225 
      L 470,180 
      C 580,170 700,180 800,220 
      C 900,260 960,320 990,360 
      L 1020,420 
      C 1030,460 1000,485 950,500 
      L 810,515 
      C 650,520 470,515 330,505 
      L 200,490 
      C 150,470 130,430 150,360 Z
    `;
    glassPath = `
      M 340,230 
      C 440,190 560,180 670,190 
      L 760,230 
      C 730,270 700,285 660,290 
      L 410,290 
      C 370,270 350,250 340,230 Z
    `;
    wheelsMarkup = `
      <ellipse cx="320" cy="450" rx="48" ry="54" fill="#18181B" stroke="#3F3F46" stroke-width="3" />
      <circle cx="320" cy="450" r="28" fill="#27272A" stroke="#71717A" stroke-width="2" />
      <ellipse cx="880" cy="460" rx="55" ry="60" fill="#18181B" stroke="#3F3F46" stroke-width="4" />
      <circle cx="880" cy="460" r="32" fill="#27272A" stroke="#71717A" stroke-width="3" />
    `;
    panelLines = `
      <path d="M 760,290 C 820,330 920,350 1000,370" stroke="${shadowFill}" stroke-width="2" opacity="0.7" fill="none" />
      <polygon points="1010,380 950,350 920,370 980,410" fill="#F8FAFC" filter="url(#glow)" />
    `;
    badgePositions = {
      hood: [860, 310],
      rightFender: [960, 370],
      rightFrontDoor: [680, 370],
      rightRearDoor: [490, 365],
      rightQuarter: [310, 350],
      roof: [620, 230],
      rightRoofRail: [660, 280],
    };
  } else {
    // 9. TOP OVERHEAD BLUEPRINT SCHEMATIC (999°)
    vehicleBodyPath = `
      M 400,100 
      C 420,70 580,70 600,100 
      L 620,180 
      L 640,300 
      L 640,550 
      L 620,680 
      C 600,710 400,710 380,680 
      L 360,550 
      L 360,300 
      L 380,180 Z
    `;
    glassPath = `
      M 410,240 L 590,240 L 580,500 L 420,500 Z
    `;
    badgePositions = {
      hood: [500, 160],
      roof: [500, 370],
      decklid: [500, 620],
      leftFender: [350, 170],
      rightFender: [650, 170],
      leftFrontDoor: [340, 300],
      rightFrontDoor: [660, 300],
      leftRearDoor: [340, 440],
      rightRearDoor: [660, 440],
      leftQuarter: [340, 580],
      rightQuarter: [660, 580],
    };
  }

  // Convert SVG string to Data URL
  const svgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 650" width="100%" height="100%">
      <defs>
        <!-- Studio Lighting & Gradients -->
        <linearGradient id="studioFloor" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#141416" />
          <stop offset="60%" stop-color="#1F2024" />
          <stop offset="100%" stop-color="#090A0C" />
        </linearGradient>

        <radialGradient id="turntableGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#C5A059" stop-opacity="0.18" />
          <stop offset="60%" stop-color="#C5A059" stop-opacity="0.05" />
          <stop offset="100%" stop-color="#000000" stop-opacity="0" />
        </radialGradient>

        <radialGradient id="bodyPaintGrad" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stop-color="${highlightFill}" stop-opacity="${isWhite ? '1.0' : '0.45'}" />
          <stop offset="40%" stop-color="${primaryFill}" />
          <stop offset="100%" stop-color="${shadowFill}" />
        </radialGradient>

        <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="25" stdDeviation="30" flood-color="#000000" flood-opacity="0.85" />
        </filter>

        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id="glowRed" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="6" flood-color="#EF4444" flood-opacity="0.8" />
        </filter>
      </defs>

      <!-- Background: Studio Stage -->
      <rect width="1200" height="650" fill="url(#studioFloor)" />

      <!-- Photorealistic Turntable Pedestal -->
      <ellipse cx="600" cy="500" rx="520" ry="120" fill="url(#turntableGlow)" />
      <ellipse cx="600" cy="500" rx="460" ry="95" fill="none" stroke="#2D2D32" stroke-width="2" stroke-dasharray="12 8" />
      <ellipse cx="600" cy="500" rx="380" ry="75" fill="none" stroke="#C5A059" stroke-width="1.5" stroke-opacity="0.4" />

      <!-- Ground Shadow underneath Vehicle -->
      <ellipse cx="600" cy="510" rx="440" ry="50" fill="#000000" opacity="0.75" filter="url(#shadow)" />

      <!-- Wheels Layer -->
      <g>
        ${wheelsMarkup}
      </g>

      <!-- Vehicle Primary Body Solid -->
      <path d="${vehicleBodyPath}" fill="url(#bodyPaintGrad)" filter="url(#shadow)" stroke="${isWhite ? '#94A3B8' : '#334155'}" stroke-width="1.5" />

      <!-- Glass / Panoramic Roof Area -->
      <path d="${glassPath}" fill="#0A0F1D" stroke="#1E293B" stroke-width="2" opacity="0.9" />

      <!-- Panel Seams & Headlights/Taillights -->
      <g>
        ${panelLines}
      </g>

      <!-- Angle & Studio Specs Overlay Watermark -->
      <g opacity="0.85">
        <text x="50" y="60" font-family="system-ui, sans-serif" font-size="20" font-weight="900" fill="#E2E8F0" letter-spacing="1">
          ${year} ${make.toUpperCase()} ${model.toUpperCase()}
        </text>
        <text x="50" y="85" font-family="monospace" font-size="12" fill="#C5A059" letter-spacing="2">
          OEM FINISH: ${colorName.toUpperCase()} &bull; STUDIO 360&deg; ANGLE: ${angleDeg}&deg; [${angleName.toUpperCase()}]
        </text>
      </g>
    </svg>
  `;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svgContent)}`;
}

// 8 Discrete 360 Photographic Walkaround Studio Angles (0°, 45°, 90°, 135°, 180°, 225°, 270°, 315°)
export const PHOTO_STUDIO_ANGLES = [
  { id: 'front', name: 'Front Direct', deg: 0, label: '0° Front', panels: ['hood', 'frontBumper', 'leftFender', 'rightFender'] },
  { id: 'front-left', name: 'Front 3/4 Driver', deg: 45, label: '45° Front Left', panels: ['hood', 'leftFender', 'leftFrontDoor', 'leftRearDoor', 'leftQuarter', 'roof', 'leftRoofRail'] },
  { id: 'left', name: 'Driver Side Profile', deg: 90, label: '90° Driver Side', panels: ['leftFender', 'leftFrontDoor', 'leftRearDoor', 'leftQuarter', 'roof', 'leftRoofRail'] },
  { id: 'rear-left', name: 'Rear 3/4 Driver', deg: 135, label: '135° Rear Left', panels: ['decklid', 'leftQuarter', 'leftRearDoor', 'roof', 'leftRoofRail', 'rearBumper'] },
  { id: 'rear', name: 'Rear Direct', deg: 180, label: '180° Rear', panels: ['decklid', 'rearBumper', 'leftQuarter', 'rightQuarter', 'roof'] },
  { id: 'rear-right', name: 'Rear 3/4 Passenger', deg: 225, label: '225° Rear Right', panels: ['decklid', 'rightQuarter', 'rightRearDoor', 'roof', 'rightRoofRail', 'rearBumper'] },
  { id: 'right', name: 'Passenger Side Profile', deg: 270, label: '270° Passenger Side', panels: ['rightFender', 'rightFrontDoor', 'rightRearDoor', 'rightQuarter', 'roof', 'rightRoofRail'] },
  { id: 'front-right', name: 'Front 3/4 Passenger', deg: 315, label: '315° Front Right', panels: ['hood', 'rightFender', 'rightFrontDoor', 'rightRearDoor', 'rightQuarter', 'roof', 'rightRoofRail'] },
];

export function getVehiclePhotoAngleUrl(
  vehicle: VehicleInfo,
  angleDeg: number
): string {
  return generateVehicleStudioAngleSvg(
    vehicle.make || 'Tesla',
    vehicle.model || 'Model 3',
    vehicle.year || '2024',
    vehicle.colorHex || '#F2F2F2',
    vehicle.color || 'Pearl White Multi-Coat',
    PHOTO_STUDIO_ANGLES.find(a => a.deg === angleDeg)?.name || 'Angle',
    angleDeg,
    vehicle.archetype || (vehicle.make?.toLowerCase().includes('tesla') ? 'tesla_model3' : 'sedan')
  );
}
