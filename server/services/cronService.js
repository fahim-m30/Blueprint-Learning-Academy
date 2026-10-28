const cron = require('node-cron');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const TaskSubmission = require('../models/TaskSubmission');
const ChatMessage = require('../models/ChatMessage');
const User = require('../models/User');

/**
 * Checks and permanently deletes courses whose duration has expired,
 * along with all related enrollments, tasks, chat messages, and student references.
 */
const cleanExpiredCoursesNow = async () => {
  try {
    const now = new Date();
    // Find courses whose explicit expiresAt has passed, OR whose durationDays from creation has passed
    const allCourses = await Course.find();
    const expiredCourseIds = [];

    for (const c of allCourses) {
      let isExpired = false;
      if (c.expiresAt && c.expiresAt <= now) {
        isExpired = true;
      } else if (c.durationDays && c.createdAt) {
        const expiryDate = new Date(c.createdAt.getTime() + c.durationDays * 24 * 60 * 60 * 1000);
        if (expiryDate <= now) {
          isExpired = true;
        }
      }

      if (isExpired) {
        expiredCourseIds.push(c._id);
        console.log(`[Auto-Cleanup] Course expired: "${c.title}" (ID: ${c._id}). Initiating complete deletion.`);
      }
    }

    if (expiredCourseIds.length > 0) {
      // 1. Delete all enrollments for these courses
      await Enrollment.deleteMany({ course: { $in: expiredCourseIds } });

      // 2. Delete all task submissions for these courses
      await TaskSubmission.deleteMany({ course: { $in: expiredCourseIds } });

      // 3. Delete all chat messages for these courses
      await ChatMessage.deleteMany({ course: { $in: expiredCourseIds } });

      // 4. Pull course from all students enrolledCourses array
      await User.updateMany(
        {},
        {
          $pull: {
            enrolledCourses: { course: { $in: expiredCourseIds } },
          },
        }
      );

      // 5. Permanently delete the course documents
      const deleteResult = await Course.deleteMany({ _id: { $in: expiredCourseIds } });

      console.log(`[Auto-Cleanup Completed] Removed ${deleteResult.deletedCount} expired course(s) and all associated data.`);
      return { cleanedCount: deleteResult.deletedCount, expiredCourseIds };
    } else {
      return { cleanedCount: 0, expiredCourseIds: [] };
    }
  } catch (err) {
    console.error('[Auto-Cleanup Error]:', err.message);
    return { error: err.message };
  }
};

/**
 * Initialize hourly cron job
 */
const initCronJobs = () => {
  // Runs at minute 0 every hour: '0 * * * *'
  cron.schedule('0 * * * *', async () => {
    console.log('[Cron Job] Checking for expired courses...');
    await cleanExpiredCoursesNow();
  });
  console.log('⏰ Expiration Cleanup Cron Job registered (Runs hourly).');
};

module.exports = {
  cleanExpiredCoursesNow,
  initCronJobs,
};
