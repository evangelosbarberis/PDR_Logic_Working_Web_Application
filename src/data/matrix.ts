import { DentSize, MatrixPanelType, PanelId, MarkupType, MarkupOption, PanelDamage, Estimate } from '../types';

export const COIN_DIMENSIONS = {
  dime: { name: 'Dime', diameterMm: 17.91, symbol: 'D', code: 'D' },
  nickel: { name: 'Nickel', diameterMm: 21.21, symbol: 'N', code: 'N' },
  quarter: { name: 'Quarter', diameterMm: 24.26, symbol: 'Q', code: 'Q' },
  halfDollar: { name: 'Half Dollar', diameterMm: 30.61, symbol: 'H', code: 'H' },
} as const;

export const OVERSIZE_PRICING = {
  halfDollarPlus: 50, // Damage that exceeds half dollar size add $50 per dent
  doubleOversize: 100, // Damage that matched double oversize add $100 per dent
};

export const MARKUP_DEFINITIONS: MarkupOption[] = [
  { id: 'xlPanel', label: 'XL Panel / Tall Vehicle', percentage: 25, description: 'Oversized roof, hood or lifted/tall truck' },
  { id: 'gluePull', label: 'Glue Pull', percentage: 25, description: 'Glue pulling required due to obstructed backside' },
  { id: 'highStrengthSteel', label: 'High Strength Steel (HSS)', percentage: 25, description: 'Boron/UHSS or high strength alloy panel' },
  { id: 'limitedAccess', label: 'Limited Access', percentage: 25, description: 'Inner bracing, sound deadening, or tight framework' },
  { id: 'aluminumPanels', label: 'Aluminum Panels', percentage: 25, description: 'Aluminum requires higher heat/tension management' },
  { id: 'doublePanels', label: 'Double Panels', percentage: 25, description: 'Double metal skin or reinforced box sections' },
];

export interface PanelConfig {
  id: PanelId;
  name: string;
  shortName: string;
  matrixType: MatrixPanelType;
  group: 'Front' | 'Center' | 'Sides' | 'Rear';
  standardRI: { name: string; hours: number; defaultType?: 'R&I' | 'R&R' }[];
}

