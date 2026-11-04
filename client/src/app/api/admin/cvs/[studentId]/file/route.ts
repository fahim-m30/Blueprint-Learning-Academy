import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { studentId: string } }
) {
  try {
    const { studentId } = params;
    const { db } = await connectToDatabase();

    let student = null;
    try {
      student = await db.collection('users').findOne({ _id: new ObjectId(studentId) });
    } catch {
      student = await db.collection('users').findOne({ email: studentId });
    }

    if (!student || !student.cv) {
      return NextResponse.json({ success: false, message: 'Student CV not found' }, { status: 404 });
    }

    // Return the full fileData and CV info
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
