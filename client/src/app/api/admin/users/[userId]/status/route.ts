import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { verifyAuth, isValidObjectId } from '@/lib/authGuard';
import { checkRateLimit } from '@/lib/rateLimiter';
import { sendAccountBlockedEmail, sendAccountUnblockedEmail } from '@/lib/mailer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  // 1. Rate limiting protection (Max 30 status changes per minute)
  const rateLimit = checkRateLimit(req, 30, 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { success: false, message: 'Too many requests. Please slow down.' },
      { status: 429 }
    );
  }

  // 2. Cryptographic Admin Authentication Guard
  const auth = await verifyAuth(req, { requiredRole: 'admin' });
  if (!auth.success) {
    return auth.response;
  }

  const { userId } = params;
  if (!isValidObjectId(userId)) {
    return NextResponse.json({ success: false, message: 'Invalid target user ID format.' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { status, blockReason } = body;

    if (!['active', 'paused', 'blocked'].includes(status)) {
      return NextResponse.json({ success: false, message: 'Invalid status specified' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });

    if (!user) {
      return NextResponse.json({ success: false, message: 'Student user not found' }, { status: 404 });
    }

    // Security check: Prevent blocking other admins
    if (user.role === 'admin') {
      return NextResponse.json({ success: false, message: 'Cannot modify status of administrator accounts.' }, { status: 403 });
    }

    let emailDispatched = false;
    let newBlockReason = '';

    if (status === 'blocked') {
      newBlockReason = blockReason ? String(blockReason).trim() : 'Policy violation or disciplinary restriction.';
      await db.collection('users').updateOne(
        { _id: user._id },
        { $set: { status: 'blocked', blockReason: newBlockReason, updatedAt: new Date() } }
      );

      // Send official Blocked Email immediately
      try {
        const mailRes = await sendAccountBlockedEmail({
          studentName: user.name || 'Student',
          studentEmail: user.email,
          reason: newBlockReason,
        });
        emailDispatched = mailRes?.success === true;
      } catch (err: any) {
        console.error('Failed to send blocked email:', err);
      }
    } else if (status === 'active') {
      newBlockReason = '';
      await db.collection('users').updateOne(
        { _id: user._id },
        { $set: { status: 'active', blockReason: '', updatedAt: new Date() } }
      );

      // Send official Unblocked / Reinstatement Email immediately
      try {
        const mailRes = await sendAccountUnblockedEmail({
          studentName: user.name || 'Student',
          studentEmail: user.email,
        });
        emailDispatched = mailRes?.success === true;
      } catch (err: any) {
        console.error('Failed to send unblocked email:', err);
      }
    } else {
      await db.collection('users').updateOne(
        { _id: user._id },
        { $set: { status, updatedAt: new Date() } }
      );
    }

    const updatedUser = await db.collection('users').findOne(
      { _id: user._id },
      { projection: { password: 0, plainPasswordForAdmin: 0, 'cv.fileData': 0 } }
    );

    return NextResponse.json({
      success: true,
      emailDispatched,
      message:
        status === 'blocked'
          ? `User suspended and blocked successfully!${emailDispatched ? ` Official notice email sent to ${user.email}.` : ''}`
          : status === 'active'
          ? `User unblocked and reinstated to Active!${emailDispatched ? ` Confirmation email sent to ${user.email}.` : ''}`
          : `User status updated to ${status}.`,
      user: updatedUser,
    });
  } catch (err: any) {
    console.error('API POST /admin/users/:userId/status error:', err);
    return NextResponse.json({ success: false, message: 'Error changing user status: ' + err.message }, { status: 500 });
  }
}