export const PANEL_CONFIGS: Record<PanelId, PanelConfig> = {
  hood: {
    id: 'hood',
    name: 'Hood',
    shortName: 'Hood',
    matrixType: 'hood',
    group: 'Front',
    standardRI: [
      { name: 'Hood Insulator', hours: 0.5, defaultType: 'R&I' },
      { name: 'Hood Emblem / Badging', hours: 0.3, defaultType: 'R&I' },
      { name: 'Cowl Grille / Wipers', hours: 0.8, defaultType: 'R&I' },
      { name: 'Hood Latch / Release', hours: 0.4, defaultType: 'R&I' },
    ],
  },
  roof: {
    id: 'roof',
    name: 'Roof Panel',
    shortName: 'Roof',
    matrixType: 'roof',
    group: 'Center',
    standardRI: [
      { name: 'Headliner Drop / R&I', hours: 3.5, defaultType: 'R&I' },
      { name: 'Sunroof Assembly R&I', hours: 2.0, defaultType: 'R&I' },
      { name: 'Roof Antenna / Sharkfin', hours: 0.5, defaultType: 'R&I' },
      { name: 'Luggage Rack Left', hours: 0.8, defaultType: 'R&I' },
      { name: 'Luggage Rack Right', hours: 0.8, defaultType: 'R&I' },
      { name: 'High Mount Stop Lamp', hours: 0.4, defaultType: 'R&I' },
      { name: 'Lt Roof Molding R&R', hours: 0.6, defaultType: 'R&R' },
      { name: 'Rt Roof Molding R&R', hours: 0.6, defaultType: 'R&R' },
      { name: 'Windshield R&R Sublet', hours: 2.5, defaultType: 'R&R' },
    ],
  },
  decklid: {
    id: 'decklid',
    name: 'Deck Lid / Trunk / Liftgate',
    shortName: 'Decklid',
    matrixType: 'decklid',
    group: 'Rear',
    standardRI: [
      { name: 'Trunk / Liftgate Trim Panel', hours: 1.0, defaultType: 'R&I' },
      { name: 'Spoiler / Wing R&I', hours: 1.2, defaultType: 'R&I' },
      { name: 'Emblems & Nameplates R&R', hours: 0.5, defaultType: 'R&R' },
      { name: 'Rear Camera / Latch Assembly', hours: 0.6, defaultType: 'R&I' },
      { name: 'Tailgate Finish Molding', hours: 0.5, defaultType: 'R&I' },
    ],
  },
  leftFender: {
    id: 'leftFender',
    name: 'Left Front Fender',
    shortName: 'L Fender',
    matrixType: 'fender',
    group: 'Front',
    standardRI: [
      { name: 'Fender Liner / Splash Shield', hours: 0.6, defaultType: 'R&I' },
      { name: 'Headlamp Assembly Left', hours: 0.8, defaultType: 'R&I' },
      { name: 'Fender Flare / Arch Trim', hours: 0.5, defaultType: 'R&I' },
      { name: 'Fender Stripe / Emblem', hours: 0.3, defaultType: 'R&R' },
    ],
  },
  rightFender: {
    id: 'rightFender',
    name: 'Right Front Fender',
    shortName: 'R Fender',
    matrixType: 'fender',
    group: 'Front',
    standardRI: [
      { name: 'Fender Liner / Splash Shield', hours: 0.6, defaultType: 'R&I' },
      { name: 'Headlamp Assembly Right', hours: 0.8, defaultType: 'R&I' },
      { name: 'Fender Flare / Arch Trim', hours: 0.5, defaultType: 'R&I' },
      { name: 'Fender Stripe / Emblem', hours: 0.3, defaultType: 'R&R' },
    ],
  },
  leftRoofRail: {
    id: 'leftRoofRail',
    name: 'Left Roof Rail / Cantrail',
    shortName: 'L Rail',
    matrixType: 'roofRail',
    group: 'Sides',
    standardRI: [
      { name: 'Drip Rail / Roof Molding Left', hours: 0.6, defaultType: 'R&I' },
      { name: 'Side Curtain Airbag Drop Lt', hours: 1.5, defaultType: 'R&I' },
      { name: 'Weatherstrip Seal Left', hours: 0.4, defaultType: 'R&I' },
    ],
  },
  rightRoofRail: {
    id: 'rightRoofRail',
    name: 'Right Roof Rail / Cantrail',
    shortName: 'R Rail',
    matrixType: 'roofRail',
    group: 'Sides',
    standardRI: [
      { name: 'Drip Rail / Roof Molding Right', hours: 0.6, defaultType: 'R&I' },
      { name: 'Side Curtain Airbag Drop Rt', hours: 1.5, defaultType: 'R&I' },
      { name: 'Weatherstrip Seal Right', hours: 0.4, defaultType: 'R&I' },
    ],
  },
  leftFrontDoor: {
    id: 'leftFrontDoor',
    name: 'Left Front Door',
    shortName: 'LF Door',
    matrixType: 'door',
    group: 'Sides',
    standardRI: [
      { name: 'Belt Molding Outer', hours: 0.4, defaultType: 'R&I' },
      { name: 'Upper Molding / Channel', hours: 0.5, defaultType: 'R&I' },
      { name: 'Applique / Sash Trim', hours: 0.4, defaultType: 'R&I' },
      { name: 'Exterior Mirror Assembly', hours: 0.7, defaultType: 'R&I' },
      { name: 'Exterior Door Handle', hours: 0.6, defaultType: 'R&I' },
      { name: 'Door Trim Panel Inside', hours: 0.9, defaultType: 'R&I' },
    ],
  },
  rightFrontDoor: {
    id: 'rightFrontDoor',
    name: 'Right Front Door',
    shortName: 'RF Door',
    matrixType: 'door',
    group: 'Sides',
    standardRI: [
      { name: 'Belt Molding Outer', hours: 0.4, defaultType: 'R&I' },
      { name: 'Upper Molding / Channel', hours: 0.5, defaultType: 'R&I' },
      { name: 'Applique / Sash Trim', hours: 0.4, defaultType: 'R&I' },
      { name: 'Exterior Mirror Assembly', hours: 0.7, defaultType: 'R&I' },
      { name: 'Exterior Door Handle', hours: 0.6, defaultType: 'R&I' },
      { name: 'Door Trim Panel Inside', hours: 0.9, defaultType: 'R&I' },
    ],
  },
  leftRearDoor: {
    id: 'leftRearDoor',
    name: 'Left Rear Door',
    shortName: 'LR Door',
    matrixType: 'door',
    group: 'Sides',
    standardRI: [
      { name: 'Belt Molding Outer', hours: 0.4, defaultType: 'R&I' },
      { name: 'Upper Molding / Channel', hours: 0.5, defaultType: 'R&I' },
      { name: 'Applique / Sash Trim', hours: 0.4, defaultType: 'R&I' },
      { name: 'Exterior Door Handle', hours: 0.6, defaultType: 'R&I' },
      { name: 'Door Trim Panel Inside', hours: 0.8, defaultType: 'R&I' },
    ],
  },
  rightRearDoor: {
    id: 'rightRearDoor',
    name: 'Right Rear Door',
    shortName: 'RR Door',
    matrixType: 'door',
    group: 'Sides',
    standardRI: [
      { name: 'Belt Molding Outer', hours: 0.4, defaultType: 'R&I' },
      { name: 'Upper Molding / Channel', hours: 0.5, defaultType: 'R&I' },
      { name: 'Applique / Sash Trim', hours: 0.4, defaultType: 'R&I' },
      { name: 'Exterior Door Handle', hours: 0.6, defaultType: 'R&I' },
      { name: 'Door Trim Panel Inside', hours: 0.8, defaultType: 'R&I' },
    ],
  },
  leftQuarter: {
    id: 'leftQuarter',
    name: 'Left Quarter Panel / Bedside',
    shortName: 'L Quarter',
    matrixType: 'quarterPanel',
    group: 'Sides',
    standardRI: [
      { name: 'Tail Lamp Assembly Left', hours: 0.5, defaultType: 'R&I' },
      { name: 'Quarter Glass Left R&R', hours: 1.2, defaultType: 'R&R' },
      { name: 'Trunk Side Trim / Wheelhouse', hours: 0.8, defaultType: 'R&I' },
      { name: 'Wheel Opening Flare / Molding', hours: 0.5, defaultType: 'R&I' },
    ],
  },
  rightQuarter: {
    id: 'rightQuarter',
    name: 'Right Quarter Panel / Bedside',
    shortName: 'R Quarter',
    matrixType: 'quarterPanel',
    group: 'Sides',
    standardRI: [
      { name: 'Tail Lamp Assembly Right', hours: 0.5, defaultType: 'R&I' },
      { name: 'Quarter Glass Right R&R', hours: 1.2, defaultType: 'R&R' },
      { name: 'Fuel Pocket / Door Housing', hours: 0.5, defaultType: 'R&I' },
      { name: 'Trunk Side Trim / Wheelhouse', hours: 0.8, defaultType: 'R&I' },
      { name: 'Wheel Opening Flare / Molding', hours: 0.5, defaultType: 'R&I' },
    ],
  },
  cabCornerLeft: {
    id: 'cabCornerLeft',
    name: 'Left Cab Corner',
    shortName: 'L Cab Corner',
    matrixType: 'fender',
    group: 'Sides',
    standardRI: [
      { name: 'Cab Corner Interior Trim', hours: 0.6, defaultType: 'R&I' },
    ],
  },
  cabCornerRight: {
    id: 'cabCornerRight',
    name: 'Right Cab Corner',
    shortName: 'R Cab Corner',
    matrixType: 'fender',
    group: 'Sides',
    standardRI: [
      { name: 'Cab Corner Interior Trim', hours: 0.6, defaultType: 'R&I' },
    ],
  },
  frontBumper: {
    id: 'frontBumper',
    name: 'Front Bumper Cover',
    shortName: 'Front Bumper',
    matrixType: 'fender',
    group: 'Front',
    standardRI: [
      { name: 'Front Bumper Cover Overhaul', hours: 2.5, defaultType: 'R&I' },
    ],
  },
  rearBumper: {
    id: 'rearBumper',
    name: 'Rear Bumper Cover',
    shortName: 'Rear Bumper',
    matrixType: 'fender',
    group: 'Rear',
    standardRI: [
      { name: 'Rear Bumper Cover Overhaul', hours: 2.2, defaultType: 'R&I' },
    ],
  },
};

