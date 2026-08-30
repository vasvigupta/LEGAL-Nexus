const express = require('express');
const { body } = require('express-validator');
const {
  submitOcrVerification,
  getMyVerificationStatus,
  listVerificationRequests,
  reviewVerificationRequest,
  blockUserAccount,
  unblockUserAccount,
  getAdminVerificationStats,
} = require('../controllers/verificationController');
const { authenticateJWT } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');
const { auditLogMiddleware } = require('../middleware/auditLog');
const { ROLES, PROFESSIONAL_ROLES } = require('../config/roles');

const router = express.Router();

router.use(authenticateJWT);

// Professional submits Bar ID / Document OCR verification
router.post(
  '/ocr-submit',
  authorizeRoles(...PROFESSIONAL_ROLES, ROLES.CITIZEN, ROLES.ADMIN),
  auditLogMiddleware('VERIFICATION_OCR_SUBMITTED', 'VERIFICATION'),
  submitOcrVerification
);

// Professional gets their own live verification status
router.get(
  '/my-status',
  getMyVerificationStatus
);

// Admin stats
router.get(
  '/stats',
  authorizeRoles(ROLES.ADMIN),
  getAdminVerificationStats
);

// Admin list verification requests
router.get(
  '/requests',
  authorizeRoles(ROLES.ADMIN),
  listVerificationRequests
);

// Admin approve or reject
router.patch(
  '/requests/:id',
  authorizeRoles(ROLES.ADMIN),
  [
    body('status').isIn(['VERIFIED', 'REJECTED']).withMessage('Status must be VERIFIED or REJECTED'),
    validate,
  ],
  auditLogMiddleware('VERIFICATION_REVIEWED', 'VERIFICATION'),
  reviewVerificationRequest
);

// Admin Block user / profile
router.post(
  '/block/:userId',
  authorizeRoles(ROLES.ADMIN),
  auditLogMiddleware('USER_BLOCKED', 'SECURITY'),
  blockUserAccount
);

// Admin Unblock user / profile
router.post(
  '/unblock/:userId',
  authorizeRoles(ROLES.ADMIN),
  auditLogMiddleware('USER_UNBLOCKED', 'SECURITY'),
  unblockUserAccount
);

module.exports = router;
