import React, { useState } from 'react';
import { UserProfile, Estimate } from '../types';
import { loginUser, registerUser } from '../utils/api';
import { 
  ShieldCheck, 
  User, 
  Mail, 
  Building2, 
  Briefcase, 
  DollarSign, 
  ArrowRight, 
  Lock,
  Loader2,
  X,
  Sparkles,
  CheckCircle2,
  KeyRound
} from 'lucide-react';

interface AuthModalProps {
  onLoginSuccess: (user: UserProfile, savedEstimate?: Estimate | null) => void;
  initialEmail?: string;
  onClose?: () => void;
  isDismissable?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({ 
  onLoginSuccess, 
  initialEmail = '', 
  onClose,
  isDismissable = false 
}) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState(initialEmail || 'evangelosneobarberis@gmail.com');
  const [password, setPassword] = useState('pdrlogic2025');
  const [name, setName] = useState('Evangelos Neo Barberis');
  const [company, setCompany] = useState('PDR Logic Mobile Team');
  const [role, setRole] = useState('Master Appraiser');
  const [hourlyRate, setHourlyRate] = useState<number>(75);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter a valid email address.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      if (isRegistering) {
        const data = await registerUser({
          name: name.trim() || email.split('@')[0],
          email: email.trim().toLowerCase(),
          password: password || 'pdrlogic2025',
          company: company.trim() || 'PDR Logic Appraisers',
          role: role.trim() || 'Technician',
          hourlyRIRate: hourlyRate,
        });

        if (rememberMe) {
          localStorage.setItem('pdr_logic_user', JSON.stringify(data.user));
        }
        onLoginSuccess(data.user, data.savedEstimate);
      } else {
        const data = await loginUser(email.trim().toLowerCase(), password || 'pdrlogic2025');

        if (rememberMe) {
          localStorage.setItem('pdr_logic_user', JSON.stringify(data.user));
        }
        onLoginSuccess(data.user, data.savedEstimate);
      }
    } catch (err: any) {
      console.warn('Authentication note:', err);
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectQuickProfile = (profile: { name: string; email: string; company: string; role: string; rate: number }) => {
    setName(profile.name);
    setEmail(profile.email);
    setCompany(profile.company);
    setRole(profile.role);
    setHourlyRate(profile.rate);
    setPassword('pdrlogic2025');
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F0F0F]/95 backdrop-blur-md p-4 overflow-y-auto animate-fade-in font-sans">
      <div className="relative w-full max-w-md bg-[#141414] border border-[#2D2D2D] rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Top Gold Accent Bar */}
        <div className="h-1.5 w-full bg-[#C5A059]" />

        {/* Close Button if dismissable */}
        {isDismissable && onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-[#8E8E8E] hover:text-[#E0DED7] rounded-full hover:bg-[#1F1F1F] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Brand Header */}
        <div className="p-6 pb-4 text-center border-b border-[#2D2D2D]/60 bg-[#141414]">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#1F1F1F] border border-[#C5A059]/50 text-[#C5A059] shadow-inner mb-3">
            <ShieldCheck className="w-6 h-6 text-[#C5A059]" />
          </div>
          <h1 className="text-xl font-bold font-serif text-[#E0DED7] tracking-wide flex items-center justify-center gap-2">
            <span className="text-[#C5A059]">PDR</span> LOGIC
          </h1>
          <p className="text-xs text-[#8E8E8E] mt-1 font-mono uppercase tracking-widest">
            Secure Hail Damage Appraisal Portal
          </p>
        </div>

        {/* Sign In / Sign Up Mode Toggle */}
        <div className="px-6 pt-4 flex border-b border-[#2D2D2D]">
          <button
            id="auth-tab-signin"
            type="button"
            onClick={() => {
              setIsRegistering(false);
              setError(null);
            }}
            className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
              !isRegistering
                ? 'border-[#C5A059] text-[#C5A059]'
                : 'border-transparent text-[#8E8E8E] hover:text-[#E0DED7]'
            }`}
          >
            Sign In
          </button>
          <button
            id="auth-tab-register"
            type="button"
            onClick={() => {
              setIsRegistering(true);
              setError(null);
            }}
            className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
              isRegistering
                ? 'border-[#C5A059] text-[#C5A059]'
                : 'border-transparent text-[#8E8E8E] hover:text-[#E0DED7]'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-lg text-red-300 text-xs">
              {error}
            </div>
          )}

          {isRegistering && (
            <div>
              <label className="block text-[11px] font-mono text-[#8E8E8E] uppercase tracking-wider mb-1.5">
                Estimator Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#8E8E8E] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="auth-name-input"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Evangelos Barberis"
                  className="w-full bg-[#1F1F1F] border border-[#2D2D2D] focus:border-[#C5A059] rounded-lg pl-10 pr-3.5 py-2.5 text-xs text-[#E0DED7] placeholder:text-[#8E8E8E] focus:outline-none transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-mono text-[#8E8E8E] uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#8E8E8E] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="auth-email-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tech@pdrlogic.com"
                className="w-full bg-[#1F1F1F] border border-[#2D2D2D] focus:border-[#C5A059] rounded-lg pl-10 pr-3.5 py-2.5 text-xs text-[#E0DED7] placeholder:text-[#8E8E8E] focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono text-[#8E8E8E] uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Password</span>
              <span className="text-[10px] text-[#8E8E8E] lowercase">Default: pdrlogic2025</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#8E8E8E] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="auth-password-input"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full bg-[#1F1F1F] border border-[#2D2D2D] focus:border-[#C5A059] rounded-lg pl-10 pr-3.5 py-2.5 text-xs text-[#E0DED7] placeholder:text-[#8E8E8E] focus:outline-none transition-colors font-mono"
              />
            </div>
          </div>

          {isRegistering && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-[#8E8E8E] uppercase tracking-wider mb-1.5">
                    Company / Shop
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-[#8E8E8E] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="auth-company-input"
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="Shop Name"
                      className="w-full bg-[#1F1F1F] border border-[#2D2D2D] focus:border-[#C5A059] rounded-lg pl-9 pr-2.5 py-2.5 text-xs text-[#E0DED7] placeholder:text-[#8E8E8E] focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-[#8E8E8E] uppercase tracking-wider mb-1.5">
                    Role
                  </label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 text-[#8E8E8E] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="auth-role-input"
                      type="text"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      placeholder="e.g. Lead Appraiser"
                      className="w-full bg-[#1F1F1F] border border-[#2D2D2D] focus:border-[#C5A059] rounded-lg pl-9 pr-2.5 py-2.5 text-xs text-[#E0DED7] placeholder:text-[#8E8E8E] focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[#8E8E8E] uppercase tracking-wider mb-1.5">
                  Standard R&amp;I Labor Rate ($/hr)
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-[#C5A059] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="auth-rate-input"
                    type="number"
                    min="40"
                    max="250"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(Number(e.target.value))}
                    className="w-full bg-[#1F1F1F] border border-[#2D2D2D] focus:border-[#C5A059] rounded-lg pl-10 pr-3.5 py-2.5 text-xs font-mono text-[#E0DED7] focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </>
          )}

          {/* Remember Me Checkbox */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                id="auth-remember-checkbox"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-[#2D2D2D] bg-[#1F1F1F] text-[#C5A059] focus:ring-0 focus:ring-offset-0"
              />
              <span className="text-xs text-[#8E8E8E]">Remember session</span>
            </label>
            <span className="text-[11px] text-[#C5A059] font-mono flex items-center gap-1">
              <KeyRound className="w-3 h-3" /> Secure JWT
            </span>
          </div>

          {/* Submit Button */}
          <button
            id="auth-submit-btn"
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 bg-[#C5A059] hover:bg-[#B38F48] disabled:opacity-50 text-[#0F0F0F] font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>{isRegistering ? 'Create Account & Access App' : 'Sign In to Workspace'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Profiles Strip */}
        <div className="p-4 bg-[#0F0F0F] border-t border-[#2D2D2D]">
          <div className="text-[10px] uppercase font-mono text-[#8E8E8E] tracking-wider mb-2 flex items-center justify-between">
            <span>Quick Access Accounts:</span>
            <span className="text-[#C5A059]">1-Tap Demo Sign-in</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              id="demo-profile-evangelos"
              type="button"
              onClick={() => {
                selectQuickProfile({
                  name: 'Evangelos Neo Barberis',
                  email: 'evangelosneobarberis@gmail.com',
                  company: 'PDR Logic Mobile Team',
                  role: 'Master Appraiser',
                  rate: 75,
                });
              }}
              className="text-left p-2.5 rounded-lg bg-[#141414] hover:bg-[#1F1F1F] border border-[#2D2D2D] hover:border-[#C5A059] transition-colors group"
            >
              <div className="text-xs font-bold text-[#E0DED7] group-hover:text-[#C5A059] truncate">Evangelos Neo Barberis</div>
              <div className="text-[10px] text-[#8E8E8E] font-mono truncate">evangelosneobarberis@gmail.com</div>
            </button>

            <button
              id="demo-profile-rob"
              type="button"
              onClick={() => {
                selectQuickProfile({
                  name: 'Rob Aloe',
                  email: 'rob.aloe@pdrlogic.com',
                  company: 'Apex Hail Specialists',
                  role: 'Senior Master Tech',
                  rate: 85,
                });
              }}
              className="text-left p-2.5 rounded-lg bg-[#141414] hover:bg-[#1F1F1F] border border-[#2D2D2D] hover:border-[#C5A059] transition-colors group"
            >
              <div className="text-xs font-bold text-[#E0DED7] group-hover:text-[#C5A059] truncate">Rob Aloe</div>
              <div className="text-[10px] text-[#8E8E8E] font-mono truncate">rob.aloe@pdrlogic.com</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
