import React from 'react';
import {
  Scale,
  LogOut,
  LogIn,
  Menu,
  X,
  Sparkles,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';

export default function Navbar({
  user,
  onOpenAuth,
  onLogout,
  isMobileOpen,
  onToggleMobileMenu,
  showToggle,
  activeTab = 'landing',
  onSelectTab,
}) {
  const getTabTitle = (tab) => {
    switch (tab) {
      case 'cases':     return 'Case Management & Intake';
      case 'intake':    return 'AI Legal Assistant & Workspace';
      case 'documents': return 'Document Intelligence & Clause Audit';
      case 'drafts':    return 'Smart Statutory Drafting Engine';
      case 'research':  return 'Statutory Legal Search';
      case 'lawyers':   return 'Verified Advocate Ecosystem';
      case 'admin':     return 'Admin Verification & Compliance Console';
      case 'profile':   return 'User Profile & Network Hub';
      case 'settings':  return 'Platform Settings';
      case 'system':    return 'System Infrastructure Monitor';
      default:          return 'Legal Intelligence Platform';
    }
  };

  // Role → color mapping for avatar
  const roleColor = {
    CITIZEN:     'from-blue-500 to-sky-400',
    LAWYER:      'from-legal-gold to-amber-400',
    LAW_STUDENT: 'from-emerald-500 to-teal-400',
    ADMIN:       'from-purple-500 to-violet-400',
  };
  const avatarGradient = user ? (roleColor[user.role] || 'from-blue-500 to-sky-400') : '';

  return (
    <header className="bg-[#0B1F33] border-b border-slate-800/80 text-white h-16 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-lg backdrop-blur-md">

      {/* ── Left: Brand + Breadcrumb ─────────────────────────── */}
      <div className="flex items-center gap-3 sm:gap-5">
        <div
          onClick={() => onSelectTab && onSelectTab('landing')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          {/* Logo */}
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-legal-blue to-sky-400 flex items-center justify-center shadow-blue-glow/30 shadow-md group-hover:scale-105 transition-transform duration-200">
            <Scale className="w-5 h-5 text-white" />
            {/* Subtle animated ring */}
            <span className="absolute inset-0 rounded-xl ring-2 ring-sky-400/0 group-hover:ring-sky-400/40 transition-all duration-300" />
          </div>

          <div className="hidden sm:block">
            <div className="flex items-center gap-1.5">
              <span className="text-[15px] font-extrabold tracking-tight text-white leading-none">
                Legal Nexus
              </span>
              <span className="text-[9px] font-bold text-legal-gold bg-legal-gold/10 px-1.5 py-0.5 rounded border border-legal-gold/20 tracking-widest uppercase leading-none">
                AI
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5 leading-none">Enterprise Legal AI</p>
          </div>
        </div>

        {/* Breadcrumb */}
        {activeTab !== 'landing' && (
          <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400 pl-4 border-l border-slate-800">
            <span
              onClick={() => onSelectTab && onSelectTab('landing')}
              className="hover:text-slate-300 cursor-pointer transition"
            >
              Platform
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-700" />
            <span className="text-slate-300 font-semibold truncate max-w-[220px]">
              {getTabTitle(activeTab)}
            </span>
          </div>
        )}
      </div>

      {/* ── Right: Actions ───────────────────────────────────── */}
      <div className="flex items-center gap-2 sm:gap-3">





        {/* User chip or auth buttons */}
        {user ? (
          <div className="flex items-center gap-2 bg-slate-800/80 pl-1.5 pr-1.5 py-1.5 rounded-xl border border-slate-700/80 shadow-sm">
            {/* Gradient avatar */}
            <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${avatarGradient || 'from-blue-500 to-sky-400'} flex items-center justify-center text-white text-[11px] font-extrabold shadow-sm shrink-0`}>
              {(user.profileData?.fullName || user.email || 'U').charAt(0).toUpperCase()}
            </div>

            <div className="hidden sm:flex flex-col text-right pr-1 min-w-0">
              <span className="text-xs font-bold text-white truncate max-w-[120px]" title={user.email || 'User'}>
                {user.profileData?.fullName || (user.email ? user.email.split('@')[0] : 'User')}
              </span>
              <span className="text-[9px] font-extrabold text-legal-gold uppercase tracking-wider leading-none mt-0.5">
                {user.role || 'CITIZEN'}
              </span>
            </div>

            <button
              onClick={() => onSelectTab && onSelectTab('profile')}
              title="View Profile"
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
              </svg>
            </button>

            <div className="w-px h-5 bg-slate-700 mx-0.5" />

            <button
              onClick={onLogout}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onSelectTab && onSelectTab('login')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-200 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-xl border border-slate-700 hover:border-slate-600 transition"
            >
              <LogIn className="w-3.5 h-3.5 text-legal-gold" />
              Sign In
            </button>
            <button
              onClick={() => onSelectTab && onSelectTab('signup')}
              className="btn-shimmer inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-gradient-to-r from-legal-blue to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white rounded-xl shadow-md shadow-legal-blue/20 transition transform active:scale-95"
            >
              <Sparkles className="w-3 h-3 text-legal-gold" />
              Get Started
            </button>
          </div>
        )}

        {/* Mobile menu toggle */}
        {showToggle && (
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition"
            aria-label="Toggle Navigation Menu"
          >
            {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        )}
      </div>
    </header>
  );
}
