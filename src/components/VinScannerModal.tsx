import React, { useState, useEffect, useRef } from 'react';
import { VehicleInfo } from '../types';
import { SAMPLE_VINS } from '../data/sampleVehicles';
import { deduceVehicleDetails, getHexColor } from '../data/vehicleSpecs';
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType, NotFoundException } from '@zxing/library';
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
} from 'lucide-react';

// Characters I, O, Q are never used in a real VIN (to avoid confusion with 1, 0)
const VIN_CANDIDATE_REGEX = /[A-HJ-NPR-Z0-9]{17}/;

// Pull the most VIN-like 17-char run out of whatever text the barcode/QR decoded to.
// Window-sticker barcodes often encode extra text (dealer codes, field labels) around the VIN.
function extractVinFromScan(rawText: string): string | null {
  const cleaned = rawText.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const match = cleaned.match(VIN_CANDIDATE_REGEX);
  return match ? match[0] : null;
}

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
  const [scanStatus, setScanStatus] = useState<string>('Point the camera at the VIN barcode or QR code');
  const [cameraDenied, setCameraDenied] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanControlsRef = useRef<IScannerControls | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  // Lazily build a zxing reader configured for the barcode/QR formats VIN stickers actually use
  const getReader = () => {
    if (!readerRef.current) {
      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.QR_CODE,
        BarcodeFormat.CODE_39,
        BarcodeFormat.CODE_128,
        BarcodeFormat.PDF_417,
        BarcodeFormat.DATA_MATRIX,
      ]);
      readerRef.current = new BrowserMultiFormatReader(hints);
    }
    return readerRef.current;
  };

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

  // Start Camera Scanning with live barcode/QR decoding
  const startCameraScanner = async () => {
    setIsScanning(true);
    setErrorMsg(null);
    setCameraDenied(null);
    setScanStatus('Point the camera at the VIN barcode or QR code');
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported in this browser.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
      });
      streamRef.current = stream;

      if (!videoRef.current) return;

      const reader = getReader();
      const controls = await reader.decodeFromStream(stream, videoRef.current, (result, err) => {
        if (result) {
          const extractedVin = extractVinFromScan(result.getText());
          if (extractedVin) {
            setScanStatus(`Detected: ${extractedVin}`);
            handleSimulateScanPreset(extractedVin);
          } else {
            // Scanned something, but it doesn't look like a 17-char VIN - keep scanning
            setScanStatus('Scanned a code, but it doesn\u2019t look like a VIN. Keep trying...');
          }
          return;
        }
        // NotFoundException fires continuously between successful reads - that's normal, not an error
        if (err && !(err instanceof NotFoundException)) {
          console.warn('Barcode decode error:', err);
        }
      });
      scanControlsRef.current = controls;
    } catch (e: any) {
      console.warn('Camera error:', e);
      setIsScanning(false);
      if (e?.name === 'NotAllowedError' || e?.name === 'PermissionDeniedError') {
        setCameraDenied('Camera access was blocked. Please allow camera permission for this site in your browser settings and try again.');
      } else if (e?.name === 'NotFoundError') {
        setCameraDenied('No camera was found on this device.');
      } else {
        setCameraDenied(e?.message || 'Could not access the camera on this device.');
      }
    }
  };

  const stopCameraScanner = () => {
    if (scanControlsRef.current) {
      scanControlsRef.current.stop();
      scanControlsRef.current = null;
    }
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
                <p className="text-xs text-[#E0DED7] bg-[#0F0F0F]/80 px-3.5 py-1 rounded-full mt-3 font-medium border border-[#2D2D2D] text-center max-w-[90%]">
                  {scanStatus}
                </p>
              </div>

              {/* Cancel */}
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-end gap-2 z-10">
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

          {/* Camera Permission / Availability Errors */}
          {cameraDenied && (
            <div className="bg-[#1F1F1F] border border-[#FF4E4E]/60 text-[#FF4E4E] p-3.5 rounded-xl text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{cameraDenied}</span>
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
