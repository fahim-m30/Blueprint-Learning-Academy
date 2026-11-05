import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

const JWT_SECRET = process.env.JWT_SECRET || 'careerpath_secret_key_2026_jwt';

export interface AuthenticatedUser {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'student';
  status: string;
}

export function isValidObjectId(id: string): boolean {
  return typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id.trim());
}

/**
 * Cryptographic JWT & Database Authentication Guard
 * 1. Checks Authorization: Bearer <token>
 * 2. Cryptographically verifies token signature with HMAC-SHA256 (prevents forged tokens)
 * 3. Validates expiration timestamp
 * 4. Checks MongoDB to ensure user exists and is not blocked
 * 5. Strictly enforces required role (admin or student)
 */
export async function verifyAuth(
  req: NextRequest,
  options: { requiredRole?: 'admin' | 'student'; allowBlocked?: boolean } = {}
): Promise<
  | { success: true; user: AuthenticatedUser }
  | { success: false; response: NextResponse }
> {
  const authHeader = req.headers.get('authorization') || '';
  if (!authHeader.startsWith('Bearer ')) {
    return {
      success: false,
      response: NextResponse.json(
        { success: false, message: 'Authentication required. Missing Bearer token.' },
        { status: 401 }
      ),
    };
  }

  const token = authHeader.split(' ')[1]?.trim();
  if (!token) {
    return {
      success: false,
      response: NextResponse.json(
        { success: false, message: 'Invalid token format.' },
        { status: 401 }
      ),
    };
  }

  let decoded: any = null;
  try {
    // Strictly verify cryptographic HMAC-SHA256 signature
    decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
  } catch (err: any) {
    return {
      success: false,
      response: NextResponse.json(
        { success: false, message: 'Invalid or expired authentication token: ' + err.message },
        { status: 401 }
      ),
    };
  }

  const userId = decoded?.id || decoded?._id;
  if (!userId || !isValidObjectId(userId)) {
    return {
      success: false,
      response: NextResponse.json(
        { success: false, message: 'Malformed authentication token payload.' },
        { status: 401 }
      ),
    };
  }

  try {
    const { db } = await connectToDatabase();
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(userId) },
      { projection: { password: 0, plainPasswordForAdmin: 0 } }
    );

    if (!user) {
      return {
        success: false,
        response: NextResponse.json(
          { success: false, message: 'User account does not exist or has been deleted.' },
          { status: 401 }
        ),
      };
    }

    // Blocked check: If user account is suspended/blocked, reject immediately
    if (!options.allowBlocked && user.status === 'blocked') {
      return {
        success: false,
        response: NextResponse.json(
          {
            success: false,
            message: `Account is suspended. Reason: "${user.blockReason || 'Access restricted by academy administration'}"`,
            isBlocked: true,
          },
          { status: 403 }
        ),
      };
    }

    // Role check: If specific role is required (e.g. 'admin')
    if (options.requiredRole && user.role !== options.requiredRole) {
      return {
        success: false,
        response: NextResponse.json(
          { success: false, message: `Access denied. Requires ${options.requiredRole} privileges.` },
          { status: 403 }
        ),
      };
    }

    return {
      success: true,
      user: {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    };
  } catch (dbErr: any) {
    console.error('Auth verification database error:', dbErr);
    return {
      success: false,
      response: NextResponse.json(
        { success: false, message: 'Internal authentication error.' },
        { status: 500 }
      ),
    };
  }
}
