import nodemailer from 'nodemailer';
import { connectToDatabase } from '@/lib/mongodb';

const PUBLIC_LOGO_URL = 'https://blueprint-learning-academy.vercel.app/icon.png?v=8';

async function getEmailConfig() {
  try {
    const { db } = await connectToDatabase();
    const settings = await db.collection('sitesettings').findOne({});
    return {
      gmailUser: settings?.gmailUser || process.env.EMAIL_USER || 'admin.blueprintlearning@gmail.com',
      gmailPass: settings?.gmailPass || process.env.EMAIL_PASS || 'ncpcooxwigjauknm',
      fromName: 'Blueprint Learning Academy',
      smtpHost: settings?.smtpHost || process.env.SMTP_HOST || 'smtp-relay.brevo.com',
      smtpPort: Number(settings?.smtpPort) || Number(process.env.SMTP_PORT) || 587,
      smtpUser: settings?.smtpUser || process.env.SMTP_USER,
      smtpPass: settings?.smtpPass || process.env.SMTP_PASS,
    };
  } catch (err) {
    return {
      gmailUser: process.env.EMAIL_USER || 'admin.blueprintlearning@gmail.com',
      gmailPass: process.env.EMAIL_PASS || 'ncpcooxwigjauknm',
      fromName: 'Blueprint Learning Academy',
      smtpHost: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
      smtpPort: Number(process.env.SMTP_PORT) || 587,
      smtpUser: process.env.SMTP_USER,
      smtpPass: process.env.SMTP_PASS,
    };
  }
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const config = await getEmailConfig();
  const fromAddress = `"${config.fromName}" <${config.gmailUser}>`;

  // 1. Try Gmail Transporter
  if (config.gmailUser && config.gmailPass) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: config.gmailUser,
          pass: config.gmailPass,
        },
      });

      const info = await transporter.sendMail({
        from: fromAddress,
        to,
        subject,
        html,
        text: text || '',
        replyTo: config.gmailUser,
        headers: {
          'X-Entity-Ref-ID': `BLP-${Date.now()}`,
        },
      });

      console.log('✅ Email sent via Gmail to:', to, 'ID:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (err: any) {
      console.warn('⚠️ Gmail delivery failed, trying SMTP fallback:', err.message);
    }
  }

  // 2. Try SMTP Fallback (Brevo)
  if (config.smtpHost && config.smtpUser && config.smtpPass) {
    try {
      const smtpTransporter = nodemailer.createTransport({
        host: config.smtpHost,
        port: config.smtpPort,
        secure: false,
        auth: {
          user: config.smtpUser,
          pass: config.smtpPass,
        },
      });

      const info = await smtpTransporter.sendMail({
        from: fromAddress,
        to,
        subject,
        html,
        text: text || '',
        replyTo: config.gmailUser,
        headers: {
          'X-Entity-Ref-ID': `BLP-${Date.now()}`,
        },
      });

      console.log('✅ Email sent via SMTP to:', to, 'ID:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (err: any) {
      console.error('❌ SMTP delivery failed:', err.message);
      return { success: false, error: err.message };
    }
  }

  return { success: false, error: 'No email configuration available' };
}

/**
 * Send official account suspension notice email with reason
 */
