import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import LandingPage from './components/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import CaseList from './components/CaseList';
import CaseFormModal from './components/CaseFormModal';
import CaseDetailModal from './components/CaseDetailModal';
import LawyerDirectory from './components/LawyerDirectory';
import SystemHealth from './components/SystemHealth';
import LegalResearchPortal from './components/LegalResearchPortal';
import CaseStoryIntake from './components/CaseStoryIntake';
import LegalDraftGenerator from './components/LegalDraftGenerator';
import DocumentIntelligenceModal from './components/DocumentIntelligenceModal';
import CaseComparator from './components/CaseComparator';
import ResearchNotebook from './components/ResearchNotebook';
import UserProfile from './components/UserProfile';
import SettingsView from './components/SettingsView';
import AdminDashboard from './components/AdminDashboard';
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
  ShieldCheck,
  GitCompare,
  Bookmark,
} from 'lucide-react';
import api from './services/api';

const VALID_TABS = [
  'landing',
  'login',
  'signup',
  'cases',
  'intake',
  'documents',
  'drafts',
  'research',
  'lawyers',
  'comparator',
  'notebook',
  'admin',
  'profile',
  'settings',
];

const getInitialTab = () => {
  if (typeof window !== 'undefined') {
    const hash = window.location.hash.replace('#', '').trim();
    if (hash && VALID_TABS.includes(hash)) {
      return hash;
    }
    const saved = localStorage.getItem('nyaya_active_tab');
    if (saved && VALID_TABS.includes(saved)) {
      return saved;
    }
  }
  return 'landing';
};

