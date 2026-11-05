import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { verifyAuth } from '@/lib/authGuard';
import { checkRateLimit } from '@/lib/rateLimiter';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // 1. Rate Limiting Protection (Max 120 req/min)
  const rateLimit = checkRateLimit(req, 120, 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { success: false, message: 'Too many requests. Please slow down.' },
      { status: 429 }
    );
  }

  // 2. Strict Cryptographic Student Authentication Guard
  const auth = await verifyAuth(req);
  if (!auth.success) {
    return auth.response;
  }

  try {
    const { db } = await connectToDatabase();
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(auth.user._id) },
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
  // 1. Rate Limiting Protection (Max 30 CV uploads/min)
  const rateLimit = checkRateLimit(req, 30, 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { success: false, message: 'Submitting too frequently. Please wait a moment.' },
      { status: 429 }
    );
  }

  // 2. Strict Cryptographic Student Authentication Guard
  const auth = await verifyAuth(req);
  if (!auth.success) {
    return auth.response;
  }

  try {
    const body = await req.json();
    const { fileUrl, fileName, fileData, targetJobTitle, note } = body;

    if (!fileUrl && !fileData) {
      return NextResponse.json(
        { success: false, message: 'Please provide a CV document file or Google Drive URL.' },
        { status: 400 }
      );
    }

    // Input sanitization: Payload size limits
    if (fileData && typeof fileData === 'string' && fileData.length > 6 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, message: 'File is too large. Maximum supported document size is 4MB.' },
        { status: 413 }
      );
    }

    const { db } = await connectToDatabase();
    const user = await db.collection('users').findOne({ _id: new ObjectId(auth.user._id) });
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    const updatedCv = {
      fileUrl: fileUrl ? String(fileUrl).trim() : (user.cv?.fileUrl || ''),
      fileName: fileName ? String(fileName).trim() : (user.cv?.fileName || 'Student_CV.pdf'),
      fileData: fileData || (user.cv?.fileData || ''),
      targetJobTitle: targetJobTitle ? String(targetJobTitle).trim().slice(0, 100) : (user.cv?.targetJobTitle || ''),
      note: note ? String(note).trim().slice(0, 1000) : (user.cv?.note || ''),
      updatedAt: new Date(),
      adminFeedback: user.cv?.adminFeedback || '',
      status: 'submitted',
    };

    await db.collection('users').updateOne(
      { _id: new ObjectId(auth.user._id) },
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
