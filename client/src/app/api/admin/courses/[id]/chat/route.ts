import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { verifyAuth, isValidObjectId } from '@/lib/authGuard';
import { checkRateLimit } from '@/lib/rateLimiter';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  if (!id) {
    return NextResponse.json({ success: false, message: 'Course ID is required' }, { status: 400 });
  }

  try {
    const { db } = await connectToDatabase();

    let courseFilter: any = id;
    if (isValidObjectId(id)) {
      courseFilter = new ObjectId(id);
    }

    const messages = await db
      .collection('chatmessages')
      .find({ course: courseFilter })
      .sort({ createdAt: 1 })
      .limit(300)
      .toArray();

    return NextResponse.json({ success: true, messages });
  } catch (err: any) {
    console.error('API GET /admin/courses/:id/chat error:', err);
    return NextResponse.json({ success: false, message: 'Error fetching chat messages' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // 1. Rate limiting protection (Max 60 messages/minute)
  const rateLimit = checkRateLimit(req, 60, 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { success: false, message: 'Sending messages too fast. Please slow down.' },
      { status: 429 }
    );
  }

  // 2. Strict Admin Authentication Guard
  const auth = await verifyAuth(req, { requiredRole: 'admin' });
  if (!auth.success) {
    return auth.response;
  }

  const { id } = params;
  if (!id) {
    return NextResponse.json({ success: false, message: 'Course ID is required' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { message, recipientId } = body;

    const trimmedMsg = String(message || '').trim();
    if (!trimmedMsg) {
      return NextResponse.json({ success: false, message: 'Message cannot be empty' }, { status: 400 });
    }

    // Input sanitization: limit max characters per message to prevent payload bloat
    if (trimmedMsg.length > 2000) {
      return NextResponse.json({ success: false, message: 'Message is too long (maximum 2000 characters).' }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    let courseFilter: any = id;
    if (isValidObjectId(id)) {
      courseFilter = new ObjectId(id);
    }

    let senderObjId: any = auth.user._id;
    if (isValidObjectId(auth.user._id)) {
      senderObjId = new ObjectId(auth.user._id);
    }

    const chatDoc = {
      course: courseFilter,
      sender: senderObjId,
      senderName: auth.user.name || 'Admin / Instructor',
      senderRole: 'admin',
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
    console.error('API POST /admin/courses/:id/chat error:', err);
    return NextResponse.json({ success: false, message: 'Error dispatching admin message' }, { status: 500 });
  }
}
