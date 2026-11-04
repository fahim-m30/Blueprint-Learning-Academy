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
    if (decoded && decoded.id) {
      return { userId: decoded.id, role: decoded.role || 'admin' };
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
    const students = await db
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

    return NextResponse.json({ success: true, students, count: students.length });
  } catch (err: any) {
    console.error('API GET /admin/cvs error:', err);
    return NextResponse.json({ success: false, message: 'Error retrieving student CVs' }, { status: 500 });
  }
}
