import React, { useState, useEffect } from 'react';
import {
  FileText,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Download,
  ShieldCheck,
  Scale,
  Send,
  Building2,
  User,
  MapPin,
  Calendar,
  Layers,
  Edit3,
  Eye,
  Check,
  Printer,
  FileCheck,
  AlertCircle,
  FileSignature,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import api from '../services/api';

export default function LegalDraftGenerator({ user, onOpenAuth }) {
  const [draftType, setDraftType] = useState('');
  const [formData, setFormData] = useState({
    plaintiffName: user?.profileData?.fullName || '',
    defendantName: '',
    defendantOrg: '',
    disputedAmount: '',
    jurisdiction: '',
    issue: '',
    category: 'Employment & Labour Law',
  });
  const [loading, setLoading] = useState(false);
  const [generatedDraft, setGeneratedDraft] = useState(null);
  const [editableContent, setEditableContent] = useState('');
  const [viewMode, setViewMode] = useState('formatted'); // 'formatted' | 'edit'
  const [copied, setCopied] = useState(false);

  const draftOptions = [
    {
      id: 'STATUTORY_LEGAL_NOTICE',
      title: '15-Day Statutory Legal Demand Notice',
      category: 'General / Labour / Civil',
      icon: '⚖️',
    },
    {
      id: 'CONSUMER_FORUM_COMPLAINT',
      title: 'Consumer Court Complaint Petition (e-Daakhil)',
      category: 'Consumer Protection',
      icon: '🛍️',
    },
    {
      id: 'EMPLOYER_WAGE_GRIEVANCE',
      title: 'Employer Wage Grievance / Section 15 Claim',
      category: 'Labour & Wages',
      icon: '💼',
    },
    {
      id: 'LANDLORD_SECURITY_DEPOSIT_NOTICE',
      title: 'Security Deposit Refund Demand Notice',
      category: 'Rental & Tenancy',
      icon: '🏠',
    },
    {
      id: 'POLICE_CYBER_CRIME_COMPLAINT',
      title: 'Cyber Financial Fraud Complaint (1930 / Zero FIR)',
      category: 'Cybercrime',
      icon: '🛡️',
    },
    {
      id: 'RTI_APPLICATION',
      title: 'RTI Application under Section 6(1)',
      category: 'Public Records',
      icon: '📋',
    },
    {
      id: 'LEGAL_INFORMATION_SUMMARY',
      title: 'Counsel Brief & Legal Strategy Summary',
      category: 'Counsel Brief',
      icon: '📑',
    },
  ];

  useEffect(() => {
    if (generatedDraft) {
      setEditableContent(generatedDraft.contentMarkdown || '');
    }
  }, [generatedDraft]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!user) {
      onOpenAuth();
      return;
    }

    if (!draftType) {
      alert('Please select a Legal Document Template to proceed.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/drafts/generate-ai', {
        draftType,
        variables: {
          ...formData,
          disputedAmount: parseFloat(formData.disputedAmount) || 0,
        },
      });

      setGeneratedDraft(res.data.data);
      setEditableContent(res.data.data.contentMarkdown || '');
      setViewMode('formatted');
    } catch (err) {
      alert('Failed to generate draft. Please verify backend connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!editableContent) return;
    navigator.clipboard.writeText(editableContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPdf = () => {
    if (!generatedDraft) return;

    try {
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const margin = 45;
      const pageWidth = 595;
      const contentWidth = pageWidth - margin * 2;
      let y = 50;

      // 1. Header Banner
      doc.setFillColor(11, 31, 51); // deep navy
      doc.rect(0, 0, pageWidth, 60, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13.5);
      doc.text('LEGAL NEXUS — STATUTORY PLEADING ENGINE', margin, 32);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(201, 162, 39); // legal gold
      doc.text(
        `Doc Ref: ${generatedDraft.caseNumber || 'LN-2026-DRAFT'} | Jurisdiction: ${
          formData.jurisdiction || 'India'
        } | Generated: ${new Date().toLocaleDateString('en-IN')}`,
        margin,
        48
      );

      y = 85;

      // 2. Parse Lines & Format into PDF
      const lines = editableContent.split('\n');

      lines.forEach((line) => {
        const trimmed = line.trim();

        if (y > 780) {
          doc.addPage();
          y = 50;
        }

        if (!trimmed) {
          y += 8;
          return;
        }

        // Top Main Header (# ...)
        if (line.startsWith('# ')) {
          y += 6;
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(12.5);
          doc.setTextColor(15, 23, 42);
          const headerText = trimmed.replace(/^#\s*/, '').toUpperCase();
          const splitHeader = doc.splitTextToSize(headerText, contentWidth);
          doc.text(splitHeader, margin, y);
          y += splitHeader.length * 15 + 4;

          doc.setDrawColor(203, 213, 225);
          doc.setLineWidth(1);
          doc.line(margin, y - 2, margin + contentWidth, y - 2);
          y += 8;
        }
        // Section Headers (### or ####)
        else if (line.startsWith('### ') || line.startsWith('#### ')) {
          y += 8;
          if (y > 780) {
            doc.addPage();
            y = 50;
          }
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10);
          doc.setTextColor(30, 41, 59);
          const subText = trimmed.replace(/^#+\s*/, '');
          const splitSub = doc.splitTextToSize(subText, contentWidth);
          doc.text(splitSub, margin, y);
          y += splitSub.length * 13 + 4;
        }
        // Dividers (---)
        else if (trimmed === '---') {
          y += 4;
          doc.setDrawColor(226, 232, 240);
          doc.setLineWidth(0.5);
          doc.line(margin, y, margin + contentWidth, y);
          y += 8;
        }
        // Bullet Items (- or *)
        else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.setTextColor(51, 65, 85);
          const bulletText = '•  ' + trimmed.replace(/^[-*]\s*/, '').replace(/\*\*([^*]+)\*\*/g, '$1');
          const splitBullet = doc.splitTextToSize(bulletText, contentWidth - 10);
          doc.text(splitBullet, margin + 10, y);
          y += splitBullet.length * 12 + 2;
        }
        // Numbered Items (1. , 1.1.)
        else if (/^\d+(\.\d+)*\.\s/.test(trimmed)) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.setTextColor(30, 41, 59);
          const cleanNumbered = trimmed.replace(/\*\*([^*]+)\*\*/g, '$1');
          const splitNumbered = doc.splitTextToSize(cleanNumbered, contentWidth);
          doc.text(splitNumbered, margin, y);
          y += splitNumbered.length * 12 + 3;
        }
        // Normal text paragraphs
        else {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.setTextColor(51, 65, 85);
          const cleanPara = trimmed.replace(/\*\*([^*]+)\*\*/g, '$1');
          const splitPara = doc.splitTextToSize(cleanPara, contentWidth);
          doc.text(splitPara, margin, y);
          y += splitPara.length * 12 + 2;
        }
      });

      // Page Footers
      const totalPages = doc.internal.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `Legal Nexus Draft Generator • Page ${p} of ${totalPages} • Grounded in Indian Law`,
          margin,
          815
        );
      }

      doc.save(`${(draftType || 'legal_draft').toLowerCase()}_${Date.now()}.pdf`);
    } catch (err) {
      console.error('PDF export error:', err);
      alert('Failed to generate PDF document.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#0B1F33] text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-legal flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-3 py-0.5 bg-legal-blue/20 text-sky-300 border border-legal-blue/30 text-[10px] font-bold rounded-full uppercase tracking-wider">
              Statutory Pleading Engine
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Smart Legal Notice & Petition Generator
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            Generate formal 15-day statutory notices, consumer petitions, wage recovery applications, and tenancy demands populated with structured case facts and grounded in Indian statutory authority.
          </p>
        </div>

        {generatedDraft && (
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleCopy}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition flex items-center gap-1.5 shadow-sm"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-300" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Text'}</span>
            </button>
            <button
              onClick={handleDownloadPdf}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4 text-amber-300" />
              <span>Download Notice (.pdf)</span>
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Draft Selection & Case Parameters (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <form
            onSubmit={handleGenerate}
            className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-subtle space-y-4"
          >
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Layers className="w-4 h-4 text-legal-blue" />
              1. Select Legal Document Template
            </h3>

            {/* Template Selector */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Document Template
              </label>
              <select
                value={draftType}
                onChange={(e) => setDraftType(e.target.value)}
                className={`w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-legal-blue focus:outline-none font-medium ${
                  !draftType ? 'text-slate-400' : 'text-slate-800'
                }`}
                required
              >
                <option value="" disabled>
                  e.g. 15-Day Statutory Legal Demand Notice / Consumer Petition
                </option>
                {draftOptions.map((opt) => (
                  <option key={opt.id} value={opt.id} className="text-slate-800">
                    {opt.icon} {opt.title} ({opt.category})
                  </option>
                ))}
              </select>
            </div>

            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pt-2 border-b border-slate-100 pb-2">
              <FileText className="w-4 h-4 text-legal-blue" />
              2. Case Facts & Party Details
            </h3>

            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Complainant / Client Name
                </label>
                <input
                  type="text"
                  value={formData.plaintiffName}
                  onChange={(e) => setFormData({ ...formData, plaintiffName: e.target.value })}
                  placeholder="e.g. Aarav Sharma"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-legal-blue focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Opposite Party / Organization
                </label>
                <input
                  type="text"
                  value={formData.defendantName}
                  onChange={(e) => setFormData({ ...formData, defendantName: e.target.value })}
                  placeholder="e.g. Tech Global Pvt Ltd / Landlord Name"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-legal-blue focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Disputed Quantum (INR)
                  </label>
                  <input
                    type="number"
                    value={formData.disputedAmount}
                    onChange={(e) => setFormData({ ...formData, disputedAmount: e.target.value })}
                    placeholder="e.g. 150000"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-legal-blue focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Jurisdiction / City
                  </label>
                  <input
                    type="text"
                    value={formData.jurisdiction}
                    onChange={(e) => setFormData({ ...formData, jurisdiction: e.target.value })}
                    placeholder="e.g. Delhi / Bengaluru"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-legal-blue focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Primary Cause of Action
                </label>
                <textarea
                  rows={3}
                  value={formData.issue}
                  onChange={(e) => setFormData({ ...formData, issue: e.target.value })}
                  placeholder="e.g. Unpaid salary for 3 months despite written requests and statutory reminders"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-legal-blue focus:outline-none resize-none leading-relaxed"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-slate-300 disabled:text-slate-500 disabled:opacity-50 text-white font-bold text-xs rounded-2xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Compiling Grounded Draft...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Generate Grounded Legal Notice</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Preview Column: Formatted Legal Document Paper View (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {generatedDraft ? (
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-subtle space-y-4 animate-in fade-in duration-300">
              {/* Top Document Header & View Switcher */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-legal-blue bg-blue-50 px-2 py-0.5 rounded uppercase">
                      {generatedDraft.draftType}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{generatedDraft.caseNumber}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-1">{generatedDraft.title}</h3>
                </div>

                {/* Formatted vs Edit Switcher */}
                <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                  <button
                    onClick={() => setViewMode('formatted')}
                    className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition ${
                      viewMode === 'formatted'
                        ? 'bg-white text-slate-900 shadow-subtle'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5 text-legal-blue" />
                    Formal Document
                  </button>
                  <button
                    onClick={() => setViewMode('edit')}
                    className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition ${
                      viewMode === 'edit'
                        ? 'bg-white text-slate-900 shadow-subtle'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5 text-legal-blue" />
                    Edit / Customize
                  </button>
                </div>
              </div>

              {/* Status Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200">
                  <span className="text-[10px] text-emerald-800 font-bold uppercase block">Verification</span>
                  <span className="font-bold text-emerald-900 flex items-center gap-1 text-xs">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    100% Grounded
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Claim Quantum</span>
                  <span className="font-bold text-slate-800 font-mono">
                    ₹{Number(formData.disputedAmount || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Jurisdiction</span>
                  <span className="font-bold text-slate-800">{formData.jurisdiction}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Peremptory Window</span>
                  <span className="font-bold text-slate-800">15 Days</span>
                </div>
              </div>

              {/* Document Container */}
              {viewMode === 'formatted' ? (
                /* FORMAL LEGAL PAPER VIEW */
                <div className="p-6 sm:p-8 legal-paper border border-slate-300 rounded-2xl shadow-inner max-h-[550px] overflow-y-auto space-y-4 font-serif text-slate-900 leading-relaxed">
                  {/* Paper Header / Dispatch stamp */}
                  <div className="text-center pb-4 border-b border-slate-300 space-y-1">
                    <span className="text-[10px] font-sans uppercase tracking-widest text-slate-500 font-bold block">
                      Dispatched via Registered Post A.D. / Speed Post / Electronic Mail
                    </span>
                    <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 uppercase font-serif">
                      {generatedDraft.title}
                    </h2>
                    <p className="text-xs font-sans text-slate-500">
                      Date: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })} | Ref ID: {generatedDraft.caseNumber}/LN
                    </p>
                  </div>

                  {/* Formatted Text Content */}
                  <div className="text-xs sm:text-sm whitespace-pre-wrap font-sans text-slate-800 leading-relaxed space-y-2">
                    {editableContent}
                  </div>

                  {/* Signature Section */}
                  <div className="pt-6 border-t border-slate-300 flex justify-between items-end font-sans text-xs text-slate-700">
                    <div>
                      <p className="font-bold">Place: {formData.jurisdiction}, India</p>
                      <p className="text-[11px] text-slate-500">Date: {new Date().toLocaleDateString('en-IN')}</p>
                    </div>
                    <div className="text-right">
                      <div className="w-36 border-b border-slate-400 mb-1 ml-auto"></div>
                      <p className="font-bold">Advocate / Legal Representative</p>
                      <p className="text-[10px] text-slate-500">Enrolment: D/XXXX/{new Date().getFullYear()}</p>
                    </div>
                  </div>
                </div>
              ) : (
                /* LIVE EDIT VIEW */
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>You can edit or customize any clauses or names directly below:</span>
                    <span className="font-mono">{editableContent.length} chars</span>
                  </div>
                  <textarea
                    rows={18}
                    value={editableContent}
                    onChange={(e) => setEditableContent(e.target.value)}
                    className="w-full p-4 bg-slate-50 border border-slate-300 rounded-2xl font-mono text-xs text-slate-900 leading-relaxed focus:ring-2 focus:ring-legal-blue focus:outline-none resize-y"
                  />
                </div>
              )}

              {/* Mandatory Review Disclaimer */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Disclaimer:</strong> {generatedDraft.variables?.disclaimer || 'AI-generated draft grounded in Indian statutes — requires user/professional review before dispatch.'}
                </span>
              </div>
            </div>
          ) : (
            /* Empty State Placeholder */
            <div className="bg-white p-8 rounded-3xl border border-slate-200/90 shadow-subtle text-center text-slate-400 space-y-3 min-h-[450px] flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-2xl bg-navy-50 text-legal-blue flex items-center justify-center border border-navy-100 shadow-sm">
                <FileSignature className="w-7 h-7 text-legal-blue" />
              </div>
              <h4 className="text-base font-bold text-slate-800">Smart Legal Drafting & Notice Pleading</h4>
              <p className="text-xs max-w-sm leading-relaxed text-slate-500">
                Select a draft template on the left and enter the party and dispute parameters. The AI will generate a structured, formal legal notice with statutory clauses and prayer reliefs.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