export async function sendAccountBlockedEmail({
  studentName,
  studentEmail,
  reason,
}: {
  studentName: string;
  studentEmail: string;
  reason: string;
}) {
  const currentYear = new Date().getFullYear();

  const text = `Hello ${studentName},

This is an official notice regarding your student account access at Blueprint Learning Academy.

Your student dashboard access has been temporarily restricted by the academy administration.

Official Reason Provided:
"${reason}"

If you believe this is an error or wish to clear your account status, please contact our support desk directly:
• WhatsApp Support: https://wa.me/8801313916161
• Direct Helpline: +880 1313-916161 | +880 1313-893838

Blueprint Learning Academy
Practical Engineering & Real Estate Career Development
Dhaka, Bangladesh`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Account Status Notice - Blueprint Learning Academy</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #334155;
    }
    .wrapper {
      width: 100%;
      background-color: #f1f5f9;
      padding: 30px 10px 40px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 20px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
      box-shadow: 0 15px 35px -5px rgba(15, 23, 42, 0.08);
    }
    .header-banner {
      background: linear-gradient(135deg, #450a0a 0%, #7f1d1d 55%, #991b1b 100%);
      padding: 36px 24px 28px;
      text-align: center;
    }
    .logo-container {
      width: 82px;
      height: 82px;
      margin: 0 auto 14px;
      border-radius: 50%;
      border: 3px solid #fca5a5;
      background-color: #ffffff;
      overflow: hidden;
      display: inline-block;
    }
    .logo-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      border-radius: 50%;
    }
    .content-body {
      padding: 32px 30px;
    }
    .reason-card {
      background-color: #fef2f2;
      border: 1.5px solid #fecaca;
      border-left: 5px solid #dc2626;
      border-radius: 12px;
      padding: 16px 20px;
      margin: 20px 0;
    }
    .footer {
      background-color: #091224;
      padding: 24px 20px;
      text-align: center;
      color: #94a3b8;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header-banner">
        <div class="logo-container">
          <img src="${PUBLIC_LOGO_URL}" alt="Blueprint Learning Academy" class="logo-img" width="82" height="82" />
        </div>
        <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 900;">
          Blueprint <span style="color: #fca5a5;">Learning Academy</span>
        </h1>
        <p style="color: #fecaca; margin: 6px 0 0; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em;">
          Important Student Account Notice
        </p>
      </div>

      <div class="content-body">
        <h2 style="color: #991b1b; margin-top: 0; font-size: 20px; font-weight: 900;">
          Account Access Suspended
        </h2>
        <p style="color: #475569; font-size: 14px; line-height: 1.6;">
          Dear <strong>${studentName}</strong>,
        </p>
        <p style="color: #475569; font-size: 14px; line-height: 1.6;">
          Your student dashboard access has been temporarily restricted by the academy administration.
        </p>

        <div class="reason-card">
          <div style="font-size: 11px; font-weight: 800; color: #991b1b; text-transform: uppercase; margin-bottom: 4px;">
            Official Reason Provided:
          </div>
          <div style="font-size: 14px; color: #7f1d1d; font-weight: 700; line-height: 1.5;">
            "${reason}"
          </div>
        </div>

        <p style="color: #475569; font-size: 13px; line-height: 1.6;">
          If you believe this is an error or wish to clear your account status, please reach out to our administration desk directly via WhatsApp.
        </p>

        <div style="text-align: center; margin-top: 24px;">
          <a href="https://wa.me/8801313916161?text=Hello%2C%20my%20account%20(${encodeURIComponent(studentEmail)})%20has%20been%20suspended.%20Please%20help." style="display: inline-block; background-color: #22c55e; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 800; padding: 12px 28px; border-radius: 10px;" target="_blank">
            Contact Support on WhatsApp
          </a>
        </div>
      </div>

      <div class="footer">
        <strong style="color: #ffffff;">Blueprint Learning Academy</strong><br>
        Direct Helpline: +880 1313-916161 | +880 1313-893838<br>
        Dhaka, Bangladesh • © ${currentYear} Blueprint Learning Academy.
      </div>
    </div>
  </div>
</body>
</html>`;

  return await sendEmail({
    to: studentEmail,
    subject: `আপনার অ্যাকাউন্ট সাময়িকভাবে স্থগিত করা হয়েছে (Account Suspended) - Blueprint Learning Academy`,
    html,
    text,
  });
}

/**
 * Send official account unblock / reinstatement confirmation email
 */
export async function sendAccountUnblockedEmail({
  studentName,
  studentEmail,
}: {
  studentName: string;
  studentEmail: string;
}) {
  const currentYear = new Date().getFullYear();

  const text = `প্রিয় ${studentName},

আপনার Blueprint Learning Academy অ্যাকাউন্টটি অ্যাডমিন কর্তৃক সফলভাবে আনব্লক করা হয়েছে।

এখন আপনি পুনরায় আপনার স্টুডেন্ট ড্যাশবোর্ডে লগইন করে সকল কোর্সের ভিডিও লেকচার, সাইট ড্রয়িং এবং লাইভ ক্লাসে অংশ নিতে পারবেন।

স্টুডেন্ট লগইন: https://blueprint-learning-academy.vercel.app/login

যে কোনো প্রয়োজনে আমাদের সাথে যোগাযোগ করুন:
• WhatsApp: https://wa.me/8801313916161
• Helpline: +880 1313-916161 | +880 1313-893838

ধন্যবাদ,
Blueprint Learning Academy টিম
ঢাকা, বাংলাদেশ`;

  const html = `
<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>আপনার অ্যাকাউন্ট আনব্লক করা হয়েছে - Blueprint Learning Academy</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #334155;
    }
    .wrapper {
      width: 100%;
      background-color: #f1f5f9;
      padding: 30px 10px 40px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 20px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
      box-shadow: 0 15px 35px -5px rgba(15, 23, 42, 0.08);
    }
    .header-banner {
      background: linear-gradient(135deg, #064e3b 0%, #047857 55%, #059669 100%);
      padding: 36px 24px 28px;
      text-align: center;
    }
    .logo-container {
      width: 82px;
      height: 82px;
      margin: 0 auto 14px;
      border-radius: 50%;
      border: 3px solid #a7f3d0;
      background-color: #ffffff;
      overflow: hidden;
      display: inline-block;
    }
    .logo-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      border-radius: 50%;
    }
    .content-body {
      padding: 32px 30px;
    }
    .success-card {
      background-color: #ecfdf5;
      border: 1.5px solid #a7f3d0;
      border-left: 5px solid #10b981;
      border-radius: 12px;
      padding: 18px 20px;
      margin: 22px 0;
    }
    .footer {
      background-color: #091224;
      padding: 24px 20px;
      text-align: center;
      color: #94a3b8;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header-banner">
        <div class="logo-container">
          <img src="${PUBLIC_LOGO_URL}" alt="Blueprint Learning Academy" class="logo-img" width="82" height="82" />
        </div>
        <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 900;">
          Blueprint <span style="color: #a7f3d0;">Learning Academy</span>
        </h1>
        <p style="color: #d1fae5; margin: 6px 0 0; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em;">
          ACCOUNT UNBLOCKED • অ্যাকাউন্ট আনব্লক করা হয়েছে
        </p>
      </div>

      <div class="content-body">
        <h2 style="color: #065f46; margin-top: 0; font-size: 22px; font-weight: 900; line-height: 1.3;">
          অভিনন্দন! আপনার অ্যাকাউন্ট আনব্লক করা হয়েছে
        </h2>
        <p style="color: #64748b; font-size: 13px; margin: 4px 0 16px; font-weight: 600;">
          Your Student Account is Now Unblocked &amp; Fully Active
        </p>
        <p style="color: #475569; font-size: 14px; line-height: 1.7;">
          প্রিয় <strong>${studentName}</strong>,
        </p>
        <p style="color: #475569; font-size: 14px; line-height: 1.7;">
          আপনার Blueprint Learning Academy স্টুডেন্ট অ্যাকাউন্টটি অ্যাডমিন কর্তৃক পর্যালোচনা করে <strong style="color: #059669;">সফলভাবে আনব্লক করা হয়েছে</strong>। এখন আপনার অ্যাকাউন্ট পুরোপুরি সক্রিয় (Active) অবস্থায় রয়েছে।
        </p>

        <div class="success-card">
          <div style="font-size: 13px; font-weight: 900; color: #065f46; text-transform: uppercase; margin-bottom: 6px;">
            ✓ অ্যাকাউন্ট স্ট্যাটাস: আনব্লকড ও সক্রিয় (Active)
          </div>
          <div style="font-size: 13px; color: #047857; font-weight: 600; line-height: 1.6;">
            আপনি এখন কোনো বাধা ছাড়াই আপনার ড্যাশবোর্ডে লগইন করে সকল কোর্সের ভিডিও লেকচার, সাইট ড্রয়িং এবং লাইভ ক্লাসে পুনরায় অংশ নিতে পারবেন।
          </div>
        </div>

        <div style="text-align: center; margin-top: 28px; margin-bottom: 22px;">
          <a href="https://blueprint-learning-academy.vercel.app/login" style="display: inline-block; background-color: #059669; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 800; padding: 14px 34px; border-radius: 12px; box-shadow: 0 4px 14px rgba(5, 150, 105, 0.35);" target="_blank">
            ড্যাশবোর্ডে লগইন করুন (Login to Dashboard) →
          </a>
        </div>

        <p style="color: #64748b; font-size: 12px; line-height: 1.6; text-align: center;">
          যে কোনো প্রয়োজনে সরাসরি আমাদের অফিসিয়াল হোয়াটসঅ্যাপে যোগাযোগ করতে পারেন:
        </p>

        <div style="text-align: center; margin-top: 10px;">
          <a href="https://wa.me/8801313916161" style="display: inline-block; background-color: #22c55e; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 700; padding: 10px 22px; border-radius: 8px;" target="_blank">
            💬 WhatsApp Support: +880 1313-916161
          </a>
        </div>
      </div>

      <div class="footer">
        <strong style="color: #ffffff;">Blueprint Learning Academy</strong><br>
        Direct Helpline: +880 1313-916161 | +880 1313-893838<br>
        Dhaka, Bangladesh • © ${currentYear} Blueprint Learning Academy.
      </div>
    </div>
  </div>
</body>
</html>`;

  return await sendEmail({
    to: studentEmail,
    subject: `আপনার অ্যাকাউন্ট আনব্লক করা হয়েছে (Account Unblocked) - Blueprint Learning Academy`,
    html,
    text,
  });
}