export interface MatrixTier {
  min: number;
  max: number;
  label: string;
  // Prices: [Dime, Nickel, Quarter, HalfDollar]
  roof: [number, number, number, number];
  hood: [number, number, number, number];
  decklid: [number, number, number, number];
  fender: [number, number, number, number];
  roofRail: [number, number, number, number];
  door: [number, number, number, number];
  quarterPanel: [number, number, number, number];
  // Yellow boxed flags indicating damage that may require traditional repair / replacement
  traditionalWarning: {
    roof?: DentSize[];
    hood?: DentSize[];
    decklid?: DentSize[];
    fender?: DentSize[];
    roofRail?: DentSize[];
    door?: DentSize[];
    quarterPanel?: DentSize[];
  };
}

export const MATRIX_TIERS: MatrixTier[] = [
  {
    min: 1, max: 5, label: '1 to 5 Dents',
    roof: [100, 125, 150, 200],
    hood: [80, 100, 125, 150],
    decklid: [80, 100, 125, 150],
    fender: [80, 100, 125, 150],
    roofRail: [100, 125, 150, 200],
    door: [80, 100, 125, 150],
    quarterPanel: [80, 100, 125, 150],
    traditionalWarning: {},
  },
  {
    min: 6, max: 15, label: '6 to 15 Dents',
    roof: [125, 175, 200, 300],
    hood: [125, 175, 200, 300],
    decklid: [125, 175, 200, 300],
    fender: [125, 150, 175, 225],
    roofRail: [150, 200, 250, 400],
    door: [125, 150, 175, 225],
    quarterPanel: [125, 150, 175, 225],
    traditionalWarning: {
      roofRail: ['halfDollar'],
    },
  },
  {
    min: 16, max: 30, label: '16 to 30 Dents',
    roof: [250, 300, 375, 525],
    hood: [200, 250, 300, 400],
    decklid: [200, 250, 300, 400],
    fender: [200, 225, 250, 350],
    roofRail: [250, 300, 450, 600],
    door: [200, 225, 250, 350],
    quarterPanel: [200, 225, 250, 350],
    traditionalWarning: {
      roofRail: ['halfDollar'],
      door: ['halfDollar'],
    },
  },
  {
    min: 31, max: 50, label: '31 to 50 Dents',
    roof: [375, 450, 550, 675],
    hood: [300, 350, 425, 525],
    decklid: [300, 350, 425, 525],
    fender: [300, 325, 400, 650],
    roofRail: [450, 550, 675, 900],
    door: [300, 325, 450, 700],
    quarterPanel: [300, 325, 400, 650],
    traditionalWarning: {
      fender: ['halfDollar'],
      roofRail: ['halfDollar'],
      door: ['quarter', 'halfDollar'],
      quarterPanel: ['halfDollar'],
    },
  },
  {
    min: 51, max: 75, label: '51 to 75 Dents',
    roof: [475, 575, 700, 825],
    hood: [400, 475, 550, 650],
    decklid: [400, 475, 550, 650],
    fender: [450, 525, 650, 800],
    roofRail: [675, 850, 1000, 1250],
    door: [450, 550, 750, 1050],
    quarterPanel: [450, 525, 650, 800],
    traditionalWarning: {
      fender: ['nickel', 'quarter', 'halfDollar'],
      roofRail: ['dime', 'nickel', 'quarter', 'halfDollar'],
      door: ['dime', 'nickel', 'quarter', 'halfDollar'],
      quarterPanel: ['nickel', 'quarter', 'halfDollar'],
    },
  },
  {
    min: 76, max: 100, label: '76 to 100 Dents',
    roof: [575, 700, 850, 975],
    hood: [475, 600, 700, 800],
    decklid: [475, 600, 700, 800],
    fender: [600, 725, 900, 1100],
    roofRail: [900, 1150, 1350, 1650],
    door: [650, 800, 1050, 1350],
    quarterPanel: [600, 725, 900, 1100],
    traditionalWarning: {
      fender: ['dime', 'nickel', 'quarter', 'halfDollar'],
      roofRail: ['dime', 'nickel', 'quarter', 'halfDollar'],
      door: ['dime', 'nickel', 'quarter', 'halfDollar'],
      quarterPanel: ['dime', 'nickel', 'quarter', 'halfDollar'],
    },
  },
  {
    min: 101, max: 150, label: '101 to 150 Dents',
    roof: [700, 850, 1000, 1200],
    hood: [600, 750, 875, 1000],
    decklid: [600, 750, 875, 1000],
    fender: [750, 900, 1150, 1400],
    roofRail: [1100, 1400, 1650, 2000],
    door: [800, 1000, 1300, 1650],
    quarterPanel: [750, 900, 1150, 1400],
    traditionalWarning: {
      fender: ['dime', 'nickel', 'quarter', 'halfDollar'],
      roofRail: ['dime', 'nickel', 'quarter', 'halfDollar'],
      door: ['dime', 'nickel', 'quarter', 'halfDollar'],
      quarterPanel: ['dime', 'nickel', 'quarter', 'halfDollar'],
    },
  },
  {
    min: 151, max: 200, label: '151 to 200 Dents',
    roof: [850, 1000, 1250, 1500],
    hood: [700, 900, 1100, 1450],
    decklid: [700, 900, 1100, 1450],
    fender: [900, 1100, 1400, 1750],
    roofRail: [1300, 1650, 1950, 2350],
    door: [950, 1200, 1550, 1950],
    quarterPanel: [900, 1100, 1400, 1750],
    traditionalWarning: {
      decklid: ['halfDollar'],
      fender: ['dime', 'nickel', 'quarter', 'halfDollar'],
      roofRail: ['dime', 'nickel', 'quarter', 'halfDollar'],
      door: ['dime', 'nickel', 'quarter', 'halfDollar'],
      quarterPanel: ['dime', 'nickel', 'quarter', 'halfDollar'],
    },
  },
  {
    min: 201, max: 250, label: '201 to 250 Dents',
    roof: [1000, 1150, 1500, 1800],
    hood: [850, 1100, 1400, 1850],
    decklid: [850, 1100, 1400, 1850],
    fender: [1050, 1300, 1650, 2100],
    roofRail: [1500, 1900, 2250, 2700],
    door: [1100, 1400, 1800, 2250],
    quarterPanel: [1050, 1300, 1650, 2100],
    traditionalWarning: {
      roof: ['halfDollar'],
      hood: ['dime', 'nickel', 'quarter', 'halfDollar'],
      decklid: ['dime', 'nickel', 'quarter', 'halfDollar'],
      fender: ['dime', 'nickel', 'quarter', 'halfDollar'],
      roofRail: ['dime', 'nickel', 'quarter', 'halfDollar'],
      door: ['dime', 'nickel', 'quarter', 'halfDollar'],
      quarterPanel: ['dime', 'nickel', 'quarter', 'halfDollar'],
    },
  },
  {
    min: 251, max: 300, label: '251 to 300 Dents',
    roof: [1150, 1300, 1750, 2100],
    hood: [1000, 1300, 1700, 2250],
    decklid: [1000, 1300, 1700, 2250],
    fender: [1200, 1500, 1900, 2450],
    roofRail: [1700, 2150, 2550, 3050],
    door: [1250, 1600, 2050, 2550],
    quarterPanel: [1200, 1500, 1900, 2450],
    traditionalWarning: {
      roof: ['halfDollar'],
      hood: ['dime', 'nickel', 'quarter', 'halfDollar'],
      decklid: ['dime', 'nickel', 'quarter', 'halfDollar'],
      fender: ['dime', 'nickel', 'quarter', 'halfDollar'],
      roofRail: ['dime', 'nickel', 'quarter', 'halfDollar'],
      door: ['dime', 'nickel', 'quarter', 'halfDollar'],
      quarterPanel: ['dime', 'nickel', 'quarter', 'halfDollar'],
    },
  },
  {
    min: 301, max: 350, label: '301 to 350 Dents',
    roof: [1300, 1450, 2000, 2400],
    hood: [1150, 1500, 2000, 2650],
    decklid: [1150, 1500, 2000, 2650],
    fender: [1350, 1700, 2150, 2800],
    roofRail: [1900, 2400, 2850, 3400],
    door: [1400, 1800, 2300, 2850],
    quarterPanel: [1350, 1700, 2150, 2800],
    traditionalWarning: {
      roof: ['halfDollar'],
      hood: ['dime', 'nickel', 'quarter', 'halfDollar'],
      decklid: ['dime', 'nickel', 'quarter', 'halfDollar'],
      fender: ['dime', 'nickel', 'quarter', 'halfDollar'],
      roofRail: ['dime', 'nickel', 'quarter', 'halfDollar'],
      door: ['dime', 'nickel', 'quarter', 'halfDollar'],
      quarterPanel: ['dime', 'nickel', 'quarter', 'halfDollar'],
    },
  },
  {
    min: 351, max: 400, label: '351 to 400 Dents',
    roof: [1500, 1750, 2400, 2800],
    hood: [1300, 1700, 2300, 3050],
    decklid: [1300, 1700, 2300, 3050],
    fender: [1500, 1900, 2400, 3150],
    roofRail: [2100, 2650, 3150, 3750],
    door: [1550, 2000, 2550, 3150],
    quarterPanel: [1500, 1900, 2400, 3150],
    traditionalWarning: {
      roof: ['halfDollar'],
      hood: ['dime', 'nickel', 'quarter', 'halfDollar'],
      decklid: ['dime', 'nickel', 'quarter', 'halfDollar'],
    },
  },
  {
    min: 401, max: 450, label: '401 to 450 Dents',
    roof: [1700, 2050, 2800, 3300],
    hood: [1450, 1900, 2600, 3450],
    decklid: [1450, 1900, 2600, 3450],
    fender: [1650, 2100, 2650, 3500],
    roofRail: [2300, 2900, 3450, 4100],
    door: [1700, 2200, 2800, 3450],
    quarterPanel: [1650, 2100, 2650, 3500],
    traditionalWarning: {
      roof: ['halfDollar'],
    },
  },
  {
    min: 451, max: 500, label: '451 to 500 Dents',
    roof: [1900, 2350, 3200, 3900],
    hood: [1600, 2100, 2900, 3850],
    decklid: [1600, 2100, 2900, 3850],
    fender: [1800, 2300, 2900, 3850],
    roofRail: [2500, 3150, 3750, 4450],
    door: [1850, 2400, 3050, 3750],
    quarterPanel: [1800, 2300, 2900, 3850],
    traditionalWarning: {
      roof: ['halfDollar'],
    },
  },
  {
    min: 501, max: 550, label: '501 to 550 Dents',
    roof: [2100, 2650, 3600, 4600],
    hood: [1750, 2300, 3200, 4250],
    decklid: [1750, 2300, 3200, 4250],
    fender: [1950, 2500, 3150, 4200],
    roofRail: [2700, 3400, 4050, 4800],
    door: [2000, 2600, 3300, 4050],
    quarterPanel: [1950, 2500, 3150, 4200],
    traditionalWarning: {
      roof: ['halfDollar'],
    },
  },
];

