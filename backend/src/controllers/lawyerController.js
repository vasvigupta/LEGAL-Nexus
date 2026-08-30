const http = require('http');
const { ProfessionalProfile, User, CaseStudy, Case, ConsultationRequest } = require('../models');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { ROLES } = require('../config/roles');

const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://localhost:8000';

const forwardToAiEngine = (path, method = 'GET', payload = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(path, AI_ENGINE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || 8000,
      path: url.pathname + url.search,
      method: method,
      headers: { 'Content-Type': 'application/json' },
      timeout: 8000,
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ statusCode: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ statusCode: res.statusCode, body: data });
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('AI Engine request timed out'));
    });

    if (payload) {
      req.write(JSON.stringify(payload));
    }
    req.end();
  });
};

/**
 * POST /api/lawyers/match
 * Multi-factor Lawyer Matching Engine for a Case
 */
/**
 * POST /api/lawyers/match
 * Multi-factor Lawyer Matching Engine for a Case or Uploaded Document
 */
const matchLawyersForCase = async (req, res, next) => {
  try {
    const { caseId, practiceArea, location, language, budget, documentText, documentName } = req.body;

    let targetCategory = practiceArea || 'Employment & Labour Law';
    let targetJurisdiction = location || 'Delhi';
    let targetTitle = 'Custom Legal Inquiry';

    // 1. If Case ID is supplied, extract details from database
    if (caseId) {
      const caseDoc = await Case.findById(caseId);
      if (caseDoc) {
        targetCategory = caseDoc.category || targetCategory;
        targetJurisdiction = caseDoc.location?.city || targetJurisdiction;
        targetTitle = caseDoc.title || caseDoc.issue || 'Filed Case';
      }
    }

    // 2. If Case Document / PDF text is provided, perform AI classification
    if (documentText || documentName) {
      const textToAnalyze = `${documentName || ''} ${documentText || ''}`.toLowerCase();
      targetTitle = documentName ? `Document: ${documentName}` : 'Uploaded Legal PDF';

      if (textToAnalyze.includes('wage') || textToAnalyze.includes('salary') || textToAnalyze.includes('employment') || textToAnalyze.includes('labour') || textToAnalyze.includes('severance') || textToAnalyze.includes('termination') || textToAnalyze.includes('industrial disputes')) {
        targetCategory = 'Employment & Labour Law';
      } else if (textToAnalyze.includes('cyber') || textToAnalyze.includes('it act') || textToAnalyze.includes('upi') || textToAnalyze.includes('hacked') || textToAnalyze.includes('phishing') || textToAnalyze.includes('unauthorized transaction')) {
        targetCategory = 'Cyber Law & Data Privacy';
      } else if (textToAnalyze.includes('consumer') || textToAnalyze.includes('defect') || textToAnalyze.includes('e-daakhil') || textToAnalyze.includes('deficiency') || textToAnalyze.includes('warranty') || textToAnalyze.includes('refund')) {
        targetCategory = 'Consumer Dispute';
      } else if (textToAnalyze.includes('tenant') || textToAnalyze.includes('rent') || textToAnalyze.includes('eviction') || textToAnalyze.includes('property') || textToAnalyze.includes('land') || textToAnalyze.includes('trespass')) {
        targetCategory = 'Property & Real Estate';
      } else if (textToAnalyze.includes('cheque') || textToAnalyze.includes('section 138') || textToAnalyze.includes('promissory') || textToAnalyze.includes('loan') || textToAnalyze.includes('recovery')) {
        targetCategory = 'Banking & Financial Dispute';
      } else if (textToAnalyze.includes('divorce') || textToAnalyze.includes('matrimonial') || textToAnalyze.includes('maintenance') || textToAnalyze.includes('custody')) {
        targetCategory = 'Family & Matrimonial';
      } else if (textToAnalyze.includes('fir') || textToAnalyze.includes('bail') || textToAnalyze.includes('ipc') || textToAnalyze.includes('bns') || textToAnalyze.includes('criminal')) {
        targetCategory = 'Criminal Law';
      }

      // City detection in document
      const cities = ['Delhi', 'Bengaluru', 'Mumbai', 'Chennai', 'Kolkata', 'Chandigarh', 'Hyderabad', 'Pune', 'Jaipur', 'Lucknow'];
      for (const c of cities) {
        if (textToAnalyze.includes(c.toLowerCase())) {
          targetJurisdiction = c;
          break;
        }
      }
    }

    const caseProfile = {
      title: targetTitle,
      category: targetCategory,
      jurisdiction: targetJurisdiction,
      language: language || 'English',
      financialDetails: { disputedAmount: budget || 100000 },
    };

    // 3. Fetch only active, unblocked practicing advocates & their published case studies
    const [profiles, allCaseStudies] = await Promise.all([
      ProfessionalProfile.find({
        professionalRole: ROLES.LAWYER,
        isBlocked: { $ne: true },
      }).populate('user', 'email role isVerified createdAt'),
      CaseStudy.find({}),
    ]);

    // 4. Calculate Multi-Factor Transparent Match Scores
    const rankedLawyers = profiles.map((p) => {
      const advocateAreas = (p.practiceAreas || []).map((a) => a.toLowerCase());
      const targetCatLower = targetCategory.toLowerCase();

      // Factor 1: Subject-Matter Practice Area Specialization (Max 40 Pts)
      const exactCategoryMatch = advocateAreas.some((a) => a.includes(targetCatLower) || targetCatLower.includes(a));
      const partialCategoryMatch = advocateAreas.some((a) => a.includes(targetCatLower.split(' ')[0]) || a.includes('civil') || a.includes('general'));
      const practiceAreaPoints = exactCategoryMatch ? 40 : partialCategoryMatch ? 15 : 0;

      // Factor 2: Published Precedent Case Studies in this Exact Category (Max 25 Pts)
      const matchingCaseStudies = allCaseStudies.filter((cs) => {
        const isAdvocate = cs.professional?.toString() === p.user?._id?.toString() || cs.professional?.toString() === p.user?.toString();
        const csPracticeLower = (cs.practiceArea || '').toLowerCase();
        const isCat = csPracticeLower.includes(targetCatLower) || targetCatLower.includes(csPracticeLower);
        return isAdvocate && isCat;
      });
      const hasPublishedCaseStudy = matchingCaseStudies.length > 0;
      const caseStudyPoints = hasPublishedCaseStudy ? 25 : 0;
      const featuredCaseStudy = matchingCaseStudies[0] || null;

      // Factor 3: Years of Bar Experience & Seniority in Category (Max 20 Pts)
      const expYears = p.experienceYears || 1;
      let expPoints = 8;
      if (expYears >= 15) expPoints = 20;
      else if (expYears >= 10) expPoints = 16;
      else if (expYears >= 5) expPoints = 12;

      // Factor 4: Judicial Forum / Court Jurisdiction Match (Max 15 Pts)
      const advocateCity = (p.location?.city || '').toLowerCase();
      const targetCity = targetJurisdiction.toLowerCase();
      const courts = (p.location?.primaryCourts || []).join(' ').toLowerCase();
      const locationPoints = advocateCity === targetCity || courts.includes(targetCity) || courts.includes('supreme court') ? 15 : 7;

      // Factor 5: Bar Council Verification Seal (Max 10 Pts)
      const isVerified = p.verificationStatus === 'VERIFIED' || p.barCouncilRegistration?.isVerified === true;
      const verificationPoints = isVerified ? 10 : 0;

      const totalScore = practiceAreaPoints + caseStudyPoints + expPoints + locationPoints + verificationPoints;
      // Normalized percentage out of 110 max points
      const matchPercentage = Math.min(Math.round((totalScore / 110) * 100), 99);
      const isHighlyRecommended = exactCategoryMatch && matchPercentage >= 70;

      return {
        lawyerId: p._id,
        fullName: p.fullName || p.user?.email,
        title: p.title || 'Advocate at High Court',
        bio: p.bio,
        practiceAreas: p.practiceAreas || [],
        experienceYears: expYears,
        location: p.location || { city: 'Delhi', state: 'Delhi' },
        barCouncilRegistration: p.barCouncilRegistration,
        feeRange: p.feeRange,
        isVerified,
        matchScore: totalScore,
        matchPercentage,
        isHighlyRecommended,
        publishedCaseStudiesCount: matchingCaseStudies.length,
        featuredCaseStudy: featuredCaseStudy
          ? {
              title: featuredCaseStudy.title,
              forum: featuredCaseStudy.forum,
              outcome: featuredCaseStudy.outcome,
              year: featuredCaseStudy.year,
            }
          : null,
        explanationBreakdown: [
          {
            factor: 'Practice Area Alignment',
            points: practiceAreaPoints,
            maxPoints: 40,
            label: exactCategoryMatch ? `Primary Specialist in ${targetCategory}` : partialCategoryMatch ? `Allied Practice in ${p.practiceAreas?.[0] || 'Civil Law'}` : 'Different Primary Field',
            matched: exactCategoryMatch,
          },
          {
            factor: 'Published Precedent Case Studies',
            points: caseStudyPoints,
            maxPoints: 25,
            label: hasPublishedCaseStudy ? `🏆 "${featuredCaseStudy.title.substring(0, 40)}..." published` : 'No published case studies in this exact domain',
            matched: hasPublishedCaseStudy,
          },
          {
            factor: 'Experience & Seniority',
            points: expPoints,
            maxPoints: 20,
            label: `${expYears}+ Years Active Practice at Bar`,
            matched: expYears >= 5,
          },
          {
            factor: 'Court Jurisdiction Match',
            points: locationPoints,
            maxPoints: 15,
            label: `Admitted in ${p.location?.city || 'Delhi'} Courts & Tribunals`,
            matched: locationPoints === 15,
          },
          {
            factor: 'Bar Council Verification Seal',
            points: verificationPoints,
            maxPoints: 10,
            label: isVerified ? `Verified Bar Registration (${p.barCouncilRegistration?.registrationNumber || 'Authentic'})` : 'Verification Pending',
            matched: isVerified,
          },
        ],
        summaryExplanation: `${matchPercentage}% Match: ${exactCategoryMatch ? 'Specialist in ' + targetCategory : 'Litigation counsel'} with ${expYears} yrs experience${hasPublishedCaseStudy ? ' & verified landmark case study published.' : '.'}`,
      };
    });

    // Sort descending by match percentage
    rankedLawyers.sort((a, b) => b.matchPercentage - a.matchPercentage);

    // Filter to ONLY highly relevant category specialists (excluding unrelated lawyers!)
    const relevantMatches = rankedLawyers.filter((l) => l.isHighlyRecommended || l.matchPercentage >= 70);
    const topMatches = relevantMatches.length > 0 ? relevantMatches : rankedLawyers.slice(0, 2);

    return sendSuccess(res, {
      matchedLawyers: topMatches,
      allCandidatesCount: profiles.length,
      totalMatchesCount: topMatches.length,
      caseProfile,
    }, 'Top advocate matches computed successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/lawyers/case-studies
 * Publish Anonymized Case Study
 */
const publishCaseStudy = async (req, res, next) => {
  try {
    const { title, practiceArea, forum, summary, challenge, strategy, outcome, year } = req.body;

    const caseStudy = await CaseStudy.create({
      professional: req.user._id,
      title,
      practiceArea: practiceArea || 'General Law',
      forum,
      summary,
      challenge,
      strategy,
      outcome,
      anonymizedDetails: true,
      year: year || new Date().getFullYear(),
    });

    return sendSuccess(res, caseStudy, 'Case study published successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/lawyers/case-studies
 */
const listCaseStudies = async (req, res, next) => {
  try {
    const { practiceArea, professionalId } = req.query;
    const filter = {};
    if (practiceArea) filter.practiceArea = new RegExp(practiceArea, 'i');
    if (professionalId) filter.professional = professionalId;

    const caseStudies = await CaseStudy.find(filter)
      .populate('professional', 'email role')
      .sort({ createdAt: -1 });

    return sendSuccess(res, caseStudies, 'Case studies retrieved');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/lawyers
 */
const searchLawyersDirectory = async (req, res, next) => {
  try {
    const {
      role,
      practiceArea,
      city,
      state,
      verifiedOnly,
      minExperience,
      search,
      page = 1,
      limit = 20,
    } = req.query;

    const filter = {
      isBlocked: { $ne: true },
    };

    if (role) {
      filter.professionalRole = role;
    } else {
      // Advocate Directory strictly lists practicing advocates/lawyers (excluding students)
      filter.professionalRole = ROLES.LAWYER;
    }

    if (verifiedOnly === 'true') {
      filter.verificationStatus = 'VERIFIED';
    }

    if (practiceArea) {
      filter.practiceAreas = { $in: [new RegExp(practiceArea, 'i')] };
    }

    if (city) {
      filter['location.city'] = new RegExp(city, 'i');
    }

    if (state) {
      filter['location.state'] = new RegExp(state, 'i');
    }

    if (minExperience) {
      filter.experienceYears = { $gte: parseInt(minExperience, 10) };
    }

    if (search) {
      filter.$text = { $search: search };
    }

    const skip = (page - 1) * limit;
    const [lawyers, total] = await Promise.all([
      ProfessionalProfile.find(filter)
        .populate('user', 'email role isVerified createdAt')
        .sort({ 'rating.average': -1, experienceYears: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10)),
      ProfessionalProfile.countDocuments(filter),
    ]);

    return sendSuccess(res, lawyers, 'Lawyer directory retrieved', 200, {
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
 * GET /api/lawyers/:id
 */
const getLawyerDetails = async (req, res, next) => {
  try {
    const profile = await ProfessionalProfile.findById(req.params.id)
      .populate('user', 'email role isVerified createdAt');

    if (!profile) {
      return sendError(res, 'Lawyer profile not found', 404);
    }

    const caseStudies = await CaseStudy.find({ professional: profile.user._id }).sort({ createdAt: -1 });

    return sendSuccess(res, { profile, caseStudies }, 'Lawyer details retrieved');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/lawyers/consultation-request
 * Submit a formal consultation booking request to an advocate
 */
const sendConsultationRequest = async (req, res, next) => {
  try {
    const {
      lawyerId,
      clientName,
      clientEmail,
      clientPhone,
      caseTitle,
      category,
      urgency,
      consultationMode,
      preferredDate,
      summary,
    } = req.body;

    if (!lawyerId) {
      return sendError(res, 'Lawyer ID is required', 400);
    }

    const profile = await ProfessionalProfile.findOne({
      $or: [{ _id: lawyerId }, { user: lawyerId }],
    }).populate('user', 'email role isVerified fullName');

    if (!profile) {
      return sendError(res, 'Advocate profile not found', 404);
    }

    const consultationId = `REQ-${Date.now().toString().slice(-6)}`;

    // Create persistent ConsultationRequest in DB
    const newReq = await ConsultationRequest.create({
      consultationId,
      citizen: req.user?._id || null,
      clientName: clientName || req.user?.profileData?.fullName || 'Citizen Client',
      clientEmail: clientEmail || req.user?.email || 'citizen@legalnexus.in',
      clientPhone: clientPhone || '',
      lawyer: profile._id,
      lawyerName: profile.fullName || 'Advocate',
      barRegistrationNumber: profile.barCouncilRegistration?.registrationNumber || 'Verified',
      caseTitle: caseTitle || 'Legal Advisory & Dispute Assessment',
      category: category || profile.practiceAreas?.[0] || 'General Legal Advisory',
      consultationMode: consultationMode || 'PHONE_CALL',
      urgency: urgency || 'NORMAL',
      status: 'PENDING',
      summary: summary || '',
    });

    return sendSuccess(
      res,
      {
        ...newReq.toObject(),
        estimatedResponseTime: urgency === 'CRITICAL' ? 'Within 2 hours' : 'Within 24 hours',
      },
      'Consultation request submitted successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/lawyers/consultation-requests
 * Retrieve all consultation requests with optional status filtering
 */
const getConsultationRequests = async (req, res, next) => {
  try {
    const { status, lawyerId, email } = req.query;
    const filter = {};

    if (status && status !== 'ALL') {
      filter.status = status;
    }
    if (lawyerId) {
      filter.lawyer = lawyerId;
    }
    if (email) {
      filter.clientEmail = email;
    }

    const requests = await ConsultationRequest.find(filter)
      .populate('lawyer', 'fullName title location practiceAreas barCouncilRegistration rating')
      .sort({ createdAt: -1 });

    return sendSuccess(
      res,
      requests,
      'Consultation requests retrieved successfully',
      200,
      {
        total: requests.length,
        pendingCount: requests.filter((r) => r.status === 'PENDING').length,
        acceptedCount: requests.filter((r) => r.status === 'ACCEPTED').length,
        declinedCount: requests.filter((r) => r.status === 'DECLINED').length,
      }
    );
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/lawyers/consultation-requests/:id/status
 * Advocate or Admin updates consultation request status (ACCEPTED / DECLINED)
 */
const updateConsultationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, scheduledDate, scheduledTime, meetingLink, chamberAddress, advocateNotes, declinedReason } = req.body;

    if (!['ACCEPTED', 'DECLINED', 'PENDING', 'COMPLETED'].includes(status)) {
      return sendError(res, 'Invalid consultation status', 400);
    }

    const mongoose = require('mongoose');
    const isMongoId = mongoose.Types.ObjectId.isValid(id);
    const query = isMongoId ? { $or: [{ _id: id }, { consultationId: id }] } : { consultationId: id };

    const consult = await ConsultationRequest.findOne(query);

    if (!consult) {
      return sendError(res, 'Consultation request not found', 404);
    }

    consult.status = status;
    consult.respondedAt = new Date();

    if (status === 'ACCEPTED') {
      consult.scheduledDate = scheduledDate || new Date(Date.now() + 86400000).toISOString().split('T')[0];
      consult.scheduledTime = scheduledTime || '04:00 PM IST';
      consult.meetingLink = meetingLink || 'https://meet.legalnexus.in/consult-' + consult.consultationId.toLowerCase();
      consult.chamberAddress = chamberAddress || 'Chamber 402, High Court Complex';
      consult.advocateNotes = advocateNotes || 'Consultation confirmed. Please keep case documents and ID ready.';
      consult.declinedReason = undefined;
    } else if (status === 'DECLINED') {
      consult.declinedReason = declinedReason || 'Advocate has a calendar conflict / active court hearing on this date.';
    }

    await consult.save();

    return sendSuccess(res, consult, `Consultation request marked as ${status}`);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  matchLawyersForCase,
  publishCaseStudy,
  listCaseStudies,
  searchLawyersDirectory,
  getLawyerDetails,
  sendConsultationRequest,
  getConsultationRequests,
  updateConsultationStatus,
};
