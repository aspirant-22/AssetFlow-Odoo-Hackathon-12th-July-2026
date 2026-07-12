const express = require('express');
const Asset = require('../models/Asset');
const Allocation = require('../models/Allocation');
const TransferRequest = require('../models/TransferRequest');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const { logActivity, createNotification } = require('../utils/helpers');

const router = express.Router();

router.get('/', protect, async (req, res) => {
  try {
    const query = {};
    if (req.query.employee) query.employee = req.query.employee;
    if (req.query.status) query.status = req.query.status;
    if (req.query.asset) query.asset = req.query.asset;
    const allocations = await Allocation.find(query)
      .populate('asset', 'name assetTag serialNumber')
      .populate('employee', 'name email')
      .populate('department', 'name')
      .populate('allocatedBy', 'name')
      .sort({ createdAt: -1 });
    res.json(allocations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', protect, requireRole('asset_manager', 'department_head', 'admin'), async (req, res) => {
  try {
    const { asset: assetId, employee, department, expectedReturnDate, notes } = req.body;
    const asset = await Asset.findById(assetId);
    if (!asset) return res.status(404).json({ message: 'Asset not found' });
    if (asset.status !== 'available') {
      const currentAllocation = await Allocation.findOne({ asset: assetId, status: 'active' }).populate('employee', 'name');
      const holderName = currentAllocation ? currentAllocation.employee.name : 'unknown';
      return res.status(400).json({
        message: `Asset is currently ${asset.status} and held by ${holderName}. Submit a transfer request instead.`,
        currentHolder: currentAllocation?.employee,
        transferRequired: true
      });
    }
    const allocation = await Allocation.create({
      asset: assetId, employee, department, allocatedBy: req.user._id,
      expectedReturnDate, notes
    });
    asset.status = 'allocated';
    asset.currentHolder = employee;
    asset.department = department || null;
    await asset.save();
    await logActivity(req.user._id, 'Allocated Asset', 'Allocation', allocation._id,
      { asset: asset.name, employee });
    await createNotification(employee, 'Asset Assigned', `Asset ${asset.name} (${asset.assetTag}) has been assigned to you.`, 'asset_assigned', { kind: 'Asset', id: asset._id });
    const populated = await Allocation.findById(allocation._id)
      .populate('asset', 'name assetTag')
      .populate('employee', 'name email');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id/return', protect, requireRole('asset_manager', 'admin'), async (req, res) => {
  try {
    const { conditionCheckIn } = req.body;
    const allocation = await Allocation.findById(req.params.id).populate('asset');
    if (!allocation) return res.status(404).json({ message: 'Allocation not found' });
    allocation.status = 'returned';
    allocation.returnedDate = new Date();
    allocation.conditionCheckIn = conditionCheckIn || '';
    await allocation.save();
    const asset = await Asset.findById(allocation.asset._id);
    asset.status = 'available';
    asset.currentHolder = null;
    await asset.save();
    await logActivity(req.user._id, 'Returned Asset', 'Allocation', allocation._id,
      { asset: asset.name, condition: conditionCheckIn });
    res.json(allocation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/overdue', protect, async (req, res) => {
  try {
    const now = new Date();
    const allocations = await Allocation.find({
      status: 'active',
      expectedReturnDate: { $lt: now }
    }).populate('asset', 'name assetTag').populate('employee', 'name email');
    res.json(allocations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/transfer-requests', protect, async (req, res) => {
  try {
    const query = {};
    if (req.query.status) query.status = req.query.status;
    const requests = await TransferRequest.find(query)
      .populate('asset', 'name assetTag')
      .populate('fromEmployee', 'name email')
      .populate('toEmployee', 'name email')
      .populate('requestedBy', 'name')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/transfer-requests', protect, requireRole('employee'), async (req, res) => {
  try {
    const { asset, fromEmployee, notes } = req.body;
    const transferReq = await TransferRequest.create({
      asset, fromEmployee, toEmployee: null, requestedBy: req.user._id, notes
    });
    await logActivity(req.user._id, 'Created Transfer Request', 'TransferRequest', transferReq._id);
    res.status(201).json(transferReq);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/transfer-requests/:id', protect, requireRole('asset_manager', 'department_head', 'admin'), async (req, res) => {
  try {
    const { status, toEmployee } = req.body;
    const transferReq = await TransferRequest.findById(req.params.id)
      .populate('asset').populate('fromEmployee').populate('toEmployee');
    if (!transferReq) return res.status(404).json({ message: 'Transfer request not found' });
    if (status === 'approved') {
      transferReq.status = 'approved';
      transferReq.approvedBy = req.user._id;
      const targetId = toEmployee || transferReq.toEmployee?._id;
      if (targetId) {
        transferReq.toEmployee = targetId;
        const asset = await Asset.findById(transferReq.asset._id);
        asset.currentHolder = targetId;
        await asset.save();
        await Allocation.create({
          asset: transferReq.asset._id,
          employee: targetId,
          allocatedBy: req.user._id,
          notes: `Transfer from ${transferReq.fromEmployee.name}`
        });
        const targetUser = await User.findById(targetId);
      }
      const oldAlloc = await Allocation.findOne({
        asset: transferReq.asset._id, employee: transferReq.fromEmployee._id, status: 'active'
      });
      if (oldAlloc) {
        oldAlloc.status = 'returned';
        oldAlloc.returnedDate = new Date();
        await oldAlloc.save();
      }
      if (!targetId) {
        const asset = await Asset.findById(transferReq.asset._id);
        asset.status = 'available';
        asset.currentHolder = null;
        await asset.save();
      }
    } else if (status === 'rejected') {
      transferReq.status = 'rejected';
      transferReq.approvedBy = req.user._id;
    } else if (status === 'completed') {
      transferReq.status = 'completed';
    }
    await transferReq.save();
    await logActivity(req.user._id, `${status.charAt(0).toUpperCase() + status.slice(1)} Transfer Request`, 'TransferRequest', transferReq._id);
    res.json(transferReq);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
