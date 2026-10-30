const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');
const TaskSubmission = require('../models/TaskSubmission');
const ChatMessage = require('../models/ChatMessage');
const SiteSettings = require('../models/SiteSettings');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const { sendEnrollmentApprovedEmail, sendAccountBlockedEmail } = require('../utils/emailService');
const { cleanExpiredCoursesNow } = require('../services/cronService');

// All admin routes require valid admin token
router.use(verifyToken, requireAdmin);

/**
 * Helper to generate random readable password
 */
const generatePassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let pass = 'CP-';
  for (let i = 0; i < 6; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
};

/**
 * GET /api/admin/overview
 * Top-level stats for admin dashboard
 */
router.get('/overview', async (req, res) => {
  try {
    const totalCourses = await Course.countDocuments();
    const totalStudents = await User.countDocuments({ role: 'student' });
    const pendingEnrollments = await Enrollment.countDocuments({ status: 'pending' });
    const approvedEnrollments = await Enrollment.countDocuments({ status: 'approved' });

    // Calculate total revenue from approved enrollments
    const revenueAgg = await Enrollment.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalRevenue = revenueAgg.length > 0 ? revenueAgg[0].total : 0;

    // Student count per course
    const courses = await Course.find().select('title slug price durationDays totalClasses isActive createdAt');
    const coursesWithStudentCount = await Promise.all(
      courses.map(async (c) => {
        const studentCount = await User.countDocuments({
          'enrolledCourses.course': c._id,
        });
        const pendingCount = await Enrollment.countDocuments({
          course: c._id,
          status: 'pending',
        });
        return {
          _id: c._id,
          title: c.title,
          slug: c.slug,
          price: c.price,
          durationDays: c.durationDays,
          totalClasses: c.totalClasses,
          isActive: c.isActive,
          studentCount,
          pendingCount,
        };
      })
    );

    res.json({
      success: true,
      stats: {
        totalCourses,
        totalStudents,
        pendingEnrollments,
        approvedEnrollments,
        totalRevenue,
      },
      courses: coursesWithStudentCount,
    });
  } catch (err) {
    console.error('Admin overview error:', err);
    res.status(500).json({ success: false, message: 'Error retrieving overview data.' });
  }
});

/**
 * GET /api/admin/enrollments
 * List all enrollments with optional filter (pending/approved/rejected)
 */
router.get('/enrollments', async (req, res) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};
    const enrollments = await Enrollment.find(query)
      .populate('course', 'title price')
      .sort({ createdAt: -1 });

    res.json({ success: true, enrollments });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching enrollments.' });
  }
});

/**
 * POST /api/admin/enrollments/:id/approve
 * Confirm transaction ID -> Auto generate credentials -> Dispatch professional email
 */