const SIZE_INDEX: Record<DentSize, number> = {
  dime: 0,
  nickel: 1,
  quarter: 2,
  halfDollar: 3,
};

/**
 * Calculates matrix base cost and traditional repair flag for given panel, count, and size
 */
export function calculateMatrixBase(
  matrixType: MatrixPanelType,
  dentCount: number,
  size: DentSize
): { baseCost: number; requiresTraditional: boolean; tierLabel: string } {
  if (dentCount <= 0) {
    return { baseCost: 0, requiresTraditional: false, tierLabel: 'No Damage' };
  }

  // Find tier
  let tier = MATRIX_TIERS.find(t => dentCount >= t.min && dentCount <= t.max);
  if (!tier) {
    // If over 550, cap at max tier with custom message
    tier = MATRIX_TIERS[MATRIX_TIERS.length - 1];
  }

  const sIdx = SIZE_INDEX[size];
  const prices = tier[matrixType];
  const baseCost = prices[sIdx] || 0;

  const warnList = tier.traditionalWarning[matrixType] || [];
  const requiresTraditional = warnList.includes(size) || dentCount > 200;

  return {
    baseCost,
    requiresTraditional,
    tierLabel: tier.label,
  };
}

/**
 * Parses technician shorthand notation (e.g. "136N 21 O/S", "36Q 5s", "8N 1OS", "56Q 4/s")
 */
