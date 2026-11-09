import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { verifyAuth } from '@/lib/authGuard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/student/course/:courseId
 * Instant serverless course content retrieval for enrolled students
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { courseId: string } }
) {
  const auth = await verifyAuth(req, { requiredRole: 'student' });
  if (!auth.success) {
    return auth.response;
  }

  try {
    const { courseId } = params;
    if (!ObjectId.isValid(courseId)) {
      return NextResponse.json({ success: false, message: 'Invalid course ID format.' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const user = await db.collection('users').findOne({ _id: new ObjectId(auth.user._id) });

    if (!user) {
      return NextResponse.json({ success: false, message: 'Student not found.' }, { status: 404 });
    }

    const enrolledCourses = Array.isArray(user.enrolledCourses) ? user.enrolledCourses : [];
    const enrolledItem = enrolledCourses.find(
      (item: any) => item.course && item.course.toString() === courseId
    );

    if (!enrolledItem) {
      return NextResponse.json(
        { success: false, message: 'You are not enrolled in this course or your enrollment has expired.' },
        { status: 403 }
      );
    }

    const course = await db.collection('courses').findOne({ _id: new ObjectId(courseId) });
    if (!course) {
      return NextResponse.json({ success: false, message: 'Course not found.' }, { status: 404 });
    }

    const mySubmissions = await db
      .collection('tasksubmissions')
      .find({
        course: new ObjectId(courseId),
        student: new ObjectId(auth.user._id),
      })
      .toArray();

    const completedVideos = Array.isArray(enrolledItem?.completedVideos) ? enrolledItem.completedVideos : [];
    const totalVideos = Array.isArray(course.videos) ? course.videos.length : 0;
    const completedVideosCount = completedVideos.length;
    const videoProgress = totalVideos > 0 ? Math.round((completedVideosCount / totalVideos) * 100) : 0;

    const totalTasks = Array.isArray(course.tasks) ? course.tasks.length : 0;
    const submittedTasks = mySubmissions.length;
    const taskProgress = totalTasks > 0 ? Math.round((submittedTasks / totalTasks) * 100) : 0;

    let overallProgress = 0;
    if (totalVideos + totalTasks > 0) {
      overallProgress = Math.min(
        100,
        Math.round(((completedVideosCount + submittedTasks) / (totalVideos + totalTasks)) * 100)
      );
    }

    return NextResponse.json(
      {
        success: true,
        course,
        mySubmissions,
        completedVideos,
        progress: {
          overall: overallProgress,
          totalVideos,
          completedVideosCount,
          videoProgress,
          totalTasks,
          submittedTasks,
          taskProgress,
        },
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
    console.error('API GET /student/course/[courseId] error:', err);
    return NextResponse.json({ success: false, message: 'Failed to load course materials.' }, { status: 500 });
  }
}
