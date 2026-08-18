import { VehicleInfo } from '../types';

export interface OemColor {
  name: string;
  hex: string;
  finish: 'metallic' | 'pearl' | 'gloss' | 'matte';
  isDefault?: boolean;
}

export interface VehicleMakePreset {
  make: string;
  models: {
    name: string;
    bodyClass: string;
    archetype: 'tesla_model3' | 'tesla_modely' | 'tesla_cybertruck' | 'truck' | 'suv' | 'sedan' | 'coupe_sports';
    trims: string[];
    defaultTrim: string;
    engine: string;
    driveType: string;
    fuelType: 'Electric' | 'Hybrid' | 'Gasoline' | 'Diesel';
    aluminumPanels?: string[]; // panels commonly aluminum
  }[];
  colors: OemColor[];
}

export const POPULAR_VEHICLE_PRESETS: VehicleMakePreset[] = [
  {
    make: 'Tesla',
    colors: [
      { name: 'Pearl White Multi-Coat', hex: '#F2F2F2', finish: 'pearl', isDefault: true },
      { name: 'Solid Black', hex: '#0D0D0E', finish: 'gloss' },
      { name: 'Midnight Silver Metallic / Stealth Grey', hex: '#3B3F46', finish: 'metallic' },
      { name: 'Deep Blue Metallic', hex: '#163166', finish: 'metallic' },
      { name: 'Ultra Red / Red Multi-Coat', hex: '#A81427', finish: 'metallic' },
      { name: 'Quicksilver', hex: '#959CA8', finish: 'metallic' },
    ],
    models: [
      {
        name: 'Model 3',
        bodyClass: 'Sedan/Saloon',
        archetype: 'tesla_model3',
        trims: ['Long Range AWD', 'Standard Range RWD', 'Performance AWD'],
        defaultTrim: 'Long Range AWD',
        engine: 'Dual AC Permanent Magnet Electric Motors (358 hp)',
        driveType: 'Dual Motor AWD',
        fuelType: 'Electric',
        aluminumPanels: ['hood', 'leftFrontDoor', 'rightFrontDoor', 'leftRearDoor', 'rightRearDoor', 'decklid'],
      },
      {
        name: 'Model Y',
        bodyClass: 'Sport Utility Vehicle (SUV)/Crossover',
        archetype: 'tesla_modely',
        trims: ['Long Range AWD', 'Performance AWD', 'Standard Range RWD'],
        defaultTrim: 'Long Range AWD',
        engine: 'Dual AC Electric Motors (384 hp)',
        driveType: 'Dual Motor AWD',
        fuelType: 'Electric',
        aluminumPanels: ['hood', 'decklid', 'leftFrontDoor', 'rightFrontDoor', 'leftRearDoor', 'rightRearDoor'],
      },
      {
        name: 'Model S',
        bodyClass: 'Sedan/Fastback',
        archetype: 'tesla_model3',
        trims: ['Plaid Tri-Motor', 'Dual Motor AWD'],
        defaultTrim: 'Plaid Tri-Motor',
        engine: 'Tri-Motor Electric AWD (1,020 hp)',
        driveType: 'Tri-Motor AWD',
        fuelType: 'Electric',
        aluminumPanels: ['hood', 'roof', 'decklid', 'leftFender', 'rightFender', 'leftFrontDoor', 'rightFrontDoor', 'leftRearDoor', 'rightRearDoor'],
      },
      {
        name: 'Cybertruck',
        bodyClass: 'Pickup Truck',
        archetype: 'tesla_cybertruck',
        trims: ['Cyberbeast Tri-Motor', 'All-Wheel Drive Dual Motor', 'Rear-Wheel Drive'],
        defaultTrim: 'Cyberbeast Tri-Motor',
        engine: 'Tri-Motor Electric Drive Unit (845 hp)',
        driveType: 'AWD',
        fuelType: 'Electric',
        aluminumPanels: [],
      },
    ],
  },
  {
    make: 'Ford',
    colors: [
      { name: 'Agate Black Metallic', hex: '#111215', finish: 'metallic', isDefault: true },
      { name: 'Oxford White', hex: '#EDEDED', finish: 'gloss' },
      { name: 'Carbonized Gray Metallic', hex: '#4B4F55', finish: 'metallic' },
      { name: 'Iconic Silver Metallic', hex: '#A8ACAF', finish: 'metallic' },
      { name: 'Rapid Red Metallic', hex: '#941B26', finish: 'metallic' },
      { name: 'Atlas Blue Metallic', hex: '#194578', finish: 'metallic' },
    ],
    models: [
      {
        name: 'F-150',
        bodyClass: 'Pickup Truck',
        archetype: 'truck',
        trims: ['Platinum SuperCrew', 'Lariat SuperCrew', 'King Ranch', 'Raptor', 'XLT'],
        defaultTrim: 'Platinum SuperCrew',
        engine: '3.5L EcoBoost Twin-Turbo V6 (400 hp)',
        driveType: '4WD',
        fuelType: 'Gasoline',
        aluminumPanels: ['hood', 'roof', 'decklid', 'leftFender', 'rightFender', 'leftFrontDoor', 'rightFrontDoor', 'leftRearDoor', 'rightRearDoor', 'leftQuarter', 'rightQuarter'],
      },
      {
        name: 'Mustang Mach-E',
        bodyClass: 'SUV/Crossover',
        archetype: 'tesla_modely',
        trims: ['GT Performance Edition', 'Premium AWD', 'Select'],
        defaultTrim: 'GT Performance Edition',
        engine: 'Dual eMotor Electric AWD (480 hp)',
        driveType: 'eAWD',
        fuelType: 'Electric',
        aluminumPanels: ['hood', 'decklid'],
      },
      {
        name: 'Mustang',
        bodyClass: 'Coupe',
        archetype: 'coupe_sports',
        trims: ['Dark Horse', 'GT Premium Fastback', 'EcoBoost'],
        defaultTrim: 'GT Premium Fastback',
        engine: '5.0L Coyote V8 (486 hp)',
        driveType: 'RWD',
        fuelType: 'Gasoline',
        aluminumPanels: ['hood', 'leftFender', 'rightFender'],
      },
    ],
  },
  {
    make: 'Mercedes-Benz',
    colors: [
      { name: 'Iridium Silver Metallic', hex: '#B5BAC2', finish: 'metallic', isDefault: true },
      { name: 'Polar White', hex: '#F0F0F0', finish: 'gloss' },
      { name: 'Obsidian Black Metallic', hex: '#121316', finish: 'metallic' },
      { name: 'Selenite Grey Metallic', hex: '#484B52', finish: 'metallic' },
      { name: 'Designo Cardinal Red Metallic', hex: '#8B1C28', finish: 'metallic' },
      { name: 'Nautical Blue Metallic', hex: '#162C4E', finish: 'metallic' },
    ],
    models: [
      {
        name: 'GLC 300',
        bodyClass: 'Sport Utility Vehicle (SUV)/Crossover',
        archetype: 'suv',
        trims: ['4Matic AWD', 'Base RWD', 'AMG GLC 43'],
        defaultTrim: '4Matic AWD',
        engine: '2.0L Inline-4 Turbocharged with 48V Mild Hybrid (255 hp)',
        driveType: '4Matic AWD',
        fuelType: 'Hybrid',
        aluminumPanels: ['hood', 'decklid', 'leftFender', 'rightFender'],
      },
      {
        name: 'C 300',
        bodyClass: 'Sedan',
        archetype: 'sedan',
        trims: ['4Matic Sedan', 'Base RWD', 'AMG C 43'],
        defaultTrim: '4Matic Sedan',
        engine: '2.0L Turbo Inline-4 with Mild Hybrid (255 hp)',
        driveType: '4Matic AWD',
        fuelType: 'Hybrid',
        aluminumPanels: ['hood', 'decklid', 'leftFender', 'rightFender'],
      },
      {
        name: 'GLE 350 / 450',
        bodyClass: 'SUV',
        archetype: 'suv',
        trims: ['GLE 450 4Matic', 'GLE 350 4Matic', 'AMG GLE 53'],
        defaultTrim: 'GLE 450 4Matic',
        engine: '3.0L Turbocharged Inline-6 with EQ Boost (375 hp)',
        driveType: '4Matic AWD',
        fuelType: 'Hybrid',
        aluminumPanels: ['hood', 'decklid', 'leftFender', 'rightFender'],
      },
    ],
  },
  {
    make: 'Chevrolet',
    colors: [
      { name: 'Torch Red', hex: '#C41926', finish: 'gloss', isDefault: true },
      { name: 'Black', hex: '#0B0B0C', finish: 'gloss' },
      { name: 'Arctic White', hex: '#EAEAEA', finish: 'gloss' },
      { name: 'Shark Gray Metallic', hex: '#585C64', finish: 'metallic' },
      { name: 'Rapid Blue', hex: '#2A72C8', finish: 'gloss' },
    ],
    models: [
      {
        name: 'Corvette',
        bodyClass: 'Coupe',
        archetype: 'coupe_sports',
        trims: ['Stingray 3LT Coupe', 'Z06 3LZ', 'E-Ray AWD Hybrid'],
        defaultTrim: 'Stingray 3LT Coupe',
        engine: '6.2L LT2 Crossplane Naturally Aspirated V8 (495 hp)',
        driveType: 'RWD',
        fuelType: 'Gasoline',
        aluminumPanels: ['hood', 'roof', 'decklid'],
      },
      {
        name: 'Silverado 1500',
        bodyClass: 'Pickup Truck',
        archetype: 'truck',
        trims: ['High Country Crew Cab', 'LTZ', 'ZR2', 'Custom'],
        defaultTrim: 'High Country Crew Cab',
        engine: '6.2L EcoTec3 V8 (420 hp)',
        driveType: '4WD',
        fuelType: 'Gasoline',
        aluminumPanels: ['hood', 'decklid', 'leftFrontDoor', 'rightFrontDoor', 'leftRearDoor', 'rightRearDoor'],
      },
    ],
  },
  {
    make: 'BMW',
    colors: [
      { name: 'Alpine White', hex: '#EDEDED', finish: 'gloss', isDefault: true },
      { name: 'Black Sapphire Metallic', hex: '#141518', finish: 'metallic' },
      { name: 'Mineral Grey Metallic', hex: '#494D54', finish: 'metallic' },
      { name: 'Portimao Blue Metallic', hex: '#1D4586', finish: 'metallic' },
      { name: 'San Remo Green Metallic', hex: '#1C3D32', finish: 'metallic' },
      { name: 'Isle of Man Green Metallic', hex: '#0A4A3B', finish: 'metallic' },
    ],
    models: [
      {
        name: '3 Series / M3',
        bodyClass: 'Sedan',
        archetype: 'sedan',
        trims: ['M3 Competition xDrive', '330i xDrive', 'M340i xDrive'],
        defaultTrim: 'M340i xDrive',
        engine: '3.0L BMW TwinPower Turbo Inline-6 (382 hp)',
        driveType: 'xDrive AWD',
        fuelType: 'Gasoline',
        aluminumPanels: ['hood', 'leftFender', 'rightFender'],
      },
      {
        name: 'X5',
        bodyClass: 'SUV',
        archetype: 'suv',
        trims: ['xDrive40i', 'M60i', 'xDrive50e Plug-In Hybrid'],
        defaultTrim: 'xDrive40i',
        engine: '3.0L TwinPower Turbo Inline-6 with 48V Mild Hybrid (375 hp)',
        driveType: 'xDrive AWD',
        fuelType: 'Hybrid',
        aluminumPanels: ['hood', 'decklid', 'leftFrontDoor', 'rightFrontDoor', 'leftRearDoor', 'rightRearDoor'],
      },
    ],
  },
  {
    make: 'Porsche',
    colors: [
      { name: 'GT Silver Metallic', hex: '#9AA0A8', finish: 'metallic', isDefault: true },
      { name: 'Guards Red', hex: '#B51B27', finish: 'gloss' },
      { name: 'Gentian Blue Metallic', hex: '#1B3566', finish: 'metallic' },
      { name: 'Jet Black Metallic', hex: '#101114', finish: 'metallic' },
      { name: 'Chalk', hex: '#CDC8C0', finish: 'gloss' },
    ],
    models: [
      {
        name: '911',
        bodyClass: 'Coupe',
        archetype: 'coupe_sports',
        trims: ['Carrera 4S', 'GT3 RS', 'Turbo S'],
        defaultTrim: 'Carrera 4S',
        engine: '3.0L Twin-Turbocharged Boxer 6 (443 hp)',
        driveType: 'AWD',
        fuelType: 'Gasoline',
        aluminumPanels: ['hood', 'roof', 'decklid', 'leftFender', 'rightFender', 'leftFrontDoor', 'rightFrontDoor'],
      },
      {
        name: 'Taycan',
        bodyClass: 'Sedan/Fastback',
        archetype: 'tesla_model3',
        trims: ['Turbo S', '4S', 'GTS'],
        defaultTrim: '4S',
        engine: 'Dual Permanent Magnet Synchronous Electric Motors (530 hp)',
        driveType: 'AWD',
        fuelType: 'Electric',
        aluminumPanels: ['hood', 'roof', 'decklid', 'leftFender', 'rightFender', 'leftFrontDoor', 'rightFrontDoor', 'leftRearDoor', 'rightRearDoor'],
      },
    ],
  },
  {
    make: 'Toyota',
    colors: [
      { name: 'Wind Chill Pearl', hex: '#EAEBEB', finish: 'pearl', isDefault: true },
      { name: 'Midnight Black Metallic', hex: '#101113', finish: 'metallic' },
      { name: 'Magnetic Gray Metallic', hex: '#4A4D53', finish: 'metallic' },
      { name: 'Supersonic Red', hex: '#B21727', finish: 'metallic' },
      { name: 'Blueprint', hex: '#1A3358', finish: 'metallic' },
    ],
    models: [
      {
        name: 'RAV4',
        bodyClass: 'SUV/Crossover',
        archetype: 'suv',
        trims: ['XSE Hybrid AWD', 'Prime Plug-In Hybrid', 'TRD Off-Road', 'LE'],
        defaultTrim: 'XSE Hybrid AWD',
        engine: '2.5L 4-Cylinder Hybrid System (219 hp)',
        driveType: 'Electronic AWD',
        fuelType: 'Hybrid',
        aluminumPanels: ['hood'],
      },
      {
        name: 'Tacoma / Tundra',
        bodyClass: 'Pickup Truck',
        archetype: 'truck',
        trims: ['TRD Pro CrewMax', 'Limited', 'SR5'],
        defaultTrim: 'TRD Pro CrewMax',
        engine: 'i-FORCE MAX 3.4L Twin-Turbo V6 Hybrid (437 hp)',
        driveType: '4WDemand Part-Time 4WD',
        fuelType: 'Hybrid',
        aluminumPanels: ['hood', 'decklid'],
      },
      {
        name: 'Camry',
        bodyClass: 'Sedan',
        archetype: 'sedan',
        trims: ['XSE AWD', 'TRD', 'XLE Hybrid'],
        defaultTrim: 'XSE AWD',
        engine: '2.5L 4-Cylinder Hybrid (225 hp)',
        driveType: 'AWD',
        fuelType: 'Hybrid',
        aluminumPanels: ['hood'],
      },
    ],
  },
];

