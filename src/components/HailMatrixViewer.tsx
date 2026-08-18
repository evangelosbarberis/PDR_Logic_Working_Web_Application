import React, { useState } from 'react';
import { MATRIX_TIERS, COIN_DIMENSIONS, MARKUP_DEFINITIONS, OVERSIZE_PRICING, PANEL_CONFIGS, calculateMatrixBase } from '../data/matrix';
import { MatrixPanelType, DentSize, PanelId, PanelDamage, Estimate } from '../types';
import { Table, Coins, Layers, AlertTriangle, Sparkles, Filter, ChevronRight, Calculator, CheckCircle2, Info, ArrowUpRight } from 'lucide-react';

interface HailMatrixViewerProps {
  estimate?: Estimate;
  onSelectPanel?: (panelId: PanelId) => void;
  isDay?: boolean;
}

export const HailMatrixViewer: React.FC<HailMatrixViewerProps> = ({
  estimate,
  onSelectPanel,
  isDay = false,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'matrix' | 'coins' | 'markups' | 'calculator'>('matrix');
  const [selectedPanelFocus, setSelectedPanelFocus] = useState<MatrixPanelType | 'all'>('all');
  
  // Interactive rate calculator state
  const [calcPanelType, setCalcPanelType] = useState<MatrixPanelType>('roof');
  const [calcDentCount, setCalcDentCount] = useState<number>(35);
  const [calcCoinSize, setCalcCoinSize] = useState<DentSize>('quarter');
  const [calcOversize, setCalcOversize] = useState<number>(0);
  const [calcMarkups, setCalcMarkups] = useState<string[]>(['aluminumPanels']);

  const matrixColumns: { key: MatrixPanelType; label: string; panelIds: PanelId[] }[] = [
    { key: 'roof', label: 'Roof Panel', panelIds: ['roof'] },
    { key: 'hood', label: 'Hood', panelIds: ['hood'] },
    { key: 'decklid', label: 'Decklid / Liftgate', panelIds: ['decklid'] },
    { key: 'fender', label: 'Fenders (L/R)', panelIds: ['leftFender', 'rightFender'] },
    { key: 'roofRail', label: 'Roof Rails (L/R)', panelIds: ['leftRoofRail', 'rightRoofRail'] },
    { key: 'door', label: 'Doors (Front/Rear)', panelIds: ['leftFrontDoor', 'rightFrontDoor', 'leftRearDoor', 'rightRearDoor'] },
    { key: 'quarterPanel', label: 'Quarter Panels (L/R)', panelIds: ['leftQuarter', 'rightQuarter'] },
  ];

  const displayedColumns = selectedPanelFocus === 'all' 
    ? matrixColumns 
    : matrixColumns.filter(c => c.key === selectedPanelFocus);

  // Check if estimate has damage recorded for a given matrix panel type
  const getDamagedPanelsForCol = (panelIds: PanelId[]) => {
    if (!estimate) return [];
    return panelIds
      .map(id => ({ id, damage: estimate.panels[id], config: PANEL_CONFIGS[id] }))
      .filter(item => item.damage && (item.damage.dentCount > 0 || item.damage.oversizeCount > 0));
  };

  // Calculator price computation
  const calcBaseResult = calculateMatrixBase(calcPanelType, calcDentCount, calcCoinSize);
  const calcBasePrice = calcBaseResult.baseCost;
  const calcOversizePrice = calcOversize * OVERSIZE_PRICING.halfDollarPlus;
  const calcMarkupPercent = calcMarkups.length * 25;
  const calcMarkupDollars = Math.round((calcBasePrice + calcOversizePrice) * (calcMarkupPercent / 100));
  const calcTotalPrice = calcBasePrice + calcOversizePrice + calcMarkupDollars;

  return (
    <div className={`w-full rounded-2xl border transition-colors shadow-2xl p-4 md:p-6 space-y-6 ${
      isDay ? 'bg-white border-slate-200 text-slate-900 shadow-slate-100' : 'bg-[#141414] border-[#2D2D2D] text-[#E0DED7]'
    }`}>
      {/* Header with Title and Tab Selectors */}
      <div className={`flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b pb-4 ${
        isDay ? 'border-slate-200' : 'border-[#2D2D2D]'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center border shadow-sm ${
            isDay ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-[#1F1F1F] text-[#C5A059] border-[#3D3D3D]'
          }`}>
            <Table className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-serif italic text-2xl tracking-tight text-[#C5A059]">
                D&amp;G Paradigm 2025 Hail Matrix
              </h2>
              <span className={`text-[10px] uppercase font-mono px-2.5 py-0.5 rounded-full border ${
                isDay ? 'bg-amber-50 text-amber-800 border-amber-300' : 'bg-[#1F1F1F] text-[#C5A059] border-[#3D3D3D]'
              }`}>
                PDR Industry Standard
              </span>
            </div>
            <p className={`text-xs mt-0.5 ${isDay ? 'text-slate-500' : 'text-[#8E8E8E]'}`}>
              Comprehensive valuation baseline for hail dent density, coin sizing, oversize allowances, and condition markups.
            </p>
          </div>
        </div>

        {/* Sub-tabs & Filter Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className={`flex items-center p-1 rounded-full border ${
            isDay ? 'bg-slate-100 border-slate-300' : 'bg-[#1F1F1F] border-[#2D2D2D]'
          }`}>
            <button
              id="matrix-tab-pricing"
              onClick={() => setActiveSubTab('matrix')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeSubTab === 'matrix'
                  ? 'bg-[#C5A059] text-[#0F0F0F] font-bold shadow-sm'
                  : isDay ? 'text-slate-600 hover:text-slate-900' : 'text-[#8E8E8E] hover:text-[#E0DED7]'
              }`}
            >
              Pricing Table
            </button>
            <button
              id="matrix-tab-calculator"
              onClick={() => setActiveSubTab('calculator')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1 ${
                activeSubTab === 'calculator'
                  ? 'bg-[#C5A059] text-[#0F0F0F] font-bold shadow-sm'
                  : isDay ? 'text-slate-600 hover:text-slate-900' : 'text-[#8E8E8E] hover:text-[#E0DED7]'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Rate Calculator</span>
            </button>
            <button
              id="matrix-tab-coins"
              onClick={() => setActiveSubTab('coins')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeSubTab === 'coins'
                  ? 'bg-[#C5A059] text-[#0F0F0F] font-bold shadow-sm'
                  : isDay ? 'text-slate-600 hover:text-slate-900' : 'text-[#8E8E8E] hover:text-[#E0DED7]'
              }`}
            >
              Coin Gauges
            </button>
            <button
              id="matrix-tab-markups"
              onClick={() => setActiveSubTab('markups')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeSubTab === 'markups'
                  ? 'bg-[#C5A059] text-[#0F0F0F] font-bold shadow-sm'
                  : isDay ? 'text-slate-600 hover:text-slate-900' : 'text-[#8E8E8E] hover:text-[#E0DED7]'
              }`}
            >
              +25% Markups
            </button>
          </div>
        </div>
      </div>

      {/* 1. Main Pricing Matrix View */}
      {activeSubTab === 'matrix' && (
        <div className="space-y-4">
          {/* Filter Bar & Legend */}
          <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-xl border text-xs ${
            isDay ? 'bg-slate-50 border-slate-200' : 'bg-[#1A1A1A] border-[#2D2D2D]'
          }`}>
            {/* Panel Category Focus Dropdown / Pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`font-mono font-semibold uppercase text-[10px] ${isDay ? 'text-slate-600' : 'text-[#8E8E8E]'}`}>
                Focus View:
              </span>
              <button
                onClick={() => setSelectedPanelFocus('all')}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                  selectedPanelFocus === 'all'
                    ? 'bg-[#C5A059] text-[#0F0F0F]'
                    : isDay ? 'bg-slate-200 text-slate-700' : 'bg-[#141414] text-[#8E8E8E] hover:text-[#E0DED7] border border-[#2D2D2D]'
                }`}
              >
                All Panels (Full Matrix)
              </button>
              {matrixColumns.map(col => (
                <button
                  key={col.key}
                  onClick={() => setSelectedPanelFocus(col.key)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                    selectedPanelFocus === col.key
                      ? 'bg-[#C5A059] text-[#0F0F0F]'
                      : isDay ? 'bg-slate-200 text-slate-700' : 'bg-[#141414] text-[#8E8E8E] hover:text-[#E0DED7] border border-[#2D2D2D]'
                  }`}
                >
                  {col.label}
                </button>
              ))}
            </div>

            {/* Matrix Legend */}
            <div className="flex items-center gap-3 text-[11px] shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-[#C5A059]/20 border border-[#C5A059]"></span>
                <span className={isDay ? 'text-slate-700' : 'text-[#E0DED7]'}>Standard PDR</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-[#FF4E4E]/20 border border-[#FF4E4E]"></span>
                <span className="text-[#FF4E4E] font-medium">Conventional Alert</span>
              </div>
            </div>
          </div>

          {/* Master Table */}
          <div className={`border rounded-xl overflow-x-auto ${
            isDay ? 'border-slate-300 bg-white' : 'border-[#2D2D2D] bg-[#141414]'
          }`}>
            <table className="w-full text-center text-xs border-collapse min-w-[700px]">
              <thead>
                <tr className={`border-b font-mono text-[11px] ${
                  isDay ? 'bg-slate-100 border-slate-300 text-slate-700' : 'bg-[#1A1A1A] border-[#2D2D2D] text-[#8E8E8E]'
                }`}>
                  <th rowSpan={2} className={`py-3 px-3.5 border-r text-left font-bold ${
                    isDay ? 'border-slate-300 text-slate-900 bg-slate-200/60' : 'border-[#2D2D2D] text-[#E0DED7] bg-[#1F1F1F]'
                  }`}>
                    Dent Count
                  </th>
                  {displayedColumns.map(col => {
                    const damagedPanels = getDamagedPanelsForCol(col.panelIds);
                    const isDamaged = damagedPanels.length > 0;

                    return (
                      <th
                        key={col.key}
                        colSpan={4}
                        className={`py-2 px-1 border-r last:border-r-0 font-bold transition-colors ${
                          isDamaged
                            ? 'bg-[#C5A059]/15 text-[#C5A059] border-b-2 border-b-[#C5A059]'
                            : isDay ? 'border-slate-300' : 'border-[#2D2D2D]'
                        }`}
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          <span>{col.label}</span>
                          {isDamaged && (
                            <span className="w-2 h-2 rounded-full bg-[#C5A059] animate-pulse" title="Active damaged panel recorded in estimate" />
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
                <tr className={`border-b text-[10px] font-mono ${
                  isDay ? 'bg-slate-50 border-slate-300 text-slate-600' : 'bg-[#141414]/90 border-[#2D2D2D] text-[#8E8E8E]'
                }`}>
                  {displayedColumns.map(col => (
                    <React.Fragment key={`${col.key}-sub`}>
                      <th className="py-1.5 px-1 font-semibold" title="Dime (17.9mm)">D</th>
                      <th className="py-1.5 px-1 font-semibold" title="Nickel (21.2mm)">N</th>
                      <th className="py-1.5 px-1 font-semibold" title="Quarter (24.3mm)">Q</th>
                      <th className={`py-1.5 px-1 font-semibold border-r last:border-r-0 ${isDay ? 'border-slate-300' : 'border-[#2D2D2D]'}`} title="Half Dollar (30.6mm)">H</th>
                    </React.Fragment>
                  ))}
                </tr>
              </thead>
              <tbody className={`divide-y font-mono text-[11px] ${
                isDay ? 'divide-slate-200' : 'divide-[#2D2D2D]'
              }`}>
                {MATRIX_TIERS.map((tier, rowIdx) => (
                  <tr
                    key={tier.label}
                    className={`transition-colors ${
                      rowIdx % 2 === 0
                        ? isDay ? 'bg-white hover:bg-slate-50' : 'bg-[#141414] hover:bg-[#1C1C1C]'
                        : isDay ? 'bg-slate-50/50 hover:bg-slate-100' : 'bg-[#181818] hover:bg-[#202020]'
                    }`}
                  >
                    <td className={`py-2.5 px-3.5 font-bold text-left border-r whitespace-nowrap ${
                      isDay ? 'border-slate-300 text-slate-900 bg-slate-100/50' : 'border-[#2D2D2D] text-[#E0DED7] bg-[#1A1A1A]'
                    }`}>
                      {tier.label}
                    </td>

                    {displayedColumns.map(col => {
                      const prices = tier[col.key];
                      const warnSizes = tier.traditionalWarning[col.key] || [];
                      const sizeKeys: DentSize[] = ['dime', 'nickel', 'quarter', 'halfDollar'];
                      const activeDamagedPanels = getDamagedPanelsForCol(col.panelIds);

                      return sizeKeys.map((sz, idx) => {
                        const val = prices[idx];
                        const isWarn = warnSizes.includes(sz);
                        const isLastCol = idx === 3;

                        // Check if active estimate matches this tier and coin size
                        const isActiveHit = activeDamagedPanels.some(
                          p => p.damage.dentCount >= tier.min && p.damage.dentCount <= tier.max && p.damage.primaryDentSize === sz
                        );

                        return (
                          <td
                            key={`${col.key}-${sz}`}
                            className={`py-2 px-1 transition-all ${
                              isLastCol ? (isDay ? 'border-r border-slate-300' : 'border-r border-[#2D2D2D] last:border-r-0') : ''
                            } ${
                              isActiveHit
                                ? 'bg-[#C5A059] text-[#0F0F0F] font-extrabold shadow-inner scale-105 rounded'
                                : isWarn
                                ? isDay ? 'bg-red-50 text-red-700 font-semibold' : 'bg-[#FF4E4E]/10 text-[#FF4E4E]'
                                : isDay ? 'text-slate-800' : 'text-[#E0DED7]'
                            }`}
                          >
                            <span className="font-mono">${val}</span>
                          </td>
                        );
                      });
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footnote on Oversize Adders & Conventional Repair Warning */}
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl border text-xs ${
            isDay ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-[#181818] border-[#2D2D2D] text-[#8E8E8E]'
          }`}>
            <div className="space-y-1">
              <div className="font-bold text-[#C5A059] uppercase tracking-wide flex items-center gap-1.5 text-[11px]">
                <Coins className="w-3.5 h-3.5" />
                Oversize Damage Adders (Standard Matrix Rule)
              </div>
              <p className="leading-relaxed text-[11px]">
                Dents that exceed Half Dollar (&gt; 30.6 mm) add <strong className="text-[#C5A059]">+$50.00 each</strong>. Double Oversize (&gt; 45 mm) add <strong className="text-[#C5A059]">+$100.00 each</strong> to the base matrix valuation.
              </p>
            </div>

            <div className="space-y-1">
              <div className="font-bold text-[#FF4E4E] uppercase tracking-wide flex items-center gap-1.5 text-[11px]">
                <AlertTriangle className="w-3.5 h-3.5" />
                Conventional / Paint Repair Threshold
              </div>
              <p className="leading-relaxed text-[11px]">
                Highlighted red matrix tiers represent severe metal stretch thresholds where conventional body repair / replacement should be evaluated if metal grain structure is compromised.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 2. Interactive Rate Calculator */}
      {activeSubTab === 'calculator' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Interactive Input Controls */}
            <div className={`lg:col-span-7 p-5 rounded-xl border space-y-4 ${
              isDay ? 'bg-slate-50 border-slate-200' : 'bg-[#1A1A1A] border-[#2D2D2D]'
            }`}>
              <h3 className="font-serif italic text-lg text-[#C5A059] flex items-center gap-2">
                <Calculator className="w-4 h-4" />
                Live Matrix Rate Simulator
              </h3>
              <p className={`text-xs ${isDay ? 'text-slate-500' : 'text-[#8E8E8E]'}`}>
                Select panel type, dent volume, coin diameter, and condition markups to calculate matrix pricing in real time.
              </p>

              {/* Panel Type Selector */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider block mb-2 text-[#C5A059]">
                  1. Panel Type
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {matrixColumns.map(col => (
                    <button
                      key={col.key}
                      onClick={() => setCalcPanelType(col.key)}
                      className={`p-2.5 rounded-xl text-xs font-semibold text-left border transition-all ${
                        calcPanelType === col.key
                          ? 'bg-[#C5A059] text-[#0F0F0F] border-[#C5A059] font-bold shadow-md'
                          : isDay
                          ? 'bg-white border-slate-300 text-slate-700 hover:border-slate-400'
                          : 'bg-[#141414] border-[#2D2D2D] text-[#8E8E8E] hover:border-[#3D3D3D]'
                      }`}
                    >
                      {col.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Coin Size Picker */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider block mb-2 text-[#C5A059]">
                  2. Primary Coin Size
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(Object.keys(COIN_DIMENSIONS) as DentSize[]).map(sz => {
                    const coin = COIN_DIMENSIONS[sz];
                    return (
                      <button
                        key={sz}
                        onClick={() => setCalcCoinSize(sz)}
                        className={`p-2.5 rounded-xl text-xs font-semibold border flex items-center justify-between transition-all ${
                          calcCoinSize === sz
                            ? 'bg-[#C5A059] text-[#0F0F0F] border-[#C5A059] font-bold shadow-md'
                            : isDay
                            ? 'bg-white border-slate-300 text-slate-700 hover:border-slate-400'
                            : 'bg-[#141414] border-[#2D2D2D] text-[#8E8E8E] hover:border-[#3D3D3D]'
                        }`}
                      >
                        <span>{coin.name}</span>
                        <span className="font-mono text-[10px] opacity-80">&Oslash;{coin.diameterMm}mm</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dent Count & Oversize Stepper */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider block mb-1 text-[#C5A059]">
                    3. Dent Count ({calcDentCount} dents)
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={200}
                    value={calcDentCount}
                    onChange={e => setCalcDentCount(Number(e.target.value))}
                    className="w-full accent-[#C5A059]"
                  />
                  <div className="flex items-center gap-2 mt-2">
                    {[10, 25, 50, 75, 100, 150].map(cnt => (
                      <button
                        key={cnt}
                        onClick={() => setCalcDentCount(cnt)}
                        className={`px-2 py-1 rounded text-[10px] font-mono font-semibold border ${
                          calcDentCount === cnt
                            ? 'bg-[#C5A059] text-[#0F0F0F] border-[#C5A059]'
                            : isDay ? 'bg-white border-slate-300' : 'bg-[#141414] border-[#2D2D2D]'
                        }`}
                      >
                        {cnt}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider block mb-1 text-[#C5A059]">
                    4. Oversize Dents (+ $50/ea)
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCalcOversize(Math.max(0, calcOversize - 1))}
                      className={`w-9 h-9 rounded-lg border font-bold text-lg flex items-center justify-center ${
                        isDay ? 'bg-white border-slate-300' : 'bg-[#141414] border-[#2D2D2D]'
                      }`}
                    >
                      -
                    </button>
                    <span className="font-mono font-bold text-sm px-3 text-[#C5A059]">
                      {calcOversize} O/S
                    </span>
                    <button
                      onClick={() => setCalcOversize(calcOversize + 1)}
                      className={`w-9 h-9 rounded-lg border font-bold text-lg flex items-center justify-center ${
                        isDay ? 'bg-white border-slate-300' : 'bg-[#141414] border-[#2D2D2D]'
                      }`}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* 25% Markups Checkboxes */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider block mb-2 text-[#C5A059]">
                  5. Condition Markups (+25% each)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {MARKUP_DEFINITIONS.map(m => {
                    const isChecked = calcMarkups.includes(m.id);
                    return (
                      <button
                        key={m.id}
                        onClick={() => {
                          setCalcMarkups(prev =>
                            isChecked ? prev.filter(x => x !== m.id) : [...prev, m.id]
                          );
                        }}
                        className={`p-2 rounded-lg text-left text-xs border transition-colors flex items-center justify-between ${
                          isChecked
                            ? 'bg-[#C5A059]/20 border-[#C5A059] text-[#C5A059] font-bold'
                            : isDay
                            ? 'bg-white border-slate-300 text-slate-700'
                            : 'bg-[#141414] border-[#2D2D2D] text-[#8E8E8E]'
                        }`}
                      >
                        <span className="truncate">{m.label}</span>
                        {isChecked && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right: Valuation Result Box */}
            <div className={`lg:col-span-5 p-6 rounded-xl border flex flex-col justify-between space-y-6 ${
              isDay ? 'bg-slate-100 border-slate-300' : 'bg-[#181818] border-[#2D2D2D]'
            }`}>
              <div>
                <div className="text-[10px] uppercase font-mono tracking-widest text-[#8E8E8E] mb-1">
                  Valuation Breakdown
                </div>
                <h4 className="font-serif italic text-xl text-[#C5A059]">
                  Calculated Matrix Price
                </h4>

                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex justify-between border-b pb-2 border-current/10">
                    <span className={isDay ? 'text-slate-600' : 'text-[#8E8E8E]'}>
                      Base Matrix ({calcDentCount} Dents &bull; {COIN_DIMENSIONS[calcCoinSize].name})
                    </span>
                    <span className="font-mono font-bold">${calcBasePrice.toLocaleString()}</span>
                  </div>

                  {calcOversize > 0 && (
                    <div className="flex justify-between border-b pb-2 border-current/10 text-[#FF4E4E]">
                      <span>Oversize Adder ({calcOversize} x $50)</span>
                      <span className="font-mono font-bold">+${calcOversizePrice.toLocaleString()}</span>
                    </div>
                  )}

                  {calcMarkups.length > 0 && (
                    <div className="flex justify-between border-b pb-2 border-current/10 text-[#C5A059]">
                      <span>{calcMarkups.length} Condition Markups (+{calcMarkupPercent}%)</span>
                      <span className="font-mono font-bold">+${calcMarkupDollars.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Total Output */}
              <div className={`p-4 rounded-xl border ${
                isDay ? 'bg-white border-slate-300' : 'bg-[#141414] border-[#2D2D2D]'
              }`}>
                <div className="text-[10px] uppercase font-mono tracking-widest text-[#C5A059] font-bold">
                  Total Valuation
                </div>
                <div className="font-mono font-extrabold text-3xl text-[#C5A059] mt-1">
                  ${calcTotalPrice.toLocaleString()}
                </div>
                <div className={`text-[10px] mt-1 ${isDay ? 'text-slate-500' : 'text-[#8E8E8E]'}`}>
                  Ready to be quoted to client or insurance adjuster
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Coin Dimensions Reference */}
      {activeSubTab === 'coins' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {(Object.keys(COIN_DIMENSIONS) as DentSize[]).map(sz => {
              const coin = COIN_DIMENSIONS[sz];
              return (
                <div
                  key={sz}
                  className={`p-4 rounded-xl border space-y-3 ${
                    isDay ? 'bg-slate-50 border-slate-300' : 'bg-[#1A1A1A] border-[#2D2D2D]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-[#E0DED7]">{coin.name}</span>
                    <span className="w-8 h-8 rounded-full bg-[#141414] border border-[#C5A059]/40 flex items-center justify-center font-serif text-sm font-bold text-[#C5A059]">
                      {coin.symbol}
                    </span>
                  </div>
                  <div className="font-mono text-2xl font-extrabold text-[#C5A059]">
                    {coin.diameterMm} mm
                  </div>
                  <p className={`text-xs ${isDay ? 'text-slate-500' : 'text-[#8E8E8E]'}`}>
                    Standard official US Mint coin calibration diameter for PDR damage assessment.
                  </p>
                </div>
              );
            })}
          </div>

          <div className={`p-4 rounded-xl border flex items-center gap-3 text-xs ${
            isDay ? 'bg-slate-100 border-slate-300' : 'bg-[#181818] border-[#2D2D2D]'
          }`}>
            <Info className="w-5 h-5 text-[#C5A059] shrink-0" />
            <p className={isDay ? 'text-slate-700' : 'text-[#8E8E8E]'}>
              When assessing hail damage under fluorescent or LED PDR inspection lights, classify each dent according to the coin size that completely covers the damage perimeter. Dents exceeding 30.6 mm (Half Dollar) are classified as Oversize.
            </p>
          </div>
        </div>
      )}

      {/* 4. 25% Condition Markups Reference */}
      {activeSubTab === 'markups' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {MARKUP_DEFINITIONS.map(markup => (
            <div
              key={markup.id}
              className={`p-4 rounded-xl border space-y-2 ${
                isDay ? 'bg-slate-50 border-slate-300' : 'bg-[#1A1A1A] border-[#2D2D2D]'
              }`}
            >
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-[#E0DED7]">{markup.label}</h4>
                <span className="text-xs font-mono font-bold text-[#C5A059] bg-[#141414] px-2 py-0.5 rounded-full border border-[#C5A059]/40">
                  +{markup.percentage}%
                </span>
              </div>
              <p className={`text-xs leading-relaxed ${isDay ? 'text-slate-600' : 'text-[#8E8E8E]'}`}>
                {markup.description}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
