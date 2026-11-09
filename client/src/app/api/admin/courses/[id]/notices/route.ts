import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { verifyAuth } from '@/lib/authGuard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await verifyAuth(req, { requiredRole: 'admin' });
  if (!auth.success) {
    return auth.response;
  }

  try {
    const { id } = params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: 'Invalid course ID format.' }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const { title, content, category, date, isPinned } = body;

    if (!title || !content) {
      return NextResponse.json(
        { success: false, message: 'Please provide notice title and details.' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const newNotice = {
      _id: new ObjectId(),
      title: String(title).trim(),
      content: String(content).trim(),
      category: category || 'batch_start',
      date: date ? String(date).trim() : '',
      isPinned: isPinned !== false,
      createdAt: new Date(),
    };

    await db.collection('courses').updateOne(
      { _id: new ObjectId(id) },
      { $push: { notices: { $each: [newNotice as any], $position: 0 } as any } as any }
    );

    const updatedCourse = await db.collection('courses').findOne({ _id: new ObjectId(id) });

    return NextResponse.json({
      success: true,
      message: 'Notice published to Notice Board successfully.',
      notice: newNotice,
      course: updatedCourse,
    }, { status: 201 });
  } catch (err: any) {
    console.error('Error publishing notice:', err);
    return NextResponse.json({ success: false, message: 'Error publishing notice.' }, { status: 500 });
  }
}