export function parseShorthandDamage(input: string): {
  dentCount: number;
  size: DentSize;
  oversizeCount: number;
  doubleOversizeCount: number;
} | null {
  if (!input || !input.trim()) return null;
  const raw = input.trim().toUpperCase();

  // Pattern: (count)(D|N|Q|H)? then optionally (oversize count)(O/S|OS|S|/)
  const match = raw.match(/^(\d+)\s*([DNQH])?(?:\s*(\d+)?\s*(?:O\/?S|S|\/S|\/))?/i);
  if (!match) return null;

  const count = parseInt(match[1], 10) || 0;
  const sizeChar = match[2] || 'N';
  const osCountStr = match[3];

  let size: DentSize = 'nickel';
  if (sizeChar === 'D') size = 'dime';
  else if (sizeChar === 'N') size = 'nickel';
  else if (sizeChar === 'Q') size = 'quarter';
  else if (sizeChar === 'H') size = 'halfDollar';

  let oversizeCount = 0;
  if (osCountStr) {
    oversizeCount = parseInt(osCountStr, 10);
  } else if (raw.includes('OS') || raw.includes('O/S') || raw.includes('S')) {
    // check if there's a trailing number or default
    const osMatch = raw.match(/(\d+)\s*(?:O\/?S|S|\/S)/);
    if (osMatch && osMatch[1] && osMatch[1] !== match[1]) {
      oversizeCount = parseInt(osMatch[1], 10);
    }
  }

  return {
    dentCount: count,
    size,
    oversizeCount,
    doubleOversizeCount: 0,
  };
}

