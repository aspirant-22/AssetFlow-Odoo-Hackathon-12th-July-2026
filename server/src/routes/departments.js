const express = require('express');
const Department = require('../models/Department');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const { logActivity } = require('../utils/helpers');

const router = express.Router();

router.get('/', protect, async (req, res) => {
  try {
    const depts = await Department.find({}).populate('head', 'name email').populate('parentDepartment', 'name');
    res.json(depts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const dept = await Department.findById(req.params.id).populate('head', 'name email').populate('parentDepartment', 'name');
    if (!dept) return res.status(404).json({ message: 'Department not found' });
    res.json(dept);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', protect, requireRole('admin'), async (req, res) => {
  try {
    const { name, description, head, parentDepartment } = req.body;
    const dept = await Department.create({ name, description, head, parentDepartment });
    if (head) {
      await User.findByIdAndUpdate(head, { department: dept._id, role: 'department_head' });
    }
    await logActivity(req.user._id, 'Created Department', 'Department', dept._id, { name });
    res.status(201).json(dept);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', protect, requireRole('admin'), async (req, res) => {
  try {
    const { name, description, head, parentDepartment, status } = req.body;
    const dept = await Department.findByIdAndUpdate(req.params.id,
      { name, description, head, parentDepartment, status }, { new: true }
    ).populate('head', 'name email');
    if (!dept) return res.status(404).json({ message: 'Department not found' });
    if (head) {
      await User.findByIdAndUpdate(head, { department: dept._id, role: 'department_head' });
    }
    await logActivity(req.user._id, 'Updated Department', 'Department', dept._id, { name });
    res.json(dept);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
