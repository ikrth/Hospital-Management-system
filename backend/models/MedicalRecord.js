const mongoose = require('mongoose');

const MedicalRecordSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
    diagnosis: { type: String, required: true, trim: true },
    prescription: [
      {
        medicine: { type: String, required: true },
        dosage: { type: String, required: true },
        duration: { type: String, required: true },
      },
    ],
    labTests: [{ type: String, trim: true }],
    notes: { type: String, trim: true },
    attachments: [{ type: String }],
    dischargeSummary: { type: String },
    followUpSuggestions: {
      followUpIn: String,
      warningSigns: [String],
      lifestyleAdvice: [String],
      specialistReferral: { type: Boolean, default: false },
      referralSpecialty: String,
    },
    aiGeneratedAt: Date,
  },
  { timestamps: true }
);

MedicalRecordSchema.index({ patient: 1, createdAt: -1 });
MedicalRecordSchema.index({ doctor: 1, createdAt: -1 });
MedicalRecordSchema.index({ appointment: 1 }, { unique: true });

module.exports = mongoose.model('MedicalRecord', MedicalRecordSchema);
