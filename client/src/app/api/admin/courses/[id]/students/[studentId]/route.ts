import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { verifyAuth } from '@/lib/authGuard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * DELETE /api/admin/courses/:id/students/:studentId
 * Removes student from this course, deletes course enrollments,
 * and deletes user account if they have no other courses.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; studentId: string } }
) {
  const auth = await verifyAuth(req, { requiredRole: 'admin' });
  if (!auth.success) {
    return auth.response;
  }

  try {
    const { id, studentId } = params;
    if (!ObjectId.isValid(id) || !ObjectId.isValid(studentId)) {
      return NextResponse.json({ success: false, message: 'Invalid ID format.' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const student = await db.collection('users').findOne({ _id: new ObjectId(studentId) });

    if (!student) {
      return NextResponse.json({ success: false, message: 'Student not found.' }, { status: 404 });
    }

    // 1. Pull course from enrolledCourses
    await db.collection('users').updateOne(
      { _id: new ObjectId(studentId) },
      {
        $pull: {
          enrolledCourses: { course: new ObjectId(id) },
        },
      } as any
    );

    // 2. Delete enrollment record for this student and course
    await db.collection('enrollments').deleteMany({
      $or: [
        { studentEmail: student.email, course: new ObjectId(id) },
        { studentEmail: student.email, course: id }
      ]
    });

    // 3. Delete task submissions for this course
    await db.collection('tasksubmissions').deleteMany({
      student: new ObjectId(studentId),
      course: new ObjectId(id)
    });

    // 4. If no remaining courses and role is student, clean up user
    const refreshed = await db.collection('users').findOne({ _id: new ObjectId(studentId) });
    if ((!refreshed?.enrolledCourses || refreshed.enrolledCourses.length === 0) && student.role === 'student') {
      await db.collection('users').deleteOne({ _id: new ObjectId(studentId) });
    }

    return NextResponse.json({
      success: true,
      message: `Student "${student.name}" removed from this course successfully.`
    });
  } catch (err: any) {
    console.error('Error removing student from course:', err);
    return NextResponse.json(
      { success: false, message: 'Error removing student from course: ' + err.message },
      { status: 500 }
    );
  }
}
