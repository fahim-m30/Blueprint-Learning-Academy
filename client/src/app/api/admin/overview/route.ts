import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { verifyAuth } from '@/lib/authGuard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/admin/overview
 * Real-time top-level stats for admin dashboard
 * Direct MongoDB Atlas pipeline (responds in ~30ms)
 */
export async function GET(req: NextRequest) {
  const auth = await verifyAuth(req, { requiredRole: 'admin' });
  if (!auth.success) {
    return auth.response;
  }

  try {
    const { db } = await connectToDatabase();

    const [
      totalCourses,
      totalStudents,
      pendingEnrollments,
      approvedEnrollments,
      revenueResult,
      coursesList,
    ] = await Promise.all([
      db.collection('courses').countDocuments(),
      db.collection('users').countDocuments({ role: 'student' }),
      db.collection('enrollments').countDocuments({ status: 'pending' }),
      db.collection('enrollments').countDocuments({ status: 'approved' }),
      db.collection('enrollments').aggregate([
        { $match: { status: 'approved' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]).toArray(),
      db.collection('courses')
        .find({}, { projection: { title: 1, slug: 1, price: 1, durationDays: 1, totalClasses: 1, isActive: 1, createdAt: 1 } })
        .toArray(),
    ]);

    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

    const coursesWithStudentCount = await Promise.all(
      coursesList.map(async (c) => {
        const [studentCount, pendingCount] = await Promise.all([
          db.collection('users').countDocuments({
            'enrolledCourses.course': c._id,
          }),
          db.collection('enrollments').countDocuments({
            course: c._id,
            status: 'pending',
          }),
        ]);

        return {
          _id: c._id.toString(),
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

    return NextResponse.json(
      {
        success: true,
        stats: {
          totalCourses,
          totalStudents,
          pendingEnrollments,
          approvedEnrollments,
          totalRevenue,
        },
        courses: coursesWithStudentCount,
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
    console.error('API GET /admin/overview error:', err);
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve overview data.' },
      { status: 500 }
    );
  }
}
