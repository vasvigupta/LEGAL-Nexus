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
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [practiceAreas, setPracticeAreas] = useState('');
  const [experienceYears, setExperienceYears] = useState(0);
  const [education, setEducation] = useState('');
  const [barRegNumber, setBarRegNumber] = useState('');
  const [institution, setInstitution] = useState('');

  // OCR Verification state
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrProgressStep, setOcrProgressStep] = useState(0);
  const [ocrNotice, setOcrNotice] = useState(null);
  const [sampleOcrText, setSampleOcrText] = useState('');

  // Networking state
  const [networkingTab, setNetworkingTab] = useState('profile'); // profile | network
  const [networkUsers, setNetworkUsers] = useState([]);
  const [loadingNetwork, setLoadingNetwork] = useState(false);
  const [netSearch, setNetSearch] = useState('');
  const [connectedUsers, setConnectedUsers] = useState({});

  const isProfessional = user?.role === 'LAWYER' || user?.role === 'LAW_STUDENT';

  useEffect(() => {
    loadProfile();
    loadVerificationStatus();
  }, [user]);

  useEffect(() => {
    if (networkingTab === 'network') {
      loadNetwork();
    }
  }, [networkingTab]);

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
        setPhone(data.contactInfo?.phone || user.phone || '');
        setBio(data.bio || '');
        setCity(data.location?.city || '');
        setState(data.location?.state || '');
        setPracticeAreas(data.practiceAreas ? data.practiceAreas.join(', ') : '');
        setExperienceYears(data.experienceYears || 0);
        setEducation(data.education ? data.education.join(', ') : '');
        setBarRegNumber(data.barCouncilRegistration?.registrationNumber || '');
        setInstitution(data.lawStudentDetails?.institution || '');
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

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError(null);

    try {
      const payload = {
        fullName,
        bio,
        location: { city, state },
      };

      if (user.role === 'CITIZEN') {
        payload.contactInfo = { phone };
        await api.put('/profiles/citizen', payload);
      } else {
        payload.practiceAreas = practiceAreas.split(',').map((s) => s.trim()).filter(Boolean);
        payload.experienceYears = parseInt(experienceYears) || 0;
        payload.education = education.split(',').map((s) => s.trim()).filter(Boolean);
        if (user.role === 'LAWYER') {
          payload.barCouncilRegistration = { registrationNumber: barRegNumber };
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
        <p className="text-xs text-slate-500 font-medium">Loading user center profile...</p>
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
      {/* Banner / Header */}
      <div className="bg-[#0B1F33] text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-legal flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-0.5 bg-legal-blue/20 text-sky-300 border border-legal-blue/30 text-[10px] font-bold rounded-full uppercase tracking-wider">
              User Center & Identity
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            {isProfessional ? 'Profile & Professional Network' : 'Citizen Account Profile'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            {isProfessional
              ? 'Manage your professional profile details, verify your State Bar Council ID via AI OCR, and collaborate with legal professionals across India.'
              : 'Manage your personal account profile, contact details, and filed case communications.'}
          </p>
        </div>
      </div>

      {/* Navigation tabs if professional */}
      {isProfessional && (
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-sm font-semibold">
          <button
            onClick={() => setNetworkingTab('profile')}
            className={`px-4 py-2 rounded-xl transition ${
              networkingTab === 'profile'
                ? 'bg-legal-blue text-white shadow-subtle'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            My Profile & Verification
          </button>
          <button
            onClick={() => setNetworkingTab('network')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
              networkingTab === 'network'
                ? 'bg-legal-blue text-white shadow-subtle'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Professional Network Hub</span>
          </button>
        </div>
      )}

      {networkingTab === 'profile' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Overview + Two-Step Verification Card (4 cols) */}
          <div className="lg:col-span-4 space-y-5">
            {/* Profile Overview Card */}
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

                  {isProfessional ? (
                    isOfficiallyVerified ? (
                      <span className="px-3 py-0.5 bg-blue-100 text-blue-900 text-[10px] font-extrabold rounded-full border border-blue-300 flex items-center gap-1">
                        🔵 Bar Council Verified
                      </span>
                    ) : isOcrVerified ? (
                      <span className="px-3 py-0.5 bg-purple-100 text-purple-900 text-[10px] font-extrabold rounded-full border border-purple-300 flex items-center gap-1">
                        🛡️ OCR Verified (In Admin Queue)
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
                  ) : null}
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
              </div>
            </div>

            {/* STEP 1: Two-Step Bar ID AI OCR Verification Widget */}
            {isProfessional && (
              <div className="bg-white p-5 sm:p-6 rounded-3xl border border-purple-200 shadow-subtle space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-purple-100 rounded-lg text-purple-700">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Step 1: AI Document OCR
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
                      Your enrollment ID <strong className="font-mono">{barRegNumber || 'D/1428/2006'}</strong> is officially authenticated by Platform Administration.
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

                    {/* Quick Demo Pre-fill Buttons */}
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

                    {/* OCR Scanning Progress Animation */}
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
                        <p className="text-[10px] text-purple-700">
                          {ocrProgressStep === 1 && 'Scanning State Bar Council Seal & Sanad...'}
                          {ocrProgressStep === 2 && 'Extracting Bar Registration Number...'}
                          {ocrProgressStep === 3 && 'Matching Advocate Name against profile...'}
                          {ocrProgressStep === 4 && 'Queued in Admin Verification Console!'}
                        </p>
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

          {/* Right Column: Profile Edit Form (8 cols) */}
          <div className="lg:col-span-8 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-subtle">
            <form onSubmit={handleSave} className="space-y-5">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-legal-blue" />
                Profile Information
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
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-legal-blue focus:outline-none"
                    placeholder="Delhi"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">State</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-legal-blue focus:outline-none"
                    placeholder="Delhi"
                  />
                </div>
              </div>

              {/* Professional Specific Fields */}
              {isProfessional && (
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Professional Credentials & Practice
                  </h4>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Bio / Professional Summary
                    </label>
                    <textarea
                      rows={3}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-legal-blue focus:outline-none resize-none leading-relaxed"
                      placeholder="Provide a brief background on your legal experience, core practice areas, and courts..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        Years of Experience
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
                        Education / Degrees (comma separated)
                      </label>
                      <input
                        type="text"
                        value={education}
                        onChange={(e) => setEducation(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-legal-blue focus:outline-none"
                        placeholder="LL.B (Delhi University), LL.M"
                      />
                    </div>

                    {user.role === 'LAWYER' && (
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Bar Council Registration Number
                        </label>
                        <input
                          type="text"
                          value={barRegNumber}
                          onChange={(e) => setBarRegNumber(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-legal-blue focus:outline-none"
                          placeholder="e.g. D/1428/2006"
                        />
                      </div>
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
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs rounded-2xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:bg-slate-300 disabled:text-slate-500"
              >
                {saving ? (
                  <RefreshCw className="animate-spin w-4 h-4" />
                ) : (
                  <>
                    <Save className="w-4 h-4 text-white" />
                    <span>Save Profile Changes</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* Professional Networking Hub UI */
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-subtle flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex-1 w-full relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search colleagues by name, title, or location..."
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
              <p className="text-xs text-slate-500 font-medium">Searching network directory...</p>
            </div>
          ) : filteredNetwork.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-200/80 shadow-subtle p-6 max-w-md mx-auto space-y-3">
              <Users className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">No other professionals found</h3>
              <p className="text-xs text-slate-500">Colleagues will appear once they sign up.</p>
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
    </div>
  );
}
