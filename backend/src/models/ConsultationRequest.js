const mongoose = require('mongoose');

const consultationRequestSchema = new mongoose.Schema(
  {
    consultationId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    citizen: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    clientName: {
      type: String,
      required: true,
      trim: true,
    },
    clientEmail: {
      type: String,
      required: true,
      trim: true,
    },
    clientPhone: {
      type: String,
      trim: true,
    },
    lawyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProfessionalProfile',
      required: true,
      index: true,
    },
    lawyerName: {
      type: String,
      required: true,
    },
    barRegistrationNumber: {
      type: String,
    },
    caseTitle: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      default: 'General Legal Advisory',
    },
    consultationMode: {
      type: String,
      enum: ['PHONE_CALL', 'VIDEO_CONSULT', 'CHAMBER_MEETING'],
      default: 'PHONE_CALL',
    },
    urgency: {
      type: String,
      enum: ['NORMAL', 'HIGH', 'CRITICAL'],
      default: 'NORMAL',
    },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'DECLINED', 'COMPLETED'],
      default: 'PENDING',
      index: true,
    },
    summary: {
      type: String,
    },
    scheduledDate: {
      type: String,
    },
    scheduledTime: {
      type: String,
    },
    meetingLink: {
      type: String,
    },
    chamberAddress: {
      type: String,
    },
    advocateNotes: {
      type: String,
    },
    declinedReason: {
      type: String,
    },
    respondedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const ConsultationRequest = mongoose.model('ConsultationRequest', consultationRequestSchema);
module.exports = ConsultationRequest;
