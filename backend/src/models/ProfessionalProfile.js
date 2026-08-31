const mongoose = require('mongoose');
const { PROFESSIONAL_ROLES, ROLES } = require('../config/roles');
const { VERIFICATION_STATUSES } = require('../utils/constants');

const professionalProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    professionalRole: {
      type: String,
      enum: PROFESSIONAL_ROLES,
      required: true,
      default: ROLES.LAWYER,
      index: true,
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    title: {
      type: String,
      trim: true, // e.g. "Advocate", "Senior Legal Associate", "Final Year Law Student"
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    practiceAreas: [{
      type: String,
      trim: true,
      index: true,
    }],
    location: {
      city: { type: String, trim: true, index: true },
      state: { type: String, trim: true, index: true },
      pincode: { type: String, trim: true },
      primaryCourts: [{ type: String, trim: true }], // e.g. "Delhi High Court", "Tis Hazari District Court"
    },
    languages: [{
      type: String,
      trim: true,
    }],
    experienceYears: {
      type: Number,
      default: 0,
      min: 0,
    },
    barCouncilRegistration: {
      registrationNumber: { type: String, trim: true },
      stateBarCouncil: { type: String, trim: true },
      yearOfEnrollment: { type: Number },
      isVerified: { type: Boolean, default: false },
    },
    lawStudentDetails: {
      institutionName: { type: String, trim: true },
      degree: { type: String, trim: true }, // e.g. "B.A. LL.B (Hons)", "LL.B 3-Year"
      graduationYear: { type: Number },
      currentYear: { type: Number },
      studentIdNumber: { type: String, trim: true },
    },
    education: [
      {
        degree: String,
        institution: String,
        year: Number,
      }
    ],
    certifications: [
      {
        name: String,
        issuingOrganization: String,
        issueDate: Date,
      }
    ],
    feeRange: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
      currency: { type: String, default: 'INR' },
      model: {
        type: String,
        enum: ['PRO_BONO', 'FIXED_PER_CONSULTATION', 'HOURLY', 'PER_HEARING', 'RETAINER', 'SLIDING_SCALE'],
        default: 'FIXED_PER_CONSULTATION',
      },
    },
    availabilityStatus: {
      type: String,
      enum: ['AVAILABLE', 'BUSY', 'NOT_ACCEPTING_CASES', 'ON_LEAVE'],
      default: 'AVAILABLE',
      index: true,
    },
    verificationStatus: {
      type: String,
      enum: VERIFICATION_STATUSES,
      default: 'PENDING',
      index: true,
    },
    verificationBadge: {
      type: String,
      enum: ['NONE', 'OCR_VERIFIED', 'BAR_COUNCIL_VERIFIED', 'REJECTED', 'BLOCKED'],
      default: 'NONE',
    },
    ocrVerificationData: {
      extractedName: String,
      extractedBarId: String,
      extractedState: String,
      extractedYear: Number,
      confidence: Number,
      verifiedAt: Date,
      documentUrl: String,
    },
    isBlocked: {
      type: Boolean,
      default: false,
      index: true,
    },
    blockedReason: {
      type: String,
    },
    verificationReviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    verificationReviewedAt: {
      type: Date,
    },
    rating: {
      average: { type: Number, default: 5.0, min: 1, max: 5 },
      count: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

// Search indexes
professionalProfileSchema.index({ fullName: 'text', bio: 'text', practiceAreas: 'text' });

const ProfessionalProfile = mongoose.model('ProfessionalProfile', professionalProfileSchema);
module.exports = ProfessionalProfile;
