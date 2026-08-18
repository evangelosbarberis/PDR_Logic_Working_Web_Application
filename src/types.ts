export type DentSize = 'dime' | 'nickel' | 'quarter' | 'halfDollar';

export type PanelId = 
  | 'hood'
  | 'roof'
  | 'decklid'
  | 'leftFender'
  | 'rightFender'
  | 'leftRoofRail'
  | 'rightRoofRail'
  | 'leftFrontDoor'
  | 'rightFrontDoor'
  | 'leftRearDoor'
  | 'rightRearDoor'
  | 'leftQuarter'
  | 'rightQuarter'
  | 'cabCornerLeft'
  | 'cabCornerRight'
  | 'frontBumper'
  | 'rearBumper';

export type MatrixPanelType = 'hood' | 'roof' | 'decklid' | 'fender' | 'roofRail' | 'door' | 'quarterPanel';

export type MarkupType = 
  | 'xlPanel'
  | 'gluePull'
  | 'highStrengthSteel'
  | 'limitedAccess'
  | 'aluminumPanels'
  | 'doublePanels';

export interface MarkupOption {
  id: MarkupType;
  label: string;
  percentage: number;
  description: string;
}

export interface RIItem {
  id: string;
  name: string;
  selected: boolean;
  type: 'R&I' | 'R&R' | 'Blend' | 'Repair';
  hours: number;
  rate: number;
  notes?: string;
}

export interface DamagePin {
  id: string;
  x: number; // 0-100% or 3D coordinate
  y: number;
  z?: number;
  size: DentSize | 'oversize' | 'doubleOversize';
  depth?: 'light' | 'medium' | 'deep' | 'crease' | 'sharp';
  notes?: string;
  photoUrl?: string;
}

export interface PanelPhoto {
  id: string;
  url: string;
  caption: string;
  timestamp: string;
  annotations?: { x: number; y: number; label: string }[];
}

export interface PanelDamage {
  panelId: PanelId;
  dentCount: number; // 0 to 550+
  primaryDentSize: DentSize;
  oversizeCount: number; // > Half Dollar (+$50 each)
  doubleOversizeCount: number; // Double Oversize (+$100 each)
  customDentCountText?: string; // e.g. "136N 21 O/S"
  markups: MarkupType[];
  riItems: RIItem[];
  photos: PanelPhoto[];
  pins: DamagePin[];
  notes: string;
  requiresTraditionalRepair?: boolean;
  baseCost: number;
  markupCost: number;
  oversizeCost: number;
  riCost: number;
  totalCost: number;
}

export interface VehicleInfo {
  vin: string;
  year: string;
  make: string;
  model: string;
  trim: string;
  bodyClass: string;
  doors: string;
  driveType: string;
  color: string;
  colorHex?: string;
  paintFinish?: 'metallic' | 'pearl' | 'gloss' | 'matte';
  fuelType?: 'Electric' | 'Hybrid' | 'Gasoline' | 'Diesel';
  archetype?: 'tesla_model3' | 'tesla_modely' | 'tesla_cybertruck' | 'truck' | 'suv' | 'sedan' | 'coupe_sports';
  engine: string;
  mileage?: string;
  licensePlate?: string;
  state?: string;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  company: string;
  role: 'Technician' | 'Lead Estimator' | 'Shop Manager' | 'Adjuster' | string;
  phone?: string;
  licenseNumber?: string;
  hourlyRIRate: number;
}

export type UserProfile = UserAccount;

export interface Estimate {
  id: string;
  roNumber: string; // Repair Order # (e.g. RO 2540)
  claimNumber?: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  insuranceCompany: string; // e.g. USAA, State Farm, CCC
  technicianName: string;
  technicianId: string;
  createdAt: string;
  updatedAt: string;
  status: 'Draft' | 'Needs Initial' | 'Pending Approval' | 'Approved' | 'In Repair' | 'Completed';
  vehicle: VehicleInfo;
  panels: Record<PanelId, PanelDamage>;
  discounts: {
    cccPercentage: number; // e.g. 50% CCC
    customDiscountDollars: number;
    taxRate: number; // e.g. 7%
    deductible: number;
  };
  generalNotes: string;
  summary: {
    totalDentCount: number;
    totalOversizeCount: number;
    matrixBaseTotal: number;
    oversizeTotal: number;
    markupsTotal: number;
    riLaborTotal: number;
    subtotal: number;
    discountTotal: number;
    taxTotal: number;
    grandTotal: number;
  };
}

export interface MatrixRow {
  minDents: number;
  maxDents: number;
  label: string;
  prices: Record<MatrixPanelType, Record<DentSize, number | null>>;
  traditionalWarnings: Record<MatrixPanelType, Record<DentSize, boolean>>;
}

export interface ReportRecord {
  id: string;
  userId: string;
  estimateId: string;
  roNumber: string;
  customerName: string;
  recipientEmail: string;
  sentAt: string;
  vehicle: VehicleInfo;
  grandTotal: number;
  totalDentCount: number;
  insuranceCompany: string;
  sentViaSmtp: boolean;
  fileName: string;
  estimateSnapshot: Estimate;
}

