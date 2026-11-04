import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getUserIdFromAuth(req: NextRequest): { userId: string | null; role: string | null } {
  const authHeader = req.headers.get('authorization') || '';
  if (!authHeader.startsWith('Bearer ')) {
    return { userId: null, role: null };
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded: any = jwt.decode(token);
    if (decoded && decoded.id) {
      return { userId: decoded.id, role: decoded.role || 'admin' };
    }
  } catch {}
  return { userId: null, role: null };
}

export async function POST(
  req: NextRequest,
  { params }: { params: { studentId: string } }
) {
  try {
    const { userId } = getUserIdFromAuth(req);
    if (!userId) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 });
    }

    const { studentId } = params;
    const body = await req.json();
    const { feedback, status } = body;

    const { db } = await connectToDatabase();
    const user = await db.collection('users').findOne({ _id: new ObjectId(studentId) });
    if (!user) {
      return NextResponse.json({ success: false, message: 'Student not found' }, { status: 404 });
    }

    const currentCv = user.cv || {};
    if (feedback !== undefined) currentCv.adminFeedback = String(feedback);
    if (status) currentCv.status = status;

    await db.collection('users').updateOne(
      { _id: new ObjectId(studentId) },
      { $set: { cv: currentCv } }
    );

    return NextResponse.json({
      success: true,
      message: 'CV review feedback saved successfully.',
      cv: currentCv,
    });
  } catch (err: any) {
    console.error('API POST /admin/cvs/feedback error:', err);
    return NextResponse.json({ success: false, message: 'Error updating CV feedback' }, { status: 500 });
  }
}
