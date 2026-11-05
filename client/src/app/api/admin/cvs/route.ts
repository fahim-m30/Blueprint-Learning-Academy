import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { verifyAuth } from '@/lib/authGuard';
import { checkRateLimit } from '@/lib/rateLimiter';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // 1. Rate Limiting Protection (Max 120 req/min per IP)
  const rateLimit = checkRateLimit(req, 120, 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { success: false, message: 'Too many requests. Please slow down.' },
      { status: 429, headers: { 'Retry-After': String(rateLimit.resetInSec) } }
    );
  }

  // 2. Strict Admin Authentication Guard (cryptographic HMAC-SHA256 signature verification)
  const auth = await verifyAuth(req, { requiredRole: 'admin' });
  if (!auth.success) {
    return auth.response;
  }

  try {
    const { db } = await connectToDatabase();
    const rawStudents = await db
      .collection('users')
      .find({
        $or: [
          { 'cv.fileUrl': { $exists: true, $ne: '' } },
          { 'cv.fileData': { $exists: true, $ne: '' } },
          { 'cv.updatedAt': { $exists: true } },
        ],
      })
      .project({
        name: 1,
        email: 1,
        phone: 1,
        address: 1,
        cv: 1,
        enrolledCourses: 1,
        createdAt: 1,
        status: 1,
      })
      .sort({ 'cv.updatedAt': -1 })
      .toArray();

    // Optimize payload: Strip huge multi-megabyte base64 fileData from the batch list
    const students = rawStudents.map((s) => {
      const cvObj = s.cv || {};
      const hasData = Boolean(cvObj.fileData);
      return {
        ...s,
        cv: {
          fileUrl: cvObj.fileUrl || '',
          fileName: cvObj.fileName || 'Student_CV.pdf',
          hasFileData: hasData,
          fileData: hasData && cvObj.fileData.length < 100000 ? cvObj.fileData : '',
          targetJobTitle: cvObj.targetJobTitle || 'Site Engineer',
          note: cvObj.note || '',
          updatedAt: cvObj.updatedAt || s.createdAt || new Date(),
          adminFeedback: cvObj.adminFeedback || '',
          status: cvObj.status || 'submitted',
        },
      };
    });

    return NextResponse.json({ success: true, students, count: students.length });
  } catch (err: any) {
    console.error('API GET /admin/cvs error:', err);
    return NextResponse.json({ success: false, message: 'Error retrieving student CVs' }, { status: 500 });
  }
}
