const express = require('express');
const AssetCategory = require('../models/AssetCategory');
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const { logActivity } = require('../utils/helpers');

const router = express.Router();

router.get('/', protect, async (req, res) => {
  try {
    const categories = await AssetCategory.find({});
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', protect, requireRole('admin'), async (req, res) => {
  try {
    const { name, description, customFields } = req.body;
    const cat = await AssetCategory.create({ name, description, customFields });
    await logActivity(req.user._id, 'Created Asset Category', 'AssetCategory', cat._id, { name });
    res.status(201).json(cat);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', protect, requireRole('admin'), async (req, res) => {
  try {
    const { name, description, customFields, status } = req.body;
    const cat = await AssetCategory.findByIdAndUpdate(req.params.id,
      { name, description, customFields, status }, { new: true }
    );
    if (!cat) return res.status(404).json({ message: 'Category not found' });
    await logActivity(req.user._id, 'Updated Asset Category', 'AssetCategory', cat._id, { name });
    res.json(cat);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
