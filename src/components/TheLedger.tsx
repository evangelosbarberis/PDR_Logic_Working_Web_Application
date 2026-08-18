import React, { useState } from 'react';
import { Estimate, PanelId } from '../types';
import { PANEL_CONFIGS, COIN_DIMENSIONS, MARKUP_DEFINITIONS } from '../data/matrix';
import { generateEstimatePdf } from '../utils/pdfGenerator';
import { 
  FileSpreadsheet, 
  Printer, 
  Mail, 
  Download, 
  Percent, 
  ChevronRight, 
  AlertTriangle, 
  Wrench, 
  Sparkles, 
  ShieldCheck, 
  Check, 
  HelpCircle,
  FileText
} from 'lucide-react';

interface TheLedgerProps {
  estimate: Estimate;
  onSelectPanel: (panelId: PanelId) => void;
  onUpdateDiscounts: (discounts: Estimate['discounts']) => void;
  onOpenReportModal: () => void;
  onSendEmailPrompt: () => void;
  isDay?: boolean;
}

export const TheLedger: React.FC<TheLedgerProps> = ({
  estimate,
  onSelectPanel,
  onUpdateDiscounts,
  onOpenReportModal,
  onSendEmailPrompt,
  isDay = false,
}) => {
  const [showAdjustments, setShowAdjustments] = useState(false);
  const [cccPercentage, setCccPercentage] = useState(estimate.discounts.cccPercentage || 0);
  const [customDiscount, setCustomDiscount] = useState(estimate.discounts.customDiscountDollars || 0);
  const [taxRate, setTaxRate] = useState(estimate.discounts.taxRate || 0);
  const [deductible, setDeductible] = useState(estimate.discounts.deductible || 0);

  const handleSaveAdjustments = () => {
    onUpdateDiscounts({
      cccPercentage: Number(cccPercentage) || 0,
      customDiscountDollars: Number(customDiscount) || 0,
      taxRate: Number(taxRate) || 0,
      deductible: Number(deductible) || 0,
    });
    setShowAdjustments(false);
  };

  const panelsWithDamage = (Object.keys(estimate.panels) as PanelId[]).filter(
    id => estimate.panels[id].dentCount > 0 || estimate.panels[id].riItems.some(i => i.selected)
  );

  return (
    <div className={`w-full border rounded-2xl p-4 md:p-6 shadow-2xl space-y-6 transition-colors ${
      isDay ? 'bg-white border-slate-200 shadow-md' : 'bg-[#141414] border-[#2D2D2D]'
    }`}>
      {/* Header */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 ${
        isDay ? 'border-slate-200' : 'border-[#2D2D2D]'
      }`}>
        <div>
          <div className="flex items-center gap-3">
            <h2 className="font-serif italic text-2xl tracking-tight text-[#C5A059]">
              The Ledger
            </h2>
            <div className={`h-4 w-[1px] ${isDay ? 'bg-slate-300' : 'bg-[#2D2D2D]'}`}></div>
            <span className={`text-xs font-mono px-2.5 py-0.5 rounded-full border ${
              isDay ? 'text-[#8c6d2c] bg-amber-50 border-amber-200' : 'text-[#C5A059] bg-[#1F1F1F] border-[#3D3D3D]'
            }`}>
              {estimate.roNumber || '#EST-8829-X'}
            </span>
          </div>
          <p className={`text-[10px] uppercase tracking-widest mt-1 ${isDay ? 'text-slate-500' : 'text-[#8E8E8E]'}`}>
            Running Itemized Valuation &bull; D&amp;G Paradigm 2025 Matrix
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="download-pdf-ledger-btn"
            onClick={() => {
              try {
                const { doc, fileName } = generateEstimatePdf(estimate);
                doc.save(fileName);
              } catch (e) {
                console.error(e);
              }
            }}
            className="bg-[#C5A059] hover:bg-[#D4B574] text-[#0F0F0F] font-bold text-xs px-4 py-2 rounded-full uppercase tracking-wider transition-all shadow-md flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            PDF Report
          </button>

          <button
            id="open-report-view-btn"
            onClick={onOpenReportModal}
            className={`font-bold text-xs px-4 py-2 rounded-full border uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              isDay 
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300' 
                : 'bg-[#1F1F1F] hover:bg-[#252525] text-[#E0DED7] hover:text-[#C5A059] border-[#3D3D3D] hover:border-[#C5A059]'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-[#C5A059]" />
            Inspection Sheet
          </button>

          <button
            id="send-email-ledger-btn"
            onClick={onSendEmailPrompt}
            className={`text-xs font-semibold px-4 py-2 rounded-full border transition-colors flex items-center gap-1.5 uppercase tracking-wider ${
              isDay 
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' 
                : 'bg-[#1F1F1F] hover:bg-[#252525] text-[#8E8E8E] hover:text-[#E0DED7] border-[#3D3D3D] hover:border-[#C5A059]'
            }`}
          >
            <Mail className="w-3.5 h-3.5 text-[#C5A059]" />
            Email PDF
          </button>

          <button
            onClick={() => window.print()}
            className={`text-xs font-semibold px-4 py-2 rounded-full border transition-colors flex items-center gap-1.5 uppercase tracking-wider ${
              isDay 
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' 
                : 'bg-[#1F1F1F] hover:bg-[#252525] text-[#8E8E8E] hover:text-[#E0DED7] border-[#3D3D3D] hover:border-[#C5A059]'
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </button>
        </div>
      </div>

      {/* Itemized Panels Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className={`border-b uppercase text-[10px] font-mono tracking-wider ${
              isDay ? 'border-slate-200 text-slate-500' : 'border-[#2D2D2D] text-[#8E8E8E]'
            }`}>
              <th className="py-3 px-3">Panel / Area</th>
              <th className="py-3 px-2 text-center">Dent Count</th>
              <th className="py-3 px-2 text-center">Coin Size</th>
              <th className="py-3 px-2 text-center">O/S (+ $50)</th>
              <th className="py-3 px-2 text-right">Matrix Base</th>
              <th className="py-3 px-2 text-right">Markups</th>
              <th className="py-3 px-2 text-right">R&amp;I Labor</th>
              <th className="py-3 px-3 text-right">Panel Total</th>
              <th className="py-3 px-2 text-center">Action</th>
            </tr>
          </thead>
          <tbody className={isDay ? 'divide-y divide-slate-100' : 'divide-y divide-[#2D2D2D]/60'}>
            {panelsWithDamage.length === 0 ? (
              <tr>
                <td colSpan={9} className={`py-8 text-center italic font-serif ${isDay ? 'text-slate-400' : 'text-[#8E8E8E]'}`}>
                  No panels damaged yet. Select a vehicle panel in the 3D model to record dents.
                </td>
              </tr>
            ) : (
              panelsWithDamage.map(panelId => {
                const damage = estimate.panels[panelId];
                const config = PANEL_CONFIGS[panelId];
                const coin = COIN_DIMENSIONS[damage.primaryDentSize];
                const selectedRICount = damage.riItems.filter(i => i.selected).length;

                return (
                  <tr
                    key={panelId}
                    className={`transition-colors group cursor-pointer ${
                      isDay ? 'hover:bg-slate-50' : 'hover:bg-[#1F1F1F]/60'
                    }`}
                    onClick={() => onSelectPanel(panelId)}
                  >
                    <td className={`py-3 px-3 font-semibold ${isDay ? 'text-slate-900' : 'text-[#E0DED7]'}`}>
                      <div className="flex items-center gap-1.5">
                        <span>{config?.name}</span>
                        {damage.requiresTraditionalRepair && (
                          <span title="May require conventional repair" className="text-[#FF4E4E]">
                            <AlertTriangle className="w-3.5 h-3.5 inline" />
                          </span>
                        )}
                      </div>
                      {damage.notes && (
                        <div className={`text-[10px] font-normal truncate max-w-[140px] ${isDay ? 'text-slate-500' : 'text-[#8E8E8E]'}`}>
                          {damage.notes}
                        </div>
                      )}
                    </td>

                    <td className={`py-3 px-2 text-center font-mono font-bold ${isDay ? 'text-slate-900' : 'text-[#E0DED7]'}`}>
                      {damage.dentCount}
                    </td>

                    <td className="py-3 px-2 text-center">
                      <span className={`px-2 py-0.5 rounded font-serif font-bold text-[11px] border ${
                        isDay ? 'bg-amber-50 text-[#8c6d2c] border-amber-200' : 'bg-[#1F1F1F] text-[#C5A059] border-[#3D3D3D]'
                      }`}>
                        {coin?.symbol} ({coin?.name})
                      </span>
                    </td>

                    <td className="py-3 px-2 text-center font-mono">
                      {damage.oversizeCount > 0 ? (
                        <span className="text-[#FF4E4E] font-bold">
                          +{damage.oversizeCount}
                        </span>
                      ) : (
                        <span className={isDay ? 'text-slate-400' : 'text-[#555]'}>-</span>
                      )}
                    </td>

                    <td className={`py-3 px-2 text-right font-mono ${isDay ? 'text-slate-800' : 'text-[#E0DED7]'}`}>
                      ${damage.baseCost.toLocaleString()}
                    </td>

                    <td className="py-3 px-2 text-right font-mono">
                      {damage.markupCost > 0 ? (
                        <span className="text-[#C5A059] font-medium">
                          +${damage.markupCost.toLocaleString()}
                        </span>
                      ) : (
                        <span className={isDay ? 'text-slate-400' : 'text-[#555]'}>$0</span>
                      )}
                    </td>

                    <td className="py-3 px-2 text-right font-mono">
                      {damage.riCost > 0 ? (
                        <span className={`font-medium ${isDay ? 'text-slate-800' : 'text-[#E0DED7]'}`}>
                          +${damage.riCost.toLocaleString()}
                          <span className={`text-[9px] ml-1 ${isDay ? 'text-slate-500' : 'text-[#8E8E8E]'}`}>
                            ({selectedRICount})
                          </span>
                        </span>
                      ) : (
                        <span className={isDay ? 'text-slate-400' : 'text-[#555]'}>$0</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-extrabold text-[#C5A059] text-sm">
                      ${damage.totalCost.toLocaleString()}
                    </td>

                    <td className="py-3 px-2 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectPanel(panelId);
                        }}
                        className={`text-xs p-1 transition-colors ${
                          isDay ? 'text-slate-400 group-hover:text-[#C5A059]' : 'text-[#8E8E8E] group-hover:text-[#C5A059]'
                        }`}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Financial Summary Calculation Panel */}
      <div className={`rounded-xl p-5 border flex flex-col md:flex-row items-stretch justify-between gap-6 ${
        isDay ? 'bg-slate-50 border-slate-200' : 'bg-[#141414] border-[#2D2D2D]'
      }`}>
        {/* Left: Adjustments */}
        <div className="space-y-3 flex-1">
          <div className="flex items-center justify-between">
            <h4 className={`text-[10px] uppercase tracking-widest font-bold flex items-center gap-1.5 ${
              isDay ? 'text-slate-600' : 'text-[#8E8E8E]'
            }`}>
              <Percent className="w-3.5 h-3.5 text-[#C5A059]" />
              Insurer &amp; Financial Adjustments
            </h4>

            <button
              id="toggle-adjustments-btn"
              onClick={() => setShowAdjustments(!showAdjustments)}
              className="text-xs text-[#C5A059] hover:text-[#D4B574] font-medium"
            >
              {showAdjustments ? 'Hide Adjustments' : 'Edit Adjustments'}
            </button>
          </div>

          {showAdjustments ? (
            <div className={`p-4 rounded-xl border space-y-3 animate-fade-in ${
              isDay ? 'bg-white border-slate-200' : 'bg-[#1F1F1F] border-[#3D3D3D]'
            }`}>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className={`text-[10px] uppercase tracking-widest block mb-1 ${isDay ? 'text-slate-600' : 'text-[#8E8E8E]'}`}>CCC Discount %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="e.g. 50"
                    value={cccPercentage}
                    onChange={e => setCccPercentage(parseFloat(e.target.value) || 0)}
                    className={`w-full border font-mono text-xs px-2.5 py-1.5 rounded focus:outline-none focus:border-[#C5A059] ${
                      isDay ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#141414] border-[#3D3D3D] text-[#E0DED7]'
                    }`}
                  />
                </div>

                <div>
                  <label className={`text-[10px] uppercase tracking-widest block mb-1 ${isDay ? 'text-slate-600' : 'text-[#8E8E8E]'}`}>Custom Disc ($)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={customDiscount}
                    onChange={e => setCustomDiscount(parseFloat(e.target.value) || 0)}
                    className={`w-full border font-mono text-xs px-2.5 py-1.5 rounded focus:outline-none focus:border-[#C5A059] ${
                      isDay ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#141414] border-[#3D3D3D] text-[#E0DED7]'
                    }`}
                  />
                </div>

                <div>
                  <label className={`text-[10px] uppercase tracking-widest block mb-1 ${isDay ? 'text-slate-600' : 'text-[#8E8E8E]'}`}>Sales Tax (%)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.25"
                    placeholder="0"
                    value={taxRate}
                    onChange={e => setTaxRate(parseFloat(e.target.value) || 0)}
                    className={`w-full border font-mono text-xs px-2.5 py-1.5 rounded focus:outline-none focus:border-[#C5A059] ${
                      isDay ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#141414] border-[#3D3D3D] text-[#E0DED7]'
                    }`}
                  />
                </div>

                <div>
                  <label className={`text-[10px] uppercase tracking-widest block mb-1 ${isDay ? 'text-slate-600' : 'text-[#8E8E8E]'}`}>Deductible ($)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={deductible}
                    onChange={e => setDeductible(parseFloat(e.target.value) || 0)}
                    className={`w-full border font-mono text-xs px-2.5 py-1.5 rounded focus:outline-none focus:border-[#C5A059] ${
                      isDay ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#141414] border-[#3D3D3D] text-[#E0DED7]'
                    }`}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  id="apply-adjustments-btn"
                  onClick={handleSaveAdjustments}
                  className="bg-[#C5A059] hover:bg-[#D4B574] text-[#0F0F0F] font-bold text-xs px-4 py-1.5 rounded-full uppercase tracking-wider transition-colors"
                >
                  Apply
                </button>
              </div>
            </div>
          ) : (
            <div className={`flex items-center gap-4 text-xs ${isDay ? 'text-slate-600' : 'text-[#8E8E8E]'}`}>
              <div>
                CCC Rate: <span className={`font-mono ${isDay ? 'text-slate-900' : 'text-[#E0DED7]'}`}>{estimate.discounts.cccPercentage}%</span>
              </div>
              <div>
                Tax: <span className={`font-mono ${isDay ? 'text-slate-900' : 'text-[#E0DED7]'}`}>{estimate.discounts.taxRate}%</span>
              </div>
              <div>
                Deductible: <span className={`font-mono ${isDay ? 'text-slate-900' : 'text-[#E0DED7]'}`}>{estimate.discounts.deductible}</span>
              </div>
              <div>
                Insurer: <span className="font-semibold text-[#C5A059]">{estimate.insuranceCompany || 'USAA'}</span>
              </div>
            </div>
          )}

          {/* Oversize Surcharge Box matching spec */}
          <div className={`mt-3 p-3 border-l-2 border-[#C5A059] rounded-r ${
            isDay ? 'bg-amber-50/70' : 'bg-[#1F1F1F]'
          }`}>
            <div className="text-[10px] text-[#C5A059] font-bold uppercase tracking-widest mb-0.5">
              Oversize Surcharge
            </div>
            <div className={`text-xs ${isDay ? 'text-slate-800' : 'text-[#E0DED7]'}`}>
              + $50.00 / Oversized Dent (&gt; Half Dollar)
            </div>
          </div>
        </div>

        {/* Right: Subtotal & Est. Total Box */}
        <div className={`w-full md:w-80 p-5 rounded-xl border space-y-2.5 shrink-0 ${
          isDay ? 'bg-white border-slate-200 shadow-md' : 'bg-[#1F1F1F] border-[#3D3D3D]'
        }`}>
          <div className={`flex justify-between text-xs ${isDay ? 'text-slate-600' : 'text-[#8E8E8E]'}`}>
            <span>Matrix Base Subtotal</span>
            <span className={`font-mono ${isDay ? 'text-slate-900' : 'text-[#E0DED7]'}`}>${estimate.summary.matrixBaseTotal.toLocaleString()}</span>
          </div>

          {estimate.summary.oversizeTotal > 0 && (
            <div className={`flex justify-between text-xs ${isDay ? 'text-slate-600' : 'text-[#8E8E8E]'}`}>
              <span>Oversize Dents Upcharge</span>
              <span className="font-mono text-[#FF4E4E]">+${estimate.summary.oversizeTotal.toLocaleString()}</span>
            </div>
          )}

          {estimate.summary.markupsTotal > 0 && (
            <div className={`flex justify-between text-xs ${isDay ? 'text-slate-600' : 'text-[#8E8E8E]'}`}>
              <span>25% Condition Markups</span>
              <span className="font-mono text-[#C5A059]">+${estimate.summary.markupsTotal.toLocaleString()}</span>
            </div>
          )}

          {estimate.summary.riLaborTotal > 0 && (
            <div className={`flex justify-between text-xs ${isDay ? 'text-slate-600' : 'text-[#8E8E8E]'}`}>
              <span>R&amp;I Labor Operations</span>
              <span className={`font-mono ${isDay ? 'text-slate-900' : 'text-[#E0DED7]'}`}>+${estimate.summary.riLaborTotal.toLocaleString()}</span>
            </div>
          )}

          <div className={`border-t pt-2 flex justify-between text-xs font-semibold ${
            isDay ? 'border-slate-200 text-slate-900' : 'border-[#2D2D2D] text-[#E0DED7]'
          }`}>
            <span>Gross Repair Subtotal</span>
            <span className="font-mono">${estimate.summary.subtotal.toLocaleString()}</span>
          </div>

          {estimate.summary.discountTotal > 0 && (
            <div className="flex justify-between text-xs text-emerald-600 font-medium">
              <span>Adjustments / Discounts</span>
              <span className="font-mono">-${estimate.summary.discountTotal.toLocaleString()}</span>
            </div>
          )}

          {estimate.summary.taxTotal > 0 && (
            <div className={`flex justify-between text-xs ${isDay ? 'text-slate-600' : 'text-[#8E8E8E]'}`}>
              <span>Sales Tax</span>
              <span className={`font-mono ${isDay ? 'text-slate-900' : 'text-[#E0DED7]'}`}>+${estimate.summary.taxTotal.toLocaleString()}</span>
            </div>
          )}

          {estimate.discounts.deductible > 0 && (
            <div className={`flex justify-between text-xs ${isDay ? 'text-slate-600' : 'text-[#8E8E8E]'}`}>
              <span>Customer Deductible</span>
              <span className="font-mono text-[#C5A059]">-${estimate.discounts.deductible.toLocaleString()}</span>
            </div>
          )}

          <div className={`border-t pt-4 mt-2 ${isDay ? 'border-slate-200' : 'border-[#2D2D2D]'}`}>
            <div className="flex justify-between items-end mb-4">
              <span className={`text-[10px] uppercase tracking-widest ${isDay ? 'text-slate-500' : 'text-[#8E8E8E]'}`}>Est. Total</span>
              <span className="text-3xl font-serif text-[#C5A059] font-bold">
                ${estimate.summary.grandTotal.toLocaleString()}
              </span>
            </div>

            <button
              onClick={onOpenReportModal}
              className="w-full bg-[#C5A059] text-[#0F0F0F] font-bold py-3 rounded hover:bg-[#D4B574] transition-colors uppercase tracking-widest text-xs shadow-md"
            >
              Generate Final Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
