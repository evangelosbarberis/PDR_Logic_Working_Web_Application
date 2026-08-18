import { Estimate, PanelDamage, PanelId, VehicleInfo } from '../types';
import { createEmptyEstimate, PANEL_CONFIGS, recalculateEstimate } from './matrix';

export const SAMPLE_VINS = [
  {
    vin: 'WDC0G4KB4HF214589',
    label: '2017 Mercedes-Benz GLC 300 4Matic (Worksheet Match)',
    year: '2017',
    make: 'Mercedes-Benz',
    model: 'GLC 300',
    trim: '4Matic AWD',
    bodyClass: 'Sport Utility Vehicle (SUV)/Multi-Purpose Vehicle (MPV)',
    doors: '4',
    driveType: '4WD/4-Wheel Drive/4x4',
    color: 'Iridium Silver Metallic',
    engine: '2.0L Inline-4 Turbocharged',
  },
  {
    vin: '1FTFW1ED4NFA98412',
    label: '2022 Ford F-150 SuperCrew Platinum (Truck / XL Panel)',
    year: '2022',
    make: 'Ford',
    model: 'F-150',
    trim: 'Platinum SuperCrew',
    bodyClass: 'Pickup Truck',
    doors: '4',
    driveType: '4WD/4-Wheel Drive/4x4',
    color: 'Agate Black Metallic',
    engine: '3.5L EcoBoost V6 Twin-Turbo',
  },
  {
    vin: '5YJ3E1EB9MF882319',
    label: '2021 Tesla Model 3 Long Range (Aluminum Panels)',
    year: '2021',
    make: 'Tesla',
    model: 'Model 3',
    trim: 'Long Range Dual Motor',
    bodyClass: 'Sedan/Saloon',
    doors: '4',
    driveType: 'AWD',
    color: 'Deep Blue Metallic',
    engine: 'Dual AC Electric Motors',
  },
  {
    vin: '1G1YY2D75L5103421',
    label: '2020 Chevrolet Corvette Stingray 3LT (High Strength Composite)',
    year: '2020',
    make: 'Chevrolet',
    model: 'Corvette',
    trim: 'Stingray 3LT Coupe',
    bodyClass: 'Coupe',
    doors: '2',
    driveType: 'RWD',
    color: 'Torch Red',
    engine: '6.2L LT2 V8 DI',
  },
];

/**
 * Generates the exact 2017 Mercedes-Benz GLC 300 estimate matching the user's paper worksheet!
 */
