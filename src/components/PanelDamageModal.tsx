import React, { useState, useEffect, useRef } from 'react';
import { PanelId, PanelDamage, DentSize, MarkupType, RIItem, PanelPhoto } from '../types';
import { 
  PANEL_CONFIGS, 
  COIN_DIMENSIONS, 
  MARKUP_DEFINITIONS, 
  OVERSIZE_PRICING,
  calculateMatrixBase,
  parseShorthandDamage 
} from '../data/matrix';
import { 
  X, 
  Plus, 
  Minus, 
  Upload, 
  Camera, 
  Trash2, 
  AlertTriangle, 
  Wrench, 
  Layers, 
  Sparkles, 
  Coins, 
  DollarSign, 
  Check, 
  HelpCircle,
  Clock
} from 'lucide-react';

interface PanelDamageModalProps {
  panelId: PanelId;
  initialDamage: PanelDamage;
  hourlyRIRate: number;
  onSave: (updatedDamage: PanelDamage) => void;
  onClose: () => void;
}

export const PanelDamageModal: React.FC<PanelDamageModalProps> = ({
  panelId,
  initialDamage,
  hourlyRIRate,
  onSave,
  onClose,
}) => {
  const config = PANEL_CONFIGS[panelId];
  const [dentCount, setDentCount] = useState(initialDamage.dentCount);
  const [primaryDentSize, setPrimaryDentSize] = useState<DentSize>(initialDamage.primaryDentSize || 'nickel');
  const [oversizeCount, setOversizeCount] = useState(initialDamage.oversizeCount || 0);
  const [doubleOversizeCount, setDoubleOversizeCount] = useState(initialDamage.doubleOversizeCount || 0);
  const [markups, setMarkups] = useState<MarkupType[]>(initialDamage.markups || []);
  const [riItems, setRiItems] = useState<RIItem[]>(initialDamage.riItems || []);
  const [photos, setPhotos] = useState<PanelPhoto[]>(initialDamage.photos || []);
  const [notes, setNotes] = useState(initialDamage.notes || '');
  const [shorthandInput, setShorthandInput] = useState(initialDamage.customDentCountText || '');
  
  // New R&I Item state
  const [showAddRI, setShowAddRI] = useState(false);
  const [newRIName, setNewRIName] = useState('');
  const [newRIHours, setNewRIHours] = useState(0.5);
  const [newRIType, setNewRIType] = useState<'R&I' | 'R&R'>('R&I');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse shorthand when typed
  const handleApplyShorthand = () => {
    const parsed = parseShorthandDamage(shorthandInput);
    if (parsed) {
      setDentCount(parsed.dentCount);
      setPrimaryDentSize(parsed.size);
      setOversizeCount(parsed.oversizeCount);
    }
  };

  // Toggle markup
  const handleToggleMarkup = (markupId: MarkupType) => {
    setMarkups(prev =>
      prev.includes(markupId) ? prev.filter(m => m !== markupId) : [...prev, markupId]
    );
  };

  // Toggle RI item
  const handleToggleRI = (riId: string) => {
    setRiItems(prev =>
      prev.map(item => (item.id === riId ? { ...item, selected: !item.selected } : item))
    );
  };

  const handleUpdateRIHours = (riId: string, hours: number) => {
    setRiItems(prev =>
      prev.map(item => (item.id === riId ? { ...item, hours: Math.max(0.1, hours) } : item))
    );
  };

  const handleAddCustomRI = () => {
    if (!newRIName.trim()) return;
    const newItem: RIItem = {
      id: `${panelId}-custom-${Date.now()}`,
      name: newRIName.trim(),
      selected: true,
      type: newRIType,
      hours: Number(newRIHours) || 0.5,
      rate: hourlyRIRate,
    };
    setRiItems(prev => [...prev, newItem]);
    setNewRIName('');
    setNewRIHours(0.5);
    setShowAddRI(false);
  };

  // Photo upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = event => {
        if (event.target?.result) {
          const newPhoto: PanelPhoto = {
            id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            url: event.target.result as string,
            caption: `${config?.name} Hail Damage Photo`,
            timestamp: new Date().toLocaleTimeString(),
          };
          setPhotos(prev => [...prev, newPhoto]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemovePhoto = (id: string) => {
    setPhotos(prev => prev.filter(p => p.id !== id));
  };

  // Dynamic calculations
  const { baseCost, requiresTraditional, tierLabel } = calculateMatrixBase(
    config?.matrixType || 'hood',
    dentCount,
    primaryDentSize
  );

  const oversizeCost = 
    oversizeCount * OVERSIZE_PRICING.halfDollarPlus +
    doubleOversizeCount * OVERSIZE_PRICING.doubleOversize;

  const totalMarkupPercentage = markups.reduce((acc, m) => {
    const def = MARKUP_DEFINITIONS.find(d => d.id === m);
    return acc + (def?.percentage || 25);
  }, 0);

  const subtotalBeforeMarkup = baseCost + oversizeCost;
  const markupCost = Math.round((subtotalBeforeMarkup * totalMarkupPercentage) / 100);

  const riCost = riItems
    .filter(i => i.selected)
    .reduce((acc, i) => acc + (i.hours * (i.rate || hourlyRIRate)), 0);

  const totalCost = baseCost + oversizeCost + markupCost + riCost;

  const handleSaveAndClose = () => {
    const updated: PanelDamage = {
      ...initialDamage,
      panelId,
      dentCount,
      primaryDentSize,
      oversizeCount,
      doubleOversizeCount,
      customDentCountText: shorthandInput.trim() || `${dentCount}${COIN_DIMENSIONS[primaryDentSize].symbol}${oversizeCount ? ` ${oversizeCount}OS` : ''}`,
      markups,
      riItems,
      photos,
      notes,
      requiresTraditionalRepair: requiresTraditional,
      baseCost,
      oversizeCost,
      markupCost,
      riCost,
      totalCost,
    };
    onSave(updated);
  };

  const QUICK_DENT_PRESETS = [0, 3, 6, 12, 25, 36, 56, 75, 100, 136, 200];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F0F0F]/80 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-4xl bg-[#141414] border border-[#2D2D2D] rounded-2xl shadow-2xl overflow-hidden flex flex-col my-8 max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#141414] border-b border-[#2D2D2D] flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#1F1F1F] border border-[#3D3D3D] flex items-center justify-center text-[#C5A059] font-serif font-bold text-lg">
              {config?.shortName.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[#E0DED7] font-serif">{config?.name}</h2>
                <span className="text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#1F1F1F] text-[#8E8E8E] border border-[#2D2D2D]">
                  Matrix: {config?.matrixType}
                </span>
                {requiresTraditional && (
                  <span className="text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#1F1F1F] text-[#FF4E4E] border border-[#FF4E4E]/50 flex items-center gap-1 font-semibold">
                    <AlertTriangle className="w-3 h-3" /> Traditional Repair Flag
                  </span>
                )}
              </div>
              <p className="text-xs text-[#8E8E8E]">
                PDR Valuation Tier: <span className="text-[#C5A059] font-semibold">{tierLabel}</span>
              </p>
            </div>
          </div>

          <button
            id="close-panel-modal-btn"
            onClick={onClose}
            className="p-2 text-[#8E8E8E] hover:text-[#E0DED7] hover:bg-[#1F1F1F] rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-[#141414]">
          {/* Top Banner: Quick Shorthand Parser */}
          <div className="bg-[#1F1F1F] p-4 rounded-xl border border-[#2D2D2D] flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="w-full sm:w-auto">
              <label className="text-xs font-semibold text-[#E0DED7] flex items-center gap-1.5 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
                Worksheet Shorthand Parser
              </label>
              <div className="text-[11px] text-[#8E8E8E]">
                Enter fast notation like <code className="bg-[#141414] px-1.5 py-0.5 rounded text-[#C5A059] border border-[#2D2D2D]">136N 21OS</code>, <code className="bg-[#141414] px-1.5 py-0.5 rounded text-[#C5A059] border border-[#2D2D2D]">56Q 4S</code>, <code className="bg-[#141414] px-1.5 py-0.5 rounded text-[#C5A059] border border-[#2D2D2D]">8N 1/S</code>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                id="shorthand-input-field"
                type="text"
                placeholder="e.g. 136N 21 O/S"
                value={shorthandInput}
                onChange={e => setShorthandInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleApplyShorthand()}
                className="bg-[#141414] border border-[#3D3D3D] text-[#E0DED7] font-mono text-sm px-3.5 py-2 rounded-full focus:outline-none focus:border-[#C5A059] w-full sm:w-44 uppercase placeholder-[#555]"
              />
              <button
                id="apply-shorthand-btn"
                onClick={handleApplyShorthand}
                className="bg-[#C5A059] hover:bg-[#b59049] text-[#0F0F0F] font-bold text-xs px-4 py-2 rounded-full transition-colors whitespace-nowrap shadow-md"
              >
                Apply
              </button>
            </div>
          </div>

          {/* Section 1: Dent Count & Coin Sizing */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Left: Coin Sizing */}
            <div className="md:col-span-6 bg-[#1F1F1F] p-4 rounded-xl border border-[#2D2D2D] space-y-3">
              <label className="text-xs font-bold text-[#E0DED7] uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-[#C5A059]" />
                  1. Primary Dent Size
                </span>
                <span className="text-[10px] text-[#8E8E8E] font-mono">
                  (US Coin Spec)
                </span>
              </label>

              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(COIN_DIMENSIONS) as DentSize[]).map(sizeKey => {
                  const coin = COIN_DIMENSIONS[sizeKey];
                  const isSelected = primaryDentSize === sizeKey;
                  return (
                    <button
                      key={sizeKey}
                      id={`coin-size-${sizeKey}`}
                      onClick={() => setPrimaryDentSize(sizeKey)}
                      className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'bg-[#141414] border-[#C5A059] text-[#E0DED7] ring-1 ring-[#C5A059]'
                          : 'bg-[#141414] border-[#2D2D2D] text-[#8E8E8E] hover:border-[#3D3D3D]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-[#E0DED7]">{coin.name}</span>
                        <span className="w-6 h-6 rounded-full bg-[#1F1F1F] flex items-center justify-center font-serif text-xs font-bold text-[#C5A059] border border-[#3D3D3D]">
                          {coin.symbol}
                        </span>
                      </div>
                      <div className="text-xs text-[#8E8E8E] font-mono mt-2">
                        &Oslash; {coin.diameterMm} mm
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right: Dent Quantity Stepper & Presets */}
            <div className="md:col-span-6 bg-[#1F1F1F] p-4 rounded-xl border border-[#2D2D2D] space-y-3">
              <label className="text-xs font-bold text-[#E0DED7] uppercase tracking-wider flex items-center justify-between">
                <span>2. Total Dent Count</span>
                <span className="text-[#C5A059] font-mono font-bold text-sm">
                  {dentCount} Dents
                </span>
              </label>

              {/* Main Stepper */}
              <div className="flex items-center justify-between bg-[#141414] p-2 rounded-xl border border-[#2D2D2D]">
                <button
                  id="dent-decrement-btn"
                  onClick={() => setDentCount(Math.max(0, dentCount - 1))}
                  className="w-10 h-10 rounded-lg bg-[#1F1F1F] hover:bg-[#2D2D2D] text-[#E0DED7] flex items-center justify-center transition-colors border border-[#3D3D3D]"
                >
                  <Minus className="w-5 h-5" />
                </button>

                <input
                  id="dent-count-number-input"
                  type="number"
                  min="0"
                  max="600"
                  value={dentCount}
                  onChange={e => setDentCount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-24 text-center text-2xl font-mono font-extrabold text-[#E0DED7] bg-transparent focus:outline-none"
                />

                <button
                  id="dent-increment-btn"
                  onClick={() => setDentCount(dentCount + 1)}
                  className="w-10 h-10 rounded-lg bg-[#1F1F1F] hover:bg-[#2D2D2D] text-[#E0DED7] flex items-center justify-center transition-colors border border-[#3D3D3D]"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                {QUICK_DENT_PRESETS.map(preset => (
                  <button
                    key={preset}
                    id={`quick-preset-${preset}`}
                    onClick={() => setDentCount(preset)}
                    className={`px-2.5 py-1 text-xs font-mono rounded-lg transition-colors ${
                      dentCount === preset
                        ? 'bg-[#C5A059] text-[#0F0F0F] font-bold'
                        : 'bg-[#141414] text-[#8E8E8E] hover:bg-[#2D2D2D] hover:text-[#E0DED7] border border-[#2D2D2D]'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Oversized Dents (> Half Dollar) */}
          <div className="bg-[#1F1F1F] p-4 rounded-xl border border-[#2D2D2D] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div>
                <h4 className="text-xs font-bold text-[#E0DED7] uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-[#FF4E4E]" />
                  3. Oversized Dent Upcharges
                </h4>
                <p className="text-[11px] text-[#8E8E8E]">
                  Dents included in normal count exceeding Half Dollar (&gt; 30.61mm).
                </p>
              </div>
              <span className="text-xs font-mono text-[#FF4E4E] font-bold">
                +${oversizeCost.toLocaleString()} Upcharge
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* Exceeds Half Dollar (+$50) */}
              <div className="bg-[#141414] p-3 rounded-xl border border-[#2D2D2D] flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-[#E0DED7]">
                    Exceeds Half Dollar
                  </div>
                  <div className="text-[11px] text-[#8E8E8E]">
                    +$50 per dent (O/S)
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setOversizeCount(Math.max(0, oversizeCount - 1))}
                    className="w-8 h-8 rounded-lg bg-[#1F1F1F] hover:bg-[#2D2D2D] text-[#E0DED7] flex items-center justify-center text-xs border border-[#3D3D3D]"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center font-mono font-bold text-[#E0DED7] text-sm">
                    {oversizeCount}
                  </span>
                  <button
                    onClick={() => setOversizeCount(oversizeCount + 1)}
                    className="w-8 h-8 rounded-lg bg-[#1F1F1F] hover:bg-[#2D2D2D] text-[#E0DED7] flex items-center justify-center text-xs border border-[#3D3D3D]"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Double Oversize (+$100) */}
              <div className="bg-[#141414] p-3 rounded-xl border border-[#2D2D2D] flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-[#E0DED7]">
                    Double Oversize
                  </div>
                  <div className="text-[11px] text-[#8E8E8E]">
                    +$100 per dent (2x O/S)
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setDoubleOversizeCount(Math.max(0, doubleOversizeCount - 1))}
                    className="w-8 h-8 rounded-lg bg-[#1F1F1F] hover:bg-[#2D2D2D] text-[#E0DED7] flex items-center justify-center text-xs border border-[#3D3D3D]"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center font-mono font-bold text-[#E0DED7] text-sm">
                    {doubleOversizeCount}
                  </span>
                  <button
                    onClick={() => setDoubleOversizeCount(doubleOversizeCount + 1)}
                    className="w-8 h-8 rounded-lg bg-[#1F1F1F] hover:bg-[#2D2D2D] text-[#E0DED7] flex items-center justify-center text-xs border border-[#3D3D3D]"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: 25% Condition Markups */}
          <div className="bg-[#1F1F1F] p-4 rounded-xl border border-[#2D2D2D] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-[#E0DED7] uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[#C5A059]" />
                  4. 25% Condition Markups (Stackable)
                </h4>
                <p className="text-[11px] text-[#8E8E8E]">
                  Multiple markups apply per panel (e.g. Aluminum + Glue Pull = +50%).
                </p>
              </div>
              <span className="text-xs font-mono text-[#C5A059] font-bold">
                +{totalMarkupPercentage}% (+${markupCost.toLocaleString()})
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {MARKUP_DEFINITIONS.map(markup => {
                const isChecked = markups.includes(markup.id);
                return (
                  <button
                    key={markup.id}
                    id={`markup-btn-${markup.id}`}
                    onClick={() => handleToggleMarkup(markup.id)}
                    className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                      isChecked
                        ? 'bg-[#141414] border-[#C5A059] text-[#E0DED7] ring-1 ring-[#C5A059]'
                        : 'bg-[#141414] border-[#2D2D2D] text-[#8E8E8E] hover:border-[#3D3D3D]'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center border transition-colors ${
                        isChecked
                          ? 'bg-[#C5A059] border-[#C5A059] text-[#0F0F0F]'
                          : 'border-[#3D3D3D] bg-[#1F1F1F]'
                      }`}
                    >
                      {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#E0DED7] flex items-center gap-1">
                        <span>{markup.label}</span>
                        <span className="text-[10px] text-[#C5A059] font-mono">+25%</span>
                      </div>
                      <div className="text-[10px] text-[#8E8E8E] mt-0.5 leading-tight">
                        {markup.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 4: R&I / R&R Operations */}
          <div className="bg-[#1F1F1F] p-4 rounded-xl border border-[#2D2D2D] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-[#E0DED7] uppercase tracking-wider flex items-center gap-1.5">
                  <Wrench className="w-4 h-4 text-[#C5A059]" />
                  5. R&amp;I / R&amp;R Operations
                </h4>
                <p className="text-[11px] text-[#8E8E8E]">
                  Labor rate @ ${hourlyRIRate}/hr. Remove &amp; Install or Replace parts for access.
                </p>
              </div>
              <span className="text-xs font-mono text-[#C5A059] font-bold">
                ${riCost.toLocaleString()} Labor
              </span>
            </div>

            <div className="space-y-2">
              {riItems.map(item => (
                <div
                  key={item.id}
                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                    item.selected
                      ? 'bg-[#141414] border-[#C5A059]/60 text-[#E0DED7]'
                      : 'bg-[#141414] border-[#2D2D2D] text-[#8E8E8E]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => handleToggleRI(item.id)}
                      className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                        item.selected
                          ? 'bg-[#C5A059] border-[#C5A059] text-[#0F0F0F]'
                          : 'border-[#3D3D3D] bg-[#1F1F1F]'
                      }`}
                    >
                      {item.selected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>
                    <div>
                      <span className="text-xs font-medium text-[#E0DED7]">{item.name}</span>
                      <span className="text-[10px] ml-2 px-1.5 py-0.5 rounded bg-[#1F1F1F] text-[#8E8E8E] border border-[#2D2D2D] font-mono">
                        {item.type}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 bg-[#1F1F1F] px-2 py-1 rounded-lg border border-[#2D2D2D]">
                      <Clock className="w-3 h-3 text-[#8E8E8E]" />
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={item.hours}
                        onChange={e => handleUpdateRIHours(item.id, parseFloat(e.target.value) || 0.1)}
                        className="w-12 text-right bg-transparent text-xs font-mono text-[#E0DED7] focus:outline-none"
                      />
                      <span className="text-[10px] text-[#8E8E8E] font-mono">hrs</span>
                    </div>

                    <span className="text-xs font-mono text-[#C5A059] w-16 text-right font-semibold">
                      ${(item.hours * (item.rate || hourlyRIRate)).toFixed(0)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Custom R&I Line */}
            {showAddRI ? (
              <div className="bg-[#141414] p-3 rounded-xl border border-[#C5A059]/40 space-y-2 mt-2">
                <div className="text-xs font-bold text-[#C5A059]">Add Custom R&amp;I Operation</div>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <input
                    type="text"
                    placeholder="Operation Name (e.g. Flare R&R, Pillar Wrap)"
                    value={newRIName}
                    onChange={e => setNewRIName(e.target.value)}
                    className="sm:col-span-6 bg-[#1F1F1F] border border-[#3D3D3D] text-xs text-[#E0DED7] px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-[#C5A059]"
                  />
                  <select
                    value={newRIType}
                    onChange={e => setNewRIType(e.target.value as any)}
                    className="sm:col-span-2 bg-[#1F1F1F] border border-[#3D3D3D] text-xs text-[#E0DED7] px-2 py-1.5 rounded-lg"
                  >
                    <option value="R&I">R&amp;I</option>
                    <option value="R&R">R&amp;R</option>
                  </select>
                  <input
                    type="number"
                    step="0.1"
                    value={newRIHours}
                    onChange={e => setNewRIHours(parseFloat(e.target.value) || 0.5)}
                    className="sm:col-span-2 bg-[#1F1F1F] border border-[#3D3D3D] text-xs text-[#E0DED7] px-2 py-1.5 rounded-lg font-mono text-center"
                  />
                  <button
                    onClick={handleAddCustomRI}
                    className="sm:col-span-2 bg-[#C5A059] hover:bg-[#b59049] text-[#0F0F0F] font-bold text-xs rounded-lg py-1.5 transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddRI(true)}
                className="text-xs text-[#C5A059] hover:text-[#b59049] flex items-center gap-1 font-medium pt-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Custom R&amp;I Line
              </button>
            )}
          </div>

          {/* Section 5: Panel Photos */}
          <div className="bg-[#1F1F1F] p-4 rounded-xl border border-[#2D2D2D] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-[#E0DED7] uppercase tracking-wider flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-[#C5A059]" />
                  6. Panel Damage Photos
                </h4>
                <p className="text-[11px] text-[#8E8E8E]">
                  Attach close-up dent reflection board photos for insurance claims.
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handlePhotoUpload}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-[#C5A059] hover:bg-[#b59049] text-[#0F0F0F] text-xs font-semibold px-3.5 py-1.5 rounded-full flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Upload className="w-3.5 h-3.5" /> Upload Photo
              </button>
            </div>

            {photos.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
                {photos.map(photo => (
                  <div
                    key={photo.id}
                    className="relative group rounded-xl overflow-hidden border border-[#3D3D3D] bg-[#141414] aspect-video"
                  >
                    <img
                      src={photo.url}
                      alt={photo.caption}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-[#0F0F0F]/70 opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-between">
                      <button
                        onClick={() => handleRemovePhoto(photo.id)}
                        className="self-end p-1 bg-[#FF4E4E] hover:bg-[#e03e3e] text-white rounded-lg text-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-[10px] text-white truncate font-medium">
                        {photo.timestamp}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 border-2 border-dashed border-[#2D2D2D] rounded-xl text-center text-[#8E8E8E] text-xs">
                No panel photos attached. Tap &quot;Upload Photo&quot; or take a photo with your mobile camera.
              </div>
            )}
          </div>

          {/* Section 6: Technician Notes */}
          <div className="bg-[#1F1F1F] p-4 rounded-xl border border-[#2D2D2D] space-y-2">
            <label className="text-xs font-bold text-[#E0DED7] uppercase tracking-wider">
              7. Panel Specific Notes
            </label>
            <textarea
              placeholder="e.g. Sunroof cassette obstruction, sharp crease on body line, check paint depth..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              className="w-full bg-[#141414] border border-[#2D2D2D] rounded-xl p-3 text-xs text-[#E0DED7] placeholder-[#555] focus:outline-none focus:border-[#C5A059]"
            />
          </div>
        </div>

        {/* Footer with Real-time Financial Breakdown */}
        <div className="p-4 sm:p-6 bg-[#141414] border-t border-[#2D2D2D] flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-0 z-20">
          <div className="flex items-center gap-6 text-xs text-[#8E8E8E] w-full sm:w-auto justify-between sm:justify-start">
            <div>
              <div className="text-[9px] uppercase tracking-widest text-[#8E8E8E]">Matrix Base</div>
              <div className="font-mono font-bold text-[#E0DED7] text-sm">
                ${baseCost.toLocaleString()}
              </div>
            </div>

            <div>
              <div className="text-[9px] uppercase tracking-widest text-[#8E8E8E]">Oversize</div>
              <div className="font-mono font-bold text-[#FF4E4E] text-sm">
                +${oversizeCost.toLocaleString()}
              </div>
            </div>

            <div>
              <div className="text-[9px] uppercase tracking-widest text-[#8E8E8E]">Markups</div>
              <div className="font-mono font-bold text-[#C5A059] text-sm">
                +${markupCost.toLocaleString()}
              </div>
            </div>

            <div>
              <div className="text-[9px] uppercase tracking-widest text-[#8E8E8E]">R&amp;I Labor</div>
              <div className="font-mono font-bold text-[#C5A059] text-sm">
                +${riCost.toLocaleString()}
              </div>
            </div>

            <div className="border-l border-[#2D2D2D] pl-4">
              <div className="text-[9px] text-[#C5A059] uppercase tracking-widest font-bold">Panel Total</div>
              <div className="font-mono font-extrabold text-[#C5A059] text-lg">
                ${totalCost.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-full border border-[#3D3D3D] text-[#8E8E8E] hover:text-[#E0DED7] hover:bg-[#1F1F1F] text-xs font-semibold transition-colors w-1/2 sm:w-auto text-center"
            >
              Cancel
            </button>
            <button
              id="save-panel-damage-btn"
              onClick={handleSaveAndClose}
              className="px-6 py-2.5 rounded-full bg-[#C5A059] hover:bg-[#b59049] text-[#0F0F0F] font-bold text-xs transition-colors shadow-lg w-1/2 sm:w-auto text-center flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              Save Panel Damage
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
