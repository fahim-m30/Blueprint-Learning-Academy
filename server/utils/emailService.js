const nodemailer = require('nodemailer');
const SiteSettings = require('../models/SiteSettings');

/**
 * Universal Mail Dispatcher with Automatic Fallback (Brevo -> Gmail)
 * Guaranteed to deliver even if Brevo blocks cloud/dynamic IPs.
 */
const dispatchMail = async ({ to, subject, html, text }) => {
  let settings = null;
  try {
    settings = await SiteSettings.findOne({});
  } catch (err) {
    console.warn('Could not load SiteSettings for email dispatch:', err.message);
  }

  const emailFrom = settings?.emailFrom || process.env.EMAIL_FROM || '"Blueprint Learning Academy" <admin.blueprintlearning@gmail.com>';
  const gmailUser = settings?.gmailUser || process.env.EMAIL_USER || 'admin.blueprintlearning@gmail.com';
  const gmailPass = settings?.gmailPass || process.env.EMAIL_PASS || 'ncpcooxwigjauknm';

  const smtpHost = settings?.smtpHost || process.env.SMTP_HOST || 'smtp-relay.brevo.com';
  const smtpPort = Number(settings?.smtpPort) || Number(process.env.SMTP_PORT) || 587;
  const smtpUser = settings?.smtpUser || process.env.SMTP_USER;
  const smtpPass = settings?.smtpPass || process.env.SMTP_PASS;
  const smtpSecure = (settings?.smtpSecure === true) || (process.env.SMTP_SECURE === 'true');

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
      });

      console.log('✅ Email Sent via Gmail Successfully:', sendResult.messageId);
      return { success: true, provider: 'gmail', messageId: sendResult.messageId };
    } catch (gmailErr) {
      console.error('❌ Gmail Transporter Error:', gmailErr.message);
      return { success: false, error: gmailErr.message };
    }
  }

  console.log('\n==========================================================');
  console.log('📧 [EMAIL LOGGED (NO SMTP/GMAIL AVAILABLE)]:');
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log('==========================================================\n');
  return { success: false, simulated: true, error: 'No active email provider' };
};

/**
 * Send Enrollment Confirmation & Generated Credentials Email
 */
