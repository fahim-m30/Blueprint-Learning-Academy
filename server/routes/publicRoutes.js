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
    } else {
      // Auto-fill default fields if any are missing on existing records
      const defaults = {
        instructorName: 'Engr. Md Abdul Mazid',
        instructorDegree: 'B.Sc. in Civil Engineering (BUET)',
        instructorExp: '10+ Years On Real Projects in Bangladesh',
        instructorShortExp: '10+ Yrs Exp',
        instructorImage: '/instructor.jpg?v=2',
        instructorBio: 'Engr. Md Abdul Mazid is a practicing civil engineer and BUET graduate with over a decade of hands-on experience leading residential, commercial, and high-rise developer construction projects in Dhaka. He founded Blueprint Learning Academy to bridge the massive gap between academic university textbooks and what Bangladeshi developer companies and site consultants actually demand.',
        feature1Title: 'Real Developer Drawings',
        feature1Desc: 'Learn using actual architectural, structural, and MEP drawings approved by RAJUK and CDA.',
        feature2Title: 'Live Site Situations',
        feature2Desc: 'Master casting SOPs, rebar BBS optimization, defect prevention, and subcontractor measurement bills.',
        statsCourses: '6+',
        statsExperience: '10+ Yrs',
        statsMentorTag: 'BUET',
        heroBadgeText: "Bangladesh's #1 Practical Civil Engineering Academy",
      };
      let needsSave = false;
      for (const [key, val] of Object.entries(defaults)) {
        if (!settings[key]) {
          settings[key] = val;
          needsSave = true;
        }
      }
      if (needsSave) {
        await settings.save();
      }
    }
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=120, stale-while-revalidate=300');
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

    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=120, stale-while-revalidate=300');
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

    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=120, stale-while-revalidate=300');
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

/**
 * GET /api/public/notices
 * Fetch all notices across courses for the Academy Notice Board
 */
router.get('/notices', async (req, res) => {
  try {
    const courses = await Course.find({ isActive: true })
      .select('title slug batchStartDate batchSchedule notices createdAt')
      .lean();

    const allNotices = [];
    courses.forEach((c) => {
      if (c.notices && c.notices.length > 0) {
        c.notices.forEach((n) => {
          allNotices.push({
            ...n,
            courseId: c._id,
            courseTitle: c.title,
            courseSlug: c.slug,
          });
        });
      }

      // If course has batchStartDate, ensure a batch announcement exists
      if (c.batchStartDate && (!c.notices || !c.notices.some((n) => n.category === 'batch_start'))) {
        allNotices.push({
          _id: `auto-batch-${c._id}`,
          title: `New Batch Enrollment Open - Class Starts ${c.batchStartDate}`,
          content: `Official live orientation and regular classes will start from ${c.batchStartDate}. Weekly schedule: ${c.batchSchedule || 'Fri & Sat 8:30 PM'}. Limited seats available per batch.`,
          category: 'batch_start',
          date: c.batchStartDate,
          isPinned: true,
          createdAt: c.createdAt || new Date(),
          courseId: c._id,
          courseTitle: c.title,
          courseSlug: c.slug,
        });
      }
    });

    allNotices.sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    res.json({ success: true, notices: allNotices });
  } catch (err) {
    console.error('Fetch notices error:', err);
    res.status(500).json({ success: false, message: 'Error fetching notices.' });
  }
});

module.exports = router;
