import React from 'react';
import { Estimate, UserAccount } from '../types';
import { 
  Car, 
  QrCode, 
  User, 
  Table, 
  FileText, 
  RefreshCw, 
  Sparkles, 
  Shield, 
  LogOut,
  ChevronDown,
  Plus,
  Camera,
  Sliders,
  Zap,
  Sun,
  Moon,
  History
} from 'lucide-react';

interface HeaderProps {
  estimate: Estimate;
  currentUser: UserAccount | null;
  theme?: 'dark' | 'light';
  reportsCount?: number;
  onToggleTheme?: () => void;
  onOpenVinScanner: () => void;
  onOpenVehicleEditor: () => void;
  onOpenArScanner: () => void;
  onOpenAuthModal: () => void;
  onOpenMatrixModal: () => void;
  onOpenReportModal: () => void;
  onOpenReportsHistory: () => void;
  onLoadSampleWorksheet: () => void;
  onNewEstimate: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  estimate,
  currentUser,
  theme = 'dark',
  reportsCount = 0,
  onToggleTheme,
  onOpenVinScanner,
  onOpenVehicleEditor,
  onOpenArScanner,
  onOpenAuthModal,
  onOpenMatrixModal,
  onOpenReportModal,
  onOpenReportsHistory,
  onLoadSampleWorksheet,
  onNewEstimate,
  onLogout,
}) => {
  const isEv = estimate.vehicle.fuelType === 'Electric' || estimate.vehicle.make?.toLowerCase().includes('tesla');
  const isDay = theme === 'light';

  return (
    <header className={`w-full sticky top-0 z-40 transition-colors ${isDay ? 'bg-white border-b border-slate-200 shadow-sm text-slate-900' : 'bg-[#141414] border-b border-[#2D2D2D] text-[#E0DED7]'}`}>
      {/* Top Utility Bar */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand & Project ID */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-3">
            <div className="text-2xl md:text-3xl font-serif italic tracking-tight text-[#C5A059]">
              PDR LOGIC
            </div>
            <div className={`h-6 w-[1px] hidden sm:block ${isDay ? 'bg-slate-300' : 'bg-[#2D2D2D]'}`}></div>
            <div className="hidden sm:flex flex-col">
              <span className={`text-[10px] uppercase tracking-widest ${isDay ? 'text-slate-500' : 'text-[#8E8E8E]'}`}>Project / RO</span>
              <span className={`text-sm font-mono font-semibold ${isDay ? 'text-slate-900' : 'text-[#E0DED7]'}`}>{estimate.roNumber || '#EST-8829-X'}</span>
            </div>
          </div>

          <div className="flex sm:hidden items-center gap-2">
            <span className={`text-[10px] font-mono text-[#C5A059] border px-2 py-0.5 rounded-full ${isDay ? 'bg-slate-100 border-slate-300' : 'bg-[#1F1F1F] border-[#3D3D3D]'}`}>
              {estimate.roNumber}
            </span>
          </div>
        </div>

        {/* Vehicle Pill, AR Scanner, Matrix, Auth & Actions */}
        <div className="flex items-center gap-2.5 flex-wrap w-full md:w-auto justify-end">
          {/* Day / Night Mode Toggle */}
          {onToggleTheme && (
            <button
              id="theme-toggle-btn"
              onClick={onToggleTheme}
              title={`Switch to ${isDay ? 'Night Mode (Dark Luxury)' : 'Day Mode (Outdoor Sunlight)'}`}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                isDay 
                  ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100' 
                  : 'bg-[#1F1F1F] text-[#C5A059] border-[#3D3D3D] hover:border-[#C5A059]'
              }`}
            >
              {isDay ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-600" />
                  <span className="hidden sm:inline">Day Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span className="hidden sm:inline">Night Mode</span>
                </>
              )}
            </button>
          )}

          {/* Active Vehicle & Paint Studio Quick Trigger */}
          <button
            id="header-vehicle-editor-btn"
            onClick={onOpenVehicleEditor}
            title={estimate.vehicle?.make ? "Edit Vehicle Specs & OEM Paint Color" : "Enter Vehicle Information or VIN"}
            className={`flex items-center gap-2.5 rounded-full px-3.5 py-1.5 text-xs font-mono transition-all shadow-sm group border ${
              !estimate.vehicle?.make && !estimate.vehicle?.vin
                ? 'bg-[#C5A059] hover:bg-[#B38F48] text-[#0F0F0F] border-[#C5A059] font-bold shadow-md'
                : isDay 
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800' 
                : 'bg-[#1F1F1F] hover:bg-[#252525] border-[#3D3D3D] hover:border-[#C5A059] text-[#E0DED7]'
            }`}
          >
            {estimate.vehicle?.make || estimate.vehicle?.vin ? (
              <>
                <div 
                  className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0" 
                  style={{ backgroundColor: estimate.vehicle.colorHex || '#F2F2F2' }}
                />
                <div className="text-left">
                  <div className="text-xs font-semibold truncate max-w-[130px] sm:max-w-[190px] flex items-center gap-1">
                    <span>{estimate.vehicle.year} {estimate.vehicle.make} {estimate.vehicle.model}</span>
                    {isEv && <Zap className="w-3 h-3 text-[#C5A059] shrink-0" />}
                  </div>
                  <div className="text-[10px] text-[#C5A059] truncate max-w-[130px]">
                    {estimate.vehicle.color || 'OEM Finish'} &bull; {estimate.vehicle.fuelType || 'EV/Gas'}
                  </div>
                </div>
                <Sliders className="w-3.5 h-3.5 text-[#8E8E8E] group-hover:text-[#C5A059] ml-0.5" />
              </>
            ) : (
              <div className="flex items-center gap-1.5 py-0.5">
                <Car className="w-3.5 h-3.5 text-[#0F0F0F]" />
                <span className="font-bold">+ Set Up Vehicle</span>
              </div>
            )}
          </button>

          {/* AR Live Camera Scanner Button */}
          <button
            id="header-ar-scanner-btn"
            onClick={onOpenArScanner}
            className="flex items-center gap-1.5 bg-[#C5A059] hover:bg-[#B38F48] text-[#0F0F0F] px-3.5 py-2 rounded-full text-xs font-bold transition-transform active:scale-95 shadow-md"
          >
            <Camera className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">AR Walkaround</span>
          </button>

          {/* VIN Scanner Quick Button */}
          <button
            id="header-vin-scanner-btn"
            onClick={onOpenVinScanner}
            title="Scan or enter VIN"
            className={`flex items-center gap-1 border px-3 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors ${
              isDay 
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' 
                : 'bg-[#1F1F1F] hover:bg-[#252525] text-[#8E8E8E] hover:text-[#E0DED7] border-[#3D3D3D] hover:border-[#C5A059]'
            }`}
          >
            <QrCode className="w-3.5 h-3.5 text-[#C5A059]" />
            <span className="hidden md:inline">VIN</span>
          </button>

          {/* Reports History Ledger Button */}
          <button
            id="header-reports-history-btn"
            onClick={onOpenReportsHistory}
            title="View Sent Valuation Reports History"
            className={`flex items-center gap-1.5 border px-3 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors relative ${
              isDay 
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' 
                : 'bg-[#1F1F1F] hover:bg-[#252525] text-[#8E8E8E] hover:text-[#C5A059] border-[#3D3D3D] hover:border-[#C5A059]'
            }`}
          >
            <History className="w-3.5 h-3.5 text-[#C5A059]" />
            <span className="hidden md:inline">History</span>
            {reportsCount > 0 && (
              <span className="bg-[#C5A059] text-[#0F0F0F] text-[9px] font-bold px-1.5 py-0.2 rounded-full font-mono">
                {reportsCount}
              </span>
            )}
          </button>

          {/* D&G 2025 Matrix Reference Button */}
          <button
            id="open-matrix-reference-btn"
            onClick={onOpenMatrixModal}
            className={`flex items-center gap-1.5 border px-3 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors ${
              isDay 
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' 
                : 'bg-[#1F1F1F] hover:bg-[#252525] text-[#8E8E8E] hover:text-[#E0DED7] border-[#3D3D3D] hover:border-[#C5A059]'
            }`}
          >
            <Table className="w-3.5 h-3.5 text-[#C5A059]" />
            <span className="hidden lg:inline">Matrix</span>
          </button>

          {/* User Account / Auth */}
          {currentUser ? (
            <div className="flex items-center gap-1.5">
              <button
                id="header-user-account-btn"
                onClick={onOpenAuthModal}
                title="Technician Profile & Settings"
                className={`flex items-center gap-2 border px-2.5 py-1 rounded-full text-xs transition-colors ${
                  isDay 
                    ? 'bg-slate-100 hover:bg-slate-200 border-slate-300' 
                    : 'bg-[#1F1F1F] hover:bg-[#252525] border-[#3D3D3D] hover:border-[#C5A059]'
                }`}
              >
                <div className="w-7 h-7 rounded-full bg-[#C5A059] text-[#0F0F0F] font-bold flex items-center justify-center text-xs font-mono">
                  {currentUser.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'JD'}
                </div>
                <div className="text-left hidden xl:block pr-1">
                  <div className={`text-xs font-semibold ${isDay ? 'text-slate-900' : 'text-[#E0DED7]'}`}>{currentUser.name}</div>
                  <div className="text-[9px] uppercase tracking-widest text-[#8E8E8E]">{currentUser.role}</div>
                </div>
              </button>

              <button
                id="header-logout-btn"
                onClick={onLogout}
                title="Sign Out"
                className={`p-2 rounded-full border transition-colors ${
                  isDay
                    ? 'bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 border-slate-300'
                    : 'bg-[#1F1F1F] hover:bg-red-950/40 text-[#8E8E8E] hover:text-red-400 border-[#3D3D3D]'
                }`}
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              id="header-signin-btn"
              onClick={onOpenAuthModal}
              className="bg-[#C5A059] hover:bg-[#D4B574] text-[#0F0F0F] font-bold text-xs px-4 py-2 rounded-full transition-colors uppercase tracking-wider flex items-center gap-1.5"
            >
              <User className="w-3.5 h-3.5" />
              Sign In
            </button>
          )}

          {/* Quick 1-Click Sample Preset */}
          <button
            id="load-sample-worksheet-btn"
            title="Load 2017 Mercedes GLC 300 Sample Worksheet"
            onClick={onLoadSampleWorksheet}
            className={`p-2 rounded-full transition-colors border ${
              isDay 
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' 
                : 'bg-[#1F1F1F] text-[#8E8E8E] hover:text-[#C5A059] border-[#3D3D3D] hover:border-[#C5A059]'
            }`}
          >
            <Sparkles className="w-4 h-4 text-[#C5A059]" />
          </button>

          {/* New Estimate */}
          <button
            id="new-estimate-btn"
            title="Start New Estimate"
            onClick={onNewEstimate}
            className={`p-2 rounded-full transition-colors border ${
              isDay 
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' 
                : 'bg-[#1F1F1F] text-[#8E8E8E] hover:text-[#E0DED7] border-[#3D3D3D] hover:border-[#C5A059]'
            }`}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

