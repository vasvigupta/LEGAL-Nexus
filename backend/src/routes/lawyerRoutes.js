const express = require('express');
const { body } = require('express-validator');
const {
  matchLawyersForCase,
  publishCaseStudy,
  listCaseStudies,
  searchLawyersDirectory,
  getLawyerDetails,
  sendConsultationRequest,
  getConsultationRequests,
  updateConsultationStatus,
} = require('../controllers/lawyerController');
const { authenticateJWT, optionalAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { auditLogMiddleware } = require('../middleware/auditLog');

const router = express.Router();

// POST /api/lawyers/match (Multi-factor weighted lawyer matching)
router.post('/match', optionalAuth, matchLawyersForCase);

// Consultation Requests
router.post('/consultation-request', optionalAuth, sendConsultationRequest);
router.get('/consultation-requests', optionalAuth, getConsultationRequests);
router.put('/consultation-requests/:id/status', optionalAuth, updateConsultationStatus);

// POST /api/lawyers/case-studies (Publish anonymized case study)
router.post(
  '/case-studies',
  authenticateJWT,
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('summary').notEmpty().withMessage('Summary is required'),
    body('outcome').notEmpty().withMessage('Outcome is required'),
    validate,
  ],
  auditLogMiddleware('CASE_STUDY_PUBLISHED', 'CASE_STUDY'),
  publishCaseStudy
);

// GET /api/lawyers/case-studies
router.get('/case-studies', listCaseStudies);

// GET /api/lawyers
router.get('/', optionalAuth, searchLawyersDirectory);

// GET /api/lawyers/:id
router.get('/:id', optionalAuth, getLawyerDetails);

module.exports = router;