/**
 * Recalculates full financial totals for a panel
 */
export function recalculatePanelDamage(
  panel: PanelDamage,
  hourlyRIRate: number = 75
): PanelDamage {
  const config = PANEL_CONFIGS[panel.panelId];
  if (!config) return panel;

  const { baseCost, requiresTraditional } = calculateMatrixBase(
    config.matrixType,
    panel.dentCount,
    panel.primaryDentSize
  );

  // Oversize: $50 each for OS, $100 each for 2xOS
  const oversizeCost = 
    (panel.oversizeCount || 0) * OVERSIZE_PRICING.halfDollarPlus +
    (panel.doubleOversizeCount || 0) * OVERSIZE_PRICING.doubleOversize;

  // Markups: sum of percentages applied to (baseCost + oversizeCost)
  const totalMarkupPercentage = panel.markups.reduce((acc, m) => {
    const def = MARKUP_DEFINITIONS.find(d => d.id === m);
    return acc + (def?.percentage || 25);
  }, 0);

  const subtotalBeforeMarkup = baseCost + oversizeCost;
  const markupCost = Math.round((subtotalBeforeMarkup * totalMarkupPercentage) / 100);

  // R&I Cost
  const riCost = panel.riItems
    .filter(i => i.selected)
    .reduce((acc, i) => acc + (i.hours * (i.rate || hourlyRIRate)), 0);

  const totalCost = baseCost + oversizeCost + markupCost + riCost;

  return {
    ...panel,
    baseCost,
    oversizeCost,
    markupCost,
    riCost,
    totalCost,
    requiresTraditionalRepair: requiresTraditional,
  };
}