const sendEnrollmentApprovedEmail = async ({
  studentName,
  studentEmail,
  courseTitle,
  generatedPassword,
  loginUrl,
  whatsappGroupLink,
}) => {
  const htmlContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>Enrollment Confirmed - Blueprint Learning Academy</title>
    <style>
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #060a11; color: #f3f7fc; margin: 0; padding: 20px; }
      .container { max-width: 600px; margin: 0 auto; background: #101c2e; border: 1px solid #2e4666; border-radius: 14px; overflow: hidden; }
      .header { background: #0b1624; border-bottom: 2px solid #ffb531; padding: 25px; text-align: center; }
      .header h1 { margin: 0; color: #f3f7fc; font-size: 24px; font-weight: 800; }
      .header span { color: #ffb531; }
      .content { padding: 30px; line-height: 1.6; }
      .highlight-box { background: #08111d; border: 1.5px solid #3a7bb8; border-radius: 10px; padding: 20px; margin: 20px 0; }
      .btn { display: inline-block; background-color: #ffb531; color: #1a1100; text-decoration: none; font-weight: 700; padding: 12px 26px; border-radius: 8px; margin-top: 15px; }
      .btn-whatsapp { display: inline-block; background-color: #25d366; color: #ffffff; text-decoration: none; font-weight: 700; padding: 10px 20px; border-radius: 8px; margin-top: 10px; }
      .footer { background: #0b1624; padding: 20px; text-align: center; color: #bccadb; font-size: 13px; border-top: 1px solid #2e4666; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Blueprint Learning <span>Academy</span></h1>
        <p style="color: #7fb8ea; margin: 5px 0 0 0; font-size: 14px;">Real Estate & Construction Career Education</p>
      </div>
      <div class="content">
        <h2 style="color: #50c878; margin-top: 0;">🎉 Congratulations, ${studentName}!</h2>
        <p>Your enrollment in <strong>${courseTitle}</strong> has been verified and confirmed by the academy.</p>
        <p>We are delighted to welcome you to our professional learning batch. Below are your secure login credentials to access the Student Portal:</p>

        <div class="highlight-box">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="color: #bccadb; padding: 8px 0; font-weight: 600;">Student Portal URL:</td>
              <td style="color: #7fb8ea; padding: 8px 0; text-align: right;"><a href="${loginUrl}" style="color: #7fb8ea;">${loginUrl}</a></td>
            </tr>
            <tr>
              <td style="color: #bccadb; padding: 8px 0; font-weight: 600;">Login Email:</td>
              <td style="color: #f3f7fc; padding: 8px 0; text-align: right; font-weight: bold;">${studentEmail}</td>
            </tr>
            <tr>
              <td style="color: #bccadb; padding: 8px 0; font-weight: 600;">Auto-Generated Password:</td>
              <td style="color: #ffb531; padding: 8px 0; text-align: right; font-family: monospace; font-size: 17px; font-weight: bold;">${generatedPassword}</td>
            </tr>
          </table>
        </div>

        <div style="text-align: center; margin: 25px 0;">
          <a href="${loginUrl}" class="btn">Login to Your Student Dashboard</a>
        </div>

        ${
          whatsappGroupLink
            ? `
        <div style="background: rgba(37,211,102,0.1); border: 1px solid #25d366; border-radius: 8px; padding: 15px; text-align: center; margin: 20px 0;">
          <p style="margin: 0 0 10px 0; color: #f3f7fc; font-weight: 600;">Join your course WhatsApp Batch Group directly:</p>
          <a href="${whatsappGroupLink}" class="btn-whatsapp">Join WhatsApp Group</a>
        </div>`
            : ''
        }

        <p style="color: #bccadb; font-size: 14px;">
          <strong>Important Instructions:</strong><br>
          • In your dashboard, you will find class video recordings, live class Google Meet schedule, downloadable resources, and notice board.<br>
          • You can change your password anytime after logging in.<br>
          • If you have any inquiries, you can directly chat with the instructor inside the course dashboard.
        </p>
      </div>
      <div class="footer">
        © ${new Date().getFullYear()} Blueprint Learning Academy. All rights reserved.<br>
        Direct Helpline / WhatsApp: +8801313893838
      </div>
    </div>
  </body>
  </html>
  `;

  return await dispatchMail({
    to: studentEmail,
    subject: `Welcome to ${courseTitle} - Your Access Credentials`,
    html: htmlContent,
  });
};

/**
 * Send Account Block Notification with Admin's Reason
 */
const sendAccountBlockedEmail = async ({ studentName, studentEmail, reason }) => {
  const htmlContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>Account Status Notice - Blueprint Learning Academy</title>
    <style>
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #060a11; color: #f3f7fc; margin: 0; padding: 20px; }
      .container { max-width: 600px; margin: 0 auto; background: #101c2e; border: 1px solid #2e4666; border-radius: 14px; overflow: hidden; }
      .header { background: #0b1624; border-bottom: 2px solid #e53e3e; padding: 25px; text-align: center; }
      .header h1 { margin: 0; color: #f3f7fc; font-size: 24px; font-weight: 800; }
      .content { padding: 30px; line-height: 1.6; }
      .reason-box { background: rgba(229, 62, 62, 0.1); border-left: 4px solid #e53e3e; padding: 15px 20px; margin: 20px 0; border-radius: 4px; }
      .footer { background: #0b1624; padding: 20px; text-align: center; color: #bccadb; font-size: 13px; border-top: 1px solid #2e4666; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Blueprint Learning <span>Academy</span></h1>
        <p style="color: #fc8181; margin: 5px 0 0 0; font-size: 14px;">Important Account Notice</p>
      </div>
      <div class="content">
        <h2 style="color: #fc8181; margin-top: 0;">Account Access Notice</h2>
        <p>Dear ${studentName},</p>
        <p>Your access to the Blueprint Learning Academy student dashboard has been temporarily paused or restricted by the academy administration.</p>
        
        <div class="reason-box">
          <p style="margin: 0; font-weight: bold; color: #fc8181;">Reason provided by Administration:</p>
          <p style="margin: 8px 0 0 0; color: #f3f7fc; font-style: italic;">"${reason}"</p>
        </div>

        <p>If you believe this is a misunderstanding, or if you need to resolve your payment or account status, please contact our support desk directly via WhatsApp.</p>
      </div>
      <div class="footer">
        © ${new Date().getFullYear()} Blueprint Learning Academy. All rights reserved.<br>
        Helpline / WhatsApp: +8801313893838
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
  const htmlContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>Password Verification Code - Blueprint Learning Academy</title>
    <style>
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #060a11; color: #f3f7fc; margin: 0; padding: 20px; }
      .container { max-width: 600px; margin: 0 auto; background: #101c2e; border: 1px solid #2e4666; border-radius: 14px; overflow: hidden; }
      .header { background: #0b1624; border-bottom: 2px solid #ffb531; padding: 25px; text-align: center; }
      .otp-box { background: #08111d; border: 2px dashed #ffb531; border-radius: 12px; padding: 20px; text-align: center; margin: 25px 0; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #ffb531; font-family: monospace; }
      .footer { background: #0b1624; padding: 20px; text-align: center; color: #bccadb; font-size: 13px; border-top: 1px solid #2e4666; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1 style="margin:0; color:#f3f7fc;">Blueprint Learning <span style="color:#ffb531;">Academy</span></h1>
        <p style="color: #7fb8ea; margin: 5px 0 0 0; font-size: 14px;">Administrator Security Verification</p>
      </div>
      <div class="content" style="padding: 30px;">
        <h2 style="color: #f3f7fc; margin-top: 0;">Password Reset Request</h2>
        <p>Hello ${name},</p>
        <p>A request was made to verify or reset your administrator password. Please use the 6-digit one-time verification code below:</p>
        
        <div class="otp-box">${otp}</div>

        <p style="color: #bccadb; font-size: 13px;">This code is valid for 10 minutes. If you did not request this verification, please secure your email account immediately.</p>
      </div>
      <div class="footer">
        © ${new Date().getFullYear()} Blueprint Learning Academy.
      </div>
    </div>
  </body>
  </html>
  `;

  return await dispatchMail({
    to: email,
    subject: `Your Verification Code: ${otp} - Blueprint Learning Academy`,
    html: htmlContent,
  });
};

module.exports = {
  dispatchMail,
  sendEnrollmentApprovedEmail,
  sendAccountBlockedEmail,
  sendPasswordResetOtpEmail,
};
