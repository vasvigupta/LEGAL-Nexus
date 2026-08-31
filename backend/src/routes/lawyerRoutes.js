
const express = require('express');
const { body } = require('express-validator');

const {
  updateLawyerProfile,
  addExperience,
  updateExperience,
  deleteExperience,
  reorderExperiences,
  addCaseHistory,
  updateCaseHistory,
  deleteCaseHistory,
  searchLawyersDirectory,
  getLawyerDetails,
  requestConsultation,
  getIncomingRequests,
  respondToRequest,
  getOngoingCases,
  getCitizenRequests,
  getCitizenCases,
  matchLawyersForCase,
  publishCaseStudy,
  updateCaseStudy,
  deleteCaseStudy,
  listCaseStudies,
} = require('../controllers/lawyerController');

const {
  authenticateJWT,
  optionalAuth,
} = require('../middleware/auth');

const { validate } = require('../middleware/validate');
const { auditLogMiddleware } = require('../middleware/auditLog');

const router = express.Router();

// ── Profile Information ──────────────────────────────────────────

router.put(
  '/profile',
  authenticateJWT,
  updateLawyerProfile
);

router.put(
  '/:id/profile',
  authenticateJWT,
  updateLawyerProfile
);


// ── Past Experiences CRUD ────────────────────────────────────────

router.post(
  '/experience',
  authenticateJWT,
  addExperience
);

router.post(
  '/:id/experience',
  authenticateJWT,
  addExperience
);

router.put(
  '/experience/:expId',
  authenticateJWT,
  updateExperience
);

router.put(
  '/:id/experience/:expId',
  authenticateJWT,
  updateExperience
);

router.delete(
  '/experience/:expId',
  authenticateJWT,
  deleteExperience
);

router.delete(
  '/:id/experience/:expId',
  authenticateJWT,
  deleteExperience
);

router.put(
  '/experience-reorder',
  authenticateJWT,
  reorderExperiences
);

router.put(
  '/:id/experience-reorder',
  authenticateJWT,
  reorderExperiences
);


// ── Case History CRUD ────────────────────────────────────────────

router.post(
  '/cases',
  authenticateJWT,
  addCaseHistory
);

router.post(
  '/:id/cases',
  authenticateJWT,
  addCaseHistory
);

router.put(
  '/cases/:caseId',
  authenticateJWT,
  updateCaseHistory
);

router.put(
  '/:id/cases/:caseId',
  authenticateJWT,
  updateCaseHistory
);

router.delete(
  '/cases/:caseId',
  authenticateJWT,
  deleteCaseHistory
);

router.delete(
  '/:id/cases/:caseId',
  authenticateJWT,
  deleteCaseHistory
);


// ── Lawyer Request Lifecycle ─────────────────────────────────────

// Get pending requests received by the logged-in lawyer
router.get(
  '/requests/incoming',
  authenticateJWT,
  getIncomingRequests
);

// Alias for incoming requests
router.get(
  '/requests',
  authenticateJWT,
  getIncomingRequests
);

// Accept / reject a representation request
router.patch(
  '/requests/:id/respond',
  authenticateJWT,
  respondToRequest
);

// Citizen sends representation request to lawyer
router.post(
  '/request-consultation',
  authenticateJWT,
  requestConsultation
);

// Lawyer's assigned / ongoing cases
router.get(
  '/ongoing-cases',
  authenticateJWT,
  getOngoingCases
);

// Citizen's representation requests
router.get(
  '/requests/citizen',
  authenticateJWT,
  getCitizenRequests
);

// Cases available to the lawyer/citizen workflow
router.get(
  '/citizen-cases',
  authenticateJWT,
  getCitizenCases
);


// ── Matching Engine ──────────────────────────────────────────────

router.post(
  '/match',
  authenticateJWT,
  matchLawyersForCase
);


// ── Precedent Case Studies ───────────────────────────────────────

router.post(
  '/case-studies',
  authenticateJWT,
  [
    body('title')
      .notEmpty()
      .withMessage('Title is required'),

    body('summary')
      .notEmpty()
      .withMessage('Summary is required'),

    body('outcome')
      .notEmpty()
      .withMessage('Outcome is required'),

    validate,
  ],
  auditLogMiddleware(
    'CASE_STUDY_PUBLISHED',
    'CASE_STUDY'
  ),
  publishCaseStudy
);

router.put(
  '/case-studies/:id',
  authenticateJWT,
  updateCaseStudy
);

router.delete(
  '/case-studies/:id',
  authenticateJWT,
  deleteCaseStudy
);

router.get(
  '/case-studies',
  optionalAuth,
  listCaseStudies
);


// ── Directory & Public Profiles ─────────────────────────────────

router.get(
  '/',
  optionalAuth,
  searchLawyersDirectory
);

// IMPORTANT: Keep this dynamic route LAST.
// Otherwise it can interfere with named routes.
router.get(
  '/:id',
  optionalAuth,
  getLawyerDetails
);


module.exports = router;
