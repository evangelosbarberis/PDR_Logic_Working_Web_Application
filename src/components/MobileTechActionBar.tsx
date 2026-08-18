import React from 'react';
import { 
  Camera, 
  RotateCw, 
  Layers, 
  FileSpreadsheet, 
  FileText, 
  Sliders, 
  QrCode, 
  CheckCircle2, 
  Plus, 
  Share2, 
  Zap,
  Sparkles,
  Bot,
  Box,
  Table
} from 'lucide-react';
import { PanelId, VehicleInfo } from '../types';
import { PANEL_CONFIGS } from '../data/matrix';

interface MobileTechActionBarProps {
  activeView: '3d' | 'blueprint' | 'matrix' | 'ledger';
  onChangeView: (view: '3d' | 'blueprint' | 'matrix' | 'ledger') => void;
  onOpenArScanner: () => void;
  onOpenVehicleEditor: () => void;
  onOpenVinScanner: () => void;
  onOpenReportModal: () => void;
  onOpenJamesAi?: () => void;
  selectedPanelId: PanelId | null;
  onSelectPanel: (panelId: PanelId) => void;
  vehicle: VehicleInfo;
  totalDents: number;
  grandTotal: number;
  theme?: 'dark' | 'light';
}

const COMMON_QUICK_PANELS: { id: PanelId; label: string; short: string }[] = [
  { id: 'hood', label: 'Hood', short: 'HD' },
  { id: 'roof', label: 'Roof', short: 'RF' },
  { id: 'decklid', label: 'Trunk/Gate', short: 'TR' },
  { id: 'leftFender', label: 'L Fender', short: 'LF' },
  { id: 'leftFrontDoor', label: 'L Front Door', short: 'LFD' },
  { id: 'leftRearDoor', label: 'L Rear Door', short: 'LRD' },
  { id: 'leftQuarter', label: 'L Quarter', short: 'LQ' },
  { id: 'rightFender', label: 'R Fender', short: 'RF' },
  { id: 'rightFrontDoor', label: 'R Front Door', short: 'RFD' },
  { id: 'rightRearDoor', label: 'R Rear Door', short: 'RRD' },
  { id: 'rightQuarter', label: 'R Quarter', short: 'RQ' },
  { id: 'leftRoofRail', label: 'L Rail', short: 'LRR' },
  { id: 'rightRoofRail', label: 'R Rail', short: 'RRR' },
];

