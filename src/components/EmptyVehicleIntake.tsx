import React, { useState } from 'react';
import { VehicleInfo } from '../types';
import { POPULAR_VEHICLE_PRESETS, deduceVehicleDetails, getHexColor, OemColor } from '../data/vehicleSpecs';
import { SAMPLE_VINS } from '../data/sampleVehicles';
import { 
  Car, 
  Search, 
  Camera, 
  QrCode, 
  Check, 
  Sparkles, 
  Sliders, 
  Loader2, 
  AlertCircle, 
  ShieldCheck, 
  Zap, 
  Fuel, 
  ArrowRight,
  HelpCircle,
  FileSpreadsheet
} from 'lucide-react';

interface EmptyVehicleIntakeProps {
  onVehicleEntered: (vehicle: VehicleInfo) => void;
  onLoadSampleWorksheet?: () => void;
  onOpenVinCamera?: () => void;
  isDay?: boolean;
}

export const EmptyVehicleIntake: React.FC<EmptyVehicleIntakeProps> = ({
  onVehicleEntered,
  onLoadSampleWorksheet,
  onOpenVinCamera,
  isDay = false,
}) => {
  // Mode: 'quick_vin' | 'custom_builder' | 'presets'
  const [intakeMode, setIntakeMode] = useState<'quick_vin' | 'custom_builder'>('quick_vin');

  // VIN Lookup State
  const [vinInput, setVinInput] = useState('');
  const [isDecoding, setIsDecoding] = useState(false);
  const [vinError, setVinError] = useState<string | null>(null);

  // Custom Builder State
  const [year, setYear] = useState('2024');
  const [make, setMake] = useState('Tesla');
  const [model, setModel] = useState('Model 3');
  const [bodyClass, setBodyClass] = useState('Sedan');
  const [fuelType, setFuelType] = useState<'Electric' | 'Hybrid' | 'Gasoline' | 'Diesel'>('Electric');
  const [colorName, setColorName] = useState('Pearl White Multi-Coat');
  const [colorHex, setColorHex] = useState('#F2F2F2');
  const [paintFinish, setPaintFinish] = useState<'metallic' | 'pearl' | 'gloss' | 'matte'>('pearl');
  const [roNumber, setRoNumber] = useState(`RO-${Math.floor(1000 + Math.random() * 9000)}`);

  // Decode VIN using NHTSA vPIC Public API
  const handleDecodeVin = async (vinToDecode: string) => {
    const cleanVin = vinToDecode.trim().toUpperCase();
    if (!cleanVin || cleanVin.length < 11) {
      setVinError('Please enter a valid 17-character VIN.');
      return;
    }

    setIsDecoding(true);
    setVinError(null);

    try {
      // 1. Check local presets first for instant response
      const localMatch = SAMPLE_VINS.find(v => v.vin.toUpperCase() === cleanVin);
      if (localMatch) {
        const deduced = deduceVehicleDetails(localMatch.make, localMatch.model);
        const vehicle: VehicleInfo = {
          vin: cleanVin,
          year: localMatch.year,
          make: localMatch.make,
          model: localMatch.model,
          trim: localMatch.trim,
          bodyClass: localMatch.bodyClass,
          doors: localMatch.doors,
          driveType: localMatch.driveType || deduced.driveType,
          color: localMatch.color,
          colorHex: getHexColor(localMatch.color),
          engine: localMatch.engine || deduced.engine,
          fuelType: deduced.fuelType,
          archetype: deduced.archetype,
        };
        onVehicleEntered(vehicle);
        return;
      }

      // 2. Fetch from NHTSA vPIC Public API
      const res = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${cleanVin}?format=json`);
      if (!res.ok) throw new Error('NHTSA API request failed');
      const data = await res.json();

      const results: { Variable: string; Value: string | null }[] = data.Results || [];
      const getValue = (varName: string) => {
        const item = results.find(r => r.Variable === varName);
        return item && item.Value ? item.Value.trim() : '';
      };

      const decodedMake = getValue('Make') || 'Tesla';
      const decodedModel = getValue('Model') || 'Model 3';
      const decodedYear = getValue('Model Year') || '2024';
      const decodedBody = getValue('Body Class') || 'Sedan';
      const decodedDoors = getValue('Doors') || '4';
      const decodedDrive = getValue('Drive Type') || 'AWD';
      const decodedFuel = getValue('Fuel Type - Primary') || 'Electric';

      const deduced = deduceVehicleDetails(decodedMake, decodedModel);

      const vehicle: VehicleInfo = {
        vin: cleanVin,
        year: decodedYear,
        make: decodedMake,
        model: decodedModel,
        trim: getValue('Trim') || 'Base',
        bodyClass: decodedBody,
        doors: decodedDoors,
        driveType: decodedDrive,
        color: deduced.defaultColors[0]?.name || 'Pearl White Multi-Coat',
        colorHex: deduced.defaultColors[0]?.hex || '#F2F2F2',
        paintFinish: deduced.defaultColors[0]?.finish || 'pearl',
        engine: getValue('Engine Model') || deduced.engine,
        fuelType: (decodedFuel.toLowerCase().includes('elec') ? 'Electric' : decodedFuel.toLowerCase().includes('hyb') ? 'Hybrid' : 'Gasoline') as any,
        archetype: deduced.archetype,
      };

      onVehicleEntered(vehicle);
    } catch (err: any) {
      console.warn('VIN decode offline fallback:', err);
      // Create deduced fallback
      const deduced = deduceVehicleDetails('Tesla', 'Model 3');
      onVehicleEntered({
        vin: cleanVin,
        year: '2024',
        make: 'Tesla',
        model: 'Model 3',
        trim: 'Dual Motor AWD',
        bodyClass: 'Sedan',
        doors: '4',
        driveType: 'AWD',
        color: 'Pearl White Multi-Coat',
        colorHex: '#F2F2F2',
        paintFinish: 'pearl',
        engine: 'Dual AC Electric Motors',
        fuelType: 'Electric',
        archetype: 'tesla_model3',
      });
    } finally {
      setIsDecoding(false);
    }
  };

  // Preset Selection
  const handleSelectPreset = (preset: typeof SAMPLE_VINS[0]) => {
    const deduced = deduceVehicleDetails(preset.make, preset.model);
    onVehicleEntered({
      vin: preset.vin,
      year: preset.year,
      make: preset.make,
      model: preset.model,
      trim: preset.trim,
      bodyClass: preset.bodyClass,
      doors: preset.doors,
      driveType: preset.driveType || deduced.driveType,
      color: preset.color,
      colorHex: getHexColor(preset.color),
      engine: preset.engine || deduced.engine,
      fuelType: deduced.fuelType,
      archetype: deduced.archetype,
    });
  };

  // Submit Custom Builder
  const handleCustomBuilderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const deduced = deduceVehicleDetails(make, model);
    onVehicleEntered({
      vin: vinInput || `1FTFW1ED4${Math.floor(10000000 + Math.random() * 90000000)}`,
      year,
      make,
      model,
      trim: 'Standard',
      bodyClass,
      doors: '4',
      driveType: deduced.driveType,
      color: colorName,
      colorHex,
      paintFinish,
      engine: deduced.engine,
      fuelType,
      archetype: deduced.archetype,
    });
  };

  // Current Make Colors
  const currentMakePreset = POPULAR_VEHICLE_PRESETS.find(
    p => p.make.toLowerCase() === make.toLowerCase()
  );
  const availableColors: OemColor[] = currentMakePreset?.colors || [
    { name: 'Pearl White Multi-Coat', hex: '#F2F2F2', finish: 'pearl' },
    { name: 'Solid Black', hex: '#0D0D0E', finish: 'gloss' },
    { name: 'Midnight Silver / Stealth Grey', hex: '#3B3F46', finish: 'metallic' },
    { name: 'Deep Blue Metallic', hex: '#163166', finish: 'metallic' },
    { name: 'Ultra Red Metallic', hex: '#A81427', finish: 'metallic' },
    { name: 'Quicksilver', hex: '#959CA8', finish: 'metallic' },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 py-6 animate-fade-in">
      {/* Hero Welcome Card */}
      <div className={`p-6 sm:p-10 rounded-3xl border shadow-2xl relative overflow-hidden transition-colors ${
        isDay ? 'bg-white border-slate-200 text-slate-900 shadow-slate-200/50' : 'bg-[#141414] border-[#2D2D2D] text-[#E0DED7]'
      }`}>
        {/* Subtle Background Geometry */}
        <div className="absolute -right-16 -bottom-16 w-80 h-80 rounded-full bg-[#C5A059]/5 blur-3xl pointer-events-none" />

        <div className="max-w-2xl space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C5A059] animate-ping" />
            <span className="text-[11px] uppercase font-mono font-bold tracking-widest text-[#C5A059]">
              Vehicle Intake &amp; 3D Setup
            </span>
          </div>

          <h1 className="font-serif italic text-3xl sm:text-4xl lg:text-5xl tracking-tight text-[#E0DED7]">
            Start New Hail Estimate
          </h1>

          <p className={`text-sm sm:text-base leading-relaxed ${isDay ? 'text-slate-600' : 'text-[#8E8E8E]'}`}>
            Enter the vehicle VIN or specifications below. The 3D CAD vehicle model and interactive D&amp;G Hail Matrix will instantly render with the vehicle's exact body archetype, panel metallurgy, and OEM paint finish.
          </p>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-3 pt-2 flex-wrap">
            <button
              id="intake-tab-vin"
              onClick={() => setIntakeMode('quick_vin')}
              className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                intakeMode === 'quick_vin'
                  ? 'bg-[#C5A059] text-[#0F0F0F] shadow-lg shadow-[#C5A059]/20'
                  : isDay ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-[#1F1F1F] text-[#8E8E8E] hover:text-[#E0DED7] border border-[#2D2D2D]'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>17-Digit VIN Lookup</span>
            </button>

            <button
              id="intake-tab-custom"
              onClick={() => setIntakeMode('custom_builder')}
              className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                intakeMode === 'custom_builder'
                  ? 'bg-[#C5A059] text-[#0F0F0F] shadow-lg shadow-[#C5A059]/20'
                  : isDay ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-[#1F1F1F] text-[#8E8E8E] hover:text-[#E0DED7] border border-[#2D2D2D]'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Vehicle Builder &amp; Color</span>
            </button>

            {onLoadSampleWorksheet && (
              <button
                id="intake-load-sample-btn"
                onClick={onLoadSampleWorksheet}
                className={`px-4 py-2.5 rounded-full text-xs font-semibold transition-all border flex items-center gap-2 ${
                  isDay 
                    ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100' 
                    : 'bg-[#1A1A1A] text-[#C5A059] border-[#3D3D3D] hover:border-[#C5A059]'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4 text-[#C5A059]" />
                <span>Load Rob Aloe Sample (GLC 300)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Intake Form Content */}
      {intakeMode === 'quick_vin' ? (
        <div className={`p-6 sm:p-8 rounded-3xl border space-y-6 shadow-xl ${
          isDay ? 'bg-white border-slate-200' : 'bg-[#141414] border-[#2D2D2D]'
        }`}>
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-[#E0DED7] font-serif flex items-center gap-2">
              <QrCode className="w-5 h-5 text-[#C5A059]" />
              Enter VIN or Scan Barcode
            </h2>
            <p className={`text-xs ${isDay ? 'text-slate-500' : 'text-[#8E8E8E]'}`}>
              Automated decode via NHTSA vPIC specifications engine to configure body panels, high-strength steel / aluminum markups, and OEM specs.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:flex-1">
              <input
                id="main-vin-input"
                type="text"
                maxLength={17}
                placeholder="e.g. WDC0G4KB4HF214589 (17 Alphanumeric)"
                value={vinInput}
                onChange={e => setVinInput(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && handleDecodeVin(vinInput)}
                className={`w-full font-mono text-sm px-4 py-3.5 rounded-2xl border focus:outline-none uppercase placeholder-[#555] transition-colors ${
                  isDay 
                    ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-600' 
                    : 'bg-[#1A1A1A] border-[#2D2D2D] text-[#E0DED7] focus:border-[#C5A059]'
                }`}
              />
              {vinInput.length > 0 && (
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono text-[#8E8E8E]">
                  {vinInput.length}/17
                </span>
              )}
            </div>

            <button
              id="decode-vin-submit-btn"
              onClick={() => handleDecodeVin(vinInput)}
              disabled={isDecoding || !vinInput.trim()}
              className="w-full sm:w-auto bg-[#C5A059] hover:bg-[#B38F48] disabled:opacity-50 text-[#0F0F0F] font-bold text-xs px-8 py-3.5 rounded-2xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap"
            >
              {isDecoding ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              <span>Decode &amp; Render 3D Model</span>
            </button>

            {onOpenVinCamera && (
              <button
                id="camera-scan-trigger-btn"
                onClick={onOpenVinCamera}
                className={`w-full sm:w-auto border text-xs font-semibold px-5 py-3.5 rounded-2xl transition-colors flex items-center justify-center gap-2 ${
                  isDay 
                    ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800' 
                    : 'bg-[#1F1F1F] hover:bg-[#252525] border-[#3D3D3D] text-[#E0DED7] hover:border-[#C5A059]'
                }`}
              >
                <Camera className="w-4 h-4 text-[#C5A059]" />
                <span>Scan Barcode</span>
              </button>
            )}
          </div>

          {vinError && (
            <div className="flex items-center gap-2 text-xs text-[#FF4E4E] bg-[#FF4E4E]/10 p-3 rounded-xl border border-[#FF4E4E]/30">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{vinError}</span>
            </div>
          )}

          {/* Quick 1-Click Popular Vehicle Presets */}
          <div className="space-y-3 pt-4 border-t border-[#2D2D2D]/60">
            <div className="text-xs font-bold uppercase tracking-wider text-[#8E8E8E] flex items-center justify-between">
              <span>Or Choose a Quick-Start Vehicle Preset</span>
              <span className="text-[10px] font-mono">1-Click 3D Render</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {SAMPLE_VINS.map(preset => (
                <button
                  key={preset.vin}
                  id={`preset-${preset.vin}`}
                  onClick={() => handleSelectPreset(preset)}
                  className={`p-4 rounded-2xl border text-left transition-all group flex flex-col justify-between hover:scale-[1.01] ${
                    isDay 
                      ? 'bg-slate-50 hover:bg-slate-100 border-slate-300 hover:border-amber-500' 
                      : 'bg-[#181818] hover:bg-[#1F1F1F] border-[#2D2D2D] hover:border-[#C5A059]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-xs font-bold text-[#E0DED7] group-hover:text-[#C5A059] transition-colors">
                        {preset.year} {preset.make} {preset.model}
                      </span>
                      <span className="text-[10px] font-mono bg-[#141414] px-2 py-0.5 rounded border border-[#3D3D3D] text-[#C5A059]">
                        {preset.bodyClass.includes('SUV') ? 'SUV' : preset.bodyClass.includes('Truck') ? 'Truck' : preset.bodyClass.includes('Coupe') ? 'Coupe' : 'Sedan'}
                      </span>
                    </div>
                    <div className="text-xs text-[#8E8E8E] truncate">
                      {preset.trim} &bull; {preset.color}
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-[#2D2D2D]/40 flex items-center justify-between text-[11px] font-mono text-[#8E8E8E]">
                    <span className="truncate">{preset.vin}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#C5A059] group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Custom Vehicle Builder Form */
        <form 
          onSubmit={handleCustomBuilderSubmit}
          className={`p-6 sm:p-8 rounded-3xl border space-y-6 shadow-xl ${
            isDay ? 'bg-white border-slate-200' : 'bg-[#141414] border-[#2D2D2D]'
          }`}
        >
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-[#E0DED7] font-serif flex items-center gap-2">
              <Sliders className="w-5 h-5 text-[#C5A059]" />
              Vehicle Specifications &amp; Paint Studio
            </h2>
            <p className={`text-xs ${isDay ? 'text-slate-500' : 'text-[#8E8E8E]'}`}>
              Configure year, make, model archetype, fuel type, and finish color.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* Year */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider block mb-1.5 text-[#8E8E8E]">
                Year
              </label>
              <input
                type="text"
                value={year}
                onChange={e => setYear(e.target.value)}
                className={`w-full font-mono text-xs px-3.5 py-2.5 rounded-xl border focus:outline-none ${
                  isDay ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#1A1A1A] border-[#2D2D2D] text-[#E0DED7]'
                }`}
              />
            </div>

            {/* Make */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider block mb-1.5 text-[#8E8E8E]">
                Make
              </label>
              <select
                value={make}
                onChange={e => {
                  const newMake = e.target.value;
                  setMake(newMake);
                  const preset = POPULAR_VEHICLE_PRESETS.find(p => p.make.toLowerCase() === newMake.toLowerCase());
                  if (preset && preset.models[0]) {
                    const firstModelName = preset.models[0].name;
                    setModel(firstModelName);
                    const deduced = deduceVehicleDetails(newMake, firstModelName);
                    setFuelType(deduced.fuelType);
                    setBodyClass(deduced.bodyClass);
                  }
                }}
                className={`w-full text-xs px-3.5 py-2.5 rounded-xl border focus:outline-none ${
                  isDay ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#1A1A1A] border-[#2D2D2D] text-[#E0DED7]'
                }`}
              >
                {POPULAR_VEHICLE_PRESETS.map(p => (
                  <option key={p.make} value={p.make} className="bg-[#141414] text-[#E0DED7]">
                    {p.make}
                  </option>
                ))}
              </select>
            </div>

            {/* Model */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider block mb-1.5 text-[#8E8E8E]">
                Model
              </label>
              <input
                type="text"
                value={model}
                onChange={e => setModel(e.target.value)}
                className={`w-full text-xs px-3.5 py-2.5 rounded-xl border focus:outline-none ${
                  isDay ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#1A1A1A] border-[#2D2D2D] text-[#E0DED7]'
                }`}
              />
            </div>

            {/* Body Archetype */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider block mb-1.5 text-[#8E8E8E]">
                Body Archetype
              </label>
              <select
                value={bodyClass}
                onChange={e => setBodyClass(e.target.value)}
                className={`w-full text-xs px-3.5 py-2.5 rounded-xl border focus:outline-none ${
                  isDay ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#1A1A1A] border-[#2D2D2D] text-[#E0DED7]'
                }`}
              >
                <option value="Sedan" className="bg-[#141414]">Sedan / Fastback</option>
                <option value="SUV" className="bg-[#141414]">SUV / Crossover</option>
                <option value="Pickup Truck" className="bg-[#141414]">Pickup Truck (XL Roof)</option>
                <option value="Coupe" className="bg-[#141414]">Sports Coupe</option>
              </select>
            </div>
          </div>

          {/* Paint Swatches Picker */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider block text-[#8E8E8E]">
              OEM Paint Color &amp; Finish
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
              {availableColors.map(c => {
                const isSelected = colorHex.toLowerCase() === c.hex.toLowerCase();
                return (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => {
                      setColorName(c.name);
                      setColorHex(c.hex);
                      setPaintFinish(c.finish || 'metallic');
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-[#1A1A1A] border-[#C5A059] ring-2 ring-[#C5A059]/40 shadow-md'
                        : isDay
                        ? 'bg-slate-50 border-slate-200 hover:border-slate-300'
                        : 'bg-[#181818] border-[#2D2D2D] hover:border-[#3D3D3D]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div
                        className="w-6 h-6 rounded-full border border-black/40 shadow-sm"
                        style={{ backgroundColor: c.hex }}
                      />
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#C5A059]" />}
                    </div>
                    <div className="text-[11px] font-semibold text-[#E0DED7] truncate">{c.name}</div>
                    <div className="text-[9px] text-[#8E8E8E] uppercase font-mono mt-0.5">{c.finish || 'Finish'}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#2D2D2D]/60">
            <button
              id="confirm-custom-vehicle-btn"
              type="submit"
              className="bg-[#C5A059] hover:bg-[#B38F48] text-[#0F0F0F] font-bold text-xs px-8 py-3.5 rounded-2xl transition-all shadow-lg active:scale-95 flex items-center gap-2"
            >
              <Car className="w-4 h-4" />
              <span>Launch 3D Vehicle Canvas</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