/**
 * Intelligent helper to deduce the accurate engine, powertrain, EV status, and 3D archetype
 * from make, model, trim, or VIN.
 */
export function deduceVehicleDetails(make: string, model: string, trim?: string): {
  engine: string;
  driveType: string;
  fuelType: 'Electric' | 'Hybrid' | 'Gasoline' | 'Diesel';
  archetype: 'tesla_model3' | 'tesla_modely' | 'tesla_cybertruck' | 'truck' | 'suv' | 'sedan' | 'coupe_sports';
  bodyClass: string;
  defaultColors: OemColor[];
  aluminumPanels: string[];
} {
  const m = (make || '').trim().toLowerCase();
  const mod = (model || '').trim().toLowerCase();
  const t = (trim || '').trim().toLowerCase();

  // Find make preset
  const makePreset = POPULAR_VEHICLE_PRESETS.find(p => p.make.toLowerCase() === m);
  if (makePreset) {
    const modelPreset = makePreset.models.find(mp => mod.includes(mp.name.toLowerCase()) || mp.name.toLowerCase().includes(mod));
    if (modelPreset) {
      return {
        engine: modelPreset.engine,
        driveType: modelPreset.driveType,
        fuelType: modelPreset.fuelType,
        archetype: modelPreset.archetype,
        bodyClass: modelPreset.bodyClass,
        defaultColors: makePreset.colors,
        aluminumPanels: modelPreset.aluminumPanels || [],
      };
    }
  }

  // Fallback heuristic classification
  const isTesla = m.includes('tesla');
  const isEV = isTesla || mod.includes('electric') || mod.includes('mach-e') || mod.includes('taycan') || mod.includes('ioniq') || mod.includes('lightning') || mod.includes('rivian') || mod.includes('lucid');
  const isTruck = mod.includes('truck') || mod.includes('f-150') || mod.includes('silverado') || mod.includes('sierra') || mod.includes('ram') || mod.includes('tundra') || mod.includes('tacoma') || mod.includes('cybertruck') || mod.includes('r1t');
  const isSUV = mod.includes('suv') || mod.includes('crossover') || mod.includes('glc') || mod.includes('x5') || mod.includes('rav4') || mod.includes('cr-v') || mod.includes('explorer') || mod.includes('tahoe') || mod.includes('model y') || mod.includes('model x');
  const isCoupe = mod.includes('corvette') || mod.includes('911') || mod.includes('mustang') || mod.includes('camaro') || mod.includes('coupe') || mod.includes('gt-r');

  let archetype: 'tesla_model3' | 'tesla_modely' | 'tesla_cybertruck' | 'truck' | 'suv' | 'sedan' | 'coupe_sports' = 'sedan';
  let bodyClass = 'Sedan';
  let engine = '2.0L Turbocharged 4-Cylinder (248 hp)';
  let driveType = 'All-Wheel Drive (AWD)';
  let fuelType: 'Electric' | 'Hybrid' | 'Gasoline' | 'Diesel' = 'Gasoline';

  if (isTesla) {
    fuelType = 'Electric';
    driveType = 'Dual Motor All-Wheel Drive (AWD)';
    if (mod.includes('cybertruck')) {
      archetype = 'tesla_cybertruck';
      bodyClass = 'Pickup Truck';
      engine = 'Tri-Motor Electric Drive Unit (845 hp)';
    } else if (mod.includes('y') || mod.includes('x')) {
      archetype = 'tesla_modely';
      bodyClass = 'Sport Utility Vehicle (SUV)/Crossover';
      engine = 'Dual AC Permanent Magnet Electric Motors (384 hp)';
    } else {
      archetype = 'tesla_model3';
      bodyClass = 'Sedan/Fastback';
      engine = 'Dual AC Permanent Magnet Electric Motors (358 hp)';
    }
  } else if (isEV) {
    fuelType = 'Electric';
    driveType = 'Dual Motor AWD';
    engine = 'Dual Electric Drive Unit (300+ hp)';
    archetype = isTruck ? 'truck' : isSUV ? 'suv' : 'tesla_model3';
    bodyClass = isTruck ? 'Pickup Truck' : isSUV ? 'SUV' : 'Sedan';
  } else if (isTruck) {
    archetype = 'truck';
    bodyClass = 'Pickup Truck';
    engine = '3.5L Twin-Turbo V6 / V8 (395 hp)';
    driveType = '4WD / 4x4';
  } else if (isSUV) {
    archetype = 'suv';
    bodyClass = 'Sport Utility Vehicle (SUV)';
    engine = '2.0L - 3.0L Turbocharged Engine (260 hp)';
    driveType = 'AWD';
  } else if (isCoupe) {
    archetype = 'coupe_sports';
    bodyClass = 'Coupe / Sports Car';
    engine = 'V8 / Turbo High-Output Performance Engine (450+ hp)';
    driveType = 'RWD';
  }

  const defaultColors: OemColor[] = makePreset ? makePreset.colors : [
    { name: 'Pearl White', hex: '#F0F0F0', finish: 'pearl', isDefault: true },
    { name: 'Midnight Black', hex: '#111214', finish: 'gloss' },
    { name: 'Silver Metallic', hex: '#A6ABB4', finish: 'metallic' },
    { name: 'Slate Grey', hex: '#474B52', finish: 'metallic' },
    { name: 'Deep Blue Metallic', hex: '#183464', finish: 'metallic' },
    { name: 'Crimson Red Metallic', hex: '#9E1826', finish: 'metallic' },
  ];

  return {
    engine,
    driveType,
    fuelType,
    archetype,
    bodyClass,
    defaultColors,
    aluminumPanels: isTesla ? ['hood', 'decklid', 'leftFrontDoor', 'rightFrontDoor', 'leftRearDoor', 'rightRearDoor'] : ['hood'],
  };
}

/**
 * Returns hexadecimal color code for any string color name or hex
 */
export function getHexColor(colorNameOrHex: string): string {
  if (!colorNameOrHex) return '#F0F0F0';
  if (colorNameOrHex.startsWith('#')) return colorNameOrHex;
  const c = colorNameOrHex.toLowerCase();
  if (c.includes('white') || c.includes('pearl')) return '#F3F4F6';
  if (c.includes('black') || c.includes('obsidian') || c.includes('dark')) return '#121316';
  if (c.includes('grey') || c.includes('gray') || c.includes('stealth') || c.includes('selenite') || c.includes('carbon')) return '#3D4148';
  if (c.includes('silver') || c.includes('iridium') || c.includes('quicksilver')) return '#B0B5BE';
  if (c.includes('blue') || c.includes('nautical') || c.includes('deep blue') || c.includes('navy')) return '#163166';
  if (c.includes('red') || c.includes('ultra red') || c.includes('cardinal') || c.includes('torch') || c.includes('crimson')) return '#A61726';
  if (c.includes('green')) return '#1A3F33';
  if (c.includes('yellow') || c.includes('gold')) return '#C5A059';
  return '#B0B5BE';
}
