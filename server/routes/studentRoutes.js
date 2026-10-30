const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Course = require('../models/Course');
const TaskSubmission = require('../models/TaskSubmission');
const ChatMessage = require('../models/ChatMessage');
const { verifyToken, requireStudent } = require('../middleware/auth');

// All student routes require valid student token
router.use(verifyToken, requireStudent);

/**
 * GET /api/student/dashboard
 * Summary of student's enrolled courses with remaining days countdown
 */
router.get('/dashboard', async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('enrolledCourses.course');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const now = new Date();
    const enrolledWithDuration = user.enrolledCourses
      .filter((item) => item.course && item.course.isActive)
      .map((item) => {
        const course = item.course;
        let daysRemaining = 0;
        let isExpired = false;

        if (item.expiresAt) {
          const diffMs = new Date(item.expiresAt).getTime() - now.getTime();
          daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
          if (diffMs <= 0) isExpired = true;
        } else if (course.durationDays && item.enrolledAt) {
          const expireTime = new Date(item.enrolledAt).getTime() + course.durationDays * 24 * 60 * 60 * 1000;
          const diffMs = expireTime - now.getTime();
          daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
          if (diffMs <= 0) isExpired = true;
        }

        return {
          enrollmentId: item._id,
          enrolledAt: item.enrolledAt,
          expiresAt: item.expiresAt,
          daysRemaining,
          isExpired,
          course: {
            _id: course._id,
            title: course.title,
            slug: course.slug,
            category: course.category,
            totalClasses: course.totalClasses,
            durationDays: course.durationDays,
            whatsappGroupLink: course.whatsappGroupLink,
            instructor: course.instructor,
            totalVideos: course.videos ? course.videos.length : 0,
            totalTasks: course.tasks ? course.tasks.length : 0,
            totalLiveClasses: course.liveClasses ? course.liveClasses.length : 0,
          },
        };
      });

    res.json({
      success: true,
      student: {
        id: user._id,
        studentId: user.studentId || '',
        name: user.name,
        email: user.email,
        phone: user.phone,
        status: user.status,
        cv: user.cv || null,
      },
      enrolledCourses: enrolledWithDuration,
    });
  } catch (err) {
    console.error('Student dashboard error:', err);
    res.status(500).json({ success: false, message: 'Error retrieving student dashboard.' });
  }
});

/**
 * GET /api/student/course/:courseId
 * Access complete materials for an enrolled course
 */
router.get('/course/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;

    // Verify student is enrolled in this course
    const user = await User.findById(req.user._id);
    const isEnrolled = user.enrolledCourses.some(
      (item) => item.course && item.course.toString() === courseId
    );

    if (!isEnrolled) {
      return res.status(403).json({
        success: false,
        message: 'You are not enrolled in this course or your enrollment has expired.',
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    // Get submissions by this student for this course
    const mySubmissions = await TaskSubmission.find({
      course: courseId,
      student: req.user._id,
    });

    res.json({
      success: true,
      course,
      mySubmissions,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching course details.' });
  }
});

/**
 * POST /api/student/course/:courseId/tasks/:taskId/submit
 * Submit an assignment/task
 */
router.post('/course/:courseId/tasks/:taskId/submit', async (req, res) => {
  try {
    const { courseId, taskId } = req.params;
    const { submissionText, submissionLink } = req.body;

    if (!submissionText && !submissionLink) {
      return res.status(400).json({
        success: false,
        message: 'Please provide either submission description text or a resource/drive link.',
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    const task = course.tasks.id(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    // Upsert submission
    let submission = await TaskSubmission.findOne({
      course: courseId,
      taskId: taskId,
      student: req.user._id,
    });

    if (submission) {
      submission.submissionText = submissionText || submission.submissionText;
      submission.submissionLink = submissionLink || submission.submissionLink;
      submission.submittedAt = new Date();
      submission.status = 'submitted';
      await submission.save();
    } else {
      submission = await TaskSubmission.create({
        course: courseId,
        taskId: taskId,
        taskTitle: task.title,
        student: req.user._id,
        studentName: req.user.name,
        studentEmail: req.user.email,
        submissionText: submissionText || '',
        submissionLink: submissionLink || '',
        status: 'submitted',
      });
    }

    res.json({ success: true, message: 'Task submitted successfully.', submission });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error submitting task.' });
  }
});

/**
 * GET /api/student/course/:courseId/chat
 * Fetch discussion messages for this course
 */
router.get('/course/:courseId/chat', async (req, res) => {
  try {
    const { courseId } = req.params;
    const messages = await ChatMessage.find({ course: courseId })
      .sort({ createdAt: 1 })
      .limit(100);

    res.json({ success: true, messages });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching chat messages.' });
  }
});

/**
 * POST /api/student/course/:courseId/chat
 * Send a chat message to admin/instructor
 */
router.post('/course/:courseId/chat', async (req, res) => {
  try {
    const { courseId } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message content cannot be empty.' });
    }

    const newMsg = await ChatMessage.create({
      course: courseId,
      sender: req.user._id,
      senderName: req.user.name,
      senderRole: 'student',
      message: message.trim(),
    });

    res.status(201).json({ success: true, message: newMsg });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error sending message.' });
  }
});

/**
 * POST /api/student/cv
 * Upload or update student CV
 */
router.post('/cv', async (req, res) => {
  try {
    const { fileUrl, fileName, fileData, targetJobTitle, note } = req.body;
    if (!fileUrl && !fileData) {
      return res.status(400).json({ success: false, message: 'Please provide a CV document file or Google Drive URL.' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    user.cv = {
      fileUrl: fileUrl ? fileUrl.trim() : (user.cv?.fileUrl || ''),
      fileName: fileName ? fileName.trim() : (user.cv?.fileName || 'Student_CV.pdf'),
      fileData: fileData || (user.cv?.fileData || ''),
      targetJobTitle: targetJobTitle ? targetJobTitle.trim() : (user.cv?.targetJobTitle || ''),
      note: note ? note.trim() : (user.cv?.note || ''),
      updatedAt: new Date(),
      adminFeedback: user.cv?.adminFeedback || '',
      status: 'submitted',
    };

    await user.save();

    res.json({
      success: true,
      message: 'CV submitted successfully! Our instructor and placement team will review it.',
      cv: user.cv,
    });
  } catch (err) {
    console.error('Submit CV error:', err);
    res.status(500).json({ success: false, message: 'Failed to submit CV.' });
  }
});

module.exports = router;
