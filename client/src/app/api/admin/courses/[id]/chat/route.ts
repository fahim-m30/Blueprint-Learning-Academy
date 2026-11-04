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
    if (decoded && (decoded.id || decoded._id)) {
      return { userId: decoded.id || decoded._id, role: decoded.role || 'admin' };
    }
  } catch {}
  return { userId: null, role: null };
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { db } = await connectToDatabase();

    let courseFilter: any = id;
    try {
      courseFilter = new ObjectId(id);
    } catch {}

    const messages = await db
      .collection('chatmessages')
      .find({ course: courseFilter })
      .sort({ createdAt: 1 })
      .limit(200)
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
  try {
    const { userId } = getUserIdFromAuth(req);
    if (!userId) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    const { message } = body;

    if (!message || !String(message).trim()) {
      return NextResponse.json({ success: false, message: 'Message cannot be empty' }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    let courseObjId: any = id;
    try {
      courseObjId = new ObjectId(id);
    } catch {}

    let userObjId: any = userId;
    try {
      userObjId = new ObjectId(userId);
    } catch {}

    const newMsg: any = {
      course: courseObjId,
      sender: userObjId,
      senderName: 'Admin / Instructor',
      senderRole: 'admin',
      message: String(message).trim(),
      createdAt: new Date(),
    };

    const result = await db.collection('chatmessages').insertOne(newMsg);
    newMsg._id = result.insertedId;

    return NextResponse.json({ success: true, message: newMsg });
  } catch (err: any) {
    console.error('API POST /admin/courses/:id/chat error:', err);
    return NextResponse.json({ success: false, message: 'Error posting admin message' }, { status: 500 });
  }
}