router.post('/enrollments/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const enrollment = await Enrollment.findById(id).populate('course');

    if (!enrollment) {
      return res.status(404).json({ success: false, message: 'Enrollment record not found.' });
    }

    if (enrollment.status === 'approved') {
      return res.status(400).json({ success: false, message: 'This enrollment is already approved.' });
    }

    const course = enrollment.course;
    if (!course) {
      return res.status(400).json({ success: false, message: 'Associated course does not exist.' });
    }

    // 1. Check if user already exists with this email
    let user = await User.findOne({ email: enrollment.studentEmail });
    let rawPassword = '';

    const durationDays = course.durationDays || 30;
    const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

    if (user) {
      // Existing user: retain their password or reset if requested
      rawPassword = user.plainPasswordForAdmin || 'Use existing password';

      // Check if already in enrolledCourses
      const alreadyEnrolled = user.enrolledCourses.some(
        (e) => e.course.toString() === course._id.toString()
      );

      if (!alreadyEnrolled) {
        user.enrolledCourses.push({
          course: course._id,
          enrolledAt: new Date(),
          expiresAt: expiresAt,
          status: 'active',
        });
      }
      user.status = 'active'; // ensure active
      await user.save();
    } else {
      // New user: generate random password
      rawPassword = generatePassword();
      user = await User.create({
        name: enrollment.studentName,
        email: enrollment.studentEmail,
        phone: enrollment.studentPhone,
        address: enrollment.studentAddress || '',
        password: rawPassword, // will be hashed by pre-save
        plainPasswordForAdmin: rawPassword, // stored for admin viewing as requested
        role: 'student',
        status: 'active',
        enrolledCourses: [
          {
            course: course._id,
            enrolledAt: new Date(),
            expiresAt: expiresAt,
            status: 'active',
          },
        ],
      });
    }

    // Update enrollment status
    enrollment.status = 'approved';
    enrollment.generatedPassword = rawPassword;
    enrollment.approvedAt = new Date();
    await enrollment.save();

    // Send professional email to the student
    const loginUrl = process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/login` : 'http://localhost:3000/login';
    await sendEnrollmentApprovedEmail({
      studentName: enrollment.studentName,
      studentEmail: enrollment.studentEmail,
      courseTitle: course.title,
      generatedPassword: rawPassword,
      loginUrl,
      whatsappGroupLink: course.whatsappGroupLink,
    });

    res.json({
      success: true,
      message: `Enrollment confirmed! Credentials generated and email sent to ${enrollment.studentEmail}.`,
      credentials: {
        email: enrollment.studentEmail,
        password: rawPassword,
      },
      enrollment,
    });
  } catch (err) {
    console.error('Approval error:', err);
    res.status(500).json({ success: false, message: 'Error approving enrollment.' });
  }
});

/**
 * POST /api/admin/enrollments/:id/reject
 */
router.post('/enrollments/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const enrollment = await Enrollment.findById(id);
    if (!enrollment) {
      return res.status(404).json({ success: false, message: 'Enrollment not found.' });
    }

    enrollment.status = 'rejected';
    enrollment.notes = notes || 'Transaction ID not verified or payment mismatched.';
    await enrollment.save();

    res.json({ success: true, message: 'Enrollment marked as rejected.', enrollment });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error rejecting enrollment.' });
  }
});

/**
 * GET /api/admin/courses
 * List all courses with full details
 */
router.get('/courses', async (req, res) => {
  try {
    const courses = await Course.find().sort({ createdAt: -1 });
    res.json({ success: true, courses });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error retrieving courses.' });
  }
});

/**
 * POST /api/admin/courses
 * Create a new course
 */
router.post('/courses', async (req, res) => {
  try {
    const {
      title,
      category,
      shortDescription,
      fullDescription,
      durationDays,
      totalClasses,
      price,
      regularPrice,
      whatsappGroupLink,
      instructor,
      syllabus,
    } = req.body;

    if (!title || !shortDescription || !fullDescription || !price) {
      return res.status(400).json({ success: false, message: 'Please provide course title, description, and price.' });
    }

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') + '-' + Math.floor(Math.random() * 1000);

    const expiresAt = new Date(Date.now() + (Number(durationDays) || 30) * 24 * 60 * 60 * 1000);

    const newCourse = await Course.create({
      title,
      slug,
      category: category || 'Civil Engineering & Real Estate',
      shortDescription,
      fullDescription,
      durationDays: Number(durationDays) || 30,
      totalClasses: Number(totalClasses) || 8,
      price: Number(price),
      regularPrice: Number(regularPrice) || Number(price) * 2,
      whatsappGroupLink: whatsappGroupLink || 'https://chat.whatsapp.com/sample',
      instructor: instructor || {
        name: 'Engr. Md Abdul Mazid',
        designation: 'Senior Civil Engineer (BUET)',
      },
      syllabus: syllabus || [],
      expiresAt,
    });

    res.status(201).json({ success: true, message: 'Course created successfully.', course: newCourse });
  } catch (err) {
    console.error('Create course error:', err);
    res.status(500).json({ success: false, message: 'Error creating course.' });
  }
});

/**
 * GET /api/admin/courses/:id
 * Get course with enrolled students and submissions
 */
router.get('/courses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    // Get all students enrolled in this course, WITH credentials visible to admin
    const students = await User.find({
      'enrolledCourses.course': course._id,
    }).select('name email phone address plainPasswordForAdmin status blockReason enrolledCourses createdAt');

    // Get all task submissions for this course
    const taskSubmissions = await TaskSubmission.find({ course: course._id }).sort({ submittedAt: -1 });

    res.json({
      success: true,
      course,
      students,
      taskSubmissions,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching course details.' });
  }
});

/**
 * POST /api/admin/courses/:id/students
 * Admin manually adds a student directly to this course
 */
router.post('/courses/:id/students', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, password, address } = req.body;

    if (!name || !email || !phone) {
      return res.status(400).json({ success: false, message: 'Student name, email, and phone number are required.' });
    }

    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    const durationDays = course.durationDays || 30;
    const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

    let rawPassword = password && password.trim() ? password.trim() : generatePassword();
    let user = await User.findOne({ email: email.trim().toLowerCase() });

    if (user) {
      // Check if already in enrolledCourses
      const alreadyEnrolled = user.enrolledCourses.some(
        (e) => e.course.toString() === course._id.toString()
      );

      if (alreadyEnrolled) {
        return res.status(400).json({ success: false, message: 'This student is already enrolled in this course.' });
      }

      user.enrolledCourses.push({
        course: course._id,
        enrolledAt: new Date(),
        expiresAt: expiresAt,
        status: 'active',
      });
      user.status = 'active';
      if (password && password.trim()) {
        user.password = password.trim();
        user.plainPasswordForAdmin = password.trim();
        rawPassword = password.trim();
      } else {
        rawPassword = user.plainPasswordForAdmin || 'Use existing account password';
      }
      await user.save();
    } else {
      user = await User.create({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        address: address ? address.trim() : '',
        password: rawPassword,
        plainPasswordForAdmin: rawPassword,
        role: 'student',
        status: 'active',
        enrolledCourses: [
          {
            course: course._id,
            enrolledAt: new Date(),
            expiresAt: expiresAt,
            status: 'active',
          },
        ],
      });
    }

    // Create an approved enrollment record for accounting and records
    await Enrollment.create({
      studentName: name.trim(),
      studentEmail: email.trim().toLowerCase(),
      studentPhone: phone.trim(),
      studentAddress: address ? address.trim() : '',
      course: course._id,
      paymentMethod: 'Manual (Admin Added)',
      senderNumber: phone.trim(),
      transactionId: 'ADM-' + Date.now().toString(36).toUpperCase(),
      amount: course.price || 0,
      status: 'approved',
      generatedPassword: rawPassword,
      approvedAt: new Date(),
      notes: 'Directly registered by administrator',
    });

    // Send email notification to the student (wrapped in try/catch so it doesn't block if email not configured)
    try {
      const loginUrl = process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/login` : 'http://localhost:3000/login';
      await sendEnrollmentApprovedEmail({
        studentName: user.name,
        studentEmail: user.email,
        courseTitle: course.title,
        generatedPassword: rawPassword,
        loginUrl,
        whatsappGroupLink: course.whatsappGroupLink,
      });
    } catch (mailErr) {
      console.warn('Manual student email dispatch warning:', mailErr.message);
    }

    res.status(201).json({
      success: true,
      message: `Student "${user.name}" successfully enrolled in ${course.title}! Password: ${rawPassword}`,
      student: user,
      rawPassword,
    });
  } catch (err) {
    console.error('Add student error:', err);
    res.status(500).json({ success: false, message: 'Error manually adding student to course.' });
  }
});

