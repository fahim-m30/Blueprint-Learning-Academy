import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { verifyAuth } from '@/lib/authGuard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await verifyAuth(req, { requiredRole: 'admin' });
  if (!auth.success) {
    return auth.response;
  }

  try {
    const { id } = params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: 'Invalid enrollment ID format.' }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const { notes } = body;

    const { db } = await connectToDatabase();
    const res = await db.collection('enrollments').updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status: 'rejected',
          notes: notes || 'Transaction ID not verified or payment mismatched.',
          updatedAt: new Date(),
        },
      }
    );

    if (res.matchedCount === 0) {
      return NextResponse.json({ success: false, message: 'Enrollment record not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Enrollment marked as rejected.' });
  } catch (err: any) {
    console.error('Error rejecting enrollment:', err);
    return NextResponse.json({ success: false, message: 'Error rejecting enrollment.' }, { status: 500 });
  }
}