export function createRobAloeEstimate(techId: string = 'tech_1'): Estimate {
  const base = createEmptyEstimate(techId, 'Rob Aloe');

  base.roNumber = 'RO 2540';
  base.customerName = 'Robert Aloe';
  base.customerPhone = '(555) 248-8921';
  base.customerEmail = 'robert.aloe@example.com';
  base.insuranceCompany = 'USAA';
  base.status = 'Needs Initial';
  base.generalNotes = '50% CCC agreement applied on scope. Hail storm damage across upper roof, hood, decklid, and rails. Check sunroof cassette clearance.';

  base.vehicle = {
    vin: 'WDC0G4KB4HF214589',
    year: '2017',
    make: 'Mercedes-Benz',
    model: 'GLC 300',
    trim: '4Matic',
    bodyClass: 'SUV',
    doors: '4',
    driveType: '4Matic AWD',
    color: 'Designo Diamond White Metallic',
    engine: '2.0L Turbo I4',
    licensePlate: 'PDR-2540',
    state: 'TX',
  };

  base.discounts.cccPercentage = 50; // 50% CCC note on paper!

  // 1. Hood: 136N 21 O/S
  const hood = base.panels.hood;
  hood.dentCount = 136;
  hood.primaryDentSize = 'nickel';
  hood.oversizeCount = 21;
  hood.customDentCountText = '136N 21 O/S';
  hood.markups = ['aluminumPanels']; // Mercedes aluminum hood
  hood.riItems.forEach(i => {
    if (i.name.includes('Insulator') || i.name.includes('Cowl')) {
      i.selected = true;
    }
  });

  // 2. L Fender: 3N
  const lFender = base.panels.leftFender;
  lFender.dentCount = 3;
  lFender.primaryDentSize = 'nickel';
  lFender.customDentCountText = '3N';

  // 3. R Fender: 8N 1 O/S
  const rFender = base.panels.rightFender;
  rFender.dentCount = 8;
  rFender.primaryDentSize = 'nickel';
  rFender.oversizeCount = 1;
  rFender.customDentCountText = '8N 1 O/S';

  // 4. LF Door: 6N 1 O/S (Belt molding, Applique, Mirror, Handle)
  const lfDoor = base.panels.leftFrontDoor;
  lfDoor.dentCount = 6;
  lfDoor.primaryDentSize = 'nickel';
  lfDoor.oversizeCount = 1;
  lfDoor.customDentCountText = '6N 1 O/S';
  lfDoor.riItems.forEach(i => {
    if (i.name.includes('Belt') || i.name.includes('Applique') || i.name.includes('Mirror') || i.name.includes('Handle')) {
      i.selected = true;
    }
  });

  // 5. RF Door: 6N 2 O/S
  const rfDoor = base.panels.rightFrontDoor;
  rfDoor.dentCount = 6;
  rfDoor.primaryDentSize = 'nickel';
  rfDoor.oversizeCount = 2;
  rfDoor.customDentCountText = '6N 2 O/S';
  rfDoor.riItems.forEach(i => {
    if (i.name.includes('Belt') || i.name.includes('Upper Molding')) {
      i.selected = true;
    }
  });

  // 6. LR Door: 4N
  const lrDoor = base.panels.leftRearDoor;
  lrDoor.dentCount = 4;
  lrDoor.primaryDentSize = 'nickel';
  lrDoor.customDentCountText = '4N';
  lrDoor.riItems.forEach(i => {
    if (i.name.includes('Belt')) {
      i.selected = true;
    }
  });

  // 7. RR Door: 3N
  const rrDoor = base.panels.rightRearDoor;
  rrDoor.dentCount = 3;
  rrDoor.primaryDentSize = 'nickel';
  rrDoor.customDentCountText = '3N';

  // 8. L Rail: 36Q 5 O/S
  const lRail = base.panels.leftRoofRail;
  lRail.dentCount = 36;
  lRail.primaryDentSize = 'quarter';
  lRail.oversizeCount = 5;
  lRail.customDentCountText = '36Q 5 O/S';
  lRail.markups = ['gluePull', 'highStrengthSteel'];

  // 9. R Rail: 2Q 4 O/S
  const rRail = base.panels.rightRoofRail;
  rRail.dentCount = 2;
  rRail.primaryDentSize = 'quarter';
  rRail.oversizeCount = 4;
  rRail.customDentCountText = '2Q 4 O/S';
  rRail.markups = ['gluePull'];

  // 10. Roof: 56Q 4 O/S w/ Sunroof
  const roof = base.panels.roof;
  roof.dentCount = 56;
  roof.primaryDentSize = 'quarter';
  roof.oversizeCount = 4;
  roof.customDentCountText = '56Q 4 O/S w/ Sunroof';
  roof.markups = ['limitedAccess'];
  roof.notes = 'w/ Sunroof cassette';
  roof.riItems.forEach(i => {
    if (i.name.includes('Sunroof') || i.name.includes('Headliner') || i.name.includes('Roof Molding') || i.name.includes('Antenna')) {
      i.selected = true;
    }
  });

  // 11. L Quarter: 16Q 2 O/S
  const lQuarter = base.panels.leftQuarter;
  lQuarter.dentCount = 16;
  lQuarter.primaryDentSize = 'quarter';
  lQuarter.oversizeCount = 2;
  lQuarter.customDentCountText = '16Q 2 O/S';
  lQuarter.riItems.forEach(i => {
    if (i.name.includes('Quarter Glass')) {
      i.selected = true;
      i.type = 'R&R';
    }
  });

  // 12. R Quarter: 10N
  const rQuarter = base.panels.rightQuarter;
  rQuarter.dentCount = 10;
  rQuarter.primaryDentSize = 'nickel';
  rQuarter.customDentCountText = '10N';
  rQuarter.riItems.forEach(i => {
    if (i.name.includes('Quarter Glass')) {
      i.selected = true;
      i.type = 'R&R';
    }
  });

  // 13. Deck Lid / Lift Gate: 36Q 7 O/S
  const decklid = base.panels.decklid;
  decklid.dentCount = 36;
  decklid.primaryDentSize = 'quarter';
  decklid.oversizeCount = 7;
  decklid.customDentCountText = '36Q 7 O/S';
  decklid.markups = ['aluminumPanels'];
  decklid.riItems.forEach(i => {
    if (i.name.includes('Spoiler') || i.name.includes('Emblems')) {
      i.selected = true;
    }
  });

  return recalculateEstimate(base);
}
