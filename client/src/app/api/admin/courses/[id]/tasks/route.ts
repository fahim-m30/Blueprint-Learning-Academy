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
    const { title, description, deadline, points } = body;

    if (!title || !description || !deadline) {
      return NextResponse.json(
        { success: false, message: 'Please provide task title, description, and deadline.' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const newTask = {
      _id: new ObjectId(),
      title: String(title).trim(),
      description: String(description).trim(),
      deadline: new Date(deadline),
      points: Number(points) || 100,
      createdAt: new Date(),
    };

    await db.collection('courses').updateOne(
      { _id: new ObjectId(id) },
      { $push: { tasks: newTask as any } }
    );

    const updatedCourse = await db.collection('courses').findOne({ _id: new ObjectId(id) });

    return NextResponse.json({
      success: true,
      message: 'Task created successfully.',
      task: newTask,
      course: updatedCourse,
    }, { status: 201 });
  } catch (err: any) {
    console.error('Error creating task:', err);
    return NextResponse.json({ success: false, message: 'Error assigning task.' }, { status: 500 });
  }
}
