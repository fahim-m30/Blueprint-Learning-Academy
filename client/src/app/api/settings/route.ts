import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { DEFAULT_SETTINGS } from '@/lib/initialData';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const settings = await db.collection('sitesettings').findOne({});

    const bengaliFallback = 'সাইটে কাজ করার বাস্তব জ্ঞান, চাকরির প্রস্তুতি ও ক্যারিয়ার গড়ার পথ।';
    const finalSettings = {
      ...DEFAULT_SETTINGS,
      ...(settings || {}),
    };

    if (
      !finalSettings.heroBengaliNote ||
      finalSettings.heroBengaliNote.includes('?') ||
      !/[\u0980-\u09FF]/.test(finalSettings.heroBengaliNote)
    ) {
      finalSettings.heroBengaliNote = bengaliFallback;
    }

    return NextResponse.json({ success: true, settings: finalSettings });
  } catch (err: any) {
    console.error('Error fetching admin settings:', err);
    return NextResponse.json({ success: false, message: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { db } = await connectToDatabase();

    // Sanitize heroBengaliNote if corrupt
    const bengaliFallback = 'সাইটে কাজ করার বাস্তব জ্ঞান, চাকরির প্রস্তুতি ও ক্যারিয়ার গড়ার পথ।';
    if (
      body.heroBengaliNote &&
      (body.heroBengaliNote.includes('?') || !/[\u0980-\u09FF]/.test(body.heroBengaliNote))
    ) {
      body.heroBengaliNote = bengaliFallback;
    }

    delete body._id;

    await db.collection('sitesettings').updateOne(
      {},
      { $set: { ...body, updatedAt: new Date() } },
      { upsert: true }
    );

    const updated = await db.collection('sitesettings').findOne({});
    return NextResponse.json({ success: true, settings: updated, message: 'Settings updated successfully' });
  } catch (err: any) {
    console.error('Error updating admin settings:', err);
    return NextResponse.json({ success: false, message: 'Failed to update settings' }, { status: 500 });
  }
}
