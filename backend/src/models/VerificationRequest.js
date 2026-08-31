const mongoose = require('mongoose');
const { VERIFICATION_STATUSES } = require('../utils/constants');

const verificationRequestSchema = new mongoose.Schema(
  {
    professional: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    requestedRole: {
      type: String,
      enum: ['LAWYER', 'LAW_STUDENT', 'LEGAL_ORGANIZATION'],
      required: true,
    },
    submittedData: {
      fullName: String,
      barRegistrationNumber: String,
      stateBarCouncil: String,
      enrollmentYear: Number,
      institutionName: String,
      degree: String,
      idCardUrl: String,
      certificateUrl: String,
      additionalNotes: String,
    },
    ocrExtractedData: {
      extractedName: String,
      extractedBarId: String,
      extractedState: String,
      extractedYear: Number,
      rawOcrText: String,
      nameMatchScore: Number,
      barIdValid: Boolean,
    },
    ocrConfidence: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: VERIFICATION_STATUSES,
      default: 'PENDING',
      index: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
    reviewNotes: {
      type: String,
    },
    rejectionReason: {
      type: String,
    },
    rejectedAt: {
      type: Date,
      index: { expires: 259200 }, // Auto-vanish / expire after 3 days (3 * 24 * 60 * 60 = 259200s)
    },
    isBlocked: {
      type: Boolean,
      default: false,
      index: true,
    },
    blockedReason: {
      type: String,
    },
    blockedAt: {
      type: Date,
    },
    blockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

const VerificationRequest = mongoose.model('VerificationRequest', verificationRequestSchema);
module.exports = VerificationRequest;

