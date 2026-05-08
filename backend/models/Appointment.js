const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    date: { type: Date, required: true },
    timeSlot: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['general', 'emergency', 'followup', 'therapy', 'specialist'],
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed'],
      default: 'pending',
    },
    symptoms: [{ type: String, trim: true }],
    aiSuggestedSpecialty: { type: String, trim: true },
    aiPriorityScore: { type: Number, min: 1, max: 10 },
    priorityLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    notes: { type: String, trim: true },
    hasRecord: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

AppointmentSchema.index({ patient: 1, doctor: 1, date: 1, status: 1, priorityLevel: 1 });

module.exports = mongoose.model('Appointment', AppointmentSchema);
