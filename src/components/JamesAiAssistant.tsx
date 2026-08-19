import React, { useState, useRef, useEffect } from 'react';
import { Estimate } from '../types';
import { 
  Bot, 
  Send, 
  Sparkles, 
  X, 
  Minimize2, 
  Maximize2, 
  RotateCcw, 
  CheckCircle2, 
  HelpCircle,
  Car,
  DollarSign,
  Layers,
  Wrench
} from 'lucide-react';

interface JamesAiAssistantProps {
  estimate: Estimate;
}

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export const JamesAiAssistant: React.FC<JamesAiAssistantProps> = ({ estimate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      text: `Hello! I'm James, your AI PDR Estimator Specialist. I'm connected to the G&G Paradigm 2025 matrix rules. Ask me about dent counts, coin sizing, +25% condition markups, or analyze your current ${estimate.vehicle.year || ''} ${estimate.vehicle.make || ''} ${estimate.vehicle.model || ''} valuation.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputValue.trim();
    if (!query || isLoading) return;

    const userMsg: Message = {
      id: `usr_${Date.now()}`,
      role: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Build estimate context for James
      const estimateContext = {
        vehicle: `${estimate.vehicle.year} ${estimate.vehicle.make} ${estimate.vehicle.model} (${estimate.vehicle.bodyClass || 'Sedan'})`,
        vin: estimate.vehicle.vin,
        roNumber: estimate.roNumber,
        totalDentCount: estimate.summary.totalDentCount,
        oversizeDentCount: estimate.summary.totalOversizeCount,
        matrixBaseTotal: estimate.summary.matrixBaseTotal,
        oversizeTotal: estimate.summary.oversizeTotal,
        markupsTotal: estimate.summary.markupsTotal,
        riLaborTotal: estimate.summary.riLaborTotal,
        grandTotal: estimate.summary.grandTotal,
        customerName: estimate.customerName,
        insuranceCompany: estimate.insuranceCompany,
      };

      const history = messages.map(m => ({
        role: m.role,
        text: m.text,
      }));

      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          history,
          estimateContext,
        }),
      });

      const data = await res.json();
      const botMsg: Message = {
        id: `bot_${Date.now()}`,
        role: 'model',
        text: data.reply || "I analyzed your request according to the G&G Paradigm 2025 standard. Let me know if you need panel-specific adjustments.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error('Chat error:', err);
      const fallbackMsg: Message = {
        id: `bot_err_${Date.now()}`,
        role: 'model',
        text: "I'm reviewing the G&G Paradigm 2025 matrix. For oversized dents (> Half Dollar), remember to add +$50/dent. Aluminum panels incur a +25% markup on matrix base.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    handleSendMessage(prompt);
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: 'welcome_reset',
        role: 'model',
        text: `Chat reset. I'm James, ready to help with hail appraisal calculations, matrix lookup, or review your current ${estimate.vehicle.year || ''} ${estimate.vehicle.make || ''} ${estimate.vehicle.model || ''} valuation.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <>
      {/* Floating Corner Badge / Launcher */}
      {!isOpen && (
        <button
          id="james-ai-launcher"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 bg-[#141414] hover:bg-[#1A1A1A] border border-[#C5A059] text-[#E0DED7] pl-3 pr-4 py-2.5 rounded-full shadow-2xl flex items-center gap-3 transition-all hover:scale-105 group"
        >
          <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-[#1F1F1F] border border-[#C5A059] text-[#C5A059] shadow-inner">
            <Bot className="w-4 h-4 text-[#C5A059] group-hover:rotate-12 transition-transform" />
            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C5A059] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#C5A059]"></span>
            </span>
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-bold text-[#E0DED7] flex items-center gap-1.5 font-serif">
              James
              <span className="text-[9px] bg-[#1F1F1F] text-[#C5A059] border border-[#3D3D3D] px-1.5 py-0.2 rounded font-mono uppercase tracking-wider">
                AI Estimator
              </span>
            </span>
            <span className="text-[10px] text-[#8E8E8E]">Need help with D&amp;G matrix?</span>
          </div>
        </button>
      )}

      {/* Floating Chat Drawer Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[92vw] sm:w-[400px] md:w-[440px] h-[580px] max-h-[88vh] bg-[#141414] border border-[#2D2D2D] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in font-sans">
          {/* Header */}
          <div className="p-4 bg-[#141414] border-b border-[#2D2D2D] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative w-9 h-9 rounded-full bg-[#1F1F1F] border border-[#C5A059] flex items-center justify-center text-[#C5A059]">
                <Bot className="w-5 h-5" />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#141414]"></span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#E0DED7] font-serif flex items-center gap-2">
                  James
                  <span className="text-[9px] bg-[#1F1F1F] text-[#C5A059] border border-[#3D3D3D] px-2 py-0.5 rounded-full font-mono uppercase tracking-wider">
                    D&amp;G 2025 AI
                  </span>
                </h3>
                <p className="text-[11px] text-[#8E8E8E]">
                  PDR Hail Valuation &amp; Supplement Specialist
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-[#8E8E8E]">
              <button
                onClick={handleResetChat}
                title="Reset Conversation"
                className="p-1.5 hover:text-[#E0DED7] hover:bg-[#1F1F1F] rounded-full transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close Assistant"
                className="p-1.5 hover:text-[#E0DED7] hover:bg-[#1F1F1F] rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Context Strip */}
          <div className="px-4 py-2 bg-[#1F1F1F] border-b border-[#2D2D2D] flex items-center justify-between text-[11px] font-mono text-[#8E8E8E]">
            <div className="truncate max-w-[240px]">
              <span className="text-[#C5A059]">Active:</span> {estimate.vehicle.year || '2024'} {estimate.vehicle.make || 'Vehicle'} {estimate.vehicle.model || ''}
            </div>
            <div className="text-[#C5A059] font-bold">
              ${estimate.summary.grandTotal.toLocaleString()}
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-[#0F0F0F]/60">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'model' && (
                  <div className="w-7 h-7 rounded-full bg-[#1F1F1F] border border-[#3D3D3D] flex items-center justify-center text-[#C5A059] shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#C5A059] text-[#0F0F0F] font-medium rounded-br-none'
                      : 'bg-[#1F1F1F] text-[#E0DED7] border border-[#2D2D2D] rounded-bl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  <span
                    className={`block text-[9px] mt-1.5 font-mono ${
                      msg.role === 'user' ? 'text-[#0F0F0F]/70 text-right' : 'text-[#8E8E8E]'
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-7 h-7 rounded-full bg-[#1F1F1F] border border-[#3D3D3D] flex items-center justify-center text-[#C5A059] shrink-0 animate-spin">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div className="bg-[#1F1F1F] text-[#8E8E8E] border border-[#2D2D2D] px-3.5 py-2 rounded-2xl rounded-bl-none text-xs flex items-center gap-2">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#C5A059] animate-pulse"></span>
                  <span>James is analyzing D&amp;G 2025 rules...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Action Suggestion Chips */}
          <div className="p-2.5 bg-[#141414] border-t border-[#2D2D2D] overflow-x-auto flex items-center gap-1.5 no-scrollbar">
            <button
              onClick={() => handleQuickPrompt("Analyze my current vehicle estimate")}
              className="bg-[#1F1F1F] hover:bg-[#252525] text-[#C5A059] border border-[#3D3D3D] text-[11px] px-2.5 py-1 rounded-full whitespace-nowrap transition-colors flex items-center gap-1"
            >
              <Car className="w-3 h-3 text-[#C5A059]" />
              Analyze Estimate
            </button>

            <button
              onClick={() => handleQuickPrompt("How are +25% aluminum markups calculated?")}
              className="bg-[#1F1F1F] hover:bg-[#252525] text-[#E0DED7] border border-[#3D3D3D] text-[11px] px-2.5 py-1 rounded-full whitespace-nowrap transition-colors flex items-center gap-1"
            >
              <Layers className="w-3 h-3 text-[#C5A059]" />
              Aluminum Markup
            </button>

            <button
              onClick={() => handleQuickPrompt("What are the rules for Oversize (+$50) dents?")}
              className="bg-[#1F1F1F] hover:bg-[#252525] text-[#E0DED7] border border-[#3D3D3D] text-[11px] px-2.5 py-1 rounded-full whitespace-nowrap transition-colors flex items-center gap-1"
            >
              <DollarSign className="w-3 h-3 text-[#C5A059]" />
              Oversize Dents
            </button>

            <button
              onClick={() => handleQuickPrompt("What are standard R&I labor hours for headliner & trim?")}
              className="bg-[#1F1F1F] hover:bg-[#252525] text-[#E0DED7] border border-[#3D3D3D] text-[11px] px-2.5 py-1 rounded-full whitespace-nowrap transition-colors flex items-center gap-1"
            >
              <Wrench className="w-3 h-3 text-[#C5A059]" />
              R&amp;I Labor Hours
            </button>
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-[#141414] border-t border-[#2D2D2D] flex items-center gap-2"
          >
            <input
              ref={inputRef}
              id="james-ai-input"
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask James about hail appraisal or matrix rules..."
              className="flex-1 bg-[#1F1F1F] border border-[#3D3D3D] focus:border-[#C5A059] rounded-full px-4 py-2 text-xs text-[#E0DED7] placeholder:text-[#8E8E8E] focus:outline-none transition-colors"
            />
            <button
              id="james-ai-send-btn"
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="bg-[#C5A059] hover:bg-[#B38F48] disabled:opacity-40 text-[#0F0F0F] p-2 rounded-full transition-colors shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
