import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { verifyAuth } from '@/lib/authGuard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; noticeId: string } }
) {
  const auth = await verifyAuth(req, { requiredRole: 'admin' });
  if (!auth.success) {
    return auth.response;
  }

  try {
    const { id, noticeId } = params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: 'Invalid course ID.' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const noticeIdObj = ObjectId.isValid(noticeId) ? new ObjectId(noticeId) : noticeId;

    await db.collection('courses').updateOne(
      { _id: new ObjectId(id) },
      {
        $pull: {
          notices: {
            $or: [{ _id: noticeIdObj }, { _id: noticeId }]
          }
        }
      } as any
    );

    const updatedCourse = await db.collection('courses').findOne({ _id: new ObjectId(id) });
    return NextResponse.json({ success: true, message: 'Notice deleted.', course: updatedCourse });
  } catch (err: any) {
    console.error('Error deleting notice:', err);
    return NextResponse.json({ success: false, message: 'Error deleting notice.' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string; noticeId: string } }
) {
  const auth = await verifyAuth(req, { requiredRole: 'admin' });
  if (!auth.success) {
    return auth.response;
  }

  try {
    const { id, noticeId } = params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: 'Invalid course ID.' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const noticeIdObj = ObjectId.isValid(noticeId) ? new ObjectId(noticeId) : noticeId;

    const course = await db.collection('courses').findOne({ _id: new ObjectId(id) });
    const currentNotice = (course?.notices || []).find(
      (n: any) => n._id?.toString() === noticeId || n._id?.toString() === noticeIdObj?.toString()
    );

    const newPinned = currentNotice ? !currentNotice.isPinned : true;

    await db.collection('courses').updateOne(
      { _id: new ObjectId(id), 'notices._id': noticeIdObj },
      { $set: { 'notices.$.isPinned': newPinned } }
    );

    const updatedCourse = await db.collection('courses').findOne({ _id: new ObjectId(id) });
    return NextResponse.json({ success: true, message: 'Notice pin status updated.', course: updatedCourse });
  } catch (err: any) {
    console.error('Error toggling notice pin:', err);
    return NextResponse.json({ success: false, message: 'Error toggling notice pin.' }, { status: 500 });
  }
}
