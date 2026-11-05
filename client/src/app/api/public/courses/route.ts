import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { DEFAULT_COURSES } from '@/lib/initialData';
import { checkRateLimit } from '@/lib/rateLimiter';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const rateLimit = checkRateLimit(req, 150, 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { success: false, message: 'Too many requests. Please slow down.' },
      { status: 429 }
    );
  }

  try {
    const { db } = await connectToDatabase();
    const courses = await db.collection('courses').find({}).sort({ _id: 1 }).toArray();

    if (!courses || courses.length === 0) {
      return NextResponse.json({ success: true, courses: DEFAULT_COURSES });
    }

    return NextResponse.json({
      success: true,
      courses,
    });
  } catch (err: any) {
    console.error('Error fetching public courses:', err);
    return NextResponse.json({ success: true, courses: DEFAULT_COURSES });
  }
}
