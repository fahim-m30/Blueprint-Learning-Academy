import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { verifyAuth } from '@/lib/authGuard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * POST /api/admin/courses/:id/videos
 * Push a new class recording / YouTube link to the course
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await verifyAuth(req, { requiredRole: 'admin' });
  if (!auth.success) {
    return auth.response;
  }

  try {
    const courseId = params.id;
    if (!ObjectId.isValid(courseId)) {
      return NextResponse.json({ success: false, message: 'Invalid course ID format.' }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const { title, youtubeUrl, duration, note } = body;

    if (!title || !youtubeUrl) {
      return NextResponse.json(
        { success: false, message: 'Please provide both video title and YouTube URL.' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const newVideo = {
      _id: new ObjectId(),
      title: String(title).trim(),
      youtubeUrl: String(youtubeUrl).trim(),
      duration: duration ? String(duration).trim() : '',
      note: note ? String(note).trim() : '',
      createdAt: new Date(),
    };

    await db.collection('courses').updateOne(
      { _id: new ObjectId(courseId) },
      { $push: { videos: newVideo as any } }
    );

    const updatedCourse = await db.collection('courses').findOne({ _id: new ObjectId(courseId) });

    if (!updatedCourse) {
      return NextResponse.json({ success: false, message: 'Course not found.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Video added successfully.',
      video: newVideo,
      course: updatedCourse,
    });
  } catch (err: any) {
    console.error('API POST /admin/courses/[id]/videos error:', err);
    return NextResponse.json({ success: false, message: 'Failed to add video.' }, { status: 500 });
  }
}
