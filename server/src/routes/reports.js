const express = require('express');
const Asset = require('../models/Asset');
const Allocation = require('../models/Allocation');
const MaintenanceRequest = require('../models/MaintenanceRequest');
const Booking = require('../models/Booking');
const Department = require('../models/Department');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/dashboard', protect, async (req, res) => {
  try {
    const totalAssets = await Asset.countDocuments();
    const availableAssets = await Asset.countDocuments({ status: 'available' });
    const allocatedAssets = await Asset.countDocuments({ status: 'allocated' });
    const maintenanceAssets = await Asset.countDocuments({ status: 'under_maintenance' });
    const lostAssets = await Asset.countDocuments({ status: 'lost' });
    const retiredAssets = await Asset.countDocuments({ status: { $in: ['retired', 'disposed'] } });
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const maintenanceToday = await MaintenanceRequest.countDocuments({
      createdAt: { $gte: today, $lt: tomorrow }
    });
    const activeBookings = await Booking.countDocuments({
      status: { $in: ['upcoming', 'ongoing'] },
      date: { $gte: today }
    });
    const pendingTransfers = await MaintenanceRequest.countDocuments({ status: 'pending' });
    const overdueAllocations = await Allocation.countDocuments({
      status: 'active',
      expectedReturnDate: { $lt: new Date(), $ne: null }
    });
    const upcomingReturns = await Allocation.countDocuments({
      status: 'active',
      expectedReturnDate: { $gte: new Date(), $ne: null }
    });
    const departmentCount = await Department.countDocuments({ status: 'active' });
    const categoryDistribution = await Asset.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $lookup: { from: 'assetcategories', localField: '_id', foreignField: '_id', as: 'cat' } },
      { $unwind: { path: '$cat', preserveNullAndEmptyArrays: true } },
      { $project: { name: '$cat.name', count: 1 } }
    ]);
    const statusDistribution = await Asset.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const pendingMaintenance = await MaintenanceRequest.countDocuments({ status: 'pending' });
    res.json({
      totalAssets, availableAssets, allocatedAssets, maintenanceAssets, lostAssets, retiredAssets,
      maintenanceToday, activeBookings, pendingTransfers, overdueAllocations, upcomingReturns,
      departmentCount, categoryDistribution, statusDistribution, pendingMaintenance
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/utilization', protect, async (req, res) => {
  try {
    const allocations = await Allocation.aggregate([
      { $group: { _id: '$asset', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
      { $lookup: { from: 'assets', localField: '_id', foreignField: '_id', as: 'asset' } },
      { $unwind: '$asset' },
      { $project: { name: '$asset.name', assetTag: '$asset.assetTag', allocations: '$count' } }
    ]);
    const idleAssets = await Asset.countDocuments({
      status: 'available',
      isBookable: false
    });
    res.json({ mostUsed: allocations, idleAssets });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/maintenance-frequency', protect, async (req, res) => {
  try {
    const freq = await MaintenanceRequest.aggregate([
      { $group: { _id: '$asset', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
      { $lookup: { from: 'assets', localField: '_id', foreignField: '_id', as: 'asset' } },
      { $unwind: '$asset' },
      { $lookup: { from: 'assetcategories', localField: 'asset.category', foreignField: '_id', as: 'cat' } },
      { $unwind: { path: '$cat', preserveNullAndEmptyArrays: true } },
      { $project: { name: '$asset.name', assetTag: '$asset.assetTag', category: '$cat.name', count: 1 } }
    ]);
    const categoryFreq = await MaintenanceRequest.aggregate([
      { $lookup: { from: 'assets', localField: 'asset', foreignField: '_id', as: 'asset' } },
      { $unwind: '$asset' },
      { $group: { _id: '$asset.category', count: { $sum: 1 } } },
      { $lookup: { from: 'assetcategories', localField: '_id', foreignField: '_id', as: 'cat' } },
      { $unwind: { path: '$cat', preserveNullAndEmptyArrays: true } },
      { $project: { name: '$cat.name', count: 1 } }
    ]);
    res.json({ byAsset: freq, byCategory: categoryFreq });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/department-summary', protect, async (req, res) => {
  try {
    const summary = await Asset.aggregate([
      { $match: { department: { $ne: null } } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'dept' } },
      { $unwind: '$dept' },
      { $project: { name: '$dept.name', assetCount: '$count' } }
    ]);
    res.json(summary);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/booking-heatmap', protect, async (req, res) => {
  try {
    const heatmap = await Booking.aggregate([
      { $match: { status: { $nin: ['cancelled'] } } },
      { $group: { _id: { hour: { $substr: ['$startTime', 0, 2] } }, count: { $sum: 1 } } },
      { $sort: { '_id.hour': 1 } }
    ]);
    res.json(heatmap);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
