const express = require('express');
const Booking = require('../models/Booking');
const Asset = require('../models/Asset');
const { protect } = require('../middleware/auth');
const { logActivity, createNotification } = require('../utils/helpers');

const router = express.Router();

const timeToMinutes = (t) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

const overlaps = (aStart, aEnd, bStart, bEnd) => {
  return timeToMinutes(aStart) < timeToMinutes(bEnd) && timeToMinutes(bStart) < timeToMinutes(aEnd);
};

router.get('/', protect, async (req, res) => {
  try {
    const query = {};
    if (req.query.resource) query.resource = req.query.resource;
    if (req.query.booker) query.booker = req.query.booker;
    if (req.query.status) query.status = req.query.status;
    if (req.query.date) query.date = new Date(req.query.date);
    const bookings = await Booking.find(query)
      .populate('resource', 'name assetTag location')
      .populate('booker', 'name email')
      .populate('department', 'name')
      .sort({ date: 1, startTime: 1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const { resource, date, startTime, endTime, purpose, department } = req.body;
    const asset = await Asset.findById(resource);
    if (!asset) return res.status(404).json({ message: 'Resource not found' });
    if (!asset.isBookable) return res.status(400).json({ message: 'Asset is not bookable' });
    const bookingDate = new Date(date);
    const existing = await Booking.find({
      resource,
      date: bookingDate,
      status: { $nin: ['cancelled'] }
    });
    for (const b of existing) {
      if (overlaps(startTime, endTime, b.startTime, b.endTime)) {
        return res.status(400).json({
          message: `Time slot overlaps with existing booking (${b.startTime}–${b.endTime})`
        });
      }
    }
    const booking = await Booking.create({
      resource, booker: req.user._id, date: bookingDate,
      startTime, endTime, purpose, department
    });
    await logActivity(req.user._id, 'Created Booking', 'Booking', booking._id,
      { resource: asset.name, date, startTime, endTime });
    const populated = await Booking.findById(booking._id)
      .populate('resource', 'name assetTag')
      .populate('booker', 'name email');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const { startTime, endTime, date, status, purpose } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.booker.toString() !== req.user._id.toString() && !['asset_manager', 'admin', 'department_head'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized to modify this booking' });
    }
    if (startTime && endTime && date) {
      const existing = await Booking.find({
        resource: booking.resource,
        date: new Date(date),
        _id: { $ne: req.params.id },
        status: { $nin: ['cancelled'] }
      });
      for (const b of existing) {
        if (overlaps(startTime, endTime, b.startTime, b.endTime)) {
          return res.status(400).json({
            message: `Time slot overlaps with existing booking (${b.startTime}–${b.endTime})`
          });
        }
      }
      booking.startTime = startTime;
      booking.endTime = endTime;
      booking.date = new Date(date);
    }
    if (status) booking.status = status;
    if (purpose) booking.purpose = purpose;
    await booking.save();
    if (status === 'cancelled') {
      await createNotification(booking.booker, 'Booking Cancelled',
        `Your booking for ${booking.date.toDateString()} ${booking.startTime}–${booking.endTime} has been cancelled.`,
        'booking_cancelled');
    }
    await logActivity(req.user._id, 'Updated Booking', 'Booking', booking._id, { status });
    const populated = await Booking.findById(booking._id)
      .populate('resource', 'name assetTag')
      .populate('booker', 'name email');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