export const MobileTechActionBar: React.FC<MobileTechActionBarProps> = ({
  activeView,
  onChangeView,
  onOpenArScanner,
  onOpenVehicleEditor,
  onOpenVinScanner,
  onOpenReportModal,
  onOpenJamesAi,
  selectedPanelId,
  onSelectPanel,
  vehicle,
  totalDents,
  grandTotal,
  theme = 'dark',
}) => {
  const isDay = theme === 'light';

  return (
    <aside aria-label="Mobile Technician Quick Navigation" className={`sticky top-[61px] z-30 backdrop-blur-md border-b shadow-lg py-2 px-3 sm:px-6 transition-colors ${
      isDay ? 'bg-slate-100/95 border-slate-300' : 'bg-[#111113]/95 border-[#2D2D2D]'
    }`}>
      <div className="max-w-7xl mx-auto flex flex-col gap-2">
        {/* Top Row: Fast Mode Selectors + Primary Mobile CTAs */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
          {/* Quick View Modes */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => onChangeView('3d')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                activeView === '3d'
                  ? 'bg-[#C5A059] text-[#0F0F0F] shadow-sm scale-105'
                  : isDay 
                    ? 'bg-white text-slate-700 hover:text-slate-900 border border-slate-300'
                    : 'bg-[#1C1C1F] text-[#8E8E8E] hover:text-[#E0DED7] border border-[#2D2D2D]'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>3D CAD Model</span>
            </button>

            <button
              onClick={() => onChangeView('blueprint')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                activeView === 'blueprint'
                  ? 'bg-[#C5A059] text-[#0F0F0F] shadow-sm'
                  : isDay 
                    ? 'bg-white text-slate-700 hover:text-slate-900 border border-slate-300'
                    : 'bg-[#1C1C1F] text-[#8E8E8E] hover:text-[#E0DED7] border border-[#2D2D2D]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Blueprint</span>
            </button>

            <button
              onClick={() => onChangeView('matrix')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                activeView === 'matrix'
                  ? 'bg-[#C5A059] text-[#0F0F0F] shadow-sm'
                  : isDay 
                    ? 'bg-white text-slate-700 hover:text-slate-900 border border-slate-300'
                    : 'bg-[#1C1C1F] text-[#8E8E8E] hover:text-[#E0DED7] border border-[#2D2D2D]'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>D&amp;G Matrix</span>
            </button>

            <button
              onClick={() => onChangeView('ledger')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                activeView === 'ledger'
                  ? 'bg-[#C5A059] text-[#0F0F0F] shadow-sm'
                  : isDay 
                    ? 'bg-white text-slate-700 hover:text-slate-900 border border-slate-300'
                    : 'bg-[#1C1C1F] text-[#8E8E8E] hover:text-[#E0DED7] border border-[#2D2D2D]'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>The Ledger</span>
            </button>
          </div>

          {/* Quick Mobile Action Shortcuts */}
          <div className="flex items-center gap-1.5 shrink-0 ml-auto">
            {/* AR Walkaround */}
            <button
              onClick={onOpenArScanner}
              title="AR Walkaround Camera Scanner"
              className="bg-[#C5A059] hover:bg-[#B38F48] text-[#0F0F0F] text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full transition-transform active:scale-95 flex items-center gap-1 shadow-sm"
            >
              <Camera className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">AR Walkaround</span>
              <span className="sm:hidden">AR</span>
            </button>

            {/* Quick VIN */}
            <button
              onClick={onOpenVinScanner}
              title="VIN Scanner / Decoder"
              className="bg-[#1F1F1F] hover:bg-[#252525] border border-[#3D3D3D] text-[#C5A059] text-xs font-semibold px-2.5 py-1.5 rounded-full transition-colors flex items-center gap-1"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">VIN</span>
            </button>

            {/* Change Car Model / Paint */}
            <button
              onClick={onOpenVehicleEditor}
              title="Change Car Model or Paint Color"
              className="bg-[#1F1F1F] hover:bg-[#252525] border border-[#3D3D3D] text-[#E0DED7] text-xs font-semibold px-2.5 py-1.5 rounded-full transition-colors flex items-center gap-1"
            >
              <Sliders className="w-3.5 h-3.5 text-[#C5A059]" />
              <span className="hidden md:inline">Change Vehicle</span>
            </button>

            {/* Final Report */}
            <button
              onClick={onOpenReportModal}
              title="Final Hail Valuation Report & Email Dispatch"
              className="bg-[#1F1F1F] hover:bg-[#2A2A2A] text-[#C5A059] border border-[#C5A059]/40 hover:border-[#C5A059] text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full transition-colors flex items-center gap-1 shadow-sm"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Report (${grandTotal.toLocaleString()})</span>
            </button>
          </div>
        </div>

        {/* Bottom Row: 1-Tap Mobile Panel Hotspot Strip (Tap any panel directly from walkaround) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <span className="text-[10px] font-mono text-[#8E8E8E] uppercase tracking-widest shrink-0 mr-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059]"></span>
            1-Tap Panel:
          </span>
          {COMMON_QUICK_PANELS.map(p => {
            const isSelected = selectedPanelId === p.id;
            return (
              <button
                key={p.id}
                onClick={() => onSelectPanel(p.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono whitespace-nowrap transition-all flex items-center gap-1 shrink-0 ${
                  isSelected
                    ? 'bg-[#C5A059] text-[#0F0F0F] font-extrabold shadow-md scale-105 ring-1 ring-white'
                    : 'bg-[#18181A] hover:bg-[#222226] text-[#A0A0A0] hover:text-[#E0DED7] border border-[#2D2D2D]'
                }`}
              >
                <span>{p.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
};
