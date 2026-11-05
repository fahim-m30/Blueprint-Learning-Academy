import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { verifyAuth, isValidObjectId } from '@/lib/authGuard';
import { checkRateLimit } from '@/lib/rateLimiter';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
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

  // Strict Admin Authentication Guard
  const auth = await verifyAuth(req, { requiredRole: 'admin' });
  if (!auth.success) {
    return auth.response;
  }

  const { studentId } = params;
  if (!isValidObjectId(studentId)) {
    return NextResponse.json({ success: false, message: 'Invalid student ID' }, { status: 400 });
  }

  try {
    const { db } = await connectToDatabase();
    const student = await db.collection('users').findOne({ _id: new ObjectId(studentId) });

    if (!student || !student.cv) {
      return NextResponse.json({ success: false, message: 'Student CV not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      cv: student.cv,
      fileData: student.cv.fileData || '',
      fileName: student.cv.fileName || `${student.name}_CV.pdf`,
      fileUrl: student.cv.fileUrl || '',
    });
  } catch (err: any) {
    console.error('API GET /admin/cvs/[studentId]/file error:', err);
    return NextResponse.json({ success: false, message: 'Failed to retrieve CV file' }, { status: 500 });
  }
}
