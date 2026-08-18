import React, { useState } from 'react';
import { Estimate, PanelId, MarkupType } from '../types';
import { PANEL_CONFIGS, COIN_DIMENSIONS } from '../data/matrix';
import { generateEstimatePdf } from '../utils/pdfGenerator';
import { 
  X, 
  Printer, 
  Mail, 
  Download, 
  CheckCircle2, 
  Car, 
  FileText, 
  AlertTriangle, 
  Send, 
  Loader2,
  ExternalLink,
  Share2,
  Sun,
  Moon,
  Sparkles
} from 'lucide-react';

interface EstimateSummaryModalProps {
  estimate: Estimate;
  onClose: () => void;
  onSendEmail: (email: string, pdfBase64?: string, fileName?: string) => Promise<any>;
}

const MARKUP_NAMES: Record<MarkupType, string> = {
  aluminumPanels: 'Alum +25%',
  highStrengthSteel: 'HSS +25%',
  doublePanels: 'Dbl Metal +25%',
  gluePull: 'Glue Pull +25%',
  limitedAccess: 'Obstructed +25%',
  xlPanel: 'XL Panel +25%',
};

export const EstimateSummaryModal: React.FC<EstimateSummaryModalProps> = ({
  estimate,
  onClose,
  onSendEmail,
}) => {
  const [recipientEmail, setRecipientEmail] = useState(
    estimate.customerEmail || 'evangelosneobarberis@gmail.com'
  );
  const [pdfTheme, setPdfTheme] = useState<'dark' | 'light'>('dark');
  const [isSending, setIsSending] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [emailStatus, setEmailStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusDetails, setStatusDetails] = useState<string>('');

  const panelsWithData = (Object.keys(estimate.panels) as PanelId[]).filter(
    id => estimate.panels[id].dentCount > 0 || estimate.panels[id].riItems.some(i => i.selected)
  );

  // 1. Direct PDF Download Handler (Strictly 1 Page)
  const handleDownloadPdf = (themeOverride?: 'dark' | 'light') => {
    try {
      setIsGeneratingPdf(true);
      const selectedTheme = themeOverride || pdfTheme;
      const { doc, fileName } = generateEstimatePdf(estimate, { theme: selectedTheme });
      doc.save(fileName);
    } catch (err) {
      console.error('Error generating PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // 2. Direct PDF Preview Handler
  const handlePreviewPdf = () => {
    try {
      const { blob } = generateEstimatePdf(estimate, { theme: pdfTheme });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err) {
      console.error('Error opening PDF preview:', err);
      window.print();
    }
  };

  // 3. Web Share API with Real PDF File Attachment (iOS, Android, Mac, Windows)
  const handleSharePdfWithDevice = async () => {
    try {
      setIsGeneratingPdf(true);
      const { blob, fileName } = generateEstimatePdf(estimate, { theme: pdfTheme });
      const file = new File([blob], fileName, { type: 'application/pdf' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `PDR Logic Appraisal: ${estimate.vehicle.year} ${estimate.vehicle.make} ${estimate.vehicle.model}`,
          text: `Hail damage valuation estimate #${estimate.roNumber} ($${(estimate.summary.grandTotal || 0).toLocaleString()}). Official 1-page PDF certificate attached.`,
          files: [file],
        });
      } else {
        // Fallback: download the file and open mail composer
        handleDownloadPdf();
        window.location.href = `mailto:${encodeURIComponent(recipientEmail)}?subject=${encodeURIComponent(`[PDR Appraisal] ${estimate.vehicle.year} ${estimate.vehicle.make} ${estimate.vehicle.model} - RO: ${estimate.roNumber}`)}`;
      }
    } catch (err) {
      console.warn('Share not completed:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // 4. Direct Gmail Webmail One-Click Send
  const handleOpenGmailWeb = () => {
    handleDownloadPdf();
    const subject = `[PDF Appraisal] PDR Logic Hail Damage Valuation: ${estimate.vehicle.year || ''} ${estimate.vehicle.make || ''} ${estimate.vehicle.model || ''} [RO: ${estimate.roNumber}]`;
    const body = `PDR LOGIC HAIL DAMAGE VALUATION REPORT\n==============================================\nWork Order / RO: ${estimate.roNumber}\nDate: ${new Date(estimate.createdAt).toLocaleDateString()}\nStatus: ${estimate.status.toUpperCase()}\n\nVEHICLE SPECS:\n--------------\nVehicle: ${estimate.vehicle.year} ${estimate.vehicle.make} ${estimate.vehicle.model}\nVIN: ${estimate.vehicle.vin || 'N/A'}\nColor / Finish: ${estimate.vehicle.color || 'OEM Finish'}\nBody / Doors: ${estimate.vehicle.bodyClass || 'Sedan'} (${estimate.vehicle.doors || '4'} Doors)\n\nCUSTOMER & CLAIM:\n-----------------\nCustomer: ${estimate.customerName || 'N/A'}\nPhone: ${estimate.customerPhone || 'N/A'}\nInsurer: ${estimate.insuranceCompany || 'USAA'}\nClaim #: ${estimate.claimNumber || 'N/A'}\nTechnician: ${estimate.technicianName}\n\nPANEL BREAKDOWN (D&G PARADIGM 2025 MATRIX):\n------------------------------------------\n${panelsWithData.map(id => {
      const p = estimate.panels[id];
      const cfg = PANEL_CONFIGS[id];
      const coin = COIN_DIMENSIONS[p.primaryDentSize || 'dime'];
      const mk = (p.markups || []).map(m => MARKUP_NAMES[m] || m).join(', ') || 'None';
      return `• ${cfg.name}: ${p.dentCount} dents (${coin.name}) | Base: $${p.baseCost} | Oversize: ${p.oversizeCount} | Markups: ${mk} | R&I: $${p.riCost} -> Total: $${p.totalCost}`;
    }).join('\n')}\n\nFINANCIAL SUMMARY:\n------------------\nTotal Hail Dents: ${estimate.summary.totalDentCount} pts\nGross Matrix Base: $${(estimate.summary.matrixBaseTotal || 0).toLocaleString()}\nOversize Dents: +$${(estimate.summary.oversizeTotal || 0).toLocaleString()}\n25% Markups: +$${(estimate.summary.markupsTotal || 0).toLocaleString()}\nR&I Labor Schedule: +$${(estimate.summary.riLaborTotal || 0).toLocaleString()}\n${estimate.summary.discountTotal > 0 ? `Insurer CCC Discount: -$${estimate.summary.discountTotal.toLocaleString()}\n` : ''}==================================================\nGRAND TOTAL ESTIMATE: $${(estimate.summary.grandTotal || 0).toLocaleString()}\n==================================================\n\n(Official 1-Page Black Theme PDF Appraisal document saved to your device).`;
    
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(recipientEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(gmailUrl, '_blank');
  };

  // 5. Server Email Dispatch Handler
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientEmail.trim()) return;

    setIsSending(true);
    setEmailStatus('idle');
    setStatusDetails('');

    try {
      // Generate authentic 1-page dark PDF base64 binary
      const { base64, fileName, doc } = generateEstimatePdf(estimate, { theme: pdfTheme });

      // Trigger server dispatch with PDF attachment
      const result = await onSendEmail(recipientEmail.trim(), base64, fileName);

      // Auto-save a copy locally
      try {
        doc.save(fileName);
      } catch {}

      if (result === true || (result && result.success !== false)) {
        setEmailStatus('success');
        setStatusDetails(
          result?.sentViaSmtp
            ? `1-Page PDF Appraisal delivered directly via SMTP with '${fileName}' attached to ${recipientEmail.trim()}.`
            : `1-Page PDF Appraisal generated (${fileName}) and dispatched to ${recipientEmail.trim()}. A copy has also been saved to your downloads!`
        );
      } else {
        setEmailStatus('error');
        setStatusDetails(result?.message || 'Unable to complete email dispatch.');
      }
    } catch (err: any) {
      console.error('Email error:', err);
      setEmailStatus('error');
      setStatusDetails(err.message || 'Network error sending email.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F0F0F]/85 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-4xl bg-[#141414] border border-[#2D2D2D] rounded-2xl shadow-2xl overflow-hidden flex flex-col my-8 max-h-[92vh]">
        {/* Header Bar */}
        <div className="px-6 py-4 bg-[#141414] border-b border-[#2D2D2D] flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#1F1F1F] border border-[#3D3D3D] flex items-center justify-center text-[#C5A059]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#E0DED7] font-serif flex items-center gap-2">
                Hail Damage Valuation Report
                <span className="text-[9px] bg-[#1F1F1F] text-[#C5A059] border border-[#3D3D3D] px-2.5 py-0.5 rounded-full font-mono uppercase tracking-wider">
                  {estimate.roNumber}
                </span>
              </h2>
              <p className="text-xs text-[#8E8E8E]">
                PDR Logic 1-Page Official Valuation &bull; D&amp;G Paradigm 2025 Standard
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* PDF Style Mode Toggle */}
            <div className="bg-[#1F1F1F] border border-[#3D3D3D] rounded-full p-0.5 flex items-center text-xs">
              <button
                type="button"
                onClick={() => setPdfTheme('dark')}
                title="Black Theme (Website Match)"
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full font-medium transition-all ${
                  pdfTheme === 'dark'
                    ? 'bg-[#C5A059] text-[#0F0F0F] font-bold shadow-sm'
                    : 'text-[#8E8E8E] hover:text-[#E0DED7]'
                }`}
              >
                <Moon className="w-3 h-3" />
                <span className="hidden sm:inline">Black Theme</span>
              </button>
              <button
                type="button"
                onClick={() => setPdfTheme('light')}
                title="Light Theme (Daylight Print)"
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full font-medium transition-all ${
                  pdfTheme === 'light'
                    ? 'bg-white text-slate-900 font-bold shadow-sm'
                    : 'text-[#8E8E8E] hover:text-[#E0DED7]'
                }`}
              >
                <Sun className="w-3 h-3 text-amber-500" />
                <span className="hidden sm:inline">Light Theme</span>
              </button>
            </div>

            <button
              id="download-pdf-btn"
              onClick={() => handleDownloadPdf()}
              disabled={isGeneratingPdf}
              className="bg-[#C5A059] hover:bg-[#B38F48] text-[#0F0F0F] text-xs font-bold px-4 py-2 rounded-full transition-transform active:scale-95 flex items-center gap-1.5 shadow-sm"
            >
              {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span>Download 1-Page PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-[#8E8E8E] hover:text-[#E0DED7] hover:bg-[#1F1F1F] rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Report Body */}
        <div className="p-6 md:p-8 overflow-y-auto space-y-6 flex-1 bg-[#141414] text-[#E0DED7]">
          
          {/* Guaranteed 1-Page Black Theme Banner */}
          <div className="bg-[#1C1C1F] border border-[#C5A059]/40 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#C5A059]/10 border border-[#C5A059]/30 flex items-center justify-center text-[#C5A059] shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#E0DED7] flex items-center gap-2">
                  <span>Certified 1-Page PDF Appraisal Document</span>
                  <span className="text-[10px] bg-[#0F0F0F] text-[#C5A059] border border-[#3D3D3D] px-2 py-0.5 rounded-full font-mono font-semibold">
                    {pdfTheme === 'dark' ? 'Black Website Theme' : 'Light Print Theme'}
                  </span>
                </div>
                <div className="text-[11px] text-[#8E8E8E]">
                  Form-fitted to exactly 1 single page with labeled panel data, +25% condition markups, mechanical R&amp;I hours, and signature lines.
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
              <button
                onClick={() => handleDownloadPdf()}
                className="bg-[#C5A059] hover:bg-[#b59049] text-[#0F0F0F] text-xs font-bold px-4 py-2 rounded-full transition-colors flex items-center gap-1.5 whitespace-nowrap shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save 1-Page PDF</span>
              </button>

              <button
                onClick={handlePreviewPdf}
                className="bg-[#141414] hover:bg-[#252525] text-[#C5A059] border border-[#3D3D3D] hover:border-[#C5A059] text-xs font-semibold px-3 py-2 rounded-full transition-colors flex items-center gap-1.5 whitespace-nowrap"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Preview</span>
              </button>
            </div>
          </div>

          {/* Company Branding & Work Order Banner */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-[#2D2D2D] pb-6">
            <div>
              <div className="text-2xl font-black text-[#E0DED7] tracking-tight flex items-center gap-2 font-serif">
                <span className="text-[#C5A059]">PDR</span> LOGIC
              </div>
              <p className="text-xs text-[#8E8E8E] mt-1">
                Precision Paintless Dent Repair &amp; Hail Valuation Systems
              </p>
              <p className="text-[11px] text-[#555]">
                Certified Technicians &bull; NHTSA Verified Data &bull; D&amp;G 2025 Matrix Standard
              </p>
            </div>

            <div className="text-left sm:text-right text-xs space-y-1">
              <div className="text-base font-mono font-extrabold text-[#C5A059]">
                {estimate.roNumber}
              </div>
              <div className="text-[#8E8E8E]">
                Date: <span className="text-[#E0DED7] font-mono">{new Date(estimate.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="text-[#8E8E8E]">
                Insurer: <span className="text-[#C5A059] font-semibold">{estimate.insuranceCompany || 'USAA'}</span>
              </div>
              <div className="text-[#8E8E8E]">
                Status: <span className="px-2.5 py-0.5 rounded-full bg-[#1F1F1F] text-[#C5A059] border border-[#3D3D3D] text-[10px] font-semibold">{estimate.status}</span>
              </div>
            </div>
          </div>

          {/* Customer & Vehicle Information Box */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer Box */}
            <div className="bg-[#1F1F1F] p-4 rounded-xl border border-[#2D2D2D] space-y-2">
              <div className="text-xs font-bold text-[#C5A059] uppercase tracking-wider">
                Customer &amp; Claim Details
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[#8E8E8E] block text-[10px] uppercase tracking-widest">Customer Name</span>
                  <span className="font-semibold text-[#E0DED7]">{estimate.customerName || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[#8E8E8E] block text-[10px] uppercase tracking-widest">Phone Number</span>
                  <span className="font-semibold text-[#E0DED7]">{estimate.customerPhone || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[#8E8E8E] block text-[10px] uppercase tracking-widest">Email Address</span>
                  <span className="font-semibold text-[#E0DED7] truncate block">{estimate.customerEmail || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[#8E8E8E] block text-[10px] uppercase tracking-widest">Assigned Technician</span>
                  <span className="font-semibold text-[#C5A059]">{estimate.technicianName}</span>
                </div>
              </div>
            </div>

            {/* Vehicle Box */}
            <div className="bg-[#1F1F1F] p-4 rounded-xl border border-[#2D2D2D] space-y-2">
              <div className="text-xs font-bold text-[#C5A059] uppercase tracking-wider flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5" />
                Decoded Vehicle Specs
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[#8E8E8E] block text-[10px] uppercase tracking-widest">Year / Make / Model</span>
                  <span className="font-semibold text-[#E0DED7]">
                    {estimate.vehicle.year} {estimate.vehicle.make} {estimate.vehicle.model}
                  </span>
                </div>
                <div>
                  <span className="text-[#8E8E8E] block text-[10px] uppercase tracking-widest">VIN</span>
                  <span className="font-mono text-[#C5A059] font-semibold">{estimate.vehicle.vin || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[#8E8E8E] block text-[10px] uppercase tracking-widest">Body Style / Doors</span>
                  <span className="text-[#E0DED7]">{estimate.vehicle.bodyClass || 'Sedan'} ({estimate.vehicle.doors || '4'} Doors)</span>
                </div>
                <div>
                  <span className="text-[#8E8E8E] block text-[10px] uppercase tracking-widest">OEM Color &amp; Finish</span>
                  <span className="text-[#E0DED7] flex items-center gap-1.5">
                    <span 
                      className="w-2.5 h-2.5 rounded-full border border-white/20 inline-block"
                      style={{ backgroundColor: estimate.vehicle.colorHex || '#F2F2F2' }}
                    />
                    {estimate.vehicle.color || 'Pearl White'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Panel by Panel Itemization Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-[#C5A059] uppercase tracking-wider">
                Damaged Panels Breakdown ({panelsWithData.length} Panels)
              </div>
              <div className="text-[10px] font-mono text-[#8E8E8E]">
                Rate: $75/hr mechanical R&amp;I
              </div>
            </div>

            <div className="border border-[#2D2D2D] rounded-xl overflow-hidden overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#1F1F1F] text-[#C5A059] border-b border-[#2D2D2D] text-[10px] uppercase tracking-wider font-mono">
                    <th className="py-2.5 px-3">Panel</th>
                    <th className="py-2.5 px-3">Dent Count / Size</th>
                    <th className="py-2.5 px-3 text-right">Matrix Base</th>
                    <th className="py-2.5 px-3 text-center">Oversize (+$50)</th>
                    <th className="py-2.5 px-3">Conditions (+25%)</th>
                    <th className="py-2.5 px-3">Mechanical R&amp;I Schedule</th>
                    <th className="py-2.5 px-3 text-right">R&amp;I Cost</th>
                    <th className="py-2.5 px-3 text-right">Panel Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2D2D2D]">
                  {panelsWithData.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-[#8E8E8E] italic">
                        No damaged panels recorded. Select panels in the 3D model or Ledger to tally dents.
                      </td>
                    </tr>
                  ) : (
                    panelsWithData.map(panelId => {
                      const p = estimate.panels[panelId];
                      const cfg = PANEL_CONFIGS[panelId];
                      const coin = COIN_DIMENSIONS[p.primaryDentSize || 'dime'];
                      const activeRi = (p.riItems || []).filter(i => i.selected);

                      return (
                        <tr key={panelId} className="hover:bg-[#1A1A1A] transition-colors">
                          <td className="py-2.5 px-3 font-semibold text-[#E0DED7]">
                            {cfg.name}
                          </td>
                          <td className="py-2.5 px-3 font-mono">
                            {p.dentCount > 0 ? (
                              <span className="text-[#E0DED7]">
                                <strong className="text-[#C5A059]">{p.dentCount}</strong> ({coin.name})
                              </span>
                            ) : (
                              <span className="text-[#555]">-</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-[#8E8E8E]">
                            ${(p.baseCost || 0).toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono">
                            {p.oversizeCount > 0 ? (
                              <span className="text-[#C5A059] font-bold">
                                {p.oversizeCount} (+${p.oversizeCost})
                              </span>
                            ) : (
                              <span className="text-[#555]">-</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            {p.markups && p.markups.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {p.markups.map(m => (
                                  <span key={m} className="bg-[#2A2A2A] text-[#C5A059] text-[9px] px-1.5 py-0.5 rounded border border-[#3D3D3D] font-mono">
                                    {MARKUP_NAMES[m] || m}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[#555] text-[10px]">-</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-[11px] text-[#8E8E8E]">
                            {activeRi.length > 0 ? (
                              <div className="space-y-0.5">
                                {activeRi.map(i => (
                                  <div key={i.id} className="truncate max-w-[180px]">
                                    &bull; {i.name} ({i.hours}h)
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[#555]">-</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-[#8E8E8E]">
                            ${(p.riCost || 0).toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-[#C5A059]">
                            ${(p.totalCost || 0).toLocaleString()}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Valuation Summary Box */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* D&G Paradigm 2025 Matrix Details */}
            <div className="bg-[#1F1F1F] p-4 rounded-xl border border-[#2D2D2D] space-y-2">
              <div className="text-xs font-bold text-[#C5A059] uppercase tracking-wider">
                Matrix Guidelines &amp; Terms
              </div>
              <ul className="text-xs text-[#8E8E8E] space-y-1.5 list-disc list-inside">
                <li>Valuation calculated according to certified D&amp;G Paradigm 2025 hail pricing.</li>
                <li>Includes +$50 surcharge for oversized hail impact sites.</li>
                <li>25% condition markups applied to double metal, high strength steel, &amp; glue-pulling access.</li>
                <li>Mechanical R&amp;I labor billed at standard Mitchell / Motor shop rate.</li>
              </ul>
            </div>

            {/* Financial Ledger Calculation */}
            <div className="bg-[#1F1F1F] p-4 rounded-xl border border-[#C5A059]/40 space-y-2">
              <div className="text-xs font-bold text-[#C5A059] uppercase tracking-wider">
                Financial Breakdown
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-[#8E8E8E]">
                  <span>Total Hail Points Counted</span>
                  <span className="font-mono text-[#E0DED7] font-semibold">{estimate.summary.totalDentCount || 0} pts</span>
                </div>
                <div className="flex justify-between text-[#8E8E8E]">
                  <span>Matrix Base Repair</span>
                  <span className="font-mono text-[#E0DED7]">${(estimate.summary.matrixBaseTotal || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[#8E8E8E]">
                  <span>Oversized Dents (+$50/ea)</span>
                  <span className="font-mono text-[#C5A059]">+${(estimate.summary.oversizeTotal || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[#8E8E8E]">
                  <span>25% Condition Markups</span>
                  <span className="font-mono text-[#C5A059]">+${(estimate.summary.markupsTotal || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[#8E8E8E]">
                  <span>R&amp;I Labor Total</span>
                  <span className="font-mono text-[#E0DED7]">+${(estimate.summary.riLaborTotal || 0).toLocaleString()}</span>
                </div>
                {estimate.summary.discountTotal > 0 && (
                  <div className="flex justify-between text-[#C5A059]">
                    <span>Discount / CCC ({estimate.discounts.cccPercentage}%)</span>
                    <span className="font-mono">-${estimate.summary.discountTotal.toLocaleString()}</span>
                  </div>
                )}
                <div className="border-t border-[#2D2D2D] pt-2 flex justify-between font-extrabold text-sm text-[#E0DED7]">
                  <span>Grand Total Valuation</span>
                  <span className="font-mono text-[#C5A059] text-base">
                    ${(estimate.summary.grandTotal || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Email Dispatch & Sharing Options */}
          <div className="bg-[#1F1F1F] p-5 rounded-xl border border-[#2D2D2D] space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="text-xs font-bold text-[#E0DED7] uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-[#C5A059]" />
                Direct Email Delivery (1-Page PDF Attached)
              </div>
              {emailStatus === 'success' && (
                <span className="text-xs text-[#C5A059] flex items-center gap-1.5 font-semibold bg-[#141414] px-3 py-1 rounded-full border border-[#C5A059]/40">
                  <CheckCircle2 className="w-4 h-4" /> 1-Page PDF Successfully Generated &amp; Dispatched!
                </span>
              )}
              {emailStatus === 'error' && (
                <span className="text-xs text-[#FF4E4E] flex items-center gap-1.5 font-semibold bg-[#141414] px-3 py-1 rounded-full border border-[#FF4E4E]/40">
                  <AlertTriangle className="w-4 h-4" /> {statusDetails || 'Error sending email'}
                </span>
              )}
            </div>

            {statusDetails && emailStatus === 'success' && (
              <div className="text-xs text-[#C5A059] bg-[#141414]/90 p-3 rounded-lg border border-[#C5A059]/30">
                {statusDetails}
              </div>
            )}

            <form onSubmit={handleSend} className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <input
                  id="report-recipient-email-input"
                  type="email"
                  required
                  placeholder="evangelosneobarberis@gmail.com, insurance adjuster, or customer email"
                  value={recipientEmail}
                  onChange={e => setRecipientEmail(e.target.value)}
                  className="w-full sm:flex-1 bg-[#141414] border border-[#2D2D2D] text-[#E0DED7] text-xs px-4 py-3 rounded-full focus:outline-none focus:border-[#C5A059] placeholder-[#555]"
                />
                <button
                  id="send-report-server-btn"
                  type="submit"
                  disabled={isSending || !recipientEmail.trim()}
                  className="w-full sm:w-auto bg-[#C5A059] hover:bg-[#b59049] disabled:opacity-50 text-[#0F0F0F] font-bold text-xs px-6 py-3 rounded-full transition-all flex items-center justify-center gap-2 whitespace-nowrap shadow-md active:scale-95"
                >
                  {isSending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Email 1-Page PDF
                </button>
              </div>

              {/* Quick 1-Click Sending Shortcuts: Gmail Webmail + Device Share (Apple Mail/Outlook) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-3 border-t border-[#2D2D2D]/60">
                {/* 1. Gmail Webmail 1-Click Compose */}
                <button
                  type="button"
                  id="open-in-gmail-btn"
                  onClick={handleOpenGmailWeb}
                  className="w-full bg-[#141414] hover:bg-[#252525] border border-[#C5A059] text-[#C5A059] font-bold text-xs px-4 py-2.5 rounded-full transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <Mail className="w-4 h-4" />
                  <span>Send via Gmail (Auto-Compose)</span>
                </button>

                {/* 2. Device Native Share / Mail with PDF attached */}
                <button
                  type="button"
                  id="share-pdf-device-btn"
                  onClick={handleSharePdfWithDevice}
                  className="w-full bg-[#141414] hover:bg-[#252525] border border-[#3D3D3D] hover:border-[#C5A059] text-[#E0DED7] font-semibold text-xs px-4 py-2.5 rounded-full transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <Share2 className="w-4 h-4 text-[#C5A059]" />
                  <span>Share / Attach to Mail App</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
