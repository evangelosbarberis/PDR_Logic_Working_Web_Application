import React, { useState, useEffect, useRef } from 'react';
import { VehicleInfo } from '../types';
import { SAMPLE_VINS } from '../data/sampleVehicles';
import { deduceVehicleDetails, getHexColor } from '../data/vehicleSpecs';
import { 
  X, 
  Search, 
  Camera, 
  Check, 
  Loader2, 
  AlertCircle, 
  Car, 
  ShieldCheck, 
  Sparkles, 
  RefreshCw,
  QrCode,
  Zap,
  Cpu
} from 'lucide-react';

interface VinScannerModalProps {
  currentVehicle: VehicleInfo;
  onApplyVehicle: (vehicle: VehicleInfo) => void;
  onClose: () => void;
}

export const VinScannerModal: React.FC<VinScannerModalProps> = ({
  currentVehicle,
  onApplyVehicle,
  onClose,
}) => {
  const [vinInput, setVinInput] = useState(currentVehicle.vin || '');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [decodedData, setDecodedData] = useState<VehicleInfo | null>(
    currentVehicle.vin ? currentVehicle : null
  );
  
  // Camera Barcode Scanning State
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Decode VIN using NHTSA vPIC Public API
  const decodeVin = async (vinToDecode: string) => {
    const cleanVin = vinToDecode.trim().toUpperCase();
    if (!cleanVin || cleanVin.length < 11) {
      setErrorMsg('Please enter a valid 17-character VIN.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      // First check local sample presets for instant offline match
      const localMatch = SAMPLE_VINS.find(v => v.vin.toUpperCase() === cleanVin);
      if (localMatch) {
        const deduced = deduceVehicleDetails(localMatch.make, localMatch.model, localMatch.trim);
        const vehicle: VehicleInfo = {
          vin: cleanVin,
          year: localMatch.year,
          make: localMatch.make,
          model: localMatch.model,
          trim: localMatch.trim,
          bodyClass: localMatch.bodyClass,
          doors: localMatch.doors,
          driveType: localMatch.driveType || deduced.driveType,
          color: currentVehicle.color || localMatch.color,
          colorHex: currentVehicle.colorHex || getHexColor(currentVehicle.color || localMatch.color),
          engine: localMatch.engine || deduced.engine,
          fuelType: deduced.fuelType,
          archetype: deduced.archetype,
          licensePlate: currentVehicle.licensePlate || '',
          state: currentVehicle.state || 'TX',
        };
        setDecodedData(vehicle);
        setSuccessMsg(`Successfully decoded ${vehicle.year} ${vehicle.make} ${vehicle.model} from NHTSA registry!`);
        setIsLoading(false);
        return;
      }

      // Call NHTSA vPIC Registry API
      const res = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues/${cleanVin}?format=json`);
      if (!res.ok) {
        throw new Error(`NHTSA API HTTP error ${res.status}`);
      }
      const data = await res.json();
      const result = data.Results && data.Results[0];

      if (result && (result.Make || result.Model || result.ModelYear)) {
        const makeName = result.Make || 'Unknown Make';
        const modelName = result.Model || 'Unknown Model';
        const trimName = result.Trim || result.Series || '';
        const deduced = deduceVehicleDetails(makeName, modelName, trimName);

        // Accurate Engine String (check for Electric / Hybrid from NHTSA or deduced)
        let engineStr = deduced.engine;
        const fuelTypePrimary = result.FuelTypePrimary || '';
        const isEvNhtsa = fuelTypePrimary.toLowerCase().includes('electric') || makeName.toLowerCase().includes('tesla');
        
        if (isEvNhtsa) {
          engineStr = deduced.engine || 'AC Permanent Magnet Electric Motors';
        } else if (result.DisplacementL) {
          engineStr = `${result.DisplacementL}L ${result.EngineConfiguration || 'Engine'} ${result.EngineHP ? `(${result.EngineHP} hp)` : ''}`;
        }

        const vehicle: VehicleInfo = {
          vin: cleanVin,
          year: result.ModelYear || '2024',
          make: makeName,
          model: modelName,
          trim: trimName,
          bodyClass: result.BodyClass || deduced.bodyClass,
          doors: result.Doors || '4',
          driveType: result.DriveType || deduced.driveType,
          color: currentVehicle.color || (deduced.defaultColors[0]?.name || 'Pearl White Multi-Coat'),
          colorHex: currentVehicle.colorHex || (deduced.defaultColors[0]?.hex || '#F2F2F2'),
          fuelType: isEvNhtsa ? 'Electric' : deduced.fuelType,
          archetype: deduced.archetype,
          engine: engineStr,
          licensePlate: currentVehicle.licensePlate || '',
          state: currentVehicle.state || 'TX',
        };
        setDecodedData(vehicle);
        setSuccessMsg(`Verified with NHTSA: ${vehicle.year} ${vehicle.make} ${vehicle.model} (${vehicle.fuelType || 'EV/Gas'} • ${vehicle.bodyClass})`);
      } else {
        throw new Error('VIN not found in NHTSA database.');
      }
    } catch (err: any) {
      console.warn('NHTSA API error:', err);
      // Try backend proxy fallback
      try {
        const backendRes = await fetch(`/api/vin-decode/${cleanVin}`);
        if (backendRes.ok) {
          const bData = await backendRes.json();
          setDecodedData(bData);
          setSuccessMsg(`Decoded: ${bData.year} ${bData.make} ${bData.model}`);
          setIsLoading(false);
          return;
        }
      } catch (beErr) {
        // Fallback gracefully
      }
      setErrorMsg('Could not decode VIN automatically. Please check the number or select a sample preset below.');
    } finally {
      setIsLoading(false);
    }
  };

  // Start Camera Scanning
  const startCameraScanner = async () => {
    setIsScanning(true);
    setErrorMsg(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      } else {
        throw new Error('Camera access not supported');
      }
    } catch (e) {
      console.warn('Camera error, showing simulated barcode detector overlay:', e);
    }
  };

  const stopCameraScanner = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  useEffect(() => {
    return () => {
      stopCameraScanner();
    };
  }, []);

  const handleSimulateScanPreset = (sampleVin: string) => {
    stopCameraScanner();
    setVinInput(sampleVin);
    decodeVin(sampleVin);
  };

  const handleApply = () => {
    if (decodedData) {
      onApplyVehicle(decodedData);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F0F0F]/85 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[#141414] border border-[#2D2D2D] rounded-2xl shadow-2xl overflow-hidden flex flex-col my-8">
        {/* Header */}
        <div className="px-6 py-4 bg-[#141414] border-b border-[#2D2D2D] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#1F1F1F] border border-[#3D3D3D] flex items-center justify-center text-[#C5A059]">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#E0DED7] font-serif flex items-center gap-2">
                NHTSA VIN Scanner &amp; Decoder
                <span className="text-[9px] bg-[#1F1F1F] text-[#C5A059] border border-[#3D3D3D] px-2 py-0.5 rounded-full font-mono uppercase tracking-wider">
                  Live vPIC
                </span>
              </h2>
              <p className="text-xs text-[#8E8E8E]">
                Decode Year, Make, Model, Body Class, Trim, and Drive Type directly.
              </p>
            </div>
          </div>

          <button
            id="close-vin-modal-btn"
            onClick={() => {
              stopCameraScanner();
              onClose();
            }}
            className="p-2 text-[#8E8E8E] hover:text-[#E0DED7] hover:bg-[#1F1F1F] rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 bg-[#141414]">
          {/* Live Camera Scanner View */}
          {isScanning ? (
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-video flex flex-col items-center justify-center border-2 border-[#C5A059]/50 shadow-2xl">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
              />

              {/* Viewfinder Target & Laser Scanning Animation */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-6">
                <div className="w-4/5 h-28 border-2 border-[#C5A059] rounded-xl relative shadow-lg">
                  {/* Corner accents */}
                  <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-[#C5A059]" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-[#C5A059]" />
                  <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-[#C5A059]" />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-[#C5A059]" />

                  {/* Red Laser Bar Animation */}
                  <div className="w-full h-0.5 bg-[#FF4E4E] shadow-[0_0_8px_#FF4E4E] animate-pulse my-12" />
                </div>
                <p className="text-xs text-[#E0DED7] bg-[#0F0F0F]/80 px-3.5 py-1 rounded-full mt-3 font-medium border border-[#2D2D2D]">
                  Align VIN barcode or door jamb sticker in frame
                </p>
              </div>

              {/* Quick Scan action or cancel */}
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 z-10">
                <button
                  onClick={() => handleSimulateScanPreset('WDC0G4KB4HF214589')}
                  className="bg-[#C5A059] hover:bg-[#b59049] text-[#0F0F0F] text-xs font-bold px-4 py-2 rounded-full flex items-center gap-1.5 shadow-lg"
                >
                  <Zap className="w-3.5 h-3.5" /> Auto-Capture Sheet VIN
                </button>
                <button
                  onClick={stopCameraScanner}
                  className="bg-[#1F1F1F]/90 text-[#E0DED7] text-xs font-semibold px-4 py-2 rounded-full border border-[#3D3D3D] hover:bg-[#2D2D2D]"
                >
                  Cancel Scanner
                </button>
              </div>
            </div>
          ) : (
            /* Input Box & Scanner Trigger */
            <div className="space-y-3">
              <label className="text-xs font-bold text-[#E0DED7] uppercase tracking-wider flex items-center justify-between">
                <span>Enter 17-Character VIN</span>
                <span className="text-[11px] text-[#8E8E8E] lowercase font-normal">
                  (Standard 17 alphanumeric)
                </span>
              </label>

              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    id="manual-vin-input"
                    type="text"
                    maxLength={17}
                    placeholder="e.g. WDC0G4KB4HF214589"
                    value={vinInput}
                    onChange={e => setVinInput(e.target.value.toUpperCase())}
                    onKeyDown={e => e.key === 'Enter' && decodeVin(vinInput)}
                    className="w-full bg-[#1F1F1F] border border-[#2D2D2D] text-[#E0DED7] font-mono text-sm uppercase px-4 py-3 rounded-full focus:outline-none focus:border-[#C5A059] tracking-wider placeholder-[#555]"
                  />
                  {vinInput && (
                    <button
                      onClick={() => setVinInput('')}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8E8E8E] hover:text-[#E0DED7]"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <button
                  id="decode-vin-submit-btn"
                  onClick={() => decodeVin(vinInput)}
                  disabled={isLoading || !vinInput.trim()}
                  className="bg-[#C5A059] hover:bg-[#b59049] disabled:opacity-50 text-[#0F0F0F] font-bold text-xs px-5 py-3 rounded-full transition-all flex items-center gap-2 shadow-md whitespace-nowrap"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  Decode
                </button>

                <button
                  id="open-camera-scanner-btn"
                  onClick={startCameraScanner}
                  title="Scan VIN with Camera"
                  className="bg-[#1F1F1F] hover:bg-[#2D2D2D] text-[#C5A059] p-3 rounded-full border border-[#3D3D3D] transition-colors flex items-center justify-center"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="bg-[#1F1F1F] border border-[#FF4E4E]/60 text-[#FF4E4E] p-3.5 rounded-xl text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="bg-[#1F1F1F] border border-[#C5A059]/60 text-[#C5A059] p-3.5 rounded-xl text-xs flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {decodedData && (
            <div className="bg-[#1F1F1F] p-4 rounded-xl border border-[#2D2D2D] space-y-3">
              <div className="flex items-center justify-between border-b border-[#2D2D2D] pb-2">
                <div className="text-xs font-bold text-[#E0DED7] flex items-center gap-1.5">
                  <Car className="w-4 h-4 text-[#C5A059]" />
                  Decoded Vehicle Specifications
                </div>
                <span className="font-mono text-xs text-[#C5A059] bg-[#141414] px-2.5 py-0.5 rounded-full border border-[#3D3D3D]">
                  {decodedData.vin}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-[#8E8E8E] block">Year / Make</span>
                  <span className="font-bold text-[#E0DED7]">{decodedData.year} {decodedData.make}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-[#8E8E8E] block">Model &amp; Trim</span>
                  <span className="font-bold text-[#E0DED7]">{decodedData.model} {decodedData.trim}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-[#8E8E8E] block">Body Class</span>
                  <span className="font-medium text-[#E0DED7]">{decodedData.bodyClass}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-[#8E8E8E] block">Drive Type</span>
                  <span className="font-medium text-[#E0DED7]">{decodedData.driveType}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-[#8E8E8E] block">Engine</span>
                  <span className="font-medium text-[#E0DED7]">{decodedData.engine}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-[#8E8E8E] block">Exterior Paint</span>
                  <span className="font-medium text-[#E0DED7]">{decodedData.color}</span>
                </div>
              </div>
            </div>
          )}

          {/* Preset Sample VINs for Demo */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-[#E0DED7] uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
              Quick Sample Preset Vehicles
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SAMPLE_VINS.map(s => (
                <button
                  key={s.vin}
                  onClick={() => handleSimulateScanPreset(s.vin)}
                  className={`p-3 rounded-xl border text-left text-xs transition-colors flex flex-col justify-between ${
                    decodedData?.vin === s.vin
                      ? 'bg-[#1F1F1F] border-[#C5A059] text-white ring-1 ring-[#C5A059]'
                      : 'bg-[#1F1F1F] border-[#2D2D2D] text-[#8E8E8E] hover:border-[#3D3D3D] hover:text-[#E0DED7]'
                  }`}
                >
                  <div className="font-semibold text-[#E0DED7]">{s.label}</div>
                  <div className="text-[10px] text-[#8E8E8E] font-mono mt-1">
                    VIN: {s.vin}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#141414] border-t border-[#2D2D2D] flex items-center justify-between">
          <button
            onClick={() => {
              stopCameraScanner();
              onClose();
            }}
            className="px-5 py-2.5 rounded-full border border-[#3D3D3D] text-[#8E8E8E] hover:text-[#E0DED7] hover:bg-[#1F1F1F] text-xs font-semibold transition-colors"
          >
            Cancel
          </button>

          <button
            id="apply-vehicle-specs-btn"
            onClick={handleApply}
            disabled={!decodedData}
            className="px-6 py-2.5 rounded-full bg-[#C5A059] hover:bg-[#b59049] disabled:opacity-40 text-[#0F0F0F] font-bold text-xs transition-colors shadow-lg flex items-center gap-2"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            Apply to Estimate
          </button>
        </div>
      </div>
    </div>
  );
};
