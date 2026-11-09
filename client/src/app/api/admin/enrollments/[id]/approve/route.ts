import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { verifyAuth } from '@/lib/authGuard';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let pass = '';
  for (let i = 0; i < 8; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}

async function generateStudentId(db: any, course: any): Promise<string> {
  const year = String(new Date().getFullYear()).slice(-2);
  const session = String(course?.sessionNumber || '02').padStart(2, '0');

  let courseCode = '01';
  if (course?.courseCode) {
    courseCode = String(course.courseCode).padStart(2, '0');
  } else {
    const allCourses = await db.collection('courses').find({}).sort({ createdAt: 1 }).toArray();
    const idx = allCourses.findIndex((c: any) => c._id.toString() === course._id.toString());
    courseCode = String(idx >= 0 ? idx + 1 : 1).padStart(2, '0');
  }

  const prefix = `${year}${session}${courseCode}`;
  const existingCount = await db.collection('users').countDocuments({
    studentId: new RegExp(`^${prefix}`),
  });

  const serial = String(existingCount + 1).padStart(2, '0');
  return `${prefix}${serial}`;
}

async function sendWelcomeEmail(options: {
  studentName: string;
  studentEmail: string;
  studentId: string;
  courseTitle: string;
  rawPassword: string;
  whatsappGroupLink?: string;
  settings?: any;
}) {
  const { studentName, studentEmail, studentId, courseTitle, rawPassword, whatsappGroupLink, settings } = options;
  const loginUrl = 'https://blueprint-learning-academy.vercel.app/login';
  const currentYear = new Date().getFullYear();

  const emailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Welcome to Blueprint Learning Academy</title></head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="width:100%;padding:30px 10px 40px;box-sizing:border-box;">
    <div style="max-width:580px;margin:0 auto;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 15px 35px -5px rgba(15,23,42,0.08);">
      <div style="background:linear-gradient(135deg,#091224 0%,#0f274a 55%,#1e3a8a 100%);padding:36px 24px 28px;text-align:center;">
        <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:900;">Blueprint <span style="color:#ffb531;">Learning Academy</span></h1>
        <p style="margin:6px 0 0;color:#93c5fd;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.12em;">Bangladesh's #1 Practical Civil Engineering Academy</p>
      </div>
      <div style="padding:32px 28px;">
        <h2 style="margin:0 0 12px;font-size:20px;color:#0f172a;font-weight:800;">Congratulations, ${studentName}!</h2>
        <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#475569;">
          Your enrollment application and payment proof for <strong>${courseTitle}</strong> have been officially approved. Your student portal access is now fully active.
        </p>
        <div style="background:#f8fafc;border:2px dashed #93c5fd;border-radius:14px;padding:20px;margin-bottom:24px;">
          <h3 style="margin:0 0 14px;font-size:13px;color:#1e3a8a;text-transform:uppercase;letter-spacing:0.08em;font-weight:800;">Your Official Login Credentials</h3>
          <table style="width:100%;border-collapse:collapse;font-size:13px;">
            <tr><td style="padding:6px 0;color:#64748b;width:120px;font-weight:600;">Student ID:</td><td style="padding:6px 0;color:#0f172a;font-weight:800;font-family:monospace;font-size:15px;letter-spacing:0.05em;">${studentId}</td></tr>
            <tr><td style="padding:6px 0;color:#64748b;font-weight:600;">Login Email:</td><td style="padding:6px 0;color:#0f172a;font-weight:700;">${studentEmail}</td></tr>
            <tr><td style="padding:6px 0;color:#64748b;font-weight:600;">Temporary Password:</td><td style="padding:6px 0;color:#dc2626;font-weight:900;font-family:monospace;font-size:16px;">${rawPassword}</td></tr>
          </table>
        </div>
        <div style="text-align:center;margin-bottom:24px;">
          <a href="${loginUrl}?email=${encodeURIComponent(studentEmail)}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:800;font-size:14px;padding:14px 32px;border-radius:12px;box-shadow:0 8px 16px -2px rgba(37,99,235,0.4);">
            Log In to Student Dashboard &rarr;
          </a>
        </div>
        ${
          whatsappGroupLink
            ? `<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px;margin-bottom:20px;text-align:center;">
                <p style="margin:0 0 10px;font-size:13px;color:#166534;font-weight:700;">Join your official batch WhatsApp group:</p>
                <a href="${whatsappGroupLink}" style="display:inline-block;background:#16a34a;color:#ffffff;text-decoration:none;font-weight:700;font-size:12px;padding:10px 20px;border-radius:8px;">
                  Join Batch WhatsApp Group &rarr;
                </a>
              </div>`
            : ''
        }
      </div>
      <div style="background:#f8fafc;padding:20px;text-align:center;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8;">
        &copy; ${currentYear} Blueprint Learning Academy. All rights reserved.
      </div>
    </div>
  </div>
</body>
</html>
  `;

  const emailUser = settings?.gmailUser || process.env.EMAIL_USER || 'admin.blueprintlearning@gmail.com';
  const emailPass = settings?.gmailPass || process.env.EMAIL_PASS || 'ncpcooxwigjauknm';

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: emailUser, pass: emailPass },
    });

    const info = await transporter.sendMail({
      from: `"Blueprint Learning Academy" <${emailUser}>`,
      to: studentEmail,
      subject: `Welcome to Blueprint Learning Academy - ${courseTitle} Access Confirmed!`,
      html: emailHtml,
      text: `Welcome ${studentName}! Your course access for ${courseTitle} is active. Student ID: ${studentId}, Email: ${studentEmail}, Password: ${rawPassword}, Login URL: ${loginUrl}`,
    });

    return { success: true, messageId: info.messageId };
  } catch (err: any) {
    console.warn('Welcome email error:', err.message);
    return { success: false, error: err.message };
  }
}

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
      return NextResponse.json({ success: false, message: 'Invalid enrollment ID format.' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const enrollment = await db.collection('enrollments').findOne({ _id: new ObjectId(id) });

    if (!enrollment) {
      return NextResponse.json({ success: false, message: 'Enrollment record not found.' }, { status: 404 });
    }

    if (enrollment.status === 'approved') {
      return NextResponse.json({ success: false, message: 'This enrollment is already approved.' }, { status: 400 });
    }

    const course = await db.collection('courses').findOne({ _id: new ObjectId(enrollment.course) });
    if (!course) {
      return NextResponse.json({ success: false, message: 'Associated course does not exist.' }, { status: 400 });
    }

    const cleanEmail = enrollment.studentEmail.trim().toLowerCase();
    const existingUser = await db.collection('users').findOne({ email: cleanEmail });

    const durationDays = course.durationDays || 30;
    const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

    let studentId = existingUser?.studentId || enrollment.studentId;
    if (!studentId) {
      studentId = await generateStudentId(db, course);
    }

    let rawPassword = '';

    if (existingUser) {
      rawPassword = existingUser.plainPasswordForAdmin || generatePassword();
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(rawPassword, salt);

      const alreadyEnrolled = (existingUser.enrolledCourses || []).some(
        (e: any) => e.course?.toString() === course._id.toString()
      );

      const updateOps: any = {
        $set: {
          studentId,
          password: hashedPassword,
          plainPasswordForAdmin: rawPassword,
          status: 'active',
          updatedAt: new Date(),
        },
      };

      if (!alreadyEnrolled) {
        updateOps.$push = {
          enrolledCourses: {
            course: course._id,
            enrolledAt: new Date(),
            expiresAt,
            status: 'active',
          },
        };
      }

      await db.collection('users').updateOne({ _id: existingUser._id }, updateOps);
    } else {
      rawPassword = generatePassword();
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(rawPassword, salt);

      await db.collection('users').insertOne({
        name: enrollment.studentName,
        email: cleanEmail,
        studentId,
        phone: enrollment.studentPhone,
        address: enrollment.studentAddress || '',
        password: hashedPassword,
        plainPasswordForAdmin: rawPassword,
        role: 'student',
        status: 'active',
        enrolledCourses: [
          {
            course: course._id,
            enrolledAt: new Date(),
            expiresAt,
            status: 'active',
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    await db.collection('enrollments').updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status: 'approved',
          studentId,
          generatedPassword: rawPassword,
          approvedAt: new Date(),
          updatedAt: new Date(),
        },
      }
    );

    const siteSettings = await db.collection('sitesettings').findOne({});

    const emailResult = await sendWelcomeEmail({
      studentName: enrollment.studentName,
      studentEmail: cleanEmail,
      studentId,
      courseTitle: course.title,
      rawPassword,
      whatsappGroupLink: course.whatsappGroupLink,
      settings: siteSettings,
    });

    return NextResponse.json({
      success: true,
      message: `Enrollment confirmed! Credentials dispatched to ${cleanEmail}.`,
      credentials: {
        email: cleanEmail,
        studentId,
        password: rawPassword,
      },
      emailResult,
    });
  } catch (err: any) {
    console.error('Error approving enrollment:', err);
    return NextResponse.json({ success: false, message: 'Error approving enrollment.' }, { status: 500 });
  }
}
