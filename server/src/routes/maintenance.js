const express = require('express');
const MaintenanceRequest = require('../models/MaintenanceRequest');
const Asset = require('../models/Asset');
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const { logActivity, createNotification } = require('../utils/helpers');

const router = express.Router();

router.get('/', protect, async (req, res) => {
  try {
    const query = {};
    if (req.query.status) query.status = req.query.status;
    if (req.query.asset) query.asset = req.query.asset;
    if (req.query.requestedBy) query.requestedBy = req.query.requestedBy;
    const requests = await MaintenanceRequest.find(query)
      .populate('asset', 'name assetTag serialNumber')
      .populate('requestedBy', 'name email')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const { asset, description, priority, photo } = req.body;
    const assetDoc = await Asset.findById(asset);
    if (!assetDoc) return res.status(404).json({ message: 'Asset not found' });
    const request = await MaintenanceRequest.create({
      asset, requestedBy: req.user._id, description, priority, photo
    });
    await logActivity(req.user._id, 'Raised Maintenance Request', 'MaintenanceRequest', request._id,
      { asset: assetDoc.name, priority });
    const populated = await MaintenanceRequest.findById(request._id)
      .populate('asset', 'name assetTag')
      .populate('requestedBy', 'name email');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', protect, requireRole('asset_manager', 'admin'), async (req, res) => {
  try {
    const { status, technician, resolutionNotes } = req.body;
    const request = await MaintenanceRequest.findById(req.params.id).populate('asset').populate('requestedBy');
    if (!request) return res.status(404).json({ message: 'Maintenance request not found' });
    if (status === 'approved' || status === 'rejected') {
      request.status = status;
      request.approvedBy = req.user._id;
      request.approvedAt = new Date();
      if (status === 'approved') {
        const asset = await Asset.findById(request.asset._id);
        asset.status = 'under_maintenance';
        await asset.save();
        await createNotification(request.requestedBy._id, 'Maintenance Approved',
          `Maintenance request for ${request.asset.name} has been approved.`, 'maintenance_approved',
          { kind: 'MaintenanceRequest', id: request._id });
      } else {
        await createNotification(request.requestedBy._id, 'Maintenance Rejected',
          `Maintenance request for ${request.asset.name} has been rejected.`, 'maintenance_rejected',
          { kind: 'MaintenanceRequest', id: request._id });
      }
    } else if (status === 'technician_assigned') {
      request.status = status;
      request.technician = technician || '';
    } else if (status === 'in_progress') {
      request.status = status;
    } else if (status === 'resolved') {
      request.status = status;
      request.resolutionNotes = resolutionNotes || '';
      request.resolvedAt = new Date();
      const asset = await Asset.findById(request.asset._id);
      asset.status = 'available';
      await asset.save();
      await createNotification(request.requestedBy._id, 'Maintenance Resolved',
        `Maintenance for ${request.asset.name} has been resolved.`, 'general',
        { kind: 'MaintenanceRequest', id: request._id });
    }
    await request.save();
    await logActivity(req.user._id, `${status} Maintenance Request`, 'MaintenanceRequest', request._id);
    const populated = await MaintenanceRequest.findById(request._id)
      .populate('asset', 'name assetTag')
      .populate('requestedBy', 'name email')
      .populate('approvedBy', 'name');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
