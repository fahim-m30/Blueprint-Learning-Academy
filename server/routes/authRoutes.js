const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { verifyToken } = require('../middleware/auth');
const { sendPasswordResetOtpEmail } = require('../utils/emailService');

/**
 * POST /api/auth/login
 * Single login for both Student and Admin
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide both Student ID/Email and password.' });
    }

    const identifier = String(email).trim();
    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { studentId: identifier },
      ],
    });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. User does not exist.' });
    }

    // Check account status
    if (user.status === 'blocked') {
      return res.status(403).json({
        success: false,
        isBlocked: true,
        message: `Your account is suspended. Reason: ${user.blockReason || 'Terms violation. Please contact administration.'}`,
      });
    }

    if (user.status === 'paused') {
      return res.status(403).json({
        success: false,
        isPaused: true,
        message: 'Your account is currently paused. Please reach out to academy administration.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid password. Please check your credentials.' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      process.env.JWT_SECRET || 'careerpath_secret_key_2026_jwt',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        studentId: user.studentId || '',
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
        status: user.status,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
});

/**
 * GET /api/auth/me
 * Fetch authenticated user profile
 */
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('enrolledCourses.course');

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching profile.' });
  }
});

/**
 * PUT /api/auth/change-password
 */
router.put('/change-password', verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
    }

    const user = await User.findById(req.user._id);
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password does not match.' });
    }

    user.password = newPassword;
    user.plainPasswordForAdmin = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error updating password.' });
  }
});

/**
 * POST /api/auth/request-reset-otp
 * Admin or student requests 6-digit OTP code sent to their email
 */
router.post('/request-reset-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide your registered email address.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with this email address.' });
    }

    // Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordOtp = otp;
    user.resetPasswordOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes validity
    await user.save();

    // Dispatch OTP email
    await sendPasswordResetOtpEmail({
      name: user.name,
      email: user.email,
      otp,
    });

    res.json({
      success: true,
      message: `A 6-digit verification code has been dispatched to ${user.email}. It is valid for 10 minutes.`,
    });
  } catch (err) {
    console.error('Request OTP Error:', err);
    res.status(500).json({ success: false, message: 'Error generating verification code.' });
  }
});

/**
 * POST /api/auth/verify-reset-otp
 * Verifies OTP and updates password
 */
router.post('/verify-reset-otp', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email, 6-digit OTP code, and new password.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      resetPasswordOtp: otp.trim(),
      resetPasswordOtpExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification code. Please request a new code.',
      });
    }

    user.password = newPassword;
    user.plainPasswordForAdmin = newPassword;
    user.resetPasswordOtp = '';
    user.resetPasswordOtpExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Your password has been changed successfully! You can now log in with your new password.',
    });
  } catch (err) {
    console.error('Verify OTP Error:', err);
    res.status(500).json({ success: false, message: 'Error resetting password.' });
  }
});

module.exports = router;
