import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { DEFAULT_COURSES } from '@/lib/initialData';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
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
