const http = require('http');

const {
  ProfessionalProfile,
  User,
  CaseStudy,
  Case,
  LawyerMatch,
  Notification,
  CaseTimeline,
} = require('../models');

const { sendSuccess, sendError } = require('../utils/apiResponse');
const { ROLES } = require('../config/roles');

const AI_ENGINE_URL =
  process.env.AI_ENGINE_URL || 'http://localhost:8000';

/**
 * Forward request to AI Engine
 */
const forwardToAiEngine = (path, method = 'GET', payload = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(path, AI_ENGINE_URL);

    const options = {
      hostname: url.hostname,
      port: url.port || 8000,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 8000,
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);

          resolve({
            statusCode: res.statusCode,
            body: parsed,
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            body: data,
          });
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
 * Helper: Find lawyer profile by ID or current logged-in user
 */
const findAuthorizedProfile = async (paramId, userId, userRole) => {
  let profile = null;

  if (paramId && paramId !== 'me') {
    profile = await ProfessionalProfile.findById(paramId);

    if (!profile) {
      profile = await ProfessionalProfile.findOne({
        user: paramId,
      });
    }
  } else {
    profile = await ProfessionalProfile.findOne({
      user: userId,
    });
  }

  if (!profile) {
    if (
      userRole === ROLES.LAWYER ||
      userRole === ROLES.LAW_STUDENT
    ) {
      const user = await User.findById(userId);

      profile = new ProfessionalProfile({
        user: userId,
        professionalRole: userRole,
        fullName: user?.email?.split('@')[0] || 'Advocate',
      });

      await profile.save();
    }
  }

  return profile;
};

/**
 * PUT /api/lawyers/:id/profile
 * PUT /api/lawyers/profile
 *
 * Update Lawyer Profile
 */
const updateLawyerProfile = async (req, res, next) => {
  try {
    const targetId = req.params.id || 'me';

    const profile = await findAuthorizedProfile(
      targetId,
      req.user._id,
      req.user.role
    );

    if (!profile) {
      return sendError(res, 'Lawyer profile not found', 404);
    }

    if (
      profile.user.toString() !== req.user._id.toString() &&
      req.user.role !== ROLES.ADMIN
    ) {
      return sendError(
        res,
        'Unauthorized to modify this profile',
        403
      );
    }

    const {
      fullName,
      title,
      bio,
      avatar,
      contactPhone,
      contactEmail,
      practiceAreas,
      location,
      languages,
      experienceYears,
      barCouncilRegistration,
      education,
      feeRange,
      availabilityStatus,
    } = req.body;

    if (fullName) profile.fullName = fullName;
    if (title !== undefined) profile.title = title;
    if (bio !== undefined) profile.bio = bio;
    if (avatar !== undefined) profile.avatar = avatar;

    if (contactPhone !== undefined) {
      profile.contactPhone = contactPhone;
    }

    if (contactEmail !== undefined) {
      profile.contactEmail = contactEmail;
    }

    if (practiceAreas !== undefined) {
      profile.practiceAreas = practiceAreas;
    }

    if (location) {
      profile.location = {
        ...profile.location,
        ...location,
      };
    }

    if (languages !== undefined) {
      profile.languages = languages;
    }

    if (experienceYears !== undefined) {
      profile.experienceYears = experienceYears;
    }

    if (education !== undefined) {
      profile.education = education;
    }

    if (feeRange !== undefined) {
      profile.feeRange = {
        ...profile.feeRange,
        ...feeRange,
      };
    }

    if (availabilityStatus) {
      profile.availabilityStatus = availabilityStatus;
    }

    if (barCouncilRegistration) {
      profile.barCouncilRegistration = {
        ...(profile.barCouncilRegistration || {}),
        ...barCouncilRegistration,
        isVerified:
          profile.barCouncilRegistration?.isVerified || false,
      };
    }

    await profile.save();

    return sendSuccess(
      res,
      profile,
      'Lawyer profile updated successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/lawyers/:id/experience
 * POST /api/lawyers/experience
 *
 * Add Past Experience
 */
const addExperience = async (req, res, next) => {
  try {
    const targetId = req.params.id || 'me';

    const profile = await findAuthorizedProfile(
      targetId,
      req.user._id,
      req.user.role
    );

    if (!profile) {
      return sendError(res, 'Lawyer profile not found', 404);
    }

    if (
      profile.user.toString() !== req.user._id.toString() &&
      req.user.role !== ROLES.ADMIN
    ) {
      return sendError(
        res,
        'Unauthorized to modify this profile',
        403
      );
    }

    const {
      role,
      organization,
      location,
      fromYear,
      toYear,
      isCurrent,
      practiceArea,
      description,
    } = req.body;

    if (!role || !organization) {
      return sendError(
        res,
        'Role and organization are required',
        400
      );
    }

    const newExperience = {
      role,
      organization,
      location: location || '',
      fromYear: fromYear
        ? parseInt(fromYear, 10)
        : undefined,
      toYear: isCurrent
        ? undefined
        : toYear
          ? parseInt(toYear, 10)
          : undefined,
      isCurrent: !!isCurrent,
      practiceArea: practiceArea || '',
      description: description || '',
      orderIndex: profile.experiences.length,
    };

    profile.experiences.push(newExperience);

    await profile.save();

    return sendSuccess(
      res,
      profile.experiences,
      'Experience entry added successfully',
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/lawyers/:id/experience/:expId
 * PUT /api/lawyers/experience/:expId
 */
const updateExperience = async (req, res, next) => {
  try {
    const { id, expId } = req.params;

    const profile = await findAuthorizedProfile(
      id || 'me',
      req.user._id,
      req.user.role
    );

    if (!profile) {
      return sendError(res, 'Lawyer profile not found', 404);
    }

    if (
      profile.user.toString() !== req.user._id.toString() &&
      req.user.role !== ROLES.ADMIN
    ) {
      return sendError(
        res,
        'Unauthorized to modify this profile',
        403
      );
    }

    const experience = profile.experiences.id(expId);

    if (!experience) {
      return sendError(
        res,
        'Experience entry not found',
        404
      );
    }

    const {
      role,
      organization,
      location,
      fromYear,
      toYear,
      isCurrent,
      practiceArea,
      description,
    } = req.body;

    if (role !== undefined) experience.role = role;

    if (organization !== undefined) {
      experience.organization = organization;
    }

    if (location !== undefined) {
      experience.location = location;
    }

    if (fromYear !== undefined) {
      experience.fromYear = fromYear
        ? parseInt(fromYear, 10)
        : undefined;
    }

    if (toYear !== undefined) {
      experience.toYear = isCurrent
        ? undefined
        : toYear
          ? parseInt(toYear, 10)
          : undefined;
    }

    if (isCurrent !== undefined) {
      experience.isCurrent = isCurrent;
    }

    if (practiceArea !== undefined) {
      experience.practiceArea = practiceArea;
    }

    if (description !== undefined) {
      experience.description = description;
    }

    await profile.save();

    return sendSuccess(
      res,
      profile.experiences,
      'Experience entry updated successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/lawyers/:id/experience/:expId
 * DELETE /api/lawyers/experience/:expId
 */
const deleteExperience = async (req, res, next) => {
  try {
    const { id, expId } = req.params;

    const profile = await findAuthorizedProfile(
      id || 'me',
      req.user._id,
      req.user.role
    );

    if (!profile) {
      return sendError(res, 'Lawyer profile not found', 404);
    }

    if (
      profile.user.toString() !== req.user._id.toString() &&
      req.user.role !== ROLES.ADMIN
    ) {
      return sendError(
        res,
        'Unauthorized to modify this profile',
        403
      );
    }

    profile.experiences = profile.experiences.filter(
      (experience) =>
        experience._id.toString() !== expId
    );

    await profile.save();

    return sendSuccess(
      res,
      profile.experiences,
      'Experience entry deleted successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/lawyers/:id/experience-reorder
 * PUT /api/lawyers/experience-reorder
 */
const reorderExperiences = async (req, res, next) => {
  try {
    const targetId = req.params.id || 'me';

    const profile = await findAuthorizedProfile(
      targetId,
      req.user._id,
      req.user.role
    );

    if (!profile) {
      return sendError(res, 'Lawyer profile not found', 404);
    }

    if (
      profile.user.toString() !== req.user._id.toString() &&
      req.user.role !== ROLES.ADMIN
    ) {
      return sendError(
        res,
        'Unauthorized to modify this profile',
        403
      );
    }

    const { orderedIds } = req.body;

    if (Array.isArray(orderedIds)) {
      const experienceMap = new Map(
        profile.experiences.map((experience) => [
          experience._id.toString(),
          experience,
        ])
      );

      const reordered = [];

      for (const id of orderedIds) {
        if (experienceMap.has(id.toString())) {
          reordered.push(
            experienceMap.get(id.toString())
          );

          experienceMap.delete(id.toString());
        }
      }

      for (const remaining of experienceMap.values()) {
        reordered.push(remaining);
      }

      profile.experiences = reordered;

      await profile.save();
    }

    return sendSuccess(
      res,
      profile.experiences,
      'Experiences reordered successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/lawyers/:id/cases
 * POST /api/lawyers/cases
 *
 * Add Case History
 */
const addCaseHistory = async (req, res, next) => {
  try {
    const targetId = req.params.id || 'me';

    const profile = await findAuthorizedProfile(
      targetId,
      req.user._id,
      req.user.role
    );

    if (!profile) {
      return sendError(res, 'Lawyer profile not found', 404);
    }

    if (
      profile.user.toString() !== req.user._id.toString() &&
      req.user.role !== ROLES.ADMIN
    ) {
      return sendError(
        res,
        'Unauthorized to modify this profile',
        403
      );
    }

    const {
      title,
      caseType,
      practiceArea,
      court,
      forum,
      year,
      description,
      summary,
      challenge,
      strategy,
      lawyerRole,
      outcome,
      isPublic = true,
      anonymized = true,
    } = req.body;

    if (!title) {
      return sendError(
        res,
        'Case title is required',
        400
      );
    }

    const newCase = {
      title,
      caseType: caseType || 'Litigation Matter',
      practiceArea: practiceArea || 'General Law',
      court:
        court ||
        forum ||
        'High Court / District Court',
      forum:
        forum ||
        court ||
        'Judicial Court',
      year: year
        ? parseInt(year, 10)
        : new Date().getFullYear(),
      description: description || summary || '',
      summary: summary || description || '',
      challenge: challenge || '',
      strategy: strategy || '',
      lawyerRole: lawyerRole || 'Lead Counsel',
      outcome:
        outcome ||
        'Favorable Order / Relief Granted',
      isPublic: isPublic !== false,
      anonymized: anonymized !== false,
      clientPrivacyNote:
        'Client identity withheld for privacy.',
    };

    profile.caseHistories.push(newCase);

    await profile.save();

    return sendSuccess(
      res,
      profile.caseHistories,
      'Case history added successfully',
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/lawyers/:id/cases/:caseId
 * PUT /api/lawyers/cases/:caseId
 */
const updateCaseHistory = async (req, res, next) => {
  try {
    const { id, caseId } = req.params;

    const profile = await findAuthorizedProfile(
      id || 'me',
      req.user._id,
      req.user.role
    );

    if (!profile) {
      return sendError(res, 'Lawyer profile not found', 404);
    }

    if (
      profile.user.toString() !== req.user._id.toString() &&
      req.user.role !== ROLES.ADMIN
    ) {
      return sendError(
        res,
        'Unauthorized to modify this profile',
        403
      );
    }

    const caseHistory =
      profile.caseHistories.id(caseId);

    if (!caseHistory) {
      return sendError(
        res,
        'Case history entry not found',
        404
      );
    }

    const {
      title,
      caseType,
      practiceArea,
      court,
      forum,
      year,
      description,
      summary,
      challenge,
      strategy,
      lawyerRole,
      outcome,
      isPublic,
      anonymized,
    } = req.body;

    if (title !== undefined) {
      caseHistory.title = title;
    }

    if (caseType !== undefined) {
      caseHistory.caseType = caseType;
    }

    if (practiceArea !== undefined) {
      caseHistory.practiceArea = practiceArea;
    }

    if (court !== undefined) {
      caseHistory.court = court;
    }

    if (forum !== undefined) {
      caseHistory.forum = forum;
    }

    if (year !== undefined) {
      caseHistory.year = year
        ? parseInt(year, 10)
        : caseHistory.year;
    }

    if (description !== undefined) {
      caseHistory.description = description;
    }

    if (summary !== undefined) {
      caseHistory.summary = summary;
    }

    if (challenge !== undefined) {
      caseHistory.challenge = challenge;
    }

    if (strategy !== undefined) {
      caseHistory.strategy = strategy;
    }

    if (lawyerRole !== undefined) {
      caseHistory.lawyerRole = lawyerRole;
    }

    if (outcome !== undefined) {
      caseHistory.outcome = outcome;
    }

    if (isPublic !== undefined) {
      caseHistory.isPublic = isPublic;
    }

    if (anonymized !== undefined) {
      caseHistory.anonymized = anonymized;
    }

    await profile.save();

    return sendSuccess(
      res,
      profile.caseHistories,
      'Case history updated successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/lawyers/:id/cases/:caseId
 * DELETE /api/lawyers/cases/:caseId
 */
const deleteCaseHistory = async (req, res, next) => {
  try {
    const { id, caseId } = req.params;

    const profile = await findAuthorizedProfile(
      id || 'me',
      req.user._id,
      req.user.role
    );

    if (!profile) {
      return sendError(res, 'Lawyer profile not found', 404);
    }

    if (
      profile.user.toString() !== req.user._id.toString() &&
      req.user.role !== ROLES.ADMIN
    ) {
      return sendError(
        res,
        'Unauthorized to modify this profile',
        403
      );
    }

    profile.caseHistories =
      profile.caseHistories.filter(
        (caseHistory) =>
          caseHistory._id.toString() !== caseId
      );

    await profile.save();

    return sendSuccess(
      res,
      profile.caseHistories,
      'Case history deleted successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/lawyers
 *
 * Search and Filter Advocate Directory
 */
const searchLawyersDirectory = async (req, res, next) => {
  try {
    const {
      role,
      practiceArea,
      city,
      state,
      court,
      verifiedOnly,
      minExperience,
      search,
      page = 1,
      limit = 20,
    } = req.query;

    const filter = {};

    if (role) {
      filter.professionalRole = role;
    } else {
      filter.professionalRole = {
        $in: [
          ROLES.LAWYER,
          ROLES.LAW_STUDENT,
        ],
      };
    }

    if (verifiedOnly === 'true') {
      filter.verificationStatus = 'VERIFIED';
    }

    if (practiceArea) {
      filter.practiceAreas = {
        $in: [new RegExp(practiceArea, 'i')],
      };
    }

    if (city) {
      filter['location.city'] =
        new RegExp(city, 'i');
    }

    if (state) {
      filter['location.state'] =
        new RegExp(state, 'i');
    }

    if (court) {
      filter['location.primaryCourts'] = {
        $in: [new RegExp(court, 'i')],
      };
    }

    if (minExperience) {
      filter.experienceYears = {
        $gte: parseInt(minExperience, 10),
      };
    }

    if (search) {
      filter.$or = [
        {
          fullName: new RegExp(search, 'i'),
        },
        {
          bio: new RegExp(search, 'i'),
        },
        {
          practiceAreas: {
            $in: [new RegExp(search, 'i')],
          },
        },
        {
          'location.city':
            new RegExp(search, 'i'),
        },
        {
          'location.primaryCourts': {
            $in: [new RegExp(search, 'i')],
          },
        },
      ];
    }

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;

    const [lawyers, total] = await Promise.all([
      ProfessionalProfile.find(filter)
        .populate(
          'user',
          'email role isVerified createdAt phone'
        )
        .sort({
          'rating.average': -1,
          experienceYears: -1,
        })
        .skip(skip)
        .limit(limitNumber),

      ProfessionalProfile.countDocuments(filter),
    ]);

    // Only expose public case histories.
    const sanitizedLawyers = lawyers.map((profile) => {
      const obj = profile.toObject();

      obj.caseHistories =
        (obj.caseHistories || [])
          .filter(
            (caseHistory) =>
              caseHistory.isPublic !== false
          )
          .map((caseHistory) => ({
            ...caseHistory,
            clientPrivacyNote:
              'Client identity withheld for privacy.',
          }));

      return obj;
    });

    return sendSuccess(
      res,
      sanitizedLawyers,
      'Lawyer directory retrieved',
      200,
      {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(
          total / limitNumber
        ),
      }
    );
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/lawyers/:id
 *
 * Retrieve public lawyer details
 */
const getLawyerDetails = async (req, res, next) => {
  try {
    let profile =
      await ProfessionalProfile.findById(
        req.params.id
      ).populate(
        'user',
        'email role isVerified createdAt phone'
      );

    if (!profile) {
      profile =
        await ProfessionalProfile.findOne({
          user: req.params.id,
        }).populate(
          'user',
          'email role isVerified createdAt phone'
        );
    }

    if (!profile) {
      return sendError(
        res,
        'Lawyer profile not found',
        404
      );
    }

    const professionalId =
      profile.user?._id || profile.user;

    const caseStudies =
      await CaseStudy.find({
        professional: professionalId,
      }).sort({
        createdAt: -1,
      });

    const obj = profile.toObject();

    // Strict privacy safeguard.
    const publicCaseHistories =
      (obj.caseHistories || [])
        .filter(
          (caseHistory) =>
            caseHistory.isPublic !== false
        )
        .map((caseHistory) => ({
          ...caseHistory,
          clientPrivacyNote:
            'Client identity withheld for privacy.',
        }));

    return sendSuccess(
      res,
      {
        profile: {
          ...obj,
          caseHistories: publicCaseHistories,
        },
        caseStudies,
        experiences: obj.experiences || [],
        caseHistories: publicCaseHistories,
      },
      'Lawyer details retrieved'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/lawyers/request-consultation
 * POST /api/requests
 *
 * Citizen sends representation request to lawyer.
 */
const requestConsultation = async (
  req,
  res,
  next
) => {
  try {
    const {
      caseId,
      lawyerId,
      message,
    } = req.body;

    if (!caseId || !lawyerId) {
      return sendError(
        res,
        'caseId and lawyerId are required',
        400
      );
    }

    const caseDoc = await Case.findById(caseId);

    if (!caseDoc) {
      return sendError(
        res,
        'Case file not found',
        404
      );
    }

    if (
      caseDoc.user.toString() !==
        req.user._id.toString() &&
      req.user.role !== ROLES.ADMIN
    ) {
      return sendError(
        res,
        'Unauthorized: you can only request assistance for your own case files',
        403
      );
    }

    let lawyerUser =
      await User.findById(lawyerId);

    let targetUserId = lawyerId;

    if (!lawyerUser) {
      const profile =
        await ProfessionalProfile.findById(
          lawyerId
        );

      if (profile) {
        targetUserId = profile.user;
        lawyerUser =
          await User.findById(profile.user);
      }
    }

    if (
      !lawyerUser ||
      lawyerUser.role !== ROLES.LAWYER
    ) {
      return sendError(
        res,
        'Target advocate user not found',
        404
      );
    }

    // Prevent duplicate active requests.
    const existingMatch =
      await LawyerMatch.findOne({
        case: caseId,
        lawyer: targetUserId,
      });

    if (existingMatch) {
      if (
        existingMatch.status === 'PENDING'
      ) {
        return sendError(
          res,
          'A representation request is already pending with this advocate for this case.',
          409
        );
      }

      if (
        existingMatch.status === 'ACCEPTED'
      ) {
        return sendError(
          res,
          'This advocate has already accepted and is currently assigned to this case.',
          409
        );
      }

      // Re-open previously rejected request.
      if (
        existingMatch.status === 'REJECTED'
      ) {
        existingMatch.status = 'PENDING';
        existingMatch.requestMessage =
          message ||
          existingMatch.requestMessage;
        existingMatch.citizen =
          req.user._id;
        existingMatch.rejectionReason =
          undefined;
        existingMatch.respondedAt =
          undefined;

        await existingMatch.save();

        await Notification.create({
          recipient: targetUserId,
          sender: req.user._id,
          type: 'LAWYER_MATCH_FOUND',
          title:
            'New Representation Request',
          message: `Citizen requested representation for case "${caseDoc.title}".`,
          link: '/lawyers',
        });

        return sendSuccess(
          res,
          existingMatch,
          'Representation request submitted successfully',
          200
        );
      }
    }

    const newMatch = new LawyerMatch({
      case: caseId,
      lawyer: targetUserId,
      citizen: req.user._id,
      status: 'PENDING',
      requestMessage:
        message ||
        'Citizen requested consultation and representation for this case.',
    });

    await newMatch.save();

    await CaseTimeline.create({
      case: caseId,
      eventType: 'CUSTOM_EVENT',
      title:
        'Advocate Consultation Requested',
      description:
        'Dispatched legal assistance request to Advocate.',
      source: 'USER',
      createdBy: req.user._id,
      dateTime: new Date(),
    });

    await Notification.create({
      recipient: targetUserId,
      sender: req.user._id,
      type: 'LAWYER_MATCH_FOUND',
      title:
        'New Representation Request',
      message: `Citizen requested representation for case "${caseDoc.title}".`,
      link: '/lawyers',
    });

    return sendSuccess(
      res,
      newMatch,
      'Representation request submitted successfully',
      201
    );
  } catch (error) {
    if (error.code === 11000) {
      return sendError(
        res,
        'A request for this case and advocate already exists.',
        409
      );
    }

    next(error);
  }
};

/**
 * GET /api/lawyers/requests/incoming
 *
 * Retrieve ONLY pending requests.
 */
const getIncomingRequests = async (
  req,
  res,
  next
) => {
  try {
    const requests =
      await LawyerMatch.find({
        lawyer: req.user._id,
        status: 'PENDING',
      })
        .populate({
          path: 'case',
          select:
            'caseNumber title category issue description urgency status location financialDetails user createdAt',
          populate: {
            path: 'user',
            select: 'email phone',
          },
        })
        .populate(
          'citizen',
          'email phone'
        )
        .sort({
          createdAt: -1,
        });

    return sendSuccess(
      res,
      requests,
      'Incoming pending requests retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/lawyers/requests/:id/respond
 * PATCH /api/requests/:requestId/accept
 * PATCH /api/requests/:requestId/reject
 */
const respondToRequest = async (
  req,
  res,
  next
) => {
  try {
    const id =
      req.params.id ||
      req.params.requestId;

    let action = req.body.action;

    if (req.path.endsWith('/accept')) {
      action = 'ACCEPT';
    }

    if (req.path.endsWith('/reject')) {
      action = 'REJECT';
    }

    const rejectionReason =
      req.body.rejectionReason;

    if (
      !['ACCEPT', 'REJECT'].includes(action)
    ) {
      return sendError(
        res,
        'Action must be ACCEPT or REJECT',
        400
      );
    }

    let match =
      await LawyerMatch.findOne({
        _id: id,
        lawyer: req.user._id,
      });

    // Support routes where :id is case ID.
    if (!match) {
      match =
        await LawyerMatch.findOne({
          case: id,
          lawyer: req.user._id,
        });
    }

    if (!match) {
      return sendError(
        res,
        'Request not found or unauthorized',
        404
      );
    }

    // State machine:
    // PENDING -> ACCEPTED
    // PENDING -> REJECTED
    if (match.status !== 'PENDING') {
      return sendError(
        res,
        `Invalid transition: cannot respond to a request that is already ${match.status}.`,
        400
      );
    }

    if (action === 'ACCEPT') {
      match.status = 'ACCEPTED';
      match.respondedAt = new Date();

      await match.save();

      const updatedCase =
        await Case.findByIdAndUpdate(
          match.case,
          {
            assignedLawyer:
              req.user._id,
            status: 'LAWYER_ASSIGNED',
          },
          {
            new: true,
          }
        );

      await CaseTimeline.create({
        case: match.case,
        eventType: 'LAWYER_CONSULTED',
        title:
          'Advocate Accepted Representation',
        description:
          'Advocate accepted case representation and is now assigned to the matter.',
        source: 'SYSTEM',
        createdBy: req.user._id,
        dateTime: new Date(),
      });

      if (match.citizen) {
        await Notification.create({
          recipient: match.citizen,
          sender: req.user._id,
          type: 'CASE_UPDATE',
          title:
            'Advocate Accepted Representation!',
          message: `Advocate accepted your representation request for case "${updatedCase?.title || 'Case'}".`,
          link: '/cases',
        });
      }

      return sendSuccess(
        res,
        {
          match,
          case: updatedCase,
        },
        'Request accepted successfully'
      );
    }

    match.status = 'REJECTED';
    match.rejectionReason =
      rejectionReason ||
      'Advocate unavailable or unable to take up matter at this time.';
    match.respondedAt = new Date();

    await match.save();

    if (match.citizen) {
      const caseDoc =
        await Case.findById(match.case);

      await Notification.create({
        recipient: match.citizen,
        sender: req.user._id,
        type: 'CASE_UPDATE',
        title:
          'Representation Request Declined',
        message: `Advocate was unable to take up representation for case "${caseDoc?.title || 'Case'}". You can request another advocate from the directory.`,
        link: '/lawyers',
      });
    }

    return sendSuccess(
      res,
      {
        match,
      },
      'Request declined successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/lawyers/ongoing-cases
 */
const getOngoingCases = async (
  req,
  res,
  next
) => {
  try {
    const cases = await Case.find({
      assignedLawyer: req.user._id,
      status: {
        $nin: ['ARCHIVED'],
      },
    })
      .populate(
        'user',
        'email phone'
      )
      .sort({
        updatedAt: -1,
      });

    return sendSuccess(
      res,
      cases,
      'Ongoing assigned cases retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/lawyers/requests/citizen
 */
const getCitizenRequests = async (
  req,
  res,
  next
) => {
  try {
    const requests =
      await LawyerMatch.find({
        citizen: req.user._id,
      })
        .populate(
          'case',
          'caseNumber title category urgency status'
        )
        .populate(
          'lawyer',
          'email phone'
        )
        .sort({
          createdAt: -1,
        });

    const lawyerUserIds = requests
      .map((request) =>
        request.lawyer?._id
      )
      .filter(Boolean);

    const profiles =
      await ProfessionalProfile.find({
        user: {
          $in: lawyerUserIds,
        },
      });

    const profileMap = new Map(
      profiles.map((profile) => [
        profile.user.toString(),
        profile,
      ])
    );

    const enriched = requests.map(
      (request) => {
        const obj = request.toObject();

        if (request.lawyer?._id) {
          obj.lawyerProfile =
            profileMap.get(
              request.lawyer._id.toString()
            ) || null;
        }

        return obj;
      }
    );

    return sendSuccess(
      res,
      enriched,
      'Citizen requests retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/lawyers/citizen-cases
 */
const getCitizenCases = async (
  req,
  res,
  next
) => {
  try {
    const {
      category,
      urgency,
      city,
      state,
      search,
      status,
      page = 1,
      limit = 20,
    } = req.query;

    const filter = {
      status: {
        $nin: ['ARCHIVED'],
      },
    };

    if (category) {
      filter.category = category;
    }

    if (urgency) {
      filter.urgency = urgency;
    }

    if (status) {
      filter.status = status;
    }

    if (city) {
      filter['location.city'] =
        new RegExp(city, 'i');
    }

    if (state) {
      filter['location.state'] =
        new RegExp(state, 'i');
    }

    if (search) {
      filter.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { caseNumber: new RegExp(search, 'i') },
      ];
    }

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;

    const [cases, total] = await Promise.all([
      Case.find(filter)
        .populate('user', 'email phone')
        .populate('assignedLawyer', 'email phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber),

      Case.countDocuments(filter),
    ]);

    return sendSuccess(
      res,
      cases,
      'Citizen cases retrieved successfully',
      200,
      {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
      }
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/lawyers/match
 */
const matchLawyersForCase = async (req, res, next) => {
  try {
    const { caseId, category, city, maxResults = 5 } = req.body;

    let caseDoc = null;
    if (caseId) {
      caseDoc = await Case.findById(caseId);
    }

    const targetCategory = category || caseDoc?.category || 'General';
    const targetCity = city || caseDoc?.location?.city || '';

    const filter = { isPublic: true };
    if (targetCategory && targetCategory !== 'General') {
      filter.primaryDomain = new RegExp(targetCategory, 'i');
    }

    let profiles = await ProfessionalProfile.find(filter)
      .populate('user', 'email phone name')
      .limit(maxResults * 2);

    if (!profiles.length) {
      profiles = await ProfessionalProfile.find({ isPublic: true })
        .populate('user', 'email phone name')
        .limit(maxResults);
    }

    const matches = [];
    for (const profile of profiles) {
      let score = 70;
      const reasons = [];

      if (profile.primaryDomain && targetCategory && new RegExp(targetCategory, 'i').test(profile.primaryDomain)) {
        score += 15;
        reasons.push({ criterion: 'Practice Area Match', score: 15, details: `Specializes in ${profile.primaryDomain}` });
      }

      if (targetCity && profile.location?.city && new RegExp(targetCity, 'i').test(profile.location.city)) {
        score += 10;
        reasons.push({ criterion: 'City / Court Jurisdiction', score: 10, details: `Based in ${profile.location.city}` });
      }

      if (profile.experienceYears >= 5) {
        score += 5;
        reasons.push({ criterion: 'Experience Level', score: 5, details: `${profile.experienceYears} years of practice` });
      }

      const matchScore = Math.min(score, 98);

      if (caseDoc) {
        let matchDoc = await LawyerMatch.findOne({ case: caseDoc._id, lawyer: profile.user._id });
        if (!matchDoc) {
          matchDoc = await LawyerMatch.create({
            case: caseDoc._id,
            lawyer: profile.user._id,
            citizen: req.user._id,
            matchScore,
            matchReasons: reasons,
            status: 'SUGGESTED',
          });
        }
        matches.push({ match: matchDoc, profile });
      } else {
        matches.push({ profile, matchScore, matchReasons: reasons });
      }

      if (matches.length >= maxResults) break;
    }

    return sendSuccess(res, matches, 'Lawyers matched successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/lawyers/case-studies
 */
const publishCaseStudy = async (req, res, next) => {
  try {
    const { title, practiceArea, forum, summary, challenge, strategy, outcome, anonymizedDetails, year } = req.body;

    const caseStudy = await CaseStudy.create({
      professional: req.user._id,
      title,
      practiceArea: practiceArea || 'General',
      forum,
      summary,
      challenge,
      strategy,
      outcome,
      anonymizedDetails: anonymizedDetails !== undefined ? anonymizedDetails : true,
      year: year || new Date().getFullYear(),
    });

    return sendSuccess(res, caseStudy, 'Case study published successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/lawyers/case-studies/:id
 */
const updateCaseStudy = async (req, res, next) => {
  try {
    const { id } = req.params;

    const caseStudy = await CaseStudy.findOneAndUpdate(
      { _id: id, professional: req.user._id },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!caseStudy) {
      return sendError(res, 'Case study not found or unauthorized', 404);
    }

    return sendSuccess(res, caseStudy, 'Case study updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/lawyers/case-studies/:id
 */
const deleteCaseStudy = async (req, res, next) => {
  try {
    const { id } = req.params;

    const caseStudy = await CaseStudy.findOneAndDelete({
      _id: id,
      professional: req.user._id,
    });

    if (!caseStudy) {
      return sendError(res, 'Case study not found or unauthorized', 404);
    }

    return sendSuccess(res, null, 'Case study deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/lawyers/case-studies
 */
const listCaseStudies = async (req, res, next) => {
  try {
    const { practiceArea, lawyerId, search, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (practiceArea) filter.practiceArea = new RegExp(practiceArea, 'i');
    if (lawyerId) filter.professional = lawyerId;
    if (search) {
      filter.$or = [
        { title: new RegExp(search, 'i') },
        { summary: new RegExp(search, 'i') },
        { outcome: new RegExp(search, 'i') },
      ];
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [caseStudies, total] = await Promise.all([
      CaseStudy.find(filter)
        .populate('professional', 'email phone name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      CaseStudy.countDocuments(filter),
    ]);

    return sendSuccess(res, caseStudies, 'Case studies retrieved successfully', 200, {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  forwardToAiEngine,
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
};