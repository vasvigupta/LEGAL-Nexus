import React, { useState } from 'react';
import {
  Scale,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Bot,
  FileText,
  PenTool,
} from 'lucide-react';
import api from '../services/api';

const FEATURES = [
  { icon: Bot,      label: 'AI Legal Assistant',    desc: 'Multilingual case intake' },
  { icon: FileText, label: 'Document Intelligence', desc: 'Contract audit & OCR' },
  { icon: PenTool,  label: 'Draft Generator',       desc: '7 legal notice templates' },
];

export default function LoginPage({ onAuthSuccess, onNavigateToSignup, onForgotPassword }) {
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [showPassword, setShowPass] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email: email.trim().toLowerCase(), password });
      const { user, tokens } = res.data.data;
      localStorage.setItem('nyaya_access_token', tokens.accessToken);
      if (tokens.refreshToken) localStorage.setItem('nyaya_refresh_token', tokens.refreshToken);
      onAuthSuccess(user);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
      <div className="w-full max-w-4xl bg-white rounded-3xl border border-slate-200/90 shadow-card overflow-hidden flex flex-col lg:flex-row">

        {/* ── Left Brand Panel ────────────────────────────────────── */}
        <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-[#071422] via-[#0B1F33] to-[#0d2a4a] p-10 lg:w-2/5 relative overflow-hidden">
          {/* Glow blobs */}
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

            {/* Tagline */}
            <h2 className="text-2xl font-bold text-white leading-tight mb-3">
              Your AI-Powered<br />Legal Intelligence Hub
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed mb-8">
              Access case management, statutory research, contract auditing, and verified advocate matching — all in one platform.
            </p>

            {/* Feature list */}
            <div className="space-y-4">
              {FEATURES.map((f, i) => {
                const Icon = f.icon;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white/8 border border-white/10 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-sky-400" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{f.label}</p>
                      <p className="text-[10px] text-slate-500">{f.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Trust badges */}
          <div className="relative z-10 flex items-center gap-3 mt-8">
            <div className="flex items-center gap-1.5 bg-white/8 border border-white/10 px-3 py-2 rounded-xl text-[10px] text-slate-300 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              256-bit Encrypted
            </div>
            <div className="flex items-center gap-1.5 bg-white/8 border border-white/10 px-3 py-2 rounded-xl text-[10px] text-slate-300 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-legal-gold" />
              Bar Council Verified
            </div>
          </div>
        </div>

        {/* ── Right Form Panel ────────────────────────────────────── */}
        <div className="flex-1 p-8 sm:p-10 flex flex-col justify-center space-y-6">
          {/* Mobile logo */}
          <div className="flex lg:hidden justify-center">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-legal-blue to-sky-400 flex items-center justify-center shadow-md">
              <Scale className="w-6 h-6 text-white" />
            </div>
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Welcome back</h1>
            <p className="text-sm text-slate-500">Sign in to access your legal workspace</p>
          </div>

          {error && (
            <div className="p-3.5 bg-red-50 text-red-800 rounded-2xl border border-red-200 text-xs flex items-center gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  autoComplete="off"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-legal-blue focus:bg-white transition"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">Password</label>
                {onForgotPassword && (
                  <button type="button" onClick={onForgotPassword} className="text-xs text-legal-blue hover:underline font-semibold">
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-legal-blue focus:bg-white transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-shimmer w-full py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-slate-300 disabled:text-slate-500 text-white font-bold text-sm rounded-2xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to Workspace</span>
                  <ArrowRight className="w-4 h-4 text-white" />
                </>
              )}
            </button>
          </form>

          {/* Switch to signup */}
          <div className="text-center text-sm text-slate-500 pt-2 border-t border-slate-100">
            <span>Don't have an account? </span>
            <button type="button" onClick={onNavigateToSignup} className="text-legal-blue font-bold hover:underline">
              Create an Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
