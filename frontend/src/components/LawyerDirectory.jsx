import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  ShieldCheck,
  Briefcase,
  MapPin,
  Award,
  Sparkles,
  CheckCircle2,
  BookOpen,
  X,
  Scale,
  Check,
  FileText,
  Upload,
  ArrowRight,
  ChevronRight,
  Filter,
  CheckSquare,
  Square,
  AlertCircle,
  FileUp,
  Send,
  PhoneCall,
  Video,
  Building,
  Clock,
  User,
  Mail,
  Phone,
} from 'lucide-react';
import api from '../services/api';

export default function LawyerDirectory({ user, onOpenAuth }) {
  const [lawyers, setLawyers] = useState([]);
  const [matchedLawyers, setMatchedLawyers] = useState(() => {
    try {
      const saved = sessionStorage.getItem('nyaya_matched_lawyers');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [matchedCaseInfo, setMatchedCaseInfo] = useState(() => {
    try {
      const saved = sessionStorage.getItem('nyaya_matched_case_info');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [caseStudies, setCaseStudies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(false);
  const [search, setSearch] = useState('');
  const [practiceArea, setPracticeArea] = useState('');
  const [verifiedOnly] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('directory'); // directory | caseStudies | consultations
  const [selectedLawyerExplanation, setSelectedLawyerExplanation] = useState(null);

  // Consultation Modal State
  const [isConsultModalOpen, setIsConsultModalOpen] = useState(false);
  const [consultLawyer, setConsultLawyer] = useState(null);
  const [consultForm, setConsultForm] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    caseTitle: '',
    consultationMode: 'PHONE_CALL',
    urgency: 'NORMAL',
    notes: '',
  });
  const [submittingConsult, setSubmittingConsult] = useState(false);
  const [consultSuccess, setConsultSuccess] = useState(null);
  const [sentRequests, setSentRequests] = useState(() => {
    try {
      const saved = sessionStorage.getItem('nyaya_consult_requests');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Consultations Tracking & Filter State
  const [consultations, setConsultations] = useState([]);
  const [loadingConsultations, setLoadingConsultations] = useState(false);
  const [consultFilter, setConsultFilter] = useState('ALL'); // 'ALL' | 'PENDING' | 'ACCEPTED' | 'DECLINED'
  const [consultCounts, setConsultCounts] = useState({ total: 0, pendingCount: 0, acceptedCount: 0, declinedCount: 0 });

  // Match Modal State
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
  const [matchMode, setMatchMode] = useState('case'); // 'case' | 'document'
  const [myCases, setMyCases] = useState([]);
  const [loadingMyCases, setLoadingMyCases] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [uploadedFileText, setUploadedFileText] = useState('');
  const fileInputRef = useRef(null);

  // Quick Demo Case Presets
  const DEMO_CASES = [
    {
      id: 'demo-1',
      title: 'Recovery of 4 Months Unpaid Tech Wages post Layoff',
      category: 'Employment & Labour Law',
      location: { city: 'Delhi', state: 'Delhi' },
      financialDetails: { disputedAmount: 480000 },
      urgency: 'HIGH',
      desc: 'Unpaid salary recovery under Payment of Wages Act Section 15 and Section 33C(2) Industrial Disputes Act.',
    },
    {
      id: 'demo-2',
      title: 'Unauthorized UPI Phishing & Banking Fraud Recovery',
      category: 'Cyber Law & Data Privacy',
      location: { city: 'Bengaluru', state: 'Karnataka' },
      financialDetails: { disputedAmount: 250000 },
      urgency: 'CRITICAL',
      desc: 'Cyber cell complaint and petition under Section 66C/66D of Information Technology Act.',
    },
    {
      id: 'demo-3',
      title: 'Consumer Dispute against Auto Manufacturer for Engine Defect',
      category: 'Consumer Dispute',
      location: { city: 'Mumbai', state: 'Maharashtra' },
      financialDetails: { disputedAmount: 850000 },
      urgency: 'MEDIUM',
      desc: 'e-Daakhil consumer commission complaint for product deficiency and replacement claim.',
    },
  ];

  // Quick Demo PDF Presets
  const DEMO_PDFS = [
    {
      name: 'Legal_Notice_Unpaid_Wages_Delhi.pdf',
      text: 'Legal demand notice for payment of arrears of salary and gratuity under Section 15 of Payment of Wages Act Delhi Labour Court.',
      category: 'Employment & Labour Law',
      city: 'Delhi',
    },
    {
      name: 'Cyber_UPI_Banking_Fraud_Complaint.pdf',
      text: 'Police cyber crime complaint regarding unauthorized net banking debits and phishing scam in Bengaluru under IT Act 2000 Section 66D.',
      category: 'Cyber Law & Data Privacy',
      city: 'Bengaluru',
    },
    {
      name: 'Consumer_Grievance_Defective_Vehicle.pdf',
      text: 'Consumer dispute petition before District Consumer Commission Mumbai regarding manufacturing defect and warranty breach under Consumer Protection Act 2019.',
      category: 'Consumer Dispute',
      city: 'Mumbai',
    },
  ];

  useEffect(() => {
    loadLawyers();
    loadCaseStudies();
    loadConsultations();
  }, [practiceArea, verifiedOnly, consultFilter]);

  const loadConsultations = async () => {
    try {
      setLoadingConsultations(true);
      const params = {};
      if (consultFilter !== 'ALL') {
        params.status = consultFilter;
      }
      const res = await api.get('/lawyers/consultation-requests', { params });
      setConsultations(res.data.data || []);
      if (res.data.meta) {
        setConsultCounts(res.data.meta);
      }
    } catch (err) {
      console.error('Failed to load consultation requests:', err);
    } finally {
      setLoadingConsultations(false);
    }
  };

  const loadLawyers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (practiceArea) params.practiceArea = practiceArea;
      if (verifiedOnly) params.verifiedOnly = 'true';
      if (search) params.search = search;

      const res = await api.get('/lawyers', { params });
      setLawyers(res.data.data || []);
    } catch (err) {
      console.error('Failed to load lawyers directory:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCaseStudies = async () => {
    try {
      const res = await api.get('/lawyers/case-studies');
      setCaseStudies(res.data.data || []);
    } catch {
      setCaseStudies([]);
    }
  };

  const openMatchModal = async () => {
    setIsMatchModalOpen(true);
    if (user) {
      try {
        setLoadingMyCases(true);
        const res = await api.get('/cases');
        setMyCases(res.data.data || []);
        if (res.data.data && res.data.data.length > 0) {
          setSelectedCaseId(res.data.data[0]._id);
        }
      } catch {
        setMyCases([]);
      } finally {
        setLoadingMyCases(false);
      }
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result || '';
      setUploadedFileText(typeof content === 'string' ? content : file.name);
    };
    reader.readAsText(file);
  };

  const selectDemoPdf = (demo) => {
    setUploadedFileName(demo.name);
    setUploadedFileText(demo.text);
  };

  const selectDemoCase = (demo) => {
    setSelectedCaseId(demo.id);
  };

  const executeMatch = async () => {
    setMatching(true);
    try {
      let payload = {};

      if (matchMode === 'case') {
        if (selectedCaseId.startsWith('demo-')) {
          const foundDemo = DEMO_CASES.find((d) => d.id === selectedCaseId);
          payload = {
            practiceArea: foundDemo?.category,
            location: foundDemo?.location?.city,
            budget: foundDemo?.financialDetails?.disputedAmount,
            documentName: foundDemo?.title,
          };
        } else if (selectedCaseId) {
          payload = { caseId: selectedCaseId };
        } else {
          payload = { practiceArea: 'Employment & Labour Law', location: 'Delhi' };
        }
      } else {
        // Document / PDF Mode
        payload = {
          documentName: uploadedFileName || 'Uploaded_Case_Document.pdf',
          documentText: uploadedFileText || 'Case legal notice and statement of facts',
        };
      }

      const res = await api.post('/lawyers/match', payload);
      const matchedList = res.data.data?.matchedLawyers || [];
      const profile = res.data.data?.caseProfile || {};

      setMatchedLawyers(matchedList);
      setMatchedCaseInfo(profile);
      try {
        sessionStorage.setItem('nyaya_matched_lawyers', JSON.stringify(matchedList));
        sessionStorage.setItem('nyaya_matched_case_info', JSON.stringify(profile));
      } catch (e) {
        console.warn('SessionStorage save failed', e);
      }
      setIsMatchModalOpen(false);
    } catch (err) {
      console.error('Match error:', err);
      alert('Matching request failed. Please verify connection.');
    } finally {
      setMatching(false);
    }
  };

  const handleClearMatch = () => {
    setMatchedLawyers(null);
    setMatchedCaseInfo(null);
    try {
      sessionStorage.removeItem('nyaya_matched_lawyers');
      sessionStorage.removeItem('nyaya_matched_case_info');
    } catch (e) {}
  };

  const openConsultModal = (prof) => {
    if (!user) {
      onOpenAuth?.();
      return;
    }
    setConsultLawyer(prof);
    setConsultSuccess(null);
    setConsultForm({
      clientName: user.profileData?.fullName || user.email?.split('@')[0] || 'Citizen',
      clientEmail: user.email || '',
      clientPhone: user.profileData?.contactInfo?.phone || user.phone || '',
      caseTitle: matchedCaseInfo?.title || 'Legal Consultation & Case Advisory',
      consultationMode: 'PHONE_CALL',
      urgency: 'NORMAL',
      notes: '',
    });
    setIsConsultModalOpen(true);
  };

  const handleSubmitConsult = async (e) => {
    e.preventDefault();
    if (!consultLawyer) return;
    setSubmittingConsult(true);
    try {
      const res = await api.post('/lawyers/consultation-request', {
        lawyerId: consultLawyer._id || consultLawyer.lawyerId,
        clientName: consultForm.clientName,
        clientEmail: consultForm.clientEmail,
        clientPhone: consultForm.clientPhone,
        caseTitle: consultForm.caseTitle || 'Legal Consultation Request',
        category: matchedCaseInfo?.category || consultLawyer.practiceAreas?.[0] || 'General Legal Advisory',
        consultationMode: consultForm.consultationMode,
        urgency: consultForm.urgency,
        summary: consultForm.notes,
      });

      const resData = res.data.data;
      setConsultSuccess(resData);
      const updatedSent = {
        ...sentRequests,
        [consultLawyer._id || consultLawyer.lawyerId]: resData.consultationId,
      };
      setSentRequests(updatedSent);
      try {
        sessionStorage.setItem('nyaya_consult_requests', JSON.stringify(updatedSent));
      } catch (err) {}
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit consultation request.');
    } finally {
      setSubmittingConsult(false);
    }
  };

  const handleUpdateConsultationStatus = async (id, newStatus) => {
    try {
      await api.put(`/lawyers/consultation-requests/${id}/status`, {
        status: newStatus,
        scheduledDate: '2026-09-02',
        scheduledTime: '04:00 PM IST',
        meetingLink: `https://meet.legalnexus.in/consult-${id.toLowerCase()}`,
        advocateNotes: 'Advocate confirmed your consultation appointment. Please keep legal agreements and identification ready.',
        declinedReason: 'Advocate has an active High Court hearing schedule on this date.',
      });
      loadConsultations();
    } catch (err) {
      alert('Failed to update consultation status');
    }
  };

  const displayedLawyers = matchedLawyers || lawyers;

  return (
    <div className="space-y-4">
      {/* ── 1. Directory Header & Match CTA (Compact & Elevated) ─── */}
      <div className="bg-[#0B1F33] text-white p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-legal flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-legal-blue/20 text-sky-300 border border-legal-blue/30 text-[9px] font-bold rounded-full uppercase tracking-wider">
              Verified Legal Ecosystem
            </span>
            <span className="px-2 py-0.5 bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[9px] font-bold rounded-full">
              Advocates Only
            </span>
          </div>
          <h2 className="text-base sm:text-xl font-bold tracking-tight text-white">
            Verified Advocates & Legal Ecosystem
          </h2>
          <p className="text-xs text-slate-400 max-w-xl">
            Match verified Bar Council advocates with your filed cases or uploaded legal documents. Multi-factor scoring audits Practice Area (40%), Precedents (25%), and Experience (20%).
          </p>
        </div>

        {/* Action Button: Opens Match Modal */}
        <button
          onClick={openMatchModal}
          className="btn-shimmer px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 shrink-0 transform active:scale-95 cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>⚡ Match Verified Advocate for Your Case</span>
        </button>
      </div>

      {/* ── 2. Active Match Results Alert Banner (Compact) ───────── */}
      {matchedLawyers && (
        <div className="p-3.5 sm:p-4 bg-gradient-to-r from-emerald-950 via-slate-900 to-blue-950 rounded-2xl border border-emerald-500/40 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  🎯 Top Match Found
                </span>
                <span className="text-[11px] text-slate-300">
                  Target: <strong className="text-sky-300">{matchedCaseInfo?.category}</strong> ({matchedCaseInfo?.jurisdiction})
                </span>
              </div>
              <p className="text-xs font-bold text-white mt-0.5 line-clamp-1">
                {matchedCaseInfo?.title || 'Matched Legal Inquiry'}
              </p>
            </div>
          </div>

          <button
            onClick={handleClearMatch}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[11px] font-bold transition border border-white/20 shrink-0"
          >
            Clear Match / Show All ({lawyers.length})
          </button>
        </div>
      )}

      {/* ── 3. Sub-tabs: Directory vs Case Studies vs Consultations ── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-1.5 text-xs font-bold">
        <button
          onClick={() => setActiveSubTab('directory')}
          className={`px-4 py-2 rounded-xl transition cursor-pointer ${
            activeSubTab === 'directory'
              ? 'bg-blue-600 text-white shadow-sm font-bold'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {matchedLawyers ? `🌟 Highly Recommended (${displayedLawyers.length})` : `Advocates Directory (${displayedLawyers.length})`}
        </button>
        <button
          onClick={() => setActiveSubTab('caseStudies')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'caseStudies'
              ? 'bg-blue-600 text-white shadow-sm font-bold'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Case Studies ({caseStudies.length})</span>
        </button>
        <button
          onClick={() => {
            setActiveSubTab('consultations');
            loadConsultations();
          }}
          className={`px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
            activeSubTab === 'consultations'
              ? 'bg-legal-blue text-white shadow-subtle'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <PhoneCall className="w-3.5 h-3.5 text-legal-gold" />
          <span>My Consultation Requests ({consultCounts.total || consultations.length})</span>
        </button>
      </div>

      {activeSubTab === 'directory' ? (
        <>
          {/* Search & Filters */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="relative md:col-span-8">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search by advocate name, primary court, or legal practice area..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-legal-blue shadow-subtle"
              />
            </div>

            <div className="md:col-span-4">
              <select
                value={practiceArea}
                onChange={(e) => setPracticeArea(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-legal-blue text-slate-700 font-medium shadow-subtle"
              >
                <option value="">All Practice Areas</option>
                <option value="Employment">Employment & Labour Law</option>
                <option value="Consumer">Consumer Protection</option>
                <option value="Property">Property & Real Estate</option>
                <option value="Cyber">Cybercrime & IT Act</option>
                <option value="Family">Family & Matrimonial</option>
                <option value="Corporate">Corporate & Contracts</option>
              </select>
            </div>
          </div>

          {/* Lawyers Grid */}
          {loading ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-200/80 shadow-subtle">
              <div className="animate-spin w-8 h-8 border-4 border-legal-blue border-t-transparent rounded-full mx-auto mb-3"></div>
              <p className="text-xs text-slate-400 font-semibold">Loading verified advocates...</p>
            </div>
          ) : displayedLawyers.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-200/80 p-8 shadow-subtle space-y-3">
              <Scale className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No Advocates Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No advocates matched your search query. Try broadening your filter or clearing search terms.
              </p>
              <button
                onClick={() => {
                  setSearch('');
                  setPracticeArea('');
                  setVerifiedOnly(false);
                  setMatchedLawyers(null);
                }}
                className="px-4 py-2 bg-legal-blue text-white rounded-xl text-xs font-bold"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {displayedLawyers.map((prof, idx) => {
                const isVerified = prof.verificationStatus === 'VERIFIED' || prof.barCouncilRegistration?.isVerified === true;
                const matchInfo = prof.explanationBreakdown ? prof : null;

                return (
                  <div
                    key={prof._id || prof.lawyerId || idx}
                    className={`bg-white rounded-3xl border p-6 shadow-subtle hover:shadow-card transition-all duration-200 flex flex-col justify-between space-y-4 relative group ${
                      matchInfo?.isHighlyRecommended ? 'border-amber-300/80 ring-2 ring-amber-400/20' : 'border-slate-200/90'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Avatar + Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-extrabold text-base shadow-sm shrink-0 ${
                            matchInfo?.isHighlyRecommended
                              ? 'bg-gradient-to-br from-amber-500 to-legal-blue text-white'
                              : 'bg-gradient-to-br from-legal-blue to-blue-700'
                          }`}>
                            {(prof.fullName || 'A').charAt(0)}
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-slate-900 group-hover:text-legal-blue transition line-clamp-1">
                              {prof.fullName}
                            </h3>
                            <p className="text-[11px] text-slate-500 line-clamp-1 font-medium">{prof.title || 'Advocate at High Court'}</p>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1 shrink-0">
                          {matchInfo?.isHighlyRecommended && (
                            <span className="flex items-center gap-1 text-[9px] font-extrabold text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                              <Sparkles className="w-3 h-3 text-amber-600" />
                              Highly Recommended
                            </span>
                          )}
                          {isVerified ? (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                              🔵 Verified
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                              Advocate
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Bar Council ID Tag */}
                      {prof.barCouncilRegistration?.registrationNumber && (
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-600 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200/80">
                          <Scale className="w-3.5 h-3.5 text-legal-gold shrink-0" />
                          <span className="font-mono font-semibold">Bar ID: {prof.barCouncilRegistration.registrationNumber}</span>
                          {isVerified && <Check className="w-3 h-3 text-emerald-600" />}
                        </div>
                      )}

                      {/* Transparent Match Score Badge */}
                      {matchInfo && (
                        <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-emerald-900 flex items-center gap-1 text-xs">
                              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                              {matchInfo.matchPercentage}% Relevance Match
                            </span>
                            <button
                              onClick={() => setSelectedLawyerExplanation(matchInfo)}
                              className="text-[10px] text-emerald-800 underline font-bold hover:text-emerald-900"
                            >
                              Why this match?
                            </button>
                          </div>
                          <p className="text-[10px] text-emerald-700 line-clamp-1">
                            {matchInfo.summaryExplanation}
                          </p>
                        </div>
                      )}

                      {/* Precedent Case Study Highlight */}
                      {prof.featuredCaseStudy && (
                        <div className="p-3 bg-purple-50/80 rounded-2xl border border-purple-200 text-xs text-purple-950 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1 font-bold text-[10px] uppercase tracking-wider text-purple-800">
                              <Award className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                              Published Precedent ({prof.featuredCaseStudy.year || 2025})
                            </span>
                            <span className="text-[9px] text-purple-700 font-medium bg-purple-100 px-1.5 py-0.5 rounded">
                              {prof.featuredCaseStudy.forum?.substring(0, 20) || 'High Court'}
                            </span>
                          </div>
                          <p className="text-[11px] font-bold text-slate-900 line-clamp-1">
                            "{prof.featuredCaseStudy.title}"
                          </p>
                          <p className="text-[10px] text-emerald-800 font-semibold line-clamp-1">
                            ✓ {prof.featuredCaseStudy.outcome}
                          </p>
                        </div>
                      )}

                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {prof.bio || 'Experienced legal counsel offering representation across High Court & District Court jurisdictions.'}
                      </p>

                      {prof.practiceAreas && prof.practiceAreas.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {prof.practiceAreas.map((pa, i) => (
                            <span
                              key={i}
                              className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-lg border border-slate-200"
                            >
                              {pa}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-2.5 border-t border-slate-100 flex flex-col gap-2.5">
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span className="flex items-center gap-1 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {prof.location?.city || 'Delhi'}, {prof.location?.state || 'India'}
                        </span>
                        <span className="flex items-center gap-1 font-bold text-slate-700">
                          <Award className="w-3.5 h-3.5 text-legal-gold" />
                          {prof.experienceYears || 0} yrs exp
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => openConsultModal(prof)}
                        className={`w-full py-2.5 px-3.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm transform active:scale-95 ${
                          sentRequests[prof._id || prof.lawyerId]
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 font-extrabold cursor-default'
                            : 'bg-gradient-to-r from-legal-blue to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white shadow-blue-500/20'
                        }`}
                      >
                        {sentRequests[prof._id || prof.lawyerId] ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Consultation Booked ({sentRequests[prof._id || prof.lawyerId]})</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5 text-legal-gold" />
                            <span>Send Consultation Request</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : activeSubTab === 'caseStudies' ? (
        /* Anonymized Case Studies View */
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600">
            <strong>Legal Precedents & Case Studies:</strong> Verified advocates publish anonymized case strategies and judicial outcomes with 100% confidential client privacy.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {caseStudies.map((cs, idx) => (
              <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-subtle space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-legal-blue bg-blue-50 px-2 py-0.5 rounded border border-blue-200 uppercase">
                    {cs.practiceArea}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">{cs.year || 2026}</span>
                </div>
                <h4 className="text-sm font-bold text-slate-900">{cs.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{cs.summary}</p>
                <div className="pt-2 border-t border-slate-100 text-xs">
                  <strong className="text-emerald-800 block mb-0.5">Judicial Outcome:</strong>
                  <span className="text-slate-700">{cs.outcome}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* ── My Consultation Requests View with Status Filters & Acceptance Details ── */
        <div className="space-y-4">
          {/* Status Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-subtle">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setConsultFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  consultFilter === 'ALL'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Requests ({consultCounts.total})
              </button>
              <button
                onClick={() => setConsultFilter('PENDING')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  consultFilter === 'PENDING'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>⏳ Awaiting Review ({consultCounts.pendingCount})</span>
              </button>
              <button
                onClick={() => setConsultFilter('ACCEPTED')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  consultFilter === 'ACCEPTED'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>✅ Accepted / Confirmed ({consultCounts.acceptedCount})</span>
              </button>
              <button
                onClick={() => setConsultFilter('DECLINED')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  consultFilter === 'DECLINED'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>❌ Declined ({consultCounts.declinedCount})</span>
              </button>
            </div>

            <button
              onClick={loadConsultations}
              className="p-1.5 text-slate-500 hover:text-legal-blue hover:bg-slate-100 rounded-lg transition text-xs font-semibold flex items-center gap-1"
              title="Refresh Requests"
            >
              <span>🔄 Refresh Status</span>
            </button>
          </div>

          {/* List / Grid of Requests */}
          {loadingConsultations ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-subtle">
              <div className="animate-spin w-8 h-8 border-4 border-legal-blue border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-xs text-slate-500">Loading consultation statuses...</p>
            </div>
          ) : consultations.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 shadow-subtle space-y-3">
              <PhoneCall className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No Consultation Requests Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {consultFilter !== 'ALL'
                  ? `No consultation requests found under filter "${consultFilter}".`
                  : 'You have not submitted any consultation requests yet. Browse verified advocates and click "Send Consultation Request".'}
              </p>
              <button
                onClick={() => setActiveSubTab('directory')}
                className="px-4 py-2 bg-legal-blue text-white rounded-xl text-xs font-bold shadow transition"
              >
                Browse Verified Advocates
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {consultations.map((c) => {
                const isAccepted = c.status === 'ACCEPTED';
                const isPending = c.status === 'PENDING';
                const isDeclined = c.status === 'DECLINED';

                return (
                  <div
                    key={c._id || c.consultationId}
                    className={`bg-white rounded-3xl border p-5 shadow-subtle space-y-3.5 transition flex flex-col justify-between ${
                      isAccepted
                        ? 'border-emerald-300 ring-2 ring-emerald-400/20'
                        : isDeclined
                        ? 'border-rose-200'
                        : 'border-slate-200'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Status Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-mono text-[10px] font-bold text-slate-400">
                            {c.consultationId}
                          </span>
                          <h4 className="text-sm font-bold text-slate-900 mt-0.5">{c.caseTitle}</h4>
                        </div>

                        {isAccepted ? (
                          <span className="flex items-center gap-1 text-[10px] font-extrabold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Accepted by Advocate
                          </span>
                        ) : isDeclined ? (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-rose-800 bg-rose-100 border border-rose-300 px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                            Declined
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            Awaiting Review
                          </span>
                        )}
                      </div>

                      {/* Advocate Info */}
                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-[#0B1F33] text-white flex items-center justify-center font-bold text-xs shrink-0">
                            {(c.lawyerName || 'A').charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{c.lawyerName}</span>
                            <span className="text-[10px] text-slate-500 font-mono">Bar ID: {c.barRegistrationNumber || 'Verified'}</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {c.category?.split(' ')[0] || 'Advisory'}
                        </span>
                      </div>

                      {/* If Accepted: Confirmed Time & Meeting Details */}
                      {isAccepted && (
                        <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2 text-xs text-emerald-950">
                          <div className="flex items-center justify-between font-bold text-emerald-900 border-b border-emerald-200/60 pb-1.5">
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-emerald-600" />
                              Confirmed Appointment:
                            </span>
                            <span className="font-mono text-[11px] bg-emerald-100 px-2 py-0.5 rounded">
                              {c.scheduledDate || '2026-09-02'} • {c.scheduledTime || '04:00 PM IST'}
                            </span>
                          </div>

                          {c.meetingLink && (
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-emerald-800 font-semibold">Video Conference Link:</span>
                              <a
                                href={c.meetingLink}
                                target="_blank"
                                rel="noreferrer"
                                className="text-legal-blue underline font-bold"
                              >
                                Join Secure Video Call ↗
                              </a>
                            </div>
                          )}

                          {c.advocateNotes && (
                            <p className="text-[11px] text-emerald-800 leading-relaxed italic">
                              "{c.advocateNotes}"
                            </p>
                          )}
                        </div>
                      )}

                      {/* If Declined: Reason */}
                      {isDeclined && (
                        <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200 text-xs text-rose-900 space-y-1">
                          <span className="font-bold flex items-center gap-1 text-[11px]">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                            Advocate Decline Reason:
                          </span>
                          <p className="text-[11px] text-rose-800 leading-relaxed">
                            {c.declinedReason || 'Advocate has a calendar trial conflict on this date.'}
                          </p>
                        </div>
                      )}

                      {/* If Pending: Expected Response */}
                      {isPending && (
                        <div className="p-3 bg-amber-50/80 rounded-2xl border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
                          <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>Advocate has received your inquiry. Expected response within 24 hours.</span>
                        </div>
                      )}
                    </div>

                    {/* Simulation / Quick Action Footer */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-[10px]">
                      <span className="text-slate-400">Mode: {c.consultationMode?.replace('_', ' ')}</span>
                      
                      {/* Simulation buttons to let citizen/admin test status changes */}
                      {isPending && (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleUpdateConsultationStatus(c._id || c.consultationId, 'ACCEPTED')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition"
                          >
                            ✓ Simulate Accept
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateConsultationStatus(c._id || c.consultationId, 'DECLINED')}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg border border-rose-200 transition"
                          >
                            ✕ Decline
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── 4. Comprehensive Interactive Match Modal (Elevated Vertically) ── */}
      {isMatchModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-start justify-center pt-3 sm:pt-6 p-3 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-4 sm:p-6 space-y-3.5 my-auto sm:my-0">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-legal-blue to-blue-700 flex items-center justify-center text-white shadow-sm shrink-0">
                  <Sparkles className="w-4 h-4 text-legal-gold" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    Match Verified Advocate for Your Case
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Choose a filed case from your account OR upload a case PDF / FIR
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsMatchModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mode Switcher Tabs (Option A: Choose Case vs Option B: Upload PDF) */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl gap-1">
              <button
                type="button"
                onClick={() => setMatchMode('case')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  matchMode === 'case'
                    ? 'bg-white text-legal-blue shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Option 1: Select My Case</span>
              </button>

              <button
                type="button"
                onClick={() => setMatchMode('document')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  matchMode === 'document'
                    ? 'bg-white text-legal-blue shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileUp className="w-3.5 h-3.5" />
                <span>Option 2: Upload Case PDF</span>
              </button>
            </div>

            {/* Mode 1: Select From My Cases */}
            {matchMode === 'case' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                    Select Filed Case:
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {myCases.length > 0 ? `${myCases.length} Cases in account` : 'Using instant demo case presets'}
                  </span>
                </div>

                {/* User's Actual Cases */}
                {myCases.length > 0 ? (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {myCases.map((c) => {
                      const isSelected = selectedCaseId === c._id;
                      return (
                        <div
                          key={c._id}
                          onClick={() => setSelectedCaseId(c._id)}
                          className={`p-2.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                            isSelected
                              ? 'bg-blue-50 border-legal-blue shadow-sm'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="space-y-0.5 min-w-0 pr-2">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] font-bold px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded">
                                {c.category || 'General'}
                              </span>
                              <span className="text-[9px] text-slate-400 font-mono">
                                {c.location?.city || 'Delhi'}
                              </span>
                            </div>
                            <p className="text-xs font-bold text-slate-900 truncate">{c.title || c.issue}</p>
                          </div>
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-legal-blue shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300 shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Select a 1-click sample case below to match specialists:</span>
                  </div>
                )}

                {/* Quick Demo Case Presets */}
                <div className="space-y-1.5">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase">
                    ⚡ Quick Sample Case Presets:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                    {DEMO_CASES.map((d) => {
                      const isSelected = selectedCaseId === d.id;
                      return (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => selectDemoCase(d)}
                          className={`p-2 rounded-xl border text-left transition flex flex-col justify-between ${
                            isSelected
                              ? 'bg-blue-50 border-legal-blue ring-1 ring-legal-blue'
                              : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <div>
                            <span className="text-[8px] font-bold uppercase tracking-wider text-legal-blue bg-blue-100 px-1 py-0.5 rounded">
                              {d.category.split(' ')[0]}
                            </span>
                            <h4 className="text-[11px] font-bold text-slate-900 line-clamp-2 mt-0.5 leading-tight">{d.title}</h4>
                          </div>
                          <span className="text-[9px] text-slate-400 mt-1 font-medium">📍 {d.location.city}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Mode 2: Upload Case PDF / Legal Document */}
            {matchMode === 'document' && (
              <div className="space-y-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".pdf,.txt,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {/* Dropzone */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-legal-blue rounded-2xl p-4 text-center cursor-pointer bg-slate-50 hover:bg-blue-50/50 transition space-y-1 group"
                >
                  <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center mx-auto text-legal-blue group-hover:scale-110 transition">
                    <Upload className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      {uploadedFileName ? (
                        <span className="text-emerald-700 font-mono">✓ {uploadedFileName}</span>
                      ) : (
                        'Click to upload Case PDF, Legal Notice, or FIR'
                      )}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Supports .pdf, .txt, .docx (AI auto-extracts legal facts)
                    </p>
                  </div>
                </div>

                {/* Quick Sample Document Pre-fills */}
                <div className="space-y-1.5">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase">
                    ⚡ Or Select a Sample Case Document:
                  </span>
                  <div className="space-y-1">
                    {DEMO_PDFS.map((demo) => {
                      const isSelected = uploadedFileName === demo.name;
                      return (
                        <button
                          key={demo.name}
                          type="button"
                          onClick={() => selectDemoPdf(demo)}
                          className={`w-full p-2 rounded-xl border text-left transition flex items-center justify-between text-xs ${
                            isSelected
                              ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-slate-400" />
                            <span className="truncate max-w-[240px] text-[11px]">{demo.name}</span>
                          </div>
                          <span className="text-[9px] text-slate-400 font-medium">{demo.city} • {demo.category.split(' ')[0]}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Execute Match Action */}
            <div className="pt-2.5 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsMatchModalOpen(false)}
                className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={matching}
                onClick={executeMatch}
                className="btn-shimmer px-5 py-2.5 bg-gradient-to-r from-legal-blue to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-2"
              >
                {matching ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Auditing Advocate Match Matrix...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-legal-gold" />
                    <span>⚡ Analyze & Find Matched Advocates</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 5. Interactive Consultation Request Booking Modal ──────── */}
      {isConsultModalOpen && consultLawyer && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-start justify-center pt-3 sm:pt-6 p-3 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-5 sm:p-6 space-y-4 my-auto sm:my-0">
            {consultSuccess ? (
              /* Success Confirmation Screen */
              <div className="text-center py-4 space-y-4 animate-in zoom-in-95 duration-200">
                <div className="w-14 h-14 bg-emerald-100 border-2 border-emerald-300 rounded-3xl flex items-center justify-center mx-auto text-emerald-600 shadow-sm">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    Request Transmitted Successfully
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mt-2">
                    Consultation Request Sent to {consultSuccess.lawyerName}!
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Your case brief has been forwarded directly to the advocate's legal console.
                  </p>
                </div>

                {/* Consultation Details Card */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-left text-xs space-y-2 font-medium">
                  <div className="flex justify-between items-center border-b border-slate-200/60 pb-1.5">
                    <span className="text-slate-500">Request Tracking ID:</span>
                    <span className="font-mono font-bold text-legal-blue">{consultSuccess.consultationId}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-200/60 pb-1.5">
                    <span className="text-slate-500">Advocate Bar ID:</span>
                    <span className="font-mono font-semibold text-slate-800">{consultSuccess.barRegistrationNumber}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-200/60 pb-1.5">
                    <span className="text-slate-500">Preferred Mode:</span>
                    <span className="font-bold text-slate-800">{consultSuccess.consultationMode.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Estimated Response Time:</span>
                    <span className="font-bold text-emerald-700">{consultSuccess.estimatedResponseTime}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsConsultModalOpen(false)}
                  className="w-full py-3 bg-gradient-to-r from-legal-blue to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white font-bold text-xs rounded-xl shadow transition"
                >
                  Done • Return to Directory
                </button>
              </div>
            ) : (
              /* Consultation Request Form */
              <form onSubmit={handleSubmitConsult} className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-legal-blue to-blue-700 flex items-center justify-center text-white font-extrabold text-sm shadow-sm shrink-0">
                      {(consultLawyer.fullName || 'A').charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-bold text-slate-900 line-clamp-1">
                          {consultLawyer.fullName}
                        </h3>
                        {consultLawyer.isVerified && (
                          <span className="text-[9px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                            🔵 Verified
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1">
                        {consultLawyer.title || 'Advocate at High Court'} • {consultLawyer.experienceYears || 10}+ Yrs Exp
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsConsultModalOpen(false)}
                    className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Advocate Credentials Summary Strip */}
                {consultLawyer.barCouncilRegistration?.registrationNumber && (
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs text-slate-600">
                    <div className="flex items-center gap-1 font-mono text-[11px]">
                      <Scale className="w-3.5 h-3.5 text-legal-gold" />
                      <span>Bar ID: {consultLawyer.barCouncilRegistration.registrationNumber}</span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium">
                      📍 {consultLawyer.location?.city || 'Delhi'}
                    </span>
                  </div>
                )}

                {/* Form Fields */}
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Your Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={consultForm.clientName}
                        onChange={(e) => setConsultForm({ ...consultForm, clientName: e.target.value })}
                        placeholder="e.g. Khushi Sharma"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-legal-blue focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        required
                        value={consultForm.clientPhone}
                        onChange={(e) => setConsultForm({ ...consultForm, clientPhone: e.target.value })}
                        placeholder="e.g. +91 9876543210"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-legal-blue focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Case Issue / Inquiry Subject
                    </label>
                    <input
                      type="text"
                      required
                      value={consultForm.caseTitle}
                      onChange={(e) => setConsultForm({ ...consultForm, caseTitle: e.target.value })}
                      placeholder="e.g. Unpaid tech wages recovery under Section 15 Payment of Wages Act"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-legal-blue focus:outline-none"
                    />
                  </div>

                  {/* Consultation Mode Selector */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Preferred Consultation Mode
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: 'PHONE_CALL', label: 'Phone Call', icon: PhoneCall },
                        { id: 'VIDEO_CONSULT', label: 'Video Call', icon: Video },
                        { id: 'CHAMBER_MEETING', label: 'In-Person', icon: Building },
                      ].map((mode) => {
                        const Icon = mode.icon;
                        const isSelected = consultForm.consultationMode === mode.id;
                        return (
                          <button
                            key={mode.id}
                            type="button"
                            onClick={() => setConsultForm({ ...consultForm, consultationMode: mode.id })}
                            className={`p-2 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                              isSelected
                                ? 'bg-blue-50 border-legal-blue text-legal-blue font-bold ring-1 ring-legal-blue'
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            <span className="text-[10px]">{mode.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Urgency */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Urgency Level
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: 'NORMAL', label: 'Standard (24h)', color: 'text-slate-700' },
                        { id: 'HIGH', label: 'High (Same Day)', color: 'text-amber-700' },
                        { id: 'CRITICAL', label: 'Critical (2h)', color: 'text-rose-700' },
                      ].map((u) => {
                        const isSelected = consultForm.urgency === u.id;
                        return (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => setConsultForm({ ...consultForm, urgency: u.id })}
                            className={`p-1.5 rounded-xl border text-center text-[10px] font-bold transition ${
                              isSelected
                                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {u.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Brief Note */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Brief Case Summary / Notes for Advocate
                    </label>
                    <textarea
                      rows={2}
                      value={consultForm.notes}
                      onChange={(e) => setConsultForm({ ...consultForm, notes: e.target.value })}
                      placeholder="e.g. Need initial consultation to review employment agreement and draft statutory 15-day notice..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-legal-blue focus:outline-none resize-none"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsConsultModalOpen(false)}
                    className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submittingConsult}
                    className="btn-shimmer px-5 py-2.5 bg-gradient-to-r from-legal-blue to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-2"
                  >
                    {submittingConsult ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        <span>Transmitting Request...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5 text-legal-gold" />
                        <span>Submit Consultation Request</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── 6. Transparent Factor Breakdown Modal ─────────────────── */}
      {selectedLawyerExplanation && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 uppercase">
                  Transparent Match Breakdown
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-1">
                  {selectedLawyerExplanation.fullName} ({selectedLawyerExplanation.matchPercentage}% Match)
                </h3>
              </div>
              <button
                onClick={() => setSelectedLawyerExplanation(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">{selectedLawyerExplanation.summaryExplanation}</p>

            <div className="space-y-2">
              {selectedLawyerExplanation.explanationBreakdown?.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className={`w-4 h-4 ${item.matched ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <div>
                      <span className="font-bold text-slate-800 block">{item.factor}</span>
                      <span className="text-[11px] text-slate-500">{item.label}</span>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-legal-blue">
                    +{item.points}/{item.maxPoints}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setSelectedLawyerExplanation(null)}
              className="w-full py-3 bg-[#0B1F33] text-white font-bold text-xs rounded-2xl transition shadow"
            >
              Close Breakdown
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
