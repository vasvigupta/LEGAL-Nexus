import React from 'react';
import {
  LayoutDashboard,
  Bot,
  FileText,
  PenTool,
  BookOpen,
  UserCheck,
  Users,
  Activity,
  Settings,
  Scale,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

export default function Sidebar({
  activeTab,
  onSelectTab,
  user,
  onLogout,
  onOpenAuth,
  collapsed = false,
  onToggleCollapse,
}) {
  const isAdmin = user?.role === 'ADMIN';

  // Admin Specific Sidebar Items
  const adminItems = [
    { id: 'admin',    label: 'Admin Portal',       shortLabel: 'Admin',    icon: ShieldCheck },
    { id: 'profile',  label: 'Profile',            shortLabel: 'Profile',  icon: Users,       requireAuth: true },
    { id: 'settings', label: 'Platform Settings',  shortLabel: 'Settings', icon: Settings },
  ];

  // Standard Workspace Items (For Citizens, Advocates & Students)
  const mainWorkspaceItems = [
    { id: 'cases',     label: 'Case Management',     shortLabel: 'Cases',    icon: LayoutDashboard },
    { id: 'intake',    label: 'AI Legal Assistant',   shortLabel: 'AI Chat',  icon: Bot },
    { id: 'documents', label: 'Document Intelligence',shortLabel: 'Doc AI',   icon: FileText },
    { id: 'drafts',    label: 'Smart Legal Drafting', shortLabel: 'Drafting', icon: PenTool },
    { id: 'research',  label: 'Statutory Research',   shortLabel: 'Research', icon: BookOpen },
    { id: 'lawyers',   label: 'Advocate Directory',   shortLabel: 'Lawyers',  icon: UserCheck },
  ];

  const secondaryItems = [
    { id: 'profile',  label: 'Profile & Network',  shortLabel: 'Profile',  icon: Users,       requireAuth: true },
    { id: 'settings', label: 'Platform Settings',  shortLabel: 'Settings', icon: Settings },
  ];

  // Role → gradient for avatar
  const roleGrad = {
    CITIZEN:     'from-blue-500 to-sky-400',
    LAWYER:      'from-legal-gold to-amber-400',
    LAW_STUDENT: 'from-emerald-500 to-teal-400',
    ADMIN:       'from-purple-500 to-violet-400',
  };

  const NavItem = ({ item }) => {
    const Icon = item.icon;
    const active = activeTab === item.id;

    return (
      <button
        key={item.id}
        onClick={() => onSelectTab(item.id)}
        title={collapsed ? item.label : undefined}
        className={`sidebar-nav-item w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 relative group cursor-pointer ${
          active
            ? 'bg-blue-600 text-white shadow-md font-bold'
            : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
        }`}
      >
        {/* Gold active left bar */}
        {active && (
          <span className="absolute left-0 top-2 bottom-2 w-[3px] bg-legal-gold rounded-r-full shadow-gold-glow" />
        )}

        {/* Icon container */}
        <div
          className={`flex-shrink-0 p-1.5 rounded-lg transition-all duration-150 group-hover:scale-110 ${
            active
              ? 'bg-white/15 text-white'
              : 'bg-slate-800/70 text-slate-500 group-hover:text-white group-hover:bg-slate-700/80'
          }`}
        >
          <Icon className="w-4 h-4" />
        </div>

        {/* Label + badge */}
        {!collapsed && (
          <div className="flex-1 flex items-center justify-between truncate">
            <span className="truncate">{item.label}</span>
            {item.badge && (
              <span
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border tracking-wider ml-1 shrink-0 ${
                  active
                    ? 'bg-white/20 text-white border-white/20'
                    : item.highlight
                    ? 'bg-legal-gold/20 text-legal-gold border-legal-gold/30'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {item.badge}
              </span>
            )}
          </div>
        )}

        {/* Collapsed tooltip */}
        {collapsed && (
          <span className="sidebar-tooltip">{item.label}</span>
        )}
      </button>
    );
  };

  return (
    <aside
      className={`hidden md:flex flex-col bg-[#0A1929] text-slate-300 border-r border-slate-800/70 shrink-0 sidebar-transition select-none relative z-20 ${
        collapsed ? 'w-[72px]' : 'w-64'
      }`}
    >
      {/* ── Sidebar Header ──────────────────────────────────── */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/60 bg-[#071422]/60">
        {!collapsed ? (
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-legal-blue to-sky-400 flex items-center justify-center text-white shadow-md shadow-legal-blue/20 shrink-0">
              <Scale className="w-4 h-4" />
            </div>
            <div className="truncate">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-white tracking-tight">Legal Nexus</span>
                <span className="w-1.5 h-1.5 rounded-full bg-legal-gold animate-pulse" />
              </div>
              <p className="text-[10px] text-slate-500 font-medium tracking-wide">Enterprise Legal AI</p>
            </div>
          </div>
        ) : (
          <div className="mx-auto w-8 h-8 rounded-xl bg-gradient-to-tr from-legal-blue to-sky-400 flex items-center justify-center text-white shadow-md">
            <Scale className="w-4 h-4" />
          </div>
        )}

        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            className={`p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition ${collapsed ? 'absolute right-1.5 bottom-auto top-4' : ''}`}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* ── Navigation List ──────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 dark-scrollbar">
        {isAdmin ? (
          /* Admin Navigation: Only Admin Portal, Profile, Platform Settings */
          <div className="space-y-0.5">
            {!collapsed && (
              <div className="px-3 pb-2 flex items-center gap-2">
                <div className="h-px flex-1 bg-slate-800/80" />
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">
                  Admin Console
                </span>
                <div className="h-px flex-1 bg-slate-800/80" />
              </div>
            )}
            {adminItems.map((item) => (
              <NavItem key={item.id} item={item} />
            ))}
          </div>
        ) : (
          /* Standard Citizen & Advocate Navigation */
          <>
            {/* Core Workspace */}
            <div className="space-y-0.5">
              {!collapsed && (
                <div className="px-3 pb-2 flex items-center gap-2">
                  <div className="h-px flex-1 bg-slate-800/80" />
                  <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest whitespace-nowrap">
                    Workspace
                  </span>
                  <div className="h-px flex-1 bg-slate-800/80" />
                </div>
              )}
              {mainWorkspaceItems.map((item) => (
                <NavItem key={item.id} item={item} />
              ))}
            </div>

            {/* Secondary / Account */}
            <div className="space-y-0.5">
              {!collapsed && (
                <div className="px-3 pb-2 flex items-center gap-2">
                  <div className="h-px flex-1 bg-slate-800/80" />
                  <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest whitespace-nowrap">
                    Account
                  </span>
                  <div className="h-px flex-1 bg-slate-800/80" />
                </div>
              )}
              {secondaryItems.map((item) => {
                if (item.requireAuth && !user) return null;
                return <NavItem key={item.id} item={item} />;
              })}
            </div>
          </>
        )}
      </div>

      {/* ── Bottom User Card ─────────────────────────────────── */}
      <div className="p-3 border-t border-slate-800/60 bg-[#071422]/40">
        {user ? (
          <div className={`flex items-center gap-3 p-2 rounded-xl bg-slate-900/60 border border-slate-800/80 ${collapsed ? 'justify-center' : ''}`}>
            {/* Gradient avatar */}
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${roleGrad[user.role] || 'from-blue-500 to-sky-400'} flex items-center justify-center text-white text-xs font-extrabold shadow-sm shrink-0`}>
              {(user.profileData?.fullName || user.email || 'U').charAt(0).toUpperCase()}
            </div>

            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate" title={user.email || 'User'}>
                  {user.profileData?.fullName || user.email || 'Authorized User'}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[9px] font-bold text-legal-gold bg-legal-gold/10 px-1.5 rounded uppercase tracking-wider">
                    {user.role}
                  </span>
                  <span className="flex items-center gap-1 text-[9px] text-emerald-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Online
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={onLogout}
              title="Sign Out"
              className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className={`w-full py-2.5 px-3 btn-shimmer bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            {!collapsed && <span>Sign In / Register</span>}
          </button>
        )}
      </div>
    </aside>
  );
}
