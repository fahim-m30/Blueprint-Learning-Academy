import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { verifyAuth } from '@/lib/authGuard';
import { checkRateLimit } from '@/lib/rateLimiter';
import bcrypt from 'bcryptjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/profile
 * Retrieves the currently authenticated administrator's profile information
 */
export async function GET(req: NextRequest) {
  const auth = await verifyAuth(req, { requiredRole: 'admin' });
  if (!auth.success) {
    return auth.response;
  }

  try {
    const { db } = await connectToDatabase();
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(auth.user._id) },
      { projection: { password: 0, plainPasswordForAdmin: 0, 'cv.fileData': 0 } }
    );

    if (!user) {
      return NextResponse.json({ success: false, message: 'Administrator profile not found.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      profile: {
        _id: user._id.toString(),
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        role: user.role || 'admin',
        status: user.status || 'active',
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (err: any) {
    console.error('API GET /admin/profile error:', err);
    return NextResponse.json({ success: false, message: 'Failed to load administrator profile.' }, { status: 500 });
  }
}

/**
 * PUT /api/admin/profile
 * Updates the administrator's personal information (Name, Email, Phone, Address, Password)
 */
export async function PUT(req: NextRequest) {
  // Rate limiting (max 15 profile edits per minute)
  const rateLimit = checkRateLimit(req, 15, 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { success: false, message: 'Too many requests. Please slow down.' },
      { status: 429 }
    );
  }

  const auth = await verifyAuth(req, { requiredRole: 'admin' });
  if (!auth.success) {
    return auth.response;
  }

  try {
    const body = await req.json();
    const { name, email, phone, address, currentPassword, newPassword } = body;

    const { db } = await connectToDatabase();
    const currentAdmin = await db.collection('users').findOne({ _id: new ObjectId(auth.user._id) });

    if (!currentAdmin) {
      return NextResponse.json({ success: false, message: 'Administrator account not found.' }, { status: 404 });
    }

    const updates: Record<string, any> = {
      updatedAt: new Date(),
    };

    // 1. Validate and update Name
    if (name !== undefined) {
      const trimmedName = String(name).trim();
      if (!trimmedName) {
        return NextResponse.json({ success: false, message: 'Name cannot be empty.' }, { status: 400 });
      }
      updates.name = trimmedName;
    }

    // 2. Validate and update Phone
    if (phone !== undefined) {
      const trimmedPhone = String(phone).trim();
      if (!trimmedPhone) {
        return NextResponse.json({ success: false, message: 'Phone number cannot be empty.' }, { status: 400 });
      }
      updates.phone = trimmedPhone;
    }

    // 3. Validate and update Address
    if (address !== undefined) {
      updates.address = String(address).trim();
    }

    // 4. Validate and update Email (check uniqueness)
    if (email !== undefined) {
      const trimmedEmail = String(email).toLowerCase().trim();
      if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        return NextResponse.json({ success: false, message: 'Please provide a valid email address.' }, { status: 400 });
      }

      if (trimmedEmail !== currentAdmin.email) {
        const existing = await db.collection('users').findOne({
          email: trimmedEmail,
          _id: { $ne: currentAdmin._id },
        });

        if (existing) {
          return NextResponse.json(
            { success: false, message: 'This email is already in use by another account.' },
            { status: 400 }
          );
        }
        updates.email = trimmedEmail;
      }
    }

    // 5. Password update (if requested)
    let passwordChanged = false;
    if (newPassword) {
      if (typeof newPassword !== 'string' || newPassword.length < 6) {
        return NextResponse.json(
          { success: false, message: 'New password must be at least 6 characters long.' },
          { status: 400 }
        );
      }

      if (!currentPassword) {
        return NextResponse.json(
          { success: false, message: 'Please enter your current password to authorize this change.' },
          { status: 400 }
        );
      }

      // Verify current password
      const isMatch = await bcrypt.compare(currentPassword, currentAdmin.password);
      if (!isMatch) {
        return NextResponse.json(
          { success: false, message: 'Current password does not match.' },
          { status: 400 }
        );
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      updates.password = hashedPassword;
      updates.plainPasswordForAdmin = newPassword;
      passwordChanged = true;
    }

    await db.collection('users').updateOne(
      { _id: currentAdmin._id },
      { $set: updates }
    );

    const updatedUser = await db.collection('users').findOne(
      { _id: currentAdmin._id },
      { projection: { password: 0, plainPasswordForAdmin: 0, 'cv.fileData': 0 } }
    );

    return NextResponse.json({
      success: true,
      message: passwordChanged
        ? 'Profile and password updated successfully!'
        : 'Profile updated successfully!',
      passwordChanged,
      user: {
        _id: updatedUser?._id.toString(),
        name: updatedUser?.name,
        email: updatedUser?.email,
        phone: updatedUser?.phone,
        address: updatedUser?.address,
        role: updatedUser?.role,
        status: updatedUser?.status,
      },
    });
  } catch (err: any) {
    console.error('API PUT /admin/profile error:', err);
    return NextResponse.json({ success: false, message: 'Error updating profile: ' + err.message }, { status: 500 });
  }
}
