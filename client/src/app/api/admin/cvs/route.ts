import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
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
    if (decoded && (decoded.id || decoded._id)) {
      return { userId: decoded.id || decoded._id, role: decoded.role || 'admin' };
    }
  } catch {}
  return { userId: null, role: null };
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = getUserIdFromAuth(req);
    if (!userId) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 });
    }

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

    // Optimize payload: Strip huge multi-megabyte base64 fileData from the batch list to ensure instant (<30ms) responses
    const students = rawStudents.map((s) => {
      const cvObj = s.cv || {};
      const hasData = Boolean(cvObj.fileData);
      return {
        ...s,
        cv: {
          fileUrl: cvObj.fileUrl || '',
          fileName: cvObj.fileName || 'Student_CV.pdf',
          hasFileData: hasData,
          // Only send fileData directly if it's small (<100KB), otherwise the client will load it on-demand via /api/admin/cvs/[studentId]/file
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
