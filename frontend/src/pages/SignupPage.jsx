import React, { useState } from 'react';
import {
  Scale, Lock, Mail, Eye, EyeOff, AlertCircle, ArrowRight,
  User, Phone, Award, GraduationCap, ShieldCheck, CheckCircle2, Users,
} from 'lucide-react';
import api from '../services/api';

const ROLES = [
  {
    id: 'CITIZEN',
    label: 'Citizen',
    sub: 'Case navigation & legal notices',
    icon: Users,
    gradient: 'from-blue-500 to-sky-400',
    bgActive: 'bg-blue-50 border-blue-300',
    iconColor: 'text-blue-600',
  },
  {
    id: 'LAWYER',
    label: 'Advocate',
    sub: 'Case briefs & Bar directory',
    icon: Award,
    gradient: 'from-legal-gold to-amber-400',
    bgActive: 'bg-amber-50 border-amber-300',
    iconColor: 'text-amber-600',
  },
  {
    id: 'LAW_STUDENT',
    label: 'Law Student',
    sub: 'Research & legal clinic',
    icon: GraduationCap,
    gradient: 'from-emerald-500 to-teal-400',
    bgActive: 'bg-emerald-50 border-emerald-300',
    iconColor: 'text-emerald-600',
  },
];

const TRUST_ITEMS = [
  { icon: ShieldCheck, label: '256-bit AES encrypted', color: 'text-emerald-500' },
  { icon: CheckCircle2, label: 'Bar Council verified', color: 'text-legal-gold' },
  { icon: Lock, label: 'PII sanitized & private', color: 'text-sky-400' },
];

