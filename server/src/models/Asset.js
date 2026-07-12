const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'AssetCategory', required: true },
  assetTag: { type: String, unique: true },
  serialNumber: { type: String, default: '' },
  acquisitionDate: { type: Date, default: null },
  acquisitionCost: { type: Number, default: 0 },
  condition: {
    type: String,
    enum: ['new', 'good', 'fair', 'poor', 'damaged'],
    default: 'new'
  },
  location: { type: String, default: '' },
  photo: { type: String, default: '' },
  documents: [{ type: String }],
  isBookable: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ['available', 'allocated', 'reserved', 'under_maintenance', 'lost', 'retired', 'disposed'],
    default: 'available'
  },
  currentHolder: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null }
}, { timestamps: true });

assetSchema.pre('save', async function (next) {
  if (this.isNew && !this.assetTag) {
    const count = await mongoose.model('Asset').countDocuments();
    this.assetTag = `AF-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Asset', assetSchema);
