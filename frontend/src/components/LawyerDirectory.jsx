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
  GraduationCap,
  X,
  Scale,
  Check,
  FileText,
  Upload,
  ArrowRight,
  ChevronRight,
  Filter,
  UserCheck,
  Gavel,
  Inbox,
  Send,
  Calendar,
  Clock,
  Building,
  User,
  AlertCircle,
  Eye,
  PlusCircle,
  RefreshCw,
  CheckSquare,
  Square,
  FileUp,
  PhoneCall,
  Video,
  Mail,
  Phone,
} from 'lucide-react';
import api from '../services/api';

export default function LawyerDirectory({ user, onOpenAuth }) {
  const isLawyer = user?.role === 'LAWYER';
  const isLawStudent = user?.role === 'LAW_STUDENT';

  // Sub-tabs:
  // For lawyer: incomingRequests | ongoingCases | directory | caseStudies
  // For law student: directory | myMentorships
  // For citizen/others: directory | myRequests
  const [activeSubTab, setActiveSubTab] = useState(isLawyer ? 'incomingRequests' : 'directory');

  // Student Mentorship Request Modal & State
  const [isMentorshipModalOpen, setIsMentorshipModalOpen] = useState(false);
  const [mentorshipAdvocate, setMentorshipAdvocate] = useState(null);
  const [mentorshipForm, setMentorshipForm] = useState({
    studentCollege: 'Faculty of Law, Delhi University',
    studentYear: '3rd Year LL.B',
    mentorshipFocus: '🏛️ Courtroom Advocacy & Trial Practice',
    coverNote: '',
  });
  const [submittingMentorship, setSubmittingMentorship] = useState(false);
  const [mentorshipSuccess, setMentorshipSuccess] = useState(null);
  const [studentMentorships, setStudentMentorships] = useState(() => {
    try {
      const saved = localStorage.getItem('nyaya_student_mentorships');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const openMentorshipModal = (advocate) => {
    if (!user) {
      onOpenAuth();
      return;
    }
    setMentorshipAdvocate(advocate);
    setMentorshipForm({
      studentCollege: user?.profileData?.college || 'Faculty of Law, Delhi University',
      studentYear: '3rd Year LL.B',
      mentorshipFocus: '🏛️ Courtroom Advocacy & Trial Practice',
      coverNote: '',
    });
    setMentorshipSuccess(null);
    setIsMentorshipModalOpen(true);
  };

  const handleSendMentorshipRequest = async (e) => {
    e.preventDefault();
    if (!mentorshipAdvocate) return;
    setSubmittingMentorship(true);

    try {
      const targetLawyerId = mentorshipAdvocate.user?._id || mentorshipAdvocate.user || mentorshipAdvocate._id;

      try {
        await api.post('/lawyers/request-consultation', {
          lawyerId: targetLawyerId,
          category: '🎓 Student Mentorship & Training',
          message: `[Mentorship Inquiry] College: ${mentorshipForm.studentCollege} | Year: ${mentorshipForm.studentYear} | Focus: ${mentorshipForm.mentorshipFocus}\n\nNotes: ${mentorshipForm.coverNote}`,
        });
      } catch {
        // Fallback
      }

      const newApp = {
        id: `MNT-${Math.floor(100000 + Math.random() * 900000)}`,
        advocateName: mentorshipAdvocate.fullName || 'Advocate',
        advocateTitle: mentorshipAdvocate.title || 'Advocate on Record',
        studentCollege: mentorshipForm.studentCollege,
        studentYear: mentorshipForm.studentYear,
        mentorshipFocus: mentorshipForm.mentorshipFocus,
        coverNote: mentorshipForm.coverNote,
        status: 'PENDING',
        appliedAt: new Date().toLocaleDateString(),
      };

      const updated = [newApp, ...studentMentorships];
      setStudentMentorships(updated);
      localStorage.setItem('nyaya_student_mentorships', JSON.stringify(updated));

      setMentorshipSuccess({
        advocateName: mentorshipAdvocate.fullName,
        applicationId: newApp.id,
      });

      showToast(`🎓 Mentorship request submitted to ${mentorshipAdvocate.fullName}!`);
    } finally {
      setSubmittingMentorship(false);
    }
  };

  // Directory state
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
  const [roleFilter, setRoleFilter] = useState('');
  const [experienceFilter, setExperienceFilter] = useState(0);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [selectedLawyerExplanation, setSelectedLawyerExplanation] = useState(null);

  // Advocate Full Profile & Portfolio Modal
  const [selectedAdvocateProfile, setSelectedAdvocateProfile] = useState(null);
  const [loadingAdvocateDetail, setLoadingAdvocateDetail] = useState(false);

  // Incoming Requests state (for lawyer)
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [respondingId, setRespondingId] = useState(null);
  const [acceptModalData, setAcceptModalData] = useState(null);
  const [rejectModalData, setRejectModalData] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Ongoing Assigned Cases state (for lawyer)
  const [ongoingCases, setOngoingCases] = useState([]);
  const [loadingOngoing, setLoadingOngoing] = useState(false);
  const [selectedOngoingCase, setSelectedOngoingCase] = useState(null);

  // Citizen Requests state (for citizen)
  const [citizenRequests, setCitizenRequests] = useState([]);
  const [loadingCitizenRequests, setLoadingCitizenRequests] = useState(false);

  // Match Modal State
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
  const [matchMode, setMatchMode] = useState('case'); // 'case' | 'document'
  const [myCases, setMyCases] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [uploadedFileText, setUploadedFileText] = useState('');
  const fileInputRef = useRef(null);

  // Citizen Consultation Booking Modal
  const [isConsultModalOpen, setIsConsultModalOpen] = useState(false);
  const [consultLawyer, setConsultLawyer] = useState(null);
  const [citizenUserCases, setCitizenUserCases] = useState([]);
  const [selectedCaseForConsult, setSelectedCaseForConsult] = useState('');
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
  const [toastMessage, setToastMessage] = useState(null);

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
      category: 'Consumer Protection',
      location: { city: 'Mumbai', state: 'Maharashtra' },
      financialDetails: { disputedAmount: 850000 },
      urgency: 'MEDIUM',
      desc: 'e-Daakhil consumer commission complaint for product deficiency and replacement claim.',
    },
  ];

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
      category: 'Consumer Protection',
      city: 'Mumbai',
    },
  ];

  const showToast = (msg, type = 'success') => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    if (activeSubTab === 'directory') {
      loadLawyers();
      if (user && !isLawyer) loadCitizenRequests();
    } else if (activeSubTab === 'caseStudies') {
      loadCaseStudies();
    } else if (activeSubTab === 'incomingRequests' && isLawyer) {
      loadIncomingRequests();
    } else if (activeSubTab === 'ongoingCases' && isLawyer) {
      loadOngoingCases();
    } else if (activeSubTab === 'myRequests' && !isLawyer) {
      loadCitizenRequests();
    }
  }, [activeSubTab, practiceArea, roleFilter, experienceFilter, verifiedOnly]);

  useEffect(() => {
    if (isLawyer) {
      loadIncomingRequests();
      loadOngoingCases();
    } else if (user) {
      loadCitizenRequests();
    }
  }, [user]);

  const loadLawyers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (practiceArea) params.practiceArea = practiceArea;
      if (verifiedOnly) params.verifiedOnly = 'true';
      if (search) params.search = search;
      if (experienceFilter > 0) params.minExperience = experienceFilter;
      if (roleFilter) params.role = roleFilter;

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

  const loadIncomingRequests = async () => {
    try {
      setLoadingRequests(true);
      const res = await api.get('/lawyers/requests/incoming');
      setIncomingRequests(res.data.data || []);
    } catch (err) {
      console.error('Failed to load incoming requests:', err);
    } finally {
      setLoadingRequests(false);
    }
  };

  const loadOngoingCases = async () => {
    try {
      setLoadingOngoing(true);
      const res = await api.get('/lawyers/ongoing-cases');
      setOngoingCases(res.data.data || []);
    } catch (err) {
      console.error('Failed to load ongoing cases:', err);
    } finally {
      setLoadingOngoing(false);
    }
  };

  const loadCitizenRequests = async () => {
    try {
      setLoadingCitizenRequests(true);
      const res = await api.get('/lawyers/requests/citizen');
      setCitizenRequests(res.data.data || []);
    } catch (err) {
      console.error('Failed to load citizen requests:', err);
    } finally {
      setLoadingCitizenRequests(false);
    }
  };

  const handleRespondToRequest = async (requestId, action, reason = '') => {
    try {
      setRespondingId(requestId);
      await api.patch(`/lawyers/requests/${requestId}/respond`, {
        action,
        rejectionReason: reason,
      });
      setAcceptModalData(null);
      setRejectModalData(null);
      setRejectionReason('');
      showToast(
        action === 'ACCEPT'
          ? 'Request accepted! Case added to Ongoing Cases.'
          : 'Request declined.'
      );
      loadIncomingRequests();
      loadOngoingCases();
    } catch (err) {
      showToast(
        err.response?.data?.message || 'Failed to update request response',
        'error'
      );
    } finally {
      setRespondingId(null);
    }
  };

  const openAdvocateProfileModal = async (prof) => {
    try {
      setLoadingAdvocateDetail(true);
      setSelectedAdvocateProfile(prof);
      const res = await api.get(`/lawyers/${prof._id}`);
      setSelectedAdvocateProfile(res.data.data?.profile || prof);
      if (res.data.data?.experiences) {
        setSelectedAdvocateProfile((prev) => ({
          ...prev,
          experiences: res.data.data.experiences,
          caseHistories: res.data.data.caseHistories,
        }));
      }
    } catch (err) {
      console.error('Failed to load advocate details:', err);
    } finally {
      setLoadingAdvocateDetail(false);
    }
  };

  const openMatchModal = async () => {
    setIsMatchModalOpen(true);
    if (user) {
      try {
        const res = await api.get('/cases');
        setMyCases(res.data.data || []);
        if (res.data.data && res.data.data.length > 0) {
          setSelectedCaseId(res.data.data[0]._id);
        }
      } catch {
        setMyCases([]);
      }
    }
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

  const openConsultModal = async (prof) => {
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

    try {
      const res = await api.get('/cases');
      const list = res.data.data || [];
      setCitizenUserCases(list);
      if (list.length > 0) {
        setSelectedCaseForConsult(list[0]._id);
      }
    } catch {
      setCitizenUserCases([]);
    }

    setIsConsultModalOpen(true);
  };

  const handleSubmitConsult = async (e) => {
    e.preventDefault();
    if (!consultLawyer) return;
    setSubmittingConsult(true);
    try {
      const targetLawyerId =
        consultLawyer.user?._id || consultLawyer.user || consultLawyer._id;

      if (selectedCaseForConsult) {
        await api.post('/lawyers/request-consultation', {
          caseId: selectedCaseForConsult,
          lawyerId: targetLawyerId,
          message: consultForm.notes,
        });
      }

      setConsultSuccess({
        lawyerName: consultLawyer.fullName,
        consultationId: `REQ-${Math.floor(100000 + Math.random() * 900000)}`,
        barRegistrationNumber:
          consultLawyer.barCouncilRegistration?.registrationNumber || 'Verified',
        consultationMode: consultForm.consultationMode,
        estimatedResponseTime:
          consultForm.urgency === 'CRITICAL' ? 'Within 2 Hours' : 'Within 24 Hours',
      });

      loadCitizenRequests();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit consultation request.');
    } finally {
      setSubmittingConsult(false);
    }
  };

  const displayedLawyers = matchedLawyers || lawyers;

  return (
    <div className="space-y-4">
      {/* ── 1. Top Command Header ── */}
      <div className="bg-[#0B1F33] text-white p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-legal flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-legal-blue/20 text-sky-300 border border-legal-blue/30 text-[9px] font-bold rounded-full uppercase tracking-wider">
              {isLawyer ? 'Advocate Command Center' : 'Verified Legal Ecosystem'}
            </span>
            <span className="px-2 py-0.5 bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[9px] font-bold rounded-full">
              Bar Council Verified
            </span>
          </div>
          <h2 className="text-base sm:text-xl font-bold tracking-tight text-white">
            {isLawyer ? 'Advocate Hub & Client Inquiries' : 'Verified Advocates Directory'}
          </h2>
          <p className="text-xs text-slate-400 max-w-xl">
            {isLawyer
              ? 'Review representation inquiries, manage assigned ongoing matters, and track case dockets.'
              : 'Match verified Bar Council advocates with your filed cases or uploaded legal documents.'}
          </p>
        </div>

        {!isLawyer && (
          <button
            onClick={openMatchModal}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>⚡ Match Verified Advocate for Your Case</span>
          </button>
        )}
      </div>

      {/* ── Active Match Alert ── */}
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
                  Target: <strong className="text-sky-300">{matchedCaseInfo?.category}</strong> ({matchedCaseInfo?.jurisdiction || 'India'})
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

      {/* ── Toast Notification ── */}
      {toastMessage && (
        <div
          className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs sm:text-sm font-semibold animate-in slide-in-from-top-2 text-white ${
            toastMessage.type === 'error' ? 'bg-red-700' : 'bg-emerald-700'
          }`}
        >
          {toastMessage.type === 'error' ? (
            <AlertCircle className="w-4 h-4" />
          ) : (
            <CheckCircle2 className="w-4 h-4" />
          )}
          <span>{toastMessage.msg}</span>
        </div>
      )}

      {/* ── Sub-navigation Tabs ── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2 text-xs font-bold">
        {isLawyer ? (
          <>
            <button
              onClick={() => setActiveSubTab('incomingRequests')}
              className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'incomingRequests'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Inbox className="w-4 h-4" />
              <span>Incoming Requests ({incomingRequests.length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('ongoingCases')}
              className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'ongoingCases'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>Ongoing Cases ({ongoingCases.length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('directory')}
              className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'directory'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Advocates Directory ({lawyers.length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('caseStudies')}
              className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'caseStudies'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Precedent Case Studies ({caseStudies.length})</span>
            </button>
          </>
        ) : isLawStudent ? (
          <>
            <button
              onClick={() => setActiveSubTab('directory')}
              className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'directory'
                  ? 'bg-emerald-600 text-white shadow-sm font-bold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Advocates Mentorship Directory ({displayedLawyers.length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('myMentorships')}
              className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'myMentorships'
                  ? 'bg-emerald-600 text-white shadow-sm font-bold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>My Mentorship Applications ({studentMentorships.length})</span>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setActiveSubTab('directory')}
              className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'directory'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>
                {matchedLawyers
                  ? `🌟 Matched Advocates (${displayedLawyers.length})`
                  : `Advocates Directory (${displayedLawyers.length})`}
              </span>
            </button>

            <button
              onClick={() => setActiveSubTab('myRequests')}
              className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'myRequests'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>My Sent Requests ({citizenRequests.length})</span>
            </button>
          </>
        )}
      </div>

      {/* ── 2. INCOMING REQUESTS (LAWYER) ── */}
      {activeSubTab === 'incomingRequests' && isLawyer && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-subtle flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Inbox className="w-4 h-4 text-legal-blue" />
                <span>Client Legal Assistance Inquiries</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Incoming representation requests awaiting your confirmation.
              </p>
            </div>
            <button
              onClick={loadIncomingRequests}
              disabled={loadingRequests}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingRequests ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {loadingRequests ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-200/80 shadow-subtle">
              <div className="animate-spin w-8 h-8 border-4 border-legal-blue border-t-transparent rounded-full mx-auto mb-3" />
              <p className="text-xs text-slate-500 font-medium">Checking client inquiries...</p>
            </div>
          ) : incomingRequests.filter((r) => r.status === 'PENDING').length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-200/80 shadow-subtle p-8 max-w-md mx-auto space-y-3">
              <Inbox className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No Pending Requests</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                When citizens request consultation with you, their case dossiers will appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {incomingRequests
                .filter((r) => r.status === 'PENDING')
                .map((req) => {
                  const caseItem = req.case || {};
                  const citizen = req.citizen || caseItem.user || {};

                  return (
                    <div
                      key={req._id}
                      className="bg-white p-6 rounded-3xl border border-amber-200/90 bg-amber-50/10 shadow-subtle space-y-4 flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold text-legal-blue bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                {caseItem.caseNumber || 'CASE'}
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-amber-100 text-amber-800 border border-amber-300">
                                PENDING REVIEW
                              </span>
                            </div>
                            <h4 className="text-sm font-bold text-slate-900 mt-2">
                              {caseItem.title || 'Case Inquiry'}
                            </h4>
                          </div>

                          {caseItem.urgency && (
                            <span className="text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                              {caseItem.urgency}
                            </span>
                          )}
                        </div>

                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs space-y-1 text-slate-700">
                          <p className="font-semibold flex items-center gap-1.5 text-slate-900">
                            <User className="w-3.5 h-3.5 text-legal-blue" />
                            <span>Client: {citizen.email || 'Citizen User'}</span>
                          </p>
                          {citizen.phone && (
                            <p className="text-[11px] text-slate-500">Contact: {citizen.phone}</p>
                          )}
                        </div>

                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                          {caseItem.description || caseItem.issue}
                        </p>

                        {req.requestMessage && (
                          <div className="p-3 bg-blue-50/60 rounded-2xl border border-blue-100 text-xs text-slate-700">
                            <strong className="text-legal-blue block text-[10px] uppercase tracking-wider mb-0.5">
                              Client Note:
                            </strong>
                            <span>"{req.requestMessage}"</span>
                          </div>
                        )}
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                        <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {new Date(req.createdAt).toLocaleDateString('en-IN')}
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setRejectModalData(req)}
                            disabled={respondingId === req._id}
                            className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-xl border border-red-200 transition"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => setAcceptModalData(req)}
                            disabled={respondingId === req._id}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Accept</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* ── 3. ONGOING CASES (LAWYER) ── */}
      {activeSubTab === 'ongoingCases' && isLawyer && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-subtle flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-legal-blue" />
                <span>Assigned Ongoing Matters</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Active matters currently in your legal custody.
              </p>
            </div>
            <button
              onClick={loadOngoingCases}
              disabled={loadingOngoing}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingOngoing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {loadingOngoing ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-200/80 shadow-subtle">
              <div className="animate-spin w-8 h-8 border-4 border-legal-blue border-t-transparent rounded-full mx-auto mb-3" />
              <p className="text-xs text-slate-500 font-medium">Loading ongoing cases...</p>
            </div>
          ) : ongoingCases.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-200/80 shadow-subtle p-8 max-w-md mx-auto space-y-3">
              <FileText className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No Ongoing Cases</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Accepted client requests will automatically appear here as ongoing active matters.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ongoingCases.map((c) => (
                <div
                  key={c._id}
                  className="bg-white p-6 rounded-3xl border border-slate-200/90 hover:border-legal-blue/50 shadow-subtle space-y-4 flex flex-col justify-between transition"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-legal-blue bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {c.caseNumber}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {c.status}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 mt-2">{c.title}</h4>
                      </div>

                      {c.urgency && (
                        <span className="text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                          {c.urgency}
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1">
                      <p><strong>Domain:</strong> {c.category} • <strong>Issue:</strong> {c.issue}</p>
                      {c.financialDetails?.disputedAmount > 0 && (
                        <p>
                          <strong>Disputed Amount:</strong> ₹{Number(c.financialDetails.disputedAmount).toLocaleString('en-IN')}
                        </p>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {c.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-medium">
                      Updated: {new Date(c.updatedAt || c.createdAt).toLocaleDateString('en-IN')}
                    </span>

                    <button
                      onClick={() => setSelectedOngoingCase(c)}
                      className="px-3.5 py-2 bg-legal-blue hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow transition flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Review Dossier</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── 4. SENT REQUESTS (CITIZEN) ── */}
      {activeSubTab === 'myRequests' && !isLawyer && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-subtle flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Send className="w-4 h-4 text-legal-blue" />
                <span>My Representation Inquiries</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Track status updates from advocates you have contacted.
              </p>
            </div>
            <button
              onClick={loadCitizenRequests}
              disabled={loadingCitizenRequests}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingCitizenRequests ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {loadingCitizenRequests ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-200/80 shadow-subtle">
              <div className="animate-spin w-8 h-8 border-4 border-legal-blue border-t-transparent rounded-full mx-auto mb-3" />
              <p className="text-xs text-slate-500 font-medium">Loading requests...</p>
            </div>
          ) : citizenRequests.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-200/80 shadow-subtle p-8 max-w-md mx-auto space-y-3">
              <Send className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No Inquiries Dispatched</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Browse verified advocates to dispatch representation requests for your cases.
              </p>
              <button
                onClick={() => setActiveSubTab('directory')}
                className="px-4 py-2 bg-legal-blue text-white text-xs font-bold rounded-xl shadow"
              >
                Explore Directory
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {citizenRequests.map((req) => {
                const law = req.lawyer || {};
                const c = req.case || {};
                const isPending = req.status === 'PENDING';
                const isAccepted = req.status === 'ACCEPTED';
                const isRejected = req.status === 'REJECTED' || req.status === 'DECLINED';

                return (
                  <div
                    key={req._id}
                    className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono font-bold text-legal-blue bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {c.caseNumber || 'CASE'}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900">{c.title || 'Case File'}</h4>
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                            isPending
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : isAccepted
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-red-100 text-red-800 border border-red-300'
                          }`}
                        >
                          {req.status}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600">
                        Advocate: <strong>{law.email || 'Advocate'}</strong> • Sent on {new Date(req.createdAt).toLocaleDateString('en-IN')}
                      </p>

                      {isRejected && req.rejectionReason && (
                        <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-xs text-red-800">
                          <strong>Note from Advocate: </strong>{req.rejectionReason}
                        </div>
                      )}

                      {isAccepted && (
                        <p className="text-xs text-emerald-700 font-semibold">
                          ✓ Advocate accepted representation for this matter.
                        </p>
                      )}
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {isRejected && (
                        <button
                          onClick={() => setActiveSubTab('directory')}
                          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow"
                        >
                          Find Another Lawyer
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── 4B. LAW STUDENT MENTORSHIPS VIEW ── */}
      {activeSubTab === 'myMentorships' && isLawStudent && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-subtle flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-emerald-600" />
                <span>My Advocate Mentorship & Training Applications</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Track the status of mentorship inquiries submitted to High Court and trial advocates.
              </p>
            </div>

            <button
              onClick={() => setActiveSubTab('directory')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
            >
              <UserCheck className="w-4 h-4" />
              <span>Explore Advocates</span>
            </button>
          </div>

          {studentMentorships.length === 0 ? (
            <div className="p-8 bg-white rounded-3xl border border-slate-200/90 shadow-subtle text-center space-y-3">
              <GraduationCap className="w-10 h-10 text-emerald-500 mx-auto" />
              <h4 className="text-sm font-bold text-slate-900">No Mentorship Applications Sent Yet</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Explore the Advocate Directory and connect with Bar Council verified advocates for courtroom training, legal research internships, and career mentorship.
              </p>
              <button
                onClick={() => setActiveSubTab('directory')}
                className="px-5 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow cursor-pointer"
              >
                Browse Mentorship Directory
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {studentMentorships.map((mnt) => (
                <div
                  key={mnt.id}
                  className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        {mnt.id}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900">Mentorship with {mnt.advocateName}</h4>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                          mnt.status === 'PENDING'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : mnt.status === 'ACCEPTED'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-red-100 text-red-800 border border-red-300'
                        }`}
                      >
                        {mnt.status}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1">
                      <p><strong>Training Focus:</strong> {mnt.mentorshipFocus}</p>
                      <p><strong>College & Year:</strong> {mnt.studentCollege} ({mnt.studentYear})</p>
                      {mnt.coverNote && <p className="italic text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">"{mnt.coverNote}"</p>}
                    </div>

                    <p className="text-[10px] text-slate-400 font-mono">Applied on {mnt.appliedAt}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── 5. ADVOCATES DIRECTORY (GRID & SEARCH) ── */}
      {activeSubTab === 'directory' && (
        <>
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="relative md:col-span-6">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search by advocate name, court, or practice area..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-legal-blue shadow-subtle"
                />
              </div>

              <div className="md:col-span-3">
                <select
                  value={practiceArea}
                  onChange={(e) => setPracticeArea(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-legal-blue text-slate-700 font-medium shadow-subtle"
                >
                  <option value="">All Practice Areas</option>
                  <option value="Criminal Law">Criminal Law</option>
                  <option value="Civil Law">Civil Law</option>
                  <option value="Family & Matrimonial">Family & Matrimonial</option>
                  <option value="Corporate & Commercial">Corporate & Commercial</option>
                  <option value="Property & Real Estate">Property & Real Estate</option>
                  <option value="Cyber Law & Data Privacy">Cyber Law & Data Privacy</option>
                  <option value="Consumer Protection">Consumer Protection</option>
                  <option value="Employment & Labour Law">Employment & Labour Law</option>
                  <option value="Taxation & GST">Taxation & GST</option>
                </select>
              </div>

              <div className="md:col-span-3">
                <select
                  value={experienceFilter}
                  onChange={(e) => setExperienceFilter(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-legal-blue text-slate-700 font-medium shadow-subtle"
                >
                  <option value={0}>Any Experience</option>
                  <option value={3}>3+ Years</option>
                  <option value={5}>5+ Years</option>
                  <option value={10}>10+ Years</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[11px] font-bold text-slate-400 mr-1 uppercase tracking-wider">Filter:</span>
              {[
                'Criminal Law',
                'Civil Law',
                'Family & Matrimonial',
                'Corporate & Commercial',
                'Property & Real Estate',
                'Cyber Law & Data Privacy',
                'Consumer Protection',
              ].map((area) => (
                <button
                  key={area}
                  onClick={() => setPracticeArea(practiceArea === area ? '' : area)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold border transition ${
                    practiceArea === area
                      ? 'bg-legal-blue text-white border-legal-blue shadow-subtle'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {area}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-200/80 shadow-subtle">
              <div className="animate-spin w-8 h-8 border-4 border-legal-blue border-t-transparent rounded-full mx-auto mb-3" />
              <p className="text-xs text-slate-500 font-medium">Searching advocate directory...</p>
            </div>
          ) : displayedLawyers.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-200/80 p-8 shadow-subtle space-y-3">
              <Scale className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No Advocates Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No advocates matched your query. Try clearing filters or search terms.
              </p>
              <button
                onClick={() => {
                  setSearch('');
                  setPracticeArea('');
                  setExperienceFilter(0);
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
                const matchInfo = matchedLawyers?.find((m) => m.lawyerId === (prof._id || prof.lawyerId)) || (prof.explanationBreakdown ? prof : null);
                const isVerified = prof.verificationStatus === 'VERIFIED' || prof.barCouncilRegistration?.isVerified === true;
                const profUserId = prof.user?._id || prof.user || prof._id;
                const sentReq = citizenRequests.find(
                  (r) =>
                    (r.lawyer?._id && (r.lawyer._id === profUserId || r.lawyer._id === prof._id)) ||
                    (r.lawyer && (r.lawyer === profUserId || r.lawyer === prof._id))
                );

                return (
                  <div
                    key={prof._id || prof.lawyerId || idx}
                    className={`bg-white rounded-3xl border p-6 shadow-subtle hover:shadow-card transition-all duration-200 flex flex-col justify-between space-y-4 relative group ${
                      matchInfo?.isHighlyRecommended ? 'border-amber-300/80 ring-2 ring-amber-400/20' : 'border-slate-200/90'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-2xl bg-[#0B1F33] text-legal-gold flex items-center justify-center font-extrabold text-sm border border-slate-700 shadow-sm overflow-hidden shrink-0">
                            {prof.avatar ? (
                              <img src={prof.avatar} alt={prof.fullName} className="w-full h-full object-cover" />
                            ) : (
                              <span>{(prof.fullName || 'A').charAt(0)}</span>
                            )}
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
                              Top Match
                            </span>
                          )}
                          {isVerified && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                              🔵 Verified
                            </span>
                          )}
                        </div>
                      </div>

                      {prof.barCouncilRegistration?.registrationNumber && (
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-600 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200/80">
                          <Scale className="w-3.5 h-3.5 text-legal-gold shrink-0" />
                          <span className="font-mono font-semibold">Bar ID: {prof.barCouncilRegistration.registrationNumber}</span>
                          {isVerified && <Check className="w-3 h-3 text-emerald-600" />}
                        </div>
                      )}

                      {matchInfo && (
                        <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-emerald-900 flex items-center gap-1 text-xs">
                              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                              {matchInfo.matchPercentage}% Match
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

                    <div className="space-y-3 pt-3 border-t border-slate-100">
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

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          onClick={() => openAdvocateProfileModal(prof)}
                          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5 text-legal-blue" />
                          <span>View Profile</span>
                        </button>

                        {!isLawyer && (
                          <>
                            {isLawStudent ? (
                              <button
                                onClick={() => openMentorshipModal(prof)}
                                className="px-2.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-800 text-white text-[11px] font-bold rounded-xl shadow transition flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <GraduationCap className="w-3.5 h-3.5 text-emerald-200" />
                                <span>Mentorship</span>
                              </button>
                            ) : sentReq?.status === 'PENDING' ? (
                              <button
                                disabled
                                className="px-2.5 py-2 bg-amber-50 text-amber-800 text-[11px] font-bold rounded-xl border border-amber-300 opacity-90 cursor-not-allowed text-center"
                              >
                                Pending
                              </button>
                            ) : sentReq?.status === 'ACCEPTED' ? (
                              <div className="px-2.5 py-2 bg-emerald-50 text-emerald-800 text-[11px] font-bold rounded-xl border border-emerald-300 text-center">
                                ✓ Assigned
                              </div>
                            ) : (
                              <button
                                onClick={() => openConsultModal(prof)}
                                className="px-2.5 py-2 bg-gradient-to-r from-legal-blue to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white text-[11px] font-bold rounded-xl shadow transition flex items-center justify-center gap-1"
                              >
                                <Send className="w-3.5 h-3.5 text-legal-gold" />
                                <span>Request Help</span>
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── 6. CASE STUDIES VIEW ── */}
      {activeSubTab === 'caseStudies' && isLawyer && (
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
      )}

      {/* ── MODAL: ADVOCATE FULL PROFILE ── */}
      {selectedAdvocateProfile && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 sm:p-8 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#0B1F33] text-legal-gold flex items-center justify-center font-extrabold text-lg border border-slate-700 shadow-sm">
                  {(selectedAdvocateProfile.fullName || 'A').charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{selectedAdvocateProfile.fullName}</h3>
                  <p className="text-xs text-legal-blue font-semibold">{selectedAdvocateProfile.title || 'Advocate on Record'}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedAdvocateProfile(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <h4 className="font-bold text-slate-900 uppercase tracking-wider mb-1">About & Profile</h4>
                <p className="text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                  {selectedAdvocateProfile.bio || 'Advocate handling trial litigation and dispute resolution.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Bar Enrolment</span>
                  <span className="font-mono font-bold text-slate-800">
                    {selectedAdvocateProfile.barCouncilRegistration?.registrationNumber || 'Registered'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Experience</span>
                  <span className="font-bold text-slate-800">{selectedAdvocateProfile.experienceYears || 0} Years</span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-legal-blue" />
                  <span>Past Work Experiences ({selectedAdvocateProfile.experiences?.length || 0})</span>
                </h4>
                {!selectedAdvocateProfile.experiences || selectedAdvocateProfile.experiences.length === 0 ? (
                  <p className="text-slate-400 italic">No past experiences listed.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedAdvocateProfile.experiences.map((exp, i) => (
                      <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-900">{exp.role}</span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {exp.isCurrent ? 'Present' : `${exp.fromYear} - ${exp.toYear}`}
                          </span>
                        </div>
                        <p className="text-slate-700 font-medium">{exp.organization} • {exp.location}</p>
                        {exp.description && <p className="text-slate-600 text-[11px]">{exp.description}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {isLawyer && (
                <div>
                  <h4 className="font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Gavel className="w-4 h-4 text-legal-blue" />
                    <span>Case Histories & Precedents ({selectedAdvocateProfile.caseHistories?.length || 0})</span>
                  </h4>
                  {!selectedAdvocateProfile.caseHistories || selectedAdvocateProfile.caseHistories.length === 0 ? (
                    <p className="text-slate-400 italic">No case histories uploaded.</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedAdvocateProfile.caseHistories.map((ch, i) => (
                        <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-900">{ch.title}</span>
                            <span className="text-[10px] text-slate-500 font-mono">{ch.year}</span>
                          </div>
                          <p className="text-[11px] text-slate-500">{ch.forum} • {ch.category}</p>
                          <p className="text-slate-600">{ch.summary}</p>
                          <div className="p-2 bg-emerald-50 rounded-lg text-emerald-900 text-[11px]">
                            <strong>Outcome: </strong>{ch.outcome}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedAdvocateProfile(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                Close
              </button>
              {!isLawyer && (
                isLawStudent ? (
                  <button
                    onClick={() => {
                      const prof = selectedAdvocateProfile;
                      setSelectedAdvocateProfile(null);
                      openMentorshipModal(prof);
                    }}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow flex items-center gap-1.5 cursor-pointer"
                  >
                    <GraduationCap className="w-4 h-4 text-emerald-200" />
                    <span>Request Mentorship & Training</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      const prof = selectedAdvocateProfile;
                      setSelectedAdvocateProfile(null);
                      openConsultModal(prof);
                    }}
                    className="px-5 py-2.5 bg-legal-blue hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5 text-legal-gold" />
                    <span>Request Consultation</span>
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: MATCH ENGINE ── */}
      {isMatchModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-start justify-center pt-3 sm:pt-6 p-3 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-4 sm:p-6 space-y-3.5 my-auto sm:my-0">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-legal-blue to-blue-700 flex items-center justify-center text-white shadow-sm shrink-0">
                  <Sparkles className="w-4 h-4 text-legal-gold" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    Match Verified Advocate
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Select a case from your account or upload a legal notice / FIR
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
                <span>Select My Case</span>
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
                <span>Upload Case PDF</span>
              </button>
            </div>

            {matchMode === 'case' ? (
              <div className="space-y-3">
                {myCases.length > 0 && (
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
                            <span className="text-[9px] font-bold px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded">
                              {c.category || 'General'}
                            </span>
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
                )}

                <div className="space-y-1.5">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase">
                    ⚡ Quick Sample Case Presets:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                    {DEMO_CASES.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => setSelectedCaseId(d.id)}
                        className={`p-2 rounded-xl border text-left transition flex flex-col justify-between ${
                          selectedCaseId === d.id
                            ? 'bg-blue-50 border-legal-blue ring-1 ring-legal-blue'
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <h4 className="text-[11px] font-bold text-slate-900 line-clamp-2">{d.title}</h4>
                        <span className="text-[9px] text-slate-400 mt-1">📍 {d.location.city}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".pdf,.txt,.doc,.docx"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setUploadedFileName(file.name);
                      const reader = new FileReader();
                      reader.onload = (evt) => setUploadedFileText(evt.target?.result || file.name);
                      reader.readAsText(file);
                    }
                  }}
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-legal-blue rounded-2xl p-4 text-center cursor-pointer bg-slate-50 hover:bg-blue-50/50 transition space-y-1"
                >
                  <Upload className="w-5 h-5 text-legal-blue mx-auto" />
                  <p className="text-xs font-bold text-slate-800">
                    {uploadedFileName ? `✓ ${uploadedFileName}` : 'Click to upload Case Document'}
                  </p>
                </div>

                <div className="space-y-1">
                  {DEMO_PDFS.map((demo) => (
                    <button
                      key={demo.name}
                      type="button"
                      onClick={() => {
                        setUploadedFileName(demo.name);
                        setUploadedFileText(demo.text);
                      }}
                      className={`w-full p-2 rounded-xl border text-left transition flex items-center justify-between text-xs ${
                        uploadedFileName === demo.name
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="truncate max-w-[240px] text-[11px]">{demo.name}</span>
                      <span className="text-[9px] text-slate-400">{demo.city}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

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
                className="px-5 py-2.5 bg-gradient-to-r from-legal-blue to-blue-700 hover:from-blue-600 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-2"
              >
                {matching ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Analyzing Match Matrix...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-legal-gold" />
                    <span>⚡ Find Matched Advocates</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: CONSULTATION REQUEST ── */}
      {isConsultModalOpen && consultLawyer && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-start justify-center pt-3 sm:pt-6 p-3 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-5 sm:p-6 space-y-4 my-auto sm:my-0">
            {consultSuccess ? (
              <div className="text-center py-4 space-y-4 animate-in zoom-in-95 duration-200">
                <div className="w-14 h-14 bg-emerald-100 border-2 border-emerald-300 rounded-3xl flex items-center justify-center mx-auto text-emerald-600 shadow-sm">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mt-2">
                    Request Sent to {consultSuccess.lawyerName}!
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Your request was delivered directly to the advocate's legal console.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsConsultModalOpen(false)}
                  className="w-full py-3 bg-gradient-to-r from-legal-blue to-blue-700 hover:from-blue-600 text-white font-bold text-xs rounded-xl shadow transition"
                >
                  Done • Return to Directory
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitConsult} className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900">
                    Request Consultation with {consultLawyer.fullName}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsConsultModalOpen(false)}
                    className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Select Case File *
                  </label>
                  {citizenUserCases.length === 0 ? (
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
                      No filed cases available. Create one from Case Management first.
                    </div>
                  ) : (
                    <select
                      value={selectedCaseForConsult}
                      onChange={(e) => setSelectedCaseForConsult(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                    >
                      {citizenUserCases.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.caseNumber || 'CASE'} — {c.title}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Note for Advocate
                  </label>
                  <textarea
                    rows={2}
                    value={consultForm.notes}
                    onChange={(e) => setConsultForm({ ...consultForm, notes: e.target.value })}
                    placeholder="Provide details on your case situation and urgency..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs resize-none"
                  />
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsConsultModalOpen(false)}
                    className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingConsult || citizenUserCases.length === 0}
                    className="px-5 py-2.5 bg-gradient-to-r from-legal-blue to-blue-700 hover:from-blue-600 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-2"
                  >
                    {submittingConsult ? (
                      <span>Submitting...</span>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5 text-legal-gold" />
                        <span>Send Request</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL: REJECT REQUEST ── */}
      {rejectModalData && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Decline Client Request</h3>
              <button
                onClick={() => setRejectModalData(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Decline representation request for case{' '}
              <strong>{rejectModalData.case?.title || rejectModalData.case?.caseNumber}</strong>?
            </p>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Reason / Note for Client (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Current trial calendar full..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setRejectModalData(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRespondToRequest(rejectModalData._id, 'REJECT', rejectionReason)}
                className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow"
              >
                Confirm Decline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: ACCEPT REQUEST ── */}
      {acceptModalData && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 text-emerald-700">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Accept Case Representation</span>
              </h3>
              <button
                onClick={() => setAcceptModalData(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Accept this request to assign yourself as the legal counsel for this case file.
            </p>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1.5">
              <p className="font-bold text-slate-900">{acceptModalData.case?.title || 'Legal Dispute'}</p>
              <p className="text-slate-500 font-mono text-[11px]">Case: {acceptModalData.case?.caseNumber || 'N/A'}</p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setAcceptModalData(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRespondToRequest(acceptModalData._id, 'ACCEPT')}
                disabled={respondingId === acceptModalData._id}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow flex items-center gap-1.5"
              >
                {respondingId === acceptModalData._id ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>Confirm & Accept</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: TRANSPARENT BREAKDOWN ── */}
      {selectedLawyerExplanation && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 uppercase">
                  Match Breakdown
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

            <button
              onClick={() => setSelectedLawyerExplanation(null)}
              className="w-full py-3 bg-[#0B1F33] text-white font-bold text-xs rounded-2xl transition shadow"
            >
              Close Breakdown
            </button>
          </div>
        </div>
      )}

      {/* ── MODAL: ONGOING CASE DOSSIER ── */}
      {selectedOngoingCase && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 sm:p-8 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-legal-blue bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                  {selectedOngoingCase.caseNumber}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-2">{selectedOngoingCase.title}</h3>
              </div>
              <button
                onClick={() => setSelectedOngoingCase(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Domain</span>
                  <span className="font-bold text-slate-800">{selectedOngoingCase.category}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Status</span>
                  <span className="font-bold text-emerald-700">{selectedOngoingCase.status}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Urgency</span>
                  <span className="font-bold text-red-600">{selectedOngoingCase.urgency}</span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 uppercase tracking-wider mb-1">Issue</h4>
                <p className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 leading-relaxed text-slate-700">
                  {selectedOngoingCase.issue}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 uppercase tracking-wider mb-1">Case Narrative</h4>
                <p className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 leading-relaxed text-slate-700">
                  {selectedOngoingCase.description}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedOngoingCase(null)}
                className="px-5 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl shadow hover:bg-slate-800 transition"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: STUDENT MENTORSHIP & TRAINING REQUEST ── */}
      {isMentorshipModalOpen && mentorshipAdvocate && (
        <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Request Mentorship & Training</h3>
                  <p className="text-xs text-slate-500 font-medium">Connect with {mentorshipAdvocate.fullName}</p>
                </div>
              </div>
              <button
                onClick={() => setIsMentorshipModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {mentorshipSuccess ? (
              <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-emerald-900">Mentorship Application Dispatched!</h4>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  Your mentorship and courtroom training inquiry has been sent to <strong>{mentorshipSuccess.advocateName}</strong>. You will be notified when the advocate reviews your application.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => {
                      setIsMentorshipModalOpen(false);
                      setActiveSubTab('myMentorships');
                    }}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow cursor-pointer"
                  >
                    View My Mentorship Applications
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSendMentorshipRequest} className="space-y-4 text-xs">
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-slate-700 leading-relaxed">
                  <strong className="text-blue-900 block mb-0.5">Advocate Mentorship Program:</strong>
                  Connect directly with practicing advocates for internship opportunities, courtroom advocacy guidance, and case research training.
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Law School / College & University
                  </label>
                  <input
                    type="text"
                    required
                    value={mentorshipForm.studentCollege}
                    onChange={(e) => setMentorshipForm({ ...mentorshipForm, studentCollege: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="e.g. Faculty of Law, DU"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Year of Study
                    </label>
                    <select
                      value={mentorshipForm.studentYear}
                      onChange={(e) => setMentorshipForm({ ...mentorshipForm, studentYear: e.target.value })}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                    >
                      <option value="1st Year LL.B">1st Year LL.B</option>
                      <option value="2nd Year LL.B">2nd Year LL.B</option>
                      <option value="3rd Year LL.B">3rd Year LL.B</option>
                      <option value="4th Year BA LL.B">4th Year BA LL.B</option>
                      <option value="5th Year BA LL.B">5th Year BA LL.B</option>
                      <option value="LL.M Candidate">LL.M Candidate</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Training Focus Area
                    </label>
                    <select
                      value={mentorshipForm.mentorshipFocus}
                      onChange={(e) => setMentorshipForm({ ...mentorshipForm, mentorshipFocus: e.target.value })}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium truncate"
                    >
                      <option value="🏛️ Courtroom Advocacy & Trial Practice">🏛️ Courtroom Advocacy</option>
                      <option value="📜 Legal Drafting & Brief Preparation">📜 Legal Drafting & Briefs</option>
                      <option value="🔬 Precedent Research & Case Grounding">🔬 Precedent Research</option>
                      <option value="⚖️ General Legal Career & Bar Exam Guidance">⚖️ General Mentorship</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Cover Note / Introduction to Advocate
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={mentorshipForm.coverNote}
                    onChange={(e) => setMentorshipForm({ ...mentorshipForm, coverNote: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none leading-relaxed"
                    placeholder="Introduce yourself, specify your career aspirations, and explain why you want to train under this advocate..."
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsMentorshipModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingMentorship}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {submittingMentorship ? (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <>
                        <GraduationCap className="w-4 h-4 text-emerald-200" />
                        <span>Submit Mentorship Request</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}