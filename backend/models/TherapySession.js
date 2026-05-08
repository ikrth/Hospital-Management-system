const mongoose = require('mongoose');

const TherapySessionSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    messages: [
      {
        role: { type: String, enum: ['user', 'assistant'], required: true },
        content: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        sentiment: { type: String, enum: ['positive', 'neutral', 'negative', 'anxious', 'depressed'] },
      },
    ],
    summary: String,
    dominantMood: String,
    moodScore: Number,
    messageCount: Number,
    keyThemes: [String],
    crisisDetected: Boolean,
    riskLevel: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
    status: { type: String, enum: ['active', 'completed'], default: 'active' },
  },
  { timestamps: true }
);

TherapySessionSchema.index({ patient: 1, updatedAt: -1 });

module.exports = mongoose.model('TherapySession', TherapySessionSchema);