/**
 * Recalculates full estimate summary financials
 */
export function recalculateEstimate(
  estimate: Estimate,
  hourlyRIRate: number = 75
): Estimate {
  let totalDentCount = 0;
  let totalOversizeCount = 0;
  let matrixBaseTotal = 0;
  let oversizeTotal = 0;
  let markupsTotal = 0;
  let riLaborTotal = 0;

  const updatedPanels: Record<PanelId, PanelDamage> = {} as any;

  (Object.keys(estimate.panels) as PanelId[]).forEach(panelId => {
    const rawPanel = estimate.panels[panelId];
    const calcPanel = recalculatePanelDamage(rawPanel, hourlyRIRate);
    updatedPanels[panelId] = calcPanel;

    totalDentCount += calcPanel.dentCount;
    totalOversizeCount += (calcPanel.oversizeCount || 0) + (calcPanel.doubleOversizeCount || 0);
    matrixBaseTotal += calcPanel.baseCost;
    oversizeTotal += calcPanel.oversizeCost;
    markupsTotal += calcPanel.markupCost;
    riLaborTotal += calcPanel.riCost;
  });

  const subtotal = matrixBaseTotal + oversizeTotal + markupsTotal + riLaborTotal;

  // CCC / Discount percentage (e.g. 50% CCC = 50% discount on PDR or custom formula)
  let discountTotal = estimate.discounts.customDiscountDollars || 0;
  if (estimate.discounts.cccPercentage > 0) {
    // Standard CCC adjustment in hail operations: discount applied to matrix/PDR base
    const pdrPortion = matrixBaseTotal + oversizeTotal + markupsTotal;
    discountTotal += Math.round((pdrPortion * estimate.discounts.cccPercentage) / 100);
  }

  const taxableAmount = Math.max(0, subtotal - discountTotal);
  const taxTotal = estimate.discounts.taxRate > 0 
    ? Math.round((taxableAmount * estimate.discounts.taxRate) / 100 * 100) / 100
    : 0;

  const grandTotal = Math.max(0, taxableAmount + taxTotal - (estimate.discounts.deductible || 0));

  return {
    ...estimate,
    panels: updatedPanels,
    updatedAt: new Date().toISOString(),
    summary: {
      totalDentCount,
      totalOversizeCount,
      matrixBaseTotal,
      oversizeTotal,
      markupsTotal,
      riLaborTotal,
      subtotal,
      discountTotal,
      taxTotal,
      grandTotal,
    },
  };
}