/**
 * PUT /api/admin/courses/:id
 * Update course details
 */
router.put('/courses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Course.findByIdAndUpdate(id, req.body, { new: true });
    res.json({ success: true, message: 'Course updated successfully.', course: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error updating course.' });
  }
});

/**
 * DELETE /api/admin/courses/:id
 * Permanently delete a course and its related data
 */
router.delete('/courses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Enrollment.deleteMany({ course: id });
    await TaskSubmission.deleteMany({ course: id });
    await ChatMessage.deleteMany({ course: id });
    await User.updateMany({}, { $pull: { enrolledCourses: { course: id } } });
    await Course.findByIdAndDelete(id);

    res.json({ success: true, message: 'Course and related data permanently deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error deleting course.' });
  }
});

/**
 * POST /api/admin/courses/:id/videos
 * Push YouTube link / class recording
 */
router.post('/courses/:id/videos', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, youtubeUrl, duration, note } = req.body;

    if (!title || !youtubeUrl) {
      return res.status(400).json({ success: false, message: 'Please provide video title and YouTube link.' });
    }

    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });

    course.videos.push({
      title,
      youtubeUrl,
      duration: duration || '',
      note: note || '',
    });
    await course.save();

    res.status(201).json({ success: true, message: 'Video added successfully.', course });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error adding video.' });
  }
});

