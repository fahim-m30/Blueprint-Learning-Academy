import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';
import { sendAccountBlockedEmail, sendAccountUnblockedEmail } from '@/lib/mailer';

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

export async function POST(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId: authAdminId, role } = getUserIdFromAuth(req);
    if (!authAdminId || role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Admin authentication required' }, { status: 401 });
    }

    const { userId } = params;
    const body = await req.json();
    const { status, blockReason } = body;

    if (!['active', 'paused', 'blocked'].includes(status)) {
      return NextResponse.json({ success: false, message: 'Invalid status specified' }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    let user = null;
    try {
      user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    } catch {
      user = await db.collection('users').findOne({ email: userId });
    }

    if (!user) {
      return NextResponse.json({ success: false, message: 'Student user not found' }, { status: 404 });
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
      { projection: { password: 0 } }
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