/**
 * Creates an empty fresh panel damage state
 */
export function createEmptyPanelDamage(panelId: PanelId, hourlyRate: number = 75): PanelDamage {
  const config = PANEL_CONFIGS[panelId];
  return {
    panelId,
    dentCount: 0,
    primaryDentSize: 'nickel',
    oversizeCount: 0,
    doubleOversizeCount: 0,
    customDentCountText: '',
    markups: [],
    riItems: config ? config.standardRI.map((item, idx) => ({
      id: `${panelId}-ri-${idx}`,
      name: item.name,
      selected: false,
      type: item.defaultType || 'R&I',
      hours: item.hours,
      rate: hourlyRate,
    })) : [],
    photos: [],
    pins: [],
    notes: '',
    requiresTraditionalRepair: false,
    baseCost: 0,
    markupCost: 0,
    oversizeCost: 0,
    riCost: 0,
    totalCost: 0,
  };
}

/**
 * Creates a brand new empty estimate
 */
export function createEmptyEstimate(technicianId: string, technicianName: string): Estimate {
  const panels: Record<PanelId, PanelDamage> = {} as any;
  (Object.keys(PANEL_CONFIGS) as PanelId[]).forEach(id => {
    panels[id] = createEmptyPanelDamage(id);
  });

  const now = new Date().toISOString();
  const roNumber = `RO-${Math.floor(1000 + Math.random() * 9000)}`;

  const rawEstimate: Estimate = {
    id: `est_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    roNumber,
    customerName: 'New Customer',
    customerPhone: '',
    customerEmail: '',
    insuranceCompany: 'USAA',
    technicianName,
    technicianId,
    createdAt: now,
    updatedAt: now,
    status: 'Needs Initial',
    vehicle: {
      vin: '',
      year: '2024',
      make: '',
      model: '',
      trim: '',
      bodyClass: 'Sedan',
      doors: '4',
      driveType: 'AWD',
      color: 'Iridium Silver Metallic',
      engine: '2.0L Turbo I4',
      licensePlate: '',
      state: 'TX',
    },
    panels,
    discounts: {
      cccPercentage: 0,
      customDiscountDollars: 0,
      taxRate: 0,
      deductible: 0,
    },
    generalNotes: '',
    summary: {
      totalDentCount: 0,
      totalOversizeCount: 0,
      matrixBaseTotal: 0,
      oversizeTotal: 0,
      markupsTotal: 0,
      riLaborTotal: 0,
      subtotal: 0,
      discountTotal: 0,
      taxTotal: 0,
      grandTotal: 0,
    },
  };

  return recalculateEstimate(rawEstimate);
}