/**
 * DELETE /api/admin/courses/:id/videos/:videoId
 */
router.delete('/courses/:id/videos/:videoId', async (req, res) => {
  try {
    const { id, videoId } = req.params;
    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });

    course.videos = course.videos.filter((v) => v._id.toString() !== videoId);
    await course.save();

    res.json({ success: true, message: 'Video removed.', course });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error removing video.' });
  }
});

/**
 * POST /api/admin/courses/:id/live-classes
 * Schedule a live meeting (Google Meet / Zoom)
 */
router.post('/courses/:id/live-classes', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, classDate, classTime, meetingLink, platform, note } = req.body;

    if (!title || !classDate || !classTime || !meetingLink) {
      return res.status(400).json({
        success: false,
        message: 'Please provide live class title, date, time, and meeting link.',
      });
    }

    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });

    course.liveClasses.push({
      title,
      classDate: new Date(classDate),
      classTime,
      meetingLink,
      platform: platform || 'Google Meet',
      note: note || '',
      isCompleted: false,
    });
    await course.save();

    res.status(201).json({ success: true, message: 'Live class scheduled.', course });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error scheduling live class.' });
  }
});

/**
 * DELETE /api/admin/courses/:id/live-classes/:classId
 */
router.delete('/courses/:id/live-classes/:classId', async (req, res) => {
  try {
    const { id, classId } = req.params;
    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });

    course.liveClasses = course.liveClasses.filter((l) => l._id.toString() !== classId);
    await course.save();

    res.json({ success: true, message: 'Live class removed.', course });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error removing live class.' });
  }
});

/**
 * POST /api/admin/courses/:id/tasks
 * Post an assignment / task
 */
router.post('/courses/:id/tasks', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, deadline, points } = req.body;

    if (!title || !description || !deadline) {
      return res.status(400).json({ success: false, message: 'Please provide task title, description, and deadline.' });
    }

    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });

    course.tasks.push({
      title,
      description,
      deadline: new Date(deadline),
      points: Number(points) || 100,
    });
    await course.save();

    res.status(201).json({ success: true, message: 'Task assigned successfully.', course });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error assigning task.' });
  }
});

/**
 * POST /api/admin/users/:userId/status
 * Pause or Block user. If Blocked, enter reason and email is sent immediately.
 */
router.post('/users/:userId/status', async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, blockReason } = req.body;

    if (!['active', 'paused', 'blocked'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status specified.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    user.status = status;
    if (status === 'blocked') {
      user.blockReason = blockReason || 'Policy violation. Contact support.';
      // Automatically send notification email explaining reason
      await sendAccountBlockedEmail({
        studentName: user.name,
        studentEmail: user.email,
        reason: user.blockReason,
      });
    } else {
      user.blockReason = '';
    }

    await user.save();

    res.json({
      success: true,
      message: `User status changed to ${status}.${status === 'blocked' ? ' Notification email dispatched.' : ''}`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        status: user.status,
        blockReason: user.blockReason,
      },
    });
  } catch (err) {
    console.error('Status change error:', err);
    res.status(500).json({ success: false, message: 'Error changing user status.' });
  }
});