export default function SignupPage({ onAuthSuccess, onNavigateToLogin }) {
  const [role, setRole]               = useState('CITIZEN');
  const [fullName, setFullName]       = useState('');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [phone, setPhone]             = useState('');
  const [city, setCity]               = useState('');
  const [state, setState]             = useState('');
  const [barRegNumber, setBarReg]     = useState('');
  const [institution, setInstitution] = useState('');
  const [showPassword, setShowPass]   = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload = {
        email: email.trim().toLowerCase(),
        password,
        role,
        phone,
        profileData: {
          fullName,
          location: { city, state },
          ...(role === 'LAWYER'      && { barCouncilRegistration: { registrationNumber: barRegNumber } }),
          ...(role === 'LAW_STUDENT' && { lawStudentDetails: { institution } }),
        },
      };
      const res = await api.post('/auth/signup', payload);
      const { user, tokens } = res.data.data;
      localStorage.setItem('nyaya_access_token', tokens.accessToken);
      if (tokens.refreshToken) localStorage.setItem('nyaya_refresh_token', tokens.refreshToken);
      onAuthSuccess(user);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-legal-blue focus:bg-white transition';
  const labelClass = 'block text-xs font-bold text-slate-700 mb-1.5';

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
      <div className="w-full max-w-4xl bg-white rounded-3xl border border-slate-200/90 shadow-card overflow-hidden flex flex-col lg:flex-row">

        {/* ── Left Brand Panel ─────────────────────────────────── */}
        <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-[#071422] via-[#0B1F33] to-[#0d2a4a] p-10 lg:w-2/5 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-legal-gold/8 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-10">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-legal-blue to-sky-400 flex items-center justify-center shadow-md">
                <Scale className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-base font-extrabold text-white tracking-tight">Legal Nexus</div>
                <div className="text-[10px] text-slate-400 font-medium">Enterprise Legal AI</div>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-white leading-tight mb-3">
              Join India's Premier<br />AI Legal Platform
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed mb-8">
              Citizens, advocates, and law students — each with purpose-built workspaces for legal access and intelligence.
            </p>

            {/* Role summary */}
            <div className="space-y-4">
              {ROLES.map((r) => {
                const Icon = r.icon;
                return (
                  <div key={r.id} className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${r.gradient} flex items-center justify-center shrink-0 shadow-sm`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{r.label}</p>
                      <p className="text-[10px] text-slate-500">{r.sub}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Trust badges */}
          <div className="relative z-10 flex flex-col gap-2 mt-8">
            {TRUST_ITEMS.map((t, i) => {
              const Icon = t.icon;
              return (
                <div key={i} className="flex items-center gap-2 bg-white/8 border border-white/10 px-3 py-2 rounded-xl text-[10px] text-slate-300 font-semibold">
                  <Icon className={`w-3.5 h-3.5 ${t.color}`} />
                  {t.label}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Right Form Panel ──────────────────────────────────── */}
        <div className="flex-1 p-7 sm:p-9 flex flex-col justify-center space-y-5 overflow-y-auto">
          {/* Mobile logo */}
          <div className="flex lg:hidden justify-center">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-legal-blue to-sky-400 flex items-center justify-center shadow-md">
              <Scale className="w-6 h-6 text-white" />
            </div>
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Create your account</h1>
            <p className="text-sm text-slate-500">Select your role and fill in your details</p>
          </div>

          {/* Role card picker */}
          <div className="grid grid-cols-3 gap-3">
            {ROLES.map((r) => {
              const Icon = r.icon;
              const active = role === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRole(r.id)}
                  className={`relative py-4 px-2 rounded-2xl border-2 transition-all duration-200 flex flex-col items-center gap-2 text-center ${
                    active
                      ? `${r.bgActive} shadow-md`
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {active && (
                    <span className="absolute top-2 right-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-legal-blue" />
                    </span>
                  )}
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${r.gradient} flex items-center justify-center shadow-sm`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className={`text-xs font-bold ${active ? r.iconColor : 'text-slate-700'}`}>{r.label}</p>
                    <p className="text-[9px] text-slate-400 leading-tight mt-0.5 hidden sm:block">{r.sub}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {error && (
            <div className="p-3.5 bg-red-50 text-red-800 rounded-2xl border border-red-200 text-xs flex items-center gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* Full name */}
              <div>
                <label className={labelClass}>Full Legal Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input type="text" required autoComplete="off" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Rajesh Kumar" className={inputClass} />
                </div>
              </div>
              {/* Email */}
              <div>
                <label className={labelClass}>Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input type="email" required autoComplete="new-password" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter email address" className={inputClass} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* Password */}
              <div>
                <label className={labelClass}>Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input type={showPassword ? 'text' : 'password'} required autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 8 characters" className={`${inputClass} pr-10`} />
                  <button type="button" onClick={() => setShowPass(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {/* Phone */}
              <div>
                <label className={labelClass}>Phone Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input type="tel" autoComplete="off" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 9876543210" className={inputClass} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div>
                <label className={labelClass}>City</label>
                <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Delhi" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-legal-blue focus:bg-white transition" />
              </div>
              <div>
                <label className={labelClass}>State</label>
                <input type="text" value={state} onChange={(e) => setState(e.target.value)} placeholder="e.g. Delhi" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-legal-blue focus:bg-white transition" />
              </div>
            </div>

            {/* Role-specific fields */}
            {role === 'LAWYER' && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2 animate-in fade-in">
                <label className="block text-xs font-bold text-amber-700 uppercase tracking-wider">
                  Bar Council Enrolment Number
                </label>
                <input
                  type="text"
                  required
                  value={barRegNumber}
                  onChange={(e) => setBarReg(e.target.value)}
                  placeholder="e.g. D/1234/2020"
                  className="w-full px-4 py-2.5 bg-white border border-amber-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            )}
            {role === 'LAW_STUDENT' && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2 animate-in fade-in">
                <label className="block text-xs font-bold text-emerald-700 uppercase tracking-wider">
                  Law College / University Institution
                </label>
                <input
                  type="text"
                  required
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="e.g. Faculty of Law, University of Delhi"
                  className="w-full px-4 py-2.5 bg-white border border-emerald-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-shimmer w-full py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-slate-300 disabled:text-slate-500 text-white font-bold text-sm rounded-2xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4 text-white" />
                </>
              )}
            </button>
          </form>

          <div className="text-center text-sm text-slate-500">
            <span>Already have an account? </span>
            <button type="button" onClick={onNavigateToLogin} className="text-legal-blue font-bold hover:underline">
              Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
