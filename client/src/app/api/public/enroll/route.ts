import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { checkRateLimit } from '@/lib/rateLimiter';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * POST /api/public/enroll
 * Fast serverless endpoint to submit student course enrollment with payment TrxID
 */
export async function POST(req: NextRequest) {
  // Rate Limiting Protection (Max 15 enrollment submissions/min per IP)
  const rateLimit = checkRateLimit(req, 15, 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { success: false, message: 'Too many enrollment submissions. Please wait a minute and try again.' },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const {
      studentName,
      studentEmail,
      studentPhone,
      studentAddress,
      courseId,
      paymentMethod,
      senderNumber,
      transactionId,
      notes,
    } = body;

    if (!studentName || !studentEmail || !studentPhone || !courseId || !transactionId || !senderNumber) {
      return NextResponse.json(
        {
          success: false,
          message: 'Please provide full name, email, mobile number, course, sender number, and transaction ID (TrxID).',
        },
        { status: 400 }
      );
    }

    if (!ObjectId.isValid(courseId)) {
      return NextResponse.json({ success: false, message: 'Invalid course ID.' }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    const course = await db.collection('courses').findOne({ _id: new ObjectId(courseId) });
    if (!course) {
      return NextResponse.json({ success: false, message: 'Selected course not found.' }, { status: 404 });
    }

    const cleanTrx = transactionId.trim().toUpperCase();

    // Check if duplicate pending or approved transaction ID exists
    const existing = await db.collection('enrollments').findOne({
      transactionId: cleanTrx,
      status: { $in: ['pending', 'approved'] },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          message: 'This Transaction ID (TrxID) has already been submitted and is currently under review or approved.',
        },
        { status: 400 }
      );
    }

    const newEnrollment = {
      course: course._id,
      courseTitle: course.title,
      coursePrice: course.price || 0,
      amount: course.price || 0,
      studentName: studentName.trim(),
      studentEmail: studentEmail.trim().toLowerCase(),
      studentPhone: studentPhone.trim(),
      studentAddress: studentAddress ? studentAddress.trim() : '',
      paymentMethod: paymentMethod || 'bKash',
      senderNumber: senderNumber.trim(),
      transactionId: cleanTrx,
      notes: notes ? notes.trim() : '',
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('enrollments').insertOne(newEnrollment);

    return NextResponse.json(
      {
        success: true,
        message: 'Your enrollment application and payment proof have been submitted successfully. Admin will verify and send your login credentials via email.',
        enrollmentId: result.insertedId,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('Error submitting enrollment:', err);
    return NextResponse.json(
      { success: false, message: 'Error processing enrollment. Please try again.' },
      { status: 500 }
    );
  }
}
