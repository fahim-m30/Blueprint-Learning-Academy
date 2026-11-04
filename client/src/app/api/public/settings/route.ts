import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { DEFAULT_SETTINGS } from '@/lib/initialData';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    let settings = await db.collection('sitesettings').findOne({});

    if (!settings) {
      return NextResponse.json({ success: true, settings: DEFAULT_SETTINGS });
    }

    // Ensure heroBengaliNote is valid Bengali and never contains question marks
    const bengaliFallback = 'সাইটে কাজ করার বাস্তব জ্ঞান, চাকরির প্রস্তুতি ও ক্যারিয়ার গড়ার পথ।';
    if (
      !settings.heroBengaliNote ||
      settings.heroBengaliNote.includes('?') ||
      !/[\u0980-\u09FF]/.test(settings.heroBengaliNote)
    ) {
      settings.heroBengaliNote = bengaliFallback;
    }

    return NextResponse.json({
      success: true,
      settings: {
        ...DEFAULT_SETTINGS,
        ...settings,
      },
    });
  } catch (err: any) {
    console.error('Error fetching public settings:', err);
    return NextResponse.json({ success: true, settings: DEFAULT_SETTINGS });
  }
}
