/**
 * Nyaya Setu System Constants & Enums
 */

const CASE_CATEGORIES = [
  'Employment',
  'Property & Real Estate',
  'Consumer Dispute',
  'Family & Matrimonial',
  'Criminal Law',
  'Civil Litigation',
  'Corporate & Commercial',
  'Cyber Law & Data Privacy',
  'Intellectual Property',
  'Constitutional & Human Rights',
  'Taxation',
  'Motor Vehicle & Accidents',
  'Banking & Financial Dispute',
  'Other'
];

const CASE_STATUSES = [
  'OPEN',
  'UNDER_REVIEW',
  'LAWYER_ASSIGNED',
  'IN_PROGRESS',
  'RESOLVED',
  'CLOSED',
  'ARCHIVED'
];

const URGENCY_LEVELS = [
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL'
];

const TIMELINE_EVENT_TYPES = [
  'EMPLOYMENT_STARTED',
  'SALARY_DUE',
  'HR_CONTACTED',
  'LEGAL_NOTICE_SENT',
  'LEGAL_NOTICE_RECEIVED',
  'COMPLAINT_FILED',
  'HEARING_SCHEDULED',
  'DOCUMENT_SUBMITTED',
  'LAWYER_CONSULTED',
  'SETTLEMENT_PROPOSED',
  'ORDER_PASSED',
  'CUSTOM_EVENT'
];

const TIMELINE_SOURCES = [
  'USER',
  'LAWYER',
  'COURT',
  'SYSTEM',
  'AI_AGENT'
];

const EVIDENCE_TYPES = [
  'DOCUMENT',
  'PHOTO',
  'EMAIL',
  'PAYSLIP',
  'BANK_STATEMENT',
  'CONTRACT',
  'AUDIO',
  'VIDEO',
  'CHAT_EXPORT',
  'OTHER'
];

const VERIFICATION_STATUSES = [
  'PENDING',
  'OCR_VERIFIED',
  'IN_REVIEW',
  'VERIFIED',
  'REJECTED',
  'BLOCKED',
];

const DOCUMENT_PROCESSING_STATUSES = [
  'PENDING',
  'QUEUED',
  'PROCESSING',
  'COMPLETED',
  'FAILED'
];

const DRAFT_STATUSES = [
  'DRAFT',
  'IN_REVIEW',
  'APPROVED',
  'FINALIZED',
  'DISPATCHED'
];

module.exports = {
  CASE_CATEGORIES,
  CASE_STATUSES,
  URGENCY_LEVELS,
  TIMELINE_EVENT_TYPES,
  TIMELINE_SOURCES,
  EVIDENCE_TYPES,
  VERIFICATION_STATUSES,
  DOCUMENT_PROCESSING_STATUSES,
  DRAFT_STATUSES,
};
