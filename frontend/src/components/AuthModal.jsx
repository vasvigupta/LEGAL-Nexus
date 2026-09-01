import React, { useState } from 'react';
import {
  X,
  User,
  Lock,
  Mail,
  Phone,
  Briefcase,
  GraduationCap,
  Eye,
  EyeOff,
  Scale,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import api from '../services/api';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup' | 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('CITIZEN');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [practiceAreas, setPracticeAreas] = useState('');
  const [barNumber, setBarNumber] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (authMode === 'signup') {
        const profileData = { fullName };
        if (role === 'LAWYER' || role === 'LAW_STUDENT') {
          profileData.practiceAreas = practiceAreas.split(',').map((s) => s.trim()).filter(Boolean);
          if (barNumber) {
            profileData.barCouncilRegistration = { registrationNumber: barNumber };
          }
        }

        const res = await api.post('/auth/signup', {
          email,
          password,
          role,
          phone,
          profileData,
        });

        localStorage.setItem('nyaya_access_token', res.data.data.tokens.accessToken);
        localStorage.setItem('nyaya_refresh_token', res.data.data.tokens.refreshToken);
        onAuthSuccess(res.data.data.user);
        onClose();
      } else if (authMode === 'login') {
        const res = await api.post('/auth/login', { email, password });
        localStorage.setItem('nyaya_access_token', res.data.data.tokens.accessToken);
        localStorage.setItem('nyaya_refresh_token', res.data.data.tokens.refreshToken);
        onAuthSuccess(res.data.data.user);
        onClose();
      } else if (authMode === 'forgot') {
        // Simulate forgot password response
        setTimeout(() => {
          setForgotSent(true);
          setLoading(false);
        }, 1000);
        return;
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed. Please check your credentials.');
    } finally {
      if (authMode !== 'forgot') {
        setLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 my-6 grid grid-cols-1 md:grid-cols-12">
        {/* Left Branding Pane (5 cols on md+) */}
        <div className="hidden md:flex md:col-span-5 bg-gradient-to-br from-[#071422] via-[#0B1F33] to-[#0A2540] text-white p-7 flex-col justify-between border-r border-slate-800 relative overflow-hidden">
          <div className="absolute -top-12 -left-12 w-48 h-48 bg-legal-blue/20 rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-legal-gold/10 rounded-full blur-2xl pointer-events-none"></div>

          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-legal-blue to-sky-400 p-1.5 text-white shadow-md flex items-center justify-center">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-extrabold text-white block">Legal Nexus</span>
                <span className="text-[10px] text-legal-gold font-bold">Enterprise AI</span>
              </div>
            </div>

            <div className="pt-4 space-y-3">
              <h4 className="text-sm font-bold text-slate-100 leading-snug">
                Empowering Citizens & Counsel with Precision AI
              </h4>
              <div className="space-y-2.5 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Statute-Grounded Hybrid RAG</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Verified Advocate Network</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>256-Bit PII Data Masking</span>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-6 border-t border-slate-800/80 text-[11px] text-slate-400">
            <p className="italic">"Bridging legal asymmetry through verifiable statutory intelligence."</p>
          </div>
        </div>

        {/* Right Form Pane (7 cols on md+) */}
        <div className="md:col-span-7 p-6 sm:p-7 flex flex-col justify-between">
          <div>
            {/* Top Modal Controls */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 border-b border-slate-200 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setError(null);
                    setForgotSent(false);
                  }}
                  className={`pb-2 px-1 transition ${
                    authMode === 'login'
                      ? 'border-b-2 border-legal-blue text-legal-blue font-extrabold'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signup');
                    setError(null);
                    setForgotSent(false);
                  }}
                  className={`pb-2 px-1 transition ${
                    authMode === 'signup'
                      ? 'border-b-2 border-legal-blue text-legal-blue font-extrabold'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Create Account
                </button>
              </div>

              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-700 transition p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 mb-4 text-xs bg-red-50 text-red-800 rounded-xl border border-red-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            {/* FORGOT PASSWORD VIEW */}
            {authMode === 'forgot' ? (
              <div className="space-y-4 py-2">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-900">Reset Account Access</h3>
                  <p className="text-xs text-slate-500">
                    Enter your registered email address to receive password reset instructions.
                  </p>
                </div>

                {forgotSent ? (
                  <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200 space-y-2 text-xs">
                    <span className="font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Reset Instructions Sent!
                    </span>
                    <p className="text-[11px] text-emerald-700">
                      If an account exists for {email}, a recovery link has been dispatched.
                    </p>
                    <button
                      type="button"
                      onClick={() => setAuthMode('login')}
                      className="mt-2 text-legal-blue font-bold hover:underline block"
                    >
                      Return to Sign In
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="advocate@example.com"
                          className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-legal-blue focus:outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:bg-slate-300 disabled:text-slate-500"
                    >
                      {loading ? (
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      ) : (
                        'Send Recovery Link'
                      )}
                    </button>

                    <div className="text-center pt-1">
                      <button
                        type="button"
                        onClick={() => setAuthMode('login')}
                        className="text-xs text-slate-500 hover:text-legal-blue font-semibold"
                      >
                        Back to Login
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ) : (
              /* LOGIN & SIGNUP FORMS */
              <form onSubmit={handleSubmit} autoComplete="off" className="space-y-3.5">
                {/* Role Selector during signup */}
                {authMode === 'signup' && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                      Account Type:
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'CITIZEN', label: 'Citizen', icon: User },
                        { id: 'LAWYER', label: 'Advocate', icon: Briefcase },
                        { id: 'LAW_STUDENT', label: 'Student', icon: GraduationCap },
                      ].map((r) => {
                        const Icon = r.icon;
                        const active = role === r.id;
                        return (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => setRole(r.id)}
                            className={`p-2 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition ${
                              active
                                ? 'border-legal-blue bg-blue-50/80 text-legal-blue ring-1 ring-legal-blue'
                                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <Icon className={`w-4 h-4 ${active ? 'text-legal-blue' : 'text-slate-400'}`} />
                            <span>{r.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {authMode === 'signup' && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Full Legal Name</label>
                    <input
                      type="text"
                      required
                      autoComplete="off"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Adv. Rajesh Kumar"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-legal-blue focus:outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      autoComplete="new-password"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter email address"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-legal-blue focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-slate-700">Password</label>
                    {authMode === 'login' && (
                      <button
                        type="button"
                        onClick={() => setAuthMode('forgot')}
                        className="text-[10px] text-legal-blue hover:underline font-semibold"
                      >
                        Forgot Password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-legal-blue focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {authMode === 'signup' && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Phone (Optional)</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 9876543210"
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-legal-blue focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {authMode === 'signup' && (role === 'LAWYER' || role === 'LAW_STUDENT') && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      {role === 'LAWYER' ? 'Bar Registration / Enrolment No' : 'Law Faculty / Roll No'}
                    </label>
                    <input
                      type="text"
                      value={barNumber}
                      onChange={(e) => setBarNumber(e.target.value)}
                      placeholder={role === 'LAWYER' ? 'e.g. D/1234/2020' : 'e.g. Faculty of Law, Delhi University'}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-legal-blue focus:outline-none"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl font-bold text-xs shadow-md transition duration-150 disabled:bg-slate-300 disabled:text-slate-500 disabled:opacity-50 flex items-center justify-center gap-2 mt-2 cursor-pointer"
                >
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : authMode === 'signup' ? (
                    <>
                      <span>Complete Registration</span>
                      <ArrowRight className="w-4 h-4 text-white" />
                    </>
                  ) : (
                    <>
                      <span>Sign In to Platform</span>
                      <ArrowRight className="w-4 h-4 text-white" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          <div className="text-center pt-3 border-t border-slate-100 text-[11px] text-slate-500">
            {authMode === 'signup' ? (
              <span>
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className="text-legal-blue font-bold hover:underline"
                >
                  Sign in here
                </button>
              </span>
            ) : (
              <span>
                New to Legal Nexus?{' '}
                <button
                  type="button"
                  onClick={() => setAuthMode('signup')}
                  className="text-legal-blue font-bold hover:underline"
                >
                  Create free account
                </button>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
