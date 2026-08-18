import React from 'react';
import { PanelId, PanelDamage } from '../types';
import { PANEL_CONFIGS, COIN_DIMENSIONS } from '../data/matrix';
import { AlertTriangle, Wrench, Image as ImageIcon, Check, Sparkles } from 'lucide-react';

interface BlueprintDiagramProps {
  panels: Record<PanelId, PanelDamage>;
  selectedPanelId: PanelId | null;
  onSelectPanel: (panelId: PanelId) => void;
  isDay?: boolean;
}

export const BlueprintDiagram: React.FC<BlueprintDiagramProps> = ({
  panels,
  selectedPanelId,
  onSelectPanel,
  isDay = false,
}) => {
  const renderPanelCard = (panelId: PanelId, customClass?: string) => {
    const config = PANEL_CONFIGS[panelId];
    const damage = panels[panelId];
    if (!config || !damage) return null;

    const isSelected = selectedPanelId === panelId;
    const hasDamage = damage.dentCount > 0;
    const selectedRICount = damage.riItems.filter(i => i.selected).length;
    const coinSymbol = COIN_DIMENSIONS[damage.primaryDentSize]?.symbol || 'N';

    return (
      <button
        key={panelId}
        id={`blueprint-panel-${panelId}`}
        onClick={() => onSelectPanel(panelId)}
        className={`group relative text-left p-3.5 rounded-xl transition-all border flex flex-col justify-between ${
          isSelected
            ? isDay ? 'bg-amber-50/80 border-[#C5A059] ring-2 ring-[#C5A059] shadow-md' : 'bg-[#1F1F1F] border-[#C5A059] ring-2 ring-[#C5A059] shadow-lg'
            : hasDamage
            ? damage.requiresTraditionalRepair
              ? isDay ? 'bg-red-50/70 border-red-400 hover:border-red-500' : 'bg-[#1F1F1F] border-[#FF4E4E]/80 hover:border-[#FF4E4E]'
              : isDay ? 'bg-amber-50/40 border-[#C5A059]/70 hover:border-[#C5A059]' : 'bg-[#1F1F1F] border-[#C5A059]/70 hover:border-[#C5A059]'
            : isDay ? 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100/80' : 'bg-[#1F1F1F] border-[#2D2D2D] hover:border-[#3D3D3D]'
        } ${customClass || ''}`}
      >
        {/* Top bar: Panel Name & Status Indicator */}
        <div className="flex items-center justify-between gap-1 w-full">
          <span className={`text-xs font-bold truncate ${isDay ? 'text-slate-900 group-hover:text-amber-900' : 'text-[#E0DED7] group-hover:text-white'}`}>
            {config.shortName}
          </span>

          {hasDamage ? (
            <div className="flex items-center gap-1">
              {damage.requiresTraditionalRepair && (
                <span title="Traditional Repair / Conventional may be required" className="text-[#FF4E4E]">
                  <AlertTriangle className="w-3.5 h-3.5" />
                </span>
              )}
              <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                isDay ? 'text-[#8c6d2c] bg-amber-100/80 border-amber-300' : 'text-[#C5A059] bg-[#141414] border-[#3D3D3D]'
              }`}>
                ${damage.totalCost.toLocaleString()}
              </span>
            </div>
          ) : (
            <span className={`text-[10px] uppercase tracking-widest font-mono ${isDay ? 'text-slate-400' : 'text-[#555]'}`}>Clean</span>
          )}
        </div>

        {/* Middle: Damage notation box mirroring paper worksheet shorthand */}
        <div className={`my-2.5 p-2.5 rounded-lg border flex items-baseline justify-between min-h-[44px] ${
          isDay ? 'bg-white border-slate-200 shadow-xs' : 'bg-[#141414] border-[#2D2D2D]'
        }`}>
          {hasDamage ? (
            <div>
              <div className={`text-base font-extrabold tracking-tight flex items-baseline gap-1 ${
                isDay ? 'text-slate-900' : 'text-[#E0DED7]'
              }`}>
                <span>{damage.dentCount}</span>
                <span className="text-xs text-[#C5A059] font-serif font-bold uppercase">{coinSymbol}</span>
                {damage.oversizeCount > 0 && (
                  <span className="text-xs text-[#FF4E4E] font-mono font-medium ml-1">
                    +{damage.oversizeCount} O/S
                  </span>
                )}
              </div>
              <div className={`text-[10px] truncate max-w-[120px] ${isDay ? 'text-slate-500' : 'text-[#8E8E8E]'}`}>
                {COIN_DIMENSIONS[damage.primaryDentSize]?.name}
              </div>
            </div>
          ) : (
            <div className={`text-xs italic flex items-center gap-1 font-serif ${isDay ? 'text-slate-400' : 'text-[#555]'}`}>
              <span>0 Dents Recorded</span>
            </div>
          )}

          {/* Quick R&I / Photo counts */}
          <div className="flex flex-col items-end gap-1">
            {selectedRICount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded border flex items-center gap-1 font-mono ${
                isDay ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-[#1F1F1F] text-[#E0DED7] border-[#3D3D3D]'
              }`}>
                <Wrench className="w-2.5 h-2.5 text-[#C5A059]" /> {selectedRICount} R&amp;I
              </span>
            )}
            {damage.photos.length > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded border flex items-center gap-1 font-mono ${
                isDay ? 'bg-amber-50 text-amber-900 border-amber-200' : 'bg-[#1F1F1F] text-[#C5A059] border-[#3D3D3D]'
              }`}>
                <ImageIcon className="w-2.5 h-2.5" /> {damage.photos.length}
              </span>
            )}
          </div>
        </div>

        {/* Bottom tags: Markups */}
        <div className="flex items-center gap-1 flex-wrap min-h-[18px]">
          {damage.markups.map(m => (
            <span
              key={m}
              className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border ${
                isDay ? 'bg-amber-50 text-amber-900 border-amber-200' : 'bg-[#141414] text-[#C5A059] border-[#2D2D2D]'
              }`}
            >
              +25%
            </span>
          ))}
          {damage.notes && (
            <span className={`text-[10px] truncate italic ${isDay ? 'text-slate-500' : 'text-[#8E8E8E]'}`}>
              {damage.notes}
            </span>
          )}
        </div>
      </button>
    );
  };

  return (
    <div className={`w-full rounded-2xl p-4 md:p-6 border shadow-xl transition-colors ${
      isDay ? 'bg-white border-slate-200' : 'bg-[#141414] border-[#2D2D2D]'
    }`}>
      <div className={`flex items-center justify-between mb-4 border-b pb-3 ${
        isDay ? 'border-slate-200' : 'border-[#2D2D2D]'
      }`}>
        <div>
          <h3 className="font-serif italic text-2xl tracking-tight text-[#C5A059]">
            Blueprint Schematic
          </h3>
          <p className={`text-[10px] uppercase tracking-widest mt-0.5 ${isDay ? 'text-slate-500' : 'text-[#8E8E8E]'}`}>
            Mirroring physical report worksheet &bull; Click any section to configure dents &amp; R&amp;I operations
          </p>
        </div>
      </div>

      {/* Schematic Grid matching Paper Worksheet */}
      <div className="flex flex-col gap-3">
        {/* ROW 1: FRONT (L Fender | Hood | R Fender) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-3">
            {renderPanelCard('leftFender')}
          </div>
          <div className="md:col-span-6">
            {renderPanelCard('hood')}
          </div>
          <div className="md:col-span-3">
            {renderPanelCard('rightFender')}
          </div>
        </div>

        {/* ROW 2: CENTER ROOF & UPPER CABIN (LF Door | L Rail | Roof | R Rail | RF Door) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-3">
            {renderPanelCard('leftFrontDoor')}
          </div>
          <div className="md:col-span-2">
            {renderPanelCard('leftRoofRail')}
          </div>
          <div className="md:col-span-2">
            {renderPanelCard('roof')}
          </div>
          <div className="md:col-span-2">
            {renderPanelCard('rightRoofRail')}
          </div>
          <div className="md:col-span-3">
            {renderPanelCard('rightFrontDoor')}
          </div>
        </div>

        {/* ROW 3: REAR DOORS & CAB CORNERS (LR Door | Cab Corner L | Cab Corner R | RR Door) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-3">
            {renderPanelCard('leftRearDoor')}
          </div>
          <div className="md:col-span-3">
            {renderPanelCard('cabCornerLeft')}
          </div>
          <div className="md:col-span-3">
            {renderPanelCard('cabCornerRight')}
          </div>
          <div className="md:col-span-3">
            {renderPanelCard('rightRearDoor')}
          </div>
        </div>

        {/* ROW 4: REAR QUARTERS & DECKLID (L Quarter | Decklid / Liftgate | R Quarter) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-3">
            {renderPanelCard('leftQuarter')}
          </div>
          <div className="md:col-span-6">
            {renderPanelCard('decklid')}
          </div>
          <div className="md:col-span-3">
            {renderPanelCard('rightQuarter')}
          </div>
        </div>

        {/* ROW 5: BUMPERS (Front Bumper | Rear Bumper) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-[#2D2D2D]">
          <div>{renderPanelCard('frontBumper')}</div>
          <div>{renderPanelCard('rearBumper')}</div>
        </div>
      </div>
    </div>
  );
};
