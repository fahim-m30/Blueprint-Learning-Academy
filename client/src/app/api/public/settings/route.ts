import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { DEFAULT_SETTINGS } from '@/lib/initialData';
import { checkRateLimit } from '@/lib/rateLimiter';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const rateLimit = checkRateLimit(req, 150, 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { success: false, message: 'Too many requests. Please slow down.' },
      { status: 429 }
    );
  }

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
