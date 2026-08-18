import React, { useState } from 'react';
import { MATRIX_TIERS, COIN_DIMENSIONS, MARKUP_DEFINITIONS, OVERSIZE_PRICING } from '../data/matrix';
import { MatrixPanelType, DentSize } from '../types';
import { X, Table, AlertTriangle, Coins, Layers, Info } from 'lucide-react';

interface MatrixViewerModalProps {
  onClose: () => void;
}

export const MatrixViewerModal: React.FC<MatrixViewerModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'matrix' | 'coins' | 'markups'>('matrix');

  const matrixColumns: { key: MatrixPanelType; label: string }[] = [
    { key: 'roof', label: 'Roof' },
    { key: 'hood', label: 'Hood' },
    { key: 'decklid', label: 'Decklid' },
    { key: 'fender', label: 'Fender' },
    { key: 'roofRail', label: 'Roof Rail' },
    { key: 'door', label: 'Door' },
    { key: 'quarterPanel', label: 'Quarter' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F0F0F]/85 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-6xl bg-[#141414] border border-[#2D2D2D] rounded-2xl shadow-2xl overflow-hidden flex flex-col my-8 max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#141414] border-b border-[#2D2D2D] flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#1F1F1F] border border-[#3D3D3D] flex items-center justify-center text-[#C5A059]">
              <Table className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#E0DED7] font-serif flex items-center gap-2">
                D&amp;G Paradigm 2025 PDR Valuation Analysis
                <span className="text-[9px] bg-[#1F1F1F] text-[#C5A059] border border-[#3D3D3D] px-2.5 py-0.5 rounded-full font-mono uppercase tracking-wider">
                  Official Standard
                </span>
              </h2>
              <p className="text-xs text-[#8E8E8E]">
                Industry benchmark matrix for hail dent counts, coin sizing, and condition markups.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center bg-[#1F1F1F] p-1 rounded-full border border-[#2D2D2D]">
              <button
                onClick={() => setActiveTab('matrix')}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  activeTab === 'matrix'
                    ? 'bg-[#C5A059] text-[#0F0F0F] font-bold'
                    : 'text-[#8E8E8E] hover:text-[#E0DED7]'
                }`}
              >
                Pricing Matrix
              </button>
              <button
                onClick={() => setActiveTab('coins')}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  activeTab === 'coins'
                    ? 'bg-[#C5A059] text-[#0F0F0F] font-bold'
                    : 'text-[#8E8E8E] hover:text-[#E0DED7]'
                }`}
              >
                Coin Sizing
              </button>
              <button
                onClick={() => setActiveTab('markups')}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  activeTab === 'markups'
                    ? 'bg-[#C5A059] text-[#0F0F0F] font-bold'
                    : 'text-[#8E8E8E] hover:text-[#E0DED7]'
                }`}
              >
                25% Markups
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-[#8E8E8E] hover:text-[#E0DED7] hover:bg-[#1F1F1F] rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-[#141414]">
          {activeTab === 'matrix' && (
            <div className="space-y-4">
              {/* Legend */}
              <div className="flex flex-wrap items-center gap-4 bg-[#1F1F1F] p-3 rounded-xl border border-[#2D2D2D] text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded bg-[#C5A059]/20 border border-[#C5A059]"></span>
                  <span className="text-[#E0DED7]">Standard PDR Pricing</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded bg-[#C5A059]/30 border border-[#C5A059]"></span>
                  <span className="text-[#C5A059] font-semibold">Highlighted: May Require Traditional Repair</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded bg-[#FF4E4E]/20 border border-[#FF4E4E]"></span>
                  <span className="text-[#FF4E4E]">Outside Standard Matrix (Custom / Conventional)</span>
                </div>
              </div>

              {/* Full Matrix Table */}
              <div className="border border-[#2D2D2D] rounded-xl overflow-x-auto bg-[#1F1F1F]">
                <table className="w-full text-center text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#141414] border-b border-[#2D2D2D] text-[#8E8E8E] font-mono text-[11px]">
                      <th rowSpan={2} className="py-3 px-3 border-r border-[#2D2D2D] text-left text-[#E0DED7]">
                        Dent Count
                      </th>
                      {matrixColumns.map(col => (
                        <th key={col.key} colSpan={4} className="py-2 px-1 border-r border-[#2D2D2D] last:border-r-0">
                          {col.label}
                        </th>
                      ))}
                    </tr>
                    <tr className="bg-[#141414]/60 border-b border-[#2D2D2D] text-[10px] text-[#8E8E8E] font-mono">
                      {matrixColumns.map(col => (
                        <React.Fragment key={`${col.key}-sub`}>
                          <th className="py-1 px-1">D</th>
                          <th className="py-1 px-1">N</th>
                          <th className="py-1 px-1">Q</th>
                          <th className="py-1 px-1 border-r border-[#2D2D2D] last:border-r-0">H</th>
                        </React.Fragment>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2D2D2D] font-mono text-[11px]">
                    {MATRIX_TIERS.map(tier => (
                      <tr key={tier.label} className="hover:bg-[#141414]/50">
                        <td className="py-2.5 px-3 font-semibold text-[#E0DED7] text-left border-r border-[#2D2D2D] bg-[#141414]/80 whitespace-nowrap">
                          {tier.label}
                        </td>
                        {matrixColumns.map(col => {
                          const prices = tier[col.key];
                          const warnSizes = tier.traditionalWarning[col.key] || [];
                          const sizeKeys: DentSize[] = ['dime', 'nickel', 'quarter', 'halfDollar'];

                          return sizeKeys.map((sz, idx) => {
                            const val = prices[idx];
                            const isWarn = warnSizes.includes(sz);
                            const isLastCol = idx === 3;

                            return (
                              <td
                                key={`${tier.label}-${col.key}-${sz}`}
                                className={`py-2 px-1 ${
                                  isLastCol ? 'border-r border-[#2D2D2D]' : ''
                                } ${
                                  isWarn
                                    ? 'bg-[#C5A059]/20 text-[#C5A059] font-bold border border-[#C5A059]/40'
                                    : 'text-[#E0DED7]'
                                }`}
                              >
                                {val ? `$${val}` : '-'}
                              </td>
                            );
                          });
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'coins' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {(Object.keys(COIN_DIMENSIONS) as DentSize[]).map(key => {
                const coin = COIN_DIMENSIONS[key];
                return (
                  <div
                    key={key}
                    className="bg-[#1F1F1F] p-5 rounded-xl border border-[#2D2D2D] text-center space-y-3 flex flex-col items-center justify-center"
                  >
                    <div
                      className="rounded-full bg-[#141414] border-2 border-[#C5A059] flex items-center justify-center text-[#C5A059] font-bold font-serif shadow-lg"
                      style={{
                        width: `${coin.diameterMm * 2.6}px`,
                        height: `${coin.diameterMm * 2.6}px`,
                      }}
                    >
                      {coin.symbol}
                    </div>
                    <div>
                      <div className="font-bold text-[#E0DED7] text-base">{coin.name}</div>
                      <div className="text-xs text-[#C5A059] font-mono">
                        Ø {coin.diameterMm} mm
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'markups' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {MARKUP_DEFINITIONS.map(m => (
                <div
                  key={m.id}
                  className="bg-[#1F1F1F] p-4 rounded-xl border border-[#2D2D2D] space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-[#E0DED7]">{m.label}</span>
                    <span className="text-xs bg-[#C5A059] text-[#0F0F0F] font-bold px-2.5 py-0.5 rounded-full font-mono">
                      +25%
                    </span>
                  </div>
                  <p className="text-xs text-[#8E8E8E]">{m.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
