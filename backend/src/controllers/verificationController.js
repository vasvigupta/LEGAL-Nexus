const { VerificationRequest, ProfessionalProfile, User, Notification } = require('../models');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { processDocumentOcr, validateBarRegistrationNumber } = require('../services/ocrVerificationService');

/**
 * POST /api/verification/ocr-submit
 * Lawyer uploads Bar Council ID Card / Sanad for instant AI OCR verification
 */
const submitOcrVerification = async (req, res, next) => {
  try {
    const {
      fullName,
      barRegistrationNumber,
      stateBarCouncil,
      enrollmentYear,
      documentImageBase64,
      sampleOcrText,
      additionalNotes,
    } = req.body;

    const profileName = fullName || req.user.profileData?.fullName || req.user.email.split('@')[0];

    // 1. Run AI Document OCR Engine
    const ocrResult = await processDocumentOcr({
      imageBase64: documentImageBase64,
      sampleText: sampleOcrText,
      userProfileName: profileName,
      inputBarId: barRegistrationNumber,
    });

    const isOcrPassed = ocrResult.success;
    const initialStatus = isOcrPassed ? 'OCR_VERIFIED' : 'PENDING';
    const badge = isOcrPassed ? 'OCR_VERIFIED' : 'NONE';

    // 2. Create or Update Verification Request queued for Admin
    let verification = await VerificationRequest.findOne({ professional: req.user._id });

    if (verification) {
      verification.submittedData = {
        fullName: profileName,
        barRegistrationNumber: ocrResult.extractedData.extractedBarId || barRegistrationNumber,
        stateBarCouncil: ocrResult.extractedData.extractedState || stateBarCouncil,
        enrollmentYear: ocrResult.extractedData.extractedYear || enrollmentYear,
        idCardUrl: documentImageBase64 ? 'Uploaded Bar Council Document' : 'Document Attached',
        additionalNotes,
      };
      verification.ocrExtractedData = ocrResult.extractedData;
      verification.ocrConfidence = ocrResult.confidence;
      verification.status = initialStatus;
      verification.isBlocked = false;
      verification.rejectedAt = null;
      await verification.save();
    } else {
      verification = await VerificationRequest.create({
        professional: req.user._id,
        requestedRole: req.user.role,
        submittedData: {
          fullName: profileName,
          barRegistrationNumber: ocrResult.extractedData.extractedBarId || barRegistrationNumber,
          stateBarCouncil: ocrResult.extractedData.extractedState || stateBarCouncil,
          enrollmentYear: ocrResult.extractedData.extractedYear || enrollmentYear,
          idCardUrl: documentImageBase64 ? 'Uploaded Bar Council Document' : 'Document Attached',
          additionalNotes,
        },
        ocrExtractedData: ocrResult.extractedData,
        ocrConfidence: ocrResult.confidence,
        status: initialStatus,
      });
    }

    // 3. Update Professional Profile with OCR Verification Tag & Metadata
    await ProfessionalProfile.findOneAndUpdate(
      { user: req.user._id },
      {
        fullName: profileName,
        verificationStatus: initialStatus,
        verificationBadge: badge,
        'barCouncilRegistration.registrationNumber': ocrResult.extractedData.extractedBarId || barRegistrationNumber,
        'barCouncilRegistration.stateBarCouncil': ocrResult.extractedData.extractedState || stateBarCouncil,
        'barCouncilRegistration.yearOfEnrollment': ocrResult.extractedData.extractedYear || enrollmentYear,
        'barCouncilRegistration.isVerified': false, // Requires Admin's final stamp
        ocrVerificationData: {
          extractedName: ocrResult.extractedData.extractedName,
          extractedBarId: ocrResult.extractedData.extractedBarId,
          extractedState: ocrResult.extractedData.extractedState,
          extractedYear: ocrResult.extractedData.extractedYear,
          confidence: ocrResult.confidence,
          verifiedAt: new Date(),
          documentUrl: documentImageBase64 ? 'Uploaded Bar ID Document' : 'Sanad Certificate Attached',
        },
      },
      { upsert: true }
    );

    return sendSuccess(
      res,
      {
        verification,
        ocrResult,
        instantTag: badge,
        message: isOcrPassed
          ? '🛡️ Bar Council Document successfully verified by AI OCR! Your request is now queued in the Admin Verification Dashboard for official seal.'
          : 'Document received and queued for manual Admin review.',
      },
      'OCR Verification Processed',
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/verification/my-status
 * Lawyer checks their own live verification status and OCR data
 */
const getMyVerificationStatus = async (req, res, next) => {
  try {
    const profile = await ProfessionalProfile.findOne({ user: req.user._id });
    const request = await VerificationRequest.findOne({ professional: req.user._id });

    return sendSuccess(res, {
      user: {
        id: req.user._id,
        email: req.user.email,
        isVerified: req.user.isVerified,
        isBlocked: req.user.isBlocked,
        role: req.user.role,
      },
      verificationStatus: profile?.verificationStatus || 'NOT_SUBMITTED',
      verificationBadge: profile?.verificationBadge || 'NONE',
      barCouncilRegistration: profile?.barCouncilRegistration || {},
      ocrVerificationData: profile?.ocrVerificationData || {},
      latestRequest: request || null,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/verification/requests (Admin only)
 * Lists all verification requests with filtering and search
 */
const listVerificationRequests = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (status && status !== 'ALL') {
      if (status === 'PENDING') {
        filter.status = { $in: ['PENDING', 'OCR_VERIFIED', 'IN_REVIEW'] };
      } else {
        filter.status = status;
      }
    }

    if (search) {
      filter.$or = [
        { 'submittedData.fullName': new RegExp(search, 'i') },
        { 'submittedData.barRegistrationNumber': new RegExp(search, 'i') },
        { 'ocrExtractedData.extractedBarId': new RegExp(search, 'i') },
      ];
    }

    const skip = (page - 1) * limit;
    const [requests, total] = await Promise.all([
      VerificationRequest.find(filter)
        .populate('professional', 'email role phone isVerified isBlocked createdAt')
        .populate('reviewedBy', 'email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10)),
      VerificationRequest.countDocuments(filter),
    ]);

    return sendSuccess(res, requests, 'Verification requests retrieved', 200, {
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/verification/requests/:id (Admin only)
 * Admin approves or rejects verification (Rejected requests auto-expire in 3 days)
 */
const reviewVerificationRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, reviewNotes, rejectionReason } = req.body;

    if (!['VERIFIED', 'REJECTED'].includes(status)) {
      return sendError(res, 'Status must be either VERIFIED or REJECTED', 400);
    }

    const request = await VerificationRequest.findById(id);
    if (!request) {
      return sendError(res, 'Verification request not found', 404);
    }

    const isApproved = status === 'VERIFIED';

    request.status = status;
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    request.reviewNotes = reviewNotes || (isApproved ? 'Approved by Admin' : 'Rejected by Admin');
    if (rejectionReason) request.rejectionReason = rejectionReason;

    // Auto-vanish rejected requests after 3 days via TTL index on rejectedAt
    if (!isApproved) {
      request.rejectedAt = new Date();
    } else {
      request.rejectedAt = null;
    }

    await request.save();

    // 1. Update User Record
    await User.findByIdAndUpdate(request.professional, { isVerified: isApproved });

    // 2. Update Professional Profile Record
    await ProfessionalProfile.findOneAndUpdate(
      { user: request.professional },
      {
        verificationStatus: status,
        verificationBadge: isApproved ? 'BAR_COUNCIL_VERIFIED' : 'REJECTED',
        verificationReviewedBy: req.user._id,
        verificationReviewedAt: new Date(),
        'barCouncilRegistration.isVerified': isApproved,
      }
    );

    // 3. Notify Lawyer
    await Notification.create({
      recipient: request.professional,
      sender: req.user._id,
      type: 'VERIFICATION_STATUS_CHANGED',
      title: isApproved ? '🛡️ Bar Council Verification Approved!' : '⚠️ Verification Request Rejected',
      message: isApproved
        ? 'Congratulations! Your State Bar Council credentials have been officially verified by Platform Administration.'
        : `Your verification request was rejected: ${rejectionReason || 'Please check your submitted Bar ID or re-upload a clearer document.'}`,
    });

    return sendSuccess(res, request, `Verification request successfully marked as ${status}`);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/verification/block/:userId (Admin only)
 * Block fraudulent or fake lawyer profile
 */
const blockUserAccount = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { reason = 'Fraudulent Bar ID or fake profile credentials.' } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    // 1. Block User
    user.isBlocked = true;
    user.blockedReason = reason;
    user.blockedAt = new Date();
    user.blockedBy = req.user._id;
    user.isActive = false;
    await user.save();

    // 2. Block Professional Profile
    await ProfessionalProfile.findOneAndUpdate(
      { user: userId },
      {
        isBlocked: true,
        blockedReason: reason,
        verificationStatus: 'BLOCKED',
        verificationBadge: 'BLOCKED',
      }
    );

    // 3. Update Verification Request
    await VerificationRequest.findOneAndUpdate(
      { professional: userId },
      {
        status: 'BLOCKED',
        isBlocked: true,
        blockedReason: reason,
        blockedAt: new Date(),
        blockedBy: req.user._id,
      }
    );

    return sendSuccess(res, { userId, isBlocked: true }, 'User profile has been successfully placed on the Blocklist.');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/verification/unblock/:userId (Admin only)
 * Unblock a previously blocked account
 */
const unblockUserAccount = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    user.isBlocked = false;
    user.blockedReason = null;
    user.blockedAt = null;
    user.blockedBy = null;
    user.isActive = true;
    await user.save();

    await ProfessionalProfile.findOneAndUpdate(
      { user: userId },
      {
        isBlocked: false,
        blockedReason: null,
        verificationStatus: 'PENDING',
        verificationBadge: 'NONE',
      }
    );

    await VerificationRequest.findOneAndUpdate(
      { professional: userId },
      {
        status: 'PENDING',
        isBlocked: false,
        blockedReason: null,
      }
    );

    return sendSuccess(res, { userId, isBlocked: false }, 'User account has been restored from the Blocklist.');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/verification/stats (Admin only)
 * Returns aggregated KPI metrics for the Admin Dashboard
 */
const getAdminVerificationStats = async (req, res, next) => {
  try {
    const [totalRequests, pendingApprovals, verifiedAdvocates, rejectedRequests, blockedProfiles] = await Promise.all([
      VerificationRequest.countDocuments(),
      VerificationRequest.countDocuments({ status: { $in: ['PENDING', 'OCR_VERIFIED', 'IN_REVIEW'] } }),
      VerificationRequest.countDocuments({ status: 'VERIFIED' }),
      VerificationRequest.countDocuments({ status: 'REJECTED' }),
      User.countDocuments({ isBlocked: true }),
    ]);

    return sendSuccess(res, {
      totalRequests,
      pendingApprovals,
      verifiedAdvocates,
      rejectedRequests,
      blockedProfiles,
      systemHealth: 'OPERATIONAL',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitOcrVerification,
  getMyVerificationStatus,
  listVerificationRequests,
  reviewVerificationRequest,
  blockUserAccount,
  unblockUserAccount,
  getAdminVerificationStats,
};
