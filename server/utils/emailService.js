const nodemailer = require('nodemailer');
const SiteSettings = require('../models/SiteSettings');

const createTransporter = async () => {
  let settings = null;
  try {
    settings = await SiteSettings.findOne({});
  } catch (err) {
    console.warn('Could not load SiteSettings for SMTP, falling back to env:', err.message);
  }

  // 1. Check SiteSettings from MongoDB Atlas first (works on Render/Vercel without manual env vars)
  const smtpHost = settings?.smtpHost || process.env.SMTP_HOST || 'smtp-relay.brevo.com';
  const smtpPort = Number(settings?.smtpPort) || Number(process.env.SMTP_PORT) || 587;
  const smtpUser = settings?.smtpUser || process.env.SMTP_USER;
  const smtpPass = settings?.smtpPass || process.env.SMTP_PASS;
  const smtpSecure = (settings?.smtpSecure === true) || (process.env.SMTP_SECURE === 'true');
  const emailFrom = settings?.emailFrom || process.env.EMAIL_FROM || '"Blueprint Learning Academy" <admin.blueprintlearning@gmail.com>';

  if (smtpHost && smtpUser && smtpPass) {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
    return { transporter, emailFrom };
  }

  // 2. Gmail fallback (from DB or process.env)
  const gmailUser = settings?.gmailUser || process.env.EMAIL_USER;
  const gmailPass = settings?.gmailPass || process.env.EMAIL_PASS;
  if (gmailUser && gmailPass) {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailPass,
      },
    });
    return { transporter, emailFrom: `"Blueprint Learning Academy" <${gmailUser}>` };
  }

  return { transporter: null, emailFrom };
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
  const { transporter, emailFrom } = await createTransporter();

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
      .cred-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #2e4666; }
      .cred-label { color: #bccadb; font-weight: 600; }
      .cred-value { color: #ffb531; font-weight: 700; font-family: monospace; font-size: 16px; }
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
        <p>Your enrollment in <strong>${courseTitle}</strong> has been verified and confirmed by the instructor.</p>
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
          • In your dashboard, you will find class video recordings, live class Google Meet schedule, downloadable resources, and assignment submission boxes.<br>
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

  if (transporter) {
    try {
      const sendResult = await transporter.sendMail({
        from: emailFrom,
        to: studentEmail,
        subject: `Welcome to ${courseTitle} - Your Access Credentials`,
        html: htmlContent,
      });
      console.log('✅ Student Credentials Email Sent Successfully:', sendResult.messageId);
      return { success: true, messageId: sendResult.messageId };
    } catch (err) {
      console.error('SMTP Mail Sending Error, attempting Gmail fallback:', err.message);
      // Try fallback to Gmail if Brevo had an issue
      try {
        let settings = null;
        try { settings = await SiteSettings.findOne({}); } catch {}
        const gUser = settings?.gmailUser || process.env.EMAIL_USER;
        const gPass = settings?.gmailPass || process.env.EMAIL_PASS;
        if (gUser && gPass) {
          const fallbackTransporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: gUser,
              pass: gPass,
            },
          });
          const fallbackResult = await fallbackTransporter.sendMail({
            from: `"Blueprint Learning Academy" <${gUser}>`,
            to: studentEmail,
            subject: `Welcome to ${courseTitle} - Your Access Credentials`,
            html: htmlContent,
          });
          console.log('✅ Fallback Gmail Sent Successfully:', fallbackResult.messageId);
          return { success: true, messageId: fallbackResult.messageId };
        }
        return { success: false, error: err.message };
      } catch (fallbackErr) {
        console.error('Fallback Gmail Error:', fallbackErr.message);
        return { success: false, error: err.message };
      }
    }
  } else {
    console.log('\n==========================================================');
    console.log('📧 [EMAIL DISPATCHED TO STUDENT (SMTP NOT CONFIGURED, LOGGED BELOW)]:');
    console.log(`To: ${studentEmail}`);
    console.log(`Course: ${courseTitle}`);
    console.log(`Student Name: ${studentName}`);
    console.log(`Password: ${generatedPassword}`);
    console.log(`Login URL: ${loginUrl}`);
    console.log('==========================================================\n');
    return { success: true, simulated: true };
  }
};

/**
 * Send Account Block Notification with Admin's Reason
 */
