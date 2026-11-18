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
    let videosToAdd: any[] = [];

    if (Array.isArray(body.videos) && body.videos.length > 0) {
      videosToAdd = body.videos
        .filter((v: any) => v && (v.title || '').trim() && (v.youtubeUrl || '').trim())
        .map((v: any) => ({
          _id: new ObjectId(),
          title: String(v.title).trim(),
          youtubeUrl: String(v.youtubeUrl).trim(),
          duration: v.duration ? String(v.duration).trim() : '',
          note: v.note ? String(v.note).trim() : '',
          createdAt: new Date(),
        }));
    } else if (body.title && body.youtubeUrl) {
      videosToAdd = [
        {
          _id: new ObjectId(),
          title: String(body.title).trim(),
          youtubeUrl: String(body.youtubeUrl).trim(),
          duration: body.duration ? String(body.duration).trim() : '',
          note: body.note ? String(body.note).trim() : '',
          createdAt: new Date(),
        },
      ];
    }

    if (videosToAdd.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Please provide at least one video title and YouTube URL.' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    await db.collection('courses').updateOne(
      { _id: new ObjectId(courseId) },
      { $push: { videos: { $each: videosToAdd as any } as any } as any }
    );

    const updatedCourse = await db.collection('courses').findOne({ _id: new ObjectId(courseId) });

    if (!updatedCourse) {
      return NextResponse.json({ success: false, message: 'Course not found.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `${videosToAdd.length} video(s) added successfully to student portal.`,
      videos: videosToAdd,
      video: videosToAdd[0],
      course: updatedCourse,
    });
  } catch (err: any) {
    console.error('API POST /admin/courses/[id]/videos error:', err);
    return NextResponse.json({ success: false, message: 'Failed to add video.' }, { status: 500 });
  }
}
