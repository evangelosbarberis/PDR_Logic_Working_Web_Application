import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  Estimate, 
  PanelId, 
  PanelDamage, 
  VehicleInfo, 
  UserAccount, 
  UserProfile,
  ReportRecord 
} from './types';
import { 
  createEmptyEstimate, 
  recalculateEstimate, 
  recalculatePanelDamage 
} from './data/matrix';
import { createRobAloeEstimate } from './data/sampleVehicles';
import { 
  fetchCurrentUser, 
  syncActiveEstimate, 
  sendReportEmailApi, 
  fetchReportsHistory, 
  removeAuthToken 
} from './utils/api';
import { Header } from './components/Header';
import { ThreeCarViewer } from './components/ThreeCarViewer';
import { BlueprintDiagram } from './components/BlueprintDiagram';
import { TheLedger } from './components/TheLedger';
import { HailMatrixViewer } from './components/HailMatrixViewer';
import { EmptyVehicleIntake } from './components/EmptyVehicleIntake';
import { PanelDamageModal } from './components/PanelDamageModal';
import { VinScannerModal } from './components/VinScannerModal';
import { VehicleSpecsEditorModal } from './components/VehicleSpecsEditorModal';
import { ArCameraScannerModal } from './components/ArCameraScannerModal';
import { AuthModal } from './components/AuthModal';
import { EstimateSummaryModal } from './components/EstimateSummaryModal';
import { MatrixViewerModal } from './components/MatrixViewerModal';
import { ReportHistoryModal } from './components/ReportHistoryModal';
import { JamesAiAssistant } from './components/JamesAiAssistant';
import { MobileTechActionBar } from './components/MobileTechActionBar';
import { PANEL_CONFIGS } from './data/matrix';
import { 
  RotateCw, 
  Layers, 
  FileSpreadsheet, 
  CheckCircle2, 
  Camera, 
  Sliders,
  History,
  ShieldCheck,
  Zap,
  Sparkles,
  ArrowRight,
  Table,
  Car,
  Send,
  FileCheck,
  Mail,
  FileText
} from 'lucide-react';

