import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { verifyAuth } from '@/lib/authGuard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; taskId: string } }
) {
  const auth = await verifyAuth(req, { requiredRole: 'admin' });
  if (!auth.success) {
    return auth.response;
  }

  try {
    const { id, taskId } = params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: 'Invalid course ID.' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const taskIdObj = ObjectId.isValid(taskId) ? new ObjectId(taskId) : taskId;

    await db.collection('courses').updateOne(
      { _id: new ObjectId(id) },
      {
        $pull: {
          tasks: {
            $or: [{ _id: taskIdObj }, { _id: taskId }]
          }
        }
      } as any
    );

    const updatedCourse = await db.collection('courses').findOne({ _id: new ObjectId(id) });
    return NextResponse.json({ success: true, message: 'Task deleted.', course: updatedCourse });
  } catch (err: any) {
    console.error('Error deleting task:', err);
    return NextResponse.json({ success: false, message: 'Error deleting task.' }, { status: 500 });
  }
}
