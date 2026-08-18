import React, { useState, useEffect } from 'react';
import { VehicleInfo } from '../types';
import { 
  POPULAR_VEHICLE_PRESETS, 
  deduceVehicleDetails, 
  getHexColor, 
  OemColor, 
  VehicleMakePreset 
} from '../data/vehicleSpecs';
import { 
  X, 
  Car, 
  Palette, 
  Zap, 
  ShieldCheck, 
  Check, 
  Sparkles, 
  Camera, 
  Sliders, 
  Cpu, 
  Fuel, 
  Wrench,
  Search
} from 'lucide-react';

interface VehicleSpecsEditorModalProps {
  vehicle: VehicleInfo;
  onSaveVehicle: (updated: VehicleInfo) => void;
  onLaunchArScanner: () => void;
  onClose: () => void;
}

export const VehicleSpecsEditorModal: React.FC<VehicleSpecsEditorModalProps> = ({
  vehicle,
  onSaveVehicle,
  onLaunchArScanner,
  onClose,
}) => {
  const [year, setYear] = useState(vehicle.year || '2024');
  const [make, setMake] = useState(vehicle.make || 'Tesla');
  const [model, setModel] = useState(vehicle.model || 'Model 3');
  const [trim, setTrim] = useState(vehicle.trim || 'Long Range AWD');
  const [bodyClass, setBodyClass] = useState(vehicle.bodyClass || 'Sedan');
  const [driveType, setDriveType] = useState(vehicle.driveType || 'Dual Motor AWD');
  const [engine, setEngine] = useState(vehicle.engine || 'Dual AC Electric Motors (358 hp)');
  const [fuelType, setFuelType] = useState<'Electric' | 'Hybrid' | 'Gasoline' | 'Diesel'>(
    vehicle.fuelType || 'Electric'
  );
  const [colorName, setColorName] = useState(vehicle.color || 'Pearl White Multi-Coat');
  const [colorHex, setColorHex] = useState(vehicle.colorHex || '#F2F2F2');
  const [paintFinish, setPaintFinish] = useState<'metallic' | 'pearl' | 'gloss' | 'matte'>(
    vehicle.paintFinish || 'pearl'
  );
  const [vin, setVin] = useState(vehicle.vin || '');
  const [licensePlate, setLicensePlate] = useState(vehicle.licensePlate || '');
  const [archetype, setArchetype] = useState(vehicle.archetype || 'tesla_model3');

  // Available colors for selected make
  const currentMakePreset = POPULAR_VEHICLE_PRESETS.find(
    p => p.make.toLowerCase() === make.toLowerCase()
  );
  const availableOemColors: OemColor[] = currentMakePreset
    ? currentMakePreset.colors
    : [
        { name: 'Pearl White Multi-Coat', hex: '#F2F2F2', finish: 'pearl' },
        { name: 'Solid Black', hex: '#0D0D0E', finish: 'gloss' },
        { name: 'Midnight Silver / Stealth Grey', hex: '#3B3F46', finish: 'metallic' },
        { name: 'Deep Blue Metallic', hex: '#163166', finish: 'metallic' },
        { name: 'Ultra Red Metallic', hex: '#A81427', finish: 'metallic' },
        { name: 'Quicksilver', hex: '#959CA8', finish: 'metallic' },
      ];

  // Quick Preset Selection (Tesla Model 3, Ford F-150, etc.)
  const handleSelectPreset = (presetMake: string, presetModelName: string) => {
    const deduced = deduceVehicleDetails(presetMake, presetModelName);
    setMake(presetMake);
    setModel(presetModelName);
    setEngine(deduced.engine);
    setDriveType(deduced.driveType);
    setFuelType(deduced.fuelType);
    setBodyClass(deduced.bodyClass);
    setArchetype(deduced.archetype);

    if (deduced.defaultColors && deduced.defaultColors.length > 0) {
      const defaultCol = deduced.defaultColors.find(c => c.isDefault) || deduced.defaultColors[0];
      setColorName(defaultCol.name);
      setColorHex(defaultCol.hex);
      setPaintFinish(defaultCol.finish);
    }
  };

  // Re-deduce engine & specs when make or model changes manually
  const handleMakeOrModelChange = (newMake: string, newModel: string) => {
    setMake(newMake);
    setModel(newModel);
    const deduced = deduceVehicleDetails(newMake, newModel);
    setEngine(deduced.engine);
    setDriveType(deduced.driveType);
    setFuelType(deduced.fuelType);
    setBodyClass(deduced.bodyClass);
    setArchetype(deduced.archetype);
  };

  const handleApply = () => {
    const updated: VehicleInfo = {
      vin: vin.trim(),
      year: year.trim(),
      make: make.trim(),
      model: model.trim(),
      trim: trim.trim(),
      bodyClass: bodyClass.trim(),
      doors: vehicle.doors || '4',
      driveType: driveType.trim(),
      color: colorName.trim(),
      colorHex: colorHex,
      paintFinish: paintFinish,
      fuelType: fuelType,
      archetype: archetype as any,
      engine: engine.trim(),
      licensePlate: licensePlate.trim(),
      state: vehicle.state || 'TX',
    };

    onSaveVehicle(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#0F0F0F]/90 backdrop-blur-xl animate-fade-in font-sans overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-[#141414] border border-[#2D2D2D] rounded-3xl shadow-2xl overflow-hidden flex flex-col my-8">
        {/* Header with Gold Border Accent */}
        <div className="h-1.5 w-full bg-[#C5A059]" />

        <div className="px-6 py-4 bg-[#141414] border-b border-[#2D2D2D] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#1F1F1F] border border-[#C5A059]/60 flex items-center justify-center text-[#C5A059] shadow-inner">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#E0DED7] font-serif flex items-center gap-2">
                Vehicle Specifications &amp; OEM Paint Studio
              </h2>
              <p className="text-xs text-[#8E8E8E]">
                Configure accurate Make, EV/Gas Powertrain, and exact 3D Paint Finish.
              </p>
            </div>
          </div>

          <button
            id="close-vehicle-editor-btn"
            onClick={onClose}
            className="p-2 text-[#8E8E8E] hover:text-[#E0DED7] hover:bg-[#1F1F1F] rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 bg-[#141414] overflow-y-auto max-h-[75vh]">
          {/* Quick OEM Presets Selector */}
          <div>
            <label className="text-[11px] font-mono text-[#8E8E8E] uppercase tracking-wider block mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
              Quick Select OEM Vehicle Models
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                id="preset-tesla-model3-btn"
                onClick={() => handleSelectPreset('Tesla', 'Model 3')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  make === 'Tesla' && model.includes('3')
                    ? 'bg-[#1F1F1F] border-[#C5A059] ring-1 ring-[#C5A059]'
                    : 'bg-[#1A1A1A] border-[#2D2D2D] hover:border-[#3D3D3D]'
                }`}
              >
                <div className="text-xs font-bold text-[#E0DED7]">Tesla Model 3</div>
                <div className="text-[10px] text-[#C5A059] font-mono">Dual Motor EV</div>
              </button>

              <button
                type="button"
                id="preset-tesla-modely-btn"
                onClick={() => handleSelectPreset('Tesla', 'Model Y')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  make === 'Tesla' && model.includes('Y')
                    ? 'bg-[#1F1F1F] border-[#C5A059] ring-1 ring-[#C5A059]'
                    : 'bg-[#1A1A1A] border-[#2D2D2D] hover:border-[#3D3D3D]'
                }`}
              >
                <div className="text-xs font-bold text-[#E0DED7]">Tesla Model Y</div>
                <div className="text-[10px] text-[#C5A059] font-mono">Aero Crossover EV</div>
              </button>

              <button
                type="button"
                id="preset-ford-f150-btn"
                onClick={() => handleSelectPreset('Ford', 'F-150')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  make === 'Ford' && model.includes('F-150')
                    ? 'bg-[#1F1F1F] border-[#C5A059] ring-1 ring-[#C5A059]'
                    : 'bg-[#1A1A1A] border-[#2D2D2D] hover:border-[#3D3D3D]'
                }`}
              >
                <div className="text-xs font-bold text-[#E0DED7]">Ford F-150</div>
                <div className="text-[10px] text-[#8E8E8E] font-mono">Twin-Turbo V6</div>
              </button>

              <button
                type="button"
                id="preset-mercedes-glc-btn"
                onClick={() => handleSelectPreset('Mercedes-Benz', 'GLC 300')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  make.includes('Mercedes')
                    ? 'bg-[#1F1F1F] border-[#C5A059] ring-1 ring-[#C5A059]'
                    : 'bg-[#1A1A1A] border-[#2D2D2D] hover:border-[#3D3D3D]'
                }`}
              >
                <div className="text-xs font-bold text-[#E0DED7]">Mercedes GLC 300</div>
                <div className="text-[10px] text-[#8E8E8E] font-mono">2.0L Turbo 4Matic</div>
              </button>
            </div>
          </div>

          {/* Vehicle Year, Make, Model, Trim Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-mono text-[#8E8E8E] uppercase tracking-wider mb-1">
                Model Year
              </label>
              <input
                id="vehicle-year-input"
                type="text"
                value={year}
                onChange={e => setYear(e.target.value)}
                className="w-full bg-[#1F1F1F] border border-[#2D2D2D] focus:border-[#C5A059] rounded-xl px-3.5 py-2.5 text-xs text-[#E0DED7] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-[#8E8E8E] uppercase tracking-wider mb-1">
                Vehicle Make
              </label>
              <input
                id="vehicle-make-input"
                type="text"
                value={make}
                onChange={e => handleMakeOrModelChange(e.target.value, model)}
                placeholder="e.g. Tesla"
                className="w-full bg-[#1F1F1F] border border-[#2D2D2D] focus:border-[#C5A059] rounded-xl px-3.5 py-2.5 text-xs text-[#E0DED7] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-[#8E8E8E] uppercase tracking-wider mb-1">
                Model
              </label>
              <input
                id="vehicle-model-input"
                type="text"
                value={model}
                onChange={e => handleMakeOrModelChange(make, e.target.value)}
                placeholder="e.g. Model 3"
                className="w-full bg-[#1F1F1F] border border-[#2D2D2D] focus:border-[#C5A059] rounded-xl px-3.5 py-2.5 text-xs text-[#E0DED7] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-[#8E8E8E] uppercase tracking-wider mb-1">
                Trim / Submodel
              </label>
              <input
                id="vehicle-trim-input"
                type="text"
                value={trim}
                onChange={e => setTrim(e.target.value)}
                placeholder="e.g. Long Range AWD"
                className="w-full bg-[#1F1F1F] border border-[#2D2D2D] focus:border-[#C5A059] rounded-xl px-3.5 py-2.5 text-xs text-[#E0DED7] focus:outline-none"
              />
            </div>
          </div>

          {/* Powertrain, Engine & Fuel Type */}
          <div className="bg-[#1A1A1A] p-4 rounded-2xl border border-[#2D2D2D] space-y-3">
            <div className="text-xs font-bold text-[#E0DED7] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-[#C5A059]" />
                Powertrain &amp; Drivetrain Architecture
              </span>
              <div className="flex items-center gap-1 bg-[#141414] p-0.5 rounded-full border border-[#2D2D2D]">
                {(['Electric', 'Hybrid', 'Gasoline', 'Diesel'] as const).map(ft => (
                  <button
                    key={ft}
                    type="button"
                    onClick={() => setFuelType(ft)}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-full transition-all ${
                      fuelType === ft
                        ? 'bg-[#C5A059] text-[#0F0F0F]'
                        : 'text-[#8E8E8E] hover:text-[#E0DED7]'
                    }`}
                  >
                    {ft}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-mono text-[#8E8E8E] uppercase tracking-wider mb-1">
                  Engine / Motor Specifications
                </label>
                <input
                  id="vehicle-engine-input"
                  type="text"
                  value={engine}
                  onChange={e => setEngine(e.target.value)}
                  placeholder="e.g. Dual AC Permanent Magnet Electric Motors (358 hp)"
                  className="w-full bg-[#141414] border border-[#2D2D2D] focus:border-[#C5A059] rounded-xl px-3.5 py-2 text-xs text-[#E0DED7] focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-[#8E8E8E] uppercase tracking-wider mb-1">
                  Drivetrain (Drive Type)
                </label>
                <input
                  id="vehicle-drivetype-input"
                  type="text"
                  value={driveType}
                  onChange={e => setDriveType(e.target.value)}
                  placeholder="e.g. Dual Motor All-Wheel Drive (AWD)"
                  className="w-full bg-[#141414] border border-[#2D2D2D] focus:border-[#C5A059] rounded-xl px-3.5 py-2 text-xs text-[#E0DED7] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* OEM Paint Color & 3D Material Studio */}
          <div className="bg-[#1A1A1A] p-4 rounded-2xl border border-[#2D2D2D] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#E0DED7] flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-[#C5A059]" />
                Exterior OEM Paint Color &amp; Finish
              </span>
              <span className="text-[10px] font-mono text-[#C5A059] bg-[#141414] px-2 py-0.5 rounded-full border border-[#2D2D2D]">
                {colorName}
              </span>
            </div>

            {/* OEM Color Swatches */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {availableOemColors.map(oc => (
                <button
                  key={oc.name}
                  type="button"
                  onClick={() => {
                    setColorName(oc.name);
                    setColorHex(oc.hex);
                    setPaintFinish(oc.finish);
                  }}
                  className={`p-2 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                    colorName === oc.name
                      ? 'bg-[#141414] border-[#C5A059] ring-1 ring-[#C5A059]'
                      : 'bg-[#141414] border-[#2D2D2D] hover:border-[#3D3D3D]'
                  }`}
                >
                  <div
                    className="w-6 h-6 rounded-full border border-white/20 shadow-md shrink-0"
                    style={{ backgroundColor: oc.hex }}
                  />
                  <div className="truncate">
                    <div className="text-xs font-semibold text-[#E0DED7] truncate">{oc.name}</div>
                    <div className="text-[9px] text-[#8E8E8E] uppercase font-mono">{oc.finish}</div>
                  </div>
                </button>
              ))}
            </div>

            {/* Custom Color Input */}
            <div className="flex items-center gap-3 pt-2 border-t border-[#2D2D2D]">
              <div className="flex items-center gap-2">
                <label className="text-[10px] font-mono text-[#8E8E8E] uppercase tracking-wider">
                  Custom Hex:
                </label>
                <input
                  type="color"
                  value={colorHex}
                  onChange={e => {
                    setColorHex(e.target.value);
                    setColorName('Custom Finish');
                  }}
                  className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                />
                <input
                  type="text"
                  value={colorHex}
                  onChange={e => setColorHex(e.target.value)}
                  className="w-20 bg-[#141414] border border-[#2D2D2D] text-xs font-mono text-[#E0DED7] px-2 py-1 rounded-lg"
                />
              </div>

              <div className="flex items-center gap-1 ml-auto">
                {(['pearl', 'metallic', 'gloss', 'matte'] as const).map(fin => (
                  <button
                    key={fin}
                    type="button"
                    onClick={() => setPaintFinish(fin)}
                    className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-lg border transition-colors ${
                      paintFinish === fin
                        ? 'bg-[#C5A059] text-[#0F0F0F] border-[#C5A059]'
                        : 'bg-[#141414] text-[#8E8E8E] border-[#2D2D2D] hover:text-[#E0DED7]'
                    }`}
                  >
                    {fin}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* VIN & Identification */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono text-[#8E8E8E] uppercase tracking-wider mb-1">
                VIN (17-digit)
              </label>
              <input
                id="vehicle-vin-input"
                type="text"
                maxLength={17}
                value={vin}
                onChange={e => setVin(e.target.value.toUpperCase())}
                placeholder="5YJ3E1EB9MF882319"
                className="w-full bg-[#1F1F1F] border border-[#2D2D2D] focus:border-[#C5A059] rounded-xl px-3.5 py-2.5 text-xs font-mono text-[#E0DED7] focus:outline-none uppercase tracking-wider"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-[#8E8E8E] uppercase tracking-wider mb-1">
                License Plate / Tag
              </label>
              <input
                id="vehicle-plate-input"
                type="text"
                value={licensePlate}
                onChange={e => setLicensePlate(e.target.value.toUpperCase())}
                placeholder="PDR-2025"
                className="w-full bg-[#1F1F1F] border border-[#2D2D2D] focus:border-[#C5A059] rounded-xl px-3.5 py-2.5 text-xs font-mono text-[#E0DED7] focus:outline-none uppercase"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer & AR Trigger */}
        <div className="px-6 py-4 bg-[#141414] border-t border-[#2D2D2D] flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            id="launch-ar-walkaround-from-editor-btn"
            type="button"
            onClick={() => {
              handleApply();
              onLaunchArScanner();
            }}
            className="w-full sm:w-auto bg-[#1F1F1F] hover:bg-[#2A2A2A] border border-[#C5A059]/60 text-[#C5A059] px-4 py-2.5 rounded-full text-xs font-bold transition-colors flex items-center justify-center gap-2"
          >
            <Camera className="w-4 h-4" />
            <span>Launch AR Camera Walkaround</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full border border-[#3D3D3D] text-[#8E8E8E] hover:text-[#E0DED7] hover:bg-[#1F1F1F] text-xs font-semibold transition-colors"
            >
              Cancel
            </button>

            <button
              id="save-vehicle-specs-btn"
              type="button"
              onClick={handleApply}
              className="px-6 py-2.5 rounded-full bg-[#C5A059] hover:bg-[#B38F48] text-[#0F0F0F] font-bold text-xs transition-colors shadow-lg flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Apply Vehicle &amp; 3D Render</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
