const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: [
        'appointment_booked',
        'appointment_confirmed',
        'appointment_cancelled',
        'appointment_reminder',
        'new_record',
        'priority_alert',
        'system',
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false, index: true },
    relatedId: String,
    relatedModel: { type: String, enum: ['Appointment', 'MedicalRecord', 'User', null] },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

// Compound index for efficient fetching
NotificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

// TTL index for auto-deletion after 30 days
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

module.exports = mongoose.model('Notification', NotificationSchema);
