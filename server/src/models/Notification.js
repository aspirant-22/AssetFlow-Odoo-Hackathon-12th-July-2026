const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: [
      'asset_assigned', 'maintenance_approved', 'maintenance_rejected',
      'booking_confirmed', 'booking_cancelled', 'booking_reminder',
      'transfer_approved', 'overdue_return', 'audit_discrepancy',
      'general'
    ],
    default: 'general'
  },
  relatedEntity: {
    kind: { type: String, default: '' },
    id: { type: mongoose.Schema.Types.ObjectId, default: null }
  },
  read: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
