import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { verifyAuth } from '@/lib/authGuard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; classId: string } }
) {
  const auth = await verifyAuth(req, { requiredRole: 'admin' });
  if (!auth.success) {
    return auth.response;
  }

  try {
    const { id, classId } = params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: 'Invalid course ID.' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const classIdObj = ObjectId.isValid(classId) ? new ObjectId(classId) : classId;

    await db.collection('courses').updateOne(
      { _id: new ObjectId(id) },
      {
        $pull: {
          liveClasses: {
            $or: [{ _id: classIdObj }, { _id: classId }]
          }
        }
      } as any
    );

    const updatedCourse = await db.collection('courses').findOne({ _id: new ObjectId(id) });
    return NextResponse.json({ success: true, message: 'Live class deleted.', course: updatedCourse });
  } catch (err: any) {
    console.error('Error deleting live class:', err);
    return NextResponse.json({ success: false, message: 'Error deleting live class.' }, { status: 500 });
  }
}
