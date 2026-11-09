import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { verifyAuth } from '@/lib/authGuard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * DELETE /api/admin/courses/:id/videos/:videoId
 * Permanently remove an uploaded video lecture from the course
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; videoId: string } }
) {
  const auth = await verifyAuth(req, { requiredRole: 'admin' });
  if (!auth.success) {
    return auth.response;
  }

  try {
    const { id: courseId, videoId } = params;

    if (!ObjectId.isValid(courseId)) {
      return NextResponse.json({ success: false, message: 'Invalid course ID format.' }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    // Pull video matching ObjectId or string ID
    const pullCondition = ObjectId.isValid(videoId)
      ? { $or: [{ _id: new ObjectId(videoId) }, { _id: videoId }] }
      : { _id: videoId };

    const result = await db.collection('courses').findOneAndUpdate(
      { _id: new ObjectId(courseId) },
      { $pull: { videos: pullCondition as any } },
      { returnDocument: 'after' }
    );

    const updatedCourse = result?.value || await db.collection('courses').findOne({ _id: new ObjectId(courseId) });

    if (!updatedCourse) {
      return NextResponse.json({ success: false, message: 'Course not found.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Video lecture deleted successfully.',
      course: updatedCourse,
    });
  } catch (err: any) {
    console.error('API DELETE /admin/courses/[id]/videos/[videoId] error:', err);
    return NextResponse.json({ success: false, message: 'Failed to delete video.' }, { status: 500 });
  }
}
