const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { logActivity } = require('../utils/helpers');
const { sendEmail } = require('../utils/mailer');

const router = express.Router();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
};

router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });
    const user = await User.create({ name, email, password });
    await logActivity(user._id, 'Account Created', 'User', user._id, { email });
    res.status(201).json({
      _id: user._id, name: user.name, email: user.email, role: user.role,
      token: generateToken(user._id)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).populate('department');
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });
    if (user.status === 'inactive') return res.status(401).json({ message: 'Account is deactivated' });
    const match = await user.matchPassword(password);
    if (!match) return res.status(401).json({ message: 'Invalid email or password' });
    await logActivity(user._id, 'Logged In', 'User', user._id);
    res.json({
      _id: user._id, name: user.name, email: user.email, role: user.role,
      department: user.department, status: user.status,
      token: generateToken(user._id)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/me', protect, async (req, res) => {
  res.json(req.user);
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '15m' });
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const resetLink = `${clientUrl}/reset-password/${resetToken}`;
    await sendEmail({
      to: user.email,
      subject: 'AssetFlow - Password Reset Request',
      html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
        <h2 style="color:#1a73e8;">AssetFlow</h2>
        <p>Hi <strong>${user.name}</strong>,</p>
        <p>Click the button below to reset your password. This link expires in 15 minutes.</p>
        <a href="${resetLink}" style="display:inline-block;padding:12px 24px;background:#1a73e8;color:#fff;text-decoration:none;border-radius:6px;margin:16px 0;">Reset Password</a>
        <p style="color:#888;font-size:13px;">If you didn't request this, you can ignore this email.</p>
        <hr style="border:none;border-top:1px solid #eee;"/>
        <p style="color:#aaa;font-size:12px;">AssetFlow - Enterprise Asset Management</p>
      </div>`
    });
    res.json({ message: 'Password reset link sent to your email' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: 'Invalid token' });
    user.password = password;
    await user.save();
    res.json({ message: 'Password reset successful' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
