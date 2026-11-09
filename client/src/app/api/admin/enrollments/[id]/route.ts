import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { verifyAuth } from '@/lib/authGuard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * DELETE /api/admin/enrollments/:id
 * Permanently deletes an enrollment, pulls course from user enrolledCourses,
 * and deletes student account if no other courses remain.
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
      return NextResponse.json({ success: false, message: 'Invalid enrollment ID format.' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const enrollment = await db.collection('enrollments').findOne({ _id: new ObjectId(id) });

    if (!enrollment) {
      return NextResponse.json({ success: false, message: 'Enrollment record not found.' }, { status: 404 });
    }

    // 1. Delete enrollment document from MongoDB
    await db.collection('enrollments').deleteOne({ _id: new ObjectId(id) });

    const courseIdObj = ObjectId.isValid(enrollment.course)
      ? new ObjectId(enrollment.course)
      : enrollment.course;

    // 2. If student user exists, remove course access
    if (enrollment.studentEmail) {
      const cleanEmail = enrollment.studentEmail.trim().toLowerCase();
      const user = await db.collection('users').findOne({ email: cleanEmail });

      if (user) {
        // Pull this course from user's enrolledCourses
        await db.collection('users').updateOne(
          { _id: user._id },
          {
            $pull: {
              enrolledCourses: { course: courseIdObj },
            },
          } as any
        );

        // Check if student has any other enrolled courses
        const refreshedUser = await db.collection('users').findOne({ _id: user._id });
        const remainingCourses = refreshedUser?.enrolledCourses || [];

        // If no other courses and role is student, delete user completely
        if (remainingCourses.length === 0 && user.role === 'student') {
          await db.collection('users').deleteOne({ _id: user._id });
        }

        // Delete any task submissions by this student for this course
        await db.collection('tasksubmissions').deleteMany({
          student: user._id,
          course: courseIdObj,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Student "${enrollment.studentName}" deleted from pending enrollments and removed from the course.`,
    });
  } catch (err: any) {
    console.error('Error deleting enrollment and student:', err);
    return NextResponse.json(
      { success: false, message: 'Error deleting student enrollment: ' + err.message },
      { status: 500 }
    );
  }
}
