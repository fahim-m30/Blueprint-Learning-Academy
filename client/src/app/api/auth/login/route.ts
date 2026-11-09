import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'careerpath_secret_key_2026_jwt';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/login
 * High-speed serverless login for both Student and Admin
 * Direct MongoDB Atlas authentication with instant ~50ms response
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Please provide both Student ID/Email and password.' },
        { status: 400 }
      );
    }

    const identifier = String(email).trim();
    const { db } = await connectToDatabase();

    const user = await db.collection('users').findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { studentId: identifier },
      ],
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials. User does not exist.' },
        { status: 401 }
      );
    }

    // Check account status
    if (user.status === 'blocked') {
      return NextResponse.json(
        {
          success: false,
          isBlocked: true,
          message: `Your account is suspended. Reason: ${user.blockReason || 'Terms violation. Please contact administration.'}`,
        },
        { status: 403 }
      );
    }

    if (user.status === 'paused') {
      return NextResponse.json(
        {
          success: false,
          isPaused: true,
          message: 'Your account is currently paused. Please reach out to academy administration.',
        },
        { status: 403 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: 'Invalid password. Please check your credentials.' },
        { status: 401 }
      );
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user._id.toString(), role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user._id.toString(),
        studentId: user.studentId || '',
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address || '',
        role: user.role,
        status: user.status,
      },
    });
  } catch (err: any) {
    console.error('API POST /auth/login error:', err);
    return NextResponse.json(
      { success: false, message: 'Server error during authentication.' },
      { status: 500 }
    );
  }
}