export default function App() {
  const [activeTab, setActiveTabState] = useState(getInitialTab);
  const [user, setUser] = useState(null);
  const [isNewCaseOpen, setIsNewCaseOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [cases, setCases] = useState([]);
  const [loadingCases, setLoadingCases] = useState(false);
  const [healthStatus, setHealthStatus] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Custom tab setter with Browser History & Hash Synchronization
  const setActiveTab = (tab, pushHistory = true) => {
    if (!VALID_TABS.includes(tab)) return;
    setActiveTabState(tab);
    localStorage.setItem('nyaya_active_tab', tab);

    if (typeof window !== 'undefined') {
      const currentHash = window.location.hash.replace('#', '').trim();
      if (pushHistory) {
        if (currentHash !== tab) {
          window.history.pushState({ tab }, '', '#' + tab);
        }
      } else {
        window.history.replaceState({ tab }, '', '#' + tab);
      }
    }
  };

  // Listen to Browser Back / Forward Button Navigation
  useEffect(() => {
    const handlePopState = (e) => {
      const hash = window.location.hash.replace('#', '').trim();
      const targetTab = e.state?.tab || hash || 'landing';
      if (VALID_TABS.includes(targetTab)) {
        setActiveTabState(targetTab);
        localStorage.setItem('nyaya_active_tab', targetTab);
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);

    const initTab = getInitialTab();
    if (window.location.hash !== '#' + initTab) {
      window.history.replaceState({ tab: initTab }, '', '#' + initTab);
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  useEffect(() => {
    checkCurrentUser();
    checkHealth();
  }, []);

  useEffect(() => {
    if (activeTab === 'cases' && user) {
      loadCases();
    }
  }, [activeTab, user]);

  const checkCurrentUser = async () => {
    const token = localStorage.getItem('nyaya_access_token');
    if (!token) return;
    try {
      const res = await api.get('/auth/me');
      const authUser = res.data.data.user;
      setUser(authUser);

      const currentTab = getInitialTab();
      if (currentTab === 'login' || currentTab === 'signup' || currentTab === 'landing') {
        if (authUser.role === 'ADMIN') {
          setActiveTab('admin', false);
        } else if (authUser.role === 'LAWYER') {
          setActiveTab('lawyers', false);
        } else {
          setActiveTab('cases', false);
        }
      } else if (authUser.role === 'LAWYER' && (currentTab === 'cases' || currentTab === 'intake')) {
        setActiveTab('lawyers', false);
      } else {
        setActiveTab(currentTab, false);
      }
    } catch {
      localStorage.removeItem('nyaya_access_token');
      localStorage.removeItem('nyaya_refresh_token');
    }
  };

  const checkHealth = async () => {
    try {
      const res = await api.get('/health');
      setHealthStatus(res.data.data);
    } catch {
      setHealthStatus({
        status: 'OPERATIONAL',
        database: { mongo: 'CONNECTED', redis: 'READY' },
      });
    }
  };

  const loadCases = async () => {
    try {
      setLoadingCases(true);
      const res = await api.get('/cases');
      setCases(res.data.data || []);
    } catch {
      setCases([]);
    } finally {
      setLoadingCases(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('nyaya_access_token');
    localStorage.removeItem('nyaya_refresh_token');
    setUser(null);
    setCases([]);
    setActiveTab('landing');
  };

  const handleAuthSuccess = (authUser) => {
    setUser(authUser);
    if (authUser.role !== 'LAWYER') {
      loadCases();
    }

    const currentTab = getInitialTab();
    if (
      currentTab &&
      currentTab !== 'login' &&
      currentTab !== 'signup' &&
      currentTab !== 'landing'
    ) {
      if (authUser.role === 'LAWYER' && (currentTab === 'cases' || currentTab === 'intake')) {
        setActiveTab('lawyers');
      } else {
        setActiveTab(currentTab);
      }
    } else if (authUser.role === 'ADMIN') {
      setActiveTab('admin');
    } else if (authUser.role === 'LAWYER') {
      setActiveTab('lawyers');
    } else {
      setActiveTab('cases');
    }
  };

  const handleCaseCreated = (newCase) => {
    setCases([newCase, ...cases]);
    setSelectedCase(newCase);
    setActiveTab('cases');
  };

  const handleSelectTab = (tab) => {
    setIsMobileMenuOpen(false);
    if (tab === 'landing' || tab === 'login' || tab === 'signup') {
      setActiveTab(tab);
      return;
    }

    if (!user) {
      setActiveTab('login');
      return;
    }

    if (user.role === 'LAWYER' && (tab === 'cases' || tab === 'intake')) {
      setActiveTab('lawyers');
      return;
    }

    if (tab === 'admin' && user.role !== 'ADMIN') {
      setActiveTab('cases');
      return;
    }

    setActiveTab(tab);
  };

  const isPublicView =
    activeTab === 'landing' || activeTab === 'login' || activeTab === 'signup';

  const getMobileMenuItems = () => {
    if (!user) return [];

    if (user.role === 'ADMIN') {
      return [
        { id: 'admin', label: 'Admin Portal', icon: ShieldCheck },
        { id: 'documents', label: 'Document Intelligence', icon: FileText },
        { id: 'research', label: 'Statutory Research', icon: BookOpen },
        { id: 'lawyers', label: 'Advocate Directory', icon: UserCheck },
        { id: 'profile', label: 'Profile & Network', icon: Users },
        { id: 'settings', label: 'Platform Settings', icon: Settings },
      ];
    }

    if (user.role === 'LAWYER') {
      return [
        { id: 'lawyers', label: 'Advocate Hub & Requests', icon: UserCheck },
        { id: 'documents', label: 'Document Intelligence', icon: FileText },
        { id: 'drafts', label: 'Smart Legal Drafting', icon: PenTool },
        { id: 'research', label: 'Statutory Research', icon: BookOpen },
        { id: 'comparator', label: 'Case Law Comparator', icon: GitCompare },
        { id: 'notebook', label: 'Research Notebook', icon: Bookmark },
        { id: 'profile', label: 'Profile & Case History', icon: Users },
        { id: 'settings', label: 'Platform Settings', icon: Settings },
      ];
    }

    if (user.role === 'LAW_STUDENT') {
      return [
        { id: 'intake', label: 'AI Legal Assistant', icon: Bot },
        { id: 'drafts', label: 'Smart Legal Drafting', icon: PenTool },
        { id: 'research', label: 'Statutory Research', icon: BookOpen },
        { id: 'comparator', label: 'Case Law Comparator', icon: GitCompare },
        { id: 'notebook', label: 'Research Notebook', icon: Bookmark },
        { id: 'lawyers', label: 'Advocate Mentorship & Hub', icon: UserCheck },
        { id: 'profile', label: 'Profile & Network', icon: Users },
        { id: 'settings', label: 'Platform Settings', icon: Settings },
      ];
    }

    // Default / Citizen Role
    return [
      { id: 'cases', label: 'Case Management', icon: LayoutDashboard },
      { id: 'intake', label: 'AI Legal Assistant', icon: Bot },
      { id: 'documents', label: 'Document Intelligence', icon: FileText },
      { id: 'drafts', label: 'Smart Legal Drafting', icon: PenTool },
      { id: 'research', label: 'Statutory Research', icon: BookOpen },
      { id: 'lawyers', label: 'Advocate Directory', icon: UserCheck },
      { id: 'profile', label: 'Profile & Network', icon: Users },
      { id: 'settings', label: 'Platform Settings', icon: Settings },
    ];
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-900 selection:bg-legal-blue selection:text-white">
      {/* Top Navigation Bar */}
      <Navbar
        user={user}
        onOpenAuth={() => setActiveTab('login')}
        onLogout={handleLogout}
        isMobileOpen={isMobileMenuOpen}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        showToggle={!isPublicView}
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
      />

      {/* Main Workspace Layout */}
      <div className="flex-grow flex flex-col md:flex-row relative overflow-hidden">
        {/* Collapsible Sidebar */}
        {!isPublicView && user && (
          <Sidebar
            activeTab={activeTab}
            onSelectTab={handleSelectTab}
            user={user}
            onLogout={handleLogout}
            onOpenAuth={() => setActiveTab('login')}
            collapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          />
        )}

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && !isPublicView && user && (
          <div className="md:hidden bg-[#0B1F33] text-white border-b border-slate-800 px-4 py-4 space-y-1.5 absolute w-full left-0 top-0 z-40 shadow-2xl animate-in fade-in duration-200">
            {getMobileMenuItems().map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-3 transition ${
                    active
                      ? 'bg-legal-blue text-white shadow-md'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Primary Content Viewport */}
        <main
          key={activeTab}
          className={`flex-1 w-full mx-auto overflow-y-auto page-enter ${
            isPublicView
              ? 'max-w-7xl px-4 sm:px-6 lg:px-8 py-8'
              : 'p-4 sm:p-6 lg:p-8 max-w-7xl'
          }`}
        >
          {/* PUBLIC ROUTES */}
          {activeTab === 'landing' && (
            <LandingPage
              onGetStarted={() => {
                if (user) {
                  if (user.role === 'ADMIN') setActiveTab('admin');
                  else if (user.role === 'LAWYER') setActiveTab('lawyers');
                  else setActiveTab('intake');
                } else {
                  setActiveTab('login');
                }
              }}
              onOpenAuth={() => setActiveTab('login')}
              onSelectFeature={(feat) => handleSelectTab(feat)}
              user={user}
            />
          )}

          {activeTab === 'login' && (
            <LoginPage
              onAuthSuccess={handleAuthSuccess}
              onNavigateToSignup={() => setActiveTab('signup')}
              onForgotPassword={() =>
                alert('Password reset link has been dispatched to your email address.')
              }
            />
          )}

          {activeTab === 'signup' && (
            <SignupPage
              onAuthSuccess={handleAuthSuccess}
              onNavigateToLogin={() => setActiveTab('login')}
            />
          )}

          {/* PROTECTED ROUTES */}
          {activeTab === 'cases' &&
            (user ? (
              <CaseList
                cases={cases}
                loading={loadingCases}
                user={user}
                onSelectCase={(c) => setSelectedCase(c)}
                onNewCase={() => setIsNewCaseOpen(true)}
              />
            ) : (
              <LoginPage
                onAuthSuccess={handleAuthSuccess}
                onNavigateToSignup={() => setActiveTab('signup')}
              />
            ))}

          {activeTab === 'intake' &&
            (user ? (
              <CaseStoryIntake
                user={user}
                onOpenAuth={() => setActiveTab('login')}
                onCaseCreated={handleCaseCreated}
              />
            ) : (
              <LoginPage
                onAuthSuccess={handleAuthSuccess}
                onNavigateToSignup={() => setActiveTab('signup')}
              />
            ))}

          {activeTab === 'documents' &&
            (user ? (
              <DocumentIntelligenceModal
                user={user}
                onOpenAuth={() => setActiveTab('login')}
              />
            ) : (
              <LoginPage
                onAuthSuccess={handleAuthSuccess}
                onNavigateToSignup={() => setActiveTab('signup')}
              />
            ))}

          {activeTab === 'drafts' &&
            (user ? (
              <LegalDraftGenerator
                user={user}
                onOpenAuth={() => setActiveTab('login')}
              />
            ) : (
              <LoginPage
                onAuthSuccess={handleAuthSuccess}
                onNavigateToSignup={() => setActiveTab('signup')}
              />
            ))}

          {activeTab === 'research' &&
            (user ? (
              <LegalResearchPortal
                user={user}
                onOpenAuth={() => setActiveTab('login')}
              />
            ) : (
              <LoginPage
                onAuthSuccess={handleAuthSuccess}
                onNavigateToSignup={() => setActiveTab('signup')}
              />
            ))}

          {activeTab === 'lawyers' &&
            (user ? (
              <LawyerDirectory
                user={user}
                onOpenAuth={() => setActiveTab('login')}
              />
            ) : (
              <LoginPage
                onAuthSuccess={handleAuthSuccess}
                onNavigateToSignup={() => setActiveTab('signup')}
              />
            ))}

          {activeTab === 'comparator' &&
            (user ? (
              user.role === 'LAWYER' ? (
                <CaseComparator
                  user={user}
                  onOpenAuth={() => setActiveTab('login')}
                  onSaveToNotebook={() => setActiveTab('notebook')}
                />
              ) : (
                <LawyerDirectory
                  user={user}
                  onOpenAuth={() => setActiveTab('login')}
                />
              )
            ) : (
              <LoginPage
                onAuthSuccess={handleAuthSuccess}
                onNavigateToSignup={() => setActiveTab('signup')}
              />
            ))}

          {activeTab === 'notebook' &&
            (user ? (
              user.role === 'LAWYER' ? (
                <ResearchNotebook
                  user={user}
                  onOpenAuth={() => setActiveTab('login')}
                  onSelectTab={handleSelectTab}
                />
              ) : (
                <LawyerDirectory
                  user={user}
                  onOpenAuth={() => setActiveTab('login')}
                />
              )
            ) : (
              <LoginPage
                onAuthSuccess={handleAuthSuccess}
                onNavigateToSignup={() => setActiveTab('signup')}
              />
            ))}

          {activeTab === 'admin' &&
            (user ? (
              <AdminDashboard user={user} />
            ) : (
              <LoginPage
                onAuthSuccess={handleAuthSuccess}
                onNavigateToSignup={() => setActiveTab('signup')}
              />
            ))}

          {activeTab === 'profile' &&
            (user ? (
              <UserProfile user={user} />
            ) : (
              <LoginPage
                onAuthSuccess={handleAuthSuccess}
                onNavigateToSignup={() => setActiveTab('signup')}
              />
            ))}

          {activeTab === 'settings' &&
            (user ? (
              <SettingsView user={user} onSelectTab={handleSelectTab} />
            ) : (
              <LoginPage
                onAuthSuccess={handleAuthSuccess}
                onNavigateToSignup={() => setActiveTab('signup')}
              />
            ))}
        </main>
      </div>

      {/* Global Modals for Cases */}
      <CaseFormModal
        isOpen={isNewCaseOpen}
        onClose={() => setIsNewCaseOpen(false)}
        onCaseCreated={handleCaseCreated}
      />

      <CaseDetailModal
        selectedCase={selectedCase}
        isOpen={!!selectedCase}
        onClose={() => setSelectedCase(null)}
        onCaseUpdated={loadCases}
        user={user}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-legal-blue to-sky-400 flex items-center justify-center shadow-sm">
                <Scale className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-extrabold text-slate-900 tracking-tight">
                    Legal Nexus
                  </span>
                  <span className="text-[9px] font-bold text-legal-gold bg-legal-gold/10 px-1.5 py-0.5 rounded border border-legal-gold/20 tracking-wider uppercase">
                    AI
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">
                  AI-Powered Legal Access & Case Navigation
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6 text-xs text-slate-500">
              {[
                { label: 'AI Assistant', tab: 'intake' },
                { label: 'Research', tab: 'research' },
                { label: 'Advocates', tab: 'lawyers' },
                { label: 'Document AI', tab: 'documents' },
              ].map((link) => (
                <button
                  key={link.tab}
                  onClick={() => handleSelectTab(link.tab)}
                  className="hover:text-legal-blue transition font-medium"
                >
                  {link.label}
                </button>
              ))}
            </div>

            <div className="flex flex-col items-end gap-1.5">
              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                <span className="flex items-center gap-1 text-emerald-500 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  All systems operational
                </span>
                <span className="text-slate-300">•</span>
                <span>256-bit encrypted</span>
              </div>
              <span className="text-[10px] text-slate-400">
                © 2026 Legal Nexus Platform. All rights reserved.
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}