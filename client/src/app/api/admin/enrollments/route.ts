import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { verifyAuth } from '@/lib/authGuard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/admin/enrollments
 * Real-time list of all enrollments
 */
export async function GET(req: NextRequest) {
  const auth = await verifyAuth(req, { requiredRole: 'admin' });
  if (!auth.success) {
    return auth.response;
  }

  try {
    const { db } = await connectToDatabase();
    const url = new URL(req.url);
    const status = url.searchParams.get('status');

    const matchQuery: Record<string, any> = {};
    if (status) {
      matchQuery.status = status;
    }

    const enrollments = await db
      .collection('enrollments')
      .aggregate([
        { $match: matchQuery },
        { $sort: { createdAt: -1 } },
        {
          $lookup: {
            from: 'courses',
            localField: 'course',
            foreignField: '_id',
            as: 'courseData',
          },
        },
        {
          $addFields: {
            course: {
              $cond: {
                if: { $gt: [{ $size: '$courseData' }, 0] },
                then: {
                  _id: { $arrayElemAt: ['$courseData._id', 0] },
                  title: { $arrayElemAt: ['$courseData.title', 0] },
                  price: { $arrayElemAt: ['$courseData.price', 0] },
                },
                else: null,
              },
            },
          },
        },
        { $project: { courseData: 0 } },
      ])
      .toArray();

    return NextResponse.json(
      {
        success: true,
        enrollments,
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
    console.error('API GET /admin/enrollments error:', err);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch enrollments.' },
      { status: 500 }
    );
  }
}
