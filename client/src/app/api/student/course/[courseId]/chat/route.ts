import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { verifyAuth, isValidObjectId } from '@/lib/authGuard';
import { checkRateLimit } from '@/lib/rateLimiter';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { courseId: string } }
) {
  const { courseId } = params;
  if (!courseId) {
    return NextResponse.json({ success: false, message: 'Course ID is required' }, { status: 400 });
  }

  try {
    const { db } = await connectToDatabase();

    let courseFilter: any = courseId;
    if (isValidObjectId(courseId)) {
      courseFilter = new ObjectId(courseId);
    }

    const messages = await db
      .collection('chatmessages')
      .find({ course: courseFilter })
      .sort({ createdAt: 1 })
      .limit(300)
      .toArray();

    return NextResponse.json({ success: true, messages });
  } catch (err: any) {
    console.error('API GET /student/course/:courseId/chat error:', err);
    return NextResponse.json({ success: false, message: 'Error fetching chat messages' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { courseId: string } }
) {
  // 1. Rate Limiting Protection (Max 60 messages/min)
  const rateLimit = checkRateLimit(req, 60, 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { success: false, message: 'Sending messages too fast. Please slow down.' },
      { status: 429 }
    );
  }

  // 2. Strict Student Authentication Guard (rejects blocked users and unverified tokens)
  const auth = await verifyAuth(req);
  if (!auth.success) {
    return auth.response;
  }

  const { courseId } = params;
  if (!courseId) {
    return NextResponse.json({ success: false, message: 'Course ID is required' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { message } = body;

    const trimmedMsg = String(message || '').trim();
    if (!trimmedMsg) {
      return NextResponse.json({ success: false, message: 'Message cannot be empty' }, { status: 400 });
    }

    // Input sanitization: Message length limit
    if (trimmedMsg.length > 2000) {
      return NextResponse.json({ success: false, message: 'Message is too long (maximum 2000 characters).' }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    let courseFilter: any = courseId;
    if (isValidObjectId(courseId)) {
      courseFilter = new ObjectId(courseId);
    }

    let senderObjId: any = auth.user._id;
    if (isValidObjectId(auth.user._id)) {
      senderObjId = new ObjectId(auth.user._id);
    }

    const chatDoc = {
      course: courseFilter,
      sender: senderObjId,
      senderName: auth.user.name || 'Student',
      senderRole: 'student',
      message: trimmedMsg,
      createdAt: new Date(),
    };

    const insertRes = await db.collection('chatmessages').insertOne(chatDoc);

    return NextResponse.json({
      success: true,
      message: {
        _id: insertRes.insertedId,
        ...chatDoc,
      },
    });
  } catch (err: any) {
    console.error('API POST /student/course/:courseId/chat error:', err);
    return NextResponse.json({ success: false, message: 'Error dispatching chat message' }, { status: 500 });
  }
}
