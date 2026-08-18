import React, { useState, useEffect } from 'react';
import { ReportRecord, Estimate } from '../types';
import { fetchReportsHistory, deleteReportRecordApi } from '../utils/api';
import { generateEstimatePdf } from '../utils/pdfGenerator';
import {
  X,
  History,
  Download,
  Trash2,
  ExternalLink,
  Car,
  Mail,
  Calendar,
  DollarSign,
  Search,
  RotateCcw,
  CheckCircle2,
  FileText,
  Loader2,
  ShieldCheck
} from 'lucide-react';

interface ReportHistoryModalProps {
  onClose: () => void;
  onRestoreEstimate: (estimate: Estimate) => void;
}

export const ReportHistoryModal: React.FC<ReportHistoryModalProps> = ({
  onClose,
  onRestoreEstimate,
}) => {
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'recent'>('all');
  const [selectedReport, setSelectedReport] = useState<ReportRecord | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const data = await fetchReportsHistory();
      setReports(data);
      if (data.length > 0 && !selectedReport) {
        setSelectedReport(data[0]);
      }
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, reportId: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to remove this record from history?')) return;

    setDeletingId(reportId);
    try {
      const ok = await deleteReportRecordApi(reportId);
      if (ok) {
        setReports(prev => prev.filter(r => r.id !== reportId));
        if (selectedReport?.id === reportId) {
          setSelectedReport(null);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownloadPdf = (report: ReportRecord) => {
    try {
      const est = report.estimateSnapshot || {
        ...report,
        id: report.estimateId,
        panels: {},
        discounts: { cccPercentage: 0, customDiscountDollars: 0, taxRate: 0, deductible: 0 },
        summary: {
          totalDentCount: report.totalDentCount,
          totalOversizeCount: 0,
          matrixBaseTotal: report.grandTotal,
          oversizeTotal: 0,
          markupsTotal: 0,
          riLaborTotal: 0,
          subtotal: report.grandTotal,
          discountTotal: 0,
          taxTotal: 0,
          grandTotal: report.grandTotal,
        },
      };

      const { doc, fileName } = generateEstimatePdf(est as Estimate, { theme: 'dark' });
      doc.save(fileName);
    } catch (err) {
      console.error('PDF download error:', err);
    }
  };

  const handlePreviewPdf = (report: ReportRecord) => {
    try {
      const est = report.estimateSnapshot;
      if (est) {
        const { blob } = generateEstimatePdf(est, { theme: 'dark' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredReports = reports.filter(r => {
    const term = searchTerm.toLowerCase();
    return (
      (r.roNumber && r.roNumber.toLowerCase().includes(term)) ||
      (r.customerName && r.customerName.toLowerCase().includes(term)) ||
      (r.recipientEmail && r.recipientEmail.toLowerCase().includes(term)) ||
      (r.insuranceCompany && r.insuranceCompany.toLowerCase().includes(term)) ||
      (r.vehicle && `${r.vehicle.year} ${r.vehicle.make} ${r.vehicle.model}`.toLowerCase().includes(term)) ||
      (r.vehicle?.vin && r.vehicle.vin.toLowerCase().includes(term))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F0F0F]/85 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-5xl bg-[#141414] border border-[#2D2D2D] rounded-2xl shadow-2xl overflow-hidden flex flex-col my-8 max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#141414] border-b border-[#2D2D2D] flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#1F1F1F] border border-[#3D3D3D] flex items-center justify-center text-[#C5A059]">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#E0DED7] font-serif flex items-center gap-2">
                Sent Valuation Reports History
                <span className="text-[10px] bg-[#1F1F1F] text-[#C5A059] border border-[#3D3D3D] px-2.5 py-0.5 rounded-full font-mono">
                  {reports.length} Dispatched
                </span>
              </h2>
              <p className="text-xs text-[#8E8E8E]">
                Secure cloud audit ledger of all submitted client &amp; insurer appraisals
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-[#8E8E8E] hover:text-[#E0DED7] hover:bg-[#1F1F1F] rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar & Controls */}
        <div className="p-4 bg-[#1A1A1A] border-b border-[#2D2D2D] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-[#8E8E8E] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by RO #, customer, VIN, vehicle, or insurer..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-[#141414] border border-[#2D2D2D] text-[#E0DED7] text-xs pl-9 pr-4 py-2 rounded-full focus:outline-none focus:border-[#C5A059] placeholder-[#555]"
            />
          </div>

          <div className="text-xs text-[#8E8E8E] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#C5A059]" />
            <span>Encrypted cloud storage</span>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-[#141414]">
          {/* Reports List (Left Column) */}
          <div className="lg:col-span-5 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-[#8E8E8E] flex items-center justify-between">
              <span>Dispatched Records</span>
              <span>{filteredReports.length} shown</span>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 text-[#8E8E8E] space-y-2">
                <Loader2 className="w-6 h-6 animate-spin text-[#C5A059]" />
                <span className="text-xs">Loading sent reports from secure vault...</span>
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="bg-[#1F1F1F] border border-[#2D2D2D] rounded-xl p-8 text-center space-y-3">
                <FileText className="w-8 h-8 text-[#555] mx-auto" />
                <div className="text-xs font-bold text-[#E0DED7]">No Sent Reports Found</div>
                <p className="text-[11px] text-[#8E8E8E]">
                  {searchTerm ? 'No reports matched your search term.' : 'When you email or dispatch a valuation report, it will be safely archived here.'}
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[550px] overflow-y-auto pr-1">
                {filteredReports.map(report => {
                  const isSelected = selectedReport?.id === report.id;
                  const v = report.vehicle || {};

                  return (
                    <div
                      key={report.id}
                      onClick={() => setSelectedReport(report)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer relative group ${
                        isSelected
                          ? 'bg-[#1F1F1F] border-[#C5A059] shadow-lg ring-1 ring-[#C5A059]/40'
                          : 'bg-[#171717] border-[#2D2D2D] hover:border-[#3D3D3D] hover:bg-[#1A1A1A]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-[#C5A059]">
                              {report.roNumber || '#EST-8829-X'}
                            </span>
                            <span className="text-[9px] bg-[#141414] text-[#8E8E8E] border border-[#2D2D2D] px-2 py-0.5 rounded-full font-mono">
                              {new Date(report.sentAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="text-xs font-semibold text-[#E0DED7] mt-1 truncate max-w-[220px]">
                            {v.year} {v.make} {v.model || 'Vehicle'}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-sm font-mono font-bold text-[#C5A059]">
                            ${(report.grandTotal || 0).toLocaleString()}
                          </div>
                          <div className="text-[10px] text-[#8E8E8E]">
                            {report.totalDentCount || 0} dents
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-[#8E8E8E] mt-2 pt-2 border-t border-[#2D2D2D]/60">
                        <div className="flex items-center gap-1.5 truncate max-w-[200px]">
                          <Mail className="w-3 h-3 text-[#C5A059] shrink-0" />
                          <span className="truncate">{report.recipientEmail}</span>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => handleDelete(e, report.id)}
                          disabled={deletingId === report.id}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-[#8E8E8E] hover:text-[#FF4E4E]"
                          title="Remove from history"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Report Details & Actions (Right Column) */}
          <div className="lg:col-span-7">
            {selectedReport ? (
              <div className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-xl p-5 space-y-5">
                <div className="flex items-start justify-between gap-4 border-b border-[#2D2D2D] pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-[#E0DED7] font-serif">
                        {selectedReport.vehicle?.year} {selectedReport.vehicle?.make} {selectedReport.vehicle?.model}
                      </h3>
                      <span className="font-mono text-xs text-[#C5A059] bg-[#141414] border border-[#3D3D3D] px-2 py-0.5 rounded-full">
                        {selectedReport.roNumber}
                      </span>
                    </div>
                    <p className="text-xs text-[#8E8E8E] mt-0.5">
                      Insurer: <strong className="text-[#C5A059]">{selectedReport.insuranceCompany || 'USAA'}</strong> &bull; Customer: <strong className="text-[#E0DED7]">{selectedReport.customerName}</strong>
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="text-xl font-mono font-black text-[#C5A059]">
                      ${(selectedReport.grandTotal || 0).toLocaleString()}
                    </div>
                    <span className="text-[10px] text-[#22C55E] flex items-center justify-end gap-1 font-semibold">
                      <CheckCircle2 className="w-3 h-3" /> Dispatched
                    </span>
                  </div>
                </div>

                {/* Info Cards Grid */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-[#141414] p-3 rounded-lg border border-[#2D2D2D]">
                    <span className="text-[10px] text-[#8E8E8E] uppercase tracking-wider block">Recipient Email</span>
                    <span className="font-mono text-[#E0DED7] break-all">{selectedReport.recipientEmail}</span>
                  </div>

                  <div className="bg-[#141414] p-3 rounded-lg border border-[#2D2D2D]">
                    <span className="text-[10px] text-[#8E8E8E] uppercase tracking-wider block">Dispatched Timestamp</span>
                    <span className="font-mono text-[#E0DED7]">
                      {new Date(selectedReport.sentAt).toLocaleString()}
                    </span>
                  </div>

                  <div className="bg-[#141414] p-3 rounded-lg border border-[#2D2D2D]">
                    <span className="text-[10px] text-[#8E8E8E] uppercase tracking-wider block">Vehicle VIN</span>
                    <span className="font-mono text-[#C5A059] font-bold">
                      {selectedReport.vehicle?.vin || 'N/A'}
                    </span>
                  </div>

                  <div className="bg-[#141414] p-3 rounded-lg border border-[#2D2D2D]">
                    <span className="text-[10px] text-[#8E8E8E] uppercase tracking-wider block">Damage Count</span>
                    <span className="font-mono text-[#E0DED7]">
                      {selectedReport.totalDentCount || 0} hail dents documented
                    </span>
                  </div>
                </div>

                {/* Labeled Panels Summary */}
                {selectedReport.estimateSnapshot?.panels && (
                  <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#8E8E8E] block">
                      Archived Damaged Panels
                    </span>
                    <div className="bg-[#141414] border border-[#2D2D2D] rounded-lg p-3 max-h-40 overflow-y-auto space-y-1.5 text-xs">
                      {Object.keys(selectedReport.estimateSnapshot.panels)
                        .filter(id => {
                          const p = selectedReport.estimateSnapshot.panels[id];
                          return p && (p.dentCount > 0 || (p.riItems && p.riItems.some((i: any) => i.selected)));
                        })
                        .map(id => {
                          const p = selectedReport.estimateSnapshot.panels[id];
                          return (
                            <div key={id} className="flex justify-between items-center py-1 border-b border-[#222] last:border-0">
                              <span className="text-[#E0DED7] capitalize font-medium">{id.replace(/([A-Z])/g, ' $1')}</span>
                              <span className="text-xs font-mono text-[#8E8E8E]">
                                {p.dentCount} dents &bull; <strong className="text-[#C5A059]">${(p.totalCost || 0).toLocaleString()}</strong>
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Actions Toolbar */}
                <div className="pt-3 border-t border-[#2D2D2D] flex items-center justify-between flex-wrap gap-2">
                  {/* Restore into Active Estimate Button */}
                  {selectedReport.estimateSnapshot && (
                    <button
                      type="button"
                      id="restore-past-estimate-btn"
                      onClick={() => {
                        onRestoreEstimate(selectedReport.estimateSnapshot);
                        onClose();
                      }}
                      className="bg-[#1F1F1F] hover:bg-[#252525] text-[#E0DED7] hover:text-[#C5A059] border border-[#3D3D3D] hover:border-[#C5A059] text-xs font-bold px-4 py-2 rounded-full transition-all flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-[#C5A059]" />
                      <span>Resume / Edit This Estimate</span>
                    </button>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handlePreviewPdf(selectedReport)}
                      className="bg-[#141414] hover:bg-[#202020] text-[#C5A059] border border-[#3D3D3D] hover:border-[#C5A059] text-xs font-semibold px-3 py-2 rounded-full transition-colors flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </button>

                    <button
                      type="button"
                      id="download-history-pdf-btn"
                      onClick={() => handleDownloadPdf(selectedReport)}
                      className="bg-[#C5A059] hover:bg-[#b59049] text-[#0F0F0F] text-xs font-bold px-4 py-2 rounded-full transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download 1-Page PDF</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-12 bg-[#1A1A1A] border border-[#2D2D2D] rounded-xl text-center text-[#8E8E8E] space-y-2">
                <History className="w-8 h-8 text-[#555]" />
                <span className="text-xs">Select a dispatched report on the left to view full appraisal snapshot details &amp; PDF actions.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
