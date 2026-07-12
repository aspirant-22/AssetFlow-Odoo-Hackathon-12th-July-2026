const express = require('express');
const Asset = require('../models/Asset');
const AssetCategory = require('../models/AssetCategory');
const Allocation = require('../models/Allocation');
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const { logActivity } = require('../utils/helpers');

const router = express.Router();

router.get('/', protect, async (req, res) => {
  try {
    const query = {};
    if (req.query.status) query.status = req.query.status;
    if (req.query.category) query.category = req.query.category;
    if (req.query.department) query.department = req.query.department;
    if (req.query.location) query.location = { $regex: req.query.location, $options: 'i' };
    if (req.query.search) {
      query.$or = [
        { assetTag: { $regex: req.query.search, $options: 'i' } },
        { serialNumber: { $regex: req.query.search, $options: 'i' } },
        { name: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    if (req.query.isBookable) query.isBookable = req.query.isBookable === 'true';
    const assets = await Asset.find(query)
      .populate('category', 'name')
      .populate('currentHolder', 'name email')
      .populate('department', 'name')
      .sort({ createdAt: -1 });
    res.json(assets);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id)
      .populate('category', 'name')
      .populate('currentHolder', 'name email')
      .populate('department', 'name');
    if (!asset) return res.status(404).json({ message: 'Asset not found' });
    const allocations = await Allocation.find({ asset: asset._id })
      .populate('employee', 'name email')
      .populate('allocatedBy', 'name')
      .sort({ createdAt: -1 });
    res.json({ asset, history: allocations });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', protect, requireRole('asset_manager', 'admin'), async (req, res) => {
  try {
    const {
      name, category, serialNumber, acquisitionDate, acquisitionCost,
      condition, location, isBookable, department
    } = req.body;
    const cat = await AssetCategory.findById(category);
    if (!cat) return res.status(400).json({ message: 'Invalid category' });
    const asset = await Asset.create({
      name, category, serialNumber, acquisitionDate, acquisitionCost,
      condition, location, isBookable: isBookable || false, department
    });
    await logActivity(req.user._id, 'Registered Asset', 'Asset', asset._id, { name, assetTag: asset.assetTag });
    const populated = await Asset.findById(asset._id)
      .populate('category', 'name')
      .populate('department', 'name');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', protect, requireRole('asset_manager', 'admin'), async (req, res) => {
  try {
    const {
      name, category, serialNumber, acquisitionDate, acquisitionCost,
      condition, location, isBookable, status, department
    } = req.body;
    const asset = await Asset.findByIdAndUpdate(req.params.id,
      { name, category, serialNumber, acquisitionDate, acquisitionCost, condition, location, isBookable, status, department },
      { new: true }
    ).populate('category', 'name').populate('department', 'name');
    if (!asset) return res.status(404).json({ message: 'Asset not found' });
    await logActivity(req.user._id, 'Updated Asset', 'Asset', asset._id);
    res.json(asset);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
