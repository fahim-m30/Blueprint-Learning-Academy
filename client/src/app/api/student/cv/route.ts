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
      return { userId: decoded.id, role: decoded.role || 'student' };
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
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(userId) },
      { projection: { cv: 1, name: 1, email: 1, phone: 1 } }
    );

    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, cv: user.cv || null });
  } catch (err: any) {
    console.error('API GET /student/cv error:', err);
    return NextResponse.json({ success: false, message: 'Failed to retrieve CV' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = getUserIdFromAuth(req);
    if (!userId) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const { fileUrl, fileName, fileData, targetJobTitle, note } = body;

    if (!fileUrl && !fileData) {
      return NextResponse.json(
        { success: false, message: 'Please provide a CV document file or Google Drive URL.' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    const updatedCv = {
      fileUrl: fileUrl ? String(fileUrl).trim() : (user.cv?.fileUrl || ''),
      fileName: fileName ? String(fileName).trim() : (user.cv?.fileName || 'Student_CV.pdf'),
      fileData: fileData || (user.cv?.fileData || ''),
      targetJobTitle: targetJobTitle ? String(targetJobTitle).trim() : (user.cv?.targetJobTitle || ''),
      note: note ? String(note).trim() : (user.cv?.note || ''),
      updatedAt: new Date(),
      adminFeedback: user.cv?.adminFeedback || '',
      status: 'submitted',
    };

    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { $set: { cv: updatedCv } }
    );

    return NextResponse.json({
      success: true,
      message: 'CV submitted successfully! Our instructor and placement team will review it.',
      cv: updatedCv,
    });
  } catch (err: any) {
    console.error('API POST /student/cv error:', err);
    return NextResponse.json({ success: false, message: 'Failed to submit CV: ' + (err.message || 'Server error') }, { status: 500 });
  }
}