const sendAccountBlockedEmail = async ({ studentName, studentEmail, reason }) => {
  const { transporter, emailFrom } = await createTransporter();

  const htmlContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>Account Status Notice - Blueprint Learning Academy</title>
    <style>
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #060a11; color: #f3f7fc; margin: 0; padding: 20px; }
      .container { max-width: 600px; margin: 0 auto; background: #101c2e; border: 1px solid #e2136e; border-radius: 14px; overflow: hidden; }
      .header { background: #1f0b14; border-bottom: 2px solid #e2136e; padding: 20px; text-align: center; }
      .header h1 { margin: 0; color: #ff5252; font-size: 22px; }
      .content { padding: 30px; line-height: 1.6; }
      .reason-box { background: rgba(226, 19, 110, 0.12); border: 1.5px solid #e2136e; border-radius: 10px; padding: 20px; margin: 20px 0; }
      .footer { background: #0b1624; padding: 16px; text-align: center; color: #bccadb; font-size: 13px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Blueprint Learning Academy - Account Notice</h1>
      </div>
      <div class="content">
        <p>Dear ${studentName},</p>
        <p>This is an official notification that your student account access at Blueprint Learning Academy has been <strong>suspended / blocked</strong> by the administration.</p>

        <div class="reason-box">
          <strong style="color: #ff5252;">Official Reason Stated by Administration:</strong>
          <p style="margin: 8px 0 0 0; color: #f3f7fc;">${reason || 'Violation of academy terms and student guidelines.'}</p>
        </div>

        <p style="color: #bccadb;">
          If you believe this was an error, or if you need to clarify and resolve this matter, please contact the academy administration with your registered email and phone number:
        </p>
        <p style="color: #7fb8ea;">
          WhatsApp Helpline: +8801313893838<br>
          Email: info@blueprintlearningacademy.com
        </p>
      </div>
      <div class="footer">
        © ${new Date().getFullYear()} Blueprint Learning Academy Administration.
      </div>
    </div>
  </body>
  </html>
  `;

  if (transporter) {
    try {
      await transporter.sendMail({
        from: emailFrom,
        to: studentEmail,
        subject: `Important: Your Student Account Status Notice`,
        html: htmlContent,
      });
      return { success: true };
    } catch (err) {
      console.error('SMTP Mail Sending Error:', err.message);
      return { success: false, error: err.message };
    }
  } else {
    console.log('\n==========================================================');
    console.log('📧 [ACCOUNT BLOCK EMAIL DISPATCHED (LOGGED)]:');
    console.log(`To: ${studentEmail} (${studentName})`);
    console.log(`Reason: ${reason}`);
    console.log('==========================================================\n');
    return { success: true, simulated: true };
  }
};

/**
 * Send Password Reset OTP Email
 */
const sendPasswordResetOtpEmail = async ({ name, email, otp }) => {
  const { transporter, emailFrom } = await createTransporter();

  const htmlContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>Password Verification Code - Blueprint Learning Academy</title>
    <style>
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #060a11; color: #f3f7fc; margin: 0; padding: 20px; }
      .container { max-width: 600px; margin: 0 auto; background: #101c2e; border: 1.5px solid #ffb531; border-radius: 14px; overflow: hidden; }
      .header { background: #0b1624; border-bottom: 2px solid #ffb531; padding: 20px; text-align: center; }
      .header h1 { margin: 0; color: #f3f7fc; font-size: 22px; }
      .header span { color: #ffb531; }
      .content { padding: 30px; line-height: 1.6; }
      .otp-box { background: #08111d; border: 2px dashed #ffb531; border-radius: 12px; padding: 20px; text-align: center; margin: 25px 0; }
      .otp-code { font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #ffb531; margin: 5px 0; }
      .footer { background: #0b1624; padding: 16px; text-align: center; color: #bccadb; font-size: 13px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Blueprint Learning <span>Academy</span></h1>
        <p style="color: #7fb8ea; margin: 4px 0 0 0; font-size: 13px;">Security & Password Verification</p>
      </div>
      <div class="content">
        <h2 style="color: #f3f7fc; margin-top: 0;">Password Reset Request</h2>
        <p>Hello <strong>${name}</strong>,</p>
        <p>A request was received to reset/change the password for your administrator account.</p>
        <p>Please use the 6-digit verification code below to authorize this password change:</p>

        <div class="otp-box">
          <span style="color: #bccadb; font-size: 12px; text-transform: uppercase; font-weight: bold; letter-spacing: 1px;">Your One-Time Verification Code (OTP)</span>
          <div class="otp-code">${otp}</div>
          <span style="color: #7fb8ea; font-size: 11px;">Valid for 10 minutes only</span>
        </div>

        <p style="color: #bccadb; font-size: 13px;">
          ⚠️ If you did not make this request, please ignore this email or review your account security immediately. Never share this code with anyone.
        </p>
      </div>
      <div class="footer">
        © ${new Date().getFullYear()} Blueprint Learning Academy Security Portal.
      </div>
    </div>
  </body>
  </html>
  `;

  if (transporter) {
    try {
      await transporter.sendMail({
        from: emailFrom,
        to: email,
        subject: `Your Verification Code: ${otp} - Blueprint Learning Academy`,
        html: htmlContent,
      });
      return { success: true };
    } catch (err) {
      console.error('SMTP Mail Sending Error:', err.message);
      return { success: false, error: err.message };
    }
  } else {
    console.log('\n==========================================================');
    console.log(`🔐 [ADMIN PASSWORD RESET OTP DISPATCHED (LOGGED)]:`);
    console.log(`To: ${email} (${name})`);
    console.log(`OTP Code: ${otp}`);
    console.log(`Validity: 10 minutes`);
    console.log('==========================================================\n');
    return { success: true, simulated: true };
  }
};

module.exports = {
  sendEnrollmentApprovedEmail,
  sendAccountBlockedEmail,
  sendPasswordResetOtpEmail,
};
