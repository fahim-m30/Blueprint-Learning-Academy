const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
const SiteSettings = require('../models/SiteSettings');

/**
 * Universal Mail Dispatcher with Dual Delivery Engine (Brevo SMTP -> Direct Gmail Fallback)
 * Works seamlessly across cloud hosting (Render), localhost, and local networks.
 */
const dispatchMail = async ({ to, subject, html, text, attachments = [] }) => {
  let settings = null;
  try {
    settings = await SiteSettings.findOne({});
  } catch (err) {
    console.warn('Could not load SiteSettings for email dispatch:', err.message);
  }

  const emailFrom = settings?.emailFrom || process.env.EMAIL_FROM || '"Blueprint Learning Academy" <admin.blueprintlearning@gmail.com>';
  const gmailUser = settings?.gmailUser || process.env.EMAIL_USER || 'admin.blueprintlearning@gmail.com';
  const gmailPass = settings?.gmailPass || process.env.EMAIL_PASS || 'ncpcooxwigjauknm';

  const brevoApiKey = settings?.brevoApiKey || process.env.BREVO_API_KEY;
  const smtpHost = settings?.smtpHost || process.env.SMTP_HOST || 'smtp-relay.brevo.com';
  const smtpPort = Number(settings?.smtpPort) || Number(process.env.SMTP_PORT) || 587;
  const smtpUser = settings?.smtpUser || process.env.SMTP_USER;
  const smtpPass = settings?.smtpPass || process.env.SMTP_PASS;
  const smtpSecure = (settings?.smtpSecure === true) || (process.env.SMTP_SECURE === 'true');

  // Attempt 1: Vercel HTTPS Relay (Port 443 - Bypasses all Render cloud SMTP port blocking)
  const relayUrl = process.env.EMAIL_RELAY_URL || (process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/api/send-email` : 'https://blueprint-learning-academy.vercel.app/api/send-email');
  try {
    const relayRes = await fetch(relayUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        secret: 'blueprint_academy_email_secret_key_2026',
        to,
        subject,
        html,
        text: text || '',
        from: emailFrom,
        config: {
          gmailUser,
          gmailPass,
          smtpHost,
          smtpPort,
          smtpUser,
          smtpPass,
        },
      }),
      signal: AbortSignal.timeout(12000),
    });

    const relayData = await relayRes.json();
    if (relayRes.ok && relayData.success) {
      console.log('✅ Email Dispatched via Vercel HTTPS Relay Successfully:', relayData.messageId);
      return { success: true, provider: relayData.provider || 'vercel-relay', messageId: relayData.messageId };
    } else {
      console.warn('⚠️ Vercel Relay response not ok, attempting local fallback:', relayData);
    }
  } catch (relayErr) {
    console.warn('⚠️ Vercel Relay call failed, falling back to local providers:', relayErr.message);
  }

  // Attempt 2: Brevo HTTPS REST API (Port 443 - 100% unblocked on Render Cloud)
  if (brevoApiKey) {
    try {
      const payload = {
        sender: {
          name: 'Blueprint Learning Academy',
          email: 'admin.blueprintlearning@gmail.com',
        },
        to: [{ email: to }],
        subject,
        htmlContent: html,
        textContent: text || '',
      };

      const apiRes = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': brevoApiKey.trim(),
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const apiData = await apiRes.json();
      if (apiRes.ok && (apiData.messageId || apiData.id)) {
        console.log('✅ Email Sent via Brevo HTTPS API Successfully:', apiData.messageId || apiData.id);
        return { success: true, provider: 'brevo-api', messageId: apiData.messageId || apiData.id };
      } else {
        console.warn('⚠️ Brevo API response warning:', apiData);
      }
    } catch (apiErr) {
      console.warn('⚠️ Brevo HTTPS API request failed, falling back to SMTP:', apiErr.message);
    }
  }

  // Prepare logo attachment for inline CID display
  const finalAttachments = [...attachments];
  try {
    const logoPath = path.resolve(__dirname, '../../client/public/logo.png');
    if (fs.existsSync(logoPath) && !finalAttachments.some(a => a.cid === 'blueprint-logo')) {
      finalAttachments.push({
        filename: 'logo.png',
        path: logoPath,
        cid: 'blueprint-logo',
      });
    }
  } catch {}

  // Attempt 1: Brevo SMTP (if configured)
  if (smtpHost && smtpUser && smtpPass) {
    try {
      const brevoTransporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        connectionTimeout: 8000,
        greetingTimeout: 8000,
        socketTimeout: 10000,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      const sendResult = await brevoTransporter.sendMail({
        from: emailFrom,
        to,
        subject,
        html,
        text: text || '',
        attachments: finalAttachments,
      });

      console.log('✅ Email Sent via Brevo SMTP Successfully:', sendResult.messageId);
      return { success: true, provider: 'brevo', messageId: sendResult.messageId };
    } catch (brevoErr) {
      console.warn('⚠️ Brevo SMTP failed (possibly IP restricted), attempting Gmail fallback:', brevoErr.message);
    }
  }

  // Attempt 2: Direct Gmail Transporter (highly reliable, no IP blocking)
  if (gmailUser && gmailPass) {
    try {
      const gmailTransporter = nodemailer.createTransport({
        service: 'gmail',
        connectionTimeout: 10000,
        auth: {
          user: gmailUser,
          pass: gmailPass,
        },
      });

      const sendResult = await gmailTransporter.sendMail({
        from: `"Blueprint Learning Academy" <${gmailUser}>`,
        to,
        subject,
        html,
        text: text || '',
        attachments: finalAttachments,
      });

      console.log('✅ Email Sent via Gmail Successfully:', sendResult.messageId);
      return { success: true, provider: 'gmail', messageId: sendResult.messageId };
    } catch (gmailErr) {
      console.error('❌ Gmail Transporter Error:', gmailErr.message);
      return { success: false, error: gmailErr.message };
    }
  }

  return { success: false, simulated: true, error: 'No active email provider' };
};

/**
 * Public hosted logo URL fallback
 */
const PUBLIC_LOGO_URL = 'https://blueprint-learning-academy.vercel.app/logo.png?v=8';

/**
 * Send Enrollment Confirmation & Generated Credentials Email
 */
const sendEnrollmentApprovedEmail = async ({
  studentName,
  studentEmail,
  studentId,
  courseTitle,
  generatedPassword,
  loginUrl,
  whatsappGroupLink,
}) => {
  const currentYear = new Date().getFullYear();
  const rawLoginUrl = loginUrl || 'https://blueprint-learning-academy.vercel.app/login';
  const effectiveLoginUrl = rawLoginUrl.includes('?') 
    ? `${rawLoginUrl}&email=${encodeURIComponent(studentEmail)}&from=email`
    : `${rawLoginUrl}?email=${encodeURIComponent(studentEmail)}&from=email`;

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ${courseTitle} - Blueprint Learning Academy</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #334155;
      -webkit-font-smoothing: antialiased;
    }
    table {
      border-collapse: collapse;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
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
      box-shadow: 0 15px 35px -5px rgba(15, 23, 42, 0.08), 0 5px 15px rgba(15, 23, 42, 0.03);
    }
    .header-banner {
      background: linear-gradient(135deg, #091224 0%, #0f274a 55%, #1e3a8a 100%);
      padding: 36px 24px 28px;
      text-align: center;
      position: relative;
    }
    .logo-container {
      width: 86px;
      height: 86px;
      margin: 0 auto 14px;
      border-radius: 50%;
      border: 3px solid #ffb531;
      background-color: #ffffff;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.35);
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
    .brand-title {
      margin: 0;
      color: #ffffff;
      font-size: 24px;
      font-weight: 900;
      letter-spacing: -0.02em;
    }
    .brand-accent {
      color: #ffb531;
    }
    .brand-subtitle {
      margin: 6px 0 0;
      color: #93c5fd;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.12em;
    }
    .content-body {
      padding: 32px 30px;
    }
    .status-badge {
      display: inline-block;
      background-color: #ecfdf5;
      border: 1px solid #a7f3d0;
      color: #065f46;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      padding: 5px 14px;
      border-radius: 9999px;
      margin-bottom: 16px;
    }
    .welcome-title {
      margin: 0 0 12px;
      color: #0f172a;
      font-size: 22px;
      font-weight: 900;
      line-height: 1.25;
    }
    .welcome-text {
      margin: 0 0 20px;
      color: #475569;
      font-size: 14px;
      line-height: 1.6;
    }
    .course-card {
      background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
      border: 1.5px solid #cbd5e1;
      border-left: 5px solid #1d4ed8;
      border-radius: 14px;
      padding: 16px 20px;
      margin-bottom: 24px;
    }
    .course-label {
      font-size: 11px;
      font-weight: 800;
      color: #1d4ed8;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-bottom: 4px;
    }
    .course-name {
      font-size: 16px;
      font-weight: 900;
      color: #0f172a;
      margin: 0;
    }
    .credentials-vault {
      background-color: #0b1528;
      border: 1.5px solid #1e3a8a;
      border-radius: 16px;
      padding: 22px 24px;
      margin-bottom: 26px;
      box-shadow: 0 12px 24px rgba(11, 21, 40, 0.15);
    }
    .vault-header {
      font-size: 11px;
      font-weight: 800;
      color: #ffb531;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      margin-bottom: 16px;
      padding-bottom: 10px;
      border-bottom: 1px solid #1e293b;
    }
    .cred-row {
      margin-bottom: 12px;
    }
    .cred-label {
      color: #94a3b8;
      font-size: 12px;
      font-weight: 700;
      margin-bottom: 4px;
    }
    .cred-value-box {
      background-color: #0f1d35;
      border: 1px solid #254070;
      border-radius: 10px;
      padding: 9px 14px;
      color: #ffffff;
      font-family: 'SF Mono', Menlo, Monaco, Consolas, monospace;
      font-size: 15px;
      font-weight: 800;
      word-break: break-all;
    }
    .cred-password {
      color: #ffb531;
      border-color: #b45309;
      background-color: #1c1917;
      letter-spacing: 0.08em;
    }
    .btn-login {
      display: inline-block;
      background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%);
      color: #ffffff !important;
      text-decoration: none;
      font-size: 15px;
      font-weight: 800;
      padding: 15px 34px;
      border-radius: 12px;
      box-shadow: 0 8px 20px rgba(37, 99, 235, 0.35);
      text-align: center;
      margin: 6px 0 24px;
      letter-spacing: -0.01em;
    }
    .whatsapp-card {
      background: linear-gradient(180deg, #f0fdf4 0%, #dcfce7 100%);
      border: 1.5px solid #86efac;
      border-radius: 14px;
      padding: 18px 20px;
      text-align: center;
      margin-bottom: 24px;
    }
    .whatsapp-title {
      color: #15803d;
      font-size: 14px;
      font-weight: 900;
      margin: 0 0 6px;
    }
    .whatsapp-desc {
      color: #166534;
      font-size: 12px;
      margin: 0 0 14px;
      line-height: 1.5;
    }
    .btn-whatsapp {
      display: inline-block;
      background-color: #22c55e;
      color: #ffffff !important;
      text-decoration: none;
      font-size: 13px;
      font-weight: 800;
      padding: 10px 22px;
      border-radius: 10px;
      box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
    }
    .guidelines-box {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px 20px;
      font-size: 12px;
      color: #475569;
      line-height: 1.7;
    }
    .guidelines-title {
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 6px;
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 0.05em;
    }
    .footer {
      background-color: #091224;
      padding: 24px 20px;
      text-align: center;
      color: #94a3b8;
      font-size: 12px;
      line-height: 1.6;
      border-top: 1px solid #1e293b;
    }
    .footer a {
      color: #ffb531;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <!-- HEADER BANNER -->
      <div class="header-banner">
        <div class="logo-container">
          <img src="cid:blueprint-logo" onerror="this.onerror=null;this.src='${PUBLIC_LOGO_URL}'" alt="Blueprint Learning Academy" class="logo-img" width="86" height="86" />
        </div>
        <h1 class="brand-title">Blueprint <span class="brand-accent">Learning Academy</span></h1>
        <p class="brand-subtitle">Bangladesh's #1 Practical Civil Engineering Academy</p>
      </div>

      <!-- MAIN CONTENT -->
      <div class="content-body">
        <div class="status-badge">
          ✓ Enrollment &amp; Payment Verified
        </div>

        <h2 class="welcome-title">Welcome to the Batch, ${studentName}!</h2>
        <p class="welcome-text">
          Congratulations on taking a decisive step towards accelerating your engineering career. Your enrollment has been verified and your student account is now fully active.
        </p>

        <!-- Course Summary -->
        <div class="course-card">
          <div class="course-label">Your Enrolled Course</div>
          <h3 class="course-name">${courseTitle}</h3>
        </div>

        <!-- Credentials Vault -->
        <div class="credentials-vault">
          <div class="vault-header">
            🔐 Student Portal Access Credentials
          </div>

          ${
            studentId
              ? `
          <div class="cred-row">
            <div class="cred-label">Official Student ID:</div>
            <div class="cred-value-box" style="color: #ffb531; font-size: 16px; letter-spacing: 2px;">${studentId}</div>
          </div>
          `
              : ''
          }

          <div class="cred-row">
            <div class="cred-label">Login Identifier (Email or Student ID):</div>
            <div class="cred-value-box">${studentEmail}</div>
          </div>

          <div class="cred-row">
            <div class="cred-label">Access Password:</div>
            <div class="cred-value-box cred-password">${generatedPassword}</div>
          </div>

          <div style="margin-top: 10px; color: #94a3b8; font-size: 11px; line-height: 1.5;">
            * You can sign in using either your Student ID (${studentId || studentEmail}) or your Email Address.
          </div>
        </div>

        <!-- CTA Button -->
        <div style="text-align: center;">
          <a href="${effectiveLoginUrl}" class="btn-login" target="_blank">
            👉 Sign In to Student Portal
          </a>
        </div>

        <!-- WhatsApp Batch Group (if configured) -->
        ${
          whatsappGroupLink
            ? `
        <div class="whatsapp-card">
          <h4 class="whatsapp-title">💬 Official Batch WhatsApp Group</h4>
          <p class="whatsapp-desc">
            Connect directly with your instructor and batchmates for live Google Meet links, class reminders, and daily discussions.
          </p>
          <a href="${whatsappGroupLink}" class="btn-whatsapp" target="_blank">
            Join WhatsApp Batch Group →
          </a>
        </div>
        `
            : ''
        }

        <!-- Guidelines -->
        <div class="guidelines-box">
          <div class="guidelines-title">What's Waiting Inside Your Portal:</div>
          • <strong>Video Lectures:</strong> Watch recorded site training videos and BOQ modules anytime.<br>
          • <strong>Live Classes:</strong> Google Meet links and schedule updated in your dashboard.<br>
          • <strong>Notice Board:</strong> Academy holiday notices and batch updates are posted directly.<br>
          • <strong>Student Discussion:</strong> Dedicated instructor chat room for your questions.
        </div>
      </div>

      <!-- FOOTER -->
      <div class="footer">
        <strong style="color: #ffffff;">Blueprint Learning Academy</strong><br>
        Practical Engineering &amp; Real Estate Career Development<br>
        Direct Helpline &amp; WhatsApp: <a href="https://wa.me/8801313916161">+880 1313-916161</a> | <a href="https://wa.me/8801313893838">+880 1313-893838</a><br>
        <span style="font-size: 11px; color: #64748b; margin-top: 8px; display: block;">
          © ${currentYear} Blueprint Learning Academy. All rights reserved. Dhaka, Bangladesh.
        </span>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  return await dispatchMail({
    to: studentEmail,
    subject: `Course Enrollment Confirmation: ${courseTitle} - Student ID & Login Credentials`,
    html: htmlContent,
  });
};

/**
 * Send Account Block Notification with Admin's Reason
 */
const sendAccountBlockedEmail = async ({ studentName, studentEmail, reason }) => {
  const currentYear = new Date().getFullYear();

  const htmlContent = `
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
          <img src="cid:blueprint-logo" onerror="this.onerror=null;this.src='${PUBLIC_LOGO_URL}'" alt="Blueprint Learning Academy" class="logo-img" width="82" height="82" />
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
          Account Access Update
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
          <div style="font-size: 14px; color: #7f1d1d; font-weight: 600; line-height: 1.5;">
            "${reason}"
          </div>
        </div>

        <p style="color: #475569; font-size: 13px; line-height: 1.6;">
          If you believe this is an error or wish to clear your payment/account status, please reach out to our support desk directly via WhatsApp.
        </p>

        <div style="text-align: center; margin-top: 24px;">
          <a href="https://wa.me/8801313916161" style="display: inline-block; background-color: #22c55e; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 800; padding: 12px 28px; border-radius: 10px;" target="_blank">
            Contact Support on WhatsApp
          </a>
        </div>
      </div>

      <div class="footer">
        <strong style="color: #ffffff;">Blueprint Learning Academy</strong><br>
        Direct Helpline: +880 1313-916161 | +880 1313-893838<br>
        © ${currentYear} Blueprint Learning Academy.
      </div>
    </div>
  </div>
</body>
</html>
  `;

  return await dispatchMail({
    to: studentEmail,
    subject: `Important: Your Student Account Status Notice - Blueprint Learning Academy`,
    html: htmlContent,
  });
};

/**
 * Send Password Reset OTP Email
 */
const sendPasswordResetOtpEmail = async ({ name, email, otp }) => {
  const currentYear = new Date().getFullYear();

  const textContent = `Hello ${name},

We received a request to verify or reset your Blueprint Learning Academy account password (${email}).

Your 6-Digit Verification Code (OTP) is:
----------------------------------------
${otp}
----------------------------------------
This verification code is valid for 10 minutes only.

SECURITY NOTICE:
• Never share this code with anyone. Blueprint staff or instructors will never ask for your verification code.
• If you did not request this password reset, please ignore this email. Your account password remains unchanged.

Regards,
Blueprint Learning Academy Security Portal
Helpline: +880 1313-916161
Website: https://blueprint-learning-academy.vercel.app
`;

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset Verification Code: ${otp} - Blueprint Learning Academy</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #334155;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #f1f5f9;
      padding: 30px 10px 40px;
    }
    .container {
      max-width: 560px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 20px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
      box-shadow: 0 15px 35px -5px rgba(15, 23, 42, 0.08);
    }
    .header-banner {
      background: linear-gradient(135deg, #091224 0%, #0f274a 55%, #1e3a8a 100%);
      padding: 34px 24px 26px;
      text-align: center;
    }
    .logo-container {
      width: 80px;
      height: 80px;
      margin: 0 auto 12px;
      border-radius: 50%;
      border: 3px solid #ffb531;
      background-color: #ffffff;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.35);
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
    .brand-title {
      margin: 0;
      color: #ffffff;
      font-size: 23px;
      font-weight: 900;
      letter-spacing: -0.02em;
    }
    .brand-accent {
      color: #ffb531;
    }
    .brand-subtitle {
      margin: 6px 0 0;
      color: #93c5fd;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.12em;
    }
    .content-body {
      padding: 32px 30px;
    }
    .security-badge {
      display: inline-block;
      background-color: #eff6ff;
      border: 1px solid #bfdbfe;
      color: #1d4ed8;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      padding: 5px 14px;
      border-radius: 9999px;
      margin-bottom: 16px;
    }
    .heading {
      margin: 0 0 12px;
      color: #0f172a;
      font-size: 21px;
      font-weight: 900;
    }
    .intro-text {
      margin: 0 0 24px;
      color: #475569;
      font-size: 14px;
      line-height: 1.6;
    }
    .otp-vault {
      background-color: #0b1528;
      border: 2px solid #ffb531;
      border-radius: 16px;
      padding: 24px 20px;
      text-align: center;
      margin-bottom: 24px;
      box-shadow: 0 10px 25px rgba(11, 21, 40, 0.15);
    }
    .otp-label {
      color: #94a3b8;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      margin-bottom: 10px;
    }
    .otp-digits {
      font-family: 'SF Mono', Menlo, Monaco, Consolas, monospace;
      font-size: 38px;
      font-weight: 900;
      letter-spacing: 12px;
      color: #ffb531;
      padding-left: 12px;
      margin: 6px 0 12px;
    }
    .otp-validity {
      color: #38bdf8;
      font-size: 12px;
      font-weight: 700;
    }
    .notice-card {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 16px 18px;
      font-size: 12px;
      color: #64748b;
      line-height: 1.6;
    }
    .notice-item {
      margin-bottom: 6px;
    }
    .notice-item:last-child {
      margin-bottom: 0;
    }
    .footer {
      background-color: #091224;
      padding: 22px 20px;
      text-align: center;
      color: #94a3b8;
      font-size: 12px;
      line-height: 1.6;
      border-top: 1px solid #1e293b;
    }
    .footer a {
      color: #ffb531;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <!-- Preheader preview text for email clients -->
  <div style="display:none;font-size:1px;color:#333333;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    Your password reset verification code is ${otp}. Valid for 10 minutes.
  </div>

  <div class="wrapper">
    <div class="container">
      <!-- HEADER -->
      <div class="header-banner">
        <div class="logo-container">
          <img src="cid:blueprint-logo" onerror="this.onerror=null;this.src='${PUBLIC_LOGO_URL}'" alt="Blueprint Learning Academy" class="logo-img" width="80" height="80" />
        </div>
        <h1 class="brand-title">Blueprint <span class="brand-accent">Learning Academy</span></h1>
        <p class="brand-subtitle">Security &amp; Account Verification</p>
      </div>

      <!-- BODY -->
      <div class="content-body">
        <div class="security-badge">
          🔒 Password Reset Request
        </div>

        <h2 class="heading">Verification Code</h2>
        <p class="intro-text">
          Hello <strong>${name}</strong>,<br>
          We received a request to reset the password for your Blueprint Learning Academy account (<strong style="color: #0f172a;">${email}</strong>). Please use the single-use verification code below to authorize this change:
        </p>

        <!-- OTP Vault Card -->
        <div class="otp-vault">
          <div class="otp-label">One-Time Verification Code (OTP)</div>
          <div class="otp-digits">${otp}</div>
          <div class="otp-validity">⏱ Valid for 10 minutes only • Single use</div>
        </div>

        <!-- Security Advisory -->
        <div class="notice-card">
          <div class="notice-item">
            ⚠️ <strong>Security Advisory:</strong> Never share this code with anyone. Blueprint instructors and administration will never ask for your verification code.
          </div>
          <div class="notice-item">
            🛡 <strong>Didn't make this request?</strong> If you did not request a password reset, you can safely disregard this email. Your account password remains unchanged.
          </div>
        </div>
      </div>

      <!-- FOOTER -->
      <div class="footer">
        <strong style="color: #f1f5f9;">Blueprint Learning Academy</strong><br>
        Engineering Career Development for Civil Engineers in Bangladesh<br>
        Helpline: <a href="tel:+8801313916161">+880 1313-916161</a> | Website: <a href="https://blueprint-learning-academy.vercel.app">blueprint-learning-academy.vercel.app</a><br>
        <span style="font-size: 11px; color: #64748b; margin-top: 6px; display: inline-block;">
          © ${currentYear} Blueprint Learning Academy. All rights reserved.
        </span>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  return await dispatchMail({
    to: email,
    subject: `Password Reset Verification Code: ${otp} - Blueprint Learning Academy`,
    html: htmlContent,
    text: textContent,
  });
};

module.exports = {
  dispatchMail,
  sendEnrollmentApprovedEmail,
  sendAccountBlockedEmail,
  sendPasswordResetOtpEmail,
};
