import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { verifyAuth } from '@/lib/authGuard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/admin/courses/:id
 * Fast serverless endpoint to get course details, enrolled students, and submissions
 */
export async function GET(
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
      return NextResponse.json({ success: false, message: 'Invalid course ID format.' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const course = await db.collection('courses').findOne({ _id: new ObjectId(id) });

    if (!course) {
      return NextResponse.json({ success: false, message: 'Course not found.' }, { status: 404 });
    }

    const [students, taskSubmissions] = await Promise.all([
      db.collection('users')
        .find(
          { 'enrolledCourses.course': new ObjectId(id) },
          {
            projection: {
              name: 1,
              email: 1,
              phone: 1,
              address: 1,
              plainPasswordForAdmin: 1,
              status: 1,
              blockReason: 1,
              enrolledCourses: 1,
              createdAt: 1,
              cv: 1,
            },
          }
        )
        .toArray(),
      db.collection('tasksubmissions')
        .find({ course: new ObjectId(id) })
        .sort({ submittedAt: -1 })
        .toArray(),
    ]);

    return NextResponse.json(
      {
        success: true,
        course,
        students,
        taskSubmissions,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  } catch (err: any) {
    console.error('API GET /admin/courses/[id] error:', err);
    return NextResponse.json({ success: false, message: 'Failed to retrieve course details.' }, { status: 500 });
  }
}

/**
 * PUT /api/admin/courses/:id
 * Fast serverless course update (syllabus, demo videos, price, etc.)
 */
export async function PUT(
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
      return NextResponse.json({ success: false, message: 'Invalid course ID format.' }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const { db } = await connectToDatabase();

    // Remove immutable fields if present
    const updateData = { ...body };
    delete updateData._id;

    const result = await db.collection('courses').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    const updatedCourse = result?.value || await db.collection('courses').findOne({ _id: new ObjectId(id) });

    if (!updatedCourse) {
      return NextResponse.json({ success: false, message: 'Course not found.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Course updated successfully.',
      course: updatedCourse,
    });
  } catch (err: any) {
    console.error('API PUT /admin/courses/[id] error:', err);
    return NextResponse.json({ success: false, message: 'Failed to update course.' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/courses/:id
 * Delete a course
 */
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
      return NextResponse.json({ success: false, message: 'Invalid course ID format.' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const result = await db.collection('courses').deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, message: 'Course not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Course deleted successfully.' });
  } catch (err: any) {
    console.error('API DELETE /admin/courses/[id] error:', err);
    return NextResponse.json({ success: false, message: 'Failed to delete course.' }, { status: 500 });
  }
}
