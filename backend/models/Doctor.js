const mongoose = require('mongoose');

const DoctorSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    specialization: { type: String, required: true, trim: true },
    qualifications: [{ type: String, trim: true }],
    experience: { type: Number, min: 0 },
    licenseNumber: { type: String, unique: true, trim: true },
    consultationFee: { type: Number, min: 0 },
    availableSlots: [
      {
        day: {
          type: String,
          enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        },
        startTime: { type: String, trim: true },
        endTime: { type: String, trim: true },
      },
    ],
    rating: { type: Number, default: 0, min: 0, max: 5 },
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true }
);

DoctorSchema.index({ user: 1 }, { unique: true });
DoctorSchema.index({ licenseNumber: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Doctor', DoctorSchema);
