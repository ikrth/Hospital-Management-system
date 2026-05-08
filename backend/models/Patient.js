const mongoose = require('mongoose');

const PatientSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    },
    phone: { type: String, trim: true },
    address: {
      city: { type: String, trim: true },
      street: { type: String, trim: true },
      zip: { type: String, trim: true },
    },
    emergencyContact: {
      name: { type: String, trim: true },
      phone: { type: String, trim: true },
      relation: { type: String, trim: true },
    },
    medicalHistory: [{ type: String, trim: true }],
    allergies: [{ type: String, trim: true }],
    insurance: {
      provider: { type: String, trim: true },
      policyNumber: { type: String, trim: true },
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

PatientSchema.index({ user: 1 }, { unique: true });

PatientSchema.virtual('age').get(function () {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  let age = today.getFullYear() - this.dateOfBirth.getFullYear();
  const monthDiff = today.getMonth() - this.dateOfBirth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < this.dateOfBirth.getDate())) {
    age -= 1;
  }
  return age;
});

module.exports = mongoose.model('Patient', PatientSchema);
