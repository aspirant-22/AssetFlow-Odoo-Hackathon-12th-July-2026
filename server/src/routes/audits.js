const express = require('express');
const AuditCycle = require('../models/AuditCycle');
const AuditItem = require('../models/AuditItem');
const Asset = require('../models/Asset');
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const { logActivity, createNotification } = require('../utils/helpers');

const router = express.Router();

router.get('/', protect, async (req, res) => {
  try {
    const cycles = await AuditCycle.find({})
      .populate('department', 'name')
      .populate('auditors', 'name email')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    res.json(cycles);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const cycle = await AuditCycle.findById(req.params.id)
      .populate('department', 'name')
      .populate('auditors', 'name email')
      .populate('createdBy', 'name');
    if (!cycle) return res.status(404).json({ message: 'Audit cycle not found' });
    const items = await AuditItem.find({ auditCycle: cycle._id })
      .populate('asset', 'name assetTag serialNumber location')
      .populate('verifiedBy', 'name');
    res.json({ cycle, items });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', protect, requireRole('admin'), async (req, res) => {
  try {
    const { name, department, location, startDate, endDate, auditors } = req.body;
    const cycle = await AuditCycle.create({
      name, department, location, startDate, endDate, auditors, createdBy: req.user._id
    });
    const query = {};
    if (department) query.department = department;
    if (location) query.location = { $regex: location, $options: 'i' };
    const assets = await Asset.find(query);
    const auditItems = assets.map(a => ({ auditCycle: cycle._id, asset: a._id }));
    if (auditItems.length > 0) {
      await AuditItem.insertMany(auditItems);
    }
    await logActivity(req.user._id, 'Created Audit Cycle', 'AuditCycle', cycle._id, { name, assetCount: assets.length });
    if (auditors && auditors.length > 0) {
      for (const auditorId of auditors) {
        await createNotification(auditorId, 'Audit Assigned',
          `You have been assigned as auditor for cycle: ${name}`, 'general',
          { kind: 'AuditCycle', id: cycle._id });
      }
    }
    res.status(201).json(cycle);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id/status', protect, requireRole('admin'), async (req, res) => {
  try {
    const { status } = req.body;
    const cycle = await AuditCycle.findById(req.params.id);
    if (!cycle) return res.status(404).json({ message: 'Audit cycle not found' });
    if (status === 'in_progress') {
      cycle.status = 'in_progress';
    } else if (status === 'closed') {
      cycle.status = 'closed';
      cycle.closedAt = new Date();
      const items = await AuditItem.find({ auditCycle: cycle._id }).populate('asset');
      const discrepancies = items.filter(i => i.status === 'missing' || i.status === 'damaged');
      for (const item of discrepancies) {
        if (item.status === 'missing') {
          await Asset.findByIdAndUpdate(item.asset._id, { status: 'lost' });
        }
      }
      if (discrepancies.length > 0) {
        for (const auditor of cycle.auditors) {
          await createNotification(auditor, 'Audit Discrepancies',
            `Audit cycle "${cycle.name}" closed with ${discrepancies.length} discrepancy(ies).`,
            'audit_discrepancy', { kind: 'AuditCycle', id: cycle._id });
        }
      }
    }
    await cycle.save();
    await logActivity(req.user._id, `${status} Audit Cycle`, 'AuditCycle', cycle._id);
    res.json(cycle);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/items/:itemId', protect, async (req, res) => {
  try {
    const { status, notes } = req.body;
    const item = await AuditItem.findById(req.params.itemId).populate('auditCycle');
    if (!item) return res.status(404).json({ message: 'Audit item not found' });
    if (item.auditCycle.status === 'closed') {
      return res.status(400).json({ message: 'Audit cycle is closed' });
    }
    const auditorIds = item.auditCycle.auditors.map(a => a.toString());
    if (!auditorIds.includes(req.user._id.toString()) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only assigned auditors can verify items' });
    }
    item.status = status;
    item.notes = notes || '';
    item.verifiedBy = req.user._id;
    item.verifiedAt = new Date();
    await item.save();
    await logActivity(req.user._id, `Verified Asset as ${status}`, 'AuditItem', item._id,
      { asset: item.asset, status });
    const populated = await AuditItem.findById(item._id)
      .populate('asset', 'name assetTag')
      .populate('verifiedBy', 'name');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id/discrepancy-report', protect, async (req, res) => {
  try {
    const items = await AuditItem.find({
      auditCycle: req.params.id,
      status: { $in: ['missing', 'damaged'] }
    }).populate('asset', 'name assetTag serialNumber location')
      .populate('verifiedBy', 'name');
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
