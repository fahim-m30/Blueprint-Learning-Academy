import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { verifyAuth } from '@/lib/authGuard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(
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
    const {
      title,
      classDate,
      classTime,
      meetingLink,
      googleMeetLink,
      youtubeLink,
      facebookLink,
      additionalLinks,
      platform,
      note,
    } = body;

    const primaryLink = googleMeetLink || meetingLink || youtubeLink || facebookLink;

    if (!title || !classDate || !classTime || !primaryLink) {
      return NextResponse.json(
        { success: false, message: 'Please provide live class title, date, time, and at least one meeting/stream link (Google Meet, YouTube, or Facebook).' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const newLiveClass = {
      _id: new ObjectId(),
      title: String(title).trim(),
      classDate: new Date(classDate),
      classTime: String(classTime).trim(),
      meetingLink: String(primaryLink).trim(),
      googleMeetLink: googleMeetLink ? String(googleMeetLink).trim() : (meetingLink ? String(meetingLink).trim() : ''),
      youtubeLink: youtubeLink ? String(youtubeLink).trim() : '',
      facebookLink: facebookLink ? String(facebookLink).trim() : '',
      additionalLinks: Array.isArray(additionalLinks) ? additionalLinks : [],
      platform: platform || (googleMeetLink ? 'Google Meet' : (youtubeLink ? 'YouTube Live' : (facebookLink ? 'Facebook Live' : 'Online Session'))),
      note: note ? String(note).trim() : '',
      isCompleted: false,
      createdAt: new Date(),
    };

    await db.collection('courses').updateOne(
      { _id: new ObjectId(id) },
      { $push: { liveClasses: newLiveClass as any } }
    );

    const updatedCourse = await db.collection('courses').findOne({ _id: new ObjectId(id) });

    return NextResponse.json({
      success: true,
      message: 'Google Meet live class scheduled successfully.',
      liveClass: newLiveClass,
      course: updatedCourse,
    }, { status: 201 });
  } catch (err: any) {
    console.error('Error creating live class:', err);
    return NextResponse.json({ success: false, message: 'Error scheduling live class.' }, { status: 500 });
  }
}
