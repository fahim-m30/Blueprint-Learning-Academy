import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { verifyAuth } from '@/lib/authGuard';
import nodemailer from 'nodemailer';

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
      return NextResponse.json({ success: false, message: 'Invalid enrollment ID format.' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const enrollment = await db.collection('enrollments').findOne({ _id: new ObjectId(id) });
    if (!enrollment) {
      return NextResponse.json({ success: false, message: 'Enrollment not found.' }, { status: 404 });
    }

    const course = await db.collection('courses').findOne({ _id: new ObjectId(enrollment.course) });
    const studentUser = await db.collection('users').findOne({ email: enrollment.studentEmail.toLowerCase() });
    const siteSettings = await db.collection('sitesettings').findOne({});

    const password = enrollment.generatedPassword || studentUser?.plainPasswordForAdmin || 'BLP-LEARN2026';
    const studentId = studentUser?.studentId || enrollment.studentId || 'BLP-STUDENT';
    const courseTitle = course?.title || enrollment.courseTitle || 'Blueprint Career Course';
    const studentName = enrollment.studentName;
    const studentEmail = enrollment.studentEmail;
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
        <h2 style="margin:0 0 12px;font-size:20px;color:#0f172a;font-weight:800;">Credentials Resent, ${studentName}!</h2>
        <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#475569;">
          Here are your official login credentials for <strong>${courseTitle}</strong>:
        </p>
        <div style="background:#f8fafc;border:2px dashed #93c5fd;border-radius:14px;padding:20px;margin-bottom:24px;">
          <h3 style="margin:0 0 14px;font-size:13px;color:#1e3a8a;text-transform:uppercase;letter-spacing:0.08em;font-weight:800;">Your Official Login Credentials</h3>
          <table style="width:100%;border-collapse:collapse;font-size:13px;">
            <tr><td style="padding:6px 0;color:#64748b;width:120px;font-weight:600;">Student ID:</td><td style="padding:6px 0;color:#0f172a;font-weight:800;font-family:monospace;font-size:15px;letter-spacing:0.05em;">${studentId}</td></tr>
            <tr><td style="padding:6px 0;color:#64748b;font-weight:600;">Login Email:</td><td style="padding:6px 0;color:#0f172a;font-weight:700;">${studentEmail}</td></tr>
            <tr><td style="padding:6px 0;color:#64748b;font-weight:600;">Password:</td><td style="padding:6px 0;color:#dc2626;font-weight:900;font-family:monospace;font-size:16px;">${password}</td></tr>
          </table>
        </div>
        <div style="text-align:center;margin-bottom:24px;">
          <a href="${loginUrl}?email=${encodeURIComponent(studentEmail)}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:800;font-size:14px;padding:14px 32px;border-radius:12px;box-shadow:0 8px 16px -2px rgba(37,99,235,0.4);">
            Log In to Student Dashboard &rarr;
          </a>
        </div>
      </div>
      <div style="background:#f8fafc;padding:20px;text-align:center;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8;">
        &copy; ${currentYear} Blueprint Learning Academy. All rights reserved.
      </div>
    </div>
  </div>
</body>
</html>
    `;

    const emailUser = siteSettings?.gmailUser || process.env.EMAIL_USER || 'admin.blueprintlearning@gmail.com';
    const emailPass = siteSettings?.gmailPass || process.env.EMAIL_PASS || 'ncpcooxwigjauknm';

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: emailUser, pass: emailPass },
    });

    await transporter.sendMail({
      from: `"Blueprint Learning Academy" <${emailUser}>`,
      to: studentEmail,
      subject: `Blueprint Learning Academy Credentials - ${courseTitle}`,
      html: emailHtml,
      text: `Hello ${studentName}! Your credentials: Student ID: ${studentId}, Email: ${studentEmail}, Password: ${password}, Login URL: ${loginUrl}`,
    });

    return NextResponse.json({ success: true, message: 'Credentials email resent successfully!' });
  } catch (err: any) {
    console.error('Error resending email:', err);
    return NextResponse.json({ success: false, message: 'Error resending credentials email: ' + err.message }, { status: 500 });
  }
}
