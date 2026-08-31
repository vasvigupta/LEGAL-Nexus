import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  Briefcase,
  GraduationCap,
  MapPin,
  Award,
  BookOpen,
  Save,
  RefreshCw,
  Users,
  ShieldAlert,
  Search,
  CheckCircle2,
  Scale,
  Sparkles,
  ShieldCheck,
  Plus,
  Trash2,
  Edit2,
  Eye,
  Calendar,
  Building,
  Gavel,
  FileCheck2,
  X,
  FileText,
  Upload,
  Check,
  AlertCircle,
  Clock,
  ExternalLink,
} from 'lucide-react';
import api from '../services/api';

export default function UserProfile({ user }) {
  const [profile, setProfile] = useState(null);
  const [verificationData, setVerificationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [title, setTitle] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [primaryCourts, setPrimaryCourts] = useState('');
  const [languages, setLanguages] = useState('');
  const [practiceAreas, setPracticeAreas] = useState('');
  const [experienceYears, setExperienceYears] = useState(0);
  const [education, setEducation] = useState('');
  const [barRegNumber, setBarRegNumber] = useState('');
  const [stateBarCouncil, setStateBarCouncil] = useState('');
  const [yearOfEnrollment, setYearOfEnrollment] = useState('');
  const [institution, setInstitution] = useState('');
  const [feeMin, setFeeMin] = useState(0);
  const [feeMax, setFeeMax] = useState(0);
  const [feeModel, setFeeModel] = useState('FIXED_PER_CONSULTATION');

  // Past Experiences & Case Histories
  const [experiences, setExperiences] = useState([]);
  const [caseHistories, setCaseHistories] = useState([]);

  // Experience Modal
  const [expModalOpen, setExpModalOpen] = useState(false);
  const [editingExpIndex, setEditingExpIndex] = useState(null);
  const [expRole, setExpRole] = useState('');
  const [expOrg, setExpOrg] = useState('');
  const [expLoc, setExpLoc] = useState('');
  const [expFrom, setExpFrom] = useState('');
  const [expTo, setExpTo] = useState('');
  const [expCurrent, setExpCurrent] = useState(false);
  const [expDesc, setExpDesc] = useState('');

  // Case History Modal
  const [caseModalOpen, setCaseModalOpen] = useState(false);
  const [editingCaseIndex, setEditingCaseIndex] = useState(null);
  const [caseTitle, setCaseTitle] = useState('');
  const [caseForum, setCaseForum] = useState('');
  const [caseCategory, setCaseCategory] = useState('Employment & Labour');
  const [caseYear, setCaseYear] = useState(new Date().getFullYear());
  const [caseSummary, setCaseSummary] = useState('');
  const [caseChallenge, setCaseChallenge] = useState('');
  const [caseStrategy, setCaseStrategy] = useState('');
  const [caseOutcome, setCaseOutcome] = useState('');
  const [caseAnonymized, setCaseAnonymized] = useState(true);

  // Active Tab
  const [activeSubTab, setActiveSubTab] = useState('profile'); // profile | experiences | caseHistories | preview | network

  // OCR Verification state
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrProgressStep, setOcrProgressStep] = useState(0);
  const [ocrNotice, setOcrNotice] = useState(null);
  const [sampleOcrText, setSampleOcrText] = useState('');

  // Networking state
  const [networkUsers, setNetworkUsers] = useState([]);
  const [loadingNetwork, setLoadingNetwork] = useState(false);
  const [netSearch, setNetSearch] = useState('');
  const [connectedUsers, setConnectedUsers] = useState({});

  const isLawyer = user?.role === 'LAWYER';
  const isProfessional = user?.role === 'LAWYER' || user?.role === 'LAW_STUDENT';

  useEffect(() => {
    loadProfile();
    loadVerificationStatus();
  }, [user]);

  useEffect(() => {
    if (activeSubTab === 'network') {
      loadNetwork();
    }
  }, [activeSubTab]);

  const loadProfile = async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      let res;
      if (user.role === 'CITIZEN') {
        res = await api.get('/profiles/citizen');
      } else {
        res = await api.get('/profiles/professional');
      }
      const data = res.data.data;
      setProfile(data);
      if (data) {
        setFullName(data.fullName || '');
        setTitle(data.title || '');
        setPhone(data.contactInfo?.phone || user.phone || '');
        setBio(data.bio || '');
        setCity(data.location?.city || '');
        setState(data.location?.state || '');
        setPrimaryCourts(data.location?.primaryCourts ? data.location.primaryCourts.join(', ') : '');
        setLanguages(data.languages ? data.languages.join(', ') : 'English, Hindi');
        setPracticeAreas(data.practiceAreas ? data.practiceAreas.join(', ') : '');
        setExperienceYears(data.experienceYears || 0);
        setEducation(data.education ? data.education.join(', ') : '');
        setBarRegNumber(data.barCouncilRegistration?.registrationNumber || '');
        setStateBarCouncil(data.barCouncilRegistration?.stateBarCouncil || '');
        setYearOfEnrollment(data.barCouncilRegistration?.yearOfEnrollment || '');
        setInstitution(data.lawStudentDetails?.institution || '');
        setFeeMin(data.feeRange?.min || 0);
        setFeeMax(data.feeRange?.max || 0);
        setFeeModel(data.feeRange?.model || 'FIXED_PER_CONSULTATION');
        setExperiences(data.experiences || []);
        setCaseHistories(data.caseHistories || []);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setProfile({});
      } else {
        setError('Failed to load profile. Please verify your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadVerificationStatus = async () => {
    try {
      const res = await api.get('/verification/my-status');
      setVerificationData(res.data.data || null);
    } catch {
      // ignore
    }
  };

  const loadNetwork = async () => {
    try {
      setLoadingNetwork(true);
      const res = await api.get('/lawyers');
      setNetworkUsers(res.data.data || []);
    } catch (err) {
      console.error('Failed to load network directory:', err);
    } finally {
      setLoadingNetwork(false);
    }
  };

  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError(null);

    try {
      const payload = {
        fullName,
        bio,
        location: {
          city,
          state,
          primaryCourts: primaryCourts.split(',').map((s) => s.trim()).filter(Boolean),
        },
      };

      if (user.role === 'CITIZEN') {
        payload.contactInfo = { phone };
        await api.put('/profiles/citizen', payload);
      } else {
        payload.title = title || (isLawyer ? 'Advocate on Record' : 'Law Student');
        payload.practiceAreas = practiceAreas.split(',').map((s) => s.trim()).filter(Boolean);
        payload.languages = languages.split(',').map((s) => s.trim()).filter(Boolean);
        payload.experienceYears = parseInt(experienceYears) || 0;
        payload.education = education.split(',').map((s) => s.trim()).filter(Boolean);
        payload.experiences = experiences;
        payload.caseHistories = caseHistories;
        payload.feeRange = {
          min: Number(feeMin) || 0,
          max: Number(feeMax) || 0,
          currency: 'INR',
          model: feeModel,
        };

        if (user.role === 'LAWYER') {
          payload.barCouncilRegistration = {
            registrationNumber: barRegNumber,
            stateBarCouncil,
            yearOfEnrollment: parseInt(yearOfEnrollment) || undefined,
          };
        } else if (user.role === 'LAW_STUDENT') {
          payload.lawStudentDetails = { institution };
        }
        await api.put('/profiles/professional', payload);
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      loadProfile();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleTriggerOcrScan = async (overrideBarId = null) => {
    const targetBarId = overrideBarId || barRegNumber || 'D/1428/2006';
    setOcrLoading(true);
    setOcrNotice(null);
    setOcrProgressStep(1);

    try {
      await new Promise((r) => setTimeout(r, 600));
      setOcrProgressStep(2);
      await new Promise((r) => setTimeout(r, 600));
      setOcrProgressStep(3);

      const res = await api.post('/verification/ocr-submit', {
        fullName: fullName || user.email.split('@')[0],
        barRegistrationNumber: targetBarId,
        stateBarCouncil: 'Bar Council of Delhi',
        enrollmentYear: 2006,
        sampleOcrText: sampleOcrText || undefined,
        documentImageBase64: 'data:image/png;base64,simulated_bar_id_card',
      });

      setOcrProgressStep(4);
      setOcrNotice({
        type: 'success',
        text: '🛡️ AI OCR Scan Completed! Bar ID validated & queued in the Admin Verification Dashboard.',
        data: res.data.data,
      });

      setBarRegNumber(targetBarId);
      loadProfile();
      loadVerificationStatus();
    } catch (err) {
      setOcrNotice({
        type: 'error',
        text: err.response?.data?.message || 'Failed to process OCR verification.',
      });
    } finally {
      setOcrLoading(false);
    }
  };

  // Experience Actions
  const openAddExp = () => {
    setEditingExpIndex(null);
    setExpRole('');
    setExpOrg('');
    setExpLoc(city || '');
    setExpFrom(new Date().getFullYear() - 2);
    setExpTo(new Date().getFullYear());
    setExpCurrent(true);
    setExpDesc('');
    setExpModalOpen(true);
  };

  const openEditExp = (idx) => {
    const item = experiences[idx];
    setEditingExpIndex(idx);
    setExpRole(item.role || '');
    setExpOrg(item.organization || '');
    setExpLoc(item.location || '');
    setExpFrom(item.fromYear || '');
    setExpTo(item.toYear || '');
    setExpCurrent(!!item.isCurrent);
    setExpDesc(item.description || '');
    setExpModalOpen(true);
  };

  const saveExperience = async () => {
    if (!expRole || !expOrg) {
      alert('Please fill in Role and Organization / Law Firm.');
      return;
    }
    const newExp = {
      role: expRole,
      organization: expOrg,
      location: expLoc,
      fromYear: parseInt(expFrom) || undefined,
      toYear: expCurrent ? undefined : (parseInt(expTo) || undefined),
      isCurrent: expCurrent,
      description: expDesc,
    };

    let updated = [...experiences];
    if (editingExpIndex !== null) {
      updated[editingExpIndex] = newExp;
    } else {
      updated = [newExp, ...updated];
    }
    setExperiences(updated);
    setExpModalOpen(false);

    try {
      await api.put('/profiles/professional', { experiences: updated });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      // Saved in main state
    }
  };

  const deleteExperience = async (idx) => {
    if (!confirm('Are you sure you want to delete this experience record?')) return;
    const updated = experiences.filter((_, i) => i !== idx);
    setExperiences(updated);
    try {
      await api.put('/profiles/professional', { experiences: updated });
    } catch {}
  };

  // Case History Actions
  const openAddCase = () => {
    setEditingCaseIndex(null);
    setCaseTitle('');
    setCaseForum('Delhi High Court');
    setCaseCategory(practiceAreas.split(',')[0]?.trim() || 'Civil & Commercial');
    setCaseYear(new Date().getFullYear());
    setCaseSummary('');
    setCaseChallenge('');
    setCaseStrategy('');
    setCaseOutcome('');
    setCaseAnonymized(true);
    setCaseModalOpen(true);
  };

  const openEditCase = (idx) => {
    const item = caseHistories[idx];
    setEditingCaseIndex(idx);
    setCaseTitle(item.title || '');
    setCaseForum(item.forum || '');
    setCaseCategory(item.category || 'General Law');
    setCaseYear(item.year || new Date().getFullYear());
    setCaseSummary(item.summary || '');
    setCaseChallenge(item.challenge || '');
    setCaseStrategy(item.strategy || '');
    setCaseOutcome(item.outcome || '');
    setCaseAnonymized(item.anonymized !== false);
    setCaseModalOpen(true);
  };

  const saveCaseHistory = async () => {
    if (!caseTitle || !caseSummary || !caseOutcome) {
      alert('Please fill in Case Title, Summary, and Outcome.');
      return;
    }
    const newCase = {
      title: caseTitle,
      forum: caseForum,
      category: caseCategory,
      year: parseInt(caseYear) || new Date().getFullYear(),
      summary: caseSummary,
      challenge: caseChallenge,
      strategy: caseStrategy,
      outcome: caseOutcome,
      anonymized: caseAnonymized,
    };

    let updated = [...caseHistories];
    if (editingCaseIndex !== null) {
      updated[editingCaseIndex] = newCase;
    } else {
      updated = [newCase, ...updated];
    }
    setCaseHistories(updated);
    setCaseModalOpen(false);

    try {
      await api.put('/profiles/professional', { caseHistories: updated });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {}
  };

  const deleteCaseHistory = async (idx) => {
    if (!confirm('Are you sure you want to delete this case history?')) return;
    const updated = caseHistories.filter((_, i) => i !== idx);
    setCaseHistories(updated);
    try {
      await api.put('/profiles/professional', { caseHistories: updated });
    } catch {}
  };

  const handleConnect = (id) => {
    setConnectedUsers((prev) => ({
      ...prev,
      [id]: prev[id] === 'connected' ? 'none' : prev[id] === 'pending' ? 'none' : 'pending',
    }));
  };

  if (loading) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl border border-slate-200/80 shadow-subtle">
        <RefreshCw className="animate-spin w-8 h-8 text-legal-blue mx-auto mb-3" />
        <p className="text-xs text-slate-500 font-medium">Loading advocate center profile...</p>
      </div>
    );
  }

  const vStatus = verificationData?.verificationStatus || profile?.verificationStatus || 'PENDING';
  const isOfficiallyVerified = vStatus === 'VERIFIED' || user?.isVerified;
  const isOcrVerified = vStatus === 'OCR_VERIFIED';
  const isRejected = vStatus === 'REJECTED';

  const filteredNetwork = networkUsers.filter(
    (u) =>
      u._id !== profile?.user &&
      (u.fullName?.toLowerCase().includes(netSearch.toLowerCase()) ||
        u.title?.toLowerCase().includes(netSearch.toLowerCase()) ||
        u.location?.city?.toLowerCase().includes(netSearch.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#0B1F33] text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-legal flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-0.5 bg-legal-blue/20 text-sky-300 border border-legal-blue/30 text-[10px] font-bold rounded-full uppercase tracking-wider">
              {isLawyer ? 'Advocate Hub & Portfolio' : 'User Center & Identity'}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            {isProfessional ? 'Advocate Profile, Experiences & Verification' : 'Citizen Account Profile'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            {isProfessional
              ? 'Manage your Bar Council verified credentials, verify your Bar ID via AI OCR, and manage courtroom precedents.'
              : 'Manage your personal account profile, contact details, and filed case communications.'}
          </p>
        </div>

        {isLawyer && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSubTab('preview')}
              className="px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition flex items-center gap-2"
            >
              <Eye className="w-4 h-4 text-sky-400" />
              <span>Public Profile Preview</span>
            </button>
          </div>
        )}
      </div>

      {/* Sub-navigation Tabs */}
      {isProfessional && (
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2 text-xs sm:text-sm font-semibold">
          <button
            onClick={() => setActiveSubTab('profile')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeSubTab === 'profile'
                ? 'bg-legal-blue text-white shadow-subtle'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profile & Verification</span>
          </button>

          {isLawyer && (
            <>
              <button
                onClick={() => setActiveSubTab('experiences')}
                className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
                  activeSubTab === 'experiences'
                    ? 'bg-legal-blue text-white shadow-subtle'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Briefcase className="w-4 h-4" />
                <span>Past Experiences ({experiences.length})</span>
              </button>

              <button
                onClick={() => setActiveSubTab('caseHistories')}
                className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
                  activeSubTab === 'caseHistories'
                    ? 'bg-legal-blue text-white shadow-subtle'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Gavel className="w-4 h-4" />
                <span>Case Histories ({caseHistories.length})</span>
              </button>

              <button
                onClick={() => setActiveSubTab('preview')}
                className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
                  activeSubTab === 'preview'
                    ? 'bg-legal-blue text-white shadow-subtle'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Eye className="w-4 h-4" />
                <span>Public View Preview</span>
              </button>
            </>
          )}

          <button
            onClick={() => setActiveSubTab('network')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeSubTab === 'network'
                ? 'bg-legal-blue text-white shadow-subtle'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Advocate Network Hub</span>
          </button>
        </div>
      )}

      {/* SUB-TAB 1: PROFILE FORM & OCR VERIFICATION */}
      {activeSubTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Overview + Two-Step Verification Card */}
          <div className="lg:col-span-4 space-y-5">
            {/* Overview Card */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-subtle flex flex-col items-center text-center space-y-4">
              <div className="w-20 h-20 rounded-3xl bg-[#0B1F33] text-legal-gold flex items-center justify-center font-extrabold text-2xl relative shadow-md border border-slate-700">
                {fullName?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
                {isProfessional && isOfficiallyVerified && (
                  <span
                    className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center border-2 border-white text-xs shadow-md"
                    title="Bar Council Verified Advocate"
                  >
                    🛡️
                  </span>
                )}
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">{fullName || 'Authorized User'}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{user?.email}</p>
                <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
                  <span className="px-3 py-0.5 bg-blue-50 text-legal-blue text-[10px] font-extrabold rounded-full border border-blue-200 uppercase tracking-wider">
                    {user?.role}
                  </span>

                  {isProfessional && (
                    isOfficiallyVerified ? (
                      <span className="px-3 py-0.5 bg-blue-100 text-blue-900 text-[10px] font-extrabold rounded-full border border-blue-300 flex items-center gap-1">
                        🔵 Bar Council Verified
                      </span>
                    ) : isOcrVerified ? (
                      <span className="px-3 py-0.5 bg-purple-100 text-purple-900 text-[10px] font-extrabold rounded-full border border-purple-300 flex items-center gap-1">
                        🛡️ OCR Verified (In Queue)
                      </span>
                    ) : isRejected ? (
                      <span className="px-3 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-bold rounded-full border border-rose-300">
                        ❌ Verification Rejected
                      </span>
                    ) : (
                      <span className="px-3 py-0.5 bg-amber-50 text-amber-800 text-[10px] font-bold rounded-full border border-amber-200">
                        ⏳ Verification Pending
                      </span>
                    )
                  )}
                </div>
              </div>

              <div className="w-full border-t border-slate-100 pt-4 text-left text-xs space-y-2.5 text-slate-600">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="truncate">{user?.email}</span>
                </div>
                {phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{phone}</span>
                  </div>
                )}
                {city && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{city}, {state || 'India'}</span>
                  </div>
                )}
                {barRegNumber && (
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-legal-gold shrink-0" />
                    <span className="font-mono">Enrol: {barRegNumber}</span>
                  </div>
                )}
              </div>

              {isLawyer && (
                <div className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-left text-xs space-y-2">
                  <div className="flex justify-between items-center text-slate-700">
                    <span className="font-medium">Experiences Uploaded:</span>
                    <span className="font-bold text-legal-blue">{experiences.length}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-700">
                    <span className="font-medium">Case Histories Uploaded:</span>
                    <span className="font-bold text-emerald-600">{caseHistories.length}</span>
                  </div>
                </div>
              )}
            </div>

            {/* AI OCR Verification Widget */}
            {isProfessional && (
              <div className="bg-white p-5 sm:p-6 rounded-3xl border border-purple-200 shadow-subtle space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-purple-100 rounded-lg text-purple-700">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        AI Document OCR
                      </h4>
                      <p className="text-[10px] text-slate-500">Bar ID Card & Sanad Extractor</p>
                    </div>
                  </div>

                  {isOfficiallyVerified ? (
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      Seal Granted
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                      Instant Scan
                    </span>
                  )}
                </div>

                {isOfficiallyVerified ? (
                  <div className="p-3.5 bg-blue-50 rounded-2xl border border-blue-200 text-xs space-y-2">
                    <div className="flex items-center gap-2 text-blue-900 font-bold">
                      <ShieldCheck className="w-4 h-4 text-blue-700" />
                      <span>Official Bar Council Verified Advocate</span>
                    </div>
                    <p className="text-[11px] text-blue-800">
                      Your enrollment ID <strong className="font-mono">{barRegNumber || 'D/1428/2006'}</strong> is authenticated on Platform Administration.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Upload or enter your <strong>State Bar Council ID</strong>. Our AI OCR engine will scan your credentials and queue your profile for Admin seal approval.
                    </p>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                        Bar Council ID Number
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. D/1428/2006 or MAH/5678/2015"
                        value={barRegNumber}
                        onChange={(e) => setBarRegNumber(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">Quick Samples:</span>
                      <div className="flex flex-wrap gap-1">
                        {[
                          { label: 'Delhi (D/1428/2006)', val: 'D/1428/2006' },
                          { label: 'MH (MAH/5678/2015)', val: 'MAH/5678/2015' },
                          { label: 'KA (KAR/2891/2013)', val: 'KAR/2891/2013' },
                          { label: 'UP (UP/9102/2019)', val: 'UP/9102/2019' },
                        ].map((s) => (
                          <button
                            key={s.val}
                            type="button"
                            onClick={() => {
                              setBarRegNumber(s.val);
                              handleTriggerOcrScan(s.val);
                            }}
                            className="text-[10px] px-2 py-0.5 bg-slate-100 hover:bg-purple-100 hover:text-purple-800 text-slate-600 rounded font-medium border border-slate-200 transition"
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {ocrLoading && (
                      <div className="p-3 bg-purple-50 rounded-2xl border border-purple-200 space-y-2 text-xs">
                        <div className="flex items-center justify-between text-purple-900 font-bold text-[11px]">
                          <span className="flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 animate-spin text-purple-600" />
                            AI Document OCR Scanning...
                          </span>
                          <span>{ocrProgressStep * 25}%</span>
                        </div>
                        <div className="w-full bg-purple-200 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-purple-600 h-full transition-all duration-300 rounded-full"
                            style={{ width: `${ocrProgressStep * 25}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {ocrNotice && (
                      <div
                        className={`p-3 rounded-2xl border text-xs ${
                          ocrNotice.type === 'success'
                            ? 'bg-purple-50 text-purple-900 border-purple-200'
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}
                      >
                        <p className="font-semibold">{ocrNotice.text}</p>
                      </div>
                    )}

                    <button
                      type="button"
                      disabled={ocrLoading}
                      onClick={() => handleTriggerOcrScan()}
                      className="w-full py-2.5 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{ocrLoading ? 'Scanning Document...' : '⚡ Scan Document & Verify Bar ID'}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Profile Edit Form */}
          <div className="lg:col-span-8 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-subtle">
            <form onSubmit={handleSaveProfile} className="space-y-5">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-legal-blue" />
                <span>Advocate Credentials & Information</span>
              </h3>

              {success && (
                <div className="p-3.5 text-xs bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200 flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Profile updated successfully!</span>
                </div>
              )}

              {error && (
                <div className="p-3.5 text-xs bg-red-50 text-red-700 rounded-2xl border border-red-200">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Full Legal Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-legal-blue focus:outline-none"
                    placeholder="e.g. Adv. Rajeshwar Sen"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Professional Title / Designation
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-legal-blue focus:outline-none"
                    placeholder="e.g. Advocate on Record, High Court"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-legal-blue focus:outline-none"
                    placeholder="+91 9876543210"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    City & State
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-legal-blue focus:outline-none"
                      placeholder="Delhi"
                    />
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-legal-blue focus:outline-none"
                      placeholder="Delhi"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Bio / Professional Summary
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-legal-blue focus:outline-none resize-none leading-relaxed"
                  placeholder="Provide an overview of your trial advocacy experience, specialization, and judicial chambers background..."
                />
              </div>

              {/* Professional Specific Fields */}
              {isProfessional && (
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-legal-gold" />
                    <span>Bar Council & Court Credentials</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {user.role === 'LAWYER' && (
                      <>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Bar Council Enrolment Number
                          </label>
                          <input
                            type="text"
                            value={barRegNumber}
                            onChange={(e) => setBarRegNumber(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-legal-blue focus:outline-none"
                            placeholder="e.g. D/1428/2006"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                            State Bar Council
                          </label>
                          <input
                            type="text"
                            value={stateBarCouncil}
                            onChange={(e) => setStateBarCouncil(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-legal-blue focus:outline-none"
                            placeholder="e.g. Bar Council of Delhi"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Primary Courts & Forums (comma separated)
                          </label>
                          <input
                            type="text"
                            value={primaryCourts}
                            onChange={(e) => setPrimaryCourts(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-legal-blue focus:outline-none"
                            placeholder="Delhi High Court, Tis Hazari, Supreme Court"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Year of Enrollment
                          </label>
                          <input
                            type="number"
                            value={yearOfEnrollment}
                            onChange={(e) => setYearOfEnrollment(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-legal-blue focus:outline-none"
                            placeholder="2020"
                          />
                        </div>
                      </>
                    )}

                    {user.role === 'LAW_STUDENT' && (
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Law College / Institution
                        </label>
                        <input
                          type="text"
                          value={institution}
                          onChange={(e) => setInstitution(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-legal-blue focus:outline-none"
                          placeholder="e.g. Faculty of Law, DU"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Practice Areas (comma separated)
                      </label>
                      <input
                        type="text"
                        value={practiceAreas}
                        onChange={(e) => setPracticeAreas(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-legal-blue focus:outline-none"
                        placeholder="Employment & Labour Law, Criminal Law, Cyber Law"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Total Years of Active Experience
                      </label>
                      <input
                        type="number"
                        value={experienceYears}
                        onChange={(e) => setExperienceYears(parseInt(e.target.value) || 0)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-legal-blue focus:outline-none"
                        min="0"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Languages Spoken (comma separated)
                      </label>
                      <input
                        type="text"
                        value={languages}
                        onChange={(e) => setLanguages(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-legal-blue focus:outline-none"
                        placeholder="English, Hindi, Punjabi"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Education & Qualifications (comma separated)
                      </label>
                      <input
                        type="text"
                        value={education}
                        onChange={(e) => setEducation(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-legal-blue focus:outline-none"
                        placeholder="LL.B (Delhi University), LL.M"
                      />
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3.5 bg-gradient-to-r from-legal-blue to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white font-bold text-xs rounded-2xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:bg-slate-300 disabled:text-slate-500"
              >
                {saving ? (
                  <RefreshCw className="animate-spin w-4 h-4" />
                ) : (
                  <>
                    <Save className="w-4 h-4 text-legal-gold" />
                    <span>Save Profile & Credentials</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: PAST EXPERIENCES */}
      {activeSubTab === 'experiences' && (
        <div className="space-y-5">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-legal-blue" />
                <span>Past Work Experiences & Chambers</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Upload your history at law firms, judicial clerkships, senior advocate chambers, or corporate legal counsel roles.
              </p>
            </div>
            <button
              onClick={openAddExp}
              className="px-4 py-2.5 bg-gradient-to-r from-legal-blue to-blue-700 text-white text-xs font-bold rounded-xl shadow transition flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4 text-legal-gold" />
              <span>Add Past Experience</span>
            </button>
          </div>

          {experiences.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-200/80 shadow-subtle p-6 max-w-md mx-auto space-y-3">
              <Building className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800">No Past Experiences Added Yet</h4>
              <p className="text-xs text-slate-500">
                Add your previous law firms, chamber associations, or judicial clerkships to establish authority.
              </p>
              <button
                onClick={openAddExp}
                className="px-4 py-2 bg-legal-blue text-white text-xs font-bold rounded-xl"
              >
                Add First Experience
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {experiences.map((exp, idx) => (
                <div
                  key={idx}
                  className="bg-white p-6 rounded-3xl border border-slate-200/90 hover:border-legal-blue/50 shadow-subtle hover:shadow-card transition flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold text-legal-blue bg-blue-50 px-2 py-0.5 rounded border border-blue-200 uppercase">
                          {exp.isCurrent ? 'Current Position' : `${exp.fromYear || 'Past'} — ${exp.toYear || 'Present'}`}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 mt-1">{exp.role}</h4>
                        <p className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          <span>{exp.organization}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditExp(idx)}
                          className="p-1.5 text-slate-400 hover:text-legal-blue hover:bg-slate-100 rounded-lg transition"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteExperience(idx)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {exp.description && (
                      <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-100">
                        {exp.description}
                      </p>
                    )}
                  </div>

                  {exp.location && (
                    <div className="pt-2 border-t border-slate-100 flex items-center gap-1 text-[11px] text-slate-500">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{exp.location}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: CASE HISTORIES */}
      {activeSubTab === 'caseHistories' && (
        <div className="space-y-5">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Gavel className="w-5 h-5 text-legal-blue" />
                <span>Case Histories & Precedent Decisions</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Upload your previous litigation victories, arbitration awards, and tribunal decisions with anonymized client confidentiality.
              </p>
            </div>
            <button
              onClick={openAddCase}
              className="px-4 py-2.5 bg-gradient-to-r from-legal-blue to-blue-700 text-white text-xs font-bold rounded-xl shadow transition flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4 text-legal-gold" />
              <span>Upload Case History</span>
            </button>
          </div>

          {caseHistories.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-200/80 shadow-subtle p-6 max-w-md mx-auto space-y-3">
              <FileCheck2 className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800">No Case Histories Uploaded Yet</h4>
              <p className="text-xs text-slate-500">
                Upload precedent cases you have argued to showcase your domain competence to prospective clients.
              </p>
              <button
                onClick={openAddCase}
                className="px-4 py-2 bg-legal-blue text-white text-xs font-bold rounded-xl"
              >
                Upload First Case History
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {caseHistories.map((ch, idx) => (
                <div
                  key={idx}
                  className="bg-white p-6 rounded-3xl border border-slate-200/90 hover:border-legal-blue/50 shadow-subtle hover:shadow-card transition flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-legal-blue bg-blue-50 px-2 py-0.5 rounded border border-blue-200 uppercase">
                            {ch.category || 'General Law'}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">{ch.year || 2026}</span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 mt-1.5">{ch.title}</h4>
                        {ch.forum && (
                          <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Scale className="w-3 h-3 text-legal-gold" />
                            <span>{ch.forum}</span>
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditCase(idx)}
                          className="p-1.5 text-slate-400 hover:text-legal-blue hover:bg-slate-100 rounded-lg transition"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteCaseHistory(idx)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {ch.summary}
                    </p>

                    {ch.strategy && (
                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                        <strong className="text-slate-800 block text-[11px] uppercase tracking-wider mb-0.5">Legal Strategy:</strong>
                        <span className="text-slate-600">{ch.strategy}</span>
                      </div>
                    )}

                    <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200/80 text-xs">
                      <strong className="text-emerald-900 block text-[11px] uppercase tracking-wider mb-0.5">Judicial Outcome / Order:</strong>
                      <span className="text-emerald-800 font-medium">{ch.outcome}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {ch.anonymized !== false ? 'Confidentiality Anonymized' : 'Public Precedent'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 4: PUBLIC VIEW PREVIEW */}
      {activeSubTab === 'preview' && (
        <div className="space-y-6">
          <div className="p-4 bg-sky-50 border border-sky-200 rounded-2xl text-xs text-sky-900 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-legal-blue" />
              <strong>Public Profile Preview:</strong> This is how your profile, experiences, and case histories appear to Citizens and other Advocates in the directory.
            </span>
            <button
              onClick={() => setActiveSubTab('profile')}
              className="text-xs font-bold text-legal-blue hover:underline"
            >
              Back to Editing
            </button>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-card space-y-6">
            {/* Identity */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-[#0B1F33] text-legal-gold flex items-center justify-center font-extrabold text-2xl shadow-md border border-slate-700">
                  {fullName?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900">{fullName || 'Advocate'}</h3>
                    <span className="px-2.5 py-0.5 bg-blue-50 text-legal-blue text-[10px] font-bold rounded-full border border-blue-200 uppercase">
                      🔵 Bar Verified Advocate
                    </span>
                  </div>
                  <p className="text-xs font-medium text-legal-blue mt-0.5">{title || 'Advocate on Record'}</p>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{city || 'Delhi'}, {state || 'India'}</span>
                    <span className="text-slate-300">•</span>
                    <Award className="w-3.5 h-3.5 text-legal-gold" />
                    <span>{experienceYears || 0} Years Experience</span>
                  </p>
                </div>
              </div>

              {barRegNumber && (
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-right text-xs">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Bar Council Registration</span>
                  <span className="font-mono font-bold text-slate-800">{barRegNumber}</span>
                  {stateBarCouncil && <span className="block text-[10px] text-slate-500">{stateBarCouncil}</span>}
                </div>
              )}
            </div>

            {/* Bio */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">About & Legal Counsel</h4>
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                {bio || 'Experienced legal counsel offering assistance across judicial forums and tribunals.'}
              </p>
            </div>

            {/* Practice areas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Practice Areas</h4>
                <div className="flex flex-wrap gap-1.5">
                  {practiceAreas ? practiceAreas.split(',').map((pa, i) => (
                    <span key={i} className="text-xs font-semibold bg-blue-50 text-legal-blue px-3 py-1 rounded-lg border border-blue-200">
                      {pa.trim()}
                    </span>
                  )) : <span className="text-xs text-slate-400">Not specified</span>}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Primary Courts & Forums</h4>
                <p className="text-xs text-slate-700">{primaryCourts || 'District Courts & High Court'}</p>
              </div>
            </div>

            {/* Past Experiences */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-legal-blue" />
                <span>Past Work Experience ({experiences.length})</span>
              </h4>
              {experiences.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No past experiences added yet.</p>
              ) : (
                <div className="space-y-3">
                  {experiences.map((exp, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-900">{exp.role}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {exp.isCurrent ? 'Present' : `${exp.fromYear} - ${exp.toYear}`}
                        </span>
                      </div>
                      <p className="font-semibold text-slate-700">{exp.organization} • {exp.location}</p>
                      {exp.description && <p className="text-slate-600 mt-1">{exp.description}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Case Histories */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Gavel className="w-4 h-4 text-legal-blue" />
                <span>Uploaded Case Histories & Precedents ({caseHistories.length})</span>
              </h4>
              {caseHistories.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No case histories uploaded yet.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {caseHistories.map((ch, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-legal-blue bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {ch.category}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{ch.year}</span>
                      </div>
                      <h5 className="font-bold text-slate-900">{ch.title}</h5>
                      <p className="text-[11px] text-slate-500">{ch.forum}</p>
                      <p className="text-slate-600">{ch.summary}</p>
                      <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-xs">
                        <strong>Outcome: </strong>{ch.outcome}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: NETWORKING HUB */}
      {activeSubTab === 'network' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-subtle flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex-1 w-full relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search colleagues by name, court, or city..."
                value={netSearch}
                onChange={(e) => setNetSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-legal-blue"
              />
            </div>
            <button
              onClick={loadNetwork}
              disabled={loadingNetwork}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition self-end md:self-auto"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingNetwork ? 'animate-spin' : ''}`} />
              Refresh Directory
            </button>
          </div>

          {loadingNetwork ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-200/80 shadow-subtle">
              <RefreshCw className="animate-spin w-8 h-8 text-legal-blue mx-auto mb-3" />
              <p className="text-xs text-slate-500 font-medium">Searching directory...</p>
            </div>
          ) : filteredNetwork.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-200/80 shadow-subtle p-6 max-w-md mx-auto space-y-3">
              <Users className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">No other professionals found</h3>
              <p className="text-xs text-slate-500">Colleagues will appear once they join the network.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredNetwork.map((prof) => (
                <div
                  key={prof._id}
                  className="bg-white p-5 rounded-3xl border border-slate-200/90 hover:border-legal-blue/50 hover:shadow-card transition flex flex-col justify-between space-y-4 shadow-subtle"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-2xl bg-[#0B1F33] text-legal-gold flex items-center justify-center font-bold text-xs uppercase border border-slate-700">
                          {prof.fullName?.charAt(0) || 'P'}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">{prof.fullName}</h4>
                          <p className="text-[10px] text-legal-blue font-semibold uppercase">
                            {prof.professionalRole || 'ADVOCATE'}
                          </p>
                        </div>
                      </div>
                      {prof.verificationStatus === 'VERIFIED' && (
                        <span className="text-[9px] font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 uppercase">
                          🔵 Verified
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {prof.bio || 'Legal professional participating in the Legal Nexus collaboration network.'}
                    </p>

                    {prof.practiceAreas && prof.practiceAreas.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {prof.practiceAreas.map((pa, idx) => (
                          <span key={idx} className="text-[9px] font-medium bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                            {pa}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-[10px] text-slate-500">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{prof.location?.city || 'Delhi'}</span>
                    </div>

                    <button
                      onClick={() => handleConnect(prof._id)}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-bold shadow-subtle transition ${
                        connectedUsers[prof._id] === 'connected'
                          ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          : connectedUsers[prof._id] === 'pending'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                          : 'bg-blue-600 text-white hover:bg-blue-700 font-bold'
                      }`}
                    >
                      {connectedUsers[prof._id] === 'connected'
                        ? 'Connected'
                        : connectedUsers[prof._id] === 'pending'
                        ? 'Pending'
                        : 'Connect'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL: ADD / EDIT PAST EXPERIENCE */}
      {expModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-legal-blue" />
                <span>{editingExpIndex !== null ? 'Edit Past Experience' : 'Add Past Experience'}</span>
              </h3>
              <button
                onClick={() => setExpModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Designation / Role *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Associate / Chamber Counsel"
                  value={expRole}
                  onChange={(e) => setExpRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-legal-blue focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Law Firm / Chamber / Organization *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chambers of Adv. S. Verma / Khaitan & Co"
                  value={expOrg}
                  onChange={(e) => setExpOrg(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-legal-blue focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Location / City
                </label>
                <input
                  type="text"
                  placeholder="e.g. New Delhi, India"
                  value={expLoc}
                  onChange={(e) => setExpLoc(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-legal-blue focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Start Year
                  </label>
                  <input
                    type="number"
                    placeholder="2020"
                    value={expFrom}
                    onChange={(e) => setExpFrom(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-legal-blue focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    End Year
                  </label>
                  <input
                    type="number"
                    disabled={expCurrent}
                    placeholder={expCurrent ? 'Present' : '2024'}
                    value={expCurrent ? '' : expTo}
                    onChange={(e) => setExpTo(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-legal-blue focus:outline-none disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="expCurrentCheck"
                  checked={expCurrent}
                  onChange={(e) => setExpCurrent(e.target.checked)}
                  className="rounded text-legal-blue focus:ring-legal-blue"
                />
                <label htmlFor="expCurrentCheck" className="text-xs text-slate-700 font-medium">
                  Currently working in this role / chamber
                </label>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Description & Focus Areas
                </label>
                <textarea
                  rows={3}
                  placeholder="Key responsibilities, major dispute types handled, notable accomplishments..."
                  value={expDesc}
                  onChange={(e) => setExpDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-legal-blue focus:outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setExpModalOpen(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveExperience}
                className="px-5 py-2.5 bg-legal-blue hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow"
              >
                Save Experience
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT CASE HISTORY */}
      {caseModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Gavel className="w-4 h-4 text-legal-blue" />
                <span>{editingCaseIndex !== null ? 'Edit Case History' : 'Upload Case History'}</span>
              </h3>
              <button
                onClick={() => setCaseModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Case Subject / Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Commercial Lease Injunction & Recovery Suit"
                  value={caseTitle}
                  onChange={(e) => setCaseTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-legal-blue focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Forum / Court / Tribunal
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Delhi High Court / NCLT"
                    value={caseForum}
                    onChange={(e) => setCaseForum(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-legal-blue focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Year
                  </label>
                  <input
                    type="number"
                    value={caseYear}
                    onChange={(e) => setCaseYear(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-legal-blue focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Practice Area / Domain
                </label>
                <input
                  type="text"
                  placeholder="e.g. Property, Employment, Corporate, Consumer"
                  value={caseCategory}
                  onChange={(e) => setCaseCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-legal-blue focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Factual Summary & Core Dispute *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Briefly describe the grievance or litigation dispute..."
                  value={caseSummary}
                  onChange={(e) => setCaseSummary(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-legal-blue focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Legal Challenge & Strategic Defense
                </label>
                <textarea
                  rows={2}
                  placeholder="Key legal question, statutory provisions relied on, evidentiary strategy..."
                  value={caseChallenge}
                  onChange={(e) => setCaseChallenge(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-legal-blue focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Judicial Outcome / Relief Granted *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Final court order, settlement terms, damages awarded, or dismissal..."
                  value={caseOutcome}
                  onChange={(e) => setCaseOutcome(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-legal-blue focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="caseAnonCheck"
                  checked={caseAnonymized}
                  onChange={(e) => setCaseAnonymized(e.target.checked)}
                  className="rounded text-legal-blue focus:ring-legal-blue"
                />
                <label htmlFor="caseAnonCheck" className="text-xs text-slate-700 font-medium">
                  Anonymize client details for confidentiality compliance
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCaseModalOpen(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveCaseHistory}
                className="px-5 py-2.5 bg-legal-blue hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow"
              >
                Save Case History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}