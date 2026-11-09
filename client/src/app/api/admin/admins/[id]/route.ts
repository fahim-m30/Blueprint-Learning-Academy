import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { verifyAuth } from '@/lib/authGuard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function DELETE(
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
      return NextResponse.json(
        { success: false, message: 'Invalid admin ID format.' },
        { status: 400 }
      );
    }

    if (auth.user._id === id) {
      return NextResponse.json(
        { success: false, message: 'You cannot delete your own administrator account.' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    const totalAdmins = await db.collection('users').countDocuments({ role: 'admin' });
    if (totalAdmins <= 1) {
      return NextResponse.json(
        { success: false, message: 'Cannot delete the only remaining administrator.' },
        { status: 400 }
      );
    }

    const res = await db.collection('users').deleteOne({ _id: new ObjectId(id), role: 'admin' });
    if (res.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'Admin account not found or already deleted.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Administrator account deleted successfully.',
    });
  } catch (err: any) {
    console.error('Error deleting admin:', err);
    return NextResponse.json(
      { success: false, message: 'Error deleting administrator account.' },
      { status: 500 }
    );
  }
}
