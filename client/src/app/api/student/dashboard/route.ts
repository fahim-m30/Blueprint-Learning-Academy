import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { verifyAuth } from '@/lib/authGuard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/student/dashboard
 * Real-time student dashboard summary with instant ~30ms response
 */
export async function GET(req: NextRequest) {
  const auth = await verifyAuth(req, { requiredRole: 'student' });
  if (!auth.success) {
    return auth.response;
  }

  try {
    const { db } = await connectToDatabase();
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(auth.user._id) },
      { projection: { password: 0, plainPasswordForAdmin: 0 } }
    );

    if (!user) {
      return NextResponse.json({ success: false, message: 'Student account not found.' }, { status: 404 });
    }

    const enrolledRaw = Array.isArray(user.enrolledCourses) ? user.enrolledCourses : [];
    const courseIds = enrolledRaw
      .map((item: any) => item.course)
      .filter((id: any) => id)
      .map((id: any) => (id instanceof ObjectId ? id : new ObjectId(id)));

    const coursesList = await db
      .collection('courses')
      .find({ _id: { $in: courseIds } })
      .toArray();

    const courseMap = new Map();
    coursesList.forEach((c) => courseMap.set(c._id.toString(), c));

    const now = new Date();
    const enrolledWithDuration = await Promise.all(
      enrolledRaw
        .filter((item: any) => {
          const c = courseMap.get(item.course?.toString());
          return c && c.isActive;
        })
        .map(async (item: any) => {
          const course = courseMap.get(item.course.toString());
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

          const totalVideos = Array.isArray(course.videos) ? course.videos.length : 0;
          const totalTasks = Array.isArray(course.tasks) ? course.tasks.length : 0;
          const completedVideosCount = Array.isArray(item.completedVideos) ? item.completedVideos.length : 0;

          let submittedTasksCount = 0;
          try {
            submittedTasksCount = await db.collection('tasksubmissions').countDocuments({
              course: course._id,
              student: user._id,
            });
          } catch {}

          let calculatedProgress = item.progress || 0;
          if (totalVideos + totalTasks > 0) {
            calculatedProgress = Math.min(
              100,
              Math.round(((completedVideosCount + submittedTasksCount) / (totalVideos + totalTasks)) * 100)
            );
          }

          const taskProgress = totalTasks > 0 ? Math.round((submittedTasksCount / totalTasks) * 100) : 0;

          return {
            enrollmentId: item._id,
            enrolledAt: item.enrolledAt,
            expiresAt: item.expiresAt,
            daysRemaining,
            isExpired,
            progress: calculatedProgress,
            completedVideos: item.completedVideos || [],
            taskProgress: {
              total: totalTasks,
              submitted: submittedTasksCount,
              pending: Math.max(0, totalTasks - submittedTasksCount),
              percentage: taskProgress,
            },
            course: {
              _id: course._id.toString(),
              title: course.title,
              slug: course.slug,
              category: course.category,
              totalClasses: course.totalClasses,
              durationDays: course.durationDays,
              whatsappGroupLink: course.whatsappGroupLink,
              instructor: course.instructor,
              totalVideos,
              totalTasks,
              totalLiveClasses: Array.isArray(course.liveClasses) ? course.liveClasses.length : 0,
            },
          };
        })
    );

    return NextResponse.json(
      {
        success: true,
        student: {
          id: user._id.toString(),
          studentId: user.studentId || '',
          name: user.name,
          email: user.email,
          phone: user.phone,
          status: user.status,
          cv: user.cv || null,
        },
        enrolledCourses: enrolledWithDuration,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  } catch (err: any) {
    console.error('API GET /student/dashboard error:', err);
    return NextResponse.json({ success: false, message: 'Failed to retrieve student dashboard.' }, { status: 500 });
  }
}
