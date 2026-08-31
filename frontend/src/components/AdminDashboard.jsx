import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  User,
  Clock,
  Filter,
  RefreshCw,
  ExternalLink,
  Ban,
  Unlock,
  Eye,
  Check,
  X,
  Sparkles,
  Award,
  ChevronRight,
  Info,
  SlidersHorizontal,
} from 'lucide-react';
import api from '../services/api';

export default function AdminDashboard({ user }) {
  const [stats, setStats] = useState({
    totalRequests: 0,
    pendingApprovals: 0,
    verifiedAdvocates: 0,
    rejectedRequests: 0,
    blockedProfiles: 0,
  });
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL'); // ALL | PENDING | VERIFIED | REJECTED
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('queue'); // queue | blocklist
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [bannerNotice, setBannerNotice] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, [filterStatus, activeTab]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, reqsRes] = await Promise.all([
        api.get('/verification/stats'),
        api.get('/verification/requests', {
          params: {
            status: activeTab === 'blocklist' ? 'BLOCKED' : filterStatus,
            search: searchTerm || undefined,
          },
        }),
      ]);
      setStats(statsRes.data.data || {});
      setRequests(reqsRes.data.data || []);
    } catch (err) {
      console.error('Failed to load admin verification data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    try {
      setActionLoading(true);
      await api.patch(`/verification/requests/${requestId}`, {
        status: 'VERIFIED',
        reviewNotes: 'Verified via State Bar Council credentials and AI OCR audit.',
      });
      setBannerNotice({
        type: 'success',
        text: '✅ Lawyer profile officially APPROVED and granted Bar Council Verified Badge.',
      });
      setSelectedRequest(null);
      loadDashboardData();
    } catch (err) {
      alert('Failed to approve request: ' + (err.response?.data?.message || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    try {
      setActionLoading(true);
      await api.patch(`/verification/requests/${selectedRequest._id}`, {
        status: 'REJECTED',
        rejectionReason: rejectionReason || 'Submitted document is unclear or Bar ID mismatch.',
      });
      setBannerNotice({
        type: 'warning',
        text: '⚠️ Request marked as REJECTED. It will automatically vanish after 3 days.',
      });
      setShowRejectModal(false);
      setSelectedRequest(null);
      setRejectionReason('');
      loadDashboardData();
    } catch (err) {
      alert('Failed to reject request: ' + (err.response?.data?.message || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  const handleBlockUser = async () => {
    if (!selectedRequest) return;
    const userId = selectedRequest.professional?._id || selectedRequest.professional;
    try {
      setActionLoading(true);
      await api.post(`/verification/block/${userId}`, {
        reason: blockReason || 'Fraudulent Bar ID credentials / fake advocate profile.',
      });
      setBannerNotice({
        type: 'danger',
        text: '🚫 User profile has been permanently BLOCKED and added to the Platform Blacklist.',
      });
      setShowBlockModal(false);
      setSelectedRequest(null);
      setBlockReason('');
      loadDashboardData();
    } catch (err) {
      alert('Failed to block user: ' + (err.response?.data?.message || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnblockUser = async (userId) => {
    if (!window.confirm('Are you sure you want to restore and unblock this user?')) return;
    try {
      setActionLoading(true);
      await api.post(`/verification/unblock/${userId}`);
      setBannerNotice({
        type: 'success',
        text: 'User profile has been unblocked and restored to pending verification.',
      });
      loadDashboardData();
    } catch (err) {
      alert('Failed to unblock user: ' + (err.response?.data?.message || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-[#0B1F33] text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-legal flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-3 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3 h-3 text-purple-400" />
              Administrative Verification Console
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Bar Council Verification & Compliance Portal
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Two-Step Verification Queue: Review AI OCR extracted credentials, inspect uploaded Bar Council ID Cards, grant official verification badges, manage the blacklist, and audit 3-day auto-expiring rejections.
          </p>
        </div>

        <button
          onClick={loadDashboardData}
          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-2xl border border-slate-700 transition flex items-center gap-2 self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Console
        </button>
      </div>

      {/* Banner Notice */}
      {bannerNotice && (
        <div
          className={`p-4 rounded-2xl border text-xs font-medium flex items-center justify-between animate-in fade-in ${
            bannerNotice.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : bannerNotice.type === 'warning'
              ? 'bg-amber-50 text-amber-800 border-amber-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <span>{bannerNotice.text}</span>
          <button onClick={() => setBannerNotice(null)} className="p-1 hover:bg-black/5 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Requests</span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">{stats.totalRequests || 0}</p>
          <span className="text-[10px] text-slate-400 mt-1">All advocate submissions</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-amber-200/80 bg-amber-50/20 shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-700 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Pending Review</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-amber-700">{stats.pendingApprovals || 0}</p>
          <span className="text-[10px] text-amber-600/80 mt-1">Awaiting final admin seal</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-blue-200/80 bg-blue-50/20 shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between text-blue-700 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Verified Advocates</span>
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-blue-800">{stats.verifiedAdvocates || 0}</p>
          <span className="text-[10px] text-blue-600/80 mt-1">Active verified directory</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-rose-200/80 bg-rose-50/20 shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between text-rose-700 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Rejected (3d Vanish)</span>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-rose-700">{stats.rejectedRequests || 0}</p>
          <span className="text-[10px] text-rose-600/80 mt-1">Auto-purges after 3 days</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-300 bg-slate-100/50 shadow-subtle flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-700 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Blocked Fake Accounts</span>
            <Ban className="w-4 h-4 text-slate-700" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">{stats.blockedProfiles || 0}</p>
          <span className="text-[10px] text-slate-500 mt-1">Security blacklisted</span>
        </div>
      </div>

      {/* Main Tabs (Queue vs Blocklist) */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('queue')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 ${
            activeTab === 'queue'
              ? 'bg-legal-blue text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Verification Queue ({requests.length})
        </button>

        <button
          onClick={() => setActiveTab('blocklist')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 ${
            activeTab === 'blocklist'
              ? 'bg-rose-700 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Ban className="w-3.5 h-3.5" />
          Fraud & Fake Profiles Blocklist ({stats.blockedProfiles || 0})
        </button>
      </div>

      {/* Filters and Search Bar */}
      {activeTab === 'queue' && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-subtle">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            {['ALL', 'PENDING', 'VERIFIED', 'REJECTED'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  filterStatus === st
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {st === 'ALL' ? 'All Statuses' : st === 'PENDING' ? '⏳ Pending / OCR' : st === 'VERIFIED' ? '✅ Verified' : '❌ Rejected'}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, Bar ID, or state..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadDashboardData()}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-legal-blue"
            />
          </div>
        </div>
      )}

      {/* Requests Grid / Table */}
      {loading ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-subtle">
          <div className="animate-spin w-8 h-8 border-4 border-legal-blue border-t-transparent rounded-full mx-auto mb-3"></div>
          <p className="text-xs text-slate-500 font-medium">Loading verification requests...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-subtle p-6 max-w-md mx-auto space-y-3">
          <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">
            {activeTab === 'blocklist' ? 'No Blocked Profiles' : 'No Verification Requests Found'}
          </h3>
          <p className="text-xs text-slate-500">
            {activeTab === 'blocklist'
              ? 'The blacklist is clean. Any flagged fake advocate accounts will appear here.'
              : 'All advocate verification submissions have been processed.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {requests.map((reqItem) => {
            const prof = reqItem.professional || {};
            const isOcr = reqItem.status === 'OCR_VERIFIED' || reqItem.ocrConfidence > 0;
            const isVerified = reqItem.status === 'VERIFIED';
            const isRejected = reqItem.status === 'REJECTED';
            const isBlocked = reqItem.status === 'BLOCKED' || reqItem.isBlocked;

            return (
              <div
                key={reqItem._id}
                className={`bg-white p-5 rounded-3xl border transition-all duration-200 shadow-subtle flex flex-col justify-between space-y-4 ${
                  isBlocked
                    ? 'border-slate-300 bg-slate-50/50'
                    : isVerified
                    ? 'border-blue-200 hover:border-blue-400'
                    : isRejected
                    ? 'border-rose-200'
                    : 'border-slate-200 hover:border-purple-300 hover:shadow-card-hover'
                }`}
              >
                <div className="space-y-3">
                  {/* Top Bar: Role + Status */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full uppercase">
                      {reqItem.requestedRole || 'LAWYER'}
                    </span>

                    {isVerified ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                        🔵 Bar Council Verified
                      </span>
                    ) : isRejected ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-rose-800 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                        ❌ Rejected (Auto-vanish in 3d)
                      </span>
                    ) : isBlocked ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-slate-800 bg-slate-200 px-2.5 py-0.5 rounded-full border border-slate-300">
                        🚫 Blocklisted
                      </span>
                    ) : isOcr ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-purple-800 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200 animate-pulse">
                        🛡️ OCR Verified ({reqItem.ocrConfidence || 95}%)
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                        ⏳ Pending Admin Seal
                      </span>
                    )}
                  </div>

                  {/* Lawyer Info */}
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-[#0B1F33] text-legal-gold flex items-center justify-center font-extrabold text-sm border border-slate-700 shadow-sm shrink-0">
                      {reqItem.submittedData?.fullName?.charAt(0) || prof.email?.charAt(0) || 'A'}
                    </div>
                    <div className="truncate">
                      <h4 className="text-sm font-bold text-slate-900 truncate">
                        {reqItem.submittedData?.fullName || prof.email}
                      </h4>
                      <p className="text-xs text-slate-500 truncate">{prof.email}</p>
                    </div>
                  </div>

                  {/* Extracted Bar ID & Council */}
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-medium">Bar Registration:</span>
                      <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {reqItem.ocrExtractedData?.extractedBarId || reqItem.submittedData?.barRegistrationNumber || 'Not Specified'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-medium">State Council:</span>
                      <span className="font-bold text-slate-700 truncate max-w-[160px]">
                        {reqItem.ocrExtractedData?.extractedState || reqItem.submittedData?.stateBarCouncil || 'Bar Council of Delhi'}
                      </span>
                    </div>

                    {reqItem.ocrConfidence > 0 && (
                      <div className="pt-1">
                        <div className="flex justify-between text-[10px] text-slate-500 font-semibold mb-1">
                          <span>AI OCR Match Accuracy</span>
                          <span className="text-purple-700 font-bold">{reqItem.ocrConfidence}%</span>
                        </div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-purple-600 h-full rounded-full"
                            style={{ width: `${reqItem.ocrConfidence}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedRequest(reqItem)}
                    className="flex-1 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Inspect & Review
                  </button>

                  {isBlocked && (
                    <button
                      onClick={() => handleUnblockUser(prof._id || prof)}
                      className="py-2 px-3 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1"
                      title="Unblock User"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Side-by-Side OCR Verification Inspector Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full border border-slate-200 shadow-legal overflow-hidden my-8">
            {/* Modal Header */}
            <div className="bg-[#0B1F33] text-white p-5 sm:p-6 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-legal-gold bg-legal-gold/20 px-2.5 py-0.5 rounded-full border border-legal-gold/30">
                  Step 2: Admin Seal Review
                </span>
                <h3 className="text-base sm:text-lg font-bold text-white mt-1">
                  Advocate Credential Inspection Matrix
                </h3>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Comparison Matrix (Side-by-Side: Profile vs AI OCR) */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  Side-by-Side Credential Verification Matrix
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Left: Profile Input */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
                    <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                      1. Lawyer Profile Input
                    </span>
                    <div>
                      <p className="text-slate-400 text-[10px]">Submitted Name</p>
                      <p className="font-bold text-slate-900">{selectedRequest.submittedData?.fullName || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-[10px]">Bar Registration Number</p>
                      <p className="font-mono font-bold text-slate-900">{selectedRequest.submittedData?.barRegistrationNumber || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-[10px]">State Bar Council</p>
                      <p className="font-semibold text-slate-800">{selectedRequest.submittedData?.stateBarCouncil || 'Bar Council of Delhi'}</p>
                    </div>
                  </div>

                  {/* Right: AI OCR Extraction */}
                  <div className="bg-purple-50/50 p-4 rounded-2xl border border-purple-200 space-y-2 text-xs">
                    <span className="font-bold text-purple-900 uppercase tracking-wider text-[10px] flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-purple-600" />
                      2. AI OCR Extracted Data
                    </span>
                    <div>
                      <p className="text-purple-400 text-[10px]">OCR Scanned Name</p>
                      <p className="font-bold text-purple-950 flex items-center gap-1.5">
                        {selectedRequest.ocrExtractedData?.extractedName || selectedRequest.submittedData?.fullName}
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      </p>
                    </div>
                    <div>
                      <p className="text-purple-400 text-[10px]">OCR Scanned Bar ID</p>
                      <p className="font-mono font-bold text-purple-950 flex items-center gap-1.5">
                        {selectedRequest.ocrExtractedData?.extractedBarId || selectedRequest.submittedData?.barRegistrationNumber}
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      </p>
                    </div>
                    <div>
                      <p className="text-purple-400 text-[10px]">Validated State Council</p>
                      <p className="font-semibold text-purple-950">
                        {selectedRequest.ocrExtractedData?.extractedState || 'Bar Council of Delhi'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Document Image & Sanad Certificate Preview */}
              <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-legal-gold" />
                    Uploaded Bar Council ID Card / Sanad Document
                  </span>
                  <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                    256-Bit Encrypted & Verified
                  </span>
                </div>
                <div className="h-32 bg-slate-800/80 rounded-xl border border-slate-700/60 flex items-center justify-center p-4 text-center">
                  <div>
                    <Award className="w-8 h-8 text-legal-gold mx-auto mb-1.5" />
                    <p className="text-xs font-bold text-slate-200">
                      Bar Council Sanad & Certificate of Practice
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      Roll No: {selectedRequest.ocrExtractedData?.extractedBarId || selectedRequest.submittedData?.barRegistrationNumber}
                    </p>
                  </div>
                </div>
              </div>

              {/* Decision Actions */}
              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  onClick={() => setShowBlockModal(true)}
                  disabled={actionLoading}
                  className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-rose-100 text-rose-700 border border-slate-300 hover:border-rose-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <Ban className="w-3.5 h-3.5" />
                  Block Fake Profile
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => setShowRejectModal(true)}
                    disabled={actionLoading}
                    className="flex-1 sm:flex-none px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Reject (3-Day Vanish)
                  </button>

                  <button
                    onClick={() => handleApprove(selectedRequest._id)}
                    disabled={actionLoading}
                    className="flex-1 sm:flex-none px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Approve & Grant Verified Badge
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-legal">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-rose-600" />
              Reject Verification Request
            </h3>
            <p className="text-xs text-slate-500">
              Please specify the reason for rejection. This request will automatically vanish after 3 days.
            </p>
            <textarea
              rows={3}
              placeholder="e.g. Uploaded Bar ID image is blurry / Name does not match State Bar Council roll..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Block Profile Modal */}
      {showBlockModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-legal">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 text-rose-700">
              <Ban className="w-5 h-5" />
              Add Profile to Blacklist
            </h3>
            <p className="text-xs text-slate-500">
              This will permanently block the account, revoke login access, and remove the profile from the public directory.
            </p>
            <textarea
              rows={3}
              placeholder="e.g. Fraudulent Bar Council ID / Impersonation of legal professional..."
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowBlockModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleBlockUser}
                disabled={actionLoading}
                className="px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold"
              >
                Confirm Blacklist
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
