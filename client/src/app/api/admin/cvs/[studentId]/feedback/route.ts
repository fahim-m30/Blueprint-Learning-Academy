import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { verifyAuth, isValidObjectId } from '@/lib/authGuard';
import { checkRateLimit } from '@/lib/rateLimiter';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { studentId: string } }
) {
  const rateLimit = checkRateLimit(req, 60, 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { success: false, message: 'Too many requests. Please slow down.' },
      { status: 429 }
    );
  }

  const auth = await verifyAuth(req, { requiredRole: 'admin' });
  if (!auth.success) {
    return auth.response;
  }

  const { studentId } = params;
  if (!isValidObjectId(studentId)) {
    return NextResponse.json({ success: false, message: 'Invalid student ID format.' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { feedback, status } = body;

    const { db } = await connectToDatabase();
    const user = await db.collection('users').findOne({ _id: new ObjectId(studentId) });
    if (!user) {
      return NextResponse.json({ success: false, message: 'Student not found' }, { status: 404 });
    }

    const currentCv = user.cv || {};
    if (feedback !== undefined) currentCv.adminFeedback = String(feedback).trim();
    if (status && ['submitted', 'reviewed', 'needs_revision'].includes(status)) {
      currentCv.status = status;
    }

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
