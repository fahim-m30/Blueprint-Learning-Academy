import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getUserIdFromAuth(req: NextRequest): { userId: string | null; role: string | null; email?: string } {
  const authHeader = req.headers.get('authorization') || '';
  if (!authHeader.startsWith('Bearer ')) {
    return { userId: null, role: null };
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded: any = jwt.decode(token);
    if (decoded && (decoded.id || decoded._id)) {
      return {
        userId: decoded.id || decoded._id,
        role: decoded.role || 'student',
        email: decoded.email,
      };
    }
  } catch {}
  return { userId: null, role: null };
}

export async function GET(
  req: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const { courseId } = params;
    const { db } = await connectToDatabase();

    let courseFilter: any = courseId;
    try {
      courseFilter = new ObjectId(courseId);
    } catch {}

    const messages = await db
      .collection('chatmessages')
      .find({ course: courseFilter })
      .sort({ createdAt: 1 })
      .limit(200)
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
  try {
    const { userId, email } = getUserIdFromAuth(req);
    if (!userId) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 });
    }

    const { courseId } = params;
    const body = await req.json();
    const { message } = body;

    if (!message || !String(message).trim()) {
      return NextResponse.json({ success: false, message: 'Message content cannot be empty.' }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    let userObjId: any = userId;
    try {
      userObjId = new ObjectId(userId);
    } catch {}

    let user = await db.collection('users').findOne({ _id: userObjId });
    if (!user && email) {
      user = await db.collection('users').findOne({ email });
    }

    let courseObjId: any = courseId;
    try {
      courseObjId = new ObjectId(courseId);
    } catch {}

    const newMsg: any = {
      course: courseObjId,
      sender: user ? user._id : userObjId,
      senderName: user?.name || 'Student',
      senderRole: 'student',
      message: String(message).trim(),
      createdAt: new Date(),
    };

    const result = await db.collection('chatmessages').insertOne(newMsg);
    newMsg._id = result.insertedId;

    return NextResponse.json({ success: true, message: newMsg });
  } catch (err: any) {
    console.error('API POST /student/course/:courseId/chat error:', err);
    return NextResponse.json({ success: false, message: 'Error sending message' }, { status: 500 });
  }
}
