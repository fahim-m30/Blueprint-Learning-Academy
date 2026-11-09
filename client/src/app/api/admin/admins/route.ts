import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { verifyAuth } from '@/lib/authGuard';
import bcrypt from 'bcryptjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const auth = await verifyAuth(req, { requiredRole: 'admin' });
  if (!auth.success) {
    return auth.response;
  }

  try {
    const { db } = await connectToDatabase();
    const admins = await db
      .collection('users')
      .find({ role: 'admin' })
      .project({
        name: 1,
        email: 1,
        phone: 1,
        status: 1,
        plainPasswordForAdmin: 1,
        createdAt: 1,
      })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ success: true, admins });
  } catch (err: any) {
    console.error('Error retrieving admin list:', err);
    return NextResponse.json(
      { success: false, message: 'Error retrieving administrator list.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await verifyAuth(req, { requiredRole: 'admin' });
  if (!auth.success) {
    return auth.response;
  }

  try {
    const body = await req.json();
    const { name, email, phone, password } = body;

    if (!name || !email || !password || !phone) {
      return NextResponse.json(
        {
          success: false,
          message: 'Please provide full name, email, phone number, and password for the new admin.',
        },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 6 characters.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const { db } = await connectToDatabase();

    const existing = await db.collection('users').findOne({ email: cleanEmail });
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'An account with this email address already exists.' },
        { status: 400 }
      );
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newAdmin = {
      name: name.trim(),
      email: cleanEmail,
      phone: phone.trim(),
      password: hashedPassword,
      plainPasswordForAdmin: password,
      role: 'admin',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('users').insertOne(newAdmin);

    return NextResponse.json({
      success: true,
      message: `Administrator "${name}" created successfully.`,
      admin: {
        _id: result.insertedId,
        name: newAdmin.name,
        email: newAdmin.email,
        phone: newAdmin.phone,
        status: newAdmin.status,
        plainPasswordForAdmin: newAdmin.plainPasswordForAdmin,
        createdAt: newAdmin.createdAt,
      },
    });
  } catch (err: any) {
    console.error('Error creating admin:', err);
    return NextResponse.json(
      { success: false, message: 'Error creating administrator account.' },
      { status: 500 }
    );
  }
}
