const mongoose = require('mongoose');

const auditItemSchema = new mongoose.Schema({
  auditCycle: { type: mongoose.Schema.Types.ObjectId, ref: 'AuditCycle', required: true },
  asset: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true },
  status: {
    type: String,
    enum: ['pending', 'verified', 'missing', 'damaged'],
    default: 'pending'
  },
  notes: { type: String, default: '' },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  verifiedAt: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('AuditItem', auditItemSchema);
