import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/public/notices
 * Returns all active course notices for Academy Notice Board
 */
export async function GET(req: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    const courses = await db
      .collection('courses')
      .find({ isActive: { $ne: false } })
      .project({
        title: 1,
        slug: 1,
        batchStartDate: 1,
        batchSchedule: 1,
        notices: 1,
        createdAt: 1,
      })
      .toArray();

    const allNotices: any[] = [];
    courses.forEach((c) => {
      if (c.notices && Array.isArray(c.notices)) {
        c.notices.forEach((n: any) => {
          allNotices.push({
            ...n,
            courseId: c._id,
            courseTitle: c.title,
            courseSlug: c.slug,
          });
        });
      }

      if (c.batchStartDate && (!c.notices || !c.notices.some((n: any) => n.category === 'batch_start'))) {
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

    return NextResponse.json({ success: true, notices: allNotices });
  } catch (err: any) {
    console.error('Fetch notices error:', err);
    return NextResponse.json({ success: false, message: 'Error fetching notices.' }, { status: 500 });
  }
}
