const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const SiteSettings = require('../models/SiteSettings');

/**
 * GET /api/public/settings
 * Public site configuration and dynamic contact info
 */
router.get('/settings', async (req, res) => {
  try {
    let settings = await SiteSettings.findOne();
    if (!settings) {
      settings = await SiteSettings.create({});
    }
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error retrieving site settings.' });
  }
});

/**
 * GET /api/public/courses
 * List of all active courses for homepage and catalog
 */
router.get('/courses', async (req, res) => {
  try {
    const courses = await Course.find({ isActive: true })
      .select('-videos -tasks')
      .sort({ createdAt: 1 });

    res.json({ success: true, courses });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error retrieving courses.' });
  }
});

/**
 * GET /api/public/courses/:idOrSlug
 * Single course details with full syllabus
 */
router.get('/courses/:idOrSlug', async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    let query = { slug: idOrSlug };
    if (idOrSlug.match(/^[0-9a-fA-F]{24}$/)) {
      query = { $or: [{ _id: idOrSlug }, { slug: idOrSlug }] };
    }

    const course = await Course.findOne(query).select('-tasks');
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    res.json({ success: true, course });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching course details.' });
  }
});

/**
 * POST /api/public/enroll
 * Submit enrollment application with payment transaction ID
 */
router.post('/enroll', async (req, res) => {
  try {
    const {
      studentName,
      studentEmail,
      studentPhone,
      studentAddress,
      courseId,
      paymentMethod,
      senderNumber,
      transactionId,
      notes,
    } = req.body;

    if (!studentName || !studentEmail || !studentPhone || !courseId || !transactionId || !senderNumber) {
      return res.status(400).json({
        success: false,
        message: 'Please provide full name, email, mobile number, course, sender number, and transaction ID.',
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Selected course not found.' });
    }

    // Check if duplicate pending transaction ID exists
    const existingEnrollment = await Enrollment.findOne({
      transactionId: transactionId.trim().toUpperCase(),
    });
    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        message: 'This Transaction ID has already been submitted. Please check or message on WhatsApp for assistance.',
      });
    }

    const enrollment = await Enrollment.create({
      studentName: studentName.trim(),
      studentEmail: studentEmail.trim().toLowerCase(),
      studentPhone: studentPhone.trim(),
      studentAddress: studentAddress ? studentAddress.trim() : '',
      course: course._id,
      courseTitle: course.title,
      amount: course.price,
      paymentMethod: paymentMethod || 'bKash',
      senderNumber: senderNumber.trim(),
      transactionId: transactionId.trim().toUpperCase(),
      notes: notes || '',
      status: 'pending',
    });

    res.status(201).json({
      success: true,
      message: 'Your enrollment application and payment proof have been submitted successfully. Admin will verify and send your login credentials via email.',
      enrollmentId: enrollment._id,
    });
  } catch (err) {
    console.error('Enrollment submission error:', err);
    res.status(500).json({ success: false, message: 'Error processing enrollment.' });
  }
});

module.exports = router;