/**
 * GET & POST /api/admin/courses/:id/chat
 * Admin chat interface with students in a course
 */
router.get('/courses/:id/chat', async (req, res) => {
  try {
    const { id } = req.params;
    const messages = await ChatMessage.find({ course: id }).sort({ createdAt: 1 });
    res.json({ success: true, messages });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching messages.' });
  }
});

router.post('/courses/:id/chat', async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message cannot be empty.' });
    }

    const newMsg = await ChatMessage.create({
      course: id,
      sender: req.user._id,
      senderName: 'Admin / Instructor',
      senderRole: 'admin',
      message: message.trim(),
    });

    res.status(201).json({ success: true, message: newMsg });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error posting message.' });
  }
});

/**
 * GET & PUT /api/admin/settings
 * Update bKash/Nagad numbers, WhatsApp, Contact info, Hero texts
 */
router.get('/settings', async (req, res) => {
  try {
    let settings = await SiteSettings.findOne();
    if (!settings) {
      settings = await SiteSettings.create({});
    }
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching settings.' });
  }
});

router.put('/settings', async (req, res) => {
  try {
    let settings = await SiteSettings.findOne();
    if (!settings) {
      settings = await SiteSettings.create(req.body);
    } else {
      Object.assign(settings, req.body);
      settings.updatedAt = new Date();
      await settings.save();
    }

    res.json({ success: true, message: 'Site settings updated successfully.', settings });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error updating settings.' });
  }
});

/**
 * POST /api/admin/trigger-cleanup
 * Manually trigger cleanup of expired courses
 */
router.post('/trigger-cleanup', async (req, res) => {
  try {
    const result = await cleanExpiredCoursesNow();
    res.json({ success: true, message: 'Cleanup completed.', result });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error running cleanup.' });
  }
});

/**
 * GET /api/admin/admins
 * List all registered administrators
 */
router.get('/admins', async (req, res) => {
  try {
    const admins = await User.find({ role: 'admin' })
      .select('name email phone status plainPasswordForAdmin createdAt')
      .sort({ createdAt: -1 });

    res.json({ success: true, admins });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error retrieving administrator list.' });
  }
});

/**
 * POST /api/admin/admins
 * Create / Add a new administrator
 */
router.post('/admins', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !password || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Please provide full name, email, phone number, and password for the new admin.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters.',
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    const newAdmin = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      password, // hashed by User model pre-save hook
      plainPasswordForAdmin: password,
      role: 'admin',
      status: 'active',
    });

    res.status(201).json({
      success: true,
      message: `New administrator "${newAdmin.name}" (${newAdmin.email}) added successfully.`,
      admin: {
        id: newAdmin._id,
        name: newAdmin.name,
        email: newAdmin.email,
        phone: newAdmin.phone,
        status: newAdmin.status,
        createdAt: newAdmin.createdAt,
      },
    });
  } catch (err) {
    console.error('Add Admin Error:', err);
    res.status(500).json({ success: false, message: 'Error adding administrator.' });
  }
});

/**
 * DELETE /api/admin/admins/:id
 * Remove an administrator
 */
router.delete('/admins/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent removing yourself
    if (req.user._id.toString() === id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own administrator account.',
      });
    }

    // Ensure at least one admin remains
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    if (totalAdmins <= 1) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete the only administrator on the system.',
      });
    }

    await User.findByIdAndDelete(id);
    res.json({ success: true, message: 'Administrator removed successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error removing administrator.' });
  }
});

module.exports = router;