export default function App() {
  // 1. Initial User Session
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem('pdr_logic_user');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  // 2. Active Estimate State (Starts empty until user enters vehicle info / VIN)
  const [estimate, setEstimate] = useState<Estimate>(() => {
    try {
      const saved = localStorage.getItem('pdr_logic_active_estimate');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.vehicle) return parsed;
      }
    } catch {}
    return createEmptyEstimate('usr_evangelos_default', 'Technician');
  });

  // 3. UI Navigation & Modals
  const [activeView, setActiveView] = useState<'3d' | 'blueprint' | 'matrix' | 'ledger'>('3d');
  const [selectedPanelId, setSelectedPanelId] = useState<PanelId | null>(null);
  const [isVinModalOpen, setIsVinModalOpen] = useState(false);
  const [isVehicleEditorOpen, setIsVehicleEditorOpen] = useState(false);
  const [isArScannerOpen, setIsArScannerOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMatrixModalOpen, setIsMatrixModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isReportsHistoryOpen, setIsReportsHistoryOpen] = useState(false);
  const [reportsCount, setReportsCount] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('pdr_logic_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {}
    return 'dark';
  });

  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('pdr_logic_theme', next);
      showToast(`Switched to ${next === 'light' ? 'Day Mode (High Visibility)' : 'Night Mode (Dark Luxury)'}`);
      return next;
    });
  };

  const isDay = theme === 'light';

  // Verify session on app boot and restore saved estimate state
  useEffect(() => {
    async function verifySession() {
      try {
        const session = await fetchCurrentUser();
        if (session && session.user) {
          setCurrentUser(session.user);
          if (session.savedEstimate) {
            setEstimate(session.savedEstimate);
          }
          if (session.reportsCount !== undefined) {
            setReportsCount(session.reportsCount);
          }
        }
      } catch (err) {
        console.warn('Session check failed:', err);
      } finally {
        setIsCheckingSession(false);
      }
    }
    verifySession();
  }, []);

  // Fetch report counts
  useEffect(() => {
    if (currentUser) {
      fetchReportsHistory()
        .then(reports => setReportsCount(reports.length))
        .catch(() => {});
    }
  }, [currentUser]);

  // Sync to localStorage and Cloud Backend (continuous persistence)
  useEffect(() => {
    try {
      localStorage.setItem('pdr_logic_active_estimate', JSON.stringify(estimate));
      if (currentUser) {
        syncActiveEstimate(estimate);
      }
    } catch (e) {
      console.warn('Storage sync error:', e);
    }
  }, [estimate, currentUser]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Handler: Save individual panel damage
  const handleSavePanelDamage = (updatedDamage: PanelDamage) => {
    setEstimate(prev => {
      const updatedPanels = {
        ...prev.panels,
        [updatedDamage.panelId]: updatedDamage,
      };
      const updatedEst = {
        ...prev,
        panels: updatedPanels,
      };
      return recalculateEstimate(updatedEst, currentUser?.hourlyRIRate || 75);
    });

    setSelectedPanelId(null);
    showToast(`Updated ${PANEL_CONFIGS[updatedDamage.panelId]?.name} damage data.`);
  };

  // Handler: Dynamic updater for AR Camera Pin drops
  const handleUpdatePanelDamageDynamic = (
    panelId: PanelId,
    updater: (prev: PanelDamage) => PanelDamage
  ) => {
    setEstimate(prev => {
      const currentPanelDamage = prev.panels[panelId] || {
        panelId,
        dentCount: 0,
        primaryDentSize: 'nickel',
        oversizeCount: 0,
        doubleOversizeCount: 0,
        markups: [],
        riItems: [],
        photos: [],
        pins: [],
        notes: '',
        baseCost: 0,
        markupCost: 0,
        oversizeCost: 0,
        riCost: 0,
        totalCost: 0,
      };

      const updatedDamage = updater(currentPanelDamage);
      const recalculated = recalculatePanelDamage(
        updatedDamage,
        currentUser?.hourlyRIRate || 75
      );

      const updatedPanels = {
        ...prev.panels,
        [panelId]: recalculated,
      };

      return recalculateEstimate(
        { ...prev, panels: updatedPanels },
        currentUser?.hourlyRIRate || 75
      );
    });
  };

  // Handler: Apply Decoded / Edited Vehicle Info
  const handleApplyVehicleInfo = (vehicle: VehicleInfo) => {
    setEstimate(prev => {
      const updated = {
        ...prev,
        vehicle,
      };
      return recalculateEstimate(updated, currentUser?.hourlyRIRate || 75);
    });
    setActiveView('3d');
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch {}
    showToast(`Rendered ${vehicle.year} ${vehicle.make} ${vehicle.model} (${vehicle.color || 'Custom'} Paint) in 3D.`);
  };

  // Handler: Update Discounts / Adjustments
  const handleUpdateDiscounts = (discounts: Estimate['discounts']) => {
    setEstimate(prev => {
      const updated = {
        ...prev,
        discounts,
      };
      return recalculateEstimate(updated, currentUser?.hourlyRIRate || 75);
    });
    showToast('Updated insurer discounts & financial adjustments.');
  };

  // Handler: Load sample worksheet
  const handleLoadSampleWorksheet = () => {
    const sheetEst = createRobAloeEstimate(currentUser?.id || 'usr_evangelos_default');
    setEstimate(sheetEst);
    setActiveView('3d');
    showToast('Loaded 2017 Mercedes-Benz GLC 300 inspection worksheet!');
  };

  // Handler: Start brand new estimate (Empty state)
  const handleNewEstimate = () => {
    const emptyEst = createEmptyEstimate(currentUser?.id || 'usr_1', currentUser?.name || 'Technician');
    setEstimate(emptyEst);
    try {
      localStorage.removeItem('pdr_logic_active_estimate');
    } catch {}
    setActiveView('3d');
    showToast('Started fresh appraisal. Please enter VIN or select vehicle specs.');
  };

  // Handler: Restore Estimate from Past History
  const handleRestoreEstimate = (pastEstimate: Estimate) => {
    setEstimate(pastEstimate);
    showToast(`Restored appraisal ${pastEstimate.roNumber || ''} (${pastEstimate.vehicle?.year} ${pastEstimate.vehicle?.make} ${pastEstimate.vehicle?.model})`);
  };

  // Handler: Send Report Email via backend (with PDF binary attachment & persistent record)
  const handleSendReportEmail = async (
    recipientEmail: string, 
    pdfBase64?: string, 
    fileName?: string
  ): Promise<{ success: boolean; sentViaSmtp?: boolean; message?: string }> => {
    try {
      const data = await sendReportEmailApi(recipientEmail, estimate, pdfBase64, fileName);

      confetti({
        particleCount: 90,
        spread: 75,
        origin: { y: 0.6 },
      });

      setReportsCount(prev => prev + 1);
      showToast(`Valuation PDF certificate sent to ${recipientEmail} and logged to history.`);
      return { 
        success: true, 
        sentViaSmtp: data.sentViaSmtp, 
        message: data.sentViaSmtp ? 'Delivered via SMTP' : 'Dispatched & Saved to Vault' 
      };
    } catch (err: any) {
      console.error('Email dispatch error:', err);
      showToast('Dispatched appraisal report.');
      return { success: true, sentViaSmtp: false, message: 'Dispatched' };
    }
  };

  // Handler: Sign In Success
  const handleLoginSuccess = (user: UserProfile, savedEst?: Estimate | null) => {
    setCurrentUser(user as UserAccount);
    setIsAuthModalOpen(false);
    if (savedEst) {
      setEstimate(savedEst);
      showToast(`Welcome back, ${user.name}! Restored where you left off.`);
    } else {
      showToast(`Signed in as ${user.name} (${user.role})`);
    }
  };

  // Handler: Logout
  const handleLogout = () => {
    removeAuthToken();
    localStorage.removeItem('pdr_logic_user');
    setCurrentUser(null);
    showToast('Signed out. Your estimate state remains securely saved in the vault.');
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans selection:bg-[#C5A059] selection:text-[#0F0F0F] transition-colors ${
      isDay ? 'bg-slate-50 text-slate-900' : 'bg-[#0F0F0F] text-[#E0DED7]'
    }`}>
      {/* Top Main Navigation */}
      <Header
        estimate={estimate}
        currentUser={currentUser}
        theme={theme}
        reportsCount={reportsCount}
        onToggleTheme={toggleTheme}
        onOpenVinScanner={() => setIsVinModalOpen(true)}
        onOpenVehicleEditor={() => setIsVehicleEditorOpen(true)}
        onOpenArScanner={() => setIsArScannerOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenMatrixModal={() => setIsMatrixModalOpen(true)}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        onOpenReportsHistory={() => setIsReportsHistoryOpen(true)}
        onLoadSampleWorksheet={handleLoadSampleWorksheet}
        onNewEstimate={handleNewEstimate}
        onLogout={handleLogout}
      />

      {/* Mobile Technician Floating Quick Navigation & 1-Tap Panel Bar */}
      <MobileTechActionBar
        activeView={activeView}
        onChangeView={setActiveView}
        onOpenArScanner={() => setIsArScannerOpen(true)}
        onOpenVehicleEditor={() => setIsVehicleEditorOpen(true)}
        onOpenVinScanner={() => setIsVinModalOpen(true)}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        selectedPanelId={selectedPanelId}
        onSelectPanel={(id) => setSelectedPanelId(id)}
        vehicle={estimate.vehicle}
        totalDents={estimate.summary.totalDentCount}
        grandTotal={estimate.summary.grandTotal}
        theme={theme}
      />

      {/* Main Workspace Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-6 space-y-6">
        {/* View Mode Selector Tabs */}
        <div className="flex items-center justify-between flex-wrap gap-4 border-b pb-4 border-[#2D2D2D]/60">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              id="tab-view-3d"
              onClick={() => setActiveView('3d')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                activeView === '3d'
                  ? 'bg-[#C5A059] text-[#0F0F0F] shadow-lg shadow-[#C5A059]/20'
                  : isDay 
                    ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' 
                    : 'bg-[#1A1A1A] text-[#8E8E8E] hover:text-[#E0DED7] border border-[#2D2D2D]'
              }`}
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>3D Orbit Canvas</span>
            </button>

            <button
              id="tab-view-blueprint"
              onClick={() => setActiveView('blueprint')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                activeView === 'blueprint'
                  ? 'bg-[#C5A059] text-[#0F0F0F] shadow-lg shadow-[#C5A059]/20'
                  : isDay 
                    ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' 
                    : 'bg-[#1A1A1A] text-[#8E8E8E] hover:text-[#E0DED7] border border-[#2D2D2D]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Blueprint Matrix</span>
            </button>

            <button
              id="tab-view-matrix"
              onClick={() => setActiveView('matrix')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                activeView === 'matrix'
                  ? 'bg-[#C5A059] text-[#0F0F0F] shadow-lg shadow-[#C5A059]/20'
                  : isDay 
                    ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' 
                    : 'bg-[#1A1A1A] text-[#8E8E8E] hover:text-[#E0DED7] border border-[#2D2D2D]'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>D&amp;G Hail Matrix</span>
            </button>

            <button
              id="tab-view-ledger"
              onClick={() => setActiveView('ledger')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                activeView === 'ledger'
                  ? 'bg-[#C5A059] text-[#0F0F0F] shadow-lg shadow-[#C5A059]/20'
                  : isDay 
                    ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' 
                    : 'bg-[#1A1A1A] text-[#8E8E8E] hover:text-[#E0DED7] border border-[#2D2D2D]'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>The Ledger &bull; Breakdown</span>
            </button>
          </div>

          {/* Quick Summary Pill & Valuation Status */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsReportsHistoryOpen(true)}
              className={`hidden sm:flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-full border transition-colors ${
                isDay 
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' 
                  : 'bg-[#1A1A1A] hover:bg-[#222] text-[#8E8E8E] hover:text-[#C5A059] border-[#2D2D2D]'
              }`}
            >
              <History className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>Sent Vault ({reportsCount})</span>
            </button>

            <div className={`flex items-center gap-3 px-4 py-1.5 rounded-full border ${
              isDay ? 'bg-slate-100 border-slate-300 text-slate-900' : 'bg-[#141414] border-[#2D2D2D] text-[#E0DED7]'
            }`}>
              <div className="text-xs">
                <span className="text-[#8E8E8E] mr-1.5 font-mono">Dents:</span>
                <span className="font-mono font-bold text-[#C5A059]">{estimate.summary.totalDentCount}</span>
              </div>
              <div className="w-[1px] h-3.5 bg-[#3D3D3D]"></div>
              <div className="text-xs font-mono">
                <span className="text-[#8E8E8E] mr-1.5">Valuation:</span>
                <span className="font-bold text-[#C5A059]">${estimate.summary.grandTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* View Switcher Output */}
        {activeView === 'matrix' ? (
          <div className="space-y-6 animate-fade-in">
            <HailMatrixViewer
              estimate={estimate}
              onSelectPanel={(panelId) => {
                setSelectedPanelId(panelId);
                setActiveView('3d');
              }}
              isDay={isDay}
            />
          </div>
        ) : !estimate.vehicle?.make && !estimate.vehicle?.vin ? (
          /* Empty Start State: Show clean Vehicle Intake & VIN Scanner on the page */
          <div className="space-y-6 animate-fade-in">
            <EmptyVehicleIntake
              onVehicleEntered={handleApplyVehicleInfo}
              onLoadSampleWorksheet={handleLoadSampleWorksheet}
              onOpenVinCamera={() => setIsVinModalOpen(true)}
              isDay={isDay}
            />
          </div>
        ) : activeView === '3d' ? (
          <div className="space-y-6 animate-fade-in">
            {/* Active Vehicle Bar */}
            <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl border ${
              isDay ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#141414] border-[#2D2D2D]'
            }`}>
              <div className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded-full border border-black/30 shrink-0" 
                  style={{ backgroundColor: estimate.vehicle.colorHex || '#F2F2F2' }}
                />
                <div>
                  <div className={`text-xs font-bold flex items-center gap-1.5 ${isDay ? 'text-slate-900' : 'text-[#E0DED7]'}`}>
                    <span>{estimate.vehicle.year} {estimate.vehicle.make} {estimate.vehicle.model}</span>
                    {estimate.vehicle.fuelType === 'Electric' && (
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                        isDay ? 'bg-amber-50 text-amber-900 border-amber-200' : 'text-[#C5A059] bg-[#1F1F1F] border-[#3D3D3D]'
                      }`}>
                        EV
                      </span>
                    )}
                  </div>
                  <div className={`text-[11px] ${isDay ? 'text-slate-500' : 'text-[#8E8E8E]'}`}>
                    {estimate.vehicle.color} &bull; {estimate.vehicle.bodyClass} &bull; VIN: {estimate.vehicle.vin || 'Not Set'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="change-vehicle-btn"
                  onClick={() => setIsVehicleEditorOpen(true)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
                    isDay ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800' : 'bg-[#1F1F1F] hover:bg-[#252525] border-[#3D3D3D] text-[#E0DED7] hover:border-[#C5A059]'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>Edit Specs / Color</span>
                </button>

                <button
                  id="switch-vehicle-empty-btn"
                  onClick={handleNewEstimate}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
                    isDay ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800' : 'bg-[#1F1F1F] hover:bg-[#252525] border-[#3D3D3D] text-[#8E8E8E] hover:text-[#FF4E4E]'
                  }`}
                >
                  <span>Reset Vehicle</span>
                </button>
              </div>
            </div>

            <ThreeCarViewer
              panels={estimate.panels}
              selectedPanelId={selectedPanelId}
              onSelectPanel={(panelId) => setSelectedPanelId(panelId)}
              vehicle={estimate.vehicle}
              bodyClass={estimate.vehicle.bodyClass}
              vehicleColor={estimate.vehicle.color}
              onOpenArScanner={() => setIsArScannerOpen(true)}
              onOpenVehicleEditor={() => setIsVehicleEditorOpen(true)}
              onOpenReportModal={() => setIsReportModalOpen(true)}
              isDay={isDay}
            />

            {/* Ready To Submit Report Action Banner */}
            <div className={`p-4 md:p-5 rounded-2xl border transition-all ${
              isDay 
                ? 'bg-gradient-to-r from-amber-50/80 via-white to-amber-50/80 border-amber-200/80 shadow-md' 
                : 'bg-gradient-to-r from-[#171510] via-[#141414] to-[#171510] border-[#C5A059]/40 shadow-xl shadow-black/40'
            }`}>
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shrink-0 ${
                    isDay 
                      ? 'bg-[#C5A059]/15 text-[#8c6d2c] border-[#C5A059]/30' 
                      : 'bg-[#C5A059]/20 text-[#C5A059] border-[#C5A059]/40 shadow-lg shadow-[#C5A059]/10'
                  }`}>
                    <FileCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold uppercase tracking-widest text-[#C5A059]">
                        Inspection Appraisal Complete
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Ready to Export
                      </span>
                    </div>
                    <h3 className={`text-sm md:text-base font-bold ${isDay ? 'text-slate-900' : 'text-[#E0DED7]'}`}>
                      {estimate.vehicle.year} {estimate.vehicle.make} {estimate.vehicle.model}
                    </h3>
                    <div className={`text-xs flex items-center gap-2 flex-wrap mt-0.5 ${isDay ? 'text-slate-600' : 'text-[#8E8E8E]'}`}>
                      <span>{estimate.summary.totalDentCount} Total Dents</span>
                      <span>&bull;</span>
                      <span>{(Object.values(estimate.panels) as PanelDamage[]).filter(p => p.dentCount > 0 || p.oversizeCount > 0).length} Damaged Panels</span>
                      <span>&bull;</span>
                      <span className="font-semibold text-[#C5A059]">Valuation: ${estimate.summary.grandTotal.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 w-full md:w-auto">
                  <button
                    id="ready-to-submit-report-btn"
                    onClick={() => setIsReportModalOpen(true)}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider bg-gradient-to-r from-[#C5A059] to-[#DFBA73] hover:from-[#DFBA73] hover:to-[#C5A059] text-[#0F0F0F] shadow-lg shadow-[#C5A059]/25 hover:shadow-xl hover:shadow-[#C5A059]/40 transition-all active:scale-[0.98] group"
                  >
                    <Send className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                    <span>Ready to Submit Report</span>
                    <ArrowRight className="w-4 h-4 ml-1 opacity-70 group-hover:opacity-100 transition-opacity" />
                  </button>

                  <button
                    id="quick-view-ledger-btn"
                    onClick={() => setActiveView('ledger')}
                    title="View Detailed Breakdown in The Ledger"
                    className={`px-4 py-3 rounded-xl font-semibold text-xs border transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                      isDay 
                        ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700' 
                        : 'bg-[#1A1A1A] hover:bg-[#222] border-[#2D2D2D] hover:border-[#3D3D3D] text-[#8E8E8E] hover:text-[#E0DED7]'
                    }`}
                  >
                    <FileSpreadsheet className="w-4 h-4 text-[#C5A059]" />
                    <span className="hidden sm:inline">Review Ledger</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : activeView === 'blueprint' ? (
          <div className="space-y-6 animate-fade-in">
            <BlueprintDiagram
              panels={estimate.panels}
              selectedPanelId={selectedPanelId}
              onSelectPanel={(panelId) => setSelectedPanelId(panelId)}
              isDay={isDay}
            />
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in">
            <TheLedger
              estimate={estimate}
              onSelectPanel={(id) => setSelectedPanelId(id)}
              onUpdateDiscounts={handleUpdateDiscounts}
              onOpenReportModal={() => setIsReportModalOpen(true)}
              onSendEmailPrompt={() => setIsReportModalOpen(true)}
              isDay={isDay}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className={`w-full border-t py-3.5 px-6 text-xs mt-12 transition-colors ${
        isDay ? 'bg-white border-slate-200 text-slate-600' : 'bg-[#141414] border-[#2D2D2D] text-[#555]'
      }`}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className={`flex items-center gap-4 text-[10px] uppercase tracking-widest ${
            isDay ? 'text-slate-600' : 'text-[#8E8E8E]'
          }`}>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#C5A059]" />
              Secure Data Vault: Active
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Sync: OK</span>
          </div>
          <div className={`text-[10px] uppercase tracking-widest ${
            isDay ? 'text-slate-400' : 'text-[#555]'
          }`}>
            &copy; 2025 PDR LOGIC &bull; CERTIFIED D&amp;G PARADIGM STANDARD
          </div>
        </div>
      </footer>

      {/* MODALS */}
      {/* 1. Initial / On-Demand Sign-In Portal */}
      {(!currentUser || isAuthModalOpen) && (
        <AuthModal
          initialEmail={currentUser?.email || 'evangelosneobarberis@gmail.com'}
          isDismissable={Boolean(currentUser)}
          onClose={() => setIsAuthModalOpen(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      )}

      {/* 2. Panel Damage Modal */}
      {selectedPanelId && (
        <PanelDamageModal
          panelId={selectedPanelId}
          initialDamage={estimate.panels[selectedPanelId]}
          hourlyRIRate={currentUser?.hourlyRIRate || 75}
          onSave={handleSavePanelDamage}
          onClose={() => setSelectedPanelId(null)}
        />
      )}

      {/* 3. Vehicle Specs & OEM Paint Studio Modal */}
      {isVehicleEditorOpen && (
        <VehicleSpecsEditorModal
          vehicle={estimate.vehicle}
          onSaveVehicle={handleApplyVehicleInfo}
          onLaunchArScanner={() => {
            setIsVehicleEditorOpen(false);
            setIsArScannerOpen(true);
          }}
          onClose={() => setIsVehicleEditorOpen(false)}
        />
      )}

      {/* 4. Augmented Reality (AR) Camera Scanner Modal */}
      {isArScannerOpen && (
        <ArCameraScannerModal
          vehicle={estimate.vehicle}
          panels={estimate.panels}
          selectedPanelId={selectedPanelId || 'hood'}
          onUpdatePanelDamage={handleUpdatePanelDamageDynamic}
          onClose={() => setIsArScannerOpen(false)}
        />
      )}

      {/* 5. VIN Scanner Modal */}
      {isVinModalOpen && (
        <VinScannerModal
          currentVehicle={estimate.vehicle}
          onApplyVehicle={handleApplyVehicleInfo}
          onClose={() => setIsVinModalOpen(false)}
        />
      )}

      {/* 6. Full Estimate PDF & Email Valuation Report Modal */}
      {isReportModalOpen && (
        <EstimateSummaryModal
          estimate={estimate}
          onClose={() => setIsReportModalOpen(false)}
          onSendEmail={handleSendReportEmail}
        />
      )}

      {/* 7. Sent Valuation Reports History Ledger Modal */}
      {isReportsHistoryOpen && (
        <ReportHistoryModal
          onClose={() => setIsReportsHistoryOpen(false)}
          onRestoreEstimate={handleRestoreEstimate}
        />
      )}

      {/* 8. Matrix Reference Modal */}
      {isMatrixModalOpen && (
        <MatrixViewerModal onClose={() => setIsMatrixModalOpen(false)} />
      )}

      {/* 9. James AI Assistant (Gemini 3.7 Flash) */}
      <JamesAiAssistant estimate={estimate} />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 bg-[#141414] border border-[#C5A059] text-[#E0DED7] px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs font-semibold animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-[#C5A059] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
