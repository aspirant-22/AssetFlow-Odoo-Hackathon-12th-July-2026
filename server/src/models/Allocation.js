const mongoose = require('mongoose');

const allocationSchema = new mongoose.Schema({
  asset: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true },
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
  allocatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  allocatedDate: { type: Date, default: Date.now },
  expectedReturnDate: { type: Date, default: null },
  returnedDate: { type: Date, default: null },
  status: {
    type: String,
    enum: ['active', 'returned', 'overdue'],
    default: 'active'
  },
  notes: { type: String, default: '' },
  conditionCheckIn: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Allocation', allocationSchema);
